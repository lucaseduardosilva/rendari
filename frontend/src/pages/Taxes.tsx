import PageHead from '../components/PageHead';

const PF = [
  ['Renda Fixa (CDB, Tesouro)', 'Tabela regressiva 22.5% → 15% (>720d)'],
  ['LCI / LCA', 'Isento de IR para PF'],
  ['Poupança', 'Isenta de IR'],
  ['Ações — Lucro', '15% (swing); 20% (day-trade); isento até R$ 20k/mês'],
  ['Ações — Dividendos', 'Isentos atualmente'],
  ['FIIs — Rendimento mensal', 'Isento (PF)'],
  ['FIIs — Ganho de capital', '20% sobre o lucro'],
  ['ETFs / BDRs', '15% sobre lucro (sem isenção R$20k)'],
  ['Cripto', '15-22.5%; isento até R$35k/mês de vendas'],
  ['PGBL / VGBL', 'Regressiva (até 10%) ou progressiva'],
  ['IOF', 'Apenas em RF nos primeiros 30 dias'],
];
const US_FROM_BR = [
  ['Stocks — Capital Gain', '0% nos EUA p/ não-residente; 15% no BR (DARF mensal)'],
  ['Stocks — Dividendos', '30% retido na fonte (EUA); compensável no BR'],
  ['ETFs (S&P 500 etc.)', 'Igual a stocks; 30% sobre dividendos'],
  ['REITs', '30% sobre dividendos'],
  ['Bonds (Treasuries)', 'Isento na fonte EUA; tributado no BR'],
  ['Imposto sobre Herança EUA', 'Até 40% sobre ativos > US$ 60k'],
];
const PJ_BR = [
  ['Renda Fixa (CDB, Tesouro)', 'Tabela regressiva 22.5% → 15%, mesma da PF'],
  ['LCI / LCA', '⚠ Sem isenção para PJ — tributada como CDB'],
  ['FIIs', '⚠ Rendimentos tributados em 15-22.5% (sem isenção)'],
  ['Ações — Lucro', '15% (swing); 20% (day-trade) · sem isenção R$20k'],
  ['Cripto', 'Sem isenção R$35k · tributação de 15-22.5%'],
  ['Investimentos PJ', 'Resultado entra no DRE — afeta IRPJ + CSLL'],
  ['Holding patrimonial', 'Aluguel tributado a 11.33% no Lucro Presumido'],
];

export default function Taxes() {
  return (
    <div>
      <PageHead title="Impostos sobre Investimentos" subtitle="Tabelas de tributação para Pessoa Física e Pessoa Jurídica em 2026."/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(360px,1fr))', gap:14}}>
        <Section title="🇧🇷 Pessoa Física Brasil" data={PF}/>
        <Section title="🇧🇷 Pessoa Jurídica Brasil" data={PJ_BR}/>
        <Section title="🇺🇸 EUA (residente brasileiro)" data={US_FROM_BR}/>
      </div>
      <div className="card" style={{marginTop:14, background:'var(--warn-soft)', borderColor:'rgba(245,158,11,.3)'}}>
        <strong style={{color:'var(--warn)'}}>⚠ Atenção:</strong> Brasil-EUA tem acordo para evitar bitributação. Imposto pago na fonte EUA pode ser compensado no IR BR via DARF/carnê-leão. Consulte um contador.
      </div>
    </div>
  );
}

function Section({title, data}:{title:string; data:string[][]}) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <table style={{width:'100%', borderCollapse:'collapse', fontSize:13, marginTop:8}}>
        <tbody>{data.map(([k,v])=>(
          <tr key={k} style={{borderBottom:'1px solid var(--border)'}}>
            <td style={{padding:'8px 0', fontWeight:600}}>{k}</td>
            <td style={{padding:'8px 0', textAlign:'right', color:'var(--text-2)'}}>{v}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
