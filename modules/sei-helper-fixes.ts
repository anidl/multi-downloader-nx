import childProcess from 'child_process';
import { console } from './log';

const exec = (pname: string, fpath: string, pargs: string, spc = false): {
  isOk: true
} | {
  isOk: false,
  err: Error & { code: number }
} => {
  pargs = pargs ? ' ' + pargs : '';
  console.info(`\n> "${pname}"${pargs}${spc ? '\n' : ''}`);
  try {
    childProcess.execSync((fpath + pargs), { stdio: 'inherit' });
    return {
      isOk: true
    };
  } catch (er) {
    const err = er as Error & { status: number };
    return {
      isOk: false,
      err: {
        ...err,
        code: err.status
      }
    };
  }
};

export { exec };