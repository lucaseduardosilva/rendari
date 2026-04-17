import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { usePlan } from '../hooks/usePlan';
import { PAGE_INFO, FEATURE_INFO } from '../lib/pages';
import PageHead from '../components/PageHead';
import { fmt } from '../lib/format';

export default function Upgrade() {
  const loc = useLocation();
  const { plan } = usePlan();
  const [plans, setPlans] = useState<any[]>([]);
  const [tab, setTab] = useState<'PF'|'PJ'>('PF');

  useEffect(() => { api.get('/plans/public').then(({ data }) => setPlans(data)); }, []);

  const visible = useMemo(() => plans.filter(p => p.visibleFor === 'ALL' || p.visibleFor === tab), [plans, tab]);

  return (
    <div>
      <PageHead title="Planos & Recursos" subtitle={`Compare planos e veja exatamente o que cada um libera. ${plan ? `Seu plano: ${plan.name}` : ''}`}/>

      <div style={{display:'flex', gap:6, marginBottom:18}}>
        {(['PF','PJ'] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{padding:'8px 16px', background: tab===t?'var(--text)':'var(--surface)', color: tab===t?'var(--bg)':'var(--muted)', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', fontWeight:600, fontFamily:'inherit'}}>
            {t==='PF'?'Para Pessoa Física':'Para Pessoa Jurídica'}
          </button>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:14}}>
        {visible.map(p => {
          const current = plan?.slug === p.slug;
          const pages: string[] = p.features?.pages || [];
          const featureKeys = Object.keys(p.features||{}).filter(k => FEATURE_INFO[k] && p.features[k]);
          const max = p.features?.maxSavedSimulations === -1 ? 'ilimitadas' : `até ${p.features?.maxSavedSimulations} simulações`;

          // Agrupa páginas por categoria
          const grouped: Record<string, string[]> = {};
          pages.forEach(path => {
            const info = PAGE_INFO[path];
            if (!info) return;
            (grouped[info.group] = grouped[info.group] || []).push(info.name);
          });

          return (
            <div key={p.id} className="card" style={{borderColor: current?'var(--primary)':'var(--border)', borderWidth: current?2:1, position:'relative'}}>
              {current && <span style={{position:'absolute', top:-10, right:14, fontSize:11, padding:'4px 10px', background:'var(--primary)', color:'#fff', borderRadius:999, fontWeight:700, letterSpacing:'.05em'}}>SEU PLANO</span>}
              {p.slug==='lifetime' && <span style={{position:'absolute', top:-10, left:14, fontSize:11, padding:'4px 10px', background:'#000', color:'#b8860b', borderRadius:999, fontWeight:700, fontFamily:'Cinzel,serif'}}>LIFETIME ∞</span>}
              <strong style={{fontSize:18}}>{p.name}</strong>
              <div style={{color:'var(--muted)', fontSize:13, marginTop:4, minHeight:36}}>{p.description}</div>
              <div style={{fontSize:28, fontWeight:800, marginTop:14, fontFamily:'JetBrains Mono,monospace'}}>
                {Number(p.priceMonth)===0 && p.slug!=='free' && p.slug!=='lifetime' ? <span style={{fontSize:18}}>Sob consulta</span> : (
                  <>R$ {Number(p.priceMonth).toFixed(2).replace('.',',')}<span style={{fontSize:13, color:'var(--muted)', fontWeight:500}}>/mês</span></>
                )}
              </div>
              {Number(p.priceYear)>0 && <div style={{fontSize:12, color:'var(--muted)', marginTop:2}}>ou R$ {Number(p.priceYear).toFixed(2).replace('.',',')}/ano (2 meses grátis)</div>}

              <div style={{margin:'14px 0 8px', fontSize:11, color:'var(--muted)', textTransform:'uppercase', fontWeight:700, letterSpacing:'.06em'}}>Recursos extras</div>
              <ul style={{margin:0, paddingLeft:0, listStyle:'none', fontSize:13}}>
                <li style={liStyle}>✓ {pages.length} páginas habilitadas</li>
                <li style={liStyle}>✓ {p.features?.support === 'community'?'Suporte comunidade':p.features?.support === 'email'?'Suporte por email':p.features?.support === 'priority'?'Suporte prioritário':p.features?.support === 'dedicated'?'Suporte dedicado':'Suporte'}</li>
                <li style={liStyle}>✓ Salvar {max}</li>
                {featureKeys.map(k => <li key={k} style={liStyle}>✓ {FEATURE_INFO[k]}</li>)}
              </ul>

              <div style={{margin:'14px 0 8px', fontSize:11, color:'var(--muted)', textTransform:'uppercase', fontWeight:700, letterSpacing:'.06em'}}>Páginas incluídas</div>
              <div style={{maxHeight:240, overflowY:'auto', paddingRight:6}}>
                {Object.entries(grouped).map(([group, names]) => (
                  <div key={group} style={{marginBottom:8}}>
                    <div style={{fontSize:11, color:'var(--text)', fontWeight:700, marginBottom:3}}>{group}</div>
                    <ul style={{margin:0, paddingLeft:14, fontSize:12, color:'var(--text-2)', lineHeight:1.55}}>
                      {names.map(n => <li key={n}>{n}</li>)}
                    </ul>
                  </div>
                ))}
              </div>

              {!current && p.slug!=='free' && p.slug!=='lifetime' && (
                <button className="primary" style={{marginTop:14}}>Assinar (em breve)</button>
              )}
              {current && <div style={{marginTop:14, fontSize:12, color:'var(--muted)', textAlign:'center'}}>Você já está neste plano</div>}
            </div>
          );
        })}
      </div>

      {loc.state && (loc.state as any).from && (
        <div style={{marginTop:20, color:'var(--muted)', fontSize:13}}>
          ⚠ Você tentou acessar <code style={{background:'var(--surface-2)', padding:'2px 6px', borderRadius:4}}>{(loc.state as any).from}</code> — recurso indisponível no seu plano.
        </div>
      )}
      <div style={{marginTop:20}}>
        <Link to="/dashboard">← Voltar ao Dashboard</Link>
      </div>
    </div>
  );
}

const liStyle: React.CSSProperties = { padding:'4px 0', color:'var(--text-2)' };
