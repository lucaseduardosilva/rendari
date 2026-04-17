import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../stores/auth';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const btnLike: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', textDecoration:'none', fontWeight:600, fontSize:13 };

export default function Dashboard() {
  const user = useAuth((s) => s.user);
  const [s, setS] = useState<any>(null);
  useEffect(() => { api.get('/finance/summary').then(({ data }) => setS(data)).catch(() => {}); }, []);

  return (
    <div>
      <div className="page-head" style={{ marginBottom: 24 }}>
        <h1>Olá, {user?.name?.split(' ')[0] || 'usuário'} 👋</h1>
        <p>Visão consolidada das suas finanças{user?.type === 'PJ' ? ' empresariais' : ''}.</p>
      </div>
      {!user?.emailVerified && (
        <div style={{ background: 'var(--warn-soft)', border: '1px solid rgba(245,158,11,.3)', color: 'var(--warn)', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
          ⚠ Confirme seu email para ter acesso completo aos recursos.{' '}
          <button style={{ marginLeft: 8, background: 'transparent', border: 0, color: 'var(--warn)', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => api.post('/auth/resend-verify-email').then(() => alert('Email reenviado!'))}>Reenviar</button>
        </div>
      )}
      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Renda Mensal</div><div className="k-value">{s ? fmt(s.monthlyIncome) : '—'}</div></div>
        <div className="kpi"><div className="k-label">Despesas</div><div className="k-value">{s ? fmt(s.monthlyExpense) : '—'}</div></div>
        <div className="kpi"><div className="k-label">Sobra</div><div className="k-value" style={{ color: s?.surplus >= 0 ? 'var(--good)' : 'var(--bad)' }}>{s ? fmt(s.surplus) : '—'}</div></div>
        <div className="kpi"><div className="k-label">Patrimônio Líquido</div><div className="k-value">{s ? fmt(s.netWorth) : '—'}</div></div>
      </div>
      <div className="grid grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 16 }}>
        <div className="card">
          <h3>Próximos passos recomendados</h3>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--text-2)', lineHeight: 1.8 }}>
            <li>Cadastre suas receitas em <a href="/income">Receitas</a></li>
            <li>Mapeie despesas mensais em <a href="/expenses">Despesas</a> (suporta parcelas de cartão)</li>
            <li>Catalogue seu patrimônio em <a href="/patrimony">Patrimônio</a></li>
            <li>Defina objetivos em <a href="/goals">Metas</a></li>
            <li>Simule investimentos no <a href="/simulator">Simulador</a></li>
          </ul>
        </div>
        <div className="card">
          <h3>Atalhos rápidos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <a href="/income" className="secondary" style={btnLike}>+ Receita</a>
            <a href="/expenses" className="secondary" style={btnLike}>+ Despesa</a>
            <a href="/goals" className="secondary" style={btnLike}>+ Meta</a>
            <a href="/simulator" className="secondary" style={btnLike}>Simular</a>
          </div>
        </div>
      </div>
    </div>
  );
}
