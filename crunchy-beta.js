#!/usr/bin/env node

// build-in
const path = require('path');
const fs = require('fs-extra');

// package program
const packageJson = require('./package.json');
console.log(`\n=== Crunchyroll Beta Downloader NX ${packageJson.version} ===\n`);

// plugins
const shlp = require('sei-helper');
const m3u8 = require('m3u8-parsed');
const streamdl = require('hls-download');

// custom modules
const fontsData   = require('./crunchy/modules/module.fontsData');
const langsData   = require('./crunchy/modules/module.langsData');
const yamlCfg     = require('./crunchy/modules/module.cfg-loader');
const yargs       = require('./crunchy/modules/module.app-args');
const epsFilter   = require('./crunchy/modules/module.eps-filter');
const appMux      = require('./crunchy/modules/module.muxing');

// new-cfg paths
const cfg = yamlCfg.loadCfg();
let token = yamlCfg.loadCRToken();
let cmsToken = {};

// args
const appYargs = new yargs(cfg.cli, langsData, true);
const argv = appYargs.appArgv();
argv.appstore = {};

// load req
const { domain, api } = require('./crunchy/modules/module.api-urls');
const reqModule = require('./crunchy/modules/module.req');
const req = new reqModule.Req(domain, argv, true);

// select
(async () => {
    // load binaries
    cfg.bin = await yamlCfg.loadBinCfg();
    // select mode
    if(argv.dlfonts){
        await getFonts();
    }
    else if(argv.auth){
        await doAuth();
    }
    else if(argv.cmsindex){
        await refreshToken();
        await getCmsData();
    }
    else if(argv.new){
        await refreshToken();
        await getNewlyAdded();
    }
    else if(argv.search && argv.search.length > 2){
        await refreshToken();
        await doSearch();
    }
    else if(argv.series && argv.series.match(/^[0-9A-Z]{9}$/)){
        await refreshToken();
        await getSeriesById();
    }
    else if(argv['movie-listing'] && argv['movie-listing'].match(/^[0-9A-Z]{9}$/)){
        await refreshToken();
        await getMovieListingById();
    }
    else if(argv.season && argv.season.match(/^[0-9A-Z]{9}$/)){
        await refreshToken();
        await getSeasonById();
    }
    else if(argv.episode){
        await refreshToken();
        await getObjectById();
    }
    else{
        appYargs.showHelp();
    }
})();

// get cr fonts
async function getFonts(){
    console.log('[INFO] Downloading fonts...');
    for(const f of Object.keys(fontsData.fonts)){
        const fontFile = fontsData.fonts[f];
        const fontLoc  = path.join(cfg.dir.fonts, fontFile);
        if(fs.existsSync(fontLoc) && fs.statSync(fontLoc).size != 0){
            console.log(`[INFO] ${f} (${fontFile}) already downloaded!`);
        }
        else{
            const fontFolder = path.dirname(fontLoc);
            if(fs.existsSync(fontLoc) && fs.statSync(fontLoc).size == 0){
                fs.unlinkSync(fontLoc);
            }
            try{
                fs.ensureDirSync(fontFolder);
            }
            catch(e){}
            const fontUrl = fontsData.root + fontFile;
            const getFont = await req.getData(fontUrl, { useProxy: true, binary: true });
            if(getFont.ok){
                fs.writeFileSync(fontLoc, getFont.res.body);
                console.log(`[INFO] Downloaded: ${f} (${fontFile})`);
            }
            else{
                console.log(`[WARN] Failed to download: ${f} (${fontFile})`);
            }
        }
    }
    console.log('[INFO] All required fonts downloaded!');
}

// auth method
async function doAuth(){
    const iLogin = argv.user ? argv.user : await shlp.question('[Q] LOGIN/EMAIL');
    const iPsswd = argv.pass ? argv.pass : await shlp.question('[Q] PASSWORD   ');
    const authData = new URLSearchParams({
        'username': iLogin,
        'password': iPsswd,
        'grant_type': 'password',
        'scope': 'offline_access'
    }).toString();
    const authReqOpts = {
        method: 'POST',
        headers: api.beta_authHeaderMob,
        body: authData,
        useProxy: true
    };
    const authReq = await req.getData(api.beta_auth, authReqOpts);
    if(!authReq.ok){
        console.log('[ERROR] Authentication failed!');
        return;
    }
    token = JSON.parse(authReq.res.body);
    token.expires = new Date(Date.now() + token.expires_in);
    yamlCfg.saveCRToken(token);
    await getProfile();
    console.log('[INFO] Your Country: %s', token.country);
}

async function getProfile(){
    if(!token.access_token){
        console.log('[ERROR] No access token!');
        return;
    }
    const profileReqOptions = {
        headers: {
            Authorization: `Bearer ${token.access_token}`,
        },
        useProxy: true
    };
    const profileReq = await req.getData(api.beta_profile, profileReqOptions);
    if(!profileReq.ok){
        console.log('[ERROR] Get profile failed!');
        return;
    }
    const profile = JSON.parse(profileReq.res.body);
    console.log('[INFO] USER: %s (%s)', profile.username, profile.email);
}

// auth method
async function doAnonymousAuth(){
    const authData = new URLSearchParams({
        'grant_type': 'client_id',
        'scope': 'offline_access',
    }).toString();
    const authReqOpts = {
        method: 'POST',
        headers: api.beta_authHeaderMob,
        body: authData,
        useProxy: true
    };
    const authReq = await req.getData(api.beta_auth, authReqOpts);
    if(!authReq.ok){
        console.log('[ERROR] Authentication failed!');
        return;
    }
    token = JSON.parse(authReq.res.body);
    token.expires = new Date(Date.now() + token.expires_in);
    yamlCfg.saveCRToken(token);
}

