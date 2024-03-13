import { parseProject, grader, scanForWarnings } from "./src/index.ts";
import { ScratchProject } from "./src/scratch.ts";

import {
    customBlockNoUse,
    customBlockUsed,
    clonesUsed,
    customBlockWithParams,
    longScriptNoComments,
    onLoudnessOnBackChange,
    onMessage,
} from "./mock_projects/index.ts";

const p = longScriptNoComments as unknown;
const parsedP = parseProject(p as ScratchProject);

// console.log(grader(parsedP));
console.log(scanForWarnings(parsedP, p as ScratchProject));
