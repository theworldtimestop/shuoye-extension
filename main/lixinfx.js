import { lib, game, ui, get, ai, _status } from "noname";

// ============================================================================
// 【李信】形态特效 / 音效 / 太极（阴阳）进度条 / 瞬发技按钮
// 归属：朔夜扩展（李信三形态：shuoye_lixin / shuoye_lx_guang / shuoye_lx_an）
// 约定：
//   1. 所有视觉与音频逻辑集中在此模块，宿主侧只通过 lib.lsxFx.* 调用；
//   2. game.broadcastAll 的回调里不引用任何闭包变量，只通过 window.lsxFx.*
//      与可序列化参数执行，保证联机各端都能正确渲染；
//   3. 任何一步失败都静默降级，不影响正常结算。
// ============================================================================

const PKG = "朔夜";
const STYLE_ID = "shuoye-lixin-style-node";

const FORM_LIXIN = "shuoye_lixin";
const FORM_GUANG = "shuoye_lx_guang";
const FORM_AN = "shuoye_lx_an";
const TAIJI_MAX = 7;

const SKILL = {
	xiwang: "shuoye_lx_xiwang",
	xiwangAi: "shuoye_lx_xiwang_ai",
	liehua: "shuoye_lx_liehua",
	guangyi: "shuoye_lx_guangyi",
	guangyiCount: "shuoye_lx_guangyi_count",
	guangyiMod: "shuoye_lx_guangyi_mod",
	wuwei: "shuoye_lx_wuwei",
	silie: "shuoye_lx_silie",
	anye: "shuoye_lx_anye",
	anyeBuff: "shuoye_lx_anye_buff",
	huiren: "shuoye_lx_huiren",
	huirenNoLimit: "shuoye_lx_huiren_nolimit",
	huirenDmg: "shuoye_lx_huiren_dmg",
	yinian: "shuoye_lx_yinian",
	shenmo: "shuoye_lx_shenmo",
	formAura: "shuoye_lx_form_aura",
	beamFx: "shuoye_lx_beam_fx",
	killLine: "shuoye_lx_kill_line",
};

// h = 刀光主体高度（px）：细一点才有削铁如泥的锋利感
const COLORS = {
	gold: { rgb: "255,213,74", hi: "#fff6c2", h: 13 },
	dark: { rgb: "198,52,40", hi: "#ff8b78", h: 13 },
	gray: { rgb: "186,196,206", hi: "#f2f6fa", h: 11 },
};

