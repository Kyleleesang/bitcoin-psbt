'use client';

import { Card, Btn } from '../ui';

export function FinalizerStep({ onFinalize }) {
  return (
    <section aria-label="Finalizer step">
      <Card title="Finalizer — Assemble Witness" icon="✅" accent="#ef4444">
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 14px', lineHeight: 1.6 }}>
          Building the final witness stack from the collected partial signatures. After this step, no
          further signatures can be added.
        </p>
        <Btn onClick={onFinalize} color="#ef4444">
          Finalize PSBT →
        </Btn>
      </Card>
    </section>
  );
}
