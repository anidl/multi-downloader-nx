import fs from 'node:fs';

const etpRtPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export type CrunchyTokenInput = {
	refreshToken: string;
	source: 'direct token' | 'cookies file';
};

export class CrunchyTokenInputError extends Error {
	constructor(
		message: string,
		public readonly source: CrunchyTokenInput['source'] | 'token input'
	) {
		super(message);
		this.name = 'CrunchyTokenInputError';
	}
}

function normalizeToken(value: string): string | undefined {
	const token = value.trim().replace(/^etp_rt=/i, '');
	return etpRtPattern.test(token) ? token : undefined;
}

export function parseCrunchyTokenInput(input: string): CrunchyTokenInput {
	const value = input.trim();
	const directToken = normalizeToken(value);
	if (directToken) {
		return { refreshToken: directToken, source: 'direct token' };
	}

	if (/^etp_rt=/i.test(value)) {
		throw new CrunchyTokenInputError('Invalid etp_rt token format.', 'direct token');
	}

	let stat: fs.Stats;
	try {
		stat = fs.statSync(value);
	} catch {
		throw new CrunchyTokenInputError('Expected a UUID-shaped etp_rt token or an existing readable cookies file.', 'token input');
	}
	if (!stat.isFile()) {
		throw new CrunchyTokenInputError('Cookies file is missing, unreadable, or not a regular file.', 'cookies file');
	}

	let contents: string;
	try {
		contents = fs.readFileSync(value, 'utf8');
	} catch {
		throw new CrunchyTokenInputError('Cookies file is missing, unreadable, or not a regular file.', 'cookies file');
	}

	const rawToken = normalizeToken(contents);
	if (rawToken) {
		return { refreshToken: rawToken, source: 'cookies file' };
	}

	const matches = new Set<string>();
	let malformedRows = false;
	for (const rawLine of contents.split(/\r?\n/)) {
		let line = rawLine.trim();
		if (!line) continue;
		if (line.startsWith('#HttpOnly_')) {
			line = line.slice('#HttpOnly_'.length);
		} else if (line.startsWith('#')) {
			continue;
		}

		if (!line.includes('\t')) continue;
		const fields = line.split('\t');
		if (fields.length !== 7) {
			malformedRows = true;
			continue;
		}
		const [rawDomain, , , , , name, cookieValue] = fields;
		const domain = rawDomain.toLowerCase().replace(/^\./, '');
		if (name !== 'etp_rt' || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*crunchyroll\.com$/.test(domain)) continue;

		const token = normalizeToken(cookieValue);
		if (!token) {
			malformedRows = true;
			continue;
		}
		matches.add(token);
	}

	if (matches.size > 1) {
		throw new CrunchyTokenInputError('Cookies file contains conflicting etp_rt values for Crunchyroll.', 'cookies file');
	}
	if (matches.size === 1) {
		return { refreshToken: matches.values().next().value as string, source: 'cookies file' };
	}
	if (malformedRows) {
		throw new CrunchyTokenInputError('Cookies file contains malformed cookie rows or etp_rt values.', 'cookies file');
	}
	throw new CrunchyTokenInputError('Cookies file contains no valid Crunchyroll etp_rt value.', 'cookies file');
}
