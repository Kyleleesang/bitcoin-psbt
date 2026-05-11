import {
  validateTxid,
  validateVout,
  validateAmount,
  validateWifFormat,
  validateInputs,
  validateOutputs,
  validateMultisigParams,
} from '../lib/validation.js';
import { UserError } from '../lib/errors.js';

describe('validateTxid', () => {
  it('accepts a valid 64-char hex txid', () => {
    expect(() => validateTxid('7b1eabe0209b1fe794124575ef807057c77ada2138ae4fa8d6c4de0398a14f3c')).not.toThrow();
  });
  it('rejects empty string', () => {
    expect(() => validateTxid('')).toThrow(UserError);
  });
  it('rejects 63-char string', () => {
    expect(() => validateTxid('a'.repeat(63))).toThrow(UserError);
  });
  it('rejects 65-char string', () => {
    expect(() => validateTxid('a'.repeat(65))).toThrow(UserError);
  });
  it('rejects non-hex characters', () => {
    expect(() => validateTxid('z'.repeat(64))).toThrow(UserError);
  });
  it('rejects null', () => {
    expect(() => validateTxid(null)).toThrow(UserError);
  });
});

describe('validateVout', () => {
  it('accepts 0', () => { expect(() => validateVout(0)).not.toThrow(); });
  it('accepts positive integers', () => { expect(() => validateVout(5)).not.toThrow(); });
  it('rejects negative numbers', () => { expect(() => validateVout(-1)).toThrow(UserError); });
  it('rejects floats', () => { expect(() => validateVout(1.5)).toThrow(UserError); });
  it('rejects strings', () => { expect(() => validateVout('0')).toThrow(UserError); });
});

describe('validateAmount', () => {
  it('accepts 1 sat', () => { expect(() => validateAmount(1)).not.toThrow(); });
  it('accepts 100M sats (1 BTC)', () => { expect(() => validateAmount(100_000_000)).not.toThrow(); });
  it('accepts 21M BTC in sats', () => { expect(() => validateAmount(2_100_000_000_000_000)).not.toThrow(); });
  it('rejects 0', () => { expect(() => validateAmount(0)).toThrow(UserError); });
  it('rejects negative', () => { expect(() => validateAmount(-1)).toThrow(UserError); });
  it('rejects floats', () => { expect(() => validateAmount(1.5)).toThrow(UserError); });
  it('rejects over max supply', () => { expect(() => validateAmount(2_100_000_000_000_001)).toThrow(UserError); });
});

describe('validateWifFormat', () => {
  it('accepts empty/undefined (optional field)', () => {
    expect(() => validateWifFormat('', 'testnet')).not.toThrow();
    expect(() => validateWifFormat(undefined, 'testnet')).not.toThrow();
  });
  it('rejects too-short WIF', () => {
    expect(() => validateWifFormat('c' + 'a'.repeat(20), 'testnet')).toThrow(UserError);
  });
  it('rejects testnet WIF with mainnet prefix', () => {
    expect(() => validateWifFormat('K' + 'a'.repeat(50), 'testnet')).toThrow(UserError);
  });
  it('rejects mainnet WIF with testnet prefix', () => {
    expect(() => validateWifFormat('c' + 'a'.repeat(50), 'mainnet')).toThrow(UserError);
  });
  it('accepts structurally correct testnet WIF prefix', () => {
    expect(() => validateWifFormat('c' + 'a'.repeat(51), 'testnet')).not.toThrow();
  });
});

describe('validateInputs', () => {
  const validInput = {
    txid: '7b1eabe0209b1fe794124575ef807057c77ada2138ae4fa8d6c4de0398a14f3c',
    vout: 0,
    amount: 100_000_000,
  };

  it('accepts a valid input array', () => {
    expect(() => validateInputs([validInput])).not.toThrow();
  });
  it('rejects empty array', () => {
    expect(() => validateInputs([])).toThrow(UserError);
  });
  it('rejects missing txid', () => {
    expect(() => validateInputs([{ ...validInput, txid: '' }])).toThrow(UserError);
  });
  it('rejects negative vout', () => {
    expect(() => validateInputs([{ ...validInput, vout: -1 }])).toThrow(UserError);
  });
  it('rejects zero amount', () => {
    expect(() => validateInputs([{ ...validInput, amount: 0 }])).toThrow(UserError);
  });
});

describe('validateOutputs', () => {
  it('accepts valid outputs where total < input', () => {
    expect(() => validateOutputs([{ amount: 90_000_000 }], 100_000_000)).not.toThrow();
  });
  it('rejects empty array', () => {
    expect(() => validateOutputs([], 100_000_000)).toThrow(UserError);
  });
  it('rejects outputs totaling >= inputs (no fee)', () => {
    expect(() => validateOutputs([{ amount: 100_000_000 }], 100_000_000)).toThrow(UserError);
  });
  it('rejects outputs exceeding inputs', () => {
    expect(() => validateOutputs([{ amount: 110_000_000 }], 100_000_000)).toThrow(UserError);
  });
});

describe('validateMultisigParams', () => {
  it('accepts 1-of-1', () => { expect(() => validateMultisigParams(1, 1)).not.toThrow(); });
  it('accepts 2-of-3', () => { expect(() => validateMultisigParams(2, 3)).not.toThrow(); });
  it('accepts 15-of-15', () => { expect(() => validateMultisigParams(15, 15)).not.toThrow(); });
  it('rejects m=0', () => { expect(() => validateMultisigParams(0, 3)).toThrow(UserError); });
  it('rejects m > n', () => { expect(() => validateMultisigParams(4, 3)).toThrow(UserError); });
  it('rejects n > 15', () => { expect(() => validateMultisigParams(1, 16)).toThrow(UserError); });
});
