import * as fs from 'fs';
import { createHash } from 'crypto';
import { Parser } from 'binary-parser-encoder';
import ECCKey from './ecc_key';
import { console } from '../log';

function alignUp(length: number, alignment: number): number {
  return Math.ceil(length / alignment) * alignment;
}

export class BCertStructs {
  static DrmBCertBasicInfo = new Parser()
    .buffer('cert_id', { length: 16 })
    .uint32be('security_level')
    .uint32be('flags')
    .uint32be('cert_type')
    .buffer('public_key_digest', { length: 32 })
    .uint32be('expiration_date')
    .buffer('client_id', { length: 16 });

  static DrmBCertDomainInfo = new Parser()
    .buffer('service_id', { length: 16 })
    .buffer('account_id', { length: 16 })
    .uint32be('revision_timestamp')
    .uint32be('domain_url_length')
    .buffer('domain_url', {
      length: function () {
        return alignUp((this as any).domain_url_length, 4);
      },
    });

  static DrmBCertPCInfo = new Parser().uint32be('security_version');

  static DrmBCertDeviceInfo = new Parser()
    .uint32be('max_license')
    .uint32be('max_header')
    .uint32be('max_chain_depth');

  static DrmBCertFeatureInfo = new Parser()
    .uint32be('feature_count')
    .array('features', {
      type: 'uint32be',
      length: 'feature_count',
    });

  static CertKey = new Parser()
    .uint16be('type')
    .uint16be('length')
    .uint32be('flags')
    .buffer('key', {
      length: function () {
        return (this as any).length / 8;
      },
    })
    .uint32be('usages_count')
    .array('usages', {
      type: 'uint32be',
      length: 'usages_count',
    });

  static DrmBCertKeyInfo = new Parser()
    .uint32be('key_count')
    .array('cert_keys', {
      type: BCertStructs.CertKey,
      length: 'key_count',
    });

  static DrmBCertManufacturerInfo = new Parser()
    .uint32be('flags')
    .uint32be('manufacturer_name_length')
    .buffer('manufacturer_name', {
      length: function () {
        return alignUp((this as any).manufacturer_name_length, 4);
      },
    })
    .uint32be('model_name_length')
    .buffer('model_name', {
      length: function () {
        return alignUp((this as any).model_name_length, 4);
      },
    })
    .uint32be('model_number_length')
    .buffer('model_number', {
      length: function () {
        return alignUp((this as any).model_number_length, 4);
      },
    });

  static DrmBCertSignatureInfo = new Parser()
    .uint16be('signature_type')
    .uint16be('signature_size')
    .buffer('signature', { length: 'signature_size' })
    .uint32be('signature_key_size')
    .buffer('signature_key', {
      length: function () {
        return (this as any).signature_key_size / 8;
      },
    });

  static DrmBCertSilverlightInfo = new Parser()
    .uint32be('security_version')
    .uint32be('platform_identifier');

  static DrmBCertMeteringInfo = new Parser()
    .buffer('metering_id', { length: 16 })
    .uint32be('metering_url_length')
    .buffer('metering_url', {
      length: function () {
        return alignUp((this as any).metering_url_length, 4);
      },
    });

  static DrmBCertExtDataSignKeyInfo = new Parser()
    .uint16be('key_type')
    .uint16be('key_length')
    .uint32be('flags')
    .buffer('key', {
      length: function () {
        return (this as any).length / 8;
      },
    });

  static BCertExtDataRecord = new Parser()
    .uint32be('data_size')
    .buffer('data', {
      length: 'data_size',
    });

  static DrmBCertExtDataSignature = new Parser()
    .uint16be('signature_type')
    .uint16be('signature_size')
    .buffer('signature', {
      length: 'signature_size',
    });

  static BCertExtDataContainer = new Parser()
    .uint32be('record_count')
    .array('records', {
      length: 'record_count',
      type: BCertStructs.BCertExtDataRecord,
    })
    .nest('signature', {
      type: BCertStructs.DrmBCertExtDataSignature,
    });

  static DrmBCertServerInfo = new Parser().uint32be('warning_days');

  static DrmBcertSecurityVersion = new Parser()
    .uint32be('security_version')
    .uint32be('platform_identifier');

