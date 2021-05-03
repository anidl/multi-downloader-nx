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
const streamdl = require('hls-download');
const crypto = require("crypto");
const got = require('got');

// extra
const appYargs = require('./modules/module.app-args');
const getYamlCfg = require('./modules/module.cfg-loader');
const getData = require('./modules/module.getdata.js');
const vttConvert = require('./modules/module.vttconvert');

// new-cfg
const cfgFolder  = path.join(__dirname, '/config');
const binCfgFile = path.join(cfgFolder, 'bin-path');
const dirCfgFile = path.join(cfgFolder, 'dir-path');
const cliCfgFile = path.join(cfgFolder, 'cli-defaults');
const tokenFile  = path.join(cfgFolder, 'token');

// params
let cfg = {
    bin: getYamlCfg(binCfgFile),
    dir: getYamlCfg(dirCfgFile),
    cli: getYamlCfg(cliCfgFile),
};

// token
let token = getYamlCfg(tokenFile);
token = token.token ? token.token : false;

// info if token not set
if(!token){
    console.log('[INFO] Token not set!\n');
}

// cli
const argv = appYargs.appArgv(cfg.cli);

// check page
if(!isNaN(parseInt(argv.p, 10)) && parseInt(argv.p, 10) > 0){
    argv.p = parseInt(argv.p, 10);
}
else{
    argv.p = 1;
}

