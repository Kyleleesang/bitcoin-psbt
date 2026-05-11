'use client';

import { Badge, Card, Field, Dot, TArea, Btn } from '../ui';
import { SIGNER_PRESETS, STEPS } from '../../lib/constants';

function ImportPanel({ importText, dispatch, onImport }) {
  return (
    <Card title="Import PSBT" icon={'\u{1F4E5}'} accent="#6366f1" sub="Paste base64 or hex — auto-detected">
      <TArea
        label="Base64 or hex PSBT"
        value={importText}
        onChange={v => dispatch({ t: 'IMPORT_TEXT', v })}
        placeholder={'70736274ff…'}
        rows={4}
      />
      <Btn onClick={onImport} color="#6366f1" block disabled={!importText.trim()}>
        Import & Analyze →
      </Btn>
    </Card>
  );
}

function InspectorPanel({ analysis }) {
  if (!analysis) return null;

  const statusBadge = analysis.isFinalized
    ? <Badge color="#10b981" filled>FINALIZED</Badge>
    : analysis.totalSigs > 0
      ? <Badge color="#f59e0b" filled>PARTIALLY SIGNED</Badge>
      : <Badge color="#64748b">UNSIGNED</Badge>;

  return (
    <Card
      title="PSBT Inspector"
      icon={'\u{1F50D}'}
      accent="#8b5cf6"
      sub={`${analysis.totalSigs} sig(s) · ${analysis.inputCount} in / ${analysis.outputCount} out`}
      actions={statusBadge}
    >
      <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
        {[['Version', '2'], ['Locktime', '0'], ['Sigs', String(analysis.totalSigs)]].map(([label, value]) => (
          <div key={label} style={{ background: 'var(--color-surface-alt)', borderRadius: 6, padding: 8 }}>
            <dt style={{ fontSize: 9, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>{label}</dt>
            <dd style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{value}</dd>
          </div>
        ))}
      </dl>

      {analysis.inputs.map(inp => (
        <div
          key={inp.index}
          style={{
            background: 'var(--color-surface-alt)', borderRadius: 8, padding: 10, marginBottom: 6,
            borderLeft: '3px solid ' + (inp.isFinalized ? '#10b981' : inp.partialSigs.length ? '#f59e0b' : '#334155'),
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>Input #{inp.index}</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {inp.isFinalized && <Badge color="#10b981" filled>FINAL</Badge>}
              {inp.witnessUtxo && <Badge color="#6366f1">WITNESS</Badge>}
              {inp.witnessScript && <Badge color="#8b5cf6">P2WSH</Badge>}
              {inp.partialSigs.length > 0 && !inp.isFinalized && (
                <Badge color="#f59e0b">{inp.partialSigs.length} SIG</Badge>
              )}
            </div>
          </div>
          <Field label="TXID" value={inp.txid} mono />
          {inp.partialSigs.map((sg, j) => (
            <div key={j} style={{ fontSize: 10, fontFamily: 'monospace', color: SIGNER_PRESETS[j % SIGNER_PRESETS.length].color }}>
              ✎ {sg.pubkey.slice(0, 16)}…
            </div>
          ))}
        </div>
      ))}

      {analysis.outputs.map(out => (
        <div key={out.index} style={{ background: 'var(--color-surface-alt)', borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: '3px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>Output #{out.index}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>
              {(out.amount / 1e8).toFixed(8)}
            </span>
          </div>
        </div>
      ))}

      {analysis.fee !== null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-subtle)' }}>Fee</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>{analysis.fee.toLocaleString()} sats</span>
        </div>
      )}
    </Card>
  );
}

function ExportPanel({ exportPsbt, exportStr, exportFmt, analysis, dispatch }) {
  if (!exportPsbt) return null;

  const statusBadge = analysis
    ? analysis.isFinalized
      ? <Badge color="#10b981" filled>FINALIZED</Badge>
      : analysis.totalSigs > 0
        ? <Badge color="#f59e0b" filled>PARTIAL</Badge>
        : <Badge color="#64748b">UNSIGNED</Badge>
    : null;

  return (
    <Card title="Export PSBT" icon={'\u{1F4E4}'} accent="#06b6d4" actions={statusBadge}>
      <div role="group" aria-label="Export format" style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <Btn small color="#06b6d4" outline={exportFmt !== 'base64'} onClick={() => dispatch({ t: 'EXPORT_FMT', v: 'base64' })} aria-pressed={exportFmt === 'base64'}>
          Base64
        </Btn>
        <Btn small color="#06b6d4" outline={exportFmt !== 'hex'} onClick={() => dispatch({ t: 'EXPORT_FMT', v: 'hex' })} aria-pressed={exportFmt === 'hex'}>
          Hex
        </Btn>
      </div>
      <TArea value={exportStr || ''} onChange={() => {}} rows={5} aria-label="Exported PSBT" />
    </Card>
  );
}

function ActivityLog({ log }) {
  return (
    <Card title="Activity Log" icon={'\u{1F4DC}'}>
      <div
        role="log"
        aria-live="polite"
        aria-label="Activity log"
        style={{ maxHeight: 200, overflow: 'auto' }}
      >
        {log.length === 0 ? (
          <div style={{ fontSize: 11, color: '#334155', fontStyle: 'italic' }}>Select a scenario…</div>
        ) : (
          log.slice().reverse().map((entry, i) => (
            <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #0f172a', display: 'flex', gap: 6 }}>
              <time dateTime={new Date(entry.t).toISOString()} style={{ fontSize: 8, color: '#334155', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                {new Date(entry.t).toISOString().slice(11, 23)}
              </time>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{entry.m}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function ReferencePanel({ currentStep }) {
  const stepIdx = STEPS.findIndex(s => s.id === currentStep);
  return (
    <Card title="BIP-174 Lifecycle" icon={'\u{1F4D6}'}>
      {STEPS.map((step, i) => (
        <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
          <Dot on={stepIdx >= i} color={step.color} size={6} />
          <span style={{ fontSize: 10, fontWeight: 700, color: step.color }}>{step.label}</span>
        </div>
      ))}
      <div style={{ marginTop: 8, padding: 8, background: 'var(--color-surface-alt)', borderRadius: 4, fontSize: 9, fontFamily: 'monospace', color: 'var(--color-text-faint)' }}>
        Magic: <span style={{ color: '#a78bfa' }}>0x70736274ff</span>
      </div>
    </Card>
  );
}

export function Sidebar({ state, dispatch, onImport, exportPsbt, exportStr }) {
  return (
    <aside aria-label="Tools and inspector">
      <ImportPanel importText={state.importText} dispatch={dispatch} onImport={onImport} />
      <InspectorPanel analysis={state.analysis} />
      <ExportPanel
        exportPsbt={exportPsbt}
        exportStr={exportStr}
        exportFmt={state.exportFmt}
        analysis={state.analysis}
        dispatch={dispatch}
      />
      <ActivityLog log={state.log} />
      <ReferencePanel currentStep={state.step} />
    </aside>
  );
}
