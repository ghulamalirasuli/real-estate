import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { getLocalizedText } from '../../utils/translatable';

interface Property {
  id: number;
  title: Record<string, string>;
  price: number;
  location: string;
  is_approved: boolean;
  user: { id: number; name: string };
}

export default function AdminProperties() {
  const { t, i18n } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/properties');
      setProperties(data.data || []);
    } catch {
      setMessage(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleApprove = async (id: number) => {
    await api.put(`/admin/properties/${id}/approve`);
    showMessage(t('admin.approve') + '!');
    fetchProperties();
  };

  const handleReject = async (id: number) => {
    await api.put(`/admin/properties/${id}/reject`);
    showMessage(t('admin.reject') + '!');
    fetchProperties();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.confirmDeleteProperty'))) return;
    await api.delete(`/admin/properties/${id}`);
    showMessage(t('admin.propertyDeleted'));
    fetchProperties();
  };

  const addPropertyButton = (
    <Link to="/properties/new" className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {t('property.addProperty')}
    </Link>
  );

  const PropertyActions = ({ p }: { p: Property }) => (
    <div className="flex flex-wrap gap-2">
      {!p.is_approved && (
        <>
          <button onClick={() => handleApprove(p.id)} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg">{t('admin.approve')}</button>
          <button onClick={() => handleReject(p.id)} className="px-3 py-1.5 bg-yellow-600 text-white text-xs rounded-lg">{t('admin.reject')}</button>
        </>
      )}
      <button onClick={() => handleDelete(p.id)} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg">{t('admin.delete')}</button>
    </div>
  );

  return (
    <AdminLayout
      title={t('admin.properties')}
      subtitle={t('admin.propertiesSubtitle')}
      message={message || undefined}
      actions={addPropertyButton}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 sm:p-8 animate-pulse space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />)}
          </div>
        ) : properties.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500 mb-4">{t('property.noProperties')}</p>
            <Link to="/properties/new" className="btn-primary inline-flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('property.addProperty')}
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {properties.map((p) => (
                <div key={p.id} className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{getLocalizedText(p.title, i18n.language)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.location}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-500">{t('admin.owner')}: <span className="text-gray-900 dark:text-white">{p.user?.name}</span></span>
                    <span className="font-semibold text-blue-600">${Number(p.price).toLocaleString()}</span>
                  </div>
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${p.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.is_approved ? t('admin.approvedProperties') : t('admin.pendingProperties')}
                  </span>
                  <PropertyActions p={p} />
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-start px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                    <th className="text-start px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('admin.owner')}</th>
                    <th className="text-start px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('property.price')}</th>
                    <th className="text-start px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-end px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {properties.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">{getLocalizedText(p.title, i18n.language)}</span>
                        <p className="text-xs text-gray-500">{p.location}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p.user?.name}</td>
                      <td className="px-6 py-4 text-sm font-medium">${Number(p.price).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${p.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.is_approved ? t('admin.approvedProperties') : t('admin.pendingProperties')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          <PropertyActions p={p} />
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
    </AdminLayout>
  );
}
