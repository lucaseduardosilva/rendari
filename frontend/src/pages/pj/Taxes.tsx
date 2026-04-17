import { useState } from 'react';
import { fmt, pct } from '../../lib/format';
import { calcSimples, calcLucroPresumido, calcLucroReal, SIMPLES_ANEXOS, PRESUMIDO_BASES, TAX_CALENDAR } from '../../lib/taxes';
import PageHead from '../../components/PageHead';

export default function Taxes() {
  const [tab, setTab] = useState<'simples'|'presumido'|'real'|'calendario'>('simples');
  return (
    <div>
      <PageHead title="Impostos PJ" subtitle="Calculadoras e tabelas dos 3 regimes tributários brasileiros + calendário de obrigações"/>
      <div style={{display:'flex', gap:4, borderBottom:'1px solid var(--border)', marginBottom:18, overflowX:'auto'}}>
        {[['simples','Simples Nacional'],['presumido','Lucro Presumido'],['real','Lucro Real'],['calendario','Calendário Tributário']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k as any)} style={{padding:'10px 16px', background:'transparent', border:0, fontSize:14, fontWeight:600, color: tab===k?'var(--primary)':'var(--muted)', borderBottom: tab===k?'2px solid var(--primary)':'2px solid transparent', marginBottom:-1, cursor:'pointer', whiteSpace:'nowrap'}}>{l}</button>
        ))}
      </div>
      {tab==='simples' && <Simples/>}
      {tab==='presumido' && <Presumido/>}
      {tab==='real' && <Real/>}
      {tab==='calendario' && <Calendario/>}
    </div>
  );
}