const CSS = `
.shj-taiji-link{cursor:pointer;font-weight:700;background:linear-gradient(90deg,#111 0%,#fff 16%,#000 32%,#f2f2f2 48%,#000 64%,#fff 80%,#111 100%);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shjTaijiFlow 5s linear infinite;}
@keyframes shjTaijiFlow{0%{background-position:0 0}100%{background-position:300% 0}}
.shj-fx-scene{position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:2147482000;overflow:hidden;}
/* 刀光主体：极细的梭形，软渐变流光（无硬边条纹，不像方块在推） */
.shj-beam{position:absolute;transform-origin:0 50%;opacity:0;mix-blend-mode:screen;
clip-path:polygon(0% 50%,7% 20%,22% 4%,62% 0%,100% 50%,62% 100%,22% 96%,7% 80%);
background-image:linear-gradient(90deg,rgba(var(--shj-rgb),0) 0%,rgba(var(--shj-rgb),.35) 8%,var(--shj-hi) 70%,#fff 88%,rgba(var(--shj-rgb),0) 100%),
linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.6) 50%,rgba(255,255,255,0) 100%);
background-size:100% 100%,240px 100%;filter:blur(.4px) brightness(1.3);
animation:shjBeamSheen .55s linear infinite,shjBeamFade .34s ease-in .7s forwards;}
@keyframes shjBeamSheen{from{background-position:0 0,-240px 0}to{background-position:0 0,240px 0}}
/* 中央锐利光心：越细越亮，两头收尖 */
.shj-beam-core{position:absolute;transform-origin:0 50%;opacity:0;mix-blend-mode:screen;
clip-path:polygon(0% 50%,10% 26%,45% 0%,100% 50%,45% 100%,10% 74%);
background-image:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.95) 52%,#fff 74%,var(--shj-hi) 88%,rgba(255,255,255,0));
filter:blur(.3px) brightness(1.7);
animation:shjBeamFade .3s ease-in .78s forwards;}
/* 同色粒子：沿光带散开后向外飞散并消隐 */
.shj-beam-parts{position:absolute;pointer-events:none;overflow:visible;}
.shj-part{position:absolute;border-radius:50%;pointer-events:none;opacity:0;mix-blend-mode:screen;
animation:shjPartFly .82s ease-out forwards;}
.shj-part.shj-part-streak{border-radius:2px;height:2px !important;}
@keyframes shjPartFly{
0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}
18%{opacity:1}
100%{opacity:0;transform:translate(calc(-50% + var(--shj-dx,0px)),calc(-50% + var(--shj-dy,0px))) scale(.14)}}
@keyframes shjBeamFlow{from{background-position:0 0,0 0}to{background-position:140px 0,0 0}}
@keyframes shjBeamFade{from{opacity:.95}to{opacity:0}}
.shj-beam-head{position:absolute;width:0;height:0;pointer-events:none;}
.shj-beam-head>i{position:absolute;left:-9px;top:-9px;width:18px;height:18px;border-radius:50%;background:var(--shj-hi);box-shadow:0 0 12px var(--shj-hi),0 0 26px rgba(var(--shj-rgb),.9);}
@keyframes shjBeamHead{0%{opacity:.15;transform:translateX(0)}30%{opacity:1}100%{opacity:0;transform:translateX(var(--shj-x,0px))}}

.shj-aura{position:absolute;pointer-events:none;border-radius:6px;z-index:2;overflow:visible;}
/* 光明神：四周放射金光，整体绕角色旋转（方向/速度随机） */
.shj-ray-wrap{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;transform-origin:50% 50%;animation:shjRaySpin 14s linear infinite;}
@keyframes shjRaySpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
.shj-ray{position:absolute;left:50%;top:50%;width:2px;height:42px;margin:-21px 0 0 -1px;border-radius:2px;pointer-events:none;
background:linear-gradient(180deg,rgba(255,236,150,.95),rgba(255,213,74,.15) 70%,rgba(255,213,74,0));
transform-origin:50% 50%;animation:shjRayPulse 2.6s ease-in-out infinite;}
@keyframes shjRayPulse{0%,100%{opacity:0;transform:rotate(var(--shj-a,0deg)) translateY(-74px) scaleY(.55);}45%,55%{opacity:1;transform:rotate(var(--shj-a,0deg)) translateY(-74px) scaleY(1);}}
/* 弑杀神：暗红粒子 */
.shj-particle{position:absolute;width:5px;height:5px;margin:-2.5px 0 0 -2.5px;border-radius:50%;pointer-events:none;
background:radial-gradient(circle,#e24242 0%,#8f1414 55%,rgba(50,0,0,0) 100%);
box-shadow:0 0 7px rgba(200,32,32,.85);animation:shjParticleFloat 3.2s ease-in-out infinite;}
@keyframes shjParticleFloat{0%{opacity:0;transform:translate(0,0) scale(.5);}30%{opacity:.95;}70%{opacity:.75;}100%{opacity:0;transform:translate(var(--shj-dx,10px),var(--shj-dy,-12px)) scale(.9);}}
.shj-aura::before{content:"";position:absolute;inset:0;border-radius:6px;pointer-events:none;}
.shj-aura::after{content:"";position:absolute;inset:-40% -10%;pointer-events:none;opacity:.55;
background-image:radial-gradient(circle at 30% 70%,rgba(255,255,255,.55),rgba(255,255,255,0) 42%),radial-gradient(circle at 70% 30%,rgba(255,255,255,.4),rgba(255,255,255,0) 40%),radial-gradient(circle at 50% 100%,rgba(255,255,255,.4),rgba(255,255,255,0) 46%);
filter:blur(7px);animation:shjAuraDrift 9s ease-in-out infinite alternate;}
.shj-aura-gold::before{box-shadow:inset 0 0 16px 5px rgba(255,214,64,.6),inset 0 0 34px 10px rgba(255,236,150,.3);background-image:linear-gradient(160deg,rgba(255,222,90,.18),rgba(255,222,90,0) 55%);animation:shjAuraPulse 4.2s ease-in-out infinite;}
.shj-aura-dark::before{box-shadow:inset 0 0 16px 5px rgba(198,52,40,.62),inset 0 0 34px 10px rgba(90,10,6,.4);background-image:linear-gradient(160deg,rgba(150,20,12,.24),rgba(20,0,0,.14) 60%);animation:shjAuraPulse 4.6s ease-in-out infinite;}
.shj-aura-dark::after{opacity:.5;filter:blur(8px);background-image:radial-gradient(circle at 30% 70%,rgba(60,8,6,.75),rgba(0,0,0,0) 44%),radial-gradient(circle at 70% 30%,rgba(120,20,12,.6),rgba(0,0,0,0) 42%),radial-gradient(circle at 50% 100%,rgba(30,4,2,.8),rgba(0,0,0,0) 46%);}
@keyframes shjAuraPulse{0%,100%{opacity:.8}50%{opacity:1}}
@keyframes shjAuraDrift{0%{transform:translate3d(-4%,2%,0) scale(1)}50%{transform:translate3d(3%,-3%,0) scale(1.08)}100%{transform:translate3d(-2%,3%,0) scale(1.03)}}

/* ===== 太极（阴/阳）进度条：挂在 player 上（不靠头像内部，原版 UI 不裁剪） ===== */
.shj-taiji{position:absolute;pointer-events:none;z-index:6;width:16px;overflow:visible;}
/* 双条区：只扣掉底部一小段，让两条尾端插进太极图里 */
.shj-taiji-bars{position:absolute;left:0;top:0;width:100%;height:calc(100% - 10px);display:flex;gap:3px;align-items:flex-end;}
.shj-taiji-col{position:relative;flex:1 1 0;height:100%;border-radius:5px;overflow:hidden;
background:rgba(0,0,0,.72);border:1px solid rgba(255,255,255,.38);
box-shadow:0 0 6px rgba(0,0,0,.9),inset 0 0 6px rgba(0,0,0,.95);}
.shj-taiji-fill{position:absolute;left:0;right:0;bottom:0;height:0%;transition:height .38s ease-out;}
.shj-taiji-yang .shj-taiji-fill{background:linear-gradient(180deg,#fff6cf,#ffd54a 42%,#c8901a);box-shadow:0 0 8px rgba(255,213,74,.95),0 0 16px rgba(255,213,74,.55);}
.shj-taiji-yin .shj-taiji-fill{background:linear-gradient(180deg,#ff9a88,#c6342a 42%,#5e0d07);box-shadow:0 0 8px rgba(198,52,40,.95),0 0 16px rgba(198,52,40,.55);}
.shj-taiji-col::after{content:"";position:absolute;inset:0;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.16) 0 1px,rgba(255,255,255,0) 1px 6px);opacity:.5;animation:shjTaijiQi 3.6s linear infinite;}
@keyframes shjTaijiQi{from{background-position:0 0}to{background-position:0 -24px}}
/* 阳/阴 对应颜色的雾气（高度跟着填充涨） */
.shj-taiji-mist{position:absolute;left:-9px;right:-9px;bottom:0;height:0%;pointer-events:none;filter:blur(7px);opacity:.85;transition:height .38s ease-out,opacity .3s linear;}
.shj-taiji-mist-yang{background:radial-gradient(ellipse at 50% 100%,rgba(255,230,150,.9),rgba(255,213,74,.38) 46%,rgba(255,213,74,0) 76%);animation:shjMistBreath 3.6s ease-in-out infinite;}
.shj-taiji-mist-yin{background:radial-gradient(ellipse at 50% 100%,rgba(255,130,110,.85),rgba(198,52,40,.42) 46%,rgba(198,52,40,0) 76%);animation:shjMistBreath 4.4s ease-in-out infinite;}
@keyframes shjMistBreath{0%,100%{opacity:.5;transform:scaleX(.88)}50%{opacity:.95;transform:scaleX(1.14)}}
/* 缓缓旋转的太极底座 + 黑白雾气 */
.shj-taiji-base{position:absolute;left:50%;bottom:0;width:26px;height:26px;margin-left:-13px;border-radius:50%;pointer-events:none;
background:linear-gradient(90deg,#f6f6f6 0 50%,#0a0a0a 50% 100%);
box-shadow:0 0 10px rgba(255,255,255,.6),0 0 20px rgba(0,0,0,.9);animation:shjTaijiSpin 16s linear infinite;}
.shj-taiji-base::before,.shj-taiji-base::after{content:"";position:absolute;left:50%;width:10px;height:10px;margin-left:-5px;border-radius:50%;}
.shj-taiji-base::before{top:1px;background:#f6f6f6;}
.shj-taiji-base::after{bottom:1px;background:#0a0a0a;}
@keyframes shjTaijiSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.shj-taiji-base i{position:absolute;inset:-13px;border-radius:50%;pointer-events:none;filter:blur(8px);}
.shj-taiji-base .shj-tb-light{background:radial-gradient(circle,rgba(255,255,255,.9),rgba(255,255,255,0) 70%);animation:shjMistBreath 5s ease-in-out infinite;}
.shj-taiji-base .shj-tb-dark{background:radial-gradient(circle,rgba(0,0,0,.92),rgba(0,0,0,0) 70%);animation:shjMistBreath 6.2s ease-in-out infinite reverse;}

.shj-shunfa-btn{position:fixed;width:90px;height:40px;line-height:40px;text-align:center;border-radius:5px;
font-size:14px;font-weight:bold;color:#fff;cursor:move;user-select:none;-webkit-user-select:none;touch-action:none;
background-color:rgba(0,0,0,.85);background-image:url(extension/错乱时空/瞬发技按钮.png);background-size:120%;background-position:center;background-repeat:no-repeat;
z-index:2147483500;pointer-events:auto;}
.shj-shunfa-btn.shj-off{opacity:.45;filter:grayscale(.8);cursor:default;}

/* 【李信】称号「一念神魔」逐字流光 */
.shj-title-gold,.shj-title-dark{display:inline-block;background-size:200% 100%;background-position:0% 50%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:shjTitleFlow 3.2s linear infinite;}
.shj-title-gold{background-image:linear-gradient(90deg,#8a6a0a,#ffe066,#fff4bf,#ffd700,#8a6a0a);}
.shj-title-dark{background-image:linear-gradient(90deg,#3d0303,#8f1414,#d43a3a,#8f1414,#3d0303);}
@keyframes shjTitleFlow{0%{background-position:0% 50%;}100%{background-position:200% 50%;}}

.shj-tip-bg{position:absolute;left:0;top:0;width:100%;height:100%;z-index:999;background:rgba(0,0,0,.62);}
.shj-tip-box{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);box-sizing:border-box;
width:46%;min-width:300px;max-width:88%;max-height:62%;overflow-y:auto;padding:16px 20px;border-radius:12px;
font-size:16px;line-height:1.75;color:#f4f4f4;text-shadow:0 0 6px rgba(0,0,0,.9);
background-color:rgba(14,14,14,.94);
background-image:radial-gradient(circle at 10% 6%,rgba(255,213,74,.32),rgba(255,213,74,0) 48%),radial-gradient(circle at 90% 94%,rgba(198,52,40,.36),rgba(198,52,40,0) 50%),linear-gradient(135deg,rgba(255,255,255,.10),rgba(0,0,0,.28));
border:2px solid rgba(255,255,255,.46);
box-shadow:0 0 9px rgba(255,213,74,.7),0 0 26px rgba(198,52,40,.45),inset 0 0 22px rgba(0,0,0,.85);}
.shj-tip-title{font-weight:700;margin-bottom:10px;font-size:19px;text-align:center;letter-spacing:2px;}
.shj-tip-body{white-space:normal;word-break:break-word;}
.shj-tip-hint{margin-top:12px;text-align:center;font-size:13px;opacity:.7;}
`;

function ensureStyle() {
	try {
		if (typeof document === "undefined") {
			return;
		}
		const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
		if (!head) {
			// DOM 还没就绪：稍后重试（否则整套样式会看不到）
			if (typeof setTimeout === "function" && !window._shjStyleRetry) {
				window._shjStyleRetry = setTimeout(function () {
					window._shjStyleRetry = null;
					ensureStyle();
				}, 300);
			}
			return;
		}
		const exist = document.getElementById(STYLE_ID);
		if (exist) {
			// 内容变了就整体重写，避免沿用旧样式（旧会话里的缓存）
			if (exist.textContent !== CSS) {
				exist.textContent = CSS;
			}
			return;
		}
		const style = document.createElement("style");
		style.id = STYLE_ID;
		style.textContent = CSS;
		head.appendChild(style);
	} catch (e) {}
}

