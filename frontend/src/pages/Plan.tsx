import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { fmt } from '../lib/format';
import PageHead from '../components/PageHead';
import EmptyState from '../components/EmptyState';

export default function Plan() {
  const [allocs, setAllocs] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({savedId:'', mode:'fixed', value:''});

  const load = () => Promise.all([api.get('/finance/allocations'), api.get('/finance/saved-simulations')])
    .then(([a, s]) => { setAllocs(a.data); setSaved(s.data); });
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.savedId) return alert('Selecione uma simulação salva');
    await api.post('/finance/allocations', { ...form, value:Number(form.value) });
    setOpen(false); setForm({savedId:'', mode:'fixed', value:''}); load();
  };

  return (
    <div>
      <PageHead title="Plano de Aportes" subtitle="Vincule simulações salvas a valores ou % do salário. Veja a sobra disponível mensalmente."
        actions={<button className="primary" style={{width:'auto'}} onClick={()=>setOpen(true)} disabled={saved.length===0}>+ Vincular</button>}/>

      {allocs.length===0 ? <EmptyState title="Nenhum vínculo" hint={saved.length===0?'Salve simulações primeiro.':'Vincule uma simulação a um aporte mensal.'}/> : (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
            <thead><tr style={{background:'var(--surface-2)'}}>{['Simulação','Modo','Valor / %','Ações'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{allocs.map(a=>{
              const s = saved.find(x=>x.id===a.savedId);
              return (
                <tr key={a.id} style={{borderBottom:'1px solid var(--border)'}}>
                  <td style={td}>{s?s.name:'?'}</td>
                  <td style={td}>{a.mode==='fixed'?'Valor fixo':a.mode==='pct'?'% sobra':'% salário'}</td>
                  <td style={tdMono}>{a.mode==='fixed'?fmt(Number(a.value)):Number(a.value).toFixed(1)+'%'}</td>
                  <td style={td}><button className="ghost" onClick={()=>{ if(confirm('Remover?'))api.delete(`/finance/allocations/${a.id}`).then(load); }}>🗑</button></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}

      {open && (
        <div onClick={()=>setOpen(false)} style={{position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:90, display:'flex', alignItems:'center', justifyContent:'center', padding:16}}>
          <div onClick={e=>e.stopPropagation()} className="card" style={{maxWidth:400, width:'100%'}}>
            <h3>Novo Vínculo</h3>
            <div className="form-group" style={{marginTop:12}}><label>Simulação</label>
              <select value={form.savedId} onChange={e=>setForm({...form,savedId:e.target.value})}>
                <option value="">Selecione…</option>
                {saved.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Modo</label>
              <select value={form.mode} onChange={e=>setForm({...form,mode:e.target.value})}>
                <option value="fixed">Valor fixo mensal</option>
                <option value="pct">% da sobra</option>
                <option value="salary">% do salário</option>
              </select>
            </div>
            <div className="form-group"><label>Valor ({form.mode==='fixed'?'R$':'%'})</label><input type="number" step="0.01" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></div>
            <button className="primary" onClick={create}>Salvar</button>
          </div>
        </div>
      )}
    </div>
  );
}
const th: React.CSSProperties = { padding:'10px 14px', textAlign:'left', fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 };
const td: React.CSSProperties = { padding:'10px 14px' };
const tdMono: React.CSSProperties = { ...td, fontFamily:'JetBrains Mono,monospace' };
