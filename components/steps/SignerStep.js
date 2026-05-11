'use client';

import { Badge, Card, Inp, Btn } from '../ui';
import { SIGNER_PRESETS } from '../../lib/constants';

export function SignerStep({ state, dispatch, onSign }) {
  const signedCount = state.signedPsbts.filter(Boolean).length;

  return (
    <section aria-label="Signer step">
      <Card
        title="Signer — Multi-Party Signing"
        icon={'\u{1F511}'}
        accent="#f59e0b"
        sub={`${state.m}-of-${state.n} multisig · ${signedCount} signed`}
      >
        {state.signers.length === 0 && (
          <div
            role="alert"
            style={{ background: '#1c1a08', border: '1px solid #78350f', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#fcd34d' }}
          >
            Imported PSBT — no keys were generated in this session. Enter a WIF key for each signer before clicking Sign.
          </div>
        )}

        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 14px', lineHeight: 1.6 }}>
          Each key holder signs independently and returns their partially-signed PSBT.
        </p>

        <div style={{ display: 'grid', gap: 8 }} role="list" aria-label="Signers">
          {Array.from({ length: state.n }, (_, i) => {
            const p = SIGNER_PRESETS[i];
            const done = state.signedPsbts[i] !== null;
            const key = state.signers[i];
            return (
              <div
                key={i}
                role="listitem"
                style={{ background: 'var(--color-surface-alt)', borderRadius: 10, padding: 14, borderLeft: '3px solid ' + p.color, opacity: done ? 0.75 : 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span aria-hidden="true" style={{ fontSize: 18 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-subtle)' }}>{p.role}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {done
                      ? <Badge color="#10b981" filled>SIGNED</Badge>
                      : <Badge color="#475569">AWAITING</Badge>
                    }
                    <Btn
                      small
                      color={p.color}
                      disabled={done}
                      onClick={() => onSign(i)}
                      aria-label={done ? `${p.name} has signed` : `Sign as ${p.name}`}
                    >
                      {done ? '✓' : 'Sign'}
                    </Btn>
                  </div>
                </div>

                {!done && (
                  <div style={{ marginTop: 10 }}>
                    <Inp
                      label={state.signers[i] ? 'WIF (optional — leave blank to use generated key)' : 'WIF key required — enter to sign'}
                      value={state.signerWifs[i]}
                      onChange={v => dispatch({ t: 'SIGNER_WIF', idx: i, v })}
                      placeholder={state.network === 'testnet' ? 'cN…' : 'L1…'}
                      type="password"
                      mono
                    />
                  </div>
                )}
                {key && (
                  <div style={{ marginTop: 4, fontSize: 10, fontFamily: 'monospace', color: 'var(--color-text-faint)' }}>
                    pubkey: {key.pubHex.slice(0, 24)}…
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, background: 'var(--color-surface-alt)', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>Threshold</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: signedCount >= state.m ? '#10b981' : '#f59e0b' }}>
              {signedCount} / {state.m} required
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={signedCount}
            aria-valuemin={0}
            aria-valuemax={state.m}
            aria-label="Signing progress"
            style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}
          >
            <div style={{
              height: '100%', borderRadius: 3, transition: 'width 0.3s',
              width: Math.min(100, (signedCount / state.m) * 100) + '%',
              background: signedCount >= state.m
                ? 'linear-gradient(90deg,#10b981,#059669)'
                : 'linear-gradient(90deg,#f59e0b,#d97706)',
            }} />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <Btn onClick={() => dispatch({ t: 'STEP', v: 'combine' })} color="#10b981" disabled={signedCount < state.m}>
            {signedCount >= state.m ? 'Proceed to Combine →' : `Need ${state.m - signedCount} more`}
          </Btn>
        </div>
      </Card>
    </section>
  );
}
