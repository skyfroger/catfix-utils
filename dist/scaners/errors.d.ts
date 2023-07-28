/**
 * Набор функций которые находят ошибки (error)
 */
import { tipFunctionInterface } from "./types";
/**
 * Ищем сообщения, которые никогда не принимаются
 * @param project
 * @param projectJSON
 */
export declare const messageNeverReceived: tipFunctionInterface;
/**
 * Поиск переменных, которые используются без инициализации
 * @param project
 * @param projectJSON
 */
export declare const varWithoutInit: tipFunctionInterface;
/**
 * Поиск сообщений которые принимаются, но не отправляются
 * @param project
 * @param projectJSON
 */
export declare const messageNeverSent: tipFunctionInterface;
/**
 * Поиск сравнения двух буквальных значений
 * @param project
 * @param projectJSON
 */
export declare const literalComparison: tipFunctionInterface;
