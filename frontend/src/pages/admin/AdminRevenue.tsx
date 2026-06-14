import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

interface RevenueData {
  total_revenue: number;
  revenue_by_type: { subscription: number; boost: number; lead: number };
  active_subscriptions: number;
  total_leads: number;
  recent_payments: {
    id: number;
    type: string;
    amount: number;
    description: string;
    paid_at: string;
    user?: { name: string; email: string };
  }[];
  monthly_revenue: { month: string; total: number }[];
}

export default function AdminRevenue() {
  const { t } = useTranslation();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/revenue')
      .then(({ data: res }) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const typeLabels: Record<string, string> = {
    subscription: t('billing.typeSubscription'),
    boost: t('billing.typeBoost'),
    lead: t('billing.typeLead'),
  };

  return (
    <AdminLayout title={t('admin.revenue')} subtitle={t('admin.revenueSubtitle')}>
      {loading ? (
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: t('admin.totalRevenue'), value: `$${data.total_revenue.toFixed(2)}`, accent: 'border-l-green-500' },
              { label: t('admin.activeSubscriptions'), value: data.active_subscriptions, accent: 'border-l-blue-500' },
              { label: t('admin.totalLeads'), value: data.total_leads, accent: 'border-l-purple-500' },
              { label: t('billing.typeSubscription'), value: `$${data.revenue_by_type.subscription.toFixed(2)}`, accent: 'border-l-indigo-500' },
            ].map((card) => (
              <div key={card.label} className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 border-l-4 ${card.accent} shadow-sm`}>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('admin.revenueByType')}</h3>
              <div className="space-y-4">
                {Object.entries(data.revenue_by_type).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{typeLabels[type] || type}</span>
                    <span className="font-bold text-gray-900 dark:text-white">${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('admin.monthlyRevenue')}</h3>
              {data.monthly_revenue.length === 0 ? (
                <p className="text-gray-500 text-sm">{t('admin.noPayments')}</p>
              ) : (
                <div className="space-y-3">
                  {data.monthly_revenue.map((row) => (
                    <div key={row.month} className="flex items-center gap-4">
                      <span className="w-20 text-sm text-gray-600 dark:text-gray-400">{row.month}</span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-green-600 rounded-full h-2.5"
                          style={{ width: `${data.total_revenue ? (row.total / data.total_revenue) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="font-bold text-sm w-16 text-end">${row.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('admin.recentPayments')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-start text-gray-500">{t('admin.user')}</th>
                    <th className="px-6 py-3 text-start text-gray-500">{t('billing.paymentType')}</th>
                    <th className="px-6 py-3 text-start text-gray-500">{t('property.price')}</th>
                    <th className="px-6 py-3 text-start text-gray-500">{t('billing.paidAt')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.recent_payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">{t('admin.noPayments')}</td>
                    </tr>
                  ) : (
                    data.recent_payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900 dark:text-white">{payment.user?.name}</p>
                          <p className="text-xs text-gray-500">{payment.user?.email}</p>
                        </td>
                        <td className="px-6 py-4 capitalize">{typeLabels[payment.type] || payment.type}</td>
                        <td className="px-6 py-4 font-semibold text-green-600">${Number(payment.amount).toFixed(2)}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-red-500">{t('common.error')}</p>
      )}
    </AdminLayout>
  );
}
