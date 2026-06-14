import type { AccountingLedgerEntry, AccountingLedgerLine } from './accounting';

export interface AccountingEntryTableRow {
  entry: AccountingLedgerEntry;
  rowNumber: number;
  line: AccountingLedgerLine | null;
  runningBalance: number;
}

export function formatReferenceNo(entry: AccountingLedgerEntry): string {
  if (entry.reference_id) {
    const type = entry.reference_type?.split('\\').pop() || 'REF';
    return `${type}-${entry.reference_id}`;
  }
  return `JE-${entry.id}`;
}

function pickPartyLine(entry: AccountingLedgerEntry, userId: number): AccountingLedgerLine | null {
  return entry.lines?.find((line) => line.user?.id === userId) ?? null;
}

function pickCashboxLine(entry: AccountingLedgerEntry): AccountingLedgerLine | null {
  return entry.lines?.find((line) => line.cashbox_id || line.cashbox?.id)
    ?? entry.lines?.find((line) => line.account?.code === '1000')
    ?? entry.lines?.[0]
    ?? null;
}

function lineBalanceDelta(line: AccountingLedgerLine): number {
  const base = Number(line.base_amount ?? line.amount);
  return Number(line.debit) > 0 ? base : -base;
}

export function buildAccountingEntryTableRows(
  entries: AccountingLedgerEntry[],
  options: { partyUserId?: number; cashboxMode?: boolean },
): AccountingEntryTableRow[] {
  const pickLine = (entry: AccountingLedgerEntry) => {
    if (options.partyUserId) return pickPartyLine(entry, options.partyUserId);
    if (options.cashboxMode) return pickCashboxLine(entry);
    return entry.lines?.[0] ?? null;
  };

  const chronological = [...entries].sort((a, b) => {
    const dateA = new Date(a.entry_date).getTime();
    const dateB = new Date(b.entry_date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return a.id - b.id;
  });

  const balanceByEntryId = new Map<number, number>();
  let running = 0;
  for (const entry of chronological) {
    const line = pickLine(entry);
    if (line) running += lineBalanceDelta(line);
    balanceByEntryId.set(entry.id, running);
  }

  return entries.map((entry, index) => ({
    entry,
    rowNumber: index + 1,
    line: pickLine(entry),
    runningBalance: balanceByEntryId.get(entry.id) ?? 0,
  }));
}
