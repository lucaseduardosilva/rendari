import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { SCOPES, ScopeMeta } from '../lib/options';
import { useCustomOptions } from '../stores/customOptions';
import { toast } from '../stores/toast';
import { useAuth } from '../stores/auth';

export default function CustomFields() {
  const user = useAuth(s => s.user);
  const items = useCustomOptions(s => s.items);
  const load = useCustomOptions(s => s.load);
  const add = useCustomOptions(s => s.add);
  const remove = useCustomOptions(s => s.remove);
  const update = useCustomOptions(s => s.update);
  const [filter, setFilter] = useState<'all' | 'COMUM' | 'PF' | 'PJ'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { load(true); }, []);

  const visibleScopes = SCOPES.filter(s => {
    if (filter !== 'all' && s.area !== filter) return false;
    if (user?.type === 'PF' && s.area === 'PJ') return false;
    if (search && !s.label.toLowerCase().includes(search.toLowerCase()) && !s.page.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <PageHead title="Campos Personalizados" subtitle="Adicione opções extras aos selects do sistema sem perder os valores padrão. Útil para criar categorias específicas do seu uso." />

      <div className="card" style={{ padding: 14, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar campo ou tela…"
          style={{ flex: '1 1 220px', height: 36, padding: '6px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'COMUM', 'PF', 'PJ'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', background: filter === f ? 'var(--text)' : 'var(--surface-2)', color: filter === f ? 'var(--bg)' : 'var(--muted)', border: '1px solid var(--border)', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
              {f === 'all' ? 'Todos' : f === 'COMUM' ? 'Comum' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Campos disponíveis</div><div className="k-value">{visibleScopes.length}</div></div>
        <div className="kpi"><div className="k-label">Suas opções customizadas</div><div className="k-value" style={{ color: 'var(--good)' }}>{items.length}</div></div>
        <div className="kpi"><div className="k-label">Categorias com customizações</div><div className="k-value">{new Set(items.map(i => i.scope)).size}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 16 }}>
        {visibleScopes.map(scope => (
          <ScopeCard key={scope.key} scope={scope} customs={items.filter(i => i.scope === scope.key)} onAdd={add} onRemove={remove} onUpdate={update} />
        ))}
      </div>

      {visibleScopes.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          Nenhum campo encontrado para os filtros atuais.
        </div>
      )}
    </div>
  );
}

function ChipCustom({ option, onEdit, onRemove }: { option: any; onEdit: () => void; onRemove: () => void }) {
  const inUse = (option.usageCount ?? 0) > 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 4px 4px 10px',
      background: inUse ? 'rgba(91,141,239,.12)' : 'var(--good-soft)',
      border: `1px solid ${inUse ? 'rgba(91,141,239,.35)' : 'rgba(34,197,94,.3)'}`,
      borderRadius: 999, fontSize: 12, color: inUse ? 'var(--primary)' : 'var(--good)', fontWeight: 600,
    }}>
      <button onClick={onEdit} title="Editar (renomeia em todos os registros que usam)"
        style={{ background: 'transparent', border: 0, padding: 0, color: 'inherit', cursor: 'pointer', fontWeight: 'inherit', fontSize: 'inherit', fontFamily: 'inherit' }}>
        {option.value}
      </button>
      {inUse && (
        <span title={`Em uso por ${option.usageCount} ${option.usageLabel || 'registro(s)'}`}
          style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(91,141,239,.18)', borderRadius: 999, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace' }}>
          {option.usageCount}
        </span>
      )}
      <button onClick={onRemove}
        title={inUse ? `🔒 Em uso por ${option.usageCount} ${option.usageLabel || 'registro(s)'} — não pode excluir` : 'Remover'}
        disabled={inUse}
        style={{
          width: 18, height: 18, borderRadius: '50%', background: 'transparent', border: 0,
          cursor: inUse ? 'not-allowed' : 'pointer', color: inUse ? 'var(--muted-2)' : 'inherit',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, lineHeight: 1, padding: 0, opacity: inUse ? .55 : 1,
        }}>
        {inUse ? '🔒' : '×'}
      </button>
    </span>
  );
}

