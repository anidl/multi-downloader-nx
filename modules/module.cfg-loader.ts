import path from 'path';
import yaml from 'yaml';
import fs from 'fs';
import { lookpath } from 'lookpath';
import { console } from './log';
import { GuiState } from '../@types/messageHandler';

// new-cfg
const workingDir = (
	process as NodeJS.Process & {
		pkg?: unknown;
	}
).pkg
	? path.dirname(process.execPath)
	: process.env.contentDirectory
		? process.env.contentDirectory
		: path.join(__dirname, '/..');

export { workingDir };

const binCfgFile = path.join(workingDir, 'config', 'bin-path');
const dirCfgFile = path.join(workingDir, 'config', 'dir-path');
const guiCfgFile = path.join(workingDir, 'config', 'gui');
const cliCfgFile = path.join(workingDir, 'config', 'cli-defaults');
const hdPflCfgFile = path.join(workingDir, 'config', 'hd_profile');
const sessCfgFile = {
	cr: path.join(workingDir, 'config', 'cr_sess'),
	hd: path.join(workingDir, 'config', 'hd_sess'),
	adn: path.join(workingDir, 'config', 'adn_sess')
};
const stateFile = path.join(workingDir, 'config', 'guistate');
const tokenFile = {
	cr: path.join(workingDir, 'config', 'cr_token'),
	hd: path.join(workingDir, 'config', 'hd_token'),
	hdNew: path.join(workingDir, 'config', 'hd_new_token'),
	adn: path.join(workingDir, 'config', 'adn_token')
};

export const ensureConfig = () => {
	if (!fs.existsSync(path.join(workingDir, 'config'))) fs.mkdirSync(path.join(workingDir, 'config'), { recursive: true });
	if (process.env.contentDirectory)
		[binCfgFile, dirCfgFile, cliCfgFile, guiCfgFile].forEach((a) => {
			if (!fs.existsSync(`${a}.yml`)) fs.copyFileSync(path.join(__dirname, '..', 'config', `${path.basename(a)}.yml`), `${a}.yml`);
		});
};

const loadYamlCfgFile = <T extends Record<string, any>>(file: string, isSess?: boolean): T => {
	if (fs.existsSync(`${file}.user.yml`) && !isSess) {
		file += '.user';
	}
	file += '.yml';
	if (fs.existsSync(file)) {
		try {
			return yaml.parse(fs.readFileSync(file, 'utf8'));
		} catch (e) {
			console.error('[ERROR]', e);
			return {} as T;
		}
	}
	return {} as T;
};

export type WriteObjects = {
	gui: GUIConfig;
};

const writeYamlCfgFile = <T extends keyof WriteObjects>(file: T, data: WriteObjects[T]) => {
	const fn = path.join(workingDir, 'config', `${file}.yml`);
	if (fs.existsSync(fn)) fs.unlinkSync(fn);
	fs.writeFileSync(fn, yaml.stringify(data));
};

export type GUIConfig = {
	port: number;
	password?: string;
};

export type ConfigObject = {
	dir: {
		content: string;
		trash: string;
		fonts: string;
		config: string;
	};
	bin: {
		ffmpeg?: string;
		mkvmerge?: string;
		mp4decrypt?: string;
		shaka?: string;
	};
	cli: {
		[key: string]: any;
	};
	gui: GUIConfig;
};

