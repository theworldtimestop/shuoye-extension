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
];

// 【区模式】开启后仅保留这些武将
const quModeAllow = [
	"shuoye_weiershi",
	"shuoye_ailisi",
	"shuoye_ruolian",
	"shuoye_chengjinji",
	"shuoye_wutiaowu",
	"shuoye_huoguang",
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

export default characterFilters;