function findPlayerByPid(pid) {
	try {
		const list = (game.players || []).concat(game.dead || []);
		for (let i = 0; i < list.length; i++) {
			// 联机广播过来的 playerid 可能是字符串，本地可能是数字，用宽松比较
			if (list[i] && list[i].playerid == pid) {
				return list[i];
			}
		}
	} catch (e) {}
	return null;
}

function animationOff() {
	try {
		if (lib.config && (lib.config.animation === false || lib.config.low_performance)) {
			return true;
		}
	} catch (e) {}
	return false;
}

// ---------------------------------------------------------------- 音频
// 台词音量倍率（1 = 原音量，2 = 翻倍）
const VOICE_GAIN = 2;

function audioBaseVolume() {
	const setting = lib.config && lib.config.volumn_audio != null ? lib.config.volumn_audio : 8;
	return Math.max(0, Math.min(1, Number(setting) / 8));
}

// 用 WebAudio 增益把台词音量翻倍；增益不可用时退回普通播放（略提高元素音量）
function playBoosted(url, onDone) {
	let audio;
	try {
		audio = document.createElement("audio");
		audio.src = url;
		audio.autoplay = true;
		audio.volume = audioBaseVolume();
	} catch (e) {
		if (onDone) {
			onDone();
		}
		return null;
	}
	let ctx = null;
	try {
		const Ctx = window.AudioContext || window.webkitAudioContext;
		if (Ctx) {
			ctx = new Ctx();
			if (ctx.state === "suspended") {
				try {
					ctx.resume();
				} catch (e) {}
			}
			if (ctx.state === "running" || ctx.state === "suspended") {
				const src = ctx.createMediaElementSource(audio);
				const gain = ctx.createGain();
				gain.gain.value = VOICE_GAIN;
				src.connect(gain);
				gain.connect(ctx.destination);
			} else {
				try {
					ctx.close();
				} catch (e) {}
				ctx = null;
			}
		}
	} catch (e) {
		try {
			if (ctx) {
				ctx.close();
			}
		} catch (e2) {}
		ctx = null;
	}
	if (!ctx) {
		// 没有增益通道：元素音量尽量拉高（上限 1）
		try {
			audio.volume = Math.min(1, audioBaseVolume() * 1.6);
		} catch (e) {}
	}
	const cleanup = () => {
		try {
			audio.remove();
		} catch (e) {}
		try {
			if (ctx && ctx.state !== "closed") {
				ctx.close();
			}
		} catch (e) {}
		if (onDone) {
			onDone();
		}
	};
	audio.onended = cleanup;
	audio.onerror = cleanup;
	try {
		(document.body || document.documentElement).appendChild(audio);
		const p = audio.play && audio.play();
		if (p && p.catch) {
			p.catch(() => cleanup());
		}
	} catch (e) {
		cleanup();
	}
	return audio;
}

function playSeq(urls) {
	try {
		if (typeof document === "undefined" || !document.body) {
			return;
		}
		if (!Array.isArray(urls) || !urls.length) {
			return;
		}
		if (lib.config && lib.config.background_speak === false) {
			return;
		}
		const run = (index) => {
			if (index >= urls.length) {
				return;
			}
			playBoosted(urls[index], () => run(index + 1));
		};
		run(0);
	} catch (e) {}
}

// ---------------------------------------------------------------- 变身演出：BGM + 背景
function formShow() {
	try {
		if (ui.backgroundMusic) {
			const url = lib.assetURL + "extension/" + PKG + "/audio/skill/shuoye_lx_yinian2.mp3";
			if (ui.backgroundMusic.src != url) {
				ui.backgroundMusic.src = url;
				ui.backgroundMusic.loop = true;
				ui.backgroundMusic.autoplay = true;
				const p = ui.backgroundMusic.play && ui.backgroundMusic.play();
				if (p && p.catch) {
					p.catch(() => {});
				}
			} else {
				ui.backgroundMusic.loop = true;
			}
		}
	} catch (e) {}
	try {
		if (ui.background && ui.background.setBackgroundImage) {
			ui.background.setBackgroundImage("extension/" + PKG + "/image/shuoye_lx_bg.jpg");
			if (ui.background.style) {
				ui.background.style.backgroundSize = "cover";
				ui.background.style.backgroundPosition = "50% 50%";
			}
		}
	} catch (e) {}
}

// ---------------------------------------------------------------- 伤害牌光流
// 同时存在的光流数量（用来在同屏多条光流时自动减少粒子数，避免卡顿）
let liveBeamCount = 0;

function beam(pid1, pid2, colorKey) {
	try {
		if (typeof document === "undefined" || !document.body) {
			return;
		}
		if (animationOff()) {
			return;
		}
		// 光流过多时直接放弃（保留卡顿底线）
		if (liveBeamCount > 6) {
			return;
		}
		const p1 = findPlayerByPid(pid1);
		const p2 = findPlayerByPid(pid2);
		if (!p1 || !p2) {
			return;
		}
		const r1 = p1.getBoundingClientRect();
		const r2 = p2.getBoundingClientRect();
		if (!r1 || !r2 || (!r1.width && !r1.height) || (!r2.width && !r2.height)) {
			return;
		}
		const a = { x: r1.left + r1.width / 2, y: r1.top + r1.height / 2 };
		const b = { x: r2.left + r2.width / 2, y: r2.top + r2.height / 2 };
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const len = Math.sqrt(dx * dx + dy * dy);
		if (!(len > 16)) {
			return;
		}
		const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
		const cfg = COLORS[colorKey] || COLORS.gold;
		const scene = document.createElement("div");
		scene.className = "shj-fx-scene";
		liveBeamCount++;
		// 棱形（两头收尖）刀光：内联 clip-path 作兵底，样式表失效时也是利的
		const lensClip = "polygon(0% 50%,7% 20%,22% 4%,62% 0%,100% 50%,62% 100%,22% 96%,7% 80%)";
		const coreClip = "polygon(0% 50%,10% 26%,45% 0%,100% 50%,45% 100%,10% 74%)";
		const bar = document.createElement("div");
		bar.className = "shj-beam";
		bar.style.setProperty("--shj-rgb", cfg.rgb);
		bar.style.setProperty("--shj-hi", cfg.hi);
		bar.style.left = a.x + "px";
		bar.style.top = a.y - cfg.h / 2 + "px";
		bar.style.width = len + "px";
		bar.style.height = cfg.h + "px";
		bar.style.transform = "rotate(" + angle + "deg)";
		bar.style.transformOrigin = "0 50%";
		bar.style.opacity = "0.95";
		try {
			bar.style.clipPath = lensClip;
			bar.style.webkitClipPath = lensClip;
		} catch (e) {}
		scene.appendChild(bar);
		// 中央细光心：更亮更细，强化“锋刃”感
		try {
			const coreH = Math.max(2, Math.round(cfg.h * 0.45));
			const core = document.createElement("div");
			core.className = "shj-beam-core";
			core.style.setProperty("--shj-rgb", cfg.rgb);
			core.style.setProperty("--shj-hi", cfg.hi);
			core.style.left = a.x + "px";
			core.style.top = a.y - coreH / 2 + "px";
			core.style.width = len + "px";
			core.style.height = coreH + "px";
			core.style.transform = "rotate(" + angle + "deg)";
			core.style.transformOrigin = "0 50%";
			core.style.opacity = "0.98";
			core.style.clipPath = coreClip;
			core.style.webkitClipPath = coreClip;
			scene.appendChild(core);
		} catch (e) {}
		// 同色粒子：沿光带两侧散开→向外飞散→消隐
		try {
			if (!animationOff()) {
				const base = colorKey === "gray" ? 26 : 44;
				const div = liveBeamCount > 2 ? 3 : liveBeamCount > 1 ? 2 : 1;
				const count = Math.max(8, Math.round(base / div));
				const parts = document.createElement("div");
				parts.className = "shj-beam-parts";
				parts.style.left = a.x + "px";
				parts.style.top = a.y - cfg.h / 2 + "px";
				parts.style.width = len + "px";
				parts.style.height = cfg.h + "px";
				parts.style.transform = "rotate(" + angle + "deg)";
				parts.style.transformOrigin = "0 50%";
				for (let i = 0; i < count; i++) {
					const p = document.createElement("div");
					const streak = Math.random() < 0.28;
					p.className = "shj-part" + (streak ? " shj-part-streak" : "");
					const size = 1 + Math.random() * 3.4;
					const along = 2 + Math.random() * 96;
					const across = (Math.random() - 0.5) * Math.max(46, cfg.h * 4.2);
					p.style.left = along + "%";
					p.style.top = "calc(50% + " + across.toFixed(1) + "px)";
					if (streak) {
						p.style.width = 6 + Math.random() * 16 + "px";
						p.style.transform = "rotate(" + (Math.random() * 60 - 30) + "deg)";
					} else {
						p.style.width = size + "px";
						p.style.height = size + "px";
					}
					p.style.background = cfg.hi;
					p.style.boxShadow = "0 0 6px " + cfg.hi + ",0 0 12px rgba(" + cfg.rgb + ",.9)";
					p.style.setProperty("--shj-dx", ((Math.random() - 0.5) * 26).toFixed(1) + "px");
					p.style.setProperty("--shj-dy", (across * 0.85 + (Math.random() - 0.5) * 26).toFixed(1) + "px");
					p.style.animationDelay = (Math.random() * 0.75).toFixed(2) + "s";
					p.style.animationDuration = (0.55 + Math.random() * 0.6).toFixed(2) + "s";
					parts.appendChild(p);
				}
				scene.appendChild(parts);
			}
		} catch (e) {}
		const head = document.createElement("div");
		head.className = "shj-beam-head";
		head.style.setProperty("--shj-rgb", cfg.rgb);
		head.style.setProperty("--shj-hi", cfg.hi);
		head.style.left = a.x + "px";
		head.style.top = a.y + "px";
		head.style.transform = "rotate(" + angle + "deg)";
		const dot = document.createElement("i");
		try {
			dot.style.setProperty("--shj-x", len + "px");
			dot.style.animation = "shjBeamHead .95s linear forwards";
		} catch (e) {}
		head.appendChild(dot);
		scene.appendChild(head);
		document.body.appendChild(scene);
		setTimeout(() => {
			try {
				scene.remove();
			} catch (e) {}
			liveBeamCount = Math.max(0, liveBeamCount - 1);
		}, 2100);
	} catch (e) {}
}

