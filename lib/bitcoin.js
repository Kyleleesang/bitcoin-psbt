import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import BIP32Factory from 'bip32';
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';

// Initialize — required once before using any ECC operations
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

// ============================================================
// NETWORKS
// ============================================================

export const networks = {
  mainnet: bitcoin.networks.bitcoin,
  testnet: bitcoin.networks.testnet,
};

// ============================================================
// KEY MANAGEMENT
// ============================================================

export function generateKeyPair(network = 'testnet') {
  const kp = ECPair.makeRandom({ network: networks[network] });
  return wrapKeyPair(kp);
}

export function keyPairFromWIF(wif, network = 'testnet') {
  const kp = ECPair.fromWIF(wif, networks[network]);
  return wrapKeyPair(kp);
}

export function keyPairFromPrivHex(hex, network = 'testnet') {
  const kp = ECPair.fromPrivateKey(Buffer.from(hex, 'hex'), {
    network: networks[network],
  });
  return wrapKeyPair(kp);
}

function wrapKeyPair(kp) {
  const fpBytes = bitcoin.crypto.hash160(kp.publicKey).slice(0, 4);
  return {
    keyPair: kp,
    privateKey: kp.privateKey,
    publicKey: kp.publicKey,
    privHex: Buffer.from(kp.privateKey).toString('hex'),
    pubHex: Buffer.from(kp.publicKey).toString('hex'),
    wif: kp.toWIF(),
    fingerprint: Buffer.from(fpBytes).toString('hex'),
  };
}

// ============================================================
// SCRIPT / ADDRESS CONSTRUCTION
// ============================================================

export function createMultisig(m, pubkeys, network = 'testnet') {
  const sorted = pubkeys
    .map((pk) => (typeof pk === 'string' ? Buffer.from(pk, 'hex') : Buffer.from(pk)))
    .sort((a, b) => Buffer.compare(a, b));

  const p2ms = bitcoin.payments.p2ms({
    m,
    pubkeys: sorted,
    network: networks[network],
  });

  const p2wsh = bitcoin.payments.p2wsh({
    redeem: p2ms,
    network: networks[network],
  });

  return {
    address: p2wsh.address,
    scriptPubKey: p2wsh.output,
    scriptPubKeyHex: p2wsh.output.toString('hex'),
    witnessScript: p2ms.output,
    witnessScriptHex: p2ms.output.toString('hex'),
    pubkeys: sorted,
  };
}

export function createP2WPKH(pubkey, network = 'testnet') {
  const pk = typeof pubkey === 'string' ? Buffer.from(pubkey, 'hex') : pubkey;
  const p = bitcoin.payments.p2wpkh({
    pubkey: pk,
    network: networks[network],
  });
  return { address: p.address, scriptPubKey: p.output };
}

// ============================================================
// HELPERS
// ============================================================

function toU8(val) {
  if (typeof val === 'string') {
    return new Uint8Array(Buffer.from(val, 'hex'));
  }
  if (val instanceof Uint8Array) {
    return new Uint8Array(val);
  }
  throw new Error('Cannot convert to Uint8Array: ' + typeof val);
}

// ============================================================
// PSBT LIFECYCLE
// ============================================================

// CREATOR
export function createPSBT({ inputs, outputs, network = 'testnet' }) {
  const net = networks[network];
  const psbt = new bitcoin.Psbt({ network: net });

  for (const inp of inputs) {
    const data = {
      hash: inp.txid,
      index: inp.vout,
      sequence: inp.sequence ?? 0xfffffffd,
    };

    if (inp.witnessUtxo) {
      data.witnessUtxo = {
        script: toU8(inp.witnessUtxo.scriptPubKey),
        value: BigInt(inp.witnessUtxo.amount),
      };
    }

    if (inp.witnessScript) {
      data.witnessScript = toU8(inp.witnessScript);
    }

    if (inp.bip32Derivation) {
      data.bip32Derivation = inp.bip32Derivation.map((d) => ({
        masterFingerprint: toU8(d.fingerprint),
        pubkey: toU8(d.pubkey),
        path: d.path,
      }));
    }

    psbt.addInput(data);
  }

  for (const out of outputs) {
    if (out.address) {
      psbt.addOutput({ address: out.address, value: BigInt(out.amount) });
    } else if (out.scriptPubKey) {
      psbt.addOutput({
        script: toU8(out.scriptPubKey),
        value: BigInt(out.amount),
      });
    }
  }

  return psbt;
}

// UPDATER
export function updateInput(psbt, index, data) {
  const update = {};
  if (data.witnessUtxo) {
    update.witnessUtxo = {
      script: toU8(data.witnessUtxo.scriptPubKey),
      value: BigInt(data.witnessUtxo.amount),
    };
  }
  if (data.witnessScript) {
    update.witnessScript = toU8(data.witnessScript);
  }
  if (data.bip32Derivation) {
    update.bip32Derivation = data.bip32Derivation.map((d) => ({
      masterFingerprint: toU8(d.fingerprint),
      pubkey: toU8(d.pubkey),
      path: d.path,
    }));
  }
  psbt.updateInput(index, update);
  return psbt;
}

// SIGNER
export function signInput(psbt, index, keyPair) {
  psbt.signInput(index, keyPair);
  return psbt;
}

export function signAllInputs(psbt, keyPair) {
  psbt.signAllInputs(keyPair);
  return psbt;
}

