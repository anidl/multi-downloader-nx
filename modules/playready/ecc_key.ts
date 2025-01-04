import elliptic from 'elliptic';
import { createHash } from 'crypto';
import * as fs from 'fs';

export default class ECCKey {
  keyPair: elliptic.ec.KeyPair;

  constructor(keyPair: elliptic.ec.KeyPair) {
    this.keyPair = keyPair;
  }

  static generate(): ECCKey {
    const EC = new elliptic.ec('p256');
    const keyPair = EC.genKeyPair();
    return new ECCKey(keyPair);
  }

  static construct(privateKey: Buffer | string | number): ECCKey {
    if (Buffer.isBuffer(privateKey)) {
      privateKey = privateKey.toString('hex');
    } else if (typeof privateKey === 'number') {
      privateKey = privateKey.toString(16);
    }

    const EC = new elliptic.ec('p256');
    const keyPair = EC.keyFromPrivate(privateKey, 'hex');

    return new ECCKey(keyPair);
  }

  static loads(data: string | Buffer): ECCKey {
    if (typeof data === 'string') {
      data = Buffer.from(data, 'base64');
    }
    if (!Buffer.isBuffer(data)) {
      throw new Error(`Expecting Bytes or Base64 input, got ${data}`);
    }

    if (data.length !== 96 && data.length !== 32) {
      throw new Error(
        `Invalid data length. Expecting 96 or 32 bytes, got ${data.length}`
      );
    }

    const privateKey = data.subarray(0, 32);
    return ECCKey.construct(privateKey);
  }

  static load(filePath: string): ECCKey {
    const data = fs.readFileSync(filePath);
    return ECCKey.loads(data);
  }

  dumps(): Buffer {
    return Buffer.concat([this.privateBytes(), this.publicBytes()]);
  }

  dump(filePath: string): void {
    fs.writeFileSync(filePath, this.dumps());
  }

  getPoint(): { x: string; y: string } {
    const publicKey = this.keyPair.getPublic();
    return {
      x: publicKey.getX().toString('hex'),
      y: publicKey.getY().toString('hex'),
    };
  }

  privateBytes(): Buffer {
    const privateKey = this.keyPair.getPrivate();
    return Buffer.from(privateKey.toArray('be', 32));
  }

  privateSha256Digest(): Buffer {
    const hash = createHash('sha256');
    hash.update(this.privateBytes());
    return hash.digest();
  }

  publicBytes(): Buffer {
    const publicKey = this.keyPair.getPublic();
    const x = publicKey.getX().toArray('be', 32);
    const y = publicKey.getY().toArray('be', 32);
    return Buffer.concat([Buffer.from(x), Buffer.from(y)]);
  }

  publicSha256Digest(): Buffer {
    const hash = createHash('sha256');
    hash.update(this.publicBytes());
    return hash.digest();
  }
}
