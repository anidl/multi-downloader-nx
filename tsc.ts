import { ChildProcess, exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const argv = process.argv.slice(2);
let buildIgnore: string[] = [];

const isTest = argv.length > 0 && argv[0] === 'test';
const isGUI = !(argv.length > 1 && argv[1] === 'false');

if (!isTest) buildIgnore = ['*/\\.env', './config/setup.json'];

if (!isGUI) buildIgnore = buildIgnore.concat(['./gui*', './build*', 'gui.ts']);

const ignore = [
	...buildIgnore,
	'*/\\.git*',
	'./lib*',
	'*/@types*',
	'./out*',
	'./bin/mkvtoolnix*',
	'./config/token.yml$',
	'./config/updates.json$',
	'./config/*_token.yml$',
	'./config/*_sess.yml$',
	'./config/*_profile.yml$',
	'*/\\.eslint*',
	'*/*\\.tsx?$',
	'./fonts*',
	'./gui/react*',
	'*/node_modules/*',
	'./widevine/*',
	'./playready/*',
	'./videos/*',
	'./logs/*'
]
	.map((a) =>
		a
			.replace(/\*/g, '[^]*')
			.replace(/\.\//g, escapeRegExp(__dirname) + '/')
			.replace(/\//g, path.sep === '\\' ? '\\\\' : '/')
	)
	.map((a) => new RegExp(a, 'i'));

export { ignore };

(async () => {
	const waitForProcess = async (proc: ChildProcess) => {
		return new Promise((resolve, reject) => {
			proc.stdout?.on('data', console.log);
			proc.stderr?.on('data', console.error);
			proc.on('close', resolve);
			proc.on('error', reject);
		});
	};

	process.stdout.write('Removing lib dir... ');
	fs.rmSync('lib', { recursive: true, force: true });
	process.stdout.write('✓\nRunning tsc... ');
	const tsc = exec('npx tsc');

	await waitForProcess(tsc);

	if (!isGUI) {
		fs.rmSync(path.join('lib', 'gui'), { recursive: true, force: true });
	}

	if (!isTest && isGUI) {
		process.stdout.write('✓\nBuilding react... ');

		const installReactDependencies = exec('pnpm install', {
			cwd: path.join(__dirname, 'gui', 'react')
		});

		await waitForProcess(installReactDependencies);

		const react = exec('pnpm run build', {
			cwd: path.join(__dirname, 'gui', 'react'),
			env: {
				...process.env,
				CI: 'false'
			}
		});

		await waitForProcess(react);
	}

	process.stdout.write('✓\nCopying files... ');
	if (!isTest && isGUI) {
		copyDir(path.join(__dirname, 'gui', 'react', 'build'), path.join(__dirname, 'lib', 'gui', 'server', 'build'));
	}

	const files = readDir(__dirname);
	files.forEach((item) => {
		const itemPath = path.join(__dirname, 'lib', item.path.replace(__dirname, ''));
		if (item.stats.isDirectory()) {
			if (!fs.existsSync(itemPath)) fs.mkdirSync(itemPath, { recursive: true });
		} else {
			fs.cpSync(item.path, itemPath, { recursive: true });
		}
	});

	process.stdout.write('✓\nInstalling dependencies... ');
	if (!isTest) {
		const dependencies = exec(`pnpm install ${isGUI ? '' : '-P'}`, {
			cwd: path.join(__dirname, 'lib')
		});
		await waitForProcess(dependencies);
	}

	process.stdout.write('✓\n');
})();

function readDir(dir: string): {
	path: string;
	stats: fs.Stats;
}[] {
	const items: {
		path: string;
		stats: fs.Stats;
	}[] = [];
	const content = fs.readdirSync(dir);
	itemLoop: for (const item of content) {
		const itemPath = path.join(dir, item);
		for (const ignoreItem of ignore) {
			if (ignoreItem.test(itemPath)) continue itemLoop;
		}
		const stats = fs.statSync(itemPath);
		items.push({
			path: itemPath,
			stats
		});
		if (stats.isDirectory()) {
			items.push(...readDir(itemPath));
		}
	}
	return items;
}

async function copyDir(src: string, dest: string) {
	await fs.promises.mkdir(dest, { recursive: true });
	const entries = await fs.promises.readdir(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		entry.isDirectory() ? await copyDir(srcPath, destPath) : await fs.promises.copyFile(srcPath, destPath);
	}
}

function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
