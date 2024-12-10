import { Target, ScratchProject, Block } from "../scratch";
/**
 * Определяем, находится ли блок в "живом" скрипте
 * @param sp спрайт или сцена
 * @param blockId строка с идентификатором блока
 * @returns блок в живом скрипте
 */
export declare function isBlockAlive(sp: Target, targetBlockId: string): boolean;
/**
 * Возвращает количество валидных скриптов в проекте
 * @param jsonProject исходный проект
 * @returns число скриптов
 */
export declare function validScriptsCount(jsonProject: ScratchProject): number;
/**
 * Проверяет наличие указанного кода операции
 * @param jsonProject проект
 * @param opCode код операции
 * @param validator логическая функция для дополнительной валидации блока-кандидата
 * @returns есть ли блок с указанным кодом операции внутри валидного скрипта
 */
export declare function opcodeCount(jsonProject: ScratchProject, opCode: string, validator?: (block: Block) => boolean): number;
