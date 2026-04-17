import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../stores/auth';
import { useTheme } from '../stores/theme';
import { useWhitelabel } from '../stores/whitelabel';
import { usePlan } from '../hooks/usePlan';
import { api } from '../lib/api';
import ImpersonateBanner from './ImpersonateBanner';

interface NavItem { to: string; label: string; }
interface NavGroup { title: string; items: NavItem[]; show?: 'PF' | 'PJ' | 'ALL' | 'ADMIN'; }

const NAV_GROUPS: NavGroup[] = [
  { title: 'Planejamento', show: 'ALL', items: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/income', label: 'Receitas' },
    { to: '/expenses', label: 'Despesas' },
    { to: '/patrimony', label: 'Patrimônio' },
    { to: '/goals', label: 'Metas' },
    { to: '/plan', label: 'Plano de Aportes' },
  ]},
  { title: 'Ativos & Renda', show: 'ALL', items: [
    { to: '/vehicles', label: 'Veículos' },
    { to: '/properties', label: 'Imóveis' },
    { to: '/streams', label: 'Estratégias de Renda' },
  ]},
  { title: 'Empresa (PJ)', show: 'PJ', items: [
    { to: '/dre', label: 'DRE' },
    { to: '/payroll', label: 'Folha de Pagamento' },
    { to: '/employees', label: 'Funcionários' },
    { to: '/invoices', label: 'Notas Fiscais' },
    { to: '/cost-centers', label: 'Centros de Custo' },
    { to: '/departments', label: 'Departamentos' },
    { to: '/business-taxes', label: 'Impostos PJ' },
    { to: '/cashflow', label: 'Fluxo de Caixa' },
  ]},
  { title: 'Investimentos', show: 'ALL', items: [
    { to: '/catalog', label: 'Catálogo' },
    { to: '/simulator', label: 'Simulador' },
    { to: '/hybrid', label: 'Carteira Híbrida' },
    { to: '/saved', label: 'Minhas Simulações' },
    { to: '/compare', label: 'BR × EUA' },
    { to: '/ranking', label: 'Ranking' },
  ]},
  { title: 'Referência', show: 'ALL', items: [
    { to: '/where', label: 'Onde Investir' },
    { to: '/taxes', label: 'Impostos' },
    { to: '/glossary', label: 'Glossário' },
  ]},
  { title: 'Administração', show: 'ADMIN', items: [
    { to: '/admin', label: 'Painel Admin' },
    { to: '/admin/users', label: 'Usuários' },
    { to: '/admin/plans', label: 'Planos' },
  ]},
];