// COMBINER
export function combinePSBTs(psbts) {
  if (psbts.length === 0) throw new Error('Need at least one PSBT');
  const base = psbts[0];
  for (let i = 1; i < psbts.length; i++) {
    base.combine(psbts[i]);
  }
  return base;
}

// FINALIZER
export function finalizePSBT(psbt) {
  psbt.finalizeAllInputs();
  return psbt;
}

// EXTRACTOR
export function extractTransaction(psbt) {
  const tx = psbt.extractTransaction();
  return {
    hex: tx.toHex(),
    txid: tx.getId(),
    virtualSize: tx.virtualSize(),
    weight: tx.weight(),
    byteLength: tx.byteLength(),
  };
}

// ============================================================
// SERIALIZATION
// ============================================================

export function psbtToBase64(psbt) {
  return psbt.toBase64();
}

export function psbtToHex(psbt) {
  return psbt.toHex();
}

export function psbtFromBase64(str, network = 'testnet') {
  return bitcoin.Psbt.fromBase64(str, { network: networks[network] });
}

export function psbtFromHex(str, network = 'testnet') {
  return bitcoin.Psbt.fromHex(str, { network: networks[network] });
}

// ============================================================
// PSBT ANALYSIS — for UI display
// ============================================================

export function analyzePSBT(psbt) {
  const result = {
    inputCount: psbt.data.inputs.length,
    outputCount: psbt.txOutputs.length,
    inputs: [],
    outputs: [],
    fee: null,
    isFinalized: true,
    totalSigs: 0,
  };

  let totalIn = 0;
  let totalOut = 0;

  psbt.data.inputs.forEach((input, i) => {
    const txInput = psbt.txInputs[i];
    const info = {
      index: i,
      txid: Buffer.from(txInput.hash).reverse().toString('hex'),
      vout: txInput.index,
      sequence: txInput.sequence,
      witnessUtxo: null,
      witnessScript: null,
      redeemScript: null,
      partialSigs: [],
      bip32Derivation: [],
      isFinalized: false,
      finalScriptWitness: null,
    };

    if (input.witnessUtxo) {
      info.witnessUtxo = {
        amount: Number(input.witnessUtxo.value),
        scriptPubKey: Buffer.from(input.witnessUtxo.script).toString('hex'),
      };
      totalIn += Number(input.witnessUtxo.value);
    }

    if (input.witnessScript) {
      info.witnessScript = input.witnessScript.toString('hex');
    }

    if (input.redeemScript) {
      info.redeemScript = input.redeemScript.toString('hex');
    }

    if (input.partialSig && input.partialSig.length > 0) {
      info.partialSigs = input.partialSig.map((ps) => ({
        pubkey: ps.pubkey.toString('hex'),
        signature: ps.signature.toString('hex'),
      }));
      result.totalSigs += info.partialSigs.length;
    }

    if (input.bip32Derivation && input.bip32Derivation.length > 0) {
      info.bip32Derivation = input.bip32Derivation.map((d) => ({
        pubkey: d.pubkey.toString('hex'),
        fingerprint: d.masterFingerprint.toString('hex'),
        path: d.path,
      }));
    }

    if (input.finalScriptWitness) {
      info.isFinalized = true;
      info.finalScriptWitness = input.finalScriptWitness.toString('hex');
    } else if (input.finalScriptSig) {
      info.isFinalized = true;
    } else {
      result.isFinalized = false;
    }

    result.inputs.push(info);
  });

  psbt.txOutputs.forEach((txOut, i) => {
    totalOut += Number(txOut.value);
    result.outputs.push({
      index: i,
      amount: Number(txOut.value),
      scriptPubKey: Buffer.from(txOut.script).toString('hex'),
      address: txOut.address || null,
    });
  });

  result.fee = totalIn > 0 ? totalIn - totalOut : null;
  return result;
}

// ============================================================
// FULL DEMO — validates everything works end-to-end
// ============================================================

export function runFullLifecycleDemo(network = 'testnet') {
  var signers = [0, 1, 2].map(function () {
    return generateKeyPair(network);
  });

  var multisig = createMultisig(
    2,
    signers.map(function (s) {
      return s.publicKey;
    }),
    network
  );

  var change = createP2WPKH(signers[0].publicKey, network);

  var psbt = createPSBT({
    inputs: [
      {
        txid: '7b1eabe0209b1fe794124575ef807057c77ada2138ae4fa8d6c4de0398a14f3c',
        vout: 0,
        witnessUtxo: {
          amount: 100000000,
          scriptPubKey: multisig.scriptPubKey,
        },
        witnessScript: multisig.witnessScript,
        bip32Derivation: signers.map(function (s, i) {
          return {
            pubkey: s.publicKey,
            fingerprint: s.fingerprint,
            path: "m/48'/0'/0'/2'/" + i,
          };
        }),
      },
    ],
    outputs: [
      { address: change.address, amount: 49950000 },
      { address: multisig.address, amount: 49950000 },
    ],
    network: network,
  });

  var copy0 = psbtFromBase64(psbtToBase64(psbt), network);
  signAllInputs(copy0, signers[0].keyPair);

  var copy1 = psbtFromBase64(psbtToBase64(psbt), network);
  signAllInputs(copy1, signers[1].keyPair);

  var combined = combinePSBTs([copy0, copy1]);

  finalizePSBT(combined);

  var tx = extractTransaction(combined);

  return { signers: signers, multisig: multisig, tx: tx, combined: combined };
}