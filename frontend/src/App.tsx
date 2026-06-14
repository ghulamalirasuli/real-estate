import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useCompareStore } from './store/compareStore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CompareBar from './components/CompareBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PropertyList from './pages/PropertyList';
import PropertyDetail from './pages/PropertyDetail';
import Dashboard from './pages/Dashboard';
import AdminRoutes from './pages/admin/AdminRoutes';
import PropertyForm from './pages/PropertyForm';
import ComparePage from './pages/ComparePage';
import Pricing from './pages/Pricing';
import { isRtlLanguage } from './i18n/languages';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppShell() {
  const { i18n } = useTranslation();
  const { darkMode, language } = useThemeStore();
  const compareCount = useCompareStore((s) => s.properties.length);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtlLanguage(language) ? 'rtl' : 'ltr';
    i18n.changeLanguage(language);
  }, [language, i18n]);

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-x-hidden w-full max-w-full min-w-0 ${
      language === 'fa' ? 'font-fa' : language === 'ar' ? 'font-ar' : 'font-sans'
    }`}>
      <Navbar />
      <main className={`flex-1 w-full max-w-full min-w-0 overflow-x-hidden ${compareCount > 0 ? 'pb-16' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute adminOnly>
                <AdminRoutes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-properties"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/properties/new"
            element={
              <ProtectedRoute>
                <PropertyForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/properties/:id/edit"
            element={
              <ProtectedRoute>
                <PropertyForm />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={
            <div className="text-center py-16">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
              <p className="text-gray-500">Page not found</p>
            </div>
          } />
        </Routes>
      </main>
      <CompareBar />
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
