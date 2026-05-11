/**
 * Unit + integration tests for lib/bitcoin.js.
 * These run in Node.js — no browser environment needed.
 */
import {
  generateKeyPair,
  keyPairFromWIF,
  createMultisig,
  createP2WPKH,
  createPSBT,
  signAllInputs,
  combinePSBTs,
  finalizePSBT,
  extractTransaction,
  psbtToBase64,
  psbtFromBase64,
  psbtToHex,
  psbtFromHex,
  analyzePSBT,
  runFullLifecycleDemo,
} from '../lib/bitcoin.js';

const TESTNET = 'testnet';
const DUMMY_TXID = '7b1eabe0209b1fe794124575ef807057c77ada2138ae4fa8d6c4de0398a14f3c';

// ── Key management ────────────────────────────────────────────────────────────

describe('generateKeyPair', () => {
  it('returns a key with all expected fields', () => {
    const kp = generateKeyPair(TESTNET);
    expect(kp).toHaveProperty('keyPair');
    expect(kp).toHaveProperty('publicKey');
    expect(kp).toHaveProperty('privateKey');
    expect(kp).toHaveProperty('pubHex');
    expect(kp).toHaveProperty('privHex');
    expect(kp).toHaveProperty('wif');
    expect(kp).toHaveProperty('fingerprint');
  });

  it('produces a compressed 33-byte public key', () => {
    const kp = generateKeyPair(TESTNET);
    expect(kp.publicKey.length).toBe(33);
  });

  it('WIF round-trips back to the same key pair', () => {
    const kp = generateKeyPair(TESTNET);
    const restored = keyPairFromWIF(kp.wif, TESTNET);
    expect(restored.pubHex).toBe(kp.pubHex);
  });

  it('generates unique keys each call', () => {
    const a = generateKeyPair(TESTNET);
    const b = generateKeyPair(TESTNET);
    expect(a.pubHex).not.toBe(b.pubHex);
  });
});

describe('keyPairFromWIF', () => {
  it('throws on an invalid WIF', () => {
    expect(() => keyPairFromWIF('not-a-wif', TESTNET)).toThrow();
  });

  it('throws when a mainnet WIF is used with testnet', () => {
    const mainnetKp = generateKeyPair('mainnet');
    expect(() => keyPairFromWIF(mainnetKp.wif, TESTNET)).toThrow();
  });
});

// ── Script / address construction ─────────────────────────────────────────────

describe('createMultisig', () => {
  it('creates a valid 2-of-3 P2WSH address', () => {
    const signers = [0, 1, 2].map(() => generateKeyPair(TESTNET));
    const ms = createMultisig(2, signers.map(s => s.publicKey), TESTNET);
    expect(ms.address).toMatch(/^tb1q/); // bech32 testnet
    expect(ms.scriptPubKey).toBeDefined();
    expect(ms.witnessScript).toBeDefined();
  });

  it('sorts pubkeys deterministically (same address regardless of input order)', () => {
    const signers = [0, 1, 2].map(() => generateKeyPair(TESTNET));
    const pubkeys = signers.map(s => s.publicKey);
    const ms1 = createMultisig(2, pubkeys, TESTNET);
    const ms2 = createMultisig(2, [...pubkeys].reverse(), TESTNET);
    expect(ms1.address).toBe(ms2.address);
  });
});

describe('createP2WPKH', () => {
  it('produces a bech32 testnet address', () => {
    const kp = generateKeyPair(TESTNET);
    const p2wpkh = createP2WPKH(kp.publicKey, TESTNET);
    expect(p2wpkh.address).toMatch(/^tb1q/);
    expect(p2wpkh.scriptPubKey).toBeDefined();
  });

  it('accepts pubkey as hex string or Buffer', () => {
    const kp = generateKeyPair(TESTNET);
    const fromBuffer = createP2WPKH(kp.publicKey, TESTNET);
    const fromHex = createP2WPKH(kp.pubHex, TESTNET);
    expect(fromBuffer.address).toBe(fromHex.address);
  });
});

// ── PSBT serialization ────────────────────────────────────────────────────────

