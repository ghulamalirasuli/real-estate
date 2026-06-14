import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../utils/formatMoney';
import { buildAccountingEntryTableRows, formatReferenceNo } from '../../utils/accountingEntryTable';
import type { AccountingLedgerEntry } from '../../utils/accounting';

interface Props {
  entries: AccountingLedgerEntry[];
  emptyMessage: string;
  defaultSymbol?: string;
  partyUserId?: number;
  cashboxMode?: boolean;
  onEdit?: (entry: AccountingLedgerEntry) => void;
  onDelete?: (entry: AccountingLedgerEntry) => void;
}

export default function AccountingEntryTable({
  entries,
  emptyMessage,
  defaultSymbol = '$',
  partyUserId,
  cashboxMode,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  const rows = buildAccountingEntryTableRows(entries, { partyUserId, cashboxMode });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto accounting-records-print">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
          <tr>
            <th className="px-4 py-3 text-start">#</th>
            <th className="px-4 py-3 text-start">{t('accounting.entryDate')}</th>
            <th className="px-4 py-3 text-start">{t('accounting.insertedBy')}</th>
            <th className="px-4 py-3 text-start">{t('accounting.referenceNo')}</th>
            <th className="px-4 py-3 text-start">{t('accounting.description')}</th>
            <th className="px-4 py-3 text-end">{t('accounting.debit')}</th>
            <th className="px-4 py-3 text-end">{t('accounting.credit')}</th>
            <th className="px-4 py-3 text-end">{t('accounting.balance')}</th>
            <th className="px-4 py-3 text-end">{t('admin.actions')}</th>
          </tr>
        </thead>
        <tbody className="text-gray-900 dark:text-gray-100">
          {rows.map(({ entry, rowNumber, line, runningBalance }) => {
            const symbol = line?.currency?.symbol || defaultSymbol;
            const debit = Number(line?.debit) > 0 ? formatMoney(Number(line?.amount), symbol) : '—';
            const credit = Number(line?.credit) > 0 ? formatMoney(Number(line?.amount), symbol) : '—';

            return (
              <tr key={entry.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3">{rowNumber}</td>
                <td className="px-4 py-3 whitespace-nowrap">{String(entry.entry_date).slice(0, 10)}</td>
                <td className="px-4 py-3">{entry.creator?.name || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{formatReferenceNo(entry)}</td>
                <td className="px-4 py-3">{entry.description?.trim() || t('accounting.noDescription')}</td>
                <td className="px-4 py-3 text-end text-green-600">{debit}</td>
                <td className="px-4 py-3 text-end text-red-600">{credit}</td>
                <td className="px-4 py-3 text-end font-semibold">{formatMoney(runningBalance, defaultSymbol)}</td>
                <td className="px-4 py-3 text-end space-x-2 whitespace-nowrap">
                  {onEdit && (
                    <button type="button" onClick={() => onEdit(entry)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs">
                      {t('admin.edit')}
                    </button>
                  )}
                  {onDelete && (
                    <button type="button" onClick={() => onDelete(entry)} className="text-red-600 dark:text-red-400 hover:underline text-xs">
                      {t('admin.delete')}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
