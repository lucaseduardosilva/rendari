import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import PageHead from '../../components/PageHead';

export default function AdminDashboard() {
  const [s, setS] = useState<any>(null);
  useEffect(() => { api.get('/admin/stats').then(r => setS(r.data)); }, []);
  if (!s) return <div className="card">Carregando…</div>;
  return (
    <div>
      <PageHead title="Painel Admin" subtitle="Visão geral da plataforma — métricas em tempo real."/>
      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Total de Usuários</div><div className="k-value">{s.totalUsers}</div></div>
        <div className="kpi"><div className="k-label">Ativos</div><div className="k-value" style={{color:'var(--good)'}}>{s.activeUsers}</div></div>
        <div className="kpi"><div className="k-label">Pessoa Física</div><div className="k-value">{s.totalPF}</div></div>
        <div className="kpi"><div className="k-label">Pessoa Jurídica</div><div className="k-value">{s.totalPJ}</div></div>
        <div className="kpi"><div className="k-label">Novos (7 dias)</div><div className="k-value" style={{color:'var(--primary)'}}>{s.recentUsers}</div></div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14}}>
        <div className="card">
          <h3>Atalhos</h3>
          <ul style={{lineHeight:2, margin:'8px 0 0', paddingLeft:18}}>
            <li><a href="/admin/users">→ Gerenciar usuários</a></li>
            <li><a href="/admin/plans">→ Gerenciar planos</a></li>
          </ul>
        </div>
        <div className="card">
          <h3>Insights</h3>
          <p style={{color:'var(--muted)', fontSize:13, lineHeight:1.6, margin:'8px 0 0'}}>
            Taxa PF: {s.totalUsers>0 ? Math.round(s.totalPF/s.totalUsers*100):0}% · Taxa PJ: {s.totalUsers>0 ? Math.round(s.totalPJ/s.totalUsers*100):0}% · Conversão (ativos): {s.totalUsers>0 ? Math.round(s.activeUsers/s.totalUsers*100):0}%
          </p>
        </div>
      </div>
    </div>
  );
}
