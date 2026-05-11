import { UserError } from './errors.js';

const MAX_SATS = 2_100_000_000_000_000; // 21M BTC in satoshis

export function validateTxid(txid, label = 'TXID') {
  if (!txid || !/^[0-9a-fA-F]{64}$/.test(txid.trim())) {
    throw new UserError(`${label} must be exactly 64 hex characters`);
  }
}

export function validateVout(vout, label = 'Output index') {
  if (!Number.isInteger(vout) || vout < 0) {
    throw new UserError(`${label} must be a non-negative integer`);
  }
}

export function validateAmount(sats, label = 'Amount') {
  if (!Number.isInteger(sats) || sats <= 0) {
    throw new UserError(`${label} must be a positive integer (satoshis)`);
  }
  if (sats > MAX_SATS) {
    throw new UserError(`${label} exceeds the total Bitcoin supply`);
  }
}

/**
 * Light structural check on WIF format — the actual cryptographic
 * validation happens inside ECPair.fromWIF() at use time.
 */
export function validateWifFormat(wif, network) {
  if (!wif) return;
  const trimmed = wif.trim();
  if (trimmed.length < 51 || trimmed.length > 53) {
    throw new UserError(`WIF key length is invalid (expected 51–53 characters)`);
  }
  if (network === 'testnet' && trimmed[0] !== 'c') {
    throw new UserError(`Testnet WIF keys start with 'c' — got '${trimmed[0]}'`);
  }
  if (network === 'mainnet' && !['K', 'L', '5'].includes(trimmed[0])) {
    throw new UserError(`Mainnet WIF keys start with K, L, or 5 — got '${trimmed[0]}'`);
  }
}

export function validateInputs(inputs) {
  if (!inputs || inputs.length === 0) {
    throw new UserError('At least one UTXO input is required');
  }
  inputs.forEach((inp, i) => {
    validateTxid(inp.txid, `Input #${i} TXID`);
    validateVout(inp.vout, `Input #${i} output index`);
    validateAmount(inp.amount, `Input #${i} amount`);
  });
}

export function validateOutputs(outputs, totalIn) {
  if (!outputs || outputs.length === 0) {
    throw new UserError('At least one output is required');
  }
  let totalOut = 0;
  outputs.forEach((out, i) => {
    validateAmount(out.amount, `Output #${i} amount`);
    totalOut += out.amount;
  });
  if (totalOut >= totalIn) {
    throw new UserError(
      `Output total (${totalOut} sats) must be less than input total (${totalIn} sats) to leave room for a fee`
    );
  }
}

export function validateMultisigParams(m, n) {
  if (!Number.isInteger(m) || m < 1) {
    throw new UserError(`m must be at least 1`);
  }
  if (!Number.isInteger(n) || n < 1) {
    throw new UserError(`n must be at least 1`);
  }
  if (m > n) {
    throw new UserError(`m (${m}) cannot exceed n (${n})`);
  }
  if (n > 15) {
    throw new UserError(`n (${n}) exceeds the 15-key limit for standard multisig`);
  }
}
