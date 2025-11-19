import { Command } from 'commander';
import { args, AvailableMuxer, groups } from './module.args';
import { LanguageItem } from './module.langsData';
import { DownloadInfo } from '../@types/messageHandler';
import { HLSCallback } from './hls-download';
import leven from 'leven';
import { console } from './log';
import { CrunchyVideoPlayStreams, CrunchyAudioPlayStreams } from '../@types/enums';
import pj from '../package.json';

export let argvC: {
	[x: string]: unknown;
	ccTag: string;
	defaultAudio: LanguageItem;
	defaultSub: LanguageItem;
	ffmpegOptions: string[];
	mkvmergeOptions: string[];
	force: 'Y' | 'y' | 'N' | 'n' | 'C' | 'c';
	skipUpdate: boolean;
	videoTitle: string;
	override: string[];
	fsRetryTime: number;
	forceMuxer: AvailableMuxer | undefined;
	username: string | undefined;
	password: string | undefined;
	token: string | undefined;
	silentAuth: boolean;
	skipSubMux: boolean;
	downloadArchive: boolean;
	addArchive: boolean;
	but: boolean;
	auth: boolean | undefined;
	dlFonts: boolean | undefined;
	search: string | undefined;
	'search-type': string;
	page: number | undefined;
	locale: string;
	new: boolean | undefined;
	'movie-listing': string | undefined;
	'show-raw': string | undefined;
	'season-raw': string | undefined;
	series: string | undefined;
	s: string | undefined;
	srz: string | undefined;
	e: string | undefined;
	extid: string | undefined;
	q: number;
	x: number;
	cstream: keyof typeof CrunchyVideoPlayStreams;
	vstream: keyof typeof CrunchyVideoPlayStreams;
	astream: keyof typeof CrunchyAudioPlayStreams;
	tsd: boolean | undefined;
	partsize: number;
	hslang: string;
	dlsubs: string[];
	skipMuxOnSubFail: boolean;
	novids: boolean | undefined;
	noaudio: boolean | undefined;
	nosubs: boolean | undefined;
	dubLang: string[];
	all: boolean;
	fontSize: number;
	combineLines: boolean;
	allDubs: boolean;
	timeout: number;
	waittime: number;
	simul: boolean;
	mp4: boolean;
	skipmux: boolean | undefined;
	fileName: string;
	numbers: number;
	nosess: string;
	debug: boolean | undefined;
	raw: boolean;
	rawoutput: string;
	nocleanup: boolean;
	help: boolean | undefined;
	service: 'crunchy' | 'hidive' | 'adn';
	update: boolean;
	fontName: string | undefined;
	_: (string | number)[];
	$0: string;
	dlVideoOnce: boolean;
	chapters: boolean;
	removeBumpers: boolean;
	originalFontSize: boolean;
	keepAllVideos: boolean;
	syncTiming: boolean;
	callbackMaker?: (data: DownloadInfo) => HLSCallback;
	// Subtitle Fix Options
	noASSConv: boolean;
	noSubFix: boolean;
	srtAssFix: boolean;
	layoutResFix: boolean;
	scaledBorderAndShadowFix: boolean;
	scaledBorderAndShadow: 'yes' | 'no';
	originalScriptFix: boolean;
	// Proxy
	proxy: string;
	proxyAll: boolean;
};

export type ArgvType = typeof argvC;

// This functions manages slight mismatches like -srz and returns it as --srz
const processArgv = () => {
	const argv = [];
	for (const arg of process.argv) {
		if (/^-[a-zA-Z]{2,}$/.test(arg)) {
			const name = args.find((a) => a.name === arg.substring(1) || a.alias === arg.substring(1));
			if (name) {
				argv.push(`--${name.name ?? name.alias}`);
				continue;
			}
		}
		argv.push(arg);
	}

	return argv;
};

const appArgv = (
	cfg: {
		[key: string]: unknown;
	},
	isGUI = false
) => {
	if (argvC) return argvC;
	const argv = getCommander(cfg, isGUI).parse(processArgv());
	const parsed = argv.opts() as ArgvType;

	// Be sure that both vars (name and alias) are defined
	for (const item of args) {
		const name = item.name;
		const alias = item.alias;

		if (!alias) continue;

		if (parsed[name] !== undefined) {
			parsed[alias] = parsed[name];
		}

		if (parsed[alias] !== undefined) {
			parsed[name] = parsed[alias];
		}
	}

	if (!isGUI && (process.argv.length <= 2 || parsed.help)) {
		argv.outputHelp();
		process.exit(0);
	}

	argvC = parsed;
	return parsed;
};

