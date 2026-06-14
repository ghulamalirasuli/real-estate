import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import PricingPlanModal, { type PricingPlan } from '../../components/admin/PricingPlanModal';
import { getLocalizedText } from '../../utils/translatable';

export default function AdminPricing() {
  const { t, i18n } = useTranslation();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [planModal, setPlanModal] = useState<PricingPlan | null | 'new'>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/pricing-plans');
      setPlans(data || []);
    } catch {
      setMessage(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.confirmDeletePlan'))) return;
    await api.delete(`/admin/pricing-plans/${id}`);
    showMessage(t('admin.planDeleted'));
    fetchPlans();
  };

  return (
    <AdminLayout title={t('admin.pricing')} subtitle={t('admin.pricingSubtitle')} message={message || undefined}>
      <div className="flex justify-end mb-6">
        <button onClick={() => setPlanModal('new')} className="btn-primary flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('admin.createPlan')}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 mb-4">{t('admin.noPlans')}</p>
          <button onClick={() => setPlanModal('new')} className="btn-primary">{t('admin.createPlan')}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 p-6 shadow-sm ${plan.is_active ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700 opacity-80'}`}>
              {!plan.is_active && (
                <span className="absolute top-4 end-4 px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">{t('admin.inactive')}</span>
              )}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{getLocalizedText(plan.name, i18n.language)}</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">{getLocalizedText(plan.description, i18n.language)}</p>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-blue-600">${Number(plan.price).toFixed(2)}</span>
                <span className="text-gray-500 text-sm">/{plan.billing_period === 'yearly' ? t('admin.yearly') : t('admin.monthly')}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {plan.max_properties != null ? `${t('admin.maxProperties')}: ${plan.max_properties}` : t('admin.unlimited')}
              </p>
              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {getLocalizedText(f, i18n.language)}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <button onClick={() => setPlanModal(plan)} className="flex-1 btn-outline text-sm py-2">{t('admin.edit')}</button>
                <button onClick={() => handleDelete(plan.id)} className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50">{t('admin.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {planModal && (
        <PricingPlanModal
          plan={planModal === 'new' ? null : planModal}
          onClose={() => setPlanModal(null)}
          onSuccess={(msg) => { showMessage(msg); fetchPlans(); }}
        />
      )}
    </AdminLayout>
  );
}
