// интерфейс для одного предупреждения или ошибки
import { ScratchProject } from "../scratch";
import { Project } from "../parsedProject";

export interface Tip {
    type: "warning" | "error"; // тип сообщения
    title: any; // заголовок ошибки
    message: any; // строка с переводом
    payload: { [key: string]: string }; // дополнительная информация для строки-перевода
    code: string | null; // Scratch-код для наглядности
}

// интерфейс для функции, возвращающей список предупреждений или ошибок
export interface tipFunctionInterface {
    (project: Project, projectJSON: ScratchProject): Tip[];
}
