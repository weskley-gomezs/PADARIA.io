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


    </div>
  );
}

