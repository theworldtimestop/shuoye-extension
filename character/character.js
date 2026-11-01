import { lib } from "noname";

const characters = {
    //怒涛沧岚
//#noname-kit-begin character:shuoye_nutaocanglan
    shuoye_nutaocanglan: {
        sex: "female",
        hp: 2,
        maxHp: 3,
        hujia: 1,
        group: "wei",
        skills: ["shuoye_canghai", "shuoye_yongshi", "shuoye_qingtian"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_nutaocanglan
//#noname-kit-begin character:shuoye_huoguang
    shuoye_huoguang: {
        sex: "male",
        hp: 4,
        group: "wei",
        skills: ["shuoyekuangren", "shuoyejitao"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_huoguang
//#noname-kit-begin character:shuoye_wuxinchan
    shuoye_wuxinchan: {
        sex: "female",
        hp: 3,
        group: "shu",
        skills: ["shuoyecangyin"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_wuxinchan
//#noname-kit-begin character:shuoye_weiyue
    shuoye_weiyue: {
        sex: "female",
        hp: 3,
        hujia: 1,
        group: "wei",
        skills: ["shuoyexiaoxiang"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_weiyue
//#noname-kit-begin character:shuoye_wujishengwu
    shuoye_wujishengwu: {
        sex: "male",
        hp: 4,
        group: "wei",
        skills: ["shuoyeyingyao", "shuoyewuzhu", "shuoyeweiqie", "shuoyetuoshi"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_wujishengwu
//#noname-kit-begin character:shuoye_zhenshiqiaotelude
    shuoye_zhenshiqiaotelude: {
        sex: "male",
        hp: 5,
        hujia: 3,
        group: "qun",
        skills: ["shuoyejinxuan", "shuoyekuangyan", "shuoyehuanghe"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_zhenshiqiaotelude
//#noname-kit-begin character:shuoye_miaoshitiannv
    shuoye_miaoshitiannv: {
        sex: "female",
        hp: 3,
        group: "shen",
        skills: ["shuoyefushi", "shuoyeweilian"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_miaoshitiannv
//#noname-kit-begin character:shuoye_wutiaowu
    shuoye_wutiaowu: {
        sex: "male",
        hp: 4,
        group: "wei",
        skills: ["shuoyexiaxian", "shuoyeshushi", "shuoyewuliang"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_wutiaowu
//#noname-kit-begin character:shuoye_u_aoerjiamali
    shuoye_u_aoerjiamali: {
        sex: "female",
        hp: 4,
        group: "shen",
        skills: ["shuoye_xuanyan", "shuoye_jingtian", "shuoye_zhongji", "shuoye_ruli"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_u_aoerjiamali
//#noname-kit-begin character:shuoye_tianqixinghun
    shuoye_tianqixinghun: {
        sex: "female",
        hp: 3,
        group: "shen",
        skills: ["shuoyexingqi", "shuoyemengjue", "shuoyezhouke", "shuoyetaixu"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_tianqixinghun
//#noname-kit-begin character:shuoye_zuguoren
    shuoye_zuguoren: {
        sex: "male",
        hp: 4,
        group: "shen",
        skills: ["shuoyechaoneng", "shuoyeqiuxin", "shuoyedengshen"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_zuguoren
//#noname-kit-begin character:shuoye_puqishenfu
    shuoye_puqishenfu: {
        sex: "male",
        hp: 3,
        group: "shu",
        skills: ["shuoye_baishe"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_puqishenfu
//#noname-kit-begin character:shuoye_kongyuanxingzhe
    shuoye_kongyuanxingzhe: {
        sex: "male",
        hp: 4,
        group: "qun",
        skills: ["shuoye_kongwang", "shuoye_yueshi", "shuoye_shenchanguyin"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_kongyuanxingzhe
//#noname-kit-begin character:shuoye_xier
    shuoye_xier: {
        sex: "female",
        hp: 3,
        maxHp: 6,
        group: "wei",
        skills: ["shuoye_shuangsheng", "shuoye_yongheng", "shuoye_laoyin"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_xier
//#noname-kit-begin character:shuoye_shuoye
    shuoye_shuoye: {
        sex: "female",
        hp: 3,
        group: "wei",
        skills: ["shuoye_guanxing", "shuoye_jiugong", "shuoye_wuxing", "shuoye_bazhen"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_shuoye
//#noname-kit-begin character:shuoye_kongzhilvzhe
    shuoye_kongzhilvzhe: {
        sex: "female",
        hp: 3,
        group: "shu",
        skills: ["shuoye_benghuai", "shuoye_yakong", "shuoye_zhendang", "shuoye_xujie"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_kongzhilvzhe
//#noname-kit-begin character:shuoye_fuhua
    shuoye_fuhua: {
        sex: "female",
        hp: 2,
        maxHp: 7,
        group: "shu",
        skills: ["shuoye_xianzong", "shuoye_tianya", "shuoye_fusheng", "shuoye_duchen"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_fuhua
//#noname-kit-begin character:shuoye_xingti
    shuoye_xingti: {
        sex: "female",
        hp: 4,
        group: "shen",
        skills: ["shuoye_kuanghuan", "shuoye_lianjin"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_xingti
//#noname-kit-begin character:shuoye_yuanlv
    shuoye_yuanlv: {
        sex: "female",
        hp: 4,
        group: "wei",
        skills: ["shuoye_qunxing", "shuoye_qinxian", "shuoye_shangbian", "shuoye_xiezou"],
        trashBin: [],
        isAiForbidden: true,
    },
//#noname-kit-end character:shuoye_yuanlv
//#noname-kit-begin character:shuoye_ying
    shuoye_ying: {
        sex: "female",
        hp: 3,
        group: "jin",
        skills: ["shuoye_zhuyuan", "shuoye_eyao", "shuoye_jingtu", "shuoye_yimeng"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_ying
//#noname-kit-begin character:shuoye_diyabolo
    shuoye_diyabolo: {
        sex: "male",
        hp: 4,
        group: "shu",
        skills: ["dybl_shishan", "dybl_muming", "dybl_mengyan"],
        img: "extension/朔夜/image/character/shuoye_diyabolo.png",
        trashBin: [],
    },
//#noname-kit-end character:shuoye_diyabolo
//#noname-kit-begin character:shuoye_wenyang
    shuoye_wenyang: {
        sex: "female",
        hp: 3,
        maxHp: 4,
        hujia: 1,
        group: "jin",
        skills: ["shuoye_quedi", "shuoye_zhuifeng", "shuoye_choujue"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_wenyang
//#noname-kit-begin character:shuoye_luxi
    shuoye_luxi: {
        sex: "female",
        hp: 3,
        group: "qun",
        skills: ["shuoye_diedai", "shuoye_shouheng", "shuoye_lichang"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_luxi
//#noname-kit-begin character:shuoye_zhende
    shuoye_zhende: {
        sex: "female",
        hp: 2,
        maxHp: 3,
        hujia: 1,
        group: "qun",
        skills: ["shuoye_tuji", "shuoye_chouyan", "shuoye_molong", "shuoye_nupao"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_zhende
//#noname-kit-begin character:shuoye_aertuoliya
    shuoye_aertuoliya: {
        sex: "female",
        hp: 3,
        group: "qun",
        skills: ["shuoye_feichi", "shuoye_zhuangtian", "shuoye_yuedan", "shuoye_ranshao"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_aertuoliya
//#noname-kit-begin character:shuoye_taikongyishitaer
    shuoye_taikongyishitaer: {
        sex: "female",
        hp: 3,
        maxHp: 4,
        group: "shen",
        skills: ["shuoye_yuanchu", "shuoye_xinghuan", "shuoye_shenhe", "shuoye_shanyao"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_taikongyishitaer
//#noname-kit-begin character:shuoye_kongqirinai
    shuoye_kongqirinai: {
        sex: "female",
        hp: 3,
        group: "jin",
        skills: ["shuoye_zhongzhuang", "shuoye_zhongmu", "shuoye_lengjing", "shuoye_fengji"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_kongqirinai
//#noname-kit-begin character:shuoye_huangquan
    shuoye_huangquan: {
        sex: "female",
        hp: 3,
        maxHp: 4,
        group: "jin",
        skills: ["shuoye_sixiang", "shuoye_santu", "shuoye_yuzhan", "shuoye_fandu"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_huangquan
//#noname-kit-begin character:shuoye_feiniaomashi
    shuoye_feiniaomashi: {
        sex: "female",
        hp: 3,
        group: "wei",
        skills: ["shuoye_jijia", "shuoye_zhongzhan"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_feiniaomashi
//#noname-kit-begin character:shuoye_ailisi
    shuoye_ailisi: {
        sex: "female",
        hp: 3,
        group: "wei",
        skills: ["shuoye_qingsao", "shuoye_zhongshen", "shuoye_guanga"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_ailisi
//#noname-kit-begin character:shuoye_xugouji
    shuoye_xugouji: {
        sex: "female",
        hp: 3,
        maxHp: 4,
        hujia: 1,
        group: "wu",
        skills: ["shuoye_yixiang", "shuoye_yinyu", "shuoye_migong", "shuoye_xugou"],
        img: "extension/朔夜/image/character/shuoye_xugouji.png",
        trashBin: [],
    },
//#noname-kit-end character:shuoye_xugouji
//#noname-kit-begin character:shuoye_fengchuanxiangzi
    shuoye_fengchuanxiangzi: {
        sex: "female",
        hp: 3,
        hujia: 1,
        group: "wei",
        skills: ["shuoye_yuqi", "shuoye_weituan", "shuoye_renou"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_fengchuanxiangzi
//#noname-kit-begin character:shuoye_chongtiansiling
    shuoye_chongtiansiling: {
        sex: "female",
        hp: 2,
        maxHp: 4,
        hujia: 1,
        group: "qun",
        skills: ["shuoye_wuming", "shuoye_suodi", "shuoye_juedao"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_chongtiansiling
//#noname-kit-begin character:shuoye_weiershi
    shuoye_weiershi: {
        sex: "female",
        hp: 3,
        group: "wei",
        skills: ["shuoye_wanxiang", "shuoye_qiyuan"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_weiershi
//#noname-kit-begin character:shuoye_yiguyoutai
    shuoye_yiguyoutai: {
        sex: "male",
        hp: 2,
        group: "shu",
        skills: ["shuoye_chunai", "shuoye_mofang", "shuoye_juzhou", "shuoye_zhenyanxiangai"],
        img: "extension/朔夜/image/shuoye_yiguyoutai.jpg",
        trashBin: [],
    },
//#noname-kit-end character:shuoye_yiguyoutai
//#noname-kit-begin character:shuoye_ruolian
    shuoye_ruolian: {
        sex: "female",
        hp: 3,
        group: "jin",
        skills: ["shuoye_shenpan", "shuoye_buqu"],
        img: "extension/朔夜/image/shuoye_ruolian.jpg",
        trashBin: [],
    },
//#noname-kit-end character:shuoye_ruolian
//#noname-kit-begin character:shuoye_chengjinji
    shuoye_chengjinji: {
        sex: "male",
        hp: 4,
        group: "qun",
        skills: ["shuoye_zuosha"],
        img: "extension/朔夜/image/shuoye_chengjinji.jpg",
        trashBin: [],
    },
//#noname-kit-end character:shuoye_chengjinji
//#noname-kit-begin character:shuoye_dilutianfeng
    shuoye_dilutianfeng: {
        sex: "female",
        hp: 3,
        group: "shen",
        skills: ["shuoye_fazhou", "shuoye_fenghao", "shuoye_cangshu"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_dilutianfeng
//#noname-kit-begin character:shuoye_leinhaite
    shuoye_leinhaite: {
        sex: "male",
        hp: 4,
        group: "jin",
        skills: ["shuoye_kuimie", "shuoye_mingfu", "shuoye_luli"],
        img: "extension/朔夜/image/shuoye_leinhaite.jpg",
        trashBin: [],
    },
//#noname-kit-end character:shuoye_leinhaite
//#noname-kit-begin character:shuoye_longyan
    shuoye_longyan: {
        sex: "female",
        hp: 3,
        group: "wei",
        skills: ["shuoye_longqi"],
        img: "extension/朔夜/image/shuoye_longyan.jpg",
        trashBin: [],
    },
//#noname-kit-end character:shuoye_longyan
//#noname-kit-begin character:shuoye_lixin
    //【李信】一念神魔
    shuoye_lixin: {
        sex: "male",
        hp: 4,
        group: "qun",
        skills: ["shuoye_lx_huiren", "shuoye_lx_yinian", "shuoye_lx_beam_fx", "shuoye_lx_hpwatch", "shuoye_lx_hpsnap"],
        img: "extension/朔夜/image/shuoye_lixin.jpg",
        dieAudios: ["ext:朔夜/audio/die/shuoye_lixin1.mp3"],
        trashBin: [],
    },
//#noname-kit-end character:shuoye_lixin

};
for (let i in characters) {
    characters[i].img = characters[i].img || `extension/朔夜/image/character/${i}.jpg`;
}
export default characters;