// refresh token
async function refreshToken(){
    if(!token.access_token && !token.refresh_token || token.access_token && !token.refresh_token){
        await doAnonymousAuth();
    }
    else{
        if(Date.now() > new Date(token.expires).getTime()){
            // return;
        }
        const authData = new URLSearchParams({
            'refresh_token': token.refresh_token,
            'grant_type': 'refresh_token',
            'scope': 'offline_access'
        }).toString();
        const authReqOpts = {
            method: 'POST',
            headers: api.beta_authHeaderMob,
            body: authData,
            useProxy: true
        };
        const authReq = await req.getData(api.beta_auth, authReqOpts);
        if(!authReq.ok){
            console.log('[ERROR] Authentication failed!');
            return;
        }
        token = JSON.parse(authReq.res.body);
        token.expires = new Date(Date.now() + token.expires_in);
        yamlCfg.saveCRToken(token);
    }
    if(token.refresh_token){
        await getProfile();
    }
    else{
        console.log('[INFO] USER: Anonymous');
    }
    await getCMStoken();
}

async function getCMStoken(){
    if(!token.access_token){
        console.log('[ERROR] No access token!');
        return;
    }
    const cmsTokenReqOpts = {
        headers: {
            Authorization: `Bearer ${token.access_token}`,
        },
        useProxy: true
    };
    const cmsTokenReq = await req.getData(api.beta_cmsToken, cmsTokenReqOpts);
    if(!cmsTokenReq.ok){
        console.log('[ERROR] Authentication CMS token failed!');
        return;
    }
    cmsToken = JSON.parse(cmsTokenReq.res.body);
    console.log('[INFO] Your Country: %s\n', cmsToken.cms.bucket.split('/')[1]);
}

async function getCmsData(){
    // check token
    if(!cmsToken.cms){
        console.log('[ERROR] Authentication required!');
        return;
    }
    // opts
    const indexReqOpts = [
        api.beta_cms,
        cmsToken.cms.bucket,
        '/index?',
        new URLSearchParams({
            'Policy': cmsToken.cms.policy,
            'Signature': cmsToken.cms.signature,
            'Key-Pair-Id': cmsToken.cms.key_pair_id,
        }),
    ].join('');
    const indexReq = await req.getData(indexReqOpts, { useProxy: true });
    if(!indexReq.ok){
        console.log('[ERROR] Get CMS index FAILED!');
        return;
    }
    console.log(JSON.parse(indexReq.res.body));
}

async function doSearch(){
    if(!token.access_token){
        console.log('[ERROR] Authentication required!');
        return;
    }
    const searchReqOpts = {
        headers: {
            Authorization: `Bearer ${token.access_token}`,
        },
        useProxy: true
    };
    const searchParams = new URLSearchParams({
        q: argv.search,
        n: 5,
        start: argv.page ? (parseInt(argv.page)-1)*5 : 0,
        type: argv['search-type'],
        locale: argv['search-locale'],
    }).toString();
    let searchReq = await req.getData(`${api.beta_search}?${searchParams}`, searchReqOpts);
    if(!searchReq.ok){
        console.log('[ERROR] Search FAILED!');
        return;
    }
    let searchResults = JSON.parse(searchReq.res.body);
    if(searchResults.total < 1){
        console.log('[INFO] Nothing Found!');
        return;
    }
    const searchTypesInfo = {
        'top_results':   'Top results',
        'series':        'Found series',
        'movie_listing': 'Found movie lists',
        'episode':       'Found episodes'
    };
    for(let search_item of searchResults.items){
        console.log('[INFO] %s:', searchTypesInfo[search_item.type]);
        // calculate pages
        let itemPad = parseInt(new URL(search_item.__href__, domain.api_beta).searchParams.get('start'));
        let pageCur = itemPad > 0 ? Math.ceil(itemPad/5) + 1 : 1;
        let pageMax = Math.ceil(search_item.total/5);
        // pages per category
        if(search_item.total < 1){
            console.log('  [INFO] Nothing Found...');
        }
        if(search_item.total > 0){
            if(pageCur > pageMax){
                console.log('  [INFO] Last page is %s...', pageMax);
                continue;
            }
            for(let item of search_item.items){
                await parseObject(item);
            }
            console.log(`  [INFO] Total results: ${search_item.total} (Page: ${pageCur}/${pageMax})`);
        }
    }
}

