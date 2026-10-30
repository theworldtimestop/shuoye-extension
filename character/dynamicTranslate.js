import { lib, game, ui, get, ai, _status } from "noname"

const dynamicTranslates = {
    shuoyekuangyan(player, skill) {
        if (get.mode() == "boss") {
            return "出牌阶段限一次，你可移除自身护甲，令体力与手牌数等于体力上限，然后令一名角色失去你回复量+消耗护甲量体力，弃置你摸牌数牌。你下一次受到伤害时免疫之，并对来源造成原先你受到的伤害。";
        }
        return lib.translate[skill + "_info"];
    },
	shuoyeweilian(player, skill) {
		const bool = player.storage[skill];
        let yang = "你受到大于一的伤害后[阴]:你造成的伤害+1。可将任意牌当【酒】、【杀】使用或打出。",
            yin = "造成大于一伤害后[阳]:你获得牌时摸一张牌，体力上限+1。";
        if (bool) {
            yin = `<span class='bluetext'>${yin}</span>`;
        } else {
            yang = `<span class='firetext'>${yang}</span>`;
        }
        let start = `转换技，初始阳`,
            end = `你每轮首次切换形态后开启一轮${get.poptip("shuoyeliangjie")}。`;
        return `${start}①${yang}②${yin}${end}`;
	},
    shuoye_zuosha_fx(player) {
        try {
            const info = lib.skill.shuoye_zuosha;
            if (player && info && typeof info.currentEffectText === "function") {
                const text = info.currentEffectText(player);
                if (text) return text;
            }
        } catch (e) {}
        return "坐杀博徒当前触发的效果。";
    },
    shuoye_jingtian(player, skill) {
        const info = lib.translate[skill + "_info"] || "";
        if (get.mode() === "boss" && info.indexOf("限定技，") === 0) {
            return "每回合限一次，" + info.slice(4);
        }
        return info;
    },
};
export default dynamicTranslates;
