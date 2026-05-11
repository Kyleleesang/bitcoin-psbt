export const SIGNER_PRESETS = [
  { name: 'Alice', role: 'Treasury Officer', color: '#f59e0b', icon: '\u{1F511}' },
  { name: 'Bob',   role: 'Risk Manager',     color: '#3b82f6', icon: '\u{1F6E1}' },
  { name: 'Carol', role: 'Compliance Lead',  color: '#10b981', icon: '\u{1F4CB}' },
  { name: 'Dave',  role: 'CEO',              color: '#8b5cf6', icon: '\u{1F454}' },
  { name: 'Eve',   role: 'Board Chair',      color: '#ef4444', icon: '\u{1F3DB}' },
];

export const SCENARIOS = {
  '2-of-3 Multisig Vault': {
    desc: 'Institutional custody: 3 key holders, 2 required. P2WSH multisig.',
    m: 2, n: 3, network: 'testnet',
    inputs: [{ txid: '7b1eabe0209b1fe794124575ef807057c77ada2138ae4fa8d6c4de0398a14f3c', vout: 0, amount: 100000000, label: 'Vault UTXO — 1.0 BTC' }],
    outputs: [
      { label: 'Client withdrawal', amount: 49950000 },
      { label: 'Change to vault',   amount: 49950000 },
    ],
  },
  '3-of-5 Corporate Treasury': {
    desc: 'Board-level multisig: CEO, CFO, COO, GC, Board Chair.',
    m: 3, n: 5, network: 'testnet',
    inputs: [{ txid: 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16', vout: 0, amount: 500000000, label: 'Treasury — 5.0 BTC' }],
    outputs: [
      { label: 'Vendor payment',   amount: 200000000 },
      { label: 'Treasury change',  amount: 299950000 },
    ],
  },
  'Single-sig Hardware Wallet': {
    desc: 'Simple P2WPKH. 1-of-1 signing.',
    m: 1, n: 1, network: 'testnet',
    inputs: [{ txid: 'a6f87c4ee39a97cdab55aef0b4e3c0fc26e6cee82bfdea94e54cf9a42c5e4a12', vout: 1, amount: 5000000, label: 'HW Wallet — 0.05 BTC' }],
    outputs: [{ label: 'Payment', amount: 4990000 }],
  },
};

export const STEPS = [
  { id: 'create',   label: 'Creator',   icon: '\u{1F528}', color: '#3b82f6' },
  { id: 'update',   label: 'Updater',   icon: '\u{1F4DD}', color: '#8b5cf6' },
  { id: 'sign',     label: 'Signer',    icon: '\u{1F511}', color: '#f59e0b' },
  { id: 'combine',  label: 'Combiner',  icon: '\u{1F517}', color: '#10b981' },
  { id: 'finalize', label: 'Finalizer', icon: '✅',    color: '#ef4444' },
  { id: 'extract',  label: 'Extractor', icon: '\u{1F4E4}', color: '#06b6d4' },
];
