'use client';

import { Card, Dot, Btn } from '../ui';
import { SIGNER_PRESETS } from '../../lib/constants';

export function CombinerStep({ state, onCombine }) {
  const signedCount = state.signedPsbts.filter(Boolean).length;

  return (
    <section aria-label="Combiner step">
      <Card title="Combiner — Merge Signed PSBTs" icon={'\u{1F517}'} accent="#10b981">
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 14px', lineHeight: 1.6 }}>
          Merging partial signatures into a single PSBT. No new signatures are created here.
        </p>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
          {state.signedPsbts.map((v, i) => {
            if (!v) return null;
            const p = SIGNER_PRESETS[i];
            return (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <Dot on color={p.color} />
                <span style={{ fontSize: 12, fontWeight: 600, color: p.color }}>{p.name}</span>
              </li>
            );
          })}
        </ul>

        <Btn onClick={onCombine} color="#10b981">
          Combine {signedCount} PSBTs →
        </Btn>
      </Card>
    </section>
  );
}
