import { lib, game, ui, get, ai, _status } from "noname";

const characters = {
//#noname-kit-begin character:shuoye_wuweijuezhe
	shuoye_wuweijuezhe: {
		sex: "male",
		hp: 1,
		group: "qun",
		skills: ["shuoye_wuwei"],
		img: "extension/朔夜/image/shuoye_wuweijuezhe.png",
	},
//#noname-kit-end character:shuoye_wuweijuezhe
//#noname-kit-begin character:shuoye_xituo
	shuoye_xituo: {
		sex: "female",
		hp: 3,
		group: "shu",
		skills: ["shuoye_jinmie", "shuoye_shenzhou"],
		img: "extension/朔夜/image/shuoye_xituo.png",
	},
//#noname-kit-end character:shuoye_xituo
//#noname-kit-begin character:shuoye_qiaolienide
	shuoye_qiaolienide: {
		sex: "male",
		hp: 1,
		maxHp: 5,
		group: "wu",
		skills: ["shuoye_yugu", "shuoye_jietian"],
		img: "extension/朔夜/image/shuoye_qiaolienide.png",
	},
//#noname-kit-end character:shuoye_qiaolienide
};

const titles = {
	shuoye_wuweijuezhe: "永恒",
	shuoye_xituo: "破暗",
	shuoye_qiaolienide: "古龙王",
};

const translates = {
//#noname-kit-begin translate:shuoye_wuweijuezhe
	shuoye_wuweijuezhe: "无为觉者",
//#noname-kit-end translate:shuoye_wuweijuezhe
//#noname-kit-begin translate:shuoye_wuwei
	shuoye_wuwei: "无为",
	shuoye_wuwei_info:
		"你手牌数始终为0。有牌非因使用或打出进入弃牌堆时，你体力上限+1（体力不满改为回复一点体力）（每轮每名角色限一次）。若其中存在可以使用的牌，则你可于此回合结束后使用其中一张。一名角色使用或打出牌后，若其手牌数大于体力上限，弃置一张牌。",
//#noname-kit-end translate:shuoye_wuwei
//#noname-kit-begin translate:shuoye_xituo
	shuoye_xituo: "希拓",
//#noname-kit-end translate:shuoye_xituo
//#noname-kit-begin translate:shuoye_jinmie
	shuoye_jinmie: "烬灭",
	shuoye_jinmie_info: "游戏开始时，你令所有其他角色获得【燃殇】。",
//#noname-kit-end translate:shuoye_jinmie
//#noname-kit-begin translate:shuoye_shenzhou
	shuoye_shenzhou: "神咒",
	shuoye_shenzhou_info: "当你使用的牌被抵消或被响应后，你可以令该牌的一名目标回复1点体力，然后受到1点火焰伤害。",
//#noname-kit-end translate:shuoye_shenzhou
//#noname-kit-begin translate:shuoye_ranshang
	shuoye_ranshang: "燃殇",
	shuoye_ranshang_info: "你每受到1点火焰伤害，获得1枚“燃”标记。结束阶段，你失去X点体力令希拓摸X张牌（X为“燃”标记数）。你每轮首次对自己使用牌时选择与上次不同的一项:①你下次恢复体力后受到一点火焰伤害；②若希拓存活，其可视为对你使用一张无距离限制的[杀]，否则你失去一点体力。",
//#noname-kit-end translate:shuoye_ranshang
//#noname-kit-begin translate:shuoye_qiaolienide
	shuoye_qiaolienide: "乔列尼德",
//#noname-kit-end translate:shuoye_qiaolienide
//#noname-kit-begin translate:shuoye_yugu
	shuoye_yugu: "御古",
	shuoye_yugu_info:
		"锁定技，每名角色的回合开始时，你交换你的体力值与已损体力，手牌数与X（X为你手牌数与体力上限差值的绝对值；所有数值至少为1）。",
//#noname-kit-end translate:shuoye_yugu
//#noname-kit-begin translate:shuoye_jietian
	shuoye_jietian: "揭天",
	shuoye_jietian_info: "出牌阶段限一次，你可以发动一次【御古】，然后若你的体力值与手牌数均减小，你对一名角色使用（减小总量）次【杀】。",
//#noname-kit-end translate:shuoye_jietian
};

