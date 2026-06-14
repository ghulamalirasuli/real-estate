import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import CashboxModal from '../../components/admin/CashboxModal';
import AccountingRecordsFilter from '../../components/admin/AccountingRecordsFilter';
import AccountingEntryTable from '../../components/admin/AccountingEntryTable';
import LedgerEntryEditModal from '../../components/admin/LedgerEntryEditModal';
import { formatMoney } from '../../utils/formatMoney';
import { exportAccountingRecordsPdf, printAccountingRecords } from '../../utils/accountingExport';
import {
  emptyAccountingRecordFilters,
  getCashboxLabel,
  type AccountingCurrency,
  type AccountingLedgerEntry,
  type AccountingRecordFilters,
  type Cashbox,
} from '../../utils/accounting';
import { getLocalizedText } from '../../utils/translatable';

export default function AdminCashboxCurrencyDetail() {
  const { currencyId } = useParams<{ currencyId: string }>();
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [currency, setCurrency] = useState<AccountingCurrency | null>(null);
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [defaultSymbol, setDefaultSymbol] = useState('$');
  const [cashboxModal, setCashboxModal] = useState<Cashbox | null | 'new'>(null);
  const [entries, setEntries] = useState<AccountingLedgerEntry[]>([]);
  const [filters, setFilters] = useState<AccountingRecordFilters>(emptyAccountingRecordFilters());
  const [dataReady, setDataReady] = useState(false);
  const [editEntry, setEditEntry] = useState<AccountingLedgerEntry | null>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const fetchData = useCallback(async () => {
    if (!currencyId) return;
    setLoading(true);
    try {
      const [cashboxRes, currencyRes, summaryRes] = await Promise.all([
        api.get('/admin/accounting/cashboxes', { params: { currency_id: currencyId } }),
        api.get('/admin/accounting/currencies'),
        api.get('/admin/accounting/cashboxes/by-currency'),
      ]);
      setCashboxes(cashboxRes.data || []);
      const allCurrencies: AccountingCurrency[] = currencyRes.data || [];
      setCurrency(allCurrencies.find((c) => c.id === Number(currencyId)) || null);
      setDefaultSymbol(summaryRes.data?.default_currency?.symbol || '$');
    } catch {
      showMessage(t('common.error'));
    } finally {
      setLoading(false);
      setDataReady(true);
    }
  }, [currencyId, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchRecords = useCallback(async () => {
    if (!currencyId || !dataReady) return;
    setRecordsLoading(true);
    try {
      const params: Record<string, string | number> = { filtered: 1 };
      if (filters.currency_id) params.currency_id = filters.currency_id;
      if (filters.cashbox_id) params.cashbox_id = filters.cashbox_id;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.status) params.status = filters.status;

      const { data } = await api.get(`/admin/accounting/cashboxes/currency/${currencyId}/entries`, { params });
      setEntries(data.data || []);
    } catch {
      showMessage(t('common.error'));
    } finally {
      setRecordsLoading(false);
    }
  }, [currencyId, dataReady, filters, t]);

  useEffect(() => {
    if (!dataReady) return;
    const timer = setTimeout(() => { fetchRecords(); }, 300);
    return () => clearTimeout(timer);
  }, [dataReady, filters, fetchRecords]);

  const totalBalance = cashboxes.reduce((sum, cb) => sum + Number(cb.current_balance), 0);
  const totalBase = cashboxes.reduce((sum, cb) => sum + Number(cb.balance_in_base), 0);
  const symbol = currency?.symbol || '$';
  const currencyLabel = currency ? `${currency.code} (${getLocalizedText(currency.name, i18n.language)})` : '';

  const filterSummary = [
    filters.cashbox_id && cashboxes.find((cb) => String(cb.id) === filters.cashbox_id)?.description,
    filters.from && `${t('accounting.dateFrom')}: ${filters.from}`,
    filters.to && `${t('accounting.dateTo')}: ${filters.to}`,
    filters.status && t(`accounting.status${filters.status.charAt(0).toUpperCase()}${filters.status.slice(1)}` as 'accounting.statusConfirmed'),
  ].filter(Boolean).join(' · ');

  const exportMeta = {
    title: currencyLabel || t('accounting.cashboxes'),
    subtitle: t('accounting.cashboxRecordsSubtitle'),
    filterSummary: filterSummary || undefined,
  };

  const exportOptions = { cashboxMode: true as const, defaultSymbol };

  const handleDeleteEntry = async (entry: AccountingLedgerEntry) => {
    if (!confirm(t('accounting.confirmDeleteEntry'))) return;
    try {
      await api.delete(`/admin/accounting/ledger-entries/${entry.id}`);
      showMessage(t('accounting.entryDeleted'));
      fetchData();
      fetchRecords();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showMessage(msg || t('common.error'));
    }
  };

  return (
    <AdminLayout
      title={currencyLabel || t('accounting.cashboxes')}
      subtitle={t('accounting.cashboxRecordsSubtitle')}
      message={message || undefined}
      actions={
        <Link to="/admin/accounting?tab=cashboxes" className="btn-outline text-sm">
          ← {t('accounting.backToCurrencies')}
        </Link>
      }
    >
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setCashboxModal('new')} className="btn-primary text-sm">{t('accounting.addCashbox')}</button>
          </div>

          {cashboxes.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
              <p className="text-gray-500 dark:text-gray-400 mb-4">{t('accounting.noCashboxes')}</p>
              <button onClick={() => setCashboxModal('new')} className="btn-primary">{t('accounting.addCashbox')}</button>
            </div>
          ) : (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-start">{t('accounting.name')}</th>
                    <th className="px-4 py-3 text-end">{t('accounting.debit')}</th>
                    <th className="px-4 py-3 text-end">{t('accounting.credit')}</th>
                    <th className="px-4 py-3 text-end">{t('accounting.balance')}</th>
                    <th className="px-4 py-3 text-end">{t('accounting.balanceInBase')}</th>
                    <th className="px-4 py-3 text-end">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900 dark:text-gray-100">
                  {cashboxes.map((cb) => (
                    <tr key={cb.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{getCashboxLabel(cb, i18n.language)}</p>
                        {!cb.is_active && <span className="text-xs text-gray-500">{t('admin.inactive')}</span>}
                      </td>
                      <td className="px-4 py-3 text-end">{formatMoney(cb.opening_debit, symbol, currency?.decimal_places)}</td>
                      <td className="px-4 py-3 text-end">{formatMoney(cb.opening_credit, symbol, currency?.decimal_places)}</td>
                      <td className="px-4 py-3 text-end font-semibold text-blue-600 dark:text-blue-400">
                        {formatMoney(cb.current_balance, symbol, currency?.decimal_places)}
                      </td>
                      <td className="px-4 py-3 text-end text-gray-500 dark:text-gray-400">
                        {formatMoney(cb.balance_in_base, defaultSymbol)}
                      </td>
                      <td className="px-4 py-3 text-end space-x-2">
                        <button onClick={() => setCashboxModal(cb)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xs">{t('admin.edit')}</button>
                        <button
                          onClick={async () => {
                            if (!confirm(t('accounting.confirmDeleteCashbox'))) return;
                            await api.delete(`/admin/accounting/cashboxes/${cb.id}`);
                            showMessage(t('accounting.cashboxDeleted'));
                            fetchData();
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-xs"
                        >
                          {t('admin.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-900 font-semibold text-gray-900 dark:text-gray-100">
                  <tr className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3" colSpan={3}>{t('accounting.totalBalance')}</td>
                    <td className="px-4 py-3 text-end">{formatMoney(totalBalance, symbol, currency?.decimal_places)}</td>
                    <td className="px-4 py-3 text-end">{formatMoney(totalBase, defaultSymbol)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <AccountingRecordsFilter
            filters={filters}
            onChange={setFilters}
            currencies={currency ? [currency] : []}
            cashboxes={cashboxes}
            showCashbox
            loading={recordsLoading}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => printAccountingRecords(exportMeta, entries, t, i18n.language, exportOptions)}
                  disabled={entries.length === 0}
                  className="btn-outline text-sm disabled:opacity-50"
                >
                  {t('accounting.print')}
                </button>
                <button
                  type="button"
                  onClick={() => exportAccountingRecordsPdf(exportMeta, entries, t, i18n.language, exportOptions)}
                  disabled={entries.length === 0}
                  className="btn-outline text-sm disabled:opacity-50"
                >
                  {t('accounting.exportPdf')}
                </button>
              </>
            }
          />

          <AccountingEntryTable
            entries={entries}
            emptyMessage={recordsLoading ? t('common.loading') : t('accounting.noEntries')}
            defaultSymbol={defaultSymbol}
            cashboxMode
            onEdit={setEditEntry}
            onDelete={handleDeleteEntry}
          />
        </>
      )}

      {editEntry && (
        <LedgerEntryEditModal
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSuccess={(msg) => {
            showMessage(msg);
            setEditEntry(null);
            fetchData();
            fetchRecords();
          }}
        />
      )}

      {cashboxModal && currency && (
        <CashboxModal
          cashbox={cashboxModal === 'new' ? null : cashboxModal}
          currencies={[currency]}
          presetCurrencyId={currency.id}
          lockCurrency
          onClose={() => setCashboxModal(null)}
          onSuccess={(msg) => { showMessage(msg); setCashboxModal(null); fetchData(); }}
        />
      )}
    </AdminLayout>
  );
}