// ---------------------------------------------------------------- 形态光环
// 定位参考【具咒】对波特效：挂 body 的 fixed 舞台，实时量整张武将牌 rect，
// 按 body 缩放换算，切换视角 / 缩放时不会跑偏。
function positionAura(box, player) {
	try {
		if (!box || !player || typeof player.getBoundingClientRect !== "function") {
			return;
		}
		const stage = document.body;
		const br = stage.getBoundingClientRect();
		const scale = stage.offsetWidth > 0 && br.width > 0 ? br.width / stage.offsetWidth : 1;
		const measure = (el) => {
			try {
				return el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
			} catch (e) {
				return null;
			}
		};
		let r = measure(player);
		if (!r || (!r.width && !r.height)) {
			r = measure(player.node && player.node.avatar);
		}
		if (!r || (!r.width && !r.height)) {
			r = measure(player.node);
		}
		if (!r || (!r.width && !r.height)) {
			return;
		}
		const s = scale > 0.01 ? scale : 1;
		box.style.left = (r.left - br.left) / s + "px";
		box.style.top = (r.top - br.top) / s + "px";
		box.style.width = r.width / s + "px";
		box.style.height = r.height / s + "px";
	} catch (e) {}
}

let auraTimer = null;
function ensureAuraTimer() {
	if (auraTimer || typeof setInterval !== "function") {
		return;
	}
	auraTimer = setInterval(() => {
		try {
			const list = document.querySelectorAll(".shj-aura");
			for (let i = 0; i < list.length; i++) {
				const box = list[i];
				const p = findPlayerByPid(box._shjPid);
				if (!p || (typeof p.isAlive === "function" && !p.isAlive())) {
					// 联机同步可能延迟，连续多次找不到才清理
					box._shjMiss = (box._shjMiss || 0) + 1;
					if (box._shjMiss > 3) {
						box.remove();
					}
					continue;
				}
				box._shjMiss = 0;
				positionAura(box, p);
			}
		} catch (e) {}
	}, 300);
}

function aura(pid, formKey) {
	try {
		const player = findPlayerByPid(pid);
		if (!player) {
			return;
		}
		// 直接挂在头像内部：定位跟随头像节点，不依赖屏幕坐标，联机两端都可靠
		const av = player.node && player.node.avatar;
		if (!av) {
			return;
		}
		let box = av.querySelector(".shj-aura");
		if (!box) {
			box = document.createElement("div");
			box.className = "shj-aura";
			box.style.left = "-2px";
			box.style.top = "-2px";
			box.style.right = "-2px";
			box.style.bottom = "-2px";
			av.appendChild(box);
		}
		box._shjPid = pid;
		const dark = formKey === "dark";
		box.className = "shj-aura " + (dark ? "shj-aura-dark" : "shj-aura-gold");
		// 清理旧装饰，切换形态时重建
		try {
			box.querySelectorAll(".shj-ray, .shj-particle, .shj-ray-wrap").forEach((el) => el.remove());
		} catch (e) {}
		// 低性能模式（常见于手机）只减量，不完全关掉；只有玩家主动关闭动画才不建
		const animOff = !!(lib.config && lib.config.animation === false);
		const lowPerf = !!(lib.config && lib.config.low_performance);
		if (!animOff) {
			if (dark) {
				// 弑杀神：四周飘散的红黑粒子（低性能时减量）
				const dotCount = lowPerf ? 4 : 10;
				for (let i = 0; i < dotCount; i++) {
					const dot = document.createElement("div");
					dot.className = "shj-particle";
					dot.style.left = (10 + Math.random() * 80).toFixed(1) + "%";
					dot.style.top = (10 + Math.random() * 80).toFixed(1) + "%";
					dot.style.setProperty("--shj-dx", (Math.random() * 44 - 22).toFixed(1) + "px");
					dot.style.setProperty("--shj-dy", (Math.random() * 44 - 22).toFixed(1) + "px");
					dot.style.animationDelay = (Math.random() * 3).toFixed(2) + "s";
					dot.style.animationDuration = (2.6 + Math.random() * 1.8).toFixed(2) + "s";
					box.appendChild(dot);
				}
			} else {
				// 光明神：四周放射的金色光线，整体缓慢旋转，方向随机（低性能时减量）
				const rayCount = lowPerf ? 6 : 12;
				const wrap = document.createElement("div");
				wrap.className = "shj-ray-wrap";
				wrap.style.animationDuration = (12 + Math.random() * 8).toFixed(1) + "s";
				wrap.style.animationDirection = Math.random() < 0.5 ? "reverse" : "normal";
				box.appendChild(wrap);
				for (let i = 0; i < rayCount; i++) {
					const ray = document.createElement("div");
					ray.className = "shj-ray";
					ray.style.setProperty("--shj-a", (360 / rayCount) * i + "deg");
					ray.style.animationDelay = (i * 0.14).toFixed(2) + "s";
					wrap.appendChild(ray);
				}
			}
		}
		if (animationOff()) {
			box.style.animation = "none";
		}
	} catch (e) {}
}

function clearAura(pid) {
	try {
		const player = findPlayerByPid(pid);
		const av = player && player.node && player.node.avatar;
		if (!av) {
			return;
		}
		const box = av.querySelector(".shj-aura");
		if (box) {
			box.remove();
		}
	} catch (e) {}
}

// ---------------------------------------------------------------- 太极（阴/阳）进度条
// 把进度条定位到武将牌左侧：以 player 为宿主（原版 UI 的 .avatar 会 overflow:hidden 裁掉它）
function layoutTaiji(player, host) {
	try {
		if (!player || !host) {
			return;
		}
		const pr = player.getBoundingClientRect();
		if (!pr || !pr.width) {
			return;
		}
		const av = (player.node && player.node.avatar) || null;
		const ar = av && av.getBoundingClientRect ? av.getBoundingClientRect() : null;
		// 处理 body zoom / 缩放：rect 是视觉尺寸，offsetWidth 是布局尺寸
		let scale = 1;
		try {
			if (player.offsetWidth > 0 && pr.width > 0) {
				scale = pr.width / player.offsetWidth;
			}
		} catch (e) {}
		if (!(scale > 0.05)) {
			scale = 1;
		}
		let left = 0;
		let top = 0;
		let height = player.offsetHeight || 120;
		if (ar && ar.width && ar.height) {
			left = (ar.left - pr.left) / scale;
			top = (ar.top - pr.top) / scale;
			height = ar.height / scale;
		}
		// 位置：整组贴着武将牌左侧（在牌外面），顶端与牌顶齐平，
		// 两条尾端插入底部太极图；#arena / .player 都没有 overflow:hidden，不会被裁
		host.style.left = Math.round(left) - 22 + "px";
		host.style.top = Math.round(top) + "px";
		host.style.height = Math.round(height) + "px";
	} catch (e) {}
}