  static Attribute = new Parser()
    .uint16be('flags')
    .uint16be('tag')
    .uint32be('length')
    .choice('attribute', {
      tag: 'tag',
      choices: {
        1: BCertStructs.DrmBCertBasicInfo,
        2: BCertStructs.DrmBCertDomainInfo,
        3: BCertStructs.DrmBCertPCInfo,
        4: BCertStructs.DrmBCertDeviceInfo,
        5: BCertStructs.DrmBCertFeatureInfo,
        6: BCertStructs.DrmBCertKeyInfo,
        7: BCertStructs.DrmBCertManufacturerInfo,
        8: BCertStructs.DrmBCertSignatureInfo,
        9: BCertStructs.DrmBCertSilverlightInfo,
        10: BCertStructs.DrmBCertMeteringInfo,
        11: BCertStructs.DrmBCertExtDataSignKeyInfo,
        12: BCertStructs.BCertExtDataContainer,
        13: BCertStructs.DrmBCertExtDataSignature,
        14: new Parser().buffer('data', {
          length: function () {
            return (this as any).length - 8;
          },
        }),
        15: BCertStructs.DrmBCertServerInfo,
        16: BCertStructs.DrmBcertSecurityVersion,
        17: BCertStructs.DrmBcertSecurityVersion,
      },
      defaultChoice: new Parser().buffer('data', {
        length: function () {
          return (this as any).length - 8;
        },
      }),
    });

  static BCert = new Parser()
    .string('signature', { length: 4, assert: 'CERT' })
    .int32be('version')
    .int32be('total_length')
    .int32be('certificate_length')
    .array('attributes', {
      type: BCertStructs.Attribute,
      lengthInBytes: function () {
        return (this as any).total_length - 16;
      },
    });

  static BCertChain = new Parser()
    .string('signature', { length: 4, assert: 'CHAI' })
    .int32be('version')
    .int32be('total_length')
    .int32be('flags')
    .int32be('certificate_count')
    .array('certificates', {
      type: BCertStructs.BCert,
      length: 'certificate_count',
    });
}

export class Certificate {
  parsed: any;
  _BCERT: Parser;

  constructor(parsed_bcert: any, bcert_obj: Parser = BCertStructs.BCert) {
    this.parsed = parsed_bcert;
    this._BCERT = bcert_obj;
  }

  // UNSTABLE
  static new_leaf_cert(
    cert_id: Buffer,
    security_level: number,
    client_id: Buffer,
    signing_key: ECCKey,
    encryption_key: ECCKey,
    group_key: ECCKey,
    parent: CertificateChain,
    expiry: number = 0xffffffff,
    max_license: number = 10240,
    max_header: number = 15360,
    max_chain_depth: number = 2
  ): Certificate {
    const basic_info = {
      cert_id: cert_id,
      security_level: security_level,
      flags: 0,
      cert_type: 2,
      public_key_digest: signing_key.publicSha256Digest(),
      expiration_date: expiry,
      client_id: client_id,
    };
    const basic_info_attribute = {
      flags: 1,
      tag: 1,
      length: BCertStructs.DrmBCertBasicInfo.encode(basic_info).length + 8,
      attribute: basic_info,
    };

    const device_info = {
      max_license: max_license,
      max_header: max_header,
      max_chain_depth: max_chain_depth,
    };

    const device_info_attribute = {
      flags: 1,
      tag: 4,
      length: BCertStructs.DrmBCertDeviceInfo.encode(device_info).length + 8,
      attribute: device_info,
    };

    const feature = {
      feature_count: 3,
      features: [4, 9, 13],
    };
    const feature_attribute = {
      flags: 1,
      tag: 5,
      length: BCertStructs.DrmBCertFeatureInfo.encode(feature).length + 8,
      attribute: feature,
    };

    const cert_key_sign = {
      type: 1,
      length: 512, // bits
      flags: 0,
      key: signing_key.privateBytes(),
      usages_count: 1,
      usages: [1],
    };
    const cert_key_encrypt = {
      type: 1,
      length: 512, // bits
      flags: 0,
      key: encryption_key.privateBytes(),
      usages_count: 1,
      usages: [2],
    };
    const key_info = {
      key_count: 2,
      cert_keys: [cert_key_sign, cert_key_encrypt],
    };
    const key_info_attribute = {
      flags: 1,
      tag: 6,
      length: BCertStructs.DrmBCertKeyInfo.encode(key_info).length + 8,
      attribute: key_info,
    };

    const manufacturer_info = parent.get_certificate(0).get_attribute(7);

    const new_bcert_container = {
      signature: 'CERT',
      version: 1,
      total_length: 0,
      certificate_length: 0,
      attributes: [
        basic_info_attribute,
        device_info_attribute,
        feature_attribute,
        key_info_attribute,
        manufacturer_info,
      ],
    };

    let payload = BCertStructs.BCert.encode(new_bcert_container);
    new_bcert_container.certificate_length = payload.length;
    new_bcert_container.total_length = payload.length + 144;
    payload = BCertStructs.BCert.encode(new_bcert_container);

    const hash = createHash('sha256');
    hash.update(payload);
    const digest = hash.digest();

    const signatureObj = group_key.keyPair.sign(digest);
    const r = Buffer.from(signatureObj.r.toArray('be', 32));
    const s = Buffer.from(signatureObj.s.toArray('be', 32));
    const signature = Buffer.concat([r, s]);

    const signature_info = {
      signature_type: 1,
      signature_size: 64,
      signature: signature,
      signature_key_size: 512, // bits
      signature_key: group_key.publicBytes(),
    };
    const signature_info_attribute = {
      flags: 1,
      tag: 8,
      length:
        BCertStructs.DrmBCertSignatureInfo.encode(signature_info).length + 8,
      attribute: signature_info,
    };
    new_bcert_container.attributes.push(signature_info_attribute);

    return new Certificate(new_bcert_container);
  }

