'use client';

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
        background: '#0c1322',
        borderRadius: 12,
        border: '1px solid #1e293b',
        overflow: 'hidden',
        marginBottom: 14,
      }}
    >
      {title && (
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: accent
              ? 'linear-gradient(135deg, ' + accent + '08 0%, transparent 60%)'
              : 'transparent',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                {title}
              </div>
              {sub && (
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>
                  {sub}
                </div>
              )}
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
          color: '#475569',
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
          color: accent || '#cbd5e1',
          fontFamily: mono
            ? "'SF Mono',Consolas,monospace"
            : 'inherit',
          wordBreak: 'break-all',
          lineHeight: 1.5,
        }}
      >
        {value || '\u2014'}
      </div>
    </div>
  );
}

export function Inp({
  label,
  value,
  onChange,
  placeholder,
  mono,
  type = 'text',
  disabled,
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 10,
            fontWeight: 700,
            color: '#64748b',
            marginBottom: 3,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={function (e) {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '7px 10px',
          background: '#0a0f1a',
          border: '1px solid #1e293b',
          borderRadius: 6,
          color: '#e2e8f0',
          fontSize: 12,
          fontFamily: mono
            ? "'SF Mono',Consolas,monospace"
            : 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
          opacity: disabled ? 0.5 : 1,
        }}
      />
    </div>
  );
}

export function TArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 10,
            fontWeight: 700,
            color: '#64748b',
            marginBottom: 3,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={function (e) {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%',
          padding: '7px 10px',
          background: '#0a0f1a',
          border: '1px solid #1e293b',
          borderRadius: 6,
          color: '#e2e8f0',
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

export function Btn({
  children,
  onClick,
  color = '#3b82f6',
  disabled,
  small,
  outline,
  block,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? '5px 12px' : '8px 18px',
        borderRadius: 8,
        cursor: disabled ? 'default' : 'pointer',
        fontWeight: 600,
        fontSize: small ? 11 : 12,
        border: outline
          ? '1.5px solid ' + color
          : '1.5px solid transparent',
        background: disabled
          ? '#1e293b'
          : outline
          ? 'transparent'
          : color,
        color: disabled ? '#475569' : outline ? color : '#fff',
        opacity: disabled ? 0.5 : 1,
        width: block ? '100%' : 'auto',
        boxShadow:
          disabled || outline
            ? 'none'
            : '0 2px 8px ' + color + '30',
      }}
    >
      {children}
    </button>
  );
}