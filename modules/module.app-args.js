const yargs = require('yargs');

const availableFilenameVars = [
    'title',
    'episode',
    'showTitle',
    'season',
    'width',
    'height'
];

const subLang = [ 'enUS', 'esLA', 'ptBR' ];
const dubLang = [ 'enUS', 'esLA', 'ptBR', 'zhMN', 'jaJP' ];

const appArgv = (cfg) => {
    // init
    const parseDefault = (key, _default) => {
        if (Object.prototype.hasOwnProperty.call(cfg, key)) {
            return cfg[key]
        } else
            return _default
    }

    const argv = yargs.parserConfiguration({
        'duplicate-arguments-array': true,
        'camel-case-expansion': false
    })
    // main
        .wrap(Math.min(120)) // yargs.terminalWidth()
        .help(false).version(false)
        .usage('Usage: $0 [options]')
    // auth
        .option('auth', {
            group: 'Authentication:',
            describe: 'Enter authentication mode',
            type: 'boolean',
        })
    // search
        .option('search', {
            alias: 'f',
            group: 'Search:',
            describe: 'Search show ids',
            type: 'string',
        })
    // select show and eps
        .option('s', {
            group: 'Downloading:',
            describe: 'Sets the show id',
            type: 'number',
        })
        .option('e', {
            group: 'Downloading:',
            describe: 'Select episode ids (comma-separated, hyphen-sequence)',
            type: 'string',
        })
        .option('all', {
            group: 'Downloading:',
            describe: 'Used to download all episodes from the show',
            type: 'boolean',
            default: parseDefault('all', false)
        })
        .option('partsize', {
            group: 'Downloading:',
            describe: 'The amount of parts that should be downloaded in paralell',
            type: 'number',
            default: parseDefault('partsize', 10)
        })
    // quality
        .option('q', {
            group: 'Downloading:',
            describe: 'Select video layer (0 is max)',
            choices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            default: parseDefault('videoLayer', 7),
            type: 'number',
        })
    // alt listing
        .option('alt', {
            group: 'Downloading:',
            describe: 'Alternative episode listing (if available)',
            default: parseDefault('altList', false),
            type: 'boolean',
        })
    // switch to subs
        .option('dub', {
            group: 'Downloading:',
            describe: 'Download non-Japanese Dub (English Dub mode by default)',
            choices: dubLang,
            default: parseDefault('dub', 'enUS'),
            type: 'array',
        })
        .option('subLang', {
            group: 'Downloading:',
            describe: 'Set the subtitle language (English is default and fallback)',
            default: parseDefault('subLang', 'enUS'),
            choices: subLang,
            type: 'array'
        })
        .option('fontSize', {
            group: 'Downloading:',
            describe: 'Used to set the fontsize of the subtitles',
            default: parseDefault('fontSize', 55),
            type: 'number'
        })
        .option('allSubs', {
            group: 'Downloading:',
            describe: 'If set to true, all available subs will get downloaded',
            default: false,
            type: 'boolean'
        })
        .option('allDubs', {
            group: 'Downloading:',
            describe: 'If set to true, all available dubs will get downloaded',
            default: false,
            type: 'boolean'
        })
    // simulcast
        .option('simul', {
            group: 'Downloading:',
            describe: 'Force downloading simulcast ver. instead of uncut ver. (if uncut ver. available)',
            default: parseDefault('forceSimul', false),
            type: 'boolean',
        })
    // server number
        .option('x', {
            alias: 'server',
            group: 'Downloading:',
            describe: 'Select server',
            choices: [1, 2, 3, 4],
            default: parseDefault('nServer', 1),
            type: 'number',
        })
    // skip
        .option('noaudio', {
            group: 'Downloading:',
            describe: 'Skip downloading audio',
            type: 'boolean'
        })
        .option('novids', {
            group: 'Downloading:',
            alias: 'skipdl',
            describe: 'Skip downloading video',
            type: 'boolean',
        })
        .option('nosubs', {
            group: 'Downloading:',
            describe: 'Skip downloading subtitles for English Dub (if available)',
            type: 'boolean',
            default: false
        })
    // proxy
        .option('proxy', {
            group: 'Proxy:',
            describe: 'Set http(s)/socks proxy WHATWG url',
            default: parseDefault('proxy', false),
            hidden: true,
        })
        .option('proxy-auth', {
            group: 'Proxy:',
            describe: 'Colon-separated username and password for proxy',
            default: parseDefault('proxy_auth', false),
            hidden: true,
        })
        .option('ssp', {
            group: 'Proxy:',
            describe: 'Don\'t use proxy for stream and subtitles downloading',
            default: parseDefault('proxy_ssp', false),
            hidden: true,
            type: 'boolean',
        })
    // muxing
        .option('skipmux', {
            group: 'Muxing:',
            describe: 'Skip muxing video and subtitles',
            type: 'boolean',
        })
        .option('mp4', {
            group: 'Muxing:',
            describe: 'Mux into mp4',
            default: parseDefault('mp4mux', false),
            type: 'boolean'
        })
    // filenaming
        .option('fileName', {
            group: 'Filename Template:',
            describe: `Set the filename template. Use \${variable_name} to insert variables.\nYou may use ${availableFilenameVars
                .map(a => `'${a}'`).join(', ')} as variables.`,
            type: 'string',
            default: parseDefault('fileName', '[Funimation] ${showTitle} - ${episode} [${height}p]')
        })
        .option('numbers', {
            group: 'Filename Template:',
            describe: `Set how long a number in the title should be at least.\n${[[3, 5, '005'], [2, 1, '01'], [1, 20, '20']]
                .map(val => `Set in config: ${val[0]}; Episode number: ${val[1]}; Output: ${val[2]}`).join('\n')}`,
            type: 'number',
            default: parseDefault('numbers', 2)
        })
    // util
        .option('nocleanup', {
            group: 'Utilities:',
            describe: 'Dont\'t delete the input files after muxing',
            default: parseDefault('noCleanUp', false),
            type: 'boolean'
        })
    // help
        .option('help', {
            alias: 'h',
            group: 'Help:',
            describe: 'Show this help',
            type: 'boolean'
        })
    // usage
        .example([
            ['$0 --search "My Hero"', 'search "My Hero" in title'],
            ['$0 -s 124389 -e 1,2,3', 'download episodes 1-3 from show with id 124389'],
            ['$0 -s 124389 -e 1-3,2-7,s1-2', 'download episodes 1-7 and "S"-episodes 1-2 from show with id 124389'],
        ])
    
    // --
        .argv;
    // Resolve unwanted arrays
    if (argv.allDubs)
        argv.dub = dubLang;
    if (argv.allSubs)
        argv.subLang = subLang;
    for (let key in argv) {
        if (argv[key] instanceof Array && !(key === 'subLang' || key === 'dub')) {
            argv[key] = argv[key].pop();
        }
    }
    return argv;
};

const showHelp = yargs.showHelp;

module.exports = {
    appArgv,
    showHelp,
    availableFilenameVars
};
