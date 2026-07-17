import express from 'express';
import { ensureConfig, loadCfg, workingDir } from '../../modules/module.cfg-loader';
import open from 'open';
import ServiceHandler from './serviceHandler';
import path from 'path';
import fs from 'fs';
import { PublicWebSocket } from './websocket';
import { console } from '../../modules/log';
import packageJson from '../../package.json';

process.title = 'AniDL';

ensureConfig();

const cfg = loadCfg();

const app = express();

export { app, cfg };

app.use(express.json());

app.use((_, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
});

const buildDirs = [path.join(workingDir, 'gui', 'server', 'build'), path.join(workingDir, 'gui', 'react', 'build')];
const buildDir = buildDirs.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) ?? buildDirs[0];

app.use(express.static(buildDir, { maxAge: 1000 * 60 * 20 }));

console.info(`\n=== Multi Downloader NX GUI ${packageJson.version} ===\n`);

const server = app.listen(cfg.gui.port, () => {
	console.info(`GUI server started on port ${cfg.gui.port}`);
	void open(`http://localhost:${cfg.gui.port}`).catch((error) => {
		console.error('Failed to open the GUI in a browser:', error);
	});
});

new PublicWebSocket(server);
new ServiceHandler(server);
