'use client';

import { useReducer } from 'react';
import { Btn } from '../components/ui';
import { Header } from '../components/layout/Header';
import { Nav } from '../components/layout/Nav';
import { Sidebar } from '../components/sidebar/Sidebar';
import { CreatorStep } from '../components/steps/CreatorStep';
import { UpdaterStep } from '../components/steps/UpdaterStep';
import { SignerStep } from '../components/steps/SignerStep';
import { CombinerStep } from '../components/steps/CombinerStep';
import { FinalizerStep } from '../components/steps/FinalizerStep';
import { ExtractorStep } from '../components/steps/ExtractorStep';
import { init, reduce } from '../lib/reducer';
import { UserError } from '../lib/errors';
import { validateInputs, validateOutputs, validateMultisigParams, validateWifFormat } from '../lib/validation';
import { SIGNER_PRESETS } from '../lib/constants';

export default function Home() {
  const [state, dispatch] = useReducer(reduce, init);

  // ── Derived export state ──────────────────────────────────────────────────
  const exportPsbt = state.finalizedPsbt || state.combinedPsbt || state.psbt;
  const signedB64s = state.signedPsbts.filter(Boolean);
  const exportB64 = state.finalizedPsbt && state.btc ? state.btc.psbtToBase64(state.finalizedPsbt)
    : state.combinedPsbt && state.btc ? state.btc.psbtToBase64(state.combinedPsbt)
    : signedB64s.length === 1 ? signedB64s[0]
    : state.psbtBase64;
  const exportStr = exportPsbt
    ? (state.exportFmt === 'hex' && state.btc ? state.btc.psbtToHex(exportPsbt) : exportB64)
    : null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const log = (m) => dispatch({ t: 'LOG', v: m });

  const dispatchError = (e) => {
    if (e instanceof UserError) {
      dispatch({ t: 'ERR', v: e.message });
    } else {
      console.error(e);
      dispatch({ t: 'ERR', v: 'An unexpected error occurred — check the browser console for details.' });
    }
  };

  const loadBtc = async () => {
    if (state.btc) return state.btc;
    const btc = await import('../lib/bitcoin');
    dispatch({ t: 'BTC', v: btc });
    return btc;
  };

  // ── Action handlers ───────────────────────────────────────────────────────
  const doCreate = async () => {
    try {
      dispatch({ t: 'LOADING', v: true });
      validateMultisigParams(state.m, state.n);
      validateInputs(state.inputs);
      const totalIn = state.inputs.reduce((a, x) => a + x.amount, 0);
      validateOutputs(state.outputs, totalIn);
      state.signerWifs.slice(0, state.n).forEach((wif, i) => {
        if (wif) validateWifFormat(wif.trim(), state.network);
      });

      const btc = await loadBtc();
      let wifCount = 0;
      const signers = Array.from({ length: state.n }, (_, i) => {
        const wif = state.signerWifs[i]?.trim();
        if (wif) { wifCount++; return btc.keyPairFromWIF(wif, state.network); }
        return btc.generateKeyPair(state.network);
      });
      dispatch({ t: 'SIGNERS', v: signers });
      log(`${wifCount} user key(s), ${state.n - wifCount} generated`);

      const multisig = btc.createMultisig(state.m, signers.map(sk => sk.publicKey), state.network);
      dispatch({ t: 'MULTISIG', v: multisig });
      log(`Created ${state.m}-of-${state.n} multisig: ${multisig.address}`);

      const change = btc.createP2WPKH(signers[0].publicKey, state.network);
      const psbt = btc.createPSBT({
        inputs: state.inputs.map(inp => ({
          txid: inp.txid,
          vout: inp.vout,
          witnessUtxo: { amount: inp.amount, scriptPubKey: multisig.scriptPubKey },
          witnessScript: multisig.witnessScript,
          bip32Derivation: signers.map((sk, i) => ({
            pubkey: sk.publicKey,
            fingerprint: sk.fingerprint,
            path: `m/48'/0'/0'/2'/${i}`,
          })),
        })),
        outputs: state.outputs.map((out, i) => {
          const addr = out.address?.trim();
          if (addr) return { address: addr, amount: out.amount };
          if (i === 0) return { address: change.address, amount: out.amount };
          return { address: multisig.address, amount: out.amount };
        }),
        network: state.network,
      });

      const b64 = btc.psbtToBase64(psbt);
      const analysis = btc.analyzePSBT(psbt);
      dispatch({ t: 'PSBT', v: psbt, b64, analysis });
      log(`PSBT created: ${state.inputs.length} input(s), ${state.outputs.length} output(s)`);
      log('Updated with witness UTXOs, scripts, BIP-32 derivations');
      dispatch({ t: 'STEP', v: 'update' });
    } catch (e) {
      dispatchError(e);
    } finally {
      dispatch({ t: 'LOADING', v: false });
    }
  };

  const doSign = async (idx) => {
    try {
      const wif = state.signerWifs[idx]?.trim();
      if (!wif && !state.signers[idx]) {
        throw new UserError(`${SIGNER_PRESETS[idx].name} has no key — enter a WIF key to sign.`);
      }
      if (wif) validateWifFormat(wif, state.network);

      const btc = await loadBtc();
      const cloned = btc.psbtFromBase64(state.psbtBase64, state.network);
      const keyPair = wif ? btc.keyPairFromWIF(wif, state.network).keyPair : state.signers[idx].keyPair;
      btc.signAllInputs(cloned, keyPair);
      dispatch({ t: 'SIGNED', i: idx, v: btc.psbtToBase64(cloned) });
      log(`${SIGNER_PRESETS[idx].name} signed ${state.inputs.length} input(s)${wif ? ' (user WIF)' : ''}`);
    } catch (e) {
      dispatchError(e);
    }
  };

  const doCombine = async () => {
    try {
      const signed = state.signedPsbts.filter(Boolean);
      if (signed.length < state.m) {
        throw new UserError(`Need ${state.m} signed PSBTs, have ${signed.length}`);
      }
      const btc = await loadBtc();
      const psbts = signed.map(b64 => btc.psbtFromBase64(b64, state.network));
      const combined = btc.combinePSBTs(psbts);
      const analysis = btc.analyzePSBT(combined);
      dispatch({ t: 'COMBINED', v: combined, analysis });
      log(`Combined ${signed.length} partially-signed PSBTs`);
      dispatch({ t: 'STEP', v: 'finalize' });
    } catch (e) {
      dispatchError(e);
    }
  };

  const doFinalize = async () => {
    try {
      const btc = await loadBtc();
      btc.finalizePSBT(state.combinedPsbt);
      const analysis = btc.analyzePSBT(state.combinedPsbt);
      dispatch({ t: 'FINALIZED', v: state.combinedPsbt, analysis });
      log('Finalized: witness stacks assembled');
      dispatch({ t: 'STEP', v: 'extract' });
    } catch (e) {
      dispatchError(e);
    }
  };

  const doExtract = async () => {
    try {
      const btc = await loadBtc();
      const tx = btc.extractTransaction(state.finalizedPsbt);
      dispatch({ t: 'RAW_TX', v: tx });
      log(`Extracted raw tx: ${tx.txid}`);
    } catch (e) {
      dispatchError(e);
    }
  };

  const doImport = async () => {
    try {
      const btc = await loadBtc();
      const text = state.importText.trim();
      if (!text) throw new UserError('Paste a PSBT in base64 or hex format first.');

      const psbt = /^[0-9a-fA-F]+$/.test(text)
        ? btc.psbtFromHex(text, state.network)
        : btc.psbtFromBase64(text, state.network);

      const b64 = btc.psbtToBase64(psbt);
      const analysis = btc.analyzePSBT(psbt);
      const nextStep = analysis.isFinalized ? 'extract' : analysis.totalSigs >= state.m ? 'combine' : 'sign';
      dispatch({ t: 'IMPORT', psbt, b64, analysis, nextStep });
    } catch (e) {
      dispatchError(e instanceof UserError ? e : new UserError(`Import failed: ${e.message}`));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <Header network={state.network} onReset={() => dispatch({ t: 'RESET' })} />
      <Nav currentStep={state.step} onStepClick={v => dispatch({ t: 'STEP', v })} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: 20, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
        <div>
          {state.error && (
            <div
              role="alert"
              style={{ background: '#450a0a', border: '1px solid #991b1b', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ fontSize: 12, color: '#fca5a5', wordBreak: 'break-all' }}>{state.error}</span>
              <Btn small outline color="#ef4444" onClick={() => dispatch({ t: 'NOERR' })} aria-label="Dismiss error">×</Btn>
            </div>
          )}

          {state.step === 'create' && (
            <CreatorStep state={state} dispatch={dispatch} onCreate={doCreate} />
          )}
          {state.step === 'update' && (
            <UpdaterStep analysis={state.analysis} dispatch={dispatch} />
          )}
          {state.step === 'sign' && (
            <SignerStep state={state} dispatch={dispatch} onSign={doSign} />
          )}
          {state.step === 'combine' && (
            <CombinerStep state={state} onCombine={doCombine} />
          )}
          {state.step === 'finalize' && (
            <FinalizerStep onFinalize={doFinalize} />
          )}
          {state.step === 'extract' && (
            <ExtractorStep rawTx={state.rawTx} onExtract={doExtract} />
          )}
        </div>

        <Sidebar
          state={state}
          dispatch={dispatch}
          onImport={doImport}
          exportPsbt={exportPsbt}
          exportStr={exportStr}
        />
      </main>
    </div>
  );
}
