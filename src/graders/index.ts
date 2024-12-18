import { Project } from "../parsedProject";
import { Block, ScratchProject } from "../scratch";
import {
    cloneSpriteRE,
    compConditionsRE,
    countLoopRE,
    foreverLoopRE,
    ifThenElseRE,
    ifThenRE,
    mouseInteractionRE,
    roundVarsRE,
    scriptsWithKeyPressEvent,
    setVarsRE,
    untilLoopRE,
    videoInteractionRE,
    waitCondAndBackdropRE,
    waitSecondsRE,
    loudnessTimerBgChangeRE,
    waitThinkSayRE,
} from "./searchPatterns";
import { validScriptsCount, opcodeCount, opcodeCountArray } from "./utils";
import { escapeSB } from "../parser";

/*
Интерфейс для описания типа оценки
 */

// список названий категорий оценивания
export type categories =
    | "flow"
    | "data"
    | "logic"
    | "parallel"
    | "abstract"
    | "sync"
    | "interactivity";

// список возможных оценок
export enum gradesEnum {
    zero = 0,
    one = 1,
    two = 2,
    three = 3,
}

// функция оценивания возвращает максимальную оценку, чтобы корректно считать
// максимально возможное количество баллов
export type graderResult = {
    grade: gradesEnum; // оценка за категорию
    maxGrade: gradesEnum; // максимальная оценка за категорию
};

function flowGrader(
    jsonProject: ScratchProject,
    project: Project
): graderResult {
    /**
     * Поток выполнения: только следование или использование различных циклов.
     */

    let g: graderResult = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };

    if (validScriptsCount(jsonProject) > 0) {
        g.grade = gradesEnum.one;
    }

    const foreverLoopCount = opcodeCount(
        jsonProject,
        "control_forever",
        (b: Block) => {
            const inputs = b.inputs;
            const body = "SUBSTACK" in inputs && inputs?.SUBSTACK?.[1] !== null;
            return body;
        }
    );

    const countLoopNumber = opcodeCount(
        jsonProject,
        "control_repeat",
        (b: Block) => {
            const inputs = b.inputs;
            const body = "SUBSTACK" in inputs && inputs?.SUBSTACK?.[1] !== null;
            console.log("repeat", inputs, body);
            return body;
        }
    );

    // даём 2 балла, если есть бесконечный цикл или счётный цикл
    if (foreverLoopCount > 0 || countLoopNumber > 0) {
        g.grade = gradesEnum.two;
    }

    // ищем цикл с условием в котором есть условие и внутрение блоки
    const repeatUntilLoopNumber = opcodeCount(
        jsonProject,
        "control_repeat_until",
        (b: Block) => {
            const inputs = b.inputs;
            const hasStackAndCondition =
                "SUBSTACK" in inputs &&
                inputs?.SUBSTACK?.[1] !== null &&
                "CONDITION" in inputs &&
                inputs?.CONDITION?.[1] !== null;
            console.log("repeat_until", inputs, hasStackAndCondition);
            return hasStackAndCondition;
        }
    );

    // даём 3 балла, если есть цикл с предусловием
    if (repeatUntilLoopNumber > 0) {
        g.grade = gradesEnum.three;
    }

    return g;
}

