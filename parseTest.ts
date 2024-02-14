import { parseProject, grader } from "./src/index.ts";
import { ScratchProject } from "./src/scratch.ts";

import {
    customBlockNoUse,
    customBlockUsed,
    clonesUsed,
    customBlockWithParams,
} from "./mock_projects/index.ts";

const p = customBlockWithParams as unknown;
const parsedP = parseProject(p as ScratchProject);

console.log(grader(parsedP));
