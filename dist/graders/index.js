import { cloneSpriteRE, compConditionsRE, countLoopRE, foreverLoopRE, ifThenElseRE, ifThenRE, mouseInteractionRE, roundVarsRE, scriptsWithKeyPressEvent, setVarsRE, untilLoopRE, videoInteractionRE, waitCondAndBackdropRE, waitSecondsRE, } from "./searchPatterns";
import { escapeSB } from "../parser";
// список возможных оценок
export var gradesEnum;
(function (gradesEnum) {
    gradesEnum[gradesEnum["zero"] = 0] = "zero";
    gradesEnum[gradesEnum["one"] = 1] = "one";
    gradesEnum[gradesEnum["two"] = 2] = "two";
    gradesEnum[gradesEnum["three"] = 3] = "three";
})(gradesEnum || (gradesEnum = {}));
function flowGrader(project) {
    /**
     * Поток выполнения: только следование или использование различных циклов.
     */
    let g = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };
    // считаем количество скриптов в спрайтах проекта
    const scriptsCount = project.sprites.reduce((previousValue, currentSprite) => {
        return previousValue + currentSprite.scripts.length;
    }, 0);
    // даём 1 балл, если есть хотя бы 1 скрипт на сцене или в спрайте
    if (project.stage.scripts.length > 0 || scriptsCount > 0) {
        g.grade = gradesEnum.one;
    }
    // даём 2 балла, если есть бесконечный цикл или счётный цикл
    if (foreverLoopRE.test(project.allScripts) ||
        countLoopRE.test(project.allScripts)) {
        g.grade = gradesEnum.two;
    }
    // даём 3 балла, если есть цикл с предусловием
    if (untilLoopRE.test(project.allScripts)) {
        g.grade = gradesEnum.three;
    }
    return g;
}
function dataRepresentationGrader(project) {
    /**
     * Представление данных: использование переменных и списков
     */
    let g = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };
    // даём 1 балл, если в блоках используются только числа-литералы
    if (new RegExp("\\(\\d+\\)").test(project.allScripts)) {
        g.grade = gradesEnum.one;
    }
    // даём 2 балл, если переменной задаётся начальное значение и переменные есть в блоках скрипта
    if (setVarsRE.test(project.allScripts) &&
        roundVarsRE.test(project.allScripts)) {
        g.grade = gradesEnum.two;
    }
    // все переменные-списки в сцене
    const allStageLists = project.stage.localLists.join(" v|");
    // все переменные-списки в спрайтах
    const allSpriteLists = project.sprites.reduce((previousValue, currentValue) => {
        return previousValue + " v|" + currentValue.localLists.join(" v|");
    }, "");
    // регулярное выражения для поиска переменных-списков в скриптах
    const listsRE = new RegExp(`${allStageLists}${allSpriteLists} v`);
    // количество переменных-списков
    const listsNum = project.stage.localLists.length +
        project.sprites.reduce((previousValue, currentValue) => {
            return previousValue + currentValue.localLists.length;
        }, 0);
    // даём 3 балла, если в скриптах есть списки и они используются
    if (new RegExp("\\((.)+::list\\)").test(project.allScripts) ||
        (listsNum !== 0 && listsRE.test(project.allScripts))) {
        g.grade = gradesEnum.three;
    }
    return g;
}
function logicGrader(project) {
    /**
     * Логика: условные операторы и составные условия
     */
    let g = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };
    // даём 1 балл, если есть оператор если ... то
    if (ifThenRE.test(project.allScripts)) {
        g.grade = gradesEnum.one;
    }
    // даём 2 балла, если есть оператор если ... то ... иначе
    if (ifThenElseRE.test(project.allScripts)) {
        g.grade = gradesEnum.two;
    }
    // даём 3 балла за составные условия
    // todo нужно проверять не пустые ли блоки, в которых встречаются составные условия
    if (compConditionsRE.test(project.allScripts)) {
        g.grade = gradesEnum.three;
    }
    return g;
}
function parallelismGrader(project) {
    /**
     * Параллельное выполнение скриптов
     */
    let g = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };
    // считаем, сколько спрайтов содержат скрипт, начинающийся с зелёного флажка
    // todo возможно потом нужно будет учитывать и скрипты на сцене
    const spritesWithGreenFlag = project.sprites.filter((spr) => {
        return spr.allScripts.includes("when @greenFlag clicked");
    });
    if (spritesWithGreenFlag.length > 1) {
        g.grade = gradesEnum.one;
    }
    // ищем спрайты, клик по которым запускает больше одного сприпта
    const spritesWithClicks = project.sprites.filter((spr) => {
        const clk = spr.allScripts.match(/when this sprite clicked/g);
        return clk && clk.length > 1;
    });
    // ищем скрипты, которые запускаются по нажатию на клавишу
    const keyEventMatches = project.allScripts.matchAll(scriptsWithKeyPressEvent);
    // в множество сохраняем названия клавиш
    const keys = new Set(Array.from(keyEventMatches).map((match) => {
        // по индексу 1 будет храниться название клавиши
        return match[1];
    }));
    // перебираем все клавиши и считает, сколько сприптов запускаеются по нажатию этой клавиши
    let keyFlag = [];
    keys.forEach((k) => {
        // создаём RE которое содержит название очередной клавиши
        const re = new RegExp(`when \\[${k}\\] key pressed::event`, "g");
        // находим все скрипты стартующие по этой клавише
        const matches = project.allScripts.matchAll(re);
        // сохраняем в массиве keyFlag значение true, если найдено больше 1 скрипта
        keyFlag.push(Array.from(matches).length > 1);
    });
    if (spritesWithClicks.length > 0 || keyFlag.includes(true)) {
        g.grade = gradesEnum.two;
    }
    // даём 3 балла, если одно сообщение запускает больше 1 скрипта
    let broadcastsFlag = [];
    project.broadcasts.forEach((b) => {
        try {
            // создаём RE которое содержит название очередного сообщения
            const re = new RegExp(`when I receive \\[${b} v\\]`, "g");
            // находим все скрипты стартующие по этому сообщению
            const matches = project.allScripts.matchAll(re);
            // сохраняем в массиве broadcastsFlag значение true, если найдено больше 1 скрипта
            broadcastsFlag.push(Array.from(matches).length > 1);
        }
        catch (e) { }
    });
    // TODO добавить поиск скриптов запускаемых по смене громкости и фона
    if (broadcastsFlag.includes(true)) {
        g.grade = gradesEnum.three;
    }
    return g;
}
function abstractGrader(project) {
    /**
     * Оценка уровня абстракции: количество скриптов, собственные блоки,
     * использование клонов спрайтов
     */
    let g = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };
    // есть ли собственные блоки, которые вызываются больше одного раза
    let customBlocksUsageCount = [];
    // использовались ли блоки с параметрами
    let isCustomBlockParamsUsed = false;
    project.sprites.forEach((sp) => {
        // проверяем собственные блоки на валидность (в них есть команды)
        sp.customBlocks.forEach((customB) => {
            const blockSplited = customB.split(" "); // название и параметры в виде массива
            const blockName = blockSplited[0]; // оставляет имя блока без параметров
            // Чтобы правильно работало регулярное выражение, когда в имени процедуры есть скобки
            // приходится вызвать эскейп-функцию трижды. Другого решения у меня пока нет
            const escapedBlockName = escapeSB(escapeSB(escapeSB(blockName, false), false), false);
            const customBRE = new RegExp(`define ${escapedBlockName}.*\\n(.+\\n)+`);
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
                isCustomBlockParamsUsed =
                    blockSplited.includes("%s") || blockSplited.includes("%b");
            }
        });
    });
    // 1 балл, если используются собственные блоки
    if (customBlocksUsageCount.includes(true)) {
        g.grade = gradesEnum.one;
    }
    // 2 балла, если используется клонирование спрайтов
    // todo сейчас нужно и создать клон И использовать блок "когда я начинаю как клон"
    if (cloneSpriteRE.test(project.allScripts) &&
        project.allScripts.includes("when I start as a clone")) {
        g.grade = gradesEnum.two;
    }
    // 3 балла, если используются блоки с параметрами
    if (isCustomBlockParamsUsed) {
        g.grade = gradesEnum.three;
    }
    return g;
}
function syncGrader(project) {
    let g = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };
    // даём 1 балл, если есть блок ждать n секунд
    if (waitSecondsRE.test(project.allScripts)) {
        g.grade = gradesEnum.one;
    }
    // проверяем список сообщений: каждое должно быть отправлено и получено хотя бы 1 раз
    let broadcastsFlag = [];
    project.broadcasts.forEach((b) => {
        const escapedBroadcast = escapeSB(b);
        broadcastsFlag.push((project.allScripts.includes(`broadcast [${escapedBroadcast} v]`) ||
            project.allScripts.includes(`broadcast [${escapedBroadcast} v] and wait`)) &&
            project.allScripts.includes(`when I receive [${escapedBroadcast} v]`));
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
function interactivityGrader(project) {
    let g = {
        grade: gradesEnum.zero,
        maxGrade: gradesEnum.three,
    };
    // 1 балл, если скрипт стартует по щелчку по спрайту
    if (project.allScripts.includes("when this sprite clicked\n")) {
        g.grade = gradesEnum.one;
    }
    // 2 балла за использование мыши или ввод текста с клавиатуры
    // при этом для ввода должен быть и сам блок ввода и блок с ответом
    const askRE = new RegExp("ask \\[.+\\] and wait\\n");
    const answer = new RegExp("\\(answer\\)");
    if (mouseInteractionRE.test(project.allScripts) ||
        (askRE.test(project.allScripts) && answer.test(project.allScripts))) {
        g.grade = gradesEnum.two;
    }
    // 3 балла за использования микрофона или камеры
    const whenLoudRE = new RegExp("when \\[loudness v\\] \\\\> \\(.+\\)\\n");
    const loudness = new RegExp("\\(loudness\\)");
    if (videoInteractionRE.test(project.allScripts) ||
        whenLoudRE.test(project.allScripts) ||
        loudness.test(project.allScripts)) {
        g.grade = gradesEnum.three;
    }
    return g;
}
function grader(project) {
    /**
     * Функция-агрегатор результатов оценивания по разным критериям
     */
    let res = new Map();
    res.set("flow", flowGrader(project)); // оценка потока выполнения;
    res.set("data", dataRepresentationGrader(project)); // оценка представления данных
    res.set("logic", logicGrader(project)); // оценка использования логических операторов
    res.set("parallel", parallelismGrader(project)); // оценка параллелизма
    res.set("abstract", abstractGrader(project)); // оценка абстрактности
    res.set("sync", syncGrader(project)); // оценка синхронизации спрайтов
    res.set("interactivity", interactivityGrader(project)); // оценка интерактивности проекта
    return res;
}
/**
 * Вычисляем суммарную оценку
 * @param grades оценки проекта
 */
function getTotalGrade(grades) {
    return Array.from(grades.values()).reduce((previousGrade, currentGrade) => {
        return previousGrade + currentGrade.grade;
    }, 0);
}
/**
 * Вычисляем максимально возможную оценку
 * @param grades оценки проекта
 */
function getMaxGrade(grades) {
    return Array.from(grades.values()).reduce((prGrade, curGrade) => prGrade + curGrade.maxGrade, 0);
}
export { getTotalGrade, getMaxGrade };
export default grader;
