import { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import { fmt } from '../../lib/format';
import PageHead from '../../components/PageHead';
import Modal from '../../components/Modal';
import SubmitButton from '../../components/SubmitButton';
import { useAsync } from '../../hooks/useAsync';
import { toast } from '../../stores/toast';
import { PAGE_INFO, FEATURE_INFO } from '../../lib/pages';

const FEATURE_OPTIONS: Array<[string, string]> = [
  ['whitelabel', 'Whitelabel (marca personalizada)'],
  ['companyTools', 'Ferramentas de Empresa (PJ)'],
  ['payroll', 'Folha de Pagamento'],
  ['invoices', 'Notas Fiscais'],
  ['costCenters', 'Centros de Custo'],
  ['multiCompany', 'Múltiplas empresas'],
  ['customIntegrations', 'Integrações customizadas'],
  ['sso', 'Single Sign-On (SSO)'],
  ['lifetime', 'Vitalício (lifetime)'],
];

export default function AdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState<any>({ slug:'', name:'', description:'', priceMonth:0, priceYear:0, visibleFor:'ALL', active:true, sortOrder:1, features:{ pages:[], maxSavedSimulations:5, support:'community', whitelabel:false, companyTools:false } });

  const load = () => api.get('/admin/plans').then(r => setPlans(r.data));
  useEffect(() => { load(); }, []);

  const newP = () => { setEdit(null); setForm({ slug:'', name:'', description:'', priceMonth:0, priceYear:0, visibleFor:'ALL', active:true, sortOrder:plans.length+1, features:{pages:[], maxSavedSimulations:5, support:'community', whitelabel:false, companyTools:false} }); setOpen(true); };
  const editP = (p:any) => { setEdit(p); setForm({...p, features: p.features||{}}); setOpen(true); };
  const saveAction = useAsync(async (data:any) => {
    if (edit) await api.put(`/admin/plans/${edit.id}`, data); else await api.post('/admin/plans', data);
    load();
  }, { successMsg: 'Plano salvo' });
  const removeAction = useAsync(async (id:string) => { await api.delete(`/admin/plans/${id}`); load(); }, { successMsg: 'Plano desativado' });
  const save = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!form.slug?.trim()) { toast('Informe o slug', 'warn'); return; }
    if (!form.name?.trim()) { toast('Informe o nome', 'warn'); return; }
    const data = {...form, priceMonth:Number(form.priceMonth), priceYear:Number(form.priceYear), sortOrder:Number(form.sortOrder), features: {...form.features, maxSavedSimulations: Number(form.features.maxSavedSimulations)}};
    const ok = await saveAction.run(data);
    if (ok) { setOpen(false); setEdit(null); setForm({ slug:'', name:'', description:'', priceMonth:0, priceYear:0, visibleFor:'ALL', active:true, sortOrder:plans.length+1, features:{pages:[], maxSavedSimulations:5, support:'community', whitelabel:false, companyTools:false} }); }
  };
  const togglePage = (path:string) => {
    const pages = form.features.pages || [];
    const next = pages.includes(path) ? pages.filter((p:string)=>p!==path) : [...pages, path];
    setForm({...form, features: {...form.features, pages: next}});
  };
  const toggleFeat = (k:string) => setForm({...form, features:{...form.features, [k]: !form.features[k]}});

  return (
    <div>
      <PageHead title="Planos" subtitle="Gerencie os planos comerciais. Defina preços, páginas habilitadas, recursos e visibilidade."
        actions={<button className="primary" style={{width:'auto'}} onClick={newP}>+ Novo Plano</button>}/>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:14}}>
        {plans.map(p=>(
          <div key={p.id} className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <div>
                <strong style={{fontSize:16}}>{p.name}</strong>
                <div style={{fontSize:12, color:'var(--muted)'}}>{p.slug} · {p.visibleFor}</div>
              </div>
              <div>
                <button className="ghost" onClick={()=>editP(p)}>✏</button>
                <button className="ghost" disabled={removeAction.loading} onClick={()=>{ if(confirm('Desativar plano?'))removeAction.run(p.id); }}>🗑</button>
              </div>
            </div>
            <div style={{marginTop:8, fontSize:13, color:'var(--muted)'}}>{p.description}</div>
            <div style={{marginTop:10, fontSize:18, fontWeight:800, fontFamily:'JetBrains Mono,monospace'}}>{fmt(Number(p.priceMonth))}<span style={{fontSize:11, color:'var(--muted)', fontWeight:500}}>/mês</span></div>
            <div style={{marginTop:8, fontSize:11, color: p.active?'var(--good)':'var(--bad)'}}>{p.active?'● Ativo':'○ Inativo'}</div>
            <div style={{marginTop:10, fontSize:12, color:'var(--muted)'}}>{p.features?.pages?.length || 0} páginas · {p.features?.maxSavedSimulations === -1 ? '∞' : p.features?.maxSavedSimulations} simulações</div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title={edit?'Editar Plano':'Novo Plano'} width={700}>
        <form onSubmit={save}>
          <div className="row">
            <div className="form-group"><label>Slug (identificador)</label><input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required disabled={!!edit} placeholder="ex: pro_anual"/></div>
            <div className="form-group"><label>Nome</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
          </div>
          <div className="form-group"><label>Descrição</label><input value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})}/></div>
          <div className="row">
            <div className="form-group"><label>Preço Mensal (R$)</label><input type="number" step="0.01" value={form.priceMonth} onChange={e=>setForm({...form,priceMonth:e.target.value})}/></div>
            <div className="form-group"><label>Preço Anual (R$)</label><input type="number" step="0.01" value={form.priceYear} onChange={e=>setForm({...form,priceYear:e.target.value})}/></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Visível para</label>
              <select value={form.visibleFor} onChange={e=>setForm({...form,visibleFor:e.target.value})}>
                <option value="ALL">Todos</option>
                <option value="PF">Apenas PF</option>
                <option value="PJ">Apenas PJ</option>
              </select>
            </div>
            <div className="form-group"><label>Ordem (sort)</label><input type="number" value={form.sortOrder} onChange={e=>setForm({...form,sortOrder:e.target.value})}/></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Suporte</label>
              <select value={form.features.support||'community'} onChange={e=>setForm({...form, features:{...form.features, support:e.target.value}})}>
                <option value="community">Comunidade</option>
                <option value="email">Email</option>
                <option value="priority">Prioritário</option>
                <option value="dedicated">Dedicado</option>
              </select>
            </div>
            <div className="form-group"><label>Máx Simulações (-1 = ilimitado)</label><input type="number" value={form.features.maxSavedSimulations||5} onChange={e=>setForm({...form, features:{...form.features, maxSavedSimulations:e.target.value}})}/></div>
          </div>
          <div className="form-group">
            <label>Recursos extras</label>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:6, marginTop:6}}>
              {FEATURE_OPTIONS.map(([k, label])=>{
                const on = !!form.features[k];
                return (
                  <button key={k} type="button" onClick={()=>toggleFeat(k)} style={chipStyle(on)}>
                    <span style={checkBoxStyle(on)}>{on ? '✓' : ''}</span>
                    <span style={{flex:1, textAlign:'left'}}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <PageSelector
            value={form.features.pages || []}
            onToggle={togglePage}
            onSelectAll={(all) => setForm({...form, features:{...form.features, pages:all}})}
          />

          <div style={{display:'flex', alignItems:'center', gap:8, marginTop:14, marginBottom:4, padding:'10px 12px', background:'var(--surface-2)', borderRadius:8, border:'1px solid var(--border)'}}>
            <input type="checkbox" id="plan-active" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})} style={{width:16, height:16, accentColor:'var(--primary)'}}/>
            <label htmlFor="plan-active" style={{fontSize:13, color:'var(--text)', cursor:'pointer', margin:0}}>Plano ativo (visível para clientes)</label>
          </div>
          <SubmitButton type="submit" loading={saveAction.loading} style={{marginTop:12}}>Salvar Plano</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}

