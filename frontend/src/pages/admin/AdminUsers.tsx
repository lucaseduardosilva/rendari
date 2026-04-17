import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import PageHead from '../../components/PageHead';
import Modal from '../../components/Modal';
import Dropdown from '../../components/Dropdown';
import PasswordInput from '../../components/PasswordInput';
import ExportMenu from '../../components/ExportMenu';
import { fmtDate } from '../../lib/format';
import { useAuth } from '../../stores/auth';
import { useImpersonate } from '../../stores/impersonate';
import { useWhitelabel } from '../../stores/whitelabel';

export default function AdminUsers() {
  const nav = useNavigate();
  const me = useAuth(s => s.user);
  const setAuth = useAuth(s => s.setAuth);
  const accessToken = useAuth(s => s.accessToken);
  const refreshToken = useAuth(s => s.refreshToken);
  const setBackup = useImpersonate(s => s.set);
  const applyWl = useWhitelabel(s => s.apply);
  const resetWl = useWhitelabel(s => s.reset);

  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [plans, setPlans] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    const { data } = await api.get(`/admin/users?q=${search}&page=${page}&limit=20`);
    setUsers(data.items); setPages(data.pages);
  };
  useEffect(() => { load(); api.get('/admin/plans').then(r => setPlans(r.data)); }, []);
  useEffect(() => { load(); }, [page]);

  const remove = async (u: any) => {
    if (!confirm(`Excluir ${u.email} e TODOS seus dados? Esta ação é irreversível.`)) return;
    await api.delete(`/admin/users/${u.id}`); load();
  };

  const impersonate = async (u: any) => {
    if (!confirm(`Acessar a conta de ${u.email}? Você poderá voltar à sua conta admin a qualquer momento.`)) return;
    try {
      const { data } = await api.post(`/admin/users/${u.id}/impersonate`);
      // Backup do token admin atual
      setBackup({ user: me, accessToken: accessToken!, refreshToken: refreshToken! });
      // Aplica novo
      setAuth({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      // Reset whitelabel e reaplica do alvo
      resetWl();
      if (data.user.whitelabel) setTimeout(() => applyWl(data.user.whitelabel), 50);
      nav('/dashboard');
    } catch (e: any) {
      alert(e.response?.data?.error || 'Falha ao impersonar');
    }
  };

  return (
    <div>
      <PageHead title="Usuários" subtitle="Gerencie todos os usuários da plataforma. Edite dados, reset de senha, impersonate."
        actions={<ExportMenu filename="usuarios-rendari" title="Usuários" rows={users} columns={[
          { key:'email', label:'Email' },{ key:'name', label:'Nome' },{ key:'type', label:'Tipo' },
          { key:'plan', label:'Plano', format:r => r.plan?.name||'—' },{ key:'role', label:'Role' },
          { key:'emailVerified', label:'Email OK', format:r => r.emailVerified?'Sim':'Não' },
          { key:'createdAt', label:'Criado em', format:r => fmtDate(r.createdAt) },
          { key:'active', label:'Status', format:r => r.active?'Ativo':'Suspenso' },
        ]}/>}
      />

      <div className="card" style={{ padding: 14, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Buscar por email, nome ou documento…"
          style={{ flex: 1, height: 36, padding: '6px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
        <button className="secondary" onClick={() => { setPage(1); load(); }}>Buscar</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: 'var(--surface-2)' }}>{['Email','Nome','Tipo','Plano','Role','Verif','Criado','Status','Ações'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={td}><strong>{u.email}</strong></td>
                <td style={td}>{u.name}</td>
                <td style={td}><span style={typeBadge(u.type)}>{u.type}</span></td>
                <td style={td}>{u.plan?.name || '—'}</td>
                <td style={td}><span style={{ color: u.role==='ADMIN'?'var(--bad)':'var(--text)', fontWeight: u.role==='ADMIN'?700:400 }}>{u.role}</span></td>
                <td style={td} title={`Email ${u.emailVerified?'verificado':'pendente'} · Telefone ${u.phoneVerified?'verificado':'pendente'}`}>
                  <span style={{ color: u.emailVerified?'var(--good)':'var(--muted)' }}>✉</span>{' '}
                  <span style={{ color: u.phoneVerified?'var(--good)':'var(--muted)' }}>📱</span>
                </td>
                <td style={td}>{fmtDate(u.createdAt)}</td>
                <td style={td}><span style={{ color: u.active?'var(--good)':'var(--bad)', fontWeight: 600 }}>{u.active?'● Ativo':'○ Suspenso'}</span></td>
                <td style={td}>
                  <Dropdown items={[
                    { label: 'Editar', icon: '✎', onClick: () => setEditing(u) },
                    { label: 'Acessar conta (impersonate)', icon: '👤', onClick: () => impersonate(u), disabled: u.id === me?.id || !u.active },
                    { divider: true } as any,
                    { label: u.active ? 'Suspender' : 'Reativar', icon: u.active?'⏸':'▶', onClick: async () => { await api.put(`/admin/users/${u.id}`, { active: !u.active }); load(); } },
                    { label: u.role==='ADMIN' ? 'Remover admin' : 'Tornar admin', icon: '⚑', onClick: async () => { await api.put(`/admin/users/${u.id}`, { role: u.role==='ADMIN'?'USER':'ADMIN' }); load(); }, disabled: u.id === me?.id },
                    { divider: true } as any,
                    { label: 'Excluir conta', icon: '✕', onClick: () => remove(u), danger: true, disabled: u.id === me?.id },
                  ]}/>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        <button className="secondary" disabled={page<=1} onClick={() => setPage(p => p-1)}>‹ Anterior</button>
        <span style={{ padding: '8px 14px', color: 'var(--muted)' }}>Página {page} de {pages}</span>
        <button className="secondary" disabled={page>=pages} onClick={() => setPage(p => p+1)}>Próxima ›</button>
      </div>

      {editing && <EditUserModal user={editing} plans={plans} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }}/>}
    </div>
  );
}

function EditUserModal({ user, plans, onClose, onSaved }: { user: any; plans: any[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: user.name || '', email: user.email || '', phone: user.phone || '',
    type: user.type, documentNumber: user.documentNumber || '',
    role: user.role, planId: user.planId || '', active: user.active,
    emailVerified: user.emailVerified, phoneVerified: user.phoneVerified,
    password: '',
  });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setSaving(true);
    try {
      const data: any = { ...form };
      if (!data.password) delete data.password;
      if (!data.planId) data.planId = null;
      await api.put(`/admin/users/${user.id}`, data);
      onSaved();
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  return (
    <Modal open={true} onClose={onClose} title={`Editar usuário · ${user.email}`} width={600}>
      <form onSubmit={save}>
        {err && <div style={{background:'var(--bad-soft)', color:'var(--bad)', padding:'8px 12px', borderRadius:6, fontSize:13, marginBottom:12, border:'1px solid rgba(239,68,68,.25)'}}>{err}</div>}

        <Section title="Identidade">
          <div className="row">
            <div className="form-group"><label>Nome completo</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></div>
          </div>
          <div className="row">
            <div className="form-group"><label>Telefone</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+55 11 99999-9999"/></div>
            <div className="form-group"><label>Tipo</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>{form.type==='PJ'?'CNPJ':'CPF'}</label><input value={form.documentNumber} onChange={e=>setForm({...form,documentNumber:e.target.value})}/></div>
        </Section>

        <Section title="Acesso & Plano">
          <div className="row">
            <div className="form-group"><label>Role</label>
              <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="form-group"><label>Plano</label>
              <select value={form.planId} onChange={e=>setForm({...form,planId:e.target.value})}>
                <option value="">— Sem plano —</option>
                {plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:8, marginTop:6}}>
            <ToggleBox label="Conta ativa" checked={form.active} onChange={v=>setForm({...form,active:v})}/>
            <ToggleBox label="Email verificado" checked={form.emailVerified} onChange={v=>setForm({...form,emailVerified:v})}/>
            <ToggleBox label="Telefone verificado" checked={form.phoneVerified} onChange={v=>setForm({...form,phoneVerified:v})}/>
          </div>
        </Section>

        <Section title="Trocar senha (opcional)">
          <div className="form-group"><label>Nova senha</label>
            <PasswordInput value={form.password} onChange={v=>setForm({...form,password:v})} placeholder="Deixe em branco para não alterar" minLength={8}/>
          </div>
          {form.password && <div style={{fontSize:12, color:'var(--warn)', marginTop:-4}}>⚠ Ao trocar a senha, todas as sessões ativas do usuário serão desconectadas.</div>}
        </Section>

        <div style={{display:'flex', gap:8, justifyContent:'flex-end', alignItems:'center', marginTop:20, paddingTop:16, borderTop:'1px solid var(--border)'}}>
          <button type="button" className="secondary" onClick={onClose} style={{width:'auto', minWidth:110}}>Cancelar</button>
          <button type="submit" className="primary" style={{width:'auto', minWidth:160, marginTop:0}} disabled={saving}>{saving?'Salvando…':'Salvar alterações'}</button>
        </div>
      </form>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:700, marginBottom:8, paddingBottom:4, borderBottom:'1px solid var(--border)'}}>{title}</div>
      {children}
    </div>
  );
}

function ToggleBox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v:boolean)=>void }) {
  return (
    <label style={{display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', fontSize:13}}>
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{width:16, height:16, accentColor:'var(--primary)'}}/>
      <span>{label}</span>
    </label>
  );
}

function typeBadge(type: string): React.CSSProperties {
  const isPJ = type === 'PJ';
  return {
    padding: '2px 8px', borderRadius: 999,
    background: isPJ ? 'rgba(167,139,250,.15)' : 'rgba(91,141,239,.15)',
    color: isPJ ? 'var(--accent)' : 'var(--primary)',
    fontSize: 10, fontWeight: 700, letterSpacing: '.05em',
  };
}

const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 };
const td: React.CSSProperties = { padding: '10px 12px' };
