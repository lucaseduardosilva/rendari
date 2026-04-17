/**
 * Conteúdo da tela de ajuda. Cada seção declara em qual contexto aparece
 * via `requirePage` (gating de plano) ou `audience`.
 */

export interface HelpSection {
  id: string;
  group: string;
  title: string;
  intro?: string;
  audience?: 'PF' | 'PJ' | 'BOTH';
  requirePage?: string;       // se setado, só aparece se o plano libera essa página
  steps?: { title: string; body: string }[];
  formulas?: { name: string; expr: string; desc: string }[];
  tips?: string[];
}

export const HELP_SECTIONS: HelpSection[] = [
  // ====== GETTING STARTED ======
  {
    id: 'start',
    group: 'Começando',
    title: 'Bem-vindo ao Rendari',
    intro: 'Plataforma de gestão financeira pessoal e empresarial com simulação de investimentos.',
    audience: 'BOTH',
    steps: [
      { title: '1. Complete seu cadastro', body: 'Confirme seu email pelo link enviado e (opcional) valide seu telefone via SMS/WhatsApp em Configurações.' },
      { title: '2. Cadastre suas receitas', body: 'Vá em Receitas e cadastre salário, freelances, dividendos, aluguéis. O sistema calcula seu equivalente mensal automaticamente.' },
      { title: '3. Mapeie suas despesas', body: 'Em Despesas você cadastra cada gasto, classifica como Essencial / Desejo / Investimento (regra 50/30/20) e marca como pago no mês.' },
      { title: '4. Cadastre seu patrimônio', body: 'Em Patrimônio inclua imóveis, contas, investimentos (Ativos) e cartões/financiamentos (Dívidas) — vê seu patrimônio líquido em tempo real.' },
      { title: '5. Defina metas', body: 'Em Metas cadastre objetivos com valor e prazo. O sistema mostra quanto economizar por mês.' },
      { title: '6. Simule investimentos', body: 'No Simulador veja juros compostos com tributação real. Combine vários ativos na Carteira Híbrida e salve cenários.' },
    ],
    tips: [
      'Use o tema escuro/claro conforme sua preferência (botão no topo).',
      'Personalize categorias em Campos Personalizados sem perder os valores padrão.',
      'Exporte qualquer tabela em CSV / Excel / PDF pelo botão "Exportar" no canto superior.',
    ],
  },

  {
    id: 'faq', group: 'Começando', title: 'Perguntas frequentes',
    audience: 'BOTH',
    intro: 'Respostas rápidas para as dúvidas mais comuns. Use a busca no topo da página para encontrar um termo específico.',
  },

  // ====== PLANEJAMENTO ======
  {
    id: 'dashboard', group: 'Planejamento', title: 'Dashboard', requirePage: '/dashboard', audience: 'BOTH',
    intro: 'Visão consolidada do seu mês: renda, despesas, sobra, patrimônio líquido e atalhos.',
    tips: ['Os KPIs vêm direto do que você cadastrou em Receitas, Despesas, Patrimônio.', 'Atualiza em tempo real conforme você adiciona dados.'],
  },
  {
    id: 'income', group: 'Planejamento', title: 'Receitas', requirePage: '/income', audience: 'BOTH',
    intro: 'Cadastre todas as fontes de renda. O sistema calcula o equivalente mensal de cada uma para o cálculo da sobra.',
    steps: [
      { title: 'Adicionar receita', body: 'Clique em "+ Nova Receita". Informe descrição, categoria, frequência (mensal/anual/única) e valor.' },
      { title: 'Frequências', body: 'Mensal: valor cheio todo mês. Anual: divide por 12 (ex: 13º). Única: amortiza no ano (valor/12).' },
      { title: 'Categorias customizadas', body: 'Vá em "Campos Personalizados" para adicionar novas categorias além de Salário, Pró-labore, etc.' },
    ],
  },
  {
    id: 'expenses', group: 'Planejamento', title: 'Despesas', requirePage: '/expenses', audience: 'BOTH',
    intro: 'Despesas recorrentes, anuais, únicas e parceladas (cartão Nx). Permite marcar pagamento por mês.',
    steps: [
      { title: 'Cadastrar despesa', body: 'Defina descrição, categoria, tipo (Essencial / Desejo / Investimento conforme regra 50/30/20), frequência e valor.' },
      { title: 'Parcelas de cartão', body: 'Escolha frequência "Parcelada" e informe nº de parcelas. O sistema divide o valor total automaticamente e mostra a parcela só nos meses corretos (1/4, 2/4...).' },
      { title: 'Check de pagamento', body: 'Use o seletor de mês no topo. Marque o checkbox de cada despesa quando paga. Vê % e valor pendente.' },
      { title: 'Histórico', body: 'Mude o mês para ver despesas passadas e check histórico do que foi pago.' },
    ],
    tips: ['Mês inicial define quando a despesa começa a aparecer.', 'Despesas únicas só aparecem no mês informado em "Mês inicial".'],
  },
  {
    id: 'patrimony', group: 'Planejamento', title: 'Patrimônio', requirePage: '/patrimony', audience: 'BOTH',
    intro: 'Cadastre Ativos (o que você tem) e Dívidas (o que você deve). Patrimônio Líquido = Ativos - Dívidas.',
    formulas: [
      { name: 'Patrimônio Líquido', expr: 'Total de Ativos − Total de Dívidas', desc: 'Termômetro mais honesto da sua saúde financeira.' },
    ],
    tips: ['Para imóveis, cadastre o valor ATUAL de mercado, não o de aquisição.', 'Para dívidas, informe os juros mensais para entender o impacto real.'],
  },
  {
    id: 'goals', group: 'Planejamento', title: 'Metas Financeiras', requirePage: '/goals', audience: 'BOTH',
    intro: 'Defina objetivos com valor alvo e prazo. O sistema calcula o aporte mensal necessário.',
    formulas: [
      { name: 'Aporte mensal', expr: '(Valor Alvo − Já Acumulado) / Prazo em meses', desc: 'Quanto você precisa guardar por mês para atingir a meta.' },
    ],
  },
  {
    id: 'plan', group: 'Planejamento', title: 'Plano de Aportes', requirePage: '/plan', audience: 'BOTH',
    intro: 'Vincule simulações salvas a aportes mensais — valor fixo, % da sobra ou % do salário.',
    steps: [
      { title: 'Pré-requisito', body: 'Salve simulações no Simulador ou na Carteira Híbrida primeiro.' },
      { title: 'Criar vínculo', body: 'Clique em "+ Vincular", escolha a simulação, o modo e o valor.' },
      { title: 'Modos', body: 'Valor fixo: aporte exato em R$. % da sobra: usa parte do que sobra do mês. % do salário: usa parte da renda mensal.' },
    ],
  },

  // ====== ATIVOS & RENDA ======
  {
    id: 'vehicles', group: 'Ativos & Renda', title: 'Veículos', requirePage: '/vehicles', audience: 'BOTH',
    intro: 'Cadastre carros, motos e frota com valor de aquisição, valor atual de mercado (FIPE) e km.',
    formulas: [
      { name: 'Depreciação', expr: 'Valor de Aquisição − Valor Atual', desc: 'Quanto o veículo desvalorizou desde a compra.' },
    ],
    tips: ['Adicione tipos personalizados de veículo (ex: Aeronave, Embarcação) em Campos Personalizados.'],
  },
  {
    id: 'properties', group: 'Ativos & Renda', title: 'Imóveis', requirePage: '/properties', audience: 'BOTH',
    intro: 'Gestão de imóveis com valor de aquisição, valor atual, financiamento, aluguel e ROI.',
    formulas: [
      { name: 'Equity', expr: 'Valor Atual − Saldo Financiamento', desc: 'Patrimônio líquido do imóvel (o que é seu de fato).' },
      { name: 'Yield bruto a.a.', expr: '(Aluguel × 12) / Valor de Aquisição', desc: 'Rentabilidade anual bruta do aluguel sobre o valor pago.' },
      { name: 'Valorização', expr: 'Valor Atual − Valor de Aquisição', desc: 'Quanto o imóvel ganhou (ou perdeu) de valor de mercado.' },
    ],
  },
  {
    id: 'streams', group: 'Ativos & Renda', title: 'Estratégias de Renda', requirePage: '/streams', audience: 'BOTH',
    intro: 'Gerencie fontes de renda alternativas: serviços, infoprodutos, SaaS, dropshipping, aluguel.',
    formulas: [
      { name: 'LTV (Lifetime Value)', expr: 'Ticket × (Lifetime / Frequência) × Margem Bruta', desc: 'Quanto cada cliente gera no total durante o relacionamento.' },
      { name: 'Margem Bruta', expr: '(Ticket − Custo Variável) / Ticket', desc: 'Eficiência operacional unitária.' },
      { name: 'CAC', expr: 'Marketing / Novos Clientes', desc: 'Custo de aquisição por cliente. Ideal: LTV/CAC ≥ 3.' },
      { name: 'Payback', expr: 'Investimento Total / Lucro Mensal', desc: 'Meses para recuperar o que você investiu.' },
    ],
    tips: ['Veja todos os termos no Glossário.', 'LTV/CAC < 1 = você queima dinheiro a cada cliente novo.'],
  },

  // ====== INVESTIMENTOS ======
  {
    id: 'catalog', group: 'Investimentos', title: 'Catálogo de Investimentos', requirePage: '/catalog', audience: 'BOTH',
    intro: '30+ ativos catalogados com notas 0-10 de Risco, Retorno e Imposto. Filtros por PF/PJ e país.',
    steps: [
      { title: 'Notas', body: '10 = melhor. Risco 10 = baixíssima volatilidade. Retorno 10 = robusto vs CDI. Imposto 10 = mais eficiente.' },
      { title: 'PF vs PJ', body: 'Cada ativo indica para qual investidor é mais adequado. LCI/LCA, FIIs e REITs são desvantajosos para PJ por perderem isenções.' },
      { title: 'Onde investir', body: 'Cada card mostra corretoras recomendadas (XP, BTG, Avenue, IBKR, Mercado Bitcoin, etc).' },
    ],
  },
  {
    id: 'simulator', group: 'Investimentos', title: 'Simulador', requirePage: '/simulator', audience: 'BOTH',
    intro: 'Calcula juros compostos com tributação real do ativo. Compara com CDI no mesmo período.',
    formulas: [
      { name: 'Juros compostos mensais', expr: 'Saldo × (1 + taxa_mensal) + aporte', desc: 'Aplicado mês a mês. Taxa mensal = (1+taxa_anual)^(1/12) − 1.' },
      { name: 'IR sobre lucro', expr: 'Lucro Bruto × Alíquota do ativo', desc: 'Aplicado uma vez ao final do período. Ações têm 15%, RF 15-22.5%, FIIs isento (PF), etc.' },
      { name: 'Valor real', expr: 'Líquido / (1 + inflação)^anos', desc: 'Quanto valeria descontando a inflação.' },
    ],
    tips: ['O CDI mostrado é o benchmark — se sua simulação não bate o CDI, considere outro ativo.', 'Reinvestir dividendos faz diferença grande no longo prazo.'],
  },
  {
    id: 'hybrid', group: 'Investimentos', title: 'Carteira Híbrida', requirePage: '/hybrid', audience: 'BOTH',
    intro: 'Combine vários ativos com pesos %. Cada um simula com sua tributação própria e o resultado é agregado.',
    steps: [
      { title: 'Adicionar ativos', body: 'Use os presets (Conservadora/Moderada/Arrojada) ou monte sua própria carteira. Total dos pesos deve somar 100%.' },
      { title: 'Resultado agregado', body: 'O sistema simula cada ativo separadamente com sua fatia do aporte e soma. Imposto é calculado por ativo (corretamente).' },
      { title: 'Salvar', body: 'Dê um nome e clique em "Salvar carteira" para usar depois no Plano de Aportes.' },
    ],
  },
  {
    id: 'compare', group: 'Investimentos', title: 'Comparador BR × EUA', requirePage: '/compare', audience: 'BOTH',
    intro: 'Compara retorno líquido entre um ativo BR e um EUA considerando câmbio e variação cambial.',
    tips: ['Investir nos EUA expõe ao risco cambial — em períodos de Real forte, retorno em BRL pode cair mesmo com bons resultados em USD.'],
  },
  {
    id: 'ranking', group: 'Investimentos', title: 'Ranking de Ativos', requirePage: '/ranking', audience: 'BOTH',
    intro: 'Score ponderado para identificar os ativos mais equilibrados.',
    formulas: [
      { name: 'Score Total', expr: '(Risco × 0.35) + (Retorno × 0.35) + (Imposto × 0.30)', desc: 'Pondera segurança, rentabilidade e eficiência fiscal.' },
    ],
  },

  // ====== EMPRESA (PJ) ======
  {
    id: 'pj-employees', group: 'Empresa (PJ)', title: 'Funcionários', requirePage: '/employees', audience: 'PJ',
    intro: 'Cadastro de colaboradores CLT — base para folha de pagamento, encargos e centros de custo.',
    steps: [
      { title: 'Cadastrar', body: 'Informe nome, CPF, cargo, departamento, salário bruto, benefícios (VR/VT/plano), data de admissão.' },
      { title: 'Custo total estimado', body: 'No card aparece o custo real para empresa: salário + benefícios + encargos. Estimativa: ~50% de encargos sobre o salário.' },
    ],
  },
  {
    id: 'pj-payroll', group: 'Empresa (PJ)', title: 'Folha de Pagamento', requirePage: '/payroll', audience: 'PJ',
    intro: 'Cálculo automático de INSS, FGTS, IRRF e encargos patronais com tabelas 2026.',
    formulas: [
      { name: 'INSS Empregado', expr: 'Tabela progressiva 7.5% → 14% (teto R$ 8.157,41)', desc: 'Descontado do salário do empregado.' },
      { name: 'FGTS', expr: 'Salário Bruto × 8%', desc: 'Depositado pela empresa em conta vinculada do empregado (não desconta do líquido).' },
      { name: 'IRRF', expr: 'Tabela progressiva 0% → 27.5% sobre (bruto − INSS − dependentes)', desc: 'Faixa isenta até R$ 2.428,80.' },
      { name: 'Custo Total Empresa', expr: 'Bruto + Benefícios + FGTS + INSS Patronal + RAT + Sistema S + Provisões (13º + Férias + Multa)', desc: 'No Lucro Real/Presumido ≈ 65% do salário. No Simples ≈ 39%.' },
    ],
    tips: ['Regime tributário da empresa (em Configurações) afeta os cálculos de encargos.', 'No Simples, INSS Patronal já está incluído no DAS.'],
  },
  {
    id: 'pj-departments', group: 'Empresa (PJ)', title: 'Departamentos', requirePage: '/departments', audience: 'PJ',
    intro: 'Estruture sua empresa em áreas (Comercial, TI, Financeiro, RH, Marketing) para alocar funcionários e analisar custos.',
  },
  {
    id: 'pj-cc', group: 'Empresa (PJ)', title: 'Centros de Custo', requirePage: '/cost-centers', audience: 'PJ',
    intro: 'Aloque despesas a centros para análise gerencial. Compare orçado vs realizado por área.',
  },
  {
    id: 'pj-invoices', group: 'Empresa (PJ)', title: 'Notas Fiscais', requirePage: '/invoices', audience: 'PJ',
    intro: 'Controle de NF-e (mercadoria) e NFS-e (serviço), entrada (compras) e saída (vendas) com impostos retidos.',
    steps: [
      { title: 'Cadastrar NF', body: 'Informe número, tipo (entrada/saída), parte (cliente/fornecedor), CPF/CNPJ, valor e impostos retidos.' },
      { title: 'Filtros', body: 'Use o seletor de mês e os filtros Entrada/Saída para análise temporal.' },
    ],
  },
  {
    id: 'pj-taxes', group: 'Empresa (PJ)', title: 'Impostos PJ', requirePage: '/business-taxes', audience: 'PJ',
    intro: 'Calculadoras dos 3 regimes tributários + calendário de obrigações.',
    steps: [
      { title: 'Simples Nacional', body: '5 anexos com alíquotas progressivas. DAS = Faturamento Mês × Alíquota Efetiva.' },
      { title: 'Lucro Presumido', body: 'IRPJ 15% + adicional 10% sobre presunção, CSLL 9%, PIS 0.65%, COFINS 3%. Limite R$ 78 mi/ano.' },
      { title: 'Lucro Real', body: 'IRPJ 15% + adicional 10% sobre lucro real, CSLL 9%, PIS 1.65%, COFINS 7.6%. Para grandes empresas.' },
    ],
    formulas: [
      { name: 'Alíquota Efetiva (Simples)', expr: '(RBT12 × Alíquota Nominal − Valor a Deduzir) / RBT12', desc: 'RBT12 = Receita Bruta dos últimos 12 meses.' },
    ],
  },
  {
    id: 'pj-dre', group: 'Empresa (PJ)', title: 'DRE Automática', requirePage: '/dre', audience: 'PJ',
    intro: 'Demonstração do Resultado do Exercício gerada agregando NFs, Folha, Despesas e Impostos.',
    formulas: [
      { name: 'Receita Líquida', expr: 'Receita Bruta − Impostos sobre Vendas', desc: 'Vendas líquidas para análise.' },
      { name: 'Lucro Bruto', expr: 'Receita Líquida − CMV', desc: 'Antes das despesas operacionais.' },
      { name: 'Lucro Operacional / EBITDA', expr: 'Lucro Bruto − Folha − Despesas Operacionais', desc: 'Resultado da atividade principal.' },
      { name: 'Lucro Líquido', expr: 'Lucro Operacional − IR e CSLL', desc: 'O que sobra ao final.' },
      { name: 'Margem Líquida', expr: 'Lucro Líquido / Receita Líquida', desc: 'Eficiência geral. Saudável > 10%.' },
    ],
    tips: ['Pode ser visualizada em Mensal, Trimestral ou Anual.', 'IR/CSLL é estimativa — no Lucro Real depende de adições/exclusões da LALUR.'],
  },
  {
    id: 'pj-cashflow', group: 'Empresa (PJ)', title: 'Fluxo de Caixa', requirePage: '/cashflow', audience: 'PJ',
    intro: 'Projeção de entradas, saídas e saldo mês a mês com base em NFs, folha e despesas recorrentes.',
    tips: ['Use para identificar meses com déficit projetado e antecipar capital de giro.', 'Diferente da DRE — fluxo de caixa é regime de caixa (movimento real).'],
  },

  // ====== CONFIGURAÇÕES ======
  {
    id: 'settings', group: 'Conta', title: 'Configurações', audience: 'BOTH',
    intro: 'Gerencie perfil, senha e identidade visual (whitelabel).',
    steps: [
      { title: 'Perfil', body: 'Edite nome, telefone. Email não pode ser alterado pelo usuário.' },
      { title: 'Whitelabel (planos pagos)', body: 'Personalize o nome do site, logo, favicon e paletas dark/light. Ideal pra revender o sistema com sua marca.' },
      { title: 'Segurança', body: 'Troque sua senha. Mínimo 8 caracteres com 1 maiúscula, 1 número e 1 especial.' },
    ],
  },
  {
    id: 'custom', group: 'Conta', title: 'Campos Personalizados', audience: 'BOTH',
    intro: 'Adicione opções extras aos selects do sistema sem perder os valores padrão.',
    steps: [
      { title: 'Como funciona', body: 'Cada select de categoria/tipo tem valores padrão fixos. Você pode ADICIONAR opções extras que aparecem em todas as telas que usam aquele campo.' },
      { title: 'Renomear propaga', body: 'Editar uma opção customizada renomeia automaticamente em TODOS os registros que a usam.' },
      { title: 'Bloqueio de exclusão', body: 'Se uma categoria está sendo usada por algum registro, ela não pode ser excluída — aparece com 🔒.' },
    ],
  },
];

