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
  Camera,
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
  Crown,
  Moon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Download,
  Boxes,
  ClipboardCheck,
  Scale,
  UserCheck,
  Layers,
  Cake,
  Activity,
  Folder
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BakeryCompany, Product, ProductStatus, SaleHistoryItem, VipOffer } from '../types';
import { StorageService } from '../services/storageService';
import { useData } from '../context/DataContext';
import { StockControl } from './StockControl';
import { formatDateToBR, getRelativeExpirationText, generateActivationCode, calculateDaysRemaining, formatDateToISO } from '../utils/dateUtils';
import { generateContractPDF, generateSystemManualPDF, generateExecutiveReportPDF } from '../utils/pdfGenerator';
import { ProductModal } from './ProductModal';
import { NotificationsModal } from './NotificationsModal';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { PrintReportModal } from './PrintReportModal';
import { SupportModal } from './SupportModal';
import { ImageScanner } from './ImageScanner';
import { WasteChartSection } from './WasteChartSection';
import { VipClubSection } from './VipClubSection';
import { VipOfferModal } from './VipOfferModal';
import { PadeIA } from './PadeIA';
import { OwnerSummaryDashboard } from './OwnerSummaryDashboard';
import { TeamRoutineSection } from './TeamRoutineSection';
import { DivergencesSection } from './DivergencesSection';
import { CategorySettings } from './CategorySettings';
import { PartyKitsSection } from './party/PartyKitsSection';
import { BakerySidebar, BakeryTabType } from './BakerySidebar';

interface BakeryAppProps {
  presetCode?: string | null;
  onLogout?: () => void;
}

