import { useState } from 'react';
import { exportCSV, exportXLSX, exportPDF, Column } from '../lib/export';

interface Props<T> {
  filename: string;
  title?: string;
  rows: T[];
  columns: Column<T>[];
  formats?: Array<'csv'|'xlsx'|'pdf'>;
  label?: string;
}

export default function ExportMenu<T>({ filename, title, rows, columns, formats = ['csv','xlsx','pdf'], label = 'Exportar' }: Props<T>) {
  const [open, setOpen] = useState(false);
  const disabled = !rows || rows.length === 0;

  const handle = (kind: 'csv'|'xlsx'|'pdf') => {
    setOpen(false);
    if (kind === 'csv') exportCSV(filename, rows, columns);
    if (kind === 'xlsx') exportXLSX(filename, rows, columns);
    if (kind === 'pdf') exportPDF(filename, title || filename, rows, columns);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button className="secondary" onClick={() => setOpen(v => !v)} disabled={disabled} style={{ width: 'auto', verticalAlign: 'middle' }} title={disabled ? 'Sem dados para exportar' : ''}>
        ⬇ {label}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 70 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', minWidth: 160, padding: 4, zIndex: 80 }}>
            {formats.includes('csv') && <Item icon="📄" label="CSV" hint=".csv" onClick={() => handle('csv')} />}
            {formats.includes('xlsx') && <Item icon="📊" label="Excel" hint=".xlsx" onClick={() => handle('xlsx')} />}
            {formats.includes('pdf') && <Item icon="📑" label="PDF" hint=".pdf" onClick={() => handle('pdf')} />}
          </div>
        </>
      )}
    </div>
  );
}

function Item({ icon, label, hint, onClick }: { icon: string; label: string; hint: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'transparent', border: 0, width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--text-2)', borderRadius: 6, fontFamily: 'inherit', fontSize: 13 }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ flex: 1, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono,monospace' }}>{hint}</span>
    </button>
  );
}
