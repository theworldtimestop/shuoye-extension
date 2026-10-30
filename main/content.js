import { lib, game, ui, get, ai, _status } from '../../../../noname.js'
import update from "../update.js";
import { EXTENSION_VERSION } from "../version.js";
export async function content(config, pack) {
    // 【祈本里香】隐藏武将：不进选将池，仅由乙骨忧太【纯爱】召唤
    if (!lib.character["shuoye_liixiang"]) {
        lib.character["shuoye_liixiang"] = [
            "female",
            "qun",
            3,
            ["shuoye_liixiang_chunai", "shuoye_lingzhou", "shuoye_chengfo", "shuoye_liixiang_ai"],
            ["img:extension/朔夜/image/shuoye_liixiang.png", "unseen"],
        ];
        lib.character["shuoye_liixiang"].img = "extension/朔夜/image/shuoye_liixiang.png";
        // 不出现在选将框（引擎遍历 lib.character 时遇到 isUnseen / characterFilter 都会跳过）
        lib.character["shuoye_liixiang"].isUnseen = true;
        if (lib.characterFilter) {
            lib.characterFilter["shuoye_liixiang"] = () => false;
        }
    }
    lib.translate["shuoye_liixiang"] = "祈本里香";
    lib.translate["shuoye_summon"] = "召唤";
    // 普奇神父【白蛇】：不能对自己的牌使用无懈可击
    const patchWuxie = () => {
        const info = lib.skill && lib.skill["_wuxie"];
        if (!info || typeof info.filter !== "function" || info.filter._shuoyeCompat) {
            return;
        }
        const originalFilter = info.filter;
        const patchedFilter = function (event, player) {
            if (player && player.hasSkill && player.hasSkill("shuoye_baishe") && event && event.player === player) {
                return false;
            }
            return originalFilter.apply(this, arguments);
        };
        patchedFilter._shuoyeCompat = true;
        info.filter = patchedFilter;
    };
    patchWuxie();
    if (lib.arenaReady) {
        lib.arenaReady.push(patchWuxie);
    }
    // 可复制的技能黑名单：某些技能被其他角色获得后会卡死/报错，直接不让【灵咒】记录。
    // 发现新的问题技能时，把技能 id 加进这个数组即可（联机两端都需要同版本）。
    if (!Array.isArray(lib.shuoyeCopyBlacklist)) {
        lib.shuoyeCopyBlacklist = [];
    }

    // 召唤物（里香）的友敌判定：除了在 lx.ai 上挂 mod，再给 get.attitude 加一层
    // 兜底（斗地主等模式里 AI 可能不经过 mod、或被缓存影响）
    if (typeof get.attitude === "function" && !get.attitude._shuoyeSummonPatched) {
        const shuoyeOrigAttitude = get.attitude;
        const shuoyeCampOf = lib.shuoyeCampOf;
        const shuoyePatchedAttitude = function (from, to) {
            const att = shuoyeOrigAttitude.apply(this, arguments);
            try {
                if (!to || !to.storage || !to.storage.shuoye_summon || !from || from === to) return att;
                const players = game.players.concat(game.dead);
                const master = players.find((p) => p.playerid == to.storage.shuoye_master_pid);
                if (!master) return att;
                if (from === master) return 999;
                const myCamp = shuoyeCampOf(master);
                if (myCamp !== "other" && shuoyeCampOf(from) === myCamp) return Math.max(att, 5);
            } catch (e) {}
            return att;
        };
        shuoyePatchedAttitude._shuoyeSummonPatched = true;
        get.attitude = shuoyePatchedAttitude;
    }

    // 容错：联机时技能里的函数会被序列化成字符串发到另一端再 eval，
    // 带闭包的函数（如一中杀【十种影法术】里的 list2）重执行时会抛 ReferenceError。
    // 给 get.infoFuncOL 重建出来的函数包一层 try/catch：只记录日志，不弹窗、不中断对局。
    if (typeof get.infoFuncOL === "function" && !get.infoFuncOL._shuoyeGuard) {
        const shuoyeInfoFuncOL = get.infoFuncOL;
        const shuoyeGuardedInfoFuncOL = function (info) {
            let fn;
            try {
                fn = shuoyeInfoFuncOL.apply(this, arguments);
            } catch (e) {
                console.error("[朔夜] 远程函数重建失败：", e);
                return function () {};
            }
            if (typeof fn !== "function") return fn;
            const guarded = function () {
                try {
                    return fn.apply(this, arguments);
                } catch (e) {
                    console.error("[朔夜] 远程函数执行出错（已拦截，不影响对局）：", e);
                    return undefined;
                }
            };
            try {
                guarded.toString = () => fn.toString();
            } catch (e) {}
            return guarded;
        };
        shuoyeGuardedInfoFuncOL._shuoyeGuard = true;
        // 新版引擎用 freezeSlot 冻结了 Get.prototype.infoFuncOL，直接赋值会抛
        // TypeError: Cannot assign to read only property → 改为在实例上定义同名自有属性
        try {
            Object.defineProperty(get, "infoFuncOL", {
                value: shuoyeGuardedInfoFuncOL,
                writable: true,
                configurable: true,
                enumerable: false,
            });
        } catch (e) {
            console.error("[朔夜] 无法挂载 infoFuncOL 容错（引擎已冻结该属性，跳过）：", e);
        }
    }

    // 兼容补丁：一中杀 重写了【桃】的 selectTarget，但没判空 player；
    // 错乱时空/鸽府包的 playerEnabled 链会在没有 player 的情况下调它 → 崩。这里补一层保护。
    // 兼容补丁：鸽府包会把一段“调用 game.gflib_liuzhi*()”的函数广播到客机，
    // 但客机上这些函数可能不存在（版本不一致/未加载）→ TypeError。
    // 缺的环节只能补空函数（面板不显示，但不报错、不中断对局）。已有函数时不覆盖。
    const patchGflibLiuzhi = () => {
        try {
            const names = ["gflib_liuzhiShowPanel", "gflib_liuzhiHidePanel", "gflib_liuzhiRender", "gflib_liuzhiSync", "updateGflibLiuzhi"];
            for (const name of names) {
                if (typeof game[name] !== "function") game[name] = function () {};
            }
        } catch (e) {}
    };
    patchGflibLiuzhi();
    if (lib.arenaReady) {
        lib.arenaReady.push(patchGflibLiuzhi);
    }

    const patchTaoSelectTarget = () => {
        try {
            const info = lib.card && lib.card["tao"];
            if (!info || typeof info.selectTarget !== "function" || info.selectTarget._shuoyeCompat) return;
            const original = info.selectTarget;
            const patched = function (card, player) {
                // 无 player 时返回【桃】的默认目标数 1，不进入其他扩展的特殊判定
                if (!player) return 1;
                return original.apply(this, arguments);
            };
            patched._shuoyeCompat = true;
            info.selectTarget = patched;
        } catch (e) {}
    };
    patchTaoSelectTarget();
    if (lib.arenaReady) {
        lib.arenaReady.push(patchTaoSelectTarget);
    }

    // 胜负结算：召唤物（里香）不参与任何模式的胜负判定。
    // 具体实现统一在 main/precontent.js 的“属性陷阱”里（模式重新赋值 / 别的扩展再包装都自动生效）：
    // 判定期间把召唤物从 game.players / game.dead 里临时摘出，判定结束按原索引放回。
    // 这里保留旧入口名，召唤时再调用一次（幂等），并在 arenaReady 兜底补装。
    const patchSummonResult = () => {
        try {
            if (typeof lib.shuoyeInstallSummonCheckResultTrap === "function") {
                lib.shuoyeInstallSummonCheckResultTrap();
            }
        } catch (e) {}
    };
    lib.shuoyePatchDoudizhuResult = patchSummonResult;
    lib.shuoyePatchIdentityResult = patchSummonResult;
    patchSummonResult();
    if (lib.arenaReady) {
        lib.arenaReady.push(patchSummonResult);
    }

    // 预加载里香立绘：否则召唤瞬间会先显示默认剪影，等图下载完才刷出卡图
    if (lib.arenaReady) {
        lib.arenaReady.push(() => {
            try {
                const paths = [
                    "extension/朔夜/image/shuoye_liixiang.png",
                    "extension/朔夜/image/shuoye_liixiang_fo.jpg",
                ];
                for (const path of paths) {
                    const img = new Image();
                    img.src = lib.assetURL + encodeURI(path);
                }
            } catch (e) {}
        });
    }
    // 【宙刻】“回转”特殊名词解释
    if (lib.poptip) {
        lib.poptip.add({
            id: "shuoye_huizhuan",
            name: "回转",
            info: "每名角色回合开始时回转一刻，你摸一张牌并令体力上限-1；回转期间不可正转。转至0刻后停止回转，然后可重新正转。",
        });
        // 【具咒】决斗细则（点击【决斗】查看）
        lib.poptip.add({
            id: "shuoye_juzhou_duel",
            name: "决斗",
            info: "此决斗伤害为1+双方手牌数之和的一半（向上取整）；双方的基本牌均视为【杀】；每有一方打出一张【杀】响应，此伤害-1。",
        });
        // 真赝相爱②改写后【具咒】的决斗：无增伤/减伤
        lib.poptip.add({
            id: "shuoye_juzhou_duel2",
            name: "决斗",
            info: "此决斗伤害固定为1点，无增伤或减伤；双方的基本牌均视为【杀】。",
        });
        // 真赝相爱②改写后的【具咒】全文（点击【具咒】查看）
        lib.poptip.add({
            id: "shuoye_juzhou_rewritten",
            name: "具咒",
            info: "你的回合限一次，开始时或出牌阶段，你可选择自己或里香失去一点体力，你与一名角色【决斗】，期间双方基本牌均视为【杀】。你与因此受到伤害的角色各摸一张牌，若受到伤害角色非你则使用次数+1，然后发动一次【模仿】。",
        });
    }
    // 评级：SSS -> legend，SS -> epic，S -> rare，A -> junk
    const shuoyeRarity = {
        legend: ["shuoye_u_aoerjiamali", "shuoye_taikongyishitaer", "shuoye_shuoye", "shuoye_zhenshiqiaotelude", "shuoye_yiguyoutai"],
        epic: ["shuoye_chengjinji", "shuoye_miaoshitiannv", "shuoye_tianqixinghun", "shuoye_xituo", "shuoye_qiaolienide", "shuoye_chongtiansiling", "shuoye_luxi", "shuoye_wuweijuezhe", "shuoye_kongyuanxingzhe", "shuoye_wuxinchan"],
        rare: [
            "shuoye_zuguoren", "shuoye_ailisi", "shuoye_feiniaomashi", "shuoye_fengchuanxiangzi",
            "shuoye_nutaocanglan", "shuoye_wujishengwu", "shuoye_wutiaowu", "shuoye_xier",
            "shuoye_yuanlv", "shuoye_diyabolo", "shuoye_fuhua", "shuoye_kongzhilvzhe",
            "shuoye_puqishenfu", "shuoye_xugouji", "shuoye_aertuoliya", "shuoye_zhende",
            "shuoye_huangquan", "shuoye_kongqirinai", "shuoye_wenyang", "shuoye_ying",
            "shuoye_weiyue", "shuoye_huoguang",
        ],
        junk: ["shuoye_xingti", "shuoye_weiershi", "shuoye_ruolian"],
    };
    // 返回菜单时清理坐杀博徒的残留演出（循环 BGM、金光、视频层）
    try {
        lib.onfree.push(function () {
            try {
                const glows = document.querySelectorAll(".szs-glow");
                for (let i = 0; i < glows.length; i++) {
                    if (glows[i].parentNode) glows[i].parentNode.removeChild(glows[i]);
                }
            } catch (e) {}
            try {
                const leftovers = document.querySelectorAll(".szs-videowrap, .szs-overlay, .szs-nojackpot");
                for (let i = 0; i < leftovers.length; i++) {
                    if (leftovers[i].parentNode) leftovers[i].parentNode.removeChild(leftovers[i]);
                }
            } catch (e) {}
            try {
                const info = lib.skill.shuoye_zuosha;
                if (info && typeof info.stopJackpotBgm === "function") info.stopJackpotBgm();
            } catch (e) {}
        });
    } catch (e) {}
    if (lib.rank && lib.rank.rarity) {
        const allRarityIds = Object.values(shuoyeRarity).flat();
        for (const tier of ["legend", "epic", "rare", "junk"]) {
            const list = lib.rank.rarity[tier];
            if (!Array.isArray(list)) continue;
            for (const id of allRarityIds) {
                const index = list.indexOf(id);
                if (index >= 0) list.splice(index, 1);
            }
        }
        for (const [tier, ids] of Object.entries(shuoyeRarity)) {
            const list = lib.rank.rarity[tier];
            if (!Array.isArray(list)) continue;
            for (const id of ids) {
                if (!list.includes(id)) list.push(id);
            }
        }
    }
    // 坐杀博徒：抽奖动画直接挂在技能对象上（skill.js 的 playAnimation / shuoye_zuosha_anim.effect），不再依赖 init 补丁

    // 启动时静默检查线上更新（未手动关闭即执行）
    if (lib.config.extension_朔夜_auto_update !== false && navigator.onLine) {
        update(false, EXTENSION_VERSION).catch(() => {});
    }
}