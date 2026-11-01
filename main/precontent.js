import { lib, game, ui, get, ai, _status } from "noname";

// 【朔夜表情】引擎原生聊天表情面板（ui.click.chat）与联机发送都固定读取
// image/emotion/<包名>/ 下的图片，所以启动时把扩展内图片复制到该目录，
// 再补登记 _status.emotion_cache，让面板和联机发送立刻可用。
const SHUOYE_EMOTION_PACK = "shuoye_emotion";
const SHUOYE_EMOTION_SRC = "extension/朔夜/image/emotion/shuoye_emotion/";
const SHUOYE_EMOTION_DEST = "image/emotion/shuoye_emotion/";
const SHUOYE_EMOTION_NAMES = Array.from({ length: 14 }, (_, i) => `${i + 1}.gif`);

function shuoyeEmotionCache() {
    if (!_status.emotion_cache) _status.emotion_cache = {};
    _status.emotion_cache[SHUOYE_EMOTION_PACK] = SHUOYE_EMOTION_NAMES;
}

// 串行写队列：game.writeFile 的 ensureDirectory 在并发创建同一新目录时，
// 只有第一个能建成功，其余会因 mkdir EEXIST 被吞掉且不再回调，
// 表现为只有一张图落盘。所以把写入排成串行队列。
let shuoyeWriteQueue = Promise.resolve();
function shuoyeWriteEmotion(data, name) {
    const task = shuoyeWriteQueue.then(
        () =>
            new Promise(done => {
                game.writeFile(data, SHUOYE_EMOTION_DEST, name, () => done());
            }),
    );
    shuoyeWriteQueue = task;
    return task;
}

function shuoyePatchEmotionServer() {
    const server = lib.message && lib.message.server;
    if (!server || typeof server.emotion !== "function" || server.emotion._shuoyeHooked) {
        return;
    }
    const originEmotion = server.emotion;
    const hooked = function (id, pack, emotion) {
        if (pack !== SHUOYE_EMOTION_PACK) {
            return originEmotion.apply(this, arguments);
        }
        const str = `<img src="##assetURL##image/emotion/${pack}/${emotion}" width="50" height="50">`;
        game.broadcastAll(function (playerid, str2) {
            var player = null;
            if (lib.playerOL && lib.playerOL[playerid]) {
                player = lib.playerOL[playerid];
            } else if (game.connectPlayers) {
                for (var i = 0; i < game.connectPlayers.length; i++) {
                    if (game.connectPlayers[i].playerid == playerid) {
                        player = game.connectPlayers[i];
                        break;
                    }
                }
            }
            if (player) {
                player.say(str2);
            }
        }, id, str);
    };
    hooked._shuoyeHooked = true;
    server.emotion = hooked;
}

function shuoyeInstallEmotion() {
    if (typeof game.readFile !== "function" || typeof game.writeFile !== "function") {
        return Promise.resolve(false);
    }
    const tasks = SHUOYE_EMOTION_NAMES.map(
        name =>
            new Promise(resolve => {
                game.readFile(
                    SHUOYE_EMOTION_SRC + name,
                    data => {
                        try {
                            shuoyeWriteEmotion(data, name).then(() => resolve(true));
                        } catch (e) {
                            resolve(false);
                        }
                    },
                    () => resolve(false),
                );
            }),
    );
    return Promise.all(tasks).then(results => !results.includes(false));
}

// 【李信】形态特效 / 瞬发技按钮 / 太极进度条（模块实现见 lixinfx.js）
import { installLixinFx } from "./lixinfx.js";

