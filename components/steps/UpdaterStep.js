'use client';

import { Badge, Card, Field, Btn } from '../ui';
import { SIGNER_PRESETS } from '../../lib/constants';

export function UpdaterStep({ analysis, dispatch }) {
  if (!analysis) return null;

  return (
    <section aria-label="Updater step">
      <Card title="Updater — PSBT Enrichment" icon={'\u{1F4DD}'} accent="#8b5cf6" sub="Witness data, redeem scripts, and BIP-32 derivation paths applied">
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 14px', lineHeight: 1.6 }}>
          The Updater enriches the PSBT so signers know exactly what they are signing: the UTXO being
          spent, the script that locks it, and the key derivation paths for each participant.
        </p>

        {analysis.inputs.map(inp => (
          <div
            key={inp.index}
            style={{ background: 'var(--color-surface-alt)', borderRadius: 10, padding: 14, marginBottom: 10, borderLeft: '3px solid #8b5cf6' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>Input #{inp.index}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {inp.witnessUtxo && <Badge color="#6366f1">WITNESS UTXO</Badge>}
                {inp.witnessScript && <Badge color="#8b5cf6">P2WSH</Badge>}
              </div>
            </div>

            <Field label="TXID" value={inp.txid} mono />
            {inp.witnessUtxo && (
              <Field
                label="Amount (sats)"
                value={`${inp.witnessUtxo.amount.toLocaleString()} — ${(inp.witnessUtxo.amount / 1e8).toFixed(8)} BTC`}
              />
            )}
            {inp.witnessScript && <Field label="Witness Script (redeem script hex)" value={inp.witnessScript} mono />}

            {inp.bip32Derivation && inp.bip32Derivation.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  BIP-32 Derivation Paths
                </div>
                {inp.bip32Derivation.map((d32, j) => {
                  const p = SIGNER_PRESETS[j % SIGNER_PRESETS.length];
                  return (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'var(--color-bg)', borderRadius: 6, marginBottom: 4 }}>
                      <span aria-hidden="true" style={{ fontSize: 14 }}>{p.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: p.color }}>{p.name}</div>
                        <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-text-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          pubkey: {d32.pubkey}
                        </div>
                      </div>
                      <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#a78bfa', whiteSpace: 'nowrap' }}>{d32.path}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <Btn onClick={() => dispatch({ t: 'STEP', v: 'sign' })} color="#8b5cf6">
          Proceed to Sign →
        </Btn>
      </Card>
    </section>
  );
}
