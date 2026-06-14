import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import PropertyCard from '../components/PropertyCard';
import AddressAutocomplete from '../components/AddressAutocomplete';

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

export default function PropertyList() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const status = searchParams.get('status') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const bedrooms = searchParams.get('bedrooms') || '';
  const sort = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') || 'desc';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        sort,
        order,
        per_page: 12,
      };
      if (search) params.search = search;
      if (type) params.type = type;
      if (status) params.status = status;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (bedrooms) params.bedrooms = bedrooms;

      const { data } = await api.get('/properties', { params });
      setProperties(data.data || []);
      setTotal(data.total || 0);
      setLastPage(data.last_page || 1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, type, status, minPrice, maxPrice, bedrooms, sort, order]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = type || status || minPrice || maxPrice || bedrooms;
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleAddressSelect = (address: string) => {
    updateFilter('search', address);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {t('nav.properties')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {total} {t('property.noProperties')}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {t('common.filter')}
          </button>
        </div>

        {/* Search Bar with Autocomplete */}
        <div className="max-w-xl">
          <AddressAutocomplete
            value={search}
            onSelect={(address) => handleAddressSelect(address)}
            onChange={(val) => {
              if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
              searchTimeoutRef.current = setTimeout(() => updateFilter('search', val), 400);
            }}
            placeholder={t('home.searchPlaceholder')}
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Powered by OpenStreetMap — type at least 3 characters to search by location
          </p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('property.status')}</label>
              <select
                value={status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{t('common.all')}</option>
                <option value="sale">{t('property.sale')}</option>
                <option value="rent">{t('property.rent')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('property.type')}</label>
              <select
                value={type}
                onChange={(e) => updateFilter('type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{t('common.all')}</option>
                <option value="apartment">{t('property.apartment')}</option>
                <option value="villa">{t('property.villa')}</option>
                <option value="land">{t('property.land')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('property.bedrooms')}</label>
              <select
                value={bedrooms}
                onChange={(e) => updateFilter('bedrooms', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{t('common.all')}</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}+</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.sort')}</label>
              <select
                value={`${sort}:${order}`}
                onChange={(e) => {
                  const [s, o] = e.target.value.split(':');
                  const params = new URLSearchParams(searchParams);
                  params.set('sort', s);
                  params.set('order', o);
                  setSearchParams(params);
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="created_at:desc">{t('common.newest')}</option>
                <option value="price:asc">{t('common.priceLow')}</option>
                <option value="price:desc">{t('common.priceHigh')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('property.price')} (Min)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => updateFilter('min_price', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="$0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('property.price')} (Max)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => updateFilter('max_price', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="$1000000"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              {t('common.cancel')} filters
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-80 animate-pulse"></div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t('property.noProperties')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            ←
          </button>
          {Array.from({ length: lastPage }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === lastPage || Math.abs(p - currentPage) <= 2)
            .map((p, idx, arr) => (
              <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2">...</span>}
                <button
                  onClick={() => setCurrentPage(p)}
                  className={`w-10 h-10 rounded-lg ${
                    currentPage === p
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            disabled={currentPage === lastPage}
            onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
