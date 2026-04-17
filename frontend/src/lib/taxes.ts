/**
 * Cálculo de impostos PJ — referência 2026.
 */

// Simples Nacional 2026 — 5 anexos
export const SIMPLES_ANEXOS = {
  I: { name: 'Anexo I — Comércio', faixas: [
    { upTo: 180000, rate: 0.04, deduct: 0 },
    { upTo: 360000, rate: 0.073, deduct: 5940 },
    { upTo: 720000, rate: 0.095, deduct: 13860 },
    { upTo: 1800000, rate: 0.107, deduct: 22500 },
    { upTo: 3600000, rate: 0.143, deduct: 87300 },
    { upTo: 4800000, rate: 0.19, deduct: 378000 },
  ]},
  II: { name: 'Anexo II — Indústria', faixas: [
    { upTo: 180000, rate: 0.045, deduct: 0 },
    { upTo: 360000, rate: 0.078, deduct: 5940 },
    { upTo: 720000, rate: 0.10, deduct: 13860 },
    { upTo: 1800000, rate: 0.112, deduct: 22500 },
    { upTo: 3600000, rate: 0.147, deduct: 85500 },
    { upTo: 4800000, rate: 0.30, deduct: 720000 },
  ]},
  III: { name: 'Anexo III — Serviços (geral)', faixas: [
    { upTo: 180000, rate: 0.06, deduct: 0 },
    { upTo: 360000, rate: 0.112, deduct: 9360 },
    { upTo: 720000, rate: 0.135, deduct: 17640 },
    { upTo: 1800000, rate: 0.16, deduct: 35640 },
    { upTo: 3600000, rate: 0.21, deduct: 125640 },
    { upTo: 4800000, rate: 0.33, deduct: 648000 },
  ]},
  IV: { name: 'Anexo IV — Serviços (advocacia, construção)', faixas: [
    { upTo: 180000, rate: 0.045, deduct: 0 },
    { upTo: 360000, rate: 0.09, deduct: 8100 },
    { upTo: 720000, rate: 0.102, deduct: 12420 },
    { upTo: 1800000, rate: 0.14, deduct: 39780 },
    { upTo: 3600000, rate: 0.22, deduct: 183780 },
    { upTo: 4800000, rate: 0.33, deduct: 828000 },
  ]},
  V: { name: 'Anexo V — Serviços técnicos/intelectuais', faixas: [
    { upTo: 180000, rate: 0.155, deduct: 0 },
    { upTo: 360000, rate: 0.18, deduct: 4500 },
    { upTo: 720000, rate: 0.195, deduct: 9900 },
    { upTo: 1800000, rate: 0.205, deduct: 17100 },
    { upTo: 3600000, rate: 0.23, deduct: 62100 },
    { upTo: 4800000, rate: 0.305, deduct: 540000 },
  ]},
};

export function calcSimples(faturamento12m: number, anexo: keyof typeof SIMPLES_ANEXOS, faturamentoMes: number) {
  const a = SIMPLES_ANEXOS[anexo];
  let rate = 0, deduct = 0;
  for (const f of a.faixas) {
    if (faturamento12m <= f.upTo) { rate = f.rate; deduct = f.deduct; break; }
  }
  if (faturamento12m > 4800000) return { aliquotaEfetiva: a.faixas[a.faixas.length - 1].rate, das: faturamentoMes * a.faixas[a.faixas.length - 1].rate, excedido: true };
  const aliquotaEfetiva = Math.max(0, (faturamento12m * rate - deduct) / faturamento12m);
  const das = faturamentoMes * aliquotaEfetiva;
  return { aliquotaEfetiva, das: Math.round(das * 100) / 100, excedido: false };
}

// Lucro Presumido — comércio/indústria
export const PRESUMIDO_BASES = {
  comercio: { irpj: 0.08, csll: 0.12, name: 'Comércio / Indústria' },
  servicos: { irpj: 0.32, csll: 0.32, name: 'Serviços (geral)' },
  transporte: { irpj: 0.16, csll: 0.12, name: 'Transporte' },
};

export function calcLucroPresumido(faturamentoTrimestral: number, atividade: keyof typeof PRESUMIDO_BASES) {
  const { irpj: pIrpj, csll: pCsll } = PRESUMIDO_BASES[atividade];
  const baseIrpj = faturamentoTrimestral * pIrpj;
  const baseCsll = faturamentoTrimestral * pCsll;
  const irpj = baseIrpj * 0.15 + Math.max(0, baseIrpj - 60000) * 0.10;
  const csll = baseCsll * 0.09;
  const pis = faturamentoTrimestral * 0.0065;
  const cofins = faturamentoTrimestral * 0.03;
  const total = irpj + csll + pis + cofins;
  return { baseIrpj, baseCsll, irpj, csll, pis, cofins, total: Math.round(total * 100) / 100 };
}

export function calcLucroReal(faturamento: number, custosOperacionais: number) {
  const lucro = Math.max(0, faturamento - custosOperacionais);
  const irpj = lucro * 0.15 + Math.max(0, lucro - 20000) * 0.10;
  const csll = lucro * 0.09;
  const pis = faturamento * 0.0165;
  const cofins = faturamento * 0.076;
  const total = irpj + csll + pis + cofins;
  return { lucro, irpj, csll, pis, cofins, total: Math.round(total * 100) / 100 };
}

// Calendário tributário 2026
export const TAX_CALENDAR = [
  { day: 7, name: 'FGTS', desc: 'Recolhimento mensal do FGTS dos funcionários' },
  { day: 10, name: 'CAGED / e-Social', desc: 'Cadastro Geral de Empregados e Desempregados' },
  { day: 15, name: 'EFD-Reinf', desc: 'Escrituração Fiscal Digital de Retenções' },
  { day: 20, name: 'DAS Simples Nacional', desc: 'Documento de Arrecadação do Simples Nacional' },
  { day: 20, name: 'INSS / IRRF (folha)', desc: 'INSS patronal + IRRF retido na folha' },
  { day: 25, name: 'PIS / COFINS', desc: 'Lucro Real e Presumido' },
  { day: 30, name: 'IRPJ / CSLL trimestral', desc: 'Lucro Real e Presumido (mês final do trimestre)' },
  { day: 30, name: 'ICMS', desc: 'Recolhimento estadual (varia por UF)' },
  { day: 30, name: 'ISS', desc: 'Recolhimento municipal (varia por município)' },
];
