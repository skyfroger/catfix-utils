import { Target } from "../scratch";

import { HAT_BLOCKS } from "../parser";


// заголовочные блоки
// opcode procedures_definition - блок определения функции
const HATS = [...HAT_BLOCKS, "procedures_definition"];

/**
 * Определяем, находится ли блок в "живом" скрипте
 * @param sp спрайт или сцена
 * @param blockId строка с идентификатором блока
 */
export function isBlockAlive(sp: Target, targetBlockId: string):boolean{
    const blocks = sp.blocks; // объект с блоками
    const block = blocks[targetBlockId];

    // if (block.shadow) {
    //     return true;
    // }

    // блок-шапка без наследников - мёртвый код
    if (HATS.includes(block.opcode) && block.next === null) {
        return false
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
        return false
    }

    return true;
}