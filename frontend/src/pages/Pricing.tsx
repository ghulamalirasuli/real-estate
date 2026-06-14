import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { getLocalizedText } from '../utils/translatable';
import type { PricingPlan } from '../components/admin/PricingPlanModal';

export default function Pricing() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [leadPrice, setLeadPrice] = useState(4.99);
  const [boostPrice, setBoostPrice] = useState(9.99);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/pricing-plans')
      .then(({ data }) => {
        setPlans(data.plans || []);
        setLeadPrice(data.lead_price ?? 4.99);
        setBoostPrice(data.boost_price ?? 9.99);
      })
      .catch(() => setMessage(t('common.error')))
      .finally(() => setLoading(false));
  }, [t]);

  const handleSubscribe = async (planId: number) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }

    setSubscribing(planId);
    setMessage('');
    try {
      await api.post('/subscription', { pricing_plan_id: planId });
      setMessage(t('billing.subscribeSuccess'));
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage(msg || t('common.error'));
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('billing.pricingTitle')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t('billing.pricingSubtitle')}
        </p>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-xl text-sm text-center border ${
          message.includes(t('billing.subscribeSuccess'))
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, idx) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 p-8 shadow-sm flex flex-col ${
                idx === 1 ? 'border-blue-500 scale-[1.02] shadow-lg' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {idx === 1 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                  {t('billing.mostPopular')}
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {getLocalizedText(plan.name, i18n.language)}
              </h3>
              <p className="text-sm text-gray-500 mt-2 mb-6">
                {getLocalizedText(plan.description, i18n.language)}
              </p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-blue-600">
                  ${Number(plan.price).toFixed(2)}
                </span>
                <span className="text-gray-500 text-sm">
                  /{plan.billing_period === 'yearly' ? t('admin.yearly') : t('admin.monthly')}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {plan.max_properties != null
                  ? `${t('admin.maxProperties')}: ${plan.max_properties}`
                  : t('admin.unlimited')}
              </p>
              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-3 mb-8 flex-1">
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
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribing === plan.id}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  idx === 1 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'btn-outline'
                }`}
              >
                {subscribing === plan.id ? t('common.loading') : Number(plan.price) === 0 ? t('billing.startFree') : t('billing.subscribe')}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('billing.forAgents')}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{t('billing.forAgentsDesc')}</p>
          <p className="text-2xl font-bold text-blue-600">${boostPrice.toFixed(2)}</p>
          <p className="text-sm text-gray-500">{t('billing.boostDesc')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('billing.forCustomers')}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{t('billing.forCustomersDesc')}</p>
          <p className="text-2xl font-bold text-green-600">${leadPrice.toFixed(2)}</p>
          <p className="text-sm text-gray-500">{t('billing.leadDesc')}</p>
        </div>
      </div>

      <div className="text-center mt-10">
        <Link to="/properties" className="text-blue-600 hover:text-blue-700 font-medium">
          {t('home.browseProperties')} →
        </Link>
      </div>
    </div>
  );
}
