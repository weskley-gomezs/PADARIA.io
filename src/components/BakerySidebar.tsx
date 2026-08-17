import React from 'react';
import {
  Activity,
  Scale,
  UserCheck,
  Cake,
  Boxes,
  BarChart3,
  Crown,
  Sparkles,
  Printer,
  Settings,
  Plus,
  Camera,
  LifeBuoy,
  CheckCircle2
} from 'lucide-react';

export type BakeryTabType =
  | 'summary'
  | 'divergences'
  | 'routine'
  | 'party'
  | 'stock'
  | 'dashboard'
  | 'waste'
  | 'validity'
  | 'vip'
  | 'padeia'
  | 'relatorio'
  | 'config';

interface BakerySidebarProps {
  activeTab: BakeryTabType;
  onSelectTab: (tab: BakeryTabType) => void;
  newPartyOrdersCount?: number;
  onOpenNewProductModal: () => void;
  onOpenScanner: () => void;
  onOpenSupport: () => void;
  onOpenPrintReport: () => void;
  companyName: string;
  companyEmail?: string;
}

export const BakerySidebar: React.FC<BakerySidebarProps> = ({
  activeTab,
  onSelectTab,
  newPartyOrdersCount = 0,
  onOpenNewProductModal,
  onOpenScanner,
  onOpenSupport,
  onOpenPrintReport,
  companyName,
  companyEmail,
}) => {
  const navItems = [
    {
      id: 'summary' as BakeryTabType,
      label: 'Resumo do Dono',
      icon: Activity,
      iconColor: 'text-amber-400',
    },
    {
      id: 'divergences' as BakeryTabType,
      label: 'Divergências',
      icon: Scale,
      iconColor: 'text-amber-500',
    },
    {
      id: 'routine' as BakeryTabType,
      label: 'Rotinas da Equipe',
      icon: UserCheck,
      iconColor: 'text-indigo-400',
    },
    {
      id: 'party' as BakeryTabType,
      label: 'Kit Festa',
      icon: Cake,
      iconColor: 'text-[#E8571A]',
      badge: newPartyOrdersCount > 0 ? (
        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-gray-950 animate-pulse">
          {newPartyOrdersCount} novo{newPartyOrdersCount > 1 ? 's' : ''}
        </span>
      ) : undefined,
    },
    {
      id: 'stock' as BakeryTabType,
      label: 'Estoque',
      icon: Boxes,
      iconColor: 'text-[#FF6B00]',
    },
    {
      id: 'dashboard' as BakeryTabType,
      label: 'Validades',
      icon: BarChart3,
      iconColor: 'text-blue-500',
    },
    {
      id: 'vip' as BakeryTabType,
      label: 'Clube VIP',
      icon: Crown,
      iconColor: 'text-amber-500',
      badge: (
        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          Em Manutenção
        </span>
      ),
    },
    {
      id: 'padeia' as BakeryTabType,
      label: 'PadeIA™',
      icon: Sparkles,
      iconColor: 'text-amber-300',
      isSpecial: true,
    },
    {
      id: 'relatorio' as BakeryTabType,
      label: 'Relatório',
      icon: Printer,
      iconColor: 'text-emerald-500',
    },
    {
      id: 'config' as BakeryTabType,
      label: 'Configurações',
      icon: Settings,
      iconColor: 'text-gray-400',
    },
  ];

  return (
    <aside
      id="desktop-bakery-sidebar"
      aria-label="Barra Lateral de Navegação"
      className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 bg-white border border-[#E0E0E0] rounded-2xl shadow-xs p-4 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto"
    >
      {/* Sidebar Header & Company info */}
      <div className="pb-3 border-b border-gray-100 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#1F2937] truncate" title={companyName}>
            {companyName}
          </h2>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
        </div>

        {/* Action Button: Add Product */}
        <button
          type="button"
          onClick={onOpenNewProductModal}
          className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-[#E8571A] hover:bg-[#d44e15] text-white font-extrabold text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Main Navigation List */}
      <div className="py-3 space-y-1">
        <p className="px-2.5 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
          Funcionalidades
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between cursor-pointer active:scale-98 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FF6B00] to-[#E8571A] text-white shadow-md ring-2 ring-orange-400/40'
                    : 'bg-orange-50/80 text-[#E8571A] hover:bg-orange-100/80 border border-orange-200/80'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-200' : 'text-[#E8571A]'} animate-pulse`} />
                  <span>{item.label}</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${
                  isActive ? 'bg-black/20 text-white' : 'bg-orange-200/60 text-[#E8571A]'
                }`}>
                  IA Ativa
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer active:scale-98 ${
                isActive
                  ? 'bg-[#1F2937] text-white shadow-xs font-black'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.iconColor}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && <div className="shrink-0 ml-1.5">{item.badge}</div>}
            </button>
          );
        })}
      </div>

      {/* Quick Tools & Shortcuts */}
      <div className="pt-3 border-t border-gray-100 space-y-1.5 mt-auto">
        <p className="px-2.5 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
          Atalhos Rápidos
        </p>

        <button
          type="button"
          onClick={onOpenScanner}
          className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-[#E8571A] transition-colors flex items-center space-x-2 cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-gray-500" />
          <span>Escanear com Câmera</span>
        </button>

        <button
          type="button"
          onClick={onOpenPrintReport}
          className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-[#F5E6D3] transition-colors flex items-center space-x-2 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-gray-500" />
          <span>Imprimir Relatório</span>
        </button>

        <button
          type="button"
          onClick={onOpenSupport}
          className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-[#E8571A] transition-colors flex items-center space-x-2 cursor-pointer"
        >
          <LifeBuoy className="w-3.5 h-3.5 text-[#E8571A]" />
          <span>Suporte Técnico</span>
        </button>
      </div>

      {/* System Status Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>Sistema Ativo</span>
        </div>
        <span className="font-semibold text-gray-400">v2.5</span>
      </div>
    </aside>
  );
};
