#!/usr/bin/env node

// modules build-in
const fs = require('fs');
const path = require('path');

// package json
const packageJson = require('./package.json');

// program name
console.log(`\n=== Funimation Downloader NX ${packageJson.version} ===\n`);
const api_host = 'https://prod-api-funimationnow.dadcdigital.com/api';

// modules extra
const yaml = require('yaml');
const shlp = require('sei-helper');
const { lookpath } = require('lookpath');
const m3u8 = require('m3u8-parsed');
const crypto = require('crypto');
const got = require('got');

// extra
const appYargs     = require('./modules/module.app-args');
const getYamlCfg   = require('./modules/module.cfg-loader');
const vttConvert   = require('./modules/module.vttconvert');
// new-cfg
const workingDir = process.pkg ? path.dirname(process.execPath) : __dirname;
const binCfgFile = path.join(workingDir, 'config', 'bin-path');
const dirCfgFile = path.join(workingDir, 'config', 'dir-path');
const cliCfgFile = path.join(workingDir, 'config', 'cli-defaults');
const tokenFile  = path.join(workingDir, 'config', 'token');
// params
let cfg = {
    bin: getYamlCfg(binCfgFile),
    dir: getYamlCfg(dirCfgFile),
    cli: getYamlCfg(cliCfgFile),
};

// make sure cfg params aren't null
if (cfg.bin === null){
    cfg.bin = {};
    console.log('[WARN] bin-path.yml is empty or does not exist!\n');
}

if (cfg.dir === null){
    cfg.dir = {};
    console.log('[WARN] dir-path.yml is empty or does not exist!\n');
}

if (!Object.prototype.hasOwnProperty.call(cfg.dir, 'content')) cfg.dir.content = './videos/';

if (cfg.cli === null){
    cfg.cli = {};
    console.log('[WARN] cli-defaults.yml is empty or does not exist!\n');
}

/* Normalise paths for use outside the current directory */
for (let key of Object.keys(cfg.dir)) {
    if (!path.isAbsolute(cfg.dir[key])) {
        cfg.dir[key] = path.join(workingDir, cfg.dir[key]);
    }
}

for (let key of Object.keys(cfg.bin)) {
    if (!path.isAbsolute(cfg.bin[key])) {
        cfg.bin[key] = path.join(workingDir, cfg.bin[key]);
    }
}

// token
let token = getYamlCfg(tokenFile);
if (token === null) token = false;
else if (token.token === null) token = false;
else token = token.token;

// info if token not set
if(!token){
    console.log('[INFO] Token not set!\n');
}

// cli
const argv = appYargs.appArgv(cfg.cli);
module.exports = {
    argv,
    cfg
};

// Import modules after argv has been exported
const getData = require('./modules/module.getdata.js');
const merger = require('./modules/merger');

// check page
if(!isNaN(parseInt(argv.p, 10)) && parseInt(argv.p, 10) > 0){
    argv.p = parseInt(argv.p, 10);
}
else{
    argv.p = 1;
}

// fn variables
let title = '',
    showTitle = '',
    fnEpNum = 0,
    fnOutput = [],
    season = 0,
    tsDlPath = [],
    stDlPath = [];

// select mode
if(argv.auth){
    auth();
}
else if(argv.search){
    searchShow();
}
else if(argv.s && !isNaN(parseInt(argv.s, 10)) && parseInt(argv.s, 10) > 0){
    getShow();
}
else{
    appYargs.showHelp();
    process.exit();
}

// auth
async function auth(){
    let authOpts = {};
    authOpts.user = await shlp.question('[Q] LOGIN/EMAIL');
    authOpts.pass = await shlp.question('[Q] PASSWORD   ');
    let authData =  await getData({
        baseUrl: api_host,
        url: '/auth/login/',
        useProxy: true,
        auth: authOpts,
        debug: argv.debug,
    });
    if(authData.ok){
        authData = JSON.parse(authData.res.body);
        if(authData.token){
            console.log('[INFO] Authentication success, your token: %s%s\n', authData.token.slice(0,8),'*'.repeat(32));
            fs.writeFileSync(tokenFile + '.yml', yaml.stringify({'token': authData.token}));
        }
        else if(authData.error){
            console.log('[ERROR]%s\n', authData.error);
            process.exit(1);
        }
    }
}

