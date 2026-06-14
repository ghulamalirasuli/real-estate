import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import AccountingRecordsFilter from '../../components/admin/AccountingRecordsFilter';
import AccountingEntryTable from '../../components/admin/AccountingEntryTable';
import LedgerEntryModal from '../../components/admin/LedgerEntryModal';
import LedgerEntryEditModal from '../../components/admin/LedgerEntryEditModal';
import { formatMoney } from '../../utils/formatMoney';
import { exportAccountingRecordsPdf, printAccountingRecords } from '../../utils/accountingExport';
import {
  emptyAccountingRecordFilters,
  formatBalanceCell,
  getBalanceForCurrency,
  type AccountingCurrency,
  type AccountingLedgerEntry,
  type AccountingRecordFilters,
  type CurrencyBalance,
} from '../../utils/accounting';

interface PartyUser {
  id: number;
  name: string;
  role?: string;
}

interface PartySummary {
  user: PartyUser;
  party_type: 'agent' | 'customer';
  currencies?: AccountingCurrency[];
  balances_by_currency: CurrencyBalance[];
  balance_in_base: number;
  default_currency?: AccountingCurrency;
}

export default function AdminLedgerPartyDetail() {
  const { userId } = useParams<{ userId: string }>();
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [summary, setSummary] = useState<PartySummary | null>(null);
  const [allCurrencies, setAllCurrencies] = useState<AccountingCurrency[]>([]);
  const [entries, setEntries] = useState<AccountingLedgerEntry[]>([]);
  const [filters, setFilters] = useState<AccountingRecordFilters>(emptyAccountingRecordFilters());
  const [ledgerModal, setLedgerModal] = useState(false);
  const [editEntry, setEditEntry] = useState<AccountingLedgerEntry | null>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const fetchSummary = useCallback(async () => {
    if (!userId) return;
    setSummaryLoading(true);
    try {
      const [summaryRes, currenciesRes] = await Promise.all([
        api.get(`/admin/accounting/ledger/parties/${userId}`),
        api.get('/admin/accounting/currencies'),
      ]);
      setSummary(summaryRes.data);
      setAllCurrencies(currenciesRes.data || []);
    } catch {
      showMessage(t('common.error'));
    } finally {
      setSummaryLoading(false);
    }
  }, [userId, t]);

  const fetchRecords = useCallback(async () => {
    if (!userId || !summary) return;
    setRecordsLoading(true);
    try {
      const params: Record<string, string | number> = { filtered: 1 };
      if (filters.currency_id) params.currency_id = filters.currency_id;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.status) params.status = filters.status;

      const { data } = await api.get(`/admin/accounting/ledger/parties/${userId}`, { params });
      setEntries(data.entries?.data || []);
    } catch {
      showMessage(t('common.error'));
    } finally {
      setRecordsLoading(false);
    }
  }, [userId, summary, filters, t]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  useEffect(() => {
    if (!summary) return;
    const timer = setTimeout(() => { fetchRecords(); }, 300);
    return () => clearTimeout(timer);
  }, [summary, filters, fetchRecords]);

  const defaultSymbol = summary?.default_currency?.symbol || '$';
  const partyLabel = summary
    ? `${summary.user.name} (${summary.party_type === 'agent' ? t('admin.agents') : t('admin.customers')})`
    : '';

  const filterSummary = [
    filters.currency_id && summary?.currencies?.find((c) => String(c.id) === filters.currency_id)?.code,
    filters.from && `${t('accounting.dateFrom')}: ${filters.from}`,
    filters.to && `${t('accounting.dateTo')}: ${filters.to}`,
    filters.status && t(`accounting.status${filters.status.charAt(0).toUpperCase()}${filters.status.slice(1)}` as 'accounting.statusConfirmed'),
  ].filter(Boolean).join(' · ');

  const exportMeta = {
    title: partyLabel || t('accounting.ledger'),
    subtitle: t('accounting.partyRecordsSubtitle'),
    filterSummary: filterSummary || undefined,
  };

  const handleEntryCreated = (msg: string) => {
    showMessage(msg);
    setLedgerModal(false);
    fetchSummary();
    fetchRecords();
  };

  const handleDeleteEntry = async (entry: AccountingLedgerEntry) => {
    if (!confirm(t('accounting.confirmDeleteEntry'))) return;
    try {
      await api.delete(`/admin/accounting/ledger-entries/${entry.id}`);
      showMessage(t('accounting.entryDeleted'));
      fetchSummary();
      fetchRecords();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showMessage(msg || t('common.error'));
    }
  };

  const exportOptions = summary ? { partyUserId: summary.user.id, defaultSymbol } : { defaultSymbol };

  return (
    <AdminLayout
      title={partyLabel || t('accounting.ledger')}
      subtitle={t('accounting.partyRecordsSubtitle')}
      message={message || undefined}
      actions={
        <Link to="/admin/accounting?tab=ledger" className="btn-outline text-sm">
          ← {t('accounting.backToLedger')}
        </Link>
      }
    >
      {summaryLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
        </div>
      ) : summary ? (
        <>
          {summary.currencies && summary.currencies.length > 0 && (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
                  <tr>
                    {summary.currencies.map((currency) => (
                      <th key={currency.id} className="px-4 py-3 text-end">{currency.code}</th>
                    ))}
                    <th className="px-4 py-3 text-end">{t('accounting.balanceInBase')}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900 dark:text-gray-100">
                  <tr>
                    {summary.currencies.map((currency) => (
                      <td key={currency.id} className="px-4 py-3 text-end font-semibold">
                        {formatBalanceCell(
                          getBalanceForCurrency(summary.balances_by_currency, currency.id),
                          currency.symbol,
                          currency.decimal_places,
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-end font-semibold">
                      {formatMoney(summary.balance_in_base, defaultSymbol)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <AccountingRecordsFilter
            filters={filters}
            onChange={setFilters}
            currencies={summary.currencies}
            loading={recordsLoading}
            actions={
              <>
                <button type="button" onClick={() => setLedgerModal(true)} className="btn-primary text-sm">
                  {t('accounting.addEntry')}
                </button>
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
            partyUserId={summary.user.id}
            onEdit={setEditEntry}
            onDelete={handleDeleteEntry}
          />
        </>
      ) : (
        <p className="text-red-500">{t('common.error')}</p>
      )}

      {editEntry && (
        <LedgerEntryEditModal
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSuccess={(msg) => {
            showMessage(msg);
            setEditEntry(null);
            fetchSummary();
            fetchRecords();
          }}
        />
      )}

      {ledgerModal && summary && (
        <LedgerEntryModal
          currencies={allCurrencies}
          presetParty={{
            party_type: summary.party_type,
            user_id: summary.user.id,
            user_name: summary.user.name,
          }}
          lockParty
          onClose={() => setLedgerModal(false)}
          onSuccess={handleEntryCreated}
        />
      )}
    </AdminLayout>
  );
}
