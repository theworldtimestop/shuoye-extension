import { lib, game, ui, get, ai, _status } from "noname";
import characters from "./character.js";
import cards from "./card.js";
import pinyins from "./pinyin.js";
import skills from "./skill.js";
import translates from "./translate.js";
import characterIntros from "./intro.js";
import characterFilters from "./characterFilter.js";
import characterTitles from "./characterTitle.js";
import characterReplaces from "./characterReplace.js";
import dynamicTranslates from "./dynamicTranslate.js";
import voices from "./voices.js";
import { characterSort, characterSortTranslate } from "./sort.js";
import { characters as epicCharacters, skills as epicSkills, translates as epicTranslates, titles as epicTitles } from "./epicThree.js";

game.import("character", function () {
	const shuoye = {
		name: "shuoye",
		connect: true,
		character: { ...characters, ...epicCharacters },
		characterSort: {
			shuoye: characterSort,
		},
		characterFilter: { ...characterFilters },
		characterTitle: {...characterTitles, ...epicTitles},
		characterSubstitute: {
			shuoye_ifwutiaowu: [["shuoye_ifwutiaowu_awaken", ["ext:朔夜/image/shuoye_ifwutiaowu_awaken.jpg"]]],
			shuoye_weiyan: [
				["shuoye_weiyan_achieve", ["ext:朔夜/image/shuoye_weiyan_achieve.jpg"]],
				["shuoye_weiyan_fail", ["ext:朔夜/image/shuoye_weiyan_fail.jpg"]],
			],
			shuoye_miaoshitiannv: [["shuoye_miaoshitiannv_shadow", ["ext:朔夜/image/character/shuoye_miaoshitiannv_shadow.jpg"]]],
			shuoye_huangquan: [["shuoye_huangquan_shadow", ["ext:朔夜/image/character/shuoye_huangquan_shadow.jpg"]]],
			shuoye_fengchuanxiangzi: [["shuoye_fengchuanxiangzi_shadow", ["ext:朔夜/image/character/shuoye_fengchuanxiangzi_shadow.jpg"]]],
			shuoye_tianqixinghun: [["shuoye_tianqixinghun_shadow", ["ext:朔夜/image/character/shuoye_tianqixinghun_shadow.jpg"]]],
			shuoye_zuguoren: [["shuoye_zuguoren_awaken", ["ext:朔夜/image/character/shuoye_zuguoren_awaken.png"]]],
			shuoye_kongyuanxingzhe: [["shuoye_kongyuanxingzhe_long", ["ext:朔夜/image/character/shuoye_kongyuanxingzhe_long.jpg"]]],
			shuoye_puqishenfu: [["shuoye_puqishenfu_tianzao", ["ext:朔夜/image/character/shuoye_puqishenfu_tianzao.png"]]],
			shuoye_yiguyoutai: [["shuoye_yiguyoutai_2", ["ext:朔夜/image/shuoye_yiguyoutai_2.jpg"]]],
			shuoye_liixiang: [["shuoye_liixiang_fo", ["ext:朔夜/image/shuoye_liixiang_fo.jpg"]]],
			shuoye_yuantoushanwo: [["shuoye_yuantoushanwo_awaken", ["ext:朔夜/image/shuoye_yuantoushanwo_awaken.jpg"]]],
			// 【帝皇之戎】阴形态（帝皇之御）立绘，由【万煌】切换时 player.changeSkin 调用
			shuoye_dihuangzhirong: [["shuoye_dihuangzhirong_yu", ["ext:朔夜/image/shuoye_dihuangzhirong_yu.png"]]],
		},
		dynamicTranslate: { ...dynamicTranslates },
		characterIntro: { ...characterIntros },
		characterReplace: { ...characterReplaces },
		card: { ...cards },
		skill: { ...skills, ...epicSkills },
		translate: { ...translates, ...epicTranslates, ...voices, ...characterSortTranslate },
		pinyins: { ...pinyins },
	};
    // 【阳间模式】iF五条悟的【无量空处】在该模式下整技禁用（filter 见 skill.js）。
    // 联机是主机权威：这里只记下原描述、按本机配置给个初始值；
    // 真正生效的值由房主在 gameStart / roundStart 广播的 _status.shuoyeQumoshi 决定
    // （单机等同本机配置；客机没收到广播前也先按本机配置走）。
    if (typeof lib.shuoyeIfWuliangInfoBase !== "string") {
        lib.shuoyeIfWuliangInfoBase = shuoye.translate["shuoye_if_wuliang_info"];
    }
    if (lib.shuoyeIf && lib.shuoyeIf.qumoshi()) {
        shuoye.translate["shuoye_if_wuliang_info"] = "该模式不可用。";
    }
    // 【阳间模式】维特鲁姆手刀 / 维特鲁姆锁喉 在该模式下整技禁用（filter 见 skill.js）。
    // 与【无量空处】一致：这里只存原描述并给个初始值，真正生效的值由房主广播的
    // _status.shuoyeQumoshi 决定（见 lib.shuoyeIf.setQumoshi → refreshWeitelumuInfo）。
    if (!lib.shuoyeWeitelumuInfoBase) {
        lib.shuoyeWeitelumuInfoBase = {
            shuoye_weitelumu_shoudao: shuoye.translate["shuoye_weitelumu_shoudao_info"],
            shuoye_weitelumu_suohou: shuoye.translate["shuoye_weitelumu_suohou_info"],
            shuoye_weitelumu_bainian: shuoye.translate["shuoye_weitelumu_bainian_info"],
            shuoye_wudi: shuoye.translate["shuoye_wudi_info"],
        };
    }
    if (lib.shuoyeIf && lib.shuoyeIf.qumoshi()) {
        shuoye.translate["shuoye_weitelumu_shoudao_info"] = "该模式不可用。";
        shuoye.translate["shuoye_weitelumu_suohou_info"] = "该模式不可用。";
        shuoye.translate["shuoye_weitelumu_bainian_info"] = "你每回合首次受到或造成伤害后，可与其同时失去一点体力。";
        shuoye.translate["shuoye_wudi_info"] = "锁定技，你体力值减少一点后，下一次摸牌数+1、下一次回复量+1/2（向下取整）；你每次脱离濒死状态后，本局游戏你造成的伤害+1。";
    }
    // 【阳间模式】幻羽：该模式下取消「若无同花色牌则造成【绝毁伤害】」（判定见 skill.js 的 shuoye_huanyu）
    if (!lib.shuoyeHuanyuInfoBase) {
        lib.shuoyeHuanyuInfoBase = shuoye.translate["shuoye_huanyu_info"];
    }
    if (lib.shuoyeIf && lib.shuoyeIf.qumoshi()) {
        shuoye.translate["shuoye_huanyu_info"] = "你对一名角色使用牌时随机弃置其一张与此牌花色相同的牌。";
    }
    // 【阳间模式】星火：该模式下取消「受到你的伤害+1」（判定见 skill.js 的 shuoye_xinghuo）。
    // 与【无量空处】/【维特鲁姆】一致：这里只存原描述并给个初始值，真正生效的值由房主广播的
    // _status.shuoyeQumoshi 决定（见 lib.shuoyeIf.setQumoshi → refreshXinghuoInfo）。
    if (!lib.shuoyeXinghuoInfoBase) {
        lib.shuoyeXinghuoInfoBase = shuoye.translate["shuoye_xinghuo_info"];
    }
    if (lib.shuoyeIf && lib.shuoyeIf.qumoshi()) {
        shuoye.translate["shuoye_xinghuo_info"] = "锁定技，拥有【讨】角色无法使用或打出闪。";
    }
    // 【讨】的标记说明也随模式变（悬停文案在 skill.js 的 shuoye_dihuang_tao.intro 里实时判定）
    if (!lib.shuoyeTaoInfoBase) {
        lib.shuoyeTaoInfoBase = shuoye.translate["shuoye_dihuang_tao_info"];
    }
    if (lib.shuoyeIf && lib.shuoyeIf.qumoshi()) {
        shuoye.translate["shuoye_dihuang_tao_info"] = "拥有【讨】的角色无法使用或打出闪；该角色脱离濒死状态后移除【讨】。";
    }
    // 【阳间模式】黄金之杯：该模式下初始【影】由 666 张削为 66 张
    // （取值在 skill.js 的 lib.shuoyeNilu.cupSize，判定见 shuoye_huangjinzhibei）。
    // 与其他技能一致：这里只存原描述并落一次初始值，真正生效的值由房主广播的
    // _status.shuoyeQumoshi 决定（见 lib.shuoyeIf.setQumoshi → refreshHuangjinzhibeiInfo）。
    if (!lib.shuoyeHuangjinzhibeiInfoBase) {
        lib.shuoyeHuangjinzhibeiInfoBase = shuoye.translate["shuoye_huangjinzhibei_info"];
    }
    if (lib.shuoyeIf && typeof lib.shuoyeIf.refreshHuangjinzhibeiInfo === "function") {
        lib.shuoyeIf.refreshHuangjinzhibeiInfo(shuoye.translate);
    }
    lib.translate["shuoye_character_config"] = "朔夜";
    if (!lib.config[`extension_朔夜_characterPack_shuoye_enable`]) {
		game.saveExtensionConfig("朔夜", "characterPack_shuoye_enable", true);
		lib.config.characters.add("shuoye");
		game.saveConfig("characters", lib.config.characters);
	}
    return shuoye;
});

