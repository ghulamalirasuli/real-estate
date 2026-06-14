import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import CreateUserModal from '../../components/admin/CreateUserModal';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  properties_count?: number;
}

interface Props {
  role: 'user' | 'agent';
}

export default function AdminUserList({ role }: Props) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [modal, setModal] = useState<{ user?: User } | null>(null);

  const isCustomers = role === 'user';
  const title = isCustomers ? t('admin.customers') : t('admin.agents');
  const subtitle = isCustomers ? t('admin.customersSubtitle') : t('admin.agentsSubtitle');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { role } });
      setUsers(data.data || []);
    } catch {
      setMessage(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [role, t]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm(t('admin.confirmDeleteUser'))) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      showMessage(t('admin.userDeleted'));
      fetchUsers();
    } catch {
      showMessage(t('common.error'));
    }
  };

  const createButton = (
    <button onClick={() => setModal({})} className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {isCustomers ? t('admin.createCustomer') : t('admin.createAgent')}
    </button>
  );

  return (
    <AdminLayout title={title} subtitle={subtitle} message={message || undefined} actions={createButton}>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 sm:p-8 animate-pulse space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500 mb-4">{isCustomers ? t('admin.noCustomers') : t('admin.noAgents')}</p>
            <button onClick={() => setModal({})} className="btn-primary text-sm">
              {isCustomers ? t('admin.createCustomer') : t('admin.createAgent')}
            </button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-sm font-semibold text-blue-600 flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 text-sm text-gray-500">
                    <span>{user.phone || '—'}</span>
                    <span>{user.properties_count || 0} {t('admin.properties').toLowerCase()}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setModal({ user })} className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 border border-blue-200 dark:border-blue-800 rounded-lg">
                      {t('admin.edit')}
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="flex-1 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 dark:border-red-800 rounded-lg">
                      {t('admin.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-start px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('auth.name')}</th>
                    <th className="text-start px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('auth.email')}</th>
                    <th className="text-start px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('auth.phone')}</th>
                    <th className="text-start px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('admin.properties')}</th>
                    <th className="text-end px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-sm font-semibold text-blue-600">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.phone || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.properties_count || 0}</td>
                      <td className="px-6 py-4 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setModal({ user })} className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                            {t('admin.edit')}
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            {t('admin.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {modal && (
        <CreateUserModal
          role={role}
          user={modal.user}
          onClose={() => setModal(null)}
          onSuccess={(msg) => { showMessage(msg); fetchUsers(); }}
        />
      )}
    </AdminLayout>
  );
}
