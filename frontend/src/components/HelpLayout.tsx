import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { useTheme } from '../stores/theme';
import { useWhitelabel } from '../stores/whitelabel';
import { useAuth } from '../stores/auth';
import { api } from '../lib/api';

export default function HelpLayout() {
  const theme = useTheme(s => s.theme);
  const toggle = useTheme(s => s.toggle);
  const wl = useWhitelabel(s => s.wl);
  const applyWl = useWhitelabel(s => s.apply);
  const setUser = useAuth(s => s.setUser);

  // Carrega user no boot para aplicar whitelabel se houver
  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      setUser(data);
      if (data.whitelabel) applyWl(data.whitelabel);
    }).catch(() => {});
  }, []);

  const brandName = wl.brandName || 'Rendari';
  const logoUrl = wl.logoUrl;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--glass)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid var(--glass-border)', padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
      }}>
        <div className="brand">
          {logoUrl ? <img src={logoUrl} alt="" style={{ width: 30, height: 30, borderRadius: 8 }} /> : <div className="brand-mark">R</div>}
          <span>{brandName}</span>
          <span style={{ marginLeft: 14, padding: '3px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 999, fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Central de Ajuda</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="icon-btn" onClick={toggle} title="Alternar tema">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <button className="icon-btn" onClick={() => window.close()} title="Fechar aba" aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto', padding: '28px 24px' }}>
        <Outlet />
      </main>

      <footer>
        <div className="footer-inner">
          <div className="footer-bottom" style={{ borderTop: 0, paddingTop: 0 }}>
            <span>© 2026 {brandName} · Todos os direitos reservados</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