async function parseObject(item, pad, getSeries, getMovieListing){
    if(argv.debug){
        console.log(item);
    }
    pad = typeof pad == 'number' ? pad : 2;
    getSeries = typeof getSeries == 'boolean' ? getSeries : true;
    getMovieListing = typeof getMovieListing == 'boolean' ? getMovieListing : true;
    item.isSelected = typeof item.isSelected == 'boolean' ? item.isSelected : false;
    if(!item.type){
        item.type = item.__class__;
    }
    const oTypes = {
        'series': 'Z',        // SRZ
        'season': 'S',        // VOL
        'episode': 'E',       // EPI
        'movie_listing': 'F', // FLM
        'movie': 'M',         // MED
    };
    // check title
    item.title = item.title != '' ? item.title : 'NO_TITLE';
    // static data
    const oMetadata = [],
        oBooleans = [],
        tMetadata = item.type + '_metadata',
        iMetadata = item[tMetadata] ? item[tMetadata] : item,
        iTitle = [ item.title ];
    // set object booleans
    if(iMetadata.duration_ms){
        oBooleans.push(shlp.formatTime(iMetadata.duration_ms/1000));
    }
    if(iMetadata.is_simulcast){
        oBooleans.push('SIMULCAST');
    }
    if(iMetadata.is_mature){
        oBooleans.push('MATURE');
    }
    if(iMetadata.is_subbed){
        oBooleans.push('SUB');
    }
    if(iMetadata.is_dubbed){
        oBooleans.push('DUB');
    }
    if(item.playback && item.type != 'movie_listing'){
        oBooleans.push('STREAM');
    }
    // set object metadata
    if(iMetadata.season_count){
        oMetadata.push(`Seasons: ${iMetadata.season_count}`);
    }
    if(iMetadata.episode_count){
        oMetadata.push(`EPs: ${iMetadata.episode_count}`);
    }
    if(item.season_number && !iMetadata.hide_season_title && !iMetadata.hide_season_number){
        oMetadata.push(`Season: ${item.season_number}`);
    }
    if(item.type == 'episode'){
        if(iMetadata.episode){
            iTitle.unshift(iMetadata.episode);
        }
        if(!iMetadata.hide_season_title && iMetadata.season_title){
            iTitle.unshift(iMetadata.season_title);
        }
    }
    if(item.is_premium_only){
        iTitle[0] = `☆ ${iTitle[0]}`;
    }
    // display metadata
    if(item.hide_metadata){
        iMetadata.hide_metadata = item.hide_metadata;
    }
    const showObjectMetadata = oMetadata.length > 0 && !iMetadata.hide_metadata ? true : false;
    const showObjectBooleans = oBooleans.length > 0 && !iMetadata.hide_metadata ? true : false;
    // make obj ids
    let objects_ids = [];
    objects_ids.push(oTypes[item.type] + ':' + item.id);
    if(item.seq_id){
        objects_ids.unshift(item.seq_id);
    }
    if(item.f_num){
        objects_ids.unshift(item.f_num);
    }
    if(item.s_num){
        objects_ids.unshift(item.s_num);
    }
    if(item.external_id){
        objects_ids.push(item.external_id);
    }
    if(item.ep_num){
        objects_ids.push(item.ep_num);
    }
    // show entry
    console.log(
        '%s%s[%s] %s%s%s',
        ''.padStart(item.isSelected ? pad-1 : pad, ' '),
        item.isSelected ? '✓' : '',
        objects_ids.join('|'),
        iTitle.join(' - '),
        showObjectMetadata ? ` (${oMetadata.join(', ')})` : '',
        showObjectBooleans ? ` [${oBooleans.join(', ')}]` : '',
        
    );
    if(item.last_public){
        console.log(''.padStart(pad+1, ' '), '- Last updated:', item.last_public);
    }
    if(item.subtitle_locales){
        iMetadata.subtitle_locales = item.subtitle_locales;
    }
    if(iMetadata.subtitle_locales && iMetadata.subtitle_locales.length > 0){
        console.log(
            '%s- Subtitles: %s',
            ''.padStart(pad + 2, ' '),
            langsData.parseSubtitlesArray(iMetadata.subtitle_locales)
        );
    }
    if(item.availability_notes && argv.shownotes){
        console.log(
            '%s- Availability notes: %s',
            ''.padStart(pad + 2, ' '),
            item.availability_notes.replace(/\[[^\]]*\]?/gm, '')
        );
    }
    if(item.type == 'series' && getSeries){
        argv.series = item.id;
        await getSeriesById(pad, true);
    }
    if(item.type == 'movie_listing' && getMovieListing){
        argv['movie-listing'] = item.id;
        await getMovieListingById(pad+2);
    }
}

async function getSeriesById(pad, hideSeriesTitle){
    // parse
    pad = typeof pad == 'number' ? pad : 0;
    hideSeriesTitle = typeof hideSeriesTitle == 'boolean' ? hideSeriesTitle : false;
    // check token
    if(!cmsToken.cms){
        console.log('[ERROR] Authentication required!');
        return;
    }
    // opts
    const seriesReqOpts = [
        api.beta_cms,
        cmsToken.cms.bucket,
        '/series/',
        argv.series,
        '?',
        new URLSearchParams({
            'Policy': cmsToken.cms.policy,
            'Signature': cmsToken.cms.signature,
            'Key-Pair-Id': cmsToken.cms.key_pair_id,
        }),
    ].join('');
    const seriesSeasonListReqOpts = [
        api.beta_cms,
        cmsToken.cms.bucket,
        '/seasons?',
        new URLSearchParams({
            'series_id': argv.series,
            'Policy': cmsToken.cms.policy,
            'Signature': cmsToken.cms.signature,
            'Key-Pair-Id': cmsToken.cms.key_pair_id,
        }),
    ].join('');
    // reqs
    if(!hideSeriesTitle){
        const seriesReq = await req.getData(seriesReqOpts, {useProxy: true});
        if(!seriesReq.ok){
            console.log('[ERROR] Series Request FAILED!');
            return;
        }
        const seriesData = JSON.parse(seriesReq.res.body);
        await parseObject(seriesData, pad, false);
    }
    // seasons list
    const seriesSeasonListReq = await req.getData(seriesSeasonListReqOpts, {useProxy: true});
    if(!seriesSeasonListReq.ok){
        console.log('[ERROR] Series Request FAILED!');
        return;
    }
    // parse data
    const seasonsList = JSON.parse(seriesSeasonListReq.res.body);
    if(seasonsList.total < 1){
        console.log('[INFO] Series is empty!');
        return;
    }
    for(let item of seasonsList.items){
        await parseObject(item, pad+2);
    }
}

