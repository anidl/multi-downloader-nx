const { exec } = require('child_process')
const path = require('path');
const toRun = process.argv.slice(2).join(" ").split('---');

const waitForProcess = async (proc) => {
  return new Promise((resolve, reject) => {
    proc.stdout?.on('data', console.log);
    proc.stderr?.on('data', console.error);
    proc.on('close', resolve);
    proc.on('error', reject);
  });
};

(async () => {
  await waitForProcess(exec('npm run tsc test false'));
  for (let command of toRun) {
    await waitForProcess(exec(`node index.js ${command}`, {
      cwd: path.join(__dirname, 'lib')
    }))
  }
})();