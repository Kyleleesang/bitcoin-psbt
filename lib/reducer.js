import { SCENARIOS } from './constants.js';

export const init = {
  step: 'create',
  scenario: null,
  m: 2,
  n: 3,
  network: 'testnet',
  inputs: SCENARIOS['2-of-3 Multisig Vault'].inputs,
  outputs: SCENARIOS['2-of-3 Multisig Vault'].outputs,
  btc: null,
  signers: [],
  multisig: null,
  psbt: null,
  psbtBase64: null,
  signedPsbts: [],
  combinedPsbt: null,
  finalizedPsbt: null,
  rawTx: null,
  analysis: null,
  signerWifs: ['', '', '', '', ''],
  importText: '',
  exportFmt: 'base64',
  log: [],
  error: null,
  loading: false,
};

export function reduce(state, action) {
  switch (action.t) {
    case 'STEP':
      return { ...state, step: action.v, error: null };

    case 'SCENARIO': {
      const sc = SCENARIOS[action.v];
      return {
        ...state,
        scenario: action.v,
        m: sc.m, n: sc.n, network: sc.network,
        inputs: sc.inputs.map(i => ({ ...i })),
        outputs: sc.outputs.map(o => ({ ...o, address: '' })),
        signers: [], multisig: null, psbt: null, psbtBase64: null,
        signedPsbts: Array(sc.n).fill(null),
        combinedPsbt: null, finalizedPsbt: null, rawTx: null, analysis: null,
        signerWifs: ['', '', '', '', ''],
        step: 'create', error: null, log: [],
      };
    }

    case 'INPUT_EDIT': {
      const inputs = [...state.inputs];
      inputs[action.idx] = { ...inputs[action.idx], [action.field]: action.v };
      return { ...state, inputs };
    }
    case 'INPUT_ADD':
      return { ...state, inputs: [...state.inputs, { txid: '', vout: 0, amount: 0, label: 'New Input' }] };
    case 'INPUT_REM':
      return { ...state, inputs: state.inputs.filter((_, j) => j !== action.idx) };

    case 'OUTPUT_EDIT': {
      const outputs = [...state.outputs];
      outputs[action.idx] = { ...outputs[action.idx], [action.field]: action.v };
      return { ...state, outputs };
    }
    case 'OUTPUT_ADD':
      return { ...state, outputs: [...state.outputs, { label: 'New Output', amount: 0, address: '' }] };
    case 'OUTPUT_REM':
      return { ...state, outputs: state.outputs.filter((_, j) => j !== action.idx) };

    case 'SIGNER_WIF': {
      const signerWifs = [...state.signerWifs];
      signerWifs[action.idx] = action.v;
      return { ...state, signerWifs };
    }

    case 'BTC':       return { ...state, btc: action.v };
    case 'SIGNERS':   return { ...state, signers: action.v };
    case 'MULTISIG':  return { ...state, multisig: action.v };
    case 'PSBT':      return { ...state, psbt: action.v, psbtBase64: action.b64, analysis: action.analysis };
    case 'SIGNED': {
      const signedPsbts = [...state.signedPsbts];
      signedPsbts[action.i] = action.v;
      return { ...state, signedPsbts };
    }
    case 'COMBINED':  return { ...state, combinedPsbt: action.v, analysis: action.analysis };
    case 'FINALIZED': return { ...state, finalizedPsbt: action.v, analysis: action.analysis };
    case 'RAW_TX':    return { ...state, rawTx: action.v };
    case 'ANALYSIS':  return { ...state, analysis: action.v };

    case 'IMPORT_TEXT': return { ...state, importText: action.v };
    case 'EXPORT_FMT':  return { ...state, exportFmt: action.v };

    case 'IMPORT': {
      const importedPsbts = Array(state.n).fill(null);
      if (action.analysis.totalSigs > 0) importedPsbts[0] = action.b64;
      return {
        ...state,
        psbt: action.psbt, psbtBase64: action.b64, analysis: action.analysis,
        step: action.nextStep,
        signers: [], signedPsbts: importedPsbts,
        combinedPsbt: null, finalizedPsbt: null, rawTx: null,
        importText: '', error: null,
        log: [...state.log, { t: Date.now(), m: 'Imported PSBT — jumped to ' + action.nextStep }],
      };
    }

    case 'LOG':     return { ...state, log: [...state.log, { t: Date.now(), m: action.v }] };
    case 'ERR':     return { ...state, error: action.v, loading: false };
    case 'NOERR':   return { ...state, error: null };
    case 'LOADING': return { ...state, loading: action.v };
    case 'RESET':   return { ...init };

    default: return state;
  }
}
