import { lib, game, ui, get, ai, _status } from "noname"

const cards = {
//#noname-kit-begin card:shuoye_xiaotiqin
    shuoye_xiaotiqin: {
        fullskin: true,
        image: "ext:朔夜/image/card/shuoye_xiaotiqin.jpg",
        type: "equip",
        subtype: "equip1",
        distance: {
            attackFrom: -1,
        },
        skills: ["shuoye_xiaotiqin_skill1", "shuoye_xiaotiqin_skill2"],
    },
//#noname-kit-end card:shuoye_xiaotiqin
//#noname-kit-begin card:shuoye_abishu
    shuoye_abishu: {
        fullskin: true,
        image: "ext:朔夜/image/card/shuoye_abishu.jpg",
        type: "equip",
        subtype: "equip1",
        destroyLog: false,
        derivation: "shuoye_feiniaomashi",
        distance: {
            attackFrom: -2,
        },
        ai: {
            basic: {
                equipValue: 10,
                order: (card, player) => {
                    const equipValue = get.equipValue(card, player) / 20;
                    return player && player.hasSkillTag("reverseEquip") ? 8.5 - equipValue : 8 + equipValue;
                },
                useful: 2,
                value: (card, player, index, method) => {
                    if (!player.getCards('e').includes(card) && !player.canEquip(card, true)) return 0.01;
                    const info = get.info(card), current = player.getEquip(info.subtype), value = current && card != current && get.value(current, player);
                    let equipValue = info.ai.equipValue || info.ai.basic.equipValue;
                    if (typeof equipValue == 'function') {
                        if (method == 'raw') return equipValue(card, player);
                        if (method == 'raw2') return equipValue(card, player) - value;
                        return Math.max(0.1, equipValue(card, player) - value);
                    }
                    if (typeof equipValue != 'number') equipValue = 0;
                    if (method == 'raw') return equipValue;
                    if (method == 'raw2') return equipValue - value;
                    return Math.max(0.1, equipValue - value);
                },
            },
            result: {
                target: (player, target, card) => get.equipResult(player, target, card.name),
            },
        },
        cardPrompt(card) {
            if (!card.storage || typeof card.storage.shuoye_abishu != "number") return lib.translate["shuoye_abishu_info"];
            let str = "②此牌剩余" + parseFloat(card.storage.shuoye_abishu) + "点耐久度，耐久度为0时销毁此牌。";
            return str + "①当此牌进入你的装备区时，你获得1点护甲，然后重铸你装备区里的其他牌。②其他装备区进入你的装备区前，改为重铸这些牌。③你的出牌阶段使用【杀】的次数上限+1。④当你造成伤害时，可减少1点耐久度令此伤害加1。⑤当你需要时，你可以减少1点耐久度视为使用本回合未以此法使用过的一张单目标伤害类牌。⑥当你受到伤害后，若你没有护甲，则你减少1点耐久度获得1点护甲。⑦当此牌离开装备区时，减少1点此牌的耐久度并防止之。";
        },
        skills: ["shuoye_abishu_skill","shuoye_abishu_effect"],
    },
//#noname-kit-end card:shuoye_abishu
//#noname-kit-begin card:shuoye_xugouren
    shuoye_xugouren: {
        fullskin: true,
        image: 'ext:朔夜/image/card/shuoye_xugouren.jpg',
        type: "trick",
        enable: true,
        filterTarget(card, player, target) {
            return get.distance(player, target) <= 2;
        },
        selectTarget: [1, 2],
        complexSelect: true,
        complexTarget: true,
        async content(event, trigger, player) {
            const target = event.target;
            let list = [];
            if (target.countGainableCards(player, "he")) list.push('选项一');
            list.push('选项二');
            if (!list.length) return;
            const { result: { control } } = await target.chooseControl(list)
                .set('choiceList', [
                    `令${get.translation(player)}获得你的一张牌，然后你与其各摸一张牌`,
                    `受到1点伤害`,
                ])
                .set("sourcex", player)
                .set('ai', () => {
                    const player = get.player(),
                        source = get.event("sourcex");
                    let controls = get.event("controls");
                    if (get.damageEffect(player, player, player) > 0) return '选项二';
                    return '选项一';
                });
            if (control == '选项一') {
                await player.gainPlayerCard(target, "he", true);
                await game.asyncDraw([player, target]);
            } else {
                target.damage();
            }
        },
        ai: {
            basic: {
                useful: [3, 4],
                value: [3, 4],
            },
            result: {
                player: 1,
            },
        },
    },
//#noname-kit-end card:shuoye_xugouren
//#noname-kit-begin card:shuoye_lx_shuiyan
    shuoye_lx_shuiyan: {
        type: "trick",
        enable: true,
        selectTarget: [1, 2],
        targetprompt: ["受伤弃牌", "受伤摸牌"],
        filterTarget(card, player, target) {
            return target !== player;
        },
        async contentBefore(event, trigger, player) {
            const evt = event.getParent();
            const targets = (evt && (evt.stocktargets || evt.targets)) || [];
            evt.shj_syqj_first = targets[0];
        },
        async content(event, trigger, player) {
            const target = event.target;
            const parent = event.getParent();
            const first = parent && parent.shj_syqj_first;
            await target.damage(1, "thunder", player);
            if (!target.isAlive()) {
                return;
            }
            if (target === first) {
                await target.chooseToDiscard("he", true);
            } else {
                await target.draw(1);
            }
        },
        ai: {
            order: 6,
            value: 4,
            useful: 2,
            tag: {
                damage: 1,
                thunderDamage: 1,
                natureDamage: 1,
                loseCard: 1,
            },
            result: {
                target(player, target) {
                    return get.attitude(player, target) > 0 ? 0.4 : -1;
                },
            },
        },
    },
//#noname-kit-end card:shuoye_lx_shuiyan
};
export default cards;
