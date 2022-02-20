// build requirements
import fs from 'fs-extra';
import pkg from '../package.json';
import modulesCleanup from 'removeNPMAbsolutePaths';
import { exec } from 'pkg';
import { execSync } from 'child_process';
import path from 'path';

const buildsDir = './_builds';
const nodeVer = 'node16-';

type BuildTypes = `${'ubuntu'|'windows'|'macos'}64`

(async () => {
  const buildType = process.argv[2] as BuildTypes;
  const isGUI = process.argv[3] === 'true';

  if (isGUI) {
    buildGUI(buildType);
  } else {
    buildBinary(buildType);
  }
})();

async function buildGUI(buildType: BuildTypes) {
  execSync(`npx electron-builder build ${getCommand(buildType)}`, { stdio: [0,1,2] });
  execSync(`7z a -t7z "../${buildsDir}/multi-downloader-nx-${buildType}-gui.7z" "${getOutputFileName(buildType)}"`,{
    stdio:[0,1,2],
    cwd: path.join('dist')
  });
}

function getCommand(buildType: BuildTypes) {
  switch (buildType) {
    case 'ubuntu64':
      return `--linux --arm64`
    case 'windows64':
      return '--win';
    case 'macos64':
      return '--mac';
    default:
      return '--error'
  }
}

function getOutputFileName(buildType: BuildTypes) {
  switch (buildType) {
    case 'ubuntu64':
      return `${pkg.name}_${pkg.version}_arm64.deb`;
    case 'windows64':
      return `${pkg.name} Setup ${pkg.version}.exe`;
    case 'macos64':
      return '';
    default:
      throw new Error(`Unknown build type ${buildType}`);
  }
}

// main
async function buildBinary(buildType: BuildTypes) {
  const buildStr = `multi-downloader-nx`;
  const acceptableBuilds = ['windows64','ubuntu64','macos64'];
  if(!acceptableBuilds.includes(buildType)){
    console.error('[ERROR] unknown build type!');
    process.exit(1);
  }
  await modulesCleanup('.');
  if(!fs.existsSync(buildsDir)){
    fs.mkdirSync(buildsDir);
  }
  const buildFull = `${buildStr}-${buildType}-cli`;
  const buildDir = `${buildsDir}/${buildFull}`;
  if(fs.existsSync(buildDir)){
    fs.removeSync(buildDir);
  }
  fs.mkdirSync(buildDir);
  const buildConfig = [
    pkg.main,
    '--target', nodeVer + getTarget(buildType),
    '--output', `${buildDir}/${pkg.short_name}`,
  ];
  console.log(`[Build] Build configuration: ${buildFull}`);
  try {
    await exec(buildConfig);
  }
  catch(e){
    console.log(e);
    process.exit(1);
  }
  fs.mkdirSync(`${buildDir}/config`);
  fs.mkdirSync(`${buildDir}/videos`);
  fs.copySync('./config/bin-path.yml', `${buildDir}/config/bin-path.yml`);
  fs.copySync('./config/cli-defaults.yml', `${buildDir}/config/cli-defaults.yml`);
  fs.copySync('./config/dir-path.yml', `${buildDir}/config/dir-path.yml`);
  fs.copySync('./modules/cmd-here.bat', `${buildDir}/cmd-here.bat`);
  fs.copySync('./modules/NotoSans-Regular.ttf', `${buildDir}/NotoSans-Regular.ttf`);
  fs.copySync('./package.json', `${buildDir}/package.json`);
  fs.copySync('./docs/', `${buildDir}/docs/`);
  fs.copySync('./LICENSE.md', `${buildDir}/docs/LICENSE.md`);
  if(fs.existsSync(`${buildsDir}/${buildFull}.7z`)){
    fs.removeSync(`${buildsDir}/${buildFull}.7z`);
  }
  execSync(`7z a -t7z "${buildsDir}/${buildFull}.7z" "${buildDir}"`,{stdio:[0,1,2]});
};

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
