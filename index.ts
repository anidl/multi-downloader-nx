import { console } from './modules/log';
import { ServiceClass } from './@types/serviceClassInterface';
import { appArgv, overrideArguments } from './modules/module.app-args';
import * as yamlCfg from './modules/module.cfg-loader';
import { makeCommand, addToArchive } from './modules/module.downloadArchive';
import update from './modules/module.updater';

// early read of -o/--output (before loadCfg)
(() => {
  const argv = process.argv;
  const i = argv.findIndex(a => a === '-o' || a === '--output');
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('-')) {
    process.env.ANIDL_OUTPUT_DIR = argv[i + 1];
  }
})();

(async () => {
  try {
    const cfg = yamlCfg.loadCfg();
    const argv = appArgv(cfg.cli);

    if (!argv.skipUpdate) await update(argv.update);

    if (argv.all && argv.but) {
      console.error('--all and --but exclude each other!');
      return;
    }

    if (argv.addArchive) {
      if (argv.service === 'crunchy') {
        if (argv.s === undefined && argv.series === undefined) return console.error('`-s` or `--series` not found');
        if (argv.s && argv.series) return console.error('Both `-s` and `--series` found');
        const id = (argv.s === undefined ? argv.series : argv.s) as string;
        addToArchive({ service: 'crunchy', type: argv.s === undefined ? 'srz' : 's' }, id);
        console.info('Added %s to the downloadArchive list', id);
      } else if (argv.service === 'hidive') {
        if (argv.s === undefined) return console.error('`-s` not found');
        addToArchive({ service: 'hidive', type: 's' }, argv.s as string);
        console.info('Added %s to the downloadArchive list', argv.s);
      } else if (argv.service === 'ao') {
        if (argv.s === undefined) return console.error('`-s` not found');
        addToArchive({ service: 'ao', type: 's' }, argv.s as string);
        console.info('Added %s to the downloadArchive list', argv.s);
      }
    } else if (argv.downloadArchive) {
      const ids = makeCommand(argv.service);
      for (const id of ids) {
        overrideArguments(cfg.cli, id);
        Object.keys(require.cache).forEach(key => {
          if (key.endsWith('crunchy.js') || 
              key.endsWith('hidive.js') || 
              key.endsWith('ao.js') || 
              key.endsWith('adn.js')) {
            delete require.cache[key];
          }
        });
        
        const service = await loadService(argv.service);
        await service.cli();
      }
    } else {
      const service = await loadService(argv.service);
      await service.cli();
    }
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
})();

async function loadService(serviceName: string): Promise<ServiceClass> {
  switch(serviceName) {
  case 'crunchy': return new (await import('./crunchy')).default;
  case 'hidive':  return new (await import('./hidive')).default;
  case 'ao':      return new (await import('./ao')).default;
  case 'adn':     return new (await import('./adn')).default;
  default:        
    try {
      return new (await import(`./${serviceName}`)).default;
    } catch (error) {
      throw new Error(`Service "${serviceName}" not found or failed to load`);
    }
  }
}