  static loads(data: string | Buffer): Certificate {
    if (typeof data === 'string') {
      data = Buffer.from(data, 'base64');
    }
    if (!Buffer.isBuffer(data)) {
      throw new Error(`Expecting Bytes or Base64 input, got ${data}`);
    }

    const cert = BCertStructs.BCert;
    const parsed_bcert = cert.parse(data);
    return new Certificate(parsed_bcert, cert);
  }

  static load(filePath: string): Certificate {
    const data = fs.readFileSync(filePath);
    return Certificate.loads(data);
  }

  get_attribute(type_: number) {
    for (const attribute of this.parsed.attributes) {
      if (attribute.tag === type_) {
        return attribute;
      }
    }
  }

  get_security_level(): number {
    const basic_info_attribute = this.get_attribute(1);
    if (basic_info_attribute) {
      return basic_info_attribute.attribute.security_level;
    }
    return 0;
  }

  private static _unpad(name: Buffer): string {
    return name.toString('utf8').replace(/\0+$/, '');
  }

  get_name(): string {
    const manufacturer_info_attribute = this.get_attribute(7);
    if (manufacturer_info_attribute) {
      const manufacturer_info = manufacturer_info_attribute.attribute;
      const manufacturer_name = Certificate._unpad(
        manufacturer_info.manufacturer_name
      );
      const model_name = Certificate._unpad(manufacturer_info.model_name);
      const model_number = Certificate._unpad(manufacturer_info.model_number);
      return `${manufacturer_name} ${model_name} ${model_number}`;
    }
    return '';
  }

  dumps(): Buffer {
    return this._BCERT.encode(this.parsed);
  }

  struct(): Parser {
    return this._BCERT;
  }
}

export class CertificateChain {
  parsed: any;
  _BCERT_CHAIN: Parser;

  constructor(
    parsed_bcert_chain: any,
    bcert_chain_obj: Parser = BCertStructs.BCertChain
  ) {
    this.parsed = parsed_bcert_chain;
    this._BCERT_CHAIN = bcert_chain_obj;
  }

  static loads(data: string | Buffer): CertificateChain {
    if (typeof data === 'string') {
      data = Buffer.from(data, 'base64');
    }
    if (!Buffer.isBuffer(data)) {
      throw new Error(`Expecting Bytes or Base64 input, got ${data}`);
    }

    const cert_chain = BCertStructs.BCertChain;
    try {
      const parsed_bcert_chain = cert_chain.parse(data);
      return new CertificateChain(parsed_bcert_chain, cert_chain);
    } catch (error) {
      console.error('Error during parsing:', error);
      throw error;
    }
  }

  static load(filePath: string): CertificateChain {
    const data = fs.readFileSync(filePath);
    return CertificateChain.loads(data);
  }

  dumps(): Buffer {
    return this._BCERT_CHAIN.encode(this.parsed);
  }

  struct(): Parser {
    return this._BCERT_CHAIN;
  }

  get_certificate(index: number): Certificate {
    return new Certificate(this.parsed.certificates[index]);
  }

  get_security_level(): number {
    return this.get_certificate(0).get_security_level();
  }

  get_name(): string {
    return this.get_certificate(0).get_name();
  }

  append(bcert: Certificate): void {
    this.parsed.certificate_count += 1;
    this.parsed.certificates.push(bcert.parsed);
    this.parsed.total_length += bcert.dumps().length;
  }

  prepend(bcert: Certificate): void {
    this.parsed.certificate_count += 1;
    this.parsed.certificates.unshift(bcert.parsed);
    this.parsed.total_length += bcert.dumps().length;
  }
}
