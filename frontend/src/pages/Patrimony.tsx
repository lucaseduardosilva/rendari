import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import { fmt } from '../lib/format';
import PageHead from '../components/PageHead';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ExportMenu from '../components/ExportMenu';
import { useOptions } from '../hooks/useOptions';
import SubmitButton from '../components/SubmitButton';
import { useAsync } from '../hooks/useAsync';
import { toast } from '../stores/toast';

interface Asset { id:string; name:string; cat:string; value:number|string; }
interface Debt { id:string; name:string; cat:string; value:number|string; rate:number|string; }

export default function Patrimony() {
  const ASSET_CATS = useOptions('asset.cat');
  const DEBT_CATS = useOptions('debt.cat');
  const a = useCrud<Asset>('/finance/assets');
  const d = useCrud<Debt>('/finance/debts');
  const [openA, setOpenA] = useState(false);
  const [openD, setOpenD] = useState(false);
  const [editA, setEditA] = useState<Asset|null>(null);
  const [editD, setEditD] = useState<Debt|null>(null);
  const [formA, setFormA] = useState({ name:'', cat:'Conta Corrente', value:'' });
  const [formD, setFormD] = useState({ name:'', cat:'Cartão de Crédito', value:'', rate:'' });

  const totalA = a.items.reduce((s,x)=>s+Number(x.value), 0);
  const totalD = d.items.reduce((s,x)=>s+Number(x.value), 0);
  const net = totalA - totalD;

  const newA = () => { setEditA(null); setFormA({name:'', cat:'Conta Corrente', value:''}); setOpenA(true); };
  const editAsset = (x:Asset) => { setEditA(x); setFormA({name:x.name, cat:x.cat, value:String(x.value)}); setOpenA(true); };
  const saveAssetAction = useAsync(async (data:any) => { editA ? await a.update(editA.id, data) : await a.create(data); }, { successMsg:'Ativo salvo' });
  const removeAssetAction = useAsync(a.remove, { successMsg:'Ativo removido' });
  const saveA = async (e:React.FormEvent) => { e.preventDefault();
    if (!formA.name?.trim()) { toast('Informe o nome', 'warn'); return; }
    if (!Number(formA.value)) { toast('Informe um valor', 'warn'); return; }
    const data = {...formA, name:formA.name.trim(), value:Number(formA.value)};
    const ok = await saveAssetAction.run(data);
    if (ok) { setOpenA(false); setEditA(null); setFormA({name:'', cat:'Conta Corrente', value:''}); }
  };
  const newD = () => { setEditD(null); setFormD({name:'', cat:'Cartão de Crédito', value:'', rate:''}); setOpenD(true); };
  const editDebt = (x:Debt) => { setEditD(x); setFormD({name:x.name, cat:x.cat, value:String(x.value), rate:String(x.rate)}); setOpenD(true); };
  const saveDebtAction = useAsync(async (data:any) => { editD ? await d.update(editD.id, data) : await d.create(data); }, { successMsg:'Dívida salva' });
  const removeDebtAction = useAsync(d.remove, { successMsg:'Dívida removida' });
  const saveD = async (e:React.FormEvent) => { e.preventDefault();
    if (!formD.name?.trim()) { toast('Informe o nome', 'warn'); return; }
    if (!Number(formD.value)) { toast('Informe um valor', 'warn'); return; }
    const data = {...formD, name:formD.name.trim(), value:Number(formD.value), rate:Number(formD.rate)};
    const ok = await saveDebtAction.run(data);
    if (ok) { setOpenD(false); setEditD(null); setFormD({name:'', cat:'Cartão de Crédito', value:'', rate:''}); }
  };

  return (
    <div>
      <PageHead title="Patrimônio Líquido" subtitle="Tudo que você tem (ativos) menos tudo que deve (dívidas). É o termômetro mais honesto da saúde financeira."
        actions={<>
          <ExportMenu filename="ativos" title="Ativos" rows={a.items} columns={[
            {key:'name',label:'Nome'},{key:'cat',label:'Categoria'},
            {key:'value',label:'Valor',format:r=>fmt(Number(r.value))},
          ]} label="Exportar Ativos"/>
          <ExportMenu filename="dividas" title="Dívidas" rows={d.items} columns={[
            {key:'name',label:'Nome'},{key:'cat',label:'Categoria'},
            {key:'value',label:'Saldo',format:r=>fmt(Number(r.value))},
            {key:'rate',label:'Juros a.m.',format:r=>Number(r.rate).toFixed(2)+'%'},
          ]} label="Exportar Dívidas"/>
          <button className="secondary" onClick={newA}>+ Ativo</button>
          <button className="secondary" onClick={newD}>+ Dívida</button>
        </>} />

      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Total em Ativos</div><div className="k-value" style={{color:'var(--good)'}}>{fmt(totalA)}</div></div>
        <div className="kpi"><div className="k-label">Total em Dívidas</div><div className="k-value" style={{color:'var(--bad)'}}>{fmt(totalD)}</div></div>
        <div className="kpi"><div className="k-label">Patrimônio Líquido</div><div className="k-value" style={{color:net>=0?'var(--good)':'var(--bad)'}}>{fmt(net)}</div></div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:14}}>
        <div className="card">
          <h3 style={{marginBottom:10}}>Ativos</h3>
          {a.items.length===0 ? <EmptyState title="Nenhum ativo" hint="Cadastre imóveis, contas, investimentos…" action={<button className="primary" style={{width:'auto'}} onClick={newA}>+ Ativo</button>}/> : (
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
              <tbody>{a.items.map(x=>(
                <tr key={x.id} style={{borderBottom:'1px solid var(--border)'}}>
                  <td style={{padding:'8px 0'}}><strong>{x.name}</strong><div style={{fontSize:12, color:'var(--muted)'}}>{x.cat}</div></td>
                  <td style={{padding:'8px 0', textAlign:'right', fontFamily:'JetBrains Mono,monospace', color:'var(--good)'}}>{fmt(Number(x.value))}</td>
                  <td style={{padding:'8px 0', textAlign:'right', width:80}}>
                    <button className="ghost" onClick={()=>editAsset(x)}>✏</button>
                    <button className="ghost" disabled={removeAssetAction.loading} onClick={()=>{ if(confirm('Remover?'))removeAssetAction.run(x.id);}}>🗑</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 style={{marginBottom:10}}>Dívidas</h3>
          {d.items.length===0 ? <EmptyState title="Nenhuma dívida" hint="Cartões, financiamentos, empréstimos…" action={<button className="primary" style={{width:'auto'}} onClick={newD}>+ Dívida</button>}/> : (
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
              <tbody>{d.items.map(x=>(
                <tr key={x.id} style={{borderBottom:'1px solid var(--border)'}}>
                  <td style={{padding:'8px 0'}}><strong>{x.name}</strong><div style={{fontSize:12, color:'var(--muted)'}}>{x.cat} · {Number(x.rate).toFixed(2)}% a.m.</div></td>
                  <td style={{padding:'8px 0', textAlign:'right', fontFamily:'JetBrains Mono,monospace', color:'var(--bad)'}}>{fmt(Number(x.value))}</td>
                  <td style={{padding:'8px 0', textAlign:'right', width:80}}>
                    <button className="ghost" onClick={()=>editDebt(x)}>✏</button>
                    <button className="ghost" disabled={removeDebtAction.loading} onClick={()=>{ if(confirm('Remover?'))removeDebtAction.run(x.id);}}>🗑</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={openA} onClose={()=>setOpenA(false)} title={editA?'Editar Ativo':'Novo Ativo'}>
        <form onSubmit={saveA}>
          <div className="form-group"><label>Nome</label><input value={formA.name} onChange={e=>setFormA({...formA,name:e.target.value})} required/></div>
          <div className="form-group"><label>Categoria</label><select value={formA.cat} onChange={e=>setFormA({...formA,cat:e.target.value})}>{ASSET_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
          <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" min={0} value={formA.value} onChange={e=>setFormA({...formA,value:e.target.value})} required/></div>
          <SubmitButton type="submit" loading={saveAssetAction.loading}>Salvar</SubmitButton>
        </form>
      </Modal>
      <Modal open={openD} onClose={()=>setOpenD(false)} title={editD?'Editar Dívida':'Nova Dívida'}>
        <form onSubmit={saveD}>
          <div className="form-group"><label>Nome</label><input value={formD.name} onChange={e=>setFormD({...formD,name:e.target.value})} required/></div>
          <div className="form-group"><label>Categoria</label><select value={formD.cat} onChange={e=>setFormD({...formD,cat:e.target.value})}>{DEBT_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
          <div className="row">
            <div className="form-group"><label>Saldo Devedor (R$)</label><input type="number" step="0.01" min={0} value={formD.value} onChange={e=>setFormD({...formD,value:e.target.value})} required/></div>
            <div className="form-group"><label>Juros a.m. (%)</label><input type="number" step="0.01" min={0} value={formD.rate} onChange={e=>setFormD({...formD,rate:e.target.value})}/></div>
          </div>
          <SubmitButton type="submit" loading={saveDebtAction.loading}>Salvar</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
