import { useState } from 'react';
import { useCrud } from '../../hooks/useCrud';
import { fmt } from '../../lib/format';
import PageHead from '../../components/PageHead';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';

interface CC { id:string; name:string; code?:string; budget?:number|string; active:boolean; }

export default function CostCenters() {
  const c = useCrud<CC>('/user/costCenters');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<CC|null>(null);
  const [form, setForm] = useState({ name:'', code:'', budget:'', active:true });

  const newCC = () => { setEdit(null); setForm({name:'', code:'', budget:'', active:true}); setOpen(true); };
  const editCC = (x:CC) => { setEdit(x); setForm({name:x.name, code:x.code||'', budget:String(x.budget||''), active:x.active}); setOpen(true); };
  const save = async (e:React.FormEvent) => { e.preventDefault();
    const data = {...form, budget:Number(form.budget)||0};
    edit ? await c.update(edit.id, data) : await c.create(data); setOpen(false);
  };

  const totalBudget = c.items.reduce((s, x) => s + Number(x.budget || 0), 0);

  return (
    <div>
      <PageHead title="Centros de Custo" subtitle="Aloque despesas a centros para análise gerencial. Compare orçado vs realizado por área."
        actions={<button className="primary" style={{width:'auto'}} onClick={newCC}>+ Centro de Custo</button>}/>

      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Centros</div><div className="k-value">{c.items.length}</div></div>
        <div className="kpi"><div className="k-label">Orçamento Total</div><div className="k-value">{fmt(totalBudget)}</div></div>
        <div className="kpi"><div className="k-label">Ativos</div><div className="k-value">{c.items.filter(x=>x.active).length}</div></div>
      </div>

      {c.items.length===0 ? <EmptyState title="Nenhum centro de custo" hint="Ex: Comercial, Operação, TI, Marketing, Administrativo" action={<button className="primary" style={{width:'auto'}} onClick={newCC}>+ Primeiro</button>}/> : (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
            <thead><tr style={{background:'var(--surface-2)'}}>{['Nome','Código','Orçamento','Status','Ações'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{c.items.map(x=>(
              <tr key={x.id} style={{borderBottom:'1px solid var(--border)'}}>
                <td style={td}><strong>{x.name}</strong></td>
                <td style={td}>{x.code||'—'}</td>
                <td style={tdMono}>{fmt(Number(x.budget||0))}</td>
                <td style={td}><span style={{color: x.active?'var(--good)':'var(--muted)'}}>{x.active?'Ativo':'Inativo'}</span></td>
                <td style={td}>
                  <button className="ghost" onClick={()=>editCC(x)}>✏</button>
                  <button className="ghost" onClick={()=>{ if(confirm('Remover?'))c.remove(x.id);}}>🗑</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={()=>setOpen(false)} title={edit?'Editar':'Novo Centro de Custo'}>
        <form onSubmit={save}>
          <div className="form-group"><label>Nome</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
          <div className="row">
            <div className="form-group"><label>Código</label><input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} placeholder="Ex: CC-001"/></div>
            <div className="form-group"><label>Orçamento Mensal (R$)</label><input type="number" step="0.01" min={0} value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}/></div>
          </div>
          <label className="checkbox-label" style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Ativo</label>
          <button type="submit" className="primary">Salvar</button>
        </form>
      </Modal>
    </div>
  );
}
const th: React.CSSProperties = { padding:'10px 14px', textAlign:'left', fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 };
const td: React.CSSProperties = { padding:'10px 14px' };
const tdMono: React.CSSProperties = { ...td, fontFamily:'JetBrains Mono,monospace' };