function dataRepresentationGrader(project: Project): graderResult {
    /**
     * Представление данных: использование переменных и списков
     */
    let g: graderResult = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };

    // даём 1 балл, если в блоках используются только числа-литералы
    if (new RegExp("\\(\\d+\\)").test(project.allScripts)) {
        g.grade = gradesEnum.one;
    }

    // даём 2 балл, если переменной задаётся начальное значение и переменные есть в блоках скрипта
    if (
        setVarsRE.test(project.allScripts) &&
        roundVarsRE.test(project.allScripts)
    ) {
        g.grade = gradesEnum.two;
    }

    // все переменные-списки в сцене
    const allStageLists = project.stage.localLists.join(" v|");

    // все переменные-списки в спрайтах
    const allSpriteLists = project.sprites.reduce(
        (previousValue, currentValue) => {
            return previousValue + " v|" + currentValue.localLists.join(" v|");
        },
        ""
    );

    // регулярное выражения для поиска переменных-списков в скриптах
    const listsRE = new RegExp(`${allStageLists}${allSpriteLists} v`);

    // количество переменных-списков
    const listsNum =
        project.stage.localLists.length +
        project.sprites.reduce((previousValue, currentValue) => {
            return previousValue + currentValue.localLists.length;
        }, 0);

    // даём 3 балла, если в скриптах есть списки и они используются
    if (
        new RegExp("\\((.)+::list\\)").test(project.allScripts) ||
        (listsNum !== 0 && listsRE.test(project.allScripts))
    ) {
        g.grade = gradesEnum.three;
    }
    return g;
}

function logicGrader(
    jsonProject: ScratchProject,
    project: Project
): graderResult {
    /**
     * Логика: условные операторы и составные условия
     */
    let g: graderResult = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };

    // неполное ветвление с условием и блоками внутри
    const simpleIfThen = opcodeCount(jsonProject, "control_if", (b: Block) => {
        const inputs = b.inputs;
        const hasStackAndCondition =
            "SUBSTACK" in inputs &&
            inputs?.SUBSTACK?.[1] !== null &&
            "CONDITION" in inputs &&
            inputs?.CONDITION?.[1] !== null;
        return hasStackAndCondition;
    });

    // даём 1 балл, если есть оператор если ... то
    if (simpleIfThen > 0) {
        g.grade = gradesEnum.one;
    }

    /*
    Поиск полной записи ветвления.
    Важно! Сейчас достаточно хотя бы одного подстека.
    Формально, должно использоваться обе ветви или хотя бы ветвь иначе
    */
    const fullIfThenElse = opcodeCount(
        jsonProject,
        "control_if_else",
        (b: Block) => {
            const inputs = b.inputs;
            const hasStackAndCondition =
                (("SUBSTACK" in inputs && inputs?.SUBSTACK?.[1] !== null) ||
                    ("SUBSTACK2" in inputs &&
                        inputs?.SUBSTACK2?.[1] !== null)) &&
                "CONDITION" in inputs &&
                inputs?.CONDITION?.[1] !== null;
            return hasStackAndCondition;
        }
    );

    // даём 2 балла, если есть оператор если ... то ... иначе
    if (fullIfThenElse > 0) {
        g.grade = gradesEnum.two;
    }

    // есть логический оператор НЕ
    const logicNot = opcodeCount(jsonProject, "operator_not", (b: Block) => {
        const inputs = b.inputs;
        const hasOperand = "OPERAND" in inputs && inputs?.OPERAND?.[1] !== null;
        return hasOperand;
    });

    // есть логический оператор И
    const logicAnd = opcodeCount(jsonProject, "operator_and", (b: Block) => {
        const inputs = b.inputs;
        const hasOperands =
            "OPERAND1" in inputs &&
            "OPERAND2" in inputs &&
            inputs?.OPERAND1?.[1] !== null &&
            inputs?.OPERAND2?.[1] !== null;
        return hasOperands;
    });

    // есть логический оператор ИЛИ
    const logicOr = opcodeCount(jsonProject, "operator_or", (b: Block) => {
        const inputs = b.inputs;
        const hasOperands =
            "OPERAND1" in inputs &&
            "OPERAND2" in inputs &&
            inputs?.OPERAND1?.[1] !== null &&
            inputs?.OPERAND2?.[1] !== null;
        return hasOperands;
    });

    // даём 3 балла за составные условия
    // todo нужно проверять не пустые ли блоки, в которых встречаются составные условия
    if (logicNot + logicAnd + logicOr > 0) {
        g.grade = gradesEnum.three;
    }

    return g;
}

