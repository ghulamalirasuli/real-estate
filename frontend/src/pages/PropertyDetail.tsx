import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import MapView from '../components/MapView';

interface Property {
  id: number;
  title: Record<string, string>;
  description: Record<string, string>;
  price: number;
  location: string;
  latitude: number;
  longitude: number;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  is_featured: boolean;
  is_approved: boolean;
  images: { id: number; image_path: string; is_primary: boolean }[];
  user: { id: number; name: string; email: string; phone?: string };
  favorites_count: number;
}

export default function PropertyDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [message, setMessage] = useState('');
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [leadPrice, setLeadPrice] = useState(4.99);
  const [unlocking, setUnlocking] = useState(false);
  const [contactError, setContactError] = useState('');

  const lang = i18n.language;

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await api.get(`/properties/${id}`);
        setProperty(data);
        setContactUnlocked(!!data.contact_unlocked);
        setLeadPrice(data.lead_price ?? 4.99);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();

    // Check if favorited
    if (isAuthenticated) {
      api.get('/favorites').then(({ data }) => {
        const favs = data.data || [];
        setIsFavorite(favs.some((f: { property_id?: number; property?: { id: number } }) => f.property_id === Number(id) || f.property?.id === Number(id)));
      }).catch(() => {});

      api.get(`/properties/${id}/contact`).then(({ data }) => {
        setContactUnlocked(data.contact_unlocked);
        setLeadPrice(data.lead_price ?? 4.99);
        if (data.contact_unlocked && data.agent) {
          setProperty((prev) => prev ? { ...prev, user: { ...prev.user, ...data.agent } } : prev);
        }
      }).catch(() => {});
    }
  }, [id, isAuthenticated]);

  const handleFavorite = async () => {
    if (!isAuthenticated) return;
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${id}`);
        setIsFavorite(false);
      } else {
        await api.post('/favorites', { property_id: id });
        setIsFavorite(true);
      }
    } catch {
      // ignore
    }
  };

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;

    setUnlocking(true);
    setContactError('');
    try {
      const { data } = await api.post(`/properties/${id}/contact`, { message });
      setContactUnlocked(true);
      if (data.agent && property) {
        setProperty({ ...property, user: { ...property.user, ...data.agent } });
      }
      setMessage('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setContactError(msg || t('common.error'));
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-96 mb-6"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">{t('property.noProperties')}</p>
        <Link to="/properties" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          ← {t('common.back')}
        </Link>
      </div>
    );
  }

  const allImages = property.images?.length
    ? property.images.map((img) => `/storage/${img.image_path}`)
    : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-blue-600">{t('nav.home')}</Link>
        <span>/</span>
        <Link to="/properties" className="hover:text-blue-600">{t('nav.properties')}</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">{property.title?.[lang] || property.title?.en}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Image Gallery */}
        <div className="lg:col-span-2">
          <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 h-96 mb-4">
            <img
              src={allImages[activeImage]}
              alt={property.title?.[lang] || property.title?.en}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80'; }}
            />
            {property.is_featured && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-yellow-500 text-white text-sm font-semibold rounded-lg">
                {t('property.featured')}
              </span>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                    idx === activeImage ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=120&q=80'; }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('property.details')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {property.description?.[lang] || property.description?.en || 'No description available.'}
            </p>
          </div>

          {/* Location Map */}
          {property.latitude && property.longitude && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
              </h2>
              <MapView
                latitude={property.latitude}
                longitude={property.longitude}
                height="350px"
                zoom={15}
              />
              <p className="text-xs text-gray-400 mt-2">
                {property.location} — {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price & Title */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {property.title?.[lang] || property.title?.en}
            </h1>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
              ${Number(property.price).toLocaleString()}
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {property.location}
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  property.status === 'sale'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {property.status === 'sale' ? t('property.sale') : t('property.rent')}
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize">
                  {t(`property.${property.type}`)}
                </span>
              </div>
            </div>

            <hr className="my-4 border-gray-200 dark:border-gray-700" />

            <div className="grid grid-cols-2 gap-4">
              {property.type !== 'land' && (
                <>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{property.bedrooms}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('property.bedrooms')}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{property.bathrooms}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('property.bathrooms')}</p>
                  </div>
                </>
              )}
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{property.area}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('property.sqm')}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-lg font-bold text-gray-900 dark:text-white">${Number(property.price).toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('property.price')}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              {isAuthenticated && (
                <button
                  onClick={handleFavorite}
                  className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    isFavorite
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`}
                    fill={isFavorite ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isFavorite ? t('property.removeFromFavorites') : t('property.addToFavorites')}
                </button>
              )}

              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-center"
                >
                  {t('property.contactAgent')}
                </Link>
              ) : contactUnlocked ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">{t('billing.contactUnlocked')}</p>
                  {property.user?.email && (
                    <a href={`mailto:${property.user.email}`} className="block text-sm text-blue-600 hover:underline">
                      {property.user.email}
                    </a>
                  )}
                  {property.user?.phone && (
                    <a href={`tel:${property.user.phone}`} className="block text-sm text-blue-600 hover:underline mt-1">
                      {property.user.phone}
                    </a>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowContact(!showContact)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  {t('property.contactAgent')} — ${leadPrice.toFixed(2)}
                </button>
              )}
            </div>

            {/* Contact Form / Pay to unlock */}
            {showContact && !contactUnlocked && isAuthenticated && (
              <form onSubmit={handleContact} className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {t('billing.leadPaywall', { price: leadPrice.toFixed(2), name: property.user?.name })}
                </p>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('billing.yourMessage')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder={t('billing.messagePlaceholder')}
                />
                {contactError && <p className="text-red-500 text-sm mt-2">{contactError}</p>}
                <button
                  type="submit"
                  disabled={unlocking}
                  className="mt-3 w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg text-sm transition"
                >
                  {unlocking ? t('common.loading') : t('billing.payAndUnlock', { price: leadPrice.toFixed(2) })}
                </button>
              </form>
            )}

            {/* Agent Info (name only until unlocked) */}
            {property.user && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {property.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{property.user.name}</p>
                    {contactUnlocked && property.user.phone && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{property.user.phone}</p>
                    )}
                    {!contactUnlocked && (
                      <p className="text-xs text-gray-400">{t('billing.contactHidden')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sidebar Mini Map */}
            {property.latitude && property.longitude && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t('property.location')}
                </h3>
                <MapView
                  latitude={property.latitude}
                  longitude={property.longitude}
                  height="150px"
                  zoom={14}
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
