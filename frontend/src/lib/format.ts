export const fmt = (v: number | string) => {
  const n = typeof v === 'string' ? Number(v) : v;
  return (isNaN(n) ? 0 : n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
};
export const fmt0 = (v: number | string) => {
  const n = typeof v === 'string' ? Number(v) : v;
  return (isNaN(n) ? 0 : n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};
export const pct = (v: number, digits = 1) => (v * 100).toFixed(digits) + '%';
export const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('pt-BR');
export const fmtMonth = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${meses[m - 1]}/${y}`;
};
export const todayYM = () => new Date().toISOString().slice(0, 7);
export const todayDate = () => new Date().toISOString().slice(0, 10);
