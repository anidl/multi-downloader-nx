import { CertificateChain } from './bcert';
import ECCKey from './ecc_key';
import ElGamal, { Point } from './elgamal';
import XmlKey from './xml_key';
import { Key } from './key';
import { XmrUtil } from './xmrlicense';
import crypto from 'crypto';
import { randomBytes } from 'crypto';
import { createHash } from 'crypto';
import elliptic from 'elliptic';
import { Device } from './device';
import { XMLParser } from 'fast-xml-parser';

export default class Cdm {
  security_level: number;
  certificate_chain: CertificateChain;
  encryption_key: ECCKey;
  signing_key: ECCKey;
  client_version: string;
  la_version: number;

  curve: elliptic.ec;
  elgamal: ElGamal;

  private wmrm_key: elliptic.ec.KeyPair;
  private xml_key: XmlKey;

  constructor(
    security_level: number,
    certificate_chain: CertificateChain,
    encryption_key: ECCKey,
    signing_key: ECCKey,
    client_version: string = '2.4.117.27',
    la_version: number = 1
  ) {
    this.security_level = security_level;
    this.certificate_chain = certificate_chain;
    this.encryption_key = encryption_key;
    this.signing_key = signing_key;
    this.client_version = client_version;
    this.la_version = la_version;

    this.curve = new elliptic.ec('p256');
    this.elgamal = new ElGamal(this.curve);

    const x =
      'c8b6af16ee941aadaa5389b4af2c10e356be42af175ef3face93254e7b0b3d9b';
    const y =
      '982b27b5cb2341326e56aa857dbfd5c634ce2cf9ea74fca8f2af5957efeea562';
    this.wmrm_key = this.curve.keyFromPublic({ x, y }, 'hex');
    this.xml_key = new XmlKey();
  }

  static fromDevice(device: Device): Cdm {
    return new Cdm(
      device.security_level,
      device.group_certificate,
      device.encryption_key,
      device.signing_key
    );
  }

  private getKeyData(): Buffer {
    const messagePoint = this.xml_key.getPoint(this.elgamal.curve);
    const [point1, point2] = this.elgamal.encrypt(
      messagePoint,
      this.wmrm_key.getPublic() as Point
    );

    const bufferArray = Buffer.concat([
      ElGamal.toBytes(point1.getX()),
      ElGamal.toBytes(point1.getY()),
      ElGamal.toBytes(point2.getX()),
      ElGamal.toBytes(point2.getY()),
    ]);

    return bufferArray;
  }

  private getCipherData(): Buffer {
    const b64_chain = this.certificate_chain.dumps().toString('base64');
    const body = `<Data><CertificateChains><CertificateChain>${b64_chain}</CertificateChain></CertificateChains><Features><Feature Name="AESCBC"></Feature></Features></Data>`;

    const cipher = crypto.createCipheriv(
      'aes-128-cbc',
      this.xml_key.aesKey,
      this.xml_key.aesIv
    );

    const ciphertext = Buffer.concat([
      cipher.update(Buffer.from(body, 'utf-8')),
      cipher.final(),
    ]);

    return Buffer.concat([this.xml_key.aesIv, ciphertext]);
  }

  private buildDigestContent(
    content_header: string,
    nonce: string,
    wmrm_cipher: string,
    cert_cipher: string
  ): string {
    const clientTime = Math.floor(Date.now() / 1000);

    return (
      '<LA xmlns="http://schemas.microsoft.com/DRM/2007/03/protocols" Id="SignedData" xml:space="preserve">' +
      '<Version>4</Version>' +
      `<ContentHeader>${content_header}</ContentHeader>` +
      '<CLIENTINFO>' +
      `<CLIENTVERSION>${this.client_version}</CLIENTVERSION>` +
      '</CLIENTINFO>' +
      `<LicenseNonce>${nonce}</LicenseNonce>` +
      `<ClientTime>${clientTime}</ClientTime>` +
      '<EncryptedData xmlns="http://www.w3.org/2001/04/xmlenc#" Type="http://www.w3.org/2001/04/xmlenc#Element">' +
      '<EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes128-cbc"></EncryptionMethod>' +
      '<KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">' +
      '<EncryptedKey xmlns="http://www.w3.org/2001/04/xmlenc#">' +
      '<EncryptionMethod Algorithm="http://schemas.microsoft.com/DRM/2007/03/protocols#ecc256"></EncryptionMethod>' +
      '<KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">' +
      '<KeyName>WMRMServer</KeyName>' +
      '</KeyInfo>' +
      '<CipherData>' +
      `<CipherValue>${wmrm_cipher}</CipherValue>` +
      '</CipherData>' +
      '</EncryptedKey>' +
      '</KeyInfo>' +
      '<CipherData>' +
      `<CipherValue>${cert_cipher}</CipherValue>` +
      '</CipherData>' +
      '</EncryptedData>' +
      '</LA>'
    );
  }

