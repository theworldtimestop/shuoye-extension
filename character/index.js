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
    // 【阳间模式】萝统·仁抗：仅该模式下两个分支各限一次（filter/content 见 skill.js）。
    // 同样只记下原描述、按本机配置给初始值；模式变化时由 setQumoshi 的广播回调刷新。
    if (typeof lib.shuoyeRenkangInfoBase !== "string") {
        lib.shuoyeRenkangInfoBase = shuoye.translate["shuoye_renkang_info"];
    }
    if (lib.shuoyeIf && lib.shuoyeIf.qumoshi()) {
        shuoye.translate["shuoye_renkang_info"] = "每回合各限一次，" + lib.shuoyeRenkangInfoBase;
    }
    lib.translate["shuoye_character_config"] = "朔夜";
    if (!lib.config[`extension_朔夜_characterPack_shuoye_enable`]) {
		game.saveExtensionConfig("朔夜", "characterPack_shuoye_enable", true);
		lib.config.characters.add("shuoye");
		game.saveConfig("characters", lib.config.characters);
	}
    return shuoye;
});

