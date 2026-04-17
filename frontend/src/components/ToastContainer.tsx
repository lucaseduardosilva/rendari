import { useToast } from '../stores/toast';

export default function ToastContainer() {
  const items = useToast(s => s.items);
  const remove = useToast(s => s.remove);
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 200, pointerEvents: 'none' }}>
      {items.map(t => {
        const colors: Record<string, [string, string, string]> = {
          info:    ['var(--primary)', 'rgba(91,141,239,.12)', 'rgba(91,141,239,.35)'],
          success: ['var(--good)',    'rgba(34,197,94,.12)',  'rgba(34,197,94,.35)'],
          warn:    ['var(--warn)',    'rgba(245,158,11,.12)', 'rgba(245,158,11,.35)'],
          error:   ['var(--bad)',     'rgba(239,68,68,.12)',  'rgba(239,68,68,.35)'],
        };
        const [c, bg, b] = colors[t.kind];
        const icon = t.kind==='success'?'✓':t.kind==='warn'?'⚠':t.kind==='error'?'✕':'i';
        return (
          <div key={t.id} onClick={() => remove(t.id)}
            style={{ background: 'var(--surface)', border: `1px solid ${b}`, borderLeft: `4px solid ${c}`, color: 'var(--text)', padding: '10px 14px 10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: 'var(--shadow-lg)', minWidth: 280, maxWidth: 480, display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto', cursor: 'pointer', animation: 'toastIn .25s ease' }}>
            <span style={{ width: 22, height: 22, background: bg, color: c, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{icon}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
