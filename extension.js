// game.import(name: "朔夜",用于诗笺版快捷导入识别扩展名
import { lib, game, ui, get, ai, _status } from "noname";
import { precontent } from "./main/precontent.js"
import { content } from "./main/content.js"
import { Package } from "./main/package.js"
import { config, help, files } from "./main/config.js"

export let type = "extension"

export default async function () {
    let extension = {
        name: "朔夜",
        // 联机标记：不加的话引擎在 connect 模式会整份跳过 content（init/loading.js），
        // 白蛇无懈、桃 selectTarget 保护、get.attitude 兜底、get.infoFuncOL 容错、
        // 里香 characterFilter、评级/词条都会在联机里失效。precontent 不受此限制。
        connect: true,
        editable: false,
        content: content,
        precontent: precontent,
        config: config,
        help: help,
        package: Package,
        files: files
    }
    return extension
}