async function getMovieListingById(pad){
    pad = typeof pad == 'number' ? pad : 2;
    if(!cmsToken.cms){
        console.log('[ERROR] Authentication required!');
        return;
    }
    const movieListingReqOpts = [
        api.beta_cms,
        cmsToken.cms.bucket,
        '/movies?',
        new URLSearchParams({
            'movie_listing_id': argv['movie-listing'],
            'Policy': cmsToken.cms.policy,
            'Signature': cmsToken.cms.signature,
            'Key-Pair-Id': cmsToken.cms.key_pair_id,
        }),
    ].join('');
    const movieListingReq = await req.getData(movieListingReqOpts, {useProxy: true});
    if(!movieListingReq.ok){
        console.log('[ERROR]  Movie Listing Request FAILED!');
        return;
    }
    let movieListing = JSON.parse(movieListingReq.res.body);
    if(movieListing.total < 1){
        console.log('[INFO] Movie Listing is empty!');
        return;
    }
    for(let item of movieListing.items){
        parseObject(item, pad);
    }
}

async function getNewlyAdded(){
    if(!token.access_token){
        console.log('[ERROR] Authentication required!');
        return;
    }
    const newlyAddedReqOpts = {
        headers: {
            Authorization: `Bearer ${token.access_token}`,
        },
        useProxy: true
    };
    const newlyAddedParams = new URLSearchParams({
        sort_by: 'newly_added',
        n: 25,
        start: argv.page ? (parseInt(argv.page)-1)*25 : 0,
    }).toString();
    let newlyAddedReq = await req.getData(`${api.beta_browse}?${newlyAddedParams}`, newlyAddedReqOpts);
    if(!newlyAddedReq.ok){
        console.log('[ERROR] Get newly added FAILED!');
        return;
    }
    let newlyAddedResults = JSON.parse(newlyAddedReq.res.body);
    console.log('[INFO] Newly added:');
    for(const i of newlyAddedResults.items){
        await parseObject(i, 2);
    }
    // calculate pages
    let itemPad = parseInt(new URL(newlyAddedResults.__href__, domain.api_beta).searchParams.get('start'));
    let pageCur = itemPad > 0 ? Math.ceil(itemPad/5) + 1 : 1;
    let pageMax = Math.ceil(newlyAddedResults.total/5);
    console.log(`  [INFO] Total results: ${newlyAddedResults.total} (Page: ${pageCur}/${pageMax})`);
}

async function getSeasonById(){
    if(!cmsToken.cms){
        console.log('[ERROR] Authentication required!');
        return;
    }
    
    const showInfoReqOpts = [
        api.beta_cms,
        cmsToken.cms.bucket,
        '/seasons/',
        argv.season,
        '?',
        new URLSearchParams({
            'Policy': cmsToken.cms.policy,
            'Signature': cmsToken.cms.signature,
            'Key-Pair-Id': cmsToken.cms.key_pair_id,
        }),
    ].join('');
    const showInfoReq = await req.getData(showInfoReqOpts, {useProxy: true});
    if(!showInfoReq.ok){
        console.log('[ERROR] Show Request FAILED!');
        return;
    }
    let showInfo = JSON.parse(showInfoReq.res.body);
    parseObject(showInfo, 0);
    const reqEpsListOpts = [
        api.beta_cms,
        cmsToken.cms.bucket,
        '/episodes?',
        new URLSearchParams({
            'season_id': argv.season,
            'Policy': cmsToken.cms.policy,
            'Signature': cmsToken.cms.signature,
            'Key-Pair-Id': cmsToken.cms.key_pair_id,
        }),
    ].join('');
    const reqEpsList = await req.getData(reqEpsListOpts, {useProxy: true});
    if(!reqEpsList.ok){
        console.log('[ERROR] Episode List Request FAILED!');
        return;
    }
    let episodeList = JSON.parse(reqEpsList.res.body);
    
    const epNumList = { ep: [], sp: 0 };
    const epNumLen = epsFilter.epNumLen;
    
    if(episodeList.total < 1){
        console.log('  [INFO] Season is empty!');
        return;
    }
    
    const doEpsFilter = new epsFilter.doFilter();
    const selEps = doEpsFilter.checkFilter(argv.episode);
    const selectedMedia = [];
    
    episodeList.items.forEach((item) => {
        item.hide_season_title = true;
        if(item.season_title == '' && item.series_title != ''){
            item.season_title = item.series_title;
            item.hide_season_title = false;
            item.hide_season_number = true;
        }
        if(item.season_title == '' && item.series_title == ''){
            item.season_title = 'NO_TITLE';
        }
        // set data
        const epMeta = {
            mediaId:       item.id,
            seasonTitle:   item.season_title,
            episodeNumber: item.episode,
            episodeTitle:  item.title,
        };
        if(item.playback){
            epMeta.playback = item.playback;
        }
        // find episode numbers
        let epNum = item.episode;
        let isSpecial = false;
        item.isSelected = false;
        if(!epNum.match(/^\d+$/) || epNumList.ep.indexOf(parseInt(epNum, 10)) > -1){
            isSpecial = true;
            epNumList.sp++;
        }
        else{
            epNumList.ep.push(parseInt(epNum, 10));
        }
        const selEpId = (
            isSpecial 
                ? 'S' + epNumList.sp.toString().padStart(epNumLen['S'], '0')
                : ''  + parseInt(epNum, 10).toString().padStart(epNumLen['E'], '0')
        );
        if(selEps.indexOf(selEpId) > -1 && !item.isSelected && item.playback){
            selectedMedia.push(epMeta);
            item.isSelected = true;
        }
        // show ep
        item.seq_id = selEpId;
        parseObject(item);
    });
    
    // display
    if(selectedMedia.length < 1){
        console.log('\n[INFO] Episodes not selected!\n');
        return;
    }
    
    if(selectedMedia.length > 1){
        argv.appstore.isBatch = true;
    }
    
    console.log();
    for(let media of selectedMedia){
        await getMedia(media);
    }
    
}