function taiji(pid, yin, yang, max, mode) {
	try {
		const player = findPlayerByPid(pid);
		if (!player) {
			return;
		}
		let host = player.querySelector ? player.querySelector(".shj-taiji") : null;
		// 旧版把进度条建在头像内部且没有太极底座：发现残骸就重建
		if (host && !host.querySelector(".shj-taiji-base")) {
			if (host.parentNode) {
				host.parentNode.removeChild(host);
			}
			host = null;
		}
		if (mode === "hide") {
			if (host) {
				host.remove();
			}
			return;
		}
		if (!host) {
			host = document.createElement("div");
			host.className = "shj-taiji";
			host.innerHTML =
				'<div class="shj-taiji-bars">' +
				'<div class="shj-taiji-mist shj-taiji-mist-yang"></div>' +
				'<div class="shj-taiji-mist shj-taiji-mist-yin"></div>' +
				'<div class="shj-taiji-col shj-taiji-yang"><div class="shj-taiji-fill"></div></div>' +
				'<div class="shj-taiji-col shj-taiji-yin"><div class="shj-taiji-fill"></div></div>' +
				'</div>' +
				'<div class="shj-taiji-base"><i class="shj-tb-light"></i><i class="shj-tb-dark"></i></div>';
			player.appendChild(host);
		}
		layoutTaiji(player, host);
		const m = Math.max(1, Number(max) || TAIJI_MAX);
		const yg = Math.max(0, Math.min(100, ((Number(yang) || 0) / m) * 100));
		const yv = Math.max(0, Math.min(100, ((Number(yin) || 0) / m) * 100));
		const set = (sel, val) => {
			const el = host.querySelector(sel);
			if (el) {
				el.style.height = val + "%";
			}
		};
		set(".shj-taiji-yang .shj-taiji-fill", yg);
		set(".shj-taiji-yin .shj-taiji-fill", yv);
		set(".shj-taiji-mist-yang", yg);
		set(".shj-taiji-mist-yin", yv);
	} catch (e) {}
}

// 窗口尺寸变化时重新定位所有进度条
function relayoutTaiji() {
	try {
		const list = (game.players || []).concat(game.dead || []);
		for (let i = 0; i < list.length; i++) {
			const p = list[i];
			if (!p || !p.querySelector) {
				continue;
			}
			const host = p.querySelector(".shj-taiji");
			if (host) {
				layoutTaiji(p, host);
			}
		}
	} catch (e) {}
}

// ---------------------------------------------------------------- 太极技 关键词弹窗
function taijiIntro() {
	try {
		if (typeof document === "undefined" || !document.body) {
			return;
		}
		// 再点一次或点空白处就关掉（与错乱时空通灵技说明同一套结构：绝对定位铺满 body）
		const old = document.querySelector(".shj-tip-bg");
		if (old) {
			old.remove();
			return;
		}
		// 全部关键样式内联，不依赖样式表；高度随内容自适应，保证整段文字完整显示
		const viewW = (window.innerWidth || 1280);
		const boxW = Math.max(320, Math.min(760, Math.round(viewW * 0.86)));
		const overlay = ui.create.div(".shj-tip-bg", document.body);
		try {
			overlay.style.cssText =
				"position:absolute;left:0;top:0;width:100%;height:100%;z-index:999;" +
				"background:rgba(0,0,0,.62);display:block;pointer-events:auto;";
		} catch (e) {}
		const box = ui.create.div(".shj-tip-box", overlay);
		try {
			box.style.cssText =
				"position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);box-sizing:border-box;" +
				"width:" +
				boxW +
				"px;max-width:92%;height:auto;min-height:110px;max-height:none;overflow:visible;" +
				"padding:20px 24px;border-radius:12px;font-size:16px;line-height:1.85;" +
				"color:#f4f4f4;text-align:left;white-space:normal;word-break:break-word;overflow-wrap:anywhere;" +
				"border:2px solid rgba(255,255,255,.46);" +
				"background-color:rgba(14,14,14,.94);" +
				"background-image:radial-gradient(circle at 10% 6%,rgba(255,213,74,.32),rgba(255,213,74,0) 48%)," +
				"radial-gradient(circle at 90% 94%,rgba(198,52,40,.36),rgba(198,52,40,0) 50%)," +
				"linear-gradient(135deg,rgba(255,255,255,.10),rgba(0,0,0,.28));" +
				"box-shadow:0 0 9px rgba(255,213,74,.7),0 0 26px rgba(198,52,40,.45),inset 0 0 22px rgba(0,0,0,.85);";
		} catch (e) {}
		const title = ui.create.div(".shj-tip-title", box);
		title.innerHTML = '<span class="shj-taiji-link">太极技</span>';
		try {
			title.style.cssText =
				"font-weight:700;font-size:20px;text-align:center;letter-spacing:3px;margin-bottom:12px;" +
				"white-space:normal;color:#ffd54a;text-shadow:0 0 10px rgba(255,213,74,.55);";
		} catch (e) {}
		const body = ui.create.div(".shj-tip-body", box);
		body.innerHTML =
			"此技能拥有持恒技效果，于武将牌侧添加【阴/阳】进度条，该角色回合结束后，阴阳进度条同时等量消耗至仅有其中之一。" +
			"回合结束时任一计数满后触发极效果，然后触发对应阴/阳/调合效果。";
		try {
			body.style.cssText =
				"font-size:16px;line-height:1.85;white-space:normal;word-break:break-word;overflow-wrap:anywhere;" +
				"color:#f4f4f4;text-align:left;display:block;height:auto;max-height:none;overflow:visible;";
		} catch (e) {}
		const hint = ui.create.div(".shj-tip-hint", box);
		hint.innerHTML = "（点击任意处关闭）";
		try {
			hint.style.cssText = "margin-top:14px;text-align:center;font-size:13px;opacity:.68;white-space:normal;";
		} catch (e) {}
		const close = (e) => {
			try {
				e.stopPropagation();
			} catch (err) {}
			try {
				overlay.remove();
			} catch (err) {}
		};
		overlay.addEventListener("click", close);
	} catch (e) {}
}

// ---------------------------------------------------------------- 瞬发技按钮
const shunfa = {
	buttons: {},
	nextTop: 170,
	drag: null,
};

function shunfaClick(btn) {
	try {
		const pid = btn._playerid;
		const skillname = btn._skillname;
		const player = findPlayerByPid(pid);
		const skill = lib.skill[skillname];
		if (!player || !skill || typeof skill.doAction !== "function") {
			return;
		}
		if (!player.isUnderControl || !player.isUnderControl(true)) {
			return;
		}
		if (player.storage && player.storage.shj_shunfa_cd > 0) {
			return;
		}
		if (typeof skill.clickableFilter === "function" && !skill.clickableFilter(player)) {
			return;
		}
		player.storage.shj_shunfa_cd = 1;
		try {
			btn.classList.add("shj-off");
		} catch (e) {}
		const done = () => {
			try {
				player.storage.shj_shunfa_cd = 0;
				syncButtons();
			} catch (e) {}
		};
		if (game.online && !lib.node) {
			try {
				game.send("shuoye_lx_shunfa_click", pid, skillname);
			} catch (e) {}
			setTimeout(done, 1200);
			return;
		}
		let run;
		try {
			run = skill.doAction(player);
		} catch (e) {
			done();
			return;
		}
		if (run && typeof run.then === "function") {
			run.then(done, done);
		} else {
			done();
		}
	} catch (e) {}
}

