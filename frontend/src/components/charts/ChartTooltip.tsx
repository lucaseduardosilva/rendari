import { fmt } from '../../lib/format';

export default function ChartTooltip({ active, payload, label, valuePrefix = '' }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', boxShadow: 'var(--shadow)', fontSize: 12 }}>
      <div style={{ color: 'var(--muted)', fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <span style={{ width: 8, height: 8, background: p.color, borderRadius: 2, display: 'inline-block' }} />
          <span style={{ color: 'var(--text-2)' }}>{p.name}:</span>
          <strong style={{ color: 'var(--text)', fontFamily: 'JetBrains Mono,monospace' }}>{valuePrefix}{typeof p.value === 'number' ? fmt(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
}
