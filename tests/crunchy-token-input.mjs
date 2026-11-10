import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import output from 'node:console';
import process from 'node:process';
import { fileURLToPath, URLSearchParams } from 'node:url';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'anidl-token-input-'));
try {
	const fakeToken = '123e4567-e89b-12d3-a456-426614174000';
	let passed = 0;
	async function test(name, run) {
		await run();
		passed++;
		output.log(`ok ${passed} - ${name}`);
	}
	function compile(file, requireFn, extra = {}) {
		const source = fs.readFileSync(file, 'utf8');
		const code = ts.transpileModule(source, {
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
		}).outputText;
		const exports = {};
		const module = { exports };
		vm.runInNewContext(code, { exports, module, require: requireFn, process, console: output, URLSearchParams, Error, ...extra }, { filename: file });
		return module.exports;
	}
	const realHelper = compile(path.join(root, 'modules/module.crunchy-token.ts'), (id) => require(id));
	const { parseCrunchyTokenInput } = realHelper;
	const same = (actual, expected) => assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected);
	const sourceError = (input, source, fragment) => {
		try {
			parseCrunchyTokenInput(input);
		} catch (error) {
			assert.equal(error.source, source);
			assert.match(error.message, fragment);
			assert(!error.message.includes(fakeToken));
			return;
		}
		assert.fail('expected token input to fail');
	};
	const rawPath = path.join(work, 'raw token no extension');
	const netscapePath = path.join(work, 'cookies export.anything');
	const unrelatedPath = path.join(work, 'unrelated');
	const malformedPath = path.join(work, 'malformed');
	const conflictPath = path.join(work, 'conflict');
	fs.writeFileSync(rawPath, ` \r\n${fakeToken}\t\r\n`);
	fs.writeFileSync(netscapePath, `# Netscape HTTP Cookie File\r\n#HttpOnly_.crunchyroll.com\tTRUE\t/\tTRUE\t0\tetp_rt\t${fakeToken}\r\n`);
	fs.writeFileSync(unrelatedPath, `.crunchyroll.com\tTRUE\t/\tTRUE\t0\tother\t${fakeToken}\n.evilcrunchyroll.com\tTRUE\t/\tTRUE\t0\tetp_rt\t${fakeToken}\n`);
	fs.writeFileSync(malformedPath, `.crunchyroll.com\tTRUE\t/\tTRUE\t0\tetp_rt\tbad-value\n`);
	fs.writeFileSync(
		conflictPath,
		`.crunchyroll.com\tTRUE\t/\tTRUE\t0\tetp_rt\t${fakeToken}\n.www.crunchyroll.com\tTRUE\t/\tTRUE\t0\tetp_rt\t123e4567-e89b-12d3-a456-426614174001\n`
	);

	await test('accepts direct UUID and optional case-insensitive etp_rt prefix', () => {
		same(parseCrunchyTokenInput(fakeToken), { refreshToken: fakeToken, source: 'direct token' });
		same(parseCrunchyTokenInput(` ETp_RT=${fakeToken} `), { refreshToken: fakeToken, source: 'direct token' });
	});
	await test('accepts raw token in a spaced, extensionless file path', () => {
		same(parseCrunchyTokenInput(rawPath), { refreshToken: fakeToken, source: 'cookies file' });
	});
	await test('accepts Netscape etp_rt row with HttpOnly marker, subdomain, and CRLF', () => {
		same(parseCrunchyTokenInput(netscapePath), { refreshToken: fakeToken, source: 'cookies file' });
	});
	await test('reports malformed direct input without echoing it', () => sourceError('etp_rt=not-a-token', 'direct token', /Invalid etp_rt/));
	await test('reports empty direct input without echoing it', () => sourceError('', 'token input', /Expected a UUID-shaped/));
	await test('reports unresolved input without guessing whether it was a token or file', () => {
		for (const input of [path.join(work, 'missing.txt'), path.join(work, 'cookies'), 'not.a.token']) {
			sourceError(input, 'token input', /Expected a UUID-shaped.*existing readable cookies file/);
		}
	});
	await test('rejects unrelated cookies and unrelated host suffixes', () => sourceError(unrelatedPath, 'cookies file', /no valid/));
	await test('reports malformed matching cookie value', () => sourceError(malformedPath, 'cookies file', /malformed cookie rows/));
	await test('rejects conflicting matching etp_rt rows', () => sourceError(conflictPath, 'cookies file', /conflicting/));

	const logs = [];
	const fakeConsole = Object.fromEntries(['info', 'warn', 'error'].map((method) => [method, (...args) => logs.push([method, args.map(String).join(' ')])]));
	const api = { auth: 'auth', profile: 'profile', cms_auth: 'cms', crunchyWebAuthHeader: {}, crunchyDefHeader: {} };
	const saved = [];
	let parsedArgv = {};
	const stubs = {
		'./package.json': { version: 'test' },
		'./modules/log': { console: fakeConsole },
		'./modules/module.api-urls': { domain: {}, api },
		'./modules/module.cfg-loader': { saveCRToken: (token) => saved.push(token), loadCfg: () => ({ cli: {} }), loadBinCfg: async () => ({}) },
		'./modules/module.app-args': { appArgv: () => parsedArgv },
		'./modules/module.crunchy-token': realHelper,
		'node:crypto': { randomUUID: () => 'device-id' }
	};
	const ignoredImports = new Set([
		'./modules/hls-download',
		'./modules/module.helper',
		'm3u8-parser',
		'./modules/module.fontsData',
		'./modules/module.langsData',
		'./modules/module.merger',
		'./modules/cdm',
		'./modules/module.fetch',
		'./modules/module.filename',
		'./modules/module.downloadArchive',
		'./modules/module.parseSelect',
		'./modules/module.args',
		'./modules/module.transform-mpd',
		'./modules/module.vtt2ass',
		'./@types/enums'
	]);
	function requireCrunchy(id) {
		if (id === 'path' || id === 'fs' || id === 'node:crypto') return id === 'node:crypto' ? stubs[id] : require(id);
		if (Object.hasOwn(stubs, id)) return stubs[id];
		if (ignoredImports.has(id)) return {};
		throw new Error(`Unexpected import ${id}`);
	}
	const { default: Crunchy } = compile(path.join(root, 'crunchy.ts'), requireCrunchy);
	function makeService(responses, existingCms) {
		const service = Object.create(Crunchy.prototype);
		service.token = {};
		service.cmsToken = existingCms ?? {};
		service.cfg = { cli: {} };
		service.locale = 'en-US';
		const calls = [];
		service.req = {
			getData: async (url, options) => {
				calls.push({ url, options });
				return responses[url] ?? { ok: false, res: undefined };
			}
		};
		return { service, calls };
	}
	const jsonResponse = (value) => ({ ok: true, res: { json: async () => value } });
	const successfulResponses = {
		auth: jsonResponse({ access_token: 'test-access', refresh_token: 'test-refresh', expires_in: 3600 }),
		profile: jsonResponse({ username: 'test-user', email: 'test@example.invalid' }),
		cms: jsonResponse({ cms: { bucket: '/US/index', policy: 'p', signature: 's', key_pair_id: 'k' } })
	};

	await test('actual loginWithToken sends normalized direct etp_rt and reports success', async () => {
		logs.length = 0;
		const { service, calls } = makeService(successfulResponses);
		assert.equal(await service.loginWithToken(`etp_rt=${fakeToken}`), true);
		assert.equal(calls[0].url, 'auth');
		assert.match(calls[0].options.headers.Cookie, new RegExp(`etp_rt=${fakeToken}`));
		assert.equal(calls[1].url, 'profile');
		assert.equal(calls[2].url, 'cms');
		assert(logs.some(([kind, line]) => kind === 'info' && line.includes('succeeded (direct token)')));
		assert(!logs.some(([, line]) => line.includes(fakeToken)));
	});
	await test('actual loginWithToken accepts file input and reports source', async () => {
		logs.length = 0;
		const { service, calls } = makeService(successfulResponses);
		assert.equal(await service.loginWithToken(netscapePath), true);
		assert.match(calls[0].options.headers.Cookie, new RegExp(`etp_rt=${fakeToken}`));
		assert(logs.some(([kind, line]) => kind === 'info' && line.includes('succeeded (cookies file)')));
	});
	await test('actual loginWithToken fails without profile success', async () => {
		logs.length = 0;
		const responses = { ...successfulResponses, profile: { ok: false } };
		const { service, calls } = makeService(responses);
		assert.equal(await service.loginWithToken(fakeToken), false);
		assert(!calls.some(({ url }) => url === 'cms'));
		assert(logs.some(([kind, line]) => kind === 'error' && line.includes('profile lookup failed')));
		assert(!logs.some(([, line]) => line.includes('succeeded')));
	});
	await test('actual loginWithToken fetches fresh CMS despite cached CMS and fails on CMS error', async () => {
		logs.length = 0;
		const responses = { ...successfulResponses, cms: { ok: false } };
		const { service, calls } = makeService(responses, { cms: { expires: new Date(Date.now() + 3600000).toISOString(), bucket: '/old' } });
		assert.equal(await service.loginWithToken(fakeToken), false);
		assert(calls.some(({ url }) => url === 'cms'));
		assert(logs.some(([kind, line]) => kind === 'error' && line.includes('CMS authentication failed')));
		assert(!logs.some(([, line]) => line.includes('succeeded')));
	});
	await test('actual loginWithToken labels request failure and never logs the input value', async () => {
		logs.length = 0;
		const { service } = makeService({ auth: { ok: false, res: undefined } });
		assert.equal(await service.loginWithToken(fakeToken), false);
		assert(logs.some(([kind, line]) => kind === 'error' && line.includes('direct token')));
		assert(!logs.some(([, line]) => line.includes(fakeToken)));
		assert(!logs.some(([, line]) => line.includes('succeeded')));
	});
	await test('actual cli treats an empty --token value as failed authentication', async () => {
		logs.length = 0;
		parsedArgv = { token: '', locale: 'en-US', dlFonts: false, auth: false, cmsindex: false, new: false };
		process.exitCode = undefined;
		const { service } = makeService({});
		await service.cli();
		assert.equal(process.exitCode, 1);
		assert(logs.some(([kind, line]) => kind === 'error' && line.includes('Expected a UUID-shaped')));
		process.exitCode = undefined;
	});

	output.log(`1..${passed}`);
} finally {
	fs.rmSync(work, { recursive: true, force: true });
}
