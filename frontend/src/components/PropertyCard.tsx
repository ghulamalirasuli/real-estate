import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useCompareStore } from '../store/compareStore';
import api from '../services/api';
import { getLocalizedText } from '../utils/translatable';

interface PropertyImage {
  id: number;
  image_path: string;
  is_primary: boolean;
}

interface Property {
  id: number;
  title: Record<string, string>;
  description: Record<string, string>;
  price: number;
  location: string;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  is_featured: boolean;
  is_approved: boolean;
  images: PropertyImage[];
  user: { id: number; name: string };
}

interface Props {
  property: Property;
  onFavoriteToggle?: () => void;
  isFavorite?: boolean;
}

export default function PropertyCard({ property, onFavoriteToggle, isFavorite }: Props) {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { addProperty, removeProperty, isInCompare, properties } = useCompareStore();
  const [favorite, setFavorite] = useState(isFavorite);
  const [imgError, setImgError] = useState(false);

  const inCompare = isInCompare(property.id);
  const compareDisabled = properties.length >= 4 && !inCompare;

  const primaryImage = property.images?.find((img) => img.is_primary) || property.images?.[0];
  const imageUrl = primaryImage
    ? `/storage/${primaryImage.image_path}`
    : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&q=80';

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    try {
      if (favorite) {
        await api.delete(`/favorites/${property.id}`);
        setFavorite(false);
      } else {
        await api.post('/favorites', { property_id: property.id });
        setFavorite(true);
      }
      onFavoriteToggle?.();
    } catch {
      // ignore
    }
  };

  return (
    <Link
      to={`/properties/${property.id}`}
      className="group block w-full max-w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700"
    >
      <div className="relative overflow-hidden h-48">
        {!imgError ? (
          <img
            src={imageUrl}
            alt={getLocalizedText(property.title, i18n.language)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
            <svg className="w-16 h-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
            property.status === 'sale'
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            {property.status === 'sale' ? t('property.sale') : t('property.rent')}
          </span>
          {property.is_featured && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-yellow-500 text-white">
              {t('property.featured')}
            </span>
          )}
        </div>

        {/* Top Actions */}
        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
          {/* Compare checkbox */}
          <button
            onClick={(e) => {
              e.preventDefault();
              inCompare ? removeProperty(property.id) : addProperty(property);
            }}
            disabled={compareDisabled}
            className={`p-2 rounded-full transition ${
              inCompare
                ? 'bg-blue-600 text-white'
                : compareDisabled
                  ? 'bg-gray-200/50 dark:bg-gray-800/30 text-gray-300 cursor-not-allowed'
                  : 'bg-white/80 dark:bg-gray-900/80 text-gray-400 hover:bg-white dark:hover:bg-gray-900'
            }`}
            title={inCompare ? t('compare.removeFromCompare') : compareDisabled ? t('compare.maxReached') : t('compare.addToCompare')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>

          {/* Favorite Button */}
          {isAuthenticated && (
            <button
              onClick={handleFavorite}
              className="p-2 rounded-full bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 transition"
            >
              <svg
                className={`w-4 h-4 ${favorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
                fill={favorite ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 text-start">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
          {getLocalizedText(property.title, i18n.language) || 'Untitled'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {property.location}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
          {property.type !== 'land' && (
            <>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {property.bedrooms} {t('property.bedrooms')}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {property.bathrooms} {t('property.bathrooms')}
              </span>
            </>
          )}
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            {property.area} {t('property.sqm')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            ${Number(property.price).toLocaleString()}
          </p>
          <span className="text-xs text-gray-400 capitalize px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            {t(`property.${property.type}`)}
          </span>
        </div>

        {!property.is_approved && (
          <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {t('property.pending')}
          </p>
        )}
      </div>
    </Link>
  );
}
