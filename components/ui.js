'use client';

import { useId } from 'react';

export function Badge({ children, color = '#6b7280', filled }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 9999,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.4,
        background: filled ? color : color + '15',
        color: filled ? '#fff' : color,
        border: '1px solid ' + color + '30',
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export function Dot({ on, color = '#10b981', size = 8 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: on ? color : '#27303f',
        border: '1.5px solid ' + (on ? color : '#374151'),
        boxShadow: on ? '0 0 8px ' + color + '60' : 'none',
        flexShrink: 0,
      }}
    />
  );
}

export function Card({ children, title, icon, accent, sub, actions }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        marginBottom: 14,
      }}
    >
      {title && (
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: accent
              ? 'linear-gradient(135deg, ' + accent + '08 0%, transparent 60%)'
              : 'transparent',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon && <span aria-hidden="true" style={{ fontSize: 16 }}>{icon}</span>}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{title}</div>
              {sub && <div style={{ fontSize: 10, color: 'var(--color-text-subtle)', marginTop: 1 }}>{sub}</div>}
            </div>
          </div>
          {actions && <div style={{ display: 'flex', gap: 6 }}>{actions}</div>}
        </div>
      )}
      <div style={{ padding: '14px 18px' }}>{children}</div>
    </div>
  );
}

export function Field({ label, value, mono, accent }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: 'var(--color-text-faint)',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 11,
          color: accent || 'var(--color-text-muted)',
          fontFamily: mono ? "'SF Mono',Consolas,monospace" : 'inherit',
          wordBreak: 'break-all',
          lineHeight: 1.5,
        }}
      >
        {value || '—'}
      </div>
    </div>
  );
}

export function Inp({ label, value, onChange, placeholder, mono, type = 'text', disabled, 'aria-label': ariaLabel }) {
  const id = useId();
  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--color-text-subtle)',
            marginBottom: 3,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={!label ? ariaLabel : undefined}
        aria-disabled={disabled}
        style={{
          width: '100%',
          padding: '7px 10px',
          background: 'var(--color-surface-alt)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          color: 'var(--color-text)',
          fontSize: 12,
          fontFamily: mono ? "'SF Mono',Consolas,monospace" : 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
          opacity: disabled ? 0.5 : 1,
        }}
      />
    </div>
  );
}

export function TArea({ label, value, onChange, placeholder, rows = 3, 'aria-label': ariaLabel }) {
  const id = useId();
  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--color-text-subtle)',
            marginBottom: 3,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        aria-label={!label ? ariaLabel : undefined}
        style={{
          width: '100%',
          padding: '7px 10px',
          background: 'var(--color-surface-alt)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          color: 'var(--color-text)',
          fontSize: 11,
          fontFamily: "'SF Mono',Consolas,monospace",
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

export function Btn({ children, onClick, color = '#3b82f6', disabled, small, outline, block, 'aria-label': ariaLabel, 'aria-pressed': ariaPressed }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-disabled={disabled}
      style={{
        padding: small ? '5px 12px' : '8px 18px',
        borderRadius: 8,
        cursor: disabled ? 'default' : 'pointer',
        fontWeight: 600,
        fontSize: small ? 11 : 12,
        border: outline ? '1.5px solid ' + color : '1.5px solid transparent',
        background: disabled ? 'var(--color-border)' : outline ? 'transparent' : color,
        color: disabled ? 'var(--color-text-faint)' : outline ? color : '#fff',
        opacity: disabled ? 0.5 : 1,
        width: block ? '100%' : 'auto',
        boxShadow: disabled || outline ? 'none' : '0 2px 8px ' + color + '30',
      }}
    >
      {children}
    </button>
  );
}
