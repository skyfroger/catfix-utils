import { Project } from "../parsedProject";
import { ScratchProject } from "../scratch";
export type categories = "flow" | "data" | "logic" | "parallel" | "abstract" | "sync" | "interactivity" | "math" | "strings";
export declare enum gradesEnum {
    zero = 0,
    one = 1,
    two = 2,
    three = 3
}
export type graderResult = {
    grade: gradesEnum;
    maxGrade: gradesEnum;
};
declare function grader(jsonProject: ScratchProject, project: Project): Map<categories, graderResult>;
/**
 * Вычисляем суммарную оценку
 * @param grades оценки проекта
 */
declare function getTotalGrade(grades: Map<categories, graderResult>): number;
/**
 * Вычисляем максимально возможную оценку
 * @param grades оценки проекта
 */
declare function getMaxGrade(grades: Map<categories, graderResult>): number;
export { getTotalGrade, getMaxGrade };
export default grader;
