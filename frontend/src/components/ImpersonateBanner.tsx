import { useNavigate } from 'react-router-dom';
import { useImpersonate } from '../stores/impersonate';
import { useAuth } from '../stores/auth';
import { useWhitelabel } from '../stores/whitelabel';
import { api } from '../lib/api';

export default function ImpersonateBanner() {
  const nav = useNavigate();
  const backup = useImpersonate(s => s.backup);
  const clear = useImpersonate(s => s.clear);
  const setAuth = useAuth(s => s.setAuth);
  const user = useAuth(s => s.user);
  const resetWl = useWhitelabel(s => s.reset);

  if (!backup) return null;

  const back = async () => {
    setAuth({ user: backup.user, accessToken: backup.accessToken, refreshToken: backup.refreshToken });
    clear();
    resetWl();
    // Re-aplica whitelabel admin se houver
    setTimeout(() => api.get('/auth/me').then(({data}) => { if(data.whitelabel) useWhitelabel.getState().apply(data.whitelabel); }), 100);
    nav('/admin/users');
  };

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'linear-gradient(90deg, var(--accent), var(--primary))', color: '#fff',
      padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, fontSize: 13, fontWeight: 600,
    }}>
      <span>👤 Você está impersonando <strong>{user?.name}</strong> ({user?.email}) · admin original: <strong>{backup.user?.name}</strong></span>
      <button onClick={back} style={{ background: '#fff', color: 'var(--primary-3)', border: 0, padding: '6px 14px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
        ← Voltar para admin
      </button>
    </div>
  );
}
