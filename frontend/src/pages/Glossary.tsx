import { useMemo, useState } from 'react';
import { GLOSSARY } from '../lib/glossary';
import PageHead from '../components/PageHead';

export default function Glossary() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<string>('Todas');
  const cats = useMemo(() => Array.from(new Set(GLOSSARY.map(g => g.cat))), []);
  const filtered = useMemo(() => GLOSSARY.filter(g =>
    (cat==='Todas' || g.cat===cat) &&
    (search==='' || g.term.toLowerCase().includes(search.toLowerCase()) || g.def.toLowerCase().includes(search.toLowerCase()))
  ), [search, cat]);

  return (
    <div>
      <PageHead title="Glossário Financeiro" subtitle="Termos do mercado financeiro, investimentos, tributação e gestão empresarial."/>
      <div className="card" style={{padding:14, marginBottom:14, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar termo…" style={{flex:'1 1 200px', height:36, padding:'6px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)'}}/>
        <select value={cat} onChange={e=>setCat(e.target.value)} style={{height:36, padding:'6px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)'}}>
          <option>Todas</option>
          {cats.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:12}}>
        {filtered.map(g=>(
          <div key={g.term} className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
              <h3 style={{margin:0, fontSize:'1rem'}}>{g.term}</h3>
              <span style={{fontSize:10, padding:'2px 8px', borderRadius:999, background:'rgba(91,141,239,.15)', color:'var(--primary)', fontWeight:700, textTransform:'uppercase'}}>{g.cat}</span>
            </div>
            <div style={{fontSize:13, color:'var(--text-2)', lineHeight:1.5}}>{g.def}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
