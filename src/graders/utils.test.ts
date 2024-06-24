import { ScratchProject } from "../scratch";
import { aliveBlocks } from "../../mock_projects/aliveBlocks";

import { isBlockAlive } from "./utils";

describe("Тестирование функции isBlockAlive - блок в живом скрипте", () => {
  const p = aliveBlocks as unknown;
  const jsonProject = p as ScratchProject;
  const target = jsonProject.targets[1];

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