async function getObjectById(returnData){
    if(!cmsToken.cms){
        console.log('[ERROR] Authentication required!');
        return;
    }
    
    const doEpsFilter = new epsFilter.doFilter();
    const inpMedia = doEpsFilter.checkBetaFilter(argv.episode);
    
    if(inpMedia.length < 1){
        console.log('\n[INFO] Objects not selected!\n');
        return;
    }
    
    // node crunchy-beta -e G6497Z43Y,GRZXCMN1W,G62PEZ2E6,G25FVGDEK,GZ7UVPVX5
    console.log('[INFO] Requested object ID: %s', inpMedia.join(', '));
    
    const objectReqOpts = [
        api.beta_cms,
        cmsToken.cms.bucket,
        '/objects/',
        inpMedia.join(','),
        '?',
        new URLSearchParams({
            'Policy': cmsToken.cms.policy,
            'Signature': cmsToken.cms.signature,
            'Key-Pair-Id': cmsToken.cms.key_pair_id,
        }),
    ].join('');
    const objectReq = await req.getData(objectReqOpts, {useProxy: true});
    if(!objectReq.ok){
        console.log('[ERROR] Objects Request FAILED!');
        if(objectReq.error && objectReq.error.res && objectReq.error.res.body){
            const objectInfo = JSON.parse(objectReq.error.res.body);
            console.log('[INFO] Body:', JSON.stringify(objectInfo, null, '\t'));
            objectInfo.error = true;
            return objectInfo;
        }
        return { error: true };
    }
    
    const objectInfo = JSON.parse(objectReq.res.body);
    
    if(returnData){
        return objectInfo;
    }
    
    const selectedMedia = [];
    
    for(const item of objectInfo.items){
        if(item.type != 'episode' && item.type != 'movie'){
            await parseObject(item, 2, true, false);
            continue;
        }
        const epMeta = {};
        switch (item.type) {
            case 'episode':
                item.s_num = 'S:' + item.episode_metadata.season_id;
                epMeta.mediaId = 'E:'+ item.id;
                epMeta.seasonTitle = item.episode_metadata.season_title;
                epMeta.episodeNumber = item.episode_metadata.episode;
                epMeta.episodeTitle = item.title;
                break;
            case 'movie':
                item.f_num = 'F:' + item.movie_metadata.movie_listing_id;
                epMeta.mediaId = 'M:'+ item.id;
                epMeta.seasonTitle = item.movie_metadata.movie_listing_title;
                epMeta.episodeNumber = 'Movie';
                epMeta.episodeTitle = item.title;
                break;
        }
        if(item.playback){
            epMeta.playback = item.playback;
            selectedMedia.push(epMeta);
            item.isSelected = true;
        }
        await parseObject(item, 2);
    }
    
    if(selectedMedia.length > 1){
        argv.appstore.isBatch = true;
    }
    
    console.log();
    for(let media of selectedMedia){
        await getMedia(media);
    }
    
}