// search show
async function searchShow(){
    let qs = {unique: true, limit: 100, q: argv.search, offset: (argv.p-1)*1000 };
    let searchData = await getData({
        baseUrl: api_host,
        url: '/source/funimation/search/auto/',
        querystring: qs,
        token: token,
        useToken: true,
        useProxy: true,
        debug: argv.debug,
    });
    if(!searchData.ok){return;}
    searchData = JSON.parse(searchData.res.body);
    if(searchData.detail){
        console.log(`[ERROR] ${searchData.detail}`);
        return;
    }
    if(searchData.items && searchData.items.hits){
        let shows = searchData.items.hits;
        console.log('[INFO] Search Results:');
        for(let ssn in shows){
            console.log(`[#${shows[ssn].id}] ${shows[ssn].title}` + (shows[ssn].tx_date?` (${shows[ssn].tx_date})`:''));
        }
    }
    console.log('[INFO] Total shows found: %s\n',searchData.count);
}

// get show
async function getShow(){
    // show main data
    let showData = await getData({
        baseUrl: api_host,
        url: `/source/catalog/title/${parseInt(argv.s, 10)}`,
        token: token,
        useToken: true,
        useProxy: true,
        debug: argv.debug,
    });
    // check errors
    if(!showData.ok){return;}
    showData = JSON.parse(showData.res.body);
    if(showData.status){
        console.log('[ERROR] Error #%d: %s\n', showData.status, showData.data.errors[0].detail);
        process.exit(1);
    }
    else if(!showData.items || showData.items.length<1){
        console.log('[ERROR] Show not found\n');
        process.exit(0);
    }
    showData = showData.items[0];
    console.log('[#%s] %s (%s)',showData.id,showData.title,showData.releaseYear);
    // show episodes
    let qs = { limit: -1, sort: 'order', sort_direction: 'ASC', title_id: parseInt(argv.s,10) };
    if(argv.alt){ qs.language = 'English'; }
    let episodesData = await getData({
        baseUrl: api_host,
        url: '/funimation/episodes/',
        querystring: qs,
        token: token,
        useToken: true,
        useProxy: true,
        debug: argv.debug,
    });
    if(!episodesData.ok){return;}
    let eps = JSON.parse(episodesData.res.body).items, fnSlug = [], is_selected = false;
    argv.e = typeof argv.e == 'number' || typeof argv.e == 'string' ? argv.e.toString() : '';
    argv.e = argv.e.match(',') ? argv.e.split(',') : [argv.e];
    let epSelList = argv.e, epSelRanges = [], epSelEps = [];
    epSelList = epSelList.map((e)=>{
        if(e.match('-')){
            e = e.split('-');
            if( e[0].match(/^(?:[A-Z]+|)\d+$/i) && e[1].match(/^\d+$/) ){
                e[0] = e[0].replace(/^(?:([A-Z]+)|)(0+)/i,'$1');
                let letter = e[0].match(/^([A-Z]+)\d+$/i) ? e[0].match(/^([A-Z]+)\d+$/i)[1].toUpperCase() : '';
                e[0] = e[0].replace(/^[A-Z]+(\d+)$/i,'$1');
                e[0] = parseInt(e[0]);
                e[1] = parseInt(e[1]);
                if(e[0] < e[1]){
                    for(let i=e[0];i<e[1]+1;i++){
                        epSelRanges.push(letter+i);
                    }
                    return '';
                }
                else{
                    return (letter+e[0]);
                }
            }
            else{
                return '';
            }
        }
        else if(e.match(/^(?:[A-Z]+|)\d+$/i)){
            return e.replace(/^(?:([A-Z]+)|)(0+)/i,'$1').toUpperCase();
        }
        else{
            return '';
        }
    });
    epSelList = [...new Set(epSelList.concat(epSelRanges))];
    // parse episodes list
    for(let e in eps){
        let showStrId = eps[e].ids.externalShowId;
        let epStrId = eps[e].ids.externalEpisodeId.replace(new RegExp('^'+showStrId),'');
        // select
        if (argv.all) {
            fnSlug.push({title:eps[e].item.titleSlug,episode:eps[e].item.episodeSlug});
            epSelEps.push(epStrId);
            is_selected = true;
        }
        else if(epSelList.includes(epStrId.replace(/^(?:([A-Z]+)|)(0+)/,'$1'))){
            fnSlug.push({title:eps[e].item.titleSlug,episode:eps[e].item.episodeSlug});
            epSelEps.push(epStrId);
            is_selected = true;
        }
        else{
            is_selected = false;
        }
        // console vars
        let tx_snum = eps[e].item.seasonNum==1?'':` S${eps[e].item.seasonNum}`;
        let tx_type = eps[e].mediaCategory != 'episode' ? eps[e].mediaCategory : '';
        let tx_enum = eps[e].item.episodeNum !== '' ?
            `#${(eps[e].item.episodeNum < 10 ? '0' : '')+eps[e].item.episodeNum}` : '#'+eps[e].item.episodeId;
        let qua_str = eps[e].quality.height ? eps[e].quality.quality + eps[e].quality.height : 'UNK';
        let aud_str = eps[e].audio.length > 0 ? `, ${eps[e].audio.join(', ')}` : '';
        let rtm_str = eps[e].item.runtime !== '' ? eps[e].item.runtime : '??:??';
        // console string
        let episodeIdStr = epStrId;
        let conOut  = `[${episodeIdStr}] `;
        conOut += `${eps[e].item.titleName+tx_snum} - ${tx_type+tx_enum} ${eps[e].item.episodeName} `;
        conOut += `(${rtm_str}) [${qua_str+aud_str}]`;
        conOut += is_selected ? ' (selected)' : '';
        conOut += eps.length-1 == e ? '\n' : '';
        console.log(conOut);
    }
    if(fnSlug.length<1){
        console.log('[INFO] Episodes not selected!\n');
        process.exit();
    }
    else{
        console.log('[INFO] Selected Episodes: %s\n',epSelEps.join(', '));
        for(let fnEp=0;fnEp<fnSlug.length;fnEp++){
            await getEpisode(fnSlug[fnEp]);
        }
    }
}

