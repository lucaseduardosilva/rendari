import { useMemo, useState } from 'react';
import PageHead from '../components/PageHead';
import { HELP_SECTIONS, FAQ } from '../lib/help';
import { usePlan } from '../hooks/usePlan';
import { useAuth } from '../stores/auth';

const WHATSAPP_PHONE = '5511900000000'; // Substituir pelo número oficial
const WHATSAPP_MSG = encodeURIComponent('Olá! Estou usando o Rendari e preciso de ajuda com:');

export default function Help() {
  const user = useAuth(s => s.user);
  const { hasPage, isAdmin, isLifetime } = usePlan();
  const [active, setActive] = useState('start');
  const [search, setSearch] = useState('');

  const userType = user?.type || 'PF';

  // Filtra seções pelo plano + perfil do usuário
  const sections = useMemo(() => HELP_SECTIONS.filter(s => {
    if (s.audience && s.audience !== 'BOTH' && s.audience !== userType) return false;
    if (s.requirePage && !isAdmin && !isLifetime && !hasPage(s.requirePage)) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !(s.intro || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [userType, hasPage, isAdmin, isLifetime, search]);

  const faq = useMemo(() => FAQ.filter(f => {
    if (f.audience && f.audience !== 'BOTH' && f.audience !== userType) return false;
    if (search && !f.q.toLowerCase().includes(search.toLowerCase()) && !f.a.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [userType, search]);

  // Agrupa por grupo
  const grouped = useMemo(() => {
    const g: Record<string, typeof sections> = {};
    sections.forEach(s => { (g[s.group] = g[s.group] || []).push(s); });
    return g;
  }, [sections]);

  const current = sections.find(s => s.id === active) || sections[0];

  return (
    <div>
      <PageHead title="Central de Ajuda"
        subtitle={`Tutorial completo, fórmulas dos cálculos e FAQ${user?.type === 'PJ' ? ' — incluindo módulo PJ' : ''}. Conteúdo filtrado pelo seu plano.`}/>

      <div id="help-search-card" className="card" style={{ padding: 14, marginBottom: 14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar no manual ou no FAQ…"
          style={{ width: '100%', height: 40, padding: '6px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14 }}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0,1fr)', gap: 16, alignItems: 'start' }} className="help-grid">
        {/* Sidebar */}
        <div className="card" style={{ padding: 8, position: 'sticky', top: 80, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, padding: '8px 10px 4px' }}>{group}</div>
              {items.map(s => (
                <button key={s.id} onClick={() => {
                  setActive(s.id);
                  const el = document.getElementById('help-search-card');
                  if (el) {
                    // Posiciona o TOPO do card de busca logo abaixo da navbar (63px) com pequeno gap
                    const target = window.scrollY + el.getBoundingClientRect().top - 63 - 16;
                    // Só rola se a posição atual estiver mais abaixo do que o desejado
                    if (window.scrollY > target) {
                      window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
                    }
                  }
                }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '7px 12px', background: active === s.id ? 'var(--surface-2)' : 'transparent',
                    border: 0, borderRadius: 6, color: active === s.id ? 'var(--text)' : 'var(--text-2)',
                    cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                    fontWeight: active === s.id ? 600 : 500,
                    boxShadow: active === s.id ? 'inset 2px 0 0 var(--primary)' : 'none',
                  }}>
                  {s.title}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Conteúdo */}
        <div id="help-content" style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {current && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>{current.group}</span>
              </div>
              <h2 style={{ margin: '0 0 12px', fontSize: '1.45rem' }}>{current.title}</h2>
              {current.intro && <p style={{ color: 'var(--text-2)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 16px' }}>{current.intro}</p>}

              {current.steps && current.steps.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <SectionTitle>Passo a passo</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {current.steps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--grad-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{i+1}</div>
                        <div>
                          <strong style={{ fontSize: 14 }}>{step.title}</strong>
                          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.5 }}>{step.body}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {current.formulas && current.formulas.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <SectionTitle>📐 Fórmulas</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {current.formulas.map((f, i) => (
                      <div key={i} style={{ padding: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--primary)', borderRadius: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{f.name}</div>
                        <code style={{ display: 'block', margin: '6px 0', padding: '8px 10px', background: 'var(--bg-2)', borderRadius: 6, fontSize: 12.5, color: 'var(--primary)', fontFamily: 'JetBrains Mono,monospace' }}>{f.expr}</code>
                        <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>{f.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {current.tips && current.tips.length > 0 && (
                <div>
                  <SectionTitle>💡 Dicas</SectionTitle>
                  <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.7 }}>
                    {current.tips.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* FAQ — só aparece quando a seção "Perguntas frequentes" está ativa */}
          {current?.id === 'faq' && (
            <div className="card" id="help-faq">
              <h2 style={{ margin: '0 0 14px', fontSize: '1.3rem' }}>❓ Perguntas Frequentes</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {faq.map((f, i) => <FaqItemBlock key={i} q={f.q} a={f.a} />)}
                {faq.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>Nenhum resultado para "{search}"</div>}
              </div>
            </div>
          )}

          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,.08), rgba(34,197,94,.02))', border: '1px solid rgba(34,197,94,.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 32 }}>💬</div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 15 }}>Não encontrou o que precisa?</strong>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Fale com nossa equipe pelo WhatsApp — respondemos em até 24h.</div>
              </div>
              <a href={`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${WHATSAPP_MSG}`} target="_blank" rel="noopener"
                style={{ background: '#25D366', color: '#fff', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                Abrir WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      <WhatsAppFAB />

      <style>{`
        @media(max-width:900px){
          .help-grid{grid-template-columns:1fr !important}
          .help-grid > div:first-child{position:static !important;max-height:none !important}
        }
      `}</style>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 8 }}>{children}</div>;
}

function FaqItemBlock({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', background: open ? 'var(--surface-2)' : 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, color: 'var(--text)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span>{q}</span>
        <span style={{ color: 'var(--muted)', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none', fontSize: 12 }}>▼</span>
      </button>
      {open && <div style={{ padding: '0 14px 14px', color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.6 }}>{a}</div>}
    </div>
  );
}

function WhatsAppFAB() {
  return (
    <a href={`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${WHATSAPP_MSG}`} target="_blank" rel="noopener"
      title="Falar no WhatsApp"
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 90,
        width: 60, height: 60, borderRadius: '50%',
        background: '#25D366', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(37, 211, 102, .35), 0 4px 12px rgba(0,0,0,.2)',
        textDecoration: 'none', transition: 'transform .15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  );
}
