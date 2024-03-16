import { escapeSB, sbCode } from "../parser";
import { HAT_BLOCKS } from "../parser";
// заголовочные блоки
// opcode procedures_definition - блок определения функции
const HATS = [...HAT_BLOCKS, "procedures_definition"];
/**
 * Поиск пустых спрайтов
 * @param project
 * @param projectJSON
 */
export const emptySprite = (project, projectJSON) => {
    let result = [];
    project.sprites.forEach((sp) => {
        if (sp.scripts.length === 0) {
            result.push({
                code: null,
                payload: { spriteName: sp.name },
                type: "warning",
                title: "warning.emptySpriteTitle",
                message: "warning.emptySprite",
            });
        }
    });
    return result;
};
/**
 * Поиск спрайтов в которых нет комментариев
 * @param project
 * @param projectJSON
 */
export const noComments = (project, projectJSON) => {
    let result = [];
    // считаем, что скрипт длиной 20 блоков должен обладать комментарием
    const LONG_SCRIPT_LENGTH = 20;
    // сначала проверяем сцену...
    // если на сцене есть скрипты, но нет ни одного комментария
    // находим длину самого большого скрипта
    const maxScriptLength = Math.max(...project.stage.scripts.map((s) => s
        .split("\n")
        .filter((line) => line.trim() != "end" && line.trim() != "else").length), 0);
    if (maxScriptLength >= LONG_SCRIPT_LENGTH && !project.stage.comments) {
        result.push({
            code: null,
            payload: {
                target: project.stage.name,
                maxLength: String(maxScriptLength),
            },
            type: "warning",
            title: "warning.noCommentsTitle",
            message: "warning.noComments",
        });
    }
    // потом спрайты
    project.sprites.forEach((sp) => {
        // находим длину самого большого скрипта
        const maxScriptLength = Math.max(...sp.scripts.map((s) => s
            .split("\n")
            .filter((line) => line.trim() != "end" && line.trim() != "else").length), 0);
        if (maxScriptLength >= LONG_SCRIPT_LENGTH && !sp.comments) {
            result.push({
                code: null,
                payload: {
                    target: sp.name,
                    maxLength: String(maxScriptLength),
                },
                type: "warning",
                title: "warning.noCommentsTitle",
                message: "warning.noComments",
            });
        }
    });
    return result;
};
/**
 * Поиск скриптов, которые перекрывают друг друга
 * @param project
 * @param projectJSON
 */
export const scriptsOverlap = (project, projectJSON) => {
    let result = [];
    /*
    Алгоритм поиска пересечений взят тут
    https://medium.com/@jessgillan/algorithm-practice-rectangle-intersection-7821411fd114
    */
    /**
     * Функция поиска пересечений в скриптах одного спрайта
     * @param sprite
     */
    function findIntersections(sprite) {
        let result = [];
        for (let i = 0; i < sprite.coords.length - 1; i++) {
            for (let j = i + 1; j < sprite.coords.length; j++) {
                const r1 = sprite.coords[i];
                const r2 = sprite.coords[j];
                const intersect = r1.x <= r2.x + r2.w &&
                    r1.x + r1.w >= r2.x &&
                    r1.y <= r2.y + r2.h &&
                    r1.y + r1.h >= r2.y;
                if (i !== j && intersect) {
                    // todo возможны ошибки, когда получаем первые строчки скриптов
                    const firstHat = sprite.scripts[i].split("\n")[0];
                    const secondHat = sprite.scripts[j].split("\n")[0];
                    result.push({
                        code: `${firstHat}\n${secondHat}`,
                        payload: { target: sprite.name },
                        type: "warning",
                        title: "warning.scriptsOverlapTitle",
                        message: "warning.scriptsOverlap",
                    });
                }
            }
        }
        return result;
    }
    // поиск пересечений в скриптах сцены
    result.push(...findIntersections(project.stage));
    // поиск пересечений в скриптах спрайтов
    project.sprites.forEach((sprite, index) => {
        result.push(...findIntersections(sprite));
    });
    return result;
};
/**
 * Поиск переменных, которые не используются
 * @param project
 * @param projectJSON
 */
export const unusedVariables = (project, projectJSON) => {
    let result = [];
    // Перебираем глобальные переменные, которые хранятся в сцене
    project.stage.localVars.forEach((v) => {
        const escV = escapeSB(v); // "избегаем" специальные символы
        // если переменная не встречается ни в одном из подходящих блоков
        // добавляем замечание
        if (!project.allScripts.includes(`set [${escV} v] to`) &&
            !project.allScripts.includes(`change [${escV} v]`) &&
            !project.allScripts.includes(`(${escV}::variables)`) &&
            !project.allScripts.includes(`([${escV} v] of [${project.stage.name} v]::sensing)`)) {
            result.push({
                code: `(${escapeSB(v, false)}::variable)`,
                payload: { variable: v, target: project.stage.name },
                type: "warning",
                title: "warning.unusedVariableTitle",
                message: "warning.unusedVariable",
            });
        }
    });
    // перебираем локальные переменные
    project.sprites.forEach((sp) => {
        sp.localVars.forEach((v) => {
            const escV = escapeSB(v); // "избегаем" специальные символы
            // если переменная не встречается ни в одном из подходящих блоков
            // добавляем замечание
            if (!sp.allScripts.includes(`set [${escV} v] to`) &&
                !sp.allScripts.includes(`change [${escV} v]`) &&
                !sp.allScripts.includes(`(${escV}::variables)`) &&
                !project.allScripts.includes(`([${escV} v] of [${sp.name} v]::sensing)`)) {
                result.push({
                    code: `(${escapeSB(v, false)}::variable)`,
                    payload: { variable: v, target: sp.name },
                    type: "warning",
                    title: "warning.unusedVariableTitle",
                    message: "warning.unusedVariable",
                });
            }
        });
    });
    return result;
};
/**
 * Поиск потерянного кода
 * @param project
 * @param projectJSON
 */
