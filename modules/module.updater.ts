import got from "got";
import fs from "fs";
import { GithubTag, TagCompare } from "../@types/github";
import path from "path";
import { UpdateFile } from "../@types/updateFile";
import packageJson from '../package.json';
const updateFilePlace = path.join(__dirname, '..', 'config', 'updates.json');

const updateIgnore = [
  '*.json',
  '*.d.ts',
  '.git',
  'lib',
  'node_modules',
  '@types',
  path.join('bin', 'mkvtoolnix'),
  path.join('config', 'token.yml'),
  '.eslint',
  'tsconfig.json',
  'updates.json'
];

(async (force = false) => {
  let updateFile: UpdateFile|undefined;
  if (fs.existsSync(updateFilePlace)) {
    updateFile = JSON.parse(fs.readFileSync(updateFilePlace).toString()) as UpdateFile;
    if (new Date() < new Date(updateFile.nextCheck) && !force) {
      return;
    }
  }
  console.log('Checking for updates...')
  const tagRequest = await got('https://api.github.com/repos/anidl/multi-downloader-nx/tags')
  const tags = JSON.parse(tagRequest.body) as GithubTag[];

  if (tags.length > 0) {
    const newer = tags.filter(a => {
      return a.name > packageJson.version;
    })
    console.log(`Found ${tags.length} release tags and ${newer.length} that are new.`)
  
    if (newer.length < 1) {
      console.log('[INFO] No new tags found')
      return done();
    }
    const newest = newer.sort((a, b) => a.name < b.name ? 1 : a.name > b.name ? -1 : 0)[0];
    //TODO REMOVE
    newest.name = 'auto-updates'
    const compareRequest = await got(`https://api.github.com/repos/anidl/multi-downloader-nx/compare/${packageJson.version}...${newest.name}`)

    const compareJSON = JSON.parse(compareRequest.body) as TagCompare;

    console.log(`You are behind by ${compareJSON.behind_by} releases!`)
    const changedFiles = compareJSON.files.filter(a => {
      return !updateIgnore.some(filter => {
        if (filter.startsWith('*')) {
          return a.filename.endsWith(filter.slice(1))
        } else if (fs.statSync(filter).isDirectory()) {
          return a.filename.startsWith(filter);
        } else {
          return a.filename.split('/').pop() === filter;
        }
      })
    })
    if (changedFiles.length < 1) {
      console.log('[INFO] No file changes found... updating package.json. If you thing this is an error please get the newst version yourself.')
      return done(newest.name);
    }
    console.log(`Found file changes: \n${changedFiles.map(a => `  [
      ${a.status === 'modified' ? '*' : a.status === 'added' ? '+' : '-'}
    ] ${a.filename}`).join('\n')}`)

  } 
})(true)

function done(newVersion?: string) {
  const next = new Date(Date.now() + 1000 * 60 * 60 * 24);
  fs.writeFileSync(updateFilePlace, JSON.stringify({
    lastCheck: Date.now(),
    nextCheck: next.getTime()
  } as UpdateFile, null, 2))
  if (newVersion) {
    fs.writeFileSync('../package.json', JSON.stringify({
      ...packageJson,
      version: newVersion
    }, null, 4))
  }
  console.log('[INFO] Searching for update finished. Next time running on the ' + next.toLocaleDateString() + ' at ' + next.toLocaleTimeString() + '.')
}