function bindDrag(btn) {
	try {
		const down = (e) => {
			if (!e || !e.target) {
				return;
			}
			const isTouch = !!e.touches;
			const point = isTouch ? e.touches[0] : e;
			shunfa.drag = {
				btn: btn,
				sx: point.clientX,
				sy: point.clientY,
				bl: parseFloat(btn.style.left) || 0,
				bt: parseFloat(btn.style.top) || 0,
				moved: false,
			};
			if (e.stopImmediatePropagation) {
				e.stopImmediatePropagation();
			}
			if (isTouch && e.cancelable) {
				e.preventDefault();
			}
		};
		const move = (e) => {
			const d = shunfa.drag;
			if (!d || d.btn !== btn) {
				return;
			}
			const isTouch = !!e.touches;
			const point = isTouch ? e.touches[0] : e;
			const dx = point.clientX - d.sx;
			const dy = point.clientY - d.sy;
			if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
				d.moved = true;
			}
			btn.style.left = d.bl + dx + "px";
			btn.style.top = d.bt + dy + "px";
			if (e.cancelable) {
				e.preventDefault();
			}
		};
		const up = () => {
			const d = shunfa.drag;
			if (!d || d.btn !== btn) {
				return;
			}
			shunfa.drag = null;
			if (!d.moved) {
				shunfaClick(btn);
			}
		};
		btn.addEventListener("touchstart", down, { passive: false });
		btn.addEventListener("touchmove", move, { passive: false });
		btn.addEventListener("touchend", up);
		btn.addEventListener("mousedown", down);
		window.addEventListener("mousemove", move);
		window.addEventListener("mouseup", up);
	} catch (e) {}
}

function syncButtons() {
	try {
		if (!game || !game.me || !lib.skill) {
			return;
		}
		const alive = game.filterPlayer ? game.filterPlayer() : game.players || [];
		const wanted = {};
		for (let i = 0; i < alive.length; i++) {
			const p = alive[i];
			if (!p || !p.skills || !p.isUnderControl || !p.isUnderControl(true)) {
				continue;
			}
			// 形态光环：客机不依赖广播，每秒本地确认一次，缺了就补建
			try {
				if (p.name1 === FORM_GUANG || p.name1 === FORM_AN) {
					const av = p.node && p.node.avatar;
					const animOff = !!(lib.config && lib.config.animation === false);
					if (av && !av.querySelector(".shj-aura") && !animOff) {
						aura(p.playerid, p.name1 === FORM_GUANG ? "gold" : "dark");
					}
				}
			} catch (e) {}
			// 灰刃：不满足条件时把技能面板和原生技能栏的按钮一起隐藏
			try {
				if (p.skills && p.skills.includes("shuoye_lx_huiren")) {
					const huiren = lib.skill.shuoye_lx_huiren;
					let can = true;
					try {
						can = huiren && typeof huiren.filter === "function" ? !!huiren.filter(null, p) : true;
					} catch (e) {}
					// 面板按钮（十周年UI）
					const btns = document.querySelectorAll('[data-id="shuoye_lx_huiren"]');
					for (let k = 0; k < btns.length; k++) {
						btns[k].style.display = can ? "" : "none";
					}
					// 原生技能栏：状态变化时清缓存重算，否则按钮会残留
					if (p._shjHuirenHidden !== !can) {
						p._shjHuirenHidden = !can;
						try {
							let evt = _status && _status.event;
							while (evt && evt.name !== "chooseToUse") {
								evt = evt.parent;
							}
							if (evt) {
								evt._skillChoice = null;
								if (game.Check && typeof game.Check.skill === "function") {
									game.Check.skill(evt);
								}
							}
						} catch (e) {}
					}
				}
			} catch (e) {}
			for (let j = 0; j < p.skills.length; j++) {
				const name = p.skills[j];
				const skill = lib.skill[name];
				if (!skill || typeof skill.doAction !== "function" || !skill.shjShunfa) {
					continue;
				}
				const key = p.playerid + "_" + name;
				wanted[key] = true;
				if (!shunfa.buttons[key]) {
					const btn = document.createElement("div");
					btn.className = "shj-shunfa-btn";
					btn._playerid = p.playerid;
					btn._skillname = name;
					btn.textContent = get.translation(name) || "瞬发";
					btn.style.left = "18px";
					btn.style.top = shunfa.nextTop + "px";
					shunfa.nextTop += 48;
					bindDrag(btn);
					document.body.appendChild(btn);
					shunfa.buttons[key] = btn;
					// 外观直接照搬错乱时空的瞬发技按钮
					try {
						btn.style.width = "90px";
						btn.style.height = "40px";
						btn.style.lineHeight = "40px";
						btn.style.borderRadius = "5px";
						btn.style.fontSize = "14px";
						btn.style.fontWeight = "bold";
						btn.style.color = "#fff";
						btn.style.backgroundImage = "url(" + lib.assetURL + "extension/错乱时空/瞬发技按钮.png)";
						btn.style.backgroundSize = "120%";
						btn.style.backgroundPosition = "center";
						btn.style.backgroundRepeat = "no-repeat";
						btn.style.backgroundColor = "rgba(0,0,0,0.85)";
						btn.style.border = "none";
						btn.style.boxShadow = "none";
						btn.style.textShadow = "none";
					} catch (e) {}
				}
				const btn = shunfa.buttons[key];
				// 错乱时空会给所有带 doAction 的技能自动建按钮，同一个技能的它那份隐藏掉，只留朔夜这个
				try {
					const clBtns = document.querySelectorAll(".cl_shunfa_btn");
					for (let k = 0; k < clBtns.length; k++) {
						if (clBtns[k]._skillname === name) {
							clBtns[k].style.display = "none";
						}
					}
				} catch (e) {}
				let can = true;
				if (p.storage && p.storage.shj_shunfa_cd > 0) {
					can = false;
				}
				if (can && typeof skill.clickableFilter === "function") {
					try {
						can = !!skill.clickableFilter(p);
					} catch (e) {
						can = false;
					}
				}
				btn.classList[can ? "remove" : "add"]("shj-off");
			}
		}
		Object.keys(shunfa.buttons).forEach((key) => {
			if (!wanted[key]) {
				try {
					shunfa.buttons[key].remove();
				} catch (e) {}
				delete shunfa.buttons[key];
			}
		});
	} catch (e) {}
}


function clearAllFx() {
	try {
		Object.keys(shunfa.buttons).forEach((key) => {
			try {
				shunfa.buttons[key].remove();
			} catch (e) {}
			delete shunfa.buttons[key];
		});
		shunfa.nextTop = 170;
		document.querySelectorAll(".shj-fx-scene").forEach((el) => {
			try {
				el.remove();
			} catch (e) {}
		});
		document.querySelectorAll(".shj-aura").forEach((el) => {
			try {
				el.remove();
			} catch (e) {}
		});
		document.querySelectorAll(".shj-taiji").forEach((el) => {
			try {
				el.remove();
			} catch (e) {}
		});
		document.querySelectorAll(".shj-tip-bg").forEach((el) => {
			try {
				el.remove();
			} catch (e) {}
		});
		document.querySelectorAll(".shj-tip-overlay").forEach((el) => {
			try {
				el.remove();
			} catch (e) {}
		});
	} catch (e) {}
}

// ---------------------------------------------------------------- 宿主侧（仅主机执行逻辑）
function formKeyOf(player) {
	if (!player) {
		return null;
	}
	const name = player.name1 || player.name;
	if (name === FORM_GUANG) {
		return "gold";
	}
	if (name === FORM_AN) {
		return "dark";
	}
	if (name === FORM_LIXIN) {
		return "gray";
	}
	return null;
}

function inForm(player) {
	if (!player) {
		return false;
	}
	return player.name1 === FORM_GUANG || player.name1 === FORM_AN;
}

function turnEvent() {
	try {
		if (_status.event && typeof _status.event.getParent === "function") {
			const phase = _status.event.getParent("phase");
			if (phase) {
				return phase;
			}
		}
	} catch (e) {}
	return null;
}

// 本回合计数（挂在 turn 事件对象上，随回合天然重置，且只在主机使用）
function turnCounter(player, key, add) {
	const holder = turnEvent();
	if (!holder || !player) {
		return null;
	}
	if (!holder._shjTurnCount) {
		holder._shjTurnCount = {};
	}
	if (!holder._shjTurnCount[player.playerid]) {
		holder._shjTurnCount[player.playerid] = {};
	}
	const map = holder._shjTurnCount[player.playerid];
	if (add) {
		map[key] = (map[key] || 0) + add;
	}
	return map[key] || 0;
}

