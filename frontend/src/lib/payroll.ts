/**
 * Cálculo de folha de pagamento brasileira (referência 2026).
 * Tabelas: INSS progressivo, IRRF progressivo, FGTS 8%, transporte 6%.
 */

// Tabela INSS 2026 (progressiva)
const INSS_TABLE_2026 = [
  { upTo: 1518.00, rate: 0.075 },
  { upTo: 2793.88, rate: 0.09 },
  { upTo: 4190.83, rate: 0.12 },
  { upTo: 8157.41, rate: 0.14 }, // teto
];
const INSS_CEILING = 8157.41;

export function calcINSS(grossSalary: number): number {
  if (grossSalary <= 0) return 0;
  const base = Math.min(grossSalary, INSS_CEILING);
  let tax = 0; let prev = 0;
  for (const tier of INSS_TABLE_2026) {
    const upper = Math.min(base, tier.upTo);
    if (upper > prev) { tax += (upper - prev) * tier.rate; prev = upper; }
    if (base <= tier.upTo) break;
  }
  return Math.round(tax * 100) / 100;
}

// Tabela IRRF 2026 (após desconto INSS + dependentes)
const IRRF_TABLE_2026 = [
  { upTo: 2428.80, rate: 0, deduct: 0 },
  { upTo: 2826.65, rate: 0.075, deduct: 182.16 },
  { upTo: 3751.05, rate: 0.15, deduct: 394.16 },
  { upTo: 4664.68, rate: 0.225, deduct: 675.49 },
  { upTo: Infinity, rate: 0.275, deduct: 908.73 },
];
const IRRF_DEPENDENT = 189.59;

export function calcIRRF(grossSalary: number, inss: number, dependents = 0): number {
  const base = grossSalary - inss - dependents * IRRF_DEPENDENT;
  if (base <= 0) return 0;
  for (const tier of IRRF_TABLE_2026) {
    if (base <= tier.upTo) {
      const tax = base * tier.rate - tier.deduct;
      return Math.max(0, Math.round(tax * 100) / 100);
    }
  }
  return 0;
}

export function calcFGTS(grossSalary: number): number {
  return Math.round(grossSalary * 0.08 * 100) / 100;
}

export function calcVT(grossSalary: number, vtCost: number): number {
  // VT desconta até 6% do salário, ou o custo total se menor
  return Math.min(vtCost, grossSalary * 0.06);
}

export interface PayrollCalc {
  grossSalary: number;
  benefits: number;
  inss: number;
  fgts: number;          // depósito (não desconta do líquido)
  irrf: number;
  vtDiscount: number;
  otherDeductions: number;
  netSalary: number;
  // Custo para empresa
  inssPatronal: number;     // 20% (Lucro Real/Presumido)
  rat: number;              // 1-3% (risco acidentes)
  outrasEntidades: number;  // 5,8% (Sistema S, Senac etc)
  fgtsProvisao: number;     // 8% mensal
  feriasProvisao: number;   // 8.33% + 1/3
  decimoProvisao: number;   // 8.33%
  multaRescisao: number;    // 4% sobre FGTS acumulado (3.2% mensal)
  totalCostEmployer: number;
}

export function calculatePayroll(
  grossSalary: number,
  benefits = 0,
  dependents = 0,
  vtCost = 0,
  otherDeductions = 0,
  regime: 'SIMPLES' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' = 'LUCRO_PRESUMIDO',
): PayrollCalc {
  const inss = calcINSS(grossSalary);
  const fgts = calcFGTS(grossSalary);
  const irrf = calcIRRF(grossSalary, inss, dependents);
  const vtDiscount = calcVT(grossSalary, vtCost);
  const netSalary = Math.round((grossSalary + benefits - inss - irrf - vtDiscount - otherDeductions) * 100) / 100;

  // Encargos patronais
  // Simples Nacional: ~7.5% (CPP no DAS)
  // Lucro Presumido/Real: 20% INSS + 1-3% RAT + 5.8% Sistema S = 26.8%
  let inssPatronal = 0, rat = 0, outrasEntidades = 0;
  if (regime === 'SIMPLES') {
    inssPatronal = grossSalary * 0.075;
  } else {
    inssPatronal = grossSalary * 0.20;
    rat = grossSalary * 0.02;
    outrasEntidades = grossSalary * 0.058;
  }

  const feriasProvisao = grossSalary * (0.0833 + 0.0833/3); // 1/12 + 1/3 sobre férias
  const decimoProvisao = grossSalary * 0.0833;
  const multaRescisao = fgts * 0.4; // provisão 40% multa FGTS

  const totalCostEmployer = grossSalary + benefits + fgts + inssPatronal + rat + outrasEntidades + feriasProvisao + decimoProvisao + multaRescisao;

  return {
    grossSalary, benefits, inss, fgts, irrf, vtDiscount, otherDeductions, netSalary,
    inssPatronal, rat, outrasEntidades, fgtsProvisao: fgts, feriasProvisao, decimoProvisao, multaRescisao,
    totalCostEmployer: Math.round(totalCostEmployer * 100) / 100,
  };
}