  private static buildSignedInfo(digest_value: string): string {
    return (
      '<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">' +
      '<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod>' +
      '<SignatureMethod Algorithm="http://schemas.microsoft.com/DRM/2007/03/protocols#ecdsa-sha256"></SignatureMethod>' +
      '<Reference URI="#SignedData">' +
      '<DigestMethod Algorithm="http://schemas.microsoft.com/DRM/2007/03/protocols#sha256"></DigestMethod>' +
      `<DigestValue>${digest_value}</DigestValue>` +
      '</Reference>' +
      '</SignedInfo>'
    );
  }

  getLicenseChallenge(content_header: string): string {
    const nonce = randomBytes(16).toString('base64');
    const wmrm_cipher = this.getKeyData().toString('base64');
    const cert_cipher = this.getCipherData().toString('base64');

    const la_content = this.buildDigestContent(
      content_header,
      nonce,
      wmrm_cipher,
      cert_cipher
    );

    const la_hash = createHash('sha256').update(la_content, 'utf-8').digest();

    const signed_info = Cdm.buildSignedInfo(la_hash.toString('base64'));
    const signed_info_digest = createHash('sha256')
      .update(signed_info, 'utf-8')
      .digest();

    const signatureObj = this.signing_key.keyPair.sign(signed_info_digest);

    const r = signatureObj.r.toArrayLike(Buffer, 'be', 32);
    const s = signatureObj.s.toArrayLike(Buffer, 'be', 32);

    const rawSignature = Buffer.concat([r, s]);
    const signatureValue = rawSignature.toString('base64');

    const publicKeyBytes = this.signing_key.keyPair
      .getPublic()
      .encode('array', false);
    const publicKeyBuffer = Buffer.from(publicKeyBytes);
    const publicKeyBase64 = publicKeyBuffer.toString('base64');

    const main_body =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
      'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' +
      'xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
      '<soap:Body>' +
      '<AcquireLicense xmlns="http://schemas.microsoft.com/DRM/2007/03/protocols">' +
      '<challenge>' +
      '<Challenge xmlns="http://schemas.microsoft.com/DRM/2007/03/protocols/messages">' +
      la_content +
      '<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">' +
      signed_info +
      `<SignatureValue>${signatureValue}</SignatureValue>` +
      '<KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">' +
      '<KeyValue>' +
      '<ECCKeyValue>' +
      `<PublicKey>${publicKeyBase64}</PublicKey>` +
      '</ECCKeyValue>' +
      '</KeyValue>' +
      '</KeyInfo>' +
      '</Signature>' +
      '</Challenge>' +
      '</challenge>' +
      '</AcquireLicense>' +
      '</soap:Body>' +
      '</soap:Envelope>';

    return main_body;
  }

  private decryptEcc256Key(encrypted_key: Buffer): Buffer {
    const point1 = this.curve.curve.point(
      encrypted_key.subarray(0, 32).toString('hex'),
      encrypted_key.subarray(32, 64).toString('hex')
    );
    const point2 = this.curve.curve.point(
      encrypted_key.subarray(64, 96).toString('hex'),
      encrypted_key.subarray(96, 128).toString('hex')
    );

    const decrypted = ElGamal.decrypt(
      [point1, point2],
      this.encryption_key.keyPair.getPrivate()
    );
    const decryptedBytes = decrypted.getX().toArray('be', 32).slice(16, 32);

    return Buffer.from(decryptedBytes);
  }

  parseLicense(license: string | Buffer): {
    key_id: string;
    key_type: number;
    cipher_type: number;
    key_length: number;
    key: string;
  }[] {
    try {
      const parser = new XMLParser({
        removeNSPrefix: true,
      });
      const result = parser.parse(license);

      let licenses =
        result['Envelope']['Body']['AcquireLicenseResponse'][
          'AcquireLicenseResult'
        ]['Response']['LicenseResponse']['Licenses']['License'];

      if (!Array.isArray(licenses)) {
        licenses = [licenses];
      }

      const keys = [];

      for (const licenseElement of licenses) {
        const keyMaterial = XmrUtil.parse(Buffer.from(licenseElement, 'base64'))
          .license.license.keyMaterial;

        if (!keyMaterial || !keyMaterial.contentKey)
          throw new Error('No Content Keys retrieved');

        keys.push(
          new Key(
            keyMaterial.contentKey.kid,
            keyMaterial.contentKey.keyType,
            keyMaterial.contentKey.ciphertype,
            keyMaterial.contentKey.length,
            this.decryptEcc256Key(keyMaterial.contentKey.value)
          )
        );
      }

      return keys;
    } catch (error) {
      throw new Error(`Unable to parse license, ${error}`);
    }
  }
}
