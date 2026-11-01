import { lib, game, ui, get, ai, _status } from '../../../../noname.js'
import characters from './character.js'
import { characters as epicCharacters } from './epicThree.js'

const banCharacters = [
	"shuoye_u_aoerjiamali",
	"shuoye_xier",
	"shuoye_taikongyishitaer",
	"shuoye_shuoye",
	"shuoye_zhende",
	"shuoye_zhenshiqiaotelude",
	"shuoye_kongzhilvzhe",
];

// 【区模式】开启后仅保留这些武将
const quModeAllow = [
	"shuoye_weiershi",
	"shuoye_ailisi",
	"shuoye_ruolian",
	"shuoye_chengjinji",
	"shuoye_wutiaowu",
	"shuoye_huoguang",
	"shuoye_dilutianfeng",
	"shuoye_qiaolienide",
	"shuoye_xugouji",
	"shuoye_xituo",
	"shuoye_fengchuanxiangzi",
	"shuoye_lixin",
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
		return !!lib.config.extension_朔夜_lixin_debug;
	};
}

export default characterFilters;