async function getEpisode(fnSlug){
    let episodeData = await getData({
        baseUrl: api_host,
        url: `/source/catalog/episode/${fnSlug.title}/${fnSlug.episode}/`,
        token: token,
        useToken: true,
        useProxy: true,
        debug: argv.debug,
    });
    if(!episodeData.ok){return;}
    let ep = JSON.parse(episodeData.res.body).items[0], streamIds = [];
    // build fn
    showTitle = ep.parent.title;
    title = ep.title;
    season = parseInt(ep.parent.seasonNumber);
    if(ep.mediaCategory != 'Episode'){
        ep.number = ep.number !== '' ? ep.mediaCategory+ep.number : ep.mediaCategory+'#'+ep.id;
    }
    fnEpNum = isNaN(parseInt(ep.number)) ? ep.number : parseInt(ep.number);
    
    // is uncut
    let uncut = {
        Japanese: false,
        English: false
    };
    
    // end
    console.log(
        '[INFO] %s - S%sE%s - %s',
        ep.parent.title,
        (ep.parent.seasonNumber ? ep.parent.seasonNumber : '?'),
        (ep.number ? ep.number : '?'),
        ep.title
    );
    
    console.log('[INFO] Available streams (Non-Encrypted):');
    
    // map medias
    let media = ep.media.map(function(m){
        if(m.mediaType == 'experience'){
            if(m.version.match(/uncut/i)){
                uncut[m.language] = true;
            }
            return {
                id: m.id,
                language: m.language,
                version: m.version,
                type: m.experienceType,
                subtitles: getSubsUrl(m.mediaChildren),
            };
        }
        else{
            return { id: 0, type: '' };
        }
    });
    
    const dubType = {
        'enUS': 'English',
        'esLA': 'Spanish (Latin Am)',
        'ptBR': 'Portuguese (Brazil)',
        'zhMN': 'Chinese (Mandarin, PRC)',
        'jaJP': 'Japanese'
    };
    
    // select
    stDlPath = [];
    for(let m of media){
        let selected = false;
        if(m.id > 0 && m.type == 'Non-Encrypted'){
            let dub_type = m.language;
            let localSubs = [];
            let selUncut = !argv.simul && uncut[dub_type] && m.version.match(/uncut/i) 
                ? true 
                : (!uncut[dub_type] || argv.simul && m.version.match(/simulcast/i) ? true : false);
            for (let curDub of argv.dub) {
                if(dub_type == dubType[curDub] && selUncut){
                    streamIds.push({
                        id: m.id,
                        lang: merger.getLanguageCode(curDub, curDub.slice(0, -2))
                    });
                    stDlPath.push(...m.subtitles);
                    localSubs = m.subtitles;
                    selected = true;
                }
            }
            console.log(`[#${m.id}] ${dub_type} [${m.version}]${(selected?' (selected)':'')}${
                localSubs && localSubs.length > 0 && selected ? ` (using ${localSubs.map(a => `'${a.langName}'`).join(', ')} for subtitles)` : ''
            }`);
        }
    }

    let already = [];
    stDlPath = stDlPath.filter(a => {
        if (already.includes(a.language)) {
            return false;
        } else {
            already.push(a.language);
            return true;
        }
    });
    if(streamIds.length <1){
        console.log('[ERROR] Track not selected\n');
        return;
    }
    else{
        tsDlPath = [];
        for (let streamId of streamIds) {
            let streamData = await getData({
                baseUrl: api_host,
                url: `/source/catalog/video/${streamId.id}/signed`,
                token: token,
                dinstid: 'uuid',
                useToken: true,
                useProxy: true,
                debug: argv.debug,
            });
            if(!streamData.ok){return;}
            streamData = JSON.parse(streamData.res.body);
            if(streamData.errors){
                console.log('[ERROR] Error #%s: %s\n',streamData.errors[0].code,streamData.errors[0].detail);
                return;
            }
            else{
                for(let u in streamData.items){
                    if(streamData.items[u].videoType == 'm3u8'){
                        tsDlPath.push({
                            path: streamData.items[u].src,
                            lang: streamId.lang
                        });
                        break;
                    }
                }
            }
        }
        if(tsDlPath.length < 1){
            console.log('[ERROR] Unknown error\n');
            return;
        }
        else{
            await downloadStreams();
        }
    }
}