export const BakeryApp: React.FC<BakeryAppProps> = ({ presetCode, onLogout }) => {
  const {
    activeCode,
    activeCompany: company,
    products,
    categories,
    salesHistory,
    vipOffers,
    newPartyOrdersCount,
    setActiveCode,
    loginAsBakeryWithCredentials,
    addProduct,
    updateProduct,
    deleteProduct,
    markAsSold,
    restoreSoldProduct,
    clearSalesHistory,
    addVipOffer,
    updateVipOfferStatus,
    updateVipOffer,
    deleteVipOffer
  } = useData();

  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState<boolean>(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'summary' | 'divergences' | 'routine' | 'party' | 'stock' | 'dashboard' | 'vip' | 'padeia' | 'relatorio' | 'config'>('summary');

  useEffect(() => {
    const handleOpenPadeia = () => setActiveTab('padeia');
    window.addEventListener('open-padeia-tab', handleOpenPadeia);
    return () => window.removeEventListener('open-padeia-tab', handleOpenPadeia);
  }, []);
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
  const [isSavingExecPdf, setIsSavingExecPdf] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);

  const handleDownloadExecPdfDirect = async () => {
    if (!company) return;
    setIsSavingExecPdf(true);
    try {
      await generateExecutiveReportPDF(company, products, 'todos', vipOffers);
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
    } finally {
      setIsSavingExecPdf(false);
    }
  };
  const [isVipOfferModalOpen, setIsVipOfferModalOpen] = useState<boolean>(false);
  const [vipOfferProductInfo, setVipOfferProductInfo] = useState<{
    productId: string;
    nomeProduto: string;
    categoria: string;
    valorOriginal: number;
    dataValidade: string;
    barcode?: string;
  } | null>(null);

  // Accordion UI state
  const [isSettingsExpanded, setIsSettingsExpanded] = useState<boolean>(false);
  const [showReminder, setShowReminder] = useState<boolean>(true);

  // Toast / Feedback State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanEmail || !cleanPass) {
      setLoginError('Por favor, preencha o e-mail e a senha de acesso.');
      return;
    }

    setIsSubmittingLogin(true);
    try {
      const res = await loginAsBakeryWithCredentials(cleanEmail, cleanPass);
      if (!res.success) {
        setLoginError(res.error || 'E-mail ou senha incorretos.');
      } else {
        setEmailInput('');
        setPasswordInput('');
      }
    } catch (err) {
      setLoginError('Ocorreu um erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleLogout = () => {
    setActiveCode(null);
    if (onLogout) {
      onLogout();
    }
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
    notas?: string,
    peso?: number
  ) => {
    if (!company) return;

    const todayStr = formatDateToISO(new Date());
    if (dataValidade > todayStr) {
      alert('PRODUTO COM VALIDADE FUTURA!\n\nEste sistema é EXCLUSIVO para controle de VENCIDOS, DESPERDÍCIOS e DESCARTES. Produtos com data de validade futura (a partir de amanhã) não podem ser cadastrados para descarte.');
      return;
    }

    try {
      if (productToEdit) {
        await updateProduct(
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
          notas,
          peso
        );
        showToast('Descarte atualizado com sucesso!');
      } else {
        const newProduct = await addProduct(
          nome,
          quantidade,
          dataValidade,
          categoria,
          barcode,
          valorKg,
          dataFabricacao,
          valorTotal,
          motivo,
          notas,
          peso
        );
        showToast('Descarte registrado com sucesso!');

        // Trigger VIP modal if expiring in <= 3 days
        const daysLeft = calculateDaysRemaining(dataValidade);
        if (daysLeft >= 0 && daysLeft <= 3) {
          setVipOfferProductInfo({
            productId: newProduct.id,
            nomeProduto: newProduct.nome,
            categoria: newProduct.categoria || 'Geral',
            valorOriginal: valorTotal && valorTotal > 0 ? valorTotal : (valorKg && valorKg > 0 ? valorKg : 15.0),
            dataValidade: newProduct.dataValidade,
            barcode: newProduct.barcode,
          });
          setIsVipOfferModalOpen(true);
        }
      }
      setProductToEdit(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar produto.');
    }
  };

  const handleCreateVipOffer = async (data: {
    valorOriginal: number;
    valorPromocional: number;
    desconto: number;
    nomeProduto: string;
    categoria: string;
  }) => {
    if (!company || !vipOfferProductInfo) return;

    try {
      await StorageService.addVipOffer(
        company.codigoAtivacao,
        vipOfferProductInfo.productId,
        data.nomeProduto,
        data.categoria,
        data.valorOriginal,
        data.valorPromocional,
        data.desconto,
        vipOfferProductInfo.dataValidade,
        vipOfferProductInfo.barcode
      );
      
      showToast(`Oferta de "${data.nomeProduto}" registrada com sucesso!`);
      setIsVipOfferModalOpen(false);
      setVipOfferProductInfo(null);
      
      setActiveTab('dashboard');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      alert(err.message || 'Erro ao criar oferta VIP.');
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
    quantidade?: number;
    dataFabricacao?: string;
    dataValidade?: string;
    peso?: number;
    valorKg?: number;
    valorTotal?: number;
    barcode?: string;
    categoria?: string;
    tipoProduto?: 'individual' | 'lote' | 'peso';
  }) => {
    if (!company) return;

    const normalizeStr = (s: string) => s.toLowerCase().trim();
    const scannedBarcode = result.barcode ? result.barcode.trim() : '';
    const quantityToRegister = result.quantidade || 1;

    // Calculate days remaining to determine status
    const valDate = result.dataValidade || formatDateToISO(new Date());
    const daysLeft = calculateDaysRemaining(valDate);
    const computedStatus = daysLeft < 0 ? 'vencido' : daysLeft <= 3 ? 'vencendo' : 'normal';

    if (computedStatus !== 'vencido') {
      alert('PRODUTO AINDA DENTRO DA VALIDADE!\n\nEste sistema foi reformulado para aceitar EXCLUSIVAMENTE o registro de produtos que já venceram (pelo menos 1 dia após a validade) para controle de perdas e descarte.');
      setIsWasteScannerOpen(false);
      return;
    }

    // 1. FIRST attempt to match existing product by barcode!
    let bestMatch = scannedBarcode
      ? products.find((p) => p.barcode && p.barcode.trim() === scannedBarcode)
      : undefined;

    // 2. FALLBACK to matching by product name if no barcode match
    if (!bestMatch && result.nome) {
      bestMatch = products.find(
        (p) => normalizeStr(p.nome).includes(normalizeStr(result.nome))
      );
    }

    if (bestMatch && computedStatus === 'vencido') {
      if (bestMatch.quantidade > quantityToRegister) {
        // Decrement existing active stock
        await StorageService.updateProduct(
          bestMatch.id,
          bestMatch.nome,
          bestMatch.quantidade - quantityToRegister,
          bestMatch.dataValidade,
          bestMatch.categoria,
          bestMatch.barcode,
          bestMatch.valorKg,
          bestMatch.dataFabricacao,
          bestMatch.valorTotal,
          bestMatch.motivo,
          bestMatch.notas,
          bestMatch.peso
        );
        // Add a dedicated expired record for the discarded units
        await StorageService.addProduct(
          company.codigoAtivacao,
          bestMatch.nome,
          quantityToRegister,
          result.dataValidade || bestMatch.dataValidade,
          result.categoria || bestMatch.categoria,
          scannedBarcode || bestMatch.barcode,
          result.valorKg !== undefined ? result.valorKg : bestMatch.valorKg,
          result.dataFabricacao || bestMatch.dataFabricacao,
          result.valorTotal !== undefined ? result.valorTotal : (bestMatch.valorTotal ? bestMatch.valorTotal / bestMatch.quantidade : undefined),
          'Vencimento',
          'Descartado via Leitor IA (Rótulos)',
          result.peso !== undefined ? result.peso : bestMatch.peso,
          'vencido'
        );
      } else {
        // Update the product to status 'vencido'
        await StorageService.updateProduct(
          bestMatch.id,
          bestMatch.nome,
          quantityToRegister,
          result.dataValidade || bestMatch.dataValidade,
          result.categoria || bestMatch.categoria,
          scannedBarcode || bestMatch.barcode,
          result.valorKg !== undefined ? result.valorKg : bestMatch.valorKg,
          result.dataFabricacao || bestMatch.dataFabricacao,
          result.valorTotal !== undefined ? result.valorTotal : bestMatch.valorTotal,
          'Vencimento',
          'Descartado via Leitor IA (Rótulos)',
          result.peso !== undefined ? result.peso : bestMatch.peso,
          'vencido'
        );
      }
      showToast(`Descarte registrado! ${quantityToRegister} unidade(s) de "${bestMatch.nome}" contabilizada(s) nas perdas.`);
    } else {
      const newProd = await StorageService.addProduct(
        company.codigoAtivacao,
        result.nome || 'Produto Escaneado',
        quantityToRegister,
        valDate,
        result.categoria || 'Panificação',
        scannedBarcode,
        result.valorKg,
        result.dataFabricacao,
        result.valorTotal,
        computedStatus === 'vencido' ? 'Vencimento' : 'Cadastro Novo',
        `Cadastrado via Leitor IA (Tipo: ${result.tipoProduto || 'individual'})`,
        result.peso,
        computedStatus
      );
      bestMatch = newProd;
      showToast(`Produto cadastrado: "${newProd.nome}" (${quantityToRegister} un) adicionado ao estoque.`);
    }

    // Trigger VIP modal if scanned product is expiring in <= 3 days
    if (result.dataValidade) {
      const daysLeft = calculateDaysRemaining(result.dataValidade);
      if (daysLeft >= 0 && daysLeft <= 3) {
        setVipOfferProductInfo({
          productId: bestMatch ? bestMatch.id : 'scanned_' + Date.now(),
          nomeProduto: result.nome || 'Produto Escaneado',
          categoria: 'Geral',
          valorOriginal: result.valorTotal && result.valorTotal > 0 ? result.valorTotal : (result.valorKg && result.valorKg > 0 ? result.valorKg : 15.0),
          dataValidade: result.dataValidade,
          barcode: result.barcode || (bestMatch ? bestMatch.barcode : undefined),
        });
        setIsVipOfferModalOpen(true);
      }
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
    (acc, p) => acc + (p.valorTotal || (p.peso && p.valorKg ? p.peso * p.valorKg : p.quantidade * (p.valorKg || 12.0))),
    0
  );

  const expiredMonthCount = expiredMonthProducts.reduce((acc, p) => acc + p.quantidade, 0);
  const expiredMonthValue = expiredMonthProducts.reduce(
    (acc, p) => acc + (p.valorTotal || (p.peso && p.valorKg ? p.peso * p.valorKg : p.quantidade * (p.valorKg || 12.0))),
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

  const categoriesList = Array.from(new Set([...categories, ...products.map((p) => p.categoria || 'Geral')]));

  // IF NOT LOGGED IN -> RENDER ACTIVATION CODE LOGIN SCREEN
  if (!activeCode || !company) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F9FAFB]">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E0E0E0] p-8 space-y-6 animate-scale-up">
          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <img 
                src="https://i.imgur.com/ZGsjvWy.png" 
                alt="PADARIA.io Logo" 
                className="h-28 sm:h-36 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mt-1">
                "Seu controle de desperdícios começa aqui"
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[#1F2937] uppercase tracking-wider mb-1">
                E-mail ou Código de Ativação
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="seuemail@padaria.com.br ou Código"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2937] text-[#1F2937]"
                  autoFocus
                  required
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#1F2937] uppercase tracking-wider mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2937] text-[#1F2937]"
                  required
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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
                  onClick={() => alert('Entre em contato com o administrador da PADARIA.io para redefinir sua senha de acesso.')}
                  className="text-xs font-bold text-[#E8571A] hover:underline"
                >
                  Esqueceu sua senha?
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
              disabled={isSubmittingLogin}
              className="w-full bg-[#1F2937] hover:bg-black disabled:bg-gray-400 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md text-sm flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmittingLogin ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Entrando no Sistema...</span>
                </div>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <Sparkles className="w-4 h-4 text-[#D4A574]" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <a
                href="https://wa.me/5561996507712?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20e%20criar%20uma%20conta%20no%20PADARIA.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-gray-600 hover:text-[#E8571A] transition-colors inline-flex items-center space-x-1"
              >
                <span>Não tem conta?</span>
                <span className="text-[#E8571A] font-extrabold underline">Entre em contato Agora mesmo</span>
              </a>
            </div>
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
    <div className="max-w-7xl 2xl:max-w-[1550px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-28 lg:pb-8">
      {/* Reminder Banner */}
      {showReminder && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold">Lembrete:</span>
            <span>Olhe o aplicativo regularmente para conferir o controle de estoque e validades dos produtos.</span>
          </div>
          <button 
            onClick={() => setShowReminder(false)}
            className="text-amber-700 hover:text-amber-900 font-bold px-2 py-1 cursor-pointer text-xs shrink-0"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-[#2C2C2C] text-white font-bold px-4 py-3 rounded-xl shadow-xl text-xs border border-[#D4A574] animate-bounce flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#D4A574]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Layout Wrapper with PC Sidebar and Content Area */}
      <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
        {/* PC Sidebar Navigation */}
        <BakerySidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          newPartyOrdersCount={newPartyOrdersCount}
          onOpenNewProductModal={() => {
            setProductToEdit(null);
            setIsProductModalOpen(true);
          }}
          onOpenScanner={() => setIsWasteScannerOpen(true)}
          onOpenSupport={() => setIsSupportOpen(true)}
          onOpenPrintReport={() => setIsPrintReportOpen(true)}
          companyName={company.empresa}
          companyEmail={company.email}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          {/* Mobile App Header (Native App Feel) */}
          <div className="sm:hidden bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                <Boxes className="w-5 h-5 text-[#FF6B00]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h1 className="text-sm font-black text-[#2C2C2C] truncate">{company.empresa}</h1>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
                </div>
                <p className="text-[11px] text-gray-500 font-medium truncate">
                  {company.email || 'App Operacional'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsWasteScannerOpen(true)}
                className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white flex items-center justify-center shadow-xs transition-transform cursor-pointer"
                title="Escanear com Câmera"
                aria-label="Escanear Câmera"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsSupportOpen(true)}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 flex items-center justify-center transition-transform cursor-pointer"
                title="Suporte"
                aria-label="Suporte"
              >
                <LifeBuoy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Banner Header */}
          <div className="hidden sm:flex bg-white p-4 sm:p-5 rounded-2xl border border-[#E0E0E0] shadow-xs flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#2C2C2C]">{company.empresa}</h1>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Monitoramento em tempo real de validades e estoque • {company.email}
              </p>
            </div>

            {/* Quick Action Buttons Grid */}
            <div className="flex flex-wrap items-center gap-2">
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

          {/* Navigation Tabs Bar (Mobile / Tablet Only - Hidden on PC/Desktop because Sidebar is used) */}
          <div className="lg:hidden flex items-center space-x-2 border-b border-gray-200/80 pb-2.5 overflow-x-auto no-scrollbar scroll-smooth px-0.5">
            {/* 1. Resumo do Dono */}
            <button
              id="tab-btn-summary"
              onClick={() => setActiveTab('summary')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'summary' ? 'bg-[#1F2937] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Resumo do Dono</span>
            </button>

            {/* 2. Divergências */}
            <button
              id="tab-btn-divergences"
              onClick={() => setActiveTab('divergences')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'divergences' ? 'bg-[#1F2937] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              <span>Divergências</span>
            </button>

            {/* 3. Rotinas da Equipe */}
            <button
              id="tab-btn-routine"
              onClick={() => setActiveTab('routine')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'routine' ? 'bg-[#1F2937] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Rotinas da Equipe</span>
            </button>

            {/* 4. Kit Festa & Encomendas */}
            <button
              id="tab-btn-party"
              onClick={() => setActiveTab('party')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'party' ? 'bg-[#E8571A] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Cake className={`w-3.5 h-3.5 ${activeTab === 'party' ? 'text-amber-200' : 'text-[#E8571A]'}`} />
              <span>Kit Festa</span>
              {newPartyOrdersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-gray-950 animate-pulse">
                  {newPartyOrdersCount} novo{newPartyOrdersCount > 1 ? 's' : ''}
                </span>
              )}
            </button>

            {/* 5. Controle de Estoque */}
            <button
              id="tab-btn-stock"
              onClick={() => setActiveTab('stock')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'stock' ? 'bg-[#1F2937] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Estoque</span>
            </button>

            {/* 6. Validades & Descartes */}
            <button
              id="tab-btn-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-[#1F2937] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Validades</span>
            </button>

            {/* 7. Clube VIP (Em Manutenção) */}
            <button
              id="tab-btn-vip"
              onClick={() => setActiveTab('vip')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'vip' ? 'bg-[#1F2937] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Clube VIP</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Em Manutenção
              </span>
            </button>

            {/* 8. PadeIA */}
            <button
              id="tab-btn-padeia"
              onClick={() => setActiveTab('padeia')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'padeia'
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#E8571A] text-white shadow-md ring-2 ring-orange-400/40'
                  : 'bg-orange-50/80 text-[#E8571A] hover:bg-orange-100 border border-orange-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>PadeIA™</span>
            </button>

            {/* 9. Relatório */}
            <button
              id="tab-btn-relatorio"
              onClick={() => setActiveTab('relatorio')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'relatorio' ? 'bg-[#1F2937] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Relatório</span>
            </button>

            {/* 10. Config */}
            <button
              id="tab-btn-config"
              onClick={() => setActiveTab('config')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'config' ? 'bg-[#1F2937] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Config</span>
            </button>
          </div>

      {activeTab === 'summary' && (
        <OwnerSummaryDashboard
          onNavigateTab={(tab) => setActiveTab(tab as any)}
          onOpenNewProductModal={() => {
            setProductToEdit(null);
            setIsProductModalOpen(true);
          }}
          onOpenStockCountModal={() => setActiveTab('divergences')}
        />
      )}

      {activeTab === 'divergences' && (
        <DivergencesSection
          onNavigateTab={(tab) => setActiveTab(tab as any)}
          onOpenNewCountModal={() => setActiveTab('stock')}
        />
      )}

      {activeTab === 'routine' && <TeamRoutineSection />}

      {activeTab === 'party' && <PartyKitsSection />}

      {activeTab === 'stock' && <StockControl />}

      {activeTab === 'vip' && company && (
        <VipClubSection bakeryCode={company.codigoAtivacao} />
      )}

      {activeTab === 'padeia' && (
        <PadeIA
          company={company}
          products={products}
          salesHistory={salesHistory}
          vipOffers={vipOffers}
          onOpenScanner={() => setIsWasteScannerOpen(true)}
          onNavigateBack={() => setActiveTab('summary')}
          onOpenVipOfferModal={(prod) => {
            setVipOfferProductInfo({
              productId: prod.id,
              nomeProduto: prod.nome,
              categoria: prod.categoria || 'Geral',
              valorOriginal: prod.valorTotal && prod.valorTotal > 0 ? prod.valorTotal : (prod.valorKg && prod.valorKg > 0 ? prod.valorKg : 15.0),
              dataValidade: prod.dataValidade,
              barcode: prod.barcode,
            });
            setIsVipOfferModalOpen(true);
          }}
        />
      )}

      {activeTab === 'dashboard' && (
        <>
          {/* PadeIA Prominent Highlight Banner (Mobile Optimized) */}
          <div className="bg-gradient-to-r from-[#111111] via-[#1F2937] to-[#2C2C2C] text-white p-3.5 sm:p-5 rounded-2xl border border-gray-800 shadow-md">
            <div className="flex items-center space-x-3 mb-2.5 sm:mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-[#E8571A] flex items-center justify-center text-white shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-sm sm:text-base text-white">🤖 PadeIA™</span>
                  <span className="text-[10px] bg-orange-500/20 text-[#FF6B00] border border-orange-500/30 px-2 py-0.2 rounded-full font-bold">Ativa</span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5 truncate sm:whitespace-normal">
                  Pergunte sobre suas perdas, vencimentos e desperdícios.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/80">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('padeia');
                  setTimeout(() => window.dispatchEvent(new Event('start-padeia-voice')), 100);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E8571A] hover:from-[#e05e00] hover:to-[#d44e15] text-white font-black text-xs transition-all shadow-sm flex items-center justify-center space-x-1 cursor-pointer active:scale-95 min-h-[42px]"
              >
                <span>🎙️ Falar com a PadeIA</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('padeia')}
                className="w-full px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center justify-center space-x-1 cursor-pointer active:scale-95 min-h-[42px]"
              >
                <span>Abrir PadeIA</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>
          </div>

          {/* 1. RESUMO RÁPIDO CARDS (Compact Grid: Row 1 has 2 cards, Row 2 has Principal Perda on Mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-6">
            {/* Card 1: PERDAS DO PERÍODO */}
            <div className="bg-white border border-[#E0E0E0] rounded-2xl p-3 sm:p-6 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-red-600 uppercase tracking-wider">Perdas Período</span>
                <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">R$</span>
              </div>
              <div className="mt-2 sm:mt-4">
                <div className="text-base sm:text-2xl font-black text-[#1F2937]">R$ {expiredMonthValue.toFixed(2)}</div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 flex items-center space-x-1">
                  <span className="text-red-600 font-bold">↑ 12%</span>
                  <span className="hidden sm:inline">vs. mês anterior</span>
                </div>
              </div>
            </div>

            {/* Card 2: DESCARTES */}
            <div className="bg-white border border-[#E0E0E0] rounded-2xl p-3 sm:p-6 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-600 uppercase tracking-wider">Descartes</span>
                <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">📦</span>
              </div>
              <div className="mt-2 sm:mt-4">
                <div className="text-base sm:text-2xl font-black text-[#1F2937]">{expiredMonthCount} un</div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 flex items-center space-x-1">
                  <span className="text-orange-600 font-bold">↑ 5%</span>
                  <span className="hidden sm:inline">estoque</span>
                </div>
              </div>
            </div>

            {/* Card 3: PRINCIPAL PERDA (Full Width Row 2 on Mobile) */}
            <div className="col-span-2 sm:col-span-1 bg-white border border-[#E0E0E0] rounded-2xl p-3 sm:p-6 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-[#1F2937] uppercase tracking-wider">Principal Perda</span>
                <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gray-100 text-[#1F2937] flex items-center justify-center font-bold text-xs">🏷️</span>
              </div>
              <div className="mt-2 sm:mt-4 flex items-center justify-between sm:block">
                <div className="text-sm sm:text-lg font-black text-[#1F2937] truncate">
                  {categoriesList[0] || 'Salgados'}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 truncate font-semibold">
                  Vencimento
                </div>
              </div>
            </div>
          </div>

          {/* Evolution Chart Section */}
          <WasteChartSection products={products} />

          {/* 2. GERENCIAR PRODUTOS (REGISTRO DE DESCARTES) */}
          <div className="bg-white p-3.5 sm:p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-3.5 sm:space-y-4">
            {/* Table Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-lg font-black text-[#2C2C2C]">Registro de Descartes</h2>
                  <p className="text-[11px] sm:text-xs text-gray-500">Controle em tempo real de perdas e validade</p>
                </div>

                {/* Mobile Quick Add Button */}
                <button
                  onClick={() => {
                    setProductToEdit(null);
                    setIsProductModalOpen(true);
                  }}
                  className="md:hidden px-3 py-1.5 bg-[#E8571A] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Registrar</span>
                </button>
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[140px] sm:min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex items-center space-x-1.5">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                  >
                    <option value="all">Todas Categorias</option>
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setActiveTab('config')}
                    className="px-2 py-1.5 text-xs font-extrabold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center space-x-1 cursor-pointer transition-all"
                    title="Configurar Categorias"
                  >
                    <Folder className="w-3.5 h-3.5 text-[#E8571A]" />
                    <span className="hidden sm:inline">Categorias</span>
                  </button>
                </div>

                {/* Desktop Action Button */}
                <button
                  onClick={() => {
                    setProductToEdit(null);
                    setIsProductModalOpen(true);
                  }}
                  className="hidden md:flex px-4 py-2 bg-[#E8571A] hover:bg-[#d44e15] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Registrar Perda</span>
                </button>
              </div>
            </div>

            {/* Mobile Product Card View (Compact Cards) */}
            <div className="md:hidden space-y-2.5">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="font-bold text-xs text-gray-700">Nenhum registro encontrado.</p>
                  <p className="text-[11px] text-gray-500 mt-1">Toque em "+ Registrar" para adicionar um descarte.</p>
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      p.status === 'vencido'
                        ? 'bg-red-50/40 border-red-200'
                        : p.status === 'vencendo'
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-white border-gray-200 shadow-xs'
                    }`}
                  >
                    {/* Line 1: Title & Category */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-xs sm:text-sm text-[#2C2C2C] uppercase tracking-tight">{p.nome}</h3>
                        <span className="text-[10px] font-extrabold bg-[#F5E6D3] text-[#2C2C2C] px-2 py-0.5 rounded-full inline-block mt-0.5">
                          {p.categoria || 'Geral'}
                        </span>
                      </div>
                      {p.barcode && (
                        <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                          EAN: {p.barcode}
                        </span>
                      )}
                    </div>

                    {/* Line 2: Quantity & Value */}
                    <div className="flex items-center justify-between text-xs py-1 border-y border-gray-100">
                      <div>
                        <span className="text-gray-500 font-bold text-[10px] uppercase">Qtd: </span>
                        <span className="font-black text-xs sm:text-sm text-[#2C2C2C]">{p.quantidade} un</span>
                      </div>
                      <div className="font-black text-xs sm:text-sm text-[#2C2C2C]">
                        {p.valorTotal ? `R$ ${p.valorTotal.toFixed(2)}` : (p.peso && p.valorKg ? `R$ ${(p.peso * p.valorKg).toFixed(2)}` : (p.valorKg ? `R$ ${(p.quantidade * p.valorKg).toFixed(2)}` : 'R$ 0,00'))}
                      </div>
                    </div>

                    {/* Line 3: Expiry Status & Date */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={`font-black flex items-center space-x-1 ${
                          p.status === 'vencido'
                            ? 'text-red-600'
                            : p.status === 'vencendo'
                            ? 'text-amber-600'
                            : 'text-gray-600'
                        }`}
                      >
                        <span>{p.status === 'vencido' ? '🔴' : p.status === 'vencendo' ? '⚠️' : '🟢'}</span>
                        <span>{getRelativeExpirationText(p.diasParaVencer)}</span>
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        Val: {formatDateToBR(p.dataValidade)}
                      </span>
                    </div>

                    {/* Line 4: Action Buttons */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProductToEdit(p);
                          setIsProductModalOpen(true);
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-[#F5E6D3] hover:bg-[#D4A574] text-[#2C2C2C] font-extrabold text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer active:scale-95 min-h-[36px]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id, p.nome)}
                        className="flex-1 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-extrabold text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer active:scale-95 min-h-[36px]"
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
                        {/* Produto Name & Category & Barcode & Weight */}
                        <td className="py-3.5 px-4 font-bold">
                          <div className="text-sm font-extrabold text-[#2C2C2C]">{p.nome}</div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-semibold bg-[#F5E6D3] text-[#2C2C2C] px-2 py-0.5 rounded-full">
                              {p.categoria || 'Geral'}
                            </span>
                            {p.barcode && (
                              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                                EAN: {p.barcode}
                              </span>
                            )}
                            {p.peso !== undefined && p.peso !== null && (
                              <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                                {p.peso} kg
                              </span>
                            )}
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
        </>
      )}

      {activeTab === 'relatorio' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-4 sm:space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1F2937]">Relatório Executivo de Validades</h2>
              <p className="text-xs text-gray-500">Visualize e exporte o relatório completo com perdas, descartes e indicadores de validade sanitária.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <button
                onClick={handleDownloadExecPdfDirect}
                disabled={isSavingExecPdf}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#E8571A] hover:bg-[#d44e15] text-white text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isSavingExecPdf ? 'Gerando PDF...' : 'Salvar PDF Executivo'}</span>
              </button>
              <button
                onClick={() => setIsPrintReportOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-gray-600" />
                <span>Visualizar / Imprimir</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#1F2937]">{company.empresa}</h3>
                <p className="text-xs text-gray-500">CNPJ: {company.cnpj || '00.000.000/0001-00'} • E-mail: {company.email}</p>
              </div>
              <div>
                <span className="inline-block text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                  Relatório de Conformidade Sanitária
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-200 text-center">
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                <div className="text-[11px] text-gray-500 font-bold uppercase">Total Descartado (Mês)</div>
                <div className="text-lg sm:text-xl font-black text-[#1F2937] mt-1">{expiredMonthCount} un</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                <div className="text-[11px] text-gray-500 font-bold uppercase">Prejuízo por Vencidos</div>
                <div className="text-lg sm:text-xl font-black text-red-600 mt-1">R$ {expiredMonthValue.toFixed(2)}</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
                <div className="text-[11px] text-amber-800 font-bold uppercase">Produtos em Monitoramento</div>
                <div className="text-lg sm:text-xl font-black text-amber-700 mt-1">
                  {products.length} itens
                </div>
              </div>
            </div>
          </div>

          {/* Quick List Preview of Vencidos for Mobile */}
          <div className="space-y-3 pt-2 border-t border-gray-200">
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
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-[#1F2937]">Configurações da Padaria</h2>
              <p className="text-xs text-gray-500">Gerencie os dados da empresa, código de ativação e suporte técnico.</p>
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
                    <label className="block font-bold text-gray-600 uppercase mb-1">E-mail de Acesso</label>
                    <input
                      type="text"
                      value={company.email}
                      disabled
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-bold"
                    />
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
                  className="px-4 py-2.5 bg-[#1F2937] hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <LifeBuoy className="w-4 h-4" />
                  <span>Abrir Chamado de Suporte</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section: Category Settings */}
          <CategorySettings />
        </div>
      )}
        </main>
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

      {vipOfferProductInfo && (
        <VipOfferModal
          isOpen={isVipOfferModalOpen}
          onClose={() => {
            setIsVipOfferModalOpen(false);
            setVipOfferProductInfo(null);
          }}
          onConfirm={handleCreateVipOffer}
          productInfo={vipOfferProductInfo}
        />
      )}

      {company && (
        <>
          <PrintReportModal
            isOpen={isPrintReportOpen}
            onClose={() => setIsPrintReportOpen(false)}
            company={company}
            products={products}
            vipOffers={vipOffers}
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
      <nav 
        aria-label="Navegação Principal Mobile"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200/90 px-1 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex justify-around items-center shadow-2xl touch-manipulation select-none"
      >
        {/* 1. Resumo */}
        <button
          type="button"
          id="mobile-nav-summary"
          onClick={() => setActiveTab('summary')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-transform active:scale-95 cursor-pointer ${
            activeTab === 'summary' ? 'text-[#E8571A] font-extrabold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Resumo</span>
        </button>

        {/* 2. Divergências */}
        <button
          type="button"
          id="mobile-nav-divergences"
          onClick={() => setActiveTab('divergences')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-transform active:scale-95 cursor-pointer ${
            activeTab === 'divergences' ? 'text-[#E8571A] font-extrabold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Scale className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Divergências</span>
        </button>

        {/* 3. Rotinas */}
        <button
          type="button"
          id="mobile-nav-routine"
          onClick={() => setActiveTab('routine')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-transform active:scale-95 cursor-pointer ${
            activeTab === 'routine' ? 'text-[#E8571A] font-extrabold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Rotinas</span>
        </button>

        {/* 4. PadeIA - Prominent Highlighted Center Action */}
        <button
          type="button"
          id="mobile-nav-padeia"
          onClick={() => setActiveTab('padeia')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-2.5 mx-0.5 rounded-xl transition-transform active:scale-95 cursor-pointer ${
            activeTab === 'padeia'
              ? 'bg-gradient-to-r from-[#FF6B00] to-[#E8571A] text-white font-black shadow-md ring-2 ring-orange-300'
              : 'bg-orange-50 text-[#E8571A] font-extrabold border border-orange-200 shadow-xs'
          }`}
        >
          <div className="flex items-center space-x-1">
            <Sparkles className={`w-4 h-4 ${activeTab === 'padeia' ? 'text-amber-200 animate-pulse' : 'text-[#E8571A]'}`} />
            <span className="text-[11px] font-black">PadeIA</span>
          </div>
        </button>

        {/* 5. Estoque */}
        <button
          type="button"
          id="mobile-nav-stock"
          onClick={() => setActiveTab('stock')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-transform active:scale-95 cursor-pointer ${
            activeTab === 'stock' ? 'text-[#E8571A] font-extrabold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Boxes className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Estoque</span>
        </button>

        {/* 6. Mais / Relatórios */}
        <button
          type="button"
          id="mobile-nav-relatorio"
          onClick={() => setActiveTab('relatorio')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-transform active:scale-95 cursor-pointer ${
            activeTab === 'relatorio' ? 'text-[#E8571A] font-extrabold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Printer className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Relatórios</span>
        </button>
      </nav>
    </div>
  );
};
