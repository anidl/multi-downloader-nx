const got = require('got');

const argv = require('../funi').argv

const lang = {
    'ptBR': {
        langCode: 'pt-BR',
        regionCode: 'BR'
    },
    'esLA': {
        langCode: 'es-LA',
        regionCode: 'MX'
    }
}

// do req
const getData = async (options) => {
    let regionHeaders = ((argv.region !== undefined) && false) ? {
        "Accept-Language": lang[argv.region].langCode,
    } : {}


    let gOptions = { 
        url: options.url, 
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:70.0) Gecko/20100101 Firefox/70.0',
            "devicetype": "Android Phone",
            "Accept-Encoding": "gzip",
            ...regionHeaders
        }
    };
    if(options.responseType) {
        gOptions.responseType = options.responseType
    }
    if(options.baseUrl){
        gOptions.prefixUrl = options.baseUrl;
        gOptions.url = gOptions.url.replace(/^\//,'');
    }
    if(options.querystring){
        gOptions.url += `?${new URLSearchParams(options.querystring).toString()}`;
    }
    if(options.auth){
        gOptions.method = 'POST';
        gOptions.headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8"
        gOptions.headers["Origin"] = "https://www.funimation.com"
        gOptions.headers["Accept"] = "application/json, text/javascript, */*; q=0.01"
        gOptions.headers["Accept-Encoding"] = "gzip, deflate, br"
        gOptions.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0"
        gOptions.body = `username=${encodeURIComponent(options.auth.user)}&password=${encodeURIComponent(options.auth.pass)}`
        // if (argv.region !== undefined) {
            // gOptions.headers["Territory"] = lang[argv.region].regionCode
            // gOptions.headers["Accept-Language"] = `${lang[argv.region].langCode},en;q=0.5`
        // }
    }
    if(options.useToken && options.token){
        gOptions.headers.Authorization = `Token ${options.token}`;
    }
    if(options.dinstid){
        gOptions.headers.devicetype = 'Android Phone';
    }
    // debug
    gOptions.hooks = {
        beforeRequest: [
            (gotOpts) => {
                if(options.debug){
                    console.log('[DEBUG] GOT OPTIONS:');
                    console.log(gotOpts);
                }
            }
        ]
    };
    try {
        let res = await got(gOptions);
        if(res.body && (options.responseType !== 'buffer' && res.body.match(/^</))){
            throw { name: 'HTMLError', res };
        }
        return {
            ok: true,
            res,
        };
    }
    catch(error){
        if(options.debug){
            console.log(error);
        }
        if(error.response && error.response.statusCode && error.response.statusMessage){
            console.log(`[ERROR] ${error.name} ${error.response.statusCode}: ${error.response.statusMessage}`);
        }
        else if(error.name && error.name == 'HTMLError' && error.res && error.res.body){
            console.log(`[ERROR] ${error.name}:`);
            console.log(error.res.body);
        }
        else{
            console.log(`[ERROR] ${error.name}: ${error.code||error.message}`);
        }
        return {
            ok: false,
            error,
        };
    }
}

module.exports = getData;