const skills = {
//#noname-kit-begin skill:shuoye_wuwei
	shuoye_wuwei: {
		forced: true,
		group: ["shuoye_wuwei_hand", "shuoye_wuwei_overflow", "shuoye_wuwei_reset", "shuoye_wuwei_after"],
		trigger: { global: ["loseAfter", "cardsDiscardAfter", "loseAsyncAfter"] },
		filter(event, player) {
			if (event.name.startsWith("lose")) {
				if (event.getlx === false || event.position !== ui.discardPile) {
					return false;
				}
			} else {
				const parent = event.getParent();
				if (parent && parent.relatedEvent && ["useCard", "respond"].includes(parent.relatedEvent.name)) {
					return false;
				}
				for (const name of ["useCard", "respond"]) {
					const evt = event.getParent(name);
					if (evt && evt.cards && event.cards && event.cards.length && event.cards.every(card => evt.cards.includes(card))) {
						return false;
					}
				}
			}
			return !!(event.cards && event.cards.some(card => get.position(card, true) === "d"));
		},
		getUsed() {
			if (!game.shuoyeWuwei || game.shuoyeWuwei.round !== game.roundNumber) {
				game.shuoyeWuwei = {
					round: game.roundNumber,
					used: []
				};
			}
			return game.shuoyeWuwei.used;
		},
		getSource(event) {
			if (event.name.startsWith("lose")) {
				return event.player || null;
			}
			const judge = event.getParent("judge");
			if (judge && judge.player) {
				return judge.player;
			}
			if (event.player) {
				return event.player;
			}
			const ordering = event.getParent();
			const related = ordering && ordering.relatedEvent;
			if (related) {
				if (Array.isArray(related.lose_list)) {
					for (const [player, cards] of related.lose_list) {
						if (cards && event.cards && event.cards.some(card => cards.includes(card))) {
							return player;
						}
					}
				}
				if (related.player) {
					return related.player;
				}
			}
			return _status.currentPhase || null;
		},
		async content(event, trigger, player) {
			const source = lib.skill.shuoye_wuwei.getSource(trigger);
			let buff = true;
			if (source) {
				const used = lib.skill.shuoye_wuwei.getUsed();
				if (used.includes(source.playerid)) {
					buff = false;
				} else {
					used.push(source.playerid);
				}
			}
			if (buff) {
				if (player.hp < player.maxHp) {
					await player.recover();
				} else {
					await player.gainMaxHp();
				}
			}
			const usable = trigger.cards.filter(card => get.itemtype(card) === "card" && get.position(card, true) === "d" && player.hasUseTarget(card));
			if (usable.length) {
				if (!Array.isArray(player.storage.shuoyeWuweiPending)) {
					player.storage.shuoyeWuweiPending = [];
				}
				for (const card of usable) {
					if (!player.storage.shuoyeWuweiPending.includes(card)) {
						player.storage.shuoyeWuweiPending.push(card);
					}
				}
			}
		},
		subSkill: {
			hand: {
				charlotte: true,
				forced: true,
				trigger: { player: "gainAfter", global: "gameDrawEnd" },
				filter(event, player) {
					return player.countCards("h") > 0;
				},
				async content(event, trigger, player) {
					const cards = player.getCards("h");
					if (cards.length) {
						await player.discard(cards);
					}
				},
			},
			reset: {
				charlotte: true,
				forced: true,
				trigger: { global: "gameStart" },
				async content(event, trigger, player) {
					game.shuoyeWuwei = {
						round: game.roundNumber,
						used: []
					};
				},
			},
			overflow: {
				charlotte: true,
				forced: true,
				trigger: { global: ["useCardAfter", "respondAfter"] },
				filter(event, player) {
					const target = event.player;
					if (!target || !target.isAlive()) {
						return false;
					}
					return target.countCards("h") > target.maxHp;
				},
				async content(event, trigger, player) {
					const target = trigger.player;
					if (!target || !target.isAlive() || target.countCards("h") <= target.maxHp) {
						return;
					}
					await target.chooseToDiscard("he", 1, true).set("prompt", "无为：使用或打出牌后手牌数大于体力上限，弃置一张牌");
				},
			},
			after: {
				charlotte: true,
				forced: true,
				trigger: { global: "phaseAfter" },
				filter(event, player) {
					const pending = player.storage.shuoyeWuweiPending;
					return Array.isArray(pending) && pending.length > 0;
				},
				async content(event, trigger, player) {
					const pool = Array.isArray(player.storage.shuoyeWuweiPending) ? player.storage.shuoyeWuweiPending.slice() : [];
					player.storage.shuoyeWuweiPending = [];
					const cards = pool.filter(card => get.position(card, true) === "d" && player.hasUseTarget(card));
					if (!cards.length) {
						return;
					}
					const prefix = "shuoye_wuwei_after_";
					const list = cards.map((card, index) => [prefix + index, "使用【" + get.translation(card) + "】"]);
					const next = player.chooseButton(["###无为：是否使用本回合进入弃牌堆的牌？###<div class=\"text center\">只能选择其中一张使用，或取消</div>", [list, "tdnodes"]], [0, 1]);
					if (!_status.connectMode) {
						next.set("ai", button => {
							const player2 = get.player();
							if (!button || typeof button.link !== "string" || !button.link.startsWith(prefix)) return 0;
							const card = cards[parseInt(button.link.slice(prefix.length))];
							return card ? player2.getUseValue(card) : 0;
						});
					}
					const result = await next.forResult();
					if (result && result.bool && result.links && result.links.length) {
						const link = result.links[0];
						if (typeof link === "string" && link.startsWith(prefix)) {
							const card = cards[parseInt(link.slice(prefix.length))];
							if (card && get.position(card, true) === "d" && player.hasUseTarget(card)) {
								await player.chooseUseTarget(card, true).forResult();
							}
						}
					}
				},
			},
		},
	},
//#noname-kit-end skill:shuoye_wuwei
//#noname-kit-begin skill:shuoye_jinmie
	shuoye_jinmie: {
		forced: true,
		trigger: { global: "gameStart" },
		filter(event, player) {
			return game.hasPlayer(target => target !== player && !target.hasSkill("shuoye_ranshang"));
		},
		async content(event, trigger, player) {
			for (const target of game.filterPlayer(current => current !== player && !current.hasSkill("shuoye_ranshang"))) {
				target.addSkill("shuoye_ranshang");
				target.popup("shuoye_ranshang", "fire");
				game.log(target, "获得了技能", "#g【燃殇】");
			}
		},
	},
//#noname-kit-end skill:shuoye_jinmie
//#noname-kit-begin skill:shuoye_shenzhou
	shuoye_shenzhou: {
		group: ["shuoye_shenzhou_record", "shuoye_shenzhou_after"],
		trigger: { player: ["shaMiss", "eventNeutralized"] },
		filter(event, player) {
			return event.type === "card" && lib.skill.shuoye_shenzhou.getTargets(event).length > 0;
		},
		getTargets(event) {
			if (event.target && event.target.isIn && event.target.isIn()) {
				return [event.target];
			}
			if (!event.targets) {
				return [];
			}
			return event.targets.filter(target => target && target.isIn && target.isIn());
		},
		check(event, player) {
			return lib.skill.shuoye_shenzhou.getTargets(event).some(target => target !== player);
		},
		async applyEffect(player, targets) {
			targets = (targets || []).filter(target => target && target.isIn && target.isIn());
			if (!targets.length) {
				return;
			}
			let target = targets[0];
			if (targets.length > 1) {
				const result = await player
					.chooseTarget("神咒：选择一名目标回复1点体力，然后受到1点火焰伤害")
					.set("filterTarget", (card, playerx, targetx) => (get.event().shuoyeShenzhouTargets || []).includes(targetx))
					.set("shuoyeShenzhouTargets", targets)
					.set("ai", targetx => {
						const player2 = get.player();
						return targetx === player2 ? -1000 : 1 - get.attitude(player2, targetx);
					})
					.forResult();
				if (!result || !result.bool) {
					return;
				}
				target = result.targets[0];
			}
			player.line(target, "fire");
			await target.recover();
			await target.damage(1, "fire", player);
		},
		async content(event, trigger, player) {
			let useEvent = null;
			if (trigger.name === "useCard") {
				useEvent = trigger;
			} else {
				const parent = trigger.getParent("useCard");
				if (parent && parent.name === "useCard") {
					useEvent = parent;
				}
			}
			if (useEvent) {
				useEvent._shuoyeShenzhouCountered = true;
			}
			await lib.skill.shuoye_shenzhou.applyEffect(player, lib.skill.shuoye_shenzhou.getTargets(trigger));
		},
		subSkill: {
			record: {
				charlotte: true,
				forced: true,
				silent: true,
				trigger: { global: "respondAfter" },
				filter(event, player) {
					const useEvent = event.getParent("useCard");
					return !!useEvent && useEvent.name === "useCard" && useEvent.player === player && useEvent.targets && useEvent.targets.includes(event.player);
				},
				async content(event, trigger, player) {
					const useEvent = trigger.getParent("useCard");
					if (useEvent && useEvent.name === "useCard") {
						useEvent._shuoyeShenzhouRespond = true;
					}
				},
			},
			after: {
				charlotte: true,
				trigger: { player: "useCardAfter" },
				filter(event, player) {
					return !!event._shuoyeShenzhouRespond && !event._shuoyeShenzhouCountered && !!(event.targets && event.targets.some(target => target.isIn()));
				},
				check(event, player) {
					return event.targets.some(target => target.isIn() && target !== player);
				},
				async content(event, trigger, player) {
					await lib.skill.shuoye_shenzhou.applyEffect(player, trigger.targets);
				},
			},
		},
	},
//#noname-kit-end skill:shuoye_shenzhou
//#noname-kit-begin skill:shuoye_ranshang
	shuoye_ranshang: {
		forced: true,
		group: ["shuoye_ranshang_end", "shuoye_ranshang_use", "shuoye_ranshang_recover"],
		marktext: "燃",
		intro: { content: "mark" },
		trigger: { player: "damageEnd" },
		filter(event, player) {
			return event.hasNature("fire") && event.num > 0;
		},
		async content(event, trigger, player) {
			player.addMark("shuoye_ranshang", trigger.num);
		},
		getXituo() {
			return game.findPlayer(target => target.isAlive() && (target.name === "shuoye_xituo" || target.name2 === "shuoye_xituo"));
		},
		subSkill: {
			end: {
				charlotte: true,
				forced: true,
				trigger: { player: "phaseJieshuBegin" },
				filter(event, player) {
					return player.countMark("shuoye_ranshang") > 0;
				},
				async content(event, trigger, player) {
					const x = player.countMark("shuoye_ranshang");
					if (!x) {
						return;
					}
					await player.loseHp(x);
					const xituo = lib.skill.shuoye_ranshang.getXituo();
					if (xituo) {
						await xituo.draw(x);
					}
				},
			},
			use: {
				charlotte: true,
				forced: true,
				trigger: { player: "useCardAfter" },
				filter(event, player) {
					if (player.storage.shuoye_ranshangRound === game.roundNumber) {
						return false;
					}
					if (event.targets && event.targets.includes(player)) {
						return true;
					}
					return !!(event.cards && event.cards.some(card => get.type(card) === "equip"));
				},
				async content(event, trigger, player) {
					player.storage.shuoye_ranshangRound = game.roundNumber;
					const all = [
						{ key: "选项一", text: "①你下次恢复体力后受到一点火焰伤害" },
						{ key: "选项二", text: "②若希拓存活，其可视为对你使用一张无距离限制的【杀】，否则你失去一点体力" },
					];
					const last = player.storage.shuoye_ranshangLast;
					const choices = last === "选项一" || last === "选项二" ? all.filter(option => option.key !== last) : all;
					const next = player
						.chooseControl(choices.map(option => option.key))
						.set("choiceList", choices.map(option => option.text))
						.set("prompt", "燃殇：选择与上次不同的一项")
						.set("shuoyeChoiceKey", choices[0].key)
						.set("ai", () => get.event().shuoyeChoiceKey);
					const result = await next.forResult();
					const control = result && result.control;
					const choice = choices.some(option => option.key === control) ? control : choices[0].key;
					player.storage.shuoye_ranshangLast = choice;
					if (choice === "选项一") {
						if (player.countMark("shuoye_ranshang_burn") < 1) {
							player.addMark("shuoye_ranshang_burn", 1, false);
						}
						game.log(player, "选择了", "#g【燃殇】", "：下次恢复体力后受到1点火焰伤害");
					} else {
						const xituo = lib.skill.shuoye_ranshang.getXituo();
						if (xituo) {
							const bool = await xituo
								.chooseBool("燃殇：是否视为对" + get.translation(player) + "使用一张无距离限制的【杀】？")
								.set("shuoyeTarget", player)
								.set("ai", () => get.effect(get.event().shuoyeTarget, { name: "sha" }, get.player(), get.player()) > 0)
								.forResult();
							if (bool && bool.bool) {
								await xituo.useCard({ name: "sha", isCard: true }, player, false);
							}
						} else {
							await player.loseHp(1);
						}
						game.log(player, "选择了", "#g【燃殇】", "：希拓视为对你使用【杀】");
					}
				},
			},
			recover: {
				charlotte: true,
				forced: true,
				trigger: { player: "recoverEnd" },
				filter(event, player) {
					return player.countMark("shuoye_ranshang_burn") > 0;
				},
				async content(event, trigger, player) {
					await player.removeMark("shuoye_ranshang_burn", 1, false);
					await player.damage(1, "fire");
				},
			},
			burn: {
				charlotte: true,
				marktext: "灼",
				intro: {
					name: "灼",
					content: "下次恢复体力后受到1点火焰伤害",
				},
			},
		},
	},
//#noname-kit-end skill:shuoye_ranshang
//#noname-kit-begin skill:shuoye_yugu
	shuoye_yugu: {
		forced: true,
		trigger: { global: "phaseBegin" },
		async content(event, trigger, player) {
			const lost = player.maxHp - player.hp;
			const newHp = Math.max(1, lost);
			if (newHp !== player.hp) {
				await player.changeHp(newHp - player.hp, false);
			}
			const hand = player.countCards("h");
			const x = Math.max(1, Math.abs(hand - player.maxHp));
			if (hand < x) {
				await player.draw(x - hand);
			} else if (hand > x) {
				await player.chooseToDiscard("h", hand - x, true).set("prompt", "御古：将手牌数调整至" + x + "张");
			}
		},
	},
//#noname-kit-end skill:shuoye_yugu
//#noname-kit-begin skill:shuoye_jietian
	shuoye_jietian: {
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			const hpBefore = player.hp;
			const handBefore = player.countCards("h");
			const lost = player.maxHp - player.hp;
			const newHp = Math.max(1, lost);
			if (newHp !== player.hp) {
				await player.changeHp(newHp - player.hp, false);
			}
			const hand = player.countCards("h");
			const x = Math.max(1, Math.abs(hand - player.maxHp));
			if (hand < x) {
				await player.draw(x - hand);
			} else if (hand > x) {
				await player.chooseToDiscard("h", hand - x, true).set("prompt", "揭天：将手牌数调整至" + x + "张");
			}
			const hpReduce = hpBefore - player.hp;
			const handReduce = handBefore - player.countCards("h");
			if (hpReduce <= 0 || handReduce <= 0) {
				return;
			}
			const num = hpReduce + handReduce;
			if (!game.hasPlayer(target => player.canUse({ name: "sha", isCard: true }, target))) {
				return;
			}
			const result = await player
				.chooseTarget("揭天：选择一名角色，对其使用" + num + "次【杀】", (card, playerx, target) => playerx.canUse({ name: "sha", isCard: true }, target))
				.set("ai", target => -get.attitude(get.player(), target))
				.forResult();
			if (!result || !result.bool) {
				return;
			}
			const target = result.targets[0];
			for (let i = 0; i < num; i++) {
				if (!target.isIn() || !player.canUse({ name: "sha", isCard: true }, target)) {
					break;
				}
				await player.useCard({ name: "sha", isCard: true }, target, false);
			}
		},
		ai: {
			order(item, player) {
				const newHp = Math.max(1, player.maxHp - player.hp);
				const hpReduce = player.hp - newHp;
				const x = Math.max(1, Math.abs(player.countCards("h") - player.maxHp));
				const handReduce = player.countCards("h") - x;
				if (hpReduce > 0 && handReduce > 0) {
					if (game.hasPlayer(target => player.canUse({ name: "sha", isCard: true }, target) && get.attitude(player, target) < 0)) {
						return 10;
					}
					return 1;
				}
				return 0;
			},
		},
	},
//#noname-kit-end skill:shuoye_jietian
};

export { characters, skills, translates, titles };