// fn variables
let fnTitle = '',
    fnEpNum = '',
    fnSuffix = '',
    fnOutput = '',
    tsDlPath = false,
    stDlPath = false,
    batchDL = false;

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
        if(epSelList.includes(epStrId.replace(/^(?:([A-Z]+)|)(0+)/,'$1'))){
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
    if(fnSlug.length>1){
        batchDL = true;
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
    let ep = JSON.parse(episodeData.res.body).items[0], streamId = 0;
    // build fn
    fnTitle = argv.t ? argv.t : ep.parent.title;
    ep.number = isNaN(ep.number) ? ep.number : ( parseInt(ep.number, 10) < 10 ? '0' + ep.number : ep.number );
    if(ep.mediaCategory != 'Episode'){
        ep.number = ep.number !== '' ? ep.mediaCategory+ep.number : ep.mediaCategory+'#'+ep.id;
    }
    fnEpNum = argv.ep && !batchDL ? ( parseInt(argv.ep, 10) < 10 ? '0' + argv.ep : argv.ep ) : ep.number;
    
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
    };
    
    // select
    media = media.reverse();
    for(let m of media){
        let selected = false;
        if(m.id > 0 && m.type == 'Non-Encrypted'){
            let dub_type = m.language;
            let selUncut = !argv.simul && uncut[dub_type] && m.version.match(/uncut/i) 
                ? true 
                : (!uncut[dub_type] || argv.simul && m.version.match(/simulcast/i) ? true : false);
            if(dub_type == 'Japanese' && argv.sub && selUncut){
                streamId = m.id;
                stDlPath = m.subtitles;
                selected = true;
            }
            else if(dub_type == dubType[argv.dub] && !argv.sub && selUncut){
                streamId = m.id;
                stDlPath = m.subtitles;
                selected = true;
            }
            console.log(`[#${m.id}] ${dub_type} [${m.version}]`,(selected?'(selected)':''));
        }
    }
    
    if(streamId<1){
        console.log('[ERROR] Track not selected\n');
        return;
    }
    else{
        let streamData = await getData({
            baseUrl: api_host,
            url: `/source/catalog/video/${streamId}/signed`,
            token: token,
            dinstid: 'uuid',
            useToken: true,
            useProxy: true,
            debug: argv.debug,
        });
        if(!streamData.ok){return;}
        streamData = JSON.parse(streamData.res.body);
        tsDlPath = false;
        if(streamData.errors){
            console.log('[ERROR] Error #%s: %s\n',streamData.errors[0].code,streamData.errors[0].detail);
            return;
        }
        else{
            for(let u in streamData.items){
                if(streamData.items[u].videoType == 'm3u8'){
                    tsDlPath = streamData.items[u].src;
                    break;
                }
            }
        }
        if(!tsDlPath){
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
        return false;
    }
    for(let i in m){
        let fpp = m[i].filePath.split('.');
        let fpe = fpp[fpp.length-1];
        if(fpe == 'vtt'){ // dfxp (TTML), srt, vtt
            return m[i].filePath;
        }
    }
    return false;
}

async function downloadStreams(){
    
    // req playlist
    let plQualityReq = await getData({
        url: tsDlPath,
        useProxy: (argv.ssp ? false : true),
        debug: argv.debug,
    });
    if(!plQualityReq.ok){return;}
    
    let plQualityLinkList = m3u8(plQualityReq.res.body);
    
    let mainServersList = [
        'vmfst-api.prd.funimationsvc.com',
        'd132fumi6di1wa.cloudfront.net',
        'funiprod.akamaized.net',
    ];
    
    let plServerList = [],
        plStreams    = {},
        plLayersStr  = [],
        plLayersRes  = {},
        plMaxLayer   = 1;
        plNewIds     = 1;
        plAud        = { uri: '' };
    
    // new uris
    let vplReg = /streaming_video_(\d+)_(\d+)_(\d+)_index\.m3u8/;
    if(plQualityLinkList.playlists[0].uri.match(vplReg)){
        if(plQualityLinkList.mediaGroups.AUDIO['audio-aacl-128']){
            let audioData = plQualityLinkList.mediaGroups.AUDIO['audio-aacl-128'];
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
        })
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
            let plResolution = `${s.attributes.RESOLUTION.height}p`;
            plLayersRes[plLayerId] = plResolution;
            let plBandwidth  = Math.round(s.attributes.BANDWIDTH/1024);
            if(plLayerId<10){
                plLayerId = plLayerId.toString().padStart(2,' ');
            }
            let qualityStrAdd   = `${plLayerId}: ${plResolution} (${plBandwidth}KiB/s)`;
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
        console.log(`[INFO] Selected layer: ${argv.q} (${plLayersRes[argv.q]}) @ ${plSelectedServer}`);
        console.log('[INFO] Stream URL:',videoUrl);
        fnSuffix = argv.suffix.replace('SIZEp',plLayersRes[argv.q]);
        fnOutput = shlp.cleanupFilename(`[${argv.a}] ${fnTitle} - ${fnEpNum} [${fnSuffix}]`);
        console.log(`[INFO] Output filename: ${fnOutput}.ts`);
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
    
    
    video: if (!argv.novids) {
        // download video
        let reqVideo = await getData({
            url: videoUrl,
            useProxy: (argv.ssp ? false : true),
            debug: argv.debug,
        });
        if (!reqVideo.ok) { break video; }
        
        let chunkList = m3u8(reqVideo.res.body);
        
        let tsFile = path.join(cfg.dir.content, fnOutput);
        
        if (chunkList.segments[0].uri.match(/streaming_video_(\d+)_(\d+)_(\d+)\.ts/)) {
            await downloadFile(tsFile, chunkList)
        } else {
            let proxyHLS = false;
            if (argv.proxy && !argv.ssp) {
                try {
                    proxyHLS = {};
                    proxyHLS.url = buildProxyUrl(argv.proxy, argv['proxy-auth']);
                }
                catch(e){
                    console.log(`\n[WARN] Not valid proxy URL${e.input?' ('+e.input+')':''}!`);
                    console.log('[WARN] Skiping...');
                    proxyHLS = false;
                }
            }
    
            let streamdlParams = {
                fn: tsFile + '.ts',
                m3u8json: chunkList,
                baseurl: chunkList.baseUrl,
                pcount: 10,
                proxy: (proxyHLS ? proxyHLS : false)
            };
            
            let dldata = await new streamdl(streamdlParams).download();
            if(!dldata.ok){
                fs.writeFileSync(`${tsFile}.ts.resume`, JSON.stringify(dldata.parts));
                console.log(`[ERROR] DL Stats: ${JSON.stringify(dldata.parts)}\n`);
                dlFailed = true;
            }
            else if(fs.existsSync(`${tsFile}.ts.resume`) && dldata.ok){
                fs.unlinkSync(`${tsFile}.ts.resume`);
            }
        }
    }
    else{
        console.log('[INFO] Skip video downloading...\n');
    }
    
    if (!argv.novids && plAud.uri) {
        // download audio
        let reqAudio = await getData({
            url: plAud.uri,
            useProxy: (argv.ssp ? false : true),
            debug: argv.debug,
        });
        if (!reqAudio.ok) { return; }
        
        let chunkListA = m3u8(reqAudio.res.body);

        let tsFileA = path.join(cfg.dir.content, fnOutput + `.${plAud.language}`);

        await downloadFile(tsFileA, chunkListA)
    }
    
     // add subs
    let subsUrl = stDlPath;
    let subsExt = !argv.mp4 || argv.mp4 && !argv.mks && argv.ass ? '.ass' : '.srt';
    let addSubs = argv.mks && subsUrl ? true : false;
    
    // download subtitles
    if(subsUrl){
        console.log('[INFO] Downloading subtitles...');
        console.log(subsUrl);
        let subsSrc = await getData({
            url: subsUrl,
            useProxy: true,
            debug: argv.debug,
        });
        if(subsSrc.ok){
            let assData = vttConvert(subsSrc.res.body, (subsExt == '.srt' ? true : false));
            let assFile = path.join(cfg.dir.content, fnOutput) + subsExt;
            fs.writeFileSync(assFile, assData);
            console.log('[INFO] Subtitles downloaded!');
        }
        else{
            console.log('[ERROR] Failed to download subtitles!');
            addSubs = false;
        }
    }
    
    if(dlFailed || dlFailedA){
        console.log('\n[INFO] TS file not fully downloaded, skip muxing video...\n');
        return;
    }
    
    if(argv.skipmux){
        return;
    }
    
    let muxTrg = path.join(cfg.dir.content, fnOutput);
    let muxTrgA = '';
    let tshTrg = path.join(cfg.dir.trash, fnOutput);
    let tshTrgA = ''
    
    if(!fs.existsSync(`${muxTrg}.ts`) || !fs.statSync(`${muxTrg}.ts`).isFile()){
        console.log('\n[INFO] TS file not found, skip muxing video...\n');
        return;
    }
    
    if(plAud.uri){
        muxTrgA = path.join(cfg.dir.content, fnOutput + `.${plAud.language}`);
        tshTrgA = path.join(cfg.dir.trash, fnOutput + `.${plAud.language}`)
        if(!fs.existsSync(`${muxTrgA}.ts`) || !fs.statSync(`${muxTrgA}.ts`).isFile()){
            console.log('\n[INFO] TS file not found, skip muxing video...\n');
            return;
        }
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
    
    // ftag
    argv.ftag = argv.ftag ? argv.ftag : argv.a;
    argv.ftag = shlp.cleanupFilename(argv.ftag);
    
    // select muxer
    if(!argv.mp4 && usableMKVmerge){
        // mux to mkv
        let mkvmux  = [];
        mkvmux.push('-o',`${muxTrg}.mkv`);
        mkvmux.push('--no-date','--disable-track-statistics-tags','--engage','no_variable_data');
        mkvmux.push('--track-name',`0:[${argv.ftag}]`);
        mkvmux.push('--language',`1:${argv.sub?'jpn':''}`);
        if(plAud.uri){
            mkvmux.push('--video-tracks','0','--no-audio');
            mkvmux.push('--no-subtitles','--no-attachments');
            mkvmux.push(`${muxTrg}.ts`);
            mkvmux.push('--no-video','--audio-tracks','0');
            mkvmux.push('--no-subtitles','--no-attachments');
            mkvmux.push(`${muxTrgA}.ts`);
        }
        else{
            mkvmux.push('--video-tracks','0','--audio-tracks','1');
            mkvmux.push('--no-subtitles','--no-attachments');
            mkvmux.push(`${muxTrg}.ts`);
        }
        if(addSubs){
            mkvmux.push('--language','0:eng');
            mkvmux.push(`${muxTrg}${subsExt}`);
        }
        fs.writeFileSync(`${muxTrg}.json`,JSON.stringify(mkvmux,null,'  '));
        shlp.exec('mkvmerge',`"${mkvmergebinfile}"`,`@"${muxTrg}.json"`);
        fs.unlinkSync(`${muxTrg}.json`);
    }
    else if(usableFFmpeg){
        let ffext = 'mp4'//!argv.mp4 ? 'mkv' : 'mp4';
        let ffmux = `-i "${muxTrg}.ts" `;
        if(plAud.uri){
            ffmux += `-i "${muxTrgA}.ts" `;
        }
        ffmux += addSubs ? `-i "${muxTrg}${subsExt}" ` : '';
        ffmux += '-map 0 -map 1:a -c:v copy -c:a copy ';
        ffmux += addSubs ? '-map 1 ' : '';
        ffmux += addSubs && !argv.mp4 ? '-c:s ass ' : '';
        ffmux += addSubs &&  argv.mp4 ? '-c:s mov_text ' : '';
        ffmux += '-metadata encoding_tool="no_variable_data" ';
        ffmux += `-metadata:s:v:0 title="[${argv.a}]" -metadata:s:a:0 language=${argv.sub?'jpn':''} `;
        ffmux += addSubs ? '-metadata:s:s:0 language=eng ' : '';
        ffmux += `"${muxTrg}.${ffext}"`;
        // mux to mkv
        shlp.exec('ffmpeg',`"${ffmpegbinfile}"`,ffmux);
    }
    else{
        console.log('\n[INFO] Done!\n');
        return;
    }
    if(argv.notrashfolder && argv.nocleanup){
        // don't move or delete temp files
    }
    else if(argv.nocleanup){
        fs.renameSync(muxTrg+'.ts', tshTrg + '.ts');
        if (plAud.uri)
            fs.renameSync(muxTrgA+'.ts', tshTrgA + '.ts')
        if(subsUrl && addSubs){
            fs.renameSync(muxTrg +subsExt, tshTrg +subsExt);
        }
    }
    else{
        fs.unlinkSync(muxTrg+'.ts');
        if (plAud.uri)
            fs.unlinkSync(muxTrgA+'.ts')
        if(subsUrl && addSubs){
            fs.unlinkSync(muxTrg +subsExt);
        }
    }
    console.log('\n[INFO] Done!\n');
}

async function downloadFile(filename, chunkList) {
    if (fs.existsSync(filename + '.ts')) {
        let rwts = await shlp.question(`[Q] File «${filename + '.ts'}» already exists! Rewrite? (y/N)`);
        rwts = rwts || 'N';
        if (!['Y', 'y'].includes(rwts[0])) {
            return;
        }
        fs.unlinkSync(filename + '.ts')
    }

    let parts = [], start = Date.now();

    console.log(`[INFO] Started ${filename}.ts`)
    for (let i = 0; i < chunkList.segments.length / argv.partsize; i++) {
        let cur = []
        for (let a = 0; a < Math.min(argv.partsize, chunkList.segments.length - (i * argv.partsize)); a++) {
            cur.push(downloadPart(chunkList.segments[i * argv.partsize + a], i * argv.partsize + a, chunkList.segments.length))
        }
        parts = parts.concat(await Promise.all(cur));
        logDownloadInfo(start, (i) * argv.partsize + Math.min(argv.partsize, chunkList.segments.length - (i * argv.partsize)),
            chunkList.segments.length, (i) * argv.partsize + Math.min(argv.partsize, chunkList.segments.length - (i * argv.partsize)),
            chunkList.segments.length)
    }

    if (parts.length !== chunkList.segments.length) {
        console.log("[ERROR] Some parts are missing")
        return;
    }

    for (let i = 0; i < chunkList.segments.length; i++) {
        fs.writeFileSync(filename + '.ts', parts[i].content, { flag: 'a' })
    }
    
    console.log(`[INFO] Finished ${filename}.ts`)
}

async function downloadPart(chunk, index) {

    let key = await generateCrypto(chunk, index)
    
    let res = (await got({
        url: chunk.uri,
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:70.0) Gecko/20100101 Firefox/70.0',
            'Range': `bytes=${chunk.byterange.offset}-${chunk.byterange.offset+chunk.byterange.length-1}`
        },
        responseType: 'buffer'
    }).catch(error => console.log(`[ERROR] ${error.name}: ${error.code||error.message}`)))

    if (!res.body) { return; }

    let dec = key.update(res.body);
    dec = Buffer.concat([dec, key.final()]);
    return { content: dec, index: index}
}

