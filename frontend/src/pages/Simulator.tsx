import { useMemo, useState } from 'react';
import { ASSETS } from '../lib/catalog';
import { simulate } from '../lib/simulator';
import { fmt } from '../lib/format';
import PageHead from '../components/PageHead';
import ExportMenu from '../components/ExportMenu';
import { api } from '../lib/api';
import { useChartColors } from '../hooks/useChartColors';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import ChartTooltip from '../components/charts/ChartTooltip';

export default function Simulator() {
  const C = useChartColors();
  const [assetId, setAssetId] = useState('tesouro-ipca');
  const [initial, setInitial] = useState(10000);
  const [monthly, setMonthly] = useState(1000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(11);
  const [cdi, setCdi] = useState(11);
  const [infl, setInfl] = useState(4);
  const [reinvest, setReinvest] = useState(true);
  const [name, setName] = useState('');

  const asset = ASSETS.find(a => a.id === assetId) || ASSETS[0];

  const result = useMemo(() => simulate({
    initial, monthly, years, rateYr: rate, cdiYr: cdi, inflYr: infl, reinvest,
    taxRate: asset.taxRate, dividendYield: asset.dividendYield,
  }), [initial, monthly, years, rate, cdi, infl, reinvest, asset]);

  // Series anual com líquido (aplica imposto proporcional para visualização)
  const yearly = useMemo(() => {
    return Array.from({ length: years }, (_, i) => {
      const m = result.monthly[(i + 1) * 12 - 1];
      const grossProfit = Math.max(0, m.bal - m.invested);
      const tax = grossProfit * asset.taxRate;
      const prev = i === 0 ? initial : result.monthly[i * 12 - 1].bal;
      const yearGain = m.bal - prev - monthly * 12;
      const pct = prev > 0 ? (yearGain / prev) * 100 : 0;
      return {
        year: `Ano ${i + 1}`,
        invested: m.invested,
        bal: m.bal,
        net: m.bal - tax,
        cdi: m.cdiBal,
        gain: yearGain,
        pct: Number(pct.toFixed(2)),
      };
    });
  }, [result, years, asset, initial, monthly]);

  // Tabela mensal completa
  const monthlyTable = useMemo(() => result.monthly.map((m, i) => {
    const prev = i === 0 ? initial : result.monthly[i - 1].bal;
    const base = prev + monthly;
    const pct = base > 0 ? (m.gain / base) * 100 : 0;
    return { mes: m.month, aportado: m.invested, saldo: m.bal, ganho: m.gain, pct, capital: m.capitalGain, dividend: m.dividend };
  }), [result, initial, monthly]);

  // Composição final
  const composition = useMemo(() => {
    const grossProfit = Math.max(0, result.bal - result.invested - result.dividends);
    return [
      { name: 'Aportes', value: result.invested },
      { name: 'Juros/Valorização', value: grossProfit },
      { name: 'Dividendos', value: result.dividends },
      { name: 'Imposto', value: result.tax },
    ].filter(x => x.value > 0);
  }, [result]);

  // Comparação Bruto x Imposto x Líquido
  const comparison = [
    { name: 'Investido', value: result.invested },
    { name: 'Bruto', value: result.bal },
    { name: 'Imposto', value: result.tax },
    { name: 'Líquido', value: result.net },
    { name: 'CDI Líq.', value: result.cdiBal },
  ];

  const save = async () => {
    if (!name) return alert('Dê um nome à simulação');
    await api.post('/finance/saved-simulations', { name, type: 'simple', data: { assetId, initial, monthly, years, rate, cdi, infl, reinvest } });
    alert('Simulação salva!'); setName('');
  };

  return (
    <div>
      <PageHead title="Simulador de Investimentos" subtitle="Juros compostos com tributação real do ativo. Compare com CDI." actions={
        <ExportMenu filename={`simulacao-${asset.id}-${years}a`} title={`${asset.name} • ${years} anos`} rows={monthlyTable} columns={[
          { key: 'mes', label: 'Mês' },
          { key: 'aportado', label: 'Aportado', format: r => fmt(r.aportado) },
          { key: 'saldo', label: 'Saldo', format: r => fmt(r.saldo) },
          { key: 'ganho', label: 'Ganho', format: r => fmt(r.ganho) },
          { key: 'pct', label: '%', format: r => r.pct.toFixed(2) + '%' },
          { key: 'capital', label: 'Capital', format: r => fmt(r.capital) },
          { key: 'dividend', label: 'Dividendos', format: r => fmt(r.dividend) },
        ]} />
      }/>

      <div className="sim-grid">
        <div className="card">
          <div className="form-group"><label>Ativo</label>
            <select value={assetId} onChange={e => { setAssetId(e.target.value); const a = ASSETS.find(x => x.id === e.target.value); if (a) setRate(a.annualReturn); }}>
              {ASSETS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Aporte Inicial (R$)</label><input type="number" value={initial} onChange={e => setInitial(Number(e.target.value))} /></div>
          <div className="form-group"><label>Aporte Mensal (R$)</label><input type="number" value={monthly} onChange={e => setMonthly(Number(e.target.value))} /></div>
          <div className="row">
            <div className="form-group"><label>Período (anos)</label><input type="number" value={years} onChange={e => setYears(Number(e.target.value))} /></div>
            <div className="form-group"><label>Taxa anual (%)</label><input type="number" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} /></div>
          </div>
          <div className="row">
            <div className="form-group"><label>CDI (%)</label><input type="number" step="0.1" value={cdi} onChange={e => setCdi(Number(e.target.value))} /></div>
            <div className="form-group"><label>Inflação (%)</label><input type="number" step="0.1" value={infl} onChange={e => setInfl(Number(e.target.value))} /></div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 12 }}>
            <input type="checkbox" checked={reinvest} onChange={e => setReinvest(e.target.checked)} style={{width:16,height:16}}/> Reinvestir dividendos
          </label>
          <div className="form-group"><label>Salvar simulação</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Aposentadoria 2046" />
          </div>
          <button className="primary" onClick={save}>💾 Salvar</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Resultado em {years} anos</h3>
            <div className="kpi-strip" style={{ margin: 0 }}>
              <KPI label="Total Investido" value={fmt(result.invested)} />
              <KPI label="Bruto Final" value={fmt(result.bal)} />
              <KPI label={`Imposto (${(asset.taxRate*100).toFixed(1)}%)`} value={`-${fmt(result.tax)}`} color="var(--bad)" />
              <KPI label="Líquido Final" value={fmt(result.net)} color="var(--good)" />
              <KPI label="Lucro Líquido" value={fmt(result.net - result.invested)} />
              <KPI label="CDI no período" value={fmt(result.cdiBal)} />
              <KPI label="vs CDI" value={`${result.net>result.cdiBal?'+':''}${fmt(result.net-result.cdiBal)}`} color={result.net>result.cdiBal?'var(--good)':'var(--bad)'} />
              <KPI label="Valor Real (sem inflação)" value={fmt(result.real)} />
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Evolução do Patrimônio</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={yearly} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.good} stopOpacity={0.4}/>
                    <stop offset="100%" stopColor={C.good} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.grid} vertical={false}/>
                <XAxis dataKey="year" stroke={C.muted} tick={{fontSize:11}}/>
                <YAxis stroke={C.muted} tick={{fontSize:11}} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend wrapperStyle={{fontSize:12}}/>
                <Area type="monotone" dataKey="net" name="Líquido" stroke={C.good} fill="url(#gNet)" strokeWidth={2.5}/>
                <Line type="monotone" dataKey="cdi" name="CDI" stroke={C.primary} strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="invested" name="Aportes" stroke={C.muted} strokeWidth={2} strokeDasharray="6 4" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-2" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16}}>
            <div className="card">
              <h3 style={{marginBottom:12}}>Composição Final</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={composition} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {composition.map((_, i) => <Cell key={i} fill={C.palette[i % C.palette.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 style={{marginBottom:12}}>Comparação</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={comparison} margin={{top:10,right:12,left:-10,bottom:0}}>
                  <CartesianGrid stroke={C.grid} vertical={false}/>
                  <XAxis dataKey="name" stroke={C.muted} tick={{fontSize:11}}/>
                  <YAxis stroke={C.muted} tick={{fontSize:11}} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {comparison.map((c, i) => <Cell key={i} fill={c.name==='Líquido'?C.good : c.name==='Imposto'?C.bad : c.name==='CDI Líq.'?C.warn : C.primary}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 style={{marginBottom:12}}>Rendimento Anual</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={yearly} margin={{top:10,right:12,left:-10,bottom:0}}>
                <CartesianGrid stroke={C.grid} vertical={false}/>
                <XAxis dataKey="year" stroke={C.muted} tick={{fontSize:11}}/>
                <YAxis stroke={C.muted} tick={{fontSize:11}} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Bar dataKey="gain" name="Ganho do ano" fill={C.good} radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
              <h3 style={{margin:0}}>Tabela Mensal</h3>
              <span style={{fontSize:12, color:'var(--muted)'}}>{monthlyTable.length} meses</span>
            </div>
            <div style={{maxHeight:380, overflowY:'auto', border:'1px solid var(--border)', borderRadius:8}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
                <thead style={{position:'sticky', top:0, background:'var(--surface-2)', zIndex:1}}>
                  <tr>{['Mês','Aportado','Saldo','Ganho','%','Capital','Dividendos'].map(h=><th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>{monthlyTable.map(m=>(
                  <tr key={m.mes} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={td}>{m.mes}</td>
                    <td style={tdMono}>{fmt(m.aportado)}</td>
                    <td style={tdMono}>{fmt(m.saldo)}</td>
                    <td style={{...tdMono, color: m.ganho>=0?'var(--good)':'var(--bad)'}}>{fmt(m.ganho)}</td>
                    <td style={{...tdMono, color: m.pct>=1?'var(--good)':m.pct>0?'var(--warn)':'var(--bad)', fontWeight:700}}>{m.pct>=0?'+':''}{m.pct.toFixed(2)}%</td>
                    <td style={tdMono}>{fmt(m.capital)}</td>
                    <td style={tdMono}>{fmt(m.dividend)}</td>
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
  return (
    <div className="kpi"><div className="k-label">{label}</div><div className="k-value" style={color?{color}:undefined}>{value}</div></div>
  );
}
const th: React.CSSProperties = { padding:'8px 10px', textAlign:'left', fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:700 };
const td: React.CSSProperties = { padding:'7px 10px' };
const tdMono: React.CSSProperties = { ...td, fontFamily:'JetBrains Mono,monospace' };
