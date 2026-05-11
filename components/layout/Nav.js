'use client';

import { STEPS } from '../../lib/constants';
import { Dot } from '../ui';

export function Nav({ currentStep, onStepClick }) {
  const stepIdx = STEPS.findIndex(s => s.id === currentStep);

  return (
    <nav
      role="navigation"
      aria-label="PSBT workflow steps"
      style={{ background: '#0a0f1a', borderBottom: '1px solid var(--color-border)', padding: '0 20px' }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex' }} role="tablist">
        {STEPS.map((step, i) => {
          const active = currentStep === step.id;
          const done = stepIdx > i;
          return (
            <button
              key={step.id}
              role="tab"
              aria-selected={active}
              aria-label={`${step.label} step${done ? ' (completed)' : ''}`}
              onClick={() => onStepClick(step.id)}
              style={{
                flex: 1,
                padding: '10px 8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderBottom: '2px solid ' + (active ? step.color : 'transparent'),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Dot on={active || done} color={step.color} size={7} />
                <span aria-hidden="true" style={{ fontSize: 13 }}>{step.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: active ? step.color : done ? 'var(--color-text-subtle)' : 'var(--color-text-faint)' }}>
                  {step.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
