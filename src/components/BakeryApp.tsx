import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  Key,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  History,
  RotateCcw,
  Settings,
  Shield,
  Printer,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PackageCheck,
  Building2,
  Filter,
  RefreshCw,
  LogOut,
  ExternalLink,
  LifeBuoy,
  CreditCard,
  Send,
  BarChart3,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BakeryCompany, Product, ProductStatus, SaleHistoryItem } from '../types';
import { StorageService } from '../services/storageService';
import { formatDateToBR, getRelativeExpirationText, generateActivationCode } from '../utils/dateUtils';
import { ProductModal } from './ProductModal';
import { NotificationsModal } from './NotificationsModal';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { PrintReportModal } from './PrintReportModal';
import { SupportModal } from './SupportModal';
import { ImageScanner } from './ImageScanner';
import { WasteChartSection } from './WasteChartSection';

interface BakeryAppProps {
  presetCode?: string | null;
}

export const BakeryApp: React.FC<BakeryAppProps> = ({ presetCode }) => {
  // Session State
  const [activeCode, setActiveCode] = useState<string | null>(presetCode || null);
  const [company, setCompany] = useState<BakeryCompany | null>(null);
  const [codeInput, setCodeInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleHistoryItem[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analise' | 'insights' | 'relatorio' | 'config'>('dashboard');
  const [keepLoggedIn, setKeepLoggedIn] = useState<boolean>(true);
  const [analysisStartDate, setAnalysisStartDate] = useState<string>('');
  const [analysisEndDate, setAnalysisEndDate] = useState<string>('');
  const [analysisCategory, setAnalysisCategory] = useState<string>('all');
  const [analysisMotivo, setAnalysisMotivo] = useState<string>('all');

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [isWasteScannerOpen, setIsWasteScannerOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);

  // Accordion UI state
  const [isSettingsExpanded, setIsSettingsExpanded] = useState<boolean>(false);

  // Toast / Feedback State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (presetCode) {
      setActiveCode(presetCode);
    } else {
      const savedCode = StorageService.getActiveBakeryCode();
      if (savedCode) {
        setActiveCode(savedCode);
      }
    }
  }, [presetCode]);

  // Real-time subscription to companies and active bakery products/sales
  useEffect(() => {
    const unsubCompanies = StorageService.subscribeCompanies((companies) => {
      if (activeCode) {
        const comp = companies.find(c => c.codigoAtivacao.toUpperCase() === activeCode.trim().toUpperCase());
        if (comp && comp.ativo) {
          setCompany(comp);
          setLoginError('');
        } else if (comp && !comp.ativo) {
          setLoginError('Empresa inativa. Entre em contato com o suporte/administrador.');
          setCompany(null);
        } else {
          setLoginError('Código de ativação não encontrado.');
          setCompany(null);
        }
      } else {
        setCompany(null);
      }
    });

    return () => {
      unsubCompanies();
    };
  }, [activeCode]);

  useEffect(() => {
    if (!activeCode) {
      setProducts([]);
      setSalesHistory([]);
      return;
    }

    const unsubProducts = StorageService.subscribeProducts((prods) => {
      setProducts(prods);
    }, activeCode);

    const unsubSales = StorageService.subscribeSalesHistory((sales) => {
      setSalesHistory(sales);
    }, activeCode);

    return () => {
      unsubProducts();
      unsubSales();
    };
  }, [activeCode]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanCode = codeInput.trim().toUpperCase();

    if (cleanCode.length !== 8) {
      setLoginError('O código de ativação deve conter exatamente 8 caracteres.');
      return;
    }

    const comp = StorageService.getCompanyByCode(cleanCode);
    if (!comp) {
      setLoginError('Código de ativação inválido. Verifique com o seu administrador.');
      return;
    }

    if (!comp.ativo) {
      setLoginError('Esta panificadora está desativada. Solicite a reativação no Painel Admin.');
      return;
    }

    StorageService.setActiveBakeryCode(cleanCode);
    setActiveCode(cleanCode);
    setCodeInput('');
  };

  const handleLogout = () => {
    StorageService.setActiveBakeryCode(null);
    setActiveCode(null);
    setCompany(null);
  };

  // Product CRUD
  const handleSaveProduct = async (
    nome: string,
    quantidade: number,
    dataValidade: string,
    categoria?: string,
    barcode?: string,
    valorKg?: number,
    dataFabricacao?: string,
    valorTotal?: number,
    motivo?: string,
    notas?: string
  ) => {
    if (!company) return;

    try {
      if (productToEdit) {
        await StorageService.updateProduct(
          productToEdit.id,
          nome,
          quantidade,
          dataValidade,
          categoria,
          barcode,
          valorKg,
          dataFabricacao,
          valorTotal,
          motivo,
          notas
        );
        showToast('Descarte atualizado com sucesso!');
      } else {
        await StorageService.addProduct(
          company.codigoAtivacao,
          nome,
          quantidade,
          dataValidade,
          categoria,
          barcode,
          valorKg,
          dataFabricacao,
          valorTotal,
          motivo,
          notas
        );
        showToast('Descarte registrado com sucesso!');
      }
      setProductToEdit(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar produto.');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!company) return;
    if (confirm(`Deseja realmente excluir o produto "${name}"?`)) {
      await StorageService.deleteProduct(id);
      showToast('Produto excluído.');
    }
  };

  const handleWasteScanResult = async (result: {
    nome: string;
    dataFabricacao?: string;
    dataValidade?: string;
    valorKg?: number;
    valorTotal?: number;
  }) => {
    if (!company) return;

    const normalizeStr = (s: string) => s.toLowerCase().trim();
    let bestMatch = products.find(
      (p) => result.nome && normalizeStr(p.nome).includes(normalizeStr(result.nome))
    );

    if (bestMatch) {
      const newQty = Math.max(0, bestMatch.quantidade - 1);
      if (newQty > 0) {
        await StorageService.updateProduct(
          bestMatch.id,
          bestMatch.nome,
          newQty,
          result.dataValidade || bestMatch.dataValidade,
          bestMatch.categoria,
          bestMatch.barcode,
          result.valorKg !== undefined ? result.valorKg : bestMatch.valorKg,
          result.dataFabricacao || bestMatch.dataFabricacao,
          result.valorTotal !== undefined ? result.valorTotal : bestMatch.valorTotal
        );
      } else {
        await StorageService.deleteProduct(bestMatch.id);
      }
      showToast(`Descarte registrado! 1 unidade de "${bestMatch.nome}" removida do estoque.`);
    } else {
      // If backend already created product, onSnapshot will pick it up automatically; otherwise create here
      showToast(`Descarte registrado: "${result.nome || 'Produto'}" adicionado ao registro de perdas.`);
    }

    setIsWasteScannerOpen(false);
  };

  const handleRegenerateCode = async () => {
    if (!company) return;
    const newCode = generateActivationCode();
    if (confirm(`Deseja gerar um novo código de ativação? O novo código será: ${newCode}`)) {
      try {
        await StorageService.updateCompanyCode(company.codigoAtivacao, newCode);
        setActiveCode(newCode);
        showToast('Código de ativação atualizado!');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Calculations
  const normalProducts = products.filter((p) => p.status === 'normal');
  const expiringProducts = products.filter((p) => p.status === 'vencendo');
  const expiredProducts = products.filter((p) => p.status === 'vencido');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentYearMonth = todayStr.substring(0, 7);

  const expiredTodayProducts = expiredProducts.filter(
    (p) => p.dataValidade === todayStr || p.dataCadastro === todayStr
  );
  const expiredMonthProducts = expiredProducts.filter(
    (p) =>
      (p.dataValidade && p.dataValidade.startsWith(currentYearMonth)) ||
      (p.dataCadastro && p.dataCadastro.startsWith(currentYearMonth)) ||
      p.status === 'vencido'
  );

  const expiredTodayCount = expiredTodayProducts.reduce((acc, p) => acc + p.quantidade, 0);
  const expiredTodayValue = expiredTodayProducts.reduce(
    (acc, p) => acc + (p.valorTotal || p.quantidade * (p.valorKg || 12.0)),
    0
  );

  const expiredMonthCount = expiredMonthProducts.reduce((acc, p) => acc + p.quantidade, 0);
  const expiredMonthValue = expiredMonthProducts.reduce(
    (acc, p) => acc + (p.valorTotal || p.quantidade * (p.valorKg || 12.0)),
    0
  );

  // Filtered Table Data
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.categoria && p.categoria.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || p.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoriesList = Array.from(new Set(products.map((p) => p.categoria || 'Geral')));

  // IF NOT LOGGED IN -> RENDER ACTIVATION CODE LOGIN SCREEN
  if (!activeCode || !company) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F9FAFB]">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E0E0E0] p-8 space-y-6 animate-scale-up">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#1F2937] text-white flex items-center justify-center shadow-lg relative">
              <ChefHat className="w-9 h-9 text-[#D4A574]" />
              <div className="absolute -bottom-1 -right-1 bg-[#EF4444] p-1 rounded-full border-2 border-white">
                <Clock className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-black text-[#1F2937]">
                PADARIA<span className="text-[#EF4444]">.io</span>
              </h1>
              <p className="text-xs font-semibold text-gray-500 mt-1">
                "Seu controle de desperdícios começa aqui"
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[#1F2937] uppercase tracking-wider mb-1">
                Código de Ativação (8 Dígitos)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={8}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="EX: AB12CD34"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 font-mono font-bold text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-[#1F2937] uppercase text-[#1F2937]"
                  autoFocus
                  required
                />
                <Key className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center space-x-2 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    className="rounded border-gray-300 text-[#1F2937] focus:ring-[#1F2937]"
                  />
                  <span>Manter conectado 30 dias</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Entre em contato com o suporte da PADARIA.io para recuperar seu código de ativação.')}
                  className="text-xs font-bold text-[#E8571A] hover:underline"
                >
                  Esqueceu seu código?
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-center">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#1F2937] hover:bg-black text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md text-sm flex items-center justify-center space-x-2"
            >
              <span>Entrar no Sistema</span>
              <Sparkles className="w-4 h-4 text-[#D4A574]" />
            </button>
          </form>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-100 text-center text-[11px] text-gray-400">
            PADARIA.io v2.5 • Sistema Exclusivo de Controle de Perdas com IA
          </div>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD WHEN LOGGED IN
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 pb-28 sm:pb-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-[#2C2C2C] text-white font-bold px-4 py-3 rounded-xl shadow-xl text-xs border border-[#D4A574] animate-bounce flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#D4A574]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E0E0E0] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#2C2C2C]">{company.empresa}</h1>
            <span className="px-2.5 py-0.5 bg-orange-50 text-[#E8571A] border border-orange-200 text-[11px] font-mono font-bold rounded-lg">
              CÓD: {company.codigoAtivacao}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Monitoramento em tempo real de validades e estoque • {company.email}
          </p>
        </div>

        {/* Quick Action Buttons Grid on Mobile */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSupportOpen(true)}
            className="px-3 py-2 rounded-xl bg-orange-50 hover:bg-[#E8571A] hover:text-white text-[#E8571A] text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer border border-orange-200"
            title="Solicitar Suporte Técnico"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Suporte</span>
          </button>

          <button
            onClick={() => setIsPrintReportOpen(true)}
            className="px-3 py-2 rounded-xl bg-[#F5E6D3] hover:bg-[#D4A574] hover:text-white text-[#2C2C2C] text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Relatório</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar (Scrollable on Mobile) */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTab === 'dashboard' ? 'bg-[#1F2937] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>📊 Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab('analise')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTab === 'analise' ? 'bg-[#1F2937] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>📈 Análise</span>
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTab === 'insights' ? 'bg-[#1F2937] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>🤖 Insights IA</span>
        </button>
        <button
          onClick={() => setActiveTab('relatorio')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTab === 'relatorio' ? 'bg-[#1F2937] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>📋 Relatório</span>
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTab === 'config' ? 'bg-[#1F2937] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>⚙️ Config</span>
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* 1. RESUMO RÁPIDO CARDS (Responsive 2x2 grid on mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
            {/* Card 1: Perdas do Mês */}
            <div className="bg-white border border-[#E0E0E0] rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-red-600 uppercase tracking-wider">Perdas Mês</span>
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">R$</span>
              </div>
              <div className="mt-3 sm:mt-4">
                <div className="text-xl sm:text-2xl font-black text-[#1F2937]">R$ {expiredMonthValue.toFixed(2)}</div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-1 flex items-center space-x-1">
                  <span className="text-red-600 font-bold">↑ 12%</span>
                  <span className="hidden sm:inline">vs. mês anterior</span>
                </div>
              </div>
            </div>

            {/* Card 2: Quantidade Descartada */}
            <div className="bg-white border border-[#E0E0E0] rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-600 uppercase tracking-wider">Qtd Descarte</span>
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">📦</span>
              </div>
              <div className="mt-3 sm:mt-4">
                <div className="text-xl sm:text-2xl font-black text-[#1F2937]">{expiredMonthCount} un</div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-1 flex items-center space-x-1">
                  <span className="text-emerald-600 font-bold">↓ 5%</span>
                  <span className="hidden sm:inline">estoque</span>
                </div>
              </div>
            </div>

            {/* Card 3: Categoria Top Perda */}
            <div className="bg-white border border-[#E0E0E0] rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-[#1F2937] uppercase tracking-wider">Top Perda</span>
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 text-[#1F2937] flex items-center justify-center font-bold text-xs">🏷️</span>
              </div>
              <div className="mt-3 sm:mt-4">
                <div className="text-base sm:text-lg font-black text-[#1F2937] truncate">
                  {categoriesList[0] || 'Pães'}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-1 truncate">
                  Vencimento
                </div>
              </div>
            </div>

            {/* Card 4: Economia Potencial */}
            <div className="bg-white border border-[#E0E0E0] rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-xs border-emerald-200 bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">Economia IA</span>
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">💡</span>
              </div>
              <div className="mt-3 sm:mt-4">
                <div className="text-xl sm:text-2xl font-black text-emerald-700">R$ 850,00</div>
                <div className="text-[10px] sm:text-xs text-emerald-600 font-medium mt-1">
                  Ativa
                </div>
              </div>
            </div>
          </div>

          {/* Evolution Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E0E0E0] shadow-xs">
            <h2 className="text-base sm:text-lg font-extrabold text-[#1F2937] mb-3">Evolução do Desperdício (Últimos 30 Dias)</h2>
            <WasteChartSection products={products} />
          </div>
        </>
      )}

      {activeTab === 'analise' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#1F2937]">Análise Detalhada de Perdas</h2>
              <p className="text-xs text-gray-500">Filtre por período, categoria e motivo para identificar gargalos operacionais.</p>
            </div>
            <button
              onClick={() => setIsPrintReportOpen(true)}
              className="px-4 py-2 bg-[#1F2937] hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Exportar Relatório PDF</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Data Início</label>
              <input
                type="date"
                value={analysisStartDate}
                onChange={(e) => setAnalysisStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Data Fim</label>
              <input
                type="date"
                value={analysisEndDate}
                onChange={(e) => setAnalysisEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Categoria</label>
              <select
                value={analysisCategory}
                onChange={(e) => setAnalysisCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white"
              >
                <option value="all">Todas as Categorias</option>
                {categoriesList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Motivo do Descarte</label>
              <select
                value={analysisMotivo}
                onChange={(e) => setAnalysisMotivo(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white"
              >
                <option value="all">Todos os Motivos</option>
                <option value="Vencimento">Vencimento de Validade</option>
                <option value="Avaria">Avaria / Embalagem Danificada</option>
                <option value="Excedente">Produção Excedente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 border border-gray-200 rounded-xl bg-white space-y-3">
              <h3 className="font-extrabold text-sm text-[#1F2937]">Distribuição por Categoria</h3>
              <div className="space-y-2">
                {categoriesList.map((cat, idx) => {
                  const catProducts = products.filter((p) => p.categoria === cat);
                  const catVal = catProducts.reduce((acc, p) => acc + (p.valorTotal || p.quantidade * (p.valorKg || 12)), 0);
                  const totalVal = products.reduce((acc, p) => acc + (p.valorTotal || p.quantidade * (p.valorKg || 12)), 1);
                  const pct = Math.round((catVal / totalVal) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>{cat}</span>
                        <span>R$ {catVal.toFixed(2)} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1F2937] rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border border-gray-200 rounded-xl bg-white space-y-4">
              <h3 className="font-extrabold text-sm text-[#1F2937]">Análise Inteligente de Causas</h3>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 text-xs text-orange-900 space-y-2">
                <p className="font-bold flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span>Padrão Detectado pela IA:</span>
                </p>
                <p>
                  74% dos descartes na categoria de Pães e Confeitaria ocorrem entre terças e quintas-feiras devido a superprodução matinal. Sugerimos reduzir a fornada de 14h em 25%.
                </p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <p className="font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Oportunidade de Redução:</span>
                </p>
                <p>
                  Aplicando descontos dinâmicos de 30% em produtos com 2 dias para vencer, sua padaria pode recuperar até R$ 1.400,00 mensais em receita perdida.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-extrabold text-[#1F2937]">Insights com IA para Redução de Desperdícios</h2>
            </div>
            <p className="text-xs text-gray-500">Recomendações automatizadas baseadas no histórico de descartes da sua panificadora.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">1</div>
              <h3 className="font-extrabold text-sm text-[#1F2937]">Ajuste de Fornadas Noturnas</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Identificamos sobra recorrente de baguetes e pão doce após as 19h. Recomendamos congelar massa pré-fermentada em vez de assar o lote completo.
              </p>
              <div className="pt-2">
                <span className="inline-block bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  Economia estimada: R$ 420/mês
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">2</div>
              <h3 className="font-extrabold text-sm text-[#1F2937]">Giro de Estoque FIFO</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Produtos lácteos e recheios estão ficando no fundo das prateleiras. Reorganize o estoque aplicando rigorosamente o princípio "Primeiro a Entrar, Primeiro a Sair".
              </p>
              <div className="pt-2">
                <span className="inline-block bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  Redução de perdas: 18%
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">3</div>
              <h3 className="font-extrabold text-sm text-[#1F2937]">Campanha de Promoção Relâmpago</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Para itens com vencimento em 24h, envie alertas automáticos no WhatsApp dos clientes cadastrados no clube de fidelidade oferecendo combo promocional.
              </p>
              <div className="pt-2">
                <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  Recuperação de receita
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'relatorio' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-4 sm:space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1F2937]">Relatório Executivo de Descartes</h2>
              <p className="text-xs text-gray-500">Visualize e exporte o relatório completo com todas as especificações dos produtos vencidos.</p>
            </div>
            <button
              onClick={() => setIsPrintReportOpen(true)}
              className="w-full md:w-auto px-4 py-2.5 bg-[#E8571A] hover:bg-[#d44e15] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF Executivo</span>
            </button>
          </div>

          <div className="p-4 sm:p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#1F2937]">{company.empresa}</h3>
                <p className="text-xs text-gray-500">CNPJ: {company.cnpj || '00.000.000/0001-00'} • Código: {company.codigoAtivacao}</p>
              </div>
              <div>
                <span className="inline-block text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">
                  Período Atual: Mês Corrente
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-200 text-center">
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                <div className="text-[11px] text-gray-500 font-bold uppercase">Total Descartado</div>
                <div className="text-lg sm:text-xl font-black text-[#1F2937] mt-1">{expiredMonthCount} unidades</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                <div className="text-[11px] text-gray-500 font-bold uppercase">Prejuízo Financeiro</div>
                <div className="text-lg sm:text-xl font-black text-red-600 mt-1">R$ {expiredMonthValue.toFixed(2)}</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                <div className="text-[11px] text-gray-500 font-bold uppercase">Eficiência Operacional</div>
                <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1">84.2%</div>
              </div>
            </div>
          </div>

          {/* Quick List Preview of Vencidos for Mobile */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-[#2C2C2C]">Resumo de Itens Vencidos ({expiredMonthProducts.length})</h3>
              <button
                onClick={() => setIsPrintReportOpen(true)}
                className="text-xs font-bold text-[#E8571A] hover:underline cursor-pointer"
              >
                Ver Relatório Completo →
              </button>
            </div>

            {expiredMonthProducts.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center italic border border-dashed border-gray-200 rounded-xl">
                Nenhum produto vencido no mês atual.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {expiredMonthProducts.map((item) => {
                  const unitVal = item.valorKg || 12.0;
                  const totalVal = item.valorTotal || item.quantidade * unitVal;
                  return (
                    <div key={item.id} className="p-3 bg-red-50/60 border border-red-200/70 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-red-950 text-xs">{item.nome}</div>
                        <div className="text-[10px] text-gray-500">
                          {item.categoria || 'Geral'} • Validade: {formatDateToBR(item.dataValidade)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-red-800 text-xs">R$ {totalVal.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-600 font-bold">{item.quantidade} un</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-[#1F2937]">Configurações da Padaria</h2>
            <p className="text-xs text-gray-500">Gerencie os dados da empresa, código de ativação, categorias e suporte.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 border border-gray-200 rounded-xl space-y-4">
              <h3 className="font-extrabold text-sm text-[#1F2937] flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-[#E8571A]" />
                <span>Dados da Empresa</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-600 uppercase mb-1">Nome da Padaria</label>
                  <input
                    type="text"
                    value={company.empresa}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 uppercase mb-1">Código de Ativação</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={company.codigoAtivacao}
                      disabled
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-mono font-bold"
                    />
                    <button
                      onClick={handleRegenerateCode}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg text-xs"
                    >
                      Renovar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border border-gray-200 rounded-xl space-y-4">
              <h3 className="font-extrabold text-sm text-[#1F2937] flex items-center space-x-2">
                <LifeBuoy className="w-4 h-4 text-[#E8571A]" />
                <span>Suporte Técnico e Atendimento</span>
              </h3>
              <p className="text-xs text-gray-600">
                Precisa de auxílio com a leitura de etiquetas por IA ou relatórios? Nossa equipe está pronta para ajudar.
              </p>
              <button
                onClick={() => setIsSupportOpen(true)}
                className="px-4 py-2.5 bg-[#1F2937] hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2"
              >
                <LifeBuoy className="w-4 h-4" />
                <span>Abrir Chamado de Suporte</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. GERENCIAR PRODUTOS (TABELA INTERATIVA) */}
      <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-4">
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-extrabold text-[#2C2C2C]">2. Registro de Descartes</h2>
            <p className="text-xs text-gray-500">Tabela em tempo real de validade e saldo</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
            >
              <option value="all">Todas as Categorias</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile Product Card View (Visible on small screens) */}
        <div className="md:hidden space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="font-bold text-sm text-gray-700">Nenhum registro encontrado.</p>
              <p className="text-xs text-gray-500 mt-1">Toque em "+ Registrar" para adicionar um descarte.</p>
            </div>
          ) : (
            filteredProducts.map((p) => (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  p.status === 'vencido'
                    ? 'bg-red-50/40 border-red-200'
                    : p.status === 'vencendo'
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-white border-gray-200 shadow-xs'
                }`}
              >
                {/* Header: Title, Category & Status Pill */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#2C2C2C]">{p.nome}</h3>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className="text-[10px] font-semibold bg-[#F5E6D3] text-[#2C2C2C] px-2 py-0.5 rounded-full">
                        {p.categoria || 'Geral'}
                      </span>
                      {p.barcode && (
                        <span className="text-[9px] font-mono text-gray-400">
                          #{p.barcode.slice(-6)}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      p.status === 'vencido'
                        ? 'bg-red-100 text-red-700'
                        : p.status === 'vencendo'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {p.status === 'vencido'
                      ? 'Vencido'
                      : p.status === 'vencendo'
                      ? 'Vencendo'
                      : 'Em dia'}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100/80">
                  <div className="bg-white/80 p-2 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Quantidade</span>
                    <span className="font-black text-[#2C2C2C] text-sm">{p.quantidade} un</span>
                  </div>

                  <div className="bg-white/80 p-2 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Valor Total</span>
                    <span className="font-black text-[#2C2C2C] text-sm">
                      {p.valorTotal ? `R$ ${p.valorTotal.toFixed(2)}` : 'Não inf.'}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-between text-[11px] pt-1">
                    <div className="text-gray-500">
                      Validade: <strong className="text-[#2C2C2C]">{formatDateToBR(p.dataValidade)}</strong>
                    </div>
                    <div
                      className={`font-bold ${
                        p.status === 'vencido'
                          ? 'text-red-600'
                          : p.status === 'vencendo'
                          ? 'text-amber-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {getRelativeExpirationText(p.diasParaVencer)}
                    </div>
                  </div>
                </div>

                {/* Card Mobile Action Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setProductToEdit(p);
                      setIsProductModalOpen(true);
                    }}
                    className="flex-1 py-2 rounded-xl bg-[#F5E6D3] hover:bg-[#D4A574] text-[#2C2C2C] font-bold text-xs transition-colors flex items-center justify-center space-x-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(p.id, p.nome)}
                    className="py-2 px-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 font-bold text-xs transition-colors flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Products Desktop Table (Hidden on small screens) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAF8] text-gray-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-gray-200">
                <th className="py-3.5 px-4">Produto</th>
                <th className="py-3.5 px-4">Quantidade</th>
                <th className="py-3.5 px-4">Datas (Fab / Validade)</th>
                <th className="py-3.5 px-4">Valores (Un. / Total)</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-[#2C2C2C]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <p className="font-bold text-sm">Nenhum registro encontrado.</p>
                    <p className="text-xs mt-1">Clique em "+ Registrar Descarte" para adicionar.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-gray-50/80 ${
                      p.status === 'vencido'
                        ? 'bg-red-50/30'
                        : p.status === 'vencendo'
                        ? 'bg-amber-50/30'
                        : ''
                    }`}
                  >
                    {/* Produto Name & Category */}
                    <td className="py-3.5 px-4 font-bold">
                      <div className="text-sm font-extrabold text-[#2C2C2C]">{p.nome}</div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[10px] font-semibold bg-[#F5E6D3] text-[#2C2C2C] px-2 py-0.5 rounded-full">
                          {p.categoria || 'Geral'}
                        </span>
                      </div>
                    </td>

                    {/* Quantidade */}
                    <td className="py-3.5 px-4">
                      <span className="text-sm font-black text-[#2C2C2C] bg-gray-100 px-3 py-1 rounded-xl">
                        {p.quantidade} un
                      </span>
                    </td>

                    {/* Datas */}
                    <td className="py-3.5 px-4">
                      {p.dataFabricacao && (
                        <div className="text-xs text-gray-500">Fab: {formatDateToBR(p.dataFabricacao)}</div>
                      )}
                      <div className="font-extrabold text-sm text-[#2C2C2C]">Val: {formatDateToBR(p.dataValidade)}</div>
                      <div
                        className={`text-[11px] font-bold ${
                          p.status === 'vencido'
                            ? 'text-red-600'
                            : p.status === 'vencendo'
                            ? 'text-amber-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {getRelativeExpirationText(p.diasParaVencer)}
                      </div>
                    </td>

                    {/* Valores */}
                    <td className="py-3.5 px-4">
                      {p.valorKg ? (
                        <div className="text-xs text-gray-500">R$ {p.valorKg.toFixed(2)} / KG</div>
                      ) : (
                        <div className="text-xs text-gray-400">KG não inf.</div>
                      )}
                      {p.valorTotal ? (
                        <div className="font-extrabold text-sm text-[#2C2C2C]">Total: R$ {p.valorTotal.toFixed(2)}</div>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {/* Editar */}
                      <button
                        onClick={() => {
                          setProductToEdit(p);
                          setIsProductModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-[#F5E6D3] hover:bg-[#D4A574] hover:text-white text-[#2C2C2C] transition-colors cursor-pointer"
                        title="Editar Produto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Deletar */}
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.nome)}
                        className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors cursor-pointer"
                        title="Excluir Produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
      />
      
      {isWasteScannerOpen && (
        <ImageScanner
          bakeryCode={company?.codigoAtivacao}
          onScanResult={handleWasteScanResult}
          onClose={() => setIsWasteScannerOpen(false)}
        />
      )}

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        expiredProducts={expiredProducts}
        expiringProducts={expiringProducts}
      />

      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

      {company && (
        <>
          <PrintReportModal
            isOpen={isPrintReportOpen}
            onClose={() => setIsPrintReportOpen(false)}
            company={company}
            products={products}
          />
          <SupportModal
            isOpen={isSupportOpen}
            onClose={() => setIsSupportOpen(false)}
            bakeryCode={company.codigoAtivacao}
            empresaNome={company.empresa}
          />
        </>
      )}

      {/* Floating Action Button (FAB - Positioned safely above mobile dock) */}
      <button
        onClick={() => {
          setProductToEdit(null);
          setIsProductModalOpen(true);
        }}
        className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-30 w-14 h-14 sm:w-16 sm:h-16 bg-[#E8571A] hover:bg-[#d44e15] text-white rounded-full flex items-center justify-center text-2xl sm:text-3xl font-light shadow-xl shadow-[#E8571A]/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer border-2 border-white"
        title="Adicionar Novo Produto"
      >
        +
      </button>

      {/* FIXED MOBILE BOTTOM APP TAB BAR (DOCK) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 px-3 py-1.5 flex justify-around items-center shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'dashboard' ? 'text-[#E8571A] font-extrabold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Início</span>
        </button>

        <button
          onClick={() => setActiveTab('analise')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'analise' ? 'text-[#E8571A] font-extrabold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Filter className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Análise</span>
        </button>

        {/* Center Accent IA Scanner Button */}
        <button
          onClick={() => setIsWasteScannerOpen(true)}
          className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-tr from-[#E8571A] to-[#D4A574] text-white p-3 rounded-full shadow-lg shadow-[#E8571A]/40 border-2 border-white active:scale-95 transition-transform"
        >
          <Sparkles className="w-5 h-5 text-amber-200" />
        </button>

        <button
          onClick={() => setActiveTab('relatorio')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'relatorio' ? 'text-[#E8571A] font-extrabold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Printer className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Relatórios</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'config' ? 'text-[#E8571A] font-extrabold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Config</span>
        </button>
      </nav>
    </div>
  );
};
