import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import TranslatableField from '../TranslatableField';
import { emptyTranslations, fromTranslations, type Translations } from '../../utils/translatable';

export interface PricingPlan {
  id: number;
  name: Record<string, string>;
  description?: Record<string, string>;
  price: number;
  billing_period: string;
  max_properties: number | null;
  featured_listings: boolean;
  is_active: boolean;
  sort_order: number;
  features?: Record<string, string>[];
}

interface Props {
  plan?: PricingPlan | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function PricingPlanModal({ plan, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const isEdit = !!plan;

  const [name, setName] = useState<Translations>(fromTranslations(plan?.name));
  const [description, setDescription] = useState<Translations>(fromTranslations(plan?.description));
  const [price, setPrice] = useState(plan ? String(plan.price) : '');
  const [billingPeriod, setBillingPeriod] = useState(plan?.billing_period || 'monthly');
  const [maxProperties, setMaxProperties] = useState(plan?.max_properties != null ? String(plan.max_properties) : '');
  const [featuredListings, setFeaturedListings] = useState(plan?.featured_listings ?? false);
  const [isActive, setIsActive] = useState(plan?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(plan ? String(plan.sort_order) : '0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      name,
      description,
      price: parseFloat(price),
      billing_period: billingPeriod,
      max_properties: maxProperties ? parseInt(maxProperties, 10) : null,
      featured_listings: featuredListings,
      is_active: isActive,
      sort_order: parseInt(sortOrder, 10) || 0,
    };

    try {
      if (isEdit) {
        await api.put(`/admin/pricing-plans/${plan!.id}`, payload);
        onSuccess(t('admin.planUpdated'));
      } else {
        await api.post('/admin/pricing-plans', payload);
        onSuccess(t('admin.planCreated'));
      }
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const data = axiosErr.response?.data;
      if (data?.errors) {
        setError(Object.values(data.errors).flat().join('\n'));
      } else {
        setError(data?.message || t('common.error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? t('admin.editPlan') : t('admin.createPlan')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          <TranslatableField label={t('admin.planName')} value={name} onChange={setName} required />
          <TranslatableField label={t('admin.planDescription')} value={description} onChange={setDescription} multiline rows={2} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('property.price')} ($)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.billingPeriod')}</label>
              <select
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="monthly">{t('admin.monthly')}</option>
                <option value="yearly">{t('admin.yearly')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.maxProperties')}</label>
              <input
                type="number"
                value={maxProperties}
                onChange={(e) => setMaxProperties(e.target.value)}
                min="0"
                placeholder={t('admin.unlimited')}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.sortOrder')}</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                min="0"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={featuredListings} onChange={(e) => setFeaturedListings(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('admin.featuredListings')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('admin.active')}</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline">{t('common.cancel')}</button>
            <button type="submit" disabled={submitting} className="flex-1 btn-primary disabled:opacity-50">
              {submitting ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