function parallelismGrader(
    jsonProject: ScratchProject,
    project: Project
): graderResult {
    /**
     * Параллельное выполнение скриптов
     */
    let g: graderResult = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };

    // считаем, сколько спрайтов содержат скрипт, начинающийся с зелёного флажка
    const greenFlagScripts = opcodeCount(jsonProject, "event_whenflagclicked");
    if (greenFlagScripts > 1) {
        g.grade = gradesEnum.one;
    }

    // ищем спрайты, клик по которым запускает больше одного сприпта
    // фильтруем массив и оставляем только те элементы, в которых
    // клик по спрайту встречается от двух раз
    const spriteClickedHat = opcodeCountArray(
        jsonProject,
        "event_whenthisspriteclicked"
    ).filter((count) => count > 1).length;

    // ищем скрипты, которые запускаются по нажатию на клавишу
    const keyEventMatches = project.allScripts.matchAll(
        scriptsWithKeyPressEvent
    );
    // в множество сохраняем названия клавиш
    const keys = new Set(
        Array.from(keyEventMatches).map((match) => {
            // по индексу 1 будет храниться название клавиши
            return match[1];
        })
    );
    // перебираем все клавиши и считает, сколько сприптов запускаеются по нажатию этой клавиши
    let keyFlag: boolean[] = [];
    keys.forEach((k) => {
        // создаём RE которое содержит название очередной клавиши
        const re = new RegExp(`when \\[${k}\\] key pressed::event`, "g");
        // находим все скрипты стартующие по этой клавише
        const matches = project.allScripts.matchAll(re);
        // сохраняем в массиве keyFlag значение true, если найдено больше 1 скрипта
        keyFlag.push(Array.from(matches).length > 1);
    });

    if (spriteClickedHat > 0 || keyFlag.includes(true)) {
        g.grade = gradesEnum.two;
    }

    // даём 3 балла, если одно сообщение запускает больше 1 скрипта
    let automaticHatsFlag: boolean[] = [];
    project.broadcasts.forEach((b) => {
        try {
            // создаём RE которое содержит название очередного сообщения
            const re = new RegExp(`when I receive \\[${b} v\\]`, "g");
            // находим все скрипты стартующие по этому сообщению
            const matches = project.allScripts.matchAll(re);
            // сохраняем в массиве broadcastsFlag значение true, если найдено больше 1 скрипта
            automaticHatsFlag.push(Array.from(matches).length > 1);
        } catch (e) {}
    });

    try {
        const loudnessChangeRE = new RegExp("when \\[loudness v\\].+\\n", "g");
        // Считаем количество "шапок" срабатывающих по смене громкости
        const loudnessChangeHats =
            project.allScripts.matchAll(loudnessChangeRE);

        const timerChangeRE = new RegExp("when \\[timer v\\].+\\n", "g");
        // Считаем количество "шапок" срабатывающих по смене таймера
        const timerChangeHats = project.allScripts.matchAll(timerChangeRE);

        const backdropChangeRE = new RegExp(
            "when backdrop switches to [.+ v]\n",
            "g"
        );
        // Считаем количество "шапок" срабатывающих по смене фона
        const backdropChangeHats =
            project.allScripts.matchAll(backdropChangeRE);

        automaticHatsFlag.push(
            Array.from(loudnessChangeHats).length > 1 ||
                Array.from(timerChangeHats).length > 1 ||
                Array.from(backdropChangeHats).length > 1
        );
    } catch (e) {}

    if (automaticHatsFlag.includes(true)) {
        g.grade = gradesEnum.three;
    }

    return g;
}