export const lostCode = (project, projectJSON) => {
    let result = [];
    // перебираем все спрайты проекта
    projectJSON.targets.forEach((target) => {
        const tip = findLostBlocks(target);
        if (tip)
            result.push(tip);
    });
    return result;
};
/**
 * Поиск потерянного кода
 * @param sp спрайт для поиска
 */
function findLostBlocks(sp) {
    var _a, _b;
    const blocks = sp.blocks; // объект с блоками
    try {
        // перебираем все блоки по их ключам
        for (const [key, block] of Object.entries(blocks)) {
            // сразу пропускаем shadow-блоки
            if (block.shadow) {
                continue;
            }
            // если блок - Шляпа под которой нет блоков - потерянный блок
            if (HATS.includes(block.opcode) && block.next === null) {
                const script = sbCode(key, blocks);
                return {
                    code: script,
                    payload: { target: sp.name },
                    type: "warning",
                    title: "warning.lostCodeTitle",
                    message: "warning.lostCode",
                };
            }
            // если в блоке нет ссылки на предыдущий и на следующий блок
            if (block.next === null && block.parent === null) {
                const script = sbCode(key, blocks);
                return {
                    code: script,
                    payload: { target: sp.name },
                    type: "warning",
                    title: "warning.lostCodeTitle",
                    message: "warning.lostCode",
                };
            }
            // движемся от текущего блока вверх по ссылкам
            // если не придём к hat-блоку, значит нашли потеряшек
            let blockId = key;
            let lastBlockId = key;
            let opCode = "";
            do {
                opCode = (_a = blocks[blockId !== null && blockId !== void 0 ? blockId : ""]) === null || _a === void 0 ? void 0 : _a.opcode;
                lastBlockId = blockId;
                blockId = (_b = blocks[blockId !== null && blockId !== void 0 ? blockId : ""]) === null || _b === void 0 ? void 0 : _b.parent;
            } while (blockId);
            if (!HATS.includes(opCode)) {
                const script = sbCode(lastBlockId, blocks);
                return {
                    code: script,
                    payload: { target: sp.name },
                    type: "warning",
                    title: "warning.lostCodeTitle",
                    message: "warning.lostCode",
                };
            }
        }
    }
    catch (e) {
        console.error(e);
    }
    return null;
}
/**
 * Поиск длинных скриптов. Предельная длина задаётся константой MAX_LENGTH внутри функции
 * @param project
 * @param projectJSON
 */
export const scriptIsTooLong = (project, projectJSON) => {
    // считаем скрипт длинным после этого количества строк
    const MAX_LENGTH = 80;
    const result = [];
    function findLongScripts(sprite) {
        const result = [];
        // перебираем все скрипты
        sprite.scripts.forEach((script) => {
            // получаем массив строк без end и else
            const lines = script
                .split("\n")
                .filter((line) => !["end", "else"].includes(line));
            if (lines.length > MAX_LENGTH) {
                result.push({
                    code: lines[0],
                    payload: {
                        target: sprite.name,
                        length: String(lines.length),
                    },
                    type: "warning",
                    title: "warning.scriptIsTooLongTitle",
                    message: "warning.scriptIsTooLong",
                });
            }
        });
        return result;
    }
    // перебираем все спрайты
    project.sprites.forEach((sp) => {
        result.push(...findLongScripts(sp));
    });
    // проверяем скрипты сцены
    result.push(...findLongScripts(project.stage));
    return result;
};
/**
 * Ищем спрайты со стандартными именами
 * @param project
 * @param projectJSON
 */
export const spriteStandardName = (project, projectJSON) => {
    // начальные названия спрайтов на разных языках
    // взял в репозитории программы LitterBox
    const STANDARD_SPRITE_NAMES = [
        "Actor",
        "Ator",
        "Ciplun",
        "Duszek",
        "Figur",
        "Figura",
        "Gariņš",
        "Hahmo",
        "Kihusika",
        "Kukla",
        "Lik",
        "Nhân",
        "Objeto",
        "Parehe",
        "Personaj",
        "Personatge",
        "Pertsonaia",
        "Postava",
        "Pêlîstik",
        "Sprait",
        "Sprajt",
        "Sprayt",
        "Sprid",
        "Sprite",
        "Sprìd",
        "Szereplő",
        "Teikning",
        "Umlingisi",
        "Veikėjas",
        "Αντικείμενο",
        "Анагӡаҩ",
        "Дүрс",
        "Лик",
        "Спрайт",
        "Կերպար",
        "דמות",
        "الكائن",
        "تەن",
        "شکلک",
        "สไปรต์",
        "სპრაიტი",
        "ገፀ-ባህርይ",
        "តួអង្គ",
        "スプライト",
        "角色",
        "스프라이트",
    ];
    const result = [];
    project.sprites.forEach((sprite) => {
        // перебираем стандартные имена
        STANDARD_SPRITE_NAMES.every((name) => {
            // имя спрайта похоже на стандартное
            if (sprite.name.includes(name)) {
                result.push({
                    type: "warning",
                    code: null,
                    payload: { target: sprite.name },
                    title: "warning.spriteStandardNameTitle",
                    message: "warning.spriteStandardName",
                });
                return false; // останавливаем перебор стандартных имён
            }
            return true;
        });
    });
    return result;
};