const loadCfg = (): ConfigObject => {
	// load cfgs
	const defaultCfg: ConfigObject = {
		bin: {},
		dir: loadYamlCfgFile<{
			content: string;
			trash: string;
			fonts: string;
			config: string;
		}>(dirCfgFile),
		cli: loadYamlCfgFile<{
			[key: string]: any;
		}>(cliCfgFile),
		gui: loadYamlCfgFile<GUIConfig>(guiCfgFile)
	};
	const defaultDirs = {
		fonts: '${wdir}/fonts/',
		content: '${wdir}/videos/',
		trash: '${wdir}/videos/_trash/',
		config: '${wdir}/config'
	};
	if (typeof defaultCfg.dir !== 'object' || defaultCfg.dir === null || Array.isArray(defaultCfg.dir)) {
		defaultCfg.dir = defaultDirs;
	}

	const keys = Object.keys(defaultDirs) as (keyof typeof defaultDirs)[];
	for (const key of keys) {
		if (!Object.prototype.hasOwnProperty.call(defaultCfg.dir, key) || typeof defaultCfg.dir[key] !== 'string') {
			defaultCfg.dir[key] = defaultDirs[key];
		}
		if (!path.isAbsolute(defaultCfg.dir[key])) {
			defaultCfg.dir[key] = path.join(workingDir, defaultCfg.dir[key].replace(/^\${wdir}/, ''));
		}
	}
	if (!fs.existsSync(defaultCfg.dir.content)) {
		try {
			fs.mkdirSync(defaultCfg.dir.content, { recursive: true });
		} catch (e) {
			console.error('Content directory not accessible!');
			return defaultCfg;
		}
	}
	if (!fs.existsSync(defaultCfg.dir.trash)) {
		defaultCfg.dir.trash = defaultCfg.dir.content;
	}
	// output
	return defaultCfg;
};

const loadBinCfg = async () => {
	const binCfg = loadYamlCfgFile<ConfigObject['bin']>(binCfgFile);
	// binaries
	const defaultBin = {
		ffmpeg: 'ffmpeg',
		mkvmerge: 'mkvmerge',
		mp4decrypt: 'mp4decrypt',
		shaka: 'shaka-packager'
	};
	const keys = Object.keys(defaultBin) as (keyof typeof defaultBin)[];
	for (const dir of keys) {
		if (!Object.prototype.hasOwnProperty.call(binCfg, dir) || typeof binCfg[dir] != 'string') {
			binCfg[dir] = defaultBin[dir];
		}
		if ((binCfg[dir] as string).match(/^\${wdir}/)) {
			binCfg[dir] = (binCfg[dir] as string).replace(/^\${wdir}/, '');
			binCfg[dir] = path.join(workingDir, binCfg[dir] as string);
		}
		if (!path.isAbsolute(binCfg[dir] as string)) {
			binCfg[dir] = path.join(workingDir, binCfg[dir] as string);
		}
		binCfg[dir] = await lookpath(binCfg[dir] as string);
		binCfg[dir] = binCfg[dir] ? binCfg[dir] : undefined;
		if (!binCfg[dir]) {
			const binFile = await lookpath(path.basename(defaultBin[dir]));
			binCfg[dir] = binFile ? binFile : binCfg[dir];
		}
	}
	return binCfg;
};

const loadCRSession = () => {
	let session = loadYamlCfgFile(sessCfgFile.cr, true);
	if (typeof session !== 'object' || session === null || Array.isArray(session)) {
		session = {};
	}
	for (const cv of Object.keys(session)) {
		if (typeof session[cv] !== 'object' || session[cv] === null || Array.isArray(session[cv])) {
			session[cv] = {};
		}
	}
	return session;
};

const saveCRSession = (data: Record<string, unknown>) => {
	const cfgFolder = path.dirname(sessCfgFile.cr);
	try {
		fs.mkdirSync(cfgFolder, { recursive: true });
		fs.writeFileSync(`${sessCfgFile.cr}.yml`, yaml.stringify(data));
	} catch (e) {
		console.error("Can't save session file to disk!");
	}
};

const loadCRToken = () => {
	let token = loadYamlCfgFile(tokenFile.cr, true);
	if (typeof token !== 'object' || token === null || Array.isArray(token)) {
		token = {};
	}
	return token;
};

const saveCRToken = (data: Record<string, unknown>) => {
	const cfgFolder = path.dirname(tokenFile.cr);
	try {
		fs.mkdirSync(cfgFolder, { recursive: true });
		fs.writeFileSync(`${tokenFile.cr}.yml`, yaml.stringify(data));
	} catch (e) {
		console.error("Can't save token file to disk!");
	}
};

const loadADNToken = () => {
	let token = loadYamlCfgFile(tokenFile.adn, true);
	if (typeof token !== 'object' || token === null || Array.isArray(token)) {
		token = {};
	}
	return token;
};

const saveADNToken = (data: Record<string, unknown>) => {
	const cfgFolder = path.dirname(tokenFile.adn);
	try {
		fs.mkdirSync(cfgFolder, { recursive: true });
		fs.writeFileSync(`${tokenFile.adn}.yml`, yaml.stringify(data));
	} catch (e) {
		console.error("Can't save token file to disk!");
	}
};

