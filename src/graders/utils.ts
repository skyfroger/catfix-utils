import { Target, ScratchProject, Block } from "../scratch";

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
export function isBlockAlive(sp: Target, targetBlockId: string): boolean {
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
    let blockId: string | undefined = targetBlockId;
    let lastBlockId: string | undefined = targetBlockId;
    let opCode = "";
    do {
        opCode = blocks[blockId ?? ""]?.opcode;
        lastBlockId = blockId;
        blockId = blocks[blockId ?? ""]?.parent;
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
export function validScriptsCount(jsonProject: ScratchProject): number {
    let count = 0;
    jsonProject.targets.forEach((target) => {
        const blocks = target.blocks;
        for (const key in blocks) {
            if (
                HATS.includes(blocks[key].opcode) &&
                isBlockAlive(target, key)
            ) {
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
export function opcodeCount(
    jsonProject: ScratchProject,
    opCode: string,
    validator: (block: Block) => boolean = (b: Block) => true
): number {
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
export function opcodeCountArray(
    jsonProject: ScratchProject,
    opCode: string,
    validator: (block: Block) => boolean = (b: Block) => true
): Array<number> {
    const countArr: Array<number> = [];
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
export function opcodeCountAtTarget(
    target: Target,
    opCode: string,
    validator: (block: Block) => boolean = (b: Block) => true
): number {
    let count = 0;
    const blocks = target.blocks;
    for (const key in blocks) {
        if (
            blocks[key].opcode === opCode &&
            validator(blocks[key]) &&
            isBlockAlive(target, key)
        ) {
            count++;
        }
    }
    return count;
}
