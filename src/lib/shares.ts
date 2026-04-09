export const INTEREST_RATE = 0.05;
export const TERM_MONTHS = 6;
export const ZELLE_PHONE = "7274002225";

export interface Tier {
  amount: number;
  shares: number;
  label: string;
  tag: string | null;
}

export const TIERS: Tier[] = [
  { amount: 8000, shares: 1600, label: "$8,000", tag: "Flagship" },
  { amount: 6000, shares: 1200, label: "$6,000", tag: null },
  { amount: 4000, shares: 800, label: "$4,000", tag: null },
  { amount: 0, shares: 0, label: "Custom", tag: null },
];

export const CUSTOM_OPTIONS = [
  { value: 500, label: "$500", shares: 100 },
  { value: 1000, label: "$1,000", shares: 200 },
  { value: 1500, label: "$1,500", shares: 300 },
  { value: 2000, label: "$2,000", shares: 400 },
  { value: 2500, label: "$2,500", shares: 500 },
  { value: 3000, label: "$3,000", shares: 600 },
  { value: 3500, label: "$3,500", shares: 700 },
];

export function calcShares(amt: number): number {
  if (amt <= 0) return 0;
  return Math.round(amt * 0.2);
}

export function calcInterest(principal: number): number {
  return principal * INTEREST_RATE * 0.5;
}

export function fmt(n: number): string {
  return "$" + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function fmtDate(s: string): string {
  if (!s) return "\u2014";
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function sixMonthsOut(dateStr: string): string {
  if (!dateStr) return "\u2014";
  const d = new Date(dateStr + "T12:00:00");
  d.setMonth(d.getMonth() + 6);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
