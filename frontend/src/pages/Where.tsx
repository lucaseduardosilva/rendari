import PageHead from '../components/PageHead';

const SECTIONS = [
  {
    title:'🇧🇷 Renda Fixa, Tesouro, FIIs e Ações Brasil',
    items:[
      ['XP Investimentos', 'Corretora completa: ações, FIIs, renda fixa, fundos.', 'https://www.xpi.com.br'],
      ['BTG Pactual', 'Banco de investimento com plataforma robusta.', 'https://www.btgpactual.com'],
      ['Rico', 'Taxas baixas, ideal para iniciantes.', 'https://www.rico.com.vc'],
      ['NuInvest (Nubank)', 'Interface simples integrada ao Nubank.', 'https://nuinvest.com.br'],
      ['Inter Invest', 'Sem taxa de corretagem em Bolsa.', 'https://inter.co'],
      ['Tesouro Direto', 'Direto via Tesouro Nacional + corretora.', 'https://www.tesourodireto.com.br'],
      ['Clear / Modal', 'Corretagem zero em ações.', 'https://www.clear.com.br'],
    ]
  },
  {
    title:'🇺🇸 Stocks, ETFs, REITs e Bonds nos EUA',
    items:[
      ['Avenue Securities', 'Broker brasileiro com acesso a NYSE/Nasdaq.', 'https://avenue.us'],
      ['Nomad', 'Conta nos EUA + investimentos.', 'https://www.nomadglobal.com'],
      ['Inter Global Account', 'Conta e investimentos em USD.', 'https://inter.co'],
      ['Interactive Brokers (IBKR)', 'Taxas baixíssimas, acesso global.', 'https://www.interactivebrokers.com'],
      ['Charles Schwab International', 'Tradicional, requer mais documentação.', 'https://www.schwab.com'],
      ['C6 Global', 'Conta + investimentos via aplicativo.', 'https://www.c6bank.com.br'],
    ]
  },
  {
    title:'🪙 Criptomoedas',
    items:[
      ['Mercado Bitcoin', 'Maior exchange BR, regulada.', 'https://www.mercadobitcoin.com.br'],
      ['Binance', 'Maior exchange global, alta liquidez.', 'https://www.binance.com'],
      ['Foxbit', 'Exchange brasileira tradicional.', 'https://foxbit.com.br'],
      ['Coinbase', 'Listada na Nasdaq, foco EUA.', 'https://www.coinbase.com'],
      ['Hashdex (HASH11)', 'ETF de cripto na B3, mais simples para PF.', 'https://www.hashdex.com.br'],
    ]
  },
  {
    title:'Investimentos Empresariais (PJ)',
    items:[
      ['BTG Empresas', 'Plataforma PJ completa: CDBs, fundos, custódia.', 'https://empresas.btgpactual.com'],
      ['XP Empresas', 'CDB PJ, fundos exclusivos, gestão patrimonial.', 'https://www.xpi.com.br'],
      ['Itaú Empresas', 'Tradicional para PJ, fundos restritos.', 'https://www.itau.com.br'],
      ['BNDES', 'Linhas de crédito para investimento e capital de giro.', 'https://www.bndes.gov.br'],
    ]
  },
  {
    title:'Previdência Privada (PGBL/VGBL)',
    items:[
      ['XP Seguros', 'Diversidade de fundos previdenciários.', 'https://www.xpi.com.br'],
      ['BTG Vida', 'Planos PGBL/VGBL com fundos exclusivos.', 'https://www.btgpactual.com'],
      ['Brasilprev', 'Tradicional, do BB e Principal.', 'https://www.brasilprev.com.br'],
      ['Icatu', 'Especialista em previdência.', 'https://www.icatuseguros.com.br'],
    ]
  },
];

export default function Where() {
  return (
    <div>
      <PageHead title="Onde Investir" subtitle="Corretoras reguladas pela CVM (Brasil) e SEC/FINRA (EUA). Sempre verifique taxas e custódia antes de aportar."/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:14}}>
        {SECTIONS.map(s=>(
          <div key={s.title} className="card">
            <h3>{s.title}</h3>
            <ul style={{margin:'10px 0 0', paddingLeft:0, listStyle:'none'}}>
              {s.items.map(([n,d,u])=>(
                <li key={n} style={{padding:'10px 0', borderBottom:'1px solid var(--border)'}}>
                  <a href={u} target="_blank" rel="noopener" style={{fontWeight:700, fontSize:14}}>{n}</a>
                  <div style={{fontSize:12, color:'var(--muted)', marginTop:2}}>{d}</div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
