import { ReactNode } from 'react';

export default function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="card" style={{ textAlign:'center', padding:'40px 20px' }}>
      <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
      <strong style={{ fontSize:'1.05rem' }}>{title}</strong>
      {hint && <p style={{ color:'var(--muted)', margin:'6px 0 14px', fontSize:14 }}>{hint}</p>}
      {action}
    </div>
  );
}
