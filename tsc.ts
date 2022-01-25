import { ChildProcess, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { removeSync, copyFileSync } from 'fs-extra';

const ignore = [
  '*SEP\\.git*',
  '*SEPlib*',
  '*SEPnode_modules*',
  '*SEP@types*',
  '*SEPout*',
  '*SEPbinSEPmkvtoolnix*',
  '*SEPtoken.yml$',
  '*SEPupdates.json$',
  '*SEPcr_token.yml$',
  '*SEPfuni_token.yml$',
  '*SEP\\.eslint*',
  '*SEP*\\.tsx?$',
  'SEP*fonts',
  'SEPreact*',
].map(a => a.replace(/\*/g, '[^]*').replace(/SEP/g, path.sep === '\\' ? '\\\\' : '/')).map(a => new RegExp(a, 'i'));

export { ignore };

(async () => {

  const waitForProcess = async (proc: ChildProcess) => {
    return new Promise((resolve, reject) => {
      proc.stdout?.on('data', console.log);
      proc.stderr?.on('data', console.error);
      proc.on('close', resolve);
      proc.on('error', reject);
    })
  }

  process.stdout.write('Removing lib dir... ');
  removeSync('lib');
  process.stdout.write('✓\nRunning tsc... ');
  const tsc = exec('npx tsc');

  await waitForProcess(tsc);

  process.stdout.write('✓\nBuilding react... ');
  const react = exec('npm run build', {
    cwd: path.join(__dirname, 'gui', 'react'),
  });

  await waitForProcess(react);

  copyDir(path.join(__dirname, 'gui', 'react', 'build'), path.join(__dirname, 'lib', 'gui', 'electron', 'build'));

  process.stdout.write('✓\nCopying files... ');
  const files = readDir(__dirname);
  files.forEach(item => {
    const itemPath = path.join(__dirname, 'lib', item.path.replace(__dirname, ''));
    if (item.stats.isDirectory()) {
      if (!fs.existsSync(itemPath))
        fs.mkdirSync(itemPath);
    } else {
      copyFileSync(item.path, itemPath);
    }
  });
  process.stdout.write('✓\n');
})();

function readDir (dir: string): {
  path: string,
  stats: fs.Stats
}[] {
  const items: {
    path: string,
    stats: fs.Stats
  }[] = [];
  const content = fs.readdirSync(dir);
  itemLoop: for (const item of content) {
    const itemPath = path.join(dir, item);
    for (const ignoreItem of ignore) {
      if (ignoreItem.test(itemPath))
        continue itemLoop;      
    }
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

async function copyDir(src: string, dest: string) {
  await fs.promises.mkdir(dest, { recursive: true });
  let entries = await fs.promises.readdir(src, { withFileTypes: true });

  for (let entry of entries) {
      let srcPath = path.join(src, entry.name);
      let destPath = path.join(dest, entry.name);

      entry.isDirectory() ?
          await copyDir(srcPath, destPath) :
          await fs.promises.copyFile(srcPath, destPath);
  }
}