function abstractGrader(project: Project): graderResult {
    /**
     * Оценка уровня абстракции: количество скриптов, собственные блоки,
     * использование клонов спрайтов
     */
    let g: graderResult = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };

    // есть ли собственные блоки, которые вызываются больше одного раза
    let customBlocksUsageCount: boolean[] = [];

    // использовались ли блоки с параметрами
    let isCustomBlockParamsUsed: boolean[] = [];

    // поиск собственных блоков в скриптах сцены
    project.stage.customBlocks.forEach((customB) => {
        const blockSplited = customB.split(" "); // название и параметры в виде массива
        const blockName = blockSplited[0]; // оставляет имя блока без параметров

        // Чтобы правильно работало регулярное выражение, когда в имени процедуры есть скобки
        // приходится вызвать эскейп-функцию трижды. Другого решения у меня пока нет
        const escapedBlockName = escapeSB(
            escapeSB(escapeSB(blockName, false), false),
            false
        );

        const customBRE = new RegExp(`define ${escapedBlockName}.*\\n(.+\\n)+`);
        if (customBRE.test(project.stage.allScripts)) {
            // свой блок содержит команды
            // создаём RE которое содержит название собственного блока
            const re = new RegExp(`${escapedBlockName}.*::custom\\n`, "g");
            // находим все вызовы этого блока
            const matches = project.stage.allScripts.matchAll(re);
            // сохраняем в массиве broadcastsFlag значение true, если найдено больше 1 скрипта
            customBlocksUsageCount.push(Array.from(matches).length > 0);

            // %s - текстовый/числовой параметр, %d - логический параметр
            // TODO: пока не проверяем, используются ли эти параметры внутри собственного блока
            isCustomBlockParamsUsed.push(
                blockSplited.includes("%s") || blockSplited.includes("%b")
            );
        }
    });

    // поиск собственных блоков в скриптах спрайтов
    project.sprites.forEach((sp) => {
        // проверяем собственные блоки на валидность (в них есть команды)
        sp.customBlocks.forEach((customB) => {
            const blockSplited = customB.split(" "); // название и параметры в виде массива
            const blockName = blockSplited[0]; // оставляет имя блока без параметров

            // Чтобы правильно работало регулярное выражение, когда в имени процедуры есть скобки
            // приходится вызвать эскейп-функцию трижды. Другого решения у меня пока нет
            const escapedBlockName = escapeSB(
                escapeSB(escapeSB(blockName, false), false),
                false
            );

            const customBRE = new RegExp(
                `define ${escapedBlockName}.*\\n(.+\\n)+`
            );
            if (customBRE.test(sp.allScripts)) {
                // свой блок содержит команды
                // создаём RE которое содержит название собственного блока
                const re = new RegExp(`${escapedBlockName}.*::custom\\n`, "g");
                // находим все вызовы этого блока
                const matches = sp.allScripts.matchAll(re);
                // сохраняем в массиве broadcastsFlag значение true, если найдено больше 1 скрипта
                customBlocksUsageCount.push(Array.from(matches).length > 0);

                // %s - текстовый/числовой параметр, %d - логический параметр
                // TODO: пока не проверяем, используются ли эти параметры внутри собственного блока
                isCustomBlockParamsUsed.push(
                    blockSplited.includes("%s") || blockSplited.includes("%b")
                );
            }
        });
    });

    // 1 балл, если используются собственные блоки
    if (customBlocksUsageCount.includes(true)) {
        g.grade = gradesEnum.one;
    }

    // 2 балла, если используется клонирование спрайтов
    // todo сейчас нужно и создать клон И использовать блок "когда я начинаю как клон"
    if (
        cloneSpriteRE.test(project.allScripts) &&
        project.allScripts.includes("when I start as a clone")
    ) {
        g.grade = gradesEnum.two;
    }

    // 3 балла, если используются блоки с параметрами
    if (isCustomBlockParamsUsed.includes(true)) {
        g.grade = gradesEnum.three;
    }

    return g;
}

