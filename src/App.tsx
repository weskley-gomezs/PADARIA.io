import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AdminPanel } from './components/AdminPanel';
import { BakeryApp } from './components/BakeryApp';
import { LandingPage } from './components/LandingPage';
import { NotificationsModal } from './components/NotificationsModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import { useData } from './context/DataContext';
import { CLUSTER_PAGES, ARTICLES_DATA } from './data/seoData';
import { ClusterPageView } from './components/seo/ClusterPageView';
import { ContentsHubView } from './components/seo/ContentsHubView';
import { ArticlePageView } from './components/seo/ArticlePageView';
import { LandingHeader } from './components/landing/LandingHeader';
import { DemoModal } from './components/landing/DemoModal';

export default function App() {
  const {
    currentView,
    activeCode,
    activeCompany,
    products,
    isAdminLoggedIn,
    isLoading,
    setCurrentView,
    setActiveCode,
    logoutBakery,
    logoutAdmin,
    markAsSold
  } = useData();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [demoModalOpen, setDemoModalOpen] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  // Listen to browser navigation (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigatePath = (path: string) => {
    if (path.startsWith('http')) {
      window.location.href = path;
      return;
    }
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: 'landing' | 'app' | 'admin') => {
    if (view === 'landing') {
      window.history.pushState({}, '', '/');
      setCurrentPath('/');
    } else if (view === 'app') {
      window.history.pushState({}, '', '/app');
      setCurrentPath('/app');
    } else if (view === 'admin') {
      window.history.pushState({}, '', '/admin');
      setCurrentPath('/admin');
    }
    setCurrentView(view);
  };

  const handleLoginAsBakeryFromAdmin = (code: string) => {
    setActiveCode(code);
    handleNavigate('app');
  };

  const handleLogoutBakery = () => {
    logoutBakery();
  };

  const handleLogoutAdmin = () => {
    logoutAdmin();
  };

  const expiredProducts = products.filter((p) => p.status === 'vencido');
  const expiringProducts = products.filter((p) => p.status === 'vencendo');

  const handleMarkAsSold = async (id: string) => {
    await markAsSold(id);
  };

  const openWhatsApp = (customMessage?: string) => {
    const text = encodeURIComponent(
      customMessage || 'Olá! Gostaria de agendar uma demonstração gratuita do Padaria.io para minha padaria.'
    );
    window.open(`https://wa.me/5561996507712?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-gray-500">Iniciando Padaria.io...</span>
        </div>
      </div>
    );
  }

  // Check if current route is an SEO Article
  if (currentPath.startsWith('/conteudos/')) {
    const articleSlug = currentPath.replace('/conteudos/', '').replace(/\/$/, '');
    const articleData = ARTICLES_DATA[articleSlug];

    if (articleData) {
      return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
          <LandingHeader
            onEnterApp={() => handleNavigate('app')}
            onOpenWhatsApp={openWhatsApp}
            onOpenDemoModal={() => setDemoModalOpen(true)}
            onNavigate={handleNavigatePath}
          />
          <ArticlePageView
            article={articleData}
            onNavigate={handleNavigatePath}
            onOpenDemo={() => setDemoModalOpen(true)}
          />
          <DemoModal
            isOpen={demoModalOpen}
            onClose={() => setDemoModalOpen(false)}
            onOpenWhatsApp={openWhatsApp}
          />
          <PrivacyPolicyModal
            isOpen={isPrivacyOpen}
            onClose={() => setIsPrivacyOpen(false)}
          />
          <InstallPwaPrompt />
        </div>
      );
    }
  }

  // Check if current route is Contents Hub
  if (currentPath === '/conteudos' || currentPath === '/conteudos/' || currentPath === '/blog' || currentPath === '/guias') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <LandingHeader
          onEnterApp={() => handleNavigate('app')}
          onOpenWhatsApp={openWhatsApp}
          onOpenDemoModal={() => setDemoModalOpen(true)}
          onNavigate={handleNavigatePath}
        />
        <ContentsHubView
          onNavigate={handleNavigatePath}
          onOpenDemo={() => setDemoModalOpen(true)}
        />
        <DemoModal
          isOpen={demoModalOpen}
          onClose={() => setDemoModalOpen(false)}
          onOpenWhatsApp={openWhatsApp}
        />
        <PrivacyPolicyModal
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
        />
        <InstallPwaPrompt />
      </div>
    );
  }

  // Check if current route is an SEO Topic Cluster Pillar Page
  const cleanSlug = currentPath.replace(/^\//, '').replace(/\/$/, '');
  const clusterData = CLUSTER_PAGES[cleanSlug];
  if (clusterData) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
        <LandingHeader
          onEnterApp={() => handleNavigate('app')}
          onOpenWhatsApp={openWhatsApp}
          onOpenDemoModal={() => setDemoModalOpen(true)}
          onNavigate={handleNavigatePath}
        />
        <ClusterPageView
          data={clusterData}
          onNavigate={handleNavigatePath}
          onOpenDemo={() => setDemoModalOpen(true)}
        />
        <DemoModal
          isOpen={demoModalOpen}
          onClose={() => setDemoModalOpen(false)}
          onOpenWhatsApp={openWhatsApp}
        />
        <PrivacyPolicyModal
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
        />
        <InstallPwaPrompt />
      </div>
    );
  }

  // Default Landing Page view
  if (currentView === 'landing' && (currentPath === '/' || currentPath === '')) {
    return (
      <>
        <LandingPage
          onEnterApp={() => handleNavigate('app')}
          onOpenAdmin={() => handleNavigate('admin')}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onNavigate={handleNavigatePath}
        />
        <PrivacyPolicyModal
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
        />
        <InstallPwaPrompt />
      </>
    );
  }

  // Authenticated or Admin SaaS App view
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#2C2C2C] flex flex-col font-sans antialiased selection:bg-[#FF6B00] selection:text-white">
      <InstallPwaPrompt />
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        activeCompany={activeCompany}
        expiredCount={expiredProducts.length}
        expiringCount={expiringProducts.length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onLogoutBakery={handleLogoutBakery}
        onLogoutAdmin={handleLogoutAdmin}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main View Area */}
      <main className="grow">
        {currentView === 'admin' ? (
          <AdminPanel 
            onLoginAsBakery={handleLoginAsBakeryFromAdmin} 
            isAdminLoggedIn={isAdminLoggedIn}
            onLogoutAdmin={handleLogoutAdmin}
          />
        ) : (
          <BakeryApp presetCode={activeCode} onLogout={handleLogoutBakery} />
        )}
      </main>

      {/* Global Notifications Drawer */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        expiredProducts={expiredProducts}
        expiringProducts={expiringProducts}
        onMarkAsSold={handleMarkAsSold}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
}
