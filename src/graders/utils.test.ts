import { Block, ScratchProject } from "../scratch";
import { aliveBlocks, multipleScripts } from "../../mock_projects/aliveBlocks";

import { isBlockAlive, validScriptsCount, opcodeCount } from "./utils";

const p = aliveBlocks as unknown;
const jsonProject = p as ScratchProject;
const target = jsonProject.targets[1];

const j = multipleScripts as unknown;
const jsonProjectMultiple = j as ScratchProject;

describe("Функция isBlockAlive - блок в живом скрипте", () => {
    test("Скрипт существует, начинаем с шапки", () => {
        expect(isBlockAlive(target, "1?9fU3?-B[s}O%,:3ZEN")).toBe(true);
    });

    test("Скрипт существует, начинаем с вложенного блока", () => {
        expect(isBlockAlive(target, "r+s1^O$y-6%p-$aK?_W1")).toBe(true);
    });

    test("Скрипт не существует, одинокая шапка", () => {
        expect(isBlockAlive(target, ";C:ayf%[gA_-qAcW_cv/")).toBe(false);
    });

    test("Скрипт не существует, одиночный блок", () => {
        expect(isBlockAlive(target, "Int#0SK-``}TuR9Zj1kY")).toBe(false);
    });

    test("Скрипт не существует, набор блоков", () => {
        expect(isBlockAlive(target, "X`eahZ#}k)Dk9WG!6*vO")).toBe(false);
    });
});

describe("Функция validScriptsCount - количество скриптов в проекте", () => {
    test("В проекте есть 1 валидный скрипт", () => {
        expect(validScriptsCount(jsonProject)).toBe(1);
    });

    test("В проекте есть 2 валидных скрипта", () => {
        expect(validScriptsCount(jsonProjectMultiple)).toBe(2);
    });
});

describe("Функция isOpcodeExists - существует ли блок с указанным кодом операции", () => {
    test("Блок существует внутри скрипта спрайта", () => {
        expect(opcodeCount(jsonProject, "event_whenflagclicked")).toBe(1);
    });

    test("if с условием и кодом внутри блока", () => {
        expect(
            opcodeCount(jsonProject, "control_if", (b: Block) => {
                // проверяем, есть ли условие и тело условного оператора
                try {
                    const inputs = b.inputs;
                    const cond = inputs?.INPUTS?.[1] !== null;
                    const body = inputs?.SUBSTACK?.[1] !== null;
                    return cond && body;
                } catch {
                    return false;
                }
            })
        ).toBe(1);
    });
});
