/**
 * Набор функций которые находят предупреждения (warnings)
 */
import { tipFunctionInterface } from "./types";
/**
 * Поиск пустых спрайтов
 * @param project
 * @param projectJSON
 */
export declare const emptySprite: tipFunctionInterface;
/**
 * Поиск спрайтов в которых нет комментариев
 * @param project
 * @param projectJSON
 */
export declare const noComments: tipFunctionInterface;
/**
 * Поиск скриптов, которые перекрывают друг друга
 * @param project
 * @param projectJSON
 */
export declare const scriptsOverlap: tipFunctionInterface;
/**
 * Поиск переменных, которые не используются
 * @param project
 * @param projectJSON
 */
export declare const unusedVariables: tipFunctionInterface;
/**
 * Поиск потерянного кода
 * @param project
 * @param projectJSON
 */
export declare const lostCode: tipFunctionInterface;
/**
 * Поиск длинных скриптов. Предельная длина задаётся константой MAX_LENGTH внутри функции
 * @param project
 * @param projectJSON
 */
export declare const scriptIsTooLong: tipFunctionInterface;
/**
 * Ищем спрайты со стандартными именами
 * @param project
 * @param projectJSON
 */
export declare const spriteStandardName: tipFunctionInterface;
