import { useMemo } from 'react';
import { ASSETS } from '../lib/catalog';
import PageHead from '../components/PageHead';
import ExportMenu from '../components/ExportMenu';

export default function Ranking() {
  const ranked = useMemo(() => ASSETS.map(a => ({...a, score: a.risk*0.35 + a.ret*0.35 + a.tax*0.30}))
    .sort((a,b) => b.score - a.score), []);

  const flag = (c:string) => c==='BR'?'🇧🇷':c==='US'?'🇺🇸':'🪙';

  return (
    <div>
      <PageHead title="Ranking de Ativos" subtitle="Score = Risco × 35% + Retorno × 35% + Imposto × 30%. Pondera segurança, rentabilidade e eficiência fiscal."
        actions={<ExportMenu filename="ranking-ativos" title="Ranking de Ativos" rows={ranked} columns={[
          {key:'name',label:'Ativo'},{key:'country',label:'País'},
          {key:'investorType',label:'Para',format:r=>r.investorType==='BOTH'?'PF + PJ':r.investorType},
          {key:'risk',label:'Risco'},{key:'ret',label:'Retorno'},{key:'tax',label:'Imposto'},
          {key:'score',label:'Score',format:r=>r.score.toFixed(2)},
        ]}/>}/>
      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
            <thead><tr style={{background:'var(--surface-2)'}}>{['#','Ativo','País','Tipo','Risco','Retorno','Imposto','Score'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{ranked.map((a,i)=>(
              <tr key={a.id} style={{borderBottom:'1px solid var(--border)'}}>
                <td style={td}><strong>{i+1}</strong></td>
                <td style={td}>{a.name}</td>
                <td style={td}>{flag(a.country)}</td>
                <td style={td}>{a.investorType==='BOTH'?'PF + PJ':a.investorType}</td>
                <td style={{...td, color:scoreColor(a.risk)}}>{a.risk}</td>
                <td style={{...td, color:scoreColor(a.ret)}}>{a.ret}</td>
                <td style={{...td, color:scoreColor(a.tax)}}>{a.tax}</td>
                <td style={{...td, fontWeight:800, color:scoreColor(a.score)}}>{a.score.toFixed(2)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
const scoreColor = (v:number) => v>=8?'var(--good)' : v>=5?'var(--warn)' : 'var(--bad)';
const th: React.CSSProperties = { padding:'10px 14px', textAlign:'left', fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 };
const td: React.CSSProperties = { padding:'10px 14px' };
