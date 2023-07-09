// build requirements
import fs from 'fs-extra';
import pkg from '../package.json';
import modulesCleanup from 'removeNPMAbsolutePaths';
import { exec } from 'pkg';
import { execSync } from 'child_process';
import { console } from './log';

const buildsDir = './_builds';
const nodeVer = 'node18-';

type BuildTypes = `${'ubuntu'|'windows'|'macos'|'arm'}64`

(async () => {
  const buildType = process.argv[2] as BuildTypes;
  const isGUI = process.argv[3] === 'true';

  buildBinary(buildType, isGUI);
})();

// main
async function buildBinary(buildType: BuildTypes, gui: boolean) {
  const buildStr = 'multi-downloader-nx';
  const acceptableBuilds = ['windows64','ubuntu64','macos64'];
  if(!acceptableBuilds.includes(buildType)){
    console.error('[ERROR] unknown build type!');
    process.exit(1);
  }
  await modulesCleanup('.');
  if(!fs.existsSync(buildsDir)){
    fs.mkdirSync(buildsDir);
  }
  const buildFull = `${buildStr}-${buildType}-${gui ? 'gui' : 'cli'}`;
  const buildDir = `${buildsDir}/${buildFull}`;
  if(fs.existsSync(buildDir)){
    fs.removeSync(buildDir);
  }
  fs.mkdirSync(buildDir);
  const buildConfig = [
    gui ? 'gui.js' : 'index.js',
    '--target', nodeVer + getTarget(buildType),
    '--output', `${buildDir}/${pkg.short_name}`,
  ];
  console.info(`[Build] Build configuration: ${buildFull}`);
  try {
    await exec(buildConfig);
  }
  catch(e){
    console.info(e);
    process.exit(1);
  }
  fs.mkdirSync(`${buildDir}/config`);
  fs.mkdirSync(`${buildDir}/videos`);
  fs.copySync('./config/bin-path.yml', `${buildDir}/config/bin-path.yml`);
  fs.copySync('./config/cli-defaults.yml', `${buildDir}/config/cli-defaults.yml`);
  fs.copySync('./config/dir-path.yml', `${buildDir}/config/dir-path.yml`);
  fs.copySync('./config/gui.yml', `${buildDir}/config/gui.yml`);
  fs.copySync('./modules/cmd-here.bat', `${buildDir}/cmd-here.bat`);
  fs.copySync('./modules/NotoSans-Regular.ttf', `${buildDir}/NotoSans-Regular.ttf`);
  fs.copySync('./package.json', `${buildDir}/package.json`);
  fs.copySync('./docs/', `${buildDir}/docs/`);
  fs.copySync('./LICENSE.md', `${buildDir}/docs/LICENSE.md`);
  if (gui) {
    fs.copySync('./gui', `${buildDir}/gui`);
    fs.copySync('./node_modules/open/xdg-open', `${buildDir}/xdg-open`);
  }
  if(fs.existsSync(`${buildsDir}/${buildFull}.7z`)){
    fs.removeSync(`${buildsDir}/${buildFull}.7z`);
  }
  execSync(`7z a -t7z "${buildsDir}/${buildFull}.7z" "${buildDir}"`,{stdio:[0,1,2]});
}

function getTarget(bt: string) : string {
  switch(bt){
  case 'windows64':
    return 'windows-x64';
  case 'ubuntu64':
    return 'linux-x64';
  case 'macos64':
    return 'macos-x64';
  default:
    return 'windows-x64';
  }
}
