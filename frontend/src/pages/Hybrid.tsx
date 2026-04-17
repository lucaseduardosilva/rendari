import { useMemo, useState } from 'react';
import { ASSETS } from '../lib/catalog';
import { simulate } from '../lib/simulator';
import { fmt } from '../lib/format';
import PageHead from '../components/PageHead';
import ExportMenu from '../components/ExportMenu';
import { api } from '../lib/api';
import { useChartColors } from '../hooks/useChartColors';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line } from 'recharts';
import ChartTooltip from '../components/charts/ChartTooltip';

interface Alloc { uid:number; assetId:string; pct:number; }

const PRESETS: Record<string, Alloc[]> = {
  conservadora: [
    { uid:1, assetId:'tesouro-selic', pct:30 },
    { uid:2, assetId:'lci-lca', pct:25 },
    { uid:3, assetId:'cdb', pct:20 },
    { uid:4, assetId:'tesouro-ipca', pct:15 },
    { uid:5, assetId:'fiis', pct:10 },
  ],
  moderada: [
    { uid:1, assetId:'tesouro-ipca', pct:30 },
    { uid:2, assetId:'fiis', pct:20 },
    { uid:3, assetId:'acoes-div', pct:15 },
    { uid:4, assetId:'us-etfs', pct:15 },
    { uid:5, assetId:'lci-lca', pct:10 },
    { uid:6, assetId:'btc', pct:10 },
  ],
  arrojada: [
    { uid:1, assetId:'acoes-val', pct:25 },
    { uid:2, assetId:'us-stocks-grw', pct:25 },
    { uid:3, assetId:'us-etfs', pct:15 },
    { uid:4, assetId:'btc', pct:15 },
    { uid:5, assetId:'fiis', pct:10 },
    { uid:6, assetId:'eth', pct:10 },
  ],
};

