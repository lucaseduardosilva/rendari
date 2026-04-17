import { useMemo, useState } from 'react';
import { ASSETS, filterAssets, Country } from '../lib/catalog';
import { useAuth } from '../stores/auth';
import PageHead from '../components/PageHead';
import ExportMenu from '../components/ExportMenu';

const COUNTRIES: { v: Country|'ALL', l: string, e: string }[] = [
  { v:'ALL', l:'Todos', e:'🌐' },
  { v:'BR',  l:'Brasil', e:'🇧🇷' },
  { v:'US',  l:'EUA', e:'🇺🇸' },
  { v:'GLOBAL', l:'Cripto', e:'🪙' },
];

const scoreColor = (v:number) => v>=8?'var(--good)' : v>=5?'var(--warn)' : 'var(--bad)';

export default function Catalog() {
  const user = useAuth(s => s.user);
  const [investor, setInvestor] = useState<'PF'|'PJ'|'ALL'>(user?.type || 'ALL');
  const [country, setCountry] = useState<Country|'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let r = filterAssets({ investor, country });
    if (search) r = r.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [investor, country, search]);

  return (
    <div>
      <PageHead title="Catálogo de Investimentos" subtitle="Notas 0-10 (10 = melhor). Filtros separam ativos para Pessoa Física e Pessoa Jurídica."
        actions={<ExportMenu filename="catalogo-investimentos" title="Catálogo" rows={filtered} columns={[
          {key:'name',label:'Ativo'},{key:'country',label:'País'},
          {key:'investorType',label:'Para',format:r=>r.investorType==='BOTH'?'PF + PJ':r.investorType},
          {key:'category',label:'Categoria'},{key:'desc',label:'Descrição'},
          {key:'risk',label:'Risco'},{key:'ret',label:'Retorno'},{key:'tax',label:'Imposto'},
          {key:'annualReturn',label:'Ret. anual %'},
        ]}/>}/>

      <div className="card" style={{padding:14, marginBottom:14}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14}}>
          <div>
            <label style={{display:'block', fontSize:11, color:'var(--muted)', textTransform:'uppercase', marginBottom:6, fontWeight:600}}>Para quem</label>
            <div style={{display:'flex', gap:6}}>
              {(['ALL','PF','PJ'] as const).map(v => (
                <button key={v} onClick={()=>setInvestor(v)} style={btnFilter(investor===v)}>{v==='ALL'?'Todos':v==='PF'?'Pessoa Física':'Pessoa Jurídica'}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{display:'block', fontSize:11, color:'var(--muted)', textTransform:'uppercase', marginBottom:6, fontWeight:600}}>País</label>
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              {COUNTRIES.map(c => (
                <button key={c.v} onClick={()=>setCountry(c.v)} style={btnFilter(country===c.v)}>{c.e} {c.l}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{display:'block', fontSize:11, color:'var(--muted)', textTransform:'uppercase', marginBottom:6, fontWeight:600}}>Buscar</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome ou descrição…" style={{width:'100%', height:34, padding:'6px 10px', background:'var(--surface-2)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8}}/>
          </div>
        </div>
      </div>

      <div style={{fontSize:13, color:'var(--muted)', marginBottom:14}}>{filtered.length} ativo(s) encontrado(s)</div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:14}}>
        {filtered.map(a => {
          const flag = a.country==='BR'?'🇧🇷':a.country==='US'?'🇺🇸':'🪙';
          const investorBadge = a.investorType==='PF'?{l:'PF',c:'var(--primary)'}:a.investorType==='PJ'?{l:'PJ',c:'var(--accent)'}:{l:'PF + PJ',c:'var(--good)'};
          return (
            <div key={a.id} className="card">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
                <div>
                  <h3 style={{margin:0, fontSize:'1.05rem'}}>{flag} {a.name}</h3>
                  <div style={{fontSize:11, color:'var(--muted)', marginTop:2, textTransform:'uppercase', letterSpacing:'.05em', fontWeight:600}}>{a.category}</div>
                </div>
                <span style={{fontSize:10, padding:'3px 8px', borderRadius:999, background:`${investorBadge.c}33`, color:investorBadge.c, fontWeight:700}}>{investorBadge.l}</span>
              </div>
              <p style={{color:'var(--text-2)', fontSize:13, margin:'10px 0', lineHeight:1.5}}>{a.desc}</p>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, margin:'10px 0'}}>
                <Score label="Risco" v={a.risk}/>
                <Score label="Retorno" v={a.ret}/>
                <Score label="Imposto" v={a.tax}/>
              </div>
              {a.pjNote && (
                <div style={{padding:'8px 10px', background:'var(--bg-2)', borderRadius:8, fontSize:12, color:'var(--text-2)', borderLeft:'3px solid var(--accent)', margin:'6px 0'}}>
                  <strong style={{color:'var(--accent)'}}>PJ:</strong> {a.pjNote}
                </div>
              )}
              <div style={{padding:'10px 12px', background:'var(--surface-2)', borderRadius:8, fontSize:12, color:'var(--text-2)', border:'1px solid var(--border)', marginTop:8}}>
                <strong style={{display:'block', fontSize:10, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4}}>Onde Investir</strong>
                {a.where}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Score({ label, v }: { label:string; v:number }) {
  return (
    <div style={{background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 10px', textAlign:'center'}}>
      <div style={{fontSize:10, color:'var(--muted)', textTransform:'uppercase', fontWeight:600}}>{label}</div>
      <div style={{fontSize:'1.15rem', fontWeight:800, marginTop:2, color:scoreColor(v), fontFamily:'JetBrains Mono,monospace'}}>{v}/10</div>
      <div style={{height:4, background:'var(--bg-2)', borderRadius:999, marginTop:4, overflow:'hidden'}}>
        <div style={{width:`${v*10}%`, height:'100%', background:scoreColor(v)}}/>
      </div>
    </div>
  );
}

function btnFilter(active: boolean): React.CSSProperties {
  return { background: active?'var(--text)':'var(--surface-2)', color: active?'var(--bg)':'var(--muted)', border:'1px solid var(--border)', borderRadius:999, padding:'6px 12px', fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600 };
}