function getSubsUrl(m){
    if(argv.nosubs && !argv.sub){
        return [];
    }

    let subLangs = argv.subLang;

    const subType = {
        'enUS': 'English',
        'esLA': 'Spanish (Latin Am)',
        'ptBR': 'Portuguese (Brazil)'
    };

    let subLangAvailable = m.some(a => subLangs.some(subLang => a.ext == 'vtt' && a.language === subType[subLang]));

    if (!subLangAvailable) {
        subLangs = [ 'enUS' ];
    }
    
    let found = [];

    for(let i in m){
        let fpp = m[i].filePath.split('.');
        let fpe = fpp[fpp.length-1];
        for (let lang of subLangs) {
            if(fpe == 'vtt' && m[i].language === subType[lang]) {
                found.push({
                    path: m[i].filePath,
                    ext: `.${lang}`,
                    langName: subType[lang],
                    language: m[i].languages[0].code || lang.slice(0, 2)
                });
            }
        }
    }

    return found;
}

async function downloadStreams(){
    
    // req playlist

    let purvideo = [];
    let puraudio = [];
    let audioAndVideo = []; 
    let outName;
    for (let streamPath of tsDlPath) {
        let plQualityReq = await getData({
            url: streamPath.path,
            useProxy: (argv.ssp ? false : true),
            debug: argv.debug,
        });
        if(!plQualityReq.ok){return;}
        
        let plQualityLinkList = m3u8(plQualityReq.res.body);
        
        let mainServersList = [
            'vmfst-api.prd.funimationsvc.com',
            'd33et77evd9bgg.cloudfront.net',
            'd132fumi6di1wa.cloudfront.net',
            'funiprod.akamaized.net',
        ];
        
        let plServerList = [],
            plStreams    = {},
            plLayersStr  = [],
            plLayersRes  = {},
            plMaxLayer   = 1,
            plNewIds     = 1,
            plAud        = { uri: '' };
        
        // new uris
        let vplReg = /streaming_video_(\d+)_(\d+)_(\d+)_index\.m3u8/;
        if(plQualityLinkList.playlists[0].uri.match(vplReg)){
            let audioKey = Object.keys(plQualityLinkList.mediaGroups.AUDIO).pop();
            if(plQualityLinkList.mediaGroups.AUDIO[audioKey]){
                let audioData = plQualityLinkList.mediaGroups.AUDIO[audioKey],
                    audioEl = Object.keys(audioData);
                audioData = audioData[audioEl[0]];
                plAud = { ...audioData, ...{ langStr: audioEl[0] } };
            }
            plQualityLinkList.playlists.sort((a, b) => {
                let av = parseInt(a.uri.match(vplReg)[3]);
                let bv = parseInt(b.uri.match(vplReg)[3]);
                if(av  > bv){
                    return 1;
                }
                if (av < bv) {
                    return -1;
                }
                return 0;
            });
        }
        
        for(let s of plQualityLinkList.playlists){
            if(s.uri.match(/_Layer(\d+)\.m3u8/) || s.uri.match(vplReg)){
                // set layer and max layer
                let plLayerId = 0;
                if(s.uri.match(/_Layer(\d+)\.m3u8/)){
                    plLayerId = parseInt(s.uri.match(/_Layer(\d+)\.m3u8/)[1]);
                }
                else{
                    plLayerId = plNewIds, plNewIds++;
                }
                plMaxLayer    = plMaxLayer < plLayerId ? plLayerId : plMaxLayer;
                // set urls and servers
                let plUrlDl  = s.uri;
                let plServer = new URL(plUrlDl).host;
                if(!plServerList.includes(plServer)){
                    plServerList.push(plServer);
                }
                if(!Object.keys(plStreams).includes(plServer)){
                    plStreams[plServer] = {};
                }
                if(plStreams[plServer][plLayerId] && plStreams[plServer][plLayerId] != plUrlDl){
                    console.log(`[WARN] Non duplicate url for ${plServer} detected, please report to developer!`);
                }
                else{
                    plStreams[plServer][plLayerId] = plUrlDl;
                }
                // set plLayersStr
                let plResolution = s.attributes.RESOLUTION;
                plLayersRes[plLayerId] = plResolution;
                let plBandwidth  = Math.round(s.attributes.BANDWIDTH/1024);
                if(plLayerId<10){
                    plLayerId = plLayerId.toString().padStart(2,' ');
                }
                let qualityStrAdd   = `${plLayerId}: ${plResolution.width}x${plResolution.height} (${plBandwidth}KiB/s)`;
                let qualityStrRegx  = new RegExp(qualityStrAdd.replace(/(:|\(|\)|\/)/g,'\\$1'),'m');
                let qualityStrMatch = !plLayersStr.join('\r\n').match(qualityStrRegx);
                if(qualityStrMatch){
                    plLayersStr.push(qualityStrAdd);
                }
            }
            else {
                console.log(s.uri);
            }
        }

        for(let s of mainServersList){
            if(plServerList.includes(s)){
                plServerList.splice(plServerList.indexOf(s), 1);
                plServerList.unshift(s);
                break;
            }
        }
        
        if(typeof argv.q == 'object' && argv.q.length > 1){
            argv.q = argv.q[argv.q.length-1];
        }
        
        argv.q = argv.q < 1 || argv.q > plMaxLayer ? plMaxLayer : argv.q;
        
        let plSelectedServer = plServerList[argv.x-1];
        let plSelectedList   = plStreams[plSelectedServer];
        let videoUrl = argv.x < plServerList.length+1 && plSelectedList[argv.q] ? plSelectedList[argv.q] : '';
        
        plLayersStr.sort();
        console.log(`[INFO] Servers available:\n\t${plServerList.join('\n\t')}`);
        console.log(`[INFO] Available qualities:\n\t${plLayersStr.join('\n\t')}`);
        
        if(videoUrl != ''){
            console.log(`[INFO] Selected layer: ${argv.q} (${plLayersRes[argv.q].width}x${plLayersRes[argv.q].height}) @ ${plSelectedServer}`);
            console.log('[INFO] Stream URL:',videoUrl);
    
            fnOutput = parseFileName(argv.fileName, title, fnEpNum, showTitle, season, plLayersRes[argv.q].width, plLayersRes[argv.q].height);
            if (fnOutput.length < 1)
                throw new Error('Invalid path', fnOutput);
            outName = fnOutput.slice(-1);
            console.log(`[INFO] Output filename: ${fnOutput.join(path.sep)}.ts`);
        }
        else if(argv.x > plServerList.length){
            console.log('[ERROR] Server not selected!\n');
            return;
        }
        else{
            console.log('[ERROR] Layer not selected!\n');
            return;
        }
        
        let dlFailed = false;
        let dlFailedA = false;
        
        await fs.promises.mkdir(path.join(cfg.dir.content, ...fnOutput.slice(0, -1)), { recursive: true });

        video: if (!argv.novids) {
            if (plAud.uri && (purvideo.length > 0 || audioAndVideo.length > 0)) {
                break video;
            } else if (!plAud.uri && (audioAndVideo.some(a => a.lang === streamPath.lang) || puraudio.some(a => a.lang === streamPath.lang))) {
                break video;
            }
            // download video
            let reqVideo = await getData({
                url: videoUrl,
                useProxy: (argv.ssp ? false : true),
                debug: argv.debug,
            });
            if (!reqVideo.ok) { break video; }
            
            let chunkList = m3u8(reqVideo.res.body);
            
            let tsFile = path.join(cfg.dir.content, ...fnOutput.slice(0, -1), `${fnOutput.slice(-1)}.video${(plAud.uri ? '' : '.' + streamPath.lang )}`);
            dlFailed = !await downloadFile(tsFile, chunkList);
            if (!dlFailed) {
                if (plAud.uri) {
                    purvideo.push({
                        path: `${tsFile}.ts`,
                        lang: plAud.language
                    });
                } else {
                    audioAndVideo.push({
                        path: `${tsFile}.ts`,
                        lang: streamPath.lang
                    });
                }
            }
        }
        else{
            console.log('[INFO] Skip video downloading...\n');
        }
        audio: if (!argv.noaudio && plAud.uri) {
            // download audio
            if (audioAndVideo.some(a => a.lang === plAud.language) || puraudio.some(a => a.lang === plAud.language))
                break audio;
            let reqAudio = await getData({
                url: plAud.uri,
                useProxy: (argv.ssp ? false : true),
                debug: argv.debug,
            });
            if (!reqAudio.ok) { return; }
            
            let chunkListA = m3u8(reqAudio.res.body);
    
            let tsFileA = path.join(cfg.dir.content, ...fnOutput.slice(0, -1), `${fnOutput.slice(-1)}.audio.${plAud.language}`);
    
            dlFailedA = !await downloadFile(tsFileA, chunkListA);
            if (!dlFailedA)
                puraudio.push({
                    path: `${tsFileA}.ts`,
                    lang: plAud.language
                });

        }
    }
    
    // add subs
    let subsExt = !argv.mp4 || argv.mp4 && argv.ass ? '.ass' : '.srt';
    let addSubs = true;

    // download subtitles
    if(stDlPath.length > 0){
        console.log('[INFO] Downloading subtitles...');
        for (let subObject of stDlPath) {
            let subsSrc = await getData({
                url: subObject.path,
                useProxy: true,
                debug: argv.debug,
            });
            if(subsSrc.ok){
                let assData = vttConvert(subsSrc.res.body, (subsExt == '.srt' ? true : false), subObject.langName, argv.fontSize);
                subObject.file =  path.join(cfg.dir.content, ...fnOutput.slice(0, -1), `${fnOutput.slice(-1)}.subtitle${subObject.ext}${subsExt}`);
                fs.writeFileSync(subObject.file, assData);
            }
            else{
                console.log('[ERROR] Failed to download subtitles!');
                addSubs = false;
                break;
            }
        }
        if (addSubs)
            console.log('[INFO] Subtitles downloaded!');
    }
    
    if((puraudio.length < 1 && audioAndVideo.length < 1) || (purvideo.length < 1 && audioAndVideo.length < 1)){
        console.log('\n[INFO] Unable to locate a video AND audio file\n');
        return;
    }
    
    if(argv.skipmux){
        console.log('[INFO] Skipping muxing...');
        return;
    }

    // usage
    let usableMKVmerge = true;
    let usableFFmpeg = true;
    
    // check exec path
    let mkvmergebinfile = await lookpath(path.join(cfg.bin.mkvmerge));
    let ffmpegbinfile   = await lookpath(path.join(cfg.bin.ffmpeg));

    // check exec
    if( !argv.mp4 && !mkvmergebinfile ){
        console.log('[WARN] MKVMerge not found, skip using this...');
        usableMKVmerge = false;
    }
    if( !usableMKVmerge && !ffmpegbinfile || argv.mp4 && !ffmpegbinfile ){
        console.log('[WARN] FFmpeg not found, skip using this...');
        usableFFmpeg = false;
    }
    if ( argv.novids ){
        console.log('[INFO] Video not downloaded. Skip muxing video.');
    }

    if(!argv.mp4 && usableMKVmerge){
        let ffext = !argv.mp4 ? 'mkv' : 'mp4';
        let command = merger.buildCommandMkvMerge(argv.simul, audioAndVideo, purvideo, puraudio, stDlPath, `${path.join(cfg.dir.content, outName)}.${ffext}`);
        shlp.exec('mkvmerge', `"${mkvmergebinfile}"`, command);
    }
    else if(usableFFmpeg){
        let ffext = !argv.mp4 ? 'mkv' : 'mp4';
        let command = merger.buildCommandFFmpeg(argv.simul, audioAndVideo, purvideo, puraudio, stDlPath, `${path.join(cfg.dir.content, outName)}.${ffext}`);
        shlp.exec('ffmpeg',`"${ffmpegbinfile}"`,command);
    }
    else{
        console.log('\n[INFO] Done!\n');
        return;
    }
    if (argv.nocleanup)
        return;
    
    audioAndVideo.concat(puraudio).concat(purvideo).forEach(a => fs.unlinkSync(a.path));
    stDlPath.forEach(subObject => fs.unlinkSync(subObject.file));
    console.log('\n[INFO] Done!\n');
}

