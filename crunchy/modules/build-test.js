#!/usr/bin/env node

// build requirements
const pkg = require('../package.json');
const fs = require('fs-extra');
const { exec } = require('pkg');
const { lookpath } = require('lookpath');

const buildsDir = './_builds';
const curNodeVer = 'node16-';

// main
(async function (){
  doBuild();
})();

// do build
async function doBuild(nodeVer){
  const buildStr = `${pkg.name}-${pkg.version}`;
  nodeVer = nodeVer ? nodeVer : '';
  const acceptableBuilds = ['win64','linux64','macos64'];
  const buildType = process.argv[2];
  if(!acceptableBuilds.includes(buildType)){
    console.error('[ERROR] unknown build type!');
    process.exit(1);
  }
  if(!fs.existsSync(buildsDir)){
    fs.mkdirSync(buildsDir);
  }
  const buildFull = `${buildStr}-${buildType}`;
  const buildDir = `${buildsDir}`;
    
  const buildConfig = [ 
    pkg.main, 
    '--target', nodeVer + getTarget(buildType),
    '--output', `${buildDir}/${pkg.short_name}`,
  ];
  const buildConfigBeta = [ 
    `${pkg.short_name}-beta.js`, 
    '--target', nodeVer + getTarget(buildType),
    '--output', `${buildDir}/${pkg.short_name}-beta`,
  ];
  console.log(`[Build] Build configuration: ${buildFull}`);
  try {
    const targetCrClassic = await lookpath(`${buildDir}/${pkg.short_name}`);
    const targetCrBeta = await lookpath(`${buildDir}/${pkg.short_name}-beta`);
    if(!fs.existsSync(targetCrClassic)){
      fs.removeSync(targetCrClassic);
    }
    if(!fs.existsSync(targetCrBeta)){
      fs.removeSync(targetCrBeta);
    }
    await exec(buildConfig);
    await exec(buildConfigBeta);
  }
  catch(e){
    console.log(e);
    if(nodeVer == ''){
      await doBuild(curNodeVer);
    }
    process.exit(1);
  }
  console.log('[LOG] Build ready:', buildFull);
}

function getTarget(bt){
  switch(bt){
  case 'win64':
    return 'windows-x64';
  case 'linux64':
    return 'linux-x64';
  case 'macos64':
    return 'macos-x64';
  default:
    return 'windows-x64';
  }
}
