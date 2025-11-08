import { Parser } from 'binary-parser';
import { Buffer } from 'buffer';
import WRMHeader from './wrmheader';

const SYSTEM_ID = Buffer.from('9a04f07998404286ab92e65be0885f95', 'hex');

const PSSHBox = new Parser()
	.uint32('length')
	.string('pssh', { length: 4, assert: 'pssh' })
	.uint32('fullbox')
	.buffer('system_id', { length: 16 })
	.uint32('data_length')
	.buffer('data', {
		length: 'data_length'
	});

export function isPlayreadyPsshBox(data: Buffer): boolean {
	if (data.length < 28) return false;
	return data.subarray(12, 28).equals(SYSTEM_ID);
}

export class PSSH {
	public wrm_headers: string[];

	constructor(data: string | Buffer) {
		if (!data) {
			throw new Error('Data must not be empty');
		}

		if (typeof data === 'string') {
			try {
				data = Buffer.from(data, 'base64');
			} catch (e) {
				throw new Error(`Could not decode data as Base64: ${e}`);
			}
		}

		try {
			if (isPlayreadyPsshBox(data)) {
				const header = this.extractPlayreadyHeader(data);
				if (header) {
					this.wrm_headers = [header];
				} else {
					throw new Error('Invalid PlayReady Header');
				}
			} else {
				const repairedHeader = this.extractPlayreadyHeader(data);
				if (repairedHeader) {
					this.wrm_headers = [repairedHeader];
				} else {
					throw new Error('Could not extract PlayReady header from repaired data');
				}
			}
		} catch (e) {
			throw new Error(`Could not parse or repair PSSH data: ${e}`);
		}
	}

	private extractPlayreadyHeader(data: Buffer): string | null {
		try {
			const utf16Data = data.toString('utf16le');

			const wrmHeaderMatch = utf16Data.match(/<WRMHEADER[^>]*>.*<\/WRMHEADER>/i);
			if (wrmHeaderMatch && wrmHeaderMatch.length > 0) {
				return wrmHeaderMatch[0];
			}
			return null;
		} catch (e) {
			return null;
		}
	}

	public get_wrm_headers(downgrade_to_v4: boolean = false): string[] {
		return this.wrm_headers.map(downgrade_to_v4 ? this.downgradePSSH : (_) => _);
	}

	private downgradePSSH(wrm_header: string): string {
		const header = new WRMHeader(wrm_header);
		return header.to_v4_0_0_0();
	}
}
