// Helper functions
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import childProcess from 'child_process';
import { console } from './log';

export default class Helper {
  static async question(q: string) {
    const rl = readline.createInterface({ input, output });
    const a = await rl.question(q);
    rl.close();
    return a;
  }
  static formatTime(t: number) {
    const days = Math.floor(t / 86400);
    const hours = Math.floor((t % 86400) / 3600);
    const minutes = Math.floor(((t % 86400) % 3600) / 60);
    const seconds = t % 60;
    const daysS = days > 0 ? `${days}d` : '';
    const hoursS = daysS || hours ? `${daysS}${daysS && hours < 10 ? '0' : ''}${hours}h` : '';
    const minutesS = minutes || hoursS ? `${hoursS}${hoursS && minutes < 10 ? '0' : ''}${minutes}m` : '';
    const secondsS = `${minutesS}${minutesS && seconds < 10 ? '0' : ''}${seconds}s`;
    return secondsS;
  }

  static cleanupFilename(n: string) {
    /* eslint-disable no-extra-boolean-cast, no-useless-escape, no-control-regex */
    const fixingChar = '_';
    const illegalRe = /[\/\?<>\\:\*\|":]/g;
    const controlRe = /[\x00-\x1f\x80-\x9f]/g;
    const reservedRe = /^\.+$/;
    const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
    const windowsTrailingRe = /[\. ]+$/;
    return n
      .replace(illegalRe, fixingChar)
      .replace(controlRe, fixingChar)
      .replace(reservedRe, fixingChar)
      .replace(windowsReservedRe, fixingChar)
      .replace(windowsTrailingRe, fixingChar);
  }

  static exec(
    pname: string,
    fpath: string,
    pargs: string,
    spc = false
  ):
    | {
        isOk: true;
      }
    | {
        isOk: false;
        err: Error & { code: number };
      } {
    pargs = pargs ? ' ' + pargs : '';
    console.info(`\n> "${pname}"${pargs}${spc ? '\n' : ''}`);
    try {
      if (process.platform === 'win32') {
        childProcess.execSync('& ' + fpath + pargs, { stdio: 'inherit', shell: 'powershell.exe', windowsHide: true });
      } else {
        childProcess.execSync(fpath + pargs, { stdio: 'inherit' });
      }
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
  }
}
