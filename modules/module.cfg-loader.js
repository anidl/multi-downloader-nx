const path = require('path');
const yaml = require('yaml');
const fs = require('fs-extra');

const loadYamlCfgFile = (file, isSess) => {
    if(fs.existsSync(`${file}.user.yml`) && !isSess){
        file += '.user';
    }
    file += '.yml';
    if(fs.existsSync(file)){
        try{
            return yaml.parse(fs.readFileSync(file, 'utf8'));
        }
        catch(e){
            console.log('[ERROR]', e);
            return {};
        }
    }
    return {};
};

const loadCfg = (workingDir, binCfgFile, dirCfgFile, cliCfgFile) => {
    // load cfgs
    const cfg = {
        bin: loadYamlCfgFile(binCfgFile),
        dir: loadYamlCfgFile(dirCfgFile),
        cli: loadYamlCfgFile(cliCfgFile),
    };
    // check each cfg object
    for(const ctype of Object.keys(cfg)){
        if(typeof cfg[ctype] !== 'object' || cfg[ctype] === null || Array.isArray(cfg[ctype])){
            cfg[ctype] = {};
        }
    }
    // binaries
    const defaultBin = {
        ffmpeg: '${wdir}/bin/ffmpeg/ffmpeg',
        mkvmerge: '${wdir}/bin/mkvtoolnix/mkvmerge',
    };
    for(const dir of ['ffmpeg', 'mkvmerge']){
        if(!Object.prototype.hasOwnProperty.call(cfg.bin, dir) || typeof cfg.bin[dir] != 'string'){
            cfg.bin[dir] = defaultBin[dir];
        }
        if (!path.isAbsolute(cfg.bin[dir]) && cfg.bin[dir].match(/^\${wdir}/)){
            cfg.bin[dir] = cfg.bin[dir].replace(/^\${wdir}/, '');
            cfg.bin[dir] = path.join(workingDir, cfg.bin[dir]);
        }
    }
    // set defaults for dirs
    const defaultDirs = {
        fonts: '${wdir}/fonts/',
        content: '${wdir}/videos/',
        trash: '${wdir}/videos/_trash/',
    };
    for(const dir of Object.keys(defaultDirs)){
        if(!Object.prototype.hasOwnProperty.call(cfg.dir, dir) || typeof cfg.dir[dir] != 'string'){
            cfg.dir[dir] = defaultDirs[dir];
        }
        if (!path.isAbsolute(cfg.dir[dir])){
            if(cfg.dir[dir].match(/^\${wdir}/)){
                cfg.dir[dir] = cfg.dir[dir].replace(/^\${wdir}/, '');
            }
            cfg.dir[dir] = path.join(workingDir, cfg.dir[dir]);
        }
    }
    if(!fs.existsSync(cfg.dir.content)){
        try{
            fs.ensureDirSync(cfg.dir.content);
        }
        catch(e){
            console.log('[ERROR] Content directory not accessible!');
            return;
        }
    }
    if(!fs.existsSync(cfg.dir.trash)){
        cfg.dir.trash = cfg.dir.content;
    }
    // output
    return cfg;
};

const loadFuniToken = (tokenCfgFile) => {
    let token = loadYamlCfgFile(tokenCfgFile, true);
    if (token === null) token = false;
    else if (token.token === null) token = false;
    else token = token.token;
    // info if token not set
    if(!token){
        console.log('[INFO] Token not set!\n');
    }
    return token;
};

const saveFuniToken = (tokenCfgFile, data) => {
    const cfgFolder = path.dirname(tokenCfgFile);
    try{
        fs.ensureDirSync(cfgFolder);
        fs.writeFileSync(`${tokenCfgFile}.yml`, yaml.stringify(data));
    }
    catch(e){
        console.log('[ERROR] Can\'t save token file to disk!');
    }
};

module.exports = {
    loadCfg,
    loadFuniToken,
    saveFuniToken,
};
