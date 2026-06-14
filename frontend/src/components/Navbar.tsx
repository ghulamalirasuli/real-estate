import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import LanguageSwitcher, { MobileLanguagePicker } from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import api from '../services/api';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // ignore errors
    }
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg shadow-sm w-full max-w-full overflow-hidden isolate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="flex justify-between items-center h-14 sm:h-16 min-w-0 gap-2">
          {/* Logo */}
          <div className="flex items-center min-w-0 shrink">
            <Link to="/" className="flex items-center gap-2 group min-w-0">
              <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="hidden sm:inline text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                RealEstate
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 min-w-0">
            <Link to="/" className="nav-link">{t('nav.home')}</Link>
            <Link to="/properties" className="nav-link">{t('nav.properties')}</Link>
            <Link to="/pricing" className="nav-link">{t('nav.pricing')}</Link>

            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="nav-link">{t('nav.dashboard')}</Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1.5 px-3 lg:px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${
                      isAdminRoute
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="hidden xl:inline">{t('nav.adminPanel')}</span>
                    <span className="xl:hidden">{t('nav.admin')}</span>
                  </Link>
                )}
              </>
            )}

            <div className="flex items-center gap-2 lg:gap-3 ms-3 lg:ms-4 ps-3 lg:ps-4 border-s border-gray-200 dark:border-gray-700 flex-shrink-0">
              <LanguageSwitcher />
              <ThemeToggle />

              {isAuthenticated ? (
                <div className="flex items-center gap-2 ms-1">
                  <Link to="/my-properties" className="nav-link hidden lg:inline-flex">{t('nav.myProperties')}</Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 lg:px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition shadow-sm whitespace-nowrap"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 ms-1">
                  <Link to="/login" className="btn-outline whitespace-nowrap">
                    {t('auth.login')}
                  </Link>
                  <Link to="/register" className="btn-primary whitespace-nowrap">
                    {t('auth.register')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="mobile-nav-panel">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-link text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/80"
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/properties"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-link text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/80"
              >
                {t('nav.properties')}
              </Link>
              <Link
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-link text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/80"
              >
                {t('nav.pricing')}
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mobile-nav-link text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/80"
                  >
                    {t('nav.dashboard')}
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-nav-link bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold"
                    >
                      {t('nav.adminPanel')}
                    </Link>
                  )}
                  <Link
                    to="/my-properties"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mobile-nav-link text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/80"
                  >
                    {t('nav.myProperties')}
                  </Link>
                </>
              )}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="mobile-nav-link text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {t('nav.logout')}
                </button>
              ) : (
                <div className="flex gap-2 p-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center btn-outline">
                    {t('auth.login')}
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center btn-primary">
                    {t('auth.register')}
                  </Link>
                </div>
              )}
              {!isAdminRoute && (
                <MobileLanguagePicker onSelect={() => setMobileMenuOpen(false)} />
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
