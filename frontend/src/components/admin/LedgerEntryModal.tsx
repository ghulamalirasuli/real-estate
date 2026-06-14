import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import type { AccountingCurrency } from '../../utils/accounting';

interface LineDraft {
  party_type: '' | 'agent' | 'customer';
  user_id: string;
  currency_id: string;
  side: 'debit' | 'credit';
  amount: string;
}

interface PartyUser {
  id: number;
  name: string;
}

interface Props {
  currencies: AccountingCurrency[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
  presetParty?: { party_type: 'agent' | 'customer'; user_id: number; user_name: string };
  lockParty?: boolean;
}

const emptyLine = (currencies: AccountingCurrency[], preset?: Props['presetParty']): LineDraft => ({
  party_type: preset?.party_type || '',
  user_id: preset ? String(preset.user_id) : '',
  currency_id: String(currencies[0]?.id || ''),
  side: 'debit',
  amount: '',
});

export default function LedgerEntryModal({ currencies, onClose, onSuccess, presetParty, lockParty }: Props) {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [line, setLine] = useState<LineDraft>(emptyLine(currencies, presetParty));
  const [agents, setAgents] = useState<PartyUser[]>([]);
  const [customers, setCustomers] = useState<PartyUser[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lockParty && presetParty) return;
    Promise.all([
      api.get('/admin/users', { params: { role: 'agent', per_page: 100 } }),
      api.get('/admin/users', { params: { role: 'user', per_page: 100 } }),
    ]).then(([agentRes, customerRes]) => {
      setAgents(agentRes.data?.data || []);
      setCustomers(customerRes.data?.data || []);
    }).catch(() => {});
  }, [lockParty, presetParty]);

  const updateLine = (field: keyof LineDraft, value: string) => {
    setLine((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'party_type') next.user_id = '';
      return next;
    });
  };

  const partyList = (type: string) => (type === 'agent' ? agents : type === 'customer' ? customers : []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        entry_date: entryDate,
        description,
        lines: [{
          party_type: line.party_type || null,
          user_id: line.user_id ? Number(line.user_id) : null,
          cashbox_id: null,
          currency_id: Number(line.currency_id),
          debit: line.side === 'debit' ? Number(line.amount) : 0,
          credit: line.side === 'credit' ? Number(line.amount) : 0,
          amount: Number(line.amount),
        }],
      };
      await api.post('/admin/accounting/ledger-entries', payload);
      onSuccess(t('accounting.entryCreated'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onSuccess(msg || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('accounting.addEntry')}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('accounting.entryDate')}</label>
              <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('accounting.description')}</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder={t('accounting.descriptionOptional')} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {lockParty && presetParty ? (
              <div className="col-span-2 flex items-center px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                {presetParty.user_name} ({presetParty.party_type === 'agent' ? t('admin.agents') : t('admin.customers')})
              </div>
            ) : (
              <>
                <select value={line.party_type} onChange={(e) => updateLine('party_type', e.target.value)} className="input-field text-sm">
                  <option value="">{t('accounting.partyType')}</option>
                  <option value="agent">{t('admin.agents')}</option>
                  <option value="customer">{t('admin.customers')}</option>
                </select>
                <select value={line.user_id} onChange={(e) => updateLine('user_id', e.target.value)} disabled={!line.party_type} className="input-field text-sm" required={!!line.party_type}>
                  <option value="">{t('accounting.selectName')}</option>
                  {partyList(line.party_type).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </>
            )}
            <select value={line.currency_id} onChange={(e) => updateLine('currency_id', e.target.value)} required className="input-field text-sm">
              {currencies.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
            <select value={line.side} onChange={(e) => updateLine('side', e.target.value)} className="input-field text-sm">
              <option value="debit">{t('accounting.debit')}</option>
              <option value="credit">{t('accounting.credit')}</option>
            </select>
            <input type="number" step="0.01" min="0.01" value={line.amount} onChange={(e) => updateLine('amount', e.target.value)} required placeholder={t('accounting.amount')} className="input-field text-sm" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn-outline">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? t('common.loading') : t('common.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
