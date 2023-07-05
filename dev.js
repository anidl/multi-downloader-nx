const { exec } = require('child_process');
const path = require('path');
const toRun = process.argv.slice(2).join(' ').split('---');

const waitForProcess = async (proc) => {
  return new Promise((resolve, reject) => {
    proc.stdout?.on('data', (data) => process.stdout.write(data));
    proc.stderr?.on('data', (data) => process.stderr.write(data));
    proc.on('close', resolve);
    proc.on('error', reject);
  });
};

(async () => {
  await waitForProcess(exec('pnpm run tsc test false'));
  for (let command of toRun) {
    await waitForProcess(exec(`node index.js --service hidive ${command}`, {
      cwd: path.join(__dirname, 'lib')
    }));
  }
})();