// FAQ
export interface FaqItem { q: string; a: string; audience?: 'PF' | 'PJ' | 'BOTH' }
export const FAQ: FaqItem[] = [
  { q: 'Meus dados ficam seguros?', a: 'Sim. Tudo é armazenado criptografado no banco do Rendari. Nunca compartilhamos com terceiros. Senhas usam hash bcrypt.' },
  { q: 'Posso exportar meus dados?', a: 'Sim. Em qualquer tabela do sistema há um botão "Exportar" com opções CSV, Excel (XLSX) e PDF.' },
  { q: 'Como mudar de plano?', a: 'No menu do usuário (canto superior direito) → "Planos / Upgrade".' },
  { q: 'Posso usar em mais de um dispositivo?', a: 'Sim. É só fazer login no novo dispositivo. Recomendamos sempre fazer logout em dispositivos públicos.' },
  { q: 'Esqueci minha senha. E agora?', a: 'Na tela de login clique em "Esqueci a senha". Pode recuperar por email ou (se telefone validado) SMS/WhatsApp.' },
  { q: 'Como funciona a regra 50/30/20?', a: '50% da renda para essenciais (moradia, alimentação, transporte), 30% para desejos (lazer, hobbies), 20% para investimentos e reserva.' },
  { q: 'O cálculo de IR está atualizado?', a: 'Sim, baseado nas tabelas vigentes em 2026. Reforma Tributária ainda em fase de transição.' },
  { q: 'Posso adicionar mais categorias?', a: 'Sim! Vá em Referência → Campos Personalizados e adicione quantas quiser.' },
  { q: 'Como funciona a Carteira Híbrida?', a: 'Você define pesos % para vários ativos. O sistema simula cada um com sua tributação própria e mostra o resultado agregado.', audience: 'BOTH' },
  // PJ-specific
  { q: 'A folha de pagamento substitui meu eSocial?', a: 'Não. Os cálculos do Rendari são gerenciais — para fins fiscais e trabalhistas, sempre use seu sistema oficial e contador.', audience: 'PJ' },
  { q: 'Qual regime tributário escolher?', a: 'Depende do faturamento e atividade. Use as calculadoras em Impostos PJ para comparar Simples × Presumido × Real e fale com seu contador.', audience: 'PJ' },
  { q: 'A DRE serve para entregar à Receita?', a: 'Não. É uma DRE gerencial para acompanhamento. A DRE oficial deve ser feita pelo contador com base nas obrigações do regime.', audience: 'PJ' },
  { q: 'Como adicionar um centro de custo a uma despesa?', a: 'Cadastre o centro de custo primeiro em Empresa → Centros de Custo, depois ele aparece como opção ao cadastrar/editar despesas.', audience: 'PJ' },
];
