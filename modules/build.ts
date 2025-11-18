// build requirements
import crypto from 'crypto';
import fs from 'fs-extra';
import pkg from '../package.json';
import modulesCleanup from 'removeNPMAbsolutePaths';
import { exec } from '@yao-pkg/pkg';
import { execSync } from 'child_process';
import { console } from './log';
import esbuild from 'esbuild';
import path from 'path';

const buildsDir = './_builds';
const nodeVer = 'node24-';

type BuildTypes = `${'windows' | 'macos' | 'linux' | 'linuxstatic' | 'alpine'}-${'x64' | 'arm64'}` | 'linuxstatic-armv7';

(async () => {
	const buildType = process.argv[2] as BuildTypes;
	const isGUI = process.argv[3] === 'true';

	buildBinary(buildType, isGUI);
})();

// main
async function buildBinary(buildType: BuildTypes, gui: boolean) {
	const buildStr = 'multi-downloader-nx';
	const acceptablePlatforms = ['windows', 'linux', 'linuxstatic', 'macos', 'alpine'];
	const acceptableArchs = ['x64', 'arm64'];
	const acceptableBuilds: string[] = ['linuxstatic-armv7'];
	for (const platform of acceptablePlatforms) {
		for (const arch of acceptableArchs) {
			acceptableBuilds.push(platform + '-' + arch);
		}
	}
	if (!acceptableBuilds.includes(buildType)) {
		console.error('Unknown build type!');
		process.exit(1);
	}
	await modulesCleanup('.');
	if (!fs.existsSync(buildsDir)) {
		fs.mkdirSync(buildsDir);
	}
	const buildFull = `${buildStr}-${getFriendlyName(buildType)}-${gui ? 'gui' : 'cli'}`;
	const buildDir = `${buildsDir}/${buildFull}`;
	if (fs.existsSync(buildDir)) {
		fs.removeSync(buildDir);
	}
	fs.mkdirSync(buildDir);
	console.info('Running esbuild');

	const build = await esbuild.build({
		entryPoints: [gui ? 'gui.js' : 'index.js'],
		sourceRoot: './',
		bundle: true,
		platform: 'node',
		format: 'cjs',
		treeShaking: true,
		// External source map for debugging
		sourcemap: true,
		// Minify and keep the original names
		minify: true,
		keepNames: true,
		outfile: path.join(buildsDir, 'index.cjs'),
		metafile: true,
		external: ['cheerio', 'sleep', 'readline/promises']
	});

	if (build.errors?.length > 0) console.error(build.errors);
	if (build.warnings?.length > 0) console.warn(build.warnings);

	// Compiling single executable
	const buildConfig = [`${buildsDir}/index.cjs`, '--target', nodeVer + buildType, '--output', `${buildDir}/${pkg.short_name}`, '--public', '--compress', 'GZip'];
	console.info(`[Build] Build configuration: ${buildFull}`);
	try {
		await exec(buildConfig);
	} catch (e) {
		console.info(e);
		process.exit(1);
	}

	// Moving required default files/folders into build dir
	fs.mkdirSync(`${buildDir}/config`);
	fs.mkdirSync(`${buildDir}/videos`);
	fs.mkdirSync(`${buildDir}/widevine`);
	fs.mkdirSync(`${buildDir}/playready`);
	fs.copySync('./config/cli-defaults.yml', `${buildDir}/config/cli-defaults.yml`);
	fs.copySync('./config/dir-path.yml', `${buildDir}/config/dir-path.yml`);
	fs.copySync('./config/gui.yml', `${buildDir}/config/gui.yml`);
	fs.copySync('./modules/cmd-here.bat', `${buildDir}/cmd-here.bat`);
	fs.copySync('./modules/NotoSans-Regular.ttf', `${buildDir}/NotoSans-Regular.ttf`);
	fs.copySync('./package.json', `${buildDir}/package.json`);
	fs.copySync('./docs/', `${buildDir}/docs/`);
	fs.copySync('./LICENSE.md', `${buildDir}/docs/LICENSE.md`);
	if (gui) {
		fs.copySync('./gui', `${buildDir}/gui`);
		fs.copySync('./node_modules/open/xdg-open', `${buildDir}/xdg-open`);
	}
	if (fs.existsSync(`${buildsDir}/${buildFull}.7z`)) {
		fs.removeSync(`${buildsDir}/${buildFull}.7z`);
	}

	// Generate bin-path.yml
	const ext = buildType.startsWith('windows') ? '.exe' : '';

	const binConf = {
		ffmpeg: `ffmpeg${ext}`,
		mkvmerge: `mkvmerge${ext}`,
		ffprobe: `ffprobe${ext}`,
		mp4decrypt: `mp4decrypt${ext}`,
		shaka: `shaka-packager${ext}`
	};

	fs.writeFileSync(
		`${buildDir}/config/bin-path.yml`,
		Object.entries(binConf)
			.map(([key, value]) => `${key}: '${value}'`)
			.join('\n') + '\n'
	);

	console.info(`[Build] Build completed`);

	// Zipping
	console.info(`[Zip] Zipping build...`);
	execSync(`7z a -t7z "${buildsDir}/${buildFull}.7z" "${buildDir}"`, { stdio: [0, 1, 2] });
	console.info(`[Zip] Zipping completed`);

	// Checksum
	const zipPath = path.join(buildsDir, `${buildFull}.7z`);
	const hashPath = path.join(buildsDir, `${buildFull}.7z.sha256`);
	console.info(`[Checksum] Generating SHA256 checksum...`);
	const hash = crypto.createHash('sha256');
	const stream = fs.createReadStream(zipPath);
	const checksum = await new Promise<string>((resolve, reject) => {
		stream.on('data', (chunk) => hash.update(chunk));
		stream.on('end', () => resolve(hash.digest('hex')));
		stream.on('error', reject);
	});
	fs.writeFileSync(hashPath, `${checksum} ${path.basename(zipPath)}\n`);
	console.info(`[Checksum] Checksum created: ${hashPath}`);
	console.info(`[Checksum] SHA256: ${checksum}`);
}

function getFriendlyName(buildString: string): string {
	if (buildString.includes('armv7')) {
		return buildString.replace('linuxstatic', 'android');
	}
	if (buildString.includes('linuxstatic')) {
		buildString = buildString.replace('linuxstatic', 'linux');
	}
	return buildString;
}