function chipStyle(on: boolean): React.CSSProperties {
  return {
    display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
    background: on ? 'rgba(91,141,239,.12)' : 'var(--surface-2)',
    border: `1px solid ${on ? 'var(--primary)' : 'var(--border)'}`,
    borderRadius: 8, fontSize: 13, fontWeight: on ? 600 : 500,
    color: on ? 'var(--text)' : 'var(--text-2)',
    cursor:'pointer', fontFamily:'inherit', height:36, transition:'all .12s',
  };
}

function checkBoxStyle(on: boolean): React.CSSProperties {
  return {
    width:18, height:18, borderRadius:4, flexShrink:0,
    background: on ? 'var(--primary)' : 'transparent',
    border: `1.5px solid ${on ? 'var(--primary)' : 'var(--border-strong)'}`,
    display:'flex', alignItems:'center', justifyContent:'center',
    color:'#fff', fontSize:11, fontWeight:800, lineHeight:1,
  };
}

function PageSelector({ value, onToggle, onSelectAll }: { value: string[]; onToggle: (path:string) => void; onSelectAll: (all:string[]) => void }) {
  const all = Object.keys(PAGE_INFO);
  // Agrupa por categoria
  const grouped = useMemo(() => {
    const g: Record<string, Array<{path:string; name:string; pjOnly?:boolean}>> = {};
    Object.entries(PAGE_INFO).forEach(([path, info]) => {
      (g[info.group] = g[info.group] || []).push({ path, name: info.name, pjOnly: info.pjOnly });
    });
    return g;
  }, []);

  const allChecked = value.length === all.length;
  const noneChecked = value.length === 0;

  const toggleGroup = (paths: string[]) => {
    const allOn = paths.every(p => value.includes(p));
    if (allOn) onSelectAll(value.filter(p => !paths.includes(p)));
    else onSelectAll(Array.from(new Set([...value, ...paths])));
  };

  return (
    <div className="form-group">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
        <label style={{margin:0}}>Páginas habilitadas <span style={{color:'var(--muted)', fontWeight:500}}>({value.length}/{all.length})</span></label>
        <div style={{display:'flex', gap:4}}>
          <button type="button" onClick={() => onSelectAll(allChecked ? [] : all)} style={{padding:'3px 10px', fontSize:11, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text-2)', cursor:'pointer', fontFamily:'inherit', textTransform:'none', letterSpacing:0, fontWeight:500}}>
            {allChecked ? 'Limpar tudo' : noneChecked ? 'Marcar tudo' : 'Marcar tudo'}
          </button>
        </div>
      </div>
      <div style={{maxHeight:340, overflowY:'auto', padding:10, background:'var(--surface-2)', borderRadius:8, border:'1px solid var(--border)'}}>
        {Object.entries(grouped).map(([group, items]) => {
          const groupAll = items.every(i => value.includes(i.path));
          const groupSome = !groupAll && items.some(i => value.includes(i.path));
          return (
            <div key={group} style={{marginBottom:14}}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6, paddingBottom:4, borderBottom:'1px solid var(--border)'}}>
                <button type="button" onClick={() => toggleGroup(items.map(i => i.path))} style={{padding:0, background:'transparent', border:0, cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'var(--text)', fontFamily:'inherit'}}>
                  <span style={checkBoxStyle(groupAll)}>{groupAll ? '✓' : groupSome ? '–' : ''}</span>
                  <strong style={{fontSize:12, textTransform:'uppercase', letterSpacing:'.05em', color:'var(--muted)'}}>{group}</strong>
                </button>
                <span style={{marginLeft:'auto', fontSize:11, color:'var(--muted-2)'}}>{items.filter(i => value.includes(i.path)).length}/{items.length}</span>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:4}}>
                {items.map(item => {
                  const on = value.includes(item.path);
                  return (
                    <button key={item.path} type="button" onClick={() => onToggle(item.path)} style={{...chipStyle(on), height:32, padding:'5px 10px', fontSize:12}}>
                      <span style={checkBoxStyle(on)}>{on ? '✓' : ''}</span>
                      <span style={{flex:1, textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{item.name}</span>
                      {item.pjOnly && <span style={{fontSize:9, padding:'1px 5px', background:'rgba(167,139,250,.18)', color:'var(--accent)', borderRadius:3, fontWeight:700}}>PJ</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
