import { useMemo, useState } from 'react';
import { ASSETS } from '../lib/catalog';
import { simulate } from '../lib/simulator';
import { fmt } from '../lib/format';
import PageHead from '../components/PageHead';

export default function Compare() {
  const br = ASSETS.filter(a=>a.country==='BR');
  const us = ASSETS.filter(a=>a.country==='US');
  const [brId, setBrId] = useState(br[0]?.id || '');
  const [usId, setUsId] = useState(us[0]?.id || '');
  const [initial, setInitial] = useState(50000);
  const [years, setYears] = useState(10);
  const [fx, setFx] = useState(5.20);
  const [fxVar, setFxVar] = useState(3);

  const result = useMemo(() => {
    const brAsset = ASSETS.find(a=>a.id===brId)!;
    const usAsset = ASSETS.find(a=>a.id===usId)!;
    const rBR = simulate({initial, monthly:0, years, rateYr:brAsset.annualReturn, taxRate:brAsset.taxRate, dividendYield:brAsset.dividendYield});
    const rUS = simulate({initial:initial/fx, monthly:0, years, rateYr:usAsset.annualReturn, taxRate:usAsset.taxRate, dividendYield:usAsset.dividendYield});
    const fxFinal = fx * Math.pow(1+fxVar/100, years);
    return { brAsset, usAsset, rBR, rUS, fxFinal, usFinalBRL: rUS.net * fxFinal };
  }, [brId, usId, initial, years, fx, fxVar]);

  return (
    <div>
      <PageHead title="Comparador Brasil × EUA" subtitle="Compare retorno líquido considerando câmbio. Investir nos EUA expõe ao risco cambial."/>
      <div className="sim-grid" style={{display:'grid', gridTemplateColumns:'320px 1fr', gap:16}}>
        <div className="card">
          <div className="form-group"><label>Aporte Inicial (R$)</label><input type="number" value={initial} onChange={e=>setInitial(Number(e.target.value))}/></div>
          <div className="form-group"><label>Período (anos)</label><input type="number" value={years} onChange={e=>setYears(Number(e.target.value))}/></div>
          <div className="form-group"><label>Ativo Brasil</label>
            <select value={brId} onChange={e=>setBrId(e.target.value)}>{br.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
          </div>
          <div className="form-group"><label>Ativo EUA</label>
            <select value={usId} onChange={e=>setUsId(e.target.value)}>{us.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
          </div>
          <div className="row">
            <div className="form-group"><label>Câmbio hoje (R$/US$)</label><input type="number" step="0.01" value={fx} onChange={e=>setFx(Number(e.target.value))}/></div>
            <div className="form-group"><label>Variação cambial a.a. (%)</label><input type="number" step="0.1" value={fxVar} onChange={e=>setFxVar(Number(e.target.value))}/></div>
          </div>
        </div>
        <div className="card">
          <h3 style={{marginBottom:14}}>Comparativo Líquido</h3>
          <div className="kpi-strip" style={{margin:0}}>
            <div className="kpi"><div className="k-label">🇧🇷 {result.brAsset.name}</div><div className="k-value">{fmt(result.rBR.net)}</div></div>
            <div className="kpi"><div className="k-label">🇺🇸 {result.usAsset.name} (US$)</div><div className="k-value">${result.rUS.net.toLocaleString('en-US',{maximumFractionDigits:0})}</div></div>
            <div className="kpi"><div className="k-label">🇺🇸 Convertido (R$ {result.fxFinal.toFixed(2)})</div><div className="k-value">{fmt(result.usFinalBRL)}</div></div>
            <div className="kpi"><div className="k-label">Vencedor</div><div className="k-value" style={{color:'var(--good)'}}>{result.usFinalBRL>result.rBR.net?'EUA':'Brasil'}</div></div>
            <div className="kpi"><div className="k-label">Diferença</div><div className="k-value">{fmt(Math.abs(result.usFinalBRL-result.rBR.net))}</div></div>
          </div>
          <div style={{marginTop:14, padding:12, background:'var(--warn-soft)', border:'1px solid rgba(245,158,11,.3)', borderRadius:8, fontSize:13, color:'var(--text-2)'}}>
            ⚠ Investir nos EUA expõe ao risco cambial. Em períodos de real forte, o retorno em BRL pode ser menor mesmo com bons resultados em USD.
          </div>
        </div>
      </div>
    </div>
  );
}
