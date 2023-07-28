import { Project } from "../parsedProject";
import { ScratchProject } from "../scratch";
import { Tip } from "./types";
export declare const scanForWarnings: (project: Project, projectJSON: ScratchProject) => Tip[];
export declare const scanForErrors: (project: Project, projectJSON: ScratchProject) => Tip[];
