import yargs, { Choices } from 'yargs';
import { args, AvailableMuxer, groups } from './module.args';
import { LanguageItem } from './module.langsData';

let argvC: { [x: string]: unknown; ccTag: string, defaultAudio: LanguageItem, defaultSub: LanguageItem, ffmpegOptions: string[], mkvmergeOptions: string[], force: 'Y'|'y'|'N'|'n'|'C'|'c', skipUpdate: boolean, videoTitle: string, override: string[], fsRetryTime: number, forceMuxer: AvailableMuxer|undefined; username: string|undefined, password: string|undefined, silentAuth: boolean, skipSubMux: boolean, downloadArchive: boolean, addArchive: boolean, but: boolean, auth: boolean | undefined; dlFonts: boolean | undefined; search: string | undefined; 'search-type': string; page: number | undefined; 'search-locale': string; new: boolean | undefined; 'movie-listing': string | undefined; series: string | undefined; s: string | undefined; e: string | undefined; q: number; x: number; kstream: number; partsize: number; hslang: string; dlsubs: string[]; novids: boolean | undefined; noaudio: boolean | undefined; nosubs: boolean | undefined; dubLang: string[]; all: boolean; fontSize: number; allDubs: boolean; timeout: number; simul: boolean; mp4: boolean; skipmux: boolean | undefined; fileName: string; numbers: number; nosess: string; debug: boolean | undefined; nocleanup: boolean; help: boolean | undefined; service: 'funi' | 'crunchy'; update: boolean; fontName: string | undefined; _: (string | number)[]; $0: string; };
    
export type ArgvType = typeof argvC;  

const appArgv = (cfg: {
  [key: string]: unknown
}) => {
  if (argvC)
    return argvC;
  yargs(process.argv.slice(2));
  const argv = getArgv(cfg)
    .parseSync();
  argvC = argv;
  return argv;
};


const overrideArguments = (cfg: { [key:string]: unknown }, override: Partial<typeof argvC>) => {
  const argv = getArgv(cfg).middleware((ar) => {
    for (const key of Object.keys(override)) {
      ar[key] = override[key];
    }
  }).parseSync();
  argvC = argv;
};
    
export {
  appArgv,
  overrideArguments
};
    
const getArgv = (cfg: { [key:string]: unknown }) => {
  const parseDefault = <T = unknown>(key: string, _default: T) : T=> {
    if (Object.prototype.hasOwnProperty.call(cfg, key)) {
      return cfg[key] as T;
    } else
      return _default;
  };
      
  const argv = yargs.parserConfiguration({
    'duplicate-arguments-array': false,
    'camel-case-expansion': false,
  })
    .wrap(yargs.terminalWidth())
    .usage('Usage: $0 [options]')
    .help(true).version(false);
  const data = args.map(a => {
    return {
      ...a,
      group: groups[a.group],
      default: typeof a.default === 'object' && !Array.isArray(a.default) ? 
        parseDefault(a.default.name || a.name, a.default.default) : a.default
    };
  });
  for (const item of data)
    argv.option(item.name, {
      ...item,
      coerce: (value) => {
        if (item.transformer) {
          return item.transformer(value);
        } else {  
          return value;
        }
      },
      choices: item.choices as unknown as Choices
    });
  return argv as unknown as yargs.Argv<typeof argvC>;
};
      
      