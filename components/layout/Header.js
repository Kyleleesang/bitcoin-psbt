'use client';

import { Badge, Btn } from '../ui';

export function Header({ network, onReset }) {
  return (
    <header
      role="banner"
      style={{
        background: 'linear-gradient(135deg,#0f172a 0%,#1a103d 100%)',
        borderBottom: '1px solid var(--color-border)',
        padding: '14px 20px',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            aria-hidden="true"
            style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900 }}
          >
            {'₿'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>PSBT Workbench</span>
              <Badge color="#f59e0b" filled>BIP-174</Badge>
              <Badge color="#06b6d4">bitcoinjs-lib</Badge>
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-subtle)', marginTop: 1 }}>
              Institutional Bitcoin Transaction Coordinator
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Badge color="#8b5cf6" filled>{network === 'mainnet' ? 'MAINNET' : 'TESTNET'}</Badge>
          <Btn small outline color="var(--color-text-faint)" onClick={onReset} aria-label="Reset all state">
            Reset
          </Btn>
        </div>
      </div>
    </header>
  );
}
