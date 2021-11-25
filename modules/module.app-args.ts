import yargs from 'yargs';
import * as langsData from './module.langsData';

yargs(process.argv.slice(2));

const groups = {
  'auth': 'Authentication:',
  'fonts': 'Fonts:',
  'search': 'Search:',
  'dl': 'Downloading:',
  'mux': 'Muxing:',
  'fileName': 'Filename Template:',
  'debug': 'Debug:',
  'util': 'Utilities:'
};

export type AvailableFilenameVars =  'title' | 'episode' | 'showTitle' | 'season' | 'width' | 'height' | 'service'

const availableFilenameVars: AvailableFilenameVars[] = [
  'title',
  'episode',
  'showTitle',
  'season',
  'width',
  'height',
  'service'
];

export type possibleDubs = (
  'enUS' | 'esLA' | 'ptBR' | 'zhMN' | 'jaJP'
  )[]; 
export type possibleSubs = (
    'enUS' | 'esLA' | 'ptBR'
    )[];
const subLang: possibleSubs = ['enUS', 'esLA', 'ptBR'];
const dubLang: possibleDubs = ['enUS', 'esLA', 'ptBR', 'zhMN', 'jaJP'];
let argvC: { [x: string]: unknown; skipSubMux: boolean, downloadArchive: boolean, addArchive: boolean, but: boolean, auth: boolean | undefined; dlFonts: boolean | undefined; search: string | undefined; 'search-type': string; page: number | undefined; 'search-locale': string; new: boolean | undefined; 'movie-listing': string | undefined; series: string | undefined; s: string | undefined; e: string | undefined; q: number; x: number; kstream: number; partsize: number; hslang: string; subLang: string[]; dlsubs: string | string[]; novids: boolean | undefined; noaudio: boolean | undefined; nosubs: boolean | undefined; dub: possibleDubs; dubLang: string; all: boolean; fontSize: number; allSubs: boolean; allDubs: boolean; timeout: number; simul: boolean; mp4: boolean; skipmux: boolean | undefined; fileName: string; numbers: number; nosess: string; debug: boolean | undefined; nocleanup: boolean; help: boolean | undefined; service: 'funi' | 'crunchy'; update: boolean; fontName: string | undefined; _: (string | number)[]; $0: string; };
    
export type ArgvType = typeof argvC;  

const appArgv = (cfg: {
  [key: string]: unknown
}) => {
  if (argvC)
    return argvC;
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
    return ar;
  }).parseSync();
  argvC = argv;
};

const showHelp = yargs.showHelp;
    
