import { console } from './modules/log';
import { ServiceClass } from './@types/serviceClassInterface';
import { appArgv, overrideArguments } from './modules/module.app-args';
import * as yamlCfg from './modules/module.cfg-loader';
import { makeCommand, addToArchive } from './modules/module.downloadArchive';

import update from './modules/module.updater';

(async () => {
	const cfg = yamlCfg.loadCfg();
	const argv = appArgv(cfg.cli);
	if (!argv.skipUpdate) await update(argv.update);

	if (argv.all && argv.but) {
		console.error('--all and --but exclude each other!');
		return;
	}

	if (argv.addArchive) {
		if (argv.service === 'crunchy') {
			if (argv.s === undefined && argv.series === undefined) return console.error('`-s` or `--srz` not found');
			if (argv.s && argv.series) return console.error('Both `-s` and `--srz` found');
			addToArchive(
				{
					service: 'crunchy',
					type: argv.s === undefined ? 'srz' : 's'
				},
				(argv.s === undefined ? argv.series : argv.s) as string
			);
			console.info('Added %s to the downloadArchive list', argv.s === undefined ? argv.series : argv.s);
		} else if (argv.service === 'hidive') {
			if (argv.s === undefined) return console.error('`-s` not found');
			addToArchive(
				{
					service: 'hidive',
					//type: argv.s === undefined ? 'srz' : 's'
					type: 's'
				},
				(argv.s === undefined ? argv.series : argv.s) as string
			);
			console.info('Added %s to the downloadArchive list', argv.s === undefined ? argv.series : argv.s);
		}
	} else if (argv.downloadArchive) {
		const ids = makeCommand(argv.service);
		for (const id of ids) {
			overrideArguments(cfg.cli, id);
			/* Reimport module to override appArgv */
			Object.keys(require.cache).forEach((key) => {
				if (key.endsWith('crunchy.js') || key.endsWith('hidive.js')) delete require.cache[key];
			});
			let service: ServiceClass;
			switch (argv.service) {
				case 'crunchy':
					service = new (await import('./crunchy')).default();
					break;
				case 'hidive':
					service = new (await import('./hidive')).default();
					break;
				case 'adn':
					service = new (await import('./adn')).default();
					break;
				default:
					service = new (await import(`./${argv.service}`)).default();
					break;
			}
			await service.cli();
		}
	} else {
		let service: ServiceClass;
		switch (argv.service) {
			case 'crunchy':
				service = new (await import('./crunchy')).default();
				break;
			case 'hidive':
				service = new (await import('./hidive')).default();
				break;
			case 'adn':
				service = new (await import('./adn')).default();
				break;
			default:
				service = new (await import(`./${argv.service}`)).default();
				break;
		}
		await service.cli();
	}
})();
