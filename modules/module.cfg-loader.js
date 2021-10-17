const path = require('path');
const yaml = require('yaml');
const fs = require('fs-extra');
const { lookpath } = require('lookpath');

// new-cfg
const workingDir = process.pkg ? path.dirname(process.execPath) : path.join(__dirname, '/..');
const binCfgFile = path.join(workingDir, 'config', 'bin-path');
const dirCfgFile = path.join(workingDir, 'config', 'dir-path');
const cliCfgFile = path.join(workingDir, 'config', 'cli-defaults');
const tokenFile  = path.join(workingDir, 'config', 'token');

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

const loadCfg = () => {
    // load cfgs
    const cfg = {
        bin: '',
        dir: loadYamlCfgFile(dirCfgFile),
        cli: loadYamlCfgFile(cliCfgFile),
    };
    // check each cfg object
    for(const ctype of Object.keys(cfg)){
        if(typeof cfg[ctype] !== 'object' || cfg[ctype] === null || Array.isArray(cfg[ctype])){
            cfg[ctype] = {};
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

const loadBinCfg = async () => {
    let binCfg = loadYamlCfgFile(binCfgFile);
    // binaries
    const defaultBin = {
        ffmpeg: '${wdir}/bin/ffmpeg/ffmpeg',
        mkvmerge: '${wdir}/bin/mkvtoolnix/mkvmerge',
    };
    for(const dir of Object.keys(defaultBin)){
        if(!Object.prototype.hasOwnProperty.call(binCfg, dir) || typeof binCfg[dir] != 'string'){
            binCfg[dir] = defaultBin[dir];
        }
        if (!path.isAbsolute(binCfg[dir]) && binCfg[dir].match(/^\${wdir}/)){
            binCfg[dir] = binCfg[dir].replace(/^\${wdir}/, '');
            binCfg[dir] = path.join(workingDir, binCfg[dir]);
        }
        binCfg[dir] = await lookpath(binCfg[dir]);
        binCfg[dir] = binCfg[dir] ? binCfg[dir] : false;
        if(!binCfg[dir]){
            const binFile = await lookpath(path.basename(defaultBin[dir]));
            binCfg[dir] = binFile ? binFile : binCfg[dir];
        }
    }
    return binCfg;
};

const loadFuniToken = () => {
    let token = loadYamlCfgFile(tokenFile, true);
    if (token === null) token = false;
    else if (token.token === null) token = false;
    else token = token.token;
    // info if token not set
    if(!token){
        console.log('[INFO] Token not set!\n');
    }
    return token;
};

const saveFuniToken = (data) => {
    const cfgFolder = path.dirname(tokenFile);
    try{
        fs.ensureDirSync(cfgFolder);
        fs.writeFileSync(`${tokenFile}.yml`, yaml.stringify(data));
    }
    catch(e){
        console.log('[ERROR] Can\'t save token file to disk!');
    }
};

module.exports = {
    loadCfg,
    loadBinCfg,
    loadFuniToken,
    saveFuniToken,
};
