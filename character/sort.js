import characters from "./character.js";
const characterSort = {
	shuoye_sort_fate: ["shuoye_u_aoerjiamali", "shuoye_taikongyishitaer", "shuoye_aertuoliya", "shuoye_chongtiansiling", "shuoye_zhende", "shuoye_nilu"],
	shuoye_sort_sai: ["shuoye_miaoshitiannv", "shuoye_tianqixinghun", "shuoye_nutaocanglan", "shuoye_weiershi", "shuoye_wujishengwu", "shuoye_xituo", "shuoye_qiaolienide", "shuoye_wuweijuezhe", "shuoye_zhenshiqiaotelude", "shuoye_kongyuanxingzhe", "shuoye_dilutianfeng", "shuoye_leinhaite", "shuoye_longyan", "shuoye_shengyuxieyan"],
	shuoye_sort_1999: ["shuoye_xingti", "shuoye_yuanlv", "shuoye_xugouji", "shuoye_luxi"],
	shuoye_sort_guanxing: ["shuoye_zuguoren", "shuoye_fengchuanxiangzi", "shuoye_shuoye", "shuoye_ying", "shuoye_lixin", "shuoye_lx_guang", "shuoye_lx_an"],
	shuoye_sort_zhanfu: ["shuoye_majunke", "shuoye_yuantoushanwo", "shuoye_shebengnainyin", "shuoye_quanmoutianbaohuo", "shuoye_mankanshizhenzi", "shuoye_yizhisilang"],
	shuoye_sort_tongsu: ["shuoye_wenyang", "shuoye_luotong"],
	shuoye_sort_zhoushuhuizhan: ["shuoye_yiguyoutai", "shuoye_wutiaowu", "shuoye_ifwutiaowu", "shuoye_chengjinji", "shuoye_richekuanjian"],
	shuoye_sort_ba: ["shuoye_ailisi", "shuoye_feiniaomashi", "shuoye_kongqirinai"],
	shuoye_sort_bengbeng: ["shuoye_xier", "shuoye_fuhua", "shuoye_kongzhilvzhe", "shuoye_huangquan"],
	shuoye_sort_jojo: ["shuoye_diyabolo", "shuoye_puqishenfu"],
	shuoye_sort_qiongmingsanjie: ["shuoye_weiyue", "shuoye_huoguang", "shuoye_wuxinchan"],
	shuoye_sort_qunyou: ["shuoye_ruolian"],
	shuoye_sort_taren: ["shuoye_bojiaoyang"],
};

const list = Object.values(characterSort).flat();
for (const i in characters) {
	if (!list.includes(i)) {
		if (!characterSort.shuoye_sort_shuoye) {
			characterSort.shuoye_sort_shuoye = [];
		}
		characterSort.shuoye_sort_shuoye.push(i);
	}
}
const characterSortTranslate = {
	shuoye_sort_fate: "fate",
	shuoye_sort_sai: "赛尔号",
	shuoye_sort_1999: "1999",
	shuoye_sort_guanxing: "观星",
	shuoye_sort_ba: "BA",
	shuoye_sort_bengbeng: "崩坏",
	shuoye_sort_jojo: "JOJO",
	shuoye_sort_qiongmingsanjie: "穹明三杰",
	shuoye_sort_qunyou: "群友",
	shuoye_sort_zhoushuhuizhan: "咒术回战",
	shuoye_sort_zhanfu: "斩服少女",
	shuoye_sort_tongsu: "同素异形",
	shuoye_sort_taren: "他人设计",
};

export { characterSort, characterSortTranslate };
