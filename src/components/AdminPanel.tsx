import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import {
  ShieldCheck,
  Building2,
  Key,
  Copy,
  Check,
  Power,
  Trash2,
  Search,
  PlusCircle,
  Package,
  AlertTriangle,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  ExternalLink,
  DollarSign,
  FileText,
  HelpCircle,
  BookOpen,
  Menu,
  X,
  RefreshCw,
  LogOut,
  Edit2,
  Save,
  CheckCircle2,
  Users,
  BarChart3,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BakeryCompany, AdminStats, FinancialStats, Product, SaleHistoryItem, SupportTicket, VipOffer, DailyClosing } from '../types';
import { StorageService } from '../services/storageService';
import { calculateDaysRemaining, formatDateToBR } from '../utils/dateUtils';
import { generateSystemManualPDF } from '../utils/pdfGenerator';
import { AdminBilling } from './admin/AdminBilling';
import { AdminContracts } from './admin/AdminContracts';
import { AdminSupportTickets } from './admin/AdminSupportTickets';
import { AdminTrainingPlan } from './admin/AdminTrainingPlan';
import { AdminSaasAnalytics } from './admin/AdminSaasAnalytics';

interface AdminPanelProps {
  onLoginAsBakery: (code: string) => void;
  isAdminLoggedIn?: boolean;
  onLogoutAdmin?: () => void;
}