function syncGrader(project: Project): graderResult {
    let g: graderResult = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };

    // даём 1 балл, если есть блок ждать n секунд, говорить n секунд или думать n секунд
    if (waitThinkSayRE.test(project.allScripts)) {
        g.grade = gradesEnum.one;
    }

    // проверяем список сообщений: каждое должно быть отправлено и получено хотя бы 1 раз
    let broadcastsFlag: boolean[] = [];
    project.broadcasts.forEach((b) => {
        const escapedBroadcast = escapeSB(b);
        broadcastsFlag.push(
            (project.allScripts.includes(`broadcast [${escapedBroadcast} v]`) ||
                project.allScripts.includes(
                    `broadcast [${escapedBroadcast} v] and wait`
                )) &&
                project.allScripts.includes(
                    `when I receive [${escapedBroadcast} v]`
                )
        );
    });
    if (broadcastsFlag.includes(true)) {
        g.grade = gradesEnum.two;
    }

    // даём 3 балла за блок Ждать до и обработку события смены фона
    if (waitCondAndBackdropRE.test(project.allScripts)) {
        g.grade = gradesEnum.three;
    }

    return g;
}

function interactivityGrader(project: Project): graderResult {
    let g: graderResult = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };

    // 1 балл, если скрипт стартует по щелчку по спрайту, или есть блок Мышь нажата?
    if (
        project.allScripts.includes("when this sprite clicked\n") ||
        project.allScripts.includes("<mouse down?>")
    ) {
        g.grade = gradesEnum.one;
    }

    // 2 балла за использование мыши или ввод текста с клавиатуры
    // при этом для ввода должен быть и сам блок ввода и блок с ответом
    // плюс событие нажатия клавиши или логический блок с проверкой нажата ли клавиша
    const askRE = new RegExp("ask \\[.+\\] and wait\\n");
    const answer = new RegExp("\\(answer\\)");
    const keyboardInteractionRE = RegExp(
        "when \\[.+ v\\] key pressed::event\\n|<key \\[.+ v\\] pressed\\?>"
    );
    if (
        mouseInteractionRE.test(project.allScripts) ||
        (askRE.test(project.allScripts) && answer.test(project.allScripts)) ||
        keyboardInteractionRE.test(project.allScripts)
    ) {
        g.grade = gradesEnum.two;
    }

    // 3 балла за использования микрофона или камеры
    const whenLoudRE = new RegExp("when \\[loudness v\\] \\\\> \\(.+\\)\\n");
    const loudness = new RegExp("\\(loudness\\)");
    if (
        videoInteractionRE.test(project.allScripts) ||
        whenLoudRE.test(project.allScripts) ||
        loudness.test(project.allScripts)
    ) {
        g.grade = gradesEnum.three;
    }

    return g;
}

function grader(
    jsonProject: ScratchProject,
    project: Project
): Map<categories, graderResult> {
    /**
     * Функция-агрегатор результатов оценивания по разным критериям
     */
    let res: Map<categories, graderResult> = new Map();

    res.set("flow", flowGrader(jsonProject, project)); // оценка потока выполнения;
    res.set("data", dataRepresentationGrader(project)); // оценка представления данных
    res.set("logic", logicGrader(jsonProject, project)); // оценка использования логических операторов
    res.set("parallel", parallelismGrader(jsonProject, project)); // оценка параллелизма
    res.set("abstract", abstractGrader(project)); // оценка абстрактности
    res.set("sync", syncGrader(project)); // оценка синхронизации спрайтов
    res.set("interactivity", interactivityGrader(project)); // оценка интерактивности проекта

    return res;
}

/**
 * Вычисляем суммарную оценку
 * @param grades оценки проекта
 */
function getTotalGrade(grades: Map<categories, graderResult>) {
    return Array.from(grades.values()).reduce((previousGrade, currentGrade) => {
        return previousGrade + currentGrade.grade;
    }, 0);
}

/**
 * Вычисляем максимально возможную оценку
 * @param grades оценки проекта
 */
function getMaxGrade(grades: Map<categories, graderResult>) {
    return Array.from(grades.values()).reduce(
        (prGrade, curGrade) => prGrade + curGrade.maxGrade,
        0
    );
}

export { getTotalGrade, getMaxGrade };
export default grader;
