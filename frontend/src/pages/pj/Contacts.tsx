import { useMemo, useState } from 'react';
import { useCrud } from '../../hooks/useCrud';
import PageHead from '../../components/PageHead';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import ExportMenu from '../../components/ExportMenu';
import SubmitButton from '../../components/SubmitButton';
import DocumentInput from '../../components/DocumentInput';
import { useAsync } from '../../hooks/useAsync';
import { toast } from '../../stores/toast';
import { maskCPF, maskCNPJ, maskPhone, unmask } from '../../lib/masks';

export interface Contact {
  id: string; name: string; tradeName?: string; document?: string;
  type: 'CLIENT'|'SUPPLIER'|'BOTH';
  email?: string; phone?: string; address?: string; city?: string; state?: string; zipCode?: string;
  notes?: string; active: boolean;
}

const TYPES: { v: Contact['type']; l: string; color: string }[] = [
  { v: 'CLIENT',   l: 'Cliente',         color: 'var(--good)' },
  { v: 'SUPPLIER', l: 'Fornecedor',      color: 'var(--warn)' },
  { v: 'BOTH',     l: 'Cliente + Fornec.', color: 'var(--primary)' },
];

function fmtDoc(v?: string) {
  if (!v) return '—';
  const d = unmask(v);
  return d.length === 11 ? maskCPF(d) : d.length === 14 ? maskCNPJ(d) : v;
}

