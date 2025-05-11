import path from 'path';
import { AvailableFilenameVars } from './module.args';
import { console } from './log';
import Helper from './module.helper';

export type Variable<T extends string = AvailableFilenameVars> = ({
  type: 'number',
  replaceWith: number
} | {
  type: 'string',
  replaceWith: string
}) & {
  name: T,
  sanitize?: boolean
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
    let use = overridenVars.find(a => a.name === varName);
    if (use === undefined && type === '${height}') {
      use = { type: 'number', replaceWith: 0 } as Variable<string>;
    }
    if (use === undefined) {
      console.info(`[ERROR] Found variable '${type}' in fileName but no values was internally found!`);
      continue;
    }
    
    if (use.type === 'number') {
      const len = use.replaceWith.toFixed(0).length;
      const replaceStr = len < numbers ? '0'.repeat(numbers - len) + use.replaceWith : use.replaceWith+'';
      input = input.replace(type, replaceStr); 
    } else {
      if (use.sanitize) 
        use.replaceWith = Helper.cleanupFilename(use.replaceWith);
      input = input.replace(type, use.replaceWith);
    }
  }
  return input.split(path.sep).map(a => Helper.cleanupFilename(a));
};

const parseOverride = (variables: Variable[], override: string[]): Variable<string>[] => {
  const vars: Variable<string>[] = variables;
  override.forEach(item => {
    const index = item.indexOf('=');
    if (index === -1)
      return logError(item, 'invalid');
    const parts = [ item.slice(0, index), item.slice(index + 1) ];
    if (!(parts[1].startsWith('\'') && parts[1].endsWith('\'') && parts[1].length >= 2)) 
      return logError(item, 'invalid');
    parts[1] = parts[1].slice(1, -1);
    const already = vars.findIndex(a => a.name === parts[0]);
    if (already > -1) {
      if (vars[already].type === 'number') {
        if (isNaN(parseFloat(parts[1])))
          return logError(item, 'wrongType');
        vars[already].replaceWith = parseFloat(parts[1]);
      } else {
        vars[already].replaceWith = parts[1];
      }
    } else {
      const isNumber = !isNaN(parseFloat(parts[1]));
      vars.push({
        name: parts[0],
        replaceWith: isNumber ? parseFloat(parts[1]) : parts[1],
        type: isNumber ? 'number' : 'string'
      } as Variable<string>);
    }
  });

  return variables;
};

const logError = (override: string, reason: 'invalid'|'wrongType') => {
  switch (reason) {
  case 'wrongType':
    console.error(`[ERROR] Invalid type on \`${override}\`. Expected number but found string. It has been ignored`);
    break;
  case 'invalid':
  default:
    console.error(`[ERROR] Invalid override \`${override}\`. It has been ignored`);
  }
};

export default parseFileName;