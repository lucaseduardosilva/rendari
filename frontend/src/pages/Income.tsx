import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { fmt } from '../lib/format';
import PageHead from '../components/PageHead';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ExportMenu from '../components/ExportMenu';
import { useOptions } from '../hooks/useOptions';

const FREQ = [['monthly','Mensal'],['annual','Anual'],['one-time','Única']] as const;

interface Income { id:string; desc:string; cat:string; freq:string; value:number|string; }

export default function Income() {
  const CATS = useOptions('income.cat');
  const [items, setItems] = useState<Income[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Income|null>(null);
  const [form, setForm] = useState<any>({ desc:'', cat:'Salário', freq:'monthly', value:'' });

  const load = () => api.get('/finance/incomes').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const monthly = items.reduce((s, i) => {
    const v = Number(i.value);
    return s + (i.freq==='monthly'?v: i.freq==='annual'?v/12 : v/12);
  }, 0);

  const openNew = () => { setEdit(null); setForm({ desc:'', cat:'Salário', freq:'monthly', value:'' }); setOpen(true); };
  const openEdit = (i:Income) => { setEdit(i); setForm(i); setOpen(true); };
  const save = async (e:React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, value: Number(form.value) };
    if (edit) await api.put(`/finance/incomes/${edit.id}`, data);
    else await api.post('/finance/incomes', data);
    setOpen(false); load();
  };
  const remove = async (id:string) => {
    if (!confirm('Remover esta receita?')) return;
    await api.delete(`/finance/incomes/${id}`); load();
  };

  return (
    <div>
      <PageHead title="Receitas" subtitle="Cadastre todas as suas fontes de renda. Calcula o equivalente mensal."
        actions={<>
          <ExportMenu filename="receitas" title="Receitas" rows={items} columns={[
            {key:'desc',label:'Descrição'},{key:'cat',label:'Categoria'},
            {key:'freq',label:'Frequência',format:r=>FREQ.find(f=>f[0]===r.freq)?.[1]||r.freq},
            {key:'value',label:'Valor',format:r=>fmt(Number(r.value))},
            {key:'mensal',label:'Mensal Equivalente',format:r=>fmt(r.freq==='monthly'?Number(r.value): r.freq==='annual'?Number(r.value)/12:Number(r.value)/12)},
          ]}/>
          <button className="primary" style={{width:'auto'}} onClick={openNew}>+ Nova Receita</button>
        </>} />

      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Total Mensal</div><div className="k-value" style={{color:'var(--good)'}}>{fmt(monthly)}</div></div>
        <div className="kpi"><div className="k-label">Total Anual</div><div className="k-value">{fmt(monthly*12)}</div></div>
        <div className="kpi"><div className="k-label">Fontes</div><div className="k-value">{items.length}</div></div>
      </div>

      {items.length===0 ? (
        <EmptyState title="Nenhuma receita cadastrada" hint="Adicione salário, freelances, dividendos, aluguéis recebidos…"
          action={<button className="primary" style={{width:'auto'}} onClick={openNew}>Adicionar primeira receita</button>} />
      ) : (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
              <thead><tr style={{background:'var(--surface-2)'}}>
                {['Descrição','Categoria','Frequência','Valor','Mensal Equiv.','Ações'].map(h=>(
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{items.map(i=>{
                const mEquiv = i.freq==='monthly'?Number(i.value): i.freq==='annual'?Number(i.value)/12:Number(i.value)/12;
                return (
                  <tr key={i.id} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={td}>{i.desc}</td>
                    <td style={td}>{i.cat}</td>
                    <td style={td}>{FREQ.find(f=>f[0]===i.freq)?.[1]}</td>
                    <td style={tdMono}>{fmt(Number(i.value))}</td>
                    <td style={{...tdMono, color:'var(--good)'}}>{fmt(mEquiv)}</td>
                    <td style={td}>
                      <button className="ghost" onClick={()=>openEdit(i)}>✏</button>
                      <button className="ghost" onClick={()=>remove(i.id)}>🗑</button>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={open} onClose={()=>setOpen(false)} title={edit?'Editar Receita':'Nova Receita'}>
        <form onSubmit={save}>
          <div className="form-group"><label>Descrição</label>
            <input value={form.desc} onChange={e=>setForm({...form, desc:e.target.value})} required/></div>
          <div className="row">
            <div className="form-group"><label>Categoria</label>
              <select value={form.cat} onChange={e=>setForm({...form, cat:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="form-group"><label>Frequência</label>
              <select value={form.freq} onChange={e=>setForm({...form, freq:e.target.value})}>{FREQ.map(f=><option key={f[0]} value={f[0]}>{f[1]}</option>)}</select></div>
          </div>
          <div className="form-group"><label>Valor (R$)</label>
            <input type="number" step="0.01" min="0" value={form.value} onChange={e=>setForm({...form, value:e.target.value})} required/></div>
          <button type="submit" className="primary">Salvar</button>
        </form>
      </Modal>
    </div>
  );
}

const th: React.CSSProperties = { padding:'10px 14px', textAlign:'left', fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 };
const td: React.CSSProperties = { padding:'10px 14px' };
const tdMono: React.CSSProperties = { ...td, fontFamily:'JetBrains Mono,monospace' };
