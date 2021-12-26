import { searchLocales } from "./module.langsData";

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

type TAppArg<T extends boolean|string|number|unknown[]> = {
  name: string,
  group: keyof typeof groups,
  type: 'boolean'|'string'|'number'|'array',
  choices?: T[],
  alias?: string,
  describe: string,
  docDescribe: true|string, // true means use describe for the docs
  default?: T|{
    default: T,
    name?: string    
  },
  service: 'funi'|'crunchy'|'both',
  usage: string // -(-)${name} will be added for each command
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
    default: ''
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
    default: '',
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
  }
];