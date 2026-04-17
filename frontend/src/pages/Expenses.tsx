import { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import { fmt, fmtMonth, todayYM } from '../lib/format';
import PageHead from '../components/PageHead';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ExportMenu from '../components/ExportMenu';
import { useOptions } from '../hooks/useOptions';

const TYPES = [['essencial','Essencial (50%)'],['desejo','Desejo (30%)'],['investimento','Investimento (20%)']] as const;
const FREQ = [['monthly','Mensal'],['annual','Anual'],['one-time','Única'],['installments','Parcelada (cartão Nx)']] as const;

interface Expense { id:string; desc:string; cat:string; type:string; freq:string; value:number|string; day?:number|null; startMonth?:string|null; installments?:number|null; }

function ymAdd(ym:string, delta:number) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m-1+delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function expenseDueIn(e:Expense, ym:string): {due:boolean, idx?:number, total?:number} {
  const start = e.startMonth || ym;
  if (ym < start) return {due:false};
  if (e.freq === 'monthly') return {due:true};
  if (e.freq === 'annual') return {due: ym.slice(5) === start.slice(5)};
  if (e.freq === 'one-time') return {due: ym === start};
  if (e.freq === 'installments') {
    const n = Number(e.installments)||1;
    const [sy,sm] = start.split('-').map(Number);
    const [yy,mm] = ym.split('-').map(Number);
    const diff = (yy-sy)*12+(mm-sm);
    return diff>=0 && diff<n ? {due:true, idx:diff+1, total:n} : {due:false};
  }
  return {due:false};
}
function valueIn(e:Expense): number {
  return e.freq==='installments' ? Number(e.value) / (Number(e.installments)||1) : Number(e.value);
}

export default function Expenses() {
  const CATS = useOptions('expense.cat');
  const [items, setItems] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Record<string, boolean>>({});
  const [month, setMonth] = useState(todayYM());
  const [filter, setFilter] = useState<'all'|'essencial'|'desejo'|'investimento'|'paid'|'pending'>('all');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Expense|null>(null);
  const [form, setForm] = useState<any>({ desc:'', cat:'Moradia', type:'essencial', freq:'monthly', value:'', day:'', startMonth:todayYM(), installments:4 });

  const load = async () => {
    const [r, p] = await Promise.all([api.get('/finance/expenses'), api.get('/finance/expense-payments')]);
    setItems(r.data);
    const map:Record<string,boolean> = {};
    p.data.forEach((x:any) => { map[`${x.expenseId}|${x.refMonth}`] = true; });
    setPayments(map);
  };
  useEffect(() => { load(); }, []);

  const due = useMemo(() => items.map(e => ({...e, _due: expenseDueIn(e, month), _amt: valueIn(e)})).filter(x => x._due.due), [items, month]);
  const totalDue = due.reduce((s, e) => s + e._amt, 0);
  const paidCount = due.filter(e => payments[`${e.id}|${month}`]).length;
  const totalPaid = due.filter(e => payments[`${e.id}|${month}`]).reduce((s, e) => s + e._amt, 0);
  const byType = (t:string) => due.filter(x => x.type === t).reduce((s, x) => s + x._amt, 0);

  const filtered = filter==='all' ? due : filter==='paid' ? due.filter(e => payments[`${e.id}|${month}`]) : filter==='pending' ? due.filter(e => !payments[`${e.id}|${month}`]) : due.filter(e => e.type === filter);

  const togglePaid = async (id:string) => {
    const key = `${id}|${month}`;
    const current = !!payments[key];
    setPayments({...payments, [key]: !current});
    await api.post('/finance/expense-payments/toggle', { expenseId:id, refMonth:month, paid: !current });
  };
  const openNew = () => { setEdit(null); setForm({ desc:'', cat:'Moradia', type:'essencial', freq:'monthly', value:'', day:'', startMonth:todayYM(), installments:4 }); setOpen(true); };
  const openEdit = (e:Expense) => { setEdit(e); setForm({...e, day:e.day||'', startMonth:e.startMonth||todayYM(), installments:e.installments||4}); setOpen(true); };
  const save = async (ev:React.FormEvent) => {
    ev.preventDefault();
    const data:any = { ...form, value:Number(form.value), day:form.day?Number(form.day):null, installments: form.freq==='installments'?Number(form.installments):null };
    if (edit) await api.put(`/finance/expenses/${edit.id}`, data);
    else await api.post('/finance/expenses', data);
    setOpen(false); load();
  };
  const remove = async (id:string) => {
    if (!confirm('Remover esta despesa?')) return;
    await api.delete(`/finance/expenses/${id}`); load();
  };

  return (
    <div>
      <PageHead title="Despesas" subtitle="Inclui parcelas de cartão. Marque o que foi pago e acompanhe o histórico mensal."
        actions={<>
          <ExportMenu filename={`despesas-${month}`} title={`Despesas ${month}`} rows={due} columns={[
            {key:'desc',label:'Descrição'},{key:'cat',label:'Categoria'},{key:'type',label:'Tipo'},
            {key:'day',label:'Vencimento',format:r=>r.day?'Dia '+r.day:'—'},
            {key:'_amt',label:'Valor',format:r=>fmt(r._amt)},
            {key:'paga',label:'Paga',format:r=>payments[`${r.id}|${month}`]?'Sim':'Não'},
          ]}/>
          <button className="primary" style={{width:'auto'}} onClick={openNew}>+ Nova Despesa</button>
        </>} />

      <div className="card" style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', padding:'12px 16px', marginBottom:14}}>
        <button className="ghost" onClick={()=>setMonth(ymAdd(month,-1))}>‹</button>
        <input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', fontFamily:'inherit'}}/>
        <button className="ghost" onClick={()=>setMonth(ymAdd(month,1))}>›</button>
        <button className="secondary" onClick={()=>setMonth(todayYM())}>Hoje</button>
        <span style={{marginLeft:'auto', fontSize:13, color:'var(--muted)'}}>
          <strong style={{color:'var(--text)'}}>{paidCount}/{due.length}</strong> pagas · <strong style={{color:'var(--good)'}}>{totalDue>0?Math.round(totalPaid/totalDue*100):0}%</strong>
        </span>
      </div>

      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Total do Mês</div><div className="k-value" style={{color:'var(--bad)'}}>{fmt(totalDue)}</div></div>
        <div className="kpi"><div className="k-label">Essencial</div><div className="k-value">{fmt(byType('essencial'))}</div></div>
        <div className="kpi"><div className="k-label">Desejo</div><div className="k-value">{fmt(byType('desejo'))}</div></div>
        <div className="kpi"><div className="k-label">Investimento</div><div className="k-value" style={{color:'var(--good)'}}>{fmt(byType('investimento'))}</div></div>
      </div>

      <div style={{display:'flex', gap:6, flexWrap:'wrap', margin:'12px 0'}}>
        {(['all','essencial','desejo','investimento','pending','paid'] as const).map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{background: filter===f?'var(--text)':'var(--surface)', color: filter===f?'var(--bg)':'var(--muted)', border:'1px solid var(--border)', borderRadius:999, padding:'6px 12px', fontSize:12, cursor:'pointer', fontFamily:'inherit'}}>
            {f==='all'?'Todas':f==='paid'?'Pagas':f==='pending'?'Pendentes':f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length===0 ? (
        <EmptyState title="Nenhuma despesa neste mês" hint={items.length===0?'Comece adicionando uma despesa.':'Tente outro filtro ou mude o mês.'}
          action={items.length===0?<button className="primary" style={{width:'auto'}} onClick={openNew}>+ Nova Despesa</button>:null} />
      ) : (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
              <thead><tr style={{background:'var(--surface-2)'}}>
                {['','Descrição','Categoria','Tipo','Vencim.','Frequência','Parcela','Valor','Ações'].map((h,i) => <th key={i} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>{filtered.map(e=>{
                const paid = !!payments[`${e.id}|${month}`];
                const inst = e._due.idx ? `${e._due.idx}/${e._due.total}` : '—';
                return (
                  <tr key={e.id} style={{borderBottom:'1px solid var(--border)', opacity: paid?.55:1}}>
                    <td style={td}><input type="checkbox" checked={paid} onChange={()=>togglePaid(e.id)} style={{width:18, height:18, cursor:'pointer', accentColor:'var(--good)'}}/></td>
                    <td style={{...td, textDecoration: paid?'line-through':'none'}}>{e.desc}</td>
                    <td style={td}>{e.cat}</td>
                    <td style={td}><span className={`badge ${e.type==='essencial'?'us':e.type==='desejo'?'crypto':'br'}`} style={badgeStyle(e.type)}>{e.type}</span></td>
                    <td style={td}>{e.day?`Dia ${e.day}`:'—'}</td>
                    <td style={td}>{FREQ.find(f=>f[0]===e.freq)?.[1]}</td>
                    <td style={td}>{inst}</td>
                    <td style={{...tdMono, color:'var(--bad)'}}>{fmt(e._amt)}</td>
                    <td style={td}>
                      <button className="ghost" onClick={()=>openEdit(e)}>✏</button>
                      <button className="ghost" onClick={()=>remove(e.id)}>🗑</button>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={open} onClose={()=>setOpen(false)} title={edit?'Editar Despesa':'Nova Despesa'}>
        <form onSubmit={save}>
          <div className="form-group"><label>Descrição</label><input value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} required/></div>
          <div className="row">
            <div className="form-group"><label>Categoria</label><select value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="form-group"><label>Tipo</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{TYPES.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}</select></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Frequência</label><select value={form.freq} onChange={e=>setForm({...form,freq:e.target.value})}>{FREQ.map(f=><option key={f[0]} value={f[0]}>{f[1]}</option>)}</select></div>
            <div className="form-group"><label>Vencimento (dia)</label><input type="number" min={1} max={31} value={form.day} onChange={e=>setForm({...form,day:e.target.value})}/></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Mês inicial</label><input type="month" value={form.startMonth} onChange={e=>setForm({...form,startMonth:e.target.value})}/></div>
            {form.freq==='installments' && <div className="form-group"><label>Nº parcelas</label><input type="number" min={2} max={60} value={form.installments} onChange={e=>setForm({...form,installments:e.target.value})}/></div>}
          </div>
          <div className="form-group"><label>{form.freq==='installments'?'Valor TOTAL parcelado (R$)':'Valor (R$)'}</label>
            <input type="number" step="0.01" min={0} value={form.value} onChange={e=>setForm({...form,value:e.target.value})} required/></div>
          {form.freq==='installments' && form.value && form.installments && <div style={{fontSize:12, color:'var(--muted)', marginTop:-6, marginBottom:8}}>= {form.installments}x de {fmt(Number(form.value)/Number(form.installments))}/mês</div>}
          <button type="submit" className="primary">Salvar</button>
        </form>
      </Modal>
    </div>
  );
}

function badgeStyle(type:string): React.CSSProperties {
  const map:Record<string,[string,string]> = {
    essencial:['rgba(91,141,239,.15)','#5b8def'],
    desejo:['rgba(245,158,11,.15)','#f59e0b'],
    investimento:['rgba(34,197,94,.15)','#22c55e'],
  };
  const [bg, color] = map[type]||['', ''];
  return { background:bg, color, padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:700, textTransform:'uppercase' };
}
const th: React.CSSProperties = { padding:'10px 14px', textAlign:'left', fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 };
const td: React.CSSProperties = { padding:'10px 14px' };
const tdMono: React.CSSProperties = { ...td, fontFamily:'JetBrains Mono,monospace' };
