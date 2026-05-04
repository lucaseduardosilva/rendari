export const PAGE_INFO: Record<string, { name: string; group: string; pjOnly?: boolean }> = {
  '/dashboard': { name: 'Dashboard', group: 'Planejamento' },
  '/income': { name: 'Receitas', group: 'Planejamento' },
  '/expenses': { name: 'Despesas (com parcelas)', group: 'Planejamento' },
  '/patrimony': { name: 'Patrimônio Líquido', group: 'Planejamento' },
  '/goals': { name: 'Metas Financeiras', group: 'Planejamento' },
  '/plan': { name: 'Plano de Aportes', group: 'Planejamento' },
  '/saved': { name: 'Minhas Simulações', group: 'Investimentos' },

  '/catalog': { name: 'Catálogo de Investimentos', group: 'Investimentos' },
  '/simulator': { name: 'Simulador (juros compostos)', group: 'Investimentos' },
  '/where': { name: 'Onde Investir (corretoras)', group: 'Referência' },
  '/taxes': { name: 'Tabela de Impostos', group: 'Referência' },
  '/glossary': { name: 'Glossário Financeiro', group: 'Referência' },

  '/hybrid': { name: 'Carteira Híbrida (multi-ativos)', group: 'Investimentos' },
  '/compare': { name: 'Comparador BR × EUA', group: 'Investimentos' },
  '/ranking': { name: 'Ranking de Ativos', group: 'Investimentos' },
  '/vehicles': { name: 'Gestão de Veículos', group: 'Ativos & Renda' },
  '/properties': { name: 'Gestão de Imóveis', group: 'Ativos & Renda' },
  '/streams': { name: 'Estratégias de Renda', group: 'Ativos & Renda' },

  '/dre': { name: 'DRE — Demonstração de Resultado', group: 'Empresa (PJ)', pjOnly: true },
  '/payroll': { name: 'Folha de Pagamento', group: 'Empresa (PJ)', pjOnly: true },
  '/employees': { name: 'Funcionários', group: 'Empresa (PJ)', pjOnly: true },
  '/invoices': { name: 'Notas Fiscais', group: 'Empresa (PJ)', pjOnly: true },
  '/contacts': { name: 'Clientes & Fornecedores', group: 'Empresa (PJ)', pjOnly: true },
  '/company': { name: 'Dados da Empresa', group: 'Empresa (PJ)', pjOnly: true },
  '/cost-centers': { name: 'Centros de Custo', group: 'Empresa (PJ)', pjOnly: true },
  '/departments': { name: 'Departamentos', group: 'Empresa (PJ)', pjOnly: true },
  '/business-taxes': { name: 'Impostos PJ (Simples/Presumido/Real)', group: 'Empresa (PJ)', pjOnly: true },
  '/cashflow': { name: 'Fluxo de Caixa Empresarial', group: 'Empresa (PJ)', pjOnly: true },
};

export const FEATURE_INFO: Record<string, string> = {
  whitelabel: 'Marca personalizada (logo, favicon, paletas)',
  multiCompany: 'Múltiplas empresas em uma só conta',
  customIntegrations: 'Integrações customizadas (API)',
  sso: 'Single Sign-On corporativo',
  payroll: 'Cálculo automatizado de folha',
  invoices: 'Gestão de notas fiscais',
  costCenters: 'Centros de custo e departamentos',
};
