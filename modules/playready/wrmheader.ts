import { XMLParser } from 'fast-xml-parser';

export class SignedKeyID {
  constructor(
    public alg_id: string,
    public value: string,
    public checksum?: string
  ) {}
}

export type Version = '4.0.0.0' | '4.1.0.0' | '4.2.0.0' | '4.3.0.0' | 'UNKNOWN';

export type ReturnStructure = [
  SignedKeyID[],
  string | null,
  string | null,
  string | null
];

interface ParsedWRMHeader {
  WRMHEADER: {
    '@_version': string;
    DATA?: any;
  };
}

export default class WRMHeader {
  private header: ParsedWRMHeader['WRMHEADER'];
  version: Version;

  constructor(data: string) {
    if (!data) throw new Error('Data must not be empty');

    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true,
      attributeNamePrefix: '@_',
    });
    const parsed = parser.parse(data) as ParsedWRMHeader;

    if (!parsed.WRMHEADER) throw new Error('Data is not a valid WRMHEADER');

    this.header = parsed.WRMHEADER;
    this.version = WRMHeader.fromString(this.header['@_version']);
  }

  private static fromString(value: string): Version {
    if (['4.0.0.0', '4.1.0.0', '4.2.0.0', '4.3.0.0'].includes(value)) {
      return value as Version;
    }
    return 'UNKNOWN';
  }

  to_v4_0_0_0(): string {
    const [key_ids, la_url, lui_url, ds_id] = this.readAttributes();
    if (key_ids.length === 0) throw new Error('No Key IDs available');
    const key_id = key_ids[0];
    return `<WRMHEADER xmlns="http://schemas.microsoft.com/DRM/2007/03/PlayReadyHeader" version="4.0.0.0"><DATA><PROTECTINFO><KEYLEN>16</KEYLEN><ALGID>AESCTR</ALGID></PROTECTINFO><KID>${
      key_id.value
    }</KID>${la_url ? `<LA_URL>${la_url}</LA_URL>` : ''}${
      lui_url ? `<LUI_URL>${lui_url}</LUI_URL>` : ''
    }${ds_id ? `<DS_ID>${ds_id}</DS_ID>` : ''}${
      key_id.checksum ? `<CHECKSUM>${key_id.checksum}</CHECKSUM>` : ''
    }</DATA></WRMHEADER>`;
  }

  readAttributes(): ReturnStructure {
    const data = this.header.DATA;
    if (!data)
      throw new Error(
        'Not a valid PlayReady Header Record, WRMHEADER/DATA required'
      );
    switch (this.version) {
    case '4.0.0.0':
      return WRMHeader.read_v4(data);
    case '4.1.0.0':
    case '4.2.0.0':
    case '4.3.0.0':
      return WRMHeader.read_vX(data);
    default:
      throw new Error(`Unsupported version: ${this.version}`);
    }
  }

  private static read_v4(data: any): ReturnStructure {
    const protectInfo = data.PROTECTINFO;
    return [
      [new SignedKeyID(protectInfo.ALGID, data.KID, data.CHECKSUM)],
      data.LA_URL || null,
      data.LUI_URL || null,
      data.DS_ID || null,
    ];
  }

  private static read_vX(data: any): ReturnStructure {
    const protectInfo = data.PROTECTINFO;

    const signedKeyID: SignedKeyID | undefined = protectInfo.KIDS.KID
      ? new SignedKeyID(
        protectInfo.KIDS.KID['@_ALGID'] || '',
        protectInfo.KIDS.KID['@_VALUE'],
        protectInfo.KIDS.KID['@_CHECKSUM']
      )
      : undefined;
    return [
      signedKeyID ? [signedKeyID] : [],
      data.LA_URL || null,
      data.LUI_URL || null,
      data.DS_ID || null,
    ];
  }
}