async function getMedia(mMeta){
    
    let mediaName = '...';
    if(mMeta.seasonTitle && mMeta.episodeNumber && mMeta.episodeTitle){
        mediaName = `${mMeta.seasonTitle} - ${mMeta.episodeNumber} - ${mMeta.episodeTitle}`;
    }
    
    console.log(`[INFO] Requesting: [${mMeta.mediaId}] ${mediaName}`);
    
    if(!mMeta.playback){
        console.log('[WARN] Video not available!');
        return;
    }
    
    if(appPatch.active){
        mMeta = appPatch.doMod1(mMeta, argv);
    }
    
    let playbackReq = await req.getData(mMeta.playback, {useProxy: true});
    
    if(!playbackReq.ok){
        console.log('[ERROR] Request Stream URLs FAILED!');
        return;
    }
    
    let pbData = JSON.parse(playbackReq.res.body);
    
    let epNum = mMeta.episodeNumber;
    if(epNum != '' && epNum !== null){
        epNum = epNum.match(/^\d+$/) ? epNum.padStart(argv['episode-number-length'], '0') : epNum;
    }
    
    argv.appstore.fn = {};
    argv.appstore.fn.title = argv.title ? argv.title : mMeta.seasonTitle,
    argv.appstore.fn.epnum = !argv.appstore.isBatch && argv.episode ? argv.episode : epNum;
    argv.appstore.fn.epttl = mMeta.episodeTitle;
    argv.appstore.fn.out   = fnOutputGen();
    
    let streams = [];
    let hsLangs = [];
    let pbStreams = pbData.streams;
    
    for(let s of Object.keys(pbStreams)){
        if(s.match(/hls/) && !s.match(/drm/) && !s.match(/trailer/)){
            let pb = Object.values(pbStreams[s]).map(v => {
                v.hardsub_lang = v.hardsub_locale 
                    ? langsData.fixAndFindCrLC(v.hardsub_locale).locale
                    : v.hardsub_locale;
                if(s.hardsub_lang && hsLangs.indexOf(s.hardsub_lang) < 0){
                    hsLangs.push(s.hardsub_lang);
                }
                return { 
                    ...v, 
                    ...{ format: s }
                };
            });
            streams.push(...pb);
        }
    }
    
    if(streams.length < 1){
        console.log('[WARN] No full streams found!');
        return;
    }
    
    let audDub = langsData.findLang(langsData.fixLanguageTag(pbData.audio_locale)).code;
    hsLangs = langsData.sortTags(hsLangs);
    
    streams = streams.map((s) => {
        s.audio_lang = audDub;
        s.hardsub_lang = s.hardsub_lang ? s.hardsub_lang : '-';
        s.type = `${s.format}/${s.audio_lang}/${s.hardsub_lang}`;
        return s;
    });
    
    let dlFailed = false;
    
    if(argv.hslang != 'none'){
        if(hsLangs.indexOf(argv.hslang) > -1){
            console.log('[INFO] Selecting stream with %s hardsubs', langsData.locale2language(argv.hslang).language);
            streams = streams.filter((s) => {
                if(s.hardsub_lang == '-'){
                    return false;
                }
                return s.hardsub_lang == argv.hslang ? true : false;
            });
        }
        else{
            console.log('[WARN] Selected stream with %s hardsubs not available', langsData.locale2language(argv.hslang).language);
            if(hsLangs.length > 0){
                console.log('[WARN] Try other hardsubs stream:', hsLangs.join(', '));
            }
            dlFailed = true;
        }
    }
    else{
        streams = streams.filter((s) => {
            if(s.hardsub_lang != '-'){
                return false;
            }
            return true;
        });
        if(streams.length < 1){
            console.log('[WARN] Raw streams not available!');
            if(hsLangs.length > 0){
                console.log('[WARN] Try hardsubs stream:', hsLangs.join(', '));
            }
            dlFailed = true;
        }
        console.log('[INFO] Selecting raw stream');
    }
    
    let curStream;
    if(!dlFailed){
        argv.kstream = typeof argv.kstream == 'number' ? argv.kstream : 1;
        argv.kstream = argv.kstream > streams.length ? 1 : argv.kstream;
        
        streams.map((s, i) => {
            const isSelected = argv.kstream == i + 1 ? '✓' : ' ';
            console.log('[INFO] Full stream found! (%s%s: %s )', isSelected, i + 1, s.type); 
        });
        
        console.log('[INFO] Downloading video...');
        curStream = streams[argv.kstream-1];
        
        if(argv.dub != curStream.audio_lang){
            argv.dub = curStream.audio_lang;
            console.log(`[INFO] audio language code detected, setted to ${curStream.audio_lang} for this episode`);
        }
        
        const streamUrlTxt = argv['show-stream-url'] ? curStream.url : '[HIDDEN]';
        console.log('[INFO] Playlists URL: %s (%s)', streamUrlTxt, curStream.type);
    }
    
    if(!argv.skipdl && !dlFailed){
        const streamPlaylistsReq = await req.getData(curStream.url, {useProxy: argv['use-proxy-streaming']});
        if(!streamPlaylistsReq.ok){
            console.log('[ERROR] CAN\'T FETCH VIDEO PLAYLISTS!');
            dlFailed = true;
        }
        else{
            const streamPlaylists = m3u8(streamPlaylistsReq.res.body);
            let plServerList = [],
                plStreams    = {},
                plQualityStr = [],
                plMaxQuality = 240;
            for(const pl of streamPlaylists.playlists){
                // set quality
                let plResolution     = pl.attributes.RESOLUTION.height;
                let plResolutionText = `${plResolution}p`;
                // set max quality
                plMaxQuality = plMaxQuality < plResolution ? plResolution : plMaxQuality;
                // parse uri
                let plUri = new URL(pl.uri);
                let plServer = plUri.hostname;
                // set server list
                if(plUri.searchParams.get('cdn')){
                    plServer += ` (${plUri.searchParams.get('cdn')})`;
                }
                if(!plServerList.includes(plServer)){
                    plServerList.push(plServer);
                }
                // add to server
                if(!Object.keys(plStreams).includes(plServer)){
                    plStreams[plServer] = {};
                }
                if(
                    plStreams[plServer][plResolutionText]
                    && plStreams[plServer][plResolutionText] != pl.uri
                    && typeof plStreams[plServer][plResolutionText] != 'undefined'
                ){
                    console.log(`[WARN] Non duplicate url for ${plServer} detected, please report to developer!`);
                }
                else{
                    plStreams[plServer][plResolutionText] = pl.uri;
                }
                // set plQualityStr
                let plBandwidth  = Math.round(pl.attributes.BANDWIDTH/1024);
                if(plResolution < 1000){
                    plResolution = plResolution.toString().padStart(4, ' ');
                }
                let qualityStrAdd   = `${plResolution}p (${plBandwidth}KiB/s)`;
                let qualityStrRegx  = new RegExp(qualityStrAdd.replace(/(:|\(|\)|\/)/g, '\\$1'), 'm');
                let qualityStrMatch = !plQualityStr.join('\r\n').match(qualityStrRegx);
                if(qualityStrMatch){
                    plQualityStr.push(qualityStrAdd);
                }
            }
            
            argv.server = argv.server > plServerList.length ? 1 : argv.server;
            argv.quality = argv.quality == 'max' ? `${plMaxQuality}p` : argv.quality;
            argv.appstore.fn.out = fnOutputGen();
            
            let plSelectedServer = plServerList[argv.server - 1];
            let plSelectedList   = plStreams[plSelectedServer];
            let selPlUrl = plSelectedList[argv.quality] ? plSelectedList[argv.quality] : '';
            
            plQualityStr.sort();
            console.log(`[INFO] Servers available:\n\t${plServerList.join('\n\t')}`);
            console.log(`[INFO] Available qualities:\n\t${plQualityStr.join('\n\t')}`);
            
            if(selPlUrl != ''){
                console.log(`[INFO] Selected quality: ${argv.quality} @ ${plSelectedServer}`);
                if(argv['show-stream-url']){
                    console.log('[INFO] Stream URL:', selPlUrl);
                }
                console.log(`[INFO] Output filename: ${argv.appstore.fn.out}`);
                const chunkPage = await req.getData(selPlUrl, {useProxy: argv['use-proxy-streaming']});
                if(!chunkPage.ok){
                    console.log('[ERROR] CAN\'T FETCH VIDEO PLAYLIST!');
                    dlFailed = true;
                }
                else{
                    const chunkPlaylist = m3u8(chunkPage.res.body);
                    let proxyHLS;
                    if(argv.proxy && argv['use-proxy-streaming']){
                        try{
                            proxyHLS = {};
                            proxyHLS.url = reqModule.buildProxy(argv.proxy, argv['proxy-auth']);
                            proxyHLS.url = proxyHLS.url.toString();
                        }
                        catch(e){
                            console.log(`\n[WARN] Not valid proxy URL${e.input?' ('+e.input+')':''}!`);
                            console.log('[WARN] Skiping...');
                        }
                    }
                    let totalParts = chunkPlaylist.segments.length;
                    let mathParts  = Math.ceil(totalParts / argv.tsparts);
                    let mathMsg    = `(${mathParts}*${argv.tsparts})`;
                    console.log('[INFO] Total parts in stream:', totalParts, mathMsg);
                    let tsFile = path.join(cfg.dir.content, argv.appstore.fn.out);
                    let streamdlParams = {
                        fn: `${tsFile}.ts`,
                        m3u8json: chunkPlaylist,
                        // baseurl: chunkPlaylist.baseUrl,
                        pcount: argv.tsparts,
                        partsOffset: 0,
                        proxy: proxyHLS || false,
                    };
                    let dlStreamByPl = await new streamdl(streamdlParams).download();
                    if(!dlStreamByPl.ok){
                        fs.writeFileSync(`${tsFile}.ts.resume`, JSON.stringify(dlStreamByPl.parts));
                        console.log(`[ERROR] DL Stats: ${JSON.stringify(dlStreamByPl.parts)}\n`);
                        dlFailed = true;
                    }
                    else if(fs.existsSync(`${tsFile}.ts.resume`) && dlStreamByPl.ok){
                        fs.unlinkSync(`${tsFile}.ts.resume`);
                    }
                }
            }
            else{
                console.log('[ERROR] Quality not selected!\n');
                dlFailed = true;
            }
        }
    }
    else if(argv.skipdl){
        console.log('[INFO] Downloading skipped!');
    }
    
    // fix max quality for non streams
    if(argv.quality == 'max'){
        argv.quality = '1080p';
        argv.appstore.fn.out = fnOutputGen();
    }
    
    argv.appstore.sxList = [];
    
    if(argv.dlsubs.indexOf('all') > -1){
        argv.dlsubs = ['all'];
    }
    
    if(argv.hslang != 'none'){
        console.log('[WARN] Subtitles downloading disabled for hardsubs streams.');
        argv.skipsubs = true;
    }
    
    if(!argv.skipsubs && argv.dlsubs.indexOf('none') == -1){
        if(pbData.subtitles && Object.values(pbData.subtitles).length > 0){
            let subsData = Object.values(pbData.subtitles);
            subsData = subsData.map((s) => {
                const subLang = langsData.fixAndFindCrLC(s.locale);
                s.locale = subLang;
                s.language = subLang.locale;
                s.title = subLang.language;
                return s;
            });
            const subsArr = langsData.sortSubtitles(subsData, 'language');
            for(let subsIndex in subsArr){
                const subsItem = subsArr[subsIndex];
                const langItem = subsItem.locale;
                const sxData = {};
                sxData.language = langItem;
                sxData.file = langsData.subsFile(argv.appstore.fn.out, subsIndex, langItem);
                sxData.path = path.join(cfg.dir.content, sxData.file);
                if(argv.dlsubs.includes('all') || argv.dlsubs.includes(langItem.locale)){
                    const subsAssReq = await req.getData(subsItem.url, {useProxy:  argv['use-proxy-streaming']});
                    if(subsAssReq.ok){
                        const sBody = '\ufeff' + subsAssReq.res.body;
                        sxData.title = sBody.split('\r\n')[1].replace(/^Title: /, '');
                        sxData.title = `${langItem.language} / ${sxData.title}`;
                        sxData.fonts = fontsData.assFonts(sBody);
                        fs.writeFileSync(path.join(cfg.dir.content, sxData.file), sBody);
                        console.log(`[INFO] Subtitle downloaded: ${sxData.file}`);
                        argv.appstore.sxList.push(sxData);
                    }
                    else{
                        console.log(`[WARN] Failed to download subtitle: ${sxData.file}`);
                    }
                }
            }
        }
        else{
            console.log('[WARN] Can\'t find urls for subtitles!');
        }
    }
    else{
        console.log('[INFO] Subtitles downloading skipped!');
    }
    
    // go to muxing
    if(!argv.skipmux && !dlFailed){
        await muxStreams();
    }
    else{
        console.log();
    }
    
}

