import parseProject from './parser/index';
import grader, {getMaxGrade, getTotalGrade} from "./graders";
import {scanForWarnings, scanForErrors} from "./scaners";

export {parseProject};
export {grader, getTotalGrade, getMaxGrade};
export {scanForWarnings, scanForErrors};