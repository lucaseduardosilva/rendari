import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../stores/auth';
import { useWhitelabel } from '../stores/whitelabel';

export default function Settings() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const applyWl = useWhitelabel((s) => s.apply);
  const [tab, setTab] = useState<'profile' | 'whitelabel' | 'security'>('profile');
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState((user as any)?.phone || '');
  const [pwd, setPwd] = useState({ current: '', next: '' });
  const [wl, setWl] = useState({
    brandName: '', logoUrl: '', faviconUrl: '',
    paletteDark: { primary: '#7aa2ff', primary2: '#5b8def', accent: '#a78bfa', good: '#22c55e', bad: '#ef4444', bg: '#06080d', surface: '#141a25', text: '#eef2f8' },
    paletteLight: { primary: '#3d6fd8', primary2: '#2563eb', accent: '#7c3aed', good: '#16a34a', bad: '#dc2626', bg: '#f6f8fc', surface: '#ffffff', text: '#0f172a' },
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user?.whitelabel) setWl({ ...wl, ...user.whitelabel });
  }, [user]);

  const saveProfile = async () => {
    const { data } = await api.put('/user/profile', { name, phone });
    setUser({ ...user!, ...data });
    setMsg('Perfil atualizado');
    setTimeout(() => setMsg(''), 2000);
  };
  const savePassword = async () => {
    if (pwd.next.length < 8) return alert('Senha mínima 8');
    await api.put('/user/password', { currentPassword: pwd.current, newPassword: pwd.next });
    setPwd({ current: '', next: '' });
    setMsg('Senha alterada');
    setTimeout(() => setMsg(''), 2000);
  };
  const saveWhitelabel = async () => {
    const { data } = await api.put('/user/whitelabel', wl);
    applyWl(data);
    setMsg('Whitelabel salvo');
    setTimeout(() => setMsg(''), 2000);
  };
  const upload = async (kind: 'logo' | 'favicon', file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post(`/user/upload/${kind}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3333'}${data.url}`;
    setWl({ ...wl, [kind === 'logo' ? 'logoUrl' : 'faviconUrl']: url });
  };
  const setPaletteColor = (theme: 'paletteDark' | 'paletteLight', key: string, val: string) => {
    setWl({ ...wl, [theme]: { ...wl[theme], [key]: val } } as any);
  };

  return (
    <div>
      <div className="page-head" style={{ marginBottom: 18 }}>
        <h1>Configurações</h1>
        <p>Gerencie seu perfil, segurança e identidade visual</p>
      </div>
      {msg && <div className="success-msg" style={{ marginBottom: 16 }}>{msg}</div>}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <button onClick={() => setTab('profile')} className={tab === 'profile' ? 'tab-active' : ''} style={tabStyle(tab === 'profile')}>Perfil</button>
        <button onClick={() => setTab('whitelabel')} style={tabStyle(tab === 'whitelabel')}>Whitelabel</button>
        <button onClick={() => setTab('security')} style={tabStyle(tab === 'security')}>Segurança</button>
      </div>

      {tab === 'profile' && (
        <div className="card">
          <h3>Dados do perfil</h3>
          <div className="form-group"><label>Nome</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="form-group"><label>Email</label><input value={user?.email || ''} disabled /></div>
          <div className="form-group"><label>Telefone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <button className="primary" style={{ width: 'auto' }} onClick={saveProfile}>Salvar</button>
        </div>
      )}

      {tab === 'whitelabel' && (
        <div className="card">
          <h3>Identidade visual da plataforma</h3>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>
            Personalize nome, logo, favicon e cores. Disponível para planos Pro+.
          </p>
          <div className="row">
            <div className="form-group"><label>Nome do site</label>
              <input value={wl.brandName || ''} onChange={(e) => setWl({ ...wl, brandName: e.target.value })} placeholder="Ex: Minha Empresa" />
            </div>
            <div className="form-group"><label>Logo (PNG/SVG)</label>
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload('logo', e.target.files[0])} />
            </div>
          </div>
          <div className="row">
            <div className="form-group"><label>Favicon</label>
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload('favicon', e.target.files[0])} />
            </div>
            <div></div>
          </div>
          {wl.logoUrl && <div style={{ marginBottom: 14 }}><img src={wl.logoUrl} alt="logo" style={{ height: 40, borderRadius: 6 }} /></div>}

          <h4 style={{ marginTop: 18, marginBottom: 8 }}>Paleta Dark</h4>
          <PaletteEditor palette={wl.paletteDark!} onChange={(k, v) => setPaletteColor('paletteDark', k, v)} />
          <h4 style={{ marginTop: 18, marginBottom: 8 }}>Paleta Light</h4>
          <PaletteEditor palette={wl.paletteLight!} onChange={(k, v) => setPaletteColor('paletteLight', k, v)} />

          <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
            <button type="button" className="primary" style={{ width: 'auto', marginTop:0 }} onClick={saveWhitelabel}>Salvar Whitelabel</button>
            <button type="button" className="secondary" style={{ width: 'auto' }} onClick={async () => {
              if (!confirm('Resetar TODA a personalização (nome, logo, favicon e paletas)? O sistema voltará ao visual padrão Rendari.')) return;
              const reset = { brandName: '', logoUrl: '', faviconUrl: '', paletteDark: {}, paletteLight: {} };
              await api.put('/user/whitelabel', reset);
              // Limpa CSS vars aplicadas no <html>
              const root = document.documentElement;
              ['primary','primary-2','primary2','primary-3','accent','good','bad','warn','bg','bg-elev','bg-2','surface','surface-2','text','text-2','muted','border'].forEach(v => root.style.removeProperty(`--${v}`));
              applyWl(reset);
              setWl({ ...wl, ...reset });
              setMsg('Whitelabel resetado — recarregue a página');
              setTimeout(() => location.reload(), 1500);
            }}>↺ Resetar para o padrão</button>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="card">
          <h3>Trocar senha</h3>
          <div className="form-group"><label>Senha atual</label><input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} /></div>
          <div className="form-group"><label>Nova senha (mín 8)</label><input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} /></div>
          <button className="primary" style={{ width: 'auto' }} onClick={savePassword}>Salvar nova senha</button>
        </div>
      )}
    </div>
  );
}

function PaletteEditor({ palette, onChange }: { palette: Record<string, string>, onChange: (k: string, v: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8 }}>
      {Object.entries(palette).map(([k, v]) => (
        <div key={k} className="form-group" style={{ marginBottom: 0 }}>
          <label>{k}</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="color" value={v} onChange={(e) => onChange(k, e.target.value)} style={{ width: 44, padding: 0, height: 38 }} />
            <input value={v} onChange={(e) => onChange(k, e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '10px 14px', background: 'transparent', border: 0, fontSize: 14, fontWeight: 600,
    color: active ? 'var(--primary)' : 'var(--muted)', borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
    marginBottom: -1, cursor: 'pointer', fontFamily: 'inherit',
  };
}