async function downloadFile(filename, chunkList) {
    let offset = 0;
    fileCheck: if (fs.existsSync(filename + '.ts')) {
        if (fs.existsSync(filename + '.ts.resume')) {
            const resume = JSON.parse(fs.readFileSync(`${filename}.ts.resume`));
            if (resume.total === chunkList.segments.length) {
                offset = resume.downloaded;
                break fileCheck;
            }
        }
        let rwts = await shlp.question(`[Q] File «${filename + '.ts'}» already exists! Rewrite or continue? (y/N/c)`);
        rwts = rwts || 'N';
        if (['N', 'n'].includes(rwts[0])) {
            return false;
        } else if (['C', 'c'].includes(rwts[0])) {
            return true;
        } else {
            fs.unlinkSync(filename + '.ts');
        }
    }

    let start = Date.now();

    console.log(`[INFO] Started ${filename}.ts`);
    for (let i = offset; i < chunkList.segments.length; i+=argv.partsize) {
        let cur = [];
        for (let a = 0; a < Math.min(argv.partsize, chunkList.segments.length - i); a++) {
            cur.push(downloadPart(chunkList.segments[i + a], i + a, chunkList.segments.length)
                .catch(e => e));
        }

        let p = await Promise.all(cur);
        if (p.some(el => el instanceof Error)) {
            console.log(`[ERROR] An error occured while downloading ${filename}.ts`);
            return false;
        }

        fs.writeFileSync(`${filename}.ts.resume`, JSON.stringify({ total: chunkList.segments.length, downloaded: i + argv.partsize }, null, 4));

        for (let a = 0; a < p.length; a++) {
            fs.writeFileSync(filename + '.ts', p[a].content, { flag: 'a' });
        }

        logDownloadInfo(start, i + Math.min(argv.partsize, chunkList.segments.length - i),
            chunkList.segments.length, i + Math.min(argv.partsize, chunkList.segments.length - i),
            chunkList.segments.length);
    }
    
    if (fs.existsSync(`${filename}.ts.resume`))
        fs.unlinkSync(`${filename}.ts.resume`);

    console.log(`[INFO] Finished ${filename}.ts`);
    return true;
}

