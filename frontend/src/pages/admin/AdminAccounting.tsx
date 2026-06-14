import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import LedgerEntryModal from '../../components/admin/LedgerEntryModal';
import TranslatableField from '../../components/TranslatableField';
import { getLocalizedText, emptyTranslations, fromTranslations } from '../../utils/translatable';
import { formatMoney } from '../../utils/formatMoney';
import type { CurrencyCashboxSummary, LedgerPartiesData } from '../../utils/accounting';
import { formatBalanceCell, getBalanceForCurrency } from '../../utils/accounting';
import type { Translations } from '../../utils/translatable';

type Tab = 'overview' | 'currencies' | 'cashboxes' | 'ledger' | 'profit';

interface Currency {
  id: number;
  code: string;
  symbol: string;
  name: Translations;
  decimal_places: number;
  is_default: boolean;
  is_active: boolean;
  exchange_rates?: { rate_to_base: number; effective_date: string }[];
}

interface OverviewData {
  default_currency?: Currency;
  total_cash_balance: number;
  net_profit: number;
  total_income: number;
  total_expenses: number;
  monthly_profit: { month: string; income: number; expenses: number; profit: number }[];
}

interface ProfitData {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  currency?: Currency;
  income_by_account: { id: number; code: string; name: Translations; total: number }[];
  expenses_by_account: { id: number; code: string; name: Translations; total: number }[];
}

const TABS: Tab[] = ['overview', 'currencies', 'cashboxes', 'ledger', 'profit'];

