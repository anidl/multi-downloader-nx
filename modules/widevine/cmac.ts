// Modified version of https://github.com/Frooastside/node-widevine
import crypto from 'crypto';

export class AES_CMAC {
  private readonly BLOCK_SIZE = 16;
  private readonly XOR_RIGHT = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x87]);
  private readonly EMPTY_BLOCK_SIZE_BUFFER = Buffer.alloc(this.BLOCK_SIZE) as Buffer;

  private _key: Buffer;
  private _subkeys: { first: Buffer; second: Buffer };

  public constructor(key: Buffer) {
    if (![16, 24, 32].includes(key.length)) {
      throw new Error('Key size must be 128, 192, or 256 bits.');
    }
    this._key = key;
    this._subkeys = this._generateSubkeys();
  }

  public calculate(message: Buffer): Buffer {
    const blockCount = this._getBlockCount(message);

    let x = this.EMPTY_BLOCK_SIZE_BUFFER;
    let y;

    for (let i = 0; i < blockCount - 1; i++) {
      const from = i * this.BLOCK_SIZE;
      const block = message.subarray(from, from + this.BLOCK_SIZE);
      y = this._xor(x, block);
      x = this._aes(y);
    }

    y = this._xor(x, this._getLastBlock(message));
    x = this._aes(y);

    return x;
  }

  private _generateSubkeys(): { first: Buffer; second: Buffer } {
    const l = this._aes(this.EMPTY_BLOCK_SIZE_BUFFER);

    let first = this._bitShiftLeft(l);
    if (l[0] & 0x80) {
      first = this._xor(first, this.XOR_RIGHT);
    }

    let second = this._bitShiftLeft(first);
    if (first[0] & 0x80) {
      second = this._xor(second, this.XOR_RIGHT);
    }

    return { first: first, second: second };
  }

  private _getBlockCount(message: Buffer): number {
    const blockCount = Math.ceil(message.length / this.BLOCK_SIZE);
    return blockCount === 0 ? 1 : blockCount;
  }

  private _aes(message: Buffer): Buffer {
    const cipher = crypto.createCipheriv(`aes-${this._key.length * 8}-cbc`, this._key, Buffer.alloc(this.BLOCK_SIZE));
    const result = cipher.update(message).subarray(0, 16);
    cipher.destroy();
    return result;
  }

  private _getLastBlock(message: Buffer): Buffer {
    const blockCount = this._getBlockCount(message);
    const paddedBlock = this._padding(message, blockCount - 1);

    let complete = false;
    if (message.length > 0) {
      complete = message.length % this.BLOCK_SIZE === 0;
    }

    const key = complete ? this._subkeys.first : this._subkeys.second;
    return this._xor(paddedBlock, key);
  }

  private _padding(message: Buffer, blockIndex: number): Buffer {
    const block = Buffer.alloc(this.BLOCK_SIZE);

    const from = blockIndex * this.BLOCK_SIZE;

    const slice = message.subarray(from, from + this.BLOCK_SIZE);
    block.set(slice);

    if (slice.length !== this.BLOCK_SIZE) {
      block[slice.length] = 0x80;
    }

    return block;
  }

  private _bitShiftLeft(input: Buffer): Buffer {
    const output = Buffer.alloc(input.length);
    let overflow = 0;
    for (let i = input.length - 1; i >= 0; i--) {
      output[i] = (input[i] << 1) | overflow;
      overflow = input[i] & 0x80 ? 1 : 0;
    }
    return output;
  }

  private _xor(a: Buffer, b: Buffer): Buffer {
    const length = Math.min(a.length, b.length);
    const output = Buffer.alloc(length);
    for (let i = 0; i < length; i++) {
      output[i] = a[i] ^ b[i];
    }
    return output;
  }
}
