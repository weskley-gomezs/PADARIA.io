import React from 'react';
import { ChefHat, Clock, Bell, LogOut, ShieldAlert, Sparkles, Building2 } from 'lucide-react';
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
  const totalUrgent = expiredCount + expiringCount;

  return (
    <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('app')}>
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-[#D4A574] to-[#E8571A] text-white shadow-sm transition-transform hover:scale-105">
              <ChefHat className="w-6 h-6" />
              <div className="absolute -bottom-1 -right-1 bg-[#2C2C2C] rounded-full p-1 border-2 border-white">
                <Clock className="w-3 h-3 text-[#D4A574]" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight text-[#2C2C2C]">
                  PADARIA<span className="text-[#E8571A]">.io</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F5E6D3] text-[#2C2C2C] uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">Controle de Validade e Estoque</p>
            </div>
          </div>

          {/* Navigation Links & Actions */}
          <div className="flex items-center space-x-3">
            {/* View Switcher Tabs */}
            <div className="bg-[#FAFAF8] p-1 rounded-xl border border-[#E0E0E0] flex items-center space-x-1">
              <button
                onClick={() => onNavigate('app')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                <div className="hidden md:flex flex-col text-right">
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
                  className="relative p-2 rounded-xl text-gray-600 hover:text-[#2C2C2C] hover:bg-[#F5E6D3] transition-colors"
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
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  title="Sair da Conta"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            )}

            {currentView === 'admin' && isAdminLoggedIn && (
              <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
                <button
                  onClick={onLogoutAdmin}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair do Admin</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
