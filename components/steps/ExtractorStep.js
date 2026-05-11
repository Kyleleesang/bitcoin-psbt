'use client';

import { Badge, Card, Btn } from '../ui';

export function ExtractorStep({ rawTx, onExtract }) {
  return (
    <section aria-label="Extractor step">
      <Card title="Extractor — Broadcast-Ready" icon={'\u{1F4E4}'} accent="#06b6d4">
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 14px', lineHeight: 1.6 }}>
          Extract the fully-signed transaction from the PSBT container. The resulting hex is ready to
          broadcast to the Bitcoin network.
        </p>
        <Btn onClick={onExtract} color="#06b6d4" block>
          Extract Raw Transaction
        </Btn>

        {rawTx && (
          <div
            role="region"
            aria-label="Extracted transaction"
            style={{ marginTop: 14, background: 'var(--color-surface-alt)', borderRadius: 10, padding: 16, border: '1px solid #164e63' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#06b6d4' }}>🎉 Transaction Complete</span>
              <Badge color="#10b981" filled>BROADCAST READY</Badge>
            </div>

            <div
              aria-label="Raw transaction hex"
              style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-text-muted)', wordBreak: 'break-all', lineHeight: 1.6, background: 'var(--color-bg)', borderRadius: 6, padding: 12, maxHeight: 180, overflow: 'auto', border: '1px solid var(--color-border)' }}
            >
              {rawTx.hex}
            </div>

            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
              <div style={{ background: 'var(--color-bg)', borderRadius: 6, padding: 8 }}>
                <dt style={{ fontSize: 9, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>TXID</dt>
                <dd style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-text)', wordBreak: 'break-all', margin: 0 }}>{rawTx.txid}</dd>
              </div>
              <div style={{ background: 'var(--color-bg)', borderRadius: 6, padding: 8 }}>
                <dt style={{ fontSize: 9, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>vSize</dt>
                <dd style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{rawTx.virtualSize} vB</dd>
              </div>
              <div style={{ background: 'var(--color-bg)', borderRadius: 6, padding: 8 }}>
                <dt style={{ fontSize: 9, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>Weight</dt>
                <dd style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{rawTx.weight} WU</dd>
              </div>
            </dl>
          </div>
        )}
      </Card>
    </section>
  );
}