export async function precontent() {
    try {
        installLixinFx();
    } catch (e) {
        console.error("[朔夜] 李信特效模块加载失败", e);
    }
    // 【朔夜表情】包名、安装与缓存登记（面板按 get.translation(包名) 显示）
    lib.translate.shuoye_emotion = "朔夜表情";
    const shuoyeEmotionReady = shuoyeInstallEmotion();
    shuoyePatchEmotionServer();
    shuoyeEmotionReady.then(ok => ok && shuoyeEmotionCache());
    if (lib.arenaReady) {
        lib.arenaReady.push(() => {
            // 引擎在 arenaReady 里会先重置 _status.emotion_cache 并扫描 image/emotion，
            // 这里等复制完成后再补登记一次，保证首次启动面板就能看到「朔夜表情」
            shuoyeEmotionReady.then(ok => ok && shuoyeEmotionCache());
        });
    }
    // 阵营判定（各模式通用）：有 side 的模式优先按边分营，否则按身份；
    // 其他身份（国战势力等）按身份字符串归栏，同势力即同阵营
    if (typeof lib.shuoyeCampOf !== "function") {
        lib.shuoyeCampOf = function (p) {
            if (!p) return "other";
            if (p.side !== undefined && p.side !== null) return "side_" + p.side;
            if (!p.identity) return "other";
            const id = p.identity;
            if (id === "zhu" || id === "zhong" || id === "mingzhong" || id === "commoner") return "lord";
            if (id === "fan") return "fan";
            if (id === "nei") return "nei";
            return "camp_" + id;
        };
    }
    // 【祈本里香】隐藏武将：在 precontent 也注册一份，保证联机客机在创建玩家时就有完整角色数据（血量/技能/立绘）
    try {
        if (lib.character && !lib.character["shuoye_liixiang"]) {
            lib.character["shuoye_liixiang"] = [
                "female",
                "qun",
                3,
                ["shuoye_liixiang_chunai", "shuoye_lingzhou", "shuoye_chengfo", "shuoye_liixiang_ai"],
                ["img:extension/朔夜/image/shuoye_liixiang.png", "unseen"],
            ];
            lib.character["shuoye_liixiang"].img = "extension/朔夜/image/shuoye_liixiang.png";
            lib.character["shuoye_liixiang"].isUnseen = true;
        }
    } catch (e) {}

    // 里香立绘预加载：扩展加载时就拉进缓存，召唤时直接出图而不是先显剪影
    try {
        const shuoyePreloadImages = [
            "image/character/shuoye_liixiang.jpg",
            "extension/朔夜/image/shuoye_liixiang.png",
            "extension/朔夜/image/shuoye_liixiang_fo.jpg",
        ];
        for (const path of shuoyePreloadImages) {
            const img = new Image();
            img.src = lib.assetURL + path;
        }
    } catch (e) {}
    Promise.all([
        import("../character/index.js"),
    ])
        .then(() => {
            lib.translate.shuoye_character_config = "朔夜";
        })
        .catch(err => {
            alert("『朔夜』扩展导入失败", err);
            console.error("Error:『朔夜』扩展导入失败" + err.message);
        });

    game.playshuoyeMP4 = function (name, time, book, player) {
        if (!game.getFileList || !player || !player.node || !player.node.avatar) return;
        let gameOn = false;
        if (game.me && game.me.name) gameOn = true;
        if (gameOn) game.pause();
        //ui.arena.hide();
        const bgm = ui.backgroundMusic;
        const bgmPlaying = !!(bgm && !bgm.paused);
        if (!book && bgm) {
            try {
                bgm.pause();
            } catch (e) {}
        }
        let video = document.createElement("video");
        video.setAttribute("autoplay", "autoplay");
        video.src = lib.assetURL + "extension/朔夜/" + name + ".mp4?t=" + Date.now();
        player.node.avatar.appendChild(video);
        video.style.margin = "0";
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.left = '0px';
        video.style.top = '0px';
        video.style.position = "absolute";
        video.style.zIndex = 6;
        video.style.backgroundSize = "cover";
        video.style.objectFit = 'fill';
        let closed = false;
        const closeVideo = () => {
            if (closed) return;
            closed = true;
            if (video.parentNode) video.parentNode.removeChild(video);
            if (gameOn) game.resume();
            // 动画结束后恢复原本的背景音乐
            if (!book && bgmPlaying && bgm) {
                try {
                    Promise.resolve(bgm.play()).catch(() => {});
                } catch (e) {}
            }
        };
        let time1 = null;
        if (time) {
            time1 = setTimeout(closeVideo, time + 300);
        }
        video.onended = () => {
            if (time1) clearTimeout(time1);
            closeVideo();
        };
        video.onerror = () => {
            if (time1) clearTimeout(time1);
            closeVideo();
        };
        video.addEventListener("loadedmetadata", function () {
            this.onclick = function () {
                this.currentTime = this.duration;
            }
        });
        return video
    };

    // 联机选将：候选里出现《朔夜》武将时，1/4 概率把其中一个朔夜武将位换成【乙骨忧太】
    // （只影响 chooseCharacter 事件里的候选抽取，不影响牌堆/判定等其它 randomGets）
    if (Array.prototype.randomGets && !Array.prototype.randomGets._shuoyeBoosted) {
        const shuoyeRandomGets = Array.prototype.randomGets;
        const shuoyeBoostedRandomGets = function (num) {
            const result = shuoyeRandomGets.call(this, num);
            try {
                if (!_status.connectMode) return result;
                const evt = _status.event;
                const inChoose = !!evt && (evt.name === "chooseCharacter" || (typeof evt.getParent === "function" && !!evt.getParent("chooseCharacter")));
                if (!inChoose) return result;
                if (!Array.isArray(result) || !result.length) return result;
                if (result.includes("shuoye_yiguyoutai")) return result;
                const pack = lib.characterPack && lib.characterPack["朔夜"];
                if (!pack) return result;
                // 候选里已经出现朔夜武将，且乙骨也在可抽池里
                const index = result.findIndex((c) => typeof c === "string" && pack[c]);
                if (index < 0) return result;
                if (!this.includes("shuoye_yiguyoutai")) return result;
                if (Math.random() < 0.5) {
                    result[index] = "shuoye_yiguyoutai";
                }
            } catch (e) {}
            return result;
        };
        shuoyeBoostedRandomGets._shuoyeBoosted = true;
        Array.prototype.randomGets = shuoyeBoostedRandomGets;
    }

    // 恢复原版 BGM 时把倍速归 1：祖国人的 1.1 倍速配音不能影响之后的 BGM
    if (typeof game.playBackgroundMusic === "function" && !game.playBackgroundMusic._shuoyeRatePatched) {
        const shuoyePlayBgm = game.playBackgroundMusic;
        const shuoyePlayBgmPatched = function () {
            if (ui.backgroundMusic) {
                try {
                    ui.backgroundMusic.playbackRate = 1;
                } catch (e) {}
            }
            return shuoyePlayBgm.apply(this, arguments);
        };
        shuoyePlayBgmPatched._shuoyeRatePatched = true;
        game.playBackgroundMusic = shuoyePlayBgmPatched;
    }

    // 【模仿】精确失去：
    // 引擎在 content.createTrigger 里用 game.createEvent(event.skill) 创建“技能内容事件”，
    // 所以这里监视 createEvent：只要监视中的技能（或其子技能/backup）内容事件被创建，
    // 就说明技能确实发动了（不会把“点取消”算进去）。
    if (typeof game.createEvent === "function" && !game.createEvent._shuoyeWatchPatched) {
        const shuoyeCreateEvent = game.createEvent;
        const shuoyeCreateEventPatched = function (name2) {
            const evt = shuoyeCreateEvent.apply(this, arguments);
            try {
                const watch = _status && _status.shuoyeMofangWatch;
                if (watch && typeof name2 === "string") {
                    for (const s of watch) {
                        if (name2 === s || name2.startsWith(s + "_")) {
                            if (!_status.shuoyeMofangRan) _status.shuoyeMofangRan = {};
                            _status.shuoyeMofangRan[s] = true;
                            break;
                        }
                    }
                }
            } catch (e) {}
            return evt;
        };
        shuoyeCreateEventPatched._shuoyeWatchPatched = true;
        game.createEvent = shuoyeCreateEventPatched;
    }

    if (typeof game.createTrigger === "function" && !game.createTrigger._shuoyeMofangPatched) {
        const shuoyeCreateTrigger = game.createTrigger;
        const shuoyeCreateTriggerPatched = function (name2, skill, player, trigger, indexedData) {
            let owner = null;
            try {
                const mofangList = player && player.storage && player.storage.shuoye_mofang_skills;
                if (Array.isArray(mofangList) && mofangList.length && typeof skill === "string") {
                    // 子技能、backup 技能都算到它的所有者
                    owner = mofangList.find((s) => skill === s || skill.startsWith(s + "_")) || null;
                }
                // 内部的 silent 子技能（如【超能】的 gain/damage）只是记账，不算“发动”,
                // 否则获得技能的同时子技能一触发就会被误判为已发动而被移除
                if (owner && skill !== owner) {
                    const info = get.info(skill);
                    if (info && info.silent) owner = null;
                }
                if (owner) {
                    _status.shuoyeMofangWatch = _status.shuoyeMofangWatch || [];
                    if (!_status.shuoyeMofangWatch.includes(owner)) _status.shuoyeMofangWatch.push(owner);
                    if (_status.shuoyeMofangRan) delete _status.shuoyeMofangRan[owner];
                }
            } catch (e) {}
            const result = shuoyeCreateTrigger.apply(this, arguments);
            try {
                if (!result || !owner) {
                    return result;
                }
                const cleanupWatch = () => {
                    try {
                        const watch = _status.shuoyeMofangWatch;
                        if (Array.isArray(watch)) {
                            const idx = watch.indexOf(owner);
                            if (idx >= 0) watch.splice(idx, 1);
                        }
                    } catch (e) {}
                };
                const forget = () => {
                    try {
                        const info = lib.skill.shuoye_mofang;
                        if (info && typeof info.forget === "function") {
                            info.forget(player, owner);
                        }
                    } catch (e) {
                        console.error("shuoye_mofang forget error", e);
                    }
                };
                const didRun = () => {
                    try {
                        if (_status.shuoyeMofangRan && _status.shuoyeMofangRan[owner]) return true;
                    } catch (e) {}
                    return (
                        Array.isArray(result.childEvents) &&
                        result.childEvents.some(
                            (evt) => evt && typeof evt.name === "string" && (evt.name === skill || evt.name === owner || evt.name.startsWith(owner + "_"))
                        )
                    );
                };
                // 【破军】这种“使用【杀】造成伤害时”的触发技，要在整张【杀】结算完之后再失去，
                // 否则一杀多目标时后续目标就吃不到这个技能。
                let ownCard = null;
                try {
                    const evt = trigger && typeof trigger.getParent === "function" ? trigger.getParent("useCard") : null;
                    if (evt && evt.name === "useCard" && evt.player === player) {
                        ownCard = evt;
                    }
                } catch (e) {}
                if (typeof result.then !== "function") {
                    if (didRun()) forget();
                    cleanupWatch();
                    return result;
                }
                result.then(() => {
                    try {
                        if (didRun()) {
                            if (ownCard) {
                                player.storage.shuoye_mofang_pending = player.storage.shuoye_mofang_pending || [];
                                if (!player.storage.shuoye_mofang_pending.includes(owner)) {
                                    player.storage.shuoye_mofang_pending.push(owner);
                                }
                            } else {
                                forget();
                            }
                        }
                    } catch (e) {
                    } finally {
                        // 无论是否发动都要清监视，避免残留导致后续误判
                        cleanupWatch();
                    }
                });
            } catch (e) {}
            return result;
        };
        shuoyeCreateTriggerPatched._shuoyeMofangPatched = true;
        game.createTrigger = shuoyeCreateTriggerPatched;
    }

    // 容错：不死者之王/错乱时空的「格林/魔力」广播会调 player.gl_initMp() / $gl_update()，
    // 客机没装对应扩展时这两个方法不存在 → TypeError。缺失时补最简实现（有真实现不覆盖）。
    try {
        if (lib.element && lib.element.player) {
            if (typeof lib.element.player.gl_initMp !== "function") {
                lib.element.player.gl_initMp = function () {
                    try {
                        if (this.node.gl_mp) return;
                        const bar = ui.create.div();
                        bar.style.display = "none";
                        this.node.gl_mp = bar;
                        this.node.gl_textMp = ui.create.div(bar);
                    } catch (e) {}
                };
            }
            if (typeof lib.element.player.$gl_update !== "function") {
                lib.element.player.$gl_update = function () {};
            }
        }
    } catch (e) {}

    // 【祈本里香】是召唤物：不计入身份胜负的人数统计
    // 除了 storage 标记，再按角色名认一次：联机重连时引擎不会同步 storage（player.getState 不含），
    // 名字（name1/name2）是随 state 一起同步的，能保证重连后仍然认得出她把
    const shuoyeIsSummon = (p) => !!(p && ((p.storage && p.storage.shuoye_summon) || p.name1 === "shuoye_liixiang" || p.name2 === "shuoye_liixiang"));
    if (typeof get.population === "function" && !get.population._shuoyePatched) {
        const shuoyePopulation = get.population;
        const patchedPopulation = function (identity) {
            if (!game.players || !game.dead) {
                return shuoyePopulation.apply(this, arguments);
            }
            // 只有“按身份计数”才排除召唤物；总人数保持原样
            if (identity == null) {
                return shuoyePopulation.apply(this, arguments);
            }
            return game.players.filter((p) => !shuoyeIsSummon(p) && p.identity == identity).length;
        };
        patchedPopulation._shuoyePatched = true;
        get.population = patchedPopulation;
    }
    if (typeof get.totalPopulation === "function" && !get.totalPopulation._shuoyePatched) {
        const shuoyeTotalPopulation = get.totalPopulation;
        const patchedTotalPopulation = function (identity) {
            if (!game.players || !game.dead) {
                return shuoyeTotalPopulation.apply(this, arguments);
            }
            if (identity == null) {
                return shuoyeTotalPopulation.apply(this, arguments);
            }
            return game.players.concat(game.dead).filter((p) => !shuoyeIsSummon(p) && p.identity == identity).length;
        };
        patchedTotalPopulation._shuoyePatched = true;
        get.totalPopulation = patchedTotalPopulation;
    }

    // ==== 召唤物（里香）不参与任何模式的胜负结算 ====
    // 引擎在加载扩展之前就已经把当前模式的 checkResult 拷到 game 上；这里给
    // game.checkResult / game.checkOnlineResult 装“属性陷阱”：之后不管是换模式、
    // 重开、还是别的扩展再给它们赋值，都会自动包一层 —— 判定期间把召唤物从
    // game.players / game.dead 里临时摘出，判定结束再按原索引放回。
    // 用的是各模式自己的判定逻辑（身份局、斗地主各子模式、对决、boss……），
    // 不复制引擎逻辑，所以不会因为引擎更新或子模式差异而漏判。
    if (!Array.isArray(lib.shuoyeDetachedSummons)) lib.shuoyeDetachedSummons = [];
    if (typeof lib.shuoyeRestoreSummons !== "function") {
        // 判定期间被摘出的召唤物清单；game.over 出统计表前会按它把人放回去（战后统计要显示她）。
        // 这个函数只用自己的参数，不引用闭包（会被序列化到客机、与 game.over 共用）。
        // 兼容两种入参：[ [list,index,player], ... ]（判定结束直接还原）
        // 或 [ [ [list,index,player], ... ], ... ]（game.over 取走 registry 时）
        lib.shuoyeRestoreSummons = function (entries) {
            if (!Array.isArray(entries) || !entries.length) return;
            try {
                const flat = [];
                for (const entry of entries) {
                    if (!Array.isArray(entry)) continue;
                    if (typeof entry[1] === "number") {
                        flat.push(entry);
                    } else {
                        for (const item of entry) {
                            if (Array.isArray(item) && typeof item[1] === "number") flat.push(item);
                        }
                    }
                }
                flat.sort((a, b) => a[1] - b[1]);
                for (const entry of flat) {
                    const list = entry[0], index = entry[1], p = entry[2];
                    if (Array.isArray(list) && list.indexOf(p) < 0) list.splice(Math.min(index, list.length), 0, p);
                }
            } catch (e) {}
        };
    }
    const shuoyeWrapSummonSafe = (fn) => {
        if (typeof fn !== "function" || fn._shuoyeSummonSafe) return fn;
        const wrapped = function () {
            const playersBefore = Array.isArray(game.players) ? game.players.length : 0;
            const removed = [];
            for (const list of [game.players, game.dead]) {
                if (!Array.isArray(list)) continue;
                for (let i = list.length - 1; i >= 0; i--) {
                    const p = list[i];
                    if (shuoyeIsSummon(p)) {
                        removed.push([list, i, p]);
                        list.splice(i, 1);
                    }
                }
            }
            if (!removed.length) return fn.apply(this, arguments);
            // 登记到全局：game.over 出统计表前会先把她放回去（战后统计要显示她）
            const registry = lib.shuoyeDetachedSummons;
            registry.push(removed);
            try {
                return fn.apply(this, arguments);
            } finally {
                const regIndex = registry.indexOf(removed);
                if (regIndex >= 0) registry.splice(regIndex, 1);
                lib.shuoyeRestoreSummons(removed);
                // 正常情况下按原索引放回就是原顺序；只有别的扩展在这次判定里永久增删了角色（长度变了）
                // 才按座位号重排，避免把特殊模式的玩家顺序（如战棋）改乱
                try {
                    if (Array.isArray(game.players) && game.players.length !== playersBefore && !game.chess) {
                        game.players.sort(lib.sort.position);
                    }
                } catch (e2) {}
            }
        };
        wrapped._shuoyeSummonSafe = true;
        // 保留原函数身上的标记（如苍翼默示录的 _cangyiHooked、一中杀/鹙府包的缓存标记），
        // 否则它们的“已挂载过”守卫会失效，反复重新挂载 / 改写。
        try {
            for (const key in fn) {
                if (key === "_shuoyeSummonSafe" || key in wrapped) continue;
                try {
                    wrapped[key] = fn[key];
                } catch (e2) {}
            }
        } catch (e2) {}
        try {
            wrapped.toString = () => fn.toString();
        } catch (e2) {}
        return wrapped;
    };
    const shuoyeTrapResultFunction = (name) => {
        try {
            const desc = Object.getOwnPropertyDescriptor(game, name);
            if (desc && desc.get && desc.get._shuoyeTrap) return;
            if (desc && desc.configurable === false) return;
            let current = desc && "value" in desc ? desc.value : game[name];
            current = shuoyeWrapSummonSafe(current);
            const getter = function () {
                return current;
            };
            getter._shuoyeTrap = true;
            Object.defineProperty(game, name, {
                configurable: true,
                enumerable: true,
                get: getter,
                set(fn) {
                    current = shuoyeWrapSummonSafe(fn);
                },
            });
        } catch (e) {
            // 兜底：属性不可配置时，直接包一次当前函数
            try {
                if (typeof game[name] === "function") game[name] = shuoyeWrapSummonSafe(game[name]);
            } catch (e2) {}
        }
    };
    const shuoyeInstallSummonResultTrap = () => {
        shuoyeTrapResultFunction("checkResult");
        shuoyeTrapResultFunction("checkOnlineResult");
    };
    lib.shuoyeInstallSummonCheckResultTrap = shuoyeInstallSummonResultTrap;
    // 兼容旧入口（character/skill.js 召唤时还会调这两个名字）
    lib.shuoyePatchDoudizhuResult = shuoyeInstallSummonResultTrap;
    lib.shuoyePatchIdentityResult = shuoyeInstallSummonResultTrap;
    shuoyeInstallSummonResultTrap();
    if (lib.arenaReady) lib.arenaReady.push(shuoyeInstallSummonResultTrap);

    // ---- 战后统计要显示里香 ----
    // 判定期间她被临时摘出 game.players / game.dead，而 game.over 的统计表正是按这两个数组生成。
    // 这里在 game.over 真正出表前把她放回去；判定结束后再交给外层 finally 正常还原。
    // ！game.over 会被主机 send 到客机执行（它是 send 的函数参数），所以包装函数体
    //   只能用全局 lib / game，不能引用闭包变量；基函数存在 lib.shuoyeOverBase 上。
    const shuoyeInstallOverPatch = () => {
        try {
            // 已经装过（包括扩展重载）就直接返回：避免在别人的包装层里再包一次，
            // 形成 “别人的包装 -> 我们的旧包装 -> 再调到别人的包装” 的自循环。
            if (typeof lib.shuoyeOverBase === "function") return;
            const base = game.over;
            if (typeof base !== "function" || base._shuoyeOverPatch) return;
            lib.shuoyeOverBase = base;
            const wrapped = function () {
                try {
                    const registry = lib.shuoyeDetachedSummons;
                    if (Array.isArray(registry) && registry.length) {
                        const entries = registry.splice(0, registry.length);
                        if (typeof lib.shuoyeRestoreSummons === "function") lib.shuoyeRestoreSummons(entries);
                    }
                } catch (e) {}
                const fn = lib.shuoyeOverBase;
                if (typeof fn === "function") return fn.apply(game, arguments);
                return game.constructor.prototype.over.apply(game, arguments);
            };
            wrapped._shuoyeOverPatch = true;
            game.over = wrapped;
        } catch (e) {}
    };
    lib.shuoyeInstallOverPatch = shuoyeInstallOverPatch;
    shuoyeInstallOverPatch();

    // ---- 联机重连：补回召唤物标记 ----
    // 引擎重连时用 state 重建玩家对象，而 player.getState() 不含 storage，
    // 所以 storage.shuoye_summon / 主人 pid / dieAfter 覆盖都会丢。按角色名补回来。
    // （主人 pid 客机上本来就用不到：纯爱/灵咒/真赝相爱这些技能都在主机执行）
    const shuoyeApplySummonMarkers = () => {
        try {
            const list = (game.players || []).concat(game.dead || []);
            for (const p of list) {
                if (!p) continue;
                if (p.name1 !== "shuoye_liixiang" && p.name2 !== "shuoye_liixiang") continue;
                if (!p.storage) p.storage = {};
                if (!p.storage.shuoye_summon) p.storage.shuoye_summon = true;
                if (!p._shuoyeSummonDieAfter) {
                    p._shuoyeSummonDieAfter = true;
                    p.dieAfter = function () {};
                    p.dieAfter2 = function (source) {
                        if (get.mode() !== "identity" || !source) return;
                        const identity = this.identity;
                        if (identity === "fan") {
                            source.draw(3);
                        } else if (identity === "commoner") {
                            source.draw(2);
                        } else if (identity === "mingzhong" && source.identity !== "zhu") {
                            source.draw(3);
                        }
                    };
                }
            }
        } catch (e) {}
    };
    lib.shuoyeApplySummonMarkers = shuoyeApplySummonMarkers;
    try {
        if (lib.message && lib.message.client && typeof lib.message.client.reinit === "function" && !lib.message.client.reinit._shuoyeHook) {
            const origReinit = lib.message.client.reinit;
            const hookedReinit = function () {
                const out = origReinit.apply(this, arguments);
                setTimeout(shuoyeApplySummonMarkers, 0);
                setTimeout(shuoyeApplySummonMarkers, 300);
                setTimeout(shuoyeApplySummonMarkers, 1500);
                return out;
            };
            hookedReinit._shuoyeHook = true;
            lib.message.client.reinit = hookedReinit;
        }
    } catch (e) {}
    if (lib.arenaReady) {
        lib.arenaReady.push(shuoyeApplySummonMarkers);
    }

    lib.arenaReady.push(() => {
        if (get.mode() == "boss") {
            lib.character.shuoye_u_aoerjiamali.isBoss = true;
            lib.skill.shuoyekuangyan.limited = false;
            lib.skill.shuoyekuangyan.usable = 1;
            // BOSS 模式：奥尔加玛丽的限定技〖惊天〗改为每回合限一次
            lib.skill.shuoye_jingtian.limited = false;
            lib.skill.shuoye_jingtian.usable = 1;
            if (lib.skill.shuoye_jingtian.intro) {
                lib.skill.shuoye_jingtian.intro.content = "每回合限一次";
            }
        }
    });
    
}