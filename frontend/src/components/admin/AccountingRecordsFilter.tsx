import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { getCashboxLabel, type AccountingCurrency, type AccountingRecordFilters, type Cashbox } from '../../utils/accounting';

interface Props {
  filters: AccountingRecordFilters;
  onChange: (filters: AccountingRecordFilters) => void;
  currencies?: AccountingCurrency[];
  cashboxes?: Cashbox[];
  showCurrency?: boolean;
  showCashbox?: boolean;
  loading?: boolean;
  actions?: ReactNode;
}

export default function AccountingRecordsFilter({
  filters,
  onChange,
  currencies = [],
  cashboxes = [],
  showCurrency = true,
  showCashbox = false,
  loading = false,
  actions,
}: Props) {
  const { t, i18n } = useTranslation();

  const update = (field: keyof AccountingRecordFilters, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {t('accounting.filterRecords')}
          {loading && <span className="ms-2 text-xs font-normal text-gray-500">{t('common.loading')}</span>}
        </p>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {showCurrency && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('accounting.currency')}</label>
            <select value={filters.currency_id} onChange={(e) => update('currency_id', e.target.value)} className="input-field text-sm">
              <option value="">{t('accounting.allCurrencies')}</option>
              {currencies.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </div>
        )}
        {showCashbox && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('accounting.cashbox')}</label>
            <select value={filters.cashbox_id} onChange={(e) => update('cashbox_id', e.target.value)} className="input-field text-sm">
              <option value="">{t('accounting.allCashboxes')}</option>
              {cashboxes.map((cb) => <option key={cb.id} value={cb.id}>{getCashboxLabel(cb, i18n.language)}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('accounting.dateFrom')}</label>
          <input type="date" value={filters.from} onChange={(e) => update('from', e.target.value)} className="input-field text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('accounting.dateTo')}</label>
          <input type="date" value={filters.to} onChange={(e) => update('to', e.target.value)} className="input-field text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('property.status')}</label>
          <select value={filters.status} onChange={(e) => update('status', e.target.value)} className="input-field text-sm">
            <option value="">{t('accounting.allStatuses')}</option>
            <option value="confirmed">{t('accounting.statusConfirmed')}</option>
            <option value="pending">{t('accounting.statusPending')}</option>
            <option value="cancelled">{t('accounting.statusCancelled')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
