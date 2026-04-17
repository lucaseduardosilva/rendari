import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import { fmt } from '../lib/format';
import PageHead from '../components/PageHead';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ExportMenu from '../components/ExportMenu';
import { useOptions } from '../hooks/useOptions';

interface Property { id:string; name:string; type:string; purpose:string; addr?:string; area?:number|string; rooms?:number; buy:number|string; current:number|string; debt:number|string; rent:number|string; }
const PURPOSE = [['residence','Moradia'],['rental','Aluguel'],['sale','Venda futura'],['vacation','Veraneio'],['commercial','Comercial']] as const;

export default function Properties() {
  const TYPES = useOptions('property.type');
  const c = useCrud<Property>('/finance/properties');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Property|null>(null);
  const [form, setForm] = useState<any>({name:'', type:'Apartamento', purpose:'residence', addr:'', area:'', rooms:'', buy:'', current:'', debt:'0', rent:'0'});

  const totalCurrent = c.items.reduce((s,p)=>s+Number(p.current||0),0);
  const totalDebt = c.items.reduce((s,p)=>s+Number(p.debt||0),0);
  const totalRent = c.items.reduce((s,p)=>s+Number(p.rent||0),0);
  const equity = totalCurrent - totalDebt;

  const newP = () => { setEdit(null); setForm({name:'', type:'Apartamento', purpose:'residence', addr:'', area:'', rooms:'', buy:'', current:'', debt:'0', rent:'0'}); setOpen(true); };
  const editP = (p:Property) => { setEdit(p); setForm({...p, area:p.area||'', rooms:p.rooms||'', addr:p.addr||''}); setOpen(true); };
  const save = async (e:React.FormEvent) => { e.preventDefault();
    const data = {...form, area:Number(form.area)||0, rooms:Number(form.rooms)||0, buy:Number(form.buy), current:Number(form.current), debt:Number(form.debt), rent:Number(form.rent)};
    edit ? await c.update(edit.id, data) : await c.create(data); setOpen(false);
  };

  return (
    <div>
      <PageHead title="Imóveis" subtitle="Acompanhe valorização, aluguel recebido, financiamento e ROI dos seus imóveis."
        actions={<>
          <ExportMenu filename="imoveis" title="Imóveis" rows={c.items} columns={[
            {key:'name',label:'Nome'},{key:'type',label:'Tipo'},
            {key:'purpose',label:'Finalidade',format:r=>PURPOSE.find(x=>x[0]===r.purpose)?.[1]||r.purpose},
            {key:'area',label:'Área m²'},{key:'rooms',label:'Quartos'},
            {key:'buy',label:'Aquisição',format:r=>fmt(Number(r.buy))},
            {key:'current',label:'Valor Atual',format:r=>fmt(Number(r.current))},
            {key:'debt',label:'Financiamento',format:r=>fmt(Number(r.debt))},
            {key:'rent',label:'Aluguel/mês',format:r=>fmt(Number(r.rent))},
          ]}/>
          <button className="primary" style={{width:'auto'}} onClick={newP}>+ Imóvel</button>
        </>}/>

      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Imóveis</div><div className="k-value">{c.items.length}</div></div>
        <div className="kpi"><div className="k-label">Valor de Mercado</div><div className="k-value">{fmt(totalCurrent)}</div></div>
        <div className="kpi"><div className="k-label">Equity Total</div><div className="k-value" style={{color:'var(--good)'}}>{fmt(equity)}</div></div>
        <div className="kpi"><div className="k-label">Financiamento</div><div className="k-value" style={{color:'var(--bad)'}}>{fmt(totalDebt)}</div></div>
        <div className="kpi"><div className="k-label">Aluguel/mês</div><div className="k-value" style={{color:'var(--good)'}}>{fmt(totalRent)}</div></div>
      </div>

      {c.items.length===0 ? <EmptyState title="Nenhum imóvel" hint="Cadastre apartamentos, casas, terrenos…" action={<button className="primary" style={{width:'auto'}} onClick={newP}>+ Primeiro imóvel</button>}/> : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:14}}>
          {c.items.map(p=>{
            const valuation = Number(p.current)-Number(p.buy);
            const yieldA = Number(p.buy)>0 ? (Number(p.rent)*12)/Number(p.buy) : 0;
            return (
              <div key={p.id} className="card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <div>
                    <h3 style={{margin:0, fontSize:'1.05rem'}}>🏘 {p.name}</h3>
                    <div style={{fontSize:12, color:'var(--muted)'}}>{p.type} · {PURPOSE.find(x=>x[0]===p.purpose)?.[1]}</div>
                  </div>
                  <div>
                    <button className="ghost" onClick={()=>editP(p)}>✏</button>
                    <button className="ghost" onClick={()=>{ if(confirm('Remover?'))c.remove(p.id);}}>🗑</button>
                  </div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10}}>
                  <Mini label="Aquisição" value={fmt(Number(p.buy))}/>
                  <Mini label="Valor Atual" value={fmt(Number(p.current))}/>
                  <Mini label="Valorização" value={(valuation>=0?'+':'')+fmt(valuation)} color={valuation>=0?'var(--good)':'var(--bad)'}/>
                  <Mini label="Yield a.a." value={(yieldA*100).toFixed(2)+'%'}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={()=>setOpen(false)} title={edit?'Editar Imóvel':'Novo Imóvel'} width={560}>
        <form onSubmit={save}>
          <div className="form-group"><label>Nome / Apelido</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
          <div className="row">
            <div className="form-group"><label>Tipo</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Finalidade</label>
              <select value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})}>
                {PURPOSE.map(p=><option key={p[0]} value={p[0]}>{p[1]}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label>Endereço</label><input value={form.addr} onChange={e=>setForm({...form,addr:e.target.value})}/></div>
          <div className="row">
            <div className="form-group"><label>Área (m²)</label><input type="number" step="0.01" value={form.area} onChange={e=>setForm({...form,area:e.target.value})}/></div>
            <div className="form-group"><label>Quartos</label><input type="number" min={0} value={form.rooms} onChange={e=>setForm({...form,rooms:e.target.value})}/></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Aquisição (R$)</label><input type="number" step="0.01" value={form.buy} onChange={e=>setForm({...form,buy:e.target.value})}/></div>
            <div className="form-group"><label>Valor Atual (R$)</label><input type="number" step="0.01" value={form.current} onChange={e=>setForm({...form,current:e.target.value})}/></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Saldo Financ. (R$)</label><input type="number" step="0.01" value={form.debt} onChange={e=>setForm({...form,debt:e.target.value})}/></div>
            <div className="form-group"><label>Aluguel Mensal (R$)</label><input type="number" step="0.01" value={form.rent} onChange={e=>setForm({...form,rent:e.target.value})}/></div>
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
