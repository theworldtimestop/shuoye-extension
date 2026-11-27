import { lib, game, ui, get, ai, _status } from '../../../../noname.js'
import characters from './character.js'
import { characters as epicCharacters } from './epicThree.js'

const banCharacters = [
	"shuoye_u_aoerjiamali",
	"shuoye_tianqixinghun",
	"shuoye_taikongyishitaer",
	"shuoye_shuoye",
	"shuoye_zhende",
	"shuoye_zhenshiqiaotelude",
	"shuoye_kongzhilvzhe",
	"shuoye_cuige",
];

// 【区模式】开启后仅保留这些武将
const quModeAllow = [
	"shuoye_weiershi",
	"shuoye_ailisi",
	"shuoye_ruolian",
	"shuoye_chengjinji",
	"shuoye_wutiaowu",
	"shuoye_ifwutiaowu",
	"shuoye_huoguang",
	"shuoye_dilutianfeng",
	"shuoye_qiaolienide",
	"shuoye_xugouji",
	"shuoye_xituo",
	"shuoye_lixin",
	"shuoye_yiguyoutai",
	"shuoye_majunke",
	"shuoye_yuantoushanwo",
	"shuoye_shebengnainyin",
	"shuoye_quanmoutianbaohuo",
	"shuoye_mankanshizhenzi",
	"shuoye_luotong",
	"shuoye_weiyan",
	"shuoye_yizhisilang",
	"shuoye_richekuanjian",
	"shuoye_leidianyayi",
	"shuoye_sanlunxia",
	"shuoye_nuolan",
	"shuoye_make",
	"shuoye_zhaoyun",
	"shuoye_nilu",
	"shuoye_dihuangzhirong",
	"shuoye_shenguojia",
	// 【黄天】势 / 不胜传说
	"shuoye_huangtian",
	// 【SP怒涛·沧岚】
	"shuoye_sp_nutaocanglan",
	// 【空元行者】/【空崎日奈】（阳间模式下这两个角色的【神忏福音】【终幕】整技禁用）
	"shuoye_kongyuanxingzhe",
	"shuoye_kongqirinai",
];

const characterFilters = {};
for (const name of [...Object.keys(characters), ...Object.keys(epicCharacters)]) {
	characterFilters[name] = () => {
		if (lib.config.extension_朔夜_qumoshi) {
			return quModeAllow.includes(name);
		}
		if (banCharacters.includes(name)) {
			return !lib.config.extension_朔夜_jinmiao;
		}
		return true;
	};
}

// 【李信】光明神/弑杀神为隐藏形态：默认不出现在选将列表，
// 只能通过【一念】变身进入；开启「李信调试」后才作为可选武将显示。
for (const name of ["shuoye_lx_guang", "shuoye_lx_an"]) {
	characterFilters[name] = () => {
		if (lib.config.extension_朔夜_qumoshi) {
			return false;
		}
		// 录像复现时保持可见：否则关掉「李信调试」后候选池会少两个，选将结果顺位错位
		if (typeof _status !== "undefined" && _status.video) {
			return true;
		}
		return !!lib.config.extension_朔夜_lixin_debug;
	};
}

export default characterFilters;
