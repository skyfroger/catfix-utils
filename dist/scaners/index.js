// импорт функций сканирования
import { lostCode, emptySprite, unusedVariables, noComments, scriptsOverlap, scriptIsTooLong, spriteStandardName, } from "./warnings";
import { literalComparison, messageNeverReceived, messageNeverSent, varWithoutInit, } from "./errors";
// в этой переменной хранится массив функций, которые отвечают
// за получения списка предупреждений
const warningFunctions = [
    lostCode,
    spriteStandardName,
    unusedVariables,
    scriptsOverlap,
    scriptIsTooLong,
    noComments,
    emptySprite,
];
// храним функции для поиска ошибок
const errorFunctions = [
    varWithoutInit,
    literalComparison,
    messageNeverReceived,
    messageNeverSent,
];
/**
 * Функция перебирает передаваемый в неё массив функций,
 * которые ищут предупреждения и ошибки в коде
 * @param project
 * @param projectJSON
 * @param tipFunctions
 */
const scanForTips = (project, projectJSON, tipFunctions) => {
    let result = [];
    tipFunctions.forEach((fn) => {
        result.push(...fn(project, projectJSON));
    });
    return result;
};
export const scanForWarnings = (project, projectJSON) => {
    return scanForTips(project, projectJSON, warningFunctions);
};
export const scanForErrors = (project, projectJSON) => {
    return scanForTips(project, projectJSON, errorFunctions);
};
