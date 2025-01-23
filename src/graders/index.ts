import { Project } from "../parsedProject";
import { Block, ScratchProject } from "../scratch";
import {
    cloneSpriteRE,
    mouseInteractionRE,
    roundVarsRE,
    setVarsRE,
    videoInteractionRE,
} from "./searchPatterns";
import {
    validScriptsCount,
    opcodeCount,
    opcodeCountArray,
    filterBlocksByOpcode,
} from "./utils";
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
    | "interactivity"
    | "math"
    | "strings";

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

    /*
    Ищем блоки с запуском по нажатию клавиши, причём код клавиши
    должен быть обязательно определён
    */
    const keyPressedBlocks = filterBlocksByOpcode(
        jsonProject,
        "event_whenkeypressed",
        (b: Block) => {
            const fields = b.fields;
            const hasOperands =
                "KEY_OPTION" in fields && fields?.KEY_OPTION?.[0] !== null;
            return hasOperands;
        }
    );

    // получаем массив используемых клавиш
    const keysUsed = keyPressedBlocks
        .map((b: Block) => {
            const fields = b.fields;
            return fields?.KEY_OPTION?.[0];
        })
        .sort();

    // запускает ли одна клавиша больше одного скрипта
    const isOneKeyFireMultipleScripts =
        keysUsed.length > new Set(keysUsed).size;

    if (spriteClickedHat > 0 || isOneKeyFireMultipleScripts) {
        g.grade = gradesEnum.two;
    }

    /*
    Запускается ли больше одного скрипта по смене фона
    */
    const isBackdropSwitching =
        opcodeCount(jsonProject, "event_whenbackdropswitchesto") > 1;

    /*
    Запускается ли больше одного скрипта по смене громкости
    */
    const isLoudnessChanging =
        opcodeCount(jsonProject, "event_whengreaterthan", (b: Block) => {
            const fields = b.fields;
            const hasLoudnessField =
                "WHENGREATERTHANMENU" in fields &&
                fields?.WHENGREATERTHANMENU?.[0] === "LOUDNESS";
            return hasLoudnessField;
        }) > 1;

    // даём 3 балла, если одно сообщение запускает больше 1 скрипта
    let isBroadcastsUsed = false;
    // перебираем все названия сообщений
    project.broadcasts.forEach((message: string) => {
        const currentBroadcastBlocks = filterBlocksByOpcode(
            jsonProject,
            "event_whenbroadcastreceived",
            (b: Block) => {
                const fields = b.fields;
                const hasMessage =
                    "BROADCAST_OPTION" in fields &&
                    fields?.BROADCAST_OPTION?.[0] === message;
                return hasMessage;
            }
        );
        if (currentBroadcastBlocks.length > 1) {
            isBroadcastsUsed = true;
        }
    });

    if (isBroadcastsUsed || isLoudnessChanging || isBackdropSwitching) {
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

function syncGrader(
    jsonProject: ScratchProject,
    project: Project
): graderResult {
    let g: graderResult = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };

    // даём 1 балл, если есть блок ждать n секунд, говорить n секунд или думать n секунд
    const isWaitUsed = opcodeCount(jsonProject, "control_wait");
    const isSayUsed = opcodeCount(jsonProject, "looks_sayforsecs");
    const isThinkUsed = opcodeCount(jsonProject, "looks_thinkforsecs");

    if (isWaitUsed || isSayUsed || isThinkUsed) {
        g.grade = gradesEnum.one;
    }

    // запуск по сообщению
    const isBroadcastReceived =
        opcodeCount(jsonProject, "event_whenbroadcastreceived") > 0;
    const isBroadcast = opcodeCount(jsonProject, "event_broadcast") > 0;
    const isBroadcastAndWait =
        opcodeCount(jsonProject, "event_broadcastandwait") > 0;

    if (isBroadcastReceived && (isBroadcast || isBroadcastAndWait)) {
        g.grade = gradesEnum.two;
    }

    // даём 3 балла за блок Ждать до и обработку события смены фона
    const isWaiUntiltUsed =
        opcodeCount(jsonProject, "control_wait_until", (b: Block) => {
            const inputs = b.inputs;
            const hasCondition = "CONDITION" in inputs;
            return hasCondition;
        }) > 0;

    const isBackdropChangedUsed =
        opcodeCount(jsonProject, "event_whenbackdropswitchesto") > 0;

    if (isWaiUntiltUsed || isBackdropChangedUsed) {
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

function mathGrader(
    jsonProject: ScratchProject,
    project: Project
): graderResult {
    /**
     * Математические операторы
     */
    let g: graderResult = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };

    let isSimpleArithmeticOpUsed = false;
    // использование простых арифметических операторов
    [
        "operator_add",
        "operator_subtract",
        "operator_multiply",
        "operator_divide",
    ].forEach((opCode) => {
        if (opcodeCount(jsonProject, opCode) > 0) {
            isSimpleArithmeticOpUsed = true;
        }
    });

    if (isSimpleArithmeticOpUsed) {
        g.grade = gradesEnum.one;
    }

    // используются случайные числа
    if (opcodeCount(jsonProject, "operator_random") > 0) {
        g.grade = gradesEnum.two;
    }

    let isComplexMathOpUsed = false;
    // использование математических функций, round, mod
    ["operator_round", "operator_mathop", "operator_mod"].forEach((opCode) => {
        if (opcodeCount(jsonProject, opCode) > 0) {
            isComplexMathOpUsed = true;
        }
    });

    if (isComplexMathOpUsed) {
        g.grade = gradesEnum.three;
    }

    return g;
}

function stringsGrader(
    jsonProject: ScratchProject,
    project: Project
): graderResult {
    /**
     * Строковые блоки
     */
    let g: graderResult = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.two,
    };

    let isSimpleStringOpUsed = false;
    // проверяем чтобы хотябы один из опкодов из списка был в проекте
    ["operator_letter_of", "operator_join", "operator_length"].forEach(
        (opCode) => {
            if (opcodeCount(jsonProject, opCode) > 0) {
                isSimpleStringOpUsed = true;
            }
        }
    );

    if (isSimpleStringOpUsed) {
        g.grade = gradesEnum.one;
    }

    // используется ли блок Содержит
    if (opcodeCount(jsonProject, "operator_contains") > 0) {
        g.grade = gradesEnum.two;
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
    res.set("sync", syncGrader(jsonProject, project)); // оценка синхронизации спрайтов
    res.set("interactivity", interactivityGrader(project)); // оценка интерактивности проекта
    res.set("math", mathGrader(jsonProject, project)); // оценка математических выражений
    res.set("strings", stringsGrader(jsonProject, project)); // оценка использования строковых блоков

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
