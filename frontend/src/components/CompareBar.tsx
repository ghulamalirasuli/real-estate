import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCompareStore } from '../store/compareStore';

export default function CompareBar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { properties, removeProperty, clearAll } = useCompareStore();

  if (properties.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex-shrink-0">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('compare.selected', { count: properties.length })}
            </span>
          </div>

          <div className="flex-1 flex items-center gap-2 overflow-x-auto min-w-0 pb-1 sm:pb-0">
            {properties.map((property) => (
              <div
                key={property.id}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg group flex-shrink-0 max-w-[160px]"
              >
                <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                  {property.images?.[0] ? (
                    <img
                      src={`/storage/${property.images[0].image_path}`}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=50&q=50';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate min-w-0">
                  {property.title?.[i18n.language] || property.title?.en}
                </span>
                <button
                  onClick={() => removeProperty(property.id)}
                  className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            <button
              onClick={clearAll}
              className="flex-1 sm:flex-none px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => navigate('/compare')}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {t('compare.compare')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
