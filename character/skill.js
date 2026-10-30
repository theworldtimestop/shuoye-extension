import { lib, game, ui, get, ai, _status } from "noname";

/** @type { importCharacterConfig['skill'] } */
const skills = {
    //怒涛沧岚
//#noname-kit-begin skill:shuoye_canghai
    shuoye_canghai: {
        enable: "phaseUse",
        usable: 1,
        filterCard: () => false,
        selectCard: -1,
        group: ["shuoye_canghai_draw", "shuoye_canghai_bonus"],
        filter(event, player) {
            const X = player.maxHp - player.hp;
            return X > 0 && player.countCards("h") >= X;
        },
        async content(event, trigger, player) {
            const X = player.maxHp - player.hp;
            if (X < 1) return;
            const dis = Math.min(X, player.countCards("h"));
            if (dis > 0) await player.chooseToDiscard("h", dis, true);
            const num = player.maxHp - player.hp;
            if (num > 0) await player.recover(num);
            await player.changeHujia(X);
            game.log(player, "获得了" + X + "点护甲");
        },
        ai: {
            order: 5,
            result: {
                player(player) {
                    const X = player.maxHp - player.hp;
                    if (X < 1 || player.countCards("h") < X) return 0;
                    return 1.5 + X;
                },
            },
        },
        subSkill: {
            draw: {
                trigger: {
                    player: "phaseDrawBegin2",
                },
                forced: true,
                charlotte: true,
                filter(event, player) {
                    return player.hujia > 0 && !event.numFixed;
                },
                async content(event, trigger, player) {
                    trigger.num += player.maxHp - player.hp + 1;
                },
            },
            bonus: {
                charlotte: true,
                mod: {
                    maxHandcard(player, num) {
                        if (player.hujia > 0) return num + (player.maxHp - player.hp) + 1;
                    },
                    cardUsable(card, player, num) {
                        if (card.name == "sha" && player.hujia > 0) return num + (player.maxHp - player.hp) + 1;
                    },
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_canghai
//#noname-kit-begin skill:shuoye_yongshi
    shuoye_yongshi: {
        trigger: {
            player: "useCard",
        },
        filter(event, player) {
            if (player.hp <= 1) return false;
            return !!(event.targets && event.targets.some(target => target != player));
        },
        check(event, player) {
            if (player.hp <= 2) return false;
            const targets = event.targets.filter(target => target != player);
            if (!targets.some(target => get.attitude(player, target) < 0)) return false;
            return get.tag(event.card, "damage") || ["shunshou", "guohe"].includes(event.card.name);
        },
        async content(event, trigger, player) {
            await player.loseHp(1);
            trigger.directHit.addArray(trigger.targets);
            game.log(trigger.card, "不可被响应");
        },
    },
//#noname-kit-end skill:shuoye_yongshi
//#noname-kit-begin skill:shuoye_qingtian
    shuoye_qingtian: {
        trigger: {
            source: "damageEnd",
        },
        filter(event, player) {
            return player.hujia > 0 && event.num > 0 && event.player.isIn();
        },
        check(event, player) {
            return get.attitude(player, event.player) < 0;
        },
        async content(event, trigger, player) {
            const target = trigger.player;
            player.line(target, "fire");
            await player.changeHujia(-1);
            if (target.isIn()) await target.loseHp(1);
        },
    },
//#noname-kit-end skill:shuoye_qingtian
    //霍光
//#noname-kit-begin skill:shuoyekuangren
    shuoyekuangren: {
        trigger: {
            source: "die",
        },
        forced: true,
        locked: false,
        filter(event, player) {
            const evt = event.getParent(2);
            if (evt.name != "damage") return false;
            return event.player != player && evt.num > 0;
        },
        async content(event, trigger, player) {
            const evt = trigger.getParent(2);
            player.addSkill("shuoyekuangren_effect");
            player.setMark("shuoyekuangren_effect", evt.num, false);
        },
        subSkill: {
            effect: {
                trigger: {
                    player: "useCard",
                },
                forced: true,
                charlotte: true,
                onremove: true,
                filter(event, player) {
                    return event.targets?.length && event.targets.some(target => target != player);
                },
                async content(event, trigger, player) {
                    const targets = trigger.targets.some(target => target != player);
                    const num = player.countMark(event.name);
                    player.removeSkill(event.name);
                    for (const target of targets) {
                        if (!target.hasCards("he")) {
                            continue;
                        }
                        const result = await player
                            .choosePlayerCard(target, `选择将其中至多${num}张置于牌堆顶`, "he", [1, Math.min(target.countCards("he"), num)], true, "visible", "allowChooseAll")
                            .set("ai", button => {
                                const val = get.value(button.link);
                                if (button.link == _status.event.target.getEquip(2)) {
                                  return 2 * (val + 3);
                                }
                                return val;
                            })
                            .forResult();
                        if (result?.cards?.length) {
                            await target.lose(result.cards, ui.cardPile, "insert");
                            await target.draw(result.cards.length, "bottom");
                        }
                    }
                },
                mark: true,
                intro: {
                    content: "你下一次对其他角色使用牌前观看目标手牌，将其中至多#张置于牌堆顶，令其从牌堆底获得等量牌。",
                },
            },
        },
    },
//#noname-kit-end skill:shuoyekuangren
//#noname-kit-begin skill:shuoyejitao
    shuoyejitao: {
        mod: {
            cardname(card, player, name) {
                const vcard = get.autoViewAs({ name: card.name });
                if (get.is.damageCard(vcard)) {
                    return "binglinchengxiax";
                }
            },
            cardnature(card, player) {
                const vcard = get.autoViewAs({ name: card.name });
                if (get.is.damageCard(vcard)) {
                    return false;
                }
              },
        },
        trigger: {
            player: "useCardAfter",
        },
        forced: true,
        filter(event, player) {
            return get.is.damageCard(event.card) && event.card.name == "binglinchengxiax";
        },
        async content(event, trigger, player) {
            const cards = player.getCards("he", card => {
                return player.canRecast(card);
            });
            if (!cards.length) {
                return;
            }
            const list = player.getCards("h").reduce((list, card) => list.add(get.type2(card, player)), []);
            const result = await player
                .chooseCard(`你发动了${get.translation(event.name)}：选择重铸至少1张牌`, "he", [1, Infinity], true, card => {
                    return _status.event.cards.includes(card);
                })
                .set("cards", cards)
                .set("ai", card => {
                    return 7 - get.value(card);
                })
                .forResult();
            if (result?.cards?.length) {
                await player.recast(result.cards);
                const types = player.getCards("h").reduce((list, card) => list.add(get.type2(card, player)), []);
                if (list.length == types.length) {
                    player.addSkill("shuoyejitao_effect");
                } else {
                    player.addTempSkill("shuoyejitao_debuff");
                }
            }
        },
        subSkill: {
            effect: {
                trigger: {
                    player: "useCard",
                },
                forced: true,
                charlotte: true,
                onremove: true,
                filter(event, player) {
                    return get.is.damageCard(event.card);
                },
                async content(event, trigger, player) {
                    player.removeSkill(event.name);
                    trigger.baseDamage++;
                    player
                        .when("useCardAfter")
                        .filter(evt => evt == trigger)
                        .then(async (event, trigger, player) => {
                            const targets = trigger.targets.filter(target => {
                                return target.countGainableCards(player, "he");
                            });
                            if (targets.length) {
                                await player.gainMultiple(targets, "he");
                            }
                        });
                },
                mark: true,
                intro: {
                    content: "下一张伤害牌造成的伤害+1且于结算后获得目标一张牌",
                },
            },
            debuff: {
                mod: {
                    cardEnabled(card, player) {
                        if (get.is.damageCard(card)) {
                            return false;
                        }
                    }
                },
                charlotte: true,
                mark: true,
                intro: {
                    content: "本回合无法使用伤害牌",
                },
            },
        },
    },
//#noname-kit-end skill:shuoyejitao
    //武心蝉
//#noname-kit-begin skill:shuoyecangyin
    shuoyecangyin: {
        derivation: ["shuoyelonglin", "shouyelongxiao"],
        trigger: {
            global: "roundStart",
        },
        forced: true,
        locked: false,
        async content(event, trigger, player) {
            if (!player.hasSkill("shuoyelonglin")) {
                await player.addSkills("shuoyelonglin");
            }
            const cards = player.getExpansions("shuoyecangyin");
            if (cards.length >= 3) {
                return;
            }
            for (const type of ["basic", "trick", "equip"]) {
                const card = get.cardPile2(card => get.type2(card) == type);
                if (card) {
                    const next = player.addToExpansion([card]);
                    next.gaintag.add("shuoyecangyin");
                    await next;
                }
            }
        },
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
        onremove(player, skill) {
          const cards2 = player.getExpansions(skill);
          if (cards2.length) {
            player.loseToDiscardpile(cards2);
          }
        },
        group: "shuoyecangyin_use",
        subSkill: {
            use: {
                trigger: {
                    player: "loseAfter",
                    global: ["equipAfter","addJudgeAfter","gainAfter","loseAsyncAfter","addToExpansionAfter"],
                },
                forced: true,
                locked: false,
                filter(event, player) {
                    if (player.countExpansions("shuoyecangyin")) {
                        return false;
                    }
                    if (!event.xs || !event.xs.length) {
                        return false;
                    }
                    for (const i in event.gaintag_map) {
                        if (event.gaintag_map[i].includes("shuoyecangyin")) {
                            return true;
                        }
                        return false;
                    }
                },
                async content(event, trigger, player) {
                    const result = await player
                        .chooseTarget(`选择对一名角色发动${get.poptip("shouyelongxiao")}`, true)
                        .set("ai", target => {
                            const player = get.player();
                            return get.attitude(player, target);
                        })
                        .forResult();
                    if (result?.targets?.length) {
                        await player.useSkill("shouyelongxiao", result.targets);
                    }
                    player.removeSkill(event.name);
                },
            },
        },
    },
//#noname-kit-end skill:shuoyecangyin
//#noname-kit-begin skill:shuoyelonglin
    shuoyelonglin: {
        group: ["shuoyelonglin_basic", "shuoyelonglin_trick", "shuoyelonglin_equip"],
        subSkill: {
            basic: {
                trigger: {
                    source: "damageBegin1",
                    player: "damageBegin3",
                },
                forced: true,
                locked: false,
                filter(event, player) {
                    if (!player.getExpansions("shuoyecangyin").some(card => get.type2(card) == "basic")) {
                        return false;
                    }
                    return event.card && get.type(event.card) == "basic";
                },
                async content(event, trigger, player) {
                    const num = (event.triggername == "damageBegin1" ? 1 : -1);
                    trigger.num += num;
                    const cards = player.getExpansions("shuoyecangyin").filter(card => get.type2(card) == "basic");
                    if (cards.length) {
                        await player.gain(cards, "gain2");
                    }
                },
            },
            trick: {
                trigger: {
                    player: ["loseAfter","gainAfter"],
                    global: ["equipAfter","addJudgeAfter","gainAfter","loseAsyncAfter","addToExpansionAfter"],
                },
                forced: true,
                locked: false,
                filter(event, player) {
                    if (!player.getExpansions("shuoyecangyin").some(card => get.type2(card) == "trick")) {
                        return false;
                    }
                    let num = event.getl?.(player).cards2.length;
                    if (event.getg) {
                        num = Math.max(num, event.getg?.(player).length);
                    }
                    if (num <= 0) {
                        return false;
                    }
                    const levs = [1, 2, 3, 4];
                    let index = 0;
                    for (const lev of levs) {
                        const parent = event.getParent(lev);
                        if (parent && parent.name === "useCard") {
                            index = lev - 1;
                            break;
                        }
                    }
                    if (index < 1) {
                        return false;
                    }
                    const evtx = event.getParent(index);
                    return !!(evtx && evtx.name && lib.card[evtx.name] && get.type(evtx.name) == "trick");
                },
                async content(event, trigger, player) {
                    await player.draw();
                    const cards = player.getExpansions("shuoyecangyin").filter(card => get.type2(card) == "trick");
                    if (cards.length) {
                        await player.gain(cards, "gain2");
                    }
                },
            },
            equip: {
                trigger: {
                    player: "useCard",
                },
                forced: true,
                locked: false,
                filter(event, player) {
                    if (!player.getExpansions("shuoyecangyin").some(card => get.type2(card) == "equip")) {
                        return false;
                    }
                    return get.type(event.card) == "equip" && game.hasPlayer(target => {
                        if (!target.isDisabledJudge()) {
                            return true;
                        }
                        return target.hasEnabledSlot();
                    });
                },
                async content(event, trigger, player) {
                    const result = await player
                        .chooseTarget(`你发动了${get.translation(event.name)}：选择废除一名角色一个装备栏或判定区`, true, (card, player, target) => {
                            if (!target.isDisabledJudge()) {
                                return true;
                            }
                            return target.hasEnabledSlot();
                        })
                        .set("ai", target => -get.attitude(player, target))
                        .forResult();
                    if (result?.targets?.length) {
                        const [target] = result.targets;
                        const list = [];
                        for (let i = 1; i < 6; i++) {
                          if (player.hasEnabledSlot(i)) {
                            list.push("equip" + i);
                          }
                        }
                        if (!target.isDisabledJudge()) {
                            list.push("判定区");
                        }
                        if (list.length) {
                            if (list.length == 1) {
                                event.result = { control: list[0] };
                            } else {
                                event.result = await player
                                    .chooseControl(list)
                                    .set("prompt", `选择废除${get.translation(target)}的一个装备栏或判定区`)
                                    .set("ai", () => {
                                        const controls = _status.event.controls.slice();
                                        if (controls.includes("判定区")) {
                                            return "判定区";
                                        }
                                        return controls.find(control => control.startsWith("equip")) || controls[0];
                                    })
                                    .forResult();
                            }
                            if (event.result.control == "判定区") {
                                if (!target.isDisabledJudge()) {
                                    target.disableJudge();
                                }
                            } else {
                                await target.disableEquip(event.result.control);
                            }
                        }
                    }
                    const cards = player.getExpansions("shuoyecangyin").filter(card => get.type2(card) == "equip");
                    if (cards.length) {
                        await player.gain(cards, "gain2");
                    }
                },
            },
        },
    },
//#noname-kit-end skill:shuoyelonglin
//#noname-kit-begin skill:shouyelongxiao
    shouyelongxiao: {
        enable: "phaseUse",
        filterTarget: true,
        async content(event, trigger, player) {
            const target = event.target;
            const list = Array.from({ length: 5 }).map((_, i) => `equip${i + 1}`).filter((i) => target.hasDisabledSlot(i));
            await target.enableEquip(list);
            await target.enableJudge();
            await target.useSkill("shuoyecangyin");
            target.addTempSkill("shouyelongxiao_effect", { player: "die" });
            target
                .when("phaseBegin")
                .then(() => {
                    player.when("phaseEnd").then(() => {
                        player.removeSkill("shouyelongxiao_effect");
                    })
                });
        },
        ai: {
            order: 10,
            result: {
                target(player, target) {
                    return 2;
                },
            },
        },
        subSkill: {
            effect: {
                trigger: {
                    player: ["useCardAfter", "loseAfter"],
                    global: ["equipAfter","addJudgeAfter","gainAfter","loseAsyncAfter","addToExpansionAfter"],
                },
                forced: true,
                charlotte: true,
                filter(event, player) {
                    if (event.name == "useCard") {
                        if (!player.countExpansions("shuoyecangyin")) {
                            return false;
                        }
                        if (!player.getExpansions("shuoyecangyin").some(card => ["basic", "trick"].includes(get.type(card)))) {
                            return false;
                        }
                        return player.hasHistory("lose", function (evt) {
                            return evt.hs?.length && evt.getParent() == event;
                        });
                    }
                    if (!event.xs || !event.xs.length) {
                        return false;
                    }
                    for (const i in event.gaintag_map) {
                        if (event.gaintag_map[i].includes("shuoyecangyin")) {
                            return true;
                        }
                        return false;
                    }
                },
                async content(event, trigger, player) {
                    const cards = player.getExpansions("shuoyecangyin");
                    if (trigger.name == "useCard") {
                        const result = await player
                            .chooseButton([`${get.translation(event.name)}：选择视为使用一张【鳞】（仅限基本牌和锦囊牌）`, cards], true)
                            .set("filterButton", button => {
                                return ["basic", "trick"].includes(get.type(button.link));
                            })
                            .set("ai", button => {
                                const card = new lib.element.VCard({ name: button.link.name, nature: button.link.nature });
                                return get.player().getUseValue(button.link);
                            })
                            .forResult();
                        if (result.bool && result?.links?.length) {
                            const card = new lib.element.VCard({ name: result.links[0].name, nature: result.links[0].nature });
                            if (player.hasUseTarget(card, true, false)) {
                                await player.chooseUseTarget(card, true);
                            }
                        }
                    } else {
                        const list = cards.reduce((list, card) => list.add(get.type2(card)), []);
                        const types = ["basic", "trick", "equip"].removeArray(list);
                        for (const type of types) {
                            const card = get.cardPile2(card => get.type2(card) == type);
                            if (card) {
                                const next = player.addToExpansion([card], "draw");
                                next.gaintag.add("shuoyecangyin");
                                await next;
                            }
                        }
                    }
                },
            },
        },
    },
//#noname-kit-end skill:shouyelongxiao
    //卫岳
//#noname-kit-begin skill:shuoyexiaoxiang
    shuoyexiaoxiang: {
        trigger: {
            global: ["useCard", "phaseEnd"],
        },
        forced: true,
        locked: false,
        filter(event, player) {
            if (event.name == "phase") {
                return !event.player.hasHistory("useCard");
            }
            if (_status.currentPhase != event.player) {
                return false;
            }
            // 其他人只算首次使用，卫岳自己改算前两次
            const limit = event.player === player ? 2 : 1;
            return event.player.getHistory("useCard", evt => !evt.shuoyexiaoxiang_check).indexOf(event) < limit;
        },
        async content(event, trigger, player) {
            if (trigger.name == "phase") {
                await player.changeHujia(1, null, true);
                await player.draw();
                return;
            }
            if (get.is.damageCard(trigger.card)) {
                await player.changeHujia(1, null, true);
            } else {
                await player.draw();
            }
            const num = player.hujia - 1;
            if (!(num > 0 && num < 5)) {
                return;
            }
            const list = [
                "①不计入次数",
                "②卫岳增加/减少一点护甲重置此技能",
                "③额外结算X次",
                "④免疫下一次伤害",
            ];
            const { bool } = await player
                .chooseBool(`你可以令${get.translation(trigger.player)}使用的${get.translation(trigger.card)}执行${list[num - 1]}`)
                .set("ai", () => {
                    return _status.event.goon;
                })
                .set(
                    "goon",
                    (() => {
                        const att = get.attitude(player, trigger.player);
                        return att > 0;
                    })()
                )
                .forResult();
            if (bool) {
                switch (num) {
                    case 1: {
                      if (trigger.addCount !== false) {
                        trigger.addCount = false;
                        const stat = player.getStat().card;
                        const name = trigger.card.name;
                        if (typeof stat[name] == "number") {
                          stat[name]--;
                        }
                        game.log(trigger.card, "不计入次数限制");
                      }
                    }
                    break;
                    case 2: {
                        const result = await player
                            .chooseControl("增加", "减少")
                            .set("prompt", `你发动${get.translation(event.name)}：选择增加或减少1点护甲`)
                            .set("ai", () => {
                                const player = get.player();
                                if (_status.currentPhase == player && player.hasSha()) {
                                    return 1;
                                }
                                return 0;
                            })
                            .forResult();
                        await player.changeHujia(result.index == 0 ? 1 : -1);
                        const historys = trigger.player.getHistory("useCard");
                        for (const history of historys) {
                            history[`${event.name}_check`] = true;
                        }
                    }
                    break;
                    case 3: {
                        if (lib.skill.dcshixian.filterx(trigger)) {
                            trigger.effectCount += num;
                            game.log(trigger.card, "额外结算", get.cnNumber(num), "次");
                        }
                    }
                    break;
                    case 4: {
                        trigger.player.addSkill("shuoyexiaoxiang_effect");
                    }
                    break;
                }
            }
        },
        subSkill: {
            effect: {
                trigger: {
                    player: "damageBegin4",
                },
                forced: true,
                charlotte: true,
                onremove: true,
                async content(event, trigger, player) {
                    player.removeSkill(event.name);
                    trigger.cancel();
                },
                mark: true,
                intro: {
                    content: "免疫下一次受到的伤害",
                },
            },
        },
    },
//#noname-kit-end skill:shuoyexiaoxiang
    //无极圣武
//#noname-kit-begin skill:shuoyeyingyao
    shuoyeyingyao: {
        mod: {
            cardUsable(card, player, num) {
                if (card.name == "sha") {
                    return num + Math.floor(player.countMark("shuoyeyingyao") / 3);
                }
            },
        },
        trigger: {
            player: ["phaseDrawBegin2"],
        },
        forced: true,
        filter(event, player) {
            return player.hasMark("shuoyeyingyao") && !event.numFixed;
        },
        async content(event, trigger, player) {
            trigger.num += Math.floor(player.countMark("shuoyeyingyao") / 3);
        },
        onremove(player, skill) {
            delete player.storage[skill];
            player.removeTip(skill);
        },
        group: "shuoyeyingyao_init",
        subSkill: {
            init: {
                trigger: {
                    global: "phaseBefore",
                    player: "enterGame",
                },
                forced: true,
                filter(event, player) {
                    return event.name != "phase" || game.phaseNumber == 0;
                },
                async content(event, trigger, player) {
                    let hs = 0, maxHp = 0, hp = 0;
                    let number = player.countCards("h") + player.maxHp + player.getHp(true);
                    const list = Array.from({ length: number + 1 }, (_, index) => index.toString());
                    const result = await player
                        .chooseControl(list)
                        .set("prompt", `${get.translation(event.name)}：请选择为你的手牌数分配一个数值`)
                        .set("ai", () => {
                            return 0;
                        })
                        .forResult();
                    hs = result.index;
                    const num = result.index;
                    number -= num;
                    game.log(player, "给", "#g手牌", "重新分配的数值是", "#y" + num);
                    if (number > 0) {
                        const list = Array.from({ length: number + 1 }, (_, index) => index.toString());
                        const result2 = await player
                            .chooseControl(list)
                            .set("prompt", `${get.translation(event.name)}：请选择为你的体力上限分配一个数值`)
                            .set("ai", () => {
                                const player = get.player();
                                const total = player.countCards("h") + player.maxHp + player.getHp(true);
                                const safe = Math.max(3, Math.ceil(total / 4));
                                const remaining = get.event().controls.length - 1;
                                return Math.max(0, remaining - safe);
                            })
                            .forResult();
                        const num = result2.index;
                        maxHp = num;
                        number -= num;
                        game.log(player, "给", "#g体力上限", "重新分配的数值是", "#y" + num);
                    } else {
                        maxHp = 0;
                        number -= maxHp;
                        game.log(player, "给", "#g体力上限", "重新分配的数值是", "#y" + num);
                    }
                    hp = number;
                    game.log(player, "给", "#g体力值", "重新分配的数值是", "#y" + number);
                    const max = Math.max(hs, maxHp, hp), min = Math.min(hs, maxHp, hp);
                    const delt = max - min;
                    const skill = "shuoyeyingyao";
                    player.setMark(skill, delt, false);
                    player.addTip(skill, get.translation(skill) + " " + delt);
                    if (player.countCards("h") < hs) {
                        await player.drawTo(hs).set("_triggered", null);
                    } else {
                        await player.chooseToDiscard("h", player.countCards("h") - hs, true).set("_triggered", null);
                    }
                    if (player.maxHp != maxHp) {
                        const num = player.maxHp - maxHp;
                        const next = player[num > 0 ? "loseMaxHp" : "gainMaxHp"](Math.abs(num));
                        next._triggered = null;
                        await next;
                    }
                    if (player.hp != hp) {
                        const num = Math.min(player.maxHp, hp);
                        const next = player.changeHp(hp - player.hp);
                        next._triggered = null;
                        await next;
                        if (player.hp <= 0) {
                            await player.dying();
                        }
                    }
                },
            },
        },
    },
//#noname-kit-end skill:shuoyeyingyao
//#noname-kit-begin skill:shuoyewuzhu
    shuoyewuzhu: {
        trigger: {
            global: ["damageBegin1", "damageBegin3"],
        },
        forced: true,
        locked: false,
        filter(event, player, name) {
            const source = event.source;
            const target = event[name == "damageBegin1" ? "source" : "player"];
            if (get.itemtype(target) != "player") {
                return false;
            }
            if (name == "damageBegin1") {
                if (event.player != player || get.itemtype(source) != "player") {
                    return false;
                }
                if (target.maxHp >= player.maxHp) {
                    return false;
                }
                return game.getRoundHistory("everything", (evt) => evt.name == "damage" && evt.source == source && evt.player == player).indexOf(event) == 0;
            }
            if (target.hp <= player.hp) {
                return false;
            }
            return game.getRoundHistory("everything", (evt) => evt.name == "damage" && evt.source == player && evt.player == event.player).indexOf(event) == 0;
        },
        logTarget(event, player, name) {
            return event[name == "damageBegin1" ? "source" : "player"];
        },
        async content(event, trigger, player) {
            const num = (event.triggername == "damageBegin1" ? -1 : 1);
            trigger.num += num;
            game.log(trigger.player, "受到的伤害", "#y" + (num > 0 ? "+" : "") + num);
        },
    },
//#noname-kit-end skill:shuoyewuzhu
//#noname-kit-begin skill:shuoyeweiqie
    shuoyeweiqie: {
        trigger: {
            player: "useCardAfter",
        },
        popup: false,
        locked: true,
        filter(event, player) {
            return player.hasHistory("useCard", evt => {
                if (evt.card != event.card) {
                    return false;
                }
                if (evt.all_excluded || evt._cancelled) {
                    return true;
                }
                if (evt.card.name == "sha") {
                    return game.hasGlobalHistory("everything", evtx => {
                        return evtx.name == "sha" && evtx.getParent() == evt && (!evtx?.result?.bool || evtx?.result?.result == "shaned");
                    });
                }
                if (get.type(evt.card) != "trick") {
                    return false;
                }
                return game.hasGlobalHistory("everything", evtx => {
                    return evtx.name == "_wuxie" && evtx.getParent(4) == evt && (evtx?.getParent(3)?._neutralized);
                });
            });
        },
        async cost(event, trigger, player) {
            event.result = await player
                .chooseTarget(get.prompt2(event.skill), lib.filter.notMe)
                .set("ai", target => {
                    const player = get.player();
                    const att = get.attitude(player, target);
                    const skills = target.getSkills(null, false, false).filter(function (i) {
                        var info = get.info(i);
                        if (target.getStorage("shuoyeweiqie_fengyin").includes(i)) {
                            return false;
                        }
                        return info && !info.charlotte && lib.translate[i + "_info"];
                    });
                    return -att;
                })
                .forResult();
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            player.logSkill(event.name, target);
            const skills = target.getSkills(null, false, false).filter(function (i) {
                var info = get.info(i);
                if (target.getStorage("shuoyeweiqie_fengyin").includes(i)) {
                    return false;
                }
                return info && !info.charlotte && lib.translate[i + "_info"];
            });
            if (skills.length) {
                const list = skills.map(skill => [skill, "【" + get.translation(skill) + "】：" + lib.translate[skill + "_info"]]);
                const { bool, links } = await player
                    .chooseButton([`###${get.translation(event.name)}###令${get.translation(target)}的一个技能失效`, [list, "textbutton"]], true)
                    .set("ai", button => {
                        return 1 + Math.random();
                    })
                    .forResult();
                if (bool) {
                    target.addTempSkill("shuoyeweiqie_fengyin");
                    target.markAuto("shuoyeweiqie_fengyin", links);
                }
            }
        },
        subSkill: {
            fengyin: {
                init(player, skill) {
                    player.addSkillBlocker(skill);
                },
                onremove(player, skill) {
                    player.removeSkillBlocker(skill);
                    delete player.storage[skill];
                },
                charlotte: true,
                locked: true,
                skillBlocker(skill, player) {
                    return skill != "shuoyeweiqie_fengyin" && !lib.skill[skill].charlotte && !lib.skill[skill].persevereSkill && player.getStorage("shuoyeweiqie_fengyin").includes(skill);
                },
                mark: true,
                intro: {
                    markcount: () => 0,
                    content(storage, player, skill) {
                        if (storage.length) {
                            return "失效技能：" + get.translation(storage);
                        }
                        return "无失效技能";
                    },
                },
            },
        },
    },
//#noname-kit-end skill:shuoyeweiqie
//#noname-kit-begin skill:shuoyetuoshi
    shuoyetuoshi: {
        persevereSkill: true,
        enable: "phaseUse",
        trigger: {
            target: "useCardToTargeted",
        },
        popup: false,
        filter(event, player) {
            return !player.hasSkill("shuoyetuoshi_used");
        },
        filterTarget: true,
        log: false,
        async cost(event, trigger, player) {
            event.result = await player
                .chooseTarget(get.prompt2(event.skill))
                .set("ai", function (target) {
                    const player = get.player();
                    const att = get.attitude(player, target);
                    if (att > 0) {
                        return 0;
                    }
                    return Math.min(-att, get.effect(target, { name: "juedou" }, player) * (target.hasSkill("shuoyeweiqie_fengyin") ? 2 : 1));
                })
                .forResult();
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            player.logSkill(event.name, target);
            player.addTempSkill("shuoyetuoshi_used", "roundStart");
            const next = game.createEvent("juedou");
            next.player = player;
            next.skill = event.name;
            next.target = target;
            next.setContent(lib.card.juedou.content);
            player.addTempSkill("shuoyetuoshi_buff");
            target.addTempSkill("shuoyetuoshi_allsha");
            if (target.hasSkill("shuoyeweiqie_fengyin")) {
                next.directHit = true;
                game.log(target, "不可响应", "#g【决斗】");
            }
            await next;
        },
        subSkill: {
            used: {
                charlotte: true,
            },
            allsha: {
                charlotte: true,
                mod: {
                    cardname(card, player, name) {
                        return "sha";
                      },
                },
            },
            buff: {
                trigger: {
                    global: ["damageBefore", "damageBegin3", "damageBegin4"],
                },
                silent: true,
                charlotte: true,
                filter(event, player, name) {
                    const evt = event.getParent(2);
                    if (!(evt?.name == "shuoyetuoshi" && evt.player == player)) {
                        return false;
                    }
                    if (name == "damageBegin3") {
                        return event.player.hasSkill("shuoyeweiqie_fengyin");
                    }
                    if (name == "damageBegin4") {
                        return event.player == player
                    }
                    return true;
                },
                async content(event, trigger, player) {
                    switch (event.triggername) {
                        case "damageBefore": {
                            delete trigger.source;
                        }
                        break;
                        case "damageBegin3": {
                            trigger.num += player.countMark("shuoyeyingyao");
                        }
                        break;
                        case "damageBegin4": {
                            trigger.cancel();
                        }
                        break;
                    }
                },
            },
        },
    },
//#noname-kit-end skill:shuoyetuoshi
    //镇世·乔特鲁德
//#noname-kit-begin skill:shuoyejinxuan
    shuoyejinxuan: {
        getList: ["shuoye_jinzuzhilong", "shuoye_xuanyuanzhilong"],
        init(player, skill) {
            game.broadcastAll(
                list => {
                    for (const name of list) {
                        if (!lib.character[name]) {
                            lib.character[name] = get.convertedCharacter(["", "", 0, [], [`ext:朔夜/image/character/${name}.jpg`, "unseen"]]);
                        }
                    }
                },
                lib.skill[skill].getList
            );
        },
        mod: {
            cardUsable(card, player, num) {
                if (card.name == "sha") {
                    return num + player.getStorage("shuoyejinxuan").length;
                }
            },
        },
        trigger: {
            player: "phaseDrawBegin2",
            source: "damageBegin1",
        },
        forced: true,
        locked: false,
        filter(event, player) {
            if (!player.getStorage("shuoyejinxuan").length) {
                return false;
            }
            return event.name == "damage" || !event.numFixed;
        },
        async content(event, trigger, player) {
            trigger.num += player.getStorage("shuoyejinxuan").length;
        },
        marktext: "龍",
        intro: {
            mark(dialog, storage, player) {
                if (!storage || !storage.length) return "当前没有副将";
                dialog.addSmall([storage, "character"]);
            },
        },
        addVisitors(characters, player) {
            game.log(player, "将", "#y" + get.translation(characters), "作为", "#g副将", "置于武将牌上");
            game.broadcastAll(
                function (player, characters) {
                    player.$draw(
                        characters.map(function (name) {
                            var cardname = "huashen_card_" + name;
                            lib.card[cardname] = {
                                fullimage: true,
                                image: "character:" + name,
                            };
                            lib.translate[cardname] = get.rawName2(name);
                            return game.createCard(cardname, " ", " ");
                        }),
                        "nobroadcast"
                    );
                },
                player,
                characters
            );
            player.markAuto("shuoyejinxuan", characters);
        },
        removeVisitors(characters, player) {
            if (!player || !characters) return;
            try {
                const characters2 = (player.getStorage("shuoyejinxuan") || []).slice(0);
                characters2.removeArray(characters);
            } catch (e) {}
            game.broadcastAll((p, cs) => {
                // 部分引擎版本没有 tempname，缺失时直接跳过
                if (p && Array.isArray(p.tempname)) p.tempname.removeArray(cs);
            }, player, characters);
            try {
                player.unmarkAuto("shuoyejinxuan", characters);
            } catch (e) {}
            const next = game.createEvent("shuoyejinxuanRemoveVisitors");
            next.player = player;
            next.setContent("emptyEvent");
        },
        onremove(player, skill) {
            lib.skill.shuoyejinxuan.removeVisitors(player.getStorage("shuoyejinxuan"), player);
        },
        group: ["shuoyejinxuan_init", "shuoyejinxuan_dying", "shuoyejinxuan_die", "shuoyejinxuan_remove"],
        subSkill: {
            init: {
                trigger: {
                    global: "phaseBefore",
                    player: "enterGame",
                },
                forced: true,
                filter(event, player) {
                    return (event.name != "phase" || game.phaseNumber == 0);
                },
                async content(event, trigger, player) {
                     const list = lib.skill.shuoyejinxuan.getList.slice();
                     lib.skill.shuoyejinxuan.addVisitors(list, player);
                },
            },
            dying: {
                trigger: {
                    player: "dying",
                },
                filter(event, player, name) {
                    return player.getStorage("shuoyejinxuan").length;
                },
                async cost(event, trigger, player) {
                    const visitors = player.getStorage("shuoyejinxuan");
                    const { bool, links } = await player.chooseButton(["###金玄###你可消耗一张副将回复体力至两点", [visitors, "character"]])
                        .set("ai", button => {
                            return 1 + Math.random();
                        })
                        .forResult();
                    if (bool) event.result = { bool, cost_data: { links } };
                },
                async content(event, trigger, player) {
                    const list = event.cost_data.links;
                    lib.skill.shuoyejinxuan.removeVisitors(list, player);
                    game.log(player, "移去了", "#y" + get.translation(list));
                    await player.recoverTo(2);
                },
            },
            die: {
                trigger: {
                    source: "damageSource",
                    global: "loseHpAfter",
                },
                filter(event, player) {
                    if (event.name == "loseHp") {
                        if (event.source != player) {
                            return false;
                        }
                    }
                    return event.player?.isIn() && player.getStorage("shuoyejinxuan").length && event.player.getHp() <= 2;
                },
                async cost(event, trigger, player) {
                    const visitors = player.getStorage("shuoyejinxuan");
                    const { bool, links } = await player.chooseButton([`###金玄###你可消耗一张副将令${get.translation(trigger.player)}体力上限-2`, [visitors, "character"]])
                        .set("ai", button => {
                            const player = get.player();
                            const trigger = _status.event.getTrigger();
                            const att = get.attitude(player, trigger.player);
                            if (att > 0) {
                                return 0;
                            }
                            return 1 + Math.random();
                        })
                        .forResult();
                    if (bool) event.result = { bool, cost_data: { links } };
                },
                async content(event, trigger, player) {
                    const list = event.cost_data.links;
                    lib.skill.shuoyejinxuan.removeVisitors(list, player);
                    game.log(player, "移去了", "#y" + get.translation(list));
                    await trigger.player.loseMaxHp(2);
                },
            },
            remove: {
                trigger: {
                    player: "shuoyejinxuanRemoveVisitors",
                },
                forced: true,
                locked: false,
                async content(event, trigger, player) {
                    await player.gainMaxHp(2);
                },
            },
        },
    },
//#noname-kit-end skill:shuoyejinxuan
//#noname-kit-begin skill:shuoyekuangyan
    shuoyekuangyan: {
        enable: "phaseUse",
        limited: true,
        async content(event, trigger, player) {
            if (lib.skill[event.name]?.limited) {
                player.awakenSkill(event.name);
            }
            const hujia = player.hujia;
            await player.changeHujia(-hujia);
            const recover = player.getDamagedHp();
            await player.recoverTo(player.maxHp);
            const draw = player.maxHp - player.countCards("h");
            if (draw >= 0) {
                await player.drawTo(player.maxHp);
            } else {
                await player.chooseToDiscard(-draw, true);
            }
            const num = hujia + recover;
            const result = await player
                .chooseTarget(`${get.translation(player)}发动${get.translation(event.name)}：选择令一名角色失去${num}点体力，弃置${draw}张牌。`, true)
                .set("ai", target => {
                    const { num, draw } = get.event();
                    const player = get.player();
                    const att = get.attitude(player, target);
                    if (att > 0) {
                        return 0;
                    }
                    return get.effect(target, { name: "losehp" }, player, player) * num + get.effect(target, { name: "guohe_copy2" }, player, player) * draw;
                })
                .set("num", num)
                .set("draw", draw)
                .forResult();
            if (result?.targets?.length) {
                const target = result.targets[0];
                await target.loseHp(num).set("source", player);
                if (draw > 0) {
                    await target.chooseToDiscard("he", draw, true);
                }
            }
            player.addSkill("shuoyekuangyan_effect");
            player.addMark("shuoyekuangyan_effect", 1, false);
        },
        ai: {
            order(item, player) {
                return Math.max(get.order({ name: "tao" }), get.order({ name: "jiu" })) + 0.2;
              },
            result: {
                player(player) {
                    if (player.hujia && player.isHealthy() && player.maxHp > 3) {
                        return 0;
                    }
                    return player.hujia + player.getDamagedHp() - Math.floor(player.maxHp / 2);
                },
            },
        },
        subSkill: {
            effect: {
                trigger: {
                    player: "damageBegin4",
                },
                forced: true,
                charlotte: true,
                onremove: true,
                async content(event, trigger, player) {
                    player.removeMark(event.name, 1, false);
                    if (!player.hasMark(event.name)) {
                        player.removeSkill(event.name);
                    }
                    trigger.cancel();
                    if (trigger.source?.isIn()) {
                        await trigger.source.damage(trigger.num);
                    }
                },
                mark: true,
                intro: {
                    content: "你下#次受到伤害时免疫之，并对来源造成原先你受到的伤害。",
                },
            },
        },
    },
//#noname-kit-end skill:shuoyekuangyan
//#noname-kit-begin skill:shuoyehuanghe
    shuoyehuanghe: {
        trigger: {
            source: "damageSource",
            player: "damageEnd",
        },
        forced: true,
        filter(event, player, name) {
            const target = lib.skill.shuoyehuanghe.logTarget(event, player);
            if (get.itemtype(target) != "player") {
                return false;
            }
            if (name == "damageSource") {
                return player.getRoundHistory("sourceDamage").indexOf(event) == 0;
            }
            return game.getRoundHistory(
                "everything",
                (evt) => {
                  return evt.name == "damage" && evt.player == player;
                },
                event
              ).indexOf(event) == 0;
        },
        logTarget(event, player) {
            return event[event.source == player ? "player" : "source"]
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            await target.loseHp().set("source", player);
            await player[player.isHealthy() ? "changeHujia" : "recover"]();
        },
        group: "shuoyehuanghe_die",
        subSkill: {
            die: {
                trigger: {
                    global: "dieBefore",
                    source: "dieAfter",
                },
                forced: true,
                filter(event, player, name) {
                    if (name == "dieBefore") {
                        const evt = event.getParent(2);
                        return !event.source && evt.source && evt.source == player;
                    }
                    return true;
                },
                async content(event, trigger, player) {
                    if (event.triggername == "dieBefore") {
                        trigger.source = player;
                    } else {
                        await player.gainMaxHp();
                        player.restoreSkill("shuoyekuangyan");
                    }
                },
            },
        },
    },
//#noname-kit-end skill:shuoyehuanghe
    //妙时天女
//#noname-kit-begin skill:shuoyefushi
    shuoyefushi: {
        trigger: {
            global: "roundStart",
        },
        locked: true,
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget({
                prompt: `你发动【${get.translation(event.skill)}】`,
                prompt2: "选择获得场上其他角色的一个技能。然后若以此法获得技能数不小于三，需再选择失去一个获得的技能",
                forced: true,
                filterTarget(card, player2, target) {
                    if (target === player2) return false;
                    return target.getSkills(null, false, false).filter((skill) => {
                        if (player2.hasSkill(skill)) return false;
                        const info = get.info(skill);
                        return info && !info.charlotte;
                    }).length > 0;
                },
                ai(target) {
                    const { player: player2, filterTarget } = get.event();
                    const targets = game.filterPlayer((target2) => filterTarget(null, player2, target2));
                    return Math.max(
                        ...targets.map((target2) => {
                            const skills2 = target2.getSkills(null, false, false).filter((skill) => {
                                if (player2.hasSkill(skill)) return false;
                                const info = get.info(skill);
                                return info && !info.charlotte;
                            });
                            return Math.max(...skills2.map((skill) => get.skillRank(skill)));
                        })
                    );
                }
            }).forResult();
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            const skills2 = target.getSkills(null, false, false).removeArray(player.getSkills(null, false, false)).filter((skill) => {
                const info = get.info(skill);
                return info && !info.charlotte;
            });
            if (skills2.length) {
                const list = [];
                for (let skill of skills2) {
                    list.push([skill, `<div class="popup text" style="width:calc(100% - 10px);display:inline-block"><div class="skill">【` + get.translation(skill) + "】</div><div>" + lib.translate[skill + "_info"] + "</div></div>"]);
                }
                const result = skills2.length > 1 ? await player.chooseButton({
                    createDialog: [`${get.translation(event.name)}：请获得一个技能`, [list, "textbutton"]],
                    forced: true,
                    ai(button) {
                        const info = get.info(button.link);
                        if (!info || info.ai && (info.ai.combo || info.ai.notemp || info.ai.neg)) {
                            return 0;
                        }
                        return 1 + Math.random();
                    }
                }).forResult() : { bool: true, links: skills2 };
                if (result?.bool && result.links?.length) {
                    const skill = result.links[0];
                    await player.addAdditionalSkills(event.name, skill, true);
                    if (player.additionalSkills?.[event.name]?.length >= 3) {
                        const skills2 = player.additionalSkills?.[event.name];
                        const list = [];
                        for (let skill of skills2) {
                            list.push([skill, `<div class="popup text" style="width:calc(100% - 10px);display:inline-block"><div class="skill">【` + get.translation(skill) + "】</div><div>" + lib.translate[skill + "_info"] + "</div></div>"]);
                        }
                        const result = skills2.length > 1 ? await player.chooseButton({
                            createDialog: [`${get.translation(event.name)}：请失去一个技能`, [list, "textbutton"]],
                            forced: true,
                            ai(button) {
                                const info = get.info(button.link);
                                if (!info || info.ai && (info.ai.combo || info.ai.notemp || info.ai.neg)) {
                                    return 0;
                                }
                                return 1 + Math.random();
                            }
                        }).forResult() : { bool: true, links: skills2 };
                        if (result?.bool && result.links?.length) {
                            const skill = result.links[0];
                            await player.removeAdditionalSkills(event.name, skill);
                        }
                    }
                }
            }
        },
    },
//#noname-kit-end skill:shuoyefushi
//#noname-kit-begin skill:shuoyeweilian
    shuoyeweilian: {
        derivation: "shuoyeliangjie",
        mark: true,
        marktext: "☯",
        zhuanhuanji(player, skill) {
            player.storage[skill] = !player.storage[skill];
            player.changeSkin({ characterName: "shuoye_miaoshitiannv" }, `shuoye_miaoshitiannv${player.storage[skill] ? "_shadow" : ""}`);
            player.markSkill(skill);
        },
        intro: {
            content(storage) {
                if (storage) {
                    return "你受到大于一的伤害后[阴]:你造成的伤害+1。可将任意牌当【酒】、【杀】使用或打出。";
                }
                return "造成大于一伤害后[阳]:你获得牌时摸一张牌，体力上限+1，然后切换为[阴]";
            },
        },
        enable: ["chooseToUse", "chooseToRespond"],
        filter(event, player, name) {
            if (!player.countCards("hes") || !player.storage.shuoyeweilian) {
                return false;
            }
            return get.inpileVCardList(info => {
                const name = info[2];
                return ["jiu", "sha"].includes(name);
            })
                .some(card => event.filterCard({ name: card[2], nature: card[3] }, player, event));
        },
        prompt: "可将任意牌当【酒】、【杀】使用或打出",
        chooseButton: {
            dialog(event, player) {
                const list = get.inpileVCardList(info => {
                    const name = info[2];
                    return ["jiu", "sha"].includes(name);
                }).filter(card => event.filterCard({ name: card[2], nature: card[3] }, player, event));
                const dialog = ui.create.dialog(get.translation("shuoyeweilian"), [list, "vcard"]);
                dialog.direct = true;
                return dialog;
            },
            check(button) {
                if (_status.event.getParent().type != "phase") return 1;
                const player = get.player();
                return player.getUseValue({
                    name: button.link[2],
                    nature: button.link[3],
                });
            },
            backup(links, player) {
                return {
                    viewAs: {
                        name: links[0][2],
                        nature: links[0][3],
                    },
                    filterCard: true,
                    position: "hes",
                    ai1(card) {
                        return 8 - get.value(card);
                    },
                    log: false,
                    async precontent(event, trigger, player) {
                        player.logSkill("shuoyeweilian");
                    },
                }
            },
            prompt(links, player) {
                return "将一张牌当做" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]) + "使用或打出";
            },
        },
        hiddenCard(player, name) {
            if (get.type(name) != "basic" || !player.countCards("hes") || !player.storage.shuoyeweilian) return false;
            return ["jiu", "sha"].includes(name);
        },
        ai: {
            respondSha: true,
            order(item, player) {
                if (player && get.event().type == "phase") {
                    let list = get
                        .inpileVCardList(info => {
                            const name = info[2];
                            return ["jiu", "sha"].includes(name);
                        })
                        .map(card => {
                            return { name: card[2], nature: card[3] };
                        })
                        .filter(card => player.getUseValue(card, true, true) > 0);
                    if (!list.length) return 0;
                    list.sort((a, b) => (player.getUseValue(b, true, true) || 0) - (player.getUseValue(a, true, true) || 0));
                    return get.order(list[0], player) * 0.99;
                }
                return 0.001;
            },
            result: {
                player(player) {
                    if (_status.event.dying) {
                        return get.attitude(player, _status.event.dying);
                    }
                    return 1;
                },
            },
        },
        group: ["shuoyeweilian_yang", "shuoyeweilian_yin", "shuoyeweilian_change"],
        subSkill: {
            yang: {
                trigger: {
                    source: "damageSource",
                    player: "gainAfter",
                    global: "loseAsyncAfter",
                },
                forced: true,
                locked: false,
                filter(event, player) {
                    if (event.name == "damage") {
                        if (!player.storage.shuoyeweilian) {
                            return false;
                        }
                        return event.num > 1;
                    }
                    if (player.storage.shuoyeweilian) {
                        return false;
                    }
                    return event.getg?.(player)?.length > 0;
                },
                async content(event, trigger, player) {
                    await player.changeZhuanhuanji("shuoyeweilian");
                    if (trigger.name != "damage") {
                        await player.draw();
                        await player.gainMaxHp();
                    }
                },
            },
            yin: {
                trigger: {
                    player: "damageEnd",
                    source: "damageBegin1",
                },
                forced: true,
                locked: false,
                filter(event, player, name) {
                    if (name == "damageEnd") {
                        if (player.storage.shuoyeweilian) {
                            return false;
                        }
                        return event.num > 1;
                    }
                    if (!player.storage.shuoyeweilian) {
                        return false;
                    }
                    return true;
                },
                async content(event, trigger, player) {
                    await player.changeZhuanhuanji("shuoyeweilian");
                    if (event.triggername == "damageBegin1") {
                        trigger.num++;
                        game.log(player, "造成的伤害", "#y+1");
                    }
                },
            },
            change: {
                trigger: {
                    player: "changeZhuanhuanji",
                },
                forced: true,
                locked: false,
                filter(event, player) {
                    return event.skill == "shuoyeweilian" && game.getRoundHistory("everything", evt => {
                        return evt.name == "changeZhuanhuanji" && evt.player == player && evt.skill == "shuoyeweilian";
                    }).indexOf(event) == 0;
                },
                async content(event, trigger, player) {
                    player.addTempSkill("shuoyeliangjie", "roundStart");
                },
            },
            backup: {},
        },
    },
//#noname-kit-end skill:shuoyeweilian
//#noname-kit-begin skill:shuoyeliangjie
    shuoyeliangjie: {
        mod: {
            cardUsable(card, player, num) {
                if (player.isTempBanned("shuoyeliangjie")) {
                    return;
                }
                return Infinity;
            },
        },
        trigger: {
            source: "damageSource",
        },
        forced: true,
        async content(event, trigger, player) {
            await player.loseHp();
            await player.draw();
        },
        group: "shuoyeliangjie_block",
        subSkill: {
            block: {
                trigger: {
                    global: "dying",
                },
                forced: true,
                async content(event, trigger, player) {
                    player.removeSkill("shuoyeliangjie");
                },
            },
        },
    },
//#noname-kit-end skill:shuoyeliangjie
    //五条悟
//#noname-kit-begin skill:shuoyexiaxian
    shuoyexiaxian: {
        trigger: {
            global: "useCardAfter",
        },
        forced: true,
        locked: false,
        filter(event, player) {
            return event.targets?.length && event.targets.includes(player);
        },
        async content(event, trigger, player) {
            const skill = "shuoyexiaxian_distance";
            player.addTempSkill(skill, "roundStart");
            const list = player.getStorage(skill);
            player.setStorage(skill, list.concat([trigger.player]), true);
        },
        subSkill: {
            distance: {
                intro: {
                    markcount: () => null,
                    content(storage, player) {
                        if (!storage || !storage.length) {
                            return "无记录";
                        }
                        let str = "本轮游戏：";
                        for (const target of game.players) {
                            if (storage.includes(target)) {
                                str += `<br>${get.translation(target)}计算与你的距离+${storage.filter((i) => i === target).length}`;
                            }
                        }
                        return str;
                    },
                },
                onremove: true,
                mod: {
                    globalTo(from, to, distance) {
                        return distance + to.getStorage("shuoyexiaxian_distance")?.filter((i) => i === from)?.length;
                    },
                },
            },
        },
    },
//#noname-kit-end skill:shuoyexiaxian
//#noname-kit-begin skill:shuoyeshushi
    shuoyeshushi: {
        enable: "phaseUse",
        usable: 1,
        filterTarget: true,
        async content(event, trigger, player) {
            const target = event.target;
            const list = [];
            list.push("你摸两张牌");
            if (target.countDiscardableCards(player, "he")) {
                list.push("弃置其一张牌");
            }
            if (player.hp > 0) {
                list.push("背水！");
            }
            const result = await player
                .chooseControl(list)
                .set("prompt", `你对${get.translation(target)}发动${get.translation(event.name)}：选择执行一项，视为对其使用火攻`)
                .set("ai", () => {
                    const { player, target } = get.event();
                    const controls = get.event().controls.slice();
                    const bool1 = get.effect(player, { name: "draw" }, player, player) * 2 > 0;
                    const bool2 = get.effect(target, { name: "guohe_copy2" }, player, player) > 0;
                    if (bool1 && bool2 && player.getHp() + player.countCards("hs", card => player.canSaveCard(card, player)) > 2) {
                        return "背水！";
                    }
                    if (bool1) {
                        return "你摸两张牌";
                    }
                    if (bool2) {
                        return "弃置其一张牌";
                    }
                })
                .set("target", target)
                .forResult();
            const control = result.control;
            if (control == "你摸两张牌" || control == "背水！") {
                await player.draw(2);
            }
            if (control == "弃置其一张牌" || control == "背水！") {
                await player.discardPlayerCard(target, "he", true);
            }
            if (control == "背水！") {
                await player.loseHp();
                await target.loseHp();
            }
            const card = new lib.element.VCard({ name: "huogong" });
            if (player.canUse(card, target)) {
                await player.useCard(card, target);
            }
        },
        ai: {
            order() {
                return get.order({ name: "huogong" }) + 0.5;
            },
            result: {
                target(player, target) {
                    const card = new lib.element.VCard({ name: "huogong" });
                    if (player.hasSkill("shuoyewuliang_block") && target == player) {
                        return 2;
                    }
                    return Math.min(-2, get.effect(target, card, player, target));
                },
            },
        },
    },
//#noname-kit-end skill:shuoyeshushi
//#noname-kit-begin skill:shuoyewuliang
    shuoyewuliang: {
        enable: "phaseUse",
        usable: 1,
        filterTarget: true,
        async content(event, trigger, player) {
            const target = event.target;
            await target.drawTo(target.maxHp);
            game.broadcastAll((p) => {
                if (!p.hasSkill("shuoyewuliang_block")) p.addSkill("shuoyewuliang_block");
            }, target);
        },
        ai: {
            order: (item, player) => {
                if (game.hasPlayer((cur) => {
                    if (player === cur || get.attitude(player, cur) <= 0) {
                        return false;
                    }
                    return Math.min(5, cur.maxHp) - cur.countCards("h") > 2;
                })) {
                    return get.order({ name: "nanman" }, player) - 0.1;
                }
                return 10;
            },
            result: {
                target(player, target) {
                    if (get.attitude(player, target) > 0) {
                        return Math.max(0, target.maxHp - target.countCards("h")) - 3;
                    }
                    if (Math.max(0, target.maxHp - target.countCards("h")) <= 1 && target.countCards("h", "shan") && !target.hasSkillTag("respondShan", true, null, true) && player.countCards("h", function (card) {
                        return get.tag(card, "respondShan") && player.getUseValue(card, null, true) > 0 && get.effect(target, card, player, player) > 0;
                    })) {
                        return -2;
                    }
                },
            },
        },
        subSkill: {
            block: {
                mark: true,
                group: ["shuoyewuliang_escape"],
                intro: {
                    content: "不能使用手牌且跳过弃牌阶段直到受到伤害；其回合开始时，可失去1点体力以解除",
                },
                charlotte: true,
                mod: {
    cardEnabled(card, player) {
        // 如果这次使用的牌包含手牌，则禁止
        if (card.cards && card.cards.length) {
            if (card.cards.some(cardx => get.position(cardx, true) == 'h')) {
                return false;
            }
        }
        // 如果 card 本身就是一张手牌，也禁止
        else if (get.itemtype(card) == 'card' && get.position(card, true) == 'h') {
            return false;
        }
        // 虚拟牌、装备区牌等不禁止
    },
},
                trigger: {
                    player: ["phaseDiscardBefore", "damageEnd"],
                    global: "roundEnd",
                },
                silent: true,
                async content(event, trigger, player) {
                    if (trigger.name == "phaseDiscard") {
                        trigger.cancel();
                    } else {
                        game.broadcastAll((p) => p.removeSkill("shuoyewuliang_block"), player);
                    }
                },
                ai: {
                    maixie: true,
                    effect: {
                        target(card, player, target, current) {
                            if (!get.tag(card, "damage")) {
                                return;
                            }
                            if (target.hp < 2 || player.hasSkillTag("jueqing", false, target)) {
                                return 1.5;
                            }
                            return [1, 0.8];
                        },
                    },
                },
            },
            escape: {
                charlotte: true,
                silent: true,
                popup: false,
                trigger: { player: "phaseBegin" },
                filter(event, player) {
                    return player.hasSkill("shuoyewuliang_block");
                },
                async content(event, trigger, player) {
                    const result = await player
                        .chooseBool("无量空处：是否失去1点体力以移除该效果？")
                        .set("ai", () => (player.hp > 1 ? 1 : 0))
                        .forResult();
                    if (!result.bool) return;
                    await player.loseHp(1);
                    game.broadcastAll((p) => p.removeSkill("shuoyewuliang_block"), player);
                },
            },
        },
    },
//#noname-kit-end skill:shuoyewuliang
    //U-奥尔加玛丽
//#noname-kit-begin skill:shuoye_xuanyan
    shuoye_xuanyan: {
        trigger: {
            global: "roundStart",
        },
        locked: true,
        async cost(event, trigger, player) {
            const list = lib.suit.slice().map(suit => [suit, get.translation(suit)]);
            event.result = await player
                .chooseButton([get.prompt2(event.skill), [list, "tdnodes"]], 2, true)
                .set("ai", button => {
                    return 1 + Math.random();
                })
                .forResult();
            if (event?.result?.links?.length) {
                event.result.cost_data = event.result.links;
            }
        },
        async content(event, trigger, player) {
            player.addTempSkill("shuoye_xuanyan_effect", "roundStart");
            player.markAuto("shuoye_xuanyan_effect", event.cost_data);
            player.addTip("shuoye_xuanyan_effect", get.translation("shuoye_xuanyan_effect") + player.getStorage("shuoye_xuanyan_effect").reduce((str, type) => str + get.translation(type), ""));
        },
        subSkill: {
            effect: {
                trigger: {
                    target: "useCardToTarget",
                    player: "useCardToPlayer",
                },
                forced: true,
                charlotte: true,
                onremove(player, skill) {
                    delete player.storage[skill];
                    player.removeTip(skill);
                },
                filter(event, player) {
                    if (event.name == "useCardToTarget") {
                        return event.player != player && player.getStorage("shuoye_xuanyan_effect").includes(get.suit(event.card));
                    }
                    return event.target != player && event.target.hasDiscardableCards(player, "h");
                },
                async content(event, trigger, player) {
                    if (trigger.name == "useCardToTarget") {
                        trigger.getParent().targets.remove(player);
                        game.log(trigger.card, "对", player, "无效");
                    } else {
                        const cards = trigger.target.getDiscardableCards(player, "h", card => {
                            return player.getStorage("shuoye_xuanyan_effect").includes(get.suit(card, trigger.target));
                        });
                        if (cards.length) {
                            await trigger.target.discard(cards).set("discarder", player);
                        }
                    }
                },
                ai: {
                    effect: {
                        target(card, player, target, current) {
                            if (target != player && target.getStorage("shuoye_xuanyan_effect").includes(get.suit(card))) {
                                return "zeroplayertarget";
                            }
                        },
                    },
                },
                mark: true,
                intro: {
                    markcount: () => 0,
                    content: "本轮其他角色使用$牌对你无效，你对其他角色使用牌时弃置其手中$的牌。",
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_xuanyan
//#noname-kit-begin skill:shuoye_jingtian
    shuoye_jingtian: {
        enable: "phaseUse",
        limited: true,
        async content(event, trigger, player) {
            // BOSS 模式下 limited 被置为 false，不进入限定技已发动状态，靠 usable 限制每回合一次
            if (lib.skill[event.name]?.limited) {
                player.awakenSkill(event.name);
            }
            if (player.hasSkill("shuoye_ruli_buff")) {
                await player.recoverTo(player.maxHp);
            } else {
                await player.loseHp();
            }
            const num = player.maxHp - player.countCards("h");
            if (num <= 0) {
                return;
            }
            await player.drawTo(player.maxHp);
            const result = await player
                .chooseTarget(get.prompt(event.name), `令一名角色失去${num}点体力`, true)
                .set("ai", target => {
                    const player = get.player();
                    return get.effect(target, { name: "losehp" }, player, player);
                })
                .forResult();
            if (result?.targets?.length) {
                const [target] = result.targets;
                const next = target.loseHp(num);
                await next;
                if (!game.hasGlobalHistory("everything", evt => {
                    return evt.name == "die" && evt.player == target && evt.getParent("loseHp") == next;
                })) {
                    player.when("phaseBegin")
                        .then(() => {
                            player.refreshSkill("shuoye_jingtian");
                        });
                }
            }
        },
        ai: {
            order: 1,
            result: {
                player(player) {
                    if (player.isMaxHandcard() || player.isMaxHp()) {
                        return 0;
                    }
                    return player.maxHp - player.countCards("h");
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_jingtian
//#noname-kit-begin skill:shuoye_zhongji
    shuoye_zhongji: {
        trigger: {
            global: ["loseAfter", "loseAsyncAfter"],
        },
        forced: true,
        locked: false,
        persevereSkill: true,
        getIndex(event, player) {
            if (event.type !== "discard" || event.getlx === false) return [];
            return game.filterPlayer(target => {
                const evt = event.getl?.(target);
                return evt?.cards2?.some(card => {
                    const suit = get.suit(card, target);
                    return player.getStorage("shuoye_xuanyan_effect").includes(suit);
                });
            });
        },
        async content(event, trigger, player) {
            const target = event.indexedData;
            const cards = trigger.getl(target).cards2.filter(card => {
                const suit = get.suit(card, target);
                return player.getStorage("shuoye_xuanyan_effect").includes(suit);
            });
            if (cards.length) {
                player.addMark(event.name, cards.length);
            }
        },
        marktext: "U",
        intro: {
            name: "U",
            content: "mark",
        },
        group: ["shuoye_zhongji_use", "shuoye_zhongji_directHit"],
        subSkill: {
            use: {
                mod: {
                    cardUsable(card, player) {
                        if (player.countMark("shuoye_zhongji") >= get.cardNameLength(card)) {
                            return Infinity;
                        }
                    },
                    targetInRange(card, player, target) {
                        if (player.countMark("shuoye_zhongji") >= get.cardNameLength(card)) {
                            return true;
                        }
                    },
                },
                trigger: {
                    player: "useCard",
                },
                forced: true,
                locked: false,
                persevereSkill: true,
                filter(event, player) {
                    return player.countMark("shuoye_zhongji") >= get.cardNameLength(event.card);
                },
                async content(event, trigger, player) {
                    const num = get.cardNameLength(trigger.card);
                    trigger.baseDamage += num;
                    player.removeMark("shuoye_zhongji", num);
                    if (trigger.addCount !== false) {
                        game.log(trigger.card, "不计入次数限制");
                        trigger.addCount = false;
                        player.getStat().card[trigger.card.name]--;
                    }
                    trigger.directHit.addArray(game.filterPlayer());
                    await player.gainMaxHp(num);
                },
            },
            directHit: {
                trigger: {
                    target: "useCardToTargeted",
                },
                lastDo: true,
                forced: true,
                locked: false,
                persevereSkill: true,
                filter(event, player) {
                    if (event.player == player) {
                        return false;
                    }
                    return player.hasMark("shuoye_zhongji") && event.getParent().directHit.includes(player);
                },
                async content(event, trigger, player) {
                    while (trigger.getParent().directHit.includes(player)) {
                        trigger.getParent().directHit.remove(player);
                    }
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_zhongji
//#noname-kit-begin skill:shuoye_ruli
    shuoye_ruli: {
        persevereSkill: true,
        init(player, skill) {
            if (player.hasSkill("shuoye_ruli_buff")) {
                return;
            }
            if (get.mode() == "boss" || player.maxHp >= 100) {
                game.log(player, "激活", "#g〖人理〗");
                player.addSkill("shuoye_ruli_buff");
            }
        },
        trigger: {
            player: "gainMaxHpAfter",
        },
        forced: true,
        locked: false,
        filter(event, player) {
            return player.maxHp >= 100 && !player.hasSkill("shuoye_ruli_buff");
        },
        async content(event, trigger, player) {
            game.log(player, "激活", "#g〖人理〗");
            player.addSkill("shuoye_ruli_buff");
        },
        subSkill: {
            buff: {
                persevereSkill: true,
                trigger: {
                    player: "changeHpBegin",
                },
                forced: true,
                charlotte: true,
                filter(event, player) {
                    return Math.abs(event.num) != 1;
                },
                async content(event, trigger, player) {
                    trigger.num = get.sgn(trigger.num);
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_ruli
    //天启星魂
//#noname-kit-begin skill:shuoyexingqi
    shuoyexingqi: {
        persevereSkill: true,
        trigger: {
            global: "phaseBegin",
            player: "phaseJudgeBegin",
        },
        forced: true,
        locked: false,
        filter(event, player) {
            if (event.name == "phaseJudge") {
                return player.hasDiscardableCards(player, "j");
            }
            return true;
        },
        async content(event, trigger, player) {
            if (trigger.name == "phase") {
                const cards = get.cards();
                await game.cardsGotoOrdering(cards);
                await game.delay();
                const list = ["lebu", "bingliang"].filter(name => {
                    return player.canAddJudge({ name: name }, cards);
                });
                if (list.length) {
                    const name = list.randomGet();
                    await player.addJudge({ name: name }, cards);
                }
                await player.draw(player.countCards("j"));
            } else {
                await player.discard(player.getDiscardableCards(player, "j"));
            }
        },
    },
//#noname-kit-end skill:shuoyexingqi
//#noname-kit-begin skill:shuoyemengjue
    shuoyemengjue: {
        trigger: {
            global: "phaseJudgeBegin",
        },
        priority: -15,
        filter(event, player) {
            return player.hasCards("j");
        },
        async cost(event, trigger, player) {
            const cards = player.getCards("j");
            if (!cards.length) {
                return;
            }
            const prefix = "shuoye_mengjue_";
            const list = cards.map((card, index) => [prefix + index, "获得【" + get.translation(card) + "】"]);
            const result = await player
                .chooseButton([get.prompt2(event.skill), [list, "tdnodes"]], [1, 1])
                .set("ai", button => {
                    const player2 = get.player();
                    return player2.countCards("j") > 1 ? 1 + Math.random() : 0;
                })
                .forResult();
            if (!result || !result.bool || !result.links || !result.links.length) {
                return;
            }
            const link = result.links[0];
            if (typeof link !== "string" || !link.startsWith(prefix)) {
                return;
            }
            const card = cards[parseInt(link.slice(prefix.length))];
            if (!card || get.position(card) !== "j") {
                return;
            }
            const result2 = await player
                .chooseTarget("选择一名角色获得此牌", true)
                .set("filterTarget", (card, player2, target) => target.isIn())
                .set("ai", target => {
                    const player = get.player();
                    if (target === player) {
                        return 100;
                    }
                    const att = get.attitude(player, target);
                    return att > 0 ? 10 + att : att - 100;
                })
                .forResult();
            if (result2 && result2.bool) {
                event.result = {
                    bool: true,
                    cost_data: { cards: [card], targets: result2.targets },
                };
            }
        },
        async content(event, trigger, player) {
            const { cards, targets } = event.cost_data;
            if (cards && cards.length && targets && targets.length) {
                await targets[0].gain(cards, "gain2");
            }
            player.addTempSkill("shuoyemengjue_effect");
        },
        subSkill: {
            effect: {
                trigger: {
                    player: "changeHpBegin",
                },
                forced: true,
                charlotte: true,
                filter(event, player) {
                    return event.num < -1;
                },
                async content(event, trigger, player) {
                    trigger.num = -1;
                },
            },
        },
    },
//#noname-kit-end skill:shuoyemengjue
//#noname-kit-begin skill:shuoyezhouke
    shuoyezhouke: {
        trigger: {
            player: "loseAfter",
            global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
        },
        forced: true,
        locked: false,
        filter(event, player) {
            if (player.storage.shuoyeZhoukeBack) {
                return false;
            }
            if (player.countMark("shuoyezhouke") >= 12) {
                return false;
            }
            let evt = event.getl?.(player);
            return evt?.js?.length;
        },
        async content(event, trigger, player) {
            player.addMark(event.name, 1, false);
            await player.gainMaxHp();
            await player.recover();
            if (player.countMark(event.name) >= 12) {
                player.storage.shuoyeZhoukeBack = true;
                player.changeSkin({ characterName: "shuoye_tianqixinghun" }, "shuoye_tianqixinghun_shadow");
            }
        },
        mark: true,
        intro: {
            content: "已转动#刻",
        },
        group: ["shuoyezhouke_back", "shuoyezhouke_cap"],
        subSkill: {
            cap: {
                charlotte: true,
                forced: true,
                trigger: { player: "gainAfter" },
                filter(event, player) {
                    return player.countCards("h") > player.maxHp;
                },
                async content(event, trigger, player) {
                    await player.chooseToDiscard("h", player.countCards("h") - player.maxHp, true);
                },
            },
            back: {
                charlotte: true,
                forced: true,
                trigger: { global: "phaseBegin" },
                filter(event, player) {
                    return !!player.storage.shuoyeZhoukeBack && player.countMark("shuoyezhouke") > 0;
                },
                async content(event, trigger, player) {
                    player.removeMark("shuoyezhouke", 1, false);
                    await player.draw();
                    await player.loseMaxHp();
                    if (player.countMark("shuoyezhouke") <= 0) {
                        player.storage.shuoyeZhoukeBack = false;
                        player.changeSkin({ characterName: "shuoye_tianqixinghun" }, "shuoye_tianqixinghun");
                    }
                },
            },
        },
    },
//#noname-kit-end skill:shuoyezhouke
//#noname-kit-begin skill:shuoyetaixu
    shuoyetaixu: {
        group: ["shuoyetaixu_deal", "shuoyetaixu_take"],
        subSkill: {
            deal: {
                charlotte: true,
                forced: true,
                trigger: { source: "damageBegin1" },
                filter(event, player) {
                    return !player.storage.shuoyeZhoukeBack;
                },
                async content(event, trigger, player) {
                    trigger.num++;
                },
            },
            take: {
                charlotte: true,
                forced: true,
                trigger: { player: "damageBegin4" },
                filter(event, player) {
                    return !!player.storage.shuoyeZhoukeBack;
                },
                async content(event, trigger, player) {
                    trigger.num--;
                    if (trigger.num <= 0) {
                        trigger.cancel();
                    }
                },
            },
        },
    },
//#noname-kit-end skill:shuoyetaixu
    //祖国人
//#noname-kit-begin skill:shuoyechaoneng
    shuoyechaoneng: {
        mod: {
            cardUsable(card, player) {
                if (lib.skill.shuoyechaoneng.isOld(card, player)) {
                    return Infinity;
                }
            },
            targetInRange(card, player, target) {
                if (lib.skill.shuoyechaoneng.isOld(card, player)) {
                    return true;
                }
            },
        },
        isOld(card, player) {
            if (!card) {
                return false;
            }
            const cards = Array.isArray(card.cards) && card.cards.length ? card.cards : [card];
            if (_status.connectMode) {
                const gained = player.storage.shuoyechaoneng_gain;
                if (Array.isArray(gained) && gained.length) {
                    if (cards.some(c => c.cardid != null && gained.includes(c.cardid))) {
                        return false;
                    }
                }
                return true;
            }
            const gains = player.getHistory("gain");
            for (const evt of gains) {
                const evtCards = evt.cards || [];
                if (evtCards.some(c => cards.includes(c))) {
                    return false;
                }
            }
            return true;
        },
        trigger: {
            player: "useCard",
        },
        forced: true,
        locked: false,
        async content(event, trigger, player) {
            await player.draw();
            if (!trigger.card || trigger.card.name !== "jiu") {
                trigger.baseDamage++;
            }
        },
        init(player) {
            player.storage.shuoyechaoneng_gain = [];
        },
        group: ["shuoyechaoneng_gain", "shuoyechaoneng_damage"],
        subSkill: {
            damage: {
                forced: true,
                locked: false,
                silent: true,
                priority: -1,
                trigger: {
                    player: "damageBegin4",
                },
                content: function (event, trigger, player) {
                    trigger.num--;
                },
            },
            gain: {
                forced: true,
                locked: false,
                silent: true,
                trigger: {
                    player: "gainAfter",
                    global: "phaseBegin",
                },
                content: function (event, trigger, player) {
                    if (trigger.name == "gain") {
                        const gained = player.storage.shuoyechaoneng_gain || (player.storage.shuoyechaoneng_gain = []);
                        for (const card of trigger.cards || []) {
                            if (card && card.cardid != null && !gained.includes(card.cardid)) {
                                gained.push(card.cardid);
                            }
                        }
                        player.markSkill("shuoyechaoneng_gain");
                    } else if (trigger.name == "phase" && trigger.phase == "phaseBegin") {
                        player.storage.shuoyechaoneng_gain = [];
                        player.markSkill("shuoyechaoneng_gain");
                    }
                },
            },
        },
    },
//#noname-kit-end skill:shuoyechaoneng
//#noname-kit-begin skill:shuoyeqiuxin
    shuoyeqiuxin: {
        trigger: {
            global: ["useCard", "respond"],
        },
        forced: true,
        filter(event, player) {
            if (!event.respondTo || !Array.isArray(event.respondTo)) {
                return false;
            }
            if (player != event.respondTo[0]) {
                return false;
            }
            return event.respondTo[1];
        },
        async content(event, trigger, player) {
            player.addTempSkill("fengyin");
            player
                .when("useCardAfter")
                .filter(evt => evt.card == trigger.respondTo[1])
                .then(async (event, trigger, player) => {
                    const targets = game.filterPlayer(target => target != player);
                    const func = async target => {
                        const result = await target.chooseToUse(
                            function (card, player2, event2) {
                                return lib.filter.filterCard.apply(this, arguments);
                            },
                            "求心：你可以对" + get.translation(player) + "使用一张牌"
                        ).set("targetRequired", true).set("complexSelect", true).set("complexTarget", true).set("filterTarget", function (card, player2, target2) {
                            if (target2 != _status.event.sourcex && !ui.selected.targets.includes(_status.event.sourcex)) {
                                return false;
                            }
                            return lib.filter.filterTarget.apply(this, arguments);
                        }).set("sourcex", player);
                    };
                    await game.doAsyncInOrder(targets, func);
                });
        },
    },
//#noname-kit-end skill:shuoyeqiuxin
//#noname-kit-begin skill:shuoyedengshen
    shuoyedengshen: {
        init(player, skill) {
            player.updates ??= [];
            game.shuoyedengshenCheck = player => {
                const num = player.getHandcardLimit();
                if (num >= 10) {
                    const next = game.createEvent("shuoyedengshenChange");
                    next.player = player;
                    next.setContent("emptyEvent");
                    player.updates.remove(game.shuoyedengshenCheck);
                }
            };
            player.updates.add(game.shuoyedengshenCheck);
        },
        onremove(player, skill) {
            player.updates.remove(game.shuoyedengshenCheck);
        },
        trigger: {
            player: "gainAfter",
        },
        forced: true,
        locked: false,
        dutySkill: true,
        filter(event, player) {
            if (_status.currentPhase == player) {
                return false;
            }
            return event.getg && event.getg(player)?.length;
        },
        async content(event, trigger, player) {
            player.addSkill("shuoyedengshen_buff");
            player.addMark("shuoyedengshen_buff", 1, false);
            player.setMark("shuoyedengshen_limit", player.countMark("shuoyedengshen_buff"), false);
            player.update();
        },
        group: ["shuoyedengshen_achieve", "shuoyedengshen_fail", "shuoyedengshen_limit"],
        subSkill: {
            achieve: {
                trigger: {
                    player: "shuoyedengshenChange",
                },
                forced: true,
                locked: false,
                skillAnimation: true,
                animationColor: "fire",
                async content(event, trigger, player) {
                    player.awakenSkill("shuoyedengshen");
                    game.log(player, "成功完成使命");
                    player.changeSkin({ characterName: "shuoye_zuguoren" }, "shuoye_zuguoren_awaken");
                    lib.skill.shuoye_chunai.playBgmOnce(player, "skill/shuoye_zuguoren_awaken1.mp3", 1.2);
                    game.broadcastAll(() => {
                        const video = document.createElement("video");
                        video.src = lib.assetURL + "extension/朔夜/audio/shuoye_zuguoren_awaken.mp4";
                        video.autoplay = true;
                        video.loop = false;
                        video.muted = true;
                        video.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:2147483647;";
                        const pausedByUs = !_status.paused;
                        if (pausedByUs) {
                            game.pause();
                        }
                        document.body.appendChild(video);
                        let closed = false;
                        const closeVideo = () => {
                            if (closed) {
                                return;
                            }
                            closed = true;
                            if (video.parentNode) {
                                video.parentNode.removeChild(video);
                            }
                            if (pausedByUs) {
                                game.resume();
                            }
                        };
                        video.onended = closeVideo;
                        video.onerror = closeVideo;
                        video.onloadedmetadata = () => {
                            const ms = Math.max(3000, (video.duration || 0) * 1000 + 5000);
                            setTimeout(closeVideo, ms);
                        };
                        video.play().catch(() => closeVideo());
                    });
                    await player.removeSkills("shuoyeqiuxin");
                },
            },
            fail: {
                trigger: {
                    player: "loseAfter",
                    global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
                },
                forced: true,
                locked: false,
                filter(event, player) {
                    if (player.hasCards("h")) {
                        return false;
                    }
                    const evt = event.getl(player);
                    return evt && evt.player === player && evt.hs && evt.hs.length > 0;
                },
                async content(event, trigger, player) {
                    player.awakenSkill("shuoyedengshen");
                    game.log(player, "使命失败");
                    await player.removeSkills("shuoyechaoneng");
                },
            },
            limit: {
                charlotte: true,
                forced: true,
                silent: true,
                trigger: {
                    player: ["changeHp", "gainMaxHpAfter", "loseMaxHpAfter", "enterGame"],
                    global: ["phaseBegin", "gameDrawEnd", "gameStart"],
                },
                async content(event, trigger, player) {
                    player.setMark("shuoyedengshen_limit", player.countMark("shuoyedengshen_buff"), false);
                },
                mark: true,
                marktext: "限",
                intro: {
                    content: "增加手牌上限的次数",
                },
            },
            buff: {
                mod: {
                    maxHandcard(player, num) {
                        return num + player.countMark("shuoyedengshen_buff");
                    },
                },
            },
        },
    },
//#noname-kit-end skill:shuoyedengshen
    //薇尔诗
//#noname-kit-begin skill:shuoye_rongguang
    shuoye_rongguang: {
        trigger: {
            player: "dying",
        },
        forced: true,
        content: function () {
            "step 0"
            var num = player.maxHp - player.hp;
            player.recover(num);
            event.num = num;
            player.chooseTarget(get.prompt2("shuoye_rongguang"), 1, function (card, player, target) {
                return player != target;
            }).set("ai", function (target) {
                var player = _status.event.player;
                return get.attitude(player, target) < 0;
            });
            "step 1"
            if (result.bool) {
                result.targets[0].damage(event.num);
                player.restoreSkill("shuoye_qiyuan");
                player.addSkill("shuoye_chudan");
                player.removeSkill("shuoye_rongguang");
            }
        },
    },
//#noname-kit-end skill:shuoye_rongguang
//#noname-kit-begin skill:shuoye_fenzheng
    shuoye_fenzheng: {
        trigger: {
            player: "phaseBegin",
        },
        forced: true,
        content: function () {
            player.discard(player.getCards("j"));
            player.gainMaxHp();
            player.changeHujia(1);
            player.addSkill("shuoye_rongguang");
            player.removeSkill("shuoye_fenzheng");
        },
    },
//#noname-kit-end skill:shuoye_fenzheng
//#noname-kit-begin skill:shuoye_mengya
    shuoye_mengya: {
        trigger: {
            player: "damageAfter",
        },
        direct: true,
        content: function () {
            "step 0"
            player.chooseTarget(get.prompt2("shuoye_mengya"), 1, function (card, player, target) {
                return player != target;
            }).set("ai", function (target) {
                var player = _status.event.player;
                return get.attitude(player, target) < 0;
            });
            "step 1"
            if (result.bool) {
                event.list = ["lebu", "bingliang", "shandian"];
                event.target = result.targets[0];
                event.list2 = event.list.randomGet(1);
                game.log(player, "令", event.target, "进行【", get.translation(event.list2), "】的判定");
                event.target.judge(true);
            }
            else {
                event.finish();
            }
            "step 2"
            if (result.suit != "heart" && event.target) {
                if (event.list2 == "lebu") event.target.skip("phaseUse");
                if (event.list2 == "bingliang") event.target.skip("phaseDraw");
                if (event.list2 == "shandian") event.target.damage(3, "thunder", "nosource");
                event.target.loseMaxHp(event.target.maxHp - event.target.hp);
                event.target.changeHujia(-event.target.hujia);
                player.removeSkill("shuoye_mengya");
                player.addSkill("shuoye_fenzheng");
            }
        },
    },
//#noname-kit-end skill:shuoye_mengya
//#noname-kit-begin skill:shuoye_chudan
    shuoye_chudan: {
        subSkill: {
            damage: {
                trigger: {
                    source: "damageBegin",
                },
                forced: true,
                async content(event, trigger, player) {
                    trigger.num++;
                },
            },
        },
        group: "shuoye_chudan_damage",
        trigger: {
            global: ["useCard", "respond"],
        },
        locked: true,
        forced: true,
        filter: function (event, player) {
            return Array.isArray(event.respondTo) && event.respondTo[0] != event.player && event.respondTo[0] == player && get.tag(event.respondTo[1], "damage");
        },
        content: function () {
            player.addSkill("shuoye_mengya");
            player.removeSkill("shuoye_chudan");
        },
    },
//#noname-kit-end skill:shuoye_chudan
//#noname-kit-begin skill:shuoye_qiyuan
    shuoye_qiyuan: {
        group: ["shuoye_qiyuan_watch"],
        enable: "phaseUse",
        limited: true,
        filterTarget: function (card, player, target) {
            return player != target;
        },
        prompt2: "令一名其他角色失去1点体力并增加1点护甲；若其未因此死亡，则你的下个回合开始时刷新此技能",
        async content(event, trigger, player) {
            const target = event.target;
            player.awakenSkill("shuoye_qiyuan");
            game.log(player, "发动了", "【祈愿】");
            await target.loseHp(1);
            await target.changeHujia(1, null, true);
            if (!target.isAlive()) return;
            player.storage.shuoye_qiyuan_refresh = true;
        },
        subSkill: {
            watch: {
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "phaseBegin" },
                filter(event, player) {
                    return !!player.storage.shuoye_qiyuan_refresh;
                },
                content(event, trigger, player) {
                    delete player.storage.shuoye_qiyuan_refresh;
                    player.restoreSkill("shuoye_qiyuan");
                    game.log(player, "刷新了", "【祈愿】");
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_qiyuan
//#noname-kit-begin skill:shuoye_wanxiang
    shuoye_wanxiang: {
        derivation: ["shuoye_chudan", "shuoye_mengya", "shuoye_fenzheng", "shuoye_rongguang"],
        group: ["shuoye_wanxiang_start", "shuoye_wanxiang_damage", "shuoye_wanxiang_draw"],
        subSkill: {
            damage: {
                trigger: {
                    source: "damageBegin",
                },
                forced: true,
                filter: function (event, player) {
                    return player.storage.shuoye_wanxiang_damage > 0;
                },
                content: function () {
                    trigger.num += player.storage.shuoye_wanxiang_damage;
                },
            },
            draw: {
                trigger: {
                    player: "damageAfter",
                },
                usable: 1,
                filter: function (event, player) {
                    return player.storage.shuoye_wanxiang_draw > 0;
                },
                content: function () {
                    var num = player.storage.shuoye_wanxiang_draw;
                    player.gainMaxHp(num);
                    player.draw(num);
                },
            },
            start: {
                trigger: {
                    global: "phaseBefore",
                    player: "enterGame",
                },
                forced: true,
                filter: function (event, player) {
                    return (event.name != 'phase' || game.phaseNumber == 0);
                },
                content: function () {
                    player.addSkill("shuoye_chudan");
                },
            },
        },
        init: function (player) {
            player.storage.shuoye_wanxiang_draw = 0;
            player.storage.shuoye_wanxiang_damage = 0;
        },

        trigger: {
            global: "dieBegin",
        },
        forced: true,
        filter: function (event, player) {
            return event.player != player && get.distance(player, event.player) > 0;
        },
        async content(event, trigger, player) {
            var num = get.distance(player, trigger.player);
            if (num == 1) {
                await player.disableJudge();
            }
            if (num == 2) {
                player.storage.shuoye_wanxiang_damage++;
            }
            if (num >= 3) {
                player.storage.shuoye_wanxiang_draw++;
            }
        },
    },
//#noname-kit-end skill:shuoye_wanxiang
    //冲田总司
//#noname-kit-begin skill:shuoye_wuming
    shuoye_wuming: {
        trigger: {
            player: "useCard",
        },
        forced: true,
        filter(event, player) {
            return !player.hasStorage("shuoye_wuming_used", get.type(event.card));
        },
        async content(event, trigger, player) {
            player.addSkill("shuoye_wuming_used");
            player.markAuto("shuoye_wuming_used", [get.type(trigger.card)]);
            //player.addTip(event.name, get.translation(event.name) + player.getStorage(event.name).reduce((str, type) => str + get.translation(type), ""));
            if (player.getStorage("shuoye_wuming_used").length >= 3) {
                player.removeSkill("shuoye_wuming_used");
                //player.removeTip(event.name);
                //delete player.storage[event.name];
                const list = [], num = player.getDamagedHp() + 1;;
                list.push("失去体力");
                list.push("减少体力上限");
                if (!player.hasSkill("shuoye_wuming_delete")) list.push("视为使用杀");
                const { index } = await player
                    .chooseControl(list)
                    .set("prompt", `选择失去1点体力或体力上限，或者视为使用${num}张无视防具的杀并令此选项失效至你令一名角色进入濒死`)
                    .set("ai", () => {
                        const player = get.player();
                        let controls = get.event("controls");
                        if (controls.includes("视为使用杀")) return "视为使用杀";
                        if (player.hp == player.maxHp) return "失去体力";
                        if (player.hp < player.maxHp - 1 || player.hp <= 2) return "减少体力上限";
                        return "失去体力";
                    }).forResult();
                if (index == 0) {
                    await player.loseHp();
                } else if (index == 1) {
                    await player.loseMaxHp();
                } else {
                    player.addTempSkill("shuoye_wuming_delete", { source: "dying" });
                    for (var i = 0; i < num; i++) {
                        const card = new lib.element.VCard({ name: "sha", storage: { shuoye_wuming: true } });
                        if (player.hasUseTarget(card, true, false)) await player.chooseUseTarget(card, true, false);
                    }
                }
            }
        },
        ai: {
            unequip: true,
            skillTagFilter(player, tag, arg) {
                if (!arg?.card?.storage?.shuoye_wuming) return false;
            },
        },
        subSkill: {
            used: {
                charlotte: true,
                onremove: true,
                mark: true,
                intro: {
                    content: "已使用过的类型：$",
                },
            },
            delete: {
                charlotte: true,
            },
        },
    },
//#noname-kit-end skill:shuoye_wuming
//#noname-kit-begin skill:shuoye_suodi
    shuoye_suodi: {
        trigger: {
            global: ["chooseToUseBegin", "chooseToRespondBegin"],
        },
        usable: 2,
        popup: false,
        filter(event, player) {
            var evt = event.getParent();
            if (!evt?.card || evt?.player == event.player) return false;
            return get
                .inpileVCardList(info => {
                    const name = info[2],
                        type = get.type(name),
                        infox = get.info({ name: name });
                    return ["basic"].includes(type);
                })
                .some(card => event.filterCard({ name: card[2], nature: card[3] }, event.player, event));
        },
        async cost(event, trigger, player) {
            const list = get
                .inpileVCardList(info => {
                    const name = info[2], type = get.type(name), infox = get.info({ name: name });
                    return type == "basic";
                })
                .filter(card => trigger.filterCard({ name: card[2], nature: card[3] }, trigger.player, trigger));
            if (!list.length) return;
            var evt = trigger.getParent();
            var name = list[0][2], names = '';
            names += '【' + get.translation(name) + '】';
            var reason = (trigger.name == 'chooseToUse' ? '使用' : '打出');
            var str = get.translation(trigger.player) + (evt.card ? '因' + get.translation(evt.card) : '') + '需要' + reason + '一张' + names + '，是否代替其' + reason + reason + '使用之';
            event.result = await player
                .chooseBool(get.prompt('shuoye_suodi', trigger.player), str)
                .set('ai', () => {
                    const player = get.player();
                    const trigger = get.event().getTrigger().player;
                    return get.attitude(player, trigger.player) > 0;
                })
                .forResult();
            event.result.cost_data = { card: { name: name, isCard: true } };
        },
        async content(event, trigger, player) {
            player.logSkill('shuoye_suodi', trigger.player);
            var card = event.cost_data.card,
                types = player.getStorage("shuoye_wuming_used");
            const { bool } = await player
                .chooseToUse(function (card, player, event) {
                    if (get.event("types").includes(get.type(card))) return false;
                    return lib.filter.filterCard.apply(this, arguments);
                }, `使用一张未记录种类的牌，或取消弃置一张${get.translation(card)}`)
                .set("types", types)
                .forResult();
            if (!bool) {
                event.result = await player
                    .chooseToDiscard("h", `弃置一张${get.translation(card)}`)
                    .set("cardx", card)
                    .set("filterCard", card => {
                        const player = get.player();
                        return get.event("cardx").name == get.name(card, player);
                    })
                    .forResult();
            } else event.result = { bool: true };
            if (event.result?.bool) {
                trigger.untrigger();
                trigger.set('responded', true);
                var result = {
                    bool: true,
                    card: card,
                    cards: [],
                };
                trigger.result = result;
                await player.draw();
                player.addSkill("shuoye_suodi_effect");
                player.addMark("shuoye_suodi_effect", 1, false);
            }
        },
        subSkill: {
            effect: {
                trigger: {
                    source: "damageBegin1",
                },
                forced: true,
                charlotte: true,
                onremove: true,
                async content(event, trigger, player) {
                    trigger.num += player.countMark(event.name);
                    player.removeSkill(event.name);
                },
                mark: true,
                intro: {
                    content: "你下一次造成的伤害+#",
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_suodi
//#noname-kit-begin skill:shuoye_juedao
    shuoye_juedao: {
        enable: "chooseToUse",
        hiddenCard(player, name) {
            if (_status.currentPhase == player) return false;
            if (player.hasSkill("shuoye_juedao_blocker", null, null, false)) return false;
            return get.type(name) == "basic" &&
                player.countCards("h", card => !player.hasStorage("shuoye_wuming_used", get.type(card)));
        },
        filter(event, player) {
            if (_status.currentPhase == player) return false;
            if (event.type == "wuxie" || event.shuoye_juedao) return false;
            if (!player.countCards("h", card => !player.hasStorage("shuoye_wuming_used", get.type(card)))) return false;
            for (const name of lib.inpile) {
                if (get.type(name) != "basic") continue;
                const card = { name: name, isCard: true };
                if (event.filterCard(card, player, event)) return true;
                if (name == "sha") {
                    for (const nature of lib.inpile_nature) {
                        card.nature = nature;
                        if (event.filterCard(card, player, event)) return true;
                    }
                }
            }
            return false;
        },
        chooseButton: {
            dialog(event, player) {
                const vcards = get.inpileVCardList(info => {
                    if (info[0] != "basic") return;
                    const card = { name: info[2], nature: info[3], isCard: true };
                    return event.filterCard(card, player, event);
                });
                const dialog = ui.create.dialog("绝刀", [vcards, "vcard"], "hidden");
                dialog.direct = true;
                return dialog;
            },
            check(button) {
                if (get.event().getParent().type != "phase") return 1;
                const player = get.player();
                const card = { name: button.link[2], nature: button.link[3] };
                if (
                    game.hasPlayer(current => {
                        return player.canUse(card, current) && get.effect(current, card, player, player) > 0;
                    })
                ) {
                    switch (button.link[2]) {
                        case "tao":
                            return 5;
                        case "jiu":
                            return 3.01;
                        case "sha":
                            if (button.link[3] == "fire") return 2.95;
                            else if (button.link[3] == "thunder") return 2.92;
                            else return 2.9;
                    }
                }
                return 0;
            },
            backup(links, player) {
                return {
                    filterCard(card) {
                        const player = get.player();
                        return get.itemtype(card) == "card" && player.hasUseTarget(card);
                    },
                    viewAs: {
                        name: links[0][2],
                        nature: links[0][3],
                        suit: "none",
                        number: null,
                        isCard: true,
                    },
                    ai1(card) {
                        return 1 / (1.1 + Math.max(-1, get.value(card)));
                    },
                    log: false,
                    async precontent(event, trigger, player) {
                        player.logSkill("shuoye_juedao");
                        var viewAs = new lib.element.VCard({
                            name: event.result.card.name,
                            nature: event.result.card.nature,
                            isCard: true,
                        });
                        const card = event.result.cards[0];
                        event.result.cards = [];
                        if (player.hasUseTarget(card)) {
                            await player.chooseUseTarget(card, true);
                            event.result2 = { bool: true }
                        }
                        if (event.result2?.bool) {
                            game.broadcastAll(viewAs => {
                                lib.skill.shuoye_juedao_backup2.viewAs = viewAs;
                            }, lib.skill.shuoye_juedao_backup.viewAs);
                            var evt = event.getParent();
                            evt.set("_backupevent", "shuoye_juedao_backup2");
                            evt.set("openskilldialog", `请选择${get.translation(viewAs.nature)}${get.translation(viewAs.name)}的目标`);
                            evt.backup("shuoye_juedao_backup2");
                            evt.set("norestore", true);
                            evt.set("custom", {
                                add: {},
                                replace: { window() { } },
                            });
                            evt.goto(0);
                        } else {
                            var evt = event.getParent();
                            evt.set("shuoye_juedao", true);
                            evt.goto(0);
                            player.addTempSkill("shuoye_juedao_blocker", {
                                player: ["useCard1", "useSkillBegin", "phaseUseEnd"],
                            });
                        }
                        await game.delayx();
                    },
                    ai: { order: 10 },
                };
            },
            prompt(links, player) {
                return `使用一张未记录类型的牌视为你使用一张${get.translation(links[0][3] || "")}${get.translation(links[0][2])}`;
            },
        },
        ai: {
            order() {
                const player = get.player(),
                    event = get.event();
                if (event.filterCard({ name: "jiu" }, player, event) && get.effect(player, { name: "jiu" }) > 0) {
                    return get.order({ name: "jiu" }) + 0.1;
                }
                return get.order({ name: "sha" }) + 0.1;
            },
            respondSha: true,
            fireAttack: true,
            respondShan: true,
            skillTagFilter(player, tag, arg) {
                if (player.hasSkill("shuoye_juedao_blocker", null, null, false)) return false;
            },
            result: {
                player(player) {
                    if (_status.event.dying) return get.attitude(player, _status.event.dying);
                    return 1;
                },
            },
        },
        subSkill: {
            backup: {},
            backup2: {
                filterCard: () => false,
                selectCard: -1,
                log: false,
            },
            blocker: {
                charlotte: true,
            },
        },
    },
//#noname-kit-end skill:shuoye_juedao
    //
//#noname-kit-begin skill:shuoye_yuqi
    shuoye_yuqi: {
        persevereSkill: true,
        forced: true,
        popup: false,
        locked: false,
        beginMarkCount: 10,
        maxMarkCount: 100,
        addMark(player, num) {
            num = Math.min(num, lib.skill.shuoye_yuqi.maxMarkCount - player.countMark("shuoye_yuqi"));
            player.addMark("shuoye_yuqi", num);
        },
        group: ["shuoye_yuqi_begin", "shuoye_yuqi_add", "shuoye_yuqi_remove"],
        marktext: "幸福",
        intro: {
            name: "幸福",
            "name2": "幸福",
            content: "当前幸福值为#",
        },
        subSkill: {
            begin: {
                persevereSkill: true,
                trigger: {
                    global: "phaseBefore",
                    player: "enterGame",
                },
                filter(event, player) {
                    return event.name != "phase" || game.phaseNumber == 0;
                },
                forced: true,
                locked: false,
                async content(event, trigger, player) {
                    const num = lib.skill.shuoye_yuqi.beginMarkCount;
                    lib.skill.shuoye_yuqi.addMark(player, num);
                },
            },
            add: {
                audio: "shuoye_yuqi",
                persevereSkill: true,
                trigger: {
                    player: ["useCardAfter", "gainAfter"],
                    source: "damageSource",
                    global: "loseAsyncAfter",
                },
                filter(event, player) {
                    if (player.countMark("shuoye_yuqi") >= lib.skill.shuoye_yuqi.maxMarkCount) return false;
                    if (event.name == "useCard") return true;
                    if (event.name === "damage") return event.num > 0;
                    return event.getg(player).length > 0;
                },
                getIndex(event, player, triggername) {
                    if (event.name === "damage") return event.num;
                    return 1;
                },
                forced: true,
                locked: false,
                async content(event, trigger, player) {
                    let toAdd = ((trigger.name === "useCard") * 2 + (event.triggername === "damageSource") * 10);
                    switch (event.triggername) {
                        case "useCardAfter": toAdd = 2; break;
                        case "damageSource": toAdd = 10; break;
                        default: toAdd = 7; break;
                    }
                    lib.skill.shuoye_yuqi.addMark(player, toAdd);
                },
            },
            remove: {
                audio: "shuoye_yuqi",
                persevereSkill: true,
                trigger: {
                    player: "damageEnd",
                },
                filter(event, player) {
                    return event.num > 0 && player.countMark("shuoye_yuqi");
                },
                getIndex(event, player, triggername) {
                    return event.num;
                },
                forced: true,
                locked: false,
                async content(event, trigger, player) {
                    player.removeMark("shuoye_yuqi", 5);
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_yuqi
//#noname-kit-begin skill:shuoye_weituan
    shuoye_weituan: {
        trigger: {
            player: ["shuoye_yuqi_beginAfter", "shuoye_yuqi_addAfter", "shuoye_yuqi_removeAfter"],
        },
        forced: true,
        popup: false,
        locked: false,
        async content(event, trigger, player) {
            const skills = [];
            const num = player.countMark("shuoye_yuqi");
            if (num >= 10) skills.add("shuoye_dinghan");
            if (num >= 40) skills.add("shuoye_shenxian");
            if (num >= 70) skills.add("shuoye_powei");
            if (num >= 100) skills.add("shuoye_dengshen");
            player.addAdditionalSkill("shuoye_weituan", skills, true);
        },
        onremove(player, skill) {
            player.removeAdditionalSkill(skill);
        },
    },
//#noname-kit-end skill:shuoye_weituan
//#noname-kit-begin skill:shuoye_dinghan
    shuoye_dinghan: {
        trigger: {
            target: "useCardToTarget",
            player: "addJudgeBefore",
        },
        forced: true,
        locked: false,
        filter(event, player) {
            if (event.name == "useCardToTarget" && get.type(event.card, null, false) != "trick") return false;
            return !player.getStorage("shuoye_dinghan").includes(event.card.name);
        },
        content() {
            player.markAuto("shuoye_dinghan", [trigger.card.name]);
            if (trigger.name == "addJudge") {
                trigger.cancel();
                var owner = get.owner(trigger.card);
                if (owner && owner.getCards("hej").includes(trigger.card)) owner.lose(trigger.card, ui.discardPile);
                else game.cardsDiscard(trigger.card);
                game.log(trigger.card, "进入了弃牌堆");
            } else {
                trigger.targets.remove(player);
                trigger.getParent().triggeredTargets2.remove(player);
                trigger.untrigger();
            }
        },
        onremove: true,
        intro: {
            content: "已记录牌名：$",
        },
        group: "shuoye_dinghan_add",
        subSkill: {
            add: {
                trigger: {
                    player: "phaseBegin",
                },
                async cost(event, trigger, player) {
                    var dialog = [get.prompt("shuoye_dinghan")];
                    var list1 = player.getStorage("shuoye_dinghan"),
                        list2 = lib.inpile.filter(function (i) {
                            return get.type2(i, false) == "trick" && !list1.includes(i);
                        })
                    if (list1.length) {
                        dialog.push('<div class="text center">已记录</div>');
                        dialog.push([list1, "vcard"]);
                    }
                    if (list2.length) {
                        dialog.push('<div class="text center">未记录</div>');
                        dialog.push([list2, "vcard"]);
                    }
                    const { bool, links } = await player.chooseButton(dialog)
                        .set("ai", function (button) {
                            var player = _status.event.player,
                                name = button.link[2];
                            if (player.getStorage("shuoye_dinghan").includes(name)) {
                                return -get.effect(player, { name: name }, player, player);
                            } else {
                                return get.effect(player, { name: name }, player, player) * (1 + player.countCards("hs", name));
                            }
                        }).forResult();
                    if (bool) event.result = { bool, cost_data: { links } };
                },
                async content(event, trigger, player) {
                    var name = event.cost_data.links[0][2];
                    if (player.getStorage("shuoye_dinghan").includes(name)) {
                        player.unmarkAuto("shuoye_dinghan", [name]);
                        game.log(player, "从定汉记录中移除了", "#y" + get.translation(name));
                    } else {
                        player.markAuto("shuoye_dinghan", [name]);
                        game.log(player, "向定汉记录中添加了", "#y" + get.translation(name));
                    }
                    await game.delayx();
                    const card = new lib.element.VCard({ name: name });
                    if (player.hasUseTarget(card)) await player.chooseUseTarget(card);
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_dinghan
//#noname-kit-begin skill:shuoye_shenxian
    shuoye_shenxian: {
        trigger: {
            global: ["loseAfter", "loseAsyncAfter"],
        },
        forced: true,
        locked: false,
        filter(event, player) {
            if (event.type != "discard" || event.getlx === false) return false;
            if (event.name == "lose" && event.player == player) return false;
            var cards = event.cards.slice(0);
            var evt = event.getl(player);
            if (evt && evt.cards) cards.removeArray(evt.cards);
            for (var i = 0; i < cards.length; i++) {
                if (get.type(cards[i], null, event.hs && event.hs.includes(cards[i]) ? event.player : false) == "basic" && cards[i].original != "j") {
                    return true;
                }
            }
            return false;
        },
        async content(event, trigger, player) {
            if (trigger.delay == false) await game.delay();
            await player.draw();
        },
        ai: {
            threaten: 1.5,
        },
    },
//#noname-kit-end skill:shuoye_shenxian
//#noname-kit-begin skill:shuoye_powei
    shuoye_powei: {
        trigger: {
            global: "phaseBegin",
        },
        popup: false,
        filter(event, player) {
            return event.player != player && player.countCards("h") > 0;
        },
        async cost(event, trigger, player) {
            var list = [],
                target = trigger.player,
                choiceList = ["弃置一张牌并对其造成1点伤害", "弃置其一张手牌"];
            if (
                player.hasCard(function (card) {
                    return lib.filter.cardDiscardable(card, player, "shuoye_powei");
                }, "he")
            )
                list.push("选项一");
            else choiceList[0] = '<span style="opacity:0.5">' + choiceList[0] + "</span>";
            if (player.hp >= target.hp && target.countCards("h") > 0) list.push("选项二");
            else choiceList[1] = '<span style="opacity:0.5">' + choiceList[1] + "</span>";
            const { control } = await player
                .chooseControl(list, "cancel2")
                .set("prompt", get.prompt(event.skill, target))
                .set("choiceList", choiceList)
                .set("ai", function () {
                    const player = get.player();
                    var evt = get.event().getTrigger();
                    if (
                        player.hasCard(function (card) {
                            return lib.filter.cardDiscardable(card, player, "shuoye_powei") && get.value(card, player) < 7;
                        }, "h") &&
                        get.damageEffect(evt.player, player, player) > 0
                    )
                        return "选项一";
                    if (evt.player.countCards("h") > 0 && get.attitude(player, evt.player) <= 0 && !evt.player.hasSkillTag("noh")) return "选项二";
                    return "cancel2";
                }).forResult();
            if (control != "cancel2") event.result = { bool: true, cost_data: { control } }
        },
        async content(event, trigger, player) {
            const target = trigger.player;
            const control = event.cost_data.control;
            player.logSkill(event.name, target);
            if (control == "选项一") {
                if (player.countCards("h")) await player.chooseToDiscard("he", true);
                await target.damage();
            } else if (trigger.player.countDiscardableCards(player, "he")) {
                await player.discardPlayerCard(target, "he", true)
            }
        },
        ai: {
            expose: 0.2,
        },
    },
//#noname-kit-end skill:shuoye_powei
//#noname-kit-begin skill:shuoye_dengshen
    shuoye_dengshen: {
        audio: "ext:朔夜/audio:1",
        enable: "phaseUse",
        limited: true,
        skillAnimation: true,
        animationColor: "thunder",
        filterCard: () => false,
        selectCard: [-1, -2],
        async contentBefore(event, trigger, player) {
            player.changeSkin({ characterName: "shuoye_fengchuanxiangzi" }, "shuoye_fengchuanxiangzi_shadow");
            player.awakenSkill("shuoye_dengshen");
        },
        async content(event, trigger, player) {
            const cards = ["cardPile", "discardPile"].map(pos => Array.from(ui[pos].childNodes)).flat();
            const filter = card => ["equip2", "equip4"].includes(get.subtype(card));
            const cardx = cards.filter(filter);
            if (cardx.length) {
                await game.cardsGotoSpecial(cardx);
                game.log(cardx, "被移出了游戏");
            }
            for (const target of game.filterPlayer()) {
                const sishis = target.getCards("hej", filter);
                if (sishis.length) {
                    target.$throw(sishis);
                    game.log(sishis, "被移出了游戏");
                    await target.lose(sishis, ui.special);
                }
            }
            await player.changeSkills(["shuoye_taoming"], ["shuoye_weituan"]);
            player.removeMark("shuoye_yuqi", 77);
            // 登神演出：先放《安敢一战》mp4，结束后用它替换原版 BGM，播完自动换回
            try {
                await lib.skill.shuoye_chunai.playVideo("安敢一战.mp4", { keepBgmPaused: true, gain: 1.5 });
                lib.skill.shuoye_chunai.playBgmOnce(player, "skill/shuoye_anganyizhan.mp3");
            } catch (e) {}
        },
        ai: {
            order: 0.1,
            result: {
                player(player) {
                    return 1;
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_dengshen
//#noname-kit-begin skill:shuoye_taoming
    shuoye_taoming: {
        trigger: {
            player: ["shuoye_yuqi_beginAfter", "shuoye_yuqi_addAfter", "shuoye_yuqi_removeAfter", "shuoye_dengshenAfter"],
        },
        forced: true,
        popup: false,
        locked: false,
        async content(event, trigger, player) {
            const skills = [];
            const num = player.countMark("shuoye_yuqi");
            if (num >= 10) skills.add("shuoye_huishi");
            if (num >= 40) skills.add("lianpo");
            if (num >= 70) skills.add("shenzhu");
            if (num >= 100) skills.add("shuoye_shenfen");
            player.addAdditionalSkill("shuoye_taoming", skills);
        },
        onremove(player, skill) {
            player.removeAdditionalSkill(skill);
        },
    },
//#noname-kit-end skill:shuoye_taoming
//#noname-kit-begin skill:shuoye_renou
    shuoye_renou: {
        trigger: {
            global: "phaseBefore",
            player: "enterGame",
        },
        popup: false,
        locked: true,
        zhuSkill: true,
        filter(event, player) {
            if (!player.hasZhuSkill("shuoye_renou")) return false;
            return game.hasPlayer(current => current != player) && (event.name != "phase" || game.phaseNumber == 0);
        },
        async content(event, trigger, player) {
            const targets = game.filterPlayer(target => target.group == player.group);
            for (const target of targets) {
                const { bool } = await target.chooseToGive(player)
                    .set("ai", card => {
                        return 7 - get.value(card);
                    }).forResult();
                if (bool) {
                    await target.draw(2);
                }
            }
        }
    },
//#noname-kit-end skill:shuoye_renou
//#noname-kit-begin skill:shuoye_huishi
    shuoye_huishi: {
        enable: "phaseUse",
        usable: 1,
        frequent: true,
        filter(event, player) {
            return player.maxHp < 10;
        },
        content() {
            "step 0";
            event.cards = [];
            event.suits = [];
            "step 1";
            player
                .judge(function (result) {
                    var evt = _status.event.getParent("shuoye_huishi");
                    if (evt && evt.suits && evt.suits.includes(get.suit(result))) return 0;
                    return 1;
                })
                .set("callback", lib.skill.shuoye_huishi.callback).judge2 = function (result) {
                    return result.bool ? true : false;
                };
            "step 2";
            var cards = cards.filterInD();
            if (cards.length)
                player
                    .chooseTarget("将" + get.translation(cards) + "交给一名角色", true)
                    .set("ai", function (target) {
                        var player = _status.event.player,
                            att = get.attitude(player, target);
                        if (att <= 0) return att;
                        if (target.countCards("h") + _status.event.num >= _status.event.max) att /= 3;
                        if (target.hasSkillTag("nogain")) att /= 10;
                        return att;
                    })
                    .set("num", cards.length)
                    .set(
                        "max",
                        game.filterPlayer().reduce((num, i) => {
                            return Math.max(num, i.countCards("h"));
                        }, 0)
                    );
            else event.finish();
            "step 3";
            if (result.bool) {
                var target = result.targets[0];
                event.target = target;
                player.line(target, "green");
                target.gain(cards, "gain2").giver = player;
            } else event.finish();
            "step 4";
            if (target.isMaxHandcard()) player.loseMaxHp();
        },
        callback() {
            "step 0";
            var evt = event.getParent(2);
            event.getParent().orderingCards.remove(event.judgeResult.card);
            evt.cards.push(event.judgeResult.card);
            if (event.getParent().result.bool && player.maxHp < 10) {
                evt.suits.push(event.getParent().result.suit);
                player.gainMaxHp();
                player.chooseBool("是否继续发动【慧识】？").set("frequentSkill", "shuoye_huishi");
            } else event._result = { bool: false };
            "step 1";
            if (result.bool) event.getParent(2).redo();
        },
        ai: {
            order: 9,
            result: {
                player: 1,
            },
        },
        group: "shuoye_huishi_use",
        subSkill: {
            use: {
                trigger: {
                    player: "shuoye_huishiAfter",
                },
                usable: 1,
                async cost(event, trigger, player) {
                    const list = get.inpileVCardList(info => {
                        var name = info[2];
                        if (!["basic", "trick"].includes(get.type(name))) return false;
                        return player.hasUseTarget({ name: name, isCard: true });
                    });
                    if (!list.length) return;
                    const { bool, links } = await player.chooseButton([get.prompt2(event.skill), [list, "vcard"]])
                        .set("ai", button => {
                            return get.player().getUseValue({ name: button.link[2] });
                        }).forResult();
                    if (bool) event.result = { bool, cost_data: { links } };
                },
                async content(event, trigger, player) {
                    const name = event.cost_data.links[0][2];
                    if (player.countCards("hes")) {
                        await player.chooseToDiscard("hes", 2, true);
                        if (player.hasUseTarget({ name: name, isCard: true })) {
                            await player.chooseUseTarget({ name: name, isCard: true }, true);
                        }
                        await player.useSkill("shuoye_huishi");
                    }
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_huishi
//#noname-kit-begin skill:shuoye_shenfen
    shuoye_shenfen: {
        audio: "ext:朔夜/audio:1",
        enable: "phaseUse",
        usable: 1,
        filterCard: true,
        position: "hes",
        selectCard() {
            return game.countPlayer();
        },
        check(card) {
            return 7 - get.value(card);
        },
        async content(event, trigger, player) {
            const targets = game.filterPlayer(i => i != player);
            for (const target of targets) {
                await target.damage();
            }
            for (const target of targets) {
                if (target.countCards("he", card => get.type(card) == "equip")) {
                    await target.chooseToDiscard("he", card => get.type(card) == "equip", true);
                }
                if (target.countCards("h")) {
                    await target.chooseToDiscard("h");
                }
            }
            const result = await player.chooseTarget("令一名角色一个技能失效直至其下回合结束", true)
                .set("ai", target => {
                    return -get.attitude(get.player(), target);
                }).forResult();
            if (result.bool) {
                const target = result.targets[0];
                const skills = target.getSkills(null, false, false)
                    .filter(skill => {
                        var info = get.info(skill);
                        return info && !info.charlotte && lib.translate[skill + "_info"];
                    });
                if (!skills.length) return;
                const list = skills.map(skill => [skill, '【' + get.translation(skill) + '】：' + lib.translate[skill + '_info']]);
                const { bool, links } = await player.chooseButton([`令${get.translation(target)}的一个技能失效`, [list, 'textbutton']], true)
                    .set('ai', button => {
                        return 1 + Math.random();
                    }).forResult();
                if (bool) {
                    target.disableSkill('shuoye_shenfen_disable', links);
                    target.addTempSkill('shuoye_shenfen_disable', { player: "phaseEnd" });
                }
            }
        },
        ai: {
            order: 1,
            result: {
                player: 1,
            },
        },
        subSkill: {
            disable: {
                charlotte: true,
                onremove(player, skill) {
                    player.enableSkill(skill);
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_shenfen

//#noname-kit-begin skill:shuoye_yuanchu
    shuoye_yuanchu: {
        trigger: {
            target: 'useCardToTarget',
        },
        forced: true,
        locked: false,
        persevereSkill: true,
        filter(event, player) {
            if (event.player == player || typeof get.number(event.card) != 'number') return false;
            return !player.getStorage('shuoye_yuanchu').includes(get.number(event.card));
        },
        async content(event, trigger, player) {
            if (typeof get.number(trigger.card) == 'number') {
                player.markAuto(event.name, [get.number(trigger.card)]);
            }
            trigger.getParent().excluded.add(player);
        },
        mark: true,
        intro: {
            content: '已记录的点数：$',
        },
        group: ['shuoye_yuanchu_damage', 'shuoye_yuanchu_round'],
        subSkill: {
            damage: {
                trigger: {
                    source: 'damageBegin1',
                },
                popup: false,
                persevereSkill: true,
                filter(event, player) {
                    return player.getStorage('shuoye_yuanchu').length;
                },
                async cost(event, trigger, player) {
                    var list = player.getStorage('shuoye_yuanchu')
                        .sort((a, b) => a - b)
                        .map(info => [info, info]);
                    const { bool, links } = await player.chooseButton(['你可以减少一项【原初】记录令伤害+1', [list, 'tdnodes']])
                        .set('ai', button => {
                            return 1 + Math.random();
                        }).forResult();
                    event.result = { bool, cost_data: { links } };
                },
                async content(event, trigger, player) {
                    player.logSkill(event.name);
                    player.unmarkAuto('shuoye_yuanchu', event.cost_data.links);
                    trigger.num++;
                },
            },
            round: {
                persevereSkill: true,
                trigger: {
                    global: 'roundStart',
                },
                forced: true,
                locked: false,
                async content(event, trigger, player) {
                    var hasRecord = player.getStorage('shuoye_yuanchu')
                        .sort((a, b) => a - b),
                        noRecord = Array.from({ length: 13 }, (_, index) => index + 1).removeArray(hasRecord);
                    const { bool, links } = await player.chooseButton(['你须减少或增加一项〖原初〗记录',
                            [hasRecord.map(info => [info, info]), 'tdnodes'],
                            [noRecord.map(info => [info, info]), 'tdnodes'],
                        ])
                        .set('ai', button => {
                            const player = get.player();
                            return 1 + Math.random();
                        }).forResult();
                    if (bool) {
                        if (hasRecord.includes(links[0])) player.unmarkAuto('shuoye_yuanchu', links);
                        else player.markAuto('shuoye_yuanchu', links);
                    }
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_yuanchu
//#noname-kit-begin skill:shuoye_xinghuan
    shuoye_xinghuan: {
        trigger: {
            player: 'phaseUseBegin',
        },
        popup: false,
        locked: false,
        filter(event, player) {
            return player.getStorage('shuoye_yuanchu').length;
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseCard('h')
                .set('prompt', get.prompt2('shuoye_xinghuan'))
                .set('selectCard', () => {
                    const player = get.player();
                    const Max = Math.min(player.maxHp - 1, player.getStorage('shuoye_yuanchu').length)
                    return [1, Max];
                })
                .set('ai', card => {
                    const player = get.player();
                    if (ui.selected.cards.length > player.maxHp) return 0;
                    if (player.hasUseTarget(card) && !player.hasValueTarget(card)) return 0;
                    if (["sha", "shan", "wuxie", "caochuan"].includes(card.name)) return 2 + Math.random();
                    return 1 + Math.random();
                })
                .forResult();
        },
        async content(event, trigger, player) {
            player.logSkill(event.name);
            player.addToExpansion(event.cards).gaintag.add('shuoye_xinghuan');
            player.loseMaxHp(event.cards.length);
        },
        mod: {
            cardUsable(card, player, num) {
                if (card.storage && card.storage.shuoye_shenhe) return Infinity;
            },
        },
        marktext: "环",
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
        onremove(player, skill) {
            const cards = player.getExpansions(skill);
            if (cards.length) player.loseToDiscardpile(cards);
        },
    },
//#noname-kit-end skill:shuoye_xinghuan
//#noname-kit-begin skill:shuoye_shenhe
    shuoye_shenhe: {
        trigger: {
            player: 'logSkillBegin',
        },
        forced: true,
        locked: false,
        filter(event, player) {
            return event.skill == 'shuoye_xinghuan';
        },
        async content(event, trigger, player) {
            const list = lib.inpile.filter(info => {
                return ['basic', 'trick'].includes(get.type({ name: info }));
            }).map(info => ['', '', info, '']);
            const { bool, links } = await player.chooseButton(true, [`你需指定${player.getStorage('shuoye_yuanchu').length}种基本或普通锦囊牌名，然后直到你下次发动【星环】前，你【环】区的牌只能视为这些牌名之中的牌使用或打出`, [list, 'vcard']])
                .set('selectButton', player.getStorage('shuoye_yuanchu').length)
                .set('ai', button => {
                    return get.value({ name: button.link[2] });
                }).forResult();
            if (bool) {
                player.setStorage('shuoye_shenhe', links.map(info => info[2]));
            }
        },
        ai: {
            combo: ['shuoye_yuanchu', 'shuoye_xinghuan'],
        },
        mark: true,
        intro: {
            content: 'cards',
        },
        group: 'shuoye_shenhe_use',
        subSkill: {
            use: {
                enable: ['chooseToUse', 'chooseToRespond'],
                filter(event, player) {
                    if (!player.getExpansions('shuoye_xinghuan').length) return false;
                    return get.inpileVCardList(info => {
                        const name = info[2], type = get.type(name), infox = get.info({ name: name });
                        return ['basic', 'trick'].includes(type) && player.getStorage('shuoye_shenhe').includes(name);
                    }).filter(card => event.filterCard({ name: card[2], nature: card[3], storage: { shuoye_shenhe: true } }, player, event)).length;
                },
                chooseButton: {
                    dialog(event, player) {
                        const list = get.inpileVCardList(info => {
                            const name = info[2], type = get.type(name), infox = get.info({ name: name });
                            return ['basic', 'trick'].includes(type) && player.getStorage('shuoye_shenhe').includes(name);
                        }).filter(card => event.filterCard({ name: card[2], nature: card[3], storage: { shuoye_shenhe: true } }, player, event));
                        const dialog = ui.create.dialog('神核', [list, 'vcard']);
                        dialog.add(player.getExpansions('shuoye_xinghuan'));
                        return dialog;
                    },
                    select: 2,
                    complexSelect: true,
                    filter(button, player) {
                        if (ui.selected.buttons.length) return player.getExpansions('shuoye_xinghuan').includes(button.link);
                        return !player.getExpansions('shuoye_xinghuan').includes(button.link);
                    },
                    check(button) {
                        const player = get.player();
                        if (!ui.selected.buttons.length) {
                            if (player.getExpansions('shuoye_xinghuan').includes(button.link)) return 2;
                            return player.getUseValue({ name: button.link[2], nature: button.link[3] })
                        }
                        return 1;
                    },
                    backup(links, player) {
                        return {
                            filterCard(card, player) {
                                return card == links[1];
                            },
                            selectCard: -1,
                            check(card) {
                                return 1;
                            },
                            position: 'x',
                            viewAs: {
                                name: links[0][2],
                                nature: links[0][3],
                                storage: {
                                    shuoye_shenhe: true,
                                }
                            },
                            async precontent(event, trigger, player) {
                                if (get.info('xunshi').isXunshi(event.result.card)) {
                                    player.tempBanSkill('shuoye_shenhe', false);
                                }
                            },
                        }
                    },
                    prompt(links) {
                        return '将一张【环】当做' + (get.translation(links[0][3]) || '') + get.translation(links[0][2]) + '使用';
                    },
                },
                hiddenCard(player, name) {
                    if (!player.getExpansions('shuoye_xinghuan').length) return false;
                    if (player.isTempBanned('shuoye_shenhe')) return false;
                    return player.getStorage('shuoye_shenhe').includes(name);
                },
                ai: {
                    save: true,
                    respondSha: true,
                    respondShan: true,
                    skillTagFilter(player, tag, arg) {
                        if (!player.getExpansions('shuoye_xinghuan').length) return false;
                        if (player.isTempBanned('shuoye_shenhe')) return false;
                    },
                    order: 2,
                    result: {
                        player(player) {
                            if (_status.event.dying) return get.attitude(player, _status.event.dying);
                            return 1;
                        },
                    },
                },
            },
            use_backup: {},
        },
    },
//#noname-kit-end skill:shuoye_shenhe
//#noname-kit-begin skill:shuoye_shanyao
    shuoye_shanyao: {
        derivation: 'shuoye_huangguan',
        trigger: {
            player: 'phaseBegin',
        },
        forced: true,
        juexingji: true,
        skillAnimation: true,
        animationColor: "gray",
        filter(event, player) {
            return player.maxHp >= 10;
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name);
            player.addSkills('shuoye_huangguan');
        },
        ai: {
            combo: ['shuoye_yuanchu', 'shuoye_xinghuan'],
        },
        group: 'shuoye_shanyao_draw',
        subSkill: {
            draw: {
                trigger: {
                    global: ['useCard', 'respond'],
                },
                forced: true,
                filter(event, player) {
                    return typeof get.number(event.card, false) == "number"
                        && player.getStorage('shuoye_yuanchu').includes(get.number(event.card));
                },
                async content(event, trigger, player) {
                    await player.draw();
                    player.gainMaxHp();
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_shanyao
//#noname-kit-begin skill:shuoye_huangguan
    shuoye_huangguan: {
        locked: true,
        group: ['shuoye_huangguan_limit', 'shuoye_huangguan_use', 'shuoye_huangguan_hujia'],
        subSkill: {
            limit: {
                trigger: {
                    player: "loseAfter",
                    global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
                },
                forced: true,
                popup: false,
                charlotte: true,
                filter(event, player) {
                    var evt = event.getl(player);
                    if (!evt || !evt.hs || evt.hs.length == 0 || player.countCards("h") >= player.getStorage('shuoye_yuanchu').length) return false;
                    var evt = event;
                    for (var i = 0; i < 4; i++) {
                        evt = evt.getParent("shuoye_huangguan_limit");
                        if (evt.name != "shuoye_huangguan_limit") return true;
                    }
                    return false;
                },
                async content(event, trigger, player) {
                    if (player.getStorage('shuoye_yuanchu').length) player.drawTo(player.getStorage('shuoye_yuanchu').length);
                },
            },
            use: {
                trigger: {
                    player: "loseAfter",
                    global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
                },
                direct: true,
                filter(event, player) {
                    const evt = event.getl(player);
                    return evt && evt.player == player && evt.cards2 && evt.cards2.length;
                },
                async content(event, trigger, player) {
                    const { bool } = await player.chooseToUse(function (card) {
                        return lib.filter.cardEnabled(card, _status.event.player, _status.event);
                    })
                        .set('oncard', (card, player) => {
                            player.tempBanSkill('shuoye_huangguan_use', false, false)
                        }).forResult();
                    if (bool) {
                        player.gainMaxHp();
                    }
                },
            },
            hujia: {
                trigger: {
                    player: 'loseMaxHpBegin',
                },
                forced: true,
                async content(event, trigger, player) {
                    player.changeHujia();
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_huangguan

//#noname-kit-begin skill:shuoye_feichi
    shuoye_feichi: {
        trigger: {
            player: ['useCard', 'respond']
        },
        forced: true,
        filter(event, player) {
            return player.getRoundHistory('useSkill', evt => evt.skill == 'shuoye_feichi').length < player.getHp();
        },
        async content(event, trigger, player) {
            let num = player.getAllHistory('useSkill', evt => evt.skill == 'shuoye_ranshao').length + 1,
                cards = [];
            do {
                num--;
                var card = get.cardPile(function (cardx) {
                    if (cards.includes(cardx)) return false;
                    return get.type(cardx) != get.type(trigger.card)
                });
                if (card) cards.push(card);
            } while (num > 0)
            if (cards.length) player.gain(cards, 'draw');
        },
    },
//#noname-kit-end skill:shuoye_feichi
//#noname-kit-begin skill:shuoye_zhuangtian
    shuoye_zhuangtian: {
        trigger: {
            player: "gainAfter",
            global: "loseAsyncAfter",
        },
        usable: 1,
        filter(event, player) {
            const length = player.getAllHistory('useSkill', evt => evt.skill == 'shuoye_ranshao').length * 3 + 3;
            if (
                get.info('shuoye_zhuangtian').group
                    .reduce((p, c) => p + player.getExpansions(c).length, 0) >= length) return false;
            var evt = event.getParent("phaseDraw");
            if (evt && evt.name == "phaseDraw") return false;
            var cards = event.getg(player).filter(i => get.owner(i) == player && get.position(i) == "h");
            if (!cards.length) return false;
            return true;
        },
        async content(event, trigger, player) {
            let gainCards = trigger.getg(player)
                .filter(i => get.owner(i) == player && get.position(i) == "h"),
                num = gainCards.length,
                areas = get.info('shuoye_zhuangtian').group,
                types = ['equip', 'basic', 'trick'],
                translates = ['狙', '手', '步'],
                length = player.getAllHistory('useSkill', evt => evt.skill == 'shuoye_ranshao').length * 3 + 3;
            for (var i = 0; i < 3; i++) {
                if (player.countCards('h', function (card) {
                    return get.type2(card) == types[i];
                })) {
                    const useType = types[i];
                    const cardEvent = player.chooseCard([1, num], function (card) {
                        const evt = this && this.shuoyeZhuangtianType ? this : _status.event;
                        return get.type2(card) == (evt && evt.shuoyeZhuangtianType);
                    });
                    cardEvent.set('shuoyeZhuangtianType', useType);
                    cardEvent.set('prompt', `你可以将${get.translation(useType)}手牌置入${get.translation(translates[i])}区域`);
                    cardEvent.set('ai', card => {
                        return 6.5 - get.value(card);
                    });
                    const { bool, cards } = await cardEvent.forResult();
                    if (bool) {
                        player.addToExpansion(cards, player, "gain2").gaintag.add(areas[i]);
                        num -= cards.length;
                        if (num <= 0 || areas.reduce((p, c) => p + player.getExpansions(c).length, 0) >= length) break;
                    }
                }
            }
        },
        group: ['shuoye_zhuangtian_ju', 'shuoye_zhuangtian_shou', 'shuoye_zhuangtian_bu'],
        subSkill: {
            ju: {
                mark: true,
                marktext: '狙',
                intro: {
                    name: "狙",
                    content: "expansion",
                    markcount: "expansion",
                },
                onremove(player, skill) {
                    var cards = player.getExpansions(skill);
                    if (cards.length) player.loseToDiscardpile(cards);
                },
            },
            shou: {
                mark: true,
                marktext: '手',
                intro: {
                    name: "手",
                    content: "expansion",
                    markcount: "expansion",
                },
                onremove(player, skill) {
                    var cards = player.getExpansions(skill);
                    if (cards.length) player.loseToDiscardpile(cards);
                },
            },
            bu: {
                mark: true,
                marktext: '步',
                intro: {
                    name: "步",
                    content: "expansion",
                    markcount: "expansion",
                },
                onremove(player, skill) {
                    var cards = player.getExpansions(skill);
                    if (cards.length) player.loseToDiscardpile(cards);
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_zhuangtian
//#noname-kit-begin skill:shuoye_yuedan
    shuoye_yuedan: {
        mod: {
            targetInRange(card, player, target) {
                if (card.storage && card.storage.shuoye_zhuangtian_ju) return true;
            },
            cardUsable(card, player, num) {
                if (card.storage && card.storage.shuoye_zhuangtian_bu) return Infinity;
            },
        },
        trigger: {
            source: 'damageBegin',
            player: ['phaseUseBegin', 'damageBegin'],
        },
        forced: true,
        async content(event, trigger, player) { },
        ai: {
            combo: 'shuoye_zhuangtian',
        },
        backups: [
            {
                viewAs: {
                    name: 'sha',
                    nature: "fire",
                    storage: {
                        shuoye_zhuangtian_ju: true,
                    }
                },
                selectTarget: 1,
                async precontent(event, trigger, player) {
                    var targets = event.result.targets,
                        cards = event.result.cards,
                        num = event.result.cards.length;
                    for (var target of targets) {
                        target.addTempSkill("fengyin");
                    }
                    var viewAs = new lib.element.VCard({ name: event.result.card.name, isCard: true });
                    event.result.card = viewAs;
                    event.result.cards = [];
                    event.result._apply_args = {
                        shanReq: 2,
                        oncard: () => {
                            _status.event.baseDamage += num;
                            var evt = get.event();
                            for (var target of game.filterPlayer(null, null, true)) {
                                var id = target.playerid;
                                var map = evt.customArgs;
                                if (!map[id]) map[id] = {};
                                map[id].shanRequired = evt.shanReq;
                            }
                            _status.event.player.loseToDiscardpile(cards);
                        },
                    };
                },
            },
            {
                viewAs: {
                    name: 'sha',
                    storage: {
                        shuoye_yuedan_shou: true,
                    },
                },
                async precontent(event, trigger, player) {
                    player.when('useCard')
                        .filter(event => event.card.storage && event.card.storage.shuoye_yuedan_shou)
                        .then(() => {
                            player.addSkill('shuoye_yuedan_shou');
                            player.draw(num).gaintag = ["shuoye_yuedan_shou"];
                        })
                        .vars({ num: event.result.cards.length })
                    player.loseToDiscardpile(event.result.cards);
                    event.result.cards = [];
                },
            },
            {
                filterTarget(card, player, target) {
                    return player.canUse({ name: 'sha', nature: 'thunder' }, target);
                },
                async content(event, trigger, player) {
                    const target = event.targets[0];
                    let effectCount = event.cards.length;
                    do {
                        const { bool } = await player.chooseUseTarget({ name: 'sha', nature: 'thunder', storage: { shuoye_zhuangtian_bu: true } }, false).forResult();
                        if (!bool) {
                            if (game.hasPlayer(function (current) {
                                return current.countDiscardableCards(player, 'hej');
                            })) {
                                do {
                                    effectCount--;
                                    const result = await player.chooseTarget(`弃置一名角色区域内的一张牌`, function (card, player, target) {
                                        return target.countDiscardableCards(player, 'hej');
                                    }).forResult();
                                    if (result.bool) {
                                        await player.discardPlayerCard(result.targets[0], 'hej', true);
                                    }
                                } while (effectCount > 0)
                            } else break;
                        } else effectCount--;
                    } while (effectCount > 0);
                },
                ai: {
                    result: {
                        target(player, target) {
                            return get.effect(target, { name: 'sha', nature: 'thunder', player, player });
                        },
                    },
                },
            },
        ],
        group: ['shuoye_yuedan_use', 'shuoye_yuedan_lose', 'shuoye_yuedan_mark'],
        subSkill: {
            use: {
                enable: 'chooseToUse',
                filter(event, player) {
                    return get.info('shuoye_zhuangtian').group.some(info => {
                        return player.getExpansions(info).length && player.getExpansions(info).some(cards => {
                            const card = { name: 'sha', storage: {} };
                            card.storage[info] = true;
                            const sha = new lib.element.VCard(card);
                            return event.filterCard(get.autoViewAs(card, cards, "unsure"), player, event);
                        });
                    });
                },
                chooseButton: {
                    dialog(event, player) {
                        const dialog = ui.create.dialog('约弹');
                        if (player.getExpansions('shuoye_zhuangtian_ju').length) {
                            dialog.add('狙区域');
                            dialog.add(player.getExpansions('shuoye_zhuangtian_ju'));
                        }
                        if (player.getExpansions('shuoye_zhuangtian_shou').length) {
                            dialog.add('手区域');
                            dialog.add(player.getExpansions('shuoye_zhuangtian_shou'));
                        }
                        if (player.getExpansions('shuoye_zhuangtian_bu').length) {
                            dialog.add('步区域');
                            dialog.add(player.getExpansions('shuoye_zhuangtian_bu'));
                        }
                        return dialog;
                    },
                    select: [1, Infinity],
                    filter(button, player) {
                        if (ui.selected.buttons.length) {
                            const ownarea = ['shuoye_zhuangtian_ju', 'shuoye_zhuangtian_shou', 'shuoye_zhuangtian_bu'].find(area => {
                                return player.getExpansions(area).includes(ui.selected.buttons[0].link);
                            });
                            return player.getExpansions(ownarea).includes(button.link);
                        }
                        const own = ['shuoye_zhuangtian_ju', 'shuoye_zhuangtian_shou', 'shuoye_zhuangtian_bu'].find(area => {
                            return player.getExpansions(area).includes(button.link);
                        });
                        let vcard = {};
                        vcard.name = 'sha';
                        if (!vcard.storage) vcard.storage = {};
                        vcard.storage[own] = true;
                        return player.hasUseTarget(vcard, true, true);
                    },
                    check(button) {
                        const player = get.player();
                        let eff = 1;
                        if (!ui.selected.buttons.length) {
                            let ownarea = ['shuoye_zhuangtian_ju', 'shuoye_zhuangtian_shou', 'shuoye_zhuangtian_bu'].find(area => {
                                return player.getExpansions(area).includes(button.link);
                            });
                            switch (ownarea) {
                                case 'shuoye_zhuangtian_ju': {
                                    eff += player.getUseValue({ name: 'sha', nature: 'fire' }) + Math.random();
                                }
                                    break;
                                case 'shuoye_zhuangtian_shou': {
                                    eff += player.getUseValue({ name: 'sha' }) + get.effect(player, { name: "draw" }, player, player) * Math.sqrt(player.getExpansions('shuoye_zhuangtian_shou').length);
                                }
                                    break;
                                case 'shuoye_zhuangtian_bu': {
                                    eff += player.getUseValue({ name: 'sha', nature: 'thunder' }) + Math.random();
                                }
                                    break;
                            }
                            if (!player.getStorage('shuoye_yuedan_mark').includes(ownarea)) eff += 10;
                        }
                        return eff;
                    },
                    backup(links, player) {
                        let zhuangtianArea = ['shuoye_zhuangtian_ju', 'shuoye_zhuangtian_shou', 'shuoye_zhuangtian_bu'];
                        let index = zhuangtianArea.find(area => {
                            return player.getExpansions(area).includes(links[0]);
                        });
                        const next = get.copy(lib.skill.shuoye_yuedan.backups[zhuangtianArea.indexOf(index)]);
                        next.filterCard = function (card) {
                            return links.includes(card);
                        };
                        next.selectCard = -1;
                        next.position = 'x';
                        return next;
                    },
                    prompt(links, player) {
                        const zhuangtianArea = ['shuoye_zhuangtian_ju', 'shuoye_zhuangtian_shou', 'shuoye_zhuangtian_bu'];
                        const index = zhuangtianArea.find(area => {
                            return player.getExpansions(area).includes(links[0]);
                        });
                        return [
                            '你可以弃置X张【狙】内的牌，令一名角色本回合内非锁定技失效，然后视为对其使用一张无视距离限制，需要两张【闪】才可响应且基础伤害值+X的火【杀】。',
                            '你可以弃置Y张【手】内的牌，视为使用一张【杀】并摸Y张牌，以此法摸的牌不计入手牌上限。',
                            '你可以弃置Z张【步】内的牌，视为对目标使用一张无次数限制的雷【杀】重复该流程Z次。若中止流程，则改为用剩余的次数重复弃置场上任意一名角色区内的一张牌。'
                        ][zhuangtianArea.indexOf(index)];
                    },
                },
                hiddenCard(player, name) {
                    return name == 'sha';
                },
                ai: {
                    respondSha: true,
                    skillTagFilter: (player, tag, arg) => {
                        if (tag == "respondSha" && arg != "use") return false;
                    },
                    order() {
                        return get.order({ name: 'sha' }) + 0.1;
                    },
                    result: {
                        player(player) {
                            return 1;
                        },
                    },
                },
            },
            use_backup: {},
            lose: {
                trigger: {
                    player: "loseAfter",
                },
                locked: true,
                filter(event, player) {
                    if (!event._shuoye_yuedan_lose) return false;
                    if (!event.xs || !event.xs.length) return false;
                    for (var i in event.gaintag_map) {
                        if (['shuoye_zhuangtian_ju', 'shuoye_zhuangtian_shou', 'shuoye_zhuangtian_bu']
                            .some(info => event.gaintag_map[i].includes(info))) return true;
                        return false;
                    }
                },
                prompt2: `当你每个区域均弃置过一轮牌后，你可以增加一点体力上限，然后选择恢复一点体力或视为使用任意普通锦囊牌`,
                async content(event, trigger, player) {
                    await player.gainMaxHp();
                    const { control } = await player.chooseControl('回复1点体力', '视为使用普通锦囊牌')
                        .set('ai', () => {
                            if (player.getHp() <= 2 && get.recoverEffect(player, player, player) > 0) return '回复1点体力';
                            return '视为使用普通锦囊牌';
                        }).forResult();
                    if (control == '回复1点体力') {
                        player.recover();
                    } else {
                        const list = get.inpileVCardList(info => {
                            const name = info[2], type = get.type(name), infox = get.info({ name: name });
                            return type == 'trick';
                        });
                        const chooseEvent = player.chooseButton([[list, 'vcard']]);
                        chooseEvent.set('filterButton', function (button) {
                            const p = _status.event && _status.event.player;
                            return !!p && p.hasUseTarget({ name: button.link[2] });
                        });
                        chooseEvent.set('ai', function (button) {
                            const p = _status.event && _status.event.player;
                            return p ? p.getUseValue({ name: button.link[2] }) : 0;
                        });
                        const { bool, links } = await chooseEvent.forResult();
                        if (bool) {
                            player.chooseUseTarget({ name: links[0][2], isCard: true }, true);
                        }
                    }
                },
            },
            mark: {
                trigger: {
                    player: "loseAfter",
                },
                forced: true,
                popup: false,
                charlotte: true,
                firstDo: true,
                filter(event, player) {
                    if (!event.xs || !event.xs.length) return false;
                    for (var i in event.gaintag_map) {
                        if (['shuoye_zhuangtian_ju', 'shuoye_zhuangtian_shou', 'shuoye_zhuangtian_bu'].some(info => event.gaintag_map[i].includes(info))) return true;
                        return false;
                    }
                },
                async content(event, trigger, player) {
                    for (var i in trigger.gaintag_map) {
                        ['shuoye_zhuangtian_ju', 'shuoye_zhuangtian_shou', 'shuoye_zhuangtian_bu'].forEach(info => {
                            if (trigger.gaintag_map[i].includes(info)) player.markAuto('shuoye_yuedan_mark', info)
                        });
                    }
                    if (player.getStorage('shuoye_yuedan_mark').length >= 3) {
                        trigger._shuoye_yuedan_lose = true;
                        delete player.storage.shuoye_yuedan_mark;
                    }
                },
            },
            ju: {},
            bu: {},
            shou: {
                charlotte: true,
                mod: {
                    ignoredHandcard(card, player) {
                        if (card.hasGaintag('shuoye_yuedan_shou')) {
                            return true;
                        }
                    },
                    cardDiscardable(card, player, name) {
                        if (name == "phaseDiscard" && card.hasGaintag('shuoye_yuedan_shou')) return false;
                    },
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_yuedan
//#noname-kit-begin skill:shuoye_ranshao
    shuoye_ranshao: {
        trigger: {
            source: 'dieAfter',
        },
        forced: true,
        async content(event, trigger, player) { },
        ai: {
            combo: ['shuoye_zhuangtian', 'shuoye_feichi'],
        },
    },
//#noname-kit-end skill:shuoye_ranshao

//#noname-kit-begin skill:shuoye_tuji
    "shuoye_tuji": {
        trigger: {
            player: "useCard",
        },
        forced: true,
        filter(event, player) {
            return player.getHistory("useCard").length <= player.hujia;
        },
        async content(event, trigger, player) {
            trigger.directHit.addArray(game.filterPlayer());
            player.when('useCardAfter')
                .filter((event) => event.card == trigger.card)
                .then(() => {
                    if (player.hasHistory('sourceDamage', evt => evt.card == trigger.card)) {
                        event.finish();
                        return;
                    }
                    const list = [], cards = trigger.cards.filterInD();
                    event.cards = cards;
                    list.push('选项一');
                    if (trigger.cards.filterInD().length && get.type(trigger.card) != 'equip') list.push('选项二');
                    game.playAudio('..', 'extension/朔夜/audio/shuoye_tuji_chooseControl.mp3');
                    player.chooseControl(list, 'cancel2').set('choiceList', [
                        `摸两张牌`,
                        `${cards.length ? ('获得' + get.translation(cards)) : '无实体牌'}`,
                    ]).set('ai', () => {
                        const player = get.player();
                        if (cards.length > 1 && cards.some(function (card) {
                            return player.hasUseTarget(card);
                        }) && Math.random() <= (0.1 + (cards.length * 0.2))) return '选项二';
                        return '选项一';
                    }).set('prompt', `你可以选择一项`);
                })
                .then(() => {
                    if (result.control != 'cancel2') {
                        if (result.control == '选项一') {
                            player.draw(2);
                        } else {
                            if (event.cards.length) player.gain(event.cards, 'gain2');
                        }
                    }
                })
        },
        ai: {
            threaten: 1.5,
            "directHit_ai": true,
            skillTagFilter: function (player, tag, arg) {
                return (player.storage.shuoye_tuji_used || 0) < player.hujia;
            },
        },
        init(player) {
            player.storage.shuoye_tuji_used = 0;
        },
        group: ["shuoye_tuji_count"],
        subSkill: {
            count: {
                forced: true,
                locked: false,
                silent: true,
                trigger: {
                    player: "useCardAfter",
                    global: "phaseBegin",
                },
                content: function (event, trigger, player) {
                    if (trigger.name == "useCard") {
                        player.storage.shuoye_tuji_used = (player.storage.shuoye_tuji_used || 0) + 1;
                    } else if (trigger.name == "phase" && trigger.phase == "phaseBegin") {
                        player.storage.shuoye_tuji_used = 0;
                    }
                    player.markSkill("shuoye_tuji_used");
                },
            },
        },
        mod: {
            maxHandcardFinal(player, num) {
                return player.hp + player.hujia;
            },
            targetInRange: function (card, player) {
                if ((player.storage.shuoye_tuji_used || 0) < player.hujia) return true;
            },
            cardUsable: function (card, player) {
                if ((player.storage.shuoye_tuji_used || 0) < player.hujia) return Infinity;
            },
            aiOrder: function (player, card, num) {
                if ((player.storage.shuoye_tuji_used || 0) >= player.hujia) return;
                var numx = get.info(card).usable;
                if (typeof numx == "function") numx = num(card, player);
                if (typeof numx == "number") return num + 10;
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_tuji
//#noname-kit-begin skill:shuoye_chouyan
    shuoye_chouyan: {
        trigger: {
            player: ["damageBefore", "damageBegin"],
        },
        forced: true,
        onremove: true,
        filter(event, player, name) {
            if (name == 'damageBefore') return event.hasNature('fire');
            return event.card && !player.getStorage('shuoye_chouyan').includes(event.card.name);
        },
        async content(event, trigger, player) {
            if (event.triggername == 'damageBefore') {
                trigger.cancel();
                player.loseHp(trigger.num);
            } else {
                game.playAudio('..', 'extension/朔夜/audio/shuoye_chouyan_markAuto.mp3');
                player.markAuto(event.name, [trigger.card.name]);
            }
        },
        marktext: "仇",
        intro: {
            mark(dialog, storage, player) {
                dialog.addAuto([storage.map(info => ['', '', info]), 'vcard']);
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_chouyan
//#noname-kit-begin skill:shuoye_molong
    "shuoye_molong": {
        audio: "ext:朔夜/audio:1",
        enable: ["chooseToUse", "chooseToRespond"],
        filter: function (event, player) {
            if (!player.hujia) return false;
            for (var i of player.getStorage('shuoye_chouyan')) {
                var type = get.type2(i);
                if ((type == "basic" || type == "trick") && event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event)) return true;
            }
            return false;
        },
        chooseButton: {
            dialog: function (event, player) {
                var list = [];
                for (var name of player.getStorage('shuoye_chouyan')) {
                    if (name == "sha") {
                        if (event.filterCard(get.autoViewAs({ name }, "unsure"), player, event)) list.push(["基本", "", "sha"]);
                        for (var nature of lib.inpile_nature) {
                            if (event.filterCard(get.autoViewAs({ name, nature }, "unsure"), player, event)) list.push(["基本", "", "sha", nature]);
                        }
                    } else if (get.type2(name) == "trick" && event.filterCard(get.autoViewAs({ name }, "unsure"), player, event)) list.push(["锦囊", "", name]);
                    else if (get.type(name) == "basic" && event.filterCard(get.autoViewAs({ name }, "unsure"), player, event)) list.push(["基本", "", name]);
                }
                return ui.create.dialog("仇焰", [list, "vcard"]);
            },
            check: function (button) {
                if (_status.event.getParent().type != "phase") return 1;
                var player = _status.event.player;
                if (["wugu", "zhulu_card", "yiyi", "lulitongxin", "lianjunshengyan", "diaohulishan"].includes(button.link[2])) return 0;
                return player.getUseValue({
                    name: button.link[2],
                    nature: button.link[3],
                });
            },
            backup: function (links, player) {
                return {
                    filterCard: () => false,
                    selectCard: -1,
                    viewAs: { name: links[0][2], nature: links[0][3] },
                    precontent: function () {
                        player.changeHujia(-1);
                        player.unmarkAuto('shuoye_chouyan', [event.result.card.name])
                    },
                };
            },
            prompt: function (links, player) {
                return "移除1点护甲视为使用一张" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]);
            },
        },
        hiddenCard: function (player, name) {
            if (!lib.inpile.includes(name)) return false;
            var type = get.type2(name);
            return (type == "basic" || type == "trick") && player.getStorage('shuoye_chouyan').includes(name) && player.hujia;
        },
        ai: {
            combo: "shuoye_chouyan",
            fireAttack: true,
            respondSha: true,
            respondShan: true,
            skillTagFilter: function (player) {
                if (!player.hujia) return false;
            },
            order: 1,
            result: {
                player: function (player) {
                    if (_status.event.dying) return get.attitude(player, _status.event.dying);
                    return 1;
                },
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_molong
//#noname-kit-begin skill:shuoye_nupao
    "shuoye_nupao": {
        enable: "phaseUse",
        usable: 1,
        async content(event, trigger, player) {
            const shas = player.getCards("h", "sha");
            let num;
            if (player.hp >= 4 && shas.length >= 3) {
                num = 3;
            } else if (player.hp >= 3 && shas.length >= 2) {
                num = 2;
            } else {
                num = 1;
            }
            const map = {};
            const list = [];
            for (let i = 1; i <= player.hp; i++) {
                const cn = get.cnNumber(i, true);
                map[cn] = i;
                list.push(cn);
            }
            player.storage.qimou = true;
            const result = await player
                .chooseControl(list, function () {
                    return get.cnNumber(_status.event.goon, true);
                })
                .set("prompt", "失去任意点体力")
                .set("goon", num)
                .forResult();
            num = map[result.control] || 1;
            await player.loseHp(num);
        },
        group: "shuoye_nupao_losehp",
        ai: {
            order: 1,
            result: {
                player(player) {
                    if (player.getHp() + player.countCards("hs", card => player.canSaveCard(card, player)) <= 1) return 0;
                    return 1;
                },
            },
        },
        subSkill: {
            losehp: {
                trigger: {
                    player: "loseHpBegin",
                },
                direct: true,
                async content(event, trigger, player) {
                    const list = [];
                    list.push('选项一');
                    if (!player.hasSkill('shuoye_nupao_round')) list.push('选项二');
                    const { control } = await player.chooseControl(list, 'cancel2').set('choiceList', [
                        `记录“仇焰”${trigger.num}张未记录的牌名，然后增加两倍护甲`,
                        `每轮限一次，随机清除“仇焰”${trigger.num}张已记录的牌名，并对一名角色造成${trigger.num * 2}点火焰伤害`,
                    ]).set('shuoyeOption2', list.includes('选项二')).set('ai', () => {
                        const player = get.player();
                        if (get.event().shuoyeOption2 && game.hasPlayer(function (current) {
                            return get.attitude(player, current) < 0 && get.damageEffect(current, player, player, 'fire') > 0
                        })) return '选项二';
                        return '选项一';
                    }).set('prompt', `你可以选择一项`).forResult();
                    if (control != 'cancel2') {
                        player.logSkill(event.name);
                        if (control == '选项一') {
                            const list = lib.inpile.filter(info => ['basic', 'trick'].includes(get.type({ name: info }))).map(info => ['', '', info]);
                            const next = player
                                .chooseButton(['记录“仇焰”', [list, 'vcard']])
                                .set('filterButton', button => {
                                    const player2 = get.player();
                                    return !player2.getStorage('shuoye_chouyan').includes(button.link[2]);
                                })
                                .set('selectButton', trigger.num)
                                .set('ai', button => {
                                    const player2 = get.player();
                                    return player2.getUseValue({ name: button.link[2] });
                                });
                            const { bool, links } = await next.forResult();
                            if (bool) {
                                player.logSkill(event.name);
                                player.markAuto('shuoye_chouyan', links.map(info => info[2]));
                            }
                            player.changeHujia(trigger.num * 2);
                        }
                        else {
                            game.playAudio('..', 'extension/朔夜/audio/shuoye_nupao_chooseControl_damage.mp3');
                            player.addTempSkill('shuoye_nupao_round', 'roundStart');
                            const random = player.getStorage('shuoye_chouyan').randomGets(trigger.num);
                            player.unmarkAuto('shuoye_chouyan', random);
                            const { bool, targets } = await player.chooseTarget(true, `对一名角色造成${trigger.num * 2}点伤害`).set('ai', target => {
                                return get.damageEffect(target, player, player, 'fire');
                            }).forResult();
                            if (bool) {
                                player.line(targets, 'fire');
                                targets[0].damage('fire', trigger.num * 2);
                            }
                        }
                    }
                },
                sub: true,
                "_priority": 0,
            },
            round: {
                charlotte: true,
                sub: true,
                "_priority": 0,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_nupao

//#noname-kit-begin skill:shuoye_diedai
    shuoye_diedai: {
        derivation: "shuoye_geming",
        trigger: {
            global: "damageEnd",
        },
        getLimit: 5,
        forced: true,
        dutySkill: true,
        getIndex(event, player) {
            let num = 0, limit = get.info('shuoye_diedai').getLimit;
            game.countPlayer2(function (current) {
                current.getAllHistory("damage", function (evt) {
                    num += evt.num;
                });
            });
            return Math.floor(num / limit) - player.getAllHistory('useSkill', evt => evt.skill == 'shuoye_diedai').length;
        },
        filter(event, player) {
            let num = 0, limit = get.info('shuoye_diedai').getLimit;
            game.countPlayer2(function (current) {
                current.getAllHistory("damage", function (evt) {
                    num += evt.num;
                });
            });
            return num / limit >= player.getAllHistory('useSkill', evt => evt.skill == 'shuoye_diedai').length;
        },
        async content(event, trigger, player) {
            player.draw();
            player.gainMaxHp();
            player.addSkill('shuoye_diedai_effect');
            player.addMark('shuoye_diedai_effect', 1, false);
            game.broadcastAll(p => {
                try {
                    if (typeof game.playshuoyeMP4 === "function") {
                        game.playshuoyeMP4("diedai", false, false, p);
                    }
                } catch (e) {}
            }, player);
        },
        group: ["shuoye_diedai_init", "shuoye_diedai_achieve", "shuoye_diedai_fail"],
        subSkill: {
            achieve: {
                trigger: {
                    player: "shuoye_diedaiAfter",
                },
                forced: true,
                skillAnimation: "legend",
                animationColor: "epic",
                filter(event, player) {
                    return player.getAllHistory('useSkill', evt => evt.skill == 'shuoye_diedai').length >= 3;
                },
                async content(event, trigger, player) {
                    player.awakenSkill('shuoye_diedai');
                    game.log(player, '成功完成使命');
                    player.recover();
                    player.addSkills('shuoye_geming');
                },
            },
            fail: {
                trigger: {
                    player: "dying",
                },
                forced: true,
                async content(event, trigger, player) {
                    player.awakenSkill('shuoye_diedai');
                    game.log(player, '使命失败');
                },
            },
            init: {
                trigger: {
                    global: "phaseBefore",
                    player: "enterGame",
                },
                forced: true,
                locked: false,
                filter(event, player) {
                    return (event.name != "phase" || game.phaseNumber == 0) && game.countPlayer() <= 5;
                },
                async content(event, trigger, player) {
                    lib.skill.shuoye_diedai.getLimit = 3;
                },
            },
            effect: {
                onremove: true,
                mod: {
                    maxHandcard(player, num) {
                        return num + player.countMark("shuoye_diedai_effect");
                    },
                    cardUsable(card, player, num) {
                        if (card.name == "sha") return num + player.countMark("shuoye_diedai_effect");
                    },
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_diedai
//#noname-kit-begin skill:shuoye_geming
    shuoye_geming: {
        trigger: {
            player: "useCardToPlayer",
        },
        popup: false,
        filter(event, player) {
            if (player.getHistory('useSkill', evt => evt.skill == 'shuoye_geming').length >= player.getAllHistory('useSkill', evt => evt.skill == 'shuoye_diedai').length) return false;
            return event.target != player;
        },
        async cost(event, trigger, player) {
            event.result = await player.chooseTarget(`你可以令一名角色交给你一张牌或令其本回合非锁定技失效并受到1点火焰伤害`, function (card, player, target) {
                return get.event().getTrigger().targets.includes(target);
            })
                .set('ai', target => {
                    return - get.attitude(player, target);
                })
                .forResult();
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            player.logSkill(event.name, target);
            const { bool, cards } = await target.chooseCard('he', `将一张牌交给${get.translation(player)}，否则你本回合非锁定技失效并受到1点火焰伤害`)
                .set('ai', card => {
                    if (get.damageEffect(target, player, player, 'fire') <= 0) return 0;
                    return 20 - get.value(card);
                }).forResult();
            if (bool) {
                await target.give(cards, player);
                player.addGaintag(cards, 'shuoye_geming');
            } else {
                target.addTempSkill('fengyin');
                target.damage('fire');
            }
        },
        group: "shuoye_geming_use",
        subSkill: {
            use: {
                enable: ["chooseToUse", "chooseToRespond"],
                filter(event, player) {
                    for (var i of lib.inpile) {
                        var type = get.type2(i);
                        if (event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event) && player.countCards('h', function (card) {
                            return card.hasGaintag('shuoye_geming') && get.type2(card, false) == type;
                        })) return true;
                    }
                    return false;
                },
                chooseButton: {
                    dialog(event, player) {
                        var list = [];
                        for (var i = 0; i < lib.inpile.length; i++) {
                            var name = lib.inpile[i];
                            if (name == "sha") {
                                if (event.filterCard(get.autoViewAs({ name }, "unsure"), player, event)) list.push(["基本", "", "sha"]);
                                for (var nature of lib.inpile_nature) {
                                    if (event.filterCard(get.autoViewAs({ name, nature }, "unsure"), player, event)) list.push(["基本", "", "sha", nature]);
                                }
                            } else if (get.type2(name) == "trick" && event.filterCard(get.autoViewAs({ name }, "unsure"), player, event)) list.push(["锦囊", "", name]);
                            else if (get.type2(name) == "equip" && event.filterCard(get.autoViewAs({ name }, "unsure"), player, event)) list.push(["装备", "", name]);
                            else if (get.type(name) == "basic" && event.filterCard(get.autoViewAs({ name }, "unsure"), player, event)) list.push(["基本", "", name]);
                        }
                        return ui.create.dialog("革命", [list, "vcard"]);
                    },
                    filter(button, player) {
                        if (!player.countCards('h', function (card) {
                            return card.hasGaintag('shuoye_geming') && get.type2(card) == get.type2(button.link[2]);
                        })) return false;
                        return _status.event.getParent().filterCard({ name: button.link[2] }, player, _status.event.getParent());
                    },
                    check(button) {
                        if (_status.event.getParent().type != "phase") return 1;
                        var player = _status.event.player;
                        return player.getUseValue({
                            name: button.link[2],
                            nature: button.link[3],
                        });
                    },
                    backup(links, player) {
                        return {
                            filterCard(card) {
                                return get.type2(card) == get.type2({ name: links[0][2] }) && card.hasGaintag('shuoye_geming');
                            },
                            check(card) {
                                return 8 - get.value(card);
                            },
                            viewAs: {
                                name: links[0][2],
                                nature: links[0][3]
                            },
                        };
                    },
                    prompt(links, player) {
                        return "将一张牌当做" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]) + "使用";
                    },
                },
                hiddenCard(player, name) {
                    if (!lib.inpile.includes(name)) return false;
                    var type = get.type2(name);
                    return (type == "basic" || type == "trick") && player.countCards("h", function (card) {
                        return card.hasGaintag('shuoye_geming') && get.type2(card, false) == type;
                    }) > 0;
                },
                ai: {
                    fireAttack: true,
                    respondSha: true,
                    respondShan: true,
                    skillTagFilter: function (player) {
                        if (!player.countCards("h", function (card) {
                            return card.hasGaintag('shuoye_geming') && get.type2(card, false) == 'basic';
                        })) return false;
                    },
                    order: 1,
                    result: {
                        player: function (player) {
                            if (_status.event.dying) return get.attitude(player, _status.event.dying);
                            return 1;
                        },
                    },
                },
                sub: true,
                "_priority": 0,
            },
            "use_backup": {
                sub: true,
                "_priority": 0,
            },
            equip: {
                trigger: {
                    player: "equipBegin",
                },
                forced: true,
                firstDo: true,
                charlotte: true,
                filter(event, player) {
                    return event.cards && event.cards[0].initName;
                },
                async content(event, trigger, player) {
                    trigger.cards[0].init(trigger.cards[0].initName);
                    trigger.cancel();
                    player.$equip(trigger.cards[0]);
                    game.addVideo('equip', player, get.cardInfo(trigger.cards[0]));
                    game.log(player, '装备了', trigger.card);
                    await game.asyncDelay();
                    var info = get.info(trigger.card);
                    if (info.onEquip && (!info.filterEquip || info.filterEquip(trigger.cards[0], player))) {
                        var next = game.createEvent('equip_' + trigger.cards[0].name);
                        next.setContent(info.onEquip);
                        next.player = player;
                        next.card = trigger.cards[0];
                    }
                    delete player.equiping;
                },
                sub: true,
                "_priority": 0,
            },
            destroy: {
                trigger: {
                    global: ["loseAfter", "cardsDiscardAfter", "equipAfter"],
                },
                firstDo: true,
                forcedDie: true,
                forced: true,
                silent: true,
                popup: false,
                filter(event, player) {
                    return event.getd().some(card => card.trueName);
                },
                async content(event, trigger, player) {
                    for (var card of trigger.cards) {
                        if (card.trueName) {
                            card.init([get.suit(card, false), get.number(card, false), card.trueName]);
                            delete card.initName;
                            delete card.trueName;
                        }
                    }
                },
                sub: true,
                "_priority": 1,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_geming
//#noname-kit-begin skill:shuoye_shouheng
    "shuoye_shouheng": {
        trigger: {
            global: ["dying", "dieAfter"],
        },
        forced: true,
        async content(event, trigger, player) {
            player.addMark('shuoye_shouheng', 1, false);
            game.log(player, '储存了一层', '#g“电能”');
        },
        marktext: "电能",
        intro: {
            name: "电能",
            content: "#",
        },
        group: ["shuoye_shouheng_phase", "shuoye_shouheng_damage"],
        subSkill: {
            phase: {
                trigger: {
                    global: "phaseEnd",
                },
                locked: true,
                filter(event, player) {
                    return player.countMark('shuoye_shouheng') >= 2;
                },
                "prompt2": () => `你可以减少两层“电能”，摸一张牌并执行一个额外回合`,
                async content(event, trigger, player) {
                    player.removeMark('shuoye_shouheng', 2, false);
                    game.log(player, '移除了两层', '#g“电能”');
                    await player.draw();
                    player.insertPhase();
                },
                sub: true,
                "_priority": 0,
            },
            damage: {
                trigger: {
                    player: "damageBegin3",
                },
                locked: true,
                filter(event, player) {
                    return player.countMark('shuoye_shouheng') >= 1;
                },
                "prompt2": () => `你可以减少一层“电能”，令此次受到的伤害-1`,
                async content(event, trigger, player) {
                    player.removeMark('shuoye_shouheng', 1, false);
                    game.log(player, '移除了一层', '#g“电能”');
                    trigger.num--;
                },
                sub: true,
                "_priority": 0,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_shouheng
//#noname-kit-begin skill:shuoye_lichang
    "shuoye_lichang": {
        global: "shuoye_lichang_global",
        zhuSkill: true,
        group: "shuoye_lichang_remove",
        subSkill: {
            global: {
                trigger: {
                    player: "useCardToPlayer",
                },
                filter(event, player) {
                    if (player.group != 'qun') return false;
                    if (!game.hasPlayer(function (current) {
                        return current.hasZhuSkill('shuoye_lichang');
                    })) return false;
                    if (event.target == player || event.target.group == 'qun') return false;
                    return player.getHistory('useCard', evt => {
                        return evt.targets && evt.targets.some(target => target.group != 'qun');
                    }).indexOf(event.parent) == 0 && !player.hasHistory('useSkill', evt => evt.skill == 'shuoye_lichang_global');
                },
                "prompt2": () => `你可以摸一张牌`,
                async content(event, trigger, player) {
                    player.draw();
                },
                sub: true,
                "_priority": 0,
            },
            remove: {
                trigger: {
                    target: "useCardToTarget",
                },
                filter(event, player) {
                    if (player.isTempBanned('shuoye_lichang_remove')) return false;
                    if (!player.hasZhuSkill('shuoye_lichang')) return false;
                    return event.player != player && event.player.group == 'qun';
                },
                prompt2(event, player) {
                    return `你可以令${get.translation(event.card)}对你无效`;
                },
                async content(event, trigger, player) {
                    player.tempBanSkill(event.name, 'roundStart', false);
                    trigger.excluded.push(player);
                },
                sub: true,
                "_priority": 0,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_lichang

//#noname-kit-begin skill:shuoye_quedi
    "shuoye_quedi": {
        trigger: {
            player: "useCardToPlayered",
        },
        direct: true,
        filter(event, player) {
            if (player.getHistory('useSkill', evt => evt.skill == 'shuoye_quedi').length >= (player.getHistory('custom', evt => evt.shuoye_quedi).length + 1)) return false;
            return (
                (get.tag(event.card, 'damage')) &&
                event.targets.length == 1 &&
                (event.target.countGainableCards(player, "hej") > 0 ||
                    player.hasCard(function (i) {
                        return _status.connectMode || (lib.filter.cardDiscardable(i, player, "shuoye_quedi"));
                    }, "h"))
            );
        },
        async content(event, trigger, player) {
            const target = trigger.target;
            var list = [];
            if (target.countGainableCards(player, "h") > 0) list.push("选项一");
            if (
                player.hasCard(function (i) {
                    return get.type(i, player) == "basic" && lib.filter.cardDiscardable(i, player, "shuoye_quedi");
                }, "h")
            )
                list.push("选项二");
            list.push("背水！");
            list.push("cancel2");
            const { control } = await player
                .chooseControl(list)
                .set("choiceList", ["获得" + get.translation(target) + "的区域内的一张牌", "弃置一张牌并令" + get.translation(trigger.card) + "伤害+1", "背水！减1点体力上限并执行所有选项，选择一张花色，令其本回合不可使用或打出之"])
                .set("prompt", get.prompt(event.name, target))
                .set("ai", function () {
                    var evt = _status.event.getTrigger(),
                        player = evt.player,
                        target = evt.target,
                        card = evt.card;
                    if (get.attitude(player, target) > 0) return "cancel2";
                    var gainable = target.countGainableCards(player, "hej") > 0;
                    var discardable = player.hasCard(function (i) {
                        return lib.filter.cardDiscardable(i, player, "shuoye_quedi") && get.value(i, player) < 6;
                    }, "h");
                    var canDamage = !target.hasSkillTag("filterDamage", null, {
                        player: player,
                        card: card,
                    });
                    var manyCards = player.countCards('h') >= 3;
                    var maxHpEnough = player.maxHp > 3;
                    if (maxHpEnough && canDamage && (gainable || discardable)) return "背水！";
                    if (manyCards && canDamage && discardable) return "选项二";
                    if (gainable) return "选项一";
                    if (discardable && canDamage) return "选项二";
                    return "cancel2";
                }).forResult();
            if (control != 'cancel2') {
                player.logSkill(event.name, target);
                if (control == "背水！") {
                    await player.loseMaxHp();
                    const result = await player.chooseControl(lib.suit.slice(0))
                        .set("prompt", `选择一种花色，本回合${get.translation(target)}不能使用或打出此花色的牌`)
                        .set("ai", function () {
                            const player = get.player();
                            return lib.suit.randomGet();
                        }).forResult();
                    target.addTempSkill('shuoye_quedi_effect');
                    target.markAuto('shuoye_quedi_effect', [result.control]);
                }
                if ((control == "选项一" || control == "背水！") && target.countGainableCards(player, "hej") > 0) {
                    await player.gainPlayerCard(target, true, "hej");
                }
                if (
                    (control == "选项二" || control == "背水！") &&
                    player.hasCard(function (i) {
                        return lib.filter.cardDiscardable(i, player, "shuoye_quedi");
                    }, "h")
                ) {
                    const { bool } = await player.chooseToDiscard("h", "弃置一张牌", true).forResult();
                    if (bool) {
                        trigger.getParent().baseDamage++;
                    }
                }
            }
        },
        ai: {
            "directHit_ai": true,
            skillTagFilter: function (player, tag, arg) {
                if (tag !== "directHit_ai" || !arg || !arg.card || !arg.target || (arg.card.name != "sha" && arg.card.name != "juedou")) return false;
                if (player.storage.counttrigger && player.storage.counttrigger.shuoye_quedi && player.storage.counttrigger.shuoye_quedi > 0) return false;
                if (
                    arg.target.countCards("h") == 1 &&
                    (arg.card.name != "sha" ||
                        !arg.target.hasSkillTag("freeShan", false, {
                            player: player,
                            card: arg.card,
                        }) ||
                        player.hasSkillTag("unequip", false, {
                            name: arg.card ? arg.card.name : null,
                            target: arg.target,
                            card: arg.card,
                        }) ||
                        player.hasSkillTag("unequip_ai", false, {
                            name: arg.card ? arg.card.name : null,
                            target: arg.target,
                            card: arg.card,
                        }))
                )
                    return true;
                return false;
            },
        },
        subSkill: {
            effect: {
                mark: true,
                charlotte: true,
                onremove: true,
                intro: {
                    content: storage => `本回合不能使用${get.translation(storage)}花色的牌`,
                },
                mod: {
                    "cardEnabled2": function (card, player) {
                        if (player.getStorage("shuoye_quedi_effect").includes(get.suit(card))) return false;
                    },
                },
                sub: true,
                "_priority": 0,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_quedi
//#noname-kit-begin skill:shuoye_zhuifeng
    "shuoye_zhuifeng": {
        enable: ["chooseToUse", "chooseToRespond"],
        filter: function (event, player) {
            if ((player.storage.shuoye_zhuifeng_used || 0) >= (2 + player.countMark('shuoye_zhuifeng'))) return false;
            return get.inpileVCardList(info => {
                const name = info[2], type = get.type(name), infox = get.info({ name: name });
                return get.tag({ name: name }, 'damage') || ['sha', 'jiu'].includes(name);
            }).filter(card => event.filterCard({ name: card[2] }, player, event)).length;
        },
        chooseButton: {
            dialog: function (event, player) {
                const list = get.inpileVCardList(info => {
                    const name = info[2], type = get.type(name), infox = get.info({ name: name });
                    return (get.type({ name: name }) == 'trick' && get.tag({ name: name }, 'damage')) || ['sha', 'jiu'].includes(name);
                }).filter(card => event.filterCard({ name: card[2], nature: card[3] }, player, event));
                const dialog = ui.create.dialog('椎锋', [list, 'vcard']);
                dialog.direct = true;
                return dialog;
            },
            check: function (button) {
                if (_status.event.getParent().type != "phase") return 1;
                var player = _status.event.player;
                if (["wugu", "zhulu_card", "yiyi", "lulitongxin", "lianjunshengyan", "diaohulishan"].includes(button.link[2])) return 0;
                return player.getUseValue({
                    name: button.link[2],
                    nature: button.link[3],
                });
            },
            backup: function (links, player) {
                const next = {
                    filterCard: () => false,
                    selectCard: -1,
                    ignoreMod: true,
                    precontent: function () {
                        player.storage.shuoye_zhuifeng_used = (player.storage.shuoye_zhuifeng_used || 0) + 1;
                        player.markSkill('shuoye_zhuifeng_used');
                        player.markSkill('shuoye_zhuifeng');
                        if (event.result.card.name == 'jiu') {
                            player.when('jiuBegin')
                                .filter((event, player) => {
                                    return event.skill == 'shuoye_zhuifeng_backup'
                                })
                                .then(() => {
                                    player.addTempSkill('shuoye_zhuifeng_jiubuff');
                                })
                        }
                    },
                };
                const viewAs = {
                    name: links[0][2],
                    nature: links[0][3],
                    suit: "none",
                    number: null,
                    isCard: true,
                };
                next.viewAs = viewAs;
                if (get.info("xunshi").isXunshi(viewAs)) {
                    next.filterTarget = function (card, player, target) {
                        const info = get.info(card);
                        if (info.changeTarget) {
                            let targets = [target];
                            info.changeTarget(player, targets);
                            if (targets.length > 1) return false;
                        }
                        return lib.filter.filterTarget(card, player, target);
                    };
                    next.selectTarget = 1;
                }
                return next;
            },
            prompt: function (links, player) {
                return "使用使用或打出" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]);
            },
        },
        hiddenCard: function (player, name) {
            if (!lib.inpile.includes(name)) return false;
            var type = get.type2(name);
            return ['sha', 'jiu'].includes(name) || (type == "trick" && get.tag({ name: name }, 'damage'));
        },
        mark: true,
        marktext: "椎",
        intro: {
            markcount(storage, player) {
                const left = Math.max(0, 2 + player.countMark('shuoye_zhuifeng') - (player.storage.shuoye_zhuifeng_used || 0));
                return left > 0 ? left : "0";
            },
            content(storage, player) {
                const left = Math.max(0, 2 + player.countMark('shuoye_zhuifeng') - (player.storage.shuoye_zhuifeng_used || 0));
                return `剩余使用次数：${left}`;
            },
        },
        init(player) {
            if (player.node && player.node.marks) {
                player.markSkill("shuoye_zhuifeng");
            }
        },
        ai: {
            fireAttack: true,
            respondSha: true,
            order: 1,
            result: {
                player: function (player) {
                    if (_status.event.dying) return get.attitude(player, _status.event.dying);
                    return 1;
                },
            },
        },
        group: ["shuoye_zhuifeng_use", "shuoye_zhuifeng_add", "shuoye_zhuifeng_effect"],
        subSkill: {
            jiubuff: {
                trigger: {
                    player: "useCard",
                },
                forced: true,
                charlotte: true,
                popup: false,
                firstDo: true,
                filter(event, player) {
                    return event.card.name == 'sha';
                },
                async content(event, trigger, player) {
                    trigger.card._shuoye_zhuifeng = true;
                    player.removeSkill(event.name);
                },
                sub: true,
                "_priority": 0,
            },
            use: {
                enable: "phaseUse",
                usable: 1,
                direct: true,
                async content(event, trigger, player) {
                    const list2 = [];
                    if (player.countCards('he', function (card) {
                        return get.type(card) == 'equip' && lib.filter.cardDiscardable(card, player, event.name);
                    })) list2.push('弃置装备牌');
                    list2.push('失去体力');
                    const { control } = await player.chooseControl(list2, 'cancel2').set('prompt', `你可以弃置装备牌或失去体力增加“椎锋”的使用次数`).forResult();
                    if (control == 'cancel2') {
                        event.finish();
                        return;
                    }
                    player.logSkill(event.name);
                    if (control == '弃置装备牌') {
                        const { bool, cards } = await player.chooseToDiscard('he', [1, Infinity], function (card) {
                            return get.type(card) == 'equip';
                        }, true).forResult();
                        if (bool) {
                            player.addMark('shuoye_zhuifeng', cards.length, false);
                        }
                    } else {
                        var num = player.hp - 1;
                        if (player.countCards("hs", { name: ["tao", "jiu"] })) {
                            num = player.hp;
                        }
                        var map = {};
                        var list = [];
                        for (var i = 1; i <= player.hp; i++) {
                            var cn = get.cnNumber(i, true);
                            map[cn] = i;
                            list.push(cn);
                        }
                        event.map = map;
                        const result = await player
                            .chooseControl(list, function () {
                                return get.cnNumber(_status.event.goon, true);
                            })
                            .set("prompt", "失去任意点体力")
                            .set("goon", num)
                            .forResult();
                        var num = event.map[result.control] || 1;
                        player.loseHp(num);
                        player.addMark('shuoye_zhuifeng', num, false);
                    }
                },
                sub: true,
                "_priority": 0,
            },
            add: {
                trigger: {
                    player: "phaseJieshuBegin",
                },
                forced: true,
                async content(event, trigger, player) {
                    player.addMark('shuoye_zhuifeng', 2, false);
                },
                sub: true,
                "_priority": 0,
            },
            effect: {
                trigger: {
                    source: "damageSource",
                },
                filter(event, player) {
                    return event.card && ((event.getParent(2).card && event.getParent(2).card._shuoye_zhuifeng) || event.getParent(2).skill == 'shuoye_zhuifeng_backup') && event.player.countCards('hej');
                },
                logTarget: "player",
                prompt2(event, player) {
                    return `你可以观看并获得${get.translation(event.player)}区域内的牌`;
                },
                async content(event, trigger, player) {
                    const { bool, cards } = await player.choosePlayerCard(trigger.player, 'hej', true, trigger.num, 'visible').forResult();
                    if (bool) {
                        player.gain(cards, trigger.player, "give", "bySelf");
                    }
                },
                sub: true,
                "_priority": 0,
            },
        },
    },
//#noname-kit-end skill:shuoye_zhuifeng
//#noname-kit-begin skill:shuoye_choujue
    "shuoye_choujue": {
        trigger: {
            source: ["dying", "dieBegin"],
        },
        forced: true,
        locked: false,
        async content(event, trigger, player) {
            const { index } = await player.chooseControl('增加体力上限', '回复体力').forResult();
            if (index == 0) {
                await player.gainMaxHp();
            } else {
                await player.recover();
            }
            player.draw();
            player.getHistory('custom').push({ shuoye_quedi: true });
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_choujue

//#noname-kit-begin skill:dybl_shishan
    "dybl_shishan": {
        subSkill: {
            round: {
                trigger: {
                    global: "roundStart",
                },
                forced: true,
                log: false,
                content: function () {
                    player.storage.dybl_shishan = 1;
                },
                sub: true,
                "_priority": 0,
            },
        },
        group: ["dybl_shishan_round"],
        trigger: {
            player: "damageBefore",
        },
        filter: function (event, player) {
            return event.num > 0 && player.storage.dybl_shishan > 0;
        },
        check: function (event, player) {
            return event.num >= 2 || player.hp <= event.num;
        },
        content: function () {
            var source = trigger.source;
            trigger.cancel();
            player.storage.dybl_shishan--;
            if (source && source != player) {
                var pid = source.playerid;
                var current = player.storage.dybl_shishan_sources || {};
                var num = (current[pid] || 0) + 1;
                game.broadcastAll(function (target, pid2, num2) {
                    if (!target.storage.dybl_shishan_sources) target.storage.dybl_shishan_sources = {};
                    target.storage.dybl_shishan_sources[pid2] = num2;
                }, player, pid, num);
            }
        },
        mod: {
            globalTo: function (from, to, distance) {
                var map = to.storage.dybl_shishan_sources;
                if (map && map[from.playerid]) return distance + map[from.playerid];
                return distance;
            },
        },
        init: function (player) {
            player.storage.dybl_shishan = 1;
            player.storage.dybl_shishan_sources = {};
        },
        audio: "ext:朔夜/audio:2",
        ai: {
            expose: 0.3,
        },
        "_priority": 0,
    },
//#noname-kit-end skill:dybl_shishan
//#noname-kit-begin skill:dybl_muming
    "dybl_muming": {
        group: "dybl_muming_clear",
        subSkill: {
            "1": {
                audio: "ext:朔夜/audio:true",
                unique: true,
                sub: true,
                "_priority": 0,
            },
            "2": {
                audio: "ext:朔夜/audio:true",
                unique: true,
                sub: true,
                "_priority": 0,
            },
            clear: {
                trigger: {
                    global: "phaseEnd",
                },
                forced: true,
                popup: false,
                content: function () {
                    game.hasPlayer(function (current) {
                        if (current.hasMark('dybl_muming_mark')) {
                            current.removeMark('dybl_muming_mark');
                        }
                    })
                },
                sub: true,
                "_priority": 0,
            },
            mark: {
                marktext: "墓铭",
                intro: {
                    content: "已被墓铭",
                },
                sub: true,
                "_priority": 0,
            },
            effect: {
                onremove: true,
                trigger: {
                    global: "useCard1",
                },
                forced: true,
                usable: 1,
                filter: function (event, player) {
                    return event.player.hasMark('dybl_muming_mark') && event.player.isPhaseUsing();
                },
                content: function () {
                    trigger.player.removeMark('dybl_muming_mark');
                    var type = get.type2(trigger.card);
                    if (player.getStorage('dybl_muming_effect').contains(type)) {
                        player.draw(2);
                        player.logSkill("dybl_muming_1");
                    }
                    else {
                        player.logSkill("dybl_muming_2");
                    }
                    player.removeSkill('dybl_muming_effect');
                },
                sub: true,
                "_priority": 0,
            },
        },
        global: "dybl_muming_mark",
        trigger: {
            global: "phaseBegin",
        },
        audio: "ext:朔夜/audio:1",
        frequent: true,
        filter: function (event, player) {
            return event.player != player;
        },
        content: function () {
            "step 0"

            var target = trigger.player;
            var cards = target.getCards('h')
            if (target.countCards('h') > 0) {
                var content = [get.translation(target) + '的手牌', cards];
                game.log(player, '观看了', target, '的手牌');
                player.chooseControl('ok').set('dialog', content);
            }
            "step 1"
            var list = ['basic', 'trick', 'equip', 'cancel2'];
            if (list.length > 1) {
                player.chooseControl(list).set('ai', function () {
                    if (trigger.player.countCards('h', { type: "equip" })) return list[2];
                    else {
                        if (trigger.player.getCards('h', function (card) {
                            return get.type(card) == 'trick' && card.name != 'wuxie';
                        })) return list[1];
                        else {
                            return list[0];
                        }
                    }
                }).set('prompt', get.prompt('dybl_muming')).set('prompt2', '你可以预测其于出牌阶段使用的第一张牌的类别');
            }
            "step 2"
            if (result.control && result.control != 'cancel2') {

                var type = result.control;
                trigger.player.addMark('dybl_muming_mark');
                player.addTempSkill('dybl_muming_effect', 'phaseUseEnd');
                player.markAuto('dybl_muming_effect', [type]);
            }
        },
        "_priority": 0,
    },
//#noname-kit-end skill:dybl_muming
//#noname-kit-begin skill:dybl_mengyan
    "dybl_mengyan": {
        group: ["dybl_mengyan_player", "dybl_mengyan_sha", "dybl_mengyan_damage"],
        enable: "phaseUse",
        usable: 1,
        audio: "ext:朔夜/audio:3",
        filterCard: {
            suit: "heart",
        },
        selectCard: [0, 1],
        position: "he",
        check: function (card) {
            var player = _status.event.player;
            if (player.hp > 2) return 6 - get.value(card);
            return 15 - get.value(card);
        },
        filterTarget: function (event, player, target) {
            return target != player;
        },
        prompt: "弃一张红桃牌或失去一点体力",
        content: function () {
            if (cards.length == 0) {
                player.loseHp();
            }
            target.addTempSkill('dybl_mengyan_target');
        },
        ai: {
            expose: 0.3,
            order: function () {
                return get.order({ name: 'sha' }) + 0.2;
            },
            result: {
                player(player) {
                    return player.countCards('hs', { name: 'sha' }) ? 1 : 0;
                },
                target(player, target) {
                    if (target.hasSkill('dybl_mengyan_target')) return 0;
                    if (!player.countCards('hs', { name: 'sha' })) return 0;
                    if (!player.inRange(target)) return 0;
                    if (!player.canUse({ name: 'sha' }, target)) return 0;
                    const effect = get.effect(target, { name: 'sha' }, player, player);
                    return effect > 0 ? effect : 0;
                },
            },
        },
        subSkill: {
            sha: {
                trigger: {
                    player: "useCardAfter",
                },
                forced: true,
                audio: "dybl_mengyan",
                filter: function (event, player) {
                    return event.card.name == 'sha';
                },
                content: function () {
                    game.hasPlayer(function (current) {
                        if (current.hasSkill('dybl_mengyan_target')) {
                            current.removeSkill('dybl_mengyan_target');
                        }
                    })
                },
                sub: true,
                "_priority": 0,
            },
            player: {
                trigger: {
                    player: "useCardToPlayered",
                },
                audio: "dybl_mengyan",
                filter: function (event, player) {
                    return event.card.name == 'sha' && event.target.hasSkill('dybl_mengyan_target');
                },
                forced: true,
                logTarget: "target",
                content: function () {
                    trigger.getParent().directHit.add(trigger.target);
                },
                sub: true,
                "_priority": 0,
            },
            damage: {
                trigger: {
                    source: "damageBegin",
                },
                forced: true,
                audio: "dybl_mengyan",
                filter: function (event, player) {
                    return event.card.name == 'sha' & event.player.hasSkill('dybl_mengyan_target');
                },
                content: function () {
                    trigger.num += 1;
                },
                sub: true,
                "_priority": 0,
            },
            target: {
                charlotte: true,
                mark: true,
                marktext: "蒙眼",
                intro: {
                    content: "",
                },
                ai: {
                    threaten: 5,
                },
                sub: true,
                "_priority": 0,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:dybl_mengyan

//#noname-kit-begin skill:shuoye_qunxing
    "shuoye_qunxing": {
        trigger: {
            player: "phaseBegin",
        },
        direct: true,
        locked: false,
        filter: function (event, player) {
            return player.countCards('hes') > 0;;
        },
        content: function () {
            'step 0'
            player.chooseToDiscard('hes', [1, Infinity], get.prompt2(event.name));
            'step 1'
            if (result.bool) {
                player.logSkill(event.name);
                var cards = get.cards(result.cards.length * 2);
                game.cardsGotoOrdering(cards);
                var next = player.chooseToMove('琴弦：请将其中任意张牌置入', true);
                next.set('list', [
                    ['牌堆顶', cards],
                    ['手牌区'],
                    ['武将牌'],
                ]);
                next.set('filterMove', function (from, to, moved) {
                    var start = player.getExpansions('shuoye_qunxing').length;
                    if (to == 2 && (moved[2].length + start) > 6) return false;
                    return true;
                });
                next.set('processAI', function (list) {
                    var cards = list[0][1].slice(0).sort(function (a, b) {
                        return get.value(b) - get.value(a);
                    });
                    return [, cards, cards.splice(2)];
                })
            } else event.finish();
            'step 2'
            var top = result.moved[0];
            var min = result.moved[1];
            var bottom = result.moved[2];
            for (var i = 0; i < top.length; i++) {
                ui.cardPile.insertBefore(top[i], ui.cardPile.firstChild);
            }
            player.gain(min, 'draw');
            player.addToExpansion(bottom, 'giveAuto', player).gaintag.add('shuoye_qunxing');
            game.updateRoundNumber();
            game.delayx();
        },
        onremove: function (player, skill) {
            var cards = player.getExpansions(skill);
            if (cards.length) player.loseToDiscardpile(cards);
        },
        marktext: "星",
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
        group: "shuoye_qunxing_gain",
        subSkill: {
            gain: {
                trigger: {
                    player: "gainAfter",
                },
                direct: true,
                filter: function (event, player) {
                    return (_status.currentPhase != player || player.isPhaseUsing()) && event.cards && event.cards.length > 0
                },
                content: function () {
                    'step 0'
                    var next = player.chooseToMove('请将其中任意张牌置入或置换', true);
                    next.set('list', [
                        ['获得牌', trigger.cards],
                        ['星', player.getExpansions('shuoye_qunxing')],
                    ]);
                    next.set('filterMove', function (from, to, moved) {
                        if (typeof to != 'number') return true;
                        var start = player.getExpansions('shuoye_qunxing').length;
                        if (to == 0 && moved[0].length >= trigger.cards.length) return false;
                        if (to == 1 && (start > 6)) return false;
                        return true;
                    });
                    next.set('filterOk', (moved) => {
                        return moved[0].length <= trigger.cards.length && moved[1].length <= 7;
                    });
                    next.set('processAI', function (list) {
                        var cards = list[0][1].slice(0).sort(function (a, b) {
                            return get.value(b) - get.value(a);
                        });
                        return [cards, cards.splice(2)];
                    });
                    'step 1'
                    if (result.bool) {
                        var top = result.moved[0];
                        var bottom = result.moved[1];
                        var cards = top.filter(card => !trigger.cards.includes(card));
                        player.gain(cards, 'draw', 'fromStorage');
                        player.addToExpansion(bottom, 'giveAuto', player).gaintag.add('shuoye_qunxing');
                    }
                },
                sub: true,
                "_priority": 0,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_qunxing
//#noname-kit-begin skill:shuoye_qinxian
    "shuoye_qinxian": {
        trigger: {
            player: "phaseUseBegin",
        },
        forced: true,
        filter: function (event, player) {
            return !player.getEquips('shuoye_xiaotiqin').length;
        },
        content: function () {
            if (!lib.inpile.contains('shuoye_xiaotiqin')) {
                lib.inpile.push('shuoye_xiaotiqin');
                player.equip(game.createCard('shuoye_xiaotiqin', 'heart', 4));
            }
            else {
                var card = get.cardPile(function (card) {
                    return card.name == 'shuoye_xiaotiqin' && !player.getEquips(1).contains(card);
                }, 'field');
                if (card) player.equip(card);
            }
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_qinxian
//#noname-kit-begin skill:shuoye_shangbian
    "shuoye_shangbian": {
        enable: "phaseUse",
        direct: true,
        locked: false,
        filter: function (event, player) {
            const used = player.storage.shuoye_shangbian_used || [];
            return player.getExpansions('shuoye_qunxing').map(card => get.suit(card)).some(i => !used.includes(i));
        },
        group: ["shuoye_shangbian_reset"],
        subSkill: {
            reset: {
                charlotte: true,
                forced: true,
                silent: true,
                trigger: {
                    global: "phaseBegin",
                },
                content: function (event, trigger, player) {
                    player.storage.shuoye_shangbian_used = [];
                    player.markSkill("shuoye_shangbian_used");
                },
            },
        },
        content: function () {
            'step 0'
            var next = player.chooseCardButton(true, '选择弃置任意张花色相同的星', player.getExpansions('shuoye_qunxing'));
            next.set('filterButton', function (button) {
                const p = _status.event && _status.event.player;
                if (ui.selected.buttons.length) {
                    return get.suit(button.link) == get.suit(ui.selected.buttons[0].link);
                }
                return !((p && p.storage.shuoye_shangbian_used) || []).includes(get.suit(button.link));
            });
            next.set('selectButton', [1, Infinity]);
            next.set('complexSelect', true);
            'step 1'
            if (result.bool) {
                player.discard(result.links);
                event.cards = result.links;
                var suit = get.suit(result.links[0]);
                var used = player.storage.shuoye_shangbian_used || (player.storage.shuoye_shangbian_used = []);
                if (!used.includes(suit)) used.push(suit);
                player.markSkill("shuoye_shangbian_used");
            } else event.finish();
            'step 2'
            var list = [];
            for (var i = 0; i < lib.inpile.length; i++) {
                var name = lib.inpile[i];
                if (name == 'sha') {
                    list.push(['基本', '', 'sha']);
                    for (var j of lib.inpile_nature) {
                        list.push(['基本', '', 'sha', j]);
                    }
                }
                else if (get.type(name) == 'trick') list.push(['锦囊', '', name]);
                else if (get.type(name) == 'basic') list.push(['基本', '', name]);
            }
            if (!list.length) {
                event.finish();
                return;
            }
            player.chooseButton([[list, 'vcard']], '将一张牌当任意基本牌或普通锦囊牌使用').set('ai', function (button) {
                var player = _status.event.player;
                return player.getUseValue({
                    name: button.link[2],
                    nature: button.link[3],
                });
            }).set('filterButton', function (button) {
                var player = _status.event.player;
                return player.hasUseTarget({ name: button.link[2], nature: button.link[3], });
            });
            'step 3'
            if (result.bool) {
                var vcard = { name: result.links[0][2], nature: result.links[0][3] };
                event.cardx = vcard;
                player.chooseTarget('视为使用' + get.translation(vcard.name), function (card, player, target) {
                    return player.canUse(vcard, target, false, false);
                }).set('selectTarget', () => {
                    return [1, event.cards.length];
                }).set('complexSelect', true).set('filterOk', () => {
                    return ui.selected.targets.length == 1 || ui.selected.targets.length == event.cards.length;
                });
            } else event.finish();
            'step 4'
            if (result.bool) {
                if (result.targets.length > 1) {
                    player.useCard(event.cardx, result.targets, true, false);
                } else {
                    player.chooseUseTarget(event.cardx, result.targets[0], true, false).set('oncard', function (card, player) {
                        _status.event.effectCount = event.cards.length;
                    });
                }
            }
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_shangbian
//#noname-kit-begin skill:shuoye_xiezou
    "shuoye_xiezou": {
        trigger: {
            player: "loseAfter",
        },
        forced: true,
        filter: function (event, player) {
            if (!event.xs || !event.xs.length) return false;
            for (var i in event.gaintag_map) {
                if (event.gaintag_map[i].includes('shuoye_qunxing')) return true;
                return false;
            }
        },
        content: function () {
            'step 0'
            var cards = [];
            for (var i of trigger.xs) {
                if (!trigger.gaintag_map[i.cardid] || !trigger.gaintag_map[i.cardid].includes('shuoye_qunxing')) continue;
                var suit = get.suit(i, false);
                cards.add(suit);
            }
            if (!cards.length) {
                event.finish();
                return;
            }
            event.suits = cards;
            'step 1'
            var suit = event.suits.shift();
            var next = game.createEvent('shuoye_xiezou_' + suit);
            next.player = player;
            next.setContent(lib.skill['shuoye_xiezou']['content_' + suit]);
            'step 2'
            if (event.suits.length) event.goto(1);
        },
        "content_spade": function () {
            'step 0'
            player.chooseTarget('获得一名角色的一张牌', function (card, player, target) {
                return target.countGainableCards(player, 'he');
            });
            'step 1'
            if (result.bool) player.gainPlayerCard(result.targets[0], 'he', true);
        },
        "content_heart": function () {
            'step 0'
            player.chooseTarget('令一名角色摸一张牌', function (card, player, target) {
                return true;
            });
            'step 1'
            if (result.bool) result.targets[0].draw();
        },
        "content_club": function () {
            'step 0'
            player.chooseTarget('令一名角色横置', function (card, player, target) {
                return true;
            });
            'step 1'
            if (result.bool) result.targets[0].link(true);
        },
        "content_diamond": function () {
            'step 0'
            player.chooseTarget('弃置一名角色的一张牌', function (card, player, target) {
                return target.countDiscardableCards(player, 'he');
            });
            'step 1'
            if (result.bool) player.discardPlayerCard(result.targets[0], 'he', true);
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_xiezou
//#noname-kit-begin skill:shuoye_xiaotiqin_skill1
    "shuoye_xiaotiqin_skill1": {
        trigger: {
            player: "useCard2",
        },
        equipSkill: true,
        direct: true,
        filter: function (event, player) {
            if (event.shuoye_xiaotiqin_skill || !event.targets) return false;
            return event.card.name == 'sha' && (!event.cards || !event.cards.length);
        },
        content: function () {
            'step 0'
            trigger.shuoye_xiaotiqin_skill = true;
            player.chooseTarget('为' + get.translation(trigger.card) + '增加一个额外目标', function (card, player, target) {
                var player = _status.event.player;
                if (_status.event.targets.contains(target)) return false;
                return lib.filter.targetEnabled2(_status.event.card, player, target) && lib.filter.targetInRange(_status.event.card, player, target);
            }).set('autodelay', true).set('ai', function (target) {
                var trigger = _status.event.getTrigger();
                var player = _status.event.player;
                return get.effect(target, trigger.card, player, player);
            }).set('targets', trigger.targets).set('card', trigger.card);
            'step 1'
            if (result.bool) {
                player.logSkill(event.name, result.targets);
                trigger.targets.add(result.targets[0]);
            }
        },
        "_priority": -25,
    },
//#noname-kit-end skill:shuoye_xiaotiqin_skill1
//#noname-kit-begin skill:shuoye_xiaotiqin_skill2
    "shuoye_xiaotiqin_skill2": {
        enable: "chooseToUse",
        equipSkill: true,
        viewAs: {
            name: "sha",
            nature: "thunder",
            isCard: true,
        },
        filterCard: () => false,
        selectCard: -1,
        viewAsFilter: function (player) {
            if (player.getExpansions('shuoye_qunxing').length < 2) return false;
        },
        filter: function (event, player) {
            if (player.getExpansions('shuoye_qunxing').length < 2) return false;
            var suits = player.getExpansions('shuoye_qunxing').map(card => get.suit(card));
            var suitx = Array.from(new Set(suits)).length;
            if (suitx < 2) return false;
            return [player.name, player.name1, player.name2].some(i => i == 'shuoye_yuanlv');
        },
        precontent: function () {
            'step 0'
            var next = player.chooseCardButton(true, '选择弃置两张“星”', player.getExpansions('shuoye_qunxing'));
            next.set('filterButton', button => {
                if (ui.selected.buttons.length) {
                    return get.suit(button.link) != get.suit(ui.selected.buttons[0].link);
                }
                return true;
            });
            next.set('selectButton', 2);
            next.set('filterOk', () => ui.selected.buttons.length == 2);
            'step 1'
            player.discard(result.links)
        },
        onuse: function (result, player) {
            _status.event.addCount = false;
        },
        ai: {
            yingbian: function (card, player, targets, viewer) {
                if (get.attitude(viewer, player) <= 0) return 0;
                var base = 0, hit = false;
                if (get.cardtag(card, 'yingbian_hit')) {
                    hit = true;
                    if (targets.some(target => {
                        return target.mayHaveShan(viewer) && get.attitude(viewer, target) < 0 && get.damageEffect(target, player, viewer, get.natureList(card)) > 0;
                    })) base += 5;
                }
                if (get.cardtag(card, 'yingbian_add')) {
                    if (game.hasPlayer(function (current) {
                        return !targets.contains(current) && lib.filter.targetEnabled2(card, player, current) && get.effect(current, card, player, player) > 0;
                    })) base += 5;
                }
                if (get.cardtag(card, 'yingbian_damage')) {
                    if (targets.some(target => {
                        return get.attitude(player, target) < 0 && (hit || !target.mayHaveShan(viewer) || player.hasSkillTag('directHit_ai', true, {
                            target: target,
                            card: card,
                        }, true)) && !target.hasSkillTag('filterDamage', null, {
                            player: player,
                            card: card,
                            jiu: true,
                        })
                    })) base += 5;
                }
                return base;
            },
            canLink: function (player, target, card) {
                if (!target.isLinked() && !player.hasSkill('wutiesuolian_skill')) return false;
                if (target.mayHaveShan() && !player.hasSkillTag('directHit_ai', true, {
                    target: target,
                    card: card,
                }, true)) return false;
                if (player.hasSkill('jueqing') || player.hasSkill('gangzhi') || target.hasSkill('gangzhi')) return false;
                return true;
            },
            basic: {
                useful: [5, 3, 1],
                value: [5, 3, 1],
            },
            order: function (item, player) {
                if (player.hasSkillTag('presha', true, null, true)) return 10;
                if (game.hasNature(item, 'linked')) {
                    if (game.hasPlayer(function (current) {
                        return current != player && current.isLinked() && player.canUse(item, current, null, true) && get.effect(current, item, player, player) > 0 && lib.card.sha.ai.canLink(player, current, item);
                    }) && game.countPlayer(function (current) {
                        return current.isLinked() && get.damageEffect(current, player, player, get.nature(item)) > 0;
                    }) > 1) return 3.1;
                    return 3;
                }
                return 3.05;
            },
            result: {
                target: function (player, target, card, isLink) {
                    var eff = function () {
                        if (!isLink && player.hasSkill('jiu')) {
                            if (!target.hasSkillTag('filterDamage', null, {
                                player: player,
                                card: card,
                                jiu: true,
                            })) {
                                if (get.attitude(player, target) > 0) {
                                    return -7;
                                }
                                else {
                                    return -4;
                                }
                            }
                            return -0.5;
                        }
                        return -1.5;
                    }();
                    if (!isLink && target.mayHaveShan() && !player.hasSkillTag('directHit_ai', true, {
                        target: target,
                        card: card,
                    }, true)) return eff / 1.2;
                    return eff;
                },
            },
            tag: {
                respond: 1,
                respondShan: 1,
                damage: function (card) {
                    if (game.hasNature(card, 'poison')) return;
                    return 1;
                },
                natureDamage: function (card) {
                    if (game.hasNature(card, 'linked')) return 1;
                },
                fireDamage: function (card, nature) {
                    if (game.hasNature(card, 'fire')) return 1;
                },
                thunderDamage: function (card, nature) {
                    if (game.hasNature(card, 'thunder')) return 1;
                },
                poisonDamage: function (card, nature) {
                    if (game.hasNature(card, 'poison')) return 1;
                },
            },
        },
        "_priority": -25,
    },
//#noname-kit-end skill:shuoye_xiaotiqin_skill2
//#noname-kit-begin skill:shuoye_xianzong
    "shuoye_xianzong": {
        trigger: {
            player: "damageBegin4",
        },
        forced: true,
        content: function () {
            'step 0'
            player.chooseButton([
                '###' + get.prompt('shuoye_xianzong') + '###', [[
                    ['gain', '增加1点体力上限，然后失去1点体力'],
                    ['lose', '减少1点体力上限'],
                ], 'textbutton']
            ]).set('ai', function (button) {
                const p = _status.event.player;
                if (p.hp < p.maxHp) return button.link == 'lose' ? 10 : 0;
                return button.link == 'gain' ? 10 : 0;
            });
            'step 1'
            if (result.bool) {
                player.logSkill(event.name);
                trigger.cancel();
                if (result.links[0] == 'gain') {
                    player.gainMaxHp();
                    player.loseHp();
                } else {
                    player.loseMaxHp();
                }
            }
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_xianzong
//#noname-kit-begin skill:shuoye_tianya
    shuoye_tianya: {
        locked: false,
        zhuanhuanji: true,
        marktext: "☯",
        intro: {
            content(storage, player, skill) {
                if (player.storage.shuoye_tianya) return '你可以弃一张牌，然后将一张牌改成任意点数使用或打出';
                return '你可以弃一张牌，然后将一张牌作为本轮你使用过的一张牌无次数限制的使用或打出';
            },
        },
        enable: "phaseUse",
        usable: 2,
        async content(event, trigger, player) {
            await player.draw();
            await player.loseMaxHp();
            await player.changeZhuanhuanji('shuoye_tianya');
            await player.addAdditionalSkills('shuoye_tianya', `shuoye_tianya_${player.storage[event.name]}`);
            player.markSkill('shuoye_tianya');
        },
        onremove: (player, skill) => player.removeAdditionalSkill(skill),
        ai: {
            order: function (item, player) {
                player = player || get.player();
                if (!player || player.maxHp <= 3) return -1;
                if (player.countCards('h') <= 2) return 3;
                if (player.maxHp > player.hp + 1) return 2;
                return -1;
            },
            result: {
                player(player) {
                    if (player.maxHp <= 3) return 0;
                    if (player.countCards('h') <= 2) return 1;
                    if (player.maxHp > player.hp + 1) return 1;
                    return 0;
                },
            },
        },
        getRoundUsed(player) {
            const list = player.storage.shuoye_tianya_roundUsed;
            return Array.isArray(list) ? list.slice() : [];
        },
        group: ["shuoye_tianya_roundUsed", "shuoye_tianya_roundReset"],
        subSkill: {
            true: {
                trigger: {
                    player: ["useCard", "respond"],
                },
                popup: false,
                filter(event, player) {
                    if (!player.storage.shuoye_tianya) return false;
                    return player.countCards('hes');
                },
                async cost(event, trigger, player) {
                    event.result = await player.chooseToDiscard('hes', `你可以弃置一张牌，更改${get.translation(trigger.card)}的点数`)
                        .set('chooseonly', true)
                        .forResult();
                },
                async content(event, trigger, player) {
                    player.logSkill(event.name);
                    await player.discard(event.cards);
                    const { bool, links } = await player.chooseButton(true, [`更改${get.translation(trigger.card)}点数`, [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], 'tdnodes']])
                        .set('ai', function (button) {
                            const p = _status.event.player;
                            const nums = (p.getExpansions('shuoye_fusheng') || []).map(card => get.number(card));
                            return nums.includes(button.link) ? 10 : 0;
                        }).forResult();
                    if (bool) {
                        game.log(player, '将', trigger.card, '的点数改为', links[0]);
                        trigger.card.number = links[0];
                    }
                },
            },
            false: {
                enable: ["chooseToUse", "chooseToRespond"],
                filter(event, player) {
                    if (player.storage.shuoye_tianya) return false;
                    if (!player.countCards('hse')) return false;
                    const list = lib.skill.shuoye_tianya.getRoundUsed(player);
                    for (var i of list) {
                        var type = get.type2(i);
                        if (player.getStorage('shuoye_tianya_used').includes(i)) continue;
                        if ((type == 'basic' || type == 'trick') && event.filterCard({ name: i }, player, event)) return true;
                    }
                    return false;
                },
                chooseButton: {
                    dialog(event, player) {
                        const list = lib.skill.shuoye_tianya.getRoundUsed(player);
                        return ui.create.dialog('天涯', [list, 'vcard']);
                    },
                    filter(button, player) {
                        if (player.getStorage('shuoye_tianya_used').includes(button.link[2])) return false;
                        return _status.event.getParent().filterCard({ name: button.link[2] }, player, _status.event.getParent());
                    },
                    check(button) {
                        if (_status.event.getParent().type != 'phase') return 1;
                        var player = _status.event.player;
                        if (['wugu', 'zhulu_card', 'yiyi', 'lulitongxin', 'lianjunshengyan', 'diaohulishan'].contains(button.link[2])) return 0;
                        return player.getUseValue({
                            name: button.link[2],
                            nature: button.link[3],
                        });
                    },
                    backup(links, player) {
                        return {
                            filterCard: true,
                            check(card) {
                                return 8 - get.value(card);
                            },
                            position: 'hse',
                            viewAs: {
                                name: links[0][2],
                                nature: links[0][3]
                            },
                            log: false,
                            async precontent(event, trigger, player) {
                                const { bool } = await player.chooseToDiscard('hes', function (card) {
                                    const player = get.player();
                                    return !get.event('cardx').includes(card)
                                })
                                    .set('cardx', event.result.cards)
                                    .set('ai', card => {
                                        return 8 - get.value(card);
                                    }).forResult();
                                if (bool) {
                                    player.logSkill('shuoye_tianya_backup');
                                    player.addTempSkill('shuoye_tianya_used');
                                    player.markAuto('shuoye_tianya_used', [event.result.card.name]);
                                    event.getParent().addCount = false;
                                } else {
                                    event.parent.cancel();
                                    event.parent.goto(0);
                                    event.getParent(2).goto(0);
                                }
                            },
                        }
                    },
                    prompt(links, player) {
                        return '你可以将一张牌当做' + (get.translation(links[0][3]) || '') + get.translation(links[0][2]) + '使用';
                    },
                },
                hiddenCard(player, name) {
                    if (!lib.inpile.contains(name)) return false;
                    var type = get.type2(name);
                    if (player.getStorage('shuoye_tianya_used').includes(name)) return false;
                    return (type == 'basic' || type == 'trick') && player.countCards('she') > 0 && player.storage.shuoye_tianya == false;
                },
                ai: {
                    respondSha: true,
                    respondShan: true,
                    skillTagFilter(player) {
                        if (!player.countCards('hse') || player.storage.shuoye_tianya) return false;
                    },
                    order: 2,
                    result: {
                        player(player) {
                            if (_status.event.dying) return get.attitude(player, _status.event.dying);
                            return 1;
                        },
                    },
                },
            },
            false_backup: {},
            roundUsed: {
                charlotte: true,
                forced: true,
                silent: true,
                trigger: {
                    player: "useCardAfter",
                },
                content: function (event, trigger, player) {
                    const name = trigger.card && trigger.card.name;
                    if (!name || !['basic', 'trick'].includes(get.type(name))) {
                        return;
                    }
                    const list = player.storage.shuoye_tianya_roundUsed || (player.storage.shuoye_tianya_roundUsed = []);
                    if (!list.includes(name)) {
                        list.push(name);
                        player.markSkill("shuoye_tianya_roundUsed");
                    }
                },
            },
            roundReset: {
                charlotte: true,
                forced: true,
                silent: true,
                trigger: {
                    global: "roundStart",
                },
                content: function (event, trigger, player) {
                    player.storage.shuoye_tianya_roundUsed = [];
                    player.markSkill("shuoye_tianya_roundUsed");
                },
            },
            used: {
                onremove: true,
                intro: {
                    content: "$",
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_tianya
//#noname-kit-begin skill:shuoye_fusheng
    "shuoye_fusheng": {
        trigger: {
            player: "useCardAfter",
        },
        filter: function (event, player) {
            if (typeof get.number(event.card, false) != 'number') return false;
            var cards = player.getExpansions('shuoye_fusheng');
            return !cards.length || cards.map(i => get.number(i)).every(num => get.number(event.card) != num);
        },
        content: function () {
            var cards = trigger.cards.filterInD('oe');
            player.addToExpansion(cards, 'gain2').gaintag.add('shuoye_fusheng');
        },
        intro: {
            markcount: "expansion",
            mark: function (dialog, content, player) {
                var content = player.getExpansions('shuoye_fusheng');
                if (content && content.length) {
                    dialog.addAuto(content);
                }
            },
        },
        group: "shuoye_fusheng_end",
        subSkill: {
            end: {
                trigger: {
                    player: "useCardEnd",
                },
                direct: true,
                filter: function (event, player) {
                    if (typeof get.number(event.card, false) != 'number') return false;
                    if (!player.getExpansions('shuoye_fusheng').length) return false;
                    return player.getExpansions('shuoye_fusheng').map(i => get.number(i)).some(num => get.number(event.card) == num);
                },
                content: function () {
                    'step 0'
                    player.chooseButton(['浮生：你可以弃置一张牌', player.getExpansions('shuoye_fusheng')]);
                    'step 1'
                    if (result.bool) {
                        player.logSkill('shuoye_fusheng');
                        player.loseToDiscardpile(result.links);
                    } else event.finish();
                    'step 2'
                    if (player.getExpansions('shuoye_fusheng').length) {
                        player.chooseButton(['浮生：是否获得一张牌？取消则你摸一张牌', player.getExpansions('shuoye_fusheng')]);
                    } else event.goto(4)
                    'step 3'
                    if (result.bool) {
                        player.gain(result.links, 'gain2', 'fromStorage');
                        event.finish();
                    }
                    'step 4'
                    player.draw();
                },
                sub: true,
                "_priority": 0,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_fusheng
//#noname-kit-begin skill:shuoye_duchen
    "shuoye_duchen": {
        audio: "ext:朔夜/audio:1",
        enable: "phaseUse",
        mark: true,
        skillAnimation: true,
        limited: true,
        animationColor: "orange",
        filter: function (event, player) {
            return player.hp > 0;
        },
        content: function () {
            'step 0'
            player.awakenSkill(event.name);
            'step 1'
            var num = player.hp;
            player.addTempSkill('shuoye_duchen_dying');
            player.setStorage('shuoye_duchen_dying', num);
            player.loseHp(num);
        },
        subSkill: {
            dying: {
                trigger: {
                    player: 'dying',
                },
                forced: true,
                popup: false,
                charlotte: true,
                onremove: true,
                filter(event, player) {
                    return event.getParent(2).name == 'shuoye_duchen';
                },
                async content(event, trigger, player) {
                    player.addTempSkill('shuoye_duchen_effect');
                    var next = player.chooseUseTarget({ name: 'sha' }, true, false);
                    next.set('oncard', function (card, player) {
                        _status.event.directHit.addArray(game.players);
                        _status.event.baseDamage += (player.storage[event.name] || 0);
                    });
                    next.card.shuoye_xianzong = true;
                    await next;
                    delete player.storage[event.name];
                },
            },
            effect: {
                trigger: {
                    player: "useCardToPlayered",
                    global: "dieAfter",
                },
                forced: true,
                priority: 15,
                charlotte: true,
                filter: function (event, player) {
                    var i = 1;
                    if (event.name == 'die') return event.getParent(3).card.shuoye_xianzong;
                    if (!event.targets || !event.targets.length) return false;
                    return event.card.name == 'sha' && event.card.shuoye_duchen;
                },
                content: function () {
                    if (trigger.name == 'die') {
                        player.recover(2 - player.hp);
                    } else trigger.targets.forEach(i => i.addTempSkill('fengyin'));
                },
                ai: {
                    unequip: true,
                    skillTagFilter: function (player, tag, arg) {
                        if (!arg || !arg.card || arg.card.name != 'sha' || !arg.card.shuoye_duchen) return false;
                    },
                },
                sub: true,
                "_priority": 1500,
            },
        },
        ai: {
            order: function (item, player) {
                player = player || get.player();
                return player && player.countCards('h', 'tao') > 0 ? 4 : -1;
            },
            result: {
                player: function (player) {
                    return player.countCards('h', 'tao') > 0 ? 1 : 0;
                },
            },
        },
        intro: {
            content: "limited",
        },
        init: (player, skill) => player.storage[skill] = false,
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_duchen
//#noname-kit-begin skill:shuoye_benghuai
    "shuoye_benghuai": {
        trigger: {
            player: "useCard",
        },
        priority: 10,
        filter: function (event, player) {
            var type1 = get.type2(event.card), type2 = player.storage.shuoye_benghuai_record;
            return type2 && type1 != type2;
        },
        forced: true,
        locked: false,
        content: function () {
            player.draw();
            if (player.countMark('shuoye_benghuai') < 14) player.addMark('shuoye_benghuai');
        },
        mod: {
            attackRange: function (player, num) {
                return num += 1;
            },
        },
        marktext: "空",
        intro: {
            name: "空",
            content: "mark",
        },
        group: ["shuoye_benghuai_damage", "shuoye_benghuai_record"],
        subSkill: {
            damage: {
                trigger: {
                    player: "damageEnd",
                },
                forced: true,
                locked: false,
                content: function () {
                    'step 0'
                    event.count = trigger.num;
                    'step 1'
                    event.count--;
                    player.draw();
                    if (player.countMark('shuoye_benghuai') < 14) player.addMark('shuoye_benghuai');
                    'step 2'
                    if (event.count) event.goto(1)
                },
                sub: true,
                "_priority": 0,
            },
            record: {
                trigger: {
                    player: ["useCardAfter", "respondAfter"],
                },
                forced: true,
                locked: false,
                firstDo: true,
                filter: function (event, player) {
                    return get.type2(event.card) != undefined;
                },
                content: function () {
                    player.storage.shuoye_benghuai_record = get.type2(trigger.card);
                    player.markSkill('shuoye_benghuai_record');
                },
                marktext: "\u0000",
                intro: {
                    markcount: function (storage, player) {
                        return get.translation(storage).slice(0, 1);
                    },
                    content: "$",
                },
                sub: true,
                "_priority": 0,
            },
        },
        "_priority": 1000,
    },
//#noname-kit-end skill:shuoye_benghuai
//#noname-kit-begin skill:shuoye_yakong
    "shuoye_yakong": {
        trigger: {
            player: "useCard",
        },
        locked: false,
        filter: function (event, player) {
            return lib.skill.shuoye_yakong.filterx(event) && player.countMark('shuoye_benghuai') && player.storage.shuoyeYakongPhase !== game.phaseNumber;
        },
        filterx: function (event) {
            if (event.targets.length == 0) return false;
            var type = get.type(event.card);
            if (type != 'basic' && type != 'trick') return false;
            return true;
        },
        content: function () {
            player.storage.shuoyeYakongPhase = game.phaseNumber;
            player.removeMark('shuoye_benghuai');
            if (lib.skill.shuoye_yakong.filterx(trigger)) {
                trigger.effectCount++;
                game.log(trigger.card, '额外结算一次');
            }
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_yakong
//#noname-kit-begin skill:shuoye_zhendang
    "shuoye_zhendang": {
        enable: "phaseUse",
        usable: 1,
        filter: function (event, player) {
            return player.countMark('shuoye_benghuai') > 3;
        },
        content: function () {
            player.removeMark('shuoye_benghuai', 3);
            player.addTempSkill('shuoye_zhendang_effect');
        },
        ai: {
            order: 2,
            result: {
                player: function (player) {
                    return player.hasUseTarget({ name: 'sha' }) && player.countCards('hs', { name: 'sha' });
                },
            },
        },
        subSkill: {
            effect: {
                charlotte: true,
                trigger: {
                    source: "damageBefore",
                },
                forced: true,
                locked: false,
                filter: function (event, player) {
                    return event.card && event.card.name == 'sha';
                },
                content: function () {
                    game.setNature(trigger, 'thunder');
                },
                mod: {
                    cardUsable: function (card, player) {
                        return Infinity;
                    },
                },
                sub: true,
                "_priority": 0,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_zhendang
//#noname-kit-begin skill:shuoye_xujie
    "shuoye_xujie": {
        audio: "ext:朔夜/audio:1",
        enable: "phaseUse",
        mark: true,
        skillAnimation: true,
        limited: true,
        animationColor: "orange",
        filter: function (event, player) {
            return player.countMark('shuoye_benghuai') == 14 && player.countCards('h') > player.hp;
        },
        content: function () {
            'step 0'
            player.awakenSkill(event.name);
            'step 1'
            player.gainMaxHp(2);
            player.recover(2);
            player.removeMark('shuoye_benghuai', player.countMark('shuoye_benghuai'));
            'step 2'
            player.turnOver();
            event.targetsx = game.filterPlayer(i => i != player).sortBySeat();
            'step 3'
            event.targetx = event.targetsx.shift();
            'step 4'
            if (event.targetx.isIn()) event.targetx.damage('thunder');
            'step 5'
            event.targetx.discard(event.targetx.getCards('hej'));
            if (event.targetsx.length) event.goto(3);
            'step 6'
            player.discard(player.getCards('hej'));
        },
        ai: {
            order: 1,
            result: {
                player: function (player) {
                    return 1;
                },
            },
        },
        intro: {
            content: "limited",
        },
        init: (player, skill) => player.storage[skill] = false,
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_xujie
//#noname-kit-begin skill:shuoye_guanxing
    "shuoye_guanxing": {
        trigger: {
            player: ["phaseZhunbeiBegin", "phaseJieshuBegin"],
        },
        frequent: true,
        content: function () {
            'step 0'
            var cards = get.cards(7);
            game.cardsGotoOrdering(cards);
            var next = player.chooseToMove();
            next.set('list', [
                ['牌堆顶', cards],
                ['牌堆底'],
                ['获得'],
            ]);
            next.set('prompt', '观星：获得其中一个类别的牌，然后将其余牌以任意顺序放回牌堆顶或牌堆底');
            next.set('filterOk', function (moved) {
                if (!moved[2].length) return true;
                return moved[2].every(card => get.type2(card) == get.type2(moved[2][0]));
            });
            next.set('processAI', function (list) {
                var cards = list[0][1], player = _status.event.player;
                var target = (_status.event.getTrigger().name == 'phaseZhunbei') ? player : player.next;
                var att = get.sgn(get.attitude(player, target));
                var top = [];
                var judges = target.getCards('j');
                var stopped = false;
                if (player != target || !target.hasWuxie()) {
                    for (var i = 0; i < judges.length; i++) {
                        var judge = get.judge(judges[i]);
                        cards.sort(function (a, b) {
                            return (judge(b) - judge(a)) * att;
                        });
                        if (judge(cards[0]) * att < 0) {
                            stopped = true; break;
                        }
                        else {
                            top.unshift(cards.shift());
                        }
                    }
                }
                var bottom;
                if (!stopped) {
                    cards.sort(function (a, b) {
                        return (get.value(b, player) - get.value(a, player)) * att;
                    });
                    while (cards.length) {
                        if ((get.value(cards[0], player) <= 5) == (att > 0)) break;
                        top.unshift(cards.shift());
                    }
                }
                bottom = cards;
                var TempCards1 = top.slice(0);
                var TempCards2 = bottom.slice(0);
                var gain = TempCards1.addArray(TempCards2)[TempCards1.addArray(TempCards2).length - 1];
                top.remove(gain);
                bottom.remove(gain);
                return [top, bottom, [gain]];
            });
            'step 1'
            var top = result.moved[0];
            var bottom = result.moved[1];
            var gain = result.moved[2];
            top.reverse();
            for (var i = 0; i < top.length; i++) {
                ui.cardPile.insertBefore(top[i], ui.cardPile.firstChild);
            }
            for (i = 0; i < bottom.length; i++) {
                ui.cardPile.appendChild(bottom[i]);
            }
            player.popup(get.cnNumber(top.length) + '上' + get.cnNumber(bottom.length) + '下');
            game.log(player, '将' + get.cnNumber(top.length) + '张牌置于牌堆顶');
            game.log(player, '将' + get.cnNumber(bottom.length) + '张牌置于牌堆底');
            game.updateRoundNumber();
            player.gain(gain, 'draw');
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_guanxing
//#noname-kit-begin skill:shuoye_jiugong
    "shuoye_jiugong": {
        trigger: {
            player: "useCard",
        },
        direct: true,
        filter: function (event, player) {
            return player.countCards('hes');
        },
        content: function () {
            'step 0'
            player.chooseToDiscard('hes', function (card) {
                for (var i = 0; i < ui.selected.cards.length; i++) {
                    if (get.type(card) == get.type(ui.selected.cards[i])) return false;
                }
                return true;
            }).set('complexCard', true).set('selectCard', [1, 3]);
            'step 1'
            if (result.bool) {
                player.logSkill(event.name)
                var num = player.countMark(event.name);
                if (num >= 9) return;
                if ((num + result.cards.length) >= 9) {
                    player.addMark(event.name, 9 - num);
                } else player.addMark(event.name, result.cards.length);
            }
        },
        mod: {
            maxHandcardBase: function (player, num) {
                return player.maxHp + player.getStorage('shuoye_jiugong');
            },
        },
        marktext: "宫",
        intro: {
            name: "宫",
            content: "mark",
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_jiugong
//#noname-kit-begin skill:shuoye_wuxing
    "shuoye_wuxing": {
        enable: "phaseUse",
        usable: 3,
        filter: function (event, player) {
            return player.countMark('shuoye_jiugong')
        },
        filterTarget: true,
        content: function () {
            'step 0'
            player.removeMark('shuoye_jiugong');
            player.chooseButton(true, [
                '五行', [[
                    ['xuanwu', '玄武：本轮如果受到大于一的伤害，将其改为一，且你受到伤害时可摸一张牌'],
                    ['zhuque', '朱雀：本轮造成的伤害都改为火焰伤害，且你每造成一点伤害，可以弃置一名角色一张牌'],
                    ['canglong', '苍龙：本轮使用牌点数为上一张的约数或倍数时可摸一张牌'],
                    ['baihu', '白虎：本轮出牌后可进行判定，为黑则不可被响应，为红则额外结算一次'],
                    ['qilin', '麒麟：本轮每回合限一次，你可将一张牌作为任意牌使用'],
                ], 'textbutton']
            ]);
            'step 1'
            if (result.bool) {
                target.addTempSkill('shuoye_wuxing_' + result.links[0], 'roundStart');
                if (['xuanwu', 'zhuque'].includes(result.links[0])) {
                    player.addTempSkill('shuoye_wuxing_' + result.links[0] + '2', 'roundStart');
                }
            }
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_wuxing
//#noname-kit-begin skill:shuoye_wuxing_xuanwu
    "shuoye_wuxing_xuanwu": {
        trigger: {
            player: "damageBegin3",
        },
        forced: true,
        charlotte: true,
        filter: function (event, player) {
            return event.num > 1;
        },
        content: function () {
            trigger.num = 1;
        },
        ai: {
            filterDamage: true,
            skillTagFilter: function (player, tag, arg) {
                if (arg && arg.player) {
                    if (arg.player.hasSkillTag('jueqing', false, player)) return false;
                }
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_wuxing_xuanwu
//#noname-kit-begin skill:shuoye_wuxing_xuanwu2
    "shuoye_wuxing_xuanwu2": {
        trigger: {
            player: "damageBegin1",
        },
        charlotte: true,
        prompt: "当你受到伤害时，你可以摸一张牌",
        content: function () {
            player.draw();
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_wuxing_xuanwu2
//#noname-kit-begin skill:shuoye_wuxing_zhuque
    "shuoye_wuxing_zhuque": {
        trigger: {
            source: "damageBegin1",
        },
        forced: true,
        charlotte: true,
        filter: function (event, player) {
            return true;
        },
        content: function () {
            game.setNature(trigger, 'fire');
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_wuxing_zhuque
//#noname-kit-begin skill:shuoye_wuxing_zhuque2
    "shuoye_wuxing_zhuque2": {
        trigger: {
            source: "damageSource",
        },
        direct: true,
        charlotte: true,
        filter: function (event, player) {
            return game.hasPlayer(current => current.countDiscardableCards('he', player));
        },
        content: function () {
            'step 0'
            event.count = trigger.num;
            'step 1'
            event.count--;
            player.chooseTarget('你可以弃置一名角色的一张牌', function (card, player, target) {
                return target.countDiscardableCards('he', player);
            });
            'step 2'
            if (result.bool) {
                var target = result.targets[0];
                player.logSkill(event.name, target);
                player.discardPlayerCard('he', target, true);
            }
            'step 3'
            if (event.count && game.hasPlayer(current => current.countDiscardableCards('he', player))) event.goto(1);
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_wuxing_zhuque2
//#noname-kit-begin skill:shuoye_wuxing_canglong
    "shuoye_wuxing_canglong": {
        trigger: {
            player: ["useCard", "useCardAfter"],
        },
        direct: true,
        charlotte: true,
        filter: function (event, player, name) {
            if (name == 'useCardAfter') return typeof get.number(event.card) == 'number';
            var num1 = get.number(event.card), num2 = player.storage.shuoye_wuxing_canglong;
            return typeof num1 == 'number' && typeof num2 == 'number' && (num2 % num1 == 0 || num1 % num2 == 0);
        },
        content: function () {
            'step 0'
            if (event.triggername == 'useCardAfter') {
                player.storage.shuoye_wuxing_canglong = get.number(trigger.card);
                player.markSkill('xingtu');
                event.finish();
                return;
            }
            player.chooseBool('你可以摸一张牌');
            'step 1'
            if (result.bool) {
                player.draw();
            }
        },
        mod: {
            aiOrder: function (player, card, num) {
                var num1 = get.number(card), num2 = player.storage.shuoye_wuxing_canglong;
                if (typeof num1 == 'number' && typeof num2 == 'number' && (num2 % num1 == 0 || num1 % num2 == 0)) return num + 5;
            },
        },
        marktext: "苍龙",
        intro: {
            content: "当前记录：X=#",
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_wuxing_canglong
//#noname-kit-begin skill:shuoye_wuxing_baihu
    "shuoye_wuxing_baihu": {
        trigger: {
            player: "useCard",
        },
        frequent: true,
        charlotte: true,
        filter: function (event, player) {
            return ['basic', 'trick'].includes(get.type(event.card));
        },
        content: function () {
            'step 0'
            player.judge();
            'step 1'
            if (result.color == 'black') {
                trigger.directHit.addArray(game.players);
            } else if (result.color == 'red') {
                trigger.effectCount++
            }
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_wuxing_baihu
//#noname-kit-begin skill:shuoye_wuxing_qilin
    "shuoye_wuxing_qilin": {
        enable: ["chooseToUse", "chooseToRespond"],
        filter: function (event, player) {
            if (!player.countCards('hse') || player.hasSkill('shuoye_wuxing_qilin2')) return false;
            for (var i of lib.inpile) {
                var type = get.type2(i);
                if ((type == 'basic' || type == 'trick') && event.filterCard({ name: i }, player, event)) return true;
            }
            return false;
        },
        chooseButton: {
            dialog: function (event, player) {
                var list = [];
                for (var i = 0; i < lib.inpile.length; i++) {
                    var name = lib.inpile[i];
                    if (name == 'sha') {
                        if (event.filterCard({ name: name }, player, event)) list.push(['基本', '', 'sha']);
                        for (var j of lib.inpile_nature) {
                            if (event.filterCard({ name: name, nature: j }, player, event)) list.push(['基本', '', 'sha', j]);
                        }
                    }
                    else if (get.type2(name) == 'trick' && event.filterCard({ name: name }, player, event)) list.push(['锦囊', '', name]);
                    else if (get.type(name) == 'basic' && event.filterCard({ name: name }, player, event)) list.push(['基本', '', name]);
                }
                return ui.create.dialog('麒麟', [list, 'vcard']);
            },
            filter: function (button, player) {
                return _status.event.getParent().filterCard({ name: button.link[2] }, player, _status.event.getParent());
            },
            check: function (button) {
                if (_status.event.getParent().type != 'phase') return 1;
                var player = _status.event.player;
                if (['wugu', 'zhulu_card', 'yiyi', 'lulitongxin', 'lianjunshengyan', 'diaohulishan'].contains(button.link[2])) return 0;
                return player.getUseValue({
                    name: button.link[2],
                    nature: button.link[3],
                });
            },
            backup: function (links, player) {
                return {
                    filterCard: true,
                    popname: true,
                    check: function (card) {
                        return 8 - get.value(card);
                    },
                    position: 'hse',
                    viewAs: { name: links[0][2], nature: links[0][3] },
                    precontent: function () {
                        player.addTempSkill('shuoye_wuxing_qilin2');
                    },
                }
            },
            prompt: function (links, player) {
                return '将一张牌当做' + (get.translation(links[0][3]) || '') + get.translation(links[0][2]) + '使用';
            },
        },
        hiddenCard: function (player, name) {
            if (!lib.inpile.contains(name)) return false;
            var type = get.type2(name);
            return (type == 'basic' || type == 'trick') && player.countCards('she') > 0 && !player.hasSkill('shuoye_wuxing_qilin2');
        },
        ai: {
            fireAttack: true,
            respondSha: true,
            respondShan: true,
            skillTagFilter: function (player) {
                if (!player.countCards('hse') || player.hasSkill('shuoye_wuxing_qilin2')) return false;
            },
            order: 1,
            result: {
                player: function (player) {
                    if (_status.event.dying) return get.attitude(player, _status.event.dying);
                    return 1;
                },
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_wuxing_qilin
//#noname-kit-begin skill:shuoye_wuxing_qilin2
    "shuoye_wuxing_qilin2": {
        charlotte: true,
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_wuxing_qilin2
//#noname-kit-begin skill:shuoye_bazhen
    "shuoye_bazhen": {
        enable: "phaseUse",
        mark: true,
        skillAnimation: true,
        limited: true,
        animationColor: "orange",
        filterTarget: function (card, player, target) {
            return target.countGainableCards('hej', player);
        },
        selectTarget: [0, 1],
        content: function () {
            'step 0'
            player.awakenSkill(event.name);
            'step 1'
            if (target) {
                player.gainPlayerCard(target, 'hej', true);
            } else player.draw();
            'step 2'
            player.gainMaxHp(2)
            player.recover();
            player.addTempSkill('shuoye_bazhen_effect', 'roundStart');
        },
        ai: {
            order: 10,
            result: {
                target: -1,
            },
        },
        intro: {
            content: "limited",
        },
        init: (player, skill) => player.storage[skill] = false,
        subSkill: {
            effect: {
                trigger: {
                    player: "loseAfter",
                    global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
                },
                direct: true,
                charlotte: true,
                filter: function (event, player) {
                    if (event.name == 'gain' && event.player == player) return false;
                    var evt = event.getl(player);
                    return evt && evt.cards2 && evt.cards2.length;
                },
                content: function () {
                    'step 0'
                    player.chooseTarget('令一名角色回复1点体力', function (card, player, target) {
                        return target.isDamaged();
                    }).set('ai', function (target) {
                        return get.recoverEffect(target, _status.event.player, _status.event.player)
                    });
                    'step 1'
                    if (result.bool) {
                        var target = result.targets[0];
                        player.logSkill(event.name, target);
                        target.recover();
                    }
                },
                sub: true,
                "_priority": 0,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_bazhen
//#noname-kit-begin skill:shuoye_baishe
    "shuoye_baishe": {
        audio: "ext:朔夜/audio:12",
        enable: "chooseToUse",
        prompt: "你可以将黑色当做【借刀杀人】或者【无懈可击】，红色牌当【乐不思蜀】使用",
        intro: {
            content: "#/14",
        },
        filter(event, player) {
            var filter = event.filterCard;
            if ((filter({ name: 'lebu' }, player, event)) && player.countCards('hes', { color: 'red' })) return true;
            if ((filter({ name: 'jiedao' }, player, event) || filter({ name: 'wuxie' }, player, event)) && player.countCards('hes', { color: 'black' })) return true;
            return false;
        },
        chooseButton: {
            dialog(event, player) {
                var list = [];
                if (event.filterCard({ name: 'jiedao' }, player, event)) list.push(['锦囊', '', 'jiedao']);
                if (event.filterCard({ name: 'wuxie' }, player, event)) list.push(['锦囊', '', 'wuxie']);
                if (event.filterCard({ name: 'lebu' }, player, event)) list.push(['锦囊', '', 'lebu']);
                return ui.create.dialog('白蛇', [list, 'vcard']);
            },
            filter(button, player) {
                return _status.event.getParent().filterCard({ name: button.link[2] }, player, _status.event.getParent());
            },
            check(button) {
                if (_status.event.getParent().type != 'phase') return 1;
                var player = _status.event.player;
                return player.getUseValue({
                    name: button.link[2],
                    nature: button.link[3],
                });
            },
            backup(links, player) {
                return {
                    filterCard(card, player) {
                        if ((links[0][2]) == 'lebu') return get.color(card) == 'red';
                        else if ((links[0][2]) == 'jiedao' || (links[0][2]) == 'wuxie') return get.color(card) == 'black';
                    },
                    popname: true,
                    check(card) {
                        return 7 - get.value(card);
                    },
                    position: 'hes',
                    viewAs: {
                        name: links[0][2],
                        nature: links[0][3],
                        storage: { shuoye_baishe: true },
                    },
                }
            },
            prompt(links, player) {
                return '将一张牌当做' + (get.translation(links[0][3]) || '') + get.translation(links[0][2]) + '使用';
            },
        },
        ai: {
            order: 7,
            result: {
                player(player) {
                    return 1;
                },
            },
        },
        hiddenCard(player, name) {
            if (name == 'wuxie' && _status.connectMode && player.countCards('hes', { color: 'black' }) > 0) return true;
            if (name == 'wuxie') return player.countCards('hes', { color: 'black' });
        },
        group: "shuoye_baishe_use",
        subSkill: {
            use: {
                charlotte: true,
                forced: true,
                trigger: { player: ["useCardAfter", "respondAfter"] },
                filter(event, player) {
                    return event.card && event.card.storage && event.card.storage.shuoye_baishe;
                },
                async content(event, trigger, player) {
                    player.addMark("shuoye_baishe", 1, false);
                    if (player.countMark("shuoye_baishe") >= 14) {
                        player.addSkill("shuoye_xinyue");
                        player.addSkill("shuoye_qiangyun");
                    }
                    const card = get.cardPile(c => get.color(c) === "black");
                    if (card) {
                        await player.gain(card, "gain2");
                    }
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_baishe
//#noname-kit-begin skill:shuoye_xinyue
    shuoye_xinyue: {
        enable: "phaseUse",
        limited: true,
        skillAnimation: true,
        animationColor: "water",
        content() {
            'step 0'
            player.awakenSkill(event.name);
            'step 1'
            game.playAudio('../extension', '朔夜', 'audio/shuoye_xinyue_before.mp3');
            event.targets1 = game.filterPlayer().sortBySeat();
            event.targets2 = game.filterPlayer(i => i != player).sortBySeat()
            'step 2'
            game.playAudio('../extension', '朔夜', 'audio/shuoye_xinyue_begin.mp3');
            game.delay();
            'step 3'
            var current = event.targets1.shift();
            if (current.isIn()) current.damage();
            if (event.targets1.length) event.redo();
            'step 4'
            game.playAudio('../extension', '朔夜', 'audio/shuoye_xinyue_end.mp3');
            game.delay();
            'step 5'
            var cur = event.targets2.shift();
            if (cur.isIn() && cur.countCards('e')) {
                if (cur.countCards('e')) {
                    cur.discard(cur.getCards('e'));
                }
            }
            if (event.targets2.length) event.redo();
            'step 6'
            game.playAudio('../extension', '朔夜', 'audio/shuoye_xinyue_after.mp3');
            game.delay();
            'step 7'
            game.playAudio('../extension', '朔夜', 'audio/shuoye_xinyue_finally.mp3');
            game.delay();
            player.gainMaxHp();
            player.recover();
            player.addSkill('shuoye_tianzao');
            player.changeSkin({ characterName: "shuoye_puqishenfu" }, "shuoye_puqishenfu_tianzao");
            game.playAudio('../extension', '朔夜', 'audio/shuoye_xinyue_shangtiantang' + (Math.random() < 0.5 ? '1' : '2') + '.mp3');
        },
        ai: {
            order: 10,
            result: {
                player: function (player) {
                    return game.countPlayer(function (current) {
                        if (current != player) {
                            return get.sgn(get.damageEffect(current, player, player));
                        }
                    });
                },
            },
        },
        intro: {
            content: "limited",
        },
        init: (player, skill) => player.storage[skill] = false,
        mark: true,
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_xinyue
//#noname-kit-begin skill:shuoye_tianzao
    "shuoye_tianzao": {
        audio: "ext:朔夜/audio:2",
        trigger: {
            player: "loseAfter",
            global: ["phaseBefore", "equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
        },
        forced: true,
        filter: function (event, player) {
            if (event.name == 'phase') return true;
            if (event.name == 'gain' && event.player == player) return false;
            var evt = event.getl(player);
            if (!evt || !evt.hs || evt.hs.length == 0 || player.countCards('h') >= 1) return false;
            var evt = event;
            for (var i = 0; i < 7; i++) {
                evt = evt.getParent('shuoye_tianzao');
                if (evt.name != 'shuoye_tianzao') return true;
            }
            return false;
        },
        content: function () {
            var num = 1 - player.countCards('h');
            if (num > 0) player.draw(num);
        },
        mod: {
            cardnature: function (card, player) {
                if (get.name(card) == 'sha') return 'thunder';
            },
        },
        group: ["shuoye_tianzao_1", "shuoye_tianzao_2"],
        subSkill: {
            "1": {
                trigger: {
                    player: ["useCard", "useCardToPlayered"],
                },
                forced: true,
                filter: function (event, player, name) {
                    if (name == 'useCard') return event.card.name == 'sha' && game.hasNature(event.card, 'thunder');
                    return event.card.name == 'sha' && game.hasNature(event.card, 'thunder') && !event.getParent().directHit.contains(event.target);
                },
                logTarget: "target",
                content: function () {
                    if (event.triggername == 'useCard') {
                        trigger.baseDamage += 1;
                        return;
                    }
                    var id = trigger.target.playerid;
                    var map = trigger.getParent().customArgs;
                    if (!map[id]) map[id] = {};
                    if (typeof map[id].shanRequired == 'number') {
                        map[id].shanRequired++;
                    }
                    else {
                        map[id].shanRequired = 2;
                    }
                },
                ai: {
                    "directHit_ai": true,
                    skillTagFilter: function (player, tag, arg) {
                        if (arg.card.name != 'sha' || arg.target.countCards('h', 'shan') > 1) return false;
                    },
                },
                sub: true,
                "_priority": 0,
            },
            "2": {
                audio: "ext:朔夜/audio:2",
                trigger: {
                    player: "phaseAfter",
                },
                "prompt2": "你可以执行一个额外的回合",
                filter: function (event, player) {
                    return event.name == 'phase' && !event.skill;
                },
                content: function () {
                    player.insertPhase();
                },
                sub: true,
                "_priority": 0,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_tianzao
//#noname-kit-begin skill:shuoye_qiangyun
    "shuoye_qiangyun": {
        audio: "ext:朔夜/audio:2",
        trigger: {
            player: "dying",
        },
        forced: true,
        content: function () {
            'step 0'
            player.judge(function (card) {
                return get.suit(card) == 'heart' ? 2 : -2;
            });
            'step 1'
            if (result.bool) {
                game.playAudio('../extension', '朔夜', 'audio/判红桃复活.mp3');
                player.recover(1 - player.hp);
            }
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_qiangyun
//#noname-kit-begin skill:shuoye_shuangsheng
    shuoye_shuangsheng: {
        derivation: ["shuoye_shuangsheng_true", "shuoye_shuangsheng_recover", "shuoye_shuangsheng_false", "shuoye_shuangsheng_damage"],
        mark: true,
        locked: false,
        zhuanhuanji: true,
        marktext: "☯",
        intro: {
            content: function (storage, player, skill) {
                var str = player.storage[skill] ? '你可以弃该花色的牌，视为对他人或自己使用【桃】。场上每有一名角色恢复1点体力，你可摸一张牌' : '该花色的牌可以造成双倍伤害。场上每有角色造成1点伤害，你摸一张牌';
                if (player.storage[skill + '_Skill']) {
                    str += '<br><li>当前花色：';
                    str += get.translation(player.storage[skill + '_Skill']);
                }
                return str;
            },
        },
        enable: "phaseUse",
        usable: 1,
        content: function () {
            'step 0'
            event.shuangshengBefore = player.getCards('h').slice();
            player.draw();
            player.changeZhuanhuanji('shuoye_shuangsheng');
            player.markSkill('shuoye_shuangsheng');
            'step 1'
            if (player.storage[event.name] == true) game.playAudio('../extension', '朔夜', 'audio/shuoye_shuangsheng_changeZhuanhuanji_false.mp3');
            else game.playAudio('../extension', '朔夜', 'audio/shuoye_shuangsheng_changeZhuanhuanji_true.mp3');
            var drawn = player.getCards('h').filter(card => !event.shuangshengBefore.includes(card));
            if (drawn.length) {
                player.storage[event.name + '_Skill'] = get.suit(drawn[0]);
                player.markSkill(event.name + '_Skill');
            }
            var storage = player.storage[event.name];
            player.addAdditionalSkill(event.name, lib.skill[event.name].derivation.slice(0).splice(storage ? 0 : 2, -2));
        },
        mod: {
            cardUsable: function (card, player, num) {
                if (!player.storage.shuoye_shuangsheng_Skill) return;
                var suit = player.storage.shuoye_shuangsheng_Skill;
                if (get.suit(card) == suit) return Infinity;
            },
            targetInRange: function (card, player) {
                if (!player.storage.shuoye_shuangsheng_Skill) return;
                var suit = player.storage.shuoye_shuangsheng_Skill;
                if (get.suit(card) == suit) return true;
            },
        },
        subSkill: {
            true: {
                enable: "chooseToUse",
                viewAsFilter: function (player) {
                    if (!player.storage.shuoye_shuangsheng_Skill) return false;
                    var suit = player.storage.shuoye_shuangsheng_Skill;
                    return player.countCards('hes', { suit: suit }) > 0;
                },
                filterCard: function (card) {
                    var player = _status.event.player;
                    var suit = player.storage.shuoye_shuangsheng_Skill;
                    return get.suit(card) == suit;
                },
                position: "hes",
                viewAs: {
                    name: "tao",
                    isCard: true,
                },
                prompt: "视为使用一张【桃】",
                check: function (card) {
                    return 10 - get.value(card);
                },
                sub: true,
                ai: {
                    basic: {
                        order: (card, player) => {
                            if (player.hasSkillTag('pretao')) return 9;
                            return 2;
                        },
                        useful: (card, i) => {
                            let player = _status.event.player;
                            if (!game.checkMod(card, player, 'unchanged', 'cardEnabled2', player)) return 2 / (1 + i);
                            let fs = game.filterPlayer(current => {
                                return get.attitude(player, current) > 0 && current.hp <= 2;
                            }), damaged = 0, needs = 0;
                            fs.forEach(f => {
                                if (f.hp > 3 || !lib.filter.cardSavable(card, player, f)) return;
                                if (f.hp > 1) damaged++;
                                else needs++;
                            });
                            if (needs && damaged) return 5 * needs + 3 * damaged;
                            if (needs + damaged > 1 || player.hasSkillTag('maixie')) return 8;
                            if (player.hp / player.maxHp < 0.7) return 7 + Math.abs(player.hp / player.maxHp - 0.5);
                            if (needs) return 7;
                            if (damaged) return Math.max(3, 7.8 - i);
                            return Math.max(1, 7.2 - i);
                        },
                        value: (card, player) => {
                            let fs = game.filterPlayer(current => {
                                return get.attitude(_status.event.player, current) > 0;
                            }), damaged = 0, needs = 0;
                            fs.forEach(f => {
                                if (!player.canUse('tao', f)) return;
                                if (f.hp <= 1) needs++;
                                else if (f.hp == 2) damaged++;
                            });
                            if (needs && damaged || player.hasSkillTag('maixie')) return Math.max(9, 5 * needs + 3 * damaged);
                            if (needs || damaged > 1) return 8;
                            if (damaged) return 7.5;
                            return Math.max(5, 9.2 - player.hp);
                        },
                    },
                    result: {
                        target: (player, target) => {
                            if (target.hasSkillTag('maixie')) return 3;
                            return 2;
                        },
                        "target_use": (player, target, card) => {
                            if (player === _status.currentPhase && player.hasSkillTag('nokeep', true, {
                                card: card,
                                target: target
                            }, true)) return 2;
                            let mode = get.mode(),
                                taos = player.getCards('hs', i => get.name(i) === 'tao' && lib.filter.cardEnabled(i, target, 'forceEnable'));
                            if (target.hp > 0) {
                                if (!player.isPhaseUsing()) return 0;
                                let min = 7.2 - 4 * player.hp / player.maxHp,
                                    nd = player.needsToDiscard(-player.countCards('h', i => !taos.includes(i) && get.value(i) < min)),
                                    keep = nd ? 0 : 2;
                                if (nd > 2 || taos.length > 1 && (nd > 1 || nd && player.hp < 1 + taos.length) || target.identity === 'zhu' && (nd || target.hp < 3) && (mode === 'identity' || mode === 'versus' || mode === 'chess') || !player.hasFriend()) return 2;
                                if (game.hasPlayer(current => {
                                    return player !== current && current.identity === 'zhu' && current.hp < 3 && (mode === 'identity' || mode === 'versus' || mode === 'chess') && get.attitude(player, current) > 0;
                                })) keep = 3;
                                else if (nd === 2 || player.hp < 2) return 2;
                                if (nd === 2 && player.hp <= 1) return 2;
                                if (keep === 3) return 0;
                                if (taos.length <= player.hp / 2) keep = 1;
                                if (keep && game.countPlayer(current => {
                                    if (player !== current && current.hp < 3 && player.hp > current.hp && get.attitude(player, current) > 2) {
                                        keep += player.hp - current.hp;
                                        return true;
                                    }
                                    return false;
                                })) {
                                    if (keep > 2) return 0;
                                }
                                return 2;
                            }
                            if (target.isZhu2() || target === game.boss) return 2;
                            if (player !== target) {
                                if (target.hp < 0 && taos.length + target.hp <= 0) return 0;
                                if (Math.abs(get.attitude(player, target)) < 1) return 0;
                            }
                            if (!player.getFriends().length) return 2;
                            let tri = _status.event.getTrigger(),
                                num = game.countPlayer(current => {
                                    if (get.attitude(current, target) > 0) return current.countCards('hs', i => get.name(i) === 'tao' && lib.filter.cardEnabled(i, target, 'forceEnable'));
                                }),
                                dis = 1,
                                t = _status.currentPhase || game.me;
                            while (t !== target) {
                                let att = get.attitude(player, t);
                                if (att < -2) dis++;
                                else if (att < 1) dis += 0.45;
                                t = t.next;
                            }
                            if (mode === 'identity') {
                                if (tri && tri.name === 'dying') {
                                    if (target.identity === 'fan') {
                                        if (!tri.source && player !== target || tri.source && tri.source !== target && player.getFriends().includes(tri.source.identity)) {
                                            if (num > dis || player === target && player.countCards('hs', { type: 'basic' }) > 1.6 * dis) return 2;
                                            return 0;
                                        }
                                    }
                                    else if (tri.source && tri.source.isZhu && (target.identity === 'zhong' || target.identity === 'mingzhong') &&
                                        (tri.source.countCards('he') > 2 || player === tri.source && player.hasCard((i) => i.name !== 'tao', 'he'))) return 2;
                                    //if(player!==target&&!target.isZhu&&target.countCards('hs')<dis) return 0;
                                }
                                if (player.identity === 'zhu') {
                                    if (player.hp <= 1 && player !== target && taos + player.countCards('hs', 'jiu') <= Math.min(dis, game.countPlayer(current => {
                                        return current.identity === 'fan';
                                    }))) return 0;
                                }
                            }
                            else if (mode === 'stone' && target.isMin() && player !== target && tri && tri.name === 'dying' && player.side === target.side && tri.source !== target.getEnemy()) return 0;
                            return 2;
                        },
                    },
                    tag: {
                        recover: 1,
                        save: 1,
                    },
                },
                "_priority": 0,
            },
            recover: {
                trigger: {
                    global: "recoverEnd",
                },
                filter: function (event, player) {
                    return player.storage.shuoye_shuangsheng && player.storage.shuoye_shuangsheng == true;
                },
                "prompt2": "当有角色回复1点体力后，你可以摸一张牌",
                content: function () {
                    'step 0'
                    event.count = trigger.num;
                    'step 1'
                    event.count--;
                    player.draw();
                    'step 2'
                    if (event.count > 0 && player.hasSkill('shuoye_shuangsheng')) {
                        player.chooseBool(get.prompt2('shuoye_shuangsheng')).set('frequentSkill', 'shuoye_shuangsheng');
                    }
                    'step 3'
                    if (result.bool) {
                        event.goto(1);
                    }
                },
                sub: true,
                "_priority": 0,
            },
            false: {
                trigger: {
                    source: "damageBegin1",
                },
                filter: function (event, player) {
                    if (!player.storage.shuoye_shuangsheng || player.storage.shuoye_shuangsheng == true) return false;
                    if (!player.storage.shuoye_shuangsheng_Skill) return;
                    var suit = player.storage.shuoye_shuangsheng_Skill;
                    return event.card && get.suit(event.card) == suit;
                },
                "prompt2": function (event, player) {
                    return '你可以令' + get.translation(event.card) + '造成的伤害翻倍';
                },
                content: function () {
                    trigger.num = trigger.num * 2;
                },
                sub: true,
                "_priority": 0,
            },
            damage: {
                trigger: {
                    global: "damageSource",
                },
                forced: true,
                locked: false,
                priority: 22,
                filter: function (event, player) {
                    return player.storage.shuoye_shuangsheng == false;
                },
                content: function () {
                    player.draw(trigger.num);
                },
                sub: true,
                "_priority": 2200,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_shuangsheng
//#noname-kit-begin skill:shuoye_yongheng
    "shuoye_yongheng": {
        trigger: {
            global: "useCardEnd",
        },
        forced: true,
        locked: false,
        filter: function (event, player) {
            if (!get.tag(event.card, 'damage')) return false;
            if (!event.targets || !event.targets.includes(player)) return false;
            return event.player.getHistory('useCard', function (evt) {
                return get.tag(event.card, 'damage');
            }).indexOf(event) == 0 && !player.hasHistory('damage', evt => evt.card == event.card);
        },
        logTarget: "player",
        content: function () {
            player.addTempSkill(event.name + '_cancel');
            player.markAuto(event.name + '_cancel', [trigger.player]);
        },
        subSkill: {
            cancel: {
                trigger: {
                    player: "damageBefore",
                },
                charlotte: true,
                firstDo: true,
                silent: true,
                onremove: true,
                filter: function (event, player) {
                    return event.source && player.getStorage('shuoye_yongheng_cancel').includes(event.source);
                },
                content: function () {
                    trigger.cancel();
                },
                sub: true,
                forced: true,
                popup: false,
                "_priority": 1,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_yongheng
//#noname-kit-begin skill:shuoye_laoyin
    "shuoye_laoyin": {
        derivation: ["shuoye_laoyin_zhongmo", "shuoye_laoyin_dansheng"],
        enable: "phaseUse",
        usable: 1,
        filterTarget: true,
        content: function () {
            'step 0'
            player.loseMaxHp();
            player.chooseControl(['终末', '诞生']).set('ai', function () {
                return Math.ceil(Math.random());
            });
            'step 1'
            target.addSkill(result.control == '终末' ? 'shuoye_laoyin_zhongmo' : 'shuoye_laoyin_dansheng');
            target.addMark(result.control == '终末' ? 'shuoye_laoyin_zhongmo' : 'shuoye_laoyin_dansheng');
        },
        ai: {
            order: 10,
            result: {
                target: function (player, target) {
                    if (player.maxHp < 2) return 0;
                    return -1;
                },
            },
        },
        group: "shuoye_laoyin_die",
        subSkill: {
            die: {
                trigger: {
                    global: "dieAfter",
                },
                forced: true,
                locked: false,
                priority: 12,
                filter: function (event, player) {
                    return lib.skill.shuoye_laoyin.derivation.some(i => event.player.countMark(i));
                },
                content: function () {
                    var num = 0;
                    lib.skill.shuoye_laoyin.derivation.forEach(i => num += trigger.player.countMark(i) ? 1 : 0);
                    player.gainMaxHp(num);
                },
                sub: true,
                "_priority": 1200,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_laoyin
//#noname-kit-begin skill:shuoye_laoyin_zhongmo
    "shuoye_laoyin_zhongmo": {
        trigger: {
            global: "useCard",
        },
        charlotte: true,
        firstDo: true,
        silent: true,
        filter: function (event, player) {
            return get.tag(event.card, 'damage');
        },
        content: function () {
            if (trigger.player == player) {
                trigger.directHit.addArray(game.filterPlayer());
            } else trigger.directHit.add(player);

        },
        ai: {
            "directHit_ai": true,
            skillTagFilter: function (player, tag, arg) {
                return player.countMark('shuoye_laoyin_zhongmo');
            },
        },
        mark: true,
        intro: {
            markcount: () => 0,
            content: "终末",
        },
        forced: true,
        popup: false,
        "_priority": 1,
    },
//#noname-kit-end skill:shuoye_laoyin_zhongmo
//#noname-kit-begin skill:shuoye_laoyin_dansheng
    "shuoye_laoyin_dansheng": {
        trigger: {
            source: "damageBefore",
            player: "damageBefore",
        },
        direct: true,
        filter: function (event, player) {
            if (!event.source || !event.source.isIn()) return false;
            return [event.source, event.player].some(p => p != player);
        },
        content: function () {
            'step 0'
            trigger.source.chooseBool('将此伤害改为令' + get.translation(trigger.player) + '回复体力').set('ai', () => {
                return get.attitude(_status.event.player, trigger.player) > 0;
            });
            'step 1'
            if (!result.bool) return;
            var sourcex = [trigger.source == player ? 'player' : 'source'];
            player.logSkill(event.name, sourcex);
            trigger.cancel();
            trigger.player.recover(trigger.num);
        },
        mark: true,
        intro: {
            markcount: () => 0,
            content: "诞生",
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_laoyin_dansheng
//#noname-kit-begin skill:shuoye_kuanghuan
    "shuoye_kuanghuan": {
        audio: "ext:朔夜/audio:2",
        trigger: {
            player: ["useCard", "respond"],
        },
        direct: true,
        filter: function (event, player) {
            if (player.hasSkill('shuoye_kuanghuan_used')) return false;
            if (!player.storage.shuoye_kuanghuan_mark) return false;
            return get.type(event.card) != player.storage.shuoye_kuanghuan_mark;
        },
        content: function () {
            'step 0'
            var num = player.storage[event.name];
            var list = ['选项一', '选项二'];
            player.chooseControl(list, 'cancel2').set('choiceList', [
                '摸一张牌，并令X加或减一',
                '摸X（' + get.cnNumber(num) + '）张牌，然后本回合不能再发动此技能',
            ]);
            'step 1'
            if (result.control == 'cancel2') {
                event.finish();
                return;
            }
            player.logSkill(event.name);
            if (result.control == '选项一') {
                player.draw();
                player.chooseControl('+1', '-1');
            } else {
                var num = player.storage[event.name];
                if (num > 0) player.draw(num);
                player.addTempSkill(event.name + '_used');
                event.finish();
            }
            'step 2'
            player.storage[event.name] += (result.control == '+1' ? 1 : -1);
            if (player.storage[event.name] < 0) player.storage[event.name] = 0;
        },
        init: (player, skill) => {
            if (!player.storage[skill]) player.storage[skill] = 0;
            player.addSkill('shuoye_kuanghuan_mark');
        },
        onremove: (player, skill) => {
            player.removeSkill('shuoye_kuanghuan_mark');
        },
        subSkill: {
            used: {
                charlotte: true,
                mark: true,
                onremove: true,
                intro: {
                    markcount: function (storage) {
                        return '失效';
                    },
                },
                sub: true,
                "_priority": 0,
            },
            mark: {
                trigger: {
                    player: ["useCardAfter", "respondAfter"],
                },
                charlotte: true,
                silent: true,
                content: function () {
                    player.storage.shuoye_kuanghuan_mark = get.type2(trigger.card);
                },
                mark: true,
                intro: {
                    markcount: function (card, player) {
                        return get.translation(card);
                    },
                    content: "$",
                },
                sub: true,
                forced: true,
                popup: false,
                "_priority": 1,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_kuanghuan
//#noname-kit-begin skill:shuoye_lianjin
    "shuoye_lianjin": {
        audio: "ext:朔夜/audio:2",
        enable: ["chooseToUse", "chooseToRespond"],
        filter: function (event, player) {
            if (!player.countCards('hse')) return false;
            if (!player.storage.shuoye_kuanghuan) return false;
            for (var i of lib.inpile) {
                var type = get.type2(i);
                if (!['basic', 'trick'].includes(type)) continue;
                if (player.getStorage('shuoye_lianjin_used').includes(i)) continue;
                if (get.cardNameLength(i) != player.storage.shuoye_kuanghuan) continue;
                if (event.filterCard({ name: i }, player, event)) return true;
            }
            return false;
        },
        chooseButton: {
            dialog: function (event, player) {
                var list = [];
                for (var i = 0; i < lib.inpile.length; i++) {
                    var name = lib.inpile[i];
                    if (get.type2(name) == 'trick' && event.filterCard({ name: name }, player, event)) list.push(['锦囊', '', name]);
                    else if (get.type(name) == 'basic' && event.filterCard({ name: name }, player, event)) list.push(['基本', '', name]);
                }
                return ui.create.dialog('炼金', [list, 'vcard']);
            },
            filter: function (button, player) {
                if (player.getStorage('shuoye_lianjin_used').includes(button.link[2])) return false;
                if (get.cardNameLength(button.link[2]) != player.storage.shuoye_kuanghuan) return false;
                return _status.event.getParent().filterCard({ name: button.link[2] }, player, _status.event.getParent());
            },
            check: function (button) {
                if (_status.event.getParent().type != 'phase') return 1;
                var player = _status.event.player;
                if (['wugu', 'zhulu_card', 'yiyi', 'lulitongxin', 'lianjunshengyan', 'diaohulishan'].contains(button.link[2])) return 0;
                return player.getUseValue({
                    name: button.link[2],
                    nature: button.link[3],
                });
            },
            backup: function (links, player) {
                return {
                    audio: 'shuoye_lianjin',
                    filterCard: true,
                    popname: true,
                    check: function (card) {
                        return 8 - get.value(card);
                    },
                    position: 'hse',
                    viewAs: { name: links[0][2], nature: links[0][3] },
                    onuse: function () {
                        _status.event.addCount = false;
                    },
                    precontent: function () {
                        player.addTempSkill('shuoye_lianjin_used');
                        player.markAuto('shuoye_lianjin_used', [event.result.card.name])
                    },
                }
            },
            prompt: function (links, player) {
                return '将一张牌当做' + (get.translation(links[0][3]) || '') + get.translation(links[0][2]) + '使用';
            },
        },
        hiddenCard: function (player, name) {
            if (!lib.inpile.contains(name)) return false;
            if (!player.storage.shuoye_kuanghuan) return false;
            var type = get.type2(name);
            return (type == 'basic' || type == 'trick') && player.countCards('she') > 0 && get.cardNameLength(name) == player.storage.shuoye_kuanghuan;
        },
        ai: {
            combo: "shuoye_kuanghuan",
            respondSha: true,
            respondShan: true,
            skillTagFilter: function (player) {
                if (!player.countCards('hse') || !player.storage.shuoye_kuanghuan) return false;
            },
            order: 1,
            result: {
                player: function (player) {
                    if (_status.event.dying) return get.attitude(player, _status.event.dying);
                    return 1;
                },
            },
        },
        subSkill: {
            backup: {
                sub: true,
                "_priority": 0,
            },
            used: {
                charlotte: true,
                onremove: true,
                mark: true,
                intro: {
                    content: "已使用过的牌名：$",
                },
                sub: true,
                "_priority": 0,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_lianjin
//#noname-kit-begin skill:shuoye_zhuyuan
    "shuoye_zhuyuan": {
        global: "shuoye_zhuyuan_global",
        marktext: "愿",
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
        onremove: function (player, skill) {
            var cards = player.getExpansions(skill);
            if (cards.length) player.loseToDiscardpile(cards);
        },
        subSkill: {
            global: {
                trigger: {
                    player: "phaseDrawBegin2",
                },
                filter(event, player) {
                    if (!game.hasPlayer(current => current.hasSkill('shuoye_zhuyuan'))) return false;
                    return !event.numFixed;
                },
                prompt2: "你可以多摸三张牌，然后将两张牌置于武将牌上，称为【愿】",
                async content(event, trigger, player) {
                    trigger.num += 3;
                    trigger._shuoye_zhuyuan = true;
                    player.when('gainAfter')
                        .filter((event, player) => event.getParent(2)._shuoye_zhuyuan && player.countCards('he') >= 2)
                        .then(() => {
                            if (player.countCards('he') >= 2) player.chooseCard('he', 2, true, '将两张牌置于武将牌上，称为“愿”');
                            else event.finish();
                        })
                        .then(() => {
                            player.addToExpansion(result.cards, 'giveAuto').gaintag.add('shuoye_zhuyuan');
                        })
                },
                sub: true,
                "_priority": 0,
            },
        },
        "_priority": 0,
    },
//#noname-kit-end skill:shuoye_zhuyuan
//#noname-kit-begin skill:shuoye_eyao
    "shuoye_eyao": {
        enable: ["chooseToUse", "chooseToRespond"],
        hiddenCard: function (player, name) {
            const targets = game.filterPlayer(target => target.getExpansions('shuoye_zhuyuan').length);
            const cards = targets.map(target => target.getExpansions('shuoye_zhuyuan')).flat();;
            const list = cards.map(card => card.name);
            if (list.includes(name) && _status.currentPhase != player) return true;
        },
        filter: function (event, player) {
            if (_status.currentPhase == player || event.responded || event.shuoye_eyao) return false;
            const targets = game.filterPlayer(target => target.getExpansions('shuoye_zhuyuan').length);
            const cards = targets.map(target => target.getExpansions('shuoye_zhuyuan')).flat();
            const list = cards.map(card => card.name);
            for (var i of lib.inpile) {
                if (list.includes(i) && event.filterCard(get.autoViewAs({ name: i }, 'unsure'), player, event)) return true;
            }
            return false;
        },
        delay: false,
        async content(event, trigger, player) {
            var evt = event.getParent(2);
            evt.set('shuoye_eyao', true);
            const targets = game.filterPlayer(target => target.getExpansions('shuoye_zhuyuan').length);
            var cards = targets.map(target => target.getExpansions('shuoye_zhuyuan')).flat()
                .filter(function (card) {
                    return evt.filterCard(card, evt.player, evt);
                });
            var aozhan = player.hasSkill('aozhan');
            const result = await player.chooseButton(['恶曜：选择要使用或打出的牌', cards])
                .set('filterButton', function (button) {
                    return _status.event.cards.includes(button.link);
                })
                .set('cards', cards)
                .set('ai', function (button) {
                    var evt = _status.event.getParent(3), player = _status.event.player;
                    if (evt.type == 'phase' && !player.hasValueTarget(button.link, null, true)) return 0;
                    if (evt && evt.ai) {
                        var tmp = _status.event;
                        _status.event = evt;
                        var result = (evt.ai || event.ai1)(button.link, _status.event.player, evt);
                        _status.event = tmp;
                        return result;
                    }
                    return 1;
                }).forResult();
            if (result.bool && result.links && result.links.length) {
                var card = result.links[0];
                var name = card.name;
                game.broadcastAll(function (result, name) {
                    lib.skill.shuoye_eyao_backup.viewAs = { name: name, cards: [result], isCard: true };
                }, card, name);
                evt.set('_backupevent', 'shuoye_eyao_backup');
                evt.set('openskilldialog', ('请选择' + get.translation(card) + '的目标'))
                evt.backup('shuoye_eyao_backup');
            }
            evt.goto(0);
        },
        ai: {
            effect: {
                target: function (card, player, target, effect) {
                    if (get.tag(card, 'respondShan')) return 0.7;
                    if (get.tag(card, 'respondSha')) return 0.7;
                },
            },
            order: 12,
            respondShan: true,
            respondSha: true,
            result: {
                player: function (player) {
                    if (_status.event.dying) return get.attitude(player, _status.event.dying);
                    return 1;
                },
            },
        },
        marktext: "曜",
        intro: {
            content: "mark",
        },
        group: "shuoye_eyao_useCard",
        subSkill: {
            useCard: {
                trigger: {
                    global: "useCard",
                },
                direct: true,
                locked: true,
                filter(event, player) {
                    return event.player.getExpansions('shuoye_zhuyuan').length;
                },
                async content(event, trigger, player) {
                    const cards = trigger.player.getExpansions('shuoye_zhuyuan').filter(card => player.hasUseTarget(card));
                    if (cards.length) {
                        const result = await player.chooseButton(['选择要使用的牌', cards]).set('ai', function (button) {
                            return get.order(button.link);
                        }).forResult();
                        if (result.bool) {
                            const card = result.links[0];
                            player.logSkill(event.name);
                            const { bool } = await player.chooseUseTarget(card, true, false).forResult();
                            if (player.hasHistory('sourceDamage', evt => evt.getParent(4) == event)) {
                                const count = player.getHistory('sourceDamage', evt => evt.getParent(4) == event).map(evt => evt.num).reduce((p, c) => p + c, 0);
                                await player.addMark('shuoye_eyao', count);
                                if (player.countMark('shuoye_eyao') >= player.maxHp) {
                                    player.removeMark('shuoye_eyao', player.countMark('shuoye_eyao'));
                                    await player.gainMaxHp();
                                    player.recover();
                                }
                            }
                        }
                    }
                },
                sub: true,
                "_priority": 0,
            },
            backup: {
                sourceSkill: "shuoye_eyao",
                precontent: function () {
                    delete event.result.skill;
                    var name = event.result.card.name, cards = event.result.card.cards.slice(0);
                    event.result.cards = cards;
                    var rcard = cards[0], card;
                    if (rcard.name == name) card = get.autoViewAs(rcard);
                    else card = get.autoViewAs({ name, isCard: true });
                    event.result.card = card;
                },
                filterCard: function () { return false },
                selectCard: -1,
            },
        },
    },
//#noname-kit-end skill:shuoye_eyao
//#noname-kit-begin skill:shuoye_jingtu
    shuoye_jingtu: {
        dieContentx() {
            'step 0'
            event.forceDie = true;
            if (player.isIn() && (!_status.shuoye_jingtu_return || !_status.shuoye_jingtu_return[player.playerid])) {
                event.reserveOut = true;
                game.log(player, '进入了修整状态');
                game.log(player, '移出了游戏');
                //game.addGlobalSkill('shuoye_jingtu_return');
                if (!_status.shuoye_jingtu_return) _status.shuoye_jingtu_return = {};
                _status.shuoye_jingtu_return[player.playerid] = 1;
            }
            else event.finish();
            // 里香是召唤物：只剩她活着不算“场上还有人”，否则净土修整后永远不结算
            if (
                !game.countPlayer(
                    (current) =>
                        !(
                            current &&
                            ((current.storage && current.storage.shuoye_summon) || current.name1 === "shuoye_liixiang" || current.name2 === "shuoye_liixiang")
                        )
                )
            )
                game.over();
            else if (player.hp != 0) {
                player.changeHp(0 - player.hp, false).forceDie = true;
            }
            game.broadcastAll(function (player) {
                if (player.isLinked()) {
                    if (get.is.linked2(player)) {
                        player.classList.toggle('linked2');
                    }
                    else {
                        player.classList.toggle('linked');
                    }
                }
                if (player.isTurnedOver()) {
                    player.classList.toggle('turnedover');
                }
            }, player);
            game.addVideo('link', player, player.isLinked());
            game.addVideo('turnOver', player, player.classList.contains('turnedover'));
            'step 1'
            event.trigger('die');
            'step 2'
            if (event.reserveOut) {
                if (!game.reserveDead) {
                    for (var mark in player.marks) {
                        if (['shuoye_zhuyuan', 'shuoye_eyao'].includes(mark)) continue;
                        player.unmarkSkill(mark);
                    }
                    var count = 1;
                    var list = Array.from(player.node.marks.childNodes);
                    if (list.some(i => i.name == 'mbdanggu')) count++;
                    while (player.node.marks.childNodes.length > count) {
                        var node = player.node.marks.lastChild;
                        if (node.name == 'mbdanggu') {
                            node = node.previousSibling;
                        }
                        node.remove();
                    }
                    game.broadcast(function (player, count) {
                        while (player.node.marks.childNodes.length > count) {
                            var node = player.node.marks.lastChild;
                            if (node.name == 'mbdanggu') {
                                node = node.previousSibling;
                            }
                            node.remove();
                        }
                    }, player, count);
                }
                for (var i in player.tempSkills) {
                    player.removeSkill(i);
                }
                var skills = player.getSkills();
                for (var i = 0; i < skills.length; i++) {
                    if (lib.skill[skills[i]].temp) {
                        player.removeSkill(skills[i]);
                    }
                }
                event.cards = player.getCards('hejsx');
                if (event.cards.length) {
                    player.discard(event.cards).forceDie = true;
                }
            }
            'step 3'
            if (event.reserveOut) {
                game.broadcastAll(function (player, list) {
                    player.classList.add('out');
                    if (list.includes(player.name1) || player.name1 == 'shichangshi') {
                        player.smoothAvatar(false);
                        player.node.avatar.setBackground(player.name1 + '_dead', 'character');
                    }
                    if (list.includes(player.name2) || player.name2 == 'shichangshi') {
                        player.smoothAvatar(true);
                        player.node.avatar2.setBackground(player.name2 + '_dead', 'character');
                    }
                }, player, lib.skill.mbdanggu.changshi.map(i => i[0]));
            }
        },
        group: ['shuoye_jingtu_begin', 'shuoye_jingtu_end', 'shuoye_jingtu_return'],
        subSkill: {
            begin: {
                trigger: {
                    player: 'phaseBegin',
                },
                popup: false,
                locked: true,
                filter(event, player) {
                    return game.hasPlayer(current => current.getExpansions('shuoye_zhuyuan').length);
                },
                async cost(event, trigger, player) {
                    event.result = await player.chooseTarget(function (card, player, target) {
                        return target.getExpansions('shuoye_zhuyuan').length;
                    })
                        .set('selectTarget', [1, game.countPlayer()])
                        .set('prompt', get.prompt('shuoye_jingtu'))
                        .set('prompt2', `你的回合开始时，你可以将任意名角色武将牌上的【愿】置入你的手牌区，然后你减少等量的体力上限`)
                        .set('ai', function (target) {
                            if (ui.selected.targets.length >= player.maxHp - 1) return 0;
                            return 1;
                        }).forResult();
                },
                async content(event, trigger, player) {
                    player.logSkill(event.name, event.targets);
                    for (const target of event.targets) {
                        await player.gain(target.getExpansions('shuoye_zhuyuan'), 'gain2');
                    }
                    player.loseMaxHp(event.targets.length);
                },
            },
            end: {
                trigger: {
                    player: 'phaseEnd',
                },
                locked: true,
                filter(event, player) {
                    return player.maxHp > 3;
                },
                prompt2(event, player) {
                    return `你的回合结束时，若你的体力上限大于3，你可以减少一点体力上限，然后进入一轮修整状态`;
                },
                async content(event, trigger, player) {
                    await player.loseMaxHp();
                    await player.rest({ type: "round", count: 1 });
                },
            },
            die: {
                trigger: {
                    player: "dieBefore",
                },
                forced: true,
                direct: true,
                priority: 15,
                filter(event, player) {
                    if (!event.shuoye_jingtu_end) return false;
                    return event.getParent().name != 'giveup' && player.maxHp > 0;
                },
                async content(event, trigger, player) {
                    if (_status.mbmowang_return && _status.mbmowang_return[player.playerid]) {
                        trigger.cancel();
                    }
                    else {
                        player.logSkill(event.name);
                        game.broadcastAll(function () {
                            if (lib.config.background_speak) game.playAudio('die', 'shichangshiRest');
                        });
                        trigger.setContent(lib.skill.mbmowang.dieContent);
                        trigger.includeOut = true;
                    }
                },
            },
            return: {
                trigger: {
                    global: 'roundStart',
                },
                forced: true,
                charlotte: true,
                silent: true,
                forceDie: true,
                forceOut: true,
                filter(event, player) {
                    return player.isOut() && !!(_status._rest_return && _status._rest_return[player.playerid]);
                },
                async content(event, trigger, player) {
                    await player.restEnd();
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_jingtu
//#noname-kit-begin skill:shuoye_yimeng
    "shuoye_yimeng": {
        trigger: {
            player: "phaseUseBegin",
        },
        filter(event, player) {
            const num = player.getAllHistory('useSkill', evt => evt.skill == 'shuoye_yimeng').length + 1;
            const numx = player.getAllHistory('useSkill', evt => evt.skill == 'shuoye_jingtu').length;
            var targets = game.filterPlayer(target => target != player);
            return targets.every(target => player.getAllHistory('useSkill', evt => evt.skill == 'shuoye_jingtu' && evt.targets && evt.targets.includes(target)).length >= num);
        },
        async content(event, trigger, player) {
            const targets = game.filterPlayer(target => target != player);
            while (targets.length) {
                const target = targets.shift();
                if (target.isIn()) target.damage('thunder');
                if (target.countDiscardableCards(player, 'h')) {
                    const result = await player.discardPlayerCard(target, 'h', 3, true).forResult();
                }
                target.discard(target.getCards('e')).set('discarder', player);
            }
            player.addTempSkill('shuoye_yimeng_effect', { player: 'phaseUseBefore' });
        },
        subSkill: {
            effect: {
                trigger: {
                    source: "damageBegin1",
                    player: "useCard",
                },
                forced: true,
                popup: false,
                charlotte: true,
                filter(event, player, name) {
                    if (name == 'useCard') return true;
                    return !event.hasNature('thunder');
                },
                async content(event, trigger, player) {
                    if (event.triggername == 'damageBegin1') game.setNature(trigger, 'thunder');
                    else trigger.directHit.addArray(game.players);
                },
                mark: true,
                intro: {
                    content: "你造成的伤害都视为雷电伤害且使用牌不可被响应",
                },
                sub: true,
                "_priority": 0,
            },
        },
    },
//#noname-kit-end skill:shuoye_yimeng

//#noname-kit-begin skill:shuoye_zhongzhuang
    shuoye_zhongzhuang: {
        locked: true,
        getLimit: 7,
        group: ['shuoye_zhongzhuang_trick', 'shuoye_zhongzhuang_basic'],
        subSkill: {
            trick: {
                trigger: {
                    player: "gainAfter",
                    global: "loseAsyncAfter",
                },
                forced: true,
                filter(event, player) {
                    if (!player.countCards('he', function (card) {
                        return lib.filter.cardDiscardable(card, player, 'shuoye_zhongzhuang')
                    })) return false;
                    return event.getg(player).some(card => get.type2(card, false) == 'trick');
                },
                getIndex(event, player) {
                    if (!player.countCards('he', function (card) {
                        return lib.filter.cardDiscardable(card, player, 'shuoye_zhongzhuang')
                    })) return false;
                    return event.getg(player).filter(card => get.type2(card, false) == 'trick').length;
                },
                async content(event, trigger, player) {
                    if (
                        player.countCards('he', function (card) {
                            return lib.filter.cardDiscardable(card, player, 'shuoye_zhongzhuang')
                        })
                    ) {
                        await player.chooseToDiscard('hes', true)
                            .set('ai', card => {
                                let player = get.player(),
                                    val = 6;
                                if (player.hasSkill('shuoye_zhongzhuang') && get.type(card) == 'basic') val += 3;
                                return val - get.value(card);
                            });
                    }
                },
            },
            basic: {
                trigger: {
                    player: "loseAfter",
                    global: ["gainAfter", "equipAfter", "addJudgeAfter", "loseAsyncAfter", "addToExpansionAfter"],
                },
                forced: true,
                filter(event, player) {
                    const evt = event.getl(player);
                    if (!evt.cards2.length) return false;
                    return evt.cards2.some(card => get.type(card, false) == 'basic');
                },
                getIndex(event, player) {
                    const evt = event.getl(player);
                    if (!evt.cards2.length) return false;
                    return evt.cards2.filter(card => get.type(card, false) == 'basic').length;
                },
                async content(event, trigger, player) {
                    player.draw();
                    if (player.getHistory('useSkill', evt => evt.skill == event.name).length <= 3 &&
                        player.countMark('charge') < get.info('shuoye_zhongzhuang').getLimit) {
                        player.addMark('charge');
                    }
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_zhongzhuang
//#noname-kit-begin skill:shuoye_zhongmu
    shuoye_zhongmu: {
        enable: 'phaseUse',
        usable: 1,
        locked: false,
        changeSkill: true,
        filter(event, player, name) {
            if (player.countMark('charge') < 7) return false;
            if (!player.countCards('hes', function (card) {
                return get.type(card) != 'basic';
            })) return false;
            return get.inpileVCardList(info => {
                const name = info[2], type = get.type(name), infox = get.info({ name: name });
                return type == 'basic';
            }).filter(card => event.filterCard({ name: card[2], nature: card[3] }, player, event)).length;
        },
        async content(event, trigger, player) {
            player.removeMark('charge', player.countMark('charge'));
            for (var i = 0; i < 7; i++) {
                const list = get.inpileVCardList(info => {
                    const name = info[2], type = get.type(name), infox = get.info({ name: name });
                    return type == 'basic';
                }).filter(card => player.hasUseTarget({
                    name: card[2],
                    nature: card[3],
                    storage: {
                        shuoye_zhongmu: true,
                    },
                }, false, false));
                if (!list.length) break;
                const { bool, links } = await player.chooseButton(['你可以将一张非基本牌当做任意一张基本牌使用（无距离和次数限制），然后你可以重复此流程', [list, 'vcard']])
                    .set('filterButton', button => {
                        const player = get.player();
                        return player.hasUseTarget({
                            name: button.link[2],
                            nature: button.link[3],
                            storage: {
                                shuoye_zhongmu: true,
                            },
                        })
                    })
                    .set('ai', button => {
                        const player = get.player();
                        return player.getUseValue({
                            name: button.link[2],
                            nature: button.link[3],
                            storage: {
                                shuoye_zhongmu: true,
                            }
                        })
                    }).forResult();
                if (bool) {
                    const card = {
                        name: links[0][2],
                        nature: links[0][3],
                        storage: {
                            shuoye_zhongmu: true,
                        },
                    };
                    game.broadcastAll(function (card) {
                        lib.skill.shuoye_zhongmu_backup.viewAs = card;
                        lib.skill.shuoye_zhongmu_backup.prompt = ('选择' + get.translation(name) + '的目标');
                    }, card);
                    var next = player.chooseToUse();
                    next.set("openskilldialog", `###${get.prompt("shuoye_zhongmu")}###你可以将一张非基本牌当做${get.translation(card)}使用，然后你可以重复此流程。`);
                    next.set("norestore", true);
                    next.set("_backupevent", "shuoye_zhongmu_backup");
                    next.set("addCount", false);
                    next.set("logSkill", "shuoye_zhongmu");
                    next.set("custom", {
                        add: {},
                        replace: { window: function () { } },
                    });
                    next.backup("shuoye_zhongmu_backup");
                    const result = await next.forResult();
                    if (!result.bool) break;
                }
                else break;
            }
        },
        mod: {
            cardUsable(card, player) {
                if (typeof card == "object") {
                    if (card.storage.shuoye_zhongmu) return Infinity;
                }
            },
            targetInRange(card, player, target) {
                if (card.storage.shuoye_zhongmu) return true;
            },
        },
        ai: {
            order() {
                return 3.1;
            },
            result: {
                player(player) {
                    return 1;
                },
            },
        },
        subSkill: {
            backup: {
                filterCard(card) {
                    return get.itemtype(card) == "card" && get.type(card) != 'basic';
                },
                selectCard: 1,
                position: "hes",
                "ai1"(card) {
                    var player = get.player();
                    var maxVal = 6;
                    return maxVal - get.value(card);
                },
                log: false,
                async precontent(event, trigger, player) {
                    event.getParent().addCount = false;
                }
            },
        },
    },
//#noname-kit-end skill:shuoye_zhongmu
//#noname-kit-begin skill:shuoye_lengjing
    shuoye_lengjing: {
        trigger: {
            player: "phaseJieshuBegin",
        },
        popup: false,
        getLimit: 7,
        async cost(event, trigger, player) {
            event.result = await player.chooseToDiscard(`结束阶段，你可以弃置任意张牌并增加等于半数的护甲（向下取整）。`, 'hes')
                .set('selectCard', [1, Infinity])
                .set('ai', card => {
                    const player = get.player();
                    if (player.hujia > 5) return 0;
                    var val = 6;
                    if (player.hasSkill('shuoye_zhongzhuang') && get.type(card) == 'basic') val += 3;
                    return val - get.value(card);
                })
                .set('chooseonly', true)
                .forResult();
        },
        async content(event, trigger, player) {
            player.logSkill(event.name);
            const num = Math.floor(event.cards.length / 2);
            await player.discard(event.cards);
            if (num > 0) player.changeHujia(num);
        },
        mod: {
            cardUsable(card, player, num) {
                if (!player.isPhaseUsing()) return;
                if (card.name == "sha") return num + 1;
            },
        },
    },
//#noname-kit-end skill:shuoye_lengjing
//#noname-kit-begin skill:shuoye_fengji
    shuoye_fengji: {
        trigger: {
            global: 'roundStart',
        },
        zhuSkill: true,
        filter(event, player) {
            if (!player.hasZhuSkill('shuoye_fengji')) return false;
            if (game.roundNumber <= 1) return false;
            return game.hasPlayer(target => {
                return target.getRoundHistory('sourceDamage', evt => evt, 1).length;
            });
        },
        logTarget(event, player) {
            return game.filterPlayer(target => {
                return target.getRoundHistory('sourceDamage', evt => evt, 1).length;
            });
        },
        async content(event, trigger, player) {
            for (const target of event.targets) {
                const { bool, cards } = await target
                    .chooseToDiscard("he", "弃置一张牌，或令" + get.translation(player) + "摸一张牌")
                    .set("goon", get.attitude(target, player) < 0)
                    .set("ai", function (card) {
                        if (!_status.event.goon) return -get.value(card);
                        return 6 - get.value(card);
                    }).forResult();
                if (!bool) await player.draw();
            }
        },
    },
//#noname-kit-end skill:shuoye_fengji


//#noname-kit-begin skill:shuoye_sixiang
    shuoye_sixiang: {
        trigger: {
            global: "damageBegin",
        },
        forced: true,
        locked: false,
        filter(event, player) {
            return event.player != player && event.getParent().name != 'shuoye_fandu';
        },
        async content(event, trigger, player) {
            await player.draw();
            if (trigger.player.countMark('shuoye_sixiang_mark') == 0) {
                trigger.player.addMark('shuoye_sixiang_mark');
            }
        },
        group: "shuoye_sixiang_use",
        subSkill: {
            use: {
                trigger: {
                    global: "phaseBegin",
                },
                direct: true,
                filter(event, player) {
                    return player.inRange(event.player) && player.hasCard(function (card) {
                        return player.hasUseTarget(card)
                    }, 'h');
                },
                async content(event, trigger, player) {
                    player.chooseToUse({
                        prompt: get.prompt(event.name),
                        prompt2: "是否使用一张牌？",
                        filterCard(card, player) {
                            if (get.itemtype(card) != "card") return false;
                            return lib.filter.filterCard.apply(this, arguments);
                        },
                        ai1(card) {
                            return get.player().getUseValue(card);
                        },
                    });
                },
            },
            mark: {
                mark: true,
                marktext: '赤',
                intro: {
                    content: `mark`,
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_sixiang
//#noname-kit-begin skill:shuoye_santu
    shuoye_santu: {
        audio: "ext:朔夜/audio:1",
        trigger: {
            player: "phaseUseBegin",
        },
        async content(event, trigger, player) {
            player.changeSkin({ characterName: "shuoye_huangquan" }, "shuoye_huangquan_shadow");
            const num = player.getAllHistory('useSkill', evt => evt.skill == event.name).length
            await player.loseHp();
            await player.gainMaxHp();
            player.addSkill('shuoye_santu_effect', { player: ['phaseUseAfter', 'phaseUseSkipped'] });
        },
        subSkill: {
            effect: {
                trigger: {
                    player: "useCard",
                },
                forced: true,
                charlotte: true,
                filter(event, player) {
                    return event.card.name == 'sha';
                },
                async content(event, trigger, player) {
                    if (!game.hasNature(trigger.card)) {
                        trigger.baseDamage++;
                    } else if (game.hasNature(trigger.card, 'thunder')) {
                        const targets = trigger.targets;
                        for (const target of targets) {
                            target.addTempSkill('fengyin');
                        }
                    }
                    else if (game.hasNature(trigger.card, 'fire')) {
                        trigger.directHit.addArray(game.filterPlayer());
                        trigger.card._shuoye_santu = true;
                        player.addTempSkill('shuoye_santu_loseHp');
                    }
                },
            },
            loseHp: {
                trigger: {
                    source: 'damageBefore',
                },
                forced: true,
                popup: false,
                charlotte: true,
                filter(event, player) {
                    return event.card && event.card._shuoye_santu;
                },
                async content(eventt, trigger, player) {
                    trigger.cancel();
                    trigger.player.loseHp(trigger.num);
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_santu
//#noname-kit-begin skill:shuoye_yuzhan
    shuoye_yuzhan: {
        mod: {
            cardUsable(card, player, num) {
                if (card.storage && card.storage.shuoye_yuzhan) return Infinity;
            },
        },
        enable: "phaseUse",
        usable: 1,
        filter(event, player) {
            var hs = player.getCards("h");
            if (!hs.length) return false;
            return get.inpileVCardList(info => {
                const name = info[2];
                if (name != "sha") return false;
                return get.type(name) == "basic";
            })
                .some(card => event.filterCard({
                    name: card[2],
                    nature: card[3],
                    storage: {
                        shuoye_yuzhan: true,
                    },
                    cards: hs
                }, player, event));
        },
        chooseButton: {
            dialog(event, player) {
                const hs = player.getCards("h");
                const list = get.inpileVCardList(info => {
                    const name = info[2];
                    if (name != "sha") return false;
                    return get.type(name) == "basic";
                })
                    .filter(card => event.filterCard({
                        name: card[2],
                        nature: card[3],
                        storage: {
                            shuoye_yuzhan: true,
                        },
                        cards: hs
                    }, player, event));
                return ui.create.dialog("雨斩", [list, "vcard"]);
            },
            filter(button, player) {
                const hs = player.getCards("h");
                return _status.event.getParent().filterCard({
                    name: button.link[2],
                    nature: button.link[3],
                    storage: {
                        shuoye_yuzhan: true,
                    },
                    cards: hs
                }, player, _status.event.getParent());
            },
            check(button) {
                if (_status.event.getParent().type != "phase") return 1;
                const player = get.event("player"),
                    value = player.getUseValue({ name: button.link[2], nature: button.link[3] });
                return value;
            },
            backup(links, player) {
                return {
                    viewAs: {
                        name: links[0][2],
                        nature: links[0][3],
                        storage: {
                            shuoye_yuzhan: true,
                        }
                    },
                    filterCard: true,
                    selectCard: -1,
                    check(card) {
                        return 7.5 - get.value(card);
                    },
                    selectTarget: [1, 2],
                    log: false,
                    async precontent(event, trigger, player) {
                        player.logSkill("shuoye_yuzhan");
                        event.getParent().addCount = false;
                    },
                    ai: {
                        directHit_ai: true,
                        skillTagFilter(player, tag, arg) {
                            if (get.event("skill") != "shuoye_yuzhan_backup") return false;
                            return arg && arg.card && arg.card.name == "sha";
                        },
                    },
                };
            },
            prompt(links, player) {
                return "将所有手牌牌当作" + (get.translation(links[0][3]) || "") + "【" + get.translation(links[0][2]) + "】使用";
            },
        },
        hiddenCard(player, name) {
            return name == "sha" && player.countCards("hes");
        },
        ai: {
            fireAttack: true,
            respondSha: true,
            skillTagFilter(player, tag, arg) {
                if (arg == "respond") return false;
            },
            order(item, player) {
                if (player && _status.event.type == "phase" && player.hasValueTarget({ name: "sha" }, true, true)) {
                    let max = 0,
                        names = get.inpileVCardList(info => {
                            const name = info[2];
                            if (name != "sha") return false;
                            return get.type(name) == "basic";
                        });
                    names = names.map(namex => {
                        return { name: namex[2], nature: namex[3] };
                    });
                    names.forEach(card => {
                        if (player.getUseValue(card) > 0) {
                            let temp = get.order(card);
                            if (temp > max) max = temp;
                        }
                    });
                    if (max > 0) max += 15;
                    return max;
                }
                return 0.5;
            },
            result: {
                player(player) {
                    return 1;
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_yuzhan
//#noname-kit-begin skill:shuoye_fandu
    shuoye_fandu: {
        audio: "ext:朔夜/audio:1",
        trigger: {
            player: 'phaseUseEnd',
        },
        filter(event, player) {
            return game.hasPlayer(target => target.countMark('shuoye_sixiang_mark'));
        },
        async content(event, trigger, player) {
            player.changeSkin({ characterName: "shuoye_huangquan" }, "shuoye_huangquan_shadow");
            player.removeSkill('shuoye_santu_effect');
            await player.loseMaxHp();
            const targets = game.filterPlayer(target => target.countMark('shuoye_sixiang_mark'));
            for (const target of targets) {
                const num = target.countMark('shuoye_sixiang_mark');
                await target.damage(1, 'thunder');
                target.removeMark('shuoye_sixiang_mark', num);
                target.unmarkSkill('shuoye_sixiang_mark');
            }
        },
    },
//#noname-kit-end skill:shuoye_fandu
    //飞鸟马时
//#noname-kit-begin skill:shuoye_jijia
    shuoye_jijia: {
        audio: "ext:朔夜/audio:2",
        enable: "phaseUse",
        filter(event, player) {
            const history1 = player.getAllHistory("useSkill", evt => evt.skill == "shuoye_jijia").length,
                history2 = 1 + player.getAllHistory("useSkill", evt => evt.skill == "shuoye_zhongzhan").length;
            if (history1 >= history2) return false;
            return !game.hasPlayer(target => target.getEquips("shuoye_abishu").length);
        },
        filterTarget: true,
        async content(event, trigger, player) {
            const target = event.targets[0];
            const card = get.cardPile("shuoye_abishu", "field") || game.createCard2("shuoye_abishu", "spade", 2);
            if (!card.storage) card.storage = {};
            if (typeof card.storage.shuoye_abishu != "number") {
                card.storage.shuoye_abishu = 5;
            }
            game.broadcast(
                (card, storage) => {
                    card.storage = storage;
                },
                card,
                card.storage
            );
            if (card) {
                await target.gain();
                await game.delayx();
                await target.equip(card);
            }
        },
        ai: {
            order: 1,
            result: {
                target(player, target) {
                    return get.attitude(player, target);
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_jijia
//#noname-kit-begin skill:shuoye_zhongzhan
    shuoye_zhongzhan: {
        audio: "ext:朔夜/audio:2",
        trigger: {
            source: "dieAfter",
        },
        forced: true,
        locked: false,
        persevereSkill: true,
        async content(event, trigger, player) { },
        group: "shuoye_zhongzhan_use",
        subSkill: {
            use: {
                audio: "shuoye_zhongzhan",
                enable: "phaseUse",
                usable: 1,
                filter(event, player) {
                    return !player.hasSkill("shuoye_zhongzhan_effect");
                },
                prompt: "",
                async content(event, trigger, player) {
                    if (player.storage.shuoye_zhongzhan_effect) delete player.storage.shuoye_zhongzhan_effect;
                    await player.addAdditionalSkills("dchuanli_sunquan", "wushuang");
                    player.addSkill("shuoye_zhongzhan_effect");
                },
                ai: {
                    order: 1,
                },
            },
            effect: {
                charlotte: true,
                onremove(player, skill) {
                    delete player.storage[skill];
                },
                trigger: {
                    player: "phaseAfter",
                },
                forced: true,
                popup: false,
                async content(event, trigger, player) {
                    if (!player.storage.shuoye_zhongzhan_effect) {
                        player.storage.shuoye_zhongzhan_effect = true;
                    } else {
                        await player.removeAdditionalSkills("shuoye_zhongzhan_effect");
                        player.removeSkill("shuoye_zhongzhan_effect");
                    }
                },
                mod: {
                    cardEnabled(card, player) {
                        if (get.name(card) == "shan") return false;
                    },
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_zhongzhan
//#noname-kit-begin skill:shuoye_abishu_skill
    shuoye_abishu_skill: {
        audio: "ext:朔夜/audio:2",
        equipSkill: true,
        mod: {
            cardUsable(card, player, num) {
                if (!player.isPhaseUsing()) return;
                if (card.name == "sha") return num++;
            },
        },
        group: ["shuoye_abishu_skill_damage", "shuoye_abishu_skill_use", "shuoye_abishu_skill_hujia"],
        subSkill: {
            damage: {
                audio: "shuoye_abishu_skill",
                trigger: {
                    source: "damageBegin1",
                },
                equipSkill: true,
                prompt2: "你造成伤害时，你可以可减少1点此牌的耐久度令此伤害加1。",
                async content(event, trigger, player) {
                    trigger.num++;
                    const cards = player.getCards("e", card => {
                        return card.name.startsWith("shuoye_abishu") && card.storage?.shuoye_abishu > 0;
                    });
                    for (const card of cards) {
                        card.storage.shuoye_abishu--;
                        game.log(card, "减少了", "#y1点", "#g耐久值");
                        game.broadcast(
                            (card, storage) => {
                                card.storage = storage;
                            },
                            card,
                            card.storage
                        );
                    }
                    await event.trigger("shuoye_abishuOnRemove");
                },
            },
            use: {
                audio: "shuoye_abishu_skill",
                equipSkill: true,
                enable: "chooseToUse",
                filter(event, player) {
                    return get.inpileVCardList(info => {
                        const name = info[2], type = get.type(name), infox = get.info({ name: name });
                        if (type != 'basic' && type != 'trick') return false;
                        if (!get.tag({ name: name }, 'damage')) return false;
                        if (get.info("xunshi").isXunshi({ name: name })) return false;
                        return !player.getStorage("shuoye_abishu_skill_use").includes(name);
                    }).some(card => event.filterCard({ name: card[2], nature: card[3] }, player, event));
                },
                chooseButton: {
                    dialog(event, player) {
                        const list = lib.inpile.slice().concat("binglinchengxiax").filter(name => {
                            const type = get.type(name), infox = get.info({ name: name });
                            if (type != 'basic' && type != 'trick') return false;
                            if (!get.tag({ name: name }, 'damage')) return false;
                            if (get.info("xunshi").isXunshi({ name: name })) return false;
                            return !player.getStorage("shuoye_abishu_skill_use").includes(name);
                        }).filter(name => event.filterCard({ name: name }, player, event));
                        return ui.create.dialog('阿比舒', [list, 'vcard']);
                    },
                    check(button) {
                        if (_status.event.getParent().type != 'phase') return 1;
                        return get.event('player').getUseValue({ name: button.link[2], nature: button.link[3] });
                    },
                    backup(links, player) {
                        return {
                            viewAs: {
                                name: links[0][2],
                                nature: links[0][3],
                            },
                            filterCard: () => false,
                            selectCard: -1,
                            ai1(card) {
                                return 1;
                            },
                            log: false,
                            async precontent(event, trigger, player) {
                                if (!player.storage.shuoye_abishu_skill_use) {
                                    player.when("phaseEnd")
                                        .then(() => {
                                            delete player.storage.shuoye_abishu_skill_use;
                                        });
                                }
                                player.markAuto("shuoye_abishu_skill_use", [event.result.card.name]);
                                const cards = player.getCards("e", card => {
                                    return card.name.startsWith("shuoye_abishu") && card.storage?.shuoye_abishu > 0;
                                });
                                for (const card of cards) {
                                    card.storage.shuoye_abishu--;
                                    game.log(card, "减少了", "#y1点", "#g耐久值");
                                    game.broadcast(
                                        (card, storage) => {
                                            card.storage = storage;
                                        },
                                        card,
                                        card.storage
                                    );
                                }
                                await event.trigger("shuoye_abishuOnRemove");
                            },
                        }
                    },
                    prompt(links, player) {
                        return "视为使用一张" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]);
                    },
                },
                hiddenCard(player, name) {
                    return lib.inpile.includes(name) && player.getStorage("shuoye_abishu_skill_use").includes(name);
                },
                ai: {
                    order: 1,
                    respondSha: true,
                    skillTagFilter(player, tag, arg) {
                        if (arg == 'respond') return false;
                        return get.info('shuoye_abishu_skill_use').hiddenCard(player, 'sha');
                    },
                    result: {
                        player: 1,
                    },
                },
            },
            use_backup: {},
            hujia: {
                audio: "shuoye_abishu_skill",
                trigger: {
                    player: "damageEnd",
                },
                forced: true,
                equipSkill: true,
                filter(event, player) {
                    return !player.hujia;
                },
                async content(event, trigger, player) {
                    player.changeHujia(1);
                    const cards = player.getCards("e", card => {
                        return card.name.startsWith("shuoye_abishu") && card.storage?.shuoye_abishu > 0;
                    });
                    for (const card of cards) {
                        card.storage.shuoye_abishu--;
                        game.log(card, "减少了", "#y1点", "#g耐久值");
                        game.broadcast(
                            (card, storage) => {
                                card.storage = storage;
                            },
                            card,
                            card.storage
                        );
                    }
                    await event.trigger("shuoye_abishuOnRemove");
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_abishu_skill
//#noname-kit-begin skill:shuoye_abishu_effect
    shuoye_abishu_effect: {
        audio: "shuoye_abishu_skill",
        equipSkill: true,
        trigger: {
            player: ["loseBefore", "shuoye_abishuOnRemove", "equipBefore", "equipAfter"],
        },
        filter(event, player, name) {
            if (name == "shuoye_abishuOnRemove") {
                return player.hasCard(card => card.name.startsWith("shuoye_abishu") && card.storage?.shuoye_abishu <= 0, "e");
            }
            if (event.name == "equip") {
                if (name == "equipBefore") return true;
                if (!event.card.name.startsWith("shuoye_abishu")) return false;
                return player.hasCard(card => {
                    return !event.cards.includes(card) && lib.filter.cardDiscardable(card, player);
                }, "e");
            }
            if (event.getParent(2).name == "disableEquip") return false;
            if (event.getParent(3).name == "shuoye_abishu" || event.getParent(3).name == "shuoye_abishu_recast") return false;
            return player.hasCard(card => {
                if (!event.cards.includes(card)) return false;
                return card.name.startsWith("shuoye_abishu") && card.storage?.shuoye_abishu > 0;
            }, "e");
        },
        forced: true,
        async content(event, trigger, player) {
            if (event.triggername == "shuoye_abishuOnRemove") {
                const cards = player.getCards("e", card => card.name.startsWith("shuoye_abishu") && card.storage?.shuoye_abishu <= 0);
                await player.lose(cards, ui.special);
                for (const card of cards) {
                    card.fix();
                    card.remove();
                    card.destroyed = true;
                }
                game.log(cards, "被移出了游戏");
            } else if (trigger.name == "equip") {
                if (event.triggername == "equipBefore") {
                    trigger.cancel();
                    if (trigger.cards.length) await player.recast(trigger.cards);
                }
                else {
                    const cards = player.getCards("e", card => {
                        return !trigger.cards.includes(card) && lib.filter.cardRecastable(card, player);
                    });
                    await player.changeHujia(1);
                    await player.recast(cards);
                }
            } else {
                const cards = player.getCards("e", card => {
                    if (!trigger.cards.includes(card)) return false;
                    return card.name.startsWith("shuoye_abishu") && card.storage?.shuoye_abishu > 0;
                });
                trigger.cards.removeArray(cards);
                for (const card of cards) {
                    card.storage.shuoye_abishu--;
                    game.log(card, "减少了", "#y1点", "#g耐久值");
                    game.broadcast(
                        (card, storage) => {
                            card.storage = storage;
                        },
                        card,
                        card.storage
                    );
                }
                await event.trigger("shuoye_abishuOnRemove");
            }
        },
    },
//#noname-kit-end skill:shuoye_abishu_effect
    //艾丽丝
//#noname-kit-begin skill:shuoye_qingsao
    shuoye_qingsao: {
        enable: "phaseUse",
        usable: 1,
        filterCard: () => false,
        selectCard: -1,
        async content(event, trigger, player) {
            const judgeEvent = player.judge(card => {
                if (get.type(card) != "equip") return 2;
                return -1;
            });
            judgeEvent.judge2 = result => result.bool;
            const result = await judgeEvent.forResult();
            if (!result || !result.card) return;
            const suit = get.suit(result.card);
            const isEquip = !result.bool;
            if (result.card && get.position(result.card, true) == "d") {
                await player.gain(result.card);
            }
            if (!isEquip && player.countCards("hes", card => get.suit(card) == suit)) {
                const list = get.inpileVCardList(info => {
                    const name = info[2], nature = info[3], type = get.type(name);
                    if (nature) return false;
                    return type == get.type2(result.card);
                }).filter(card => player.hasUseTarget({ name: card[2], nature: card[3] }));
                if (list.length) {
                    game.log("清扫：等待选择要转化的牌");
                    const cardEvent = player.chooseCard({
                        position: "hes",
                        filterCard: function (card) {
                            const evt = this && this.qingsaoSuit ? this : _status.event;
                            return get.suit(card) == (evt && evt.qingsaoSuit);
                        },
                        selectCard: 1,
                        prompt: "选择一张" + get.translation(suit) + "花色的牌转化使用",
                    });
                    cardEvent.set("qingsaoSuit", suit);
                    const cardResult = await cardEvent.forResult();
                    if (cardResult && cardResult.bool && cardResult.cards && cardResult.cards.length) {
                        const costCard = cardResult.cards[0];
                        const cards = list.map(info => ["", "", info[2], info[3]]);
                        game.log("清扫：等待选择转化牌名");
                        const chooseEvent = player.chooseButton([
                            "###选择要转化使用的牌名###<div class=\"text center\">把刚选的那张牌当下列一张牌使用，或取消</div>",
                            [cards, "vcard"],
                        ], [0, 1]);
                        if (!_status.connectMode) {
                            chooseEvent.set("ai", function (button) {
                                return _status.event.player.getUseValue({
                                    name: button.link[2],
                                    nature: button.link[3],
                                });
                            });
                        }
                        const chooseResult = await chooseEvent.forResult();
                        let chosen = null;
                        if (chooseResult && chooseResult.bool && chooseResult.links && chooseResult.links.length) {
                            chosen = chooseResult.links[0];
                        }
                        if (chosen && chosen[2]) {
                            const cinfo = get.info({ name: chosen[2] }) || {};
                            const useSingle = !player.hasSkill("shuoye_guanga_effect");
                            const needSingleTarget = useSingle && !cinfo.toself && !cinfo.modTarget;
                            game.log("清扫：转化使用", get.translation(chosen[2]));
                            const next = player.chooseUseTarget({ name: chosen[2], nature: chosen[3] }, [costCard], false, true);
                            if (needSingleTarget) {
                                next.set("selectTarget", 1);
                            }
                            await next.forResult();
                        }
                    }
                }
            }
            player.addSkill("shuoye_qingsao_record");
            if (!player.getStorage("shuoye_qingsao_record").includes(suit)) {
                player.markAuto("shuoye_qingsao_record", [suit]);
                if (player.getStat("skill").shuoye_qingsao) delete player.getStat("skill").shuoye_qingsao;
            } else {
                await player.loseHp();
            }
        },
        ai: {
            order: 8,
            result: {
                player: 1,
            },
        },
        subSkill: {
            record: {
                charlotte: true,
                onremove: true,
            },
        },
    },
//#noname-kit-end skill:shuoye_qingsao
//#noname-kit-begin skill:shuoye_zhongshen
    shuoye_zhongshen: {
        trigger: {
            player: "dying",
        },
        locked: false,
        filter(event, player) {
            return player.getAllHistory("useSkill", evt => evt.skill == "shuoye_zhongshen").length < 3;
        },
        async content(event, trigger, player) {
            var cards = [];
            for (var i of lib.suit) {
                var card = get.cardPile(function (card) {
                    return get.suit(card, false) == i;
                });
                if (card) cards.push(card);
            }
            if (cards.length) {
                await player.gain(cards, "gain2");
                player.addGaintag(cards, "shuoye_zhongshen");
            }
        },
        onremove(player, skill) {
            player.removeGaintag(skill);
        },
        mod: {
            ignoredHandcard(card) {
                if (card.hasGaintag("shuoye_zhongshen")) return true;
            },
            cardDiscardable(card, player, name) {
                if (name == "phaseDiscard" && card.hasGaintag("shuoye_zhongshen")) return false;
            },
        },
    },
//#noname-kit-end skill:shuoye_zhongshen
//#noname-kit-begin skill:shuoye_guanga
    shuoye_guanga: {
        enable: "phaseUse",
        limited: true,
        skillAnimation: true,
        animationColor: "orange",
        async content(event, trigger, player) {
            player.awakenSkill(event.name);
            player.removeSkill("shuoye_qingsao_record");
            player.addTempSkill("shuoye_guanga_effect");
        },
        ai: {
            order: 10,
            result: {
                player(player) {
                    return player.getStorage("shuoye_qingsao_record").length >= 3;
                },
            },
        },
        subSkill: {
            effect: {
                charlotte: true,
            },
        },
    },
//#noname-kit-end skill:shuoye_guanga
    //虚构集
//#noname-kit-begin skill:shuoye_yixiang
    shuoye_yixiang: {
        trigger: {
            global: "useCardAfter",
        },
        forced: true,
        filter(event, player) {
            return !get.is.virtualCard(event.card);
        },
        async content(event, trigger, player) {
            if (trigger.targets?.length > 1) player.addMark("shuoye_yixiang_qunxiang");
            else player.addMark("shuoye_yixiang_dubai");
        },
        subSkill: {
            qunxiang: {
                marktext: "群像",
                intro: {
                    name: "群像",
                    content: "mark",
                },
            },
            dubai: {
                marktext: "独白",
                intro: {
                    name: "独白",
                    content: "mark",
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_yixiang
//#noname-kit-begin skill:shuoye_yinyu
    shuoye_yinyu: {
        trigger: {
            player: "useCardBefore",
        },
        usable(skill, player) {
            return 1 + player.countMark("shuoye_yinyu");
        },
        async cost(event, trigger, player) {
            const choiceList = [
                ["cardNameLength", "牌名字数"],
                ["type", "类型"],
                ["suit", "花色"],
            ];
            const { bool, links } = await player.chooseButton(2, [get.prompt2(event.name.slice(0, -5)), [choiceList, "tdnodes"]])
                .set("ai", button => {
                    return 1 + Math.random();
                }).forResult();
            if (bool) event.result = { bool, cost_data: { links } };
        },
        async content(event, trigger, player) {
            trigger.card._shuoye_yinyu = true;
            const links = event.cost_data.links,
                mingzhi = get[links[0]](trigger.card),
                anzhi = (links[1] == "cardNameLength" ? "牌名字数" : (links[1] == "type" ? "类型" : "花色"));
            var choiceList;
            switch (links[1]) {
                case "cardNameLength": {
                    const num = Math.max(get.cardNameLength(trigger.card), 4)
                    choiceList = Array.from({ length: num }).map((_, info) => info + 1);
                }
                    break;
                case "type": {
                    choiceList = [["basic", "基本牌"], ["trick", "锦囊牌"], ["equip", "装备牌"]];
                }
                    break;
                case "suit": {
                    choiceList = [["heart", "红桃"], ["diamond", "方块"], ["spade", "黑桃"], ["club", "梅花"]];
                }
                    break;
            }
            player.say("声明了" + mingzhi);
            game.log(player, "声明了", mingzhi);
            const targets = game
                .filterPlayer(function (current) {
                    return current != player;
                })
                .sortBySeat(_status.currentPhase);
            const targets2 = [];
            for (const target of targets) {
                const result = await target.chooseButton(true, [`选择猜测${get.translation(player)}使用牌的${anzhi}`, [choiceList, "tdnodes"]])
                    .set("ai", button => {
                        return 1 + Math.random();
                    }).forResult();
                if (result.bool) {
                    if (get[links[1]](trigger.card) == result.links[0]) {
                        targets2.add(target);
                        target.say("猜测正确");
                        game.log(target, "猜测正确");
                    } else {
                        target.say("猜测错误");
                        game.log(target, "猜测错误");
                        var card = get.discardPile(function (card) {
                            return card.name == "shuoye_xugouren";
                        });
                        if (card) await player.gain(card, "gain2");
                    }
                }
            }
            if (!targets2.length) {
                await player.gainMaxHp();
                player.addMark("shuoye_yinyu", 1, false);
            }
        },
    },
//#noname-kit-end skill:shuoye_yinyu
//#noname-kit-begin skill:shuoye_migong
    shuoye_migong: {
        trigger: {
            player: "useCard",
        },
        filter(event, player) {
            if (["shuoye_yixiang_qunxiang", "shuoye_yixiang_dubai"].every(mark => !player.countMark(mark))) return false;
            return event.card._shuoye_yinyu || event.card.name == "shuoye_xugouren";
        },
        async cost(event, trigger, player) {
            const choiceList = [
                ["shuoye_yixiang_qunxiang", "群像"],
                ["shuoye_yixiang_dubai", "独白"],
            ];
            const { bool, links } = await player.chooseButton([1, 2], [get.prompt2(event.name.slice(0, -5)), [choiceList, "tdnodes"]])
                .set("filterButton", button => {
                    const player = get.player(),
                        trigger = get.event().getTrigger();
                    if (!player.countMark(button.link)) return false;
                    if (button.link == "shuoye_yixiang_qunxiang") {
                        return game.hasPlayer(function (current) {
                            return !trigger.targets.includes(current) && lib.filter.targetEnabled2(trigger.card, player, current) && lib.filter.targetInRange(trigger.card, player, current);
                        });
                    }
                    return true;
                })
                .set("ai", button => {
                    return 1 + Math.random();
                }).forResult();
            if (bool) event.result = { bool, cost_data: { links } }
        },
        async content(event, trigger, player) {
            const links = event.cost_data.links;
            if (links.includes("shuoye_yixiang_qunxiang")) {
                const targets = await player.chooseTarget(true)
                    .set("prompt", "请选择额外指定的目标")
                    .set("filterTarget", function (card, player, target) {
                        const trigger = _status.event.getTrigger();
                        return !trigger.targets.includes(target) && lib.filter.targetEnabled2(trigger.card, player, target) && lib.filter.targetInRange(trigger.card, player, target);
                    })
                    .set("selectTarget", () => {
                        const player = get.player();
                        return [1, player.countMark("shuoye_yixiang_qunxiang")];
                    })
                    .set("ai", target => {
                        const player = get.player(),
                            trigger = get.event().getTrigger();
                        return get.effect(target, trigger.card, player, player) + 0.01;
                    })
                    .forResult();
                player.line(targets);
                player.removeMark("shuoye_yixiang_qunxiang", targets.length);
                if (!event.isMine() && !event.isOnline()) await game.asyncDelay();
                game.log(targets, "成为了", trigger.card, "的额外目标");
                trigger.targets.addArray(targets);
            }
            if (links.includes("shuoye_yixiang_dubai")) {
                const result = await player.chooseButton(true, ["选择视为使用一张牌", [["sha", "jiu"], "vcard"]])
                    .set("ai", button => {
                        const player = get.player();
                        return player.getUseValue(button.link);
                    }).forResult();
                player.removeMark("shuoye_yixiang_dubai");
                player.when("useCardAfter")
                    .filter(event => event == trigger)
                    .then(() => {
                        if (player.hasUseTarget({ name: name }, true, false)) player.chooseUseTarget({ name: name }, false, true);
                    })
                    .vars({ name: result.links[0][2] })
            }
        },
    },
//#noname-kit-end skill:shuoye_migong
//#noname-kit-begin skill:shuoye_xugou
    shuoye_xugou: {
        trigger: {
            global: "phaseBefore",
            player: "enterGame",
        },
        forced: true,
        filter(event, player) {
            return (event.name != "phase" || game.phaseNumber == 0);
        },
        content() {
            var cards = [];
            for (var i = 2; i < 10; i++) {
                cards.push(game.createCard2("shuoye_xugouren", i % 2 ? "club" : "spade", i));
            }
            game.broadcastAll(function () {
                lib.inpile.add("shuoye_xugouren");
            });
            game.cardsGotoPile(cards, () => {
                return ui.cardPile.childNodes[get.rand(0, ui.cardPile.childNodes.length - 1)];
            });
        },
        group: "shuoye_xugou_remove",
        subSkill: {
            remove: {
                trigger: {
                    target: "useCardToBefore",
                },
                forced: true,
                priority: 15,
                filter(event, player) {
                    return event.card && event.card.name == "shuoye_xugouren";
                },
                content() {
                    trigger.cancel();
                },
                ai: {
                    effect: {
                        target(card, player, target) {
                            if (card && card.name == "shuoye_xugouren") return "zeroplayertarget";
                        },
                    },
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_xugou
//#noname-kit-begin skill:shuoye_kongwang
    shuoye_kongwang: {
        locked: true,
        forced: true,
        group: ["shuoye_kongwang_record", "shuoye_kongwang_use"],
        getPos(event, player) {
            const hand = player.getCards("h");
            for (const card of event.cards || []) {
                const index = hand.indexOf(card);
                if (index >= 0 && index < 5) {
                    return index;
                }
            }
            return null;
        },
        async apply(player, trigger, pos) {
            if (pos === 0) {
                if (!Array.isArray(trigger.directHit)) {
                    trigger.directHit = [];
                }
                trigger.directHit.addArray(trigger.targets || []);
                trigger.nowuxie = true;
            } else if (pos === 1) {
                trigger.addCount = false;
            } else if (pos === 2) {
                await lib.skill.shuoye_kongwang.moveCard(player);
            } else if (pos === 3) {
                trigger.baseDamage = (trigger.baseDamage || (trigger.card && trigger.card.baseDamage) || 1) + 1;
            } else if (pos === 4) {
                await player.chooseToDiscard("he", 1, true);
            }
        },
        async moveCard(player) {
            const cards = [];
            for (const current of game.filterPlayer()) {
                cards.addArray(current.getCards("ej"));
            }
            if (!cards.length) {
                return;
            }
            const prefix = "shuoye_kongwang_";
            const list = cards.map((card, index) => [prefix + index, "移动【" + get.translation(card) + "】"]);
            const result = await player.chooseButton(["空妄：选择场上一张牌", [list, "tdnodes"]], [1, 1]).set("ai", () => 1 + Math.random()).forResult();
            if (!result || !result.bool || !result.links || !result.links.length) {
                return;
            }
            const link = result.links[0];
            if (typeof link !== "string" || !link.startsWith(prefix)) {
                return;
            }
            const card = cards[parseInt(link.slice(prefix.length))];
            if (!card) {
                return;
            }
            const owner = get.owner(card);
            const fromJudge = get.position(card) === "j";
            if (!fromJudge && get.position(card) !== "e") {
                return;
            }
            const targets = game.filterPlayer(target => {
                if (!target.isIn() || target === owner) {
                    return false;
                }
                if (fromJudge) {
                    return target.canAddJudge(card);
                }
                return target.canEquip(card);
            });
            if (!targets.length) {
                return;
            }
            const targetPrefix = "shuoye_kongwang_target_";
            const targetList = targets.map((target, index) => [targetPrefix + index, get.translation(target)]);
            const result2 = await player.chooseButton(["空妄：选择移动到的角色", [targetList, "tdnodes"]], [1, 1]).set("ai", () => 1 + Math.random()).forResult();
            if (!result2 || !result2.bool || !result2.links || !result2.links.length) {
                return;
            }
            const targetLink = result2.links[0];
            if (typeof targetLink !== "string" || !targetLink.startsWith(targetPrefix)) {
                return;
            }
            const target = targets[parseInt(targetLink.slice(targetPrefix.length))];
            if (!target) {
                return;
            }
            if (fromJudge) {
                await target.addJudge(card);
            } else {
                await target.equip(card);
            }
        },
        subSkill: {
            record: {
                charlotte: true,
                locked: true,
                forced: true,
                trigger: { player: "useCardBefore" },
                filter(event, player) {
                    return lib.skill.shuoye_kongwang.getPos(event, player) != null;
                },
                async content(event, trigger, player) {
                    const pos = lib.skill.shuoye_kongwang.getPos(trigger, player);
                    if (pos != null) {
                        trigger.shuoyeKongwangPos = pos;
                        if (pos === 0) {
                            if (!Array.isArray(trigger.directHit)) {
                                trigger.directHit = [];
                            }
                            trigger.directHit.addArray(trigger.targets || []);
                            trigger.nowuxie = true;
                        }
                        if (pos === 1) {
                            trigger.addCount = false;
                        }
                    }
                },
            },
            use: {
                charlotte: true,
                locked: true,
                forced: true,
                trigger: { player: "useCard" },
                filter(event, player) {
                    return event.shuoyeKongwangPos != null;
                },
                async content(event, trigger, player) {
                    const pos = trigger.shuoyeKongwangPos;
                    await lib.skill.shuoye_kongwang.apply(player, trigger, pos);
                },
            },
        },
        init(player) {
            if (game.me === player && ui.sortCard) {
                ui.sortCard.style.display = "none";
            }
        },
        onremove(player) {
            if (game.me === player && ui.sortCard) {
                ui.sortCard.style.display = lib.config.show_sortcard ? "" : "none";
            }
        },
    },
//#noname-kit-end skill:shuoye_kongwang
//#noname-kit-begin skill:shuoye_yueshi
    shuoye_yueshi: {
        enable: "phaseUse",
        usable: 1,
        filter(event, player) {
            return game.hasPlayer(current => current.countCards("e") > 0);
        },
        filterTarget(card, player, target) {
            return target.countCards("e") > 0;
        },
        async content(event, trigger, player) {
            const target = event.target;
            const cards = target.getCards("e");
            const num = cards.length;
            if (!num) {
                return;
            }
            const before = player.getCards("h").slice();
            await target.gain(cards, "gain2");
            if (target.countCards("h") > target.maxHp) {
                await player.draw(num);
                const drawn = player.getCards("h").filter(card => !before.includes(card));
                if (!Array.isArray(player.storage.shuoyeYueshiCards)) {
                    player.storage.shuoyeYueshiCards = [];
                }
                player.storage.shuoyeYueshiCards.addArray(drawn);
                player.markSkill("shuoyeYueshiCards");
            } else {
                target.link(true);
                await target.damage(1, "thunder");
            }
        },
        mod: {
            cardUsable(card, player) {
                const list = player.storage.shuoyeYueshiCards;
                if (!Array.isArray(list) || !list.length) {
                    return;
                }
                const cards = Array.isArray(card.cards) && card.cards.length ? card.cards : [card];
                if (cards.some(c => list.includes(c))) {
                    return Infinity;
                }
            },
        },
        ai: {
            order: 6,
            result: {
                player(player) {
                    return 1;
                },
                target(player, target) {
                    if (target == player) {
                        return 0;
                    }
                    const att = get.attitude(player, target);
                    if (att >= 0) {
                        return 0;
                    }
                    const num = target.countCards('e');
                    if (!num) {
                        return 0;
                    }
                    if (target.countCards('h') + num > target.maxHp) {
                        return 1 + num;
                    }
                    return 1 + get.damageEffect(target, player, player, 'thunder');
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_yueshi
//#noname-kit-begin skill:shuoye_shenchanguyin
    shuoye_shenchanguyin: {
        nobracket: true,
        dutySkill: true,
        forced: true,
        trigger: { global: "dieAfter" },
        filter(event, player) {
            return player.isAlive();
        },
        async content(event, trigger, player) {
            await player.gainMaxHp();
        },
        group: ["shuoye_shenchanguyin_fail"],
        subSkill: {
            fail: {
                charlotte: true,
                forced: true,
                trigger: { player: "dying" },
                filter(event, player) {
                    return !player.storage.shuoyeShenchanguyinFailed;
                },
                async content(event, trigger, player) {
                    player.storage.shuoyeShenchanguyinFailed = true;
                    player.awakenSkill("shuoye_shenchanguyin");
                    await player.recoverTo(player.maxHp);
                    player.addSkill("shuoye_shenchanguyin_after");
                    player.changeSkin({ characterName: "shuoye_kongyuanxingzhe" }, "shuoye_kongyuanxingzhe_long");
                    lib.skill.shuoye_shenchanguyin.playVideo(player);
                },
            },
        },
        playVideo(player) {
            game.broadcastAll(p => {
                const video = document.createElement("video");
                video.src = lib.assetURL + "extension/朔夜/audio/shuoye_kongyuan_mission.mp4";
                video.autoplay = true;
                video.loop = false;
                video.muted = true;
                video.style.cssText = "position:fixed;left:0;top:50%;transform:translateY(-50%);width:100%;height:auto;background:transparent;z-index:2147483647;pointer-events:none;";
                const bgm = ui.backgroundMusic;
                const bgmPlaying = !!(bgm && !bgm.paused);
                if (bgmPlaying) {
                    bgm.pause();
                }
                const pausedByUs = !_status.paused;
                if (pausedByUs) {
                    game.pause();
                }
                document.body.appendChild(video);
                let closed = false;
                const closeVideo = () => {
                    if (closed) {
                        return;
                    }
                    closed = true;
                    if (video.parentNode) {
                        video.parentNode.removeChild(video);
                    }
                    if (bgmPlaying) {
                        try {
                            bgm.play();
                        } catch (e) {}
                    }
                    if (pausedByUs) {
                        game.resume();
                    }
                    if (!game.online) {
                        game.broadcastAll(p2 => {
                            const skill = lib.skill.shuoye_shenchanguyin;
                            if (skill && skill.playVoiceLocal) {
                                skill.playVoiceLocal(p2);
                            }
                        }, p);
                    }
                };
                video.onended = closeVideo;
                video.onerror = closeVideo;
                video.onloadedmetadata = () => {
                    const ms = Math.max(3000, (video.duration || 0) * 1000 + 5000);
                    setTimeout(closeVideo, ms);
                };
                video.play().catch(() => closeVideo());
            }, player);
        },
        playVoice(player) {
            game.broadcastAll(p => {
                const skill = lib.skill.shuoye_shenchanguyin;
                if (skill && skill.playVoiceLocal) {
                    skill.playVoiceLocal(p);
                }
            }, player);
        },
        playVoiceLocal(player) {
            const audio = new Audio(lib.assetURL + "extension/朔夜/audio/shuoye_kongyuan_voice.mp3");
            audio.loop = false;
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                if (ctx.state === "suspended") {
                    ctx.resume();
                }
                const src = ctx.createMediaElementSource(audio);
                const gain = ctx.createGain();
                gain.gain.value = 24;
                const comp = ctx.createDynamicsCompressor();
                comp.threshold.value = -20;
                comp.knee.value = 10;
                comp.ratio.value = 12;
                comp.attack.value = 0.003;
                comp.release.value = 0.25;
                src.connect(gain);
                gain.connect(comp);
                comp.connect(ctx.destination);
                audio.onended = () => {
                    try {
                        ctx.close();
                    } catch (e) {}
                };
            } catch (e) {}
            audio.play().catch(() => {});
            if (player && player.node) {
                const skill = lib.skill.shuoye_shenchanguyin;
                if (skill && skill.sayLong) {
                    skill.sayLong(player, "行者不必言深，孤独本是常态。");
                }
            }
        },
        sayLong(player, str, time = 5000) {
            // 统一走【纯爱】那套（带 broadcastAll，联机两端都能看到）
            lib.skill.shuoye_chunai.sayLong(player, str, time);
        },
    },
//#noname-kit-end skill:shuoye_shenchanguyin
//#noname-kit-begin skill:shuoye_shenchanguyin_after
    shuoye_shenchanguyin_after: {
        charlotte: true,
        forced: true,
        priority: -1,
        trigger: { global: "roundEnd", player: "useCardBefore" },
        filter(event, player) {
            if (event.name === "useCard") {
                return lib.skill.shuoye_kongwang.getPos(event, player) != null;
            }
            return player.isAlive();
        },
        async content(event, trigger, player) {
            if (trigger.name === "useCard") {
                const options = ["①此牌不可响应", "②此牌不计入次数", "③移动场上一张牌", "④此牌伤害或回复+1", "⑤你弃置一张牌", "cancel2"];
                const result = await player.chooseControl(options).set("prompt", "神忖福音：可额外选择一项【空妄】效果触发").set("prompt", "可额外选择一项空妄效果触发").forResult();
                if (result && result.control !== "cancel2") {
                    const index = options.indexOf(result.control);
                    if (index >= 0 && index < 5) {
                        await lib.skill.shuoye_kongwang.apply(player, trigger, index);
                    }
                }
                return;
            }
            await player.loseMaxHp();
            lib.skill.shuoye_shenchanguyin.playVoice(player);
        },
    },
//#noname-kit-end skill:shuoye_shenchanguyin_after
//#noname-kit-begin skill:shuoye_chunai
    shuoye_chunai: {
        forced: true,
        trigger: { global: "roundStart" },
        filter(event, player) {
            if (player.storage.shuoye_chunai_used || player.isDead()) return false;
            return game.countPlayer() < 12;
        },
        async content(event, trigger, player) {
            game.broadcastAll((p) => {
                p.storage.shuoye_chunai_used = true;
            }, player);
            // 确保立绘已经加载完再创建玩家，避免先显一次剪影
            try {
                await new Promise((resolve) => {
                    let done = false;
                    const finish = () => {
                        if (done) return;
                        done = true;
                        resolve();
                    };
                    const img = new Image();
                    img.onload = finish;
                    img.onerror = finish;
                    img.src = lib.assetURL + "extension/朔夜/image/shuoye_liixiang.png";
                    setTimeout(finish, 800);
                });
            } catch (e) {}
            const liixiang = await game.addPlayerOL(player, "shuoye_liixiang", null, true, { source: player });
            if (!liixiang) return;
            game.broadcastAll(
                (lx, master) => {
                    lx.storage.shuoye_master_pid = master.playerid;
                    master.storage.shuoye_liixiang_pid = lx.playerid;
                    lx.storage.shuoye_summon = true;
                    // 召唤物阵亡不参与胜负结算：直接不调用模式的 dieAfter（空函数）。
                    // 引擎各模式都在 dieAfter 里调 game.checkResult() / game.over()，跳过它就等于跳过结算。
                    // 参考其他扩展的召唤物：苍翼默示录龙影、错乱时空傀儡是“同组全灭才调原 dieAfter”，
                    // 活动武将连兵、一中杀召唤物则是直接 dieAfter = 空函数。
                    // 注意：不要再“临时置空 game.checkResult / game.over 再还原”——只要别的扩展在这段时间里
                    // 缓存了被置空的版本（傀儡/龙影/不死类技能都会先存后包），整局甚至整个页面就再也不结算，
                    // 表现就是里香死后主公/对手/地主死了都不结束。
                    lx.dieAfter = function () {};
                    // 召唤物：击杀奖励只在身份场按身份发（不触发“主公杀忠臣”惩罚）。
                    // 其它模式不交还给原 dieAfter2：单挑/战棋的原版会“复活换将”（uninit 会把
                    // storage.shuoye_summon 清掉，她从此变成真玩家，结算又开始数她）；斗地主/对决
                    // 则会把死亡奖励发给“另一名农民/队友”，可能落到召唤物头上。
                    // 苍翼默示录/错乱时空的召唤物也是直接 dieAfter2 = 空函数。
                    lx.dieAfter2 = function (source) {
                        if (get.mode() !== "identity" || !source) return;
                        const identity = this.identity;
                        if (identity === "fan") {
                            source.draw(3);
                        } else if (identity === "commoner") {
                            source.draw(2);
                        } else if (identity === "mingzhong" && source.identity !== "zhu") {
                            source.draw(3);
                        }
                    };
                    lx.group = master.group;
                    // 身份跟乙骨同阵营：仅身份局把主公改成忠臣；
                    // 单挑/对决等模式的合法身份就是 zhu/fan（先手/后手），直接沿用，否则会出现无翻译的伪身份
                    const identityMap = { zhu: "zhong", zhong: "zhong", fan: "fan", nei: "nei", mingzhong: "mingzhong", commoner: "commoner" };
                    const mode = get.mode();
                    if (mode === "identity" && identityMap[master.identity]) {
                        lx.identity = identityMap[master.identity];
                    } else {
                        lx.identity = master.identity || "fan";
                    }
                    lx.setIdentity();
                    // 斗地主等模式里，召唤物不应计入胜负人数（幂等补丁，召唤时再压一次）
                    try {
                        if (typeof lib.shuoyePatchDoudizhuResult === "function") lib.shuoyePatchDoudizhuResult();
                        if (typeof lib.shuoyePatchIdentityResult === "function") lib.shuoyePatchIdentityResult();
                    } catch (e) {}
                    // 客机可能没拿到完整的角色数据（血量/技能），这里补齐
                    try {
                        if (typeof lx.maxHp !== "number") lx.maxHp = 3;
                        if (typeof lx.hp !== "number") lx.hp = lx.maxHp;
                        for (const skill of ["shuoye_liixiang_chunai", "shuoye_lingzhou", "shuoye_chengfo", "shuoye_liixiang_ai"]) {
                            if (!lx.hasSkill(skill)) lx.addSkill(skill);
                        }
                        lx.update();
                    } catch (e) {}
                    // 阵营：对决等 2v2 模式靠 side 判定友/敌
                    try {
                        lx.side = master.side;
                        if (mode === "versus" && lx.node && lx.node.identity) {
                            lx.node.identity.firstChild.innerHTML = "友";
                            lx.node.identity.dataset.color = (master.node && master.node.identity && master.node.identity.dataset.color) || lx.side + "zhu";
                        }
                    } catch (e) {}
                    // 部分模式/皮肤（尤其是联机对决）下，召唤时的立绘可能没跟上：
                    // 先按角色取图，再直接写图片地址（单层背景，加载期间是透明的，不会顯出默认剪影）
                    try {
                        if (lx.node && lx.node.avatar) {
                            const liixiangAvatarUrl = lib.assetURL + "extension/朔夜/image/shuoye_liixiang.png";
                            const applyLiixiangAvatar = () => {
                                try {
                                    const avatar = lx.node && lx.node.avatar;
                                    if (!avatar) return;
                                    avatar.style.backgroundImage = 'url("' + liixiangAvatarUrl + '")';
                                    avatar.style.backgroundSize = "cover";
                                    avatar.style.backgroundPositionX = "center";
                                } catch (e) {}
                            };
                            lx.node.avatar.setBackground("shuoye_liixiang", "character");
                            applyLiixiangAvatar();
                            // 皮肤/UI 可能在创建后重新设一次背景，这里隔两个时间点再盖一次
                            setTimeout(applyLiixiangAvatar, 0);
                            setTimeout(applyLiixiangAvatar, 200);
                        }
                    } catch (e) {}
                    // 阵营判定：主公/忠臣/明忠/平民同一阵营，反贼、内奸各自成阵营
                    const campOf = (p) => lib.shuoyeCampOf(p);
                    const myCamp = campOf(master);
                    const isAlly = (p) => {
                        if (!p) return false;
                        if (p === master) return true;
                        if (myCamp === "other") return false;
                        return campOf(p) === myCamp;
                    };
                    lx.ai = lx.ai || {};
                    lx.ai.modAttitudeFrom = (from, to, att) => {
                        if (from === to) return att;
                        if (to === master) return 999;
                        if (isAlly(to)) return 5;
                        const toCamp = campOf(to);
                        if (myCamp !== "other" && toCamp !== "other" && toCamp !== myCamp) return -10;
                        // 看不出敌友时，随机把其他人当可攻击目标（乙骨除外）
                        return -1 - Math.random() * 3;
                    };
                    lx.ai.modAttitudeTo = (from, to, att) => {
                        if (from === master) return 999;
                        if (isAlly(from)) return 5;
                        return att;
                    };
                },
                liixiang,
                player
            );
            await liixiang.draw(4);
            game.log(player, "召唤了", liixiang);
            lib.skill.shuoye_chunai.playMp3(player, "skill/shuoye_chunai1.mp3", 1);
            lib.skill.shuoye_chunai.sayLong(liixiang, "永远在一起哦", 5000);
        },
        getLiixiang(player) {
            const pid = player && player.storage && player.storage.shuoye_liixiang_pid;
            if (!pid) return null;
            return game.players.concat(game.dead).find((p) => p.playerid == pid) || null;
        },
        getLiixiangList(player) {
            const own = lib.skill.shuoye_chunai.getLiixiang(player);
            const all = game.players.concat(game.dead).filter((p) => p.name1 === "shuoye_liixiang" || p.name2 === "shuoye_liixiang");
            if (!all.length) return own ? [own] : [];
            if (own && all.includes(own)) return [own, ...all.filter((p) => p !== own)];
            return all;
        },
        playMp3(player, path, volume) {
            const url = lib.assetURL + "extension/朔夜/audio/" + path;
            game.broadcastAll(
                (u, v) => {
                    if (_status.video) return;
                    try {
                        const audio = document.createElement("audio");
                        audio.src = u;
                        audio.autoplay = true;
                        audio.volume = typeof v === "number" ? v : lib.config.volumn_audio / 8;
                        // 元素音量上限就是 1，想“翻倍”只能用 WebAudio 增益
                        let ctx = null;
                        try {
                            const Ctx = window.AudioContext || window.webkitAudioContext;
                            if (Ctx) {
                                ctx = new Ctx();
                                // 上下文被挂起时走增益链路会变静音，直接退回普通播放
                                if (ctx.state !== "running") {
                                    try {
                                        ctx.close();
                                    } catch (err) {}
                                    ctx = null;
                                }
                            }
                            if (ctx) {
                                const src = ctx.createMediaElementSource(audio);
                                const gain = ctx.createGain();
                                gain.gain.value = 2;
                                src.connect(gain);
                                gain.connect(ctx.destination);
                                audio.onended = () => {
                                    try {
                                        ctx.close();
                                    } catch (e) {}
                                };
                            }
                        } catch (e) {
                            if (ctx) {
                                try {
                                    ctx.close();
                                } catch (err) {}
                            }
                        }
                        Promise.resolve(audio.play()).catch(() => {});
                    } catch (e) {}
                },
                url,
                volume
            );
        },
        showVideo(name, opt) {
            const o = opt || {};
            return new Promise((resolve) => {
                let video = null;
                let vctx = null;
                let resizeVideo = null;
                try {
                    video = document.createElement("video");
                    video.src = lib.assetURL + "extension/朔夜/audio/" + name;
                    video.autoplay = true;
                    video.loop = false;
                    video.muted = false;
                    video.volume = 1;
                    video.playsInline = true;
                    video.preload = "auto";
                    video.style.cssText =
                        "position:fixed;left:0;top:0;object-fit:cover;background:#000;z-index:2147483647;pointer-events:none;opacity:0;transition:opacity .12s linear;";
                    // 页面在手机端会被 document.body 的 scale 缩小，固定用 100vw/100vh 会变成只占左上角，
                    // 这里按 body 的文档尺寸来定，缩放后正好铺满屏幕
                    const fitVideoToScreen = () => {
                        try {
                            const zoom = game.documentZoom || 1;
                            const width = (document.documentElement.clientWidth || window.innerWidth) / zoom;
                            const height = (document.documentElement.clientHeight || window.innerHeight) / zoom;
                            video.style.width = width + "px";
                            video.style.height = height + "px";
                        } catch (e) {}
                    };
                    fitVideoToScreen();
                    // 全屏/缩放切换后重新铺满
                    resizeVideo = () => {
                        fitVideoToScreen();
                        setTimeout(fitVideoToScreen, 80);
                    };
                    try {
                        if (Array.isArray(lib.onresize)) lib.onresize.push(resizeVideo);
                    } catch (e) {}
                    let attached = false;
                    const attachVideo = () => {
                        if (attached) return;
                        attached = true;
                        try {
                            if (!video.parentNode) document.body.appendChild(video);
                            video.style.opacity = "1";
                            const p = video.play();
                            if (p && typeof p.catch === "function") {
                                p.catch(() => {
                                    try {
                                        video.muted = true;
                                        video.play().catch(() => {});
                                    } catch (e) {}
                                });
                            }
                        } catch (e) {}
                    };
                    video.addEventListener("canplay", attachVideo, { once: true });
                    setTimeout(attachVideo, 1200);
                    // 视频声音放大（元素音量上限是1，只能走 WebAudio 增益）
                    try {
                        const Ctx = window.AudioContext || window.webkitAudioContext;
                        if (Ctx) {
                            vctx = new Ctx();
                            if (vctx.state !== "running") {
                                try {
                                    vctx.close();
                                } catch (e) {}
                                vctx = null;
                            }
                        }
                        if (vctx) {
                            const vgain = vctx.createGain();
                            vgain.gain.value = typeof o.gain === "number" ? o.gain : 3;
                            vctx.createMediaElementSource(video).connect(vgain);
                            vgain.connect(vctx.destination);
                        }
                    } catch (e) {
                        if (vctx) {
                            try {
                                vctx.close();
                            } catch (err) {}
                        }
                        vctx = null;
                    }
                } catch (e) {}
                const bgm = ui.backgroundMusic;
                const bgmPlaying = !!(bgm && !bgm.paused);
                if (bgmPlaying) {
                    try {
                        bgm.pause();
                    } catch (e) {}
                }
                let closed = false;
                const close = () => {
                    if (closed) return;
                    closed = true;
                    try {
                        if (Array.isArray(lib.onresize)) {
                            const idx = lib.onresize.indexOf(resizeVideo);
                            if (idx >= 0) lib.onresize.splice(idx, 1);
                        }
                    } catch (e) {}
                    if (video && video.parentNode) video.parentNode.removeChild(video);
                    if (vctx) {
                        try {
                            vctx.close();
                        } catch (e) {}
                        vctx = null;
                    }
                    if (bgmPlaying && !o.keepBgmPaused) {
                        try {
                            Promise.resolve(bgm.play()).catch(() => {});
                        } catch (e) {}
                    }
                    resolve();
                };
                if (video) {
                    video.onended = close;
                    video.onerror = close;
                    video.onloadedmetadata = () => {
                        const ms = Math.max(3000, (video.duration || 0) * 1000 + 2000);
                        setTimeout(close, ms);
                    };
                }
                setTimeout(close, 30000);
            });
        },
        playVideo(name, opt) {
            const o = opt || {};
            game.broadcast((n, opt2) => {
                try {
                    const video = document.createElement("video");
                    video.src = lib.assetURL + "extension/朔夜/audio/" + n;
                    video.autoplay = true;
                    video.muted = false;
                    video.volume = 1;
                    video.playsInline = true;
                    video.preload = "auto";
                    video.style.cssText =
                        "position:fixed;left:0;top:0;object-fit:cover;background:#000;z-index:2147483647;pointer-events:none;opacity:0;transition:opacity .12s linear;";
                    // 手机端 body 会被 scale 缩小，用文档尺寸才能铺满；全屏切换后也要重新算
                    const fitVideoToScreen = () => {
                        try {
                            const zoom = game.documentZoom || 1;
                            const width = (document.documentElement.clientWidth || window.innerWidth) / zoom;
                            const height = (document.documentElement.clientHeight || window.innerHeight) / zoom;
                            video.style.width = width + "px";
                            video.style.height = height + "px";
                        } catch (e) {}
                    };
                    fitVideoToScreen();
                    const resizeVideo = () => {
                        fitVideoToScreen();
                        setTimeout(fitVideoToScreen, 80);
                    };
                    try {
                        if (Array.isArray(lib.onresize)) lib.onresize.push(resizeVideo);
                    } catch (e) {}
                    let vctx = null;
                    try {
                        const Ctx = window.AudioContext || window.webkitAudioContext;
                        if (Ctx) {
                            vctx = new Ctx();
                            if (vctx.state !== "running") {
                                try {
                                    vctx.close();
                                } catch (e) {}
                                vctx = null;
                            }
                        }
                        if (vctx) {
                            const vgain = vctx.createGain();
                            vgain.gain.value = typeof opt2.gain === "number" ? opt2.gain : 3;
                            vctx.createMediaElementSource(video).connect(vgain);
                            vgain.connect(vctx.destination);
                        }
                    } catch (e) {
                        if (vctx) {
                            try {
                                vctx.close();
                            } catch (err) {}
                        }
                        vctx = null;
                    }
                    const bgm = ui.backgroundMusic;
                    const bgmPlaying = !!(bgm && !bgm.paused);
                    if (bgmPlaying) {
                        try {
                            bgm.pause();
                        } catch (e) {}
                    }
                    let attached = false;
                    const attachVideo = () => {
                        if (attached) return;
                        attached = true;
                        try {
                            if (!video.parentNode) document.body.appendChild(video);
                            video.style.opacity = "1";
                            const p = video.play();
                            if (p && typeof p.catch === "function") {
                                p.catch(() => {
                                    try {
                                        video.muted = true;
                                        video.play().catch(() => {});
                                    } catch (e) {}
                                });
                            }
                        } catch (e) {}
                    };
                    video.addEventListener("canplay", attachVideo, { once: true });
                    setTimeout(attachVideo, 1200);
                    const close = () => {
                        try {
                            if (Array.isArray(lib.onresize)) {
                                const idx = lib.onresize.indexOf(resizeVideo);
                                if (idx >= 0) lib.onresize.splice(idx, 1);
                            }
                        } catch (e) {}
                        if (video.parentNode) video.parentNode.removeChild(video);
                        if (vctx) {
                            try {
                                vctx.close();
                            } catch (e) {}
                            vctx = null;
                        }
                        if (bgmPlaying && !opt2.keepBgmPaused) {
                            try {
                                Promise.resolve(bgm.play()).catch(() => {});
                            } catch (e) {}
                        }
                    };
                    video.onended = close;
                    video.onerror = close;
                    video.onloadedmetadata = () => {
                        setTimeout(close, Math.max(3000, (video.duration || 0) * 1000 + 2000));
                    };
                    setTimeout(close, 30000);
                } catch (e) {}
            }, name, o);
            return lib.skill.shuoye_chunai.showVideo(name, o);
        },
        playBgmOnce(player, path, rate, gain) {
            const url = lib.assetURL + "extension/朔夜/audio/" + path;
            game.broadcastAll((u, r, g) => {
                const bgm = ui.backgroundMusic;
                if (!bgm) return;
                try {
                    bgm.loop = false;
                    const effRate = typeof r === "number" && r > 0 ? r : 1;
                    // BGM 元素也可走 WebAudio 增益（元素音量上限为 1）；
                    // 同一元素只能挂一次 MediaElementSource，缓存起来，平时增益保持 1
                    let bgmGain = bgm._shuoyeGain;
                    if (!bgmGain) {
                        try {
                            const Ctx = window.AudioContext || window.webkitAudioContext;
                            if (Ctx) {
                                const ctx = new Ctx();
                                if (ctx.state === "running") {
                                    const src = ctx.createMediaElementSource(bgm);
                                    const gn = ctx.createGain();
                                    gn.gain.value = 1;
                                    src.connect(gn);
                                    gn.connect(ctx.destination);
                                    bgm._shuoyeCtx = ctx;
                                    bgm._shuoyeGain = bgmGain = gn;
                                } else {
                                    try {
                                        ctx.close();
                                    } catch (e) {}
                                }
                            }
                        } catch (e) {}
                    }
                    const resetGain = () => {
                        if (!bgmGain) return;
                        try {
                            bgmGain.gain.value = 1;
                        } catch (e) {}
                    };
                    if (bgmGain) {
                        try {
                            bgmGain.gain.value = typeof g === "number" && g > 0 ? g : 1;
                        } catch (e) {}
                    }
                    const resetRate = () => {
                        try {
                            bgm.defaultPlaybackRate = 1;
                            bgm.playbackRate = 1;
                        } catch (e) {}
                    };
                    let bgmRestored = false;
                    bgm.onerror = () => {
                        if (bgmRestored) return;
                        bgmRestored = true;
                        try {
                            bgm.onerror = null;
                            resetRate();
                            resetGain();
                            game.playBackgroundMusic();
                        } catch (e) {}
                    };
                    bgm.onended = () => {
                        resetRate();
                        resetGain();
                        bgm.onended = null;
                        bgm.onloadedmetadata = null;
                        // 我们的曲子放完后，恢复原版 BGM（安敢一战 / 心似烟火 等都适用）
                        try {
                            game.playBackgroundMusic();
                        } catch (e) {}
                    };
                    bgm.src = u;
                    // 关键：给 audio 设置 src 会把 playbackRate 重置回 1，所以倍速必须在 src 之后设
                    const applyRate = () => {
                        try {
                            bgm.defaultPlaybackRate = effRate;
                            bgm.playbackRate = effRate;
                        } catch (e) {}
                    };
                    applyRate();
                    // 保险：即使中途被别的 BGM 顶掉（onended 不触发），也一定把倍速恢复成 1
                    bgm.onloadedmetadata = () => {
                        applyRate();
                        const dur = Math.max(1000, (bgm.duration || 0) * 1000);
                        setTimeout(resetRate, dur / effRate + 2000);
                    };
                    bgm.volume = lib.config.volumn_background / 8;
                    const p = bgm.play();
                    if (p && typeof p.then === "function") {
                        p.then(() => applyRate()).catch(() => {});
                    } else if (p && typeof p.catch === "function") {
                        p.catch(() => {});
                    }
                } catch (e) {}
            }, url, rate, gain);
        },
        stopBgm() {
            game.broadcastAll(() => {
                if (ui.backgroundMusic && !ui.backgroundMusic.paused) {
                    try {
                        ui.backgroundMusic.pause();
                    } catch (e) {}
                }
            });
        },
        changeBackground() {
            game.broadcastAll(() => {
                if (!ui.background) return;
                ui.background.style.backgroundImage = 'url("' + lib.assetURL + 'extension/朔夜/image/shuoye_zhenyan_bg.jpg")';
                ui.background.style.backgroundSize = "cover";
                ui.background.style.backgroundPosition = "50% 50%";
                ui.background.style.filter = "none";
                ui.background.style.webkitFilter = "none";
                ui.background.style.transform = "none";
            });
        },
        sayLong(player, str, time) {
            game.broadcastAll((p, s, t) => {
                if (!p || !p.node || !ui.window) return;
                const dialog = ui.create.dialog("hidden");
                dialog.classList.add("static");
                dialog.add('<div class="text" style="word-break:break-all;display:inline">' + s + "</div>");
                dialog.classList.add("popped");
                ui.window.appendChild(dialog);
                const width = dialog.content.firstChild.firstChild.offsetWidth;
                if (width < 190) {
                    dialog._mod_height = -16;
                } else {
                    dialog.content.firstChild.style.textAlign = "left";
                }
                dialog.style.width = width + 16 + "px";
                let refnode = null;
                if (p.node.avatar && p.parentNode == ui.arena) {
                    refnode = p.node.avatar;
                }
                if (refnode) {
                    lib.placePoppedDialog(dialog, {
                        clientX: (ui.arena.offsetLeft + p.getLeft() + refnode.offsetLeft + refnode.offsetWidth / 2) * game.documentZoom,
                        clientY: (ui.arena.offsetTop + p.getTop() + refnode.offsetTop + refnode.offsetHeight / 4) * game.documentZoom,
                    });
                } else {
                    lib.placePoppedDialog(dialog, {
                        clientX: (p.getLeft() + p.offsetWidth / 2) * game.documentZoom,
                        clientY: (p.getTop() + p.offsetHeight / 4) * game.documentZoom,
                    });
                }
                if (dialog._mod_height) {
                    dialog.content.firstChild.style.padding = 0;
                }
                setTimeout(() => dialog.delete(), t || 5000);
            }, player, str, time);
        },
    },
//#noname-kit-end skill:shuoye_chunai
//#noname-kit-begin skill:shuoye_mofang
    shuoye_mofang: {
        group: ["shuoye_mofang_flush", "shuoye_mofang_watch"],
        forced: true,
        trigger: { player: "phaseBegin" },
        filter(event, player) {
            // 真赝②改写后，【模仿】统一由【具咒】的回合开始触发来调用，避免重复
            if (player.storage.shuoye_juzhou_rewritten) return false;
            const lx = lib.skill.shuoye_chunai.getLiixiang(player);
            return !!lx && lib.skill.shuoye_lingzhou.getRecords(lx).length > 0;
        },
        async content(event, trigger, player) {
            await lib.skill.shuoye_mofang.activate(player);
        },
        async activate(player) {
            const lx = lib.skill.shuoye_chunai.getLiixiang(player);
            if (!lx) return;
            let records = lib.skill.shuoye_lingzhou.getRecords(lx);
            // 联机下只列“客机也能完整加载”的技能：来源扩展未声明 connect 的技能，客机上只是影子定义，拿过去也点不出来
            if (_status.connectMode) {
                records = records.filter((s) => lib.skill.shuoye_mofang.isClientSafeSkill(s));
            }
            // 已经拥有的技能（含之前模仿得到的）不再重复提供
            records = records.filter((s) => !player.hasSkill(s) && !(player.storage.shuoye_mofang_skills || []).includes(s));
            if (!records.length) return;
            const names = records.map((s) => get.translation(s));
            const options = names.slice();
            if (!options.includes("cancel2")) options.push("cancel2");
            const result = await player
                .chooseControl(options)
                .set("prompt", "模仿：获得一个里香记录的技能")
                .set("ai", () => 0)
                .forResult();
            if (!result || !result.control || result.control === "cancel2") return;
            const index = names.indexOf(result.control);
            const skill = records[index];
            if (!skill) return;
            lib.skill.shuoye_chunai.playMp3(player, "skill/shuoye_mofang1.mp3", 1);
            game.log(player, "模仿了", "【" + get.translation(skill) + "】");
            game.broadcastAll(
                (p, s) => {
                    p.storage.shuoye_mofang_skills = p.storage.shuoye_mofang_skills || [];
                    if (!p.storage.shuoye_mofang_skills.includes(s)) p.storage.shuoye_mofang_skills.push(s);
                    if (!p.hasSkill(s)) p.addSkill(s);
                },
                player,
                skill
            );
        },
        isClientSafeSkill(skill) {
            const info = lib.skill[skill];
            if (!info || info.forceLoad) return true;
            const extensions = lib.extensions || [];
            for (const ext of extensions) {
                const pack = ext && ext[4];
                if (pack && pack.skill && pack.skill[skill]) {
                    return !!ext[5];
                }
            }
            // 内置官方包均声明了 connect
            return true;
        },
        forget(player, skill) {
            if (!player || !skill) return;
            if (!(player.storage.shuoye_mofang_skills || []).includes(skill)) return;
            const lx = lib.skill.shuoye_chunai.getLiixiang(player);
            game.broadcastAll(
                (p, lx2, s) => {
                    if (p.storage.shuoye_mofang_skills) p.storage.shuoye_mofang_skills.remove(s);
                    if (p.hasSkill(s) || (Array.isArray(p.skills) && p.skills.includes(s))) p.removeSkill(s);
                    if (p.disabledSkills && p.disabledSkills[s]) delete p.disabledSkills[s];
                    if (lx2) {
                        // 里香可能因为【成佛】被禁用，hasSkill 为 false，但技能仍在列表里
                        if (lx2.hasSkill(s) || (Array.isArray(lx2.skills) && lx2.skills.includes(s))) lx2.removeSkill(s);
                        if (lx2.disabledSkills && lx2.disabledSkills[s]) delete lx2.disabledSkills[s];
                        if (lx2.storage.shuoye_lingzhou_skills) lx2.storage.shuoye_lingzhou_skills.remove(s);
                    }
                },
                player,
                lx,
                skill
            );
            game.log(player, "失去了技能", "【" + get.translation(skill) + "】");
        },
        subSkill: {
            flush: {
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "useCardAfter" },
                filter(event, player) {
                    return !!(player.storage.shuoye_mofang_pending && player.storage.shuoye_mofang_pending.length);
                },
                async content(event, trigger, player) {
                    const list = (player.storage.shuoye_mofang_pending || []).slice();
                    player.storage.shuoye_mofang_pending = [];
                    for (const skill of list) {
                        lib.skill.shuoye_mofang.forget(player, skill);
                    }
                },
            },
            watch: {
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: ["useSkill", "phaseAfter"] },
                filter(event, player) {
                    if (player.storage.shuoye_mofang_pending && player.storage.shuoye_mofang_pending.length) return true;
                    if (!(player.storage.shuoye_mofang_skills && player.storage.shuoye_mofang_skills.length)) return false;
                    return event.name === "useSkill";
                },
                async content(event, trigger, player) {
                    if (trigger.name === "useSkill") {
                        // viewAs/backup 技能的 useSkill.skill 可能是 xxx_backup，按前缀归属
                        const hit = (player.storage.shuoye_mofang_skills || []).filter(
                            (s) => s === trigger.skill || (typeof trigger.skill === "string" && trigger.skill.startsWith(s + "_"))
                        );
                        for (const skill of hit) {
                            lib.skill.shuoye_mofang.forget(player, skill);
                        }
                        return;
                    }
                    // 回合结束只兜底“已发动、但那张牌没正常结算完”的情况；没发动的不清理
                    const pending = (player.storage.shuoye_mofang_pending || []).slice();
                    player.storage.shuoye_mofang_pending = [];
                    for (const skill of pending) {
                        lib.skill.shuoye_mofang.forget(player, skill);
                    }
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_mofang
//#noname-kit-begin skill:shuoye_juzhou
    shuoye_juzhou: {
        group: ["shuoye_juzhou_damage", "shuoye_juzhou_reset", "shuoye_juzhou_start"],
        enable: "phaseUse",
        filter(event, player) {
            if (!game.hasPlayer((t) => t !== player && t.isAlive())) return false;
            if (player.storage.shuoye_juzhou_rewritten) {
                const used = player.storage.shuoye_juzhou_uses || 0;
                const extra = player.storage.shuoye_juzhou_extra || 0;
                return used < 1 + extra;
            }
            return !player.storage.shuoye_juzhou_used;
        },
        ai: { order: 6, result: { player: 1 } },
        async content(event, trigger, player) {
            if (!player.storage.shuoye_juzhou_rewritten) {
                game.broadcastAll((p) => {
                    p.storage.shuoye_juzhou_used = true;
                }, player);
                await lib.skill.shuoye_juzhou.doDuel(player, true, false);
                return;
            }
            await lib.skill.shuoye_juzhou.useJuzhou(player);
        },
        async useJuzhou(player) {
            const lx = lib.skill.shuoye_chunai.getLiixiang(player);
            // 改写前从未用过限定版：第一次发动仍然是原限定技（带音乐/动画），后续才是新版
            if (!player.storage.shuoye_juzhou_used) {
                game.broadcastAll((p) => {
                    p.storage.shuoye_juzhou_used = true;
                }, player);
                await lib.skill.shuoye_juzhou.doDuel(player, true, false, false, "具咒：此次为限定技，选择一名角色进行决斗");
                return;
            }
            // 1）先选择自己或里香失去一点体力（改写后的发动代价）
            const candidates = [player];
            if (lx && lx.isAlive()) candidates.push(lx);
            let payer = player;
            if (candidates.length > 1) {
                const labels = candidates.map((p) => get.translation(p));
                const picked = await player
                    .chooseControl(labels)
                    .set("prompt", "具咒：选择一名角色失去一点体力")
                    .set("ai", () => 1)
                    .forResult();
                if (picked && picked.control) {
                    const index = labels.indexOf(picked.control);
                    if (index >= 0) payer = candidates[index];
                }
            }
            await payer.loseHp(1);
            // 代价把自己扣死则后续无法继续
            if (!player.isAlive()) return;
            // 2）记录本回合发动次数，然后与一名角色【决斗】
            game.broadcastAll((p) => {
                p.storage.shuoye_juzhou_uses = (p.storage.shuoye_juzhou_uses || 0) + 1;
            }, player);
            // 改写后的【决斗】：伤害固定1点，无增伤/减伤（基本牌仍视为【杀】）
            const result = await lib.skill.shuoye_juzhou.doDuel(player, false, true, false);
            if (!result) {
                game.broadcastAll((p) => {
                    p.storage.shuoye_juzhou_uses = Math.max(0, (p.storage.shuoye_juzhou_uses || 1) - 1);
                }, player);
                return;
            }
            // 3）你与因此受到伤害的角色各摸一张牌（同一人则摸两张）
            if (player.isAlive()) await player.draw(1);
            if (result.damaged) {
                await result.damaged.draw(1);
                // 4）受伤角色不是你 → 本回合使用次数+1
                if (result.damaged !== player) {
                    game.broadcastAll((p) => {
                        p.storage.shuoye_juzhou_extra = (p.storage.shuoye_juzhou_extra || 0) + 1;
                    }, player);
                }
            }
            // 5）然后发动一次【模仿】
            await lib.skill.shuoye_mofang.activate(player);
        },
        subSkill: {
            start: {
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "phaseBegin" },
                filter(event, player) {
                    if (!player.storage.shuoye_juzhou_rewritten) return false;
                    const used = player.storage.shuoye_juzhou_uses || 0;
                    const extra = player.storage.shuoye_juzhou_extra || 0;
                    return used < 1 + extra;
                },
                async content(event, trigger, player) {
                    // 改写后：回合开始时询问是否发动（失血由玩家选择自己或里香，决斗后各摸一张牌，再模仿）
                    // 限定版从未用过时，第一次仍按原限定技结算，提示框里注明
                    const limitedFirst = !player.storage.shuoye_juzhou_used;
                    const result = await player
                        .chooseBool(limitedFirst ? "具咒：是否发动？（此次为限定技：与一名角色进行决斗）" : "具咒：是否发动？（选择自己或里香失去一点体力，然后与一名角色决斗）")
                        .set("ai", () => 1)
                        .forResult();
                    if (!result.bool) return;
                    await lib.skill.shuoye_juzhou.useJuzhou(player);
                },
            },
            reset: {
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "phaseBefore" },
                content(event, trigger, player) {
                    game.broadcastAll((p) => {
                        delete p.storage.shuoye_juzhou_uses;
                        delete p.storage.shuoye_juzhou_extra;
                    }, player);
                },
            },
            damage: {
                forced: false,
                direct: true,
                trigger: { source: "damageSource" },
                filter(event, player) {
                    const lx = lib.skill.shuoye_chunai.getLiixiang(player);
                    if (!lx || !lx.isAlive() || lx.maxHp <= 1) return false;
                    return event.player !== player && event.player.isAlive();
                },
                async content(event, trigger, player) {
                    const lx = lib.skill.shuoye_chunai.getLiixiang(player);
                    const target = trigger.player;
                    const result = await player
                        .chooseBool("具咒：令里香与" + get.translation(target) + "各失去1点体力上限，并令里香对其发动【灵咒】？")
                        .set("ai", () => 1)
                        .forResult();
                    if (!result.bool) return;
                    game.log(player, "发动了", "【具咒】");
                    if (lx.isAlive()) await lx.loseMaxHp();
                    if (target.isAlive()) await target.loseMaxHp();
                    await lib.skill.shuoye_lingzhou.activate(lx, target);
                },
            },
        },
        async doDuel(player, withMedia, simple, drawFirst, prompt) {
            if (!game.hasPlayer((target) => target !== player && target.isAlive())) return null;
            const result = await player
                .chooseTarget(prompt || "具咒：选择一名角色进行决斗", true, (card, player2, target) => target !== player2 && target.isAlive())
                // 联机：ai 会被序列化到客机，用 get.player() 取当前事件角色，不能闭包 player
                .set("ai", (target) => -get.attitude(get.player(), target))
                .forResult();
            if (!result.bool || !result.targets || !result.targets.length) return null;
            const target = result.targets[0];
            if (drawFirst) await player.draw(1);
            if (withMedia) {
                lib.skill.shuoye_chunai.playMp3(player, "skill/shuoye_juzhou1.mp3", 1);
                await lib.skill.shuoye_chunai.playVideo("全力以赴.mp4", { keepBgmPaused: true });
                if (player.storage.shuoye_juzhou_rewritten) {
                    // 已被真赝相爱改写：【具咒】视频结束后继续回到真赝相爱的 BGM（心似烟火）
                    lib.skill.shuoye_chunai.playBgmOnce(player, "skill/shuoye_zhenyanxiangai2.mp3", 1, 2);
                } else {
                    lib.skill.shuoye_chunai.playBgmOnce(player, "skill/shuoye_juzhou2.mp3");
                    // 兜底：此前被其它技能改过 BGM 时，视频结束后的切歌可能被顶回，复检几次
                    [600, 1600, 2600].forEach((delay) => {
                        setTimeout(() => {
                            try {
                                const bgm = ui.backgroundMusic;
                                if (!bgm) return;
                                if (!bgm.src || bgm.src.indexOf("shuoye_juzhou2") < 0) {
                                    console.warn("[朔夜] 具咒 BGM 被顶回，重新切换:", bgm.src);
                                    lib.skill.shuoye_chunai.playBgmOnce(player, "skill/shuoye_juzhou2.mp3");
                                }
                            } catch (e) {}
                        }, delay);
                    });
                }
            }
            // 具咒决斗「对波」特效：当前发动者侧紫、目标侧蓝，决出胜负后整条光波转为胜方颜色。
            // 不绑定乙骨：任何角色通过偷取/复制/临时获得【具咒】后发动，都按当前 player/target 播放。
            let duelFx = null;
            const duelFxId = "szs_jz_" + Date.now() + "_" + Math.random().toString(36).slice(2);
            const startFn = lib.skill.shuoye_juzhou_duel_fx && lib.skill.shuoye_juzhou_duel_fx.start;
            // 与秤金次【坐杀博徒】特效同一套联机补丁：把特效函数本身作为参数广播，
            // 客机直接重建执行，不依赖客机上是否完整加载了这个技能。
            const broadcastClash = () => {
                const before = duelFx && duelFx._clashAck ? duelFx._clashAck : 0;
                try {
                    game.broadcastAll((id) => {
                        try {
                            const fx = window.__szsJzFx && window.__szsJzFx[id];
                            if (!fx) return;
                            fx._clashAck = (fx._clashAck || 0) + 1;
                            fx.clash();
                        } catch (e) {}
                    }, duelFxId);
                } catch (e) {}
                if (duelFx && (duelFx._clashAck || 0) === before) {
                    try { duelFx.clash(); } catch (e) {}
                }
            };
            const broadcastFinish = (winner) => {
                try {
                    game.broadcastAll((id, w) => {
                        try {
                            const fx = window.__szsJzFx && window.__szsJzFx[id];
                            if (!fx) return;
                            fx._done = fx.finish(w);
                            if (fx._done && fx._done.then) fx._done.then(() => {
                                try { delete window.__szsJzFx[id]; } catch (e) {}
                            });
                        } catch (e) {}
                    }, duelFxId, winner);
                } catch (e) {}
            };
            try {
                if (typeof startFn !== "function") throw new Error("effect skill missing");
                try {
                    game.broadcastAll((fn, pid1, pid2, id) => {
                        try {
                            if (pid1 == null || pid2 == null) return;
                            const find = (pid) => game.players.concat(game.dead || []).find((p) => p && p.playerid === pid);
                            const p1 = find(pid1);
                            const p2 = find(pid2);
                            if (!p1 || !p2 || p1 === p2) return;
                            window.__szsJzFx = window.__szsJzFx || {};
                            window.__szsJzFx[id] = fn(p1, p2);
                        } catch (e) {}
                    }, startFn, player.playerid, target.playerid, duelFxId);
                } catch (e) {}
                try {
                    duelFx = (typeof window !== "undefined" && window.__szsJzFx && window.__szsJzFx[duelFxId]) || null;
                } catch (e) {}
                if (!duelFx) {
                    duelFx = startFn(player, target);
                    try {
                        window.__szsJzFx = window.__szsJzFx || {};
                        window.__szsJzFx[duelFxId] = duelFx;
                    } catch (e) {}
                }
                if (duelFx && duelFx.ready) await duelFx.ready;
            } catch (e) {
                console.warn("[朔夜] 具咒决斗特效启动失败:", e);
                duelFx = null;
            }
            // 特效蓄能期间游戏已结束：清理特效并终止决斗
            if (typeof _status !== "undefined" && _status && _status.over) {
                if (duelFx) {
                    try {
                        broadcastFinish(null);
                        if (!duelFx._done) duelFx._done = duelFx.finish(null);
                        await duelFx._done;
                    } catch (e) {}
                }
                return null;
            }
            // 削弱：决斗基础伤害 = 1 + (双方手牌数之和的一半，向上取整)
            let damage = simple ? 1 : 1 + Math.ceil((player.countCards("h") + target.countCards("h")) / 2);
            game.log(player, "与", target, "进行决斗", "（当前伤害" + damage + "）");
            let turn = target;
            let source = player;
            let damaged = null;
            let finishPromise = null;
            try {
            while (true) {
                const next = turn.chooseToRespond();
                next.set("prompt", "具咒决斗：打出一张基本牌视为【杀】（当前伤害" + damage + "）");
                next.set("damage", damage);
                next.set("filterCard", (card, player2) => get.type(card) === "basic" && lib.filter.cardRespondable(card, player2));
                // 联机：ai 会被序列化到客机，damage 放事件上，不能闭包
                next.set("ai", () => ((_status.event && _status.event.damage) > 0 ? 1 : -1));
                const res = await next.forResult();
                if (res.bool) {
                    if (!simple) damage = Math.max(0, damage - 1);
                    [turn, source] = [source, turn];
                    try {
                        if (duelFx) broadcastClash();
                    } catch (e) {}
                } else {
                    if (damage > 0) {
                        const winner = turn === player ? "blue" : "purple";
                        if (duelFx) {
                            try {
                                // 判定失败的一刻就开始推波；等光波中心/小爆炸到达败方时再结算伤害，让爆炸与掉血同步
                                broadcastFinish(winner);
                                finishPromise = duelFx._done || duelFx.finish(winner);
                                if (duelFx.reached) await duelFx.reached;
                            } catch (e) {
                                finishPromise = null;
                            }
                        }
                        await turn.damage(source, damage);
                        damaged = turn;
                    }
                    break;
                }
            }
            } finally {
                if (duelFx) {
                    const winner = damaged ? (damaged === player ? "blue" : "purple") : null;
                    try {
                        if (!finishPromise) {
                            broadcastFinish(winner);
                            finishPromise = duelFx._done || duelFx.finish(winner);
                        }
                        await finishPromise;
                    } catch (e) {
                        console.warn("[朔夜] 具咒决斗特效收尾失败:", e);
                    }
                }
            }
            return { damaged };
        },
    },
//#noname-kit-end skill:shuoye_juzhou
//#noname-kit-begin skill:shuoye_zhenyanxiangai
    shuoye_zhenyanxiangai: {
        nobracket: true,
        group: ["shuoye_zhenyanxiangai_unlock"],
        enable: "phaseUse",
        usable: 1,
        ai: { order: 8, result: { player: 1 } },
        filter(event, player) {
            if (!player.storage.shuoye_zhenyan_unlock) return false;
            return !player.storage.shuoye_zhenyan_used;
        },
        async content(event, trigger, player) {
            const list = lib.skill.shuoye_chunai.getLiixiangList(player);
            const deadList = list.filter((p) => !p.isAlive());
            let lx = lib.skill.shuoye_chunai.getLiixiang(player);
            // 场上有多个里香时，自行选择要对谁发动（只能选已阵亡的作为①目标）
            if (deadList.length > 1) {
                const labels = deadList.map((p) => `${get.translation(p)}（${get.cnNumber(p.getSeatNum())}号位）`);
                const picked = await player
                    .chooseControl(labels)
                    .set("prompt", "真赝相爱：选择一名已阵亡的【祈本里香】")
                    .set("ai", () => 0)
                    .forResult();
                if (!picked || !picked.control) return;
                const index = labels.indexOf(picked.control);
                if (index >= 0) lx = deadList[index];
            }
            const options = [];
            if (lx && !lx.isAlive()) options.push("①里香失去【成佛】然后复活");
            options.push("②改写【具咒】");
            if (!options.length) return;
            let choice = options[0];
            if (options.length > 1) {
                const result = await player
                    .chooseControl(options)
                    .set("prompt", "真赝相爱")
                    .set("options", options)
                    // 联机：ai 会序列化到客机，options 放事件上，不能闭包
                    .set("ai", () => {
                        const list = (_status.event && _status.event.options) || [];
                        const index = list.indexOf("②改写【具咒】");
                        return index >= 0 ? index : 0;
                    })
                    .forResult();
                if (!result || !result.control) return;
                choice = result.control;
            } else {
                const result = await player.chooseBool("真赝相爱：是否发动？").set("ai", () => 1).forResult();
                if (!result.bool) return;
            }
            game.broadcastAll((p) => {
                p.storage.shuoye_zhenyan_used = true;
            }, player);
            player.changeSkin({ characterName: "shuoye_yiguyoutai" }, "shuoye_yiguyoutai_2");
            game.log(player, "发动了", "【真赝相爱】");
            if (choice.startsWith("①")) {
                lib.skill.shuoye_chunai.playMp3(player, "skill/shuoye_zhenyanxiangai1.mp3", 1);
                lib.skill.shuoye_chunai.sayLong(player, "我们可是纯爱", 5000);
                if (lx.hasSkill("shuoye_chengfo")) await lx.removeSkill("shuoye_chengfo");
                game.broadcastAll((p) => {
                    p.maxHp = 3;
                    p.hp = 3;
                    p.revive(3);
                }, lx);
                game.log(lx, "复活了");
                return;
            }
            game.broadcastAll((p) => {
                p.storage.shuoye_juzhou_rewritten = true;
            }, player);
            await lib.skill.shuoye_chunai.playVideo("复活.mp4", { keepBgmPaused: true, gain: 1.5 });
            lib.skill.shuoye_chunai.playBgmOnce(player, "skill/shuoye_zhenyanxiangai2.mp3", 1, 2);
            lib.skill.shuoye_chunai.changeBackground();
            if (lx && !lx.isAlive() && lx.hasSkill("shuoye_chengfo")) {
                await lib.skill.shuoye_chengfo.revive(lx);
            }
        },
        subSkill: {
            unlock: {
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { global: "dieAfter" },
                filter(event, player) {
                    const lx = lib.skill.shuoye_chunai.getLiixiang(player);
                    return !!lx && event.player === lx && !player.storage.shuoye_zhenyan_unlock;
                },
                content(event, trigger, player) {
                    game.broadcastAll((p) => {
                        p.storage.shuoye_zhenyan_unlock = true;
                    }, player);
                    game.log(player, "解锁了", "【真赝相爱】");
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_zhenyanxiangai
//#noname-kit-begin skill:shuoye_liixiang_chunai
    shuoye_liixiang_chunai: {
        forced: true,
        trigger: { global: "damageBegin4" },
        filter(event, player) {
            if (event.player === player) return false;
            const master = lib.skill.shuoye_liixiang_chunai.getMaster(player);
            return !!master && event.player === master && player.isAlive() && event.num > 0;
        },
        async content(event, trigger, player) {
            // 先把伤害压到 1，再把承伤者换成里香：
            // 不新建伤害事件，避免来源方的加伤技能（如【初诞】）二度生效导致实际承受 2 点
            trigger.num = 1;
            trigger.player = player;
            // 给灵咒留标记：伤害事件的目标已被改为里香
            trigger._shuoyeChunaiTo = player;
            lib.skill.shuoye_chunai.playMp3(player, "skill/shuoye_liixiang_chunai2.mp3", 1);
            game.log(player, "发动了", "【纯爱】");
        },
        getMaster(player) {
            const pid = player && player.storage && player.storage.shuoye_master_pid;
            if (!pid) return null;
            return game.players.concat(game.dead).find((p) => p.playerid == pid) || null;
        },
    },
//#noname-kit-end skill:shuoye_liixiang_chunai
//#noname-kit-begin skill:shuoye_lingzhou
    shuoye_lingzhou: {
        forced: true,
        trigger: { global: "damageEnd" },
        filter(event, player) {
            // 游戏已结束就别再弹选择了：结算后事件链已被拆掉，再 await 选择可能永远不回来
            if (!player.isAlive() || _status.over) return false;
            const other = lib.skill.shuoye_lingzhou.getOther(event, player);
            if (!other || other === player) return false;
            const master = lib.skill.shuoye_liixiang_chunai.getMaster(player);
            if (master && other === master) return false;
            return true;
        },
        async content(event, trigger, player) {
            const other = lib.skill.shuoye_lingzhou.getOther(trigger, player);
            await lib.skill.shuoye_lingzhou.activate(player, other);
        },
        getOther(event, player) {
            if (!event) return null;
            // 【纯爱】把伤害改由里香承担时，伤害事件的目标可能仍是原目标，靠标记判断
            if (event._shuoyeChunaiTo === player && event.source && event.source !== player) {
                return event.source;
            }
            if (event.player === player) return event.source || null;
            if (event.source === player) return event.player || null;
            return null;
        },
        // 应急用：从里香身上移除一个（卡死的）已获得技能并清掉记录
        dropSkill(lx, skill) {
            if (!lx || !skill) return;
            game.broadcastAll(
                (p, s) => {
                    if (p.storage && Array.isArray(p.storage.shuoye_lingzhou_skills)) p.storage.shuoye_lingzhou_skills.remove(s);
                    if (p.hasSkill(s)) p.removeSkill(s);
                    p.update();
                },
                lx,
                skill
            );
        },
        getRecords(lx) {
            if (!lx || !lx.storage) return [];
            const list = (lx.storage.shuoye_lingzhou_skills || []).filter((s) => !!lib.skill[s]);
            // 成佛封印后技能仍在记录里（“拥有但无法发动”），其余失去的情况则自动清掉
            if (lx.storage.shuoye_lingzhou_sealed) return list;
            return list.filter((s) => lx.hasSkill(s));
        },
        getGainable(lx, target) {
            const record = lib.skill.shuoye_lingzhou.getRecords(lx);
            const list = [];
            for (const s of target.getSkills()) {
                if (record.includes(s)) continue;
                if (!lib.translate[s]) continue;
                const info = lib.skill[s];
                if (!info) continue;
                if (info.sub || info.hiddenSkill || info.charlotte || info.superCharlotte) continue;
                if (info.equipSkill) continue;
                if (info.unique || info.juexing) continue;
                // 黑名单：这些技能被复制后可能卡死/报错，禁止灵咒获得（可在 lib.shuoyeCopyBlacklist 里继续追加）
                if ((lib.shuoyeCopyBlacklist || []).includes(s)) continue;
                list.push(s);
            }
            return list;
        },
        async activate(lx, target) {
            // 目标即使被这次伤害打死，也允许拿技能（否则 1 血的【无为觉者】永远偷不到）
            if (!lx || !target || !lx.isAlive() || _status.over) return;
            // 不获得自己、也不获得乙骨忧太的技能
            if (target === lx) return;
            const master = lib.skill.shuoye_liixiang_chunai.getMaster(lx);
            if (master && target === master) return;
            const skills = lib.skill.shuoye_lingzhou.getGainable(lx, target);
            if (!skills.length) return;
            const names = skills.map((s) => get.translation(s));
            const options = names.slice();
            options.push("cancel2");
            let result;
            try {
                result = await lx
                    .chooseControl(options)
                    .set("prompt", "灵咒：获得并记录" + get.translation(target) + "的一个技能")
                    .set("ai", () => 0)
                    .forResult();
            } catch (e) {
                // 选择事件被中断（如对局已结束/重连）时不要卡住 damageEnd 链
                console.error("[朔夜] 灵咒选择失败：", e);
                return;
            }
            if (!result || !result.control || result.control === "cancel2") return;
            const skill = skills[names.indexOf(result.control)];
            if (!skill) return;
            lib.skill.shuoye_chunai.playMp3(lx, "skill/shuoye_lingzhou1.mp3", 1);
            game.log(lx, "获得了技能", "【" + get.translation(skill) + "】");
            game.broadcastAll(
                (p, s) => {
                    p.storage.shuoye_lingzhou_skills = p.storage.shuoye_lingzhou_skills || [];
                    if (!p.storage.shuoye_lingzhou_skills.includes(s)) p.storage.shuoye_lingzhou_skills.push(s);
                    if (!p.hasSkill(s)) p.addSkill(s);
                    // 成佛封印后：依然“拥有”（显示在武将牌上），但禁用
                    if (p.storage.shuoye_lingzhou_sealed && !p.disabledSkills[s]) {
                        p.disableSkill(s, s);
                        p.update();
                    }
                },
                lx,
                skill
            );
        },
    },
//#noname-kit-end skill:shuoye_lingzhou
//#noname-kit-begin skill:shuoye_chengfo
    shuoye_chengfo: {
        group: ["shuoye_chengfo_skip"],
        forced: true,
        popup: false,
        subSkill: {
            skip: {
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "phaseBefore" },
                filter(event, player) {
                    return !!player.storage.shuoye_chengfo_skipturn;
                },
                content(event, trigger, player) {
                    // 以此法复活后永久跳过回合，标记不删除
                    game.log(player, "跳过了本回合");
                    player.skip("phaseJudge");
                    player.skip("phaseDraw");
                    player.skip("phaseUse");
                    player.skip("phaseDiscard");
                },
            },
        },
        async revive(lx) {
            if (!lx) return;
            game.log(lx, "发动了", "【成佛】");
            game.broadcastAll((p) => {
                p.maxHp = 6;
                p.hp = 6;
                p.revive(6);
            }, lx);
            lx.changeSkin({ characterName: "shuoye_liixiang" }, "shuoye_liixiang_fo");
            const records = lib.skill.shuoye_lingzhou.getRecords(lx);
            for (const skill of records) {
                // 仍然“拥有”（武将牌与技能描述里看得到），但被禁用：无法触发、也点不出来
                if (!lx.hasSkill(skill)) continue;
                game.broadcastAll((p, s) => {
                    if (!p.disabledSkills[s]) p.disableSkill(s, s);
                    p.update();
                }, lx, skill);
            }
            game.broadcastAll((p) => {
                // 技能仍然“拥有”（记录保留，可被【模仿】取用），只是无法发动
                p.storage.shuoye_lingzhou_sealed = true;
                p.storage.shuoye_chengfo_skipturn = true;
            }, lx);
            // 成佛复活演出：在复活 mp4 之后播放「高兴的里香」，并弹 5 秒对话
            lib.skill.shuoye_chunai.playMp3(lx, "skill/shuoye_liixiang_chunai1.mp3", 1);
            lib.skill.shuoye_chunai.sayLong(lx, "忧太...忧太......", 5000);
        },
    },
//#noname-kit-end skill:shuoye_chengfo
//#noname-kit-begin skill:shuoye_liixiang_ai
    shuoye_liixiang_ai: {
        charlotte: true,
        silent: true,
        popup: false,
        forced: true,
        mod: {
            playerEnabled(card, player, target) {
                if (get.name(card) !== "sha") return;
                const master = lib.skill.shuoye_liixiang_chunai.getMaster(player);
                if (master && target === master) return false;
            },
        },
    },
//#noname-kit-end skill:shuoye_liixiang_ai
//#noname-kit-begin skill:shuoye_shenpan
    shuoye_shenpan: {
        trigger: {
            global: "phaseEnd",
        },
        filter(event, player) {
            return !player.hasSkill("shuoye_shenpan_used") && lib.skill.shuoye_shenpan.getCandidates().length > 0;
        },
        // 本回合「获得牌张数>2 或 造成伤害点数>2」的存活角色
        getCandidates() {
            const list = [];
            for (const current of game.players) {
                if (!current.isIn()) continue;
                const gained = current.getHistory("gain").reduce((sum, evt) => sum + (evt.cards ? evt.cards.length : 0), 0);
                const damaged = current.getHistory("sourceDamage").reduce((sum, evt) => sum + (evt.num || 0), 0);
                if (gained > 2 || damaged > 2) list.push(current);
            }
            return list;
        },
        // 若怜台词：每次触发技能随机三选一，5 秒（sayLong 内部已 broadcastAll，两端可见）
        sayRuolian(player) {
            const list = ["吓哭了", "是人啊？", "这不阴？"];
            lib.skill.shuoye_chunai.sayLong(player, list.randomGet(), 5000);
        },
        async cost(event, trigger, player) {
            const list = lib.skill.shuoye_shenpan.getCandidates();
            event.result = await player
                // 联机：filterTarget 会被序列化到客机执行，不能引用闭包变量，候选名单放事件上（.set("list") 会随事件下发）
                .chooseTarget("令一名本回合获得牌或造成伤害数大于2的角色本轮技能失效，然后其执行一个额外回合", function (card, me, target) {
                    const candidates = (_status.event && _status.event.list) || [];
                    return candidates.includes(target);
                })
                .set("list", list)
                .set("ai", (target) => {
                    const me = get.player();
                    if (target === me) return 0;
                    const usable = target.getSkills(null, false, false).some((skill) => {
                        const info = lib.skill[skill];
                        return info && !info.charlotte && !info.persevereSkill;
                    });
                    if (!usable) return 0;
                    return -get.attitude(me, target);
                })
                .forResult();
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            lib.skill.shuoye_shenpan.sayRuolian(player);
            player.addTempSkill("shuoye_shenpan_used", "roundStart");
            target.addTempSkill("shuoye_shenpan_fengyin", "roundStart");
            // 显式传技能名：带 skill 的 phase 不参与轮次判定（lib.onround）
            target.insertPhase("shuoye_shenpan");
        },
        subSkill: {
            used: {
                charlotte: true,
                silent: true,
                popup: false,
            },
            fengyin: {
                charlotte: true,
                silent: true,
                popup: false,
                mark: true,
                marktext: "封",
                init(player, skill) {
                    player.addSkillBlocker(skill);
                    // 客机同步：单参数自包含写法，技能名写成常量（不引用闭包）
                    game.broadcastAll((p) => {
                        if (!p.storage.skill_blocker) p.storage.skill_blocker = [];
                        if (!p.storage.skill_blocker.includes("shuoye_shenpan_fengyin")) {
                            p.storage.skill_blocker.push("shuoye_shenpan_fengyin");
                        }
                        p.update();
                    }, player);
                },
                onremove(player, skill) {
                    player.removeSkillBlocker(skill);
                    // 客机同步：onremove 只在主机跑，不清理客机会一直显示失效
                    game.broadcastAll((p) => {
                        if (!Array.isArray(p.storage.skill_blocker)) return;
                        const index = p.storage.skill_blocker.indexOf("shuoye_shenpan_fengyin");
                        if (index >= 0) p.storage.skill_blocker.splice(index, 1);
                        if (!p.storage.skill_blocker.length) delete p.storage.skill_blocker;
                        p.update();
                    }, player);
                },
                skillBlocker(skill, player) {
                    const info = lib.skill[skill];
                    return !!info && skill != "shuoye_shenpan_fengyin" && !info.charlotte && !info.persevereSkill;
                },
                intro: {
                    markcount: () => 0,
                    content: "本轮技能失效",
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_shenpan
//#noname-kit-begin skill:shuoye_buqu
    shuoye_buqu: {
        forced: true,
        locked: false,
        // dying：伤害把自己打进濒死时，先反伤再走求桃/死亡；damageEnd：护甲吸收未濒死时的兜底
        trigger: {
            player: ["dying", "damageEnd"],
        },
        logTarget: "source",
        getDamage(event) {
            if (!event) return null;
            if (event.name === "damageEnd") return event;
            if (event.name === "dying" && event.reason && event.reason.name === "damage") return event.reason;
            return null;
        },
        filter(event, player) {
            const damage = lib.skill.shuoye_buqu.getDamage(event);
            if (!damage || damage._shuoyeBuquDone) return false;
            // 进过濒死的伤害已由 dying 分支处理，damageEnd 不再重复
            if (event.name === "damageEnd" && event._dyinged) return false;
            const source = damage.source;
            if (!source || source === player || !source.isIn()) return false;
            if (typeof damage._shuoyeBuquHp != "number") return false;
            return damage.num > damage._shuoyeBuquHp;
        },
        async content(event, trigger, player) {
            const damage = lib.skill.shuoye_buqu.getDamage(trigger);
            const source = damage.source;
            lib.skill.shuoye_shenpan.sayRuolian(player);
            damage._shuoyeBuquDone = true;
            const next = source.damage({ num: damage.num, source: player });
            await next;
            // 来源因反伤进入过濒死（无论是否被救）则回复1点；濒死时这一下能直接把自己救回
            if (next._dyinged) await player.recover();
        },
        group: "shuoye_buqu_pre",
        subSkill: {
            pre: {
                charlotte: true,
                silent: true,
                popup: false,
                forced: true,
                trigger: {
                    player: "damageBegin4",
                },
                async content(event, trigger, player) {
                    trigger._shuoyeBuquHp = player.hp;
                },
            },
        },
    },
//#noname-kit-end skill:shuoye_buqu
//#noname-kit-begin skill:shuoye_zuosha
    shuoye_zuosha: {
        // 一中杀/十周年UI 的技能名会自己包【】并对文本 slice(0,2)，
        // 带 HTML 渐变的技能名必须 nobracket，否则会被截成 "<s" 且排版错乱
        nobracket: true,
        limited: true,
        direct: true,
        animationStr: "坐杀博徒",
        trigger: {
            global: "phaseBegin",
            player: "dying",
        },
        filter(event, player) {
            return !player.awakenedSkills.includes("shuoye_zuosha");
        },
        init(player) {
            player.storage.shuoye_zuosha = false;
            if (!player.hasSkill("shuoye_zuosha_refresh")) player.addSkill("shuoye_zuosha_refresh");
            if (!player.hasSkill("shuoye_zuosha_bufftimer")) player.addSkill("shuoye_zuosha_bufftimer");
            if (game.getExtensionConfig("朔夜", "zuosha_debug") && !player.hasSkill("shuoye_zuosha_debug")) player.addSkill("shuoye_zuosha_debug");
            try {
                if (typeof document !== "undefined" && document.head && !document.getElementById("szs-skillname-style")) {
                    const style = document.createElement("style");
                    style.id = "szs-skillname-style";
                    style.innerHTML = ".shousha-character-dialog .xskill > div[data-color]:has(span.shs-gold){font-size:0 !important;} .shousha-character-dialog .xskill > div[data-color] span.shs-gold{font-size:16px !important;letter-spacing:0;} .shousha-character-dialog .xskill > div[data-color]:has(span.shs-fx){font-size:0 !important;} .shousha-character-dialog .xskill > div[data-color] span.shs-fx{font-size:16px !important;letter-spacing:0;} .shousha-character-dialog .xskill > div[data-color]:has(span.shs-gold)::after, .shousha-character-dialog .xskill > div[data-color]:has(span.shs-fx)::after{content:'：';font-size:16px;color:#e0c03c;}";
                    document.head.appendChild(style);
                }
            } catch (e) {}
        },
        async content(event, trigger, player) {
            const S = lib.skill.shuoye_zuosha;
            const result = await player.chooseBool("坐杀博徒：是否进行抽奖？").set("ai", () => S.shouldGamble(player, trigger)).forResult();
            if (!result || !result.bool) return;
            player.logSkill("shuoye_zuosha");
            player.awakenSkill("shuoye_zuosha");
            player.storage.shuoye_zuosha_countdown = 7;
            await S.lottery(player);
        },
        shouldGamble(player, trigger) {
            if (trigger && trigger.name === "dying") return true;
            if (player.hp <= 1) return false;
            if (!trigger || trigger.player === player) return true;
            return player.hp < player.maxHp || player.countCards("h") < 2;
        },
        pool() {
            return ["sha", "shan", "tao", "jiu", "guohe", "shunshou", "wuzhong", "juedou", "jiedao", "nanman", "wanjian", "wuxie", "taoyuan", "wugu", "huogong", "tiesuo", "lebu", "bingliang", "shandian"].filter((name) => lib.card[name]);
        },
        randomSpec(pool) {
            const suits = ["spade", "heart", "club", "diamond"];
            return {
                name: pool[Math.floor(Math.random() * pool.length)],
                suit: suits[Math.floor(Math.random() * suits.length)],
                number: 1 + Math.floor(Math.random() * 13),
            };
        },
        rollSpecs(player) {
            const S = lib.skill.shuoye_zuosha;
            const pool = S.pool();
            let specs;
            const debug = player.storage.shuoye_zuosha_debug_specs;
            if (Array.isArray(debug) && debug.length === 3) {
                specs = debug.map((spec) => ({ name: spec.name, suit: spec.suit, number: spec.number }));
                delete player.storage.shuoye_zuosha_debug_specs;
            } else {
                specs = [S.randomSpec(pool), S.randomSpec(pool), S.randomSpec(pool)];
            }
            const fixnum = player.storage.shuoye_zuosha_fixnum;
            const fixname = player.storage.shuoye_zuosha_fixname;
            if (fixnum && Array.isArray(fixnum.pos)) {
                for (const pos of fixnum.pos) {
                    if (specs[pos]) specs[pos].number = fixnum.value;
                }
            }
            if (fixname && Array.isArray(fixname.pos)) {
                for (const pos of fixname.pos) {
                    if (specs[pos]) specs[pos].name = fixname.value;
                }
            }
            delete player.storage.shuoye_zuosha_fixnum;
            delete player.storage.shuoye_zuosha_fixname;
            return specs;
        },
        analyze(specs) {
            const maxCount = (arr) => {
                const map = {};
                let max = 0;
                for (const value of arr) {
                    map[value] = (map[value] || 0) + 1;
                    if (map[value] > max) max = map[value];
                }
                return max;
            };
            const odd = specs.filter((spec) => spec.number % 2 === 1).length;
            const sameName = maxCount(specs.map((spec) => spec.name));
            const sameNum = maxCount(specs.map((spec) => spec.number));
            const sameSuit = maxCount(specs.map((spec) => spec.suit));
            const tier3 = [];
            if (odd === 3) tier3.push("odd");
            if (sameName === 3) tier3.push("name");
            if (sameNum === 3) tier3.push("num");
            if (sameSuit === 3) tier3.push("suit");
            const count = (odd > 0 ? 1 : 0) + (sameName > 1 ? 1 : 0) + (sameNum > 1 ? 1 : 0) + (sameSuit > 1 ? 1 : 0);
            return {
                odd,
                sameName,
                sameNum,
                sameSuit,
                tier3,
                count,
                fail: odd === 0 && sameName < 2 && sameNum < 2 && sameSuit < 2,
            };
        },
        maxIndexes(specs, key) {
            const map = {};
            for (let i = 0; i < specs.length; i++) {
                const value = specs[i][key];
                if (!map[value]) map[value] = [];
                map[value].push(i);
            }
            let best = [];
            for (const value in map) {
                if (map[value].length > best.length) best = map[value];
            }
            return best;
        },
        makeCards(specs, indexes) {
            return indexes.map((index) => game.createCard2(specs[index].name, specs[index].suit, specs[index].number));
        },
        labels(data) {
            const list = [];
            if (data.odd === 1) list.push("奇数×1 摸1");
            else if (data.odd === 2) list.push("奇数×2 摸2·回1·无距离");
            else if (data.odd === 3) list.push("奇数×3 摸3·回1·无限制");
            if (data.sameName === 2) list.push("同名×2 得2张");
            else if (data.sameName === 3) list.push("同名×3 回1·得3张·任意牌");
            if (data.sameNum === 2) list.push("同点×2 造伤+1·失牌摸1");
            else if (data.sameNum === 3) list.push("同点×3 回1·造伤+1·转化摸1·两牌任意");
            if (data.sameSuit === 2) list.push("同花×2 回复摸1");
            else if (data.sameSuit === 3) list.push("同花×3 回1·受伤-1·夺牌·回复摸1");
            return list;
        },
        activeEffects(player) {
            const list = [];
            const groups = player.storage.shuoye_zuosha_buff_groups || [];
            for (const group of groups) {
                const buffs = group.buffs || {};
                const parts = [];
                if (buffs.nodistance) parts.push("使用牌无距离限制");
                if (buffs.norestrict) parts.push("使用牌无任何限制（次数与距离）");
                if (buffs.dmgup) parts.push("造成伤害+" + buffs.dmgup);
                if (buffs.dmgdown) parts.push("受到伤害-" + buffs.dmgdown);
                if (buffs.losedraw) parts.push("非因使用失去牌时摸" + get.cnNumber(buffs.losedraw) + "张牌");
                if (buffs.convdraw) parts.push("使用或打出转化牌时摸" + get.cnNumber(buffs.convdraw) + "张牌");
                if (buffs.any2) parts.push("可将两张牌视为任意非装备牌使用或打出");
                if (buffs.suit3) parts.push("造成伤害时获得目标" + get.cnNumber(buffs.suit3) + "张牌");
                if (buffs.healdraw) parts.push("场上有人回复体力时你摸" + get.cnNumber(buffs.healdraw) + "张牌");
                if (parts.length) list.push("【剩余" + (group.turns || 0) + "回合】" + parts.join("，"));
            }
            if (player.hasSkill("shuoye_zuosha_any3") && player.countCards("h", (card) => card.storage && card.storage.shuoye_zuosha_any3)) list.push("坐杀所得的牌可视为任意牌使用或打出");
            return list;
        },
        currentEffectText(player) {
            const list = lib.skill.shuoye_zuosha.activeEffects(player);
            if (!list.length) return "";
            if (list.length === 1) return list[0] + "。";
            const marks = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];
            return list.map((item, index) => (marks[index] || index + 1 + ".") + item).join("；") + "。";
        },
        syncCurrentEffect(player) {
            const list = lib.skill.shuoye_zuosha.activeEffects(player);
            if (list.length) {
                if (!player.hasSkill("shuoye_zuosha_fx")) player.addSkill("shuoye_zuosha_fx");
            } else if (player.hasSkill("shuoye_zuosha_fx")) {
                player.removeSkill("shuoye_zuosha_fx");
            }
        },
        getBuffStack(player, key) {
            const groups = player.storage.shuoye_zuosha_buff_groups || [];
            let total = 0;
            for (const group of groups) {
                total += (group.buffs && group.buffs[key]) || 0;
            }
            return total;
        },
        newBuffGroup(player) {
            if (!Array.isArray(player.storage.shuoye_zuosha_buff_groups)) {
                player.storage.shuoye_zuosha_buff_groups = [];
            }
            player.storage.shuoye_zuosha_buff_seq = (player.storage.shuoye_zuosha_buff_seq || 0) + 1;
            const group = { id: player.storage.shuoye_zuosha_buff_seq, turns: 6, buffs: {} };
            player.storage.shuoye_zuosha_buff_groups.push(group);
            return group;
        },
        addBuff(player, key, n, group) {
            const S = lib.skill.shuoye_zuosha;
            const target = group || S.newBuffGroup(player);
            target.buffs[key] = (target.buffs[key] || 0) + (n || 1);
            const skill = "shuoye_zuosha_" + key;
            if (!player.hasSkill(skill)) player.addSkill(skill);
            S.syncCurrentEffect(player);
            S.syncBuffState(player);
        },
        refreshBuffSkills(player) {
            const S = lib.skill.shuoye_zuosha;
            const keys = ["nodistance", "norestrict", "dmgup", "dmgdown", "losedraw", "convdraw", "healdraw", "suit3", "any2"];
            for (const key of keys) {
                const skill = "shuoye_zuosha_" + key;
                if (S.getBuffStack(player, key) > 0) {
                    if (!player.hasSkill(skill)) player.addSkill(skill);
                } else if (player.hasSkill(skill)) {
                    player.removeSkill(skill);
                }
            }
        },
        syncBuffState(player) {
            const groups = player.storage.shuoye_zuosha_buff_groups || [];
            const snapshot = {
                groups: groups.map((group) => ({ id: group.id, turns: group.turns || 0, buffs: { ...group.buffs } })),
            };
            game.broadcast((p, snap) => {
                try {
                    if (snap.groups && snap.groups.length) {
                        p.storage.shuoye_zuosha_buff_groups = snap.groups;
                    } else {
                        delete p.storage.shuoye_zuosha_buff_groups;
                    }
                } catch (e) {}
            }, player, snapshot);
        },
        clearBuffs(player) {
            const S = lib.skill.shuoye_zuosha;
            delete player.storage.shuoye_zuosha_buff_groups;
            const keys = ["nodistance", "norestrict", "dmgup", "dmgdown", "losedraw", "convdraw", "healdraw", "suit3", "any2"];
            for (const key of keys) {
                delete player.storage["shuoye_zuosha_stack_" + key];
                const skill = "shuoye_zuosha_" + key;
                if (player.hasSkill(skill)) player.removeSkill(skill);
            }
            delete player.storage.shuoye_zuosha_buff_turns;
            S.syncCurrentEffect(player);
            S.syncBuffState(player);
        },
        async lottery(player) {
            const S = lib.skill.shuoye_zuosha;
            const specs = S.rollSpecs(player);
            const data = S.analyze(specs);
            try {
                if (data.tier3.length) {
                    S.startJackpotBgm(player);
                } else {
                    S.stopJackpotBgm();
                }
            } catch (e) {
                console.error("[朔夜] 坐杀博徒：BGM 切换失败", e);
            }
            try {
                S.playAnimation(player, specs, data);
            } catch (e) {
                console.error("[朔夜] 坐杀博徒：抽奖演出广播失败", e);
            }
            await new Promise((resolve) => setTimeout(resolve, 7500));
            const suitText = { spade: "黑桃", heart: "红桃", club: "梅花", diamond: "方块" };
            game.log(player, "坐杀博徒", "抽奖：", specs.map((spec) => "【" + get.translation(spec.name) + "·" + (suitText[spec.suit] || spec.suit) + "·" + get.strNumber(spec.number) + "】").join(""));
            if (data.fail) {
                try {
                    await S.applyFail(player, specs);
                } catch (e) {
                    console.error("[朔夜] 坐杀博徒：失败结算异常", e);
                }
                try {
                    S.clearJackpot(player);
                } catch (e) {
                    console.error("[朔夜] 坐杀博徒：停止大奖演出失败", e);
                }
                try {
                    S.showNoJackpotMsg(player);
                } catch (e) {
                    console.error("[朔夜] 坐杀博徒：热情熄灭提示失败", e);
                }
                return;
            }
            try {
                await S.applyEffects(player, specs, data);
            } catch (e) {
                console.error("[朔夜] 坐杀博徒：效果结算异常", e);
            }
            if (data.tier3.length >= 2) {
                delete player.storage.shuoye_zuosha_countdown;
                player.restoreSkill("shuoye_zuosha");
                player.popup("坐杀博徒");
                game.log(player, "触发了至少两个「3」效果，", "#g坐杀博徒", "已刷新");
            }
            if (data.tier3.length >= 1) {
                try {
                    const judges = player.getCards("j");
                    if (judges.length) {
                        await player.discard(judges);
                        game.log(player, "因触发「3」效果，清除了判定区的牌");
                    }
                } catch (e) {
                    console.error("[朔夜] 坐杀博徒：清除判定区失败", e);
                }
                try {
                    S.startJackpot(player);
                } catch (e) {
                    console.error("[朔夜] 坐杀博徒：大奖演出广播失败", e);
                }
            } else {
                try {
                    S.clearJackpot(player);
                } catch (e) {
                    console.error("[朔夜] 坐杀博徒：停止大奖演出失败", e);
                }
                try {
                    S.showNoJackpotMsg(player);
                } catch (e) {
                    console.error("[朔夜] 坐杀博徒：热情熄灭提示失败", e);
                }
            }
        },
        async applyFail(player, specs) {
            game.log(player, "坐杀博徒", "抽奖失败");
            await player.loseHp(1);
            if (player.isDead()) return;
            const cards = specs.map((spec) => game.createCard2(spec.name, spec.suit, spec.number));
            const result = await player.chooseButton(["坐杀博徒：获得其中一张牌", cards], true).set("ai", (button) => {
                try {
                    return get.value(button.link);
                } catch (e) {
                    return 1;
                }
            }).forResult();
            if (result && result.bool && result.links && result.links.length) {
                await player.gain(result.links.slice(0, 1), "gain2");
            }
        },
        async applyEffects(player, specs, data) {
            const S = lib.skill.shuoye_zuosha;
            let buffGroup = null;
            const getBuffGroup = () => (buffGroup || (buffGroup = S.newBuffGroup(player)));
            if (data.odd === 1) {
                await player.draw(1);
                await S.chooseFixNumber(player, [0]);
            } else if (data.odd === 2) {
                await player.draw(2);
                await player.recover(1);
                S.addBuff(player, "nodistance", 1, getBuffGroup());
            } else if (data.odd === 3) {
                await player.draw(3);
                await player.recover(1);
                S.addBuff(player, "norestrict", 1, getBuffGroup());
                await S.chooseFixNumber(player, [0, 1]);
            }
            if (data.sameName === 2) {
                const cards = S.makeCards(specs, S.maxIndexes(specs, "name"));
                await player.gain(cards, "gain2");
                await S.chooseFixName(player, [0]);
            } else if (data.sameName === 3) {
                await player.recover(1);
                const cards = S.makeCards(specs, [0, 1, 2]);
                await player.gain(cards, "gain2");
                for (const card of cards) {
                    try {
                        card.storage = card.storage || {};
                        card.storage.shuoye_zuosha_any3 = true;
                        game.broadcastAll((target) => {
                            if (!target) return;
                            target.storage = target.storage || {};
                            target.storage.shuoye_zuosha_any3 = true;
                        }, card);
                    } catch (e) {
                        console.error("[朔夜] 坐杀博徒：同步“视为任意牌”标记失败", e);
                    }
                }
                if (!player.hasSkill("shuoye_zuosha_any3")) player.addSkill("shuoye_zuosha_any3");
                await S.chooseFixName(player, [0, 1]);
            }
            if (data.sameNum === 2) {
                S.addBuff(player, "dmgup", 1, getBuffGroup());
                S.addBuff(player, "losedraw", 1, getBuffGroup());
            } else if (data.sameNum === 3) {
                await player.recover(1);
                S.addBuff(player, "dmgup", 1, getBuffGroup());
                S.addBuff(player, "convdraw", 1, getBuffGroup());
                S.addBuff(player, "any2", 1, getBuffGroup());
            }
            if (data.sameSuit === 2) {
                S.addBuff(player, "healdraw", 1, getBuffGroup());
            } else if (data.sameSuit === 3) {
                await player.recover(1);
                S.addBuff(player, "dmgdown", 1, getBuffGroup());
                S.addBuff(player, "suit3", 1, getBuffGroup());
                S.addBuff(player, "healdraw", 1, getBuffGroup());
            }
            S.syncCurrentEffect(player);
        },
        async chooseFixNumber(player, pos) {
            const buttons = [];
            for (let i = 1; i <= 13; i++) buttons.push([String(i), get.strNumber(i)]);
            const where = pos.length > 1 ? "1、2号位" : "1号位";
            const result = await player.chooseButton(["坐杀博徒：指定一个点数，下次抽奖" + where + "必为该点数", [buttons, "textbutton"]], true).set("ai", (button) => {
                const num = parseInt(button.link);
                return num === 7 ? 10 : 1;
            }).forResult();
            if (!result || !result.bool || !result.links || !result.links.length) return;
            const value = parseInt(result.links[0]);
            if (isNaN(value)) return;
            player.storage.shuoye_zuosha_fixnum = { value: value, pos: pos.slice() };
            game.log(player, "指定点数", "#y" + get.strNumber(value), "为下次抽奖" + where);
        },
        async chooseFixName(player, pos) {
            const list = [];
            for (const name of lib.skill.shuoye_zuosha.pool()) {
                list.push([get.type2(name) === "basic" ? "基本" : "锦囊", "", name]);
            }
            const where = pos.length > 1 ? "1、2号位" : "1号位";
            const result = await player.chooseButton(["坐杀博徒：指定一个牌名，下次抽奖" + where + "必为该牌名", [list, "vcard"]], true).set("ai", (button) => {
                const name = button.link && button.link[2];
                return name === "wuzhong" || name === "sha" ? 8 : 2;
            }).forResult();
            if (!result || !result.bool || !result.links || !result.links.length) return;
            const link = result.links[0];
            const name = Array.isArray(link) ? link[2] : link;
            if (!name) return;
            player.storage.shuoye_zuosha_fixname = { value: name, pos: pos.slice() };
            game.log(player, "指定牌名", "#y" + get.translation(name), "为下次抽奖" + where);
        },
        playAnimation(player, specs, data) {
            const S = lib.skill.shuoye_zuosha;
            const effect = lib.skill.shuoye_zuosha_anim && lib.skill.shuoye_zuosha_anim.effect;
            if (typeof effect != "function") {
                console.error("[朔夜] 坐杀博徒：抽奖动画函数缺失");
                return;
            }
            const labels = data.fail ? ["抽奖失败"] : S.labels(data);
            game.broadcastAll((func, specText, labelText, failed, power) => {
                func(JSON.parse(specText), JSON.parse(labelText), failed, power);
            }, effect, JSON.stringify(specs), JSON.stringify(labels), data.fail, data.count);
        },
        startJackpot(player) {
            game.broadcastAll((p) => {
                if (!p || !p.node || !p.node.avatar) return;
                const ensureGlow = function () {
                    try {
                        if (ui.background && !ui.background.querySelector(".szs-glow")) {
                            const glow = document.createElement("div");
                            glow.className = "szs-glow";
                            ui.background.appendChild(glow);
                        }
                    } catch (e) {}
                };
                try {
                    if (p.node._szsVideoWrap && p.node._szsVideoWrap.parentNode) {
                        ensureGlow();
                        return;
                    }
                } catch (e) {}
                const dir = lib.assetURL + "extension/朔夜/audio/";
                const pairs = [
                    [dir + "skill/shuoye_zuosha_jackpot1.mp3", dir + "shuoye_zuosha_jackpot1.mp4"],
                    [dir + "shuoye_zuosha_jackpot2.mp4", dir + "skill/shuoye_zuosha_jackpot2.mp3"],
                ];
                const wrap = document.createElement("div");
                wrap.className = "szs-videowrap";
                wrap.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;z-index:6;pointer-events:none;overflow:hidden;background:radial-gradient(circle at 50% 45%,#2b1c05,#120b02 75%);transition:opacity .8s linear;opacity:1;";
                const makeVideo = function (pair) {
                    const video = document.createElement("video");
                    video.muted = true;
                    video.playsInline = true;
                    video.preload = "auto";
                    video.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .2s linear;background:transparent;";
                    let useFallback = false;
                    const setSrc = function () {
                        try {
                            video.src = pair[useFallback ? 1 : 0];
                            video.load();
                        } catch (e) {}
                    };
                    video.onerror = function () {
                        if (!useFallback) {
                            useFallback = true;
                            setSrc();
                        }
                    };
                    setSrc();
                    return video;
                };
                const v1 = makeVideo(pairs[0]);
                const v2 = makeVideo(pairs[1]);
                wrap.appendChild(v2);
                wrap.appendChild(v1);
                p.node.avatar.appendChild(wrap);
                p.node._szsVideoWrap = wrap;
                let current = v1;
                let next = v2;
                const commit = function (incoming, outgoing) {
                    incoming.style.opacity = "1";
                    outgoing.style.opacity = "0";
                    current = incoming;
                    next = outgoing;
                    setTimeout(function () {
                        try {
                            outgoing.pause();
                        } catch (e) {}
                    }, 300);
                };
                const switchToNext = function () {
                    try {
                        const incoming = next;
                        const outgoing = current;
                        incoming.currentTime = 0;
                        const startPlay = function () {
                            const finish = function () {
                                setTimeout(function () {
                                    commit(incoming, outgoing);
                                }, 40);
                            };
                            try {
                                const promise = incoming.play();
                                if (promise && promise.then) {
                                    promise.then(finish).catch(finish);
                                } else {
                                    finish();
                                }
                            } catch (e) {
                                finish();
                            }
                        };
                        if (incoming.readyState >= 2) {
                            startPlay();
                        } else {
                            const onReady = function () {
                                incoming.removeEventListener("canplay", onReady);
                                startPlay();
                            };
                            incoming.addEventListener("canplay", onReady);
                            try {
                                const promise = incoming.play();
                                if (promise && promise.catch) promise.catch(function () {});
                            } catch (e) {}
                        }
                    } catch (e) {}
                };
                v1.addEventListener("ended", switchToNext);
                v2.addEventListener("ended", switchToNext);
                current.style.opacity = "1";
                try {
                    const promise = current.play();
                    if (promise && promise.catch) promise.catch(function () {});
                } catch (e) {}
                ensureGlow();
            }, player);
        },
        clearJackpot(player) {
            game.broadcastAll((p) => {
                try {
                    const wrap = p && p.node && p.node._szsVideoWrap;
                    if (wrap) {
                        p.node._szsVideoWrap = null;
                        wrap.style.opacity = "0";
                        setTimeout(function () {
                            try {
                                const videos = wrap.querySelectorAll("video");
                                for (let i = 0; i < videos.length; i++) {
                                    videos[i].pause();
                                    videos[i].src = "";
                                }
                                if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
                            } catch (e) {}
                        }, 900);
                    }
                } catch (e) {}
                try {
                    const legacy = p && p.node && p.node._szsVideo;
                    if (legacy) {
                        p.node._szsVideo = null;
                        legacy.style.opacity = "0";
                        setTimeout(function () {
                            try {
                                legacy.pause();
                                if (legacy.parentNode) legacy.parentNode.removeChild(legacy);
                            } catch (e) {}
                        }, 900);
                    }
                } catch (e) {}
                try {
                    const glows = document.querySelectorAll(".szs-glow");
                    for (let i = 0; i < glows.length; i++) {
                        const glow = glows[i];
                        glow.style.animation = "none";
                        glow.style.transition = "opacity 1.5s linear";
                        glow.style.opacity = "0";
                        (function (node) {
                            setTimeout(function () {
                                if (node.parentNode) node.parentNode.removeChild(node);
                            }, 1700);
                        })(glow);
                    }
                } catch (e) {}
            }, player);
        },
        startJackpotBgm(player) {
            game.broadcastAll((url) => {
                const bgm = ui.backgroundMusic;
                if (!bgm) return;
                try {
                    const already = (bgm.currentSrc || bgm.src || "").indexOf("shuoye_zuosha_bgm1") >= 0 && !bgm.paused;
                    if (already) {
                        bgm.loop = true;
                        return;
                    }
                    bgm.onended = null;
                    bgm.onerror = null;
                    bgm.onloadedmetadata = null;
                    bgm.loop = true;
                    bgm.src = url;
                    bgm.volume = lib.config.volumn_background / 8;
                    const promise = bgm.play();
                    if (promise && promise.catch) promise.catch(function () {});
                } catch (e) {}
            }, lib.assetURL + "extension/朔夜/audio/skill/shuoye_zuosha_bgm1.mp3");
        },
        showNoJackpotMsg(player) {
            game.broadcastAll((p) => {
                if (!document.body) return;
                try {
                    const old = document.querySelector(".szs-nojackpot");
                    if (old && old.parentNode) old.parentNode.removeChild(old);
                    const zoom = game.documentZoom || 1;
                    const vw = (document.documentElement.clientWidth || window.innerWidth) / zoom;
                    const vh = (document.documentElement.clientHeight || window.innerHeight) / zoom;
                    let left = vw / 2;
                    let top = vh / 2;
                    let hasAnchor = false;
                    try {
                        const anchor = p && p.node && (p.node.avatar || p.node);
                        if (anchor && typeof anchor.getBoundingClientRect === "function") {
                            const rect = anchor.getBoundingClientRect();
                            if (rect && rect.width && rect.height) {
                                left = (rect.left + rect.width / 2) / zoom;
                                top = rect.top / zoom - 6;
                                hasAnchor = true;
                            }
                        }
                    } catch (e) {}
                    left = Math.min(Math.max(left, 70), Math.max(70, vw - 70));
                    top = Math.max(top, 40);
                    const base = hasAnchor ? "translate(-50%,-100%)" : "translate(-50%,-50%)";
                    const box = document.createElement("div");
                    box.className = "szs-nojackpot";
                    box.textContent = "我的热情熄灭了";
                    box.style.cssText = "position:fixed;left:" + left + "px;top:" + top + "px;transform:" + base + " scale(.92);z-index:2147483000;padding:7px 13px;border-radius:7px;background:rgba(20,12,4,.92);border:1px solid rgba(245,196,81,.75);box-shadow:0 0 15px rgba(245,196,81,.35),inset 0 0 12px rgba(255,150,60,.15);color:#ffe7a8;font-size:10px;letter-spacing:2px;font-weight:700;white-space:nowrap;opacity:0;transition:opacity .4s linear,transform .4s ease;pointer-events:none;font-family:sans-serif;";
                    document.body.appendChild(box);
                    requestAnimationFrame(function () {
                        box.style.opacity = "1";
                        box.style.transform = base + " scale(1)";
                    });
                    setTimeout(function () {
                        box.style.opacity = "0";
                        box.style.transform = base + " scale(.96)";
                    }, 4600);
                    setTimeout(function () {
                        if (box.parentNode) box.parentNode.removeChild(box);
                    }, 5100);
                } catch (e) {}
            }, player);
        },
        jackpotBgmPlaying() {
            const bgm = ui.backgroundMusic;
            if (!bgm || bgm.paused) return false;
            return (bgm.currentSrc || bgm.src || "").indexOf("shuoye_zuosha_bgm1") >= 0;
        },
        stopJackpotBgm() {
            game.broadcastAll(() => {
                const bgm = ui.backgroundMusic;
                if (!bgm) return;
                if ((bgm.currentSrc || bgm.src || "").indexOf("shuoye_zuosha_bgm1") < 0) return;
                try {
                    bgm.loop = false;
                    bgm.onended = null;
                    bgm.onerror = null;
                    bgm.onloadedmetadata = null;
                } catch (e) {}
                try {
                    bgm.pause();
                } catch (e) {}
                try {
                    game.playBackgroundMusic();
                } catch (e) {}
                try {
                    const promise = bgm.play();
                    if (promise && promise.catch) promise.catch(function () {});
                } catch (e) {}
            });
        },
    },
//#noname-kit-end skill:shuoye_zuosha
//#noname-kit-begin skill:shuoye_zuosha_refresh
    shuoye_zuosha_refresh: {
        nopop: true,
        charlotte: true,
        sub: true,
        popup: false,
        silent: true,
        forced: true,
        trigger: {
            global: "phaseBegin",
            player: "die",
        },
        filter(event, player) {
            if (event.name === "die") return true;
            return player.awakenedSkills.includes("shuoye_zuosha") && (player.storage.shuoye_zuosha_countdown || 0) > 0;
        },
        content(event, trigger, player) {
            if (trigger.name === "die") {
                try {
                    lib.skill.shuoye_zuosha.stopJackpotBgm();
                } catch (e) {}
                try {
                    lib.skill.shuoye_zuosha.clearJackpot(player);
                } catch (e) {}
                return;
            }
            const left = (player.storage.shuoye_zuosha_countdown || 0) - 1;
            player.storage.shuoye_zuosha_countdown = left;
            if (left <= 0) {
                delete player.storage.shuoye_zuosha_countdown;
                player.restoreSkill("shuoye_zuosha");
                player.popup("坐杀博徒");
                game.log(player, "的", "#g坐杀博徒", "已刷新");
            }
        },
    },
//#noname-kit-end skill:shuoye_zuosha_refresh
//#noname-kit-begin skill:shuoye_zuosha_dmgup
    shuoye_zuosha_dmgup: {
        nopop: true,
        charlotte: true,
        silent: true,
        popup: false,
        forced: true,
        trigger: {
            source: "damageBegin1",
        },
        filter(event, player) {
            return event.num > 0;
        },
        content(event, trigger, player) {
            trigger.num += Math.max(1, lib.skill.shuoye_zuosha.getBuffStack(player, "dmgup"));
        },
    },
//#noname-kit-end skill:shuoye_zuosha_dmgup
//#noname-kit-begin skill:shuoye_zuosha_dmgdown
    shuoye_zuosha_dmgdown: {
        nopop: true,
        charlotte: true,
        silent: true,
        popup: false,
        forced: true,
        trigger: {
            player: "damageBegin4",
        },
        filter(event, player) {
            return event.num > 0;
        },
        content(event, trigger, player) {
            trigger.num = Math.max(0, trigger.num - Math.max(1, lib.skill.shuoye_zuosha.getBuffStack(player, "dmgdown")));
        },
    },
//#noname-kit-end skill:shuoye_zuosha_dmgdown
//#noname-kit-begin skill:shuoye_zuosha_losedraw
    shuoye_zuosha_losedraw: {
        nopop: true,
        charlotte: true,
        silent: true,
        popup: false,
        forced: true,
        trigger: { player: "loseAfter" },
        filter(event, player) {
            if (event.name !== "lose") return false;
            let cards = [];
            if (Array.isArray(event.cards2)) cards = event.cards2.slice();
            for (const key of ["js", "ss", "xs"]) {
                if (Array.isArray(event[key]) && event[key].length) cards.push(...event[key]);
            }
            if (!cards.length) return false;
            let parent = event.parent;
            while (parent) {
                if ((parent.name === "useCard" || parent.name === "respond" || parent.name === "equip") && parent.player === player) return false;
                parent = parent.parent;
            }
            return true;
        },
        content(event, trigger, player) {
            player.draw(Math.max(1, lib.skill.shuoye_zuosha.getBuffStack(player, "losedraw")));
        },
    },
//#noname-kit-end skill:shuoye_zuosha_losedraw
//#noname-kit-begin skill:shuoye_zuosha_convdraw
    shuoye_zuosha_convdraw: {
        nopop: true,
        charlotte: true,
        silent: true,
        popup: false,
        forced: true,
        trigger: {
            player: ["useCard", "respond"],
        },
        filter(event, player) {
            return !!event.card && !event.card.isCard;
        },
        content(event, trigger, player) {
            player.draw(Math.max(1, lib.skill.shuoye_zuosha.getBuffStack(player, "convdraw")));
        },
    },
//#noname-kit-end skill:shuoye_zuosha_convdraw
//#noname-kit-begin skill:shuoye_zuosha_norestrict
    shuoye_zuosha_norestrict: {
        nopop: true,
        charlotte: true,
        silent: true,
        popup: false,
        mod: {
            cardUsable(card, player, num) {
                return Infinity;
            },
            targetInRange(card, player, target) {
                return true;
            },
        },
    },
//#noname-kit-end skill:shuoye_zuosha_norestrict
//#noname-kit-begin skill:shuoye_zuosha_suit3
    shuoye_zuosha_suit3: {
        nopop: true,
        charlotte: true,
        silent: true,
        popup: false,
        forced: true,
        trigger: {
            source: "damageEnd",
        },
        filter(event, player) {
            const target = event.player;
            return !!target && target !== player && target.isAlive() && target.countCards("hej") > 0;
        },
        async content(event, trigger, player) {
            const count = Math.max(1, lib.skill.shuoye_zuosha.getBuffStack(player, "suit3"));
            for (let i = 0; i < count; i++) {
                if (!trigger.player || trigger.player === player || !trigger.player.isAlive() || trigger.player.countCards("hej") <= 0) break;
                await player.gainPlayerCard(trigger.player, "hej", true);
            }
        },
    },
//#noname-kit-end skill:shuoye_zuosha_suit3
//#noname-kit-begin skill:shuoye_zuosha_any2
    shuoye_zuosha_any2: {
        charlotte: true,
        enable: ["chooseToUse", "chooseToRespond"],
        filter(event, player) {
            if (player.countCards("h") < 2) return false;
            for (const name of lib.inpile) {
                const type = get.type2(name);
                if (type !== "basic" && type !== "trick") continue;
                if (event.filterCard({ name: name }, player, event)) return true;
            }
            return false;
        },
        chooseButton: {
            dialog(event, player) {
                const list = [];
                for (const name of lib.inpile) {
                    const type = get.type2(name);
                    if (type !== "basic" && type !== "trick") continue;
                    if (name === "sha") {
                        if (event.filterCard({ name: name }, player, event)) list.push(["基本", "", "sha"]);
                        for (const nature of lib.inpile_nature) {
                            if (event.filterCard({ name: name, nature: nature }, player, event)) list.push(["基本", "", "sha", nature]);
                        }
                    } else if (event.filterCard({ name: name }, player, event)) {
                        list.push([type === "basic" ? "基本" : "锦囊", "", name]);
                    }
                }
                return ui.create.dialog("坐杀博徒：将两张牌视为一张非装备牌使用或打出", [list, "vcard"]);
            },
            filter(button, player) {
                return true;
            },
            check(button) {
                const parent = _status.event.getParent();
                if (!parent || parent.type !== "phase") return 1;
                const name = button.link[2];
                if (["wugu", "taoyuan", "nanman", "wanjian"].includes(name)) return 0;
                return get.player().getUseValue({ name: name, nature: button.link[3] });
            },
            backup(links, player) {
                return {
                    filterCard(card) {
                        return true;
                    },
                    selectCard: 2,
                    position: "h",
                    popname: true,
                    viewAs: { name: links[0][2], nature: links[0][3] },
                    prompt: "将两张牌当做" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]) + "使用或打出",
                    check(card) {
                        return 8 - get.value(card);
                    },
                };
            },
            prompt(links, player) {
                return "将两张牌当做" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]) + "使用或打出";
            },
        },
        ai: {
            order: 1,
            respondSha: true,
            respondShan: true,
            skillTagFilter(player) {
                return player.countCards("h") >= 2;
            },
        },
    },
//#noname-kit-end skill:shuoye_zuosha_any2
//#noname-kit-begin skill:shuoye_zuosha_any3
    shuoye_zuosha_any3: {
        charlotte: true,
        enable: ["chooseToUse", "chooseToRespond"],
        filter(event, player) {
            const cards = player.getCards("h", function (card) {
                return card.storage && card.storage.shuoye_zuosha_any3;
            });
            if (!cards.length) return false;
            for (const name of lib.inpile) {
                if (event.filterCard({ name: name }, player, event)) return true;
            }
            return false;
        },
        mod: {
            cardUsable(card, player, num) {
                if (card && card.storage && card.storage.shuoye_zuosha_any3) return Infinity;
                return num;
            },
            targetInRange(card, player, target) {
                if (card && card.storage && card.storage.shuoye_zuosha_any3) return true;
            },
        },
        chooseButton: {
            dialog(event, player) {
                const list = [];
                for (const name of lib.inpile) {
                    if (!event.filterCard({ name: name }, player, event)) continue;
                    if (name === "sha") {
                        list.push(["基本", "", "sha"]);
                        for (const nature of lib.inpile_nature) {
                            if (event.filterCard({ name: name, nature: nature }, player, event)) list.push(["基本", "", "sha", nature]);
                        }
                        continue;
                    }
                    const type = get.type(name);
                    list.push([type === "basic" ? "基本" : type === "equipment" ? "装备" : "锦囊", "", name]);
                }
                return ui.create.dialog("坐杀博徒：将坐杀所得的牌视为任意牌使用或打出", [list, "vcard"]);
            },
            filter(button, player) {
                return true;
            },
            check(button) {
                const name = button.link[2];
                const parent = _status.event.getParent();
                if (!parent || parent.type !== "phase") return 1;
                return get.player().getUseValue({ name: name, nature: button.link[3] });
            },
            backup(links, player) {
                return {
                    filterCard(card) {
                        return !!(card.storage && card.storage.shuoye_zuosha_any3);
                    },
                    selectCard: 1,
                    position: "h",
                    popname: true,
                    viewAs: { name: links[0][2], nature: links[0][3], storage: { shuoye_zuosha_any3: true } },
                    prompt: "将坐杀所得的牌当做" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]) + "使用或打出",
                    check(card) {
                        return 8 - get.value(card);
                    },
                };
            },
            prompt(links, player) {
                return "将坐杀所得的牌当做" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]) + "使用或打出";
            },
        },
        ai: {
            order: 1,
            respondSha: true,
            respondShan: true,
        },
    },
//#noname-kit-end skill:shuoye_zuosha_any3
//#noname-kit-begin skill:shuoye_zuosha_fx
    shuoye_zuosha_fx: {
        nobracket: true,
        charlotte: true,
        forced: true,
        popup: false,
        silent: true,
        trigger: {
            global: ["phaseBegin", "phaseAfter", "roundStart", "loseAsyncAfter"],
            player: ["loseAfter", "useCardAfter"],
        },
        init(player) {
            try {
                if (!lib.dynamicTranslate) lib.dynamicTranslate = {};
                if (!lib.dynamicTranslate.shuoye_zuosha_fx) {
                    lib.dynamicTranslate.shuoye_zuosha_fx = (target) => lib.skill.shuoye_zuosha.currentEffectText(target);
                }
            } catch (e) {}
        },
        content(event, trigger, player) {
            lib.skill.shuoye_zuosha.syncCurrentEffect(player);
        },
    },
//#noname-kit-end skill:shuoye_zuosha_fx
//#noname-kit-begin skill:shuoye_zuosha_healdraw
    shuoye_zuosha_healdraw: {
        nopop: true,
        charlotte: true,
        silent: true,
        popup: false,
        forced: true,
        trigger: {
            global: "recoverEnd",
        },
        filter(event, player) {
            return event.num > 0;
        },
        content(event, trigger, player) {
            player.draw(Math.max(1, lib.skill.shuoye_zuosha.getBuffStack(player, "healdraw")));
        },
    },
//#noname-kit-end skill:shuoye_zuosha_healdraw
//#noname-kit-begin skill:shuoye_zuosha_nodistance
    shuoye_zuosha_nodistance: {
        nopop: true,
        charlotte: true,
        silent: true,
        popup: false,
        mod: {
            targetInRange(card, player, target) {
                return true;
            },
        },
    },
//#noname-kit-end skill:shuoye_zuosha_nodistance
//#noname-kit-begin skill:shuoye_zuosha_bufftimer
    shuoye_zuosha_bufftimer: {
        nopop: true,
        charlotte: true,
        sub: true,
        popup: false,
        silent: true,
        forced: true,
        trigger: {
            global: "phaseBegin",
        },
        filter(event, player) {
            return Array.isArray(player.storage.shuoye_zuosha_buff_groups) && player.storage.shuoye_zuosha_buff_groups.length > 0;
        },
        content(event, trigger, player) {
            const S = lib.skill.shuoye_zuosha;
            const groups = player.storage.shuoye_zuosha_buff_groups || [];
            for (const group of groups) {
                group.turns = (group.turns || 0) - 1;
            }
            const kept = groups.filter((group) => (group.turns || 0) > 0);
            if (kept.length) {
                player.storage.shuoye_zuosha_buff_groups = kept;
            } else {
                delete player.storage.shuoye_zuosha_buff_groups;
            }
            S.refreshBuffSkills(player);
            S.syncCurrentEffect(player);
            S.syncBuffState(player);
        },
    },
//#noname-kit-end skill:shuoye_zuosha_bufftimer
//#noname-kit-begin skill:shuoye_zuosha_anim
    shuoye_zuosha_anim: {
        nopop: true,
        charlotte: true,
        sub: true,
        popup: false,
        silent: true,
        effect(specs2, labels2, fail, power) {
                    if (!document.body) return;
                    if (!document.getElementById("szs-style-v4")) {
                        const style = document.createElement("style");
                        style.id = "szs-style-v4";
                        style.innerHTML = [
                            ".szs-overlay{position:fixed;left:0;top:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62);opacity:0;transition:opacity .25s linear;pointer-events:none;font-family:sans-serif;}",
                            ".szs-overlay.show{opacity:1}",
                            ".szs-machine{position:relative;width:760px;height:480px;border-radius:26px;background:linear-gradient(160deg,#3a0d1e,#1b0710 60%);border:4px solid #f5c451;box-shadow:0 0 26px rgba(245,196,81,.55),inset 0 0 30px rgba(255,120,60,.25);display:flex;flex-direction:column;align-items:center;padding:40px 20px 12px;box-sizing:border-box;transform:scale(.85);transition:transform .35s cubic-bezier(.2,1.4,.4,1),box-shadow .3s;}",
                            ".szs-machine.hit{box-shadow:0 0 46px rgba(255,215,90,.95),inset 0 0 44px rgba(255,150,60,.55);}",
                            ".szs-title{font-size:28px;letter-spacing:8px;color:#ffd97a;text-shadow:0 0 10px rgba(255,180,60,.9);font-weight:700;}",
                            ".szs-sub{font-size:14px;color:#ff9aa8;letter-spacing:3px;margin-top:2px;}",
                            ".szs-slots{display:flex;gap:30px;margin-top:20px;}",
                            ".szs-slot{position:relative;width:140px;height:200px;border-radius:12px;background:rgba(0,0,0,.35);border:2px dashed rgba(255,215,120,.35);}",
                            ".szs-card{position:absolute;left:0;top:0;width:100%;height:100%;border-radius:10px;background:linear-gradient(160deg,#fffdf5,#ffefc8);border:2px solid #caa04a;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#3a1c0c;box-shadow:0 0 14px rgba(255,210,120,.5);opacity:0;transform:translate(-320px,180px) scale(.18) rotate(-14deg);transition:transform .95s cubic-bezier(.2,.9,.25,1),opacity .55s linear;box-sizing:border-box;}",
                            ".szs-card.in{opacity:1;transform:translate(0,0) scale(1) rotate(0deg);}",
                            ".szs-enginecard{z-index:2;}",
                            ".szs-enginecard.szs-hit{filter:drop-shadow(0 0 10px rgba(255,215,90,.95)) brightness(1.12);}",
                            ".szs-suit{font-size:24px;line-height:1;}",
                            ".szs-num{font-size:30px;font-weight:800;line-height:1;}",
                            ".szs-name{font-size:13px;margin-top:6px;font-weight:700;white-space:nowrap;}",
                            ".szs-red{color:#c8231c}",
                            ".szs-effectbar{position:absolute;left:14px;right:14px;bottom:12px;min-height:22px;max-height:96px;overflow:hidden;text-align:center;font-size:14px;line-height:1.45;color:#ffe7a8;letter-spacing:1px;}",
                            ".szs-effectbar.fail{color:#ff8080;font-size:18px;font-weight:700;}",
                            ".szs-particle{position:absolute;left:50%;top:48%;border-radius:50%;pointer-events:none;animation:szsBurst .9s ease-out forwards;}",
                            "@keyframes szsBurst{0%{opacity:1;transform:translate(-50%,-50%) scale(.4)}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.1)}}",
                            ".szs-ring{position:absolute;left:50%;top:48%;width:46px;height:46px;margin-left:-23px;margin-top:-23px;border-radius:50%;border:3px solid #ffd75e;pointer-events:none;animation:szsRing 1.15s ease-out forwards;}",
                            "@keyframes szsRing{0%{opacity:.9;transform:scale(.35)}100%{opacity:0;transform:scale(6)}}",
                            ".szs-rainbow{position:absolute;left:50%;top:50%;width:800px;height:520px;margin-left:-400px;margin-top:-260px;border-radius:32px;background:conic-gradient(from 0deg,#ff5f4d,#ffd75e,#4fe08a,#5ce1e6,#6ea8ff,#b56cff,#ff6ad5,#ff5f4d);filter:blur(22px);opacity:0;transition:opacity .5s linear;animation:szsRainbowSpin 7s linear infinite;pointer-events:none;}",
                            "@keyframes szsRainbowSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}",
                            ".szs-glow{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:0;background:radial-gradient(circle at 50% 42%,var(--szs-glow-color,#ffdc82),transparent 72%);animation:szsGlowBreath 6.4s ease-in-out infinite,szsGlowColor 22s linear infinite;}",
                            "@property --szs-glow-color{syntax:'<color>';inherits:false;initial-value:#ffdc82;}",
                            "@keyframes szsGlowBreath{0%,100%{opacity:.4}50%{opacity:.78}}",
                            "@keyframes szsGlowColor{0%{--szs-glow-color:#ffdc82}25%{--szs-glow-color:#ff5f4d}50%{--szs-glow-color:#4fe08a}75%{--szs-glow-color:#b56cff}100%{--szs-glow-color:#ffdc82}}",
                        ].join("");
                        document.head.appendChild(style);
                    }
                    const zoom = game.documentZoom || 1;
                    const W = (document.documentElement.clientWidth || window.innerWidth) / zoom;
                    const H = (document.documentElement.clientHeight || window.innerHeight) / zoom;
                    const overlay = document.createElement("div");
                    overlay.className = "szs-overlay";
                    overlay.style.width = W + "px";
                    overlay.style.height = H + "px";
                    document.body.appendChild(overlay);
                    const machine = document.createElement("div");
                    machine.className = "szs-machine";
                    const scale = Math.min(1, (W - 30) / 800);
                    machine.style.transform = "scale(" + scale * 0.85 + ")";
                    machine.innerHTML = '<div class="szs-sub">PACHINKO · 抽 奖</div>';
                    const slots = document.createElement("div");
                    slots.className = "szs-slots";
                    machine.appendChild(slots);
                    const title = document.createElement("div");
                    title.className = "szs-title";
                    title.style.marginTop = "260px";
                    title.textContent = "坐 杀 博 徒";
                    machine.appendChild(title);
                    const bar = document.createElement("div");
                    bar.className = "szs-effectbar";
                    machine.appendChild(bar);
                    overlay.appendChild(machine);
                    const rainbow = document.createElement("div");
                    rainbow.className = "szs-rainbow";
                    rainbow.style.opacity = "0";
                    overlay.insertBefore(rainbow, machine);
                    const cards = [];
                    setTimeout(function () {
                        overlay.classList.add("show");
                    }, 20);
                    setTimeout(function () {
                        machine.style.transform = "scale(" + scale + ")";
                    }, 60);
                    try {
                    for (let i = 0; i < specs2.length; i++) {
                        const spec = specs2[i];
                        const slot = document.createElement("div");
                        slot.className = "szs-slot";
                        let card = null;
                        try {
                            card = ui.create.card(ui.special, "noclick", true);
                            card.init([spec.suit, spec.number, spec.name]);
                        } catch (e) {
                            card = null;
                        }
                        if (!card) {
                            card = document.createElement("div");
                            card.className = "szs-card";
                            const suitText = { spade: "♠", heart: "♥", club: "♣", diamond: "♦" }[spec.suit] || spec.suit;
                            card.innerHTML = '<div class="szs-suit">' + suitText + '</div><div class="szs-num">' + (get.strNumber(spec.number) || spec.number) + '</div><div class="szs-name">' + get.translation(spec.name) + "</div>";
                        }
                        card.classList.add("szs-enginecard");
                        card.style.margin = "0";
                        card.style.position = "absolute";
                        card.style.left = "50%";
                        card.style.top = "50%";
                        card.style.transformOrigin = "center center";
                        card.style.opacity = "0";
                        card.style.transition = "transform .95s cubic-bezier(.2,.9,.25,1), opacity .55s linear, filter .3s linear";
                        slot.appendChild(card);
                        slots.appendChild(slot);
                        cards.push(card);
                    }
                    } catch (e) {}
                    setTimeout(function () {
                        for (let i = 0; i < cards.length; i++) {
                            (function (card, index) {
                                const naturalW = card.offsetWidth || 108;
                                const naturalH = card.offsetHeight || 150;
                                const fit = Math.min(135 / naturalW, 195 / naturalH);
                                card.style.transition = "none";
                                card.style.transform = "translate(-50%,-50%) translate(-420px,240px) scale(" + fit * 0.18 + ") rotate(-14deg)";
                                void card.offsetWidth;
                                card.style.transition = "transform .95s cubic-bezier(.2,.9,.25,1), opacity .55s linear, filter .3s linear";
                                setTimeout(function () {
                                    card.style.transform = "translate(-50%,-50%) scale(" + fit + ")";
                                    card.style.opacity = "1";
                                }, 420 + index * 980);
                            })(cards[i], i);
                        }
                    }, 80);
                    const palette = ["#ffd75e", "#fff3b0", "#ffb347", "#ff7a4d", "#ff5f4d", "#ff6ad5", "#b56cff", "#6ea8ff", "#5ce1e6", "#4fe08a", "#ffffff"];
                    const spawnBurst = function (count, baseDistance, sizeScale) {
                        for (let i = 0; i < count; i++) {
                            const particle = document.createElement("div");
                            particle.className = "szs-particle";
                            const color = palette[Math.floor(Math.random() * palette.length)];
                            const size = (5 + Math.random() * 10) * sizeScale;
                            const angle = Math.random() * Math.PI * 2;
                            const distance = baseDistance + Math.random() * baseDistance;
                            particle.style.width = size + "px";
                            particle.style.height = size + "px";
                            particle.style.background = "radial-gradient(circle at 30% 30%, #ffffff, " + color + " 55%, transparent 100%)";
                            particle.style.boxShadow = "0 0 7px " + color;
                            if (Math.random() < 0.35) particle.style.borderRadius = "2px";
                            particle.style.setProperty("--dx", Math.cos(angle) * distance + "px");
                            particle.style.setProperty("--dy", Math.sin(angle) * distance + "px");
                            particle.style.animationDuration = (0.72 + Math.random() * 0.6).toFixed(2) + "s";
                            particle.style.animationDelay = (Math.random() * 0.18).toFixed(2) + "s";
                            machine.appendChild(particle);
                            (function (node) {
                                setTimeout(function () {
                                    if (node.parentNode) node.parentNode.removeChild(node);
                                }, 1900);
                            })(particle);
                        }
                    };
                    const spawnRings = function (count) {
                        for (let i = 0; i < count; i++) {
                            const ring = document.createElement("div");
                            ring.className = "szs-ring";
                            ring.style.borderColor = palette[Math.floor(Math.random() * palette.length)];
                            ring.style.animationDelay = (i * 0.12).toFixed(2) + "s";
                            machine.appendChild(ring);
                            (function (node) {
                                setTimeout(function () {
                                    if (node.parentNode) node.parentNode.removeChild(node);
                                }, 2300);
                            })(ring);
                        }
                    };
                    const playEffects = function () {
                        if (power <= 0) return;
                        const base = 16 + power * 18;
                        spawnBurst(base, 150, 1);
                        spawnRings(Math.max(2, power));
                        setTimeout(function () {
                            spawnBurst(Math.round(base * 0.85), 210, 1.15);
                        }, 420);
                        setTimeout(function () {
                            spawnBurst(Math.round(base * 0.65), 260, 0.9);
                            spawnRings(power + 1);
                        }, 860);
                        if (power >= 2) {
                            setTimeout(function () {
                                spawnBurst(Math.round(base * 0.55), 300, 1.25);
                            }, 1280);
                        }
                    };
                    setTimeout(function () {
                        if (fail) {
                            bar.classList.add("fail");
                        } else {
                            machine.classList.add("hit");
                            for (let i = 0; i < cards.length; i++) {
                                cards[i].classList.add("szs-hit");
                            }
                            try {
                                rainbow.style.opacity = "0.38";
                            } catch (e) {}
                            playEffects();
                        }
                        bar.textContent = labels2.join("　");
                    }, 3800);
                    setTimeout(function () {
                        overlay.classList.remove("show");
                    }, 7000);
                    setTimeout(function () {
                        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    }, 7450);
        },
    },
//#noname-kit-end skill:shuoye_zuosha_anim
//#noname-kit-begin skill:shuoye_zuosha_debug
    shuoye_zuosha_debug: {
        enable: ["phaseUse"],
        usable: 1,
        popup: false,
        silent: true,
        filter(event, player) {
            return player.hasSkill("shuoye_zuosha") && !!game.getExtensionConfig("朔夜", "zuosha_debug");
        },
        async content(event, trigger, player) {
            const S = lib.skill.shuoye_zuosha;
            const pool = S.pool();
            const suits = ["spade", "heart", "club", "diamond"];
            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
            const cards = pool.map((name) => [get.type2(name) === "basic" ? "基本" : "锦囊", "", name]);
            const specs = [];
            for (let i = 0; i < 3; i++) {
                const dialog = ui.create.dialog("坐杀博徒调试：第" + get.cnNumber(i + 1) + "张牌（花色/点数/牌名各选一个）");
                dialog.add([suits.map((suit) => [suit, get.translation(suit)]), "tdnodes"]);
                dialog.add([numbers, "tdnodes"]);
                dialog.add([cards, "vcard"]);
                const result = await player.chooseButton(dialog, 3).set("filterButton", function (button) {
                    const link = button.link;
                    if (typeof link === "string" && suits.includes(link) && ui.selected.buttons.some((btn) => typeof btn.link === "string" && suits.includes(btn.link))) return false;
                    if (typeof link === "number" && ui.selected.buttons.some((btn) => typeof btn.link === "number")) return false;
                    if (Array.isArray(link) && ui.selected.buttons.some((btn) => Array.isArray(btn.link))) return false;
                    return true;
                }).forResult();
                if (!result || !result.bool) return;
                const suit = result.links.find((link) => typeof link === "string" && suits.includes(link));
                const number = result.links.find((link) => typeof link === "number");
                const card = result.links.find((link) => Array.isArray(link));
                if (!suit || !number || !card) return;
                specs.push({ name: card[2], suit: suit, number: number });
            }
            player.storage.shuoye_zuosha_debug_specs = specs;
            game.log(player, "坐杀博徒调试", "：已指定下次抽奖的三张牌");
        },
        ai: {
            order: 0,
            result: { player: 0 },
        },
    },
//#noname-kit-end skill:shuoye_zuosha_debug
//#noname-kit-begin skill:shuoye_juzhou_duel_fx
    shuoye_juzhou_duel_fx: {
        nopop: true,
        charlotte: true,
        sub: true,
        popup: false,
        silent: true,
        // 【具咒】决斗「对波」特效：乙骨侧品红紫、对手侧青蓝；
        // 光柱为多层流光 + 沿柱逸散粒子，中点由密集火花/电弧组成，不使用大光球。
        // 纯画面表现，不参与结算；由 doDuel 调用 start/clash/finish 驱动。
        start(player, target) {
            let sceneRef = null;
            try {
                if (typeof document === "undefined" || !document.body) return null;
                const stageEl = document.body;
                let bodyRect = { left: 0, top: 0 };
                let bodyScale = 1;
                let viewW = 0;
                let viewH = 0;
                const measureBody = () => {
                    const br = stageEl.getBoundingClientRect();
                    const ow = stageEl.offsetWidth || document.documentElement.clientWidth || window.innerWidth;
                    const oh = stageEl.offsetHeight || document.documentElement.clientHeight || window.innerHeight;
                    bodyRect = br;
                    bodyScale = ow > 0 && br.width > 0 ? br.width / ow : 1;
                    if (!(bodyScale > 0.01)) bodyScale = 1;
                    viewW = ow;
                    viewH = oh;
                };
                measureBody();
                const pointOf = (rect) => ({
                    x: (rect.left + rect.width / 2 - bodyRect.left) / bodyScale,
                    y: (rect.top + rect.height / 2 - bodyRect.top) / bodyScale,
                });
                let rectA = null;
                let rectB = null;
                let centerA = { x: 0, y: 0 };
                let centerB = { x: 0, y: 0 };
                let a = { x: 0, y: 0 };
                let b = { x: 0, y: 0 };
                let distance = 0;
                let angle = 0;
                let midX = 0;
                let midY = 0;
                // 定位参考两面宿傩(伏黑惠)特效：直接量整张武将牌 player，而不是皮肤里的 avatar 节点。
                const measureCenters = () => {
                    if (!player || !target) return false;
                    let rA;
                    let rB;
                    try {
                        rA = player.getBoundingClientRect();
                        rB = target.getBoundingClientRect();
                    } catch (e) {
                        return false;
                    }
                    if (!rA || !rB) return false;
                    if ((!rA.width && !rA.height) || (!rB.width && !rB.height)) return false;
                    rectA = rA;
                    rectB = rB;
                    centerA = pointOf(rA);
                    centerB = pointOf(rB);
                    return true;
                };
                if (!measureCenters()) return null;
                const localH = Math.min(rectA.height || 120, rectB.height || 120) / bodyScale;
                const beamH = Math.max(54, Math.min(116, localH * 0.8));
                const orbSize = Math.max(70, Math.min(126, localH * 0.76));
                // 蓄能球放在武将牌朝向对手的那个边缘：从牌中心向对手方向做射线，取与牌框的交点，再向内收一点
                const edgePoint = (rect, center, toward, inset) => {
                    const dx = toward.x - center.x;
                    const dy = toward.y - center.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    if (!(len > 0.001)) return { x: center.x, y: center.y };
                    const ux = dx / len;
                    const uy = dy / len;
                    const hw = (rect.width || 0) / (2 * bodyScale);
                    const hh = (rect.height || 0) / (2 * bodyScale);
                    const tx = Math.abs(ux) < 1e-6 ? Infinity : hw / Math.abs(ux);
                    const ty = Math.abs(uy) < 1e-6 ? Infinity : hh / Math.abs(uy);
                    const t = Math.max(0, Math.min(tx, ty) - inset);
                    return { x: center.x + ux * t, y: center.y + uy * t };
                };
                const updateAnchors = () => {
                    a = edgePoint(rectA, centerA, centerB, orbSize * 0.18);
                    b = edgePoint(rectB, centerB, centerA, orbSize * 0.18);
                    const ddx = b.x - a.x;
                    const ddy = b.y - a.y;
                    distance = Math.sqrt(ddx * ddx + ddy * ddy);
                    if (!(distance > 8)) return false;
                    angle = (Math.atan2(ddy, ddx) * 180) / Math.PI;
                    midX = (a.x + b.x) / 2;
                    midY = (a.y + b.y) / 2;
                    return true;
                };
                if (!updateAnchors()) return null;

                // 参考视频配色：品红紫 vs 青蓝，碰撞火花白/暖黄
                const PURPLE = "#c44bff";
                const PURPLE_RGB = "196,75,255";
                const PURPLE_HI = "#ff6ad5";
                const BLUE = "#35c8ff";
                const BLUE_RGB = "53,200,255";
                const BLUE_HI = "#5ff5ff";
                const WARM = "#ffe28a";
                const GOLD = "#ffcf4a";
                const TEAL = "#5ff5c8";
                const LIME = "#d8ff6a";
                const perfLow = (() => {
                    try {
                        if (typeof lib !== "undefined" && lib && lib.config && (lib.config.low_performance || lib.config.animation === false)) return true;
                        if (game && typeof game.deviceZoom === "number" && game.deviceZoom < 0.9) return true;
                    } catch (e) {}
                    return false;
                })();
                const boltCount = perfLow ? 14 : 24;
                const boltLong = perfLow ? 4 : 8;
                const MIX = "#d9a0ff";

                ["szs-jz-duel-fx-style", "szs-jz-duel-fx-style2"].forEach((oldId) => {
                    try {
                        const old = document.getElementById(oldId);
                        if (old) old.remove();
                    } catch (e) {}
                });
                const styleId = "szs-jz-duel-fx-style2";
                {
                    const style = document.createElement("style");
                    style.id = styleId;
                    style.textContent = `
.szs-jz-scene{position:fixed;left:0;top:0;overflow:hidden;pointer-events:none;z-index:3;opacity:1;transition:opacity .45s linear;}
.szs-jz-scene.fade{opacity:0;}
.szs-jz-orb{position:absolute;width:0;height:0;pointer-events:none;}
.szs-jz-core{position:absolute;border-radius:50%;opacity:0;transform:scale(.12);transition:opacity .16s linear,transform .34s cubic-bezier(.2,.9,.2,1.3),filter .3s linear;background:radial-gradient(circle,#fff 0%,#fff 12%,var(--szs-color) 44%,rgba(255,255,255,0) 72%);box-shadow:0 0 16px #fff,0 0 38px var(--szs-color),0 0 66px var(--szs-color);}
.szs-jz-orb.on .szs-jz-core{opacity:1;transform:scale(1);}
.szs-jz-orb.fire .szs-jz-core{opacity:.92;transform:scale(.58);}
.szs-jz-orb.win .szs-jz-core{opacity:1;transform:scale(1.4);filter:brightness(1.35);}
.szs-jz-orb.lose .szs-jz-core{opacity:0;transform:scale(.08);transition:opacity .45s linear,transform .45s ease-in;}
.szs-jz-orb.dim .szs-jz-core{opacity:.2;transform:scale(.45);}
.szs-jz-aura{position:absolute;border-radius:50%;opacity:0;transform:scale(.35);filter:blur(10px);background:radial-gradient(circle,var(--szs-color) 0%,rgba(255,255,255,.18) 35%,rgba(255,255,255,0) 70%);transition:opacity .25s linear,transform .45s ease-out;}
.szs-jz-orb.on .szs-jz-aura{opacity:.9;transform:scale(1);animation:szsJzAura 1.2s ease-in-out infinite;}
@keyframes szsJzAura{0%,100%{transform:scale(.92);opacity:.7}50%{transform:scale(1.12);opacity:1}}
.szs-jz-orb.fire .szs-jz-aura{opacity:.55;}
.szs-jz-orb.win .szs-jz-aura{opacity:1;transform:scale(1.35);}
.szs-jz-orb.lose .szs-jz-aura{opacity:0;transform:scale(.2);}
.szs-jz-orbit{position:absolute;left:0;top:0;width:0;height:0;opacity:0;transition:opacity .2s;}
.szs-jz-orb.on .szs-jz-orbit{opacity:1;}
.szs-jz-orbit>div{position:absolute;left:-2.5px;top:-2.5px;width:5px;height:5px;border-radius:50%;background:var(--szs-color);box-shadow:0 0 6px #fff,0 0 12px var(--szs-color);animation:szsJzOrbit 1.7s linear infinite;}
@keyframes szsJzOrbit{from{transform:rotate(0deg) translateX(var(--r))}to{transform:rotate(360deg) translateX(var(--r))}}
.szs-jz-beamgroup{position:absolute;width:0;height:0;transition:width .3s cubic-bezier(.2,.9,.3,1),opacity .35s linear;}
.szs-jz-beamgroup.lose{opacity:0;}
.szs-jz-beamgroup.win .szs-jz-glow{opacity:.85;}
.szs-jz-beamgroup.win .szs-jz-flow{filter:blur(.6px) brightness(1.25);}
.szs-jz-beambox{position:absolute;width:0;height:0;transform-origin:0 0;pointer-events:none;}
.szs-jz-shake{position:absolute;left:0;top:0;width:0;height:0;}
.szs-jz-glow{position:absolute;left:0;width:100%;background:linear-gradient(to bottom,rgba(var(--rgb),0),rgba(var(--rgb),.55) 28%,rgba(var(--rgb),.55) 72%,rgba(var(--rgb),0));filter:blur(14px);opacity:.55;mix-blend-mode:screen;animation:szsJzSway 1.2s ease-in-out infinite alternate;}
.szs-jz-flow{position:absolute;left:0;width:100%;background-image:repeating-linear-gradient(103deg,rgba(255,255,255,0) 0px,rgba(255,255,255,.16) 1px,rgba(255,255,255,0) 4px,rgba(255,255,255,0) 15px),repeating-linear-gradient(77deg,rgba(255,255,255,0) 0px,rgba(255,255,255,.09) 1px,rgba(255,255,255,0) 3px,rgba(255,255,255,0) 23px),linear-gradient(to bottom,rgba(var(--rgb),0),rgba(var(--rgb),.75) 24%,rgba(var(--rgb),.95) 50%,rgba(var(--rgb),.75) 76%,rgba(var(--rgb),0));background-size:21px 100%,31px 100%,100% 100%;filter:blur(1.2px);opacity:.95;mix-blend-mode:screen;animation:szsJzFlow .34s linear infinite,szsJzFlow2 .51s linear infinite reverse,szsJzSway 1s ease-in-out infinite alternate,szsJzWave .7s ease-in-out infinite alternate;}
.szs-jz-coreline{position:absolute;left:0;width:100%;background:linear-gradient(to bottom,rgba(255,255,255,0),#fff 35%,#fff 65%,rgba(255,255,255,0));filter:blur(.4px);opacity:.95;mix-blend-mode:screen;mask-image:repeating-linear-gradient(90deg,#000 0 14px,rgba(0,0,0,.35) 14px 18px,#000 18px 33px);-webkit-mask-image:repeating-linear-gradient(90deg,#000 0 14px,rgba(0,0,0,.35) 14px 18px,#000 18px 33px);animation:szsJzFlicker .11s steps(2,end) infinite;}
.szs-jz-travel{position:absolute;left:0;top:-1.5px;width:100%;height:3px;background:linear-gradient(90deg,rgba(255,255,255,0),#fff,rgba(255,255,255,0));background-size:22% 100%;background-repeat:no-repeat;filter:blur(.4px);opacity:.9;mix-blend-mode:screen;animation:szsJzTravel .7s linear infinite;}
.szs-jz-beamgroup.rev .szs-jz-travel{animation-direction:reverse;}
@keyframes szsJzFlow{from{background-position:0 0,0 0,0 0}to{background-position:21px 0,0 0,0 0}}
@keyframes szsJzFlow2{from{background-position:0 0,0 0,0 0}to{background-position:0 0,31px 0,0 0}}
@keyframes szsJzWave{0%{clip-path:polygon(0% 12%,7% 0%,14% 9%,21% 2%,28% 11%,35% 1%,42% 10%,49% 3%,56% 12%,63% 0%,70% 9%,77% 2%,84% 11%,91% 1%,98% 8%,100% 4%,100% 94%,98% 88%,91% 99%,84% 90%,77% 98%,70% 89%,63% 100%,56% 91%,49% 97%,42% 88%,35% 99%,28% 90%,21% 98%,14% 89%,7% 100%,0% 92%)}100%{clip-path:polygon(0% 3%,7% 10%,14% 1%,21% 8%,28% 0%,35% 11%,42% 2%,49% 9%,56% 1%,63% 10%,70% 2%,77% 9%,84% 0%,91% 8%,98% 1%,100% 7%,100% 90%,98% 99%,91% 91%,84% 100%,77% 92%,70% 99%,63% 90%,56% 98%,49% 91%,42% 100%,35% 92%,28% 99%,21% 91%,14% 100%,7% 92%,0% 98%)}}
@keyframes szsJzSway{from{transform:translateY(-2px) scaleY(.94)}to{transform:translateY(2px) scaleY(1.06)}}
@keyframes szsJzFlicker{0%{opacity:.76;transform:scaleY(.82)}100%{opacity:1;transform:scaleY(1.08)}}
@keyframes szsJzTravel{from{background-position:-35% 0}to{background-position:135% 0}}
.szs-jz-leak{position:absolute;border-radius:50%;pointer-events:none;opacity:1;background:#fff;box-shadow:0 0 6px var(--szs-color),0 0 12px var(--szs-color);animation:szsJzLeak .7s ease-out forwards;}
@keyframes szsJzLeak{0%{opacity:.95;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.15)}}
.szs-jz-clash{position:absolute;width:0;height:0;pointer-events:none;opacity:0;transition:opacity .12s linear;}
.szs-jz-clash.on{opacity:1;}
.szs-jz-clash.shake{animation:szsJzClashShake .18s linear;}
@keyframes szsJzClashShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-1px)}60%{transform:translate(-1px,-2px)}80%{transform:translate(1px,2px)}}
.szs-jz-hotwrap{position:absolute;left:0;top:0;width:0;height:0;}
.szs-jz-hot{position:absolute;left:-8px;top:-8px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 0 12px #fff,0 0 26px var(--szs-mix),0 0 46px var(--szs-mix),0 0 64px #ffcf4a,0 0 86px #35c8ff;opacity:0;transition:opacity .15s;animation:szsJzHot .08s steps(2,end) infinite;}
.szs-jz-clash.on .szs-jz-hot{opacity:1;}
@keyframes szsJzHot{0%{transform:scale(.8);filter:brightness(1)}100%{transform:scale(1.2);filter:brightness(1.6)}}
.szs-jz-bolt{position:absolute;left:0;top:0;height:2px;transform-origin:0 50%;border-radius:2px;pointer-events:none;background:linear-gradient(90deg,rgba(255,255,255,0),#fff 30%,var(--szs-color) 85%,rgba(255,255,255,0));box-shadow:0 0 6px var(--szs-color);opacity:1;animation:szsJzBolt .13s steps(2,end) infinite;}
@keyframes szsJzBolt{0%{opacity:.55;filter:brightness(1.15)}100%{opacity:1;filter:brightness(1.6)}}
.szs-jz-seamglow{position:absolute;border-radius:10px;pointer-events:none;background:linear-gradient(to bottom,rgba(255,255,255,0),rgba(255,255,255,.9) 30%,rgba(255,255,255,.9) 70%,rgba(255,255,255,0));filter:blur(8px);opacity:.6;animation:szsJzSeamGlow .1s steps(2,end) infinite;}
@keyframes szsJzSeamGlow{0%{opacity:.35;transform:scaleX(.7)}100%{opacity:.8;transform:scaleX(1.15)}}
.szs-jz-seam{position:absolute;width:2px;border-radius:2px;transform-origin:50% 50%;background:linear-gradient(to bottom,rgba(255,255,255,0),#fff 25%,var(--szs-color) 55%,#fff 80%,rgba(255,255,255,0));box-shadow:0 0 8px var(--szs-color),0 0 18px var(--szs-color);opacity:.9;animation:szsJzSeam .09s steps(2,end) infinite;}
@keyframes szsJzSeam{0%{opacity:.35;transform:scaleY(.85)}100%{opacity:1;transform:scaleY(1.08)}}
.szs-jz-spark{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;animation:szsJzSparkMove .5s ease-out forwards;}
@keyframes szsJzSparkMove{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}
.szs-jz-spark-dot{position:absolute;left:-3px;top:-3px;width:6px;height:6px;border-radius:50%;background:#fff;box-shadow:0 0 6px var(--szs-color),0 0 12px var(--szs-color);}
.szs-jz-spark-line{position:absolute;left:0;top:-1px;height:2px;transform-origin:0 50%;background:linear-gradient(90deg,#fff,var(--szs-color) 70%,rgba(255,255,255,0));box-shadow:0 0 5px var(--szs-color);}
.szs-jz-spark-line.szs-jz-rainbow{background:linear-gradient(90deg,#ff5f6d,#ffb347,#ffe66d,#6bff8f,#5fd8ff,#b06bff,#ff6ad5);box-shadow:0 0 8px rgba(255,255,255,.9),0 0 16px rgba(255,209,102,.6);}
.szs-jz-orb{transition:none;}
.szs-jz-scale{position:absolute;left:0;top:0;width:0;height:0;opacity:0;transform:scale(.12);transition:opacity .16s linear,transform .34s cubic-bezier(.2,.9,.2,1.3);}
.szs-jz-orb.on .szs-jz-scale{opacity:1;transform:scale(1);}
.szs-jz-orb.fire .szs-jz-scale{opacity:1;transform:scale(.62);}
.szs-jz-orb.win .szs-jz-scale{opacity:1;transform:scale(1.35);}
.szs-jz-orb.lose .szs-jz-scale{opacity:0;transform:scale(.1);transition:opacity .4s linear,transform .4s ease-in;}
.szs-jz-orb.dim .szs-jz-scale{opacity:.55;transform:scale(.6);}
.szs-jz-rim{position:absolute;background:var(--szs-rim);clip-path:var(--szs-clip);filter:drop-shadow(0 0 4px var(--szs-color));}
.szs-jz-mass{position:absolute;clip-path:var(--szs-clip);background:radial-gradient(circle at 50% 45%,#fff 0%,#fff 10%,var(--szs-color) 28%,var(--szs-dark) 65%,var(--szs-dark2) 100%);}
.szs-jz-hotspot{position:absolute;border-radius:50%;background:radial-gradient(circle,#fff 0%,#fff 34%,rgba(255,255,255,0) 70%);filter:blur(3px);mix-blend-mode:screen;}
.szs-jz-corona{position:absolute;border-radius:50%;border:3px solid var(--szs-rim);box-shadow:0 0 10px var(--szs-color),inset 0 0 10px var(--szs-color);opacity:.9;}
.szs-jz-mote{position:absolute;border-radius:50%;pointer-events:none;background:var(--szs-color);box-shadow:0 0 6px #fff,0 0 12px var(--szs-color);animation:szsJzMote .8s ease-out forwards;}
@keyframes szsJzMote{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.2)}}
.szs-jz-beambox{transition:none;}
.szs-jz-zig{position:absolute;left:0;top:0;height:14px;transform-origin:0 50%;pointer-events:none;background:linear-gradient(to bottom,rgba(255,255,255,0),#fff 45%,rgba(255,255,255,0));filter:drop-shadow(0 0 4px var(--szs-color));clip-path:polygon(0% 45%,12% 10%,24% 70%,36% 20%,48% 80%,60% 15%,72% 65%,84% 20%,96% 60%,100% 45%,96% 70%,84% 30%,72% 75%,60% 25%,48% 90%,36% 30%,24% 80%,12% 20%,0% 55%);animation:szsJzBolt .1s steps(2,end) infinite;}
.szs-jz-spark-shard{position:absolute;left:-4px;top:-4px;width:8px;height:8px;background:var(--szs-color);clip-path:polygon(0 0,100% 35%,25% 100%);box-shadow:0 0 6px var(--szs-color);}
.szs-jz-boom{position:absolute;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff 0%,#fff 16%,var(--szs-color) 45%,rgba(255,255,255,0) 72%);box-shadow:0 0 22px #fff,0 0 50px var(--szs-color),0 0 80px #ffcf4a;opacity:0;transform:translate(-50%,-50%) scale(.25);animation:szsJzBoom .42s ease-out forwards;}
@keyframes szsJzBoom{0%{opacity:1;transform:translate(-50%,-50%) scale(.25)}60%{opacity:.95;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.8)}}
.szs-jz-boomring{position:absolute;border-radius:50%;border:3px solid var(--szs-color);pointer-events:none;box-shadow:0 0 10px #fff,0 0 22px var(--szs-color);opacity:0;transform:translate(-50%,-50%) scale(.2);animation:szsJzBoomRing .5s ease-out forwards;}
@keyframes szsJzBoomRing{0%{opacity:.95;transform:translate(-50%,-50%) scale(.2)}100%{opacity:0;transform:translate(-50%,-50%) scale(2.6)}}
.szs-jz-shake-scene{animation:szsJzSceneShake .3s linear;}
@keyframes szsJzSceneShake{0%,100%{transform:translate(0,0)}15%{transform:translate(-4px,3px)}30%{transform:translate(4px,-3px)}45%{transform:translate(-3px,-2px)}60%{transform:translate(3px,2px)}75%{transform:translate(-2px,2px)}90%{transform:translate(2px,-2px)}}
                    `;
                    document.head.appendChild(style);
                }

                const scene = document.createElement("div");
                scene.className = "szs-jz-scene";
                scene.style.width = viewW + "px";
                scene.style.height = viewH + "px";
                scene.style.zIndex = "2147483000";
                stageEl.appendChild(scene);
                const beamScene = document.createElement("div");
                beamScene.className = "szs-jz-scene";
                beamScene.style.width = viewW + "px";
                beamScene.style.height = viewH + "px";
                beamScene.style.zIndex = "2147482999";
                stageEl.appendChild(beamScene);
                sceneRef = [scene, beamScene];

                let disposed = false;
                let cleaned = false;
                let resolveReady = null;
                let resolveFinish = null;
                let resolveReached = null;
                const reached = new Promise((resolve) => {
                    resolveReached = resolve;
                });
                let clashTimer = null;
                let leakTimer = null;
                let moteTimer = null;
                let boilTimer = null;
                let followTimer = null;
                let phase = "charge";
                let pushWinA = false;
                const timers = [];
                const later = (fn, ms) => {
                    const id = setTimeout(() => {
                        try { fn(); } catch (e) {}
                    }, ms);
                    timers.push(id);
                    return id;
                };
                const clearLoops = () => {
                    if (clashTimer) {
                        clearInterval(clashTimer);
                        clashTimer = null;
                    }
                    if (leakTimer) {
                        clearInterval(leakTimer);
                        leakTimer = null;
                    }
                };
                const cleanup = () => {
                    if (cleaned) return;
                    cleaned = true;
                    disposed = true;
                    if (resolveReady) {
                        const done = resolveReady;
                        resolveReady = null;
                        try { done(); } catch (e) {}
                    }
                    if (resolveFinish) {
                        const done = resolveFinish;
                        resolveFinish = null;
                        try { done(); } catch (e) {}
                    }
                    if (resolveReached) {
                        const done = resolveReached;
                        resolveReached = null;
                        try { done(); } catch (e) {}
                    }
                    clearLoops();
                    if (moteTimer) {
                        clearInterval(moteTimer);
                        moteTimer = null;
                    }
                    if (boilTimer) {
                        clearInterval(boilTimer);
                        boilTimer = null;
                    }
                    if (followTimer) {
                        clearInterval(followTimer);
                        followTimer = null;
                    }
                    timers.forEach((id) => clearTimeout(id));
                    timers.length = 0;
                    [scene, beamScene].forEach((node) => {
                        try { if (node.parentNode) node.parentNode.removeChild(node); } catch (e) {}
                    });
                };

                const jaggedClip = (n) => {
                    const pts = [];
                    for (let i = 0; i < n; i++) {
                        const ang = (i / n) * Math.PI * 2;
                        const r = 42 + Math.random() * 8;
                        pts.push((50 + Math.cos(ang) * r).toFixed(1) + "% " + (50 + Math.sin(ang) * r).toFixed(1) + "%");
                    }
                    return "polygon(" + pts.join(",") + ")";
                };
                const makeOrb = (pt, color, dark, dark2, rim, isBlue) => {
                    const orb = document.createElement("div");
                    orb.className = "szs-jz-orb" + (isBlue ? " blue" : "");
                    orb.style.left = pt.x + "px";
                    orb.style.top = pt.y + "px";
                    orb.style.setProperty("--szs-color", color);
                    orb.style.setProperty("--szs-dark", dark);
                    orb.style.setProperty("--szs-dark2", dark2);
                    orb.style.setProperty("--szs-rim", rim);
                    orb.style.setProperty("--szs-clip", jaggedClip(30));
                    const scale = document.createElement("div");
                    scale.className = "szs-jz-scale";
                    const rimSize = orbSize * 1.06;
                    const rimEl = document.createElement("div");
                    rimEl.className = "szs-jz-rim";
                    rimEl.style.width = rimSize + "px";
                    rimEl.style.height = rimSize + "px";
                    rimEl.style.left = -rimSize / 2 + "px";
                    rimEl.style.top = -rimSize / 2 + "px";
                    const mass = document.createElement("div");
                    mass.className = "szs-jz-mass";
                    mass.style.width = orbSize + "px";
                    mass.style.height = orbSize + "px";
                    mass.style.left = -orbSize / 2 + "px";
                    mass.style.top = -orbSize / 2 + "px";
                    const hotspotSize = orbSize * 0.62;
                    const hotspot = document.createElement("div");
                    hotspot.className = "szs-jz-hotspot";
                    hotspot.style.width = hotspotSize + "px";
                    hotspot.style.height = hotspotSize + "px";
                    hotspot.style.left = -hotspotSize / 2 + "px";
                    hotspot.style.top = -hotspotSize / 2 + "px";
                    scale.appendChild(rimEl);
                    scale.appendChild(mass);
                    scale.appendChild(hotspot);
                    if (isBlue) {
                        const coronaSize = orbSize * 1.32;
                        const corona = document.createElement("div");
                        corona.className = "szs-jz-corona";
                        corona.style.width = coronaSize + "px";
                        corona.style.height = coronaSize + "px";
                        corona.style.left = -coronaSize / 2 + "px";
                        corona.style.top = -coronaSize / 2 + "px";
                        scale.appendChild(corona);
                    }
                    orb.appendChild(scale);
                    scene.appendChild(orb);
                    return orb;
                };
                const orbA = makeOrb(a, "#d94bff", "#b21fe0", "#8a12b8", "#ffd6ff", false);
                const orbB = makeOrb(b, "#4fdcff", "#2fb7e6", "#1687b5", "#ffffff", true);

                const spawnMotes = (pt, color, count) => {
                    for (let i = 0; i < count; i++) {
                        const ang = Math.random() * Math.PI * 2;
                        const r0 = orbSize * (0.68 + Math.random() * 0.15);
                        const mote = document.createElement("div");
                        mote.className = "szs-jz-mote";
                        const size = 3 + Math.random() * 4;
                        mote.style.width = size + "px";
                        mote.style.height = size + "px";
                        mote.style.left = pt.x + Math.cos(ang) * r0 + "px";
                        mote.style.top = pt.y + Math.sin(ang) * r0 + "px";
                        mote.style.setProperty("--szs-color", color);
                        const dist = 24 + Math.random() * 50;
                        mote.style.setProperty("--dx", Math.cos(ang) * dist + "px");
                        mote.style.setProperty("--dy", (Math.sin(ang) * dist - 8) + "px");
                        scene.appendChild(mote);
                        setTimeout(() => {
                            try { mote.remove(); } catch (e) {}
                        }, 900);
                    }
                };
                const startMotes = () => {
                    moteTimer = setInterval(() => {
                        if (disposed) return;
                        try {
                            spawnMotes(a, "#d94bff", phase === "clash" ? 2 : 1);
                            spawnMotes(b, "#4fdcff", 3);
                        } catch (e) {}
                    }, perfLow ? 240 : 150);
                };
                const startBoil = () => {
                    boilTimer = setInterval(() => {
                        if (disposed) return;
                        try {
                            orbA.style.setProperty("--szs-clip", jaggedClip(30));
                            orbB.style.setProperty("--szs-clip", jaggedClip(30));
                        } catch (e) {}
                    }, perfLow ? 200 : 120);
                };

                // 中点火花/电弧场（不使用大光球）
                const clashField = document.createElement("div");
                clashField.className = "szs-jz-clash";
                clashField.style.left = midX + "px";
                clashField.style.top = midY + "px";
                clashField.style.setProperty("--szs-mix", MIX);
                scene.appendChild(clashField);
                const hotWrap = document.createElement("div");
                hotWrap.className = "szs-jz-hotwrap";
                const hot = document.createElement("div");
                hot.className = "szs-jz-hot";
                hotWrap.appendChild(hot);
                clashField.appendChild(hotWrap);

                const boltPalette = [PURPLE, BLUE, "#ffffff", WARM, GOLD, TEAL, "#ff5f6d", "#ffe66d", "#6bff8f", "#5fd8ff", "#b06bff", PURPLE_HI, BLUE_HI];
                const sparkPalette = ["#ffffff", WARM, GOLD, GOLD, TEAL, LIME, PURPLE, BLUE, "#ff5f6d", "#ffb347", "#ffe66d", "#6bff8f", "#5fd8ff", "#b06bff", "#ff6ad5"];
                const boltPool = [];
                const randomColor = (arr) => arr[Math.floor(Math.random() * arr.length)];
                const randomizeBolt = (bolt) => {
                    const long = !!bolt._long;
                    const len = long ? 70 + Math.random() * 95 : 18 + Math.random() * 52;
                    const deg = Math.random() * 360;
                    bolt.style.width = len + "px";
                    bolt.style.transform = "translate(0,-50%) rotate(" + deg + "deg)";
                    bolt.style.setProperty("--szs-color", randomColor(boltPalette));
                    bolt.style.animationDuration = 0.08 + Math.random() * 0.1 + "s";
                };
                for (let i = 0; i < boltCount; i++) {
                    const bolt = document.createElement("div");
                    const zig = i < (perfLow ? 3 : 6);
                    bolt.className = zig ? "szs-jz-zig" : "szs-jz-bolt";
                    bolt._long = i < boltLong;
                    randomizeBolt(bolt);
                    clashField.appendChild(bolt);
                    boltPool.push(bolt);
                }
                const clashAt = (x, y) => {
                    const node = document.createElement("div");
                    node.style.position = "absolute";
                    node.style.left = x + "px";
                    node.style.top = y + "px";
                    node.style.width = "0";
                    node.style.height = "0";
                    return node;
                };
                const spawnSparks = (count, mode, forceColor, baseX, baseY) => {
                    const parent = mode === "burst" ? scene : clashField;
                    const parentX = mode === "burst" ? (typeof baseX === "number" ? baseX : midX) : 0;
                    const parentY = mode === "burst" ? (typeof baseY === "number" ? baseY : midY) : 0;
                    for (let i = 0; i < count; i++) {
                        let deg = Math.random() * Math.PI * 2;
                        let ox = 0;
                        let oy = 0;
                        const alongSeam = mode === "clash" && Math.random() < 0.7;
                        if (alongSeam) {
                            ox = (Math.random() - 0.5) * 6;
                            oy = (Math.random() - 0.5) * beamH * 0.9;
                            deg = (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.7;
                        } else if (mode === "clash") {
                            ox = (Math.random() - 0.5) * 8;
                            oy = (Math.random() - 0.5) * 8;
                        }
                        const dist = mode === "burst" ? 60 + Math.random() * 130 : 20 + Math.random() * 85;
                        const spark = document.createElement("div");
                        spark.className = "szs-jz-spark";
                        spark.style.left = parentX + ox + "px";
                        spark.style.top = parentY + oy + "px";
                        spark.style.animationDuration = (mode === "burst" ? 0.45 + Math.random() * 0.3 : 0.32 + Math.random() * 0.3).toFixed(2) + "s";
                        spark.style.setProperty("--dx", Math.cos(deg) * dist + "px");
                        spark.style.setProperty("--dy", Math.sin(deg) * dist + "px");
                        spark.style.setProperty("--szs-color", forceColor || randomColor(sparkPalette));
                        if (Math.random() < 0.12) {
                            const shard = document.createElement("div");
                            shard.className = "szs-jz-spark-shard";
                            shard.style.transform = "rotate(" + (Math.random() * 360) + "deg)";
                            spark.appendChild(shard);
                        } else if (Math.random() < 0.32) {
                            const line = document.createElement("div");
                            line.className = "szs-jz-spark-line";
                            if (Math.random() < 0.25) line.classList.add("szs-jz-rainbow");
                            line.style.width = 10 + Math.random() * 22 + "px";
                            line.style.transform = "rotate(" + (deg * 180) / Math.PI + "deg)";
                            spark.appendChild(line);
                        } else {
                            const dot = document.createElement("div");
                            dot.className = "szs-jz-spark-dot";
                            spark.appendChild(dot);
                        }
                        parent.appendChild(spark);
                        setTimeout(() => {
                            try { spark.remove(); } catch (e) {}
                        }, 900);
                    }
                };
                const boomAt = (x, y, color) => {
                    try {
                        const size = Math.max(90, orbSize * 1.15);
                        const boom = document.createElement("div");
                        boom.className = "szs-jz-boom";
                        boom.style.width = size + "px";
                        boom.style.height = size + "px";
                        boom.style.left = x + "px";
                        boom.style.top = y + "px";
                        boom.style.setProperty("--szs-color", color);
                        scene.appendChild(boom);
                        for (let i = 0; i < (perfLow ? 1 : 2); i++) {
                            const ring = document.createElement("div");
                            ring.className = "szs-jz-boomring";
                            const rs = size * (1.1 + i * 0.3);
                            ring.style.width = rs + "px";
                            ring.style.height = rs + "px";
                            ring.style.left = x + "px";
                            ring.style.top = y + "px";
                            ring.style.setProperty("--szs-color", i === 0 ? color : "#ffffff");
                            ring.style.animationDelay = i * 0.06 + "s";
                            scene.appendChild(ring);
                            setTimeout(() => {
                                try { ring.remove(); } catch (e) {}
                            }, 850);
                        }
                        setTimeout(() => {
                            try { boom.remove(); } catch (e) {}
                        }, 850);
                        spawnSparks(perfLow ? 12 : 22, "burst", color, x, y);
                        spawnSparks(perfLow ? 4 : 8, "burst", GOLD, x, y);
                        scene.classList.add("szs-jz-shake-scene");
                        beamScene.classList.add("szs-jz-shake-scene");
                        later(() => {
                            scene.classList.remove("szs-jz-shake-scene");
                            beamScene.classList.remove("szs-jz-shake-scene");
                        }, 320);
                    } catch (e) {}
                };

                // 光柱：多层流光 + 核心 + 行进亮段
                const beamBox = document.createElement("div");
                beamBox.className = "szs-jz-beambox";
                beamBox.style.left = a.x + "px";
                beamBox.style.top = a.y + "px";
                beamBox.style.transform = "rotate(" + angle + "deg)";
                beamScene.appendChild(beamBox);
                const shakeWrap = document.createElement("div");
                shakeWrap.className = "szs-jz-shake";
                beamBox.appendChild(shakeWrap);
                const makeBeamGroup = (rgb, rev) => {
                    const group = document.createElement("div");
                    group.className = "szs-jz-beamgroup" + (rev ? " rev" : "");
                    group.style.setProperty("--rgb", rgb);
                    const glow = document.createElement("div");
                    glow.className = "szs-jz-glow";
                    glow.style.height = beamH * 1.7 + "px";
                    glow.style.top = -beamH * 0.85 + "px";
                    const flow = document.createElement("div");
                    flow.className = "szs-jz-flow";
                    flow.style.height = beamH * 0.72 + "px";
                    flow.style.top = -beamH * 0.36 + "px";
                    const core = document.createElement("div");
                    core.className = "szs-jz-coreline";
                    core.style.height = Math.max(6, beamH * 0.14) + "px";
                    core.style.top = -Math.max(6, beamH * 0.14) / 2 + "px";
                    const travel = document.createElement("div");
                    travel.className = "szs-jz-travel";
                    group.appendChild(glow);
                    group.appendChild(flow);
                    group.appendChild(core);
                    group.appendChild(travel);
                    shakeWrap.appendChild(group);
                    return group;
                };
                const beamA = makeBeamGroup(PURPLE_RGB, false);
                beamA.style.left = "0px";
                const beamB = makeBeamGroup(BLUE_RGB, true);
                beamB.style.left = distance + "px";
                beamB.style.transform = "translateX(-100%)";
                const seamWrap = document.createElement("div");
                seamWrap.style.cssText = "position:absolute;left:" + distance / 2 + "px;top:0;width:0;height:0;transition:opacity .35s linear;opacity:0;";
                shakeWrap.appendChild(seamWrap);
                const seamGlow = document.createElement("div");
                seamGlow.className = "szs-jz-seamglow";
                const seamGlowH = beamH * 1.7;
                seamGlow.style.width = "24px";
                seamGlow.style.height = seamGlowH + "px";
                seamGlow.style.left = "-12px";
                seamGlow.style.top = -seamGlowH / 2 + "px";
                seamGlow.style.setProperty("--szs-mix", MIX);
                seamWrap.appendChild(seamGlow);
                const seamPool = [];
                for (let i = 0; i < 6; i++) {
                    const seam = document.createElement("div");
                    seam.className = "szs-jz-seam";
                    const seamH = beamH * (0.85 + Math.random() * 0.75);
                    seam.style.height = seamH + "px";
                    seam.style.left = (i - 2.5) * 3.2 + "px";
                    seam.style.top = -seamH / 2 + "px";
                    seam.style.setProperty("--szs-color", i === 0 ? "#ffffff" : i === 1 ? WARM : i === 2 ? GOLD : i < 5 ? PURPLE : BLUE);
                    seam.style.animationDelay = -Math.random() * 0.2 + "s";
                    seamWrap.appendChild(seam);
                    seamPool.push(seam);
                }
                const state = { a: 0, b: 0 };
                const spawnLeak = (side) => {
                    const w = state[side];
                    if (!(w > 20)) return;
                    const t = Math.random() * w;
                    const gx = side === "a" ? t : distance - t;
                    const gy = (Math.random() - 0.5) * beamH * 0.7;
                    const leak = document.createElement("div");
                    leak.className = "szs-jz-leak";
                    const size = 2 + Math.random() * 4;
                    leak.style.width = size + "px";
                    leak.style.height = size + "px";
                    leak.style.left = gx + "px";
                    leak.style.top = gy + "px";
                    const sideColor = side === "a" ? (Math.random() < 0.5 ? PURPLE : PURPLE_HI) : Math.random() < 0.5 ? BLUE : BLUE_HI;
                    leak.style.setProperty("--szs-color", Math.random() < 0.2 ? "#ffffff" : sideColor);
                    const lx = (Math.random() - 0.5) * 42 + (side === "a" ? -6 : 6);
                    const ly = (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 30);
                    leak.style.setProperty("--dx", lx + "px");
                    leak.style.setProperty("--dy", ly + "px");
                    shakeWrap.appendChild(leak);
                    setTimeout(() => {
                        try { leak.remove(); } catch (e) {}
                    }, 800);
                };

                const startLoops = () => {
                    clashTimer = setInterval(() => {
                        if (disposed) return;
                        if (typeof _status !== "undefined" && _status && _status.over) {
                            cleanup();
                            return;
                        }
                        try {
                            for (let i = 0; i < 2; i++) randomizeBolt(boltPool[Math.floor(Math.random() * boltPool.length)]);
                            spawnSparks(perfLow ? 2 : 3, "clash");
                            hotWrap.style.transform = "translate(" + (Math.random() * 4 - 2).toFixed(1) + "px," + (Math.random() * 4 - 2).toFixed(1) + "px)";
                        } catch (e) {}
                    }, perfLow ? 130 : 85);
                    leakTimer = setInterval(() => {
                        if (disposed) return;
                        try {
                            spawnLeak("a");
                            spawnLeak("b");
                        } catch (e) {}
                    }, perfLow ? 180 : 120);
                };

                const ready = new Promise((resolve) => {
                    resolveReady = resolve;
                    const kick = () => {
                        if (disposed) return resolve();
                        orbA.classList.add("on");
                        orbB.classList.add("on");
                    };
                    if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => requestAnimationFrame(kick));
                    else setTimeout(kick, 30);
                    later(() => {
                        if (disposed) return resolve();
                        orbA.classList.add("fire");
                        orbB.classList.add("fire");
                        state.a = distance / 2;
                        state.b = distance / 2;
                        beamA.style.width = state.a + "px";
                        beamB.style.width = state.b + "px";
                        phase = "clash";
                        clashField.classList.add("on");
                        seamWrap.style.opacity = "1";
                        later(resolve, 300);
                        try {
                            spawnSparks(perfLow ? 7 : 12, "clash");
                            startLoops();
                        } catch (e) {}
                    }, 330);
                });

                const clash = () => {
                    if (disposed) return;
                    try {
                        clashField.classList.remove("shake");
                        void clashField.offsetWidth;
                        clashField.classList.add("shake");
                        later(() => clashField.classList.remove("shake"), 190);
                        spawnSparks(perfLow ? 7 : 12, "clash");
                        for (let i = 0; i < 4; i++) randomizeBolt(boltPool[Math.floor(Math.random() * boltPool.length)]);
                        hotWrap.style.transform = "translate(" + (Math.random() * 6 - 3).toFixed(1) + "px," + (Math.random() * 6 - 3).toFixed(1) + "px)";
                    } catch (e) {}
                };

                const finish = (winner) =>
                    new Promise((resolve) => {
                        resolveFinish = resolve;
                        if (disposed) return resolve();
                        disposed = true;
                        clearLoops();
                        try {
                            if (winner === "purple" || winner === "blue") {
                                const winA = winner === "purple";
                                const winColor = winA ? PURPLE : BLUE;
                                phase = "push";
                                pushWinA = winA;
                                const winGroup = winA ? beamA : beamB;
                                const loseGroup = winA ? beamB : beamA;
                                const winOrb = winA ? orbA : orbB;
                                const loseOrb = winA ? orbB : orbA;
                                winOrb.classList.remove("on", "fire");
                                const losePt = winA ? b : a;
                                const pushDur = 650;
                                const pushEase = "cubic-bezier(.25,.8,.3,1)";
                                winOrb.classList.add("win");
                                winGroup.classList.add("win");
                                winGroup.style.transition = "width " + pushDur + "ms " + pushEase;
                                loseGroup.style.transition = "width " + pushDur + "ms " + pushEase;
                                winGroup.style.width = distance + "px";
                                loseGroup.style.width = "0px";
                                if (winA) state.a = distance;
                                else state.b = distance;
                                // 胜利色不瞬间铺满：裂缝、火花与光柱边界一起向败方推进
                                seamWrap.style.transition = "left " + pushDur + "ms " + pushEase + ", opacity .35s linear";
                                seamWrap.style.left = (winA ? distance : 0) + "px";
                                clashField.style.transition = "left " + pushDur + "ms " + pushEase + ", top " + pushDur + "ms " + pushEase + ", opacity .3s linear";
                                clashField.style.left = losePt.x + "px";
                                clashField.style.top = losePt.y + "px";
                                clashField.style.setProperty("--szs-mix", winColor);
                                seamGlow.style.setProperty("--szs-mix", winColor);
                                boltPool.forEach((bolt, index) => {
                                    bolt.style.setProperty("--szs-color", index % 4 === 0 ? GOLD : winColor);
                                });
                                seamPool.forEach((seam, index) => {
                                    seam.style.setProperty("--szs-color", index === 0 ? "#ffffff" : index === 1 ? GOLD : winColor);
                                });
                                // 碰撞点先炸一簇多色火花（含金色/彩虹）
                                spawnSparks(perfLow ? 14 : 24, "burst", null, midX, midY);
                                for (let i = 0; i < (perfLow ? 4 : 8); i++) spawnLeak(winA ? "a" : "b");
                                // 推进抵达败方武将牌后，败方光球才熄灭，并再炸一簇胜方色火花
                                later(() => {
                                    loseOrb.classList.remove("on", "fire");
                                    loseOrb.classList.add("lose");
                                }, 600);
                                later(() => {
                                    const cur = winA ? b : a;
                                    boomAt(cur.x, cur.y, winColor);
                                    if (resolveReached) {
                                        const done = resolveReached;
                                        resolveReached = null;
                                        try { done(); } catch (e) {}
                                    }
                                }, 650);
                                later(() => {
                                    clashField.classList.remove("on");
                                    seamWrap.style.opacity = "0";
                                }, 780);
                                later(() => {
                                    scene.classList.add("fade");
                                    beamScene.classList.add("fade");
                                }, 1000);
                                later(() => {
                                    cleanup();
                                    resolve();
                                }, 1350);
                            } else {
                                phase = "done";
                                clashField.classList.remove("on");
                                seamWrap.style.opacity = "0";
                                orbA.classList.remove("on", "fire");
                                orbB.classList.remove("on", "fire");
                                orbA.classList.add("dim");
                                orbB.classList.add("dim");
                                later(() => {
                                    scene.classList.add("fade");
                                    beamScene.classList.add("fade");
                                }, 160);
                                later(() => {
                                    cleanup();
                                    resolve();
                                }, 650);
                            }
                        } catch (e) {
                            cleanup();
                            resolve();
                        }
                    });

                let lastGeomKey = "";
                const applyFollow = () => {
                    if (disposed || phase === "done") return;
                    try {
                        measureBody();
                        scene.style.width = viewW + "px";
                        scene.style.height = viewH + "px";
                        beamScene.style.width = viewW + "px";
                        beamScene.style.height = viewH + "px";
                        if (!measureCenters()) return;
                        if (!updateAnchors()) return;
                        const key = a.x.toFixed(1) + "," + a.y.toFixed(1) + "," + b.x.toFixed(1) + "," + b.y.toFixed(1) + "," + distance.toFixed(1);
                        if (phase !== "push" && key === lastGeomKey) return;
                        if (phase === "clash") lastGeomKey = key;
                        orbA.style.left = a.x + "px";
                        orbA.style.top = a.y + "px";
                        orbB.style.left = b.x + "px";
                        orbB.style.top = b.y + "px";
                        beamBox.style.left = a.x + "px";
                        beamBox.style.top = a.y + "px";
                        beamBox.style.transform = "rotate(" + angle + "deg)";
                        beamB.style.left = distance + "px";
                        if (phase === "push") {
                            seamWrap.style.left = (pushWinA ? distance : 0) + "px";
                            clashField.style.left = (pushWinA ? b.x : a.x) + "px";
                            clashField.style.top = (pushWinA ? b.y : a.y) + "px";
                            beamA.style.width = (pushWinA ? distance : 0) + "px";
                            beamB.style.width = (pushWinA ? 0 : distance) + "px";
                        } else {
                            seamWrap.style.left = distance / 2 + "px";
                            clashField.style.left = midX + "px";
                            clashField.style.top = midY + "px";
                        }
                        if (phase === "clash") {
                            const half = distance / 2;
                            state.a = half;
                            state.b = half;
                            beamA.style.transition = "width .15s linear";
                            beamB.style.transition = "width .15s linear";
                            beamA.style.width = half + "px";
                            beamB.style.width = half + "px";
                        }
                    } catch (e) {}
                };
                followTimer = setInterval(applyFollow, perfLow ? 220 : 150);
                startMotes();
                startBoil();

                const safety = setTimeout(() => {
                    if (!cleaned) cleanup();
                }, 600000);
                timers.push(safety);

                return { ready, clash, finish, reached };
            } catch (e) {
                try {
                    (Array.isArray(sceneRef) ? sceneRef : [sceneRef]).forEach((node) => {
                        if (node && node.parentNode) node.parentNode.removeChild(node);
                    });
                } catch (err) {}
                console.warn("[朔夜] 具咒决斗特效创建失败:", e);
                return null;
            }
        },
    },
//#noname-kit-end skill:shuoye_juzhou_duel_fx
};

export default skills;
