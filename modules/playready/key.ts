enum KeyType {
  Invalid = 0x0000,
  AES128CTR = 0x0001,
  RC4 = 0x0002,
  AES128ECB = 0x0003,
  Cocktail = 0x0004,
  AESCBC = 0x0005,
  UNKNOWN = 0xffff,
}

function getKeyType(value: number): KeyType {
  switch (value) {
  case KeyType.Invalid:
  case KeyType.AES128CTR:
  case KeyType.RC4:
  case KeyType.AES128ECB:
  case KeyType.Cocktail:
  case KeyType.AESCBC:
    return value;
  default:
    return KeyType.UNKNOWN;
  }
}

enum CipherType {
  Invalid = 0x0000,
  RSA128 = 0x0001,
  ChainedLicense = 0x0002,
  ECC256 = 0x0003,
  ECCforScalableLicenses = 0x0004,
  Scalable = 0x0005,
  UNKNOWN = 0xffff,
}

function getCipherType(value: number): CipherType {
  switch (value) {
  case CipherType.Invalid:
  case CipherType.RSA128:
  case CipherType.ChainedLicense:
  case CipherType.ECC256:
  case CipherType.ECCforScalableLicenses:
  case CipherType.Scalable:
    return value;
  default:
    return CipherType.UNKNOWN;
  }
}

export class Key {
  key_id: string;
  key_type: KeyType;
  cipher_type: CipherType;
  key_length: number;
  key: string;

  constructor(
    key_id: string,
    key_type: number,
    cipher_type: number,
    key_length: number,
    key: Buffer
  ) {
    this.key_id = key_id;
    this.key_type = getKeyType(key_type);
    this.cipher_type = getCipherType(cipher_type);
    this.key_length = key_length;
    this.key = key.toString('hex');
  }
}
