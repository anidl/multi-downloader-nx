const yargs = require('yargs');

const appArgv = (cfg, langsData) => {
    // init
    return yargs.parserConfiguration({
        "duplicate-arguments-array": false,
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
    // quality
    .option('q', {
        group: 'Downloading:',
        describe: 'Select video layer (0 is max)',
        choices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        default: cfg.videoLayer || 7,
        type: 'number',
    })
    // alt listing
    .option('alt', {
        group: 'Downloading:',
        describe: 'Alternative episode listing (if available)',
        default: cfg.altList || false,
        type: 'boolean',
    })
    // switch to subs
    .option('sub', {
        group: 'Downloading:',
        describe: 'Japanese Dub with subtitles mode (English Dub mode by default)',
        default: cfg.subsMode || false,
        type: 'boolean',
    })
    // simulcast
    .option('simul', {
        group: 'Downloading:',
        describe: 'Force downloading simulcast ver. instead of uncut ver. (if uncut ver. available)',
        default: cfg.forceSimul || false,
        type: 'boolean',
    })
    // server number
    .option('x', {
        alias: 'server',
        group: 'Downloading:',
        describe: 'Select server',
        choices: [1, 2, 3, 4],
        default: cfg.nServer || 1,
        type: 'number',
    })
    // skip
    .option('novids', {
        group: 'Downloading:',
        alias: 'skipdl',
        describe: 'Skip downloading video (for downloading subtitles only)',
        type: 'boolean',
    })
    .option('nosubs', {
        group: 'Downloading:',
        describe: 'Skip downloading subtitles for English Dub (if available)',
        type: 'boolean',
    })
    // proxy
    .option('proxy', {
        group: 'Proxy:',
        describe: 'Set http(s)/socks proxy WHATWG url',
        default: cfg.proxy || false,
        hidden: true,
    })
    .option('proxy-auth', {
        group: 'Proxy:',
        describe: 'Colon-separated username and password for proxy',
        default: cfg.proxy_auth || false,
        hidden: true,
    })
    .option('ssp', {
        group: 'Proxy:',
        describe: 'Don\'t use proxy for stream and subtitles downloading',
        default: cfg.proxy_ssp || false,
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
        default: cfg.mp4mux || false,
        type: 'boolean'
    })
    .option('mks', {
        group: 'Muxing:',
        describe: 'Add subtitles to mkv/mp4 (if available)',
        default: cfg.muxSubs || false,
        type: 'boolean'
    })
    // filenaming
    .option('a', {
        alias: 'grouptag',
        group: 'Filename Template:',
        describe: 'Release group',
        default: cfg.releaseGroup || 'Funimation',
        type: 'string'
    })
    .option('t', {
        alias: 'title',
        group: 'Filename Template:',
        describe: 'Series title override',
        type: 'string'
    })
    .option('ep', {
        group: 'Filename Template:',
        describe: 'Episode number override (ignored in batch mode)',
        type: 'string'
    })
    .option('suffix', {
        group: 'Filename Template:',
        describe: 'Filename suffix override (first "SIZEp" will be replaced with actual video size)',
        default: cfg.fileSuffix || 'SIZEp',
        type: 'string'
    })
    // util
    .option('nocleanup', {
        group: 'Utilities:',
        describe: 'Move temporary files to trash folder instead of deleting',
        default: cfg.noCleanUp || false,
        type: 'boolean'
    })
    .option('notrashfolder', {
        implies: ['nocleanup'],
        group: 'Utilities:',
        describe: 'Don\'t move temporary files to trash folder (Used with --nocleanup)',
        default: cfg.noTrashFolder || false,
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
}

const showHelp = yargs.showHelp;

module.exports = {
    appArgv,
    showHelp
};
