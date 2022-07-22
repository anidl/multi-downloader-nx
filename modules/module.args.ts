import { dubLanguageCodes, languages, searchLocales, subtitleLanguagesFilter } from './module.langsData';

const groups = {
  'auth': 'Authentication:',
  'fonts': 'Fonts:',
  'search': 'Search:',
  'dl': 'Downloading:',
  'mux': 'Muxing:',
  'fileName': 'Filename Template:',
  'debug': 'Debug:',
  'util': 'Utilities:',
  'help': 'Help:'
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

export type AvailableMuxer = 'ffmpeg' | 'mkvmerge'
export const muxer: AvailableMuxer[] = [ 'ffmpeg', 'mkvmerge' ];

type TAppArg<T extends boolean|string|number|unknown[], K = any> = {
  name: string,
  group: keyof typeof groups,
  type: 'boolean'|'string'|'number'|'array',
  choices?: T[],
  alias?: string,
  describe: string,
  docDescribe: true|string, // true means use describe for the docs
  default?: T|{
    default: T|undefined,
    name?: string    
  },
  service: 'funi'|'crunchy'|'both',
  usage: string // -(-)${name} will be added for each command,
  demandOption?: true,
  transformer?: (value: T) => K
}

const args: TAppArg<boolean|number|string|unknown[]>[] = [
  {
    name: 'auth',
    describe: 'Enter authentication mode',
    type: 'boolean',
    group: 'auth',
    service: 'both',
    docDescribe: 'Most of the shows on both services are only accessible if you payed for the service.'
      + '\nIn order for them to know who you are you are required to log in.'
      + '\nIf you trigger this command, you will be prompted for the username and password for the selected service',
    usage: ''
  },
  {
    name: 'dlFonts',
    group: 'fonts',
    describe: 'Download all required fonts for mkv muxing',
    docDescribe: 'Crunchyroll uses a variaty of fonts for the subtitles.'
      + '\nUse this command to download all the fonts and add them to the muxed **mkv** file.',
    service: 'crunchy',
    type: 'boolean',
    usage: ''
  },
  {
    name: 'search',
    group: 'search',
    alias: 'f',
    describe: 'Search of an anime by the given string',
    type: 'string',
    docDescribe: true,
    service: 'both',
    usage: '${search}'
  },
  {
    name: 'search-type',
    describe: 'Search by type',
    docDescribe: 'Search only for type of anime listings (e.g. episodes, series)',
    group: 'search',
    service: 'crunchy',
    type: 'string',
    usage: '${type}',
    choices: [ '', 'top_results', 'series', 'movie_listing', 'episode' ],
    default: {
      default: ''
    }
  },
  {
    name: 'page',
    alias: 'p',
    describe: 'Set the page number for search results',
    docDescribe: 'The output is organized in pages. Use this command to output the items for the given page',
    group: 'search',
    service: 'crunchy',
    type: 'number',
    usage: '${page}'
  },
  {
    name: 'search-locale',
    describe: 'Set the search locale',
    docDescribe: 'Set the search local that will be used for searching for items.',
    group: 'search',
    choices: (searchLocales.filter(a => a !== undefined) as string[]),
    default: {
      default: ''
    },
    type: 'string',
    service: 'crunchy',
    usage: '${locale}'
  },
  {
    group: 'search',
    name: 'new',
    describe: 'Get last updated series list',
    docDescribe: true,
    service: 'crunchy',
    type: 'boolean',
    usage: '',
  },
  {
    group: 'dl',
    alias: 'flm',
    name: 'movie-listing',
    describe: 'Get video list by Movie Listing ID',
    docDescribe: true,
    service: 'crunchy',
    type: 'string',
    usage: '${ID}',
  },
  {
    name: 'series',
    group: 'dl',
    alias: 'srz',
    describe: 'Get season list by series ID',
    docDescribe: 'This command is used only for crunchyroll.'
      + '\n Requested is the ID of a show not a season.',
    service: 'crunchy',
    type: 'string',
    usage: '${ID}'
  },
  {
    name: 's',
    group: 'dl',
    type: 'string',
    describe: 'Set the season ID',
    docDescribe: 'Used to set the season ID to download from',
    service: 'both',
    usage: '${ID}'
  },
  {
    name: 'e',
    group: 'dl',
    describe: 'Set the episode(s) to download from any given show',
    docDescribe: 'Set the episode(s) to download from any given show.'
      + '\nFor multiple selection: 1-4 OR 1,2,3,4 '
      + '\nFor special episodes: S1-4 OR S1,S2,S3,S4 where S is the special letter',
    service: 'both',
    type: 'string',
    usage: '${selection}',
    alias: 'epsisode'
  },
  {
    name: 'q',
    group: 'dl',
    describe: 'Set the quality level. Use 0 to use the maximum quality.',
    default: {
      default: 0
    },
    docDescribe: true,
    service: 'both',
    type: 'number',
    usage: '${qualityLevel}'
  },
  {
    name: 'x',
    group: 'dl',
    describe: 'Select the server to use',
    choices: [1, 2, 3, 4],
    default: {
      default: 1
    },
    type: 'number',
    alias: 'server',
    docDescribe: true,
    service: 'both',
    usage: '${server}'
  },
  {
    name: 'kstream',
    group: 'dl',
    alias: 'k',
    describe: 'Select specific stream',
    choices: [1, 2, 3, 4, 5, 6, 7],
    default: {
      default: 1
    },
    docDescribe: true,
    service: 'crunchy',
    type: 'number',
    usage: '${stream}'
  },
  {
    name: 'hslang',
    group: 'dl',
    describe: 'Download video with specific hardsubs',
    choices: subtitleLanguagesFilter.slice(1),
    default: {
      default: 'none'
    },
    type: 'string',
    usage: '${hslang}',
    docDescribe: true,
    service: 'crunchy'
  },
  {
    name: 'dlsubs',
    group: 'dl',
    describe: 'Download subtitles by language tag (space-separated)' 
    + `\nFuni Only: ${languages.filter(a => a.funi_locale && !a.cr_locale).map(a => a.locale).join(', ')}`
    + `\nCrunchy Only: ${languages.filter(a => a.cr_locale && !a.funi_locale).map(a => a.locale).join(', ')}`,
    docDescribe: true,
    service: 'both',
    type: 'array',
    choices: subtitleLanguagesFilter,
    default: {
      default: [ 'all' ]
    },
    usage: '${sub1} ${sub2}'
  },
  {
    name: 'novids',
    group: 'dl',
    describe: 'Skip downloading videos',
    docDescribe: true,
    service: 'both',
    type: 'boolean',
    usage: ''
  },
  {
    name: 'noaudio',
    group: 'dl',
    describe: 'Skip downloading audio',
    docDescribe: true,
    service: 'both',
    type: 'boolean',
    usage: ''
  },
  {
    name: 'nosubs',
    group: 'dl',
    describe: 'Skip downloading subtitles',
    docDescribe: true,
    service: 'both',
    type: 'boolean',
    usage: ''
  },
  {
    name: 'dubLang',
    describe: 'Set the language to download: ' 
        + `\nFuni Only: ${languages.filter(a => a.funi_locale && !a.cr_locale).map(a => a.code).join(', ')}`
        + `\nCrunchy Only: ${languages.filter(a => a.cr_locale && !a.funi_locale).map(a => a.code).join(', ')}`,
    docDescribe: true,
    group: 'dl',
    choices: dubLanguageCodes,
    default: {
      default: [dubLanguageCodes.slice(-1)[0]]
    },
    service: 'both',
    type: 'array',
    usage: '${dub1} ${dub2}',
  },
  {
    name: 'all',
    describe: 'Used to download all episodes from the show',
    docDescribe: true,
    group: 'dl',
    service: 'both',
    default: {
      default: false
    },
    type: 'boolean',
    usage: ''
  },
  {
    name: 'fontSize',
    describe: 'Used to set the fontsize of the subtitles',
    default: {
      default: 55
    },
    docDescribe: true,
    group: 'dl',
    service: 'both',
    type: 'number',
    usage: '${fontSize}'
  },
  {
    name: 'allDubs',
    describe: 'If selected, all available dubs will get downloaded',
    docDescribe: true,
    group: 'dl',
    service: 'both',
    type: 'boolean',
    usage: ''
  },
  {
    name: 'timeout',
    group: 'dl',
    type: 'number',
    describe: 'Set the timeout of all download reqests. Set in millisecods',
    docDescribe: true,
    service: 'both',
    usage: '${timeout}',
    default: {
      default: 15 * 1000
    }
  },
  {
    name: 'simul',
    group: 'dl',
    describe: 'Force downloading simulcast version instead of uncut version (if available).',
    docDescribe: true,
    service: 'funi',
    type: 'boolean',
    usage: '',
    default: {
      default: false
    }
  },
  {
    name: 'mp4',
    group: 'mux',
    describe: 'Mux video into mp4',
    docDescribe: 'If selected, the output file will be an mp4 file (not recommended tho)',
    service: 'both',
    type: 'boolean',
    usage: '',
    default: {
      default: false
    }
  },
  {
    name: 'skipmux',
    describe: 'Skip muxing video, audio and subtitles',
    docDescribe: true,
    group: 'mux',
    service: 'both',
    type: 'boolean',
    usage: ''
  },
  {
    name: 'fileName',
    group: 'fileName',
    describe:  `Set the filename template. Use \${variable_name} to insert variables.\nYou can also create folders by inserting a path seperator in the filename\nYou may use ${availableFilenameVars
      .map(a => `'${a}'`).join(', ')} as variables.`,
    docDescribe: true,
    service: 'both',
    type: 'string',
    usage: '${fileName}',
    default: {
      default: '[${service}] ${showTitle} - S${season}E${episode} [${height}p]'
    }
  },
  {
    name: 'numbers',
    group: 'fileName',
    describe: `Set how long a number in the title should be at least.\n${[[3, 5, '005'], [2, 1, '01'], [1, 20, '20']]
      .map(val => `Set in config: ${val[0]}; Episode number: ${val[1]}; Output: ${val[2]}`).join('\n')}`,
    type: 'number',
    default: {
      default: 2
    },
    docDescribe: true,
    service: 'both',
    usage: '${number}'
  },
  {
    name: 'nosess',
    group: 'debug',
    describe: 'Reset session cookie for testing purposes',
    docDescribe: true,
    service: 'both',
    type: 'boolean',
    usage: '',
    default: {
      default: false
    }
  },
  {
    name: 'debug',
    group: 'debug',
    describe: 'Debug mode (tokens may be revealed in the console output)',
    docDescribe: true,
    service: 'both',
    type: 'boolean',
    usage: '',
    default: {
      default: false
    }
  },
  {
    name: 'nocleanup',
    describe: 'Don\'t delete subtitle, audio and video files after muxing',
    docDescribe: true,
    group: 'mux',
    service: 'both',
    type: 'boolean',
    default: {
      default: false
    },
    usage: ''
  }, 
  {
    name: 'help',
    alias: 'h',
    describe: 'Show the help output',
    docDescribe: true,
    group: 'help',
    service: 'both',
    type: 'boolean',
    usage: ''
  },
  {
    name: 'service',
    describe: 'Set the service you want to use',
    docDescribe: true,
    group: 'util',
    service: 'both',
    type: 'string',
    choices: ['funi', 'crunchy'],
    usage: '${service}',
    default: {
      default: ''
    },
    demandOption: true
  },
  {
    name: 'update',
    group: 'util',
    describe: 'Force the tool to check for updates (code version only)',
    docDescribe: true,
    service: 'both',
    type: 'boolean',
    usage: ''
  },
  {
    name: 'fontName',
    group: 'fonts',
    describe: 'Set the font to use in subtiles',
    docDescribe: true,
    service: 'funi',
    type: 'string',
    usage: '${fontName}',
  },
  {
    name: 'but',
    describe: 'Download everything but the -e selection',
    docDescribe: true,
    group: 'dl',
    service: 'both',
    type: 'boolean',
    usage: ''
  },
  {
    name: 'downloadArchive',
    describe: 'Used to download all archived shows',
    group: 'dl',
    docDescribe: true,
    service: 'both',
    type: 'boolean',
    usage: ''
  },
  {
    name: 'addArchive',
    describe: 'Used to add the `-s` and `--srz` to downloadArchive',
    group: 'dl',
    docDescribe: true,
    service: 'both',
    type: 'boolean',
    usage: ''
  },
  {
    name: 'skipSubMux',
    describe: 'Skip muxing the subtitles',
    docDescribe: true,
    group: 'mux',
    service: 'both',
    type: 'boolean',
    usage: '',
    default: {
      default: false
    }
  },
  {
    name: 'partsize',
    describe: 'Set the amount of parts to download at once',
    docDescribe: 'Set the amount of parts to download at once\nIf you have a good connection try incresing this number to get a higher overall speed',
    group: 'dl',
    service: 'both',
    type: 'number',
    usage: '${amount}',
    default: {
      default: 10
    }
  },
  {
    name: 'username',
    describe: 'Set the username to use for the authentication. If not provided, you will be prompted for the input',
    docDescribe: true,
    group: 'auth',
    service: 'both',
    type: 'string',
    usage: '${username}',
    default: {
      default: undefined
    }
  },
  {
    name: 'password',
    describe: 'Set the password to use for the authentication. If not provided, you will be prompted for the input',
    docDescribe: true,
    group: 'auth',
    service: 'both',
    type: 'string',
    usage: '${password}',
    default: {
      default: undefined
    }
  },
  {
    name: 'silentAuth',
    describe: 'Authenticate every time the script runs. Use at your own risk.',
    docDescribe: true,
    group: 'auth',
    service: 'both',
    type: 'boolean',
    usage: '',
    default: {
      default: false
    }
  },
  {
    name: 'forceMuxer',
    describe: 'Force the program to use said muxer or don\'t mux if the given muxer is not present',
    docDescribe: true,
    group: 'mux',
    service: 'both',
    type: 'string',
    usage: '${muxer}',
    choices: muxer,
    default: {
      default: undefined
    }
  },
  {
    name: 'fsRetryTime',
    describe: 'Set the time the downloader waits before retrying if an error while writing the file occurs',
    docDescribe: true,
    group: 'dl',
    service: 'both',
    type: 'number',
    usage: '${time in seconds}',
    default: {
      default: 5
    },
  },
  {
    name: 'override',
    describe: 'Override a template variable',
    docDescribe: true,
    group: 'fileName',
    service: 'both',
    type: 'array',
    usage: '"${toOverride}=\'${value}\'"',
    default: {
      default: [ ]
    }
  },
  {
    name: 'videoTitle',
    describe: 'Set the video track name of the merged file',
    docDescribe: true,
    group: 'mux',
    service: 'both',
    type: 'string',
    usage: '${title}'
  },
  {
    name: 'skipUpdate',
    describe: 'If true, the tool won\'t check for updates',
    docDescribe: true,
    group: 'util',
    service: 'both',
    type: 'boolean',
    usage: '',
    default: {
      default: false
    }
  },
  {
    name: 'force',
    describe: 'Set the default option for the \'alredy exists\' prompt',
    docDescribe: 'If a file already exists, the tool will ask you how to proceed. With this, you can answer in advance.',
    group: 'dl',
    service: 'both',
    type: 'string',
    usage: '${option}',
    choices: [ 'y', 'Y', 'n', 'N', 'c', 'C' ]
  },
  {
    name: 'mkvmergeOptions',
    describe: 'Set the options given to mkvmerge',
    docDescribe: true,
    group: 'mux',
    service: 'both',
    type: 'array',
    usage: '${args}',
    default: {
      default: [
        '--no-date',
        '--disable-track-statistics-tags',
        '--engage no_variable_data'
      ]
    }
  },
  {
    name: 'ffmpegOptions',
    describe: 'Set the options given to ffmpeg',
    docDescribe: true,
    group: 'mux',
    service: 'both',
    type: 'array',
    usage: '${args}',
    default: {
      default: []
    }
  },
  {
    name: 'defaultAudio',
    describe: `Set the default audio track by language code\nPossible Values: ${languages.map(a => a.code).join(', ')}`,
    docDescribe: true,
    group: 'mux',
    service: 'both',
    type: 'string',
    usage: '${args}',
    default: {
      default: 'eng'
    },
    transformer: (val) => {
      const item = languages.find(a => a.code === val);
      if (!item) {
        throw new Error(`Unable to find language code ${val}!`);
      }
      return item;
    }
  },
  {
    name: 'defaultSub',
    describe: `Set the default subtitle track by language code\nPossible Values: ${languages.map(a => a.code).join(', ')}`,
    docDescribe: true,
    group: 'mux',
    service: 'both',
    type: 'string',
    usage: '${args}',
    default: {
      default: 'eng'
    },
    transformer: (val) => {
      const item = languages.find(a => a.code === val);
      if (!item) {
        throw new Error(`Unable to find language code ${val}!`);
      }
      return item;
    }
  },
  {
    name: 'ccTag',
    describe: 'Used to set the name for subtitles that contain tranlations for none verbal communication (e.g. signs)',
    docDescribe: true,
    group: 'fileName',
    service: 'both',
    type: 'string',
    usage: '${tag}',
    default: {
      default: 'cc'
    }
  }
];

const getDefault = <T extends boolean|string|number|unknown[]>(name: string, cfg: Record<string, T>): T => {
  const option = args.find(item => item.name === name);
  if (!option)
    throw new Error(`Unable to find option ${name}`);
  if (option.default === undefined) 
    throw new Error(`Option ${name} has no default`);
  if (typeof option.default === 'object') {
    if (Array.isArray(option.default))
      return option.default as T;
    if (Object.prototype.hasOwnProperty.call(cfg, option.default.name ?? option.name)) {
      return cfg[option.default.name ?? option.name];
    } else {
      return option.default.default as T;
    }
  } else {
    return option.default as T;
  }
};

const buildDefault = () => {
  const data: Record<string, unknown> = {};
  const defaultArgs = args.filter(a => a.default);
  defaultArgs.forEach(item => {
    if (typeof item.default === 'object') {
      if (Array.isArray(item.default)) {
        data[item.name] = item.default;
      } else {
        data[item.default.name ?? item.name] = item.default.default;
      }
    } else {
      data[item.name] = item.default;
    }
  });
  return data;
};

export {
  TAppArg,
  getDefault,
  buildDefault,
  args,
  groups,
  availableFilenameVars
};