async function downloadPart(chunk, index) {

    let key = await generateCrypto(chunk, index);
    
    let headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:70.0) Gecko/20100101 Firefox/70.0'
    };

    if (chunk.byterange)
        headers.Range = `bytes=${chunk.byterange.offset}-${chunk.byterange.offset+chunk.byterange.length-1}`;

    let res = (await got({
        url: chunk.uri,
        headers,
        responseType: 'buffer'
    }).catch(error => console.log(`[ERROR] ${error.name}: ${error.code||error.message}`)));

    if (!res.body) { return new Error('Invalid State'); }
    try {
        let dec = key.update(res.body);
        dec = Buffer.concat([dec, key.final()]);
        return { content: dec, index: index};
    } catch (e) { return e; }
}

let keys = {};
async function generateCrypto(chunk, index) {
    let key = keys[chunk.key.uri];
    if (!key) {
        let reqKey = await getData({
            url: chunk.key.uri,
            responseType: 'buffer'
        });
    
        if (!reqKey.ok) { console.log('[ERROR] Can\'t get key'); return; }
        key = reqKey.res.body;
        keys[chunk.key.uri] = key;
    }
    let iv = Buffer.alloc(16);
    let ivs = chunk.key.iv ? chunk.key.iv : [0, 0, 0, index];
    for (let i in ivs) {
        iv.writeUInt32BE(ivs[i], i * 4);
    }
    key = crypto.createDecipheriv('aes-128-cbc', key, iv);
    return key;
}

