import { GithubTag, TagCompare } from '../@types/github';
import path from 'path';
import { UpdateFile } from '../@types/updateFile';
import packageJson from '../package.json';
import { CompilerOptions, transpileModule } from 'typescript';
import tsConfig from '../tsconfig.json';
import fs from 'fs';
import { workingDir } from './module.cfg-loader';
import { console } from './log';
import Helper from './module.helper';
import * as reqModule from './module.fetch';
const updateFilePlace = path.join(workingDir, 'config', 'updates.json');

const req = new reqModule.Req();

const updateIgnore = [
	'*.d.ts',
	'.git',
	'lib',
	'node_modules',
	'@types',
	path.join('bin', 'mkvtoolnix'),
	path.join('config', 'token.yml'),
	'.eslint',
	'tsconfig.json',
	'updates.json',
	'tsc.ts'
];

const askBeforeUpdate = ['*.yml'];

enum ApplyType {
	DELETE,
	ADD,
	UPDATE
}

export type ApplyItem = {
	type: ApplyType;
	path: string;
	content: string;
};

export default async (force = false) => {
	const isPackaged = (
		process as NodeJS.Process & {
			pkg?: unknown;
		}
	).pkg
		? true
		: !!process.env.contentDirectory;
	if (isPackaged) {
		return;
	}
	let updateFile: UpdateFile | undefined;
	if (fs.existsSync(updateFilePlace)) {
		updateFile = JSON.parse(fs.readFileSync(updateFilePlace).toString()) as UpdateFile;
		if (new Date() < new Date(updateFile.nextCheck) && !force) {
			return;
		}
	}
	console.info('Checking for updates...');
	const tagRequest = await req.getData('https://api.github.com/repos/anidl/multi-downloader-nx/tags');
	if (!tagRequest.res || !tagRequest.ok) {
		console.info('No new tags found');
		return done();
	}

	const tags = JSON.parse((await tagRequest.res.text()) as string) as GithubTag[];

	if (tags.length > 0) {
		const newer = tags.filter((a) => {
			return isNewer(packageJson.version, a.name);
		});
		console.info(`Found ${tags.length} release tags and ${newer.length} that are new.`);

		if (newer.length < 1) {
			console.info('No new tags found');
			return done();
		}
		const newest = newer.sort((a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0))[0];
		const compareRequest = await req.getData(`https://api.github.com/repos/anidl/multi-downloader-nx/compare/${packageJson.version}...${newest.name}`);
		if (!compareRequest.res || !compareRequest.ok) {
			console.info('No new tags found');
			return done();
		}

		const compareJSON = JSON.parse(await compareRequest.res.text()) as TagCompare;

		console.info(`You are behind by ${compareJSON.ahead_by} releases!`);
		const changedFiles = compareJSON.files
			.map((a) => ({
				...a,
				filename: path.join(...a.filename.split('/'))
			}))
			.filter((a) => {
				return !updateIgnore.some((_filter) => matchString(_filter, a.filename));
			});
		if (changedFiles.length < 1) {
			console.info('No file changes found... updating package.json. If you think this is an error please get the newst version yourself.');
			return done(newest.name);
		}
		console.info(`Found file changes: \n${changedFiles.map((a) => `  [${a.status === 'modified' ? '*' : a.status === 'added' ? '+' : '-'}] ${a.filename}`).join('\n')}`);

		const remove: string[] = [];

		for (const a of changedFiles.filter((a) => a.status !== 'added')) {
			if (!askBeforeUpdate.some((pattern) => matchString(pattern, a.filename))) continue;
			const answer = await Helper.question(
				`The developer decided that the file '${a.filename}' may contain information you changed yourself. Should they be overriden to be updated? [y/N]`
			);
			if (answer.toLowerCase() === 'y') remove.push(a.sha);
		}

		const changesToApply = await Promise.all(
			changedFiles
				.filter((a) => !remove.includes(a.sha))
				.map(async (a): Promise<ApplyItem> => {
					if (a.filename.endsWith('.ts') || a.filename.endsWith('tsx')) {
						const isTSX = a.filename.endsWith('tsx');
						const ret = {
							path: a.filename.slice(0, isTSX ? -3 : -2) + `js${isTSX ? 'x' : ''}`,
							content: transpileModule((await (await req.getData(a.raw_url)).res?.text()) ?? '', {
								compilerOptions: tsConfig.compilerOptions as unknown as CompilerOptions
							}).outputText,
							type: a.status === 'modified' ? ApplyType.UPDATE : a.status === 'added' ? ApplyType.ADD : ApplyType.DELETE
						};
						console.info('✓ Transpiled %s', ret.path);
						return ret;
					} else {
						const ret = {
							path: a.filename,
							content: (await (await req.getData(a.raw_url)).res?.text()) ?? '',
							type: a.status === 'modified' ? ApplyType.UPDATE : a.status === 'added' ? ApplyType.ADD : ApplyType.DELETE
						};
						console.info('✓ Got %s', ret.path);
						return ret;
					}
				})
		);

		changesToApply.forEach((a) => {
			try {
				fs.mkdirSync(path.dirname(a.path), { recursive: true });
				fs.writeFileSync(path.join(__dirname, '..', a.path), a.content);
				console.info('✓ Written %s', a.path);
			} catch (er) {
				console.info('✗ Error while writing %s', a.path);
			}
		});

		console.info('Done');
		return done();
	}
};

function done(newVersion?: string) {
	const next = new Date(Date.now() + 1000 * 60 * 60 * 24);
	fs.writeFileSync(
		updateFilePlace,
		JSON.stringify(
			{
				lastCheck: Date.now(),
				nextCheck: next.getTime()
			} as UpdateFile,
			null,
			2
		)
	);
	if (newVersion) {
		fs.writeFileSync(
			'../package.json',
			JSON.stringify(
				{
					...packageJson,
					version: newVersion
				},
				null,
				4
			)
		);
	}
	console.info('[INFO] Searching for update finished. Next time running on the ' + next.toLocaleDateString() + ' at ' + next.toLocaleTimeString() + '.');
}

function isNewer(curr: string, compare: string): boolean {
	const currParts = curr.split('.').map((a) => parseInt(a));
	const compareParts = compare.split('.').map((a) => parseInt(a));

	for (let i = 0; i < Math.max(currParts.length, compareParts.length); i++) {
		if (currParts.length <= i) return true;
		if (compareParts.length <= i) return false;
		if (currParts[i] !== compareParts[i]) return compareParts[i] > currParts[i];
	}

	return false;
}

function matchString(pattern: string, toMatch: string): boolean {
	const filter = path.join('..', pattern);
	if (pattern.startsWith('*')) {
		return toMatch.endsWith(pattern.slice(1));
	} else if (filter.split(path.sep).pop()?.indexOf('.') === -1) {
		return toMatch.startsWith(filter);
	} else {
		return toMatch.split(path.sep).pop() === pattern;
	}
}
