/**
 * Catálogo central de scopes de opções customizáveis.
 * Cada scope tem valores padrão (DEFAULTS) que o usuário pode COMPLEMENTAR
 * cadastrando opções extras (ele NÃO remove as padrões).
 */

export interface ScopeMeta {
  key: string;
  label: string;
  page: string;        // página onde é usado
  pageRoute: string;
  area: 'PF' | 'PJ' | 'COMUM';
  description: string;
  defaults: string[];
}

export const SCOPES: ScopeMeta[] = [
  {
    key: 'income.cat', label: 'Categorias de Receitas',
    page: 'Receitas', pageRoute: '/income', area: 'COMUM',
    description: 'Tipos de renda que você pode cadastrar (salário, dividendos, aluguéis, etc).',
    defaults: ['Salário', 'Pró-labore', 'Freelance', 'Dividendos', 'Aluguel', '13º / Bônus', 'Investimentos', 'Outros'],
  },
  {
    key: 'expense.cat', label: 'Categorias de Despesas',
    page: 'Despesas', pageRoute: '/expenses', area: 'COMUM',
    description: 'Categorias para classificar onde seu dinheiro está saindo.',
    defaults: ['Moradia','Alimentação','Transporte','Saúde','Educação','Lazer','Vestuário','Assinaturas','Vícios','Pets','Filhos','Outros'],
  },
  {
    key: 'asset.cat', label: 'Categorias de Ativos',
    page: 'Patrimônio', pageRoute: '/patrimony', area: 'COMUM',
    description: 'Tipos de bens e investimentos do seu patrimônio.',
    defaults: ['Imóvel','Veículo','Conta Corrente','Poupança','Renda Fixa','Ações / FIIs','Investimentos no Exterior','Cripto','Previdência','Outros'],
  },
  {
    key: 'debt.cat', label: 'Categorias de Dívidas',
    page: 'Patrimônio', pageRoute: '/patrimony', area: 'COMUM',
    description: 'Tipos de dívidas e financiamentos.',
    defaults: ['Cartão de Crédito','Empréstimo Pessoal','Financiamento Imobiliário','Financiamento Veículo','Cheque Especial','Crédito Consignado','Outros'],
  },
  {
    key: 'vehicle.type', label: 'Tipos de Veículo',
    page: 'Veículos', pageRoute: '/vehicles', area: 'COMUM',
    description: 'Tipos para classificar seus veículos (carro, moto, etc).',
    defaults: ['Carro','Moto','Caminhonete','SUV','Caminhão','Van','Bicicleta Elétrica','Outros'],
  },
  {
    key: 'property.type', label: 'Tipos de Imóvel',
    page: 'Imóveis', pageRoute: '/properties', area: 'COMUM',
    description: 'Classificação de imóveis no portfólio.',
    defaults: ['Apartamento','Casa','Sobrado','Terreno','Sala Comercial','Galpão','Rural','Cobertura'],
  },
  {
    key: 'stream.type', label: 'Tipos de Estratégia de Renda',
    page: 'Estratégias de Renda', pageRoute: '/streams', area: 'COMUM',
    description: 'Modelos de fonte de renda (serviço, infoproduto, SaaS…).',
    defaults: ['Serviço','Produto Físico','Infoproduto','SaaS / Software','Aluguel','Dropshipping','E-commerce','Afiliado','Royalties','Freelance','Outros'],
  },
  {
    key: 'invoice.cat', label: 'Categorias de Notas Fiscais',
    page: 'Notas Fiscais', pageRoute: '/invoices', area: 'PJ',
    description: 'Categorias para suas NFs de entrada e saída.',
    defaults: ['Venda', 'Compra', 'Serviço Prestado', 'Serviço Tomado', 'Devolução', 'Outros'],
  },
  {
    key: 'payment.method', label: 'Formas de Pagamento',
    page: 'Despesas / Receitas', pageRoute: '/expenses', area: 'COMUM',
    description: 'Meios de pagamento usados nas suas movimentações.',
    defaults: ['PIX','Dinheiro','Débito','Crédito','Boleto','Transferência','Carteira Digital'],
  },
];

export function getScope(key: string): ScopeMeta | undefined {
  return SCOPES.find(s => s.key === key);
}