function Simples() {
  const [anexo, setAnexo] = useState<keyof typeof SIMPLES_ANEXOS>('III');
  const [fat12, setFat12] = useState('600000');
  const [fatMes, setFatMes] = useState('50000');
  const r = calcSimples(Number(fat12), anexo, Number(fatMes));
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14}}>
        <div className="card">
          <h3>Simulador DAS</h3>
          <div className="form-group"><label>Anexo</label>
            <select value={anexo} onChange={e=>setAnexo(e.target.value as any)}>
              {Object.entries(SIMPLES_ANEXOS).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Faturamento últimos 12 meses (RBT12) — R$</label>
            <input type="number" value={fat12} onChange={e=>setFat12(e.target.value)}/></div>
          <div className="form-group"><label>Faturamento do mês — R$</label>
            <input type="number" value={fatMes} onChange={e=>setFatMes(e.target.value)}/></div>
        </div>
        <div className="card">
          <h3>Resultado</h3>
          <div className="kpi-strip" style={{margin:0}}>
            <div className="kpi"><div className="k-label">Alíquota Efetiva</div><div className="k-value">{pct(r.aliquotaEfetiva, 2)}</div></div>
            <div className="kpi"><div className="k-label">DAS a Pagar</div><div className="k-value" style={{color:'var(--bad)'}}>{fmt(r.das)}</div></div>
          </div>
          {r.excedido && <div style={{marginTop:10, color:'var(--bad)', fontSize:13}}>⚠ RBT12 excedeu R$ 4,8 milhões — sublimite/desenquadramento</div>}
        </div>
      </div>
      <div className="card" style={{marginTop:14}}>
        <h3>Tabela de faixas — {SIMPLES_ANEXOS[anexo].name}</h3>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:13, marginTop:8}}>
          <thead><tr><th style={th}>Faixa RBT12 (R$)</th><th style={th}>Alíquota Nominal</th><th style={th}>Valor a Deduzir</th></tr></thead>
          <tbody>{SIMPLES_ANEXOS[anexo].faixas.map((f,i)=>(
            <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
              <td style={td}>até {fmt(f.upTo)}</td>
              <td style={tdMono}>{pct(f.rate, 2)}</td>
              <td style={tdMono}>{fmt(f.deduct)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function Presumido() {
  const [atividade, setAtividade] = useState<keyof typeof PRESUMIDO_BASES>('servicos');
  const [fatTri, setFatTri] = useState('300000');
  const r = calcLucroPresumido(Number(fatTri), atividade);
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14}}>
        <div className="card">
          <h3>Simulador Lucro Presumido</h3>
          <div className="form-group"><label>Atividade</label>
            <select value={atividade} onChange={e=>setAtividade(e.target.value as any)}>
              {Object.entries(PRESUMIDO_BASES).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Faturamento Trimestral (R$)</label>
            <input type="number" value={fatTri} onChange={e=>setFatTri(e.target.value)}/></div>
          <p style={{fontSize:12, color:'var(--muted)', marginTop:8}}>Limite: R$ 78 milhões/ano</p>
        </div>
        <div className="card">
          <h3>Total no Trimestre</h3>
          <div className="kpi-strip" style={{margin:0}}>
            <div className="kpi"><div className="k-label">IRPJ (15% + adic. 10%)</div><div className="k-value">{fmt(r.irpj)}</div></div>
            <div className="kpi"><div className="k-label">CSLL (9%)</div><div className="k-value">{fmt(r.csll)}</div></div>
            <div className="kpi"><div className="k-label">PIS (0,65%)</div><div className="k-value">{fmt(r.pis)}</div></div>
            <div className="kpi"><div className="k-label">COFINS (3%)</div><div className="k-value">{fmt(r.cofins)}</div></div>
            <div className="kpi"><div className="k-label">Total</div><div className="k-value" style={{color:'var(--bad)'}}>{fmt(r.total)}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Real() {
  const [fat, setFat] = useState('500000');
  const [custos, setCustos] = useState('350000');
  const r = calcLucroReal(Number(fat), Number(custos));
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14}}>
        <div className="card">
          <h3>Simulador Lucro Real</h3>
          <div className="form-group"><label>Faturamento (R$)</label>
            <input type="number" value={fat} onChange={e=>setFat(e.target.value)}/></div>
          <div className="form-group"><label>Custos + Despesas Dedutíveis (R$)</label>
            <input type="number" value={custos} onChange={e=>setCustos(e.target.value)}/></div>
          <p style={{fontSize:12, color:'var(--muted)'}}>Lucro Real é obrigatório para empresas com faturamento &gt; R$ 78 milhões/ano</p>
        </div>
        <div className="card">
          <h3>Tributação</h3>
          <div className="kpi-strip" style={{margin:0}}>
            <div className="kpi"><div className="k-label">Lucro Tributável</div><div className="k-value">{fmt(r.lucro)}</div></div>
            <div className="kpi"><div className="k-label">IRPJ (15% + adic. 10%)</div><div className="k-value">{fmt(r.irpj)}</div></div>
            <div className="kpi"><div className="k-label">CSLL (9%)</div><div className="k-value">{fmt(r.csll)}</div></div>
            <div className="kpi"><div className="k-label">PIS (1,65%)</div><div className="k-value">{fmt(r.pis)}</div></div>
            <div className="kpi"><div className="k-label">COFINS (7,6%)</div><div className="k-value">{fmt(r.cofins)}</div></div>
            <div className="kpi"><div className="k-label">Total</div><div className="k-value" style={{color:'var(--bad)'}}>{fmt(r.total)}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Calendario() {
  return (
    <div className="card" style={{padding:0, overflow:'hidden'}}>
      <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
        <thead><tr style={{background:'var(--surface-2)'}}><th style={th}>Dia</th><th style={th}>Obrigação</th><th style={th}>Descrição</th></tr></thead>
        <tbody>{TAX_CALENDAR.map((t,i)=>(
          <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
            <td style={{...td, fontFamily:'JetBrains Mono,monospace', fontWeight:700}}>{String(t.day).padStart(2,'0')}</td>
            <td style={td}><strong>{t.name}</strong></td>
            <td style={{...td, color:'var(--muted)'}}>{t.desc}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = { padding:'10px 14px', textAlign:'left', fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 };
const td: React.CSSProperties = { padding:'10px 14px' };
const tdMono: React.CSSProperties = { ...td, fontFamily:'JetBrains Mono,monospace' };
