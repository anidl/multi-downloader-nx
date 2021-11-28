import got from 'got';
import fs from 'fs';
import { GithubTag, TagCompare } from '../@types/github';
import path from 'path';
import { UpdateFile } from '../@types/updateFile';
import packageJson from '../package.json';
import { CompilerOptions, transpileModule } from 'typescript';
import tsConfig from '../tsconfig.json';
import fsextra from 'fs-extra';
const workingDir = (process as NodeJS.Process & {
  pkg?: unknown
}).pkg ? path.dirname(process.execPath) : path.join(__dirname, '/..');
const updateFilePlace = path.join(workingDir, 'config', 'updates.json');

const updateIgnore = [
  '*.d.ts',
  '.git',
  'lib',
  'node_modules',
  '@types',
  path.join('bin', 'mkvtoolnix'),
  path.join('config', 'token.yml'),
  '.eslint',
  'tsconfig.json',
  'updates.json',
  'tsc.ts'
];

enum ApplyType {
  DELETE, ADD, UPDATE
} 

export type ApplyItem = {
  type: ApplyType,
  path: string,
  content: string
}

export default (async (force = false) => {
  const isPackaged = (process as NodeJS.Process & {
    pkg?: unknown
  }).pkg ? true : false;
  if (isPackaged) {
    return;
  }
  let updateFile: UpdateFile|undefined;
  if (fs.existsSync(updateFilePlace)) {
    updateFile = JSON.parse(fs.readFileSync(updateFilePlace).toString()) as UpdateFile;
    if (new Date() < new Date(updateFile.nextCheck) && !force) {
      return;
    }
  }
  console.log('Checking for updates...');
  const tagRequest = await got('https://api.github.com/repos/anidl/multi-downloader-nx/tags');
  const tags = JSON.parse(tagRequest.body) as GithubTag[];

  if (tags.length > 0) {
    const newer = tags.filter(a => {
      return a.name > packageJson.version;
    });
    console.log(`Found ${tags.length} release tags and ${newer.length} that are new.`);
  
    if (newer.length < 1) {
      console.log('[INFO] No new tags found');
      return done();
    }
    const newest = newer.sort((a, b) => a.name < b.name ? 1 : a.name > b.name ? -1 : 0)[0];
    const compareRequest = await got(`https://api.github.com/repos/anidl/multi-downloader-nx/compare/${packageJson.version}...${newest.name}`);

    const compareJSON = JSON.parse(compareRequest.body) as TagCompare;

    console.log(`You are behind by ${compareJSON.ahead_by} releases!`);
    const changedFiles = compareJSON.files.map(a => ({
      ...a,
      filename: path.join(...a.filename.split('/'))
    })).filter(a => {
      return !updateIgnore.some(_filter => {
        const filter = path.join('..', _filter);
        if (_filter.startsWith('*')) {
          return a.filename.endsWith(_filter.slice(1));
        } else if (filter.split(path.sep).pop()?.indexOf('.') === -1) {
          return a.filename.startsWith(filter);
        } else {
          return a.filename.split(path.sep).pop() === _filter;
        }
      });
    });
    if (changedFiles.length < 1) {
      console.log('[INFO] No file changes found... updating package.json. If you thing this is an error please get the newst version yourself.');
      return done(newest.name);
    }
    console.log(`Found file changes: \n${changedFiles.map(a => `  [${
      a.status === 'modified' ? '*' : a.status === 'added' ? '+' : '-'
    }] ${a.filename}`).join('\n')}`);

    const changesToApply = await Promise.all(changedFiles.map(async (a): Promise<ApplyItem> => {
      if (a.filename.endsWith('.ts')) {
        return {
          path: a.filename.slice(0, -2) + 'js',
          content: transpileModule((await got(a.raw_url)).body, {
            compilerOptions: tsConfig.compilerOptions as unknown as CompilerOptions
          }).outputText,
          type: a.status === 'modified' ? ApplyType.UPDATE : a.status === 'added' ? ApplyType.ADD : ApplyType.DELETE
        }; 
      } else {
        return {
          path: a.filename,
          content: (await got(a.raw_url)).body,
          type: a.status === 'modified' ? ApplyType.UPDATE : a.status === 'added' ? ApplyType.ADD : ApplyType.DELETE
        };
      }
    }));

    changesToApply.forEach(a => {
      fsextra.ensureDirSync(path.dirname(a.path));
      fs.writeFileSync(path.join(__dirname, '..', a.path), a.content);
      console.log('✓ %s', a.path);
    });

    console.log('[INFO] Done');
    return done();
  } 
});

function done(newVersion?: string) {
  const next = new Date(Date.now() + 1000 * 60 * 60 * 24);
  fs.writeFileSync(updateFilePlace, JSON.stringify({
    lastCheck: Date.now(),
    nextCheck: next.getTime()
  } as UpdateFile, null, 2));
  if (newVersion) {
    fs.writeFileSync('../package.json', JSON.stringify({
      ...packageJson,
      version: newVersion
    }, null, 4));
  }
  console.log('[INFO] Searching for update finished. Next time running on the ' + next.toLocaleDateString() + ' at ' + next.toLocaleTimeString() + '.');
}