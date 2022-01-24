import { appArgv, overrideArguments, showHelp } from './modules/module.app-args';
import * as yamlCfg from './modules/module.cfg-loader';
import { makeCommand, addToArchive } from './modules/module.downloadArchive';

import update from './modules/module.updater';

(async () => {
  const cfg = yamlCfg.loadCfg();

  const argv = appArgv(cfg.cli);

  await update(argv.update);

  if (argv.all && argv.but) {
    console.log('[ERROR] --all and --but exclude each other!');
    return;
  }

  if (argv.addArchive) {
    if (argv.service === 'funi') {
      if (argv.s === undefined)
        return console.log('[ERROR] `-s` not found');
      addToArchive({
        service: 'funi',
        type: 's'
      }, argv.s);
      console.log('[INFO] Added %s to the downloadArchive list', argv.s);
    } else if (argv.service === 'crunchy') {
      if (argv.s === undefined && argv.series === undefined)
        return console.log('[ERROR] `-s` or `--srz` not found');
      if (argv.s && argv.series)
        return console.log('[ERROR] Both `-s` and `--srz` found');
      addToArchive({
        service: 'crunchy',
        type: argv.s === undefined ? 'srz' : 's'
      }, (argv.s === undefined ? argv.series : argv.s) as string);
      console.log('[INFO] Added %s to the downloadArchive list', (argv.s === undefined ? argv.series : argv.s));
    }
  } else if (argv.downloadArchive) {
    const ids = makeCommand(argv.service);
    for (const id of ids) {
      overrideArguments(cfg.cli, id);
      /* Reimport module to override appArgv */
      Object.keys(require.cache).forEach(key => {
        if (key.endsWith('crunchy.js') || key.endsWith('funi.js'))
          delete require.cache[key];
      });
      await (argv.service === 'funi' ? (new (await import('./funi')).default()) : (await import('./crunchy')).default());
    }
  } else {
    if (argv.service === 'funi') {
      const funi = new (await import('./funi')).default();
      await funi.cli();
    } else if (argv.service === 'crunchy') {
      (await import('./crunchy')).default();
    } else {
      showHelp();
    }
  }
})();