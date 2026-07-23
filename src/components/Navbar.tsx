import React from 'react';
import { ChefHat, Clock, Bell, LogOut, ShieldAlert, Sparkles, Building2, Menu, X } from 'lucide-react';
import { BakeryCompany } from '../types';

interface NavbarProps {
  currentView: 'app' | 'admin';
  onNavigate: (view: 'app' | 'admin') => void;
  activeCompany?: BakeryCompany | null;
  expiredCount: number;
  expiringCount: number;
  onOpenNotifications: () => void;
  onLogoutBakery: () => void;
  onLogoutAdmin: () => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  activeCompany,
  expiredCount,
  expiringCount,
  onOpenNotifications,
  onLogoutBakery,
  onLogoutAdmin,
  isAdminLoggedIn,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const totalUrgent = expiredCount + expiringCount;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-[#E0E0E0] sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0" onClick={() => onNavigate('app')}>
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#D4A574] to-[#E8571A] text-white shadow-sm transition-transform active:scale-95 sm:hover:scale-105">
              <ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />
              <div className="absolute -bottom-1 -right-1 bg-[#2C2C2C] rounded-full p-0.5 sm:p-1 border-2 border-white">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#D4A574]" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-[#2C2C2C]">
                  PADARIA<span className="text-[#E8571A]">.io</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded bg-[#F5E6D3] text-[#2C2C2C] uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Controle de Validade e Estoque</p>
            </div>
          </div>

          {/* Desktop Navigation Links & Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* View Switcher Tabs */}
            <div className="bg-[#FAFAF8] p-1 rounded-xl border border-[#E0E0E0] flex items-center space-x-1">
              <button
                onClick={() => onNavigate('app')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'app'
                    ? 'bg-[#D4A574] text-white shadow-xs'
                    : 'text-[#2C2C2C] hover:bg-[#F5E6D3]'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>App Padaria</span>
              </button>

              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-[#2C2C2C] text-white shadow-xs'
                    : 'text-[#2C2C2C] hover:bg-[#F5E6D3]'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Painel Admin</span>
              </button>
            </div>

            {/* View specific actions */}
            {currentView === 'app' && activeCompany && (
              <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
                {/* Bakery Badge */}
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-[#2C2C2C] truncate max-w-[140px]">
                    {activeCompany.empresa}
                  </span>
                  <span className="text-[10px] font-mono text-[#E8571A] font-semibold">
                    CÓD: {activeCompany.codigoAtivacao}
                  </span>
                </div>

                {/* Notifications Button */}
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 rounded-xl text-gray-600 hover:text-[#2C2C2C] hover:bg-[#F5E6D3] transition-colors cursor-pointer"
                  title="Alertas de Validade"
                >
                  <Bell className="w-5 h-5" />
                  {totalUrgent > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E74C3C] text-[10px] font-bold text-white animate-pulse">
                      {totalUrgent}
                    </span>
                  )}
                </button>

                {/* Logout Bakery */}
                <button
                  onClick={onLogoutBakery}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Sair da Conta"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            )}

            {currentView === 'admin' && isAdminLoggedIn && (
              <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
                <button
                  onClick={onLogoutAdmin}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair do Admin</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Top Header Actions */}
          <div className="flex md:hidden items-center space-x-1.5">
            {currentView === 'app' && activeCompany && (
              <span className="text-[10px] font-mono font-bold bg-orange-50 text-[#E8571A] px-2 py-0.5 rounded-md border border-orange-200 truncate max-w-[110px]">
                {activeCompany.empresa}
              </span>
            )}

            {/* Notifications Quick Icon on Mobile Header */}
            {currentView === 'app' && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-lg text-gray-700 hover:bg-gray-100 min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <Bell className="w-5 h-5" />
                {totalUrgent > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E74C3C] text-[9px] font-bold text-white animate-pulse">
                    {totalUrgent}
                  </span>
                )}
              </button>
            )}

            {/* Mobile Hamburger / Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-3 animate-fade-in shadow-lg">
          <div className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Mudar Visão do Sistema</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onNavigate('app');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-xl text-xs font-bold transition-all ${
                currentView === 'app' ? 'bg-[#D4A574] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>App Padaria</span>
            </button>

            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-xl text-xs font-bold transition-all ${
                currentView === 'admin' ? 'bg-[#2C2C2C] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Painel Admin</span>
            </button>
          </div>

          {currentView === 'app' && activeCompany && (
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <div className="text-xs">
                <p className="font-bold text-[#2C2C2C]">{activeCompany.empresa}</p>
                <p className="text-[10px] text-gray-500 font-mono">Código: {activeCompany.codigoAtivacao}</p>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogoutBakery();
                }}
                className="px-3 py-1.5 bg-red-50 text-red-600 font-bold rounded-lg text-xs flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          )}

          {currentView === 'admin' && isAdminLoggedIn && (
            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogoutAdmin();
                }}
                className="px-3 py-1.5 bg-red-50 text-red-600 font-bold rounded-lg text-xs flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair do Admin</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

