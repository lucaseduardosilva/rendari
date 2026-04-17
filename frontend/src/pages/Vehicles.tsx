import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import { fmt } from '../lib/format';
import PageHead from '../components/PageHead';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ExportMenu from '../components/ExportMenu';
import { useOptions } from '../hooks/useOptions';

interface Vehicle { id:string; brand:string; model:string; type?:string; year?:number; plate?:string; color?:string; buy:number|string; current:number|string; km:number; fuel?:string; }

export default function Vehicles() {
  const TYPES = useOptions('vehicle.type');
  const c = useCrud<Vehicle>('/finance/vehicles');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Vehicle|null>(null);
  const [form, setForm] = useState<any>({brand:'', model:'', type:'Carro', year:'', plate:'', color:'', buy:'', current:'', km:0, fuel:'Flex'});

  const totalCurrent = c.items.reduce((s,v)=>s+Number(v.current||0),0);
  const totalDeprec = c.items.reduce((s,v)=>s+Math.max(0,Number(v.buy||0)-Number(v.current||0)),0);

  const newV = () => { setEdit(null); setForm({brand:'', model:'', type:'Carro', year:'', plate:'', color:'', buy:'', current:'', km:0, fuel:'Flex'}); setOpen(true); };
  const editV = (v:Vehicle) => { setEdit(v); setForm({...v, year:v.year||'', plate:v.plate||'', color:v.color||''}); setOpen(true); };
  const save = async (e:React.FormEvent) => { e.preventDefault();
    const data = {...form, year:form.year?Number(form.year):null, buy:Number(form.buy), current:Number(form.current), km:Number(form.km)};
    edit ? await c.update(edit.id, data) : await c.create(data); setOpen(false);
  };

  return (
    <div>
      <PageHead title="Veículos" subtitle="Gestão de carros, motos e frota. Acompanhe valor de mercado, depreciação e km."
        actions={<>
          <ExportMenu filename="veiculos" title="Veículos" rows={c.items} columns={[
            {key:'brand',label:'Marca'},{key:'model',label:'Modelo'},{key:'type',label:'Tipo'},
            {key:'year',label:'Ano'},{key:'plate',label:'Placa'},
            {key:'buy',label:'Aquisição',format:r=>fmt(Number(r.buy))},
            {key:'current',label:'Valor Atual',format:r=>fmt(Number(r.current))},
            {key:'dep',label:'Depreciação',format:r=>fmt(Math.max(0,Number(r.buy)-Number(r.current)))},
            {key:'km',label:'Km'},
          ]}/>
          <button className="primary" style={{width:'auto'}} onClick={newV}>+ Veículo</button>
        </>}/>

      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Veículos</div><div className="k-value">{c.items.length}</div></div>
        <div className="kpi"><div className="k-label">Valor de Mercado</div><div className="k-value">{fmt(totalCurrent)}</div></div>
        <div className="kpi"><div className="k-label">Depreciação Total</div><div className="k-value" style={{color:'var(--bad)'}}>-{fmt(totalDeprec)}</div></div>
      </div>

      {c.items.length===0 ? <EmptyState title="Nenhum veículo" hint="Cadastre carros, motos, caminhões…" action={<button className="primary" style={{width:'auto'}} onClick={newV}>+ Primeiro veículo</button>}/> : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14}}>
          {c.items.map(v=>{
            const dep = Math.max(0, Number(v.buy)-Number(v.current));
            return (
              <div key={v.id} className="card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <div>
                    <h3 style={{margin:0, fontSize:'1.05rem'}}>🚗 {v.brand} {v.model}</h3>
                    <div style={{fontSize:12, color:'var(--muted)', marginTop:2}}>{v.year||''} · {v.type} · {v.plate||'sem placa'} · {v.fuel}</div>
                  </div>
                  <div>
                    <button className="ghost" onClick={()=>editV(v)}>✏</button>
                    <button className="ghost" onClick={()=>{ if(confirm('Remover?'))c.remove(v.id);}}>🗑</button>
                  </div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10}}>
                  <Mini label="Aquisição" value={fmt(Number(v.buy))}/>
                  <Mini label="Valor Atual" value={fmt(Number(v.current))}/>
                  <Mini label="Depreciação" value={'-'+fmt(dep)} color="var(--bad)"/>
                  <Mini label="Km" value={(v.km||0).toLocaleString('pt-BR')}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={()=>setOpen(false)} title={edit?'Editar Veículo':'Novo Veículo'} width={560}>
        <form onSubmit={save}>
          <div className="row">
            <div className="form-group"><label>Marca</label><input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} required/></div>
            <div className="form-group"><label>Modelo</label><input value={form.model} onChange={e=>setForm({...form,model:e.target.value})} required/></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Tipo</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Ano</label><input type="number" min={1950} max={2030} value={form.year} onChange={e=>setForm({...form,year:e.target.value})}/></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Placa</label><input value={form.plate} onChange={e=>setForm({...form,plate:e.target.value})}/></div>
            <div className="form-group"><label>Combustível</label>
              <select value={form.fuel} onChange={e=>setForm({...form,fuel:e.target.value})}>
                <option>Gasolina</option><option>Álcool</option><option>Diesel</option><option>Flex</option><option>GNV</option><option>Elétrico</option>
              </select>
            </div>
          </div>
          <div className="row">
            <div className="form-group"><label>Valor Aquisição (R$)</label><input type="number" step="0.01" value={form.buy} onChange={e=>setForm({...form,buy:e.target.value})}/></div>
            <div className="form-group"><label>Valor Atual FIPE (R$)</label><input type="number" step="0.01" value={form.current} onChange={e=>setForm({...form,current:e.target.value})}/></div>
          </div>
          <div className="form-group"><label>Km Atual</label><input type="number" min={0} value={form.km} onChange={e=>setForm({...form,km:e.target.value})}/></div>
          <button type="submit" className="primary">Salvar</button>
        </form>
      </Modal>
    </div>
  );
}

function Mini({label, value, color}:{label:string; value:string; color?:string}) {
  return (
    <div style={{background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 10px'}}>
      <div style={{fontSize:10, color:'var(--muted)', textTransform:'uppercase', fontWeight:600}}>{label}</div>
      <div style={{fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:13, marginTop:2, color:color||'var(--text)'}}>{value}</div>
    </div>
  );
}
