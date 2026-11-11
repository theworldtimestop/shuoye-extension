import { lib, game, ui, get, ai, _status } from '../../../../noname.js'
import update from "../update.js";
import { EXTENSION_VERSION } from "../version.js";
export async function content(config, pack) {
    // 【尼禄】自定义势力「兽」
    try {
        const shouGroupImage = "ext:朔夜/image/group_shou.png";
        if (!lib.group.includes("shou")) {
            game.addGroup("shou", "兽", "兽", { image: shouGroupImage });
        }
        lib.groupnature.shou = "firemm";
        // addGroup 的钩子在这时可能已经收工，卡片图和势力名显式补上，原版/十周年UI 都从这里取
        if (!lib.card["group_shou"] || !lib.card["group_shou"].image) {
            lib.card["group_shou"] = { fullskin: true, image: shouGroupImage };
        }
        lib.translate["group_shou"] = "兽势力";
    } catch (e) {}
    // 【尼禄】黄金之杯的【影】依赖 jsrg 包里的 ying 卡定义；
    // 若本局没有启用 jsrg 包，补一份最小的类型/名称定义用于显示。
    // 销毁只由黄金之杯自己创建的影补 destroyed（见 skill.js 的 getTopCards/initial），
    // 不改动其他来源的 ying 卡。
    try {
        const yingInfo = lib.card && lib.card.ying;
        if (!yingInfo) {
            lib.card.ying = {
                audio: true,
                fullskin: true,
                type: "basic",
                cardcolor: "spade",
                enable: false,
                getYing(count) {
                    const list = [];
                    if (typeof count !== "number") count = 1;
                    while (count--) list.push(game.createCard("ying", "spade", 1));
                    return list;
                },
                ai: { basic: { useful: 0, value: 0 } },
            };
        }
        if (!lib.translate.ying) lib.translate.ying = "影";
    } catch (e) {}
    // 【尼禄】调试开关：只有开了配置才把调试技能挂进武将技能表（没开时连名字和描述都不显示）
    try {
        const niluChar = lib.character && lib.character.shuoye_nilu;
        if (niluChar && Array.isArray(niluChar[3])) {
            const debugOn = !!lib.config["extension_朔夜_nilu_debug"];
            const idx = niluChar[3].indexOf("shuoye_nilu_debug");
            if (debugOn && idx < 0) niluChar[3].push("shuoye_nilu_debug");
            if (!debugOn && idx >= 0) niluChar[3].splice(idx, 1);
        }
    } catch (e) {}
    // 【尼禄】阵亡语音：显式指向扩展目录，否则引擎默认找 audio/die/shuoye_nilu.mp3（不存在）
    try {
        if (lib.character && lib.character.shuoye_nilu) {
            lib.character.shuoye_nilu.dieAudios = ["ext:朔夜/audio/die/shuoye_nilu1", "ext:朔夜/audio/die/shuoye_nilu2"];
        }
    } catch (e) {}
    // 【尼禄】击杀台词已并入黄金之杯子技能 shuoye_huangjinzhibei_kill，不再单独占技能位
    // 带样式的技能名（如【此身即无间】）：十周年UI 的技能栅会自己给名字套【】，
    // 照【坐杀博徒】的办法：外层文字设为 0 号字只留 span，再补一个「：」
    try {
        if (typeof document !== "undefined" && document.head && !document.getElementById("shuoye-styled-skillname-style")) {
            const style = document.createElement("style");
            style.id = "shuoye-styled-skillname-style";
            style.innerHTML =
                ".xskill > div[data-color]:has(span.shs-gold){font-size:0 !important;}" +
                ".xskill > div[data-color] span.shs-gold{font-size:16px !important;letter-spacing:0;}" +
                ".xskill > div[data-color]:has(span.shs-gold)::after{content:'：';font-size:16px;color:#5a4a72;}" +
                "@keyframes snfGlowPulse{0%,100%{opacity:.5;transform:scale(.97);}50%{opacity:.9;transform:scale(1.04);}}" +
                "@keyframes snfSpikePulse{0%,100%{opacity:.18;}50%{opacity:.95;}}" +
                "@keyframes snfRain{from{background-position:0 -120px;}to{background-position:0 0;}}" +
                ".shuoye-nilu-fx{position:absolute;pointer-events:none;z-index:2;overflow:visible;}" +
                ".shuoye-nilu-fx .snf-glow{position:absolute;inset:-8px;border-radius:8px;background:radial-gradient(circle at 50% 50%,rgba(255,40,40,.22) 0%,rgba(255,20,20,.1) 45%,rgba(180,0,0,0) 70%);filter:blur(4px);animation:snfGlowPulse 2.6s ease-in-out infinite;}" +
                ".shuoye-nilu-fx .snf-spike{position:absolute;width:8px;clip-path:polygon(50% 0%,88% 100%,12% 100%);background:linear-gradient(180deg,rgba(255,90,80,.95),rgba(220,20,20,.5) 60%,rgba(180,0,0,0));transform-origin:50% 100%;animation:snfSpikePulse 2.4s ease-in-out infinite;}" +
                ".shuoye-nilu-fx .snf-rain{position:absolute;inset:0;border-radius:6px;overflow:hidden;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='120' viewBox='0 0 72 120'%3E%3Cg fill='%238a0a0a'%3E%3Cpath d='M8 6c0 0-1.6 11-1.6 13.4a1.6 1.6 0 0 0 3.2 0C9.6 17 8 6 8 6z'/%3E%3Cpath d='M40 34c0 0-1.3 9-1.3 11a1.3 1.3 0 0 0 2.6 0C41.3 43 40 34 40 34z'/%3E%3Cpath d='M62 70c0 0-1.5 10.4-1.5 12.7a1.5 1.5 0 0 0 3 0C63.5 80.4 62 70 62 70z'/%3E%3Cpath d='M24 88c0 0-1.2 8.4-1.2 10.2a1.2 1.2 0 0 0 2.4 0C25.2 96.4 24 88 24 88z'/%3E%3C/g%3E%3C/svg%3E\");background-size:72px 120px;background-repeat:repeat;animation:snfRain 1.8s linear infinite;opacity:.9;}";
            document.head.appendChild(style);
        }
    } catch (e) {}
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
    // 【尼禄】千幻的阵亡按钮只取 dieAudios 第一句，这里改成随机播两句之一
    const patchQhlyDie = () => {
        try {
            if (typeof window.qhly_playDieAudio !== "function" || window.qhly_playDieAudio._shuoyeNiluPatched) return;
            const originDie = window.qhly_playDieAudio;
            const patchedDie = function (name) {
                if (name === "shuoye_nilu") {
                    try {
                        const list = ["ext:朔夜/audio/die/shuoye_nilu1.mp3", "ext:朔夜/audio/die/shuoye_nilu2.mp3"];
                        game.playAudio(list[Math.floor(Math.random() * list.length)]);
                        return;
                    } catch (e) {}
                }
                return originDie.apply(this, arguments);
            };
            patchedDie._shuoyeNiluPatched = true;
            window.qhly_playDieAudio = patchedDie;
        } catch (e) {}
    };
    patchQhlyDie();
    if (lib.arenaReady) {
        lib.arenaReady.push(patchQhlyDie);
    }
    // 可复制的技能黑名单：某些技能被其他角色获得后会卡死/报错，直接不让【灵咒】记录。
    // 发现新的问题技能时，把技能 id 加进这个数组即可（联机两端都需要同版本）。
    if (!Array.isArray(lib.shuoyeCopyBlacklist)) {
        lib.shuoyeCopyBlacklist = [];
    }
    // 尼禄的技能依赖黄金之杯的私有存储，被复制后没有意义且会改掉对方的阶段表
    for (const skill of ["shuoye_huangjinzhibei", "shuoye_shouzhishuzi", "shuoye_huangjinjuchang"]) {
        if (!lib.shuoyeCopyBlacklist.includes(skill)) {
            lib.shuoyeCopyBlacklist.push(skill);
        }
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
            // 重建结果不能统一包成普通 function：
            // ① async 函数会失去 instance AsyncFunction，被 StepCompiler 当普通 content 重新编译；
            // ② StepCompiler 用原生 toString 取源码，包装函数闭包里的 fn 在新作用域不存在，调用即 ReferenceError。
            // 木牛流马 muniu_skill_backup.content 是 async，联机客机扣置后牌不进木牛、也没有移动提示，正是这个包装导致的。
            // 所以按原函数类型包装，普通函数原样返回。
            const tag = Object.prototype.toString.call(fn);
            if (tag === "[object AsyncGeneratorFunction]") {
                return async function* () {
                    try {
                        yield* fn.apply(this, arguments);
                    } catch (e) {
                        console.error("[朔夜] 远程函数执行出错（已拦截，不影响对局）：", e);
                    }
                };
            }
            if (tag === "[object AsyncFunction]") {
                return async function () {
                    try {
                        return await fn.apply(this, arguments);
                    } catch (e) {
                        console.error("[朔夜] 远程函数执行出错（已拦截，不影响对局）：", e);
                        return undefined;
                    }
                };
            }
            if (tag === "[object GeneratorFunction]") {
                return function* () {
                    try {
                        yield* fn.apply(this, arguments);
                    } catch (e) {
                        console.error("[朔夜] 远程函数执行出错（已拦截，不影响对局）：", e);
                        return undefined;
                    }
                };
            }
            return fn;
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
        legend: ["shuoye_u_aoerjiamali", "shuoye_taikongyishitaer", "shuoye_shuoye", "shuoye_zhenshiqiaotelude", "shuoye_yiguyoutai", "shuoye_lixin", "shuoye_shengyuxieyan", "shuoye_nilu"],
        epic: ["shuoye_chengjinji", "shuoye_miaoshitiannv", "shuoye_tianqixinghun", "shuoye_xituo", "shuoye_qiaolienide", "shuoye_chongtiansiling", "shuoye_luxi", "shuoye_wuweijuezhe", "shuoye_kongyuanxingzhe", "shuoye_wuxinchan", "shuoye_dilutianfeng", "shuoye_lx_guang", "shuoye_lx_an", "shuoye_richekuanjian", "shuoye_mankanshizhenzi"],
        rare: [
            "shuoye_zuguoren", "shuoye_ailisi", "shuoye_feiniaomashi", "shuoye_fengchuanxiangzi",
            "shuoye_nutaocanglan", "shuoye_wujishengwu", "shuoye_wutiaowu", "shuoye_xier",
            "shuoye_yuanlv", "shuoye_diyabolo", "shuoye_fuhua", "shuoye_kongzhilvzhe",
            "shuoye_puqishenfu", "shuoye_xugouji", "shuoye_aertuoliya", "shuoye_zhende",
            "shuoye_huangquan", "shuoye_kongqirinai", "shuoye_wenyang", "shuoye_ying",
            "shuoye_weiyue", "shuoye_huoguang", "shuoye_longyan",
            "shuoye_majunke", "shuoye_yuantoushanwo", "shuoye_shebengnainyin", "shuoye_quanmoutianbaohuo",
            "shuoye_luotong", "shuoye_yizhisilang",
        ],
        junk: ["shuoye_xingti", "shuoye_weiershi", "shuoye_ruolian"],
    };
    // 返回菜单时清理日车宽见的首轮演出（BGM、背景、视频）
    try {
        lib.onfree.push(function () {
            try {
                if (lib.shuoyeRicheStopShow) lib.shuoyeRicheStopShow();
            } catch (e) {}
        });
    } catch (e) {}
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

    // 老版本的默认镜像源是「全球镜像」，升级后一次性迁回官方源（手动改过的不会再动）
    if (!lib.config.extension_朔夜_update_source_migrated) {
        if (String(lib.config.extension_朔夜_update_source) === "1") {
            game.saveConfig("extension_朔夜_update_source", "0");
        }
        game.saveConfig("extension_朔夜_update_source_migrated", true);
    }

    // 【兼容 1.11.5】史纪包【奇正相生】的老式 step content 在同一 step 里同步读 result，
    // 选完标记时 result 还是 undefined，抛错后响应与后续伤害/获得牌全都不结算。
    // 检测到旧式写法就换成等价的异步实现；1.11.6 的官方 async 版本不会命中。
    try {
        const patchQizheng = () => {
            try {
                const info = lib.card && lib.card.qizhengxiangsheng;
                if (!info || typeof info.content !== "function") return;
                if (info.content._shuoyeQizhengPatch) return;
                if (!/"step 0"/.test(String(info.content))) return;
                info.content = async function (event, trigger, player) {
                    const { card, target } = event;
                    if (!event.qizheng_name) {
                        if (!player.isIn()) return;
                        const e1 = 1.5 * get.sgn(get.damageEffect(target, player, target));
                        let e2 = 0;
                        if (target.countGainableCards(player, "h") > 0 && !target.hasSkillTag("noh")) {
                            e2 = -1;
                        }
                        const es = target.getGainableCards(player, "e");
                        if (es.length) {
                            let max = 0;
                            for (const current of es) {
                                max = Math.max(max, get.value(current, target));
                            }
                            e2 = Math.min(e2, -max / 4);
                        }
                        let choice = "正兵";
                        if (Math.abs(e1 - e2) <= 0.3) {
                            choice = Math.random() < 0.5 ? "奇兵" : "正兵";
                        } else if (e1 < e2) {
                            choice = "奇兵";
                        }
                        const controlResult = await player
                            .chooseControl({
                                controls: ["奇兵", "正兵"],
                                prompt: `请选择${get.translation(target)}的标记`,
                            })
                            .set("choice", choice)
                            .set("ai", () => _status.event.choice)
                            .forResult();
                        if (controlResult.control) {
                            event.qizheng_name = controlResult.control;
                        }
                    }
                    let responseResult = { bool: false };
                    if (!event.directHit) {
                        const responseChoice = (() => {
                            if (target.hasSkillTag("useShan")) {
                                return "shan";
                            }
                            if (typeof event.qizheng_aibuff === "boolean") {
                                const shas = target.getCards("h", "sha");
                                const shans = target.getCards("h", "shan");
                                if (event.qizheng_aibuff) {
                                    if (shas.length >= Math.max(1, shans.length)) {
                                        return "shan";
                                    }
                                    if (shans.length > shas.length) {
                                        return "sha";
                                    }
                                    return false;
                                }
                                if (!shas.length || !shans.length) {
                                    return false;
                                }
                            }
                            const e1 = 1.5 * get.sgn(get.damageEffect(target, player, target));
                            let e2 = 0;
                            if (target.countGainableCards(player, "h") > 0 && !target.hasSkillTag("noh")) {
                                e2 = -1;
                            }
                            const es = target.getGainableCards(player, "e");
                            if (es.length) {
                                let max = 0;
                                for (const current of es) {
                                    max = Math.max(max, get.value(current, target));
                                }
                                e2 = Math.min(e2, -max / 4);
                            }
                            if (e1 - e2 >= 0.3) {
                                return "shan";
                            }
                            if (e2 - e1 >= 0.3) {
                                return "sha";
                            }
                            return "all";
                        })();
                        responseResult = await target
                            .chooseToRespond({
                                prompt: "请打出一张杀或闪响应奇正相生",
                                filterCard: (card2) => {
                                    const name2 = get.name(card2);
                                    return name2 === "sha" || name2 === "shan";
                                },
                                ai: (card2) => {
                                    if (_status.event.choice === "all") {
                                        const rand = get.rand("qizhengxiangsheng");
                                        if (rand > 0.5) {
                                            return 0;
                                        }
                                        return 1 + Math.random();
                                    }
                                    if (get.name(card2) === _status.event.choice) {
                                        return get.order(card2);
                                    }
                                    return 0;
                                },
                            })
                            .set("respondTo", [player, card])
                            .set("choice", responseChoice)
                            .forResult();
                    }
                    const name = responseResult && responseResult.bool && responseResult.card ? responseResult.card.name : null;
                    const require2 = event.qizheng_name;
                    if (require2 === "奇兵" && name !== "sha") {
                        await target.damage();
                    } else if (require2 === "正兵" && name !== "shan" && target.countGainableCards(player, "he") > 0) {
                        await player.gainPlayerCard({ target, forced: true, position: "he" });
                    }
                };
                info.content._shuoyeQizhengPatch = true;
            } catch (e) {}
        };
        patchQizheng();
        if (lib.arenaReady) {
            lib.arenaReady.push(patchQizheng);
        }
    } catch (e) {}

    // 【兽之七冠】对离开游戏/修整中的角色使用时，先把目标拉回场上。
    // 等牌自己的 content 再回归的话，目标不在场会让判定区操作失败、牌直接进弃牌堆。
    try {
        // 不在这里建 lib.shuoyeNilu：character/skill.js 会整体初始化它，
        // 先建一个空对象会让 skill.js 的 if (!lib.shuoyeNilu) 跳过初始化（voice/take 全丢）。
        const installShouguanReturn = () => {
            try {
                if (!lib.skill.shuoye_shouzhiguan_return) {
                    lib.skill.shuoye_shouzhiguan_return = {
                        charlotte: true,
                        nopop: true,
                        popup: false,
                        silent: true,
                        forced: true,
                        trigger: { global: "useCard" },
                        filter(event, player) {
                            if (!event || !event.card || get.name(event.card) !== "shuoye_shouzhizhiguan") return false;
                            const targets = event.targets || (event.target ? [event.target] : []);
                            const need = targets.some((target) => target && target.isOut && target.isOut() && !target.isDead());
                            if (need && lib.shuoyeNilu && lib.shuoyeNilu.shouguanLog) {
                                lib.shuoyeNilu.shouguanLog("[useCard] 回归全局技触发 targets=" + targets.map((target) => get.translation(target) + "(out=" + target.isOut() + ")").join("、"));
                            }
                            return need;
                        },
                        async content(event, trigger, player) {
                            const targets = trigger.targets || (trigger.target ? [trigger.target] : []);
                            for (const target of targets) {
                                if (target && target.isOut && target.isOut() && !target.isDead()) {
                                    await lib.shuoyeNilu.shouguanReturn(target);
                                }
                            }
                        },
                    };
                }
                if (lib.skill.global && !lib.skill.global.includes("shuoye_shouzhiguan_return")) {
                    game.addGlobalSkill("shuoye_shouzhiguan_return");
                }
                if (lib.shuoyeNilu && lib.shuoyeNilu.shouguanLog) {
                    lib.shuoyeNilu.shouguanLog("[加载] 兽冠回归全局技已注册 global=" + (lib.skill.global && lib.skill.global.includes("shuoye_shouzhiguan_return")));
                }
            } catch (e) {}
        };
        installShouguanReturn();
        if (lib.arenaReady) {
            lib.arenaReady.push(installShouguanReturn);
        }
    } catch (e) {}

    // 【影】兜底销毁（只处理黄金之杯生成的影）：
    // 这些影创建时带 shuoye_huangjin 标记；个别模式/UI 覆写可能让
    // destroy: "discardPile" 没生效而直接留在弃牌堆，这里在弃牌/失去牌
    // 结算后再扫一遍事件涉及的牌。其他来源的 ying 不受影响。
    try {
        const installYingCleanup = () => {
            if (!lib.skill.shuoye_ying_cleanup) {
                lib.skill.shuoye_ying_cleanup = {
                    charlotte: true,
                    nopop: true,
                    popup: false,
                    silent: true,
                    forced: true,
                    trigger: { global: ["cardsDiscardAfter", "loseAfter", "loseAsyncAfter"] },
                    filter(event, player) {
                        return (event.cards || []).some(card => card && card.shuoye_huangjin === true && get.name(card, false) === "ying" && get.position(card, true) === "d" && !card._selfDestroyed);
                    },
                    async content(event, trigger, player) {
                        const list = (trigger.cards || []).filter(card => card && card.shuoye_huangjin === true && get.name(card, false) === "ying" && get.position(card, true) === "d" && !card._selfDestroyed);
                        for (const card of list) {
                            card.selfDestroy(trigger);
                        }
                    },
                };
            }
            if (lib.skill.global && !lib.skill.global.includes("shuoye_ying_cleanup")) {
                game.addGlobalSkill("shuoye_ying_cleanup");
            }
        };
        installYingCleanup();
        if (lib.arenaReady) {
            lib.arenaReady.push(installYingCleanup);
        }
    } catch (e) {}

    // 启动时静默检查线上更新（手动关闭或联机中不检查）
    if (lib.config.extension_朔夜_auto_update !== false && navigator.onLine && !_status.connectMode) {
        update(false, EXTENSION_VERSION).catch(() => {});
    }
}