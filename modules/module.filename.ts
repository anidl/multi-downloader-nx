import * as shlp from 'sei-helper';
import path from 'path';
import { AvailableFilenameVars } from './module.args';


export type Variable<T extends string = AvailableFilenameVars> = ({
  type: 'number',
  replaceWith: number
} | {
  type: 'string',
  replaceWith: string
}) & {
  name: T
}

const parseFileName = (input: string, variables: Variable[], numbers: number, override: string[]): string[] => {
  const varRegex = /\${[A-Za-z1-9]+}/g;
  const vars = input.match(varRegex);
  const overridenVars = parseOverride(variables, override);
  if (!vars)
    return [input];
  for (let i = 0; i < vars.length; i++) {
    const type = vars[i];
    const varName = type.slice(2, -1);
    const use = overridenVars.find(a => a.name === varName);
    if (use === undefined) {
      console.log(`[ERROR] Found variable '${type}' in fileName but no values was internally found!`);
      continue;
    }
    
    if (use.type === 'number') {
      const len = use.replaceWith.toFixed(0).length;
      const replaceStr = len < numbers ? '0'.repeat(numbers - len) + use.replaceWith : use.replaceWith.toFixed(0);
      input = input.replace(type, replaceStr); 
    } else {
      input = input.replace(type, use.replaceWith);
    }
  }
  return input.split(path.sep).map(a => shlp.cleanupFilename(a));
};

const parseOverride = (variables: Variable[], override: string[]): Variable<string>[] => {
  const vars: Variable<string>[] = variables;
  override.forEach(item => {
    console.log(item);
    let index = item.indexOf('=');
    if (index === -1)
      return logError(item, 'invalid');
    let parts = [ item.slice(0, index), item.slice(index + 1) ];
    if (!(parts[1].startsWith('\'') && parts[1].endsWith('\'') && parts[1].length >= 2)) 
      return logError(item, 'invalid');
    parts[1] = parts[1].slice(1, -1);
    let already = vars.findIndex(a => a.name === parts[0]);
    console.log(parts);
    if (already > -1) {
      if (vars[already].type === 'number') {
        if (isNaN(parseFloat(parts[1])))
          return logError(item, 'wrongType');
          vars[already].replaceWith = parseFloat(parts[1]);
      } else {
        vars[already].replaceWith = parts[1];
      }
    } else {
      let isNumber = !isNaN(parseFloat(parts[1]));
      vars.push({
        name: parts[0],
        replaceWith: isNumber ? parseFloat(parts[1]) : parts[1],
        type: isNumber ? 'number' : 'string'
      } as Variable<string>)
    }
  })

  return variables;
}

const logError = (override: string, reason: 'invalid'|'wrongType') => {
  switch (reason) {
    case 'wrongType':
      console.error(`[ERROR] Invalid type on \`${override}\`. Expected number but found string. It has been ignored`);
      break;
    case 'invalid':
    default:
      console.error(`[ERROR] Invalid override \`${override}\`. It has been ignored`);
  }
}

export default parseFileName;