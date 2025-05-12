import { aoSearchLocales, dubLanguageCodes, languages, searchLocales, subtitleLanguagesFilter } from './module.langsData';
import { CrunchyPlayStreams } from '../@types/enums';

const groups = {
  'auth': 'Authentication:',
  'fonts': 'Fonts:',
  'search': 'Search:',
  'dl': 'Downloading:',
  'mux': 'Muxing:',
  'fileName': 'Filename Template:',
  'debug': 'Debug:',
  'util': 'Utilities:',
  'help': 'Help:',
  'gui': 'GUI:'
};

export type AvailableFilenameVars =  'title' | 'episode' | 'showTitle' | 'seriesTitle' | 'season' | 'width' | 'height' | 'service'

const availableFilenameVars: AvailableFilenameVars[] = [
  'title',
  'episode',
  'showTitle',
  'seriesTitle',
  'season',
  'width',
  'height',
  'service'
];

export type AvailableMuxer = 'ffmpeg' | 'mkvmerge'
export const muxer: AvailableMuxer[] = [ 'ffmpeg', 'mkvmerge' ];

export type TAppArg<T extends boolean|string|number|unknown[], K = any> = {
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
  service: Array<'crunchy'|'hidive'|'ao'|'adn'|'all'>,
  usage: string // -(-)${name} will be added for each command,
  demandOption?: true,
  transformer?: (value: T) => K
}

