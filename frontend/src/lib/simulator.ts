export interface SimInput { initial:number; monthly:number; years:number; rateYr:number; cdiYr?:number; inflYr?:number; reinvest?:boolean; taxRate?:number; dividendYield?:number; }
export interface SimMonthly { month:number; bal:number; cdiBal:number; invested:number; gain:number; capitalGain:number; dividend:number; }
export interface SimResult { bal:number; net:number; tax:number; invested:number; cdiBal:number; dividends:number; real:number; monthly:SimMonthly[]; }

export function simulate({ initial, monthly, years, rateYr, cdiYr=11, inflYr=4, reinvest=true, taxRate=0.15, dividendYield=0 }: SimInput): SimResult {
  const months = years * 12;
  const r = Math.pow(1+rateYr/100, 1/12) - 1;
  const cdiM = Math.pow(1+cdiYr/100, 1/12) - 1;
  const dyM = dividendYield/12;
  let bal = initial, cdiBal = initial, invested = initial, dividends = 0, prev = initial;
  const series: SimMonthly[] = [];
  for (let m=1; m<=months; m++) {
    bal += monthly; cdiBal += monthly; invested += monthly;
    const before = bal;
    bal *= (1+r);
    const cap = bal - before;
    const div = bal * dyM;
    dividends += div;
    if (reinvest) bal += div;
    cdiBal *= (1+cdiM);
    series.push({ month:m, bal, cdiBal, invested, gain:(bal-prev)-monthly, capitalGain:cap, dividend:div });
    prev = bal;
  }
  const grossProfit = bal - invested;
  const tax = Math.max(0, grossProfit * taxRate);
  const net = bal - tax;
  const real = net / Math.pow(1+inflYr/100, years);
  return { bal, net, tax, invested, cdiBal, dividends, real, monthly:series };
}
