import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AdminPanel } from './components/AdminPanel';
import { BakeryApp } from './components/BakeryApp';
import { LandingPage } from './components/LandingPage';
import { StorageService } from './services/storageService';
import { BakeryCompany, Product } from './types';
import { NotificationsModal } from './components/NotificationsModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'app' | 'admin'>(() => {
    if (window.location.pathname.startsWith('/admin')) {
      return 'admin';
    }
    // Default to landing page for new visitors, or app if requested via path
    if (window.location.pathname.startsWith('/app')) {
      return 'app';
    }
    return 'landing';
  });

  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [activeCompany, setActiveCompany] = useState<BakeryCompany | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      await StorageService.init();
      if (isMounted) {
        setIsAdminLoggedIn(StorageService.isAdminAuthenticated());
        const code = StorageService.getActiveBakeryCode();
        setActiveCode(code);
      }
    };
    initApp();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time synchronization for Navbar company & badge counters
  useEffect(() => {
    const unsubComp = StorageService.subscribeCompanies((companies) => {
      const code = StorageService.getActiveBakeryCode();
      if (code) {
        const comp = companies.find(c => c.codigoAtivacao.toUpperCase() === code.trim().toUpperCase());
        if (comp && comp.ativo) {
          setActiveCompany(comp);
        } else {
          setActiveCompany(null);
        }
      } else {
        setActiveCompany(null);
      }
    });

    return () => unsubComp();
  }, [activeCode]);

  useEffect(() => {
    const code = StorageService.getActiveBakeryCode();
    if (!code) {
      setProducts([]);
      return;
    }

    const unsubProd = StorageService.subscribeProducts((prods) => {
      setProducts(prods);
    }, code);

    return () => unsubProd();
  }, [activeCode]);

  const handleNavigate = (view: 'landing' | 'app' | 'admin') => {
    setCurrentView(view);
    try {
      let targetPath = '/';
      if (view === 'admin') targetPath = '/admin';
      if (view === 'app') targetPath = '/app';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    } catch (e) {
      // Ignored in sandbox
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginAsBakeryFromAdmin = (code: string) => {
    StorageService.setActiveBakeryCode(code);
    setActiveCode(code);
    setCurrentView('app');
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

  const handleMarkAsSold = async (id: string) => {
    if (!activeCode) return;
    await StorageService.markAsSold(id);
  };

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
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#2C2C2C] flex flex-col font-sans antialiased selection:bg-[#FF6B00] selection:text-white">
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

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
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
            <button onClick={() => handleNavigate('landing')} className="hover:text-[#2C2C2C] font-semibold cursor-pointer">
              Início / Site
            </button>
            <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-[#2C2C2C] font-semibold cursor-pointer">
              Política de Privacidade
            </button>
            <button onClick={() => handleNavigate('admin')} className="hover:text-[#2C2C2C] font-semibold cursor-pointer">
              Painel Admin
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

