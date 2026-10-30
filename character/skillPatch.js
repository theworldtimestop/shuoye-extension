import { lib, game, ui, get, ai, _status } from "noname";

const skillPatch = {
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
			const suit = get.suit(result.card);
			if (result.bool) {
				const list = get.inpileVCardList(info => {
					const name = info[2], nature = info[3], type = get.type(name);
					if (nature) return false;
					return type == get.type2(result.card);
				}).filter(card => player.hasUseTarget({ name: card[2], nature: card[3] }));
				if (!list.length) return;
				if (!player.countCards("hes", card => get.suit(card) == suit)) return;
				const { bool, links } = await player.chooseButton(["是否将一张牌当下列一张牌使用？", [list, "vcard"]])
					.set("ai", function (button) {
						return _status.event.player.getUseValue({
							name: button.link[2],
							nature: button.link[3],
						});
					}).forResult();
				if (!bool || !links || !links.length) {
					return;
				}
				game.broadcastAll(
					function (card) {
						lib.skill.shuoye_qingsao_backup.viewAs = card;
					},
					{ name: links[0][2] },
				);
				const next = player.chooseToUse();
				next.set("qingsaoSuit", suit);
				next.set("filterCard", function (card, player2, event2) {
					return get.suit(card) == event2.qingsaoSuit;
				});
				next.set("openskilldialog", "将一张牌当做" + get.translation(links[0][2]) + "使用");
				next.set("norestore", true);
				next.set("addCount", false);
				next.set("_backupevent", "shuoye_qingsao_backup");
				next.set("custom", {
					add: {},
					replace: { window() { } },
				});
				next.backup("shuoye_qingsao_backup");
				if (!player.hasSkill("shuoye_guanga_effect")) {
					next.set("selectTarget", 1);
				}
				event.result = await next.forResult();
			} else {
				event.result = { bool: false };
			}
			if (event.result && (event.result.bool || !result.bool)) {
				if (get.position(result.card, true) == "d") {
					await player.gain(result.card);
				}
				if (player.getStat("skill").shuoye_qingsao) delete player.getStat("skill").shuoye_qingsao;
				player.addSkill("shuoye_qingsao_record");
				if (!player.getStorage("shuoye_qingsao_record").includes(suit)) {
					player.markAuto("shuoye_qingsao_record", [suit]);
				} else {
					await player.loseHp();
				}
			}
		},
		ai: {
			order: 8,
			result: {
				player: 1,
			},
		},
		subSkill: {
			backup: {},
			record: {
				charlotte: true,
				onremove: true,
			},
		},
	},
};

export default skillPatch;
