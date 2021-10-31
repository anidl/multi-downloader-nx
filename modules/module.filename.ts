import * as shlp from "sei-helper";
import path from "path";
import { AvailableFilenameVars } from "./module.app-args";


export type Variable = ({
  type: 'number',
  replaceWith: number
} | {

}) & {
  name: AvailableFilenameVars
}

const parseFileName = (input: string, variables: Variable[], numbers: number): string[] => {
  const varRegex = /\${[A-Za-z1-9]+}/g;
  const vars = input.match(varRegex);
  if (!vars)
    return [input];
  for (let i = 0; i < vars.length; i++) {
    const type = vars[i];
    const varName = type.slice(2, -1).toLowerCase();
    const use = variables.find(a => a.name === varName);
    if (use === undefined) {
      console.log(`[ERROR] Found variable '${type}' in fileName but no values was internally found!`)
      continue;
    }
    
    if (use.type === 'number') {
      const len = use.replaceWith.toFixed(0).length;
      const replaceStr = len < numbers ? '0'.repeat(numbers - len) + use.replaceWith : use.replaceWith.toFixed(0);
      input = input.replace(type, replaceStr); 
    } else {
      input = input.replace(type, use.replaceWith)
    }
  }
  return input.split(path.sep).map(a => shlp.cleanupFilename(a));
}

export default parseFileName;