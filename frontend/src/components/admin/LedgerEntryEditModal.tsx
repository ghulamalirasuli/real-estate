import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import type { AccountingLedgerEntry, LedgerEntryStatus } from '../../utils/accounting';

interface Props {
  entry: AccountingLedgerEntry;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function LedgerEntryEditModal({ entry, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const [description, setDescription] = useState(entry.description || '');
  const [entryDate, setEntryDate] = useState(String(entry.entry_date).slice(0, 10));
  const [status, setStatus] = useState<LedgerEntryStatus>(entry.status || 'confirmed');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/accounting/ledger-entries/${entry.id}`, {
        description,
        entry_date: entryDate,
        status,
      });
      onSuccess(t('accounting.entryUpdated'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onSuccess(msg || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('accounting.editEntry')}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('accounting.entryDate')}</label>
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('accounting.description')}</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder={t('accounting.descriptionOptional')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('property.status')}</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as LedgerEntryStatus)} className="input-field">
              <option value="confirmed">{t('accounting.statusConfirmed')}</option>
              <option value="pending">{t('accounting.statusPending')}</option>
              <option value="cancelled">{t('accounting.statusCancelled')}</option>
            </select>
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
