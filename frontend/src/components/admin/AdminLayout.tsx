import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export type AdminSection = 'overview' | 'customers' | 'agents' | 'properties' | 'pricing' | 'revenue' | 'accounting';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  message?: string;
  actions?: React.ReactNode;
}

const navItems: { id: AdminSection; path: string; icon: string }[] = [
  { id: 'overview', path: '/admin', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'customers', path: '/admin/customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'agents', path: '/admin/agents', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'properties', path: '/admin/properties', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'pricing', path: '/admin/pricing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'revenue', path: '/admin/revenue', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'accounting', path: '/admin/accounting', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
];

export function getAdminSection(pathname: string): AdminSection {
  if (pathname.startsWith('/admin/customers')) return 'customers';
  if (pathname.startsWith('/admin/agents')) return 'agents';
  if (pathname.startsWith('/admin/properties')) return 'properties';
  if (pathname.startsWith('/admin/pricing')) return 'pricing';
  if (pathname.startsWith('/admin/revenue')) return 'revenue';
  if (pathname.startsWith('/admin/accounting')) return 'accounting';
  return 'overview';
}

function NavLinks({
  activeSection,
  labels,
  onNavigate,
  className = '',
}: {
  activeSection: AdminSection;
  labels: Record<AdminSection, string>;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={`space-y-1 ${className}`}>
      {navItems.map((item) => {
        const isActive = activeSection === item.id;
        return (
          <Link
            key={item.id}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            {labels[item.id]}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children, title, subtitle, message, actions }: AdminLayoutProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const activeSection = getAdminSection(location.pathname);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const labels: Record<AdminSection, string> = {
    overview: t('admin.dashboard'),
    customers: t('admin.customers'),
    agents: t('admin.agents'),
    properties: t('admin.properties'),
    pricing: t('admin.pricing'),
    revenue: t('admin.revenue'),
    accounting: t('accounting.title'),
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-gray-100 dark:bg-gray-950 overflow-x-hidden w-full">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-72 flex-col bg-slate-900 text-white flex-shrink-0">
        <div className="px-6 py-6 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-lg leading-tight truncate">{t('admin.panelTitle')}</p>
              <p className="text-xs text-slate-400">RealEstate CMS</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <NavLinks activeSection={activeSection} labels={labels} />
        </div>

        <div className="px-4 py-4 border-t border-slate-700/80">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('admin.backToSite')}
          </Link>
        </div>
      </aside>

      {/* Mobile drawer — only mount when open to avoid horizontal scroll */}
      {mobileNavOpen && (
        <>
          <div className="fixed inset-0 z-40 lg:hidden bg-black/50" onClick={closeMobileNav} />
          <aside className="fixed top-16 bottom-0 start-0 z-50 w-72 max-w-[85vw] bg-slate-900 text-white flex flex-col lg:hidden">
            <div className="px-5 py-5 border-b border-slate-700/80 flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-bold text-base truncate">{t('admin.panelTitle')}</p>
                <p className="text-xs text-slate-400 truncate">{labels[activeSection]}</p>
              </div>
              <button onClick={closeMobileNav} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 px-3 py-4 overflow-y-auto">
              <NavLinks activeSection={activeSection} labels={labels} onNavigate={closeMobileNav} />
            </div>

            <div className="px-3 py-4 border-t border-slate-700/80">
              <Link
                to="/dashboard"
                onClick={closeMobileNav}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t('admin.backToSite')}
              </Link>
            </div>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 bg-slate-900 px-4 py-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 rounded-lg text-white hover:bg-slate-800 flex-shrink-0"
            aria-label="Open admin menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{labels[activeSection]}</p>
            <p className="text-xs text-slate-400 truncate">{t('admin.panelTitle')}</p>
          </div>
        </div>

        {/* Page header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex-shrink-0">{actions}</div>}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {message && (
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl text-sm border ${
              message === t('common.error')
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200'
                : 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200'
            }`}>
              {message}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
