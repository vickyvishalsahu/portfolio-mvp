export type Cashflow = { date: string; amount: number };

export type CashflowTransaction = {
  transactionType: string;
  transactionDate: string;
  quantity: number;
  price: number;
};

const DAYS_PER_YEAR = 365;
const MAX_ITERATIONS = 100;
const CONVERGENCE_EPSILON = 1e-7;
const NEWTON_STARTING_RATE = 0.1;

const daysBetween = (fromDate: string, toDate: string): number =>
  (new Date(toDate).getTime() - new Date(fromDate).getTime()) / (24 * 60 * 60 * 1000);

const yearsFromBase = (baseDate: string, cashflow: Cashflow): number =>
  daysBetween(baseDate, cashflow.date) / DAYS_PER_YEAR;

const presentValue = (rate: number, cashflows: Cashflow[], baseDate: string): number =>
  cashflows.reduce((total, cashflow) => {
    const years = yearsFromBase(baseDate, cashflow);
    return total + cashflow.amount / Math.pow(1 + rate, years);
  }, 0);

const presentValueDerivative = (rate: number, cashflows: Cashflow[], baseDate: string): number =>
  cashflows.reduce((total, cashflow) => {
    const years = yearsFromBase(baseDate, cashflow);
    if (years === 0) return total;
    return total - (years * cashflow.amount) / Math.pow(1 + rate, years + 1);
  }, 0);

const solveWithNewtonRaphson = (cashflows: Cashflow[], baseDate: string): number | null => {
  let rate = NEWTON_STARTING_RATE;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const value = presentValue(rate, cashflows, baseDate);
    const derivative = presentValueDerivative(rate, cashflows, baseDate);
    if (!Number.isFinite(value) || !Number.isFinite(derivative) || Math.abs(derivative) < 1e-12) return null;

    const nextRate = rate - value / derivative;
    if (!Number.isFinite(nextRate) || nextRate <= -1) return null;
    if (Math.abs(nextRate - rate) < CONVERGENCE_EPSILON) return nextRate;
    rate = nextRate;
  }

  return null;
};

// Candidate rates spanning near-total loss to 100x growth — enough to bracket a sign
// change for the return profiles a personal portfolio can actually produce. A holding
// that collapses in value needs candidates approaching -1, not just -0.99: an investment
// down 99.9% in a year is a real -99.9% annualised rate, not a "can't compute" case.
const BRACKET_CANDIDATES = [-0.999999, -0.99999, -0.9999, -0.999, -0.99, -0.9, -0.5, 0, 0.5, 1, 2, 5, 10, 50, 100];

const findSignChangeBracket = (cashflows: Cashflow[], baseDate: string): [number, number] | null => {
  let previousRate = BRACKET_CANDIDATES[0];
  let previousValue = presentValue(previousRate, cashflows, baseDate);

  for (let index = 1; index < BRACKET_CANDIDATES.length; index++) {
    const rate = BRACKET_CANDIDATES[index];
    const value = presentValue(rate, cashflows, baseDate);
    const bothFinite = Number.isFinite(previousValue) && Number.isFinite(value);
    if (bothFinite && Math.sign(previousValue) !== Math.sign(value)) return [previousRate, rate];
    previousRate = rate;
    previousValue = value;
  }

  return null;
};

const solveWithBisection = (cashflows: Cashflow[], baseDate: string): number | null => {
  const bracket = findSignChangeBracket(cashflows, baseDate);
  if (!bracket) return null;

  let [low, high] = bracket;
  let lowValue = presentValue(low, cashflows, baseDate);

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const mid = (low + high) / 2;
    const midValue = presentValue(mid, cashflows, baseDate);

    if (Math.abs(midValue) < CONVERGENCE_EPSILON || (high - low) / 2 < CONVERGENCE_EPSILON) return mid;

    if (Math.sign(midValue) === Math.sign(lowValue)) {
      low = mid;
      lowValue = midValue;
    } else {
      high = mid;
    }
  }

  return null;
};

// Solves for the annualised rate that zeroes the net present value of dated cashflows.
// Tries Newton's method first (fast, precise); falls back to bisection when Newton
// fails to converge or wanders outside the valid (1+rate > 0) domain.
export const xirr = (cashflows: Cashflow[]): number | null => {
  if (cashflows.length < 2) return null;

  const hasInflow = cashflows.some((cashflow) => cashflow.amount > 0);
  const hasOutflow = cashflows.some((cashflow) => cashflow.amount < 0);
  if (!hasInflow || !hasOutflow) return null;

  const sortedCashflows = [...cashflows].sort((a, b) => a.date.localeCompare(b.date));
  const baseDate = sortedCashflows[0].date;

  const newtonResult = solveWithNewtonRaphson(sortedCashflows, baseDate);
  if (newtonResult !== null) return newtonResult;

  return solveWithBisection(sortedCashflows, baseDate);
};

// Buys and SIPs are capital going in (negative); sells and dividends are capital coming
// back out (positive). The terminal flow marks-to-market what's still held today — this
// is what makes the result a true annualised return rather than a simple P&L ratio.
export const buildCashflows = (
  transactions: CashflowTransaction[],
  currentValueLocal: number,
  asOfDate: string = new Date().toISOString().slice(0, 10)
): Cashflow[] => {
  const transactionFlows = transactions.map((transaction) => {
    const amount = transaction.quantity * transaction.price;
    const isOutflow = transaction.transactionType === 'buy' || transaction.transactionType === 'sip';
    return { date: transaction.transactionDate, amount: isOutflow ? -amount : amount };
  });

  return [...transactionFlows, { date: asOfDate, amount: currentValueLocal }];
};
