import BN from 'bn.js'
import { ec as EC } from 'elliptic'
import ECCKey from './ecc_key'
import ElGamal, { Point } from './elgamal'

export default class XmlKey {
    private _sharedPoint: ECCKey
    public sharedKeyX: BN
    public sharedKeyY: BN
    public _shared_key_x_bytes: Uint8Array
    public aesIv: Uint8Array
    public aesKey: Uint8Array

    constructor() {
        this._sharedPoint = ECCKey.generate()
        this.sharedKeyX = this._sharedPoint.keyPair.getPublic().getX()
        this.sharedKeyY = this._sharedPoint.keyPair.getPublic().getY()
        this._shared_key_x_bytes = ElGamal.toBytes(this.sharedKeyX)
        this.aesIv = this._shared_key_x_bytes.subarray(0, 16)
        this.aesKey = this._shared_key_x_bytes.subarray(16, 32)
    }

    getPoint(curve: EC): Point {
        return curve.curve.point(this.sharedKeyX, this.sharedKeyY)
    }
}

// Make it more undetectable (not working right now)
// import { ec as EC } from 'elliptic'
// import { Point } from './elgamal.js'
// import { randomBytes } from 'crypto';

// export default class XmlKey {
//     public aesIv: Uint8Array;
//     public aesKey: Uint8Array;

//     constructor() {
//         this.aesIv = randomBytes(16);
//         this.aesKey = randomBytes(16);
//     }

//     getPoint(curve: EC): Point {
//         return curve.curve.point(this.aesIv, this.aesKey)
//     }
// }