let keys = {}
async function generateCrypto(chunk, index) {
    let key = keys[chunk.key.uri]
    if (!key) {
        let reqKey = await getData({
            url: chunk.key.uri,
            responseType: 'buffer'
        })
    
        if (!reqKey.ok) { console.log("[ERROR] Can't get key"); return; }
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

// make proxy URL
function buildProxy(proxyBaseUrl, proxyAuth){
    if(!proxyBaseUrl.match(/^(https?|socks4|socks5):/)){
        proxyBaseUrl = 'http://' + proxyBaseUrl;
    }
    
    let proxyCfg = new URL(proxyBaseUrl);
    let proxyStr = `${proxyCfg.protocol}//`;
    
    if(typeof proxyCfg.hostname != 'string' || proxyCfg.hostname == ''){
        throw new Error('[ERROR] Hostname and port required for proxy!');
    }
    
    if(proxyAuth && typeof proxyAuth == 'string' && proxyAuth.match(':')){
        proxyCfg.username = proxyAuth.split(':')[0];
        proxyCfg.password = proxyAuth.split(':')[1];
        proxyStr += `${proxyCfg.username}:${proxyCfg.password}@`;
    }
    
    proxyStr += proxyCfg.hostname;
    
    if(!proxyCfg.port && proxyCfg.protocol == 'http:'){
        proxyStr += ':80';
    }
    else if(!proxyCfg.port && proxyCfg.protocol == 'https:'){
        proxyStr += ':443';
    }
    
    return proxyStr;
}
