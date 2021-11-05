import { appArgv } from './modules/module.app-args';
import * as yamlCfg from './modules/module.cfg-loader';

import funimation from './funi';
import crunchy from './crunchy';
import update from './modules/module.updater';

(async () => {
  const cfg = yamlCfg.loadCfg();

  const argv = appArgv(cfg.cli);

  await update(argv.update);

  if (argv.service === 'funi') {
    await funimation();
  } else if (argv.service === 'crunchy') {
    await crunchy();
  }

})();