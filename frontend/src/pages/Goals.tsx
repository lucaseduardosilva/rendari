import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import { fmt } from '../lib/format';
import PageHead from '../components/PageHead';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const ICONS = ['🎯','🛟','🏠','🚗','✈️','🎓','💍','👶','🏖️','💻','💼'];

interface Goal { id:string; name:string; icon:string; target:number|string; current:number|string; months:number; }

export default function Goals() {
  const c = useCrud<Goal>('/finance/goals');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Goal|null>(null);
  const [form, setForm] = useState({ name:'', icon:'🎯', target:'', current:'0', months:12 });

  const newG = () => { setEdit(null); setForm({name:'', icon:'🎯', target:'', current:'0', months:12}); setOpen(true); };
  const editG = (g:Goal) => { setEdit(g); setForm({name:g.name, icon:g.icon, target:String(g.target), current:String(g.current), months:g.months}); setOpen(true); };
  const save = async (e:React.FormEvent) => { e.preventDefault();
    const data = {...form, target:Number(form.target), current:Number(form.current), months:Number(form.months)};
    edit ? await c.update(edit.id, data) : await c.create(data); setOpen(false);
  };

  return (
    <div>
      <PageHead title="Metas Financeiras" subtitle="Defina objetivos com prazo e valor. O sistema calcula o aporte mensal necessário."
        actions={<button className="primary" style={{width:'auto'}} onClick={newG}>+ Nova Meta</button>}/>

      {c.items.length===0 ? (
        <EmptyState title="Nenhuma meta cadastrada" hint="Reserva de emergência, viagem, entrada de imóvel…"
          action={<button className="primary" style={{width:'auto'}} onClick={newG}>+ Primeira Meta</button>}/>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:14}}>
          {c.items.map(g=>{
            const t = Number(g.target), cur = Number(g.current);
            const pct = Math.min(1, cur/t);
            const remaining = Math.max(0, t-cur);
            const monthly = g.months>0 ? remaining/g.months : 0;
            return (
              <div key={g.id} className="card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                  <h3 style={{fontSize:'1.05rem', margin:0}}>{g.icon} {g.name}</h3>
                  <div>
                    <button className="ghost" onClick={()=>editG(g)}>✏</button>
                    <button className="ghost" onClick={()=>{ if(confirm('Remover?'))c.remove(g.id);}}>🗑</button>
                  </div>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', margin:'8px 0'}}>
                  <span style={{fontFamily:'JetBrains Mono,monospace', fontSize:'1.4rem', fontWeight:800}}>{fmt(cur)}</span>
                  <span style={{fontFamily:'JetBrains Mono,monospace', color:'var(--muted)', fontSize:14}}>/ {fmt(t)}</span>
                </div>
                <div style={{height:10, background:'var(--bg-2)', borderRadius:999, overflow:'hidden'}}>
                  <div style={{width:`${pct*100}%`, height:'100%', background:'var(--grad-primary)', borderRadius:999}}/>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, fontSize:13}}>
                  <span style={{color:'var(--muted)'}}>{g.months} meses · {(pct*100).toFixed(0)}% concluído</span>
                  <span style={{padding:'3px 10px', borderRadius:999, background:'var(--good-soft)', color:'var(--good)', border:'1px solid rgba(34,197,94,.25)', fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700}}>{fmt(monthly)}/mês</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={()=>setOpen(false)} title={edit?'Editar Meta':'Nova Meta'}>
        <form onSubmit={save}>
          <div className="form-group"><label>Nome</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="Ex: Reserva de emergência"/></div>
          <div className="form-group"><label>Ícone</label>
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>{ICONS.map(i=>(
              <button type="button" key={i} onClick={()=>setForm({...form, icon:i})} style={{fontSize:20, padding:'6px 10px', background: form.icon===i?'var(--primary)':'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer'}}>{i}</button>
            ))}</div>
          </div>
          <div className="row">
            <div className="form-group"><label>Valor Alvo (R$)</label><input type="number" step="0.01" min={0} value={form.target} onChange={e=>setForm({...form,target:e.target.value})} required/></div>
            <div className="form-group"><label>Já acumulado</label><input type="number" step="0.01" min={0} value={form.current} onChange={e=>setForm({...form,current:e.target.value})}/></div>
          </div>
          <div className="form-group"><label>Prazo (meses)</label><input type="number" min={1} value={form.months} onChange={e=>setForm({...form,months:Number(e.target.value)})}/></div>
          <button type="submit" className="primary">Salvar</button>
        </form>
      </Modal>
    </div>
  );
}