const args: TAppArg<boolean|number|string|unknown[]>[] = [
  { 
    name: 'absolute',
    describe: 'Use absolute numbers for the episode',
    docDescribe: 'Use absolute numbers for the episode. If not set, it will use the default index numbers',
    group: 'dl',
    service: ['crunchy'],
    type: 'boolean',
    usage: '',
  },
  {
    name: 'auth',
    describe: 'Enter authentication mode',
    type: 'boolean',
    group: 'auth',
    service: ['all'],
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
    service: ['crunchy'],
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
    service: ['all'],
    usage: '${search}'
  },
  {
    name: 'search-type',
    describe: 'Search by type',
    docDescribe: 'Search only for type of anime listings (e.g. episodes, series)',
    group: 'search',
    service: ['crunchy'],
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
    service: ['crunchy', 'hidive'],
    type: 'number',
    usage: '${page}'
  },
  {
    name: 'locale',
    describe: 'Set the service locale',
    docDescribe: 'Set the local that will be used for the API.',
    group: 'search',
    choices: ([...searchLocales.filter(a => a !== undefined), ...aoSearchLocales.filter(a => a !== undefined)] as string[]),
    default: {
      default: 'en-US'
    },
    type: 'string',
    service: ['crunchy', 'ao', 'adn'],
    usage: '${locale}'
  },
  {
    group: 'search',
    name: 'new',
    describe: 'Get last updated series list',
    docDescribe: true,
    service: ['crunchy', 'hidive'],
    type: 'boolean',
    usage: '',
  },
  {
    group: 'dl',
    alias: 'flm',
    name: 'movie-listing',
    describe: 'Get video list by Movie Listing ID',
    docDescribe: true,
    service: ['crunchy'],
    type: 'string',
    usage: '${ID}',
  },
  {
    name: 'series',
    group: 'dl',
    alias: 'srz',
    describe: 'Get season list by series ID',
    docDescribe: 'Requested is the ID of a show not a season.',
    service: ['crunchy'],
    type: 'string',
    usage: '${ID}'
  },
  {
    name: 's',
    group: 'dl',
    type: 'string',
    describe: 'Set the season ID',
    docDescribe: 'Used to set the season ID to download from',
    service: ['all'],
    usage: '${ID}'
  },
  {
    name: 'e',
    group: 'dl',
    describe: 'Set the episode(s) to download from any given show',
    docDescribe: 'Set the episode(s) to download from any given show.'
      + '\nFor multiple selection: 1-4 OR 1,2,3,4 '
      + '\nFor special episodes: S1-4 OR S1,S2,S3,S4 where S is the special letter',
    service: ['all'],
    type: 'string',
    usage: '${selection}',
    alias: 'episode'
  },
  {
    name: 'extid',
    group: 'dl',
    describe: 'Set the external id to lookup/download',
    docDescribe: 'Set the external id to lookup/download.'
      + '\nAllows you to download or view legacy Crunchyroll Ids ',
    service: ['crunchy'],
    type: 'string',
    usage: '${selection}',
    alias: 'externalid'
  },
  {
    name: 'q',
    group: 'dl',
    describe: 'Set the quality level. Use 0 to use the maximum quality.',
    default: {
      default: 0
    },
    docDescribe: true,
    service: ['all'],
    type: 'number',
    usage: '${qualityLevel}'
  },
  {
    name: 'dlVideoOnce',
    describe: 'Download only once the video with the best selected quality',
    type: 'boolean',
    group: 'dl',
    service: ['crunchy', 'ao'],
    docDescribe: 'If selected, the best selected quality will be downloaded only for the first language,'
      + '\nthen the worst video quality with the same audio quality will be downloaded for every other language.'
      + '\nBy the later merge of the videos, no quality difference will be present.'
      + '\nThis will speed up the download speed, if multiple languages are selected.',
    usage: '',
    default: {
      default: false
    }
  },
  {
    name: 'chapters',
    describe: 'Will fetch the chapters and add them into the final video',
    type: 'boolean',
    group: 'dl',
    service: ['crunchy', 'adn'],
    docDescribe: 'Will fetch the chapters and add them into the final video.' 
     + '\nCurrently only works with mkvmerge.',
    usage: '',
    default: {
      default: true
    }
  },
  {
    name: 'crapi',
    describe: 'Selects the API type for Crunchyroll',
    type: 'string',
    group: 'dl',
    service: ['crunchy'],
    docDescribe: 'If set to Android, it has lower quality, but Non-DRM streams,'
      + '\nIf set to Web, it has a higher quality adaptive stream, but everything is DRM.',
    usage: '',
    choices: ['android', 'web'],
    default: {
      default: 'web'
    }
  },
  {
    name: 'removeBumpers',
    describe: 'Remove bumpers from final video',
    type: 'boolean',
    group: 'dl',
    service: ['hidive'],
    docDescribe: 'If selected, it will remove the bumpers such as the hidive intro from the final file.'
    + '\nCurrently disabling this sometimes results in bugs such as video/audio desync',
    usage: '',
    default: {
      default: true
    }
  },
  {
    name: 'originalFontSize',
    describe: 'Keep original font size',
    type: 'boolean',
    group: 'dl',
    service: ['hidive'],
    docDescribe: 'If selected, it will prefer to keep the original Font Size defined by the service.',
    usage: '',
    default: {
      default: true
    }
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
    service: ['crunchy'],
    usage: '${server}'
  },
  {
    name: 'kstream',
    group: 'dl',
    alias: 'k',
    describe: 'Select specific stream',
    choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    default: {
      default: 1
    },
    docDescribe: true,
    service: ['crunchy'],
    type: 'number',
    usage: '${stream}'
  },
  {
    name: 'cstream',
    group: 'dl',
    alias: 'cs',
    service: ['crunchy'],
    type: 'string',
    describe: 'Select specific crunchy play stream by device, or disable stream with "none"',
    choices: [...Object.keys(CrunchyPlayStreams), 'none'],
    default: {
      default: 'vidaa'
    },
    docDescribe: true,
    usage: '${device}'
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
    service: ['crunchy']
  },
  {
    name: 'dlsubs',
    group: 'dl',
    describe: 'Download subtitles by language tag (space-separated)' 
    + `\nCrunchy Only: ${languages.filter(a => a.cr_locale).map(a => a.locale).join(', ')}`,
    docDescribe: true,
    service: ['all'],
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
    service: ['all'],
    type: 'boolean',
    usage: ''
  },
  {
    name: 'noaudio',
    group: 'dl',
    describe: 'Skip downloading audio',
    docDescribe: true,
    service: ['crunchy', 'hidive'],
    type: 'boolean',
    usage: ''
  },
  {
    name: 'nosubs',
    group: 'dl',
    describe: 'Skip downloading subtitles',
    docDescribe: true,
    service: ['all'],
    type: 'boolean',
    usage: ''
  },
  {
    name: 'dubLang',
    describe: 'Set the language to download: ' 
        + `\nCrunchy Only: ${languages.filter(a => a.cr_locale).map(a => a.code).join(', ')}`,
    docDescribe: true,
    group: 'dl',
    choices: dubLanguageCodes,
    default: {
      default: [dubLanguageCodes.slice(-1)[0]]
    },
    service: ['all'],
    type: 'array',
    usage: '${dub1} ${dub2}',
  },
  {
    name: 'all',
    describe: 'Used to download all episodes from the show',
    docDescribe: true,
    group: 'dl',
    service: ['all'],
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
    docDescribe: 'When converting the subtitles to ass, this will change the font size'
    + '\nIn most cases, requires "--originaFontSize false" to take effect',
    group: 'dl',
    service: ['all'],
    type: 'number',
    usage: '${fontSize}'
  },
  {
    name: 'combineLines',
    describe: 'Merge adjacent lines with same style and text',
    docDescribe: 'If selected, will prevent a line from shifting downwards',
    group: 'dl',
    service: ['hidive'],
    type: 'boolean',
    usage: ''
  },
  {
    name: 'allDubs',
    describe: 'If selected, all available dubs will get downloaded',
    docDescribe: true,
    group: 'dl',
    service: ['all'],
    type: 'boolean',
    usage: ''
  },
  {
    name: 'timeout',
    group: 'dl',
    type: 'number',
    describe: 'Set the timeout of all download reqests. Set in millisecods',
    docDescribe: true,
    service: ['all'],
    usage: '${timeout}',
    default: {
      default: 15 * 1000
    }
  },
  {
    name: 'waittime',
    group: 'dl',
    type: 'number',
    describe: 'Set the time the program waits between downloads. Set in millisecods',
    docDescribe: true,
    service: ['crunchy','hidive'],
    usage: '${waittime}',
    default: {
      default: 0 * 1000
    }
  },
  {
    name: 'simul',
    group: 'dl',
    describe: 'Force downloading simulcast version instead of uncut version (if available).',
    docDescribe: true,
    service: ['hidive'],
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
    service: ['all'],
    type: 'boolean',
    usage: '',
    default: {
      default: false
    }
  },
  {
    name: 'keepAllVideos',
    group: 'mux',
    describe: 'Keeps all videos when merging instead of discarding extras',
    docDescribe: 'If set to true, it will keep all videos in the merge process, rather than discarding the extra videos.',
    service: ['crunchy','hidive'],
    type: 'boolean',
    usage: '',
    default: {
      default: false
    }
  },
  {
    name: 'syncTiming',
    group: 'mux',
    describe: 'Attempts to sync timing for multi-dub downloads EXPERIMENTAL',
    docDescribe: 'If enabled attempts to sync timing for multi-dub downloads.'
    + '\nNOTE: This is currently experimental and syncs audio and subtitles, though subtitles has a lot of guesswork'
    + '\nIf you find bugs with this, please report it in the discord or github',
    service: ['crunchy','hidive'],
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
    service: ['all'],
    type: 'boolean',
    usage: ''
  },
  {
    name: 'fileName',
    group: 'fileName',
    describe:  `Set the filename template. Use \${variable_name} to insert variables.\nYou can also create folders by inserting a path seperator in the filename\nYou may use ${availableFilenameVars
      .map(a => `'${a}'`).join(', ')} as variables.`,
    docDescribe: true,
    service: ['all'],
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
    service: ['all'],
    usage: '${number}'
  },
  {
    name: 'nosess',
    group: 'debug',
    describe: 'Reset session cookie for testing purposes',
    docDescribe: true,
    service: ['all'],
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
    service: ['all'],
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
    service: ['all'],
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
    service: ['all'],
    type: 'boolean',
    usage: ''
  },
  {
    name: 'service',
    describe: 'Set the service you want to use',
    docDescribe: true,
    group: 'util',
    service: ['all'],
    type: 'string',
    choices: ['crunchy', 'hidive', 'ao', 'adn'],
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
    service: ['all'],
    type: 'boolean',
    usage: ''
  },
  {
    name: 'fontName',
    group: 'fonts',
    describe: 'Set the font to use in subtiles',
    docDescribe: true,
    service: ['hidive', 'adn'],
    type: 'string',
    usage: '${fontName}',
  },
  {
    name: 'but',
    describe: 'Download everything but the -e selection',
    docDescribe: true,
    group: 'dl',
    service: ['all'],
    type: 'boolean',
    usage: ''
  },
  {
    name: 'downloadArchive',
    describe: 'Used to download all archived shows',
    group: 'dl',
    docDescribe: true,
    service: ['all'],
    type: 'boolean',
    usage: ''
  },
  {
    name: 'addArchive',
    describe: 'Used to add the `-s` and `--srz` to downloadArchive',
    group: 'dl',
    docDescribe: true,
    service: ['all'],
    type: 'boolean',
    usage: ''
  },
  {
    name: 'skipSubMux',
    describe: 'Skip muxing the subtitles',
    docDescribe: true,
    group: 'mux',
    service: ['all'],
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
    service: ['all'],
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
    service: ['all'],
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
    service: ['all'],
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
    service: ['crunchy'],
    type: 'boolean',
    usage: '',
    default: {
      default: false
    }
  },
  {
    name: 'token',
    describe: 'Allows you to login with your token (Example on crunchy is Refresh Token/etp-rt cookie)',
    docDescribe: true,
    group: 'auth',
    service: ['crunchy', 'ao'],
    type: 'string',
    usage: '${token}',
    default: {
      default: undefined
    }
  },
  {
    name: 'forceMuxer',
    describe: 'Force the program to use said muxer or don\'t mux if the given muxer is not present',
    docDescribe: true,
    group: 'mux',
    service: ['all'],
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
    service: ['all'],
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
    service: ['all'],
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
    service: ['all'],
    type: 'string',
    usage: '${title}'
  },
  {
    name: 'skipUpdate',
    describe: 'If true, the tool won\'t check for updates',
    docDescribe: true,
    group: 'util',
    service: ['all'],
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
    service: ['all'],
    type: 'string',
    usage: '${option}',
    choices: [ 'y', 'Y', 'n', 'N', 'c', 'C' ]
  },
  {
    name: 'mkvmergeOptions',
    describe: 'Set the options given to mkvmerge',
    docDescribe: true,
    group: 'mux',
    service: ['all'],
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
    service: ['all'],
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
    service: ['all'],
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
    service: ['all'],
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
    service: ['all'],
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
    if (Object.prototype.hasOwnProperty.call(cfg, (option.default as any).name ?? option.name)) {
      return cfg[(option.default as any).name ?? option.name];
    } else {
      return (option.default as any).default as T;
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
        data[(item.default as any).name ?? item.name] = (item.default as any).default;
      }
    } else {
      data[item.name] = item.default;
    }
  });
  return data;
};

export {
  getDefault,
  buildDefault,
  args,
  groups,
  availableFilenameVars
};
