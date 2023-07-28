import { ScratchProject } from "../scratch";
import { Project } from "../parsedProject";
export interface Tip {
    type: "warning" | "error";
    title: any;
    message: any;
    payload: {
        [key: string]: string;
    };
    code: string | null;
}
export interface tipFunctionInterface {
    (project: Project, projectJSON: ScratchProject): Tip[];
}
