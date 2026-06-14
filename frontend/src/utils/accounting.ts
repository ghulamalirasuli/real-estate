import { formatMoney } from './formatMoney';
import { getLocalizedText } from './translatable';
import type { Translations } from './translatable';

export interface AccountingCurrency {
  id: number;
  code: string;
  symbol: string;
  name: Translations;
  decimal_places: number;
  is_default: boolean;
  is_active: boolean;
}

export interface Cashbox {
  id: number;
  name: Translations;
  description?: string;
  currency_id: number;
  opening_debit: number;
  opening_credit: number;
  current_balance: number;
  balance_in_base: number;
  is_active: boolean;
  currency?: AccountingCurrency;
}

export interface CurrencyCashboxSummary {
  currency: AccountingCurrency;
  cashbox_count: number;
  total_balance: number;
  total_balance_in_base: number;
}

export interface CurrencyBalance {
  currency?: AccountingCurrency;
  balance: number;
  balance_in_base: number;
}

export interface LedgerPartySummary {
  user: { id: number; name: string; role?: string };
  party_type: 'agent' | 'customer';
  balances_by_currency: CurrencyBalance[];
  balance_in_base: number;
  record_count: number;
}

export type LedgerEntryStatus = 'confirmed' | 'pending' | 'cancelled';

export interface AccountingLedgerLine {
  id: number;
  debit: number;
  credit: number;
  amount: number;
  base_amount?: number;
  cashbox_id?: number | null;
  account?: { code: string; name: Record<string, string> | string };
  cashbox?: { id: number; description?: string };
  currency?: { symbol?: string; code?: string; decimal_places?: number };
  user?: { id: number; name: string; role?: string };
}

export interface AccountingLedgerEntry {
  id: number;
  entry_date: string;
  description: string;
  status: LedgerEntryStatus;
  reference_type?: string | null;
  reference_id?: number | null;
  creator?: { id: number; name: string };
  lines: AccountingLedgerLine[];
}

export interface AccountingRecordFilters {
  currency_id: string;
  cashbox_id: string;
  from: string;
  to: string;
  status: string;
}

export const emptyAccountingRecordFilters = (): AccountingRecordFilters => ({
  currency_id: '',
  cashbox_id: '',
  from: '',
  to: '',
  status: '',
});

export interface LedgerPartiesData {
  default_currency?: AccountingCurrency;
  currencies?: AccountingCurrency[];
  total_balance: number;
  totals_by_currency?: Record<number, number>;
  party_count: number;
  parties: LedgerPartySummary[];
}

export function getBalanceForCurrency(balances: CurrencyBalance[], currencyId: number): number | null {
  const row = balances.find((b) => b.currency?.id === currencyId);
  return row ? row.balance : null;
}

export function formatBalanceCell(balance: number | null | undefined, symbol: string, decimals = 2): string {
  if (balance === null || balance === undefined || balance === 0) return '—';
  const formatted = formatMoney(Math.abs(balance), symbol, decimals);
  return balance < 0 ? `-${formatted}` : formatted;
}

export function getCashboxLabel(cb: Cashbox, lang: string): string {
  if (cb.description?.trim()) return cb.description;
  if (cb.currency?.code) return `${cb.currency.code} Cashbox`;
  return getLocalizedText(cb.name, lang) || `#${cb.id}`;
}
