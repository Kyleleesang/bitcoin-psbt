'use client';

import { useState, useReducer, useRef } from 'react';
import { Badge, Dot, Card, Field, Inp, TArea, Btn } from '../components/ui';

const SIGNER_PRESETS = [
  { name: 'Alice', role: 'Treasury Officer', color: '#f59e0b', icon: '\u{1F511}' },
  { name: 'Bob', role: 'Risk Manager', color: '#3b82f6', icon: '\u{1F6E1}' },
  { name: 'Carol', role: 'Compliance Lead', color: '#10b981', icon: '\u{1F4CB}' },
  { name: 'Dave', role: 'CEO', color: '#8b5cf6', icon: '\u{1F454}' },
  { name: 'Eve', role: 'Board Chair', color: '#ef4444', icon: '\u{1F3DB}' },
];

const SCENARIOS = {
  '2-of-3 Multisig Vault': {
    desc: 'Institutional custody: 3 key holders, 2 required. P2WSH multisig.',
    m: 2, n: 3, network: 'testnet',
    inputs: [{ txid: '7b1eabe0209b1fe794124575ef807057c77ada2138ae4fa8d6c4de0398a14f3c', vout: 0, amount: 100000000, label: 'Vault UTXO \u2014 1.0 BTC' }],
    outputs: [
      { label: 'Client withdrawal', amount: 49950000 },
      { label: 'Change to vault', amount: 49950000 },
    ],
  },
  '3-of-5 Corporate Treasury': {
    desc: 'Board-level multisig: CEO, CFO, COO, GC, Board Chair.',
    m: 3, n: 5, network: 'testnet',
    inputs: [{ txid: 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16', vout: 0, amount: 500000000, label: 'Treasury \u2014 5.0 BTC' }],
    outputs: [
      { label: 'Vendor payment', amount: 200000000 },
      { label: 'Treasury change', amount: 299950000 },
    ],
  },
  'Single-sig Hardware Wallet': {
    desc: 'Simple P2WPKH. 1-of-1 signing.',
    m: 1, n: 1, network: 'testnet',
    inputs: [{ txid: 'a6f87c4ee39a97cdab55aef0b4e3c0fc26e6cee82bfdea94e54cf9a42c5e4a12', vout: 1, amount: 5000000, label: 'HW Wallet \u2014 0.05 BTC' }],
    outputs: [{ label: 'Payment', amount: 4990000 }],
  },
};

const STEPS = [
  { id: 'create', label: 'Creator', icon: '\u{1F528}', color: '#3b82f6' },
  { id: 'update', label: 'Updater', icon: '\u{1F4DD}', color: '#8b5cf6' },
  { id: 'sign', label: 'Signer', icon: '\u{1F511}', color: '#f59e0b' },
  { id: 'combine', label: 'Combiner', icon: '\u{1F517}', color: '#10b981' },
  { id: 'finalize', label: 'Finalizer', icon: '\u2705', color: '#ef4444' },
  { id: 'extract', label: 'Extractor', icon: '\u{1F4E4}', color: '#06b6d4' },
];

const init = {
  step: 'create',
  scenario: null,
  m: 2,
  n: 3,
  network: 'testnet',
  inputs: SCENARIOS['2-of-3 Multisig Vault'].inputs,
  outputs: SCENARIOS['2-of-3 Multisig Vault'].outputs,
  // bitcoinjs-lib objects
  btc: null, // the bitcoin module (lazy loaded)
  signers: [],
  multisig: null,
  psbt: null,
  psbtBase64: null,
  signedPsbts: [],
  combinedPsbt: null,
  finalizedPsbt: null,
  rawTx: null,
  analysis: null,
  // ui
  importText: '',
  importFmt: 'base64',
  exportFmt: 'base64',
  log: [],
  error: null,
  loading: false,
};

function reduce(s, a) {
  switch (a.t) {
    case 'STEP': return { ...s, step: a.v, error: null };
    case 'SCENARIO': {
      var sc = SCENARIOS[a.v];
      return {
        ...s, scenario: a.v, m: sc.m, n: sc.n, network: sc.network,
        inputs: sc.inputs, outputs: sc.outputs,
        signers: [], multisig: null, psbt: null, psbtBase64: null,
        signedPsbts: Array(sc.n).fill(null),
        combinedPsbt: null, finalizedPsbt: null, rawTx: null, analysis: null,
        step: 'create', error: null, log: [],
      };
    }
    case 'BTC': return { ...s, btc: a.v };
    case 'SIGNERS': return { ...s, signers: a.v };
    case 'MULTISIG': return { ...s, multisig: a.v };
    case 'PSBT': return { ...s, psbt: a.v, psbtBase64: a.b64, analysis: a.analysis };
    case 'SIGNED': { var sp = [...s.signedPsbts]; sp[a.i] = a.v; return { ...s, signedPsbts: sp }; }
    case 'COMBINED': return { ...s, combinedPsbt: a.v, analysis: a.analysis };
    case 'FINALIZED': return { ...s, finalizedPsbt: a.v, analysis: a.analysis };
    case 'RAW_TX': return { ...s, rawTx: a.v };
    case 'ANALYSIS': return { ...s, analysis: a.v };
    case 'IMPORT_TEXT': return { ...s, importText: a.v };
    case 'IMPORT_FMT': return { ...s, importFmt: a.v };
    case 'EXPORT_FMT': return { ...s, exportFmt: a.v };
    case 'IMPORT': return {
      ...s,
      psbt: a.psbt, psbtBase64: a.b64, analysis: a.analysis, step: a.nextStep,
      signers: [], signedPsbts: [], combinedPsbt: null, finalizedPsbt: null, rawTx: null,
      importText: '', error: null,
      log: [...s.log, { t: Date.now(), m: 'Imported PSBT \u2014 jumped to ' + a.nextStep }],
    };
    case 'LOG': return { ...s, log: [...s.log, { t: Date.now(), m: a.v }] };
    case 'ERR': return { ...s, error: a.v, loading: false };
    case 'NOERR': return { ...s, error: null };
    case 'LOADING': return { ...s, loading: a.v };
    case 'RESET': return { ...init };
    default: return s;
  }
}

export default function Home() {
  var [s, d] = useReducer(reduce, init);
  var [xFmt, setXFmt] = useState('base64');
  var [showX, setShowX] = useState(false);

  var stepIdx = STEPS.findIndex(function (x) { return x.id === s.step; });
  var signedCount = s.signedPsbts.filter(Boolean).length;
  var totalIn = s.inputs.reduce(function (a, x) { return a + x.amount; }, 0);
  var totalOut = s.outputs.reduce(function (a, x) { return a + x.amount; }, 0);
  var fee = totalIn - totalOut;

  var log = function (m) { d({ t: 'LOG', v: m }); };

  var loadBtc = async function () {
    if (s.btc) return s.btc;
    var btc = await import('../lib/bitcoin');
    d({ t: 'BTC', v: btc });
    return btc;
  };

  var doCreate = async function () {
    try {
      d({ t: 'LOADING', v: true });
      var btc = await loadBtc();

      var signers = Array.from({ length: s.n }, function () {
        return btc.generateKeyPair(s.network);
      });
      d({ t: 'SIGNERS', v: signers });
      log('Generated ' + s.n + ' key pairs');

      var multisig = btc.createMultisig(s.m, signers.map(function (sk) { return sk.publicKey; }), s.network);
      d({ t: 'MULTISIG', v: multisig });
      log('Created ' + s.m + '-of-' + s.n + ' multisig: ' + multisig.address);

      var change = btc.createP2WPKH(signers[0].publicKey, s.network);

      var psbt = btc.createPSBT({
        inputs: s.inputs.map(function (inp) {
          return {
            txid: inp.txid,
            vout: inp.vout,
            witnessUtxo: { amount: inp.amount, scriptPubKey: multisig.scriptPubKey },
            witnessScript: multisig.witnessScript,
            bip32Derivation: signers.map(function (sk, i) {
              return { pubkey: sk.publicKey, fingerprint: sk.fingerprint, path: "m/48'/0'/0'/2'/" + i };
            }),
          };
        }),
        outputs: s.outputs.map(function (out, i) {
          if (i === 0) return { address: change.address, amount: out.amount };
          return { address: multisig.address, amount: out.amount };
        }),
        network: s.network,
      });

      var b64 = btc.psbtToBase64(psbt);
      var analysis = btc.analyzePSBT(psbt);
      d({ t: 'PSBT', v: psbt, b64: b64, analysis: analysis });
      log('PSBT created: ' + s.inputs.length + ' input(s), ' + s.outputs.length + ' output(s)');
      log('Updated with witness UTXOs, scripts, BIP-32 derivations');
      d({ t: 'STEP', v: 'update' });
      d({ t: 'LOADING', v: false });
    } catch (e) {
      d({ t: 'ERR', v: e.message });
      console.error(e);
    }
  };

  var doSign = async function (idx) {
    try {
      var btc = await loadBtc();
      var cloned = btc.psbtFromBase64(s.psbtBase64, s.network);
      btc.signAllInputs(cloned, s.signers[idx].keyPair);
      d({ t: 'SIGNED', i: idx, v: btc.psbtToBase64(cloned) });
      log(SIGNER_PRESETS[idx].name + ' signed ' + s.inputs.length + ' input(s)');
    } catch (e) {
      d({ t: 'ERR', v: e.message });
      console.error(e);
    }
  };

  var doCombine = async function () {
    try {
      var btc = await loadBtc();
      var signed = s.signedPsbts.filter(Boolean);
      if (signed.length < s.m) { d({ t: 'ERR', v: 'Need ' + s.m + ' signed PSBTs, have ' + signed.length }); return; }
      var psbts = signed.map(function (b64) { return btc.psbtFromBase64(b64, s.network); });
      var combined = btc.combinePSBTs(psbts);
      var analysis = btc.analyzePSBT(combined);
      d({ t: 'COMBINED', v: combined, analysis: analysis });
      log('Combined ' + signed.length + ' partially-signed PSBTs');
      d({ t: 'STEP', v: 'finalize' });
    } catch (e) {
      d({ t: 'ERR', v: e.message });
      console.error(e);
    }
  };

  var doFinalize = async function () {
    try {
      var btc = await loadBtc();
      btc.finalizePSBT(s.combinedPsbt);
      var analysis = btc.analyzePSBT(s.combinedPsbt);
      d({ t: 'FINALIZED', v: s.combinedPsbt, analysis: analysis });
      log('Finalized: witness stacks assembled');
      d({ t: 'STEP', v: 'extract' });
    } catch (e) {
      d({ t: 'ERR', v: e.message });
      console.error(e);
    }
  };

  var doExtract = async function () {
    try {
      var btc = await loadBtc();
      var tx = btc.extractTransaction(s.finalizedPsbt);
      d({ t: 'RAW_TX', v: tx });
      log('Extracted raw tx: ' + tx.txid);
    } catch (e) {
      d({ t: 'ERR', v: e.message });
      console.error(e);
    }
  };

  var doImport = async function () {
    try {
      var btc = await loadBtc();
      var text = s.importText.trim();
      var psbt;
      if (/^[0-9a-fA-F]+$/.test(text)) {
        psbt = btc.psbtFromHex(text, s.network);
      } else {
        psbt = btc.psbtFromBase64(text, s.network);
      }
      var b64 = btc.psbtToBase64(psbt);
      var analysis = btc.analyzePSBT(psbt);
      var nextStep = analysis.isFinalized ? 'extract' : analysis.totalSigs > 0 ? 'combine' : 'sign';
      d({ t: 'IMPORT', psbt: psbt, b64: b64, analysis: analysis, nextStep: nextStep });
    } catch (e) {
      d({ t: 'ERR', v: 'Import failed: ' + e.message });
    }
  };

  var exportPsbt = s.finalizedPsbt || s.combinedPsbt || s.psbt;
  var exportStr = exportPsbt
    ? (s.exportFmt === 'hex' ? (s.btc ? s.btc.psbtToHex(exportPsbt) : null) : s.psbtBase64)
    : null;

  return (
    <div style={{ background: '#030712', color: '#e2e8f0', minHeight: '100vh', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1a103d 100%)', borderBottom: '1px solid #1e293b', padding: '14px 20px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900 }}>{'\u20BF'}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>PSBT Workbench</span>
                <Badge color="#f59e0b" filled>BIP-174</Badge>
                <Badge color="#06b6d4">bitcoinjs-lib</Badge>
              </div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>Institutional Bitcoin Transaction Coordinator</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Badge color="#8b5cf6" filled>TESTNET</Badge>
            <Btn small outline color="#475569" onClick={function () { d({ t: 'RESET' }); }}>Reset</Btn>
          </div>
        </div>
      </div>

      {/* NAV */}
      <div style={{ background: '#0a0f1a', borderBottom: '1px solid #1e293b', padding: '0 20px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex' }}>
          {STEPS.map(function (step, i) {
            var active = s.step === step.id;
            var done = stepIdx > i;
            return (
              <button key={step.id} onClick={function () { d({ t: 'STEP', v: step.id }); }} style={{ flex: 1, padding: '10px 8px', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: '2px solid ' + (active ? step.color : 'transparent') }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Dot on={active || done} color={step.color} size={7} />
                  <span style={{ fontSize: 13 }}>{step.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: active ? step.color : done ? '#64748b' : '#334155' }}>{step.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 20, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
        <div>
          {s.error && (
            <div style={{ background: '#450a0a', border: '1px solid #991b1b', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#fca5a5', wordBreak: 'break-all' }}>{s.error}</span>
              <Btn small outline color="#ef4444" onClick={function () { d({ t: 'NOERR' }); }}>{'\u00D7'}</Btn>
            </div>
          )}

          {/* CREATE */}
          {s.step === 'create' && (
            <>
              <Card title="Transaction Scenario" icon={'\u{1F4CB}'} accent="#3b82f6" sub="Select a pre-built scenario">
                <div style={{ display: 'grid', gap: 8 }}>
                  {Object.entries(SCENARIOS).map(function ([name, sc]) {
                    return (
                      <button key={name} onClick={function () { d({ t: 'SCENARIO', v: name }); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: s.scenario === name ? '#1e3a5f' : '#0a0f1a', border: '1.5px solid ' + (s.scenario === name ? '#3b82f6' : '#1e293b'), borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: s.scenario === name ? '#60a5fa' : '#cbd5e1' }}>{name}</div>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{sc.desc}</div>
                        </div>
                        <Badge color={s.scenario === name ? '#3b82f6' : '#475569'}>{sc.m}-of-{sc.n}</Badge>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card title="Inputs (UTXOs)" icon={'\u{1F4E5}'} accent="#3b82f6">
                {s.inputs.map(function (inp, i) {
                  return (
                    <div key={i} style={{ background: '#0a0f1a', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Input #{i}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{(inp.amount / 1e8).toFixed(8)} BTC</span>
                      </div>
                      <Field label="TXID" value={inp.txid} mono />
                      <div style={{ display: 'flex', gap: 12 }}>
                        <Field label="Vout" value={String(inp.vout)} />
                        <Field label="Sats" value={inp.amount.toLocaleString()} />
                      </div>
                    </div>
                  );
                })}
              </Card>

              <Card title="Outputs" icon={'\u{1F4E4}'} accent="#3b82f6">
                {s.outputs.map(function (out, i) {
                  return (
                    <div key={i} style={{ background: '#0a0f1a', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{out.label || 'Output #' + i}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{(out.amount / 1e8).toFixed(8)} BTC</span>
                      </div>
                    </div>
                  );
                })}
                {fee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0f172a', borderRadius: 6 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Network Fee</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>{fee.toLocaleString()} sats</span>
                  </div>
                )}
              </Card>

              <Btn onClick={doCreate} color="#3b82f6" block disabled={!s.scenario || s.loading}>
                {s.loading ? 'Creating...' : 'Create & Update PSBT \u2192'}
              </Btn>
            </>
          )}

          {/* UPDATE */}
          {s.step === 'update' && s.analysis && (
            <Card title="Updater \u2014 PSBT Enrichment" icon={'\u{1F4DD}'} accent="#8b5cf6" sub="Witness data, redeem scripts, and BIP-32 derivation paths applied">
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.6 }}>
                The Updater role enriches the PSBT so signers know exactly what they are signing: the UTXO being spent, the script that locks it, and the key derivation paths for each participant.
              </p>
              {s.analysis.inputs.map(function (inp) {
                return (
                  <div key={inp.index} style={{ background: '#0a0f1a', borderRadius: 10, padding: 14, marginBottom: 10, borderLeft: '3px solid #8b5cf6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Input #{inp.index}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {inp.witnessUtxo && <Badge color="#6366f1">WITNESS UTXO</Badge>}
                        {inp.witnessScript && <Badge color="#8b5cf6">P2WSH</Badge>}
                      </div>
                    </div>
                    <Field label="TXID" value={inp.txid} mono />
                    {inp.witnessUtxo && (
                      <Field label="Amount (sats)" value={inp.witnessUtxo.amount.toLocaleString() + ' \u2014 ' + (inp.witnessUtxo.amount / 1e8).toFixed(8) + ' BTC'} />
                    )}
                    {inp.witnessScript && (
                      <Field label="Witness Script (redeem script hex)" value={inp.witnessScript} mono />
                    )}
                    {inp.bip32Derivation && inp.bip32Derivation.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>BIP-32 Derivation Paths</div>
                        {inp.bip32Derivation.map(function (d32, j) {
                          var p = SIGNER_PRESETS[j % 5];
                          return (
                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: '#030712', borderRadius: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: 14 }}>{p.icon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: p.color }}>{p.name}</div>
                                <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>pubkey: {d32.pubkey}</div>
                              </div>
                              <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#a78bfa', whiteSpace: 'nowrap' }}>{d32.path}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              <Btn onClick={function () { d({ t: 'STEP', v: 'sign' }); }} color="#8b5cf6">Proceed to Sign {'\u2192'}</Btn>
            </Card>
          )}

          {/* SIGN */}
          {s.step === 'sign' && (
            <Card title="Signer \u2014 Multi-Party Signing" icon={'\u{1F511}'} accent="#f59e0b" sub={s.m + '-of-' + s.n + ' multisig \u00B7 ' + signedCount + ' signed'}>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.6 }}>
                Each key holder signs independently and returns their partially-signed PSBT.
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                {Array.from({ length: s.n }, function (_, i) {
                  var p = SIGNER_PRESETS[i];
                  var done = s.signedPsbts[i] !== null;
                  var key = s.signers[i];
                  return (
                    <div key={i} style={{ background: '#0a0f1a', borderRadius: 10, padding: 14, borderLeft: '3px solid ' + p.color, opacity: done ? 0.75 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{p.icon}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.name}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>{p.role}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {done ? <Badge color="#10b981" filled>SIGNED</Badge> : <Badge color="#475569">AWAITING</Badge>}
                          <Btn small color={p.color} disabled={done} onClick={function () { doSign(i); }}>{done ? '\u2713' : 'Sign'}</Btn>
                        </div>
                      </div>
                      {key && <div style={{ marginTop: 6, fontSize: 10, fontFamily: 'monospace', color: '#475569' }}>pubkey: {key.pubHex.slice(0, 24)}{'\u2026'}</div>}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 14, background: '#0a0f1a', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Threshold</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: signedCount >= s.m ? '#10b981' : '#f59e0b' }}>{signedCount} / {s.m} required</span>
                </div>
                <div style={{ height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, transition: 'width 0.3s', width: Math.min(100, (signedCount / s.m) * 100) + '%', background: signedCount >= s.m ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <Btn onClick={function () { d({ t: 'STEP', v: 'combine' }); }} color="#10b981" disabled={signedCount < s.m}>
                  {signedCount >= s.m ? 'Proceed to Combine \u2192' : 'Need ' + (s.m - signedCount) + ' more'}
                </Btn>
              </div>
            </Card>
          )}

          {/* COMBINE */}
          {s.step === 'combine' && (
            <Card title="Combiner \u2014 Merge Signed PSBTs" icon={'\u{1F517}'} accent="#10b981">
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.6 }}>
                Merging partial signatures into a single PSBT. No new signatures created.
              </p>
              {s.signedPsbts.map(function (v, i) {
                if (!v) return null;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                    <Dot on color={SIGNER_PRESETS[i].color} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: SIGNER_PRESETS[i].color }}>{SIGNER_PRESETS[i].name}</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 12 }}>
                <Btn onClick={doCombine} color="#10b981">Combine {signedCount} PSBTs {'\u2192'}</Btn>
              </div>
            </Card>
          )}

          {/* FINALIZE */}
          {s.step === 'finalize' && (
            <Card title="Finalizer \u2014 Assemble Witness" icon={'\u2705'} accent="#ef4444">
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.6 }}>
                Building final witness stack. After this, no more signatures can be added.
              </p>
              <Btn onClick={doFinalize} color="#ef4444">Finalize PSBT {'\u2192'}</Btn>
            </Card>
          )}

          {/* EXTRACT */}
          {s.step === 'extract' && (
            <Card title="Extractor \u2014 Broadcast-Ready" icon={'\u{1F4E4}'} accent="#06b6d4">
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.6 }}>
                Extract the complete signed transaction from the PSBT container.
              </p>
              <Btn onClick={doExtract} color="#06b6d4" block>Extract Raw Transaction</Btn>
              {s.rawTx && (
                <div style={{ marginTop: 14, background: '#0a0f1a', borderRadius: 10, padding: 16, border: '1px solid #164e63' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#06b6d4' }}>{'\u{1F389}'} Transaction Complete</span>
                    <Badge color="#10b981" filled>BROADCAST READY</Badge>
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#94a3b8', wordBreak: 'break-all', lineHeight: 1.6, background: '#030712', borderRadius: 6, padding: 12, maxHeight: 180, overflow: 'auto', border: '1px solid #1e293b' }}>
                    {s.rawTx.hex}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
                    <div style={{ background: '#030712', borderRadius: 6, padding: 8 }}>
                      <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase' }}>TXID</div>
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#e2e8f0', wordBreak: 'break-all' }}>{s.rawTx.txid}</div>
                    </div>
                    <div style={{ background: '#030712', borderRadius: 6, padding: 8 }}>
                      <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase' }}>vSize</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{s.rawTx.virtualSize} vB</div>
                    </div>
                    <div style={{ background: '#030712', borderRadius: 6, padding: 8 }}>
                      <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase' }}>Weight</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{s.rawTx.weight} WU</div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* SIDEBAR */}
        <div>
          {/* IMPORT */}
          <Card title="Import PSBT" icon={'\u{1F4E5}'} accent="#6366f1" sub="Paste base64 or hex — auto-detected">
            <TArea
              label="Base64 or hex PSBT"
              value={s.importText}
              onChange={function (v) { d({ t: 'IMPORT_TEXT', v: v }); }}
              placeholder={'70736274ff\u2026'}
              rows={4}
            />
            <Btn onClick={doImport} color="#6366f1" block disabled={!s.importText.trim()}>
              Import &amp; Analyze {'\u2192'}
            </Btn>
          </Card>

          {/* INSPECTOR */}
          {s.analysis && (
            <Card title="PSBT Inspector" icon={'\u{1F50D}'} accent="#8b5cf6"
              sub={s.analysis.totalSigs + ' sig(s) \u00B7 ' + s.analysis.inputCount + ' in / ' + s.analysis.outputCount + ' out'}
              actions={s.analysis.isFinalized ? <Badge color="#10b981" filled>FINALIZED</Badge> : s.analysis.totalSigs > 0 ? <Badge color="#f59e0b" filled>PARTIALLY SIGNED</Badge> : <Badge color="#64748b">UNSIGNED</Badge>}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
                {[['Version', '2'], ['Locktime', '0'], ['Sigs', String(s.analysis.totalSigs)]].map(function (pair) {
                  return (
                    <div key={pair[0]} style={{ background: '#0a0f1a', borderRadius: 6, padding: 8 }}>
                      <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase' }}>{pair[0]}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{pair[1]}</div>
                    </div>
                  );
                })}
              </div>

              {s.analysis.inputs.map(function (inp) {
                return (
                  <div key={inp.index} style={{ background: '#0a0f1a', borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: '3px solid ' + (inp.isFinalized ? '#10b981' : inp.partialSigs.length ? '#f59e0b' : '#334155') }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>Input #{inp.index}</span>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {inp.isFinalized && <Badge color="#10b981" filled>FINAL</Badge>}
                        {inp.witnessUtxo && <Badge color="#6366f1">WITNESS</Badge>}
                        {inp.witnessScript && <Badge color="#8b5cf6">P2WSH</Badge>}
                        {inp.partialSigs.length > 0 && !inp.isFinalized && <Badge color="#f59e0b">{inp.partialSigs.length} SIG</Badge>}
                      </div>
                    </div>
                    <Field label="TXID" value={inp.txid} mono />
                    {inp.partialSigs.map(function (sg, j) {
                      return <div key={j} style={{ fontSize: 10, fontFamily: 'monospace', color: SIGNER_PRESETS[j % 5].color }}>{'\u270E'} {sg.pubkey.slice(0, 16)}{'\u2026'}</div>;
                    })}
                  </div>
                );
              })}

              {s.analysis.outputs.map(function (out) {
                return (
                  <div key={out.index} style={{ background: '#0a0f1a', borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: '3px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>Output #{out.index}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>{(out.amount / 1e8).toFixed(8)}</span>
                    </div>
                  </div>
                );
              })}

              {s.analysis.fee !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: '#64748b' }}>Fee</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>{s.analysis.fee.toLocaleString()} sats</span>
                </div>
              )}
            </Card>
          )}

          {/* EXPORT */}
          {exportPsbt && (
            <Card title="Export PSBT" icon={'\u{1F4E4}'} accent="#06b6d4"
              actions={s.analysis && (s.analysis.isFinalized ? <Badge color="#10b981" filled>FINALIZED</Badge> : s.analysis.totalSigs > 0 ? <Badge color="#f59e0b" filled>PARTIAL</Badge> : <Badge color="#64748b">UNSIGNED</Badge>)}
            >
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <Btn small color="#06b6d4" outline={s.exportFmt !== 'base64'} onClick={function () { d({ t: 'EXPORT_FMT', v: 'base64' }); }}>Base64</Btn>
                <Btn small color="#06b6d4" outline={s.exportFmt !== 'hex'} onClick={function () { d({ t: 'EXPORT_FMT', v: 'hex' }); }}>Hex</Btn>
              </div>
              <TArea
                value={exportStr || ''}
                onChange={function () {}}
                rows={5}
              />
            </Card>
          )}

          {/* LOG */}
          <Card title="Activity Log" icon={'\u{1F4DC}'}>
            <div style={{ maxHeight: 200, overflow: 'auto' }}>
              {s.log.length === 0 ? (
                <div style={{ fontSize: 11, color: '#334155', fontStyle: 'italic' }}>Select a scenario{'\u2026'}</div>
              ) : s.log.slice().reverse().map(function (e, i) {
                return (
                  <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #0f172a', display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 8, color: '#334155', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{new Date(e.t).toISOString().slice(11, 23)}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{e.m}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* REFERENCE */}
          <Card title="BIP-174 Lifecycle" icon={'\u{1F4D6}'}>
            {STEPS.map(function (step, i) {
              return (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <Dot on={stepIdx >= i} color={step.color} size={6} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: step.color }}>{step.label}</span>
                </div>
              );
            })}
            <div style={{ marginTop: 8, padding: 8, background: '#0a0f1a', borderRadius: 4, fontSize: 9, fontFamily: 'monospace', color: '#475569' }}>
              Magic: <span style={{ color: '#a78bfa' }}>0x70736274ff</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
