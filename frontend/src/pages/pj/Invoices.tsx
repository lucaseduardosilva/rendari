import { useMemo, useState } from 'react';
import { useCrud } from '../../hooks/useCrud';
import { fmt, fmtDate, todayDate, todayYM } from '../../lib/format';
import PageHead from '../../components/PageHead';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import ExportMenu from '../../components/ExportMenu';
import DocumentInput from '../../components/DocumentInput';
import ContactSelect from '../../components/ContactSelect';
import SubmitButton from '../../components/SubmitButton';
import { useAsync } from '../../hooks/useAsync';
import { toast } from '../../stores/toast';

interface Invoice { id:string; number:string; type:'entrada'|'saida'; partyName:string; partyDoc?:string; description?:string; value:number|string; taxes?:number|string; issuedAt:string; status:string; }

export default function Invoices() {
  const c = useCrud<Invoice>('/user/invoices');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Invoice|null>(null);
  const [filter, setFilter] = useState<'all'|'entrada'|'saida'>('all');
  const [month, setMonth] = useState(todayYM());
  const [form, setForm] = useState<any>({ number:'', type:'saida', partyName:'', partyDoc:'', description:'', value:'', taxes:'', issuedAt:todayDate(), status:'emitida' });

  const filtered = useMemo(() => {
    return c.items.filter(i => {
      if (filter !== 'all' && i.type !== filter) return false;
      if (month && i.issuedAt.slice(0,7) !== month) return false;
      return true;
    });
  }, [c.items, filter, month]);

  const totalSaida = filtered.filter(i=>i.type==='saida').reduce((s,i)=>s+Number(i.value),0);
  const totalEntrada = filtered.filter(i=>i.type==='entrada').reduce((s,i)=>s+Number(i.value),0);
  const totalImpostos = filtered.reduce((s,i)=>s+Number(i.taxes||0),0);

  const newI = () => { setEdit(null); setForm({number:'', type:'saida', partyName:'', partyDoc:'', description:'', value:'', taxes:'', issuedAt:todayDate(), status:'emitida'}); setOpen(true); };
  const editI = (i:Invoice) => { setEdit(i); setForm({...i, value:String(i.value), taxes:String(i.taxes||''), issuedAt:i.issuedAt.slice(0,10), partyDoc:i.partyDoc||'', description:i.description||''}); setOpen(true); };

  const saveAction = useAsync(async (data: any) => {
    if (edit) await c.update(edit.id, data); else await c.create(data);
  }, { successMsg: 'Nota fiscal salva' });
  const save = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!form.number?.trim()) { toast('Informe o número da NF', 'warn'); return; }
    if (!form.partyName?.trim()) { toast('Informe o cliente/fornecedor', 'warn'); return; }
    if (!Number(form.value)) { toast('Informe um valor válido', 'warn'); return; }
    if (!form.issuedAt) { toast('Informe a data de emissão', 'warn'); return; }
    const data = {...form, value:Number(form.value), taxes:Number(form.taxes||0), issuedAt:new Date(form.issuedAt).toISOString()};
    const ok = await saveAction.run(data);
    if (ok) { setOpen(false); setEdit(null); setForm({number:'', type:'saida', partyName:'', partyDoc:'', description:'', value:'', taxes:'', issuedAt:todayDate(), status:'emitida'}); }
  };
  const removeAction = useAsync(c.remove, { successMsg: 'Removido' });

  return (
    <div>
      <PageHead title="Notas Fiscais" subtitle="NF-e (mercadoria) e NFS-e (serviço). Controle de entrada (compras) e saída (vendas) com impostos retidos."
        actions={<>
          <ExportMenu filename={`notas-fiscais-${month}`} title="Notas Fiscais" rows={filtered} columns={[
            {key:'issuedAt',label:'Data',format:r=>fmtDate(r.issuedAt)},{key:'number',label:'Número'},
            {key:'type',label:'Tipo'},{key:'partyName',label:'Parte'},{key:'partyDoc',label:'CPF/CNPJ'},
            {key:'description',label:'Descrição'},
            {key:'value',label:'Valor',format:r=>fmt(Number(r.value))},
            {key:'taxes',label:'Impostos',format:r=>fmt(Number(r.taxes||0))},
            {key:'status',label:'Status'},
          ]}/>
          <button className="primary" style={{width:'auto'}} onClick={newI}>+ Nota Fiscal</button>
        </>}/>

      <div className="card" style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', padding:'12px 16px', marginBottom:14}}>
        <input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', fontFamily:'inherit'}}/>
        <div style={{display:'flex', gap:6}}>
          {(['all','entrada','saida'] as const).map(f => (
            <button key={f} onClick={()=>setFilter(f)} style={{background:filter===f?'var(--text)':'var(--surface-2)', color:filter===f?'var(--bg)':'var(--muted)', border:'1px solid var(--border)', borderRadius:999, padding:'6px 12px', fontSize:12, cursor:'pointer'}}>
              {f==='all'?'Todas':f==='entrada'?'Entrada':'Saída'}
            </button>
          ))}
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Vendas (Saída)</div><div className="k-value" style={{color:'var(--good)'}}>{fmt(totalSaida)}</div></div>
        <div className="kpi"><div className="k-label">Compras (Entrada)</div><div className="k-value" style={{color:'var(--bad)'}}>{fmt(totalEntrada)}</div></div>
        <div className="kpi"><div className="k-label">Impostos Recolhidos</div><div className="k-value">{fmt(totalImpostos)}</div></div>
        <div className="kpi"><div className="k-label">Notas no Mês</div><div className="k-value">{filtered.length}</div></div>
      </div>

      {filtered.length===0 ? <EmptyState title="Nenhuma nota fiscal" hint="Cadastre suas NFs de venda e compra do mês." action={<button className="primary" style={{width:'auto'}} onClick={newI}>+ Primeira NF</button>}/> : (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
              <thead><tr style={{background:'var(--surface-2)'}}>{['Data','Número','Tipo','Parte','Descrição','Valor','Impostos','Status','Ações'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map(i=>(
                <tr key={i.id} style={{borderBottom:'1px solid var(--border)'}}>
                  <td style={td}>{fmtDate(i.issuedAt)}</td>
                  <td style={tdMono}>{i.number}</td>
                  <td style={td}><span className={`badge ${i.type==='saida'?'br':'us'}`} style={{padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:700, textTransform:'uppercase', background:i.type==='saida'?'rgba(34,197,94,.15)':'rgba(91,141,239,.15)', color:i.type==='saida'?'var(--good)':'var(--primary)'}}>{i.type}</span></td>
                  <td style={td}><strong>{i.partyName}</strong>{i.partyDoc && <div style={{fontSize:11, color:'var(--muted)'}}>{i.partyDoc}</div>}</td>
                  <td style={td}>{i.description||'—'}</td>
                  <td style={{...tdMono, color: i.type==='saida'?'var(--good)':'var(--bad)'}}>{fmt(Number(i.value))}</td>
                  <td style={tdMono}>{fmt(Number(i.taxes||0))}</td>
                  <td style={td}>{i.status}</td>
                  <td style={td}>
                    <button className="ghost" onClick={()=>editI(i)}>✏</button>
                    <button className="ghost" disabled={removeAction.loading} onClick={()=>{ if(confirm('Remover?'))removeAction.run(i.id);}}>🗑</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={open} onClose={()=>setOpen(false)} title={edit?'Editar NF':'Nova Nota Fiscal'} width={560}>
        <form onSubmit={save}>
          <div className="row">
            <div className="form-group"><label>Número</label><input value={form.number} onChange={e=>setForm({...form,number:e.target.value})} required placeholder="000123"/></div>
            <div className="form-group"><label>Tipo</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="saida">Saída (venda)</option><option value="entrada">Entrada (compra)</option></select></div>
          </div>
          <div className="form-group"><label>{form.type==='saida'?'Cliente':'Fornecedor'}</label>
            <ContactSelect
              name={form.partyName}
              doc={form.partyDoc}
              filterType={form.type==='saida'?'CLIENT':'SUPPLIER'}
              onChange={({ name, document }) => setForm({...form, partyName: name, partyDoc: document || form.partyDoc})}
              required
            />
          </div>
          <div className="form-group"><label>CPF/CNPJ</label>
            <DocumentInput value={form.partyDoc} onChange={v=>setForm({...form,partyDoc:v})}/>
          </div>
          <div className="form-group"><label>Descrição</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Produto/serviço"/></div>
          <div className="row">
            <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" min={0} value={form.value} onChange={e=>setForm({...form,value:e.target.value})} required/></div>
            <div className="form-group"><label>Impostos (R$)</label><input type="number" step="0.01" min={0} value={form.taxes} onChange={e=>setForm({...form,taxes:e.target.value})}/></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Data Emissão</label><input type="date" value={form.issuedAt} onChange={e=>setForm({...form,issuedAt:e.target.value})} required/></div>
            <div className="form-group"><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>emitida</option><option>paga</option><option>cancelada</option></select></div>
          </div>
          <SubmitButton type="submit" loading={saveAction.loading}>Salvar</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
const th: React.CSSProperties = { padding:'10px 14px', textAlign:'left', fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 };
const td: React.CSSProperties = { padding:'10px 14px' };
const tdMono: React.CSSProperties = { ...td, fontFamily:'JetBrains Mono,monospace' };