describe('PSBT serialization', () => {
  let psbt;
  beforeEach(() => {
    const signers = [0, 1, 2].map(() => generateKeyPair(TESTNET));
    const ms = createMultisig(2, signers.map(s => s.publicKey), TESTNET);
    psbt = createPSBT({
      inputs: [{ txid: DUMMY_TXID, vout: 0, witnessUtxo: { amount: 100000000, scriptPubKey: ms.scriptPubKey }, witnessScript: ms.witnessScript }],
      outputs: [{ address: ms.address, amount: 99990000 }],
      network: TESTNET,
    });
  });

  it('round-trips through base64', () => {
    const b64 = psbtToBase64(psbt);
    expect(typeof b64).toBe('string');
    const restored = psbtFromBase64(b64, TESTNET);
    expect(psbtToBase64(restored)).toBe(b64);
  });

  it('round-trips through hex', () => {
    const hex = psbtToHex(psbt);
    expect(/^[0-9a-f]+$/.test(hex)).toBe(true);
    const restored = psbtFromHex(hex, TESTNET);
    expect(psbtToHex(restored)).toBe(hex);
  });

  it('base64 and hex encode the same PSBT', () => {
    const b64 = psbtToBase64(psbt);
    const hex = psbtToHex(psbt);
    expect(Buffer.from(b64, 'base64').toString('hex')).toBe(hex);
  });

  it('throws on malformed base64', () => {
    expect(() => psbtFromBase64('not-valid-psbt', TESTNET)).toThrow();
  });
});

// ── analyzePSBT ───────────────────────────────────────────────────────────────

describe('analyzePSBT', () => {
  it('reports 0 sigs and not-finalized for an unsigned PSBT', () => {
    const signers = [0, 1].map(() => generateKeyPair(TESTNET));
    const ms = createMultisig(1, signers.map(s => s.publicKey), TESTNET);
    const psbt = createPSBT({
      inputs: [{ txid: DUMMY_TXID, vout: 0, witnessUtxo: { amount: 50000000, scriptPubKey: ms.scriptPubKey } }],
      outputs: [{ address: ms.address, amount: 49990000 }],
      network: TESTNET,
    });
    const analysis = analyzePSBT(psbt);
    expect(analysis.totalSigs).toBe(0);
    expect(analysis.isFinalized).toBe(false);
    expect(analysis.inputCount).toBe(1);
    expect(analysis.outputCount).toBe(1);
  });

  it('counts partial signatures correctly', () => {
    const signers = [0, 1, 2].map(() => generateKeyPair(TESTNET));
    const ms = createMultisig(2, signers.map(s => s.publicKey), TESTNET);
    const psbt = createPSBT({
      inputs: [{
        txid: DUMMY_TXID, vout: 0,
        witnessUtxo: { amount: 100000000, scriptPubKey: ms.scriptPubKey },
        witnessScript: ms.witnessScript,
      }],
      outputs: [{ address: ms.address, amount: 99990000 }],
      network: TESTNET,
    });
    signAllInputs(psbt, signers[0].keyPair);
    const analysis = analyzePSBT(psbt);
    expect(analysis.totalSigs).toBe(1);
    expect(analysis.isFinalized).toBe(false);
  });
});

// ── Full lifecycle integration ────────────────────────────────────────────────

describe('runFullLifecycleDemo (2-of-3 multisig)', () => {
  let result;

  beforeAll(() => {
    result = runFullLifecycleDemo(TESTNET);
  });

  it('completes without throwing', () => {
    expect(result).toBeDefined();
  });

  it('produces a valid txid (64 hex chars)', () => {
    expect(result.tx.txid).toMatch(/^[0-9a-f]{64}$/);
  });

  it('extracts a non-empty raw transaction hex', () => {
    expect(typeof result.tx.hex).toBe('string');
    expect(result.tx.hex.length).toBeGreaterThan(100);
  });

  it('reports positive virtual size', () => {
    expect(result.tx.virtualSize).toBeGreaterThan(0);
  });

  it('reports positive weight', () => {
    expect(result.tx.weight).toBeGreaterThan(0);
  });

  it('generates 3 signers', () => {
    expect(result.signers.length).toBe(3);
  });

  it('creates a valid testnet multisig address', () => {
    expect(result.multisig.address).toMatch(/^tb1q/);
  });
});

describe('combinePSBTs', () => {
  it('throws on empty array', () => {
    expect(() => combinePSBTs([])).toThrow();
  });

  it('combines two partial signatures into one PSBT', () => {
    const signers = [0, 1, 2].map(() => generateKeyPair(TESTNET));
    const ms = createMultisig(2, signers.map(s => s.publicKey), TESTNET);
    const base = createPSBT({
      inputs: [{
        txid: DUMMY_TXID, vout: 0,
        witnessUtxo: { amount: 100000000, scriptPubKey: ms.scriptPubKey },
        witnessScript: ms.witnessScript,
      }],
      outputs: [{ address: ms.address, amount: 99990000 }],
      network: TESTNET,
    });

    const copy0 = psbtFromBase64(psbtToBase64(base), TESTNET);
    signAllInputs(copy0, signers[0].keyPair);

    const copy1 = psbtFromBase64(psbtToBase64(base), TESTNET);
    signAllInputs(copy1, signers[1].keyPair);

    const combined = combinePSBTs([copy0, copy1]);
    const analysis = analyzePSBT(combined);
    expect(analysis.totalSigs).toBe(2);
  });
});
