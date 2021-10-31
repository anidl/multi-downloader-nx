import { appArgv } from "./modules/module.app-args";
import * as yamlCfg from './modules/module.cfg-loader';

import funimation from './funi'

(async () => {
  const cfg = yamlCfg.loadCfg();

  const argv = appArgv(cfg.cli);

  if (argv.service === 'funi') {
    await funimation()
  } else if (argv.service === 'crunchy') {

  }

})()