export default function Hybrid() {
  const C = useChartColors();
  const [allocs, setAllocs] = useState<Alloc[]>(PRESETS.moderada);
  const [initial, setInitial] = useState(50000);
  const [monthly, setMonthly] = useState(2000);
  const [years, setYears] = useState(10);
  const [name, setName] = useState('');
  const total = allocs.reduce((s, a) => s + a.pct, 0);
  let nextUid = (allocs.reduce((m, a) => Math.max(m, a.uid), 0) || 0) + 1;

  const results = useMemo(() => {
    const w = total > 0 ? 1 / total : 0;
    return allocs.map((a, i) => {
      const asset = ASSETS.find(x => x.id === a.assetId)!;
      const fraction = a.pct * w;
      const sim = simulate({ initial: initial * fraction, monthly: monthly * fraction, years, rateYr: asset.annualReturn, taxRate: asset.taxRate, dividendYield: asset.dividendYield });
      return { alloc: a, asset, sim, fraction, color: C.palette[i % C.palette.length] };
    });
  }, [allocs, initial, monthly, years, total, C]);

  const totals = results.reduce((acc, r) => { acc.bal += r.sim.bal; acc.net += r.sim.net; acc.tax += r.sim.tax; acc.invested += r.sim.invested; acc.cdi += r.sim.cdiBal; return acc; }, { bal:0, net:0, tax:0, invested:0, cdi:0 });

  // Série mensal agregada
  const aggMonthly = useMemo(() => {
    const months = years * 12;
    const arr: any[] = [];
    for (let m = 0; m < months; m++) {
      let bal = 0, gain = 0, capital = 0, dividend = 0, invested = 0, cdi = 0;
      results.forEach(r => {
        const ms = r.sim.monthly[m];
        bal += ms.bal; gain += ms.gain; capital += ms.capitalGain;
        dividend += ms.dividend; invested += ms.invested; cdi += ms.cdiBal;
      });
      const prev = m === 0 ? initial : arr[m-1].bal;
      const base = prev + monthly;
      const pct = base > 0 ? (gain / base) * 100 : 0;
      arr.push({ mes: m+1, mesLabel: `M${m+1}`, bal, gain, capital, dividend, invested, cdi, pct });
    }
    return arr;
  }, [results, years, initial, monthly]);

  // Série anual (líquida estimada)
  const yearly = useMemo(() => Array.from({ length: years }, (_, i) => {
    const m = aggMonthly[(i+1)*12-1];
    const totalNet = results.reduce((s, r) => {
      const ms = r.sim.monthly[(i+1)*12-1];
      const grossProfit = Math.max(0, ms.bal - ms.invested);
      return s + (ms.bal - grossProfit * r.asset.taxRate);
    }, 0);
    const prev = i === 0 ? initial : aggMonthly[i*12-1].bal;
    const yearGain = m.bal - prev - monthly*12;
    return { year:`Ano ${i+1}`, invested:m.invested, bal:m.bal, net:totalNet, cdi:m.cdi, gain:yearGain };
  }), [aggMonthly, years, initial, monthly, results]);

  // Composição da carteira por aporte
  const compAlloc = results.map(r => ({ name: r.asset.name, value: r.sim.invested, color: r.color }));
  // Composição por patrimônio final líquido
  const compFinal = results.map(r => ({ name: r.asset.name, value: r.sim.net, color: r.color }));

  const save = async () => {
    if (!name) return alert('Dê um nome');
    await api.post('/finance/saved-simulations', { name, type: 'hybrid', data: { initial, monthly, years, allocations: allocs }});
    alert('Carteira salva!'); setName('');
  };

  return (
    <div>
      <PageHead title="Carteira Híbrida" subtitle="Combine vários ativos com pesos %. Cada um simula com tributação real própria." actions={
        <ExportMenu filename={`carteira-hibrida-${years}a`} title="Carteira Híbrida" rows={aggMonthly} columns={[
          { key:'mes', label:'Mês' },
          { key:'invested', label:'Aportado', format:r=>fmt(r.invested) },
          { key:'bal', label:'Saldo', format:r=>fmt(r.bal) },
          { key:'gain', label:'Ganho', format:r=>fmt(r.gain) },
          { key:'pct', label:'%', format:r=>r.pct.toFixed(2)+'%' },
          { key:'capital', label:'Capital', format:r=>fmt(r.capital) },
          { key:'dividend', label:'Dividendos', format:r=>fmt(r.dividend) },
        ]}/>
      }/>

      <div className="sim-grid">
        <div className="card">
          <div className="form-group"><label>Aporte Inicial (R$)</label><input type="number" value={initial} onChange={e=>setInitial(Number(e.target.value))}/></div>
          <div className="form-group"><label>Aporte Mensal (R$)</label><input type="number" value={monthly} onChange={e=>setMonthly(Number(e.target.value))}/></div>
          <div className="form-group"><label>Período (anos)</label><input type="number" value={years} onChange={e=>setYears(Number(e.target.value))}/></div>

          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', margin:'16px 0 8px'}}>
            <strong style={{fontSize:13}}>Carteira</strong>
            <span style={{fontSize:12, color: total===100?'var(--good)':total>100?'var(--bad)':'var(--warn)', fontFamily:'JetBrains Mono,monospace'}}>Total: {total.toFixed(1)}%</span>
          </div>
          <div>{allocs.map(a=>(
            <div key={a.uid} style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 56px 28px', gap:6, marginBottom:6, alignItems:'center'}}>
              <select value={a.assetId} onChange={e=>setAllocs(allocs.map(x=>x.uid===a.uid?{...x, assetId:e.target.value}:x))} style={{height:30, fontSize:12, padding:'4px 8px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text)', minWidth:0, width:'100%', textOverflow:'ellipsis'}}>
                {ASSETS.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
              <input type="number" value={a.pct} onChange={e=>setAllocs(allocs.map(x=>x.uid===a.uid?{...x, pct:Number(e.target.value)}:x))} style={{height:30, width:'100%', fontSize:12, padding:'4px 6px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text)', textAlign:'right', fontFamily:'JetBrains Mono,monospace'}}/>
              <button type="button" onClick={()=>setAllocs(allocs.filter(x=>x.uid!==a.uid))} style={{height:30, width:28, padding:0, background:'transparent', color:'var(--bad)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', fontSize:14, lineHeight:1}}>×</button>
            </div>
          ))}</div>

          <button type="button" className="secondary" style={{width:'100%', marginTop:6}} onClick={()=>setAllocs([...allocs, {uid:nextUid, assetId:ASSETS[0].id, pct:0}])}>+ Adicionar Ativo</button>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginTop:10}}>
            <button type="button" className="secondary" style={{fontSize:11, padding:'6px 8px', height:32}} onClick={()=>setAllocs(PRESETS.conservadora)}>Conservadora</button>
            <button type="button" className="secondary" style={{fontSize:11, padding:'6px 8px', height:32}} onClick={()=>setAllocs(PRESETS.moderada)}>Moderada</button>
            <button type="button" className="secondary" style={{fontSize:11, padding:'6px 8px', height:32}} onClick={()=>setAllocs(PRESETS.arrojada)}>Arrojada</button>
          </div>

          <div className="form-group" style={{marginTop:12}}><label>Salvar carteira</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome"/>
          </div>
          <button type="button" className="primary" onClick={save}>💾 Salvar carteira</button>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:16, minWidth:0}}>
          <div className="card">
            <h3 style={{marginBottom:14}}>Resultado da Carteira em {years} anos</h3>
            <div className="kpi-strip" style={{margin:0}}>
              <KPI label="Investido" value={fmt(totals.invested)}/>
              <KPI label="Bruto" value={fmt(totals.bal)}/>
              <KPI label="Imposto" value={`-${fmt(totals.tax)}`} color="var(--bad)"/>
              <KPI label="Líquido" value={fmt(totals.net)} color="var(--good)"/>
              <KPI label="Lucro Líquido" value={fmt(totals.net-totals.invested)}/>
              <KPI label="CDI" value={fmt(totals.cdi)}/>
              <KPI label="vs CDI" value={`${totals.net>totals.cdi?'+':''}${fmt(totals.net-totals.cdi)}`} color={totals.net>totals.cdi?'var(--good)':'var(--bad)'}/>
            </div>
          </div>

          <div className="card">
            <h3 style={{marginBottom:12}}>Evolução da Carteira</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={yearly} margin={{top:10,right:12,left:-10,bottom:0}}>
                <defs>
                  <linearGradient id="hG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.good} stopOpacity={0.4}/><stop offset="100%" stopColor={C.good} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.grid} vertical={false}/>
                <XAxis dataKey="year" stroke={C.muted} tick={{fontSize:11}}/>
                <YAxis stroke={C.muted} tick={{fontSize:11}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend wrapperStyle={{fontSize:12}}/>
                <Area type="monotone" dataKey="net" name="Carteira Líquida" stroke={C.good} fill="url(#hG)" strokeWidth={2.5}/>
                <Line type="monotone" dataKey="cdi" name="CDI" stroke={C.primary} strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="invested" name="Aportes" stroke={C.muted} strokeWidth={2} strokeDasharray="6 4" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-2" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16}}>
            <div className="card">
              <h3 style={{marginBottom:12}}>Composição (peso de aporte)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={compAlloc} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {compAlloc.map((c, i) => <Cell key={i} fill={c.color}/>)}
                  </Pie>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 style={{marginBottom:12}}>Patrimônio Final por Ativo</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={compFinal} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {compFinal.map((c, i) => <Cell key={i} fill={c.color}/>)}
                  </Pie>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 style={{marginBottom:12}}>Ganhos Mensais (capital + dividendos)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={aggMonthly} margin={{top:10,right:12,left:-10,bottom:0}}>
                <CartesianGrid stroke={C.grid} vertical={false}/>
                <XAxis dataKey="mesLabel" stroke={C.muted} tick={{fontSize:10}} interval={Math.floor(aggMonthly.length/12)}/>
                <YAxis stroke={C.muted} tick={{fontSize:11}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend wrapperStyle={{fontSize:12}}/>
                <Bar dataKey="capital" name="Capital" stackId="a" fill={C.primary}/>
                <Bar dataKey="dividend" name="Dividendos" stackId="a" fill={C.good}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{marginBottom:12}}>Rendimento Anual</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={yearly} margin={{top:10,right:12,left:-10,bottom:0}}>
                <CartesianGrid stroke={C.grid} vertical={false}/>
                <XAxis dataKey="year" stroke={C.muted} tick={{fontSize:11}}/>
                <YAxis stroke={C.muted} tick={{fontSize:11}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Bar dataKey="gain" name="Ganho do ano" fill={C.good} radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{marginBottom:12}}>Tabela Mensal Agregada</h3>
            <div style={{maxHeight:380, overflowY:'auto', border:'1px solid var(--border)', borderRadius:8}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
                <thead style={{position:'sticky', top:0, background:'var(--surface-2)', zIndex:1}}>
                  <tr>{['Mês','Aportado','Saldo','Ganho','%','Capital','Dividendos'].map(h=><th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>{aggMonthly.map(m=>(
                  <tr key={m.mes} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={td}>{m.mes}</td>
                    <td style={tdMono}>{fmt(m.invested)}</td>
                    <td style={tdMono}>{fmt(m.bal)}</td>
                    <td style={{...tdMono, color:m.gain>=0?'var(--good)':'var(--bad)'}}>{fmt(m.gain)}</td>
                    <td style={{...tdMono, color:m.pct>=1?'var(--good)':m.pct>0?'var(--warn)':'var(--bad)', fontWeight:700}}>{m.pct>=0?'+':''}{m.pct.toFixed(2)}%</td>
                    <td style={tdMono}>{fmt(m.capital)}</td>
                    <td style={tdMono}>{fmt(m.dividend)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 style={{marginBottom:12}}>Detalhamento por Ativo</h3>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                <thead><tr style={{background:'var(--surface-2)'}}>{['Ativo','Peso','Investido','Bruto','Imposto','Líquido','Lucro Líq.'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>{results.map(r=>(
                  <tr key={r.alloc.uid} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={td}><span style={{display:'inline-block',width:10,height:10,background:r.color,borderRadius:2,marginRight:6}}/>{r.asset.name}</td>
                    <td style={tdMono}>{(r.fraction*100).toFixed(1)}%</td>
                    <td style={tdMono}>{fmt(r.sim.invested)}</td>
                    <td style={tdMono}>{fmt(r.sim.bal)}</td>
                    <td style={{...tdMono, color:'var(--bad)'}}>-{fmt(r.sim.tax)}</td>
                    <td style={{...tdMono, color:'var(--good)'}}>{fmt(r.sim.net)}</td>
                    <td style={tdMono}>{fmt(r.sim.net-r.sim.invested)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({label, value, color}:{label:string; value:string; color?:string}) {
  return (<div className="kpi"><div className="k-label">{label}</div><div className="k-value" style={color?{color}:undefined}>{value}</div></div>);
}
const th: React.CSSProperties = { padding:'8px 10px', textAlign:'left', fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:700 };
const td: React.CSSProperties = { padding:'7px 10px' };
const tdMono: React.CSSProperties = { ...td, fontFamily:'JetBrains Mono,monospace' };
