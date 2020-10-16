const FormData = require('form-data');
const got = require('got');

// do req
const getData = async (options) => {
    let gOptions = { 
        url: options.url, 
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:70.0) Gecko/20100101 Firefox/70.0',
        }
    };
    if(options.baseUrl){
        gOptions.prefixUrl = options.baseUrl;
        gOptions.url = gOptions.url.replace(/^\//,'');
    }
    if(options.querystring){
        gOptions.url += `?${new URLSearchParams(options.querystring).toString()}`;
    }
    if(options.auth){
        gOptions.method = 'POST';
        gOptions.body = new FormData();
        gOptions.body.append('username', options.auth.user);
        gOptions.body.append('password', options.auth.pass);
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
        if(res.body && res.body.match(/^</)){
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
