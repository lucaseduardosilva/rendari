import { ReactNode, useEffect, useState } from 'react';
import { api } from '../lib/api';
import EmptyState from './EmptyState';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
  mono?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
}

interface Props<T> {
  endpoint: string;
  columns: Column<T>[];
  rowKey?: (row: T) => string;
  emptyTitle?: string;
  emptyHint?: string;
  refreshSignal?: number;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  enableEdit?: boolean;
  enableDelete?: boolean;
  data?: T[];
}

export default function CrudTable<T extends { id: string }>({
  endpoint, columns, rowKey, emptyTitle, emptyHint, refreshSignal, onEdit, onDelete, enableEdit = true, enableDelete = true, data
}: Props<T>) {
  const [items, setItems] = useState<T[]>(data || []);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (data) { setItems(data); return; }
    setLoading(true);
    api.get(endpoint).then(r => { setItems(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [endpoint, refreshSignal, data]);

  if (loading) return <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>Carregando…</div>;
  if (items.length === 0) return <EmptyState title={emptyTitle || 'Nenhum item'} hint={emptyHint} />;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {columns.map(c => (
                <th key={String(c.key)} style={{ padding: '10px 14px', textAlign: c.align || 'left', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, width: c.width }}>
                  {c.label}
                </th>
              ))}
              {(enableEdit || enableDelete) && <th style={{ padding: '10px 14px', width: 100 }}></th>}
            </tr>
          </thead>
          <tbody>
            {items.map(row => (
              <tr key={rowKey ? rowKey(row) : row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                {columns.map(c => (
                  <td key={String(c.key)} style={{ padding: '10px 14px', textAlign: c.align || 'left', fontFamily: c.mono ? 'JetBrains Mono,monospace' : undefined }}>
                    {c.render ? c.render(row) : (row as any)[c.key as string]}
                  </td>
                ))}
                {(enableEdit || enableDelete) && (
                  <td style={{ padding: '10px 14px' }}>
                    {enableEdit && onEdit && <button className="ghost" onClick={() => onEdit(row)}>✏</button>}
                    {enableDelete && onDelete && <button className="ghost" onClick={() => onDelete(row)}>🗑</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