export default function AdminAccounting() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as Tab | null;
  const [tab, setTab] = useState<Tab>(tabFromUrl && TABS.includes(tabFromUrl) ? tabFromUrl : 'overview');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currencySummaries, setCurrencySummaries] = useState<CurrencyCashboxSummary[]>([]);
  const [cashboxDefaultSymbol, setCashboxDefaultSymbol] = useState('$');
  const [ledgerParties, setLedgerParties] = useState<LedgerPartiesData | null>(null);
  const [profit, setProfit] = useState<ProfitData | null>(null);

  const [currencyModal, setCurrencyModal] = useState<Currency | null | 'new'>(null);
  const [ledgerModal, setLedgerModal] = useState(false);
  const [rateModal, setRateModal] = useState<Currency | null>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const { data } = await api.get('/admin/accounting/overview');
        setOverview(data);
      } else if (tab === 'currencies') {
        const { data } = await api.get('/admin/accounting/currencies');
        setCurrencies(data || []);
      } else if (tab === 'cashboxes') {
        const { data } = await api.get('/admin/accounting/cashboxes/by-currency');
        setCurrencySummaries(data?.currencies || []);
        setCashboxDefaultSymbol(data?.default_currency?.symbol || '$');
      } else if (tab === 'ledger') {
        const [currenciesRes, partiesRes] = await Promise.all([
          api.get('/admin/accounting/currencies'),
          api.get('/admin/accounting/ledger/parties'),
        ]);
        setCurrencies(currenciesRes.data || []);
        setLedgerParties(partiesRes.data || null);
      } else if (tab === 'profit') {
        const { data } = await api.get('/admin/accounting/reports/profit-loss');
        setProfit(data);
      }
    } catch {
      showMessage(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [tab, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (tabFromUrl && TABS.includes(tabFromUrl)) setTab(tabFromUrl);
  }, [tabFromUrl]);

  const defaultSymbol = overview?.default_currency?.symbol || profit?.currency?.symbol || ledgerParties?.default_currency?.symbol || '$';

  const tabLabels: Record<Tab, string> = {
    overview: t('accounting.overview'),
    currencies: t('accounting.currencies'),
    cashboxes: t('accounting.cashboxes'),
    ledger: t('accounting.ledger'),
    profit: t('accounting.profit'),
  };

  return (
    <AdminLayout
      title={t('accounting.title')}
      subtitle={t('accounting.subtitle')}
      message={message || undefined}
    >
      {/* Help box */}
      <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
        <p className="font-semibold mb-1">{t('accounting.helpTitle')}</p>
        <p>{t('accounting.helpText')}</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((id) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === id
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white'
            }`}
          >
            {tabLabels[id]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
        </div>
      ) : (
        <>
          {tab === 'overview' && overview && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label={t('accounting.totalCash')} value={formatMoney(overview.total_cash_balance, defaultSymbol)} color="blue" />
                <StatCard label={t('accounting.netProfit')} value={formatMoney(overview.net_profit, defaultSymbol)} color="green" />
                <StatCard label={t('accounting.totalIncome')} value={formatMoney(overview.total_income, defaultSymbol)} color="emerald" />
                <StatCard label={t('accounting.totalExpenses')} value={formatMoney(overview.total_expenses, defaultSymbol)} color="red" />
              </div>
              {overview.monthly_profit?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="font-semibold mb-4">{t('accounting.monthlyProfit')}</h3>
                  <div className="space-y-2">
                    {overview.monthly_profit.map((m) => (
                      <div key={m.month} className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700">
                        <span>{m.month}</span>
                        <span className={m.profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {formatMoney(m.profit, defaultSymbol)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'currencies' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setCurrencyModal('new')} className="btn-primary text-sm">{t('accounting.addCurrency')}</button>
              </div>
              {currencies.length === 0 ? (
                <EmptyState text={t('accounting.noCurrencies')} action={() => setCurrencyModal('new')} actionLabel={t('accounting.addCurrency')} />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-start">{t('accounting.code')}</th>
                        <th className="px-4 py-3 text-start">{t('accounting.name')}</th>
                        <th className="px-4 py-3 text-start">{t('accounting.symbol')}</th>
                        <th className="px-4 py-3 text-start">{t('accounting.rateToBase')}</th>
                        <th className="px-4 py-3 text-start">{t('property.status')}</th>
                        <th className="px-4 py-3 text-end">{t('admin.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-900 dark:text-gray-100">
                      {currencies.map((c) => (
                        <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700">
                          <td className="px-4 py-3 font-mono font-semibold">{c.code}{c.is_default && <span className="ms-2 text-xs text-blue-600 dark:text-blue-400">({t('accounting.default')})</span>}</td>
                          <td className="px-4 py-3">{getLocalizedText(c.name, i18n.language)}</td>
                          <td className="px-4 py-3">{c.symbol}</td>
                          <td className="px-4 py-3">{c.exchange_rates?.[0]?.rate_to_base ?? (c.is_default ? 1 : '—')}</td>
                          <td className="px-4 py-3">{c.is_active ? t('admin.active') : t('admin.inactive')}</td>
                          <td className="px-4 py-3 text-end space-x-2">
                            <button onClick={() => setRateModal(c)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-xs">{t('accounting.setRate')}</button>
                            <button onClick={() => setCurrencyModal(c)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xs">{t('admin.edit')}</button>
                            {!c.is_default && (
                              <button onClick={async () => { if (!confirm(t('accounting.confirmDeleteCurrency'))) return; await api.delete(`/admin/accounting/currencies/${c.id}`); showMessage(t('accounting.currencyDeleted')); fetchData(); }} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-xs">{t('admin.delete')}</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'cashboxes' && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('accounting.cashboxCurrencyHint')}</p>
              {currencySummaries.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">{t('accounting.noCashboxes')}</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-start">{t('accounting.code')}</th>
                        <th className="px-4 py-3 text-start">{t('accounting.name')}</th>
                        <th className="px-4 py-3 text-end">{t('accounting.totalBalance')}</th>
                        <th className="px-4 py-3 text-end">{t('accounting.balanceInBase')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-900 dark:text-gray-100">
                      {currencySummaries.map((row) => (
                        <tr key={row.currency.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3">
                            <Link to={`/admin/accounting/cashboxes/${row.currency.id}`} className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                              {row.currency.code}
                            </Link>
                          </td>
                          <td className="px-4 py-3">{getLocalizedText(row.currency.name, i18n.language)}</td>
                          <td className="px-4 py-3 text-end font-semibold">
                            {formatMoney(row.total_balance, row.currency.symbol, row.currency.decimal_places)}
                          </td>
                          <td className="px-4 py-3 text-end text-gray-500 dark:text-gray-400">
                            {formatMoney(row.total_balance_in_base, cashboxDefaultSymbol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'ledger' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setLedgerModal(true)} className="btn-primary text-sm">{t('accounting.addEntry')}</button>
              </div>
              {!ledgerParties || ledgerParties.parties.length === 0 ? (
                <EmptyState text={t('accounting.noEntries')} action={() => setLedgerModal(true)} actionLabel={t('accounting.addEntry')} />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-start">{t('accounting.name')}</th>
                        <th className="px-4 py-3 text-start">{t('accounting.partyType')}</th>
                        {(ledgerParties.currencies || []).map((currency) => (
                          <th key={currency.id} className="px-4 py-3 text-end">{currency.code}</th>
                        ))}
                        <th className="px-4 py-3 text-end">{t('accounting.balanceInBase')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-900 dark:text-gray-100">
                      {ledgerParties.parties.map((party) => (
                        <tr key={party.user.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3">
                            <Link to={`/admin/accounting/ledger/parties/${party.user.id}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                              {party.user.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3">{party.party_type === 'agent' ? t('admin.agents') : t('admin.customers')}</td>
                          {(ledgerParties.currencies || []).map((currency) => (
                            <td key={currency.id} className="px-4 py-3 text-end font-semibold">
                              {formatBalanceCell(
                                getBalanceForCurrency(party.balances_by_currency, currency.id),
                                currency.symbol,
                                currency.decimal_places,
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-end text-gray-500 dark:text-gray-400">
                            {formatMoney(party.balance_in_base, defaultSymbol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-900 font-semibold text-gray-900 dark:text-gray-100">
                      <tr className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-3" colSpan={2}>{t('accounting.totalBalance')}</td>
                        {(ledgerParties.currencies || []).map((currency) => (
                          <td key={currency.id} className="px-4 py-3 text-end">
                            {formatBalanceCell(
                              ledgerParties.totals_by_currency?.[currency.id],
                              currency.symbol,
                              currency.decimal_places,
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-end">{formatMoney(ledgerParties.total_balance, defaultSymbol)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'profit' && profit && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label={t('accounting.totalIncome')} value={formatMoney(profit.total_income, defaultSymbol)} color="emerald" />
                <StatCard label={t('accounting.totalExpenses')} value={formatMoney(profit.total_expenses, defaultSymbol)} color="red" />
                <StatCard label={t('accounting.netProfit')} value={formatMoney(profit.net_profit, defaultSymbol)} color={profit.net_profit >= 0 ? 'green' : 'red'} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AccountBreakdown title={t('accounting.incomeBreakdown')} items={profit.income_by_account} symbol={defaultSymbol} lang={i18n.language} />
                <AccountBreakdown title={t('accounting.expenseBreakdown')} items={profit.expenses_by_account} symbol={defaultSymbol} lang={i18n.language} />
              </div>
            </div>
          )}
        </>
      )}

      {currencyModal && (
        <CurrencyModal
          currency={currencyModal === 'new' ? null : currencyModal}
          onClose={() => setCurrencyModal(null)}
          onSuccess={(msg) => { showMessage(msg); setCurrencyModal(null); fetchData(); }}
        />
      )}
      {rateModal && (
        <RateModal
          currency={rateModal}
          onClose={() => setRateModal(null)}
          onSuccess={(msg) => { showMessage(msg); setRateModal(null); fetchData(); }}
        />
      )}
      {ledgerModal && (
        <LedgerEntryModal
          currencies={currencies}
          onClose={() => setLedgerModal(false)}
          onSuccess={(msg) => { showMessage(msg); setLedgerModal(false); fetchData(); }}
        />
      )}
    </AdminLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    emerald: 'bg-emerald-600',
    red: 'bg-red-600',
  };
  return (
    <div className={`${colors[color] || colors.blue} rounded-xl p-5 text-white`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-extrabold mt-1">{value}</p>
    </div>
  );
}

function EmptyState({ text, action, actionLabel }: { text: string; action: () => void; actionLabel: string }) {
  return (
    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <p className="text-gray-500 mb-4">{text}</p>
      <button onClick={action} className="btn-primary">{actionLabel}</button>
    </div>
  );
}

function AccountBreakdown({ title, items, symbol, lang }: { title: string; items: { code: string; name: Translations; total: number }[]; symbol: string; lang: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      {items.length === 0 ? <p className="text-sm text-gray-500">—</p> : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 dark:border-gray-700">
              <span>{item.code} {getLocalizedText(item.name, lang)}</span>
              <span className="font-semibold">{formatMoney(Number(item.total), symbol)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CurrencyModal({ currency, onClose, onSuccess }: { currency: Currency | null; onClose: () => void; onSuccess: (msg: string) => void }) {
  const { t } = useTranslation();
  const [code, setCode] = useState(currency?.code || '');
  const [symbol, setSymbol] = useState(currency?.symbol || '');
  const [name, setName] = useState<Translations>(currency ? fromTranslations(currency.name) : emptyTranslations());
  const [decimalPlaces, setDecimalPlaces] = useState(currency?.decimal_places ?? 2);
  const [isDefault, setIsDefault] = useState(currency?.is_default ?? false);
  const [isActive, setIsActive] = useState(currency?.is_active ?? true);
  const [rateToBase, setRateToBase] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { code, symbol, name, decimal_places: decimalPlaces, is_default: isDefault, is_active: isActive, rate_to_base: rateToBase ? Number(rateToBase) : undefined };
      if (currency) {
        await api.put(`/admin/accounting/currencies/${currency.id}`, payload);
        onSuccess(t('accounting.currencyUpdated'));
      } else {
        await api.post('/admin/accounting/currencies', payload);
        onSuccess(t('accounting.currencyCreated'));
      }
    } catch {
      onSuccess(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={currency ? t('accounting.editCurrency') : t('accounting.addCurrency')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('accounting.code')}</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={3} required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="USD" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('accounting.symbol')}</label>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="$" />
          </div>
        </div>
        <TranslatableField label={t('accounting.name')} value={name} onChange={setName} required />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('accounting.decimalPlaces')}</label>
            <input type="number" min={0} max={4} value={decimalPlaces} onChange={(e) => setDecimalPlaces(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          {!currency && (
            <div>
              <label className="block text-sm font-medium mb-1">{t('accounting.rateToBase')}</label>
              <input type="number" step="any" min={0} value={rateToBase} onChange={(e) => setRateToBase(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="1.0" />
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />{t('accounting.setAsDefault')}</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />{t('admin.active')}</label>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-outline">{t('common.cancel')}</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? t('common.loading') : t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
}

function RateModal({ currency, onClose, onSuccess }: { currency: Currency; onClose: () => void; onSuccess: (msg: string) => void }) {
  const { t } = useTranslation();
  const [rate, setRate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/accounting/exchange-rates', { currency_id: currency.id, rate_to_base: Number(rate), effective_date: date });
      onSuccess(t('accounting.rateUpdated'));
    } catch {
      onSuccess(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`${t('accounting.setRate')} — ${currency.code}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">{t('accounting.rateHelp')}</p>
        <div>
          <label className="block text-sm font-medium mb-1">{t('accounting.rateToBase')}</label>
          <input type="number" step="any" min={0} value={rate} onChange={(e) => setRate(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('accounting.effectiveDate')}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-outline">{t('common.cancel')}</button>
          <button type="submit" disabled={saving} className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