const loadHDSession = () => {
	let session = loadYamlCfgFile(sessCfgFile.hd, true);
	if (typeof session !== 'object' || session === null || Array.isArray(session)) {
		session = {};
	}
	for (const cv of Object.keys(session)) {
		if (typeof session[cv] !== 'object' || session[cv] === null || Array.isArray(session[cv])) {
			session[cv] = {};
		}
	}
	return session;
};

const saveHDSession = (data: Record<string, unknown>) => {
	const cfgFolder = path.dirname(sessCfgFile.hd);
	try {
		fs.mkdirSync(cfgFolder, { recursive: true });
		fs.writeFileSync(`${sessCfgFile.hd}.yml`, yaml.stringify(data));
	} catch (e) {
		console.error("Can't save session file to disk!");
	}
};

const loadHDToken = () => {
	let token = loadYamlCfgFile(tokenFile.hd, true);
	if (typeof token !== 'object' || token === null || Array.isArray(token)) {
		token = {};
	}
	return token;
};

const saveHDToken = (data: Record<string, unknown>) => {
	const cfgFolder = path.dirname(tokenFile.hd);
	try {
		fs.mkdirSync(cfgFolder, { recursive: true });
		fs.writeFileSync(`${tokenFile.hd}.yml`, yaml.stringify(data));
	} catch (e) {
		console.error("Can't save token file to disk!");
	}
};

const saveHDProfile = (data: Record<string, unknown>) => {
	const cfgFolder = path.dirname(hdPflCfgFile);
	try {
		fs.mkdirSync(cfgFolder, { recursive: true });
		fs.writeFileSync(`${hdPflCfgFile}.yml`, yaml.stringify(data));
	} catch (e) {
		console.error("Can't save profile file to disk!");
	}
};

const loadHDProfile = () => {
	let profile = loadYamlCfgFile(hdPflCfgFile, true);
	if (typeof profile !== 'object' || profile === null || Array.isArray(profile) || Object.keys(profile).length === 0) {
		profile = {
			// base
			ipAddress: '',
			xNonce: '',
			xSignature: '',
			// personal
			visitId: '',
			// profile data
			profile: {
				userId: 0,
				profileId: 0,
				deviceId: ''
			}
		};
	}
	return profile;
};

const loadNewHDToken = () => {
	let token = loadYamlCfgFile(tokenFile.hdNew, true);
	if (typeof token !== 'object' || token === null || Array.isArray(token)) {
		token = {};
	}
	return token;
};

const saveNewHDToken = (data: Record<string, unknown>) => {
	const cfgFolder = path.dirname(tokenFile.hdNew);
	try {
		fs.mkdirSync(cfgFolder, { recursive: true });
		fs.writeFileSync(`${tokenFile.hdNew}.yml`, yaml.stringify(data));
	} catch (e) {
		console.error("Can't save token file to disk!");
	}
};

const cfgDir = path.join(workingDir, 'config');

const getState = (): GuiState => {
	const fn = `${stateFile}.json`;
	if (!fs.existsSync(fn)) {
		return {
			setup: false,
			services: {}
		};
	}
	try {
		return JSON.parse(fs.readFileSync(fn).toString());
	} catch (e) {
		console.error('Invalid state file, regenerating');
		return {
			setup: false,
			services: {}
		};
	}
};

const setState = (state: GuiState) => {
	const fn = `${stateFile}.json`;
	try {
		fs.writeFileSync(fn, JSON.stringify(state, null, 2));
	} catch (e) {
		console.error('Failed to write state file.');
	}
};

export {
	loadBinCfg,
	loadCfg,
	saveCRSession,
	loadCRSession,
	saveCRToken,
	loadCRToken,
	saveADNToken,
	loadADNToken,
	saveHDSession,
	loadHDSession,
	saveHDToken,
	loadHDToken,
	saveNewHDToken,
	loadNewHDToken,
	saveHDProfile,
	loadHDProfile,
	getState,
	setState,
	writeYamlCfgFile,
	sessCfgFile,
	hdPflCfgFile,
	cfgDir
};
