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
    keys,
    parallel,
} from "./mock_projects/index.ts";

const p = parallel as unknown;
const parsedP = parseProject(p as ScratchProject);

console.log(grader(p as ScratchProject, parsedP));
// console.log(scanForWarnings(parsedP, p as ScratchProject));
