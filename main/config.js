import { lib, game, ui, get, ai, _status } from '../../../../noname.js';
import update from "../update.js";
import { EXTENSION_VERSION } from "../version.js";

export const config = {
    version_display: {
        name: `<span style="color:#ffa348">当前版本：v${EXTENSION_VERSION}</span>`,
        clear: true,
        onclick: function () {
            alert(`《朔夜》当前版本 v${EXTENSION_VERSION}\n下方「检查更新」可获取最新版本`);
        },
    },
    update_source: {
        name: `<font color="#9c27b0">更新镜像源`,
        init: "0",
        item: {
            0: "GitHub官方源(直连)",
            1: "gh-proxy全球镜像",
            2: "gh-proxy国内镜像",
            3: "tvv.tw镜像源",
        },
    },
    update_method: {
        name: `<font color="#2196f3">极速更新`,
        init: false,
        intro: "开启后，在线更新将跳过音频、视频和图片等大文件，仅更新 .js 和 .css 代码文件，显著加快更新速度。",
    },
    auto_update: {
        name: `<font color="#e91e63">自动检测更新`,
        init: true,
        intro: "启动游戏时自动检查更新",
    },
    check_update: {
        name: `<span style="color:#4caf50;text-decoration: underline">检查更新`,
        clear: true,
        onclick: async function () {
            this.innerHTML = `<span style="color:#f61515ff;text-decoration: underline">正在检测更新...`;
            try {
                await update(true, EXTENSION_VERSION);
                this.innerHTML = `<span style="color:#4caf50;text-decoration: underline">检查完成`;
            } catch {
                this.innerHTML = `<span style="color:#f44336;text-decoration: underline">更新失败`;
            }
            setTimeout(() => {
                this.innerHTML = `<span style="color:#4caf50;text-decoration: underline">检查更新`;
            }, 2000);
        },
    },
    jinmiao: {
        name: "禁秒",
        init: false,
        intro: "开启后禁用以下武将：U-奥尔加玛丽，希儿，太空伊什塔尔，朔夜，贞德，镇世·乔特鲁德，空之律者",
    },
    qumoshi: {
        name: "区模式",
        init: false,
        intro: "开启后只保留薇尔诗、爱丽丝、若怜、秤金次、五条悟、霍光、帝录天锋、乔列尼德、虚构集、希拓、丰川祥子、李信，其余朔夜武将全部禁用。",
    },
    quhua: {
        name: "区化",
        init: false,
        intro: "开启后封印如下技能：李信【一念】",
    },
    zuosha_debug: {
        name: "坐杀博徒调试",
        init: false,
        intro: "开启后，秤金次出牌阶段会出现「调试」按钮，可指定下次抽奖三张牌的花色、点数与牌名。",
    },
    lixin_debug: {
        name: "李信调试",
        init: false,
        intro: "关闭时，光明神·李信与弑杀神·李信为隐藏形态，不会出现在选将列表，只能通过【一念】变身进入；开启后二者作为可选武将出现在「观星」分区，便于单独调试。",
    },
}

export const help = {

}
export const files = {
    "character": [], "card": [], "skill": []
}