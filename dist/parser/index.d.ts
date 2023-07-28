/**
 * Вспомогательные функции для парсинга проекта
 */
import { Project } from "../parsedProject";
import { Block, ScratchProject } from "../scratch";
export declare const HAT_BLOCKS: string[];
export declare const PROCEDURES_PROTOTYPE = "procedures_prototype";
/**
 * Эскейпим символы в строке, которые помешают парсингу Scratchblocks
 * @param text входной текст
 * @param onlyRight нужно ли эскейпить только закрывающие скобки или все
 */
export declare function escapeSB(text: string, onlyRight?: boolean): string;
declare function parseProject(scratchProject: ScratchProject): Project;
/**
 * Функция для быстрого получения Scratchblock-кода, когда это возможно
 * @param key ключ
 * @param blocks объект с блоками
 */
export declare function sbCode(key: string, blocks: {
    [p: string]: Block;
}): string | null;
export default parseProject;
