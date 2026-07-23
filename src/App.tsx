import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AdminPanel } from './components/AdminPanel';
import { BakeryApp } from './components/BakeryApp';
import { StorageService } from './services/storageService';
import { BakeryCompany, Product } from './types';
import { NotificationsModal } from './components/NotificationsModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'app' | 'admin'>(() => {
    // Check URL path or default to app
    if (window.location.pathname.startsWith('/admin')) {
      return 'admin';
    }
    return 'app';
  });

  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [activeCompany, setActiveCompany] = useState<BakeryCompany | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      await StorageService.init();
      if (isMounted) {
        setIsAdminLoggedIn(StorageService.isAdminAuthenticated());
        refreshData();
      }
    };
    initApp();
    return () => {
      isMounted = false;
    };
  }, [currentView, activeCode]);

  const refreshData = () => {
    const code = StorageService.getActiveBakeryCode();
    setActiveCode(code);
    if (code) {
      const comp = StorageService.getCompanyByCode(code);
      if (comp && comp.ativo) {
        setActiveCompany(comp);
        const prods = StorageService.getProducts(code);
        setProducts(prods);
      } else {
        setActiveCompany(null);
        setProducts([]);
      }
    } else {
      setActiveCompany(null);
      setProducts([]);
    }
    setIsAdminLoggedIn(StorageService.isAdminAuthenticated());
  };

  const handleNavigate = (view: 'app' | 'admin') => {
    setCurrentView(view);
    // Update browser history URL without page reload if possible
    try {
      const targetPath = view === 'admin' ? '/admin' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    } catch (e) {
      // Ignored in sandbox
    }
  };

  const handleLoginAsBakeryFromAdmin = (code: string) => {
    StorageService.setActiveBakeryCode(code);
    setActiveCode(code);
    setCurrentView('app');
    refreshData();
  };

  const handleLogoutBakery = () => {
    StorageService.setActiveBakeryCode(null);
    setActiveCode(null);
    setActiveCompany(null);
    setProducts([]);
  };

  const handleLogoutAdmin = () => {
    StorageService.setAdminAuthenticated(false);
    setIsAdminLoggedIn(false);
  };

  const expiredProducts = products.filter((p) => p.status === 'vencido');
  const expiringProducts = products.filter((p) => p.status === 'vencendo');

  const handleMarkAsSold = (id: string) => {
    if (!activeCode) return;
    StorageService.markAsSold(id);
    refreshData();
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#2C2C2C] flex flex-col font-sans antialiased selection:bg-[#D4A574] selection:text-white">
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
          <AdminPanel onLoginAsBakery={handleLoginAsBakeryFromAdmin} />
        ) : (
          <BakeryApp presetCode={activeCode} />
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

      {/* Footer */}
      <footer className="bg-white border-t border-[#E0E0E0] py-6 text-center text-xs text-gray-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-[#2C2C2C]">PADARIA.io</span>
            <span>•</span>
            <span>Sistema de Gestão & Monitoramento Sanitário de Validade</span>
          </div>

          <div className="flex items-center space-x-4 text-gray-400">
            <span>Cores: #D4A574 | #F5E6D3 | #E8571A</span>
            <span>•</span>
            <button onClick={() => handleNavigate('admin')} className="hover:text-[#2C2C2C] font-semibold">
              Painel Admin
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
