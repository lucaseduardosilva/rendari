import { useEffect, useState } from 'react';
import { useCrud } from '../../hooks/useCrud';
import { api } from '../../lib/api';
import { fmt, fmtDate } from '../../lib/format';
import PageHead from '../../components/PageHead';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import ExportMenu from '../../components/ExportMenu';
import DocumentInput from '../../components/DocumentInput';
import SubmitButton from '../../components/SubmitButton';
import { useAsync } from '../../hooks/useAsync';
import { toast } from '../../stores/toast';

interface Employee { id:string; name:string; cpf?:string; role:string; departmentId?:string|null; salary:number|string; benefits?:number|string; admissionAt:string; dismissedAt?:string|null; active:boolean; }
interface Dept { id:string; name:string; }

export default function Employees() {
  const c = useCrud<Employee>('/user/employees');
  const [depts, setDepts] = useState<Dept[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Employee|null>(null);
  const [form, setForm] = useState<any>({ name:'', cpf:'', role:'', departmentId:'', salary:'', benefits:'0', admissionAt:new Date().toISOString().slice(0,10), active:true });

  useEffect(() => { api.get('/user/departments').then(r => setDepts(r.data)); }, []);

  const totalPayroll = c.items.filter(e=>e.active).reduce((s,e)=>s+Number(e.salary)+Number(e.benefits||0), 0);
  // Encargos médios Lucro Real ~65%, Simples ~39% — usamos 50% como estimativa
  const totalCost = totalPayroll * 1.5;

  const newE = () => { setEdit(null); setForm({name:'', cpf:'', role:'', departmentId:'', salary:'', benefits:'0', admissionAt:new Date().toISOString().slice(0,10), active:true}); setOpen(true); };
  const editE = (e:Employee) => { setEdit(e); setForm({...e, departmentId:e.departmentId||'', admissionAt:e.admissionAt.slice(0,10), salary:String(e.salary), benefits:String(e.benefits||0)}); setOpen(true); };
  const saveAction = useAsync(async (data:any) => {
    if (edit) await c.update(edit.id, data); else await c.create(data);
  }, { successMsg: 'Funcionário salvo' });
  const removeAction = useAsync(c.remove, { successMsg: 'Removido' });
  const save = async (ev:React.FormEvent) => {
    ev.preventDefault();
    if (!form.name?.trim()) { toast('Informe o nome', 'warn'); return; }
    if (!form.role?.trim()) { toast('Informe o cargo', 'warn'); return; }
    if (!Number(form.salary)) { toast('Informe o salário', 'warn'); return; }
    const data:any = {...form, salary:Number(form.salary), benefits:Number(form.benefits||0), admissionAt:new Date(form.admissionAt).toISOString(), departmentId: form.departmentId || null};
    const ok = await saveAction.run(data);
    if (ok) { setOpen(false); setEdit(null); setForm({name:'', cpf:'', role:'', departmentId:'', salary:'', benefits:'0', admissionAt:new Date().toISOString().slice(0,10), active:true}); }
  };

  return (
    <div>
      <PageHead title="Funcionários" subtitle="Cadastro de colaboradores CLT. Base para folha de pagamento, encargos e centros de custo."
        actions={<>
          <ExportMenu filename="funcionarios" title="Funcionários" rows={c.items} columns={[
            {key:'name',label:'Nome'},{key:'cpf',label:'CPF'},{key:'role',label:'Cargo'},
            {key:'departmentId',label:'Departamento',format:r=>depts.find(d=>d.id===r.departmentId)?.name||'—'},
            {key:'salary',label:'Salário',format:r=>fmt(Number(r.salary))},
            {key:'benefits',label:'Benefícios',format:r=>fmt(Number(r.benefits||0))},
            {key:'admissionAt',label:'Admissão',format:r=>fmtDate(r.admissionAt)},
            {key:'active',label:'Status',format:r=>r.active?'Ativo':'Demitido'},
          ]}/>
          <button className="primary" style={{width:'auto'}} onClick={newE}>+ Funcionário</button>
        </>}/>

      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Funcionários Ativos</div><div className="k-value">{c.items.filter(e=>e.active).length}</div></div>
        <div className="kpi"><div className="k-label">Folha (salários)</div><div className="k-value">{fmt(totalPayroll)}</div></div>
        <div className="kpi"><div className="k-label">Custo Total Estimado</div><div className="k-value" style={{color:'var(--bad)'}}>{fmt(totalCost)}</div><div style={{fontSize:11, color:'var(--muted)'}}>+ ~50% encargos</div></div>
      </div>

      {c.items.length===0 ? <EmptyState title="Nenhum funcionário" hint="Cadastre seu time e gere folha de pagamento automática." action={<button className="primary" style={{width:'auto'}} onClick={newE}>+ Primeiro funcionário</button>}/> : (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
              <thead><tr style={{background:'var(--surface-2)'}}>{['Nome','Cargo','Depto','Salário','Benefícios','Admissão','Status','Ações'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{c.items.map(e=>(
                <tr key={e.id} style={{borderBottom:'1px solid var(--border)'}}>
                  <td style={td}><strong>{e.name}</strong>{e.cpf && <div style={{fontSize:11, color:'var(--muted)'}}>{e.cpf}</div>}</td>
                  <td style={td}>{e.role}</td>
                  <td style={td}>{depts.find(d=>d.id===e.departmentId)?.name || '—'}</td>
                  <td style={tdMono}>{fmt(Number(e.salary))}</td>
                  <td style={tdMono}>{fmt(Number(e.benefits||0))}</td>
                  <td style={td}>{fmtDate(e.admissionAt)}</td>
                  <td style={td}><span style={{color:e.active?'var(--good)':'var(--muted)'}}>{e.active?'Ativo':'Demitido'}</span></td>
                  <td style={td}>
                    <button className="ghost" onClick={()=>editE(e)}>✏</button>
                    <button className="ghost" disabled={removeAction.loading} onClick={()=>{ if(confirm('Remover?'))removeAction.run(e.id);}}>🗑</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={open} onClose={()=>setOpen(false)} title={edit?'Editar Funcionário':'Novo Funcionário'} width={560}>
        <form onSubmit={save}>
          <div className="row">
            <div className="form-group"><label>Nome completo</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
            <div className="form-group"><label>CPF</label><DocumentInput type="CPF" value={form.cpf} onChange={v=>setForm({...form,cpf:v})}/></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Cargo</label><input value={form.role} onChange={e=>setForm({...form,role:e.target.value})} required placeholder="Ex: Analista de Marketing"/></div>
            <div className="form-group"><label>Departamento</label>
              <select value={form.departmentId} onChange={e=>setForm({...form,departmentId:e.target.value})}>
                <option value="">— Sem departamento —</option>
                {depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="row">
            <div className="form-group"><label>Salário Bruto (R$)</label><input type="number" step="0.01" min={0} value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} required/></div>
            <div className="form-group"><label>Benefícios (VR/VT/Plano R$)</label><input type="number" step="0.01" min={0} value={form.benefits} onChange={e=>setForm({...form,benefits:e.target.value})}/></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Data Admissão</label><input type="date" value={form.admissionAt} onChange={e=>setForm({...form,admissionAt:e.target.value})} required/></div>
            <div className="form-group" style={{display:'flex', alignItems:'flex-end'}}>
              <label className="checkbox-label" style={{display:'flex', alignItems:'center', gap:8}}><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Ativo</label>
            </div>
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
