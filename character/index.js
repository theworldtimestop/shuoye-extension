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
			shuoye_miaoshitiannv: [["shuoye_miaoshitiannv_shadow", ["ext:朔夜/image/character/shuoye_miaoshitiannv_shadow.jpg"]]],
			shuoye_huangquan: [["shuoye_huangquan_shadow", ["ext:朔夜/image/character/shuoye_huangquan_shadow.jpg"]]],
			shuoye_fengchuanxiangzi: [["shuoye_fengchuanxiangzi_shadow", ["ext:朔夜/image/character/shuoye_fengchuanxiangzi_shadow.jpg"]]],
			shuoye_tianqixinghun: [["shuoye_tianqixinghun_shadow", ["ext:朔夜/image/character/shuoye_tianqixinghun_shadow.jpg"]]],
			shuoye_zuguoren: [["shuoye_zuguoren_awaken", ["ext:朔夜/image/character/shuoye_zuguoren_awaken.png"]]],
			shuoye_kongyuanxingzhe: [["shuoye_kongyuanxingzhe_long", ["ext:朔夜/image/character/shuoye_kongyuanxingzhe_long.jpg"]]],
			shuoye_puqishenfu: [["shuoye_puqishenfu_tianzao", ["ext:朔夜/image/character/shuoye_puqishenfu_tianzao.png"]]],
			shuoye_yiguyoutai: [["shuoye_yiguyoutai_2", ["ext:朔夜/image/shuoye_yiguyoutai_2.jpg"]]],
			shuoye_liixiang: [["shuoye_liixiang_fo", ["ext:朔夜/image/shuoye_liixiang_fo.jpg"]]],
		},
		dynamicTranslate: { ...dynamicTranslates },
		characterIntro: { ...characterIntros },
		characterReplace: { ...characterReplaces },
		card: { ...cards },
		skill: { ...skills, ...epicSkills },
		translate: { ...translates, ...epicTranslates, ...voices, ...characterSortTranslate },
		pinyins: { ...pinyins },
	};
    lib.translate["shuoye_character_config"] = "朔夜";
    if (!lib.config[`extension_朔夜_characterPack_shuoye_enable`]) {
		game.saveExtensionConfig("朔夜", "characterPack_shuoye_enable", true);
		lib.config.characters.add("shuoye");
		game.saveConfig("characters", lib.config.characters);
	}
    return shuoye;
});