function addTaiji(player, type, num) {
	try {
		if (!player || !player.storage) {
			return;
		}
		const n = Math.max(0, Math.floor(Number(num) || 0));
		if (!n) {
			return;
		}
		const key = type === "yang" ? "shj_yang" : "shj_yin";
		const old = Math.max(0, Math.min(TAIJI_MAX, Number(player.storage[key]) || 0));
		const val = Math.max(0, Math.min(TAIJI_MAX, old + n));
		if (val === old) {
			return;
		}
		player.storage[key] = val;
		lib.lsxFx.taiji(player);
		if (val >= TAIJI_MAX && old < TAIJI_MAX && !inForm(player)) {
			lib.lsxFx.voice(["skill/shuoye_lx_yinian1.mp3"]);
		}
	} catch (e) {}
}

// 本回合「其他角色体力值减少」标记（灰刃的发动条件用，包含受伤与失去体力）
function markHpDown(victim) {
	try {
		if (!victim) {
			return;
		}
		const pid = victim.playerid;
		const holder = turnEvent();
		if (holder) {
			if (!holder._shjHpDown) {
				holder._shjHpDown = {};
			}
			holder._shjHpDown[pid] = true;
		}
		// 跨端记录：本地先写，再广播给另一端（客机上 broadcast 不会回传）
		const run = function (vid) {
			try {
				const list = (game.players || []).concat(game.dead || []);
				for (let i = 0; i < list.length; i++) {
					const p = list[i];
					if (!p || !p.storage || typeof p.hasSkill !== "function" || !p.hasSkill("shuoye_lx_huiren")) {
						continue;
					}
					if (!p.storage.shuoye_lx_hpdown || !p.storage.shuoye_lx_hpdown.victims) {
						p.storage.shuoye_lx_hpdown = { victims: {} };
					}
					p.storage.shuoye_lx_hpdown.victims[vid] = true;
				}
				const me = game.me;
				if (me && typeof me.hasSkill === "function" && me.hasSkill("shuoye_lx_huiren")) {
					const btns = document.querySelectorAll('[data-id="shuoye_lx_huiren"]');
					for (let i = 0; i < btns.length; i++) {
						btns[i].style.display = "none";
					}
				}
			} catch (e) {}
		};
		try {
			game.broadcast(run, pid);
		} catch (e) {}
		run(pid);
	} catch (e) {}
}

// 回合开始时快照全体体力（作为第三道兵底，即使事件记录漏了也能比出来）
function resetHpSnap() {
	try {
		const holder = turnEvent();
		const snap = {};
		const list = (game.players || []).concat(game.dead || []);
		for (let i = 0; i < list.length; i++) {
			const p = list[i];
			if (p) {
				snap[p.playerid] = p.hp;
			}
		}
		if (holder) {
			holder._shjHpDown = {};
			holder._shjHpSnap = snap;
		}
		lib.lsxFx._hpSnap = snap;
		// 每回合开始清空跨端记录（本地先清，再广播给另一端）
		const clearRun = function () {
			try {
				const list = (game.players || []).concat(game.dead || []);
				for (let i = 0; i < list.length; i++) {
					const p = list[i];
					if (!p || !p.storage || typeof p.hasSkill !== "function" || !p.hasSkill("shuoye_lx_huiren")) {
						continue;
					}
					p.storage.shuoye_lx_hpdown = { victims: {} };
				}
			} catch (e) {}
		};
		try {
			game.broadcast(clearRun);
		} catch (e) {}
		clearRun();
	} catch (e) {}
}

function hasOtherHpDown(player) {
	try {
		if (!player) {
			return false;
		}
		const holder = turnEvent();
		// ① 跨端广播的本回合掉血记录（写在李信自己的 storage 上，每回合开始清空）
		const rec = player.storage && player.storage.shuoye_lx_hpdown;
		if (rec && rec.victims) {
			if (Object.keys(rec.victims).some((pid) => pid != player.playerid)) {
				return true;
			}
		}
		// ② 事件记录（changeHpAfter 捕获的）
		const marked = (holder && holder._shjHpDown) || {};
		if (Object.keys(marked).some((pid) => pid != player.playerid)) {
			return true;
		}
		// ② 体力快照比对
		const snap = (holder && holder._shjHpSnap) || (lib.lsxFx && lib.lsxFx._hpSnap) || null;
		if (snap) {
			const list = (game.players || []).concat(game.dead || []);
			for (let i = 0; i < list.length; i++) {
				const p = list[i];
				if (!p || p === player) {
					continue;
				}
				const before = snap[p.playerid];
				if (typeof before === "number" && p.hp < before) {
					return true;
				}
			}
		}
		return false;
	} catch (e) {
		return false;
	}
}

// 变身：只更换武将牌（技能/立绘/特效），体力值与体力上限保持
async function changeForm(player, formId) {
	try {
		if (!player || !lib.character || !lib.character[formId]) {
			return false;
		}
		if (player.name1 === formId) {
			return false;
		}
		const hadYinian = player.hasSkill(SKILL.yinian);
		const hp = player.hp;
		const maxHp = player.maxHp;
		const evt = player.changeCharacter([formId]);
		evt.changeGroup = false;
		await evt;
		if (player.hp !== hp || player.maxHp !== maxHp) {
			// 兜底：确保体力数值不被改写
			game.broadcastAll(
				function (pid, h, m) {
					try {
						const list = (game.players || []).concat(game.dead || []);
						const p = list.find((x) => x && x.playerid === pid);
						if (!p) {
							return;
						}
						p.hp = h;
						p.maxHp = m;
						if (p.update) {
							p.update();
						}
					} catch (e) {}
				},
				player.playerid,
				hp,
				maxHp
			);
			player.hp = Math.min(hp, maxHp);
			player.maxHp = maxHp;
		}
		if (hadYinian && !player.hasSkill(SKILL.yinian)) {
			player.addSkill(SKILL.yinian);
		}
		lib.lsxFx.setAura(player);
		lib.lsxFx.taiji(player);
		lib.lsxFx.formShow(player);
		try {
			player.update();
		} catch (e) {}
		return true;
	} catch (e) {
		return false;
	}
}

// ---------------------------------------------------------------- 隐藏形态（与【祈本里香】同款做法）
// 光明神/弑杀神不进武将包（lib.characterPack），只注入 lib.character；
// 平时带 unseen 标记 + characterFilter 全关，武将界面与选将都看不到，
// 但【一念】变身走 changeCharacter → 直读 lib.character，不受影响。
// 开启「李信调试」后恢复可见（见 syncLixinPackVisibility）。
const HIDDEN_FORMS = [FORM_GUANG, FORM_AN];
const HIDDEN_FORM_DATA = {
	[FORM_GUANG]: [
		"male",
		"shen",
		5,
		[
			"shuoye_lx_xiwang",
			"shuoye_lx_liehua",
			"shuoye_lx_guangyi",
			"shuoye_lx_guangyi_count",
			"shuoye_lx_form_aura",
			"shuoye_lx_beam_fx",
			"shuoye_lx_kill_line",
			"shuoye_lx_xiwang_ai",
		],
		["img:extension/朔夜/image/shuoye_lx_guang.jpg", "die:ext:朔夜/audio/die/shuoye_lx_guang1.mp3"],
	],
	[FORM_AN]: [
		"male",
		"shen",
		5,
		["shuoye_lx_wuwei", "shuoye_lx_silie", "shuoye_lx_anye", "shuoye_lx_form_aura", "shuoye_lx_beam_fx", "shuoye_lx_kill_line"],
		["img:extension/朔夜/image/shuoye_lx_an.jpg", "die:ext:朔夜/audio/die/shuoye_lx_an1.mp3"],
	],
};

function ensureHiddenForms() {
	try {
		if (!lib.character) {
			return;
		}
		for (const id of HIDDEN_FORMS) {
			if (!lib.character[id]) {
				lib.character[id] = HIDDEN_FORM_DATA[id].slice();
				lib.character[id][3] = HIDDEN_FORM_DATA[id][3].slice();
				lib.character[id][4] = HIDDEN_FORM_DATA[id][4].slice();
			}
		}
	} catch (e) {}
}

function syncLixinPackVisibility() {
	try {
		ensureHiddenForms();
		const show = !!lib.config.extension_朔夜_lixin_debug;
		const pack = lib.characterPack && lib.characterPack.shuoye;
		for (const id of HIDDEN_FORMS) {
			const info = lib.character && lib.character[id];
			if (info) {
				// unseen 标记：选将弹窗/候选池都看这个
				info.isUnseen = !show;
			}
			if (!pack) {
				continue;
			}
			if (show) {
				if (!pack[id] && info) {
					pack[id] = info;
				}
			} else if (pack[id]) {
				delete pack[id];
			}
		}
	} catch (e) {}
}

