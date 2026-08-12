import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { AdminPanel } from './components/AdminPanel';
import { BakeryApp } from './components/BakeryApp';
import { LandingPage } from './components/LandingPage';
import { NotificationsModal } from './components/NotificationsModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import { useData } from './context/DataContext';

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

  const handleNavigate = (view: 'landing' | 'app' | 'admin') => {
    setCurrentView(view);
  };

  const handleLoginAsBakeryFromAdmin = (code: string) => {
    setActiveCode(code);
    setCurrentView('app');
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

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onEnterApp={() => handleNavigate('app')}
          onOpenAdmin={() => handleNavigate('admin')}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
        />
        <PrivacyPolicyModal
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
        />
        <InstallPwaPrompt />
      </>
    );
  }

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

      {/* Footer */}
      {currentView !== 'admin' && (
        <footer className="hidden sm:block bg-white border-t border-[#E0E0E0] py-6 text-center text-xs text-gray-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center space-x-2.5">
              <img 
                src="https://i.imgur.com/ZGsjvWy.png" 
                alt="PADARIA.io Logo" 
                className="h-10 sm:h-12 object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 text-[11px] sm:text-xs">Sistema de Gestão & Monitoramento Sanitário de Validade</span>
            </div>

            <div className="flex items-center space-x-4 text-gray-500">
              <button onClick={() => handleNavigate('landing')} className="hover:text-[#2C2C2C] font-semibold cursor-pointer">
                Início / Site
              </button>
              <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-[#2C2C2C] font-semibold cursor-pointer">
                Política de Privacidade
              </button>
              <button onClick={() => handleNavigate('admin')} className="hover:text-[#E8571A] font-extrabold cursor-pointer flex items-center space-x-1">
                <span>Painel Admin</span>
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