export {
  appArgv,
  showHelp,
  availableFilenameVars,
  subLang,
  dubLang,
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
    .help(false).version(false)
    .option('auth', {
      group: groups.auth,
      describe: 'Enter authentication mode',
      type: 'boolean'
    })
    .option('dlFonts', {
      group: groups.fonts,
      describe: 'Download all required fonts for mkv muxing',
      type: 'boolean'
    })
    .option('search', {
      group: groups.search,
      alias: 'f',
      describe: 'Search for an anime',
      type: 'string'
    })
    .option('search-type', {
      group: groups.search,
      describe: 'Search type used for crunchyroll',
      choices: [ '', 'top_results', 'series', 'movie_listing', 'episode' ],
      default: '',
      type: 'string',
    })
    .option('page', {
      group: groups.search,
      alias: 'p',
      describe: 'Page number for search results',
      type: 'number',
    })
    .option('search-locale', {
      group: groups.search,
      describe: 'Search locale used for crunchyroll',
      choices: langsData.searchLocales,
      default: '',
      type: 'string',
    })
    .option('new', {
      group: groups.dl,
      describe: 'Get last updated series list from crunchyroll',
      type: 'boolean',
    })
    .option('movie-listing', {
      group: groups.dl,
      alias: 'flm',
      describe: 'Get video list by Movie Listing ID',
      type: 'string',
    })
    .option('series', {
      group: groups.dl,
      alias: 'srz',
      describe: 'Get season list by Series ID',
      type: 'string',
    })
    .option('s', {
      group: groups.dl,
      describe: 'Set the season ID',
      type: 'string'
    })
    .option('e', {
      group: groups.dl,
      alias: 'episode',
      describe: 'Sets the Episode Number/IDs (comma-separated, hyphen-sequence)',
      type: 'string',
    })
    .option('q', {
      group: groups.dl,
      describe: 'Set the quality layer. Use 0 to get the best quality.',
      default: parseDefault<number>('videoLayer', 7),
      type: 'number'
    })
    .option('x', {
      group: groups.dl,
      alias: 'server',
      describe: 'Select server',
      choices: [1, 2, 3, 4],
      default: parseDefault<number>('nServer', 1),
      type: 'number',
    })
    .option('kstream', {
      group: groups.dl,
      alias: 'k',
      describe: 'Select specific stream for crunchyroll',
      choices: [1, 2, 3, 4, 5, 6, 7],
      default: parseDefault<number>('kStream', 1),
      type: 'number',
    })
    .option('partsize', {
      group: groups.dl,
      describe: 'Set the amount of parts that should be downloaded in paralell',
      type: 'number',
      default: parseDefault<number>('partsize', 10)
    })
    .option('hslang', {
      group: groups.dl,
      describe: 'Download video with specific hardsubs',
      choices: langsData.subtitleLanguagesFilter.slice(1),
      default: parseDefault<string>('hsLang', 'none'),
      type: 'string',
    })
    .option('subLang', {
      group: groups.dl,
      describe: 'Set the subtitles to download (Funi only)',
      choices: subLang, 
      default: parseDefault<string[]>('subLang', []),
      type: 'array'
    })
    .option('dlsubs', {
      group: groups.dl,
      describe: 'Download subtitles by language tag (space-separated) (crunchy only)',
      choices: langsData.subtitleLanguagesFilter,
      default: parseDefault<string|string[]>('dlSubs', 'all'),
      type: 'array',
    })
    .option('novids', {
      group: groups.dl,
      describe: 'Skip downloading videos',
      type: 'boolean'
    })
    .option('noaudio', {
      group: groups.dl,
      describe: 'Skip downloading audio',
      type: 'boolean'
    })
    .option('nosubs', {
      group: groups.dl,
      describe: 'Skip downloading subtitles',
      type: 'boolean'
    })
    .option('dub', {
      group: groups.dl,
      describe: 'Set languages to download (funi only)',
      choices: dubLang,
      default: parseDefault<possibleDubs>('dub', ['enUS']),
      type: 'array'
    })
    .option('dubLang', {
      group: groups.dl,
      describe: 'Set the language to download (Crunchy only)',
      choices: langsData.dubLanguageCodes,
      default: parseDefault('dubLanguage', langsData.dubLanguageCodes.slice(-1)[0]),
      array: true,
    })
    .option('all', {
      group: groups.dl,
      describe: 'Used to download all episodes from the show',
      type: 'boolean',
      default: parseDefault<boolean>('all', false)
    })
    .option('fontSize', {
      group: groups.dl,
      describe: 'Used to set the fontsize of the subtitles',
      default: parseDefault<number>('fontSize', 55),
      type: 'number'
    })
    .option('allSubs', {
      group: groups.dl,
      describe: 'If set to true, all available subs will get downloaded (Funi only)',
      default: false,
      type: 'boolean'
    })
    .option('allDubs', {
      group: groups.dl,
      describe: 'If set to true, all available dubs will get downloaded (Funi only)',
      default: false,
      type: 'boolean'
    })
    .option('timeout', {
      group: groups.dl,
      describe: 'Set the timeout of all download reqests. Set in millisecods',
      type: 'number',
      default: parseDefault('timeout', 60 * 1000)
    })
    .option('simul', {
      group: groups.dl,
      describe: 'Force downloading simulcast ver. instead of uncut ver. (if uncut ver. available) (Funi only)',
      default: parseDefault<boolean>('forceSimul', false),
      type: 'boolean',
    })
    .option('mp4', {
      group: groups.mux,
      describe: 'Mux video into mp4',
      default: parseDefault<boolean>('mp4mux', false),
      type: 'boolean'
    })
    .option('skipmux', {
      group: groups.mux,
      describe: 'Skip muxing video and subtitles',
      type: 'boolean'
    })
    .option('fileName', {
      group: groups.fileName,
      describe: `Set the filename template. Use \${variable_name} to insert variables.\nYou may use ${availableFilenameVars
        .map(a => `'${a}'`).join(', ')} as variables.`,
      type: 'string',
      default: parseDefault<string>('fileName', '[${service}] ${showTitle} - S${season}E${episode} [${height}p]')
    })
    .option('numbers', {
      group: groups.fileName,
      describe: `Set how long a number in the title should be at least.\n${[[3, 5, '005'], [2, 1, '01'], [1, 20, '20']]
        .map(val => `Set in config: ${val[0]}; Episode number: ${val[1]}; Output: ${val[2]}`).join('\n')}`,
      type: 'number',
      default: parseDefault<number>('numbers', 2)
    })
    .option('nosess', {
      group: groups.debug,
      type: 'boolean',
      default: 'Reset session cookie for testing purposes'
    })
    .option('debug', {
      group: groups.debug,
      describe: 'Debug mode (tokens may be revield in the console output)',
      type: 'boolean'
    })
    .option('nocleanup', {
      group: groups.util,
      describe: 'Don\'t delete subtitles and videos after muxing',
      default: parseDefault<boolean>('noCleanUp', false),
      type: 'boolean'
    })
    .option('help', {
      alias: 'h',
      group: 'Help:',
      describe: 'Show this help',
      type: 'boolean'
    })
    .option('service', {
      group: groups.util,
      describe: 'Set the service to use',
      choices: ['funi', 'crunchy'],
      demandOption: true,
      default: parseDefault<'crunchy'|'funi'|undefined>('service', undefined)
    })
    .option('update', {
      group: groups.util,
      describe: 'Force the tool to check for updates',
      type: 'boolean',
      default: false
    })
    .option('fontName', {
      group: groups.fonts,
      describe: 'Set the font to use in subtiles (Funi only)',
      type: 'string',
      default: parseDefault<string|undefined>('fontName', undefined)
    })
    .option('but', {
      group: groups.dl,
      describe: 'Download everything but',
      type: 'boolean',
      default: false
    })
    .option('downloadArchive', {
      group: groups.dl,
      desc: 'Used to download all archived shows',
      type: 'boolean',
      default: false
    })
    .option('addArchive', {
      group: groups.dl,
      desc: 'Used to add the `-s` and `--srz` to downloadArchive',
      type: 'boolean',
      default: false
    })
    .option('skipSubMux', {
      group: groups.mux,
      desc: 'Skip muxing the subtitles',
      type: 'boolean',
      default: parseDefault<boolean>('skipSubMux', false)
    });
  return argv;
};
      
      