export default function Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const setUser = useAuth((s) => s.setUser);
  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggle);
  const applyWl = useWhitelabel((s) => s.apply);
  const resetWl = useWhitelabel((s) => s.reset);
  const wl = useWhitelabel((s) => s.wl);
  const { hasPage, plan, isAdmin, isLifetime } = usePlan();

  const [hidden, setHidden] = useState(localStorage.getItem('rendari.sidebar.hidden') === '1');
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      setUser(data);
      if (data.whitelabel) applyWl(data.whitelabel);
      else resetWl();
    }).catch(() => {});
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth <= 1024) setOpen(true);
    else {
      const v = !hidden;
      setHidden(v);
      localStorage.setItem('rendari.sidebar.hidden', v ? '1' : '0');
    }
  };

  const visibleGroups = NAV_GROUPS.filter((g) => {
    if (g.show === 'ADMIN') return isAdmin;
    if (g.show === 'PJ') return user?.type === 'PJ' || isLifetime;
    return true;
  });

  const brandName = wl.brandName || 'Rendari';
  const logoUrl = wl.logoUrl;

  return (
    <>
      <ImpersonateBanner />
      <div className={`sidebar-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <div className={`shell ${hidden ? 'sidebar-hidden' : ''}`}>
        <aside className={`sidebar ${open ? 'open' : ''}`}>
          <div className="sidebar-head">
            <div className="brand">
              {logoUrl ? <img src={logoUrl} alt="" style={{ width: 30, height: 30, borderRadius: 8 }} /> : <div className="brand-mark">R</div>}
              <span>{brandName}</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            {visibleGroups.map((g) => (
              <div className="nav-group" key={g.title}>
                <div className="nav-group-title"><span>{g.title}</span></div>
                <div className="nav-items">
                  {g.items.map((it) => {
                    const allowed = g.show === 'ADMIN' || hasPage(it.to);
                    return (
                      <NavLink
                        to={allowed ? it.to : '/upgrade'}
                        key={it.to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setOpen(false)}
                        style={!allowed ? { opacity: .55 } : undefined}
                      >
                        {it.label}
                        {!allowed && <span style={{ marginLeft: 'auto', fontSize: 11 }}>🔒</span>}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="sidebar-foot">
            {brandName} · Gestão financeira completa<br />
            <span style={{ color: 'var(--muted-2)' }}>Plano: {plan?.name || 'Free'}{isLifetime ? ' ∞' : ''}</span>
          </div>
        </aside>

        <div className="content">
          <header className="navbar">
            <button className="nav-toggle" onClick={toggleSidebar} aria-label="Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/></svg>
            </button>
            <div className="nav-title">{getTitleFor(loc.pathname)}</div>
            <button className="icon-btn" onClick={toggleTheme} title="Alternar tema">
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <div className="user-menu">
              <button className="icon-btn" onClick={() => setUserMenu((v) => !v)} aria-label="Perfil">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>
              </button>
              {userMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 70 }} onClick={() => setUserMenu(false)} />
                  <div className="user-menu-dropdown" style={{ zIndex: 81 }}>
                    <div className="user-menu-info">
                      <strong>{user?.name}</strong>
                      <span>{user?.email}</span>
                      <span style={{ marginTop: 4 }}>
                        {user?.type === 'PJ' ? 'Empresa' : 'Pessoa Física'}
                        {isAdmin ? ' · ADMIN' : ''}
                        {isLifetime ? ' · Lifetime ∞' : plan ? ` · ${plan.name}` : ''}
                      </span>
                    </div>
                    <NavLink to="/settings" onClick={() => setUserMenu(false)}>⚙ Configurações</NavLink>
                    <NavLink to="/upgrade" onClick={() => setUserMenu(false)}>⭐ Planos / Upgrade</NavLink>
                    {isAdmin && <NavLink to="/admin" onClick={() => setUserMenu(false)}>🛡 Admin</NavLink>}
                    <button onClick={async () => { await api.post('/auth/logout').catch(()=>{}); resetWl(); logout(); nav('/login'); }}>↪ Sair</button>
                  </div>
                </>
              )}
            </div>
          </header>

          <div className="content-inner">
            <Outlet />
          </div>

          <footer>© 2026 {brandName} · Todos os direitos reservados</footer>
        </div>
      </div>
    </>
  );
}

function getTitleFor(path: string) {
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard', '/income': 'Receitas', '/expenses': 'Despesas',
    '/patrimony': 'Patrimônio', '/goals': 'Metas', '/plan': 'Plano de Aportes',
    '/vehicles': 'Veículos', '/properties': 'Imóveis', '/streams': 'Estratégias de Renda',
    '/catalog': 'Catálogo', '/simulator': 'Simulador', '/hybrid': 'Carteira Híbrida',
    '/saved': 'Minhas Simulações', '/compare': 'BR × EUA', '/ranking': 'Ranking',
    '/where': 'Onde Investir', '/taxes': 'Impostos', '/glossary': 'Glossário',
    '/admin': 'Painel Admin', '/admin/users': 'Usuários', '/admin/plans': 'Planos',
    '/settings': 'Configurações', '/upgrade': 'Planos',
    '/dre': 'DRE', '/payroll': 'Folha de Pagamento', '/employees': 'Funcionários',
    '/invoices': 'Notas Fiscais', '/cost-centers': 'Centros de Custo',
    '/departments': 'Departamentos', '/business-taxes': 'Impostos PJ', '/cashflow': 'Fluxo de Caixa',
  };
  return map[path] || 'Rendari';
}
