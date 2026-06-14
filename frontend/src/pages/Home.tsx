import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import PropertyCard from '../components/PropertyCard';

interface Property {
  id: number;
  title: Record<string, string>;
  description?: Record<string, string>;
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

function ViewAllLink({ label }: { label: string }) {
  return (
    <Link to="/properties" className="view-all-link">
      {label}
      <svg
        className="w-4 h-4 rtl:rotate-180 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function SectionHeader({ eyebrow, title, viewAllLabel }: { eyebrow: string; title: string; viewAllLabel: string }) {
  return (
    <div className="section-header">
      <div className="min-w-0 flex-1">
        <p className="section-eyebrow mb-1">{eyebrow}</p>
        <h2 className="section-title break-words">{title}</h2>
      </div>
      <ViewAllLink label={viewAllLabel} />
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [latest, setLatest] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const [featuredRes, latestRes] = await Promise.all([
          api.get('/properties', { params: { is_featured: true, per_page: 6 } }),
          api.get('/properties', { params: { per_page: 6 } }),
        ]);
        setFeatured(featuredRes.data.data || []);
        setLatest(latestRes.data.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/properties?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const stats = [
    { value: '500+', label: t('home.statProperties'), icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { value: '200+', label: t('home.statClients'), icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { value: '50+', label: t('home.statAgents'), icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>
        <div className="absolute -top-24 -right-24 w-72 sm:w-96 h-72 sm:h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative page-container py-16 sm:py-24 md:py-32 text-center">
          <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium text-blue-100 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-balance">{t('home.trustedBadge')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight text-balance px-1">
            {t('home.heroTitle')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-100/90 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed text-pretty px-1">
            {t('home.heroSubtitle')}
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto w-full">
            <div className="glass-card flex flex-col sm:flex-row gap-2 overflow-hidden p-2 sm:p-1.5">
              <div className="flex-1 flex items-center min-w-0 px-3 sm:px-4">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  className="w-full min-w-0 px-3 sm:px-4 py-3 sm:py-3.5 text-gray-900 dark:text-white bg-transparent focus:outline-none placeholder:text-gray-400 text-start"
                />
              </div>
              <button type="submit" className="btn-primary w-full sm:w-auto px-8 py-3 sm:py-2.5 rounded-xl shrink-0">
                {t('common.search')}
              </button>
            </div>
          </form>

          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                  </svg>
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-blue-200/80 text-sm font-medium text-center text-pretty">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-12 sm:py-20 page-container">
        <SectionHeader
          eyebrow={t('home.topPicks')}
          title={t('home.featured')}
          viewAllLabel={t('home.viewAll')}
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featured.slice(0, 6).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      {/* Latest Properties */}
      <section className="py-12 sm:py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="page-container">
          <SectionHeader
            eyebrow={t('home.newListings')}
            title={t('home.latest')}
            viewAllLabel={t('home.viewAll')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {latest.slice(0, 6).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 page-container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 p-8 sm:p-10 md:p-16 text-center text-white">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-balance">{t('home.ctaTitle')}</h2>
            <p className="text-blue-100 text-base sm:text-lg mb-8 max-w-xl mx-auto text-pretty">
              {t('home.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                to="/properties"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition shadow-lg"
              >
                {t('home.browseProperties')}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition"
              >
                {t('home.listProperty')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
