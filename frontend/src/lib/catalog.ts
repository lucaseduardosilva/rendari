/**
 * Catálogo de investimentos com classificação PF / PJ / BOTH.
 * Notas 0-10 (10 = melhor)
 */

export type InvestorType = 'PF' | 'PJ' | 'BOTH';
export type Country = 'BR' | 'US' | 'GLOBAL';

export interface Asset {
  id: string;
  name: string;
  country: Country;
  investorType: InvestorType;
  category: string;
  desc: string;
  risk: number;     // 0-10 (10 = baixíssimo)
  ret: number;      // 0-10 (10 = robusto)
  tax: number;      // 0-10 (10 = mais eficiente)
  annualReturn: number; // estimativa %
  taxRate: number;  // alíquota efetiva
  dividendYield: number;
  where: string;
  pjNote?: string;  // particularidade PJ
}

export const ASSETS: Asset[] = [
  // ========== BRASIL — Renda Fixa ==========
  { id:'tesouro-selic', name:'Tesouro Selic', country:'BR', investorType:'BOTH', category:'Renda Fixa',
    desc:'Título público pós-fixado à taxa Selic — máxima segurança soberana.',
    risk:9, ret:6, tax:3, annualReturn:11, taxRate:0.175, dividendYield:0,
    where:'Tesouro Direto via XP, Rico, NuInvest, Inter, Clear (sem taxa).',
    pjNote:'PJ pode investir, mas não há benefícios fiscais como na PF.' },
  { id:'tesouro-ipca', name:'Tesouro IPCA+', country:'BR', investorType:'BOTH', category:'Renda Fixa',
    desc:'Título público atrelado à inflação (IPCA) + juros reais. Protege poder de compra.',
    risk:3, ret:9, tax:5, annualReturn:10, taxRate:0.15, dividendYield:0,
    where:'Tesouro Direto. Ideal NTN-B com vencimento longo.',
    pjNote:'Excelente para reservas de longo prazo da empresa.' },
  { id:'tesouro-pre', name:'Tesouro Prefixado', country:'BR', investorType:'BOTH', category:'Renda Fixa',
    desc:'Taxa fixa conhecida na contratação. Sujeito a marcação a mercado.',
    risk:4, ret:8, tax:4, annualReturn:11, taxRate:0.15, dividendYield:0,
    where:'Tesouro Direto via qualquer corretora.' },
  { id:'cdb', name:'CDB', country:'BR', investorType:'BOTH', category:'Renda Fixa',
    desc:'Depósito bancário a prazo. Coberto pelo FGC até R$ 250 mil por CPF/CNPJ.',
    risk:7, ret:6, tax:3, annualReturn:11, taxRate:0.175, dividendYield:0,
    where:'XP, BTG, Rico, Inter (busque CDBs > 100% CDI).',
    pjNote:'CDB Empresarial: FGC garante R$ 250k por CNPJ. Tributação igual à PF.' },
  { id:'lci-lca', name:'LCI / LCA', country:'BR', investorType:'PF', category:'Renda Fixa',
    desc:'Letras de Crédito (Imobiliário/Agronegócio). Isentas de IR para PF.',
    risk:5, ret:5, tax:10, annualReturn:10, taxRate:0, dividendYield:0,
    where:'XP, BTG, Inter, BB. Carência mínima de 9 meses.',
    pjNote:'⚠ PJ NÃO tem isenção de IR — tributada como CDB.' },
  { id:'fundos-di-pj', name:'Fundos DI / Renda Fixa Empresarial', country:'BR', investorType:'PJ', category:'Renda Fixa',
    desc:'Fundos de renda fixa específicos para PJ — alta liquidez, gestão profissional.',
    risk:7, ret:6, tax:5, annualReturn:11, taxRate:0.175, dividendYield:0,
    where:'BTG Empresas, XP Empresas, Itaú PJ, Bradesco PJ, gestoras como Pi, Capitânia.',
    pjNote:'Ideal para caixa operacional e reserva de capital de giro.' },
  { id:'cdb-corp', name:'CDB Corporativo (Acima R$ 250k)', country:'BR', investorType:'PJ', category:'Renda Fixa',
    desc:'CDBs com volume alto e taxas mais altas, geralmente bancos médios. Sem cobertura FGC além de R$ 250k.',
    risk:5, ret:8, tax:3, annualReturn:14, taxRate:0.175, dividendYield:0,
    where:'BTG Empresas, ABC Brasil, Daycoval, Sofisa.',
    pjNote:'Avaliar rating do emissor — risco de crédito relevante acima do FGC.' },

  // ========== BRASIL — Renda Variável ==========
  { id:'acoes-div', name:'Ações de Dividendos', country:'BR', investorType:'BOTH', category:'Renda Variável',
    desc:'Ações de empresas maduras com foco em distribuição (BBAS3, ITSA4, TAEE11).',
    risk:3, ret:7, tax:6, annualReturn:11, taxRate:0.075, dividendYield:0.06,
    where:'XP, BTG, Rico, Clear, NuInvest.',
    pjNote:'PJ paga IR sobre lucros (sem isenção R$20k); dividendos isentos como na PF.' },
  { id:'acoes-val', name:'Ações de Valorização (Growth)', country:'BR', investorType:'BOTH', category:'Renda Variável',
    desc:'Ações com foco em crescimento (WEGE3, RENT3, EQTL3).',
    risk:2, ret:9, tax:5, annualReturn:14, taxRate:0.15, dividendYield:0,
    where:'XP, BTG, Clear, Rico.' },
  { id:'fiis', name:'Fundos Imobiliários (FIIs)', country:'BR', investorType:'PF', category:'Renda Variável',
    desc:'Fundos de imóveis listados (KNRI11, HGLG11, MXRF11).',
    risk:4, ret:6, tax:6, annualReturn:10, taxRate:0, dividendYield:0.09,
    where:'XP, BTG, Rico, Clear.',
    pjNote:'⚠ PJ NÃO tem isenção dos rendimentos mensais — tributada em 15-22.5%.' },
  { id:'etfs-br', name:'ETFs Brasil', country:'BR', investorType:'BOTH', category:'Renda Variável',
    desc:'BOVA11, IVVB11, SMAL11. Diversificação total via índice.',
    risk:6, ret:7, tax:5, annualReturn:10, taxRate:0.15, dividendYield:0.01,
    where:'Qualquer corretora B3.' },
  { id:'bdrs', name:'BDRs', country:'BR', investorType:'BOTH', category:'Renda Variável',
    desc:'Recibos de ações estrangeiras (AAPL34, MSFT34). Acesso ao exterior pela B3.',
    risk:2, ret:9, tax:4, annualReturn:12, taxRate:0.15, dividendYield:0.015,
    where:'XP, BTG, Rico, Inter.' },

  // ========== EUA ==========
  { id:'us-stocks-grw', name:'Stocks (Growth EUA)', country:'US', investorType:'BOTH', category:'Renda Variável',
    desc:'Ações de tech americanas (AAPL, MSFT, NVDA, GOOGL).',
    risk:2, ret:10, tax:6, annualReturn:13, taxRate:0.15, dividendYield:0,
    where:'Avenue, Nomad, IBKR, C6 Global.',
    pjNote:'PJ pode investir via offshore ou diretamente — consulte tributação internacional.' },
  { id:'us-etfs', name:'ETFs S&P 500 / QQQ', country:'US', investorType:'BOTH', category:'Renda Variável',
    desc:'VOO, SPY, QQQ, VTI — máxima diversificação americana.',
    risk:5, ret:9, tax:6, annualReturn:10, taxRate:0.15, dividendYield:0.015,
    where:'Avenue, Nomad, IBKR, Inter Global.' },
  { id:'us-bonds', name:'Treasuries (Bonds EUA)', country:'US', investorType:'BOTH', category:'Renda Fixa',
    desc:'Títulos do governo americano (TLT, IEF, BND). Refúgio em USD.',
    risk:8, ret:7, tax:5, annualReturn:5, taxRate:0.15, dividendYield:0,
    where:'TreasuryDirect.gov, IBKR, Avenue.',
    pjNote:'Estrutura de holding offshore pode otimizar tributação.' },
  { id:'us-reits', name:'REITs', country:'US', investorType:'PF', category:'Renda Variável',
    desc:'Fundos imobiliários americanos em USD (O, VNQ, AMT, PLD).',
    risk:6, ret:7, tax:2, annualReturn:8, taxRate:0.30, dividendYield:0.05,
    where:'Avenue, IBKR, Nomad.',
    pjNote:'Alta retenção (30%) na fonte EUA torna pouco eficiente para PJ.' },

  // ========== CRIPTO ==========
  { id:'btc', name:'Bitcoin', country:'GLOBAL', investorType:'BOTH', category:'Cripto',
    desc:'Principal criptomoeda do mundo. Reserva de valor digital.',
    risk:1, ret:10, tax:7, annualReturn:30, taxRate:0.175, dividendYield:0,
    where:'Mercado Bitcoin, Binance, Coinbase. Ou ETF HASH11/BITH11 na B3.',
    pjNote:'PJ tributa lucro mensal (sem isenção R$35k que PF tem).' },
  { id:'eth', name:'Ethereum', country:'GLOBAL', investorType:'BOTH', category:'Cripto',
    desc:'Smart contracts e DeFi. Possibilidade de staking.',
    risk:1, ret:10, tax:7, annualReturn:35, taxRate:0.175, dividendYield:0.04,
    where:'Mercado Bitcoin, Binance, Coinbase.' },
  { id:'stable', name:'Stablecoins (USDC, USDT)', country:'GLOBAL', investorType:'BOTH', category:'Cripto',
    desc:'Pareadas ao dólar. Yield via DeFi (4-8% USD).',
    risk:7, ret:5, tax:7, annualReturn:6, taxRate:0.175, dividendYield:0,
    where:'Mercado Bitcoin, Binance, Aave, Compound.' },

  // ========== EXCLUSIVOS PJ ==========
  { id:'fundos-exclusivos', name:'Fundos Exclusivos / Restritos', country:'BR', investorType:'PJ', category:'Fundos PJ',
    desc:'Fundos sob medida para um único cotista (PJ ou holding). Estratégia personalizada.',
    risk:5, ret:8, tax:5, annualReturn:12, taxRate:0.15, dividendYield:0,
    where:'BTG Pactual, XP Asset, Itaú Asset, gestoras independentes.',
    pjNote:'Investimento mínimo geralmente R$ 10 milhões. Excelente para holding patrimonial.' },
  { id:'debentures-pj', name:'Debêntures Empresariais', country:'BR', investorType:'PJ', category:'Renda Fixa',
    desc:'Dívida emitida por empresas. Spreads atrativos vs CDI.',
    risk:5, ret:8, tax:5, annualReturn:13, taxRate:0.15, dividendYield:0,
    where:'XP, BTG, Itaú BBA. Verificar rating.',
    pjNote:'Risco de crédito do emissor. Sem FGC.' },
  { id:'cri-cra-pj', name:'CRI / CRA', country:'BR', investorType:'PJ', category:'Renda Fixa',
    desc:'Certificados de Recebíveis Imobiliários/Agronegócio.',
    risk:5, ret:8, tax:5, annualReturn:12, taxRate:0.15, dividendYield:0,
    where:'XP, BTG.',
    pjNote:'PF tem isenção; PJ paga IR normalmente.' },
  { id:'previdencia-pj', name:'Previdência Empresarial (PGBL Coletivo)', country:'BR', investorType:'PJ', category:'Previdência',
    desc:'Plano coletivo para funcionários — benefício tributário e retenção de talentos.',
    risk:6, ret:7, tax:8, annualReturn:9, taxRate:0.10, dividendYield:0,
    where:'Brasilprev, BrasilPrev, Icatu, XP Seguros.',
    pjNote:'Contribuições da empresa deduzem do IRPJ até 20% da folha (Lucro Real).' },
  { id:'holding', name:'Holding Patrimonial', country:'BR', investorType:'PJ', category:'Estrutura',
    desc:'Estrutura societária para receber e gerir investimentos com benefícios sucessórios e tributários.',
    risk:7, ret:7, tax:8, annualReturn:0, taxRate:0, dividendYield:0,
    where:'Estruturação via advogado tributarista e contador.',
    pjNote:'Reduz ITCMD em sucessões, tributa aluguel a 11.33% no Lucro Presumido.' },
];

export function filterAssets(opts: { investor?: 'PF'|'PJ'|'ALL', country?: Country|'ALL', category?: string|'ALL' }) {
  return ASSETS.filter(a => {
    if (opts.investor && opts.investor !== 'ALL') {
      if (a.investorType !== 'BOTH' && a.investorType !== opts.investor) return false;
    }
    if (opts.country && opts.country !== 'ALL' && a.country !== opts.country) return false;
    if (opts.category && opts.category !== 'ALL' && a.category !== opts.category) return false;
    return true;
  });
}
