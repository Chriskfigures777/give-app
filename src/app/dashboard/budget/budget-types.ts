export type IncomeRow = {
  id: string;
  sort_order: number;
  category: string;
  budgeted: string;
  actual: string;
};

export type FixedExpRow = {
  id: string;
  sort_order: number;
  item: string;
  budgetAmt: string;
  paidToDate: string;
  dueDate: string;
};

export type VarExpRow = {
  id: string;
  sort_order: number;
  item: string;
  budgetAmt: string;
  paidToDate: string;
  dueDate: string;
};

export type TransactionRow = {
  id: string;
  sort_order: number;
  date: string;
  description: string;
  category: string;
  amount: string;
};

export type BudgetSheet = {
  id: string;
  name: string;
  budget_type: "personal" | "church";
  year: number | null;
  month: number | null; // 1–12 for monthly sheets, null = annual
  income: IncomeRow[];
  fixedExpenses: FixedExpRow[];
  variableExpenses: VarExpRow[];
  transactions: TransactionRow[];
};

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function parseNum(val: string): number {
  const n = parseFloat((val ?? "").replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function fmtCurrency(val: number): string {
  if (val === 0) return "$0.00";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