function ScopeCard({ scope, customs, onAdd, onRemove, onUpdate }: {
  scope: ScopeMeta;
  customs: any[];
  onAdd: (scope: string, value: string) => Promise<any>;
  onRemove: (id: string) => Promise<void>;
  onUpdate: (id: string, data: any) => Promise<void>;
}) {
  const [newValue, setNewValue] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = newValue.trim();
    if (!v) return;
    if (scope.defaults.some(d => d.toLowerCase() === v.toLowerCase())) {
      toast(`"${v}" já existe como opção padrão`, 'warn');
      return;
    }
    if (customs.some(c => c.value.toLowerCase() === v.toLowerCase())) {
      toast(`"${v}" já foi adicionado`, 'warn');
      return;
    }
    try {
      await onAdd(scope.key, v);
      setNewValue('');
      toast(`"${v}" adicionado a ${scope.label}`, 'success');
    } catch (e: any) {
      toast(e.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const startEdit = (id: string, value: string) => { setEditing(id); setEditVal(value); };
  const saveEdit = async (id: string) => {
    const v = editVal.trim();
    if (!v) return setEditing(null);
    try {
      await onUpdate(id, { value: v });
      setEditing(null);
      toast('Atualizado', 'success');
    } catch (e: any) {
      toast(e.response?.data?.error || 'Erro', 'error');
    }
  };

  const areaColors: Record<string, string> = { COMUM: 'var(--primary)', PF: 'var(--good)', PJ: 'var(--accent)' };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>{scope.label}</h3>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            Usado em <Link to={scope.pageRoute} style={{ color: 'var(--primary)', fontWeight: 600 }}>{scope.page}</Link>
          </div>
        </div>
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, background: areaColors[scope.area] + '22', color: areaColors[scope.area], fontWeight: 700, letterSpacing: '.05em' }}>{scope.area}</span>
      </div>
      <p style={{ color: 'var(--text-2)', fontSize: 13, margin: '6px 0 12px', lineHeight: 1.5 }}>{scope.description}</p>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, marginBottom: 6 }}>Padrão ({scope.defaults.length})</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {scope.defaults.map(d => (
            <span key={d} style={{ padding: '4px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 999, fontSize: 12, color: 'var(--text-2)' }}>{d}</span>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span>Suas customizações</span>
          <span style={{ color: customs.length > 0 ? 'var(--good)' : 'var(--muted-2)' }}>{customs.length}</span>
        </div>
        {customs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {customs.map(c => editing === c.id ? (
              <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <input value={editVal} autoFocus onChange={e => setEditVal(e.target.value)}
                  onBlur={() => saveEdit(c.id)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') setEditing(null); }}
                  style={{ height: 26, padding: '2px 8px', fontSize: 12, background: 'var(--surface)', border: '1px solid var(--primary)', borderRadius: 999, color: 'var(--text)', width: 140 }} />
              </span>
            ) : (
              <ChipCustom key={c.id} option={c} onEdit={() => startEdit(c.id, c.value)} onRemove={async () => {
                if (c.usageCount && c.usageCount > 0) {
                  toast(`"${c.value}" está em uso por ${c.usageCount} ${c.usageLabel || 'registro(s)'}. Remova ou troque os registros antes de excluir.`, 'warn', 5000);
                  return;
                }
                if (confirm(`Remover "${c.value}"?`)) {
                  try { await onRemove(c.id); toast('Removido', 'success'); }
                  catch (e: any) { toast(e.response?.data?.error || 'Erro ao remover', 'error', 5000); }
                }
              }}/>
            ))}
          </div>
        )}
        <form onSubmit={submit} style={{ display: 'flex', gap: 6 }}>
          <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Adicionar nova opção…"
            style={{ flex: 1, height: 34, padding: '6px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }} />
          <button type="submit" className="primary" style={{ width: 'auto', height: 34, padding: '0 16px', marginTop: 0, fontSize: 13 }} disabled={!newValue.trim()}>+ Add</button>
        </form>
      </div>
    </div>
  );
}
