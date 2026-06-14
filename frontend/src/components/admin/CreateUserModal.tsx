import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface Props {
  role: 'user' | 'agent';
  user?: User | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function CreateUserModal({ role, user, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const isEdit = !!user;

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role,
      };
      if (form.password) payload.password = form.password;

      if (isEdit) {
        await api.put(`/admin/users/${user!.id}`, payload);
        onSuccess(t('admin.userUpdated'));
      } else {
        if (!form.password) {
          setError(t('admin.passwordRequired'));
          setSubmitting(false);
          return;
        }
        await api.post('/admin/users', payload);
        onSuccess(role === 'agent' ? t('admin.agentCreated') : t('admin.customerCreated'));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? t('admin.editUser') : role === 'agent' ? t('admin.createAgent') : t('admin.createCustomer')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.name')}</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.phone')}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.password')} {!isEdit && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!isEdit}
              minLength={8}
              placeholder={isEdit ? t('admin.passwordOptional') : ''}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={submitting} className="flex-1 btn-primary disabled:opacity-50">
              {submitting ? t('common.loading') : isEdit ? t('common.save') : t('admin.createUser')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
