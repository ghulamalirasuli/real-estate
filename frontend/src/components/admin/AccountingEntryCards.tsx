import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../utils/formatMoney';
import { getLocalizedText } from '../../utils/translatable';
import type { AccountingLedgerEntry } from '../../utils/accounting';

const STATUS_CLASS: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

interface Props {
  entries: AccountingLedgerEntry[];
  emptyMessage: string;
}

export default function AccountingEntryCards({ entries, emptyMessage }: Props) {
  const { t, i18n } = useTranslation();

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 accounting-records-print">
      {entries.map((entry) => (
        <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-start mb-2 gap-3">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {entry.description?.trim() || t('accounting.noDescription')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{entry.entry_date} · #{entry.id}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded font-medium shrink-0 ${STATUS_CLASS[entry.status || 'confirmed']}`}>
              {t(`accounting.status${(entry.status || 'confirmed').charAt(0).toUpperCase()}${(entry.status || 'confirmed').slice(1)}` as 'accounting.statusConfirmed')}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            {entry.lines?.map((line) => (
              <div key={line.id} className="flex justify-between py-1 border-t border-gray-50 dark:border-gray-700">
                <span className="text-gray-700 dark:text-gray-300">
                  {line.user
                    ? `${line.user.name} (${line.user.role === 'agent' ? t('admin.agents') : t('admin.customers')})`
                    : line.cashbox?.description
                      ? line.cashbox.description
                      : line.account
                        ? `${line.account.code} ${typeof line.account.name === 'string' ? line.account.name : getLocalizedText(line.account.name, i18n.language)}`
                        : '—'}
                </span>
                <span>
                  {line.debit > 0 && <span className="text-green-600">Dr {formatMoney(line.amount, line.currency?.symbol)}</span>}
                  {line.credit > 0 && <span className="text-red-600">Cr {formatMoney(line.amount, line.currency?.symbol)}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
