import { Project } from "../parsedProject";
export type categories = "flow" | "data" | "logic" | "parallel" | "abstract" | "sync" | "interactivity";
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
declare function grader(project: Project): Map<categories, graderResult>;
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