const overrideArguments = (cfg: { [key: string]: unknown }, override: Partial<typeof argvC>, isGUI = false) => {
	const argv = getCommander(cfg, isGUI);
	const baseArgv = [...processArgv()];

	for (const [key, val] of Object.entries(override)) {
		if (val === undefined) continue;
		if (typeof val === 'boolean') {
			if (val) baseArgv.push(`--${key}`);
		} else {
			baseArgv.push(`--${key}`, String(val));
		}
	}

	const data = argv.parse(baseArgv);
	const parsed = data.opts() as ArgvType;

	// Be sure that both vars (name and alias) are defined
	for (const item of args) {
		const name = item.name;
		const alias = item.alias;

		if (!alias) continue;

		if (parsed[name] !== undefined) {
			parsed[alias] = parsed[name];
		}

		if (parsed[alias] !== undefined) {
			parsed[name] = parsed[alias];
		}
	}

	if (!isGUI && (process.argv.length <= 2 || parsed.help)) {
		argv.outputHelp();
		process.exit(0);
	}

	argvC = parsed;
};

export { appArgv, overrideArguments };

const getCommander = (cfg: Record<string, unknown>, isGUI: boolean) => {
	const program = new Command();
	program
		.name(process.platform === 'win32' ? 'aniDL.exe' : 'aniDL')
		.description(pj.description)
		.version(pj.version, '-v, --version', 'Show version')
		.allowUnknownOption(false)
		.allowExcessArguments(true);

	const parseDefault = <T = unknown>(key: string, _default: T): T => {
		if (Object.prototype.hasOwnProperty.call(cfg, key)) {
			return cfg[key] as T;
		} else return _default;
	};

	const data = args.map((a) => {
		return {
			...a,
			demandOption: !isGUI && a.demandOption,
			group: groups[a.group],
			default: typeof a.default === 'object' && !Array.isArray(a.default) ? parseDefault((a.default as any).name || a.name, (a.default as any).default) : a.default
		};
	});

	for (const item of data) {
		const option = program.createOption(
			(item.alias
				? `${item.alias.length === 1 ? `-${item.alias}` : `--${item.alias}`}, ${item.name.length === 1 ? `-${item.name}` : `--${item.name}`}`
				: item.name.length === 1
					? `-${item.name}`
					: `--${item.name}`) + (item.type === 'boolean' ? '' : ` <value>`),
			item.describe ?? ''
		);
		if (item.default !== undefined) option.default(item.default);

		option.argParser((value) => {
			if (item.type === 'boolean') {
				if (value === undefined) return true;
				if (value === 'true') return true;
				if (value === 'false') return false;
				return Boolean(value);
			}

			if (item.type === 'array') {
				if (typeof value === 'string') {
					return value.split(',').map((v) => v.trim());
				}
				return Array.isArray(value) ? value : [value];
			}

			if (item.choices && !(isGUI && item.name === 'service')) {
				if (!item.choices.includes(value)) {
					console.error(`Invalid value '${value}' for --${item.name}. Allowed: ${item.choices.join(', ')}`);
					process.exit(1);
				}
			}

			if (item.transformer) return item.transformer(value);
			return value;
		});

		program.addOption(option);
	}

	// Custom logic for suggesting corrections for misspelled options
	program.hook('preAction', (_, command) => {
		const used = command.parent?.args || [];

		const validOptions = [...args.map((a) => a.name), ...args.map((a) => a.alias).filter((a): a is string => a !== undefined)];

		const unknownOptions = used.filter((arg) => arg.startsWith('-'));
		const suggestions: Record<string, boolean> = {};

		unknownOptions.forEach((opt) => {
			const cleaned = opt.replace(/^-+/, '');

			const closest = validOptions.find((vo) => {
				const dist = leven(vo, cleaned);
				return dist <= 2 && dist > 0;
			});

			if (closest && !suggestions[closest]) {
				console.info(`Unknown option ${opt}, did you mean --${closest}?`);
				suggestions[closest] = true;
			} else if (!suggestions[cleaned]) {
				console.info(`Unknown option ${opt}`);
				suggestions[cleaned] = true;
			}
		});
	});

	return program;
};
