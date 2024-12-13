import { Parser } from 'binary-parser-encoder';
import { CertificateChain } from './bcert';
import ECCKey from './ecc_key';
import * as fs from 'fs';

type RawDeviceV2 = {
  signature: string;
  version: number;
  group_certificate_length: number;
  group_certificate: Buffer;
  encryption_key: Buffer;
  signing_key: Buffer;
};

class DeviceStructs {
  static magic = 'PRD';

  static v1 = new Parser()
    .string('signature', { length: 3, assert: DeviceStructs.magic })
    .uint8('version')
    .uint32('group_key_length')
    .buffer('group_key', { length: 'group_key_length' })
    .uint32('group_certificate_length')
    .buffer('group_certificate', { length: 'group_certificate_length' });

  static v2 = new Parser()
    .string('signature', { length: 3, assert: DeviceStructs.magic })
    .uint8('version')
    .uint32('group_certificate_length')
    .buffer('group_certificate', { length: 'group_certificate_length' })
    .buffer('encryption_key', { length: 96 })
    .buffer('signing_key', { length: 96 });

  static v3 = new Parser()
    .string('signature', { length: 3, assert: DeviceStructs.magic })
    .uint8('version')
    .buffer('group_key', { length: 96 })
    .buffer('encryption_key', { length: 96 })
    .buffer('signing_key', { length: 96 })
    .uint32('group_certificate_length')
    .buffer('group_certificate', { length: 'group_certificate_length' });
}

export class Device {
  static CURRENT_STRUCT = DeviceStructs.v3;

  group_certificate: CertificateChain;
  encryption_key: ECCKey;
  signing_key: ECCKey;
  security_level: number;

  constructor(parsedData: RawDeviceV2) {
    this.group_certificate = CertificateChain.loads(
      parsedData.group_certificate
    );
    this.encryption_key = ECCKey.loads(parsedData.encryption_key);
    this.signing_key = ECCKey.loads(parsedData.signing_key);
    this.security_level = this.group_certificate.get_security_level();
  }

  static loads(data: Buffer): Device {
    const parsedData = Device.CURRENT_STRUCT.parse(data);
    return new Device(parsedData);
  }

  static load(filePath: string): Device {
    const data = fs.readFileSync(filePath);
    return Device.loads(data);
  }

  dumps(): Buffer {
    const groupCertBytes = this.group_certificate.dumps();
    const encryptionKeyBytes = this.encryption_key.dumps();
    const signingKeyBytes = this.signing_key.dumps();

    const buildData = {
      signature: DeviceStructs.magic,
      version: 2,
      group_certificate_length: groupCertBytes.length,
      group_certificate: groupCertBytes,
      encryption_key: encryptionKeyBytes,
      signing_key: signingKeyBytes,
    };

    return Device.CURRENT_STRUCT.encode(buildData);
  }

  dump(filePath: string): void {
    const data = this.dumps();
    fs.writeFileSync(filePath, data);
  }

  get_name(): string {
    const name = `${this.group_certificate.get_name()}_sl${
      this.security_level
    }`;
    return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }
}

// Device V2 disabled because unstable provisioning
// export class Device {
//     group_certificate: CertificateChain
//     encryption_key: ECCKey
//     signing_key: ECCKey
//     security_level: number

//     constructor(group_certificate: Buffer, group_key: Buffer) {
// this.group_certificate = CertificateChain.loads(group_certificate)

// this.encryption_key = ECCKey.generate()
// this.signing_key = ECCKey.generate()

// this.security_level = this.group_certificate.get_security_level()

// const new_certificate = Certificate.new_key_cert(
//     randomBytes(16),
//     this.group_certificate.get_security_level(),
//     randomBytes(16),
//     this.signing_key,
//     this.encryption_key,
//     ECCKey.loads(group_key),
//     this.group_certificate
// )

// this.group_certificate.prepend(new_certificate)
//     }
// }
