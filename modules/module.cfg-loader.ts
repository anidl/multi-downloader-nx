import path from 'path';
import yaml from 'yaml';
import fs from 'fs-extra';
import { lookpath } from 'lookpath';

// new-cfg
const workingDir = (process as NodeJS.Process & {
  pkg?: unknown
}).pkg ? path.dirname(process.execPath) : path.join(__dirname, '/..');
const binCfgFile = path.join(workingDir, 'config', 'bin-path');
const dirCfgFile = path.join(workingDir, 'config', 'dir-path');
const cliCfgFile = path.join(workingDir, 'config', 'cli-defaults');
const tokenFile  = path.join(workingDir, 'config', 'token');

const loadYamlCfgFile = <T extends Record<string, any>>(file: string, isSess?: boolean): T => {
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
      return {} as T;
    }
  }
  return {} as T;
};

export type ConfigObject = {
  dir: {
    content: string,
    trash: string,
    fonts: string; 
  },
  bin: {
    ffmpeg?: string,
    mkvmerge?: string  
  },
  cli: {
    [key: string]: any
  }
}

const loadCfg = () : ConfigObject => {
  // load cfgs
  const defaultCfg: ConfigObject = {
    bin: {},
    dir: loadYamlCfgFile<{
          content: string,
          trash: string,
          fonts: string
        }>(dirCfgFile),
    cli: loadYamlCfgFile<{
          [key: string]: any
        }>(cliCfgFile),
  };
  const defaultDirs = {
    fonts: '${wdir}/fonts/',
    content: '${wdir}/videos/',
    trash: '${wdir}/videos/_trash/',
  };
  if (typeof defaultCfg.dir !== 'object' || defaultCfg.dir === null || Array.isArray(defaultCfg.dir)) {
    defaultCfg.dir = defaultDirs;
  }

  const keys = Object.keys(defaultDirs) as (keyof typeof defaultDirs)[];
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(defaultCfg.dir, key) || typeof defaultCfg.dir[key] !== 'string') {
      defaultCfg.dir[key] = defaultDirs[key];
    }
    if (!path.isAbsolute(defaultCfg.dir[key])) {
      defaultCfg.dir[key] = path.join(workingDir, defaultCfg.dir[key].replace(/^\${wdir}/, ''));
    }
  }

  if(!fs.existsSync(defaultCfg.dir.content)){
    try{
      fs.ensureDirSync(defaultCfg.dir.content);
    }
    catch(e){
      console.log('[ERROR] Content directory not accessible!');
      return defaultCfg;
    }
  }
  if(!fs.existsSync(defaultCfg.dir.trash)){
    defaultCfg.dir.trash = defaultCfg.dir.content;
  }
  // output
  return defaultCfg;
};

const loadBinCfg = async () => {
  const binCfg = loadYamlCfgFile<ConfigObject['bin']>(binCfgFile);
  // binaries
  const defaultBin = {
    ffmpeg: '${wdir}/bin/ffmpeg/ffmpeg',
    mkvmerge: '${wdir}/bin/mkvtoolnix/mkvmerge',
  };
  const keys = Object.keys(defaultBin) as (keyof typeof defaultBin)[];
  for(const dir of keys){
    if(!Object.prototype.hasOwnProperty.call(binCfg, dir) || typeof binCfg[dir] != 'string'){
      binCfg[dir] = defaultBin[dir];
    }
    if (!path.isAbsolute(binCfg[dir] as string) && (binCfg[dir] as string).match(/^\${wdir}/)){
      binCfg[dir] = (binCfg[dir] as string).replace(/^\${wdir}/, '');
      binCfg[dir] = path.join(workingDir, binCfg[dir] as string);
    }
    binCfg[dir] = await lookpath(binCfg[dir] as string);
    binCfg[dir] = binCfg[dir] ? binCfg[dir] : undefined;
    if(!binCfg[dir]){
      const binFile = await lookpath(path.basename(defaultBin[dir]));
      binCfg[dir] = binFile ? binFile : binCfg[dir];
    }
  }
  return binCfg;
};

const loadFuniToken = () => {
  const loadedToken = loadYamlCfgFile<{
      token?: string
    }>(tokenFile, true);
  let token: false|string = false;
  if (loadedToken && loadedToken.token)
    token = loadedToken.token;
    // info if token not set
  if(!token){
    console.log('[INFO] Token not set!\n');
  }
  return token;
};

const saveFuniToken = (data: {
  token?: string
}) => {
  const cfgFolder = path.dirname(tokenFile);
  try{
    fs.ensureDirSync(cfgFolder);
    fs.writeFileSync(`${tokenFile}.yml`, yaml.stringify(data));
  }
  catch(e){
    console.log('[ERROR] Can\'t save token file to disk!');
  }
};

export { loadBinCfg, loadCfg, loadFuniToken, saveFuniToken };