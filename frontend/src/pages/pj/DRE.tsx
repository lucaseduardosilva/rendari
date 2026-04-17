import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { fmt, fmtMonth, todayYM } from '../../lib/format';
import { calculatePayroll } from '../../lib/payroll';
import PageHead from '../../components/PageHead';
import { useAuth } from '../../stores/auth';

function ymAdd(ym:string, delta:number){ const [y,m]=ym.split('-').map(Number); const d=new Date(y,m-1+delta,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }

export default function DRE() {
  const user = useAuth(s => s.user) as any;
  const regime = user?.company?.taxRegime || 'LUCRO_PRESUMIDO';
  const [month, setMonth] = useState(todayYM());
  const [period, setPeriod] = useState<'month'|'quarter'|'year'>('month');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/user/invoices'),
      api.get('/finance/expenses'),
      api.get('/user/employees'),
    ]).then(([i, e, em]) => { setInvoices(i.data); setExpenses(e.data); setEmployees(em.data); });
  }, []);

  const dre = useMemo(() => {
    // filtra por período
    const isInPeriod = (date:string) => {
      const d = date.slice(0,7);
      if (period === 'month') return d === month;
      if (period === 'year') return d.slice(0,4) === month.slice(0,4);
      // trimestre
      const [y,m] = month.split('-').map(Number);
      const tri = Math.floor((m-1)/3);
      const [yd,md] = d.split('-').map(Number);
      return yd === y && Math.floor((md-1)/3) === tri;
    };

    const receitaBruta = invoices.filter(i => i.type==='saida' && isInPeriod(i.issuedAt)).reduce((s,i)=>s+Number(i.value), 0);
    const impostosVendas = invoices.filter(i => i.type==='saida' && isInPeriod(i.issuedAt)).reduce((s,i)=>s+Number(i.taxes||0), 0);
    const receitaLiquida = receitaBruta - impostosVendas;

    const cmv = invoices.filter(i => i.type==='entrada' && isInPeriod(i.issuedAt)).reduce((s,i)=>s+Number(i.value), 0);
    const lucroBruto = receitaLiquida - cmv;

    // Folha (mensal × multiplicador do período)
    const mesesPeriodo = period==='month'?1:period==='quarter'?3:12;
    const folhaMensal = employees.filter(e=>e.active).reduce((s,e)=>{
      const c = calculatePayroll(Number(e.salary), Number(e.benefits||0), 0, 0, 0, regime);
      return s + c.totalCostEmployer;
    }, 0);
    const folhaPeriodo = folhaMensal * mesesPeriodo;

    // Despesas operacionais (despesas que não sejam investimento)
    const despesasOp = expenses.filter(e=>e.type!=='investimento').reduce((s,e)=>{
      const v = Number(e.value);
      const monthlyEquiv = e.freq==='monthly'?v: e.freq==='annual'?v/12: e.freq==='installments'? v/(Number(e.installments)||1) : v/12;
      return s + monthlyEquiv * mesesPeriodo;
    }, 0);

    const lucroOperacional = lucroBruto - folhaPeriodo - despesasOp;
    const ebitda = lucroOperacional; // simplificação

    // IR + CSLL estimado conforme regime
    let irCsll = 0;
    if (regime === 'SIMPLES') irCsll = 0; // já está nas vendas
    else if (regime === 'LUCRO_PRESUMIDO') irCsll = receitaBruta * (0.32 * 0.15 + 0.32 * 0.09); // presunção 32% × (15% IRPJ + 9% CSLL) — aprox
    else irCsll = Math.max(0, lucroOperacional) * 0.24;

    const lucroLiquido = lucroOperacional - irCsll;
    const margemBruta = receitaLiquida>0 ? lucroBruto/receitaLiquida : 0;
    const margemOp = receitaLiquida>0 ? lucroOperacional/receitaLiquida : 0;
    const margemLiq = receitaLiquida>0 ? lucroLiquido/receitaLiquida : 0;

    return { receitaBruta, impostosVendas, receitaLiquida, cmv, lucroBruto, folhaPeriodo, despesasOp, lucroOperacional, ebitda, irCsll, lucroLiquido, margemBruta, margemOp, margemLiq };
  }, [invoices, expenses, employees, month, period, regime]);

  const labelPeriodo = period==='month'?fmtMonth(month):period==='year'?month.slice(0,4):`${Math.floor((Number(month.slice(5))-1)/3)+1}T/${month.slice(0,4)}`;

  const Row = ({ label, value, indent=0, bold=false, type='neutral' }: any) => (
    <tr style={{borderBottom:'1px solid var(--border)'}}>
      <td style={{padding:'10px 14px', paddingLeft: 14 + indent*20, fontWeight: bold?700:500}}>{label}</td>
      <td style={{padding:'10px 14px', textAlign:'right', fontFamily:'JetBrains Mono,monospace', fontWeight: bold?800:500, color: type==='good'?'var(--good)':type==='bad'?'var(--bad)':'var(--text)'}}>
        {fmt(value)}
      </td>
    </tr>
  );

  return (
    <div>
      <PageHead title={`DRE — ${labelPeriodo}`} subtitle="Demonstração do Resultado do Exercício gerada automaticamente a partir de NFs, folha, despesas e impostos."/>

      <div className="card" style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', padding:'12px 16px', marginBottom:14}}>
        <button className="ghost" onClick={()=>setMonth(ymAdd(month,-1))}>‹</button>
        <input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', fontFamily:'inherit'}}/>
        <button className="ghost" onClick={()=>setMonth(ymAdd(month,1))}>›</button>
        <div style={{display:'flex', gap:6, marginLeft:12}}>
          {(['month','quarter','year'] as const).map(p => (
            <button key={p} onClick={()=>setPeriod(p)} style={{background:period===p?'var(--text)':'var(--surface-2)', color:period===p?'var(--bg)':'var(--muted)', border:'1px solid var(--border)', borderRadius:999, padding:'6px 12px', fontSize:12, cursor:'pointer'}}>
              {p==='month'?'Mensal':p==='quarter'?'Trimestral':'Anual'}
            </button>
          ))}
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Receita Bruta</div><div className="k-value" style={{color:'var(--good)'}}>{fmt(dre.receitaBruta)}</div></div>
        <div className="kpi"><div className="k-label">Lucro Bruto</div><div className="k-value">{fmt(dre.lucroBruto)}</div></div>
        <div className="kpi"><div className="k-label">EBITDA</div><div className="k-value">{fmt(dre.ebitda)}</div></div>
        <div className="kpi"><div className="k-label">Lucro Líquido</div><div className="k-value" style={{color:dre.lucroLiquido>=0?'var(--good)':'var(--bad)'}}>{fmt(dre.lucroLiquido)}</div></div>
        <div className="kpi"><div className="k-label">Margem Líquida</div><div className="k-value">{(dre.margemLiq*100).toFixed(1)}%</div></div>
      </div>

      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
          <tbody>
            <Row label="Receita Bruta de Vendas/Serviços" value={dre.receitaBruta} bold type="good"/>
            <Row label="(–) Impostos sobre vendas" value={-dre.impostosVendas} indent={1} type="bad"/>
            <Row label="= Receita Líquida" value={dre.receitaLiquida} bold/>
            <Row label="(–) CMV / CSV (custos das mercadorias/serviços)" value={-dre.cmv} indent={1} type="bad"/>
            <Row label="= Lucro Bruto" value={dre.lucroBruto} bold type={dre.lucroBruto>=0?'good':'bad'}/>
            <Row label="(–) Despesas com Pessoal (folha + encargos)" value={-dre.folhaPeriodo} indent={1} type="bad"/>
            <Row label="(–) Despesas Operacionais" value={-dre.despesasOp} indent={1} type="bad"/>
            <Row label="= Lucro Operacional / EBITDA" value={dre.lucroOperacional} bold type={dre.lucroOperacional>=0?'good':'bad'}/>
            <Row label={`(–) IRPJ + CSLL (estimado · ${regime})`} value={-dre.irCsll} indent={1} type="bad"/>
            <Row label="= Lucro Líquido do Exercício" value={dre.lucroLiquido} bold type={dre.lucroLiquido>=0?'good':'bad'}/>
          </tbody>
        </table>
      </div>

      <div className="card" style={{marginTop:14}}>
        <h3>Indicadores</h3>
        <div className="kpi-strip" style={{margin:'10px 0 0'}}>
          <div className="kpi"><div className="k-label">Margem Bruta</div><div className="k-value">{(dre.margemBruta*100).toFixed(1)}%</div></div>
          <div className="kpi"><div className="k-label">Margem Operacional</div><div className="k-value">{(dre.margemOp*100).toFixed(1)}%</div></div>
          <div className="kpi"><div className="k-label">Margem Líquida</div><div className="k-value">{(dre.margemLiq*100).toFixed(1)}%</div></div>
        </div>
        <p style={{color:'var(--muted)', fontSize:12, marginTop:14}}>
          ⚠ DRE gerencial baseada nos dados cadastrados. Para fins fiscais, sempre conte com seu contador. IR/CSLL são estimativas — no Lucro Real depende de adições/exclusões da LALUR.
        </p>
      </div>
    </div>
  );
}