// ---------------------------------------------------------------- 安装
export function installLixinFx() {
	ensureStyle();

	window.lsxFx = window.lsxFx || {};
	window.lsxFx.beam = beam;
	window.lsxFx.aura = aura;
	window.lsxFx.clearAura = clearAura;
	window.lsxFx.taiji = taiji;
	window.lsxFx.playSeq = playSeq;
	window.lsxFx.formShow = formShow;
	window.lsxFx.syncButtons = syncButtons;
	window.lsxTaijiIntro = taijiIntro;

	lib.lsxFx = lib.lsxFx || {};
	const api = lib.lsxFx;

	api.FORM_LIXIN = FORM_LIXIN;
	api.FORM_GUANG = FORM_GUANG;
	api.FORM_AN = FORM_AN;
	api.TAIJI_MAX = TAIJI_MAX;
	api.SKILL = SKILL;
	api.inForm = inForm;
	api.formKeyOf = formKeyOf;
	api.turnCounter = turnCounter;
	api.addTaiji = addTaiji;
	api.changeForm = changeForm;
	api.markHpDown = markHpDown;
	api.hasOtherHpDown = hasOtherHpDown;
	api.resetHpSnap = resetHpSnap;
	api.relayoutTaiji = relayoutTaiji;

	// 窗口尺寸变化时重新定位进度条（只做几个 rect 读取）
	try {
		if (typeof window !== "undefined" && !window._shjTaijiResize) {
			window._shjTaijiResize = true;
			window.addEventListener("resize", function () {
				try {
					relayoutTaiji();
				} catch (e) {}
			});
		}
	} catch (e) {}

	api.beamBetween = function (from, to, colorKey) {
		try {
			if (!from || !to) {
				return;
			}
			game.broadcastAll(
				function (pid1, pid2, key) {
					try {
						window.lsxFx.beam(pid1, pid2, key);
					} catch (e) {}
				},
				from.playerid,
				to.playerid,
				colorKey
			);
		} catch (e) {}
	};

	api.setAura = function (player) {
		try {
			if (!player) {
				return;
			}
			const key = formKeyOf(player);
			if (key !== "gold" && key !== "dark") {
				return;
			}
			// 客机上 game.broadcastAll 会直接 return，所以先本地执行再广播
			const pid = player.playerid;
			const run = function (pid2, form) {
				try {
					window.lsxFx.aura(pid2, form);
				} catch (e) {}
			};
			try {
				game.broadcast(run, pid, key);
			} catch (e) {}
			run(pid, key);
		} catch (e) {}
	};

	api.clearAura = function (player) {
		try {
			if (!player) {
				return;
			}
			const pid = player.playerid;
			const run = function (pid2) {
				try {
					window.lsxFx.clearAura(pid2);
				} catch (e) {}
			};
			try {
				game.broadcast(run, pid);
			} catch (e) {}
			run(pid);
		} catch (e) {}
	};

	api.taiji = function (player, mode) {
		try {
			if (!player) {
				return;
			}
			const yin = Number(player.storage && player.storage.shj_yin) || 0;
			const yang = Number(player.storage && player.storage.shj_yang) || 0;
			const pid = player.playerid;
			const run = function (pid2, y, g, max, md) {
				try {
					window.lsxFx.taiji(pid2, y, g, max, md);
				} catch (e) {}
			};
			try {
				game.broadcast(run, pid, yin, yang, TAIJI_MAX, mode || "show");
			} catch (e) {}
			run(pid, yin, yang, TAIJI_MAX, mode || "show");
		} catch (e) {}
	};

	api.voice = function (files) {
		try {
			if (!files) {
				return;
			}
			const list = Array.isArray(files) ? files : [files];
			const urls = list.map((f) => lib.assetURL + "extension/" + PKG + "/audio/" + f);
			const run = function (arr) {
				try {
					window.lsxFx.playSeq(arr);
				} catch (e) {}
			};
			try {
				game.broadcast(run, urls);
			} catch (e) {}
			run(urls);
		} catch (e) {}
	};

	api.formShow = function () {
		try {
			const run = function () {
				try {
					window.lsxFx.formShow();
				} catch (e) {}
			};
			try {
				game.broadcast(run);
			} catch (e) {}
			run();
		} catch (e) {}
	};

	api.syncButtons = syncButtons;
	api.clearAll = clearAllFx;
	api.syncPackVisibility = syncLixinPackVisibility;

	// 隐藏形态：启动即同步一次，并在每次武将包加载完成后重新同步（覆盖武将界面/联机选将）
	try {
		ensureHiddenForms();
		syncLixinPackVisibility();
		if (
			lib.element &&
			lib.element.content &&
			typeof lib.element.content.loadPackage === "function" &&
			!lib.element.content._shjLixinPatched
		) {
			const originLoadPackage = lib.element.content.loadPackage;
			lib.element.content._shjLixinPatched = true;
			lib.element.content.loadPackage = async function (event, trigger, player) {
				const result = await originLoadPackage.call(this, event, trigger, player);
				try {
					syncLixinPackVisibility();
				} catch (e) {}
				return result;
			};
		}
	} catch (e) {}

	// 台词音量翻倍：本包李信系列（shuoye_lx）的语音改走增益通道，其余保持引擎原逻辑
	try {
		if (!game._shjVoiceBoostPatched) {
			game._shjVoiceBoostPatched = true;
			const originPlayAudio = game.playAudio;
			game.playAudio = function (...args) {
				try {
					const options =
						args.length === 1 && args[0] && typeof args[0] === "object"
							? args[0]
							: { path: args.filter((a) => typeof a === "string" || typeof a === "number").join("/") };
					const path = String(options.path || "");
					if (/shuoye_lx/i.test(path) && /\.(mp3|ogg|wav)$/i.test(path)) {
						if (_status.video && !options.video) {
							return;
						}
						if (lib.config && lib.config.background_speak === false) {
							return;
						}
						let parsed = path;
						if (parsed.startsWith("ext:")) {
							parsed = parsed.replace(/^ext:/, "extension/");
						} else if (!/^https?:/i.test(parsed)) {
							parsed = parsed.startsWith("audio/") ? parsed : "audio/" + parsed;
						}
						const url = /^https?:/i.test(parsed) ? parsed : lib.assetURL + parsed;
						playBoosted(url, null);
						return;
					}
				} catch (e) {}
				return originPlayAudio.apply(this, args);
			};
		}
	} catch (e) {}

	// 联机：客机点击瞬发技按钮后，由主机执行
	try {
		lib.message.server.shuoye_lx_shunfa_click = function (playerid, skillname) {
			try {
				const player = findPlayerByPid(playerid);
				const skill = player && lib.skill[skillname];
				if (!player || !skill || typeof skill.doAction !== "function") {
					return;
				}
				if (!player.isAlive || !player.isAlive()) {
					return;
				}
				if (player.storage && player.storage.shj_shunfa_cd > 0) {
					return;
				}
				if (typeof skill.clickableFilter === "function") {
					let ok = false;
					try {
						ok = !!skill.clickableFilter(player);
					} catch (e) {
						ok = false;
					}
					if (!ok) {
						return;
					}
				}
				player.storage.shj_shunfa_cd = 1;
				const done = () => {
					try {
						player.storage.shj_shunfa_cd = 0;
						syncButtons();
					} catch (e) {}
				};
				let run;
				try {
					run = skill.doAction(player);
				} catch (e) {
					done();
					return;
				}
				if (run && typeof run.then === "function") {
					run.then(done, done);
				} else {
					done();
				}
			} catch (e) {}
		};
	} catch (e) {}

	// 离开对局/回菜单时清理残留
	try {
		if (Array.isArray(lib.onfree) && !lib._shjLixinOnfree) {
			lib._shjLixinOnfree = true;
			lib.onfree.push(function () {
				try {
					clearAllFx();
				} catch (e) {}
			});
		}
	} catch (e) {}

	// 低频兜底同步（只做 DOM 查询与状态刷新，成本极低）
	try {
		if (typeof setInterval === "function" && !window._shjLixinBtnTimer) {
			window._shjLixinBtnTimer = setInterval(function () {
				try {
					syncLixinPackVisibility();
				} catch (e) {}
				try {
					relayoutTaiji();
				} catch (e) {}
				try {
					if (!game || !game.me || !game.players) {
						return;
					}
					syncButtons();
				} catch (e) {}
			}, 900);
		}
	} catch (e) {}
}

export { SKILL, FORM_LIXIN, FORM_GUANG, FORM_AN, TAIJI_MAX };