type AdminTab = 'empresas' | 'cobranca' | 'contratos' | 'suporte' | 'treinamento' | 'analise_saas';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLoginAsBakery, isAdminLoggedIn, onLogoutAdmin }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [loginEmailInput, setLoginEmailInput] = useState<string>('');
  const [loginPasswordInput, setLoginPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loginAttempts, setLoginAttempts] = useState<number>(() => {
    const saved = sessionStorage.getItem('admin_login_attempts');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('admin_locked');
    return saved === 'true';
  });
  const [unlockCodeInput, setUnlockCodeInput] = useState<string>('');
  const [unlockEmailInput, setUnlockEmailInput] = useState<string>('');
  const [unlockPasswordInput, setUnlockPasswordInput] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string>('');

  const isAdminEmail = (email?: string | null) => email === 'admin@padaria.io' || email === 'weskleyg4000@gmail.com';

  // Sidebar & Navigation
  const [activeTab, setActiveTab] = useState<AdminTab>('empresas');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Registration Form states
  const [empresaName, setEmpresaName] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [senhaInput, setSenhaInput] = useState<string>('');
  const [telefoneInput, setTelefoneInput] = useState<string>('');
  const [cnpjInput, setCnpjInput] = useState<string>('');
  const [diasTesteInput, setDiasTesteInput] = useState<string>('7');

  const [generatedCompany, setGeneratedCompany] = useState<BakeryCompany | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Edit Key Modal State
  const [editingCompanyKey, setEditingCompanyKey] = useState<BakeryCompany | null>(null);
  const [newKeyInput, setNewKeyInput] = useState<string>('');
  const [keyError, setKeyError] = useState<string>('');

  // Edit Password Modal State
  const [editingCompanyPwd, setEditingCompanyPwd] = useState<BakeryCompany | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [pwdError, setPwdError] = useState<string>('');

  // Edit Name Modal State
  const [editingCompanyName, setEditingCompanyName] = useState<BakeryCompany | null>(null);
  const [newNameInput, setNewNameInput] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');

  // Custom Confirmation Modal & Toast state
  const [confirmModal, setConfirmModal] = useState<{
    type: 'clear_all' | 'delete_no_cnpj' | 'delete_single';
    companyCode?: string;
    companyName?: string;
    count?: number;
  } | null>(null);

  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => setToastNotification(null), 4000);
  };

  // Data states
  const [companies, setCompanies] = useState<BakeryCompany[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleHistoryItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [vipOffers, setVipOffers] = useState<VipOffer[]>([]);
  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalPadarias: 0,
    padariasAtivas: 0,
    totalProdutos: 0,
    produtosVencidos: 0,
  });
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    totalClientes: 0,
    totalClientesAtivos: 0,
    mrrTotalProjetado: 0,
    mrrAtivo: 0,
    mrr: 0,
    receitaImplementacaoPaga: 0,
    receitaImplementacaoPendente: 0,
    proximosVencimentos: 0,
    clientesAdimplentes: 0,
    clientesInadimplentes: 0,
    clientesCanceladosAsaas: 0,
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const checkAndLoad = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && isAdminEmail(currentUser.email)) {
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        await StorageService.setUserBakeryMapping(currentUser.uid, 'ADMIN', currentUser.email || 'weskleyg4000@gmail.com', 'admin').catch(() => {});
        await loadAdminData();
      } else {
        // Check if user has admin role in Firestore mapping
        if (currentUser) {
          try {
            const mapping = await StorageService.getUserBakeryMapping(currentUser.uid);
            if (mapping && mapping.role === 'admin') {
              setIsAuthenticated(true);
              setIsCheckingAuth(false);
              await loadAdminData();
              return;
            }
          } catch (e) {
            // ignore
          }
        }
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        // Fallback to local storage cache for instant UI and safe pre-login state
        setCompanies(StorageService.getCompanies());
        setProducts(StorageService.getProducts());
        setSales(StorageService.getSalesHistory());
        setTickets(StorageService.getTickets());
        setVipOffers(StorageService.getVipOffers());
        setDailyClosings(StorageService.getDailyClosings());
        setStats(StorageService.getAdminStats());
        setFinancialStats(StorageService.getFinancialStats());
      }
    };

    checkAndLoad();

    unsubscribe = auth.onAuthStateChanged((user) => {
      checkAndLoad();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadAdminData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !isAdminEmail(currentUser.email)) {
        // Check mapping role
        const mapping = await StorageService.getUserBakeryMapping(currentUser?.uid || '');
        if (!mapping || mapping.role !== 'admin') {
          return;
        }
      }

      const [comps, prods, sls, tiks, vips, closings] = await Promise.all([
        StorageService.getCompaniesFromServer(),
        StorageService.getProductsFromServerAdmin(),
        StorageService.getSalesHistoryFromServerAdmin(),
        StorageService.getTicketsFromServer(),
        StorageService.getVipOffersFromServerAdmin(),
        StorageService.getDailyClosingsFromServerAdmin()
      ]);
      setCompanies(comps);
      setProducts(prods);
      setSales(sls);
      setTickets(tiks);
      setVipOffers(vips);
      setDailyClosings(closings);
      setStats(StorageService.getAdminStats());
      setFinancialStats(StorageService.getFinancialStats());
    } catch (err) {
      console.error("Error loading admin data on-demand:", err);
      // Fallback to local storage cache if server request fails
      setCompanies(StorageService.getCompanies());
      setProducts(StorageService.getProducts());
      setSales(StorageService.getSalesHistory());
      setTickets(StorageService.getTickets());
      setVipOffers(StorageService.getVipOffers());
      setDailyClosings(StorageService.getDailyClosings());
      setStats(StorageService.getAdminStats());
      setFinancialStats(StorageService.getFinancialStats());
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmailInput.trim(), loginPasswordInput);
      const user = auth.currentUser;
      if (user && isAdminEmail(user.email)) {
        await StorageService.setUserBakeryMapping(user.uid, 'ADMIN', user.email, 'admin');
        setLoginAttempts(0);
        sessionStorage.removeItem('admin_login_attempts');
        sessionStorage.removeItem('admin_locked');
        setIsAuthenticated(true);
        await loadAdminData();
      } else {
        const nextAttempts = loginAttempts + 1;
        setLoginAttempts(nextAttempts);
        sessionStorage.setItem('admin_login_attempts', nextAttempts.toString());
        if (nextAttempts >= 3) {
          setIsLocked(true);
          sessionStorage.setItem('admin_locked', 'true');
          setLoginError('Acesso bloqueado por excesso de tentativas falhas. Insira o código de desbloqueio de 16 dígitos.');
        } else {
          setLoginError(`Acesso negado: Credenciais inválidas. Tentativa ${nextAttempts} de 3.`);
        }
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      const nextAttempts = loginAttempts + 1;
      setLoginAttempts(nextAttempts);
      sessionStorage.setItem('admin_login_attempts', nextAttempts.toString());
      if (nextAttempts >= 3) {
        setIsLocked(true);
        sessionStorage.setItem('admin_locked', 'true');
        setLoginError('Acesso bloqueado por excesso de tentativas falhas. Insira o código de desbloqueio de 16 dígitos.');
      } else {
        setLoginError(`E-mail ou senha incorretos. Tentativa ${nextAttempts} de 3.`);
      }
    }
  };

  const handleUnlockSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    try {
      let user = auth.currentUser;
      if (!user && unlockEmailInput.trim() && unlockPasswordInput) {
        const cred = await signInWithEmailAndPassword(auth, unlockEmailInput.trim(), unlockPasswordInput);
        user = cred.user;
      }
      if (!user) {
        setUnlockError('Por favor, informe seu e-mail e senha de administrador para autenticação.');
        return;
      }
      const token = await user.getIdToken(true);
      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ unlockCode: unlockCodeInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsLocked(false);
        setLoginAttempts(0);
        setUnlockCodeInput('');
        setUnlockEmailInput('');
        setUnlockPasswordInput('');
        sessionStorage.removeItem('admin_login_attempts');
        sessionStorage.removeItem('admin_locked');
        setLoginError('');
        setIsAuthenticated(true);
        await loadAdminData();
      } else {
        setUnlockError(data.error || 'Código de desbloqueio incorreto.');
        if (data.code === 'SYSTEM_LOCKED') {
          setIsLocked(true);
        }
      }
    } catch (err: any) {
      console.error('Unlock error:', err);
      setUnlockError(err.message || 'Erro ao processar desbloqueio no servidor.');
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!empresaName.trim() || !emailInput.trim()) {
      setFormError('Por favor, preencha o Nome da Padaria e o E-mail.');
      return;
    }

    try {
      const trialDays = Number(diasTesteInput) >= 0 ? Number(diasTesteInput) : 7;
      const newComp = await StorageService.addCompany(
        empresaName,
        emailInput,
        senhaInput || 'padaria123',
        telefoneInput,
        cnpjInput,
        trialDays
      );

      setGeneratedCompany(newComp);
      setEmpresaName('');
      setEmailInput('');
      setSenhaInput('');
      setTelefoneInput('');
      setCnpjInput('');
      setDiasTesteInput('7');
      showToast(`Empresa ${newComp.empresa} cadastrada com ${trialDays} dia(s) de teste grátis!`, 'success');

      // Trigger confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setFormError(err.message || 'Erro ao cadastrar empresa.');
    }
  };

  const triggerDeleteWithoutCNPJ = () => {
    const withoutCnpjCount = companies.filter((c) => {
      const clean = (c.cnpj || '').replace(/\D/g, '');
      return !clean || clean.length === 0;
    }).length;

    setConfirmModal({
      type: 'delete_no_cnpj',
      count: withoutCnpjCount,
    });
  };

  const triggerClearAllData = () => {
    setConfirmModal({
      type: 'clear_all',
    });
  };

  const triggerDeleteSingleCompany = (code: string, name: string) => {
    setConfirmModal({
      type: 'delete_single',
      companyCode: code,
      companyName: name,
    });
  };

  const handleExecuteConfirmAction = async () => {
    if (!confirmModal) return;
    const { type, companyCode, companyName } = confirmModal;
    setConfirmModal(null);

    if (type === 'delete_no_cnpj') {
      const deleted = await StorageService.deleteCompaniesWithoutCNPJ();
      loadAdminData();
      setGeneratedCompany(null);
      showToast(`${deleted} cliente(s) sem CNPJ foram excluídos do Firestore (Dev e Prod) e localmente!`, 'success');
    } else if (type === 'clear_all') {
      await StorageService.clearAllSystemData();
      loadAdminData();
      setGeneratedCompany(null);
      showToast('Todos os dados foram zerados com sucesso no banco de dados na nuvem (Firestore) e do armazenamento local!', 'success');
    } else if (type === 'delete_single' && companyCode) {
      await StorageService.deleteCompany(companyCode);
      if (generatedCompany?.codigoAtivacao === companyCode) {
        setGeneratedCompany(null);
      }
      loadAdminData();
      showToast(`Empresa "${companyName || companyCode}" excluída do Firestore e do sistema!`, 'success');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (code: string) => {
    await StorageService.toggleCompanyStatus(code);
    loadAdminData();
  };

  const handleOpenEditKey = (company: BakeryCompany) => {
    setEditingCompanyKey(company);
    setNewKeyInput(company.codigoAtivacao);
    setKeyError('');
  };

  const handleSaveCompanyKey = async () => {
    if (!editingCompanyKey || !newKeyInput.trim()) return;
    setKeyError('');
    try {
      await StorageService.updateCompanyCode(editingCompanyKey.codigoAtivacao, newKeyInput);
      setEditingCompanyKey(null);
      loadAdminData();
    } catch (err: any) {
      setKeyError(err.message || 'Erro ao alterar chave de ativação.');
    }
  };

  const handleOpenEditPassword = (company: BakeryCompany) => {
    setEditingCompanyPwd(company);
    setNewPasswordInput(company.senha || 'padaria123');
    setPwdError('');
  };

  const handleSaveCompanyPassword = async () => {
    if (!editingCompanyPwd || !newPasswordInput.trim()) return;
    setPwdError('');
    try {
      await StorageService.updateCompanyPassword(editingCompanyPwd.codigoAtivacao, newPasswordInput);
      setEditingCompanyPwd(null);
      showToast(`Senha da empresa "${editingCompanyPwd.empresa}" alterada com sucesso!`, 'success');
      loadAdminData();
    } catch (err: any) {
      setPwdError(err.message || 'Erro ao alterar senha.');
    }
  };

  const handleOpenEditName = (company: BakeryCompany) => {
    setEditingCompanyName(company);
    setNewNameInput(company.empresa);
    setNameError('');
  };

  const handleSaveCompanyName = async () => {
    if (!editingCompanyName || !newNameInput.trim()) return;
    setNameError('');
    try {
      await StorageService.updateCompanyName(editingCompanyName.codigoAtivacao, newNameInput);
      setEditingCompanyName(null);
      showToast(`Nome da padaria alterado para "${newNameInput}" com sucesso!`, 'success');
      loadAdminData();
    } catch (err: any) {
      setNameError(err.message || 'Erro ao alterar o nome da padaria.');
    }
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.codigoAtivacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cnpj && c.cnpj.includes(searchTerm))
  );

  // AUTH CHECK & ACCESS DENIED SCREEN (403 FORBIDDEN)
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-gray-400">Verificando autorização administrativa...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isLocked) {
      return (
        <div className="min-h-screen bg-[#111111] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-red-600">
                  Sistema Bloqueado
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  3 tentativas incorretas excedidas. Insira o código de segurança master para desbloquear.
                </p>
              </div>
            </div>

            <form onSubmit={handleUnlockSystem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  E-mail do Administrador
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={unlockEmailInput}
                    onChange={(e) => setUnlockEmailInput(e.target.value)}
                    placeholder="admin@padaria.io"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] text-sm font-bold"
                    required
                  />
                  <Mail className="w-5 h-5 text-gray-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  Senha do Administrador
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={unlockPasswordInput}
                    onChange={(e) => setUnlockPasswordInput(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] text-sm font-bold"
                    required
                  />
                  <Lock className="w-5 h-5 text-gray-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                  Código de Desbloqueio (16 Dígitos)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={unlockCodeInput}
                    onChange={(e) => setUnlockCodeInput(e.target.value)}
                    placeholder="Digite o código de 16 dígitos"
                    maxLength={16}
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] text-sm font-bold tracking-widest text-center"
                    required
                  />
                  <Key className="w-5 h-5 text-gray-400 absolute right-3.5 top-4" />
                </div>
              </div>

              {unlockError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold text-center">
                  {unlockError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#111111] hover:bg-[#FF6B00] text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer group"
              >
                <span>Desbloquear Sistema</span>
                <ArrowRight className="w-4 h-4 text-[#FF6B00] group-hover:text-white transition-colors" />
              </button>
            </form>

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  window.location.href = '/app';
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center space-x-2"
              >
                <span>Voltar para o Sistema (App)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <img
                src="https://i.imgur.com/ZGsjvWy.png"
                alt="Logo Padaria"
                className="h-24 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#111111]">
                Painel Administrativo Master
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Autenticação Segura para Administradores
              </p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                E-mail do Administrador
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={loginEmailInput}
                  onChange={(e) => setLoginEmailInput(e.target.value)}
                  placeholder="admin@padaria.io"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] text-sm font-bold"
                  required
                />
                <Mail className="w-5 h-5 text-gray-400 absolute right-3.5 top-4" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                Senha Master
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={loginPasswordInput}
                  onChange={(e) => setLoginPasswordInput(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] text-sm font-bold"
                  required
                />
                <Lock className="w-5 h-5 text-gray-400 absolute right-3.5 top-4" />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#111111] hover:bg-[#FF6B00] text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer group"
            >
              <span>Entrar no Painel Central</span>
              <ArrowRight className="w-4 h-4 text-[#FF6B00] group-hover:text-white transition-colors" />
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 space-y-2">
            <button
              onClick={() => {
                window.location.href = '/app';
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center space-x-2"
            >
              <span>Voltar para o Sistema (App)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      id: 'empresas' as AdminTab,
      label: 'Cadastro & Chaves',
      icon: Building2,
    },
    {
      id: 'analise_saas' as AdminTab,
      label: 'Inteligência Financeira',
      icon: BarChart3,
    },
    {
      id: 'cobranca' as AdminTab,
      label: 'Financeiro & Assinaturas',
      icon: DollarSign,
    },
    {
      id: 'contratos' as AdminTab,
      label: 'Contrato & Documentos',
      icon: FileText,
    },
    {
      id: 'suporte' as AdminTab,
      label: 'Suporte & Tickets',
      icon: HelpCircle,
    },
    {
      id: 'treinamento' as AdminTab,
      label: 'Plano de Treinamento',
      icon: BookOpen,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#111111] text-white p-4 flex items-center justify-between border-b border-[#FF6B00]">
        <div className="flex items-center space-x-3">
          <img src="https://i.imgur.com/JCynwKe.png" alt="Logo" className="h-12 object-contain" />
          <span className="font-extrabold text-sm text-white">Painel Master ADM</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-300 hover:text-white rounded-xl bg-white/10"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-72 bg-[#111111] text-white flex flex-col justify-between border-r border-[#222222] transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 space-y-6">
          {/* Logo / Header */}
          <div className="flex items-center space-x-3 pb-6 border-b border-gray-800">
            <img 
              src="https://i.imgur.com/JCynwKe.png" 
              alt="Logo Padaria" 
              className="h-16 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="font-black text-base text-white tracking-wide">SISTEMA PADARIA</h1>
              <p className="text-[10px] text-[#FF6B00] font-extrabold uppercase tracking-wider">
                Painel do Administrador
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FF6B00] text-white shadow-md font-black scale-[1.02]'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-[#FF6B00]'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar Actions */}
        <div className="p-5 border-t border-gray-800 space-y-3">
          <div className="bg-black/40 p-3 rounded-2xl border border-gray-800 text-xs space-y-1">
            <p className="text-gray-400 font-medium text-[11px]">Status da Sessão:</p>
            <p className="text-emerald-400 font-bold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Administrador Autenticado</span>
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => generateSystemManualPDF()}
              className="w-full bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer border border-[#FF6B00]"
              title="Baixar Manual Completo de Vendas & Funcionalidades (PDF)"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>📄 Manual de Vendas (PDF)</span>
            </button>

            <button
              onClick={() => {
                setIsAuthenticated(false);
                if (onLogoutAdmin) {
                  onLogoutAdmin();
                }
              }}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              title="Sair do Painel Admin"
            >
              <LogOut className="w-4 h-4 text-[#FF6B00]" />
              <span>Sair do Painel Admin</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* EDIT KEY MODAL */}
        {editingCompanyKey && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-[#E8571A]" />
                  <h3 className="font-extrabold text-base text-[#2C2C2C]">Alterar Chave de Ativação</h3>
                </div>
                <button
                  onClick={() => setEditingCompanyKey(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-gray-600">
                  Empresa: <span className="font-extrabold text-[#2C2C2C]">{editingCompanyKey.empresa}</span>
                </p>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nova Chave de 8 Caracteres:
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newKeyInput}
                      onChange={(e) => setNewKeyInput(e.target.value.toUpperCase())}
                      placeholder="Ex: PAD12345"
                      maxLength={12}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono font-bold text-sm focus:ring-2 focus:ring-[#D4A574]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        let code = '';
                        for (let i = 0; i < 8; i++) {
                          code += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        setNewKeyInput(code);
                      }}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-bold transition-all cursor-pointer shrink-0"
                      title="Gerar chave aleatória"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {keyError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl font-medium">{keyError}</p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <button
                  onClick={() => setEditingCompanyKey(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-bold text-xs hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCompanyKey}
                  className="px-4 py-2 rounded-xl bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md"
                >
                  <Save className="w-4 h-4 text-[#D4A574]" />
                  <span>Salvar Chave</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT PASSWORD MODAL */}
        {editingCompanyPwd && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-[#E8571A]" />
                  <h3 className="font-extrabold text-base text-[#2C2C2C]">Alterar Senha de Acesso</h3>
                </div>
                <button
                  onClick={() => setEditingCompanyPwd(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-gray-600">
                  Empresa: <span className="font-extrabold text-[#2C2C2C]">{editingCompanyPwd.empresa}</span>
                </p>
                <p className="text-gray-500 text-[11px]">
                  E-mail de Acesso: <span className="font-bold text-[#2C2C2C]">{editingCompanyPwd.email}</span>
                </p>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nova Senha de Acesso:
                  </label>
                  <input
                    type="text"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Ex: Padaria@2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono font-bold text-sm focus:ring-2 focus:ring-[#D4A574]"
                  />
                </div>

                {pwdError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl font-medium">{pwdError}</p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <button
                  onClick={() => setEditingCompanyPwd(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-bold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCompanyPassword}
                  className="px-4 py-2 rounded-xl bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#D4A574]" />
                  <span>Salvar Nova Senha</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT NAME MODAL */}
        {editingCompanyName && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-[#E8571A]" />
                  <h3 className="font-extrabold text-base text-[#2C2C2C]">Alterar Nome da Padaria</h3>
                </div>
                <button
                  onClick={() => setEditingCompanyName(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-gray-600">
                  Nome Atual: <span className="font-extrabold text-[#2C2C2C]">{editingCompanyName.empresa}</span>
                </p>
                <p className="text-gray-500 text-[11px]">
                  ID Interno: <span className="font-bold text-[#2C2C2C]">{editingCompanyName.codigoAtivacao}</span>
                </p>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Novo Nome Comercial:
                  </label>
                  <input
                    type="text"
                    value={newNameInput}
                    onChange={(e) => setNewNameInput(e.target.value)}
                    placeholder="Ex: Padaria Central de Moema"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-sm focus:ring-2 focus:ring-[#D4A574]"
                  />
                </div>

                {nameError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl font-medium">{nameError}</p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <button
                  onClick={() => setEditingCompanyName(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-bold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCompanyName}
                  className="px-4 py-2 rounded-xl bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#D4A574]" />
                  <span>Salvar Nome</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1: CADASTRO E ATIVAÇÃO DE EMPRESAS */}
        {activeTab === 'empresas' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total de Empresas</p>
                  <p className="text-3xl font-black text-[#2C2C2C] mt-1">{stats.totalPadarias}</p>
                </div>
                <div className="p-3 bg-[#F5E6D3] text-[#D4A574] rounded-2xl">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Empresas Ativas</p>
                  <p className="text-3xl font-black text-[#27AE60] mt-1">{stats.padariasAtivas}</p>
                </div>
                <div className="p-3 bg-green-50 text-[#27AE60] rounded-2xl">
                  <Power className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Desativadas</p>
                  <p className="text-3xl font-black text-gray-400 mt-1">
                    {stats.totalPadarias - stats.padariasAtivas}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 text-gray-500 rounded-2xl">
                  <Power className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Produtos Cadastrados</p>
                  <p className="text-3xl font-black text-[#2C2C2C] mt-1">{stats.totalProdutos}</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Package className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Main Form & Table Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Form: Cadastrar Empresa */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                    <div className="p-2 bg-[#D4A574]/20 text-[#2C2C2C] rounded-xl font-black">
                      <PlusCircle className="w-5 h-5 text-[#E8571A]" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#2C2C2C]">Cadastrar & Ativar Empresa</h2>
                      <p className="text-xs text-gray-400">Gera a chave de 8 dígitos na hora</p>
                    </div>
                  </div>

                  <form onSubmit={handleCreateCompany} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                        Nome da Empresa / Padaria *
                      </label>
                      <input
                        type="text"
                        value={empresaName}
                        onChange={(e) => setEmpresaName(e.target.value)}
                        placeholder="Ex: Panificadora Central"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-xs font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                        E-mail do Responsável (Login) *
                      </label>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Ex: contato@padariacentral.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-xs font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                        Senha de Acesso do Usuário *
                      </label>
                      <input
                        type="text"
                        value={senhaInput}
                        onChange={(e) => setSenhaInput(e.target.value)}
                        placeholder="Ex: Padaria@123 (padrão: padaria123)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#2C2C2C] mb-1">
                          WhatsApp / Fone
                        </label>
                        <input
                          type="text"
                          value={telefoneInput}
                          onChange={(e) => setTelefoneInput(e.target.value)}
                          placeholder="(11) 99999-8888"
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#2C2C2C] mb-1">
                          CNPJ (Contrato)
                        </label>
                        <input
                          type="text"
                          value={cnpjInput}
                          onChange={(e) => setCnpjInput(e.target.value)}
                          placeholder="00.000.000/0001-00"
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                        Dias de Teste Grátis *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={diasTesteInput}
                        onChange={(e) => setDiasTesteInput(e.target.value)}
                        placeholder="Ex: 7, 14, 30"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-xs font-bold"
                        required
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        A padaria terá acesso liberado pelo número de dias informado.
                      </p>
                    </div>

                    {formError && (
                      <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl font-medium">{formError}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-[#1C1917] hover:bg-[#2C2C2C] text-white font-extrabold py-3 rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-[#D4A574]" />
                      <span>Cadastrar Empresa e Acesso</span>
                    </button>
                  </form>
                </div>

                {/* Newly Generated Company Credentials Banner */}
                {generatedCompany && (
                  <div className="bg-gradient-to-br from-[#1C1917] to-[#2C2C2C] text-white p-6 rounded-3xl shadow-xl border border-[#D4A574] space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#D4A574] uppercase tracking-widest flex items-center space-x-1">
                        <Sparkles className="w-4 h-4 text-[#E8571A]" />
                        <span>Empresa Cadastrada com Sucesso!</span>
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                        ATIVO
                      </span>
                    </div>

                    <div>
                      <p className="text-base font-extrabold text-white">{generatedCompany.empresa}</p>
                    </div>

                    <div className="bg-black/50 p-4 rounded-2xl border border-dashed border-[#D4A574] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center space-x-1">
                          <Mail className="w-3.5 h-3.5 text-[#D4A574]" />
                          <span>E-mail:</span>
                        </span>
                        <span className="font-mono font-bold text-white">{generatedCompany.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center space-x-1">
                          <Lock className="w-3.5 h-3.5 text-[#D4A574]" />
                          <span>Senha:</span>
                        </span>
                        <span className="font-mono font-bold text-[#D4A574] text-sm">
                          {generatedCompany.senha || 'padaria123'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-800">
                        <span className="text-gray-500">Código ID Interno:</span>
                        <span className="font-mono text-gray-300">{generatedCompany.codigoAtivacao}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyCode(`E-mail: ${generatedCompany.email}\nSenha: ${generatedCompany.senha || 'padaria123'}`)}
                        className="flex-1 bg-[#D4A574] hover:bg-[#c29363] text-[#1C1917] font-extrabold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                      >
                        {copiedCode?.includes(generatedCompany.email) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span>{copiedCode?.includes(generatedCompany.email) ? 'Dados Copiados!' : 'Copiar Acesso'}</span>
                      </button>

                      <button
                        onClick={() => onLoginAsBakery(generatedCompany.codigoAtivacao)}
                        className="bg-[#E8571A] hover:bg-[#d04911] text-white font-extrabold px-3 py-2.5 rounded-xl text-xs transition-all flex items-center space-x-1 cursor-pointer"
                        title="Testar acesso como esta empresa"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Acessar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Table: List of Companies & Keys */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-[#2C2C2C]">Empresas Cadastradas & Chaves de Acesso</h2>
                      <p className="text-xs text-gray-500">Gerencie e ative/desative o acesso de cada padaria</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Buscar empresa, chave ou e-mail..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#FAFAF8] text-gray-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-gray-200">
                          <th className="py-3 px-4">Empresa</th>
                          <th className="py-3 px-4">Acesso (E-mail / Senha)</th>
                          <th className="py-3 px-4">Chave ID</th>
                          <th className="py-3 px-4">Data Cadastro</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-[#2C2C2C]">
                        {filteredCompanies.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-gray-400">
                              Nenhuma empresa encontrada.
                            </td>
                          </tr>
                        ) : (
                          filteredCompanies.map((c) => (
                            <tr key={c.codigoAtivacao} className="hover:bg-gray-50/80 transition-colors">
                              {/* Empresa & Details */}
                              <td className="py-3.5 px-4 font-bold">
                                <div className="flex items-center space-x-1.5">
                                  <div className="text-sm font-extrabold text-[#2C2C2C]">{c.empresa}</div>
                                  <button
                                    onClick={() => handleOpenEditName(c)}
                                    className="p-1 text-gray-400 hover:text-[#E8571A] transition-colors cursor-pointer"
                                    title="Alterar Nome da Padaria"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                                {c.cnpj && (
                                  <div className="text-[10px] text-gray-400 font-mono">CNPJ: {c.cnpj}</div>
                                )}
                                {c.financeiro?.dataFimTeste && (
                                  <div className="mt-1">
                                    {(() => {
                                      const daysLeft = calculateDaysRemaining(c.financeiro.dataFimTeste!);
                                      const isPaid = c.financeiro.statusAssinatura === 'ativo' || c.financeiro.statusAssinatura === 'concluido';
                                      if (isPaid) {
                                        return <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded">Assinatura Ativa</span>;
                                      }
                                      if (daysLeft > 0) {
                                        return <span className="text-[10px] text-blue-700 font-extrabold bg-blue-50 px-2 py-0.5 rounded">Teste: Restam {daysLeft} dia(s)</span>;
                                      }
                                      return <span className="text-[10px] text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded">Teste Expirado</span>;
                                    })()}
                                  </div>
                                )}
                              </td>

                              {/* Email & Password Credentials */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-gray-700 flex items-center space-x-1">
                                    <Mail className="w-3 h-3 text-gray-400" />
                                    <span>{c.email}</span>
                                  </div>
                                  <div className="flex items-center space-x-1.5">
                                    <Lock className="w-3 h-3 text-[#D4A574]" />
                                    <span className="font-mono text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/60 px-2 py-0.5 rounded-lg">
                                      {c.senha || 'padaria123'}
                                    </span>
                                    <button
                                      onClick={() => handleCopyCode(c.senha || 'padaria123')}
                                      className="p-1 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
                                      title="Copiar Senha"
                                    >
                                      {copiedCode === (c.senha || 'padaria123') ? (
                                        <Check className="w-3 h-3 text-green-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleOpenEditPassword(c)}
                                      className="p-1 text-gray-400 hover:text-[#E8571A] transition-colors cursor-pointer"
                                      title="Alterar Senha de Acesso"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>

                              {/* Activation Key with Copy & Edit */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-mono font-black text-[#E8571A] bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200 text-xs">
                                    {c.codigoAtivacao}
                                  </span>
                                  <button
                                    onClick={() => handleCopyCode(c.codigoAtivacao)}
                                    className="p-1 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
                                    title="Copiar Chave ID"
                                  >
                                    {copiedCode === c.codigoAtivacao ? (
                                      <Check className="w-3 h-3 text-green-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditKey(c)}
                                    className="p-1 text-gray-400 hover:text-[#E8571A] transition-colors cursor-pointer"
                                    title="Alterar Chave ID"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>

                              {/* Registration Date */}
                              <td className="py-3.5 px-4 text-gray-500 font-medium">
                                {c.dataCadastro}
                              </td>

                              {/* Status Toggle Badge */}
                              <td className="py-3.5 px-4">
                                <button
                                  onClick={() => handleToggleStatus(c.codigoAtivacao)}
                                  className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                                    c.ativo
                                      ? 'bg-green-100 text-[#27AE60] hover:bg-green-200'
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                  }`}
                                  title="Clique para ativar/desativar empresa"
                                >
                                  <Power className="w-3 h-3" />
                                  <span>{c.ativo ? 'Ativo' : 'Desativado'}</span>
                                </button>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right space-x-1">
                                <button
                                  onClick={() => onLoginAsBakery(c.codigoAtivacao)}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#F5E6D3] hover:bg-[#D4A574] hover:text-white text-[#2C2C2C] font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1"
                                  title="Acessar aplicativo como esta empresa"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Acessar</span>
                                </button>

                                <button
                                  onClick={() => triggerDeleteSingleCompany(c.codigoAtivacao, c.empresa)}
                                  className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                  title="Excluir Empresa"
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
              </div>
            </div>
          </div>
        )}

        {/* SECTION: INTELIGENCIA FINANCEIRA & SAAS ANALYTICS */}
        {activeTab === 'analise_saas' && (
          <div className="animate-fade-in">
            <AdminSaasAnalytics
              companies={companies}
              products={products}
              sales={sales}
              tickets={tickets}
              vipOffers={vipOffers}
              dailyClosings={dailyClosings}
              onRefresh={loadAdminData}
            />
          </div>
        )}

        {/* SECTION 2: FINANCEIRO & DASHBOARD COMPLETO */}
        {activeTab === 'cobranca' && (
          <div className="animate-fade-in">
            <AdminBilling companies={companies} stats={financialStats} onRefresh={loadAdminData} />
          </div>
        )}

        {/* SECTION 3: CONTRATO & DOCUMENTOS */}
        {activeTab === 'contratos' && (
          <div className="animate-fade-in">
            <AdminContracts companies={companies} onCompanyUpdate={loadAdminData} />
          </div>
        )}

        {/* SECTION 4: SUPORTE & TICKETS */}
        {activeTab === 'suporte' && (
          <div className="animate-fade-in">
            <AdminSupportTickets onRefresh={loadAdminData} />
          </div>
        )}

        {/* SECTION 5: PLANO DE TREINAMENTO */}
        {activeTab === 'treinamento' && (
          <div className="animate-fade-in">
            <AdminTrainingPlan companies={companies} />
          </div>
        )}

        {/* CUSTOM CONFIRMATION MODAL */}
        {confirmModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 text-[#111111]">
              <div className="flex items-center space-x-3 text-red-600">
                <div className="p-3 bg-red-100 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">
                    {confirmModal.type === 'clear_all'
                      ? 'Zerar Todos os Dados'
                      : confirmModal.type === 'delete_no_cnpj'
                      ? 'Excluir Clientes sem CNPJ'
                      : 'Excluir Empresa'}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">Confirme a exclusão no sistema e no Firestore</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs text-gray-700 leading-relaxed font-medium">
                {confirmModal.type === 'clear_all' && (
                  <span>
                    <strong>ATENÇÃO EXTREMA:</strong> Esta ação irá excluir permanentemente <strong>TODAS AS EMPRESAS, PRODUTOS, VENDAS E CHAMADOS</strong>, tanto no banco de dados na nuvem (Firestore em ambiente de Construção e Produção) quanto no armazenamento local.
                  </span>
                )}

                {confirmModal.type === 'delete_no_cnpj' && (
                  <span>
                    Deseja apagar permanentemente todas as empresas que <strong>não possuem CNPJ cadastrado</strong>?
                    <br /><br />
                    Esta operação removerá as empresas e seus registros vinculados do banco de dados <strong>Firestore (Dev e Prod)</strong> e da memória local.
                  </span>
                )}

                {confirmModal.type === 'delete_single' && (
                  <span>
                    Deseja realmente excluir a empresa <strong>"{confirmModal.companyName || confirmModal.companyCode}"</strong>?
                    <br /><br />
                    Todos os produtos, histórico de vendas e registros vinculados serão excluídos permanentemente do Firestore e do armazenamento local.
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteConfirmAction}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirmar Exclusão</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        {toastNotification && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#111111] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#D4A574] flex items-center space-x-3 animate-slide-up">
            <CheckCircle2 className="w-5 h-5 text-[#27AE60]" />
            <span className="text-xs font-bold">{toastNotification.message}</span>
            <button
              onClick={() => setToastNotification(null)}
              className="text-gray-400 hover:text-white font-bold text-xs ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
