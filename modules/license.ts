//Originaly from https://github.com/Frooastside/node-widevine/blob/main/src/license.ts

import crypto from 'crypto';
import Long from 'long';
import { AES_CMAC } from './cmac';
import {
  ClientIdentification,
  License,
  LicenseRequest,
  LicenseRequest_RequestType,
  LicenseType,
  ProtocolVersion,
  SignedMessage,
  SignedMessage_MessageType,
  SignedMessage_SessionKeyType,
  WidevinePsshData
} from './license_protocol';

const WIDEVINE_SYSTEM_ID = new Uint8Array([237, 239, 139, 169, 121, 214, 74, 206, 163, 200, 39, 220, 213, 29, 33, 237]);

export type KeyContainer = {
  kid: string;
  key: string;
};

export type ContentDecryptionModule = {
  privateKey: Buffer;
  identifierBlob: Buffer;
};

export class Session {
  private _devicePrivateKey: crypto.KeyObject;
  private _identifierBlob: ClientIdentification;
  private _identifier: Buffer;
  private _pssh: Buffer;
  private _rawLicenseRequest?: Buffer;

  constructor(contentDecryptionModule: ContentDecryptionModule, pssh: Buffer) {
    this._devicePrivateKey = crypto.createPrivateKey(contentDecryptionModule.privateKey);
    this._identifierBlob = ClientIdentification.decode(contentDecryptionModule.identifierBlob);
    this._identifier = this._generateIdentifier();
    this._pssh = pssh;
  }

  createLicenseRequest(): Buffer {
    if (!this._pssh.subarray(12, 28).equals(Buffer.from(WIDEVINE_SYSTEM_ID))) {
      throw new Error('the pssh is not an actuall pssh');
    }
    const pssh = this._parsePSSH(this._pssh);
    if (!pssh) {
      throw new Error('pssh is invalid');
    }

    const licenseRequest: LicenseRequest = {
      type: LicenseRequest_RequestType.NEW,
      clientId: this._identifierBlob,
      contentId: {
        widevinePsshData: {
          psshData: [this._pssh.subarray(32)],
          licenseType: LicenseType.STREAMING,
          requestId: this._identifier
        }
      },
      requestTime: Long.fromNumber(Date.now()).divide(1000),
      protocolVersion: ProtocolVersion.VERSION_2_1,
      keyControlNonce: crypto.randomInt(2 ** 31),
      keyControlNonceDeprecated: Buffer.alloc(0),
      encryptedClientId: undefined
    };

    this._rawLicenseRequest = Buffer.from(LicenseRequest.encode(licenseRequest).finish());

    const signature = crypto
      .createSign('sha1')
      .update(this._rawLicenseRequest)
      .sign({ key: this._devicePrivateKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: 20 });

    const signedLicenseRequest: SignedMessage = {
      type: SignedMessage_MessageType.LICENSE_REQUEST,
      msg: this._rawLicenseRequest,
      signature: Buffer.from(signature),
      sessionKey: Buffer.alloc(0),
      remoteAttestation: Buffer.alloc(0),
      metricData: [],
      serviceVersionInfo: undefined,
      sessionKeyType: SignedMessage_SessionKeyType.UNDEFINED,
      oemcryptoCoreMessage: Buffer.alloc(0)
    };

    return Buffer.from(SignedMessage.encode(signedLicenseRequest).finish());
  }

  parseLicense(rawLicense: Buffer) {
    if (!this._rawLicenseRequest) {
      throw new Error('please request a license first');
    }
    const signedLicense = SignedMessage.decode(rawLicense);
    const sessionKey = crypto.privateDecrypt(this._devicePrivateKey, signedLicense.sessionKey);

    const cmac = new AES_CMAC(Buffer.from(sessionKey));

    const encKeyBase = Buffer.concat([
      Buffer.from('ENCRYPTION'),
      Buffer.from('\x00', 'ascii'),
      this._rawLicenseRequest,
      Buffer.from('\x00\x00\x00\x80', 'ascii')
    ]);
    const authKeyBase = Buffer.concat([
      Buffer.from('AUTHENTICATION'),
      Buffer.from('\x00', 'ascii'),
      this._rawLicenseRequest,
      Buffer.from('\x00\x00\x02\x00', 'ascii')
    ]);

    const encKey = cmac.calculate(Buffer.concat([Buffer.from('\x01'), encKeyBase]));
    const serverKey = Buffer.concat([
      cmac.calculate(Buffer.concat([Buffer.from('\x01'), authKeyBase])),
      cmac.calculate(Buffer.concat([Buffer.from('\x02'), authKeyBase]))
    ]);
    /*const clientKey = Buffer.concat([
      cmac.calculate(Buffer.concat([Buffer.from("\x03"), authKeyBase])),
      cmac.calculate(Buffer.concat([Buffer.from("\x04"), authKeyBase]))
    ]);*/

    const calculatedSignature = crypto.createHmac('sha256', serverKey).update(signedLicense.msg).digest();

    if (!calculatedSignature.equals(signedLicense.signature)) {
      throw new Error('signatures do not match');
    }

    const license = License.decode(signedLicense.msg);

    return license.key.map((keyContainer) => {
      const keyId = keyContainer.id.length ? keyContainer.id.toString('hex') : keyContainer.type.toString();
      const decipher = crypto.createDecipheriv(`aes-${encKey.length * 8}-cbc`, encKey, keyContainer.iv);
      const decryptedKey = decipher.update(keyContainer.key);
      decipher.destroy();
      const key: KeyContainer = {
        kid: keyId,
        key: decryptedKey.toString('hex')
      };
      return key;
    });
  }

  private _parsePSSH(pssh: Buffer): WidevinePsshData | null {
    try {
      return WidevinePsshData.decode(pssh.subarray(32));
    } catch {
      return null;
    }
  }

  private _generateIdentifier(): Buffer {
    return Buffer.from(`${crypto.randomBytes(8).toString('hex')}${'01'}${'00000000000000'}`);
  }

  get pssh(): Buffer {
    return this._pssh;
  }
}