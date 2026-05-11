'use client';

import { Badge, Card, Inp, Btn } from '../ui';
import { SIGNER_PRESETS, SCENARIOS } from '../../lib/constants';

export function CreatorStep({ state, dispatch, onCreate }) {
  const totalIn = state.inputs.reduce((a, x) => a + x.amount, 0);
  const totalOut = state.outputs.reduce((a, x) => a + x.amount, 0);
  const fee = totalIn - totalOut;

  return (
    <section aria-label="Creator step">
      <Card title="Transaction Scenario" icon={'\u{1F4CB}'} accent="#3b82f6" sub="Select a pre-built scenario">
        <div style={{ display: 'grid', gap: 8 }}>
          {Object.entries(SCENARIOS).map(([name, sc]) => (
            <button
              key={name}
              onClick={() => dispatch({ t: 'SCENARIO', v: name })}
              aria-pressed={state.scenario === name}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px',
                background: state.scenario === name ? '#1e3a5f' : 'var(--color-surface-alt)',
                border: '1.5px solid ' + (state.scenario === name ? '#3b82f6' : 'var(--color-border)'),
                borderRadius: 8, cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: state.scenario === name ? '#60a5fa' : 'var(--color-text-muted)' }}>
                  {name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-subtle)', marginTop: 2 }}>{sc.desc}</div>
              </div>
              <Badge color={state.scenario === name ? '#3b82f6' : '#475569'}>{sc.m}-of-{sc.n}</Badge>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Inputs (UTXOs)" icon={'\u{1F4E5}'} accent="#3b82f6">
        {state.inputs.map((inp, i) => (
          <div key={i} style={{ background: 'var(--color-surface-alt)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>Input #{i}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {inp.amount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>
                    {(inp.amount / 1e8).toFixed(8)} BTC
                  </span>
                )}
                {state.inputs.length > 1 && (
                  <Btn small outline color="#ef4444" onClick={() => dispatch({ t: 'INPUT_REM', idx: i })} aria-label={`Remove input ${i}`}>
                    ×
                  </Btn>
                )}
              </div>
            </div>
            <Inp
              label="TXID"
              value={inp.txid}
              onChange={v => dispatch({ t: 'INPUT_EDIT', idx: i, field: 'txid', v })}
              placeholder="7b1eabe0209b1fe794124575ef807057c77ada2138ae4fa8d6c4de0398a14f3c"
              mono
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Inp
                  label="Vout"
                  value={String(inp.vout)}
                  onChange={v => dispatch({ t: 'INPUT_EDIT', idx: i, field: 'vout', v: Math.max(0, parseInt(v) || 0) })}
                  type="number"
                />
              </div>
              <div style={{ flex: 2 }}>
                <Inp
                  label="Amount (sats)"
                  value={String(inp.amount)}
                  onChange={v => dispatch({ t: 'INPUT_EDIT', idx: i, field: 'amount', v: Math.max(0, parseInt(v) || 0) })}
                  type="number"
                />
              </div>
            </div>
          </div>
        ))}
        <Btn small outline color="#3b82f6" onClick={() => dispatch({ t: 'INPUT_ADD' })}>+ Add UTXO</Btn>
      </Card>

      <Card title="Outputs" icon={'\u{1F4E4}'} accent="#3b82f6">
        {state.outputs.map((out, i) => (
          <div key={i} style={{ background: 'var(--color-surface-alt)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{out.label || 'Output #' + i}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {out.amount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>
                    {(out.amount / 1e8).toFixed(8)} BTC
                  </span>
                )}
                {state.outputs.length > 1 && (
                  <Btn small outline color="#ef4444" onClick={() => dispatch({ t: 'OUTPUT_REM', idx: i })} aria-label={`Remove output ${i}`}>
                    ×
                  </Btn>
                )}
              </div>
            </div>
            <Inp label="Label" value={out.label || ''} onChange={v => dispatch({ t: 'OUTPUT_EDIT', idx: i, field: 'label', v })} placeholder={'Output #' + i} />
            <Inp
              label="Address (leave blank to auto-derive)"
              value={out.address || ''}
              onChange={v => dispatch({ t: 'OUTPUT_EDIT', idx: i, field: 'address', v })}
              placeholder="tb1q… or leave blank"
              mono
            />
            <Inp
              label="Amount (sats)"
              value={String(out.amount)}
              onChange={v => dispatch({ t: 'OUTPUT_EDIT', idx: i, field: 'amount', v: Math.max(0, parseInt(v) || 0) })}
              type="number"
            />
          </div>
        ))}
        {fee > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0f172a', borderRadius: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>Network Fee</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
              {fee.toLocaleString()} sats
            </span>
          </div>
        )}
        <Btn small outline color="#3b82f6" onClick={() => dispatch({ t: 'OUTPUT_ADD' })}>+ Add Output</Btn>
      </Card>

      <Card title="Signer Keys (optional)" icon={'\u{1F511}'} accent="#f59e0b" sub="Provide WIF keys to build multisig from real keys. Leave blank to auto-generate.">
        {Array.from({ length: state.n }, (_, i) => {
          const p = SIGNER_PRESETS[i];
          return (
            <Inp
              key={i}
              label={`${p.icon} ${p.name} WIF`}
              value={state.signerWifs[i]}
              onChange={v => dispatch({ t: 'SIGNER_WIF', idx: i, v })}
              placeholder={state.network === 'testnet' ? 'cN… (testnet WIF)' : 'L1… (mainnet WIF)'}
              type="password"
              mono
            />
          );
        })}
      </Card>

      <Btn onClick={onCreate} color="#3b82f6" block disabled={!state.scenario || state.loading}>
        {state.loading ? 'Creating…' : 'Create & Update PSBT →'}
      </Btn>
    </section>
  );
}