/* Snacked from hls-download */
function logDownloadInfo (dateStart, partsDL, partsTotal, partsDLRes, partsTotalRes) {
    const dateElapsed = Date.now() - dateStart;
    const percentFxd = (partsDL / partsTotal * 100).toFixed();
    const percent = percentFxd < 100 ? percentFxd : (partsTotal == partsDL ? 100 : 99);
    const revParts = parseInt(dateElapsed * (partsTotal / partsDL - 1));
    const time = shlp.formatTime((revParts / 1000).toFixed());
    console.log(`[INFO] ${partsDLRes} of ${partsTotalRes} parts downloaded [${percent}%] (${time})`);
}

/**
 * @param {string} input 
 * @param {string} title 
 * @param {number|string} episode 
 * @param {string} showTitle 
 * @param {number} season 
 * @param {number} width 
 * @param {number} height 
 * @returns {Array<string>}
 */
function parseFileName(input, title, episode, showTitle, season, width, height) {
    const varRegex = /\${[A-Za-z1-9]+}/g;
    const vars = input.match(varRegex);
    for (let i = 0; i < vars.length; i++) {
        const type = vars[i];
        switch (type.slice(2, -1).toLowerCase()) {
            case 'title':
                input = input.replace(vars[i], title);
                break;
            case 'episode': {
                if (typeof episode === 'number') {
                    let len = episode.toFixed(0).toString().length;
                    input = input.replace(vars[i], len < argv.numbers ? '0'.repeat(argv.numbers - len) + episode : episode);
                } else {
                    input = input.replace(vars[i], episode);
                }
                break;
            }
            case 'showtitle':
                input = input.replace(vars[i], showTitle);
                break;
            case 'season': {
                let len = season.toFixed(0).toString().length;
                input = input.replace(vars[i], len < argv.numbers ? '0'.repeat(argv.numbers - len) + season : season);
                break;
            }
            case 'width':
                input = input.replace(vars[i], width);
                break;
            case 'height':
                input = input.replace(vars[i], height);
                break;
            default:
                break;
        }
    }
    return input.split(path.sep).map(a => shlp.cleanupFilename(a));
}
