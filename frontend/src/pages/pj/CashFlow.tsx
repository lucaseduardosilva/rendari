import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { fmt, fmtMonth, todayYM } from '../../lib/format';
import { calculatePayroll } from '../../lib/payroll';
import PageHead from '../../components/PageHead';
import { useAuth } from '../../stores/auth';

function ymAdd(ym:string, delta:number){ const [y,m]=ym.split('-').map(Number); const d=new Date(y,m-1+delta,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }

export default function CashFlow() {
  const user = useAuth(s => s.user) as any;
  const regime = user?.company?.taxRegime || 'LUCRO_PRESUMIDO';
  const [centerMonth, setCenterMonth] = useState(todayYM());
  const [horizon, setHorizon] = useState(6); // meses pra frente
  const [back, setBack] = useState(3);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);

  useEffect(() => {
    Promise.all([api.get('/user/invoices'), api.get('/finance/expenses'), api.get('/user/employees')])
      .then(([i, e, em]) => { setInvoices(i.data); setExpenses(e.data); setEmployees(em.data); });
  }, []);

  const months = useMemo(() => {
    const arr: string[] = [];
    for (let i = -back; i <= horizon; i++) arr.push(ymAdd(centerMonth, i));
    return arr;
  }, [centerMonth, back, horizon]);

  const folhaMensal = useMemo(() =>
    employees.filter(e=>e.active).reduce((s,e)=>{
      const c = calculatePayroll(Number(e.salary), Number(e.benefits||0), 0, 0, 0, regime);
      return s + c.totalCostEmployer;
    }, 0)
  , [employees, regime]);

  const data = useMemo(() => {
    let saldo = openingBalance;
    return months.map(m => {
      // Entradas: NFs de saída no mês
      const entradas = invoices.filter(i => i.type==='saida' && i.issuedAt.slice(0,7) === m).reduce((s,i)=>s+Number(i.value), 0);
      // Saídas: NFs de entrada + folha + despesas (recurring)
      const saidasNf = invoices.filter(i => i.type==='entrada' && i.issuedAt.slice(0,7) === m).reduce((s,i)=>s+Number(i.value), 0);
      const despesas = expenses.reduce((s,e) => {
        const v = Number(e.value);
        // Calcula se a despesa cai nesse mês
        const start = e.startMonth || m;
        if (m < start) return s;
        if (e.freq === 'monthly') return s + v;
        if (e.freq === 'annual' && m.slice(5)===start.slice(5)) return s + v;
        if (e.freq === 'one-time' && m === start) return s + v;
        if (e.freq === 'installments') {
          const n = Number(e.installments)||1;
          const [sy,sm] = start.split('-').map(Number);
          const [yy,mm] = m.split('-').map(Number);
          const diff = (yy-sy)*12+(mm-sm);
          if (diff>=0 && diff<n) return s + v/n;
        }
        return s;
      }, 0);
      const totalSaidas = saidasNf + folhaMensal + despesas;
      const liquido = entradas - totalSaidas;
      const inicial = saldo;
      saldo = saldo + liquido;
      return { month:m, inicial, entradas, saidasNf, folha:folhaMensal, despesas, totalSaidas, liquido, final:saldo };
    });
  }, [months, invoices, expenses, folhaMensal, openingBalance]);

  return (
    <div>
      <PageHead title="Fluxo de Caixa" subtitle="Projeção de entradas, saídas e saldo mês a mês com base em NFs, folha e despesas recorrentes."/>

      <div className="card" style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', padding:'12px 16px', marginBottom:14}}>
        <span style={{fontSize:13, color:'var(--muted)'}}>Centro:</span>
        <input type="month" value={centerMonth} onChange={e=>setCenterMonth(e.target.value)} style={{background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)'}}/>
        <span style={{fontSize:13, color:'var(--muted)', marginLeft:12}}>Saldo inicial (R$):</span>
        <input type="number" value={openingBalance} onChange={e=>setOpeningBalance(Number(e.target.value)||0)} style={{background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', width:120}}/>
        <span style={{fontSize:13, color:'var(--muted)', marginLeft:12}}>{back} meses ←  → {horizon} meses</span>
      </div>

      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
            <thead><tr style={{background:'var(--surface-2)'}}>
              {['Mês','Saldo Inicial','Entradas','Saídas (NF compras)','Folha','Despesas','Total Saídas','Resultado Líquido','Saldo Final'].map(h=><th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>{data.map((r,i)=>{
              const isCurrent = r.month === centerMonth;
              return (
                <tr key={r.month} style={{borderBottom:'1px solid var(--border)', background: isCurrent?'var(--surface)':'transparent', fontWeight: isCurrent?700:400}}>
                  <td style={td}>{fmtMonth(r.month)}</td>
                  <td style={tdMono}>{fmt(r.inicial)}</td>
                  <td style={{...tdMono, color:'var(--good)'}}>+{fmt(r.entradas)}</td>
                  <td style={{...tdMono, color:'var(--bad)'}}>-{fmt(r.saidasNf)}</td>
                  <td style={{...tdMono, color:'var(--bad)'}}>-{fmt(r.folha)}</td>
                  <td style={{...tdMono, color:'var(--bad)'}}>-{fmt(r.despesas)}</td>
                  <td style={{...tdMono, color:'var(--bad)'}}>-{fmt(r.totalSaidas)}</td>
                  <td style={{...tdMono, color: r.liquido>=0?'var(--good)':'var(--bad)'}}>{r.liquido>=0?'+':''}{fmt(r.liquido)}</td>
                  <td style={{...tdMono, color: r.final>=0?'var(--good)':'var(--bad)', fontWeight:800}}>{fmt(r.final)}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{marginTop:14}}>
        <h3>Como interpretar</h3>
        <p style={{color:'var(--muted)', fontSize:13, lineHeight:1.6, margin:'8px 0 0'}}>
          O fluxo de caixa mostra o movimento real (caixa) — diferente da DRE (regime competência).
          Use para identificar meses com déficit projetado e antecipar necessidade de capital de giro.
          A folha mensal é estimada com base nos funcionários ativos e regime tributário atual.
        </p>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding:'10px 12px', textAlign:'left', fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 };
const td: React.CSSProperties = { padding:'10px 12px' };
const tdMono: React.CSSProperties = { ...td, fontFamily:'JetBrains Mono,monospace' };
