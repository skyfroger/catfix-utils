import { HAT_BLOCKS } from "../parser";
// заголовочные блоки
// opcode procedures_definition - блок определения функции
const HATS = [...HAT_BLOCKS, "procedures_definition"];
/**
 * Определяем, находится ли блок в "живом" скрипте
 * @param sp спрайт или сцена
 * @param blockId строка с идентификатором блока
 * @returns блок в живом скрипте
 */
export function isBlockAlive(sp, targetBlockId) {
    var _a, _b;
    const blocks = sp.blocks; // объект с блоками
    const block = blocks[targetBlockId];
    // if (block.shadow) {
    //     return true;
    // }
    // блок-шапка без наследников - мёртвый код
    if (HATS.includes(block.opcode) && block.next === null) {
        return false;
    }
    // у блока нет родителей и наследников
    if (block.next === null && block.parent === null) {
        return false;
    }
    // цепочка блоков не приводит к блоку шапке
    let blockId = targetBlockId;
    let lastBlockId = targetBlockId;
    let opCode = "";
    do {
        opCode = (_a = blocks[blockId !== null && blockId !== void 0 ? blockId : ""]) === null || _a === void 0 ? void 0 : _a.opcode;
        lastBlockId = blockId;
        blockId = (_b = blocks[blockId !== null && blockId !== void 0 ? blockId : ""]) === null || _b === void 0 ? void 0 : _b.parent;
    } while (blockId);
    if (!HATS.includes(opCode)) {
        return false;
    }
    return true;
}
/**
 * Возвращает количество валидных скриптов в проекте
 * @param jsonProject исходный проект
 * @returns число скриптов
 */
export function validScriptsCount(jsonProject) {
    let count = 0;
    jsonProject.targets.forEach((target) => {
        const blocks = target.blocks;
        for (const key in blocks) {
            if (HATS.includes(blocks[key].opcode) &&
                isBlockAlive(target, key)) {
                count++;
            }
        }
    });
    return count;
}
/**
 * Проверяет наличие указанного кода операции
 * @param jsonProject проект
 * @param opCode код операции
 * @param validator логическая функция для дополнительной валидации блока-кандидата
 * @returns есть ли блок с указанным кодом операции внутри валидного скрипта
 */
export function opcodeCount(jsonProject, opCode, validator = (b) => true) {
    let count = 0;
    jsonProject.targets.forEach((target) => {
        count += opcodeCountAtTarget(target, opCode, validator);
    });
    return count;
}
/**
 * Сколько раз опкод встречается в каждом элементе по отдельности
 * @param jsonProject код проекта
 * @param opCode код операции
 * @param validator функция валидации
 * @returns массив
 */
export function opcodeCountArray(jsonProject, opCode, validator = (b) => true) {
    const countArr = [];
    jsonProject.targets.forEach((target) => {
        countArr.push(opcodeCountAtTarget(target, opCode, validator));
    });
    return countArr;
}
/**
 * Подсчёт количества блоков в заданном элементе
 * @param target элемент
 * @param opCode код операции
 * @param validator функция-валидатор
 * @returns количество блоков
 */
export function opcodeCountAtTarget(target, opCode, validator = (b) => true) {
    let count = 0;
    const blocks = target.blocks;
    for (const key in blocks) {
        if (blocks[key].opcode === opCode &&
            validator(blocks[key]) &&
            isBlockAlive(target, key)) {
            count++;
        }
    }
    return count;
}
/**
 * Получаем массив блоков по коду операции
 * @param jsonProject код проекта
 * @param opCode код операции
 * @param isAliveBlocksOnly оставлять только "живые блоки"
 * @param validator функция-валидатор
 * @returns массив блоков
 */
export function filterBlocksByOpcode(jsonProject, opCode, validator = (b) => true, isAliveBlocksOnly = true) {
    const filterResult = []; // итоговый массив блоков
    jsonProject.targets.forEach((target) => {
        const blocks = target.blocks;
        for (const key in blocks) {
            if (blocks[key].opcode === opCode &&
                validator(blocks[key]) &&
                (isAliveBlocksOnly ? isBlockAlive(target, key) : true)) {
                filterResult.push(blocks[key]);
            }
        }
    });
    return filterResult;
}
