import { useState } from 'react';
import { useCrud } from '../../hooks/useCrud';
import PageHead from '../../components/PageHead';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { toast } from '../../stores/toast';
import SubmitButton from '../../components/SubmitButton';
import { useAsync } from '../../hooks/useAsync';

interface Dept { id:string; name:string; manager?:string; }

export default function Departments() {
  const c = useCrud<Dept>('/user/departments');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Dept|null>(null);
  const [form, setForm] = useState({ name:'', manager:'' });

  const newD = () => { setEdit(null); setForm({name:'', manager:''}); setOpen(true); };
  const editD = (d:Dept) => { setEdit(d); setForm({name:d.name, manager:d.manager||''}); setOpen(true); };

  const saveAction = useAsync(async (data:any) => {
    if (edit) await c.update(edit.id, data); else await c.create(data);
  }, { successMsg: 'Departamento salvo' });
  const removeAction = useAsync(c.remove, { successMsg: 'Removido' });

  const save = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast('Informe o nome do departamento', 'warn'); return; }
    const payload = { name: form.name.trim(), manager: form.manager.trim() || null };
    const ok = await saveAction.run(payload);
    if (ok) { setOpen(false); setEdit(null); setForm({name:'', manager:''}); }
  };

  return (
    <div>
      <PageHead title="Departamentos" subtitle="Estruture sua empresa em áreas funcionais para alocar funcionários e analisar custos."
        actions={<button className="primary" style={{width:'auto'}} onClick={newD}>+ Departamento</button>}/>

      {c.items.length===0 ? <EmptyState title="Nenhum departamento" hint="Comercial, TI, Financeiro, RH, Marketing…" action={<button className="primary" style={{width:'auto'}} onClick={newD}>+ Primeiro</button>}/> : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:12}}>
          {c.items.map(d=>(
            <div key={d.id} className="card">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                  <strong style={{fontSize:'1.05rem'}}>{d.name}</strong>
                  {d.manager && <div style={{fontSize:13, color:'var(--muted)', marginTop:4}}>👤 {d.manager}</div>}
                </div>
                <div>
                  <button className="ghost" onClick={()=>editD(d)}>✏</button>
                  <button className="ghost" disabled={removeAction.loading} onClick={()=>{ if(confirm('Remover?'))removeAction.run(d.id);}}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={()=>setOpen(false)} title={edit?'Editar Departamento':'Novo Departamento'}>
        <form onSubmit={save}>
          <div className="form-group"><label>Nome</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="Ex: Comercial"/></div>
          <div className="form-group"><label>Gerente / Responsável</label><input value={form.manager} onChange={e=>setForm({...form,manager:e.target.value})}/></div>
          <SubmitButton type="submit" loading={saveAction.loading}>Salvar</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
