import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

interface DashboardStats {
  total_users: number;
  total_properties: number;
  approved_properties: number;
  pending_properties: number;
  users_by_role: Record<string, number>;
  total_revenue?: number;
  active_subscriptions?: number;
  total_leads?: number;
}

export default function AdminOverview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title={t('admin.dashboard')} subtitle={t('admin.panelSubtitle')}>
      {loading ? (
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: t('admin.totalRevenue'), value: `$${(stats.total_revenue ?? 0).toFixed(2)}`, accent: 'border-l-green-500' },
              { label: t('admin.activeSubscriptions'), value: stats.active_subscriptions ?? 0, accent: 'border-l-blue-500' },
              { label: t('admin.totalLeads'), value: stats.total_leads ?? 0, accent: 'border-l-purple-500' },
              { label: t('admin.totalUsers'), value: stats.total_users, accent: 'border-l-indigo-500' },
              { label: t('admin.totalProperties'), value: stats.total_properties, accent: 'border-l-indigo-500' },
              { label: t('admin.approvedProperties'), value: stats.approved_properties, accent: 'border-l-green-500' },
              { label: t('admin.pendingProperties'), value: stats.pending_properties, accent: 'border-l-yellow-500' },
            ].map((card) => (
              <div key={card.label} className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 border-l-4 ${card.accent} shadow-sm`}>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('admin.usersByRole')}</h3>
            <div className="space-y-4">
              {Object.entries(stats.users_by_role).map(([role, count]) => (
                <div key={role} className="flex items-center gap-4">
                  <span className="w-20 text-sm capitalize font-medium text-gray-600 dark:text-gray-400">{role}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 rounded-full h-2.5 transition-all"
                      style={{ width: `${stats.total_users ? (count / stats.total_users) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white w-8 text-end">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-red-500">{t('common.error')}</p>
      )}
    </AdminLayout>
  );
}
