import { Parser } from 'binary-parser';

type ParsedLicense = {
  version: number;
  rights: string;
  length: number;
  license: {
    length: number;
    signature?: {
      length: number;
      type: string;
      value: string;
    };
    global_container?: {
      revocationInfo?: {
        version: number;
      };
      securityLevel?: {
        level: number;
      };
    };
    keyMaterial?: {
      contentKey?: {
        kid: string;
        keyType: number;
        ciphertype: number;
        length: number;
        value: Buffer;
      };
      encryptionKey?: {
        curve: number;
        length: number;
        value: string;
      };
      auxKeys?: {
        count: number;
        value: {
          location: number;
          value: string;
        };
      };
    };
  };
};

export class XMRLicenseStructsV2 {
  static CONTENT_KEY = new Parser()
    .buffer('kid', { length: 16 })
    .uint16('keytype')
    .uint16('ciphertype')
    .uint16('length')
    .buffer('value', {
      length: 'length',
    });

  static ECC_KEY = new Parser()
    .uint16('curve')
    .uint16('length')
    .buffer('value', {
      length: 'length',
    });

  static FTLV = new Parser()
    .uint16('flags')
    .uint16('type')
    .uint32('length')
    .buffer('value', {
      length: function () {
        return (this as any).length - 8;
      },
    });

  static AUXILIARY_LOCATIONS = new Parser()
    .uint32('location')
    .buffer('value', { length: 16 });

  static AUXILIARY_KEY_OBJECT = new Parser()
    .uint16('count')
    .array('locations', {
      length: 'count',
      type: XMRLicenseStructsV2.AUXILIARY_LOCATIONS,
    });

  static SIGNATURE = new Parser()
    .uint16('type')
    .uint16('siglength')
    .buffer('signature', {
      length: 'siglength',
    });

  static XMR = new Parser()
    .string('constant', { length: 4, assert: 'XMR\x00' })
    .int32('version')
    .buffer('rightsid', { length: 16 })
    .nest('data', {
      type: XMRLicenseStructsV2.FTLV,
    });
}

enum XMRTYPE {
  XMR_OUTER_CONTAINER = 0x0001,
  XMR_GLOBAL_POLICY_CONTAINER = 0x0002,
  XMR_PLAYBACK_POLICY_CONTAINER = 0x0004,
  XMR_KEY_MATERIAL_CONTAINER = 0x0009,
  XMR_RIGHTS_SETTINGS = 0x000d,
  XMR_EMBEDDED_LICENSE_SETTINGS = 0x0033,
  XMR_REVOCATION_INFORMATION_VERSION = 0x0032,
  XMR_SECURITY_LEVEL = 0x0034,
  XMR_CONTENT_KEY_OBJECT = 0x000a,
  XMR_ECC_KEY_OBJECT = 0x002a,
  XMR_SIGNATURE_OBJECT = 0x000b,
  XMR_OUTPUT_LEVEL_RESTRICTION = 0x0005,
  XMR_AUXILIARY_KEY_OBJECT = 0x0051,
  XMR_EXPIRATION_RESTRICTION = 0x0012,
  XMR_ISSUE_DATE = 0x0013,
  XMR_EXPLICIT_ANALOG_CONTAINER = 0x0007,
}

export class XmrUtil {
  public data: Buffer;
  public license: ParsedLicense;

  constructor(data: Buffer, license: ParsedLicense) {
    this.data = data;
    this.license = license;
  }

  static parse(license: Buffer) {
    const xmr = XMRLicenseStructsV2.XMR.parse(license);

    const parsed_license: ParsedLicense = {
      version: xmr.version,
      rights: Buffer.from(xmr.rightsid).toString('hex'),
      length: license.length,
      license: {
        length: xmr.data.length,
      },
    };
    const container = parsed_license.license;
    const data = xmr.data;

    let pos = 0;
    while (pos < data.length - 16) {
      const value = XMRLicenseStructsV2.FTLV.parse(data.value.slice(pos));

      // XMR_SIGNATURE_OBJECT
      if (value.type === XMRTYPE.XMR_SIGNATURE_OBJECT) {
        const signature = XMRLicenseStructsV2.SIGNATURE.parse(value.value);

        container.signature = {
          length: value.length,
          type: signature.type,
          value: Buffer.from(signature.signature).toString('hex'),
        };
      }

      // XMRTYPE.XMR_GLOBAL_POLICY_CONTAINER
      if (value.type === XMRTYPE.XMR_GLOBAL_POLICY_CONTAINER) {
        container.global_container = {};

        let index = 0;
        while (index < value.length - 16) {
          const data = XMRLicenseStructsV2.FTLV.parse(value.value.slice(index));

          // XMRTYPE.XMR_REVOCATION_INFORMATION_VERSION
          if (data.type === XMRTYPE.XMR_REVOCATION_INFORMATION_VERSION) {
            container.global_container.revocationInfo = {
              version: data.value.readUInt32BE(0),
            };
          }

          // XMRTYPE.XMR_SECURITY_LEVEL
          if (data.type === XMRTYPE.XMR_SECURITY_LEVEL) {
            container.global_container.securityLevel = {
              level: data.value.readUInt16BE(0),
            };
          }

          index += data.length;
        }
      }

      // XMRTYPE.XMR_KEY_MATERIAL_CONTAINER
      if (value.type === XMRTYPE.XMR_KEY_MATERIAL_CONTAINER) {
        container.keyMaterial = {};

        let index = 0;
        while (index < value.length - 16) {
          const data = XMRLicenseStructsV2.FTLV.parse(value.value.slice(index));

          // XMRTYPE.XMR_CONTENT_KEY_OBJECT
          if (data.type === XMRTYPE.XMR_CONTENT_KEY_OBJECT) {
            const content_key = XMRLicenseStructsV2.CONTENT_KEY.parse(
              data.value
            );

            container.keyMaterial.contentKey = {
              kid: XmrUtil.fixUUID(content_key.kid).toString('hex'),
              keyType: content_key.keytype,
              ciphertype: content_key.ciphertype,
              length: content_key.length,
              value: content_key.value,
            };
          }

          // XMRTYPE.XMR_ECC_KEY_OBJECT
          if (data.type === XMRTYPE.XMR_ECC_KEY_OBJECT) {
            const ecc_key = XMRLicenseStructsV2.ECC_KEY.parse(data.value);

            container.keyMaterial.encryptionKey = {
              curve: ecc_key.curve,
              length: ecc_key.length,
              value: Buffer.from(ecc_key.value).toString('hex'),
            };
          }

          // XMRTYPE.XMR_AUXILIARY_KEY_OBJECT
          if (data.type === XMRTYPE.XMR_AUXILIARY_KEY_OBJECT) {
            const aux_keys = XMRLicenseStructsV2.AUXILIARY_KEY_OBJECT.parse(
              data.value
            );

            container.keyMaterial.auxKeys = {
              count: aux_keys.count,
              value: aux_keys.locations.map((a: any) => {
                return {
                  location: a.location,
                  value: Buffer.from(a.value).toString('hex'),
                };
              }),
            };
          }
          index += data.length;
        }
      }

      pos += value.length;
    }

    return new XmrUtil(license, parsed_license);
  }

  static fixUUID(data: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from(data.subarray(0, 4).reverse()),
      Buffer.from(data.subarray(4, 6).reverse()),
      Buffer.from(data.subarray(6, 8).reverse()),
      data.subarray(8, 16),
    ]);
  }
}
