import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { fmt, fmtMonth, todayYM } from '../../lib/format';
import { calculatePayroll, PayrollCalc } from '../../lib/payroll';
import PageHead from '../../components/PageHead';
import EmptyState from '../../components/EmptyState';
import ExportMenu from '../../components/ExportMenu';
import { useAuth } from '../../stores/auth';

interface Employee { id:string; name:string; salary:number|string; benefits?:number|string; active:boolean; role:string; }

function ymAdd(ym:string, delta:number){ const [y,m]=ym.split('-').map(Number); const d=new Date(y,m-1+delta,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }

export default function Payroll() {
  const user = useAuth(s => s.user) as any;
  const regime: 'SIMPLES'|'LUCRO_PRESUMIDO'|'LUCRO_REAL' = user?.company?.taxRegime || 'LUCRO_PRESUMIDO';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [month, setMonth] = useState(todayYM());
  const [paidMap, setPaidMap] = useState<Record<string, boolean>>({});

  useEffect(() => { api.get('/user/employees').then(r => setEmployees(r.data)); }, []);

  const active = employees.filter(e => e.active);

  const calc: Array<Employee & { calc: PayrollCalc }> = useMemo(() =>
    active.map(e => ({ ...e, calc: calculatePayroll(Number(e.salary), Number(e.benefits||0), 0, 0, 0, regime) })),
    [active, regime]
  );

  const totals = calc.reduce((acc, e) => {
    acc.gross += e.calc.grossSalary; acc.net += e.calc.netSalary; acc.inss += e.calc.inss; acc.irrf += e.calc.irrf;
    acc.fgts += e.calc.fgts; acc.cost += e.calc.totalCostEmployer;
    return acc;
  }, { gross:0, net:0, inss:0, irrf:0, fgts:0, cost:0 });

  return (
    <div>
      <PageHead title={`Folha de Pagamento — ${fmtMonth(month)}`} subtitle={`Cálculos baseados em INSS, FGTS, IRRF e encargos patronais 2026 · Regime: ${regime}`}
        actions={<ExportMenu filename={`folha-${month}`} title={`Folha ${fmtMonth(month)}`} rows={calc} columns={[
          {key:'name',label:'Funcionário'},{key:'role',label:'Cargo'},
          {key:'gross',label:'Bruto',format:r=>fmt(r.calc.grossSalary)},
          {key:'benef',label:'Benefícios',format:r=>fmt(r.calc.benefits)},
          {key:'inss',label:'INSS',format:r=>fmt(r.calc.inss)},
          {key:'irrf',label:'IRRF',format:r=>fmt(r.calc.irrf)},
          {key:'vt',label:'VT',format:r=>fmt(r.calc.vtDiscount)},
          {key:'net',label:'Líquido',format:r=>fmt(r.calc.netSalary)},
          {key:'fgts',label:'FGTS',format:r=>fmt(r.calc.fgts)},
          {key:'cost',label:'Custo Empresa',format:r=>fmt(r.calc.totalCostEmployer)},
        ]}/>}/>

      <div className="card" style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', padding:'12px 16px', marginBottom:14}}>
        <button className="ghost" onClick={()=>setMonth(ymAdd(month,-1))}>‹</button>
        <input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', fontFamily:'inherit'}}/>
        <button className="ghost" onClick={()=>setMonth(ymAdd(month,1))}>›</button>
        <button className="secondary" onClick={()=>setMonth(todayYM())}>Hoje</button>
        <span style={{marginLeft:'auto', fontSize:13, color:'var(--muted)'}}>{Object.values(paidMap).filter(Boolean).length}/{active.length} pagas</span>
      </div>

      <div className="kpi-strip">
        <div className="kpi"><div className="k-label">Funcionários</div><div className="k-value">{active.length}</div></div>
        <div className="kpi"><div className="k-label">Total Bruto</div><div className="k-value">{fmt(totals.gross)}</div></div>
        <div className="kpi"><div className="k-label">Total Líquido</div><div className="k-value" style={{color:'var(--good)'}}>{fmt(totals.net)}</div></div>
        <div className="kpi"><div className="k-label">INSS Empregado</div><div className="k-value">{fmt(totals.inss)}</div></div>
        <div className="kpi"><div className="k-label">IRRF</div><div className="k-value">{fmt(totals.irrf)}</div></div>
        <div className="kpi"><div className="k-label">FGTS Depósito</div><div className="k-value">{fmt(totals.fgts)}</div></div>
        <div className="kpi"><div className="k-label">Custo Total p/ Empresa</div><div className="k-value" style={{color:'var(--bad)'}}>{fmt(totals.cost)}</div></div>
      </div>

      {active.length===0 ? <EmptyState title="Nenhum funcionário ativo" hint="Cadastre funcionários em Funcionários para gerar folha."/> : (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
              <thead><tr style={{background:'var(--surface-2)'}}>
                {['','Funcionário','Salário Bruto','Benefícios','INSS','IRRF','VT','Líquido a Receber','FGTS','Custo Empresa'].map(h=><th key={h} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>{calc.map(e=>{
                const paid = !!paidMap[e.id+month];
                return (
                  <tr key={e.id} style={{borderBottom:'1px solid var(--border)', opacity: paid?.55:1}}>
                    <td style={td}><input type="checkbox" checked={paid} onChange={()=>setPaidMap({...paidMap, [e.id+month]: !paid})}/></td>
                    <td style={td}><strong>{e.name}</strong><div style={{fontSize:11, color:'var(--muted)'}}>{e.role}</div></td>
                    <td style={tdMono}>{fmt(e.calc.grossSalary)}</td>
                    <td style={tdMono}>{fmt(e.calc.benefits)}</td>
                    <td style={{...tdMono, color:'var(--bad)'}}>-{fmt(e.calc.inss)}</td>
                    <td style={{...tdMono, color:'var(--bad)'}}>-{fmt(e.calc.irrf)}</td>
                    <td style={{...tdMono, color:'var(--bad)'}}>-{fmt(e.calc.vtDiscount)}</td>
                    <td style={{...tdMono, color:'var(--good)', fontWeight:700}}>{fmt(e.calc.netSalary)}</td>
                    <td style={tdMono}>{fmt(e.calc.fgts)}</td>
                    <td style={{...tdMono, color:'var(--bad)'}}>{fmt(e.calc.totalCostEmployer)}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card" style={{marginTop:14}}>
        <h3>Encargos Patronais ({regime})</h3>
        <p style={{color:'var(--muted)', fontSize:13, lineHeight:1.6, margin:'8px 0'}}>
          {regime==='SIMPLES' ? (
            <>No <strong>Simples Nacional</strong>, a CPP (Contribuição Patronal Previdenciária) já está incluída no DAS via Anexo IV. Os custos efetivos para a empresa giram em torno de <strong>~39% do salário</strong>.</>
          ) : (
            <>No <strong>{regime.replace('_',' ')}</strong>, os encargos somam: INSS Patronal 20% + RAT 1-3% + Sistema S 5,8% + FGTS 8% + Provisão Férias 11,11% + Provisão 13º 8,33% + Multa Rescisória 3,2% ≈ <strong>~65% do salário</strong>.</>
          )}
        </p>
        <p style={{color:'var(--muted)', fontSize:12, margin:0}}>
          ⚠ Cálculos para referência. Sempre confirme com seu contador. Tabelas vigentes em 2026.
        </p>
      </div>
    </div>
  );
}
const th: React.CSSProperties = { padding:'10px 12px', textAlign:'left', fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 };
const td: React.CSSProperties = { padding:'10px 12px' };
const tdMono: React.CSSProperties = { ...td, fontFamily:'JetBrains Mono,monospace' };
