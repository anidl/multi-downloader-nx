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
    length: 'data_length',
  });

const PlayreadyObject = new Parser()
  .useContextVars()
  .uint16('type')
  .uint16('length')
  .choice('data', {
    tag: 'type',
    choices: {
      1: new Parser().string('data', {
        length: function () {
          return (this as any).$parent.length;
        },
        encoding: 'utf16le',
      }),
    },
    defaultChoice: new Parser().buffer('data', {
      length: function () {
        return (this as any).$parent.length;
      },
    }),
  });

const PlayreadyHeader = new Parser()
  .uint32('length')
  .uint16('record_count')
  .array('records', {
    length: 'record_count',
    type: PlayreadyObject,
  });

function isPlayreadyPsshBox(data: Buffer): boolean {
  if (data.length < 28) return false;
  return data.subarray(12, 28).equals(SYSTEM_ID);
}

function isUtf16(data: Buffer): boolean {
  for (let i = 1; i < data.length; i += 2) {
    if (data[i] !== 0) {
      return false;
    }
  }
  return true;
}

function* getWrmHeaders(wrm_header: any): IterableIterator<string> {
  for (const record of wrm_header.records) {
    if (record.type === 1 && typeof record.data === 'string') {
      yield record.data;
    }
  }
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
        const pssh_box = PSSHBox.parse(data);
        const psshData = pssh_box.data;

        if (isUtf16(psshData)) {
          this.wrm_headers = [psshData.toString('utf16le')];
        } else if (isUtf16(psshData.subarray(6))) {
          this.wrm_headers = [psshData.subarray(6).toString('utf16le')];
        } else if (isUtf16(psshData.subarray(10))) {
          this.wrm_headers = [psshData.subarray(10).toString('utf16le')];
        } else {
          const playready_header = PlayreadyHeader.parse(psshData);
          this.wrm_headers = Array.from(getWrmHeaders(playready_header));
        }
      } else {
        if (isUtf16(data)) {
          this.wrm_headers = [data.toString('utf16le')];
        } else if (isUtf16(data.subarray(6))) {
          this.wrm_headers = [data.subarray(6).toString('utf16le')];
        } else if (isUtf16(data.subarray(10))) {
          this.wrm_headers = [data.subarray(10).toString('utf16le')];
        } else {
          const playready_header = PlayreadyHeader.parse(data);
          this.wrm_headers = Array.from(getWrmHeaders(playready_header));
        }
      }
    } catch (e) {
      throw new Error(
        'Could not parse data as a PSSH Box nor a PlayReadyHeader'
      );
    }
  }

  // Header downgrade
  public get_wrm_headers(downgrade_to_v4: boolean = false): string[] {
    return this.wrm_headers.map(
      downgrade_to_v4 ? this.downgradePSSH : (_) => _
    );
  }

  private downgradePSSH(wrm_header: string): string {
    const header = new WRMHeader(wrm_header);
    return header.to_v4_0_0_0();
  }
}