export default function Contacts() {
  const c = useCrud<Contact>('/user/contacts');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Contact|null>(null);
  const [filter, setFilter] = useState<'all'|'CLIENT'|'SUPPLIER'|'BOTH'>('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<any>({
    name: '', tradeName: '', document: '', type: 'CLIENT',
    email: '', phone: '', address: '', city: '', state: '', zipCode: '', notes: '', active: true,
  });

  const filtered = useMemo(() => c.items.filter(x => {
    if (filter !== 'all' && x.type !== filter) return false;
    if (search && !x.name.toLowerCase().includes(search.toLowerCase())
              && !(x.document || '').includes(unmask(search))
              && !(x.tradeName || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [c.items, filter, search]);

  const newC = () => { setEdit(null); setForm({name:'', tradeName:'', document:'', type:'CLIENT', email:'', phone:'', address:'', city:'', state:'', zipCode:'', notes:'', active:true}); setOpen(true); };
  const editC = (x: Contact) => { setEdit(x); setForm({...x, document: x.document?(x.document.length===11?maskCPF(x.document):maskCNPJ(x.document)):'', phone: x.phone?maskPhone(x.phone):''}); setOpen(true); };

  const saveAction = useAsync(async (data:any) => { edit ? await c.update(edit.id, data) : await c.create(data); }, { successMsg: 'Contato salvo' });
  const removeAction = useAsync(c.remove, { successMsg: 'Removido' });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { toast('Informe o nome', 'warn'); return; }
    const payload = {
      ...form,
      name: form.name.trim(),
      tradeName: form.tradeName?.trim() || null,
      document: form.document ? unmask(form.document) : null,
      phone: form.phone ? unmask(form.phone) : null,
      email: form.email?.trim() || null,
    };
    const ok = await saveAction.run(payload);
    if (ok) { setOpen(false); setEdit(null); setForm({name:'', tradeName:'', document:'', type:'CLIENT', email:'', phone:'', address:'', city:'', state:'', zipCode:'', notes:'', active:true}); }
  };

  return (
    <div>
      <PageHead title="Contatos" subtitle="Cadastre seus clientes e fornecedores. Eles aparecem como sugestão ao criar Notas Fiscais."
        actions={<>
          <ExportMenu filename="contatos" title="Contatos" rows={c.items} columns={[
            { key:'name', label:'Nome' },{ key:'tradeName', label:'Nome Fantasia' },
            { key:'document', label:'CPF/CNPJ', format:r=>fmtDoc(r.document) },
            { key:'type', label:'Tipo', format:r=>TYPES.find(t=>t.v===r.type)?.l||r.type },
            { key:'email', label:'Email' },{ key:'phone', label:'Telefone' },
          ]}/>
          <button className="primary" style={{width:'auto'}} onClick={newC}>+ Novo Contato</button>
        </>}/>

      <div className="card" style={{ padding:14, marginBottom:14, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nome ou documento…"
          style={{flex:'1 1 220px', height:36, padding:'6px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)'}}/>
        <div style={{display:'flex', gap:6}}>
          {(['all','CLIENT','SUPPLIER','BOTH'] as const).map(f => (
            <button key={f} onClick={()=>setFilter(f)} style={{padding:'6px 12px', background:filter===f?'var(--text)':'var(--surface-2)', color:filter===f?'var(--bg)':'var(--muted)', border:'1px solid var(--border)', borderRadius:999, cursor:'pointer', fontSize:12, fontFamily:'inherit', fontWeight:600}}>
              {f==='all'?'Todos':TYPES.find(t=>t.v===f)?.l}
            </button>
          ))}
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Contatos</div><div className="k-value">{c.items.length}</div></div>
        <div className="kpi"><div className="k-label">Clientes</div><div className="k-value" style={{color:'var(--good)'}}>{c.items.filter(x=>x.type!=='SUPPLIER').length}</div></div>
        <div className="kpi"><div className="k-label">Fornecedores</div><div className="k-value" style={{color:'var(--warn)'}}>{c.items.filter(x=>x.type!=='CLIENT').length}</div></div>
      </div>

      {filtered.length===0 ? (
        <EmptyState title="Nenhum contato" hint="Cadastre clientes e fornecedores para reusar nas Notas Fiscais."
          action={<button className="primary" style={{width:'auto'}} onClick={newC}>+ Primeiro contato</button>}/>
      ) : (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
              <thead><tr style={{background:'var(--surface-2)'}}>{['Nome','Nome Fantasia','CPF/CNPJ','Tipo','Email','Telefone','Ações'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map(x => {
                const t = TYPES.find(t=>t.v===x.type);
                return (
                  <tr key={x.id} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={td}><strong>{x.name}</strong></td>
                    <td style={td}>{x.tradeName || '—'}</td>
                    <td style={tdMono}>{fmtDoc(x.document)}</td>
                    <td style={td}><span style={{padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:700, background:t?.color+'22', color:t?.color}}>{t?.l}</span></td>
                    <td style={td}>{x.email || '—'}</td>
                    <td style={tdMono}>{x.phone ? maskPhone(x.phone) : '—'}</td>
                    <td style={td}>
                      <button className="ghost" onClick={()=>editC(x)}>✏</button>
                      <button className="ghost" disabled={removeAction.loading} onClick={()=>{ if(confirm(`Remover "${x.name}"?`))removeAction.run(x.id); }}>🗑</button>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={open} onClose={()=>setOpen(false)} title={edit?'Editar Contato':'Novo Contato'} width={560}>
        <form onSubmit={save}>
          <div className="row">
            <div className="form-group"><label>Nome / Razão Social *</label>
              <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/>
            </div>
            <div className="form-group"><label>Nome Fantasia</label>
              <input value={form.tradeName} onChange={e=>setForm({...form, tradeName:e.target.value})}/>
            </div>
          </div>
          <div className="row">
            <div className="form-group"><label>CPF / CNPJ</label>
              <DocumentInput value={form.document} onChange={v=>setForm({...form, document:v})}/>
            </div>
            <div className="form-group"><label>Tipo</label>
              <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
                {TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
          </div>
          <div className="row">
            <div className="form-group"><label>Email</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
            </div>
            <div className="form-group"><label>Telefone</label>
              <input value={form.phone} onChange={e=>setForm({...form, phone:maskPhone(e.target.value)})}/>
            </div>
          </div>
          <div className="form-group"><label>Endereço</label>
            <input value={form.address} onChange={e=>setForm({...form, address:e.target.value})}/>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 120px', gap:8}}>
            <div className="form-group"><label>Cidade</label><input value={form.city} onChange={e=>setForm({...form, city:e.target.value})}/></div>
            <div className="form-group"><label>UF</label><input value={form.state} onChange={e=>setForm({...form, state:e.target.value.toUpperCase().slice(0,2)})} maxLength={2}/></div>
            <div className="form-group"><label>CEP</label><input value={form.zipCode} onChange={e=>setForm({...form, zipCode:e.target.value})}/></div>
          </div>
          <div className="form-group"><label>Observações</label>
            <input value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})}/>
          </div>
          <SubmitButton type="submit" loading={saveAction.loading}>Salvar</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}

const th: React.CSSProperties = { padding:'10px 12px', textAlign:'left', fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 };
const td: React.CSSProperties = { padding:'10px 12px' };
const tdMono: React.CSSProperties = { ...td, fontFamily:'JetBrains Mono,monospace' };
