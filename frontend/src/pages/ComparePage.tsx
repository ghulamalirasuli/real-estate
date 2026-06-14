import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCompareStore } from '../store/compareStore';

export default function ComparePage() {
  const { t, i18n } = useTranslation();
  const { properties, removeProperty, clearAll } = useCompareStore();
  const lang = i18n.language;

  if (properties.length === 0) return <Navigate to="/properties" replace />;

  const rows = [
    {
      label: t('property.price'),
      render: (p: any) => (
        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
          ${Number(p.price).toLocaleString()}
        </span>
      ),
    },
    {
      label: t('property.status'),
      render: (p: any) => (
        <span className={`px-3 py-1 rounded-lg text-xs font-semibold inline-block ${
          p.status === 'sale'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {p.status === 'sale' ? t('property.sale') : t('property.rent')}
        </span>
      ),
    },
    {
      label: t('property.type'),
      render: (p: any) => (
        <span className="capitalize text-gray-700 dark:text-gray-300">
          {t(`property.${p.type}`)}
        </span>
      ),
    },
    {
      label: t('property.location'),
      render: (p: any) => (
        <span className="text-gray-600 dark:text-gray-400">{p.location}</span>
      ),
    },
    ...(properties.some((p) => p.type !== 'land')
      ? [
          {
            label: t('property.bedrooms'),
            render: (p: any) => (
              <span className="text-gray-700 dark:text-gray-300">
                {p.type !== 'land' ? p.bedrooms : '—'}
              </span>
            ),
          },
          {
            label: t('property.bathrooms'),
            render: (p: any) => (
              <span className="text-gray-700 dark:text-gray-300">
                {p.type !== 'land' ? p.bathrooms : '—'}
              </span>
            ),
          },
        ]
      : []),
    {
      label: `${t('property.area')} (${t('property.sqm')})`,
      render: (p: any) => (
        <span className="text-gray-700 dark:text-gray-300">{p.area || '—'}</span>
      ),
    },
    {
      label: t('property.featured'),
      render: (p: any) => (
        p.is_featured
          ? <span className="text-yellow-600 dark:text-yellow-400 font-medium">{t('compare.yes')}</span>
          : <span className="text-gray-400">{t('compare.no')}</span>
      ),
    },
    {
      label: t('property.pending'),
      render: (p: any) => (
        p.is_approved
          ? <span className="text-green-600 dark:text-green-400 font-medium">{t('compare.approved')}</span>
          : <span className="text-yellow-600 dark:text-yellow-400">{t('property.pending')}</span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t('compare.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('compare.subtitle', { count: properties.length })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/properties"
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            {t('common.back')}
          </Link>
          <button
            onClick={clearAll}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Property headers */}
        <div className="grid grid-cols-[200px_repeat(auto-fill,minmax(220px,1fr))] border-b border-gray-200 dark:border-gray-700">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-r border-gray-200 dark:border-gray-700" />
          {properties.map((property) => (
            <div key={property.id} className="p-4 text-center relative group">
              <button
                onClick={() => removeProperty(property.id)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition opacity-0 group-hover:opacity-100"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image */}
              <Link to={`/properties/${property.id}`} className="block">
                <div className="w-full h-40 rounded-xl overflow-hidden mb-3 bg-gray-100 dark:bg-gray-700">
                  {property.images?.[0] ? (
                    <img
                      src={`/storage/${property.images[0].image_path}`}
                      alt={property.title?.[lang] || property.title?.en}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition">
                  {property.title?.[lang] || property.title?.en}
                </h3>
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison rows */}
        {rows.map((row, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-[200px_repeat(auto-fill,minmax(220px,1fr))] ${
              idx !== rows.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
            }`}
          >
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-r border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {row.label}
              </span>
            </div>
            {properties.map((property) => (
              <div key={property.id} className="p-4 text-center">
                {row.render(property)}
              </div>
            ))}
          </div>
        ))}

        {/* Agent info row */}
        <div className="grid grid-cols-[200px_repeat(auto-fill,minmax(220px,1fr))] border-t border-gray-200 dark:border-gray-700">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-r border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('compare.agent')}</span>
          </div>
          {properties.map((property) => (
            <div key={property.id} className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {property.user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {property.user?.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
