import yargs, { Choices } from 'yargs';
import { args, AvailableMuxer, groups } from './module.args';
import { LanguageItem } from './module.langsData';
import { DownloadInfo } from '../@types/messageHandler';
import { HLSCallback } from './hls-download';
import leven from 'leven';
import { console } from './log';
import { CrunchyVideoPlayStreams, CrunchyAudioPlayStreams } from '../@types/enums';

let argvC: { 
  [x: string]: unknown; 
  ccTag: string, 
  defaultAudio: LanguageItem, 
  defaultSub: LanguageItem, 
  ffmpegOptions: string[], 
  mkvmergeOptions: string[], 
  force: 'Y'|'y'|'N'|'n'|'C'|'c', 
  skipUpdate: boolean, 
  videoTitle: string, 
  override: string[], 
  fsRetryTime: number, 
  forceMuxer: AvailableMuxer|undefined; 
  username: string|undefined, 
  password: string|undefined, 
  token: string|undefined, 
  silentAuth: boolean, 
  skipSubMux: boolean, 
  downloadArchive: boolean, 
  addArchive: boolean, 
  but: boolean, 
  auth: boolean | undefined; 
  dlFonts: boolean | undefined; 
  search: string | undefined; 
  'search-type': string; 
  page: number | undefined; 
  locale: string; 
  new: boolean | undefined; 
  'movie-listing': string | undefined; 
  'show-raw': string | undefined; 
  'season-raw': string | undefined; 
  series: string | undefined; 
  s: string | undefined;  
  srz: string | undefined; 
  e: string | undefined; 
  extid: string | undefined; 
  q: number; 
  x: number; 
  // kstream: number;
  cstream: keyof typeof CrunchyVideoPlayStreams;
  vstream: keyof typeof CrunchyVideoPlayStreams;
  astream: keyof typeof CrunchyAudioPlayStreams;
  tsd: boolean | undefined; 
  partsize: number; 
  hslang: string; 
  dlsubs: string[]; 
  novids: boolean | undefined; 
  noaudio: boolean | undefined; 
  nosubs: boolean | undefined; 
  dubLang: string[]; 
  all: boolean; 
  fontSize: number; 
  combineLines: boolean;
  allDubs: boolean; 
  timeout: number; 
  waittime: number;
  simul: boolean; 
  mp4: boolean; 
  skipmux: boolean | undefined; 
  fileName: string; 
  numbers: number; 
  nosess: string; 
  debug: boolean | undefined;  
  raw: boolean;
  rawoutput: string;
  nocleanup: boolean; 
  help: boolean | undefined; 
  service: 'crunchy' | 'hidive' | 'ao' | 'adn'; 
  update: boolean; 
  fontName: string | undefined; 
  _: (string | number)[]; 
  $0: string; 
  dlVideoOnce: boolean; 
  chapters: boolean;
  // crapi: 'android' | 'web';
  removeBumpers: boolean;
  originalFontSize: boolean;
  keepAllVideos: boolean;
  syncTiming: boolean;
  callbackMaker?: (data: DownloadInfo) => HLSCallback;
};
    
export type ArgvType = typeof argvC;  

const appArgv = (cfg: {
  [key: string]: unknown
}, isGUI = false) => {
  if (argvC)
    return argvC;
  yargs(process.argv.slice(2));
  const argv = getArgv(cfg, isGUI)
    .parseSync();
  argvC = argv;
  return argv;
};


const overrideArguments = (cfg: { [key:string]: unknown }, override: Partial<typeof argvC>, isGUI = false) => {
  const argv = getArgv(cfg, isGUI).middleware((ar) => {
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
    
const getArgv = (cfg: { [key:string]: unknown }, isGUI: boolean) => {
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
    .help(true);
    //.strictOptions()
  const data = args.map(a => {
    return {
      ...a,
      demandOption: !isGUI && a.demandOption,
      group: groups[a.group],
      default: typeof a.default === 'object' && !Array.isArray(a.default) ? 
        parseDefault((a.default as any).name || a.name, (a.default as any).default) : a.default
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
      choices: item.name === 'service' && isGUI ? undefined : item.choices as unknown as Choices
    });

  // Custom logic for suggesting corrections for misspelled options
  argv.middleware((argv: Record<string, any>) => {
    // List of valid options
    const validOptions = [
      ...args.map(a => a.name),
      ...args.map(a => a.alias).filter(alias => alias !== undefined) as string[]
    ];
    const unknownOptions = Object.keys(argv).filter(key => !validOptions.includes(key) && key !== '_'  && key !== '$0'); // Filter out known options
  
    const suggestedOptions: Record<string, boolean> = {};
    unknownOptions.forEach(actualOption => {
      const closestOption = validOptions.find(option => {
        const levenVal = leven(option, actualOption);
        return levenVal <= 2 && levenVal > 0;
      });
      
      if (closestOption && !suggestedOptions[closestOption]) {
        suggestedOptions[closestOption] = true;
        console.info(`Unknown option ${actualOption}, did you mean ${closestOption}?`);
      } else if (!suggestedOptions[actualOption]) {
        suggestedOptions[actualOption] = true;
        console.info(`Unknown option ${actualOption}`);
      }
    });
  });
  return argv as unknown as yargs.Argv<typeof argvC>;
};