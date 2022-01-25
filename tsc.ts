import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { removeSync, copyFileSync } from 'fs-extra';

const ignore = [
  '.git',
  'lib',
  'node_modules',
  '@types',
  path.join('gui', 'react', 'node_modules'),
  path.join('bin', 'mkvtoolnix'),
  path.join('config', 'token.yml'),
  path.join('config', 'updates.json'),
  path.join('config', 'cr_token.yml'),
  path.join('config', 'funi_token.yml'),
  '.eslint',
].map(a => path.join(__dirname, a));

export { ignore };

(async () => {
  process.stdout.write('Removing lib dir... ');
  removeSync('lib');
  process.stdout.write('✓\nRunning tsc... ');
  const tsc = exec('npx tsc');
  tsc.stdout?.on('data', console.log);
  tsc.stderr?.on('data', console.log);

  tsc.on('close', () => {
    process.stdout.write('✓\nCopying files... ');
    const files = readDir(__dirname);
    const filtered = files.filter(a => {
      if (a.stats.isFile()) {
        return a.path.split('.').pop() !== 'ts';
      } else {
        return true;
      }
    });
    filtered.forEach(item => {
      const itemPath = path.join(__dirname, 'lib', item.path.replace(__dirname, ''));
      if (item.stats.isDirectory()) {
        if (!fs.existsSync(itemPath))
          fs.mkdirSync(itemPath);
      } else {
        copyFileSync(item.path, itemPath);
      }
    });
    process.stdout.write('✓\n');
  });
})();

const readDir = (dir: string) : {
  path: string,
  stats: fs.Stats
}[] => {
  const items: {
    path: string,
    stats: fs.Stats
  }[] = [];
  const content = fs.readdirSync(dir);
  for (const item of content) {
    const itemPath = path.join(dir, item);
    if (ignore.some(a => itemPath.startsWith(a)))
      continue;
    const stats = fs.statSync(itemPath);
    items.push({
      path: itemPath,
      stats
    });
    if (stats.isDirectory()) { 
      items.push(...readDir(itemPath));
    }
  }
  return items;
};