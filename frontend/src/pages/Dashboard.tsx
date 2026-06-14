import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import PropertyCard from '../components/PropertyCard';
import { getLocalizedText } from '../utils/translatable';
import type { PricingPlan } from '../components/admin/PricingPlanModal';

interface Property {
  id: number;
  title: Record<string, string>;
  price: number;
  location: string;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  is_featured: boolean;
  is_approved: boolean;
  images: { id: number; image_path: string; is_primary: boolean }[];
  user: { id: number; name: string };
}

interface Favorite {
  id: number;
  property: Property;
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'profile' | 'properties' | 'favorites' | 'billing'>(() =>
    location.pathname === '/my-properties' ? 'properties' : 'profile'
  );
  const [subscription, setSubscription] = useState<{
    plan: PricingPlan;
    properties_used: number;
    max_properties: number | null;
    can_feature: boolean;
    boost_price: number;
  } | null>(null);
  const [payments, setPayments] = useState<{ id: number; type: string; amount: number; paid_at: string; description: string }[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingAction, setBillingAction] = useState(false);
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'properties') {
          const { data } = await api.get('/my-properties');
          setMyProperties(data.data || []);
        } else if (activeTab === 'favorites') {
          const { data } = await api.get('/favorites');
          setFavorites(data.data || []);
        } else if (activeTab === 'billing') {
          setBillingLoading(true);
          const [subRes, payRes, propsRes] = await Promise.all([
            api.get('/subscription'),
            api.get('/payments'),
            api.get('/my-properties'),
          ]);
          setSubscription(subRes.data);
          setPayments(payRes.data.data || []);
          setMyProperties(propsRes.data.data || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
        setBillingLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleCancelSubscription = async () => {
    if (!confirm(t('billing.confirmCancel'))) return;
    setBillingAction(true);
    try {
      const { data } = await api.delete('/subscription');
      setSubscription(data.summary);
      setMessage(t('billing.cancelSuccess'));
    } catch {
      setMessage(t('common.error'));
    } finally {
      setBillingAction(false);
    }
  };

  const handleBoost = async (propertyId: number) => {
    if (!confirm(t('billing.confirmBoost', { price: subscription?.boost_price?.toFixed(2) }))) return;
    try {
      await api.post(`/properties/${propertyId}/boost`);
      setMessage(t('billing.boostSuccess'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage(msg || t('common.error'));
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const { data } = await api.put('/user', profileData);
      useAuthStore.getState().setUser(data);
      setMessage('Profile updated successfully!');
    } catch {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'properties' as const, label: t('nav.myProperties'), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'favorites' as const, label: t('nav.favorites'), icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { id: 'billing' as const, label: t('billing.title'), icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full min-w-0 max-w-full overflow-x-hidden">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
        {t('nav.dashboard')}
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <span className="text-xl text-blue-600 dark:text-blue-400 font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/properties/new"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('property.addProperty')}
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Profile Settings</h2>

              {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  message.includes('successfully')
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.name')}</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.email')}</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.phone')}</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition"
                >
                  {saving ? t('common.loading') : t('common.save')}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'properties' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('nav.myProperties')}</h2>
                <Link
                  to="/properties/new"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-1 w-full sm:w-auto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('property.addProperty')}
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64 animate-pulse"></div>
                  ))}
                </div>
              ) : myProperties.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">{t('property.noProperties')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {myProperties.map((property) => (
                    <div key={property.id} className="relative group">
                      <PropertyCard property={property} />
                      <div className="absolute top-3 right-12 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10">
                        <Link
                          to={`/properties/${property.id}/edit`}
                          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition border border-gray-200 dark:border-gray-700"
                          title={t('property.editProperty')}
                        >
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('billing.title')}</h2>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.includes('success') || message.includes(t('billing.boostSuccess')) || message.includes(t('billing.cancelSuccess'))
                    ? 'bg-green-50 text-green-600 border border-green-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              {billingLoading ? (
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              ) : subscription ? (
                <>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500">{t('billing.currentPlan')}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {getLocalizedText(subscription.plan.name, i18n.language)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          ${Number(subscription.plan.price).toFixed(2)}/
                          {subscription.plan.billing_period === 'yearly' ? t('admin.yearly') : t('admin.monthly')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link to="/pricing" className="btn-primary text-sm py-2 px-4">
                          {t('billing.upgrade')}
                        </Link>
                        {Number(subscription.plan.price) > 0 && (
                          <button
                            onClick={handleCancelSubscription}
                            disabled={billingAction}
                            className="btn-outline text-sm py-2 px-4 text-red-600 border-red-300"
                          >
                            {t('billing.cancel')}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xs text-gray-500">{t('billing.listingsUsed')}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {subscription.properties_used}
                          {subscription.max_properties != null ? ` / ${subscription.max_properties}` : ` (${t('admin.unlimited')})`}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xs text-gray-500">{t('billing.featuredListings')}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {subscription.can_feature ? t('billing.included') : t('billing.notIncluded')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {myProperties.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('billing.boostListings')}</h3>
                      <div className="space-y-3">
                        {myProperties.map((property) => (
                          <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="text-sm text-gray-900 dark:text-white truncate">
                              {getLocalizedText(property.title, i18n.language)}
                            </span>
                            <button
                              onClick={() => handleBoost(property.id)}
                              className="text-sm px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium"
                            >
                              {t('billing.boost')} (${subscription.boost_price?.toFixed(2)})
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('billing.paymentHistory')}</h3>
                    {payments.length === 0 ? (
                      <p className="text-gray-500 text-sm">{t('billing.noPayments')}</p>
                    ) : (
                      <div className="space-y-2">
                        {payments.map((payment) => (
                          <div key={payment.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{payment.type}</p>
                              <p className="text-xs text-gray-500">{payment.description}</p>
                            </div>
                            <div className="text-end">
                              <p className="font-semibold text-green-600">${Number(payment.amount).toFixed(2)}</p>
                              <p className="text-xs text-gray-500">
                                {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">{t('common.error')}</p>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('nav.favorites')}</h2>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64 animate-pulse"></div>
                  ))}
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">No favorites yet</p>
                  <Link to="/properties" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
                    Browse properties
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {favorites.map((fav) => (
                    <PropertyCard key={fav.id} property={fav.property} isFavorite />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
