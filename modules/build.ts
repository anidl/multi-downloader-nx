// build requirements
import fs from 'fs-extra';
import pkg from '../package.json';
import modulesCleanup from 'removeNPMAbsolutePaths';
import { exec } from '@yao-pkg/pkg';
import { execSync } from 'child_process';
import { console } from './log';

const buildsDir = './_builds';
const nodeVer = 'node18-';

type BuildTypes = `${'windows'|'macos'|'linux'|'linuxstatic'|'alpine'}-${'x64'|'arm64'}`|'linuxstatic-armv7'

(async () => {
  const buildType = process.argv[2] as BuildTypes;
  const isGUI = process.argv[3] === 'true';

  buildBinary(buildType, isGUI);
})();

// main
async function buildBinary(buildType: BuildTypes, gui: boolean) {
  const buildStr = 'multi-downloader-nx';
  const acceptablePlatforms = ['windows','linux','linuxstatic','macos','alpine'];
  const acceptableArchs = ['x64','arm64'];
  const acceptableBuilds: string[] = ['linuxstatic-armv7'];
  for (const platform of acceptablePlatforms) {
    for (const arch of acceptableArchs) {
      acceptableBuilds.push(platform+'-'+arch);
    }
  }
  if(!acceptableBuilds.includes(buildType)){
    console.error('Unknown build type!');
    process.exit(1);
  }
  await modulesCleanup('.');
  if(!fs.existsSync(buildsDir)){
    fs.mkdirSync(buildsDir);
  }
  const buildFull = `${buildStr}-${getFriendlyName(buildType)}-${gui ? 'gui' : 'cli'}`;
  const buildDir = `${buildsDir}/${buildFull}`;
  if(fs.existsSync(buildDir)){
    fs.removeSync(buildDir);
  }
  fs.mkdirSync(buildDir);
  const buildConfig = [
    gui ? 'gui.js' : 'index.js',
    '--target', nodeVer + buildType,
    '--output', `${buildDir}/${pkg.short_name}`,
    '--compress', 'GZip'
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
  fs.mkdirSync(`${buildDir}/widevine`);
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

function getFriendlyName(buildString: string): string {
  if (buildString.includes('armv7')) {
    return 'android';
  }
  if (buildString.includes('linuxstatic')) {
    buildString = buildString.replace('linuxstatic', 'linux');
  }
  return buildString;
}