async function muxStreams(){
    const merger = await appMux.checkMerger(cfg.bin, argv.mp4);
    const muxFile = path.join(cfg.dir.content, argv.appstore.fn.out);
    const sxList = argv.appstore.sxList;
    const audioDub = argv.dub;
    const addSubs = argv.muxsubs && sxList.length > 0 ? true : false;
    // set vars
    const vtag = appMux.constructVideoTag(argv['video-tag'], argv['group-tag'], argv.hslang);
    const vlang = argv.hslang != 'none' ? argv.hslang : 'und';
    let setMainSubLang = argv.defsublang != 'none' ? argv.defsublang : false;
    let isMuxed = false;
    // skip if no ts
    if(!appMux.checkTSFile(`${muxFile}.ts`)){
        console.log('[INFO] TS file not found, skip muxing video...\n');
        return;
    }
    // collect fonts info
    const fontList = appMux.makeFontsList(cfg.dir.fonts, fontsData, sxList);
    // mergers
    if(!argv.mp4 && !merger.MKVmerge){
        console.log('[WARN] MKVMerge not found...');
    }
    if(!merger.MKVmerge && !merger.FFmpeg || argv.mp4 && !merger.MKVmerge){
        console.log('[WARN] FFmpeg not found...');
    }
    // muxers additional options
    const muxOpts = { 
        audioDub,
        addSubs,
        vtag,
        vlang,
        setMainSubLang,
    };
    // do mkvmerge
    if(!argv.mp4 && merger.MKVmerge){
        const mkvmux = await appMux.buildCommandMkvMerge(muxFile, sxList, fontList, {
            ...muxOpts, useBCP: argv['use-bcp-tags'],
        });
        fs.writeFileSync(`${muxFile}.json`,JSON.stringify(mkvmux, null, '  '));
        try{
            shlp.exec('mkvmerge', `"${merger.MKVmerge}"`, `@"${muxFile}.json"`);
            isMuxed = true;
        }
        catch(e){
            // okay..
        }
    }
    else if(merger.FFmpeg){
        const outputFormat = !argv.mp4 ? 'mkv' : 'mp4';
        const subsCodec = !argv.mp4 ? 'copy' : 'mov_text';
        const ffmux = await appMux.buildCommandFFmpeg(muxFile, sxList, fontList, {
            ...muxOpts, outputFormat, subsCodec,
        });
        try{ 
            shlp.exec('ffmpeg',`"${merger.FFmpeg}"`, ffmux);
            isMuxed = true;
        }
        catch(e){
            // okay...
        }
        
    }
    else{
        console.log('\n[INFO] Done!\n');
        return;
    }
    
    doCleanUp(isMuxed, muxFile, addSubs, sxList);
    
}

