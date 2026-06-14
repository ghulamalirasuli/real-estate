import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import type { AccountingCurrency, Cashbox } from '../../utils/accounting';

interface Props {
  cashbox: Cashbox | null;
  currencies: AccountingCurrency[];
  presetCurrencyId?: number;
  lockCurrency?: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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

export default function CashboxModal({ cashbox, currencies: currenciesProp, presetCurrencyId, lockCurrency, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const [currencies, setCurrencies] = useState<AccountingCurrency[]>(currenciesProp);
  const [description, setDescription] = useState(cashbox?.description || '');
  const [currencyId, setCurrencyId] = useState(cashbox?.currency_id || presetCurrencyId || currenciesProp[0]?.id || '');
  const [openingDebit, setOpeningDebit] = useState(cashbox?.opening_debit ?? 0);
  const [openingCredit, setOpeningCredit] = useState(cashbox?.opening_credit ?? 0);
  const [isActive, setIsActive] = useState(cashbox?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currenciesProp.length === 0) {
      api.get('/admin/accounting/currencies').then(({ data }) => {
        setCurrencies(data || []);
        if (!cashbox && !presetCurrencyId && data?.[0]) setCurrencyId(data[0].id);
      });
    } else {
      setCurrencies(currenciesProp);
    }
  }, [currenciesProp, cashbox, presetCurrencyId]);

  useEffect(() => {
    if (presetCurrencyId && !cashbox) setCurrencyId(presetCurrencyId);
  }, [presetCurrencyId, cashbox]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        description,
        currency_id: currencyId,
        opening_debit: openingDebit,
        opening_credit: openingCredit,
        is_active: isActive,
      };
      if (cashbox) {
        await api.put(`/admin/accounting/cashboxes/${cashbox.id}`, payload);
        onSuccess(t('accounting.cashboxUpdated'));
      } else {
        await api.post('/admin/accounting/cashboxes', payload);
        onSuccess(t('accounting.cashboxCreated'));
      }
    } catch {
      onSuccess(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={cashbox ? t('accounting.editCashbox') : t('accounting.addCashbox')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('accounting.description')}</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input-field resize-none" placeholder={t('accounting.cashboxDescriptionHint')} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('accounting.currency')}</label>
          <select
            value={currencyId}
            onChange={(e) => setCurrencyId(Number(e.target.value))}
            required
            disabled={lockCurrency}
            className="input-field"
          >
            <option value="">{t('accounting.selectCurrency')}</option>
            {currencies.map((c) => <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('accounting.debit')}</label>
            <input type="number" step="0.01" min={0} value={openingDebit} onChange={(e) => setOpeningDebit(Number(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('accounting.credit')}</label>
            <input type="number" step="0.01" min={0} value={openingCredit} onChange={(e) => setOpeningCredit(Number(e.target.value))} className="input-field" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          {t('admin.active')}
        </label>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-outline">{t('common.cancel')}</button>
          <button type="submit" disabled={saving} className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
}
