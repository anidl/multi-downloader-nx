import { ec as EC } from 'elliptic';
import { randomBytes } from 'crypto';
import BN from 'bn.js';

export interface Point {
  getY(): BN;
  getX(): BN;
  add(point: Point): Point;
  mul(n: BN | bigint | number): Point;
  neg(): Point;
}

export default class ElGamal {
  curve: EC;

  constructor(curve: EC) {
    this.curve = curve;
  }

  static toBytes(n: BN): Uint8Array {
    const byteArray = n.toString(16).padStart(2, '0');
    if (byteArray.length % 2 !== 0) {
      return Uint8Array.from(Buffer.from('0' + byteArray, 'hex'));
    }
    return Uint8Array.from(Buffer.from(byteArray, 'hex'));
  }

  encrypt(messagePoint: Point, publicKey: Point): [Point, Point] {
    const ephemeralKey = new BN(randomBytes(32).toString('hex'), 16).mod(
      this.curve.n!
    );
    const ephemeralKeyBigInt = BigInt(ephemeralKey.toString(10));
    const point1 = this.curve.g.mul(ephemeralKeyBigInt);
    const point2 = messagePoint.add(publicKey.mul(ephemeralKeyBigInt));

    return [point1, point2];
  }

  static decrypt(encrypted: [Point, Point], privateKey: BN): Point {
    const [point1, point2] = encrypted;
    const sharedSecret = point1.mul(privateKey);
    const decryptedMessage = point2.add(sharedSecret.neg());
    return decryptedMessage;
  }
}