function doCleanUp(isMuxed, muxFile, addSubs, sxList){
    // set output filename
    const fnOut = argv.appstore.fn.out;
    // check paths if same
    if(path.join(cfg.dir.trash) == path.join(cfg.dir.content)){
        argv.notrashfolder = true;
    }
    if(argv.nocleanup && !fs.existsSync(cfg.dir.trash)){
        argv.notrashfolder = true;
    }
    // cleanup
    if(argv.notrashfolder && argv.nocleanup){
        // don't move or delete temp files
    }
    else if(argv.nocleanup){
        if(isMuxed){
            const toTrashTS = path.join(cfg.dir.trash, `${fnOut}`);
            fs.renameSync(`${muxFile}.ts`, toTrashTS + '.ts');
            if(fs.existsSync(`${muxFile}.json`) && !argv.jsonmuxdebug){
                fs.renameSync(`${muxFile}.json`, toTrashTS + '.json');
            }
            if(addSubs){
                for(let t of sxList){
                    let subsFile  = path.join(cfg.dir.content, t.file);
                    let subsTrash = path.join(cfg.dir.trash, t.file);
                    fs.renameSync(subsFile, subsTrash);
                }
            }
        }
    }
    else if(isMuxed){
        fs.unlinkSync(`${muxFile}.ts`);
        if(fs.existsSync(`${muxFile}.json`) && !argv.jsonmuxdebug){
            fs.unlinkSync(`${muxFile}.json`);
        }
        if(addSubs){
            for(let t of sxList){
                let subsFile = path.join(cfg.dir.content, t.file);
                fs.unlinkSync(subsFile);
            }
        }
    }
    // move to subfolder
    if(argv.folder && isMuxed){
        const dubName = argv.dub.toUpperCase().slice(0, -1);
        const dubSuffix = argv.dub != 'jpn' ? ` [${dubName}DUB]` : '';
        const titleFolder = shlp.cleanupFilename(argv.appstore.fn.title + dubSuffix);
        const subFolder = path.join(cfg.dir.content, '/', titleFolder, '/');
        const vExt = '.' + ( !argv.mp4 ? 'mkv' : 'mp4' );
        if(!fs.existsSync(subFolder)){
            fs.mkdirSync(subFolder);
        }
        fs.renameSync(muxFile + vExt, path.join(subFolder, fnOut + vExt));
    }
    // done
    console.log('\n[INFO] Done!\n');
}

function fnOutputGen(){
    if(typeof argv.appstore.fn != 'object'){
        argv.appstore.fn = {};
    }
    const fnPrepOutput = argv.filename.toString()
        .replace('{rel_group}', argv['group-tag'])
        .replace('{title}',     argv.appstore.fn.title)
        .replace('{ep_num}',    argv.appstore.fn.epnum)
        .replace('{ep_titl}',   argv.appstore.fn.epttl)
        .replace('{suffix}',    argv.suffix.replace('SIZEp', argv.quality));
    return shlp.cleanupFilename(fnPrepOutput);
}
