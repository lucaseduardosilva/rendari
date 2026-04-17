import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import { fmt } from '../lib/format';
import PageHead from '../components/PageHead';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ExportMenu from '../components/ExportMenu';
import { useOptions } from '../hooks/useOptions';

interface Stream { id:string; name:string; type:string; status:string; desc?:string; invest:number|string; ticket:number|string; cost:number|string; freq:number; lifetime:number; fixed:number|string; }

export default function Streams() {
  const TYPES = useOptions('stream.type');
  const c = useCrud<Stream>('/finance/streams');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Stream|null>(null);
  const [form, setForm] = useState<any>({name:'', type:'Serviço', status:'active', desc:'', invest:'0', ticket:'', cost:'0', freq:1, lifetime:12, fixed:'0'});

  const newS = () => { setEdit(null); setForm({name:'', type:'Serviço', status:'active', desc:'', invest:'0', ticket:'', cost:'0', freq:1, lifetime:12, fixed:'0'}); setOpen(true); };
  const editS = (s:Stream) => { setEdit(s); setForm(s); setOpen(true); };
  const save = async (e:React.FormEvent) => { e.preventDefault();
    const data = {...form, invest:Number(form.invest), ticket:Number(form.ticket), cost:Number(form.cost), freq:Number(form.freq), lifetime:Number(form.lifetime), fixed:Number(form.fixed)};
    edit ? await c.update(edit.id, data) : await c.create(data); setOpen(false);
  };

  const calcLTV = (s:Stream) => {
    const purchases = Number(s.freq)>0 ? Number(s.lifetime)/Number(s.freq) : Number(s.lifetime);
    const margin = Number(s.ticket)>0 ? (Number(s.ticket)-Number(s.cost))/Number(s.ticket) : 1;
    return Number(s.ticket) * purchases * margin;
  };

  return (
    <div>
      <PageHead title="Estratégias de Renda" subtitle="Gerencie fontes de renda — serviços, infoprodutos, SaaS, dropshipping, aluguel — com métricas reais (ROI, LTV, Payback)."
        actions={<>
          <ExportMenu filename="estrategias-renda" title="Estratégias de Renda" rows={c.items} columns={[
            {key:'name',label:'Nome'},{key:'type',label:'Tipo'},{key:'status',label:'Status'},
            {key:'desc',label:'Descrição'},
            {key:'invest',label:'Investimento',format:r=>fmt(Number(r.invest))},
            {key:'ticket',label:'Ticket',format:r=>fmt(Number(r.ticket))},
            {key:'cost',label:'Custo Var.',format:r=>fmt(Number(r.cost))},
            {key:'ltv',label:'LTV',format:r=>fmt(calcLTV(r))},
          ]}/>
          <button className="primary" style={{width:'auto'}} onClick={newS}>+ Estratégia</button>
        </>}/>

      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Estratégias</div><div className="k-value">{c.items.length}</div><div style={{fontSize:11, color:'var(--muted)'}}>{c.items.filter(s=>s.status==='active').length} ativas</div></div>
        <div className="kpi"><div className="k-label">Investimento Total</div><div className="k-value">{fmt(c.items.reduce((s,x)=>s+Number(x.invest),0))}</div></div>
        <div className="kpi"><div className="k-label">LTV Médio</div><div className="k-value">{c.items.length>0 ? fmt(c.items.reduce((s,x)=>s+calcLTV(x),0)/c.items.length) : 'R$ 0'}</div></div>
      </div>

      {c.items.length===0 ? <EmptyState title="Nenhuma estratégia" hint="Crie sua primeira fonte de renda — serviço, infoproduto, SaaS, dropshipping…" action={<button className="primary" style={{width:'auto'}} onClick={newS}>+ Primeira</button>}/> : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:14}}>
          {c.items.map(s=>{
            const ltv = calcLTV(s);
            return (
              <div key={s.id} className="card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <div>
                    <h3 style={{margin:0, fontSize:'1.05rem'}}>💼 {s.name}</h3>
                    <div style={{fontSize:12, color:'var(--muted)'}}>{s.type} · <span style={{color: s.status==='active'?'var(--good)':'var(--muted)'}}>{s.status}</span></div>
                    {s.desc && <p style={{fontSize:13, color:'var(--text-2)', margin:'8px 0 0'}}>{s.desc}</p>}
                  </div>
                  <div>
                    <button className="ghost" onClick={()=>editS(s)}>✏</button>
                    <button className="ghost" onClick={()=>{ if(confirm('Remover?'))c.remove(s.id);}}>🗑</button>
                  </div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10}}>
                  <Mini label="Ticket" value={fmt(Number(s.ticket))}/>
                  <Mini label="Custo Var." value={fmt(Number(s.cost))}/>
                  <Mini label="Investimento" value={fmt(Number(s.invest))}/>
                  <Mini label="LTV" value={fmt(ltv)}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={()=>setOpen(false)} title={edit?'Editar Estratégia':'Nova Estratégia'} width={560}>
        <form onSubmit={save}>
          <div className="form-group"><label>Nome</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
          <div className="row">
            <div className="form-group"><label>Tipo</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Status</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="active">Ativa</option><option value="paused">Pausada</option><option value="planned">Planejada</option><option value="closed">Encerrada</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Descrição</label><input value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})}/></div>
          <div className="row">
            <div className="form-group"><label>Investimento Inicial (R$)</label><input type="number" step="0.01" value={form.invest} onChange={e=>setForm({...form,invest:e.target.value})}/></div>
            <div className="form-group"><label>Ticket Médio (R$)</label><input type="number" step="0.01" value={form.ticket} onChange={e=>setForm({...form,ticket:e.target.value})}/></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Custo Variável (R$)</label><input type="number" step="0.01" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})}/></div>
            <div className="form-group"><label>Custos Fixos/Mês (R$)</label><input type="number" step="0.01" value={form.fixed} onChange={e=>setForm({...form,fixed:e.target.value})}/></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Frequência (meses)</label><input type="number" min={1} value={form.freq} onChange={e=>setForm({...form,freq:e.target.value})}/></div>
            <div className="form-group"><label>Lifetime (meses)</label><input type="number" min={1} value={form.lifetime} onChange={e=>setForm({...form,lifetime:e.target.value})}/></div>
          </div>
          <button type="submit" className="primary">Salvar</button>
        </form>
      </Modal>
    </div>
  );
}

function Mini({label,value,color}:{label:string; value:string; color?:string}) {
  return (
    <div style={{background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 10px'}}>
      <div style={{fontSize:10, color:'var(--muted)', textTransform:'uppercase', fontWeight:600}}>{label}</div>
      <div style={{fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:13, marginTop:2, color:color||'var(--text)'}}>{value}</div>
    </div>
  );
}
