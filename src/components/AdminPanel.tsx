import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BakeryCompany, AdminStats, FinancialStats } from '../types';
import { StorageService } from '../services/storageService';
import { AdminBilling } from './admin/AdminBilling';
import { AdminContracts } from './admin/AdminContracts';
import { AdminSupportTickets } from './admin/AdminSupportTickets';
import { AdminTrainingPlan } from './admin/AdminTrainingPlan';

interface AdminPanelProps {
  onLoginAsBakery: (code: string) => void;
}

type AdminTab = 'empresas' | 'cobranca' | 'contratos' | 'suporte' | 'treinamento';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLoginAsBakery }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // Sidebar & Navigation
  const [activeTab, setActiveTab] = useState<AdminTab>('empresas');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Registration Form states
  const [empresaName, setEmpresaName] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [telefoneInput, setTelefoneInput] = useState<string>('');
  const [cnpjInput, setCnpjInput] = useState<string>('');
  
  // Custom Billing & Asaas Form States
  const defaultNextMonthDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };
  const [dataInicioCobrancaInput, setDataInicioCobrancaInput] = useState<string>(defaultNextMonthDate());
  const [valorImpInput, setValorImpInput] = useState<string>('1500');
  const [valorMensalInput, setValorMensalInput] = useState<string>('199');
  const [teste1DiaInput, setTeste1DiaInput] = useState<boolean>(false);
  const [integrarAsaasInput, setIntegrarAsaasInput] = useState<boolean>(false);

  const [generatedCompany, setGeneratedCompany] = useState<BakeryCompany | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Edit Key Modal State
  const [editingCompanyKey, setEditingCompanyKey] = useState<BakeryCompany | null>(null);
  const [newKeyInput, setNewKeyInput] = useState<string>('');
  const [keyError, setKeyError] = useState<string>('');

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
  const [stats, setStats] = useState<AdminStats>({
    totalPadarias: 0,
    padariasAtivas: 0,
    totalProdutos: 0,
    produtosVencidos: 0,
  });
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    totalClientesAtivos: 0,
    mrr: 0,
    receitaImplementacaoPendente: 0,
    proximosVencimentos: 0,
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    const authStatus = StorageService.isAdminAuthenticated();
    setIsAuthenticated(authStatus);
    
    const unsubCompanies = StorageService.subscribeCompanies((comps) => {
      setCompanies(comps);
      setStats(StorageService.getAdminStats());
      setFinancialStats(StorageService.getFinancialStats());
    });

    return () => unsubCompanies();
  }, []);

  const loadAdminData = () => {
    setCompanies(StorageService.getCompanies());
    setStats(StorageService.getAdminStats());
    setFinancialStats(StorageService.getFinancialStats());
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (StorageService.verifyAdminPassword(passwordInput)) {
      StorageService.setAdminAuthenticated(true);
      setIsAuthenticated(true);
      loadAdminData();
    } else {
      setPasswordError('Senha incorreta! Use "admin123".');
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
      const valImp = Number(valorImpInput) || 1500;
      const valMensal = Number(valorMensalInput) || 199;
      let asaasInfo = undefined;

      if (integrarAsaasInput) {
        const res = await fetch('/api/asaas/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresa: empresaName,
            email: emailInput,
            telefone: telefoneInput,
            cnpj: cnpjInput,
            valorImplementacao: valImp,
            valorMensalidade: valMensal,
            teste1Dia: teste1DiaInput,
            dataInicioCobranca: dataInicioCobrancaInput,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao conectar com o Asaas.');
        }

        asaasInfo = {
          customerId: data.customerId,
          subscriptionId: data.subscriptionId,
          paymentLink: data.paymentLink,
          asaasEnvironment: data.asaasEnvironment || 'sandbox',
        };
      }

      const newComp = await StorageService.addCompany(
        empresaName,
        emailInput,
        telefoneInput,
        cnpjInput,
        valImp,
        valMensal,
        teste1DiaInput,
        asaasInfo,
        dataInicioCobrancaInput
      );

      setGeneratedCompany(newComp);
      setEmpresaName('');
      setEmailInput('');
      setTelefoneInput('');
      setCnpjInput('');
      setIntegrarAsaasInput(false);
      showToast(`Empresa ${newComp.empresa} cadastrada com sucesso!`, 'success');

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

  const filteredCompanies = companies.filter(
    (c) =>
      c.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.codigoAtivacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cnpj && c.cnpj.includes(searchTerm))
  );

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="mx-auto w-24 h-24 bg-[#111111] text-white rounded-3xl p-3 flex items-center justify-center shadow-lg border border-[#FF6B00]">
              <img
                src="https://i.imgur.com/r41aOzi.png"
                alt="Logo Padaria"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#111111]">
                Painel Administrativo Master
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Gestão de Cadastro, Chaves de Ativação e Financeiro
              </p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                Senha de Acesso Master
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite sua senha de Admin"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] text-sm font-bold"
                  autoFocus
                />
                <Lock className="w-5 h-5 text-gray-400 absolute right-3.5 top-4" />
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#111111] hover:bg-[#FF6B00] text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer group"
            >
              <span>Acessar Painel Central</span>
              <ArrowRight className="w-4 h-4 text-[#FF6B00] group-hover:text-white transition-colors" />
            </button>
          </form>
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
          <img src="https://i.imgur.com/r41aOzi.png" alt="Logo" className="w-8 h-8 object-contain" />
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
            <div className="w-12 h-12 bg-white rounded-2xl p-1.5 flex items-center justify-center border border-[#FF6B00] shadow-md">
              <img src="https://i.imgur.com/r41aOzi.png" alt="Logo Padaria" className="w-full h-full object-contain" />
            </div>
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
              onClick={() => {
                StorageService.setAdminAuthenticated(false);
                setIsAuthenticated(false);
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
                        E-mail do Responsável *
                      </label>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Ex: contato@padariacentral.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-xs"
                        required
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

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                      <div>
                        <label className="block text-[11px] font-bold text-[#2C2C2C] mb-1">
                          Implantação (R$)
                        </label>
                        <input
                          type="number"
                          value={valorImpInput}
                          onChange={(e) => setValorImpInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-xs font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#2C2C2C] mb-1">
                          Mensalidade (R$)
                        </label>
                        <input
                          type="number"
                          value={valorMensalInput}
                          onChange={(e) => setValorMensalInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-xs font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#2C2C2C] mb-1">
                        Data de Início da Cobrança da Mensalidade
                      </label>
                      <input
                        type="date"
                        value={dataInicioCobrancaInput}
                        onChange={(e) => setDataInicioCobrancaInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-xs font-bold font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={teste1DiaInput}
                          onChange={(e) => setTeste1DiaInput(e.target.checked)}
                          className="rounded border-gray-300 text-[#E8571A] focus:ring-[#E8571A] w-4 h-4"
                        />
                        <span className="text-xs font-bold text-[#2C2C2C]">
                          Habilitar Teste de 1 Dia (Isenção inicial)
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={integrarAsaasInput}
                          onChange={(e) => setIntegrarAsaasInput(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span className="text-xs font-bold text-blue-700">
                          Gerar Cobrança e Link no Asaas
                        </span>
                      </label>
                    </div>

                    {formError && (
                      <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl font-medium">{formError}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-[#1C1917] hover:bg-[#2C2C2C] text-white font-extrabold py-3 rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Key className="w-4 h-4 text-[#D4A574]" />
                      <span>Cadastrar Empresa e Gerar Chave</span>
                    </button>
                  </form>
                </div>

                {/* Newly Generated Company Key Banner */}
                {generatedCompany && (
                  <div className="bg-gradient-to-br from-[#1C1917] to-[#2C2C2C] text-white p-6 rounded-3xl shadow-xl border border-[#D4A574] space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#D4A574] uppercase tracking-widest flex items-center space-x-1">
                        <Sparkles className="w-4 h-4 text-[#E8571A]" />
                        <span>Empresa Cadastrada!</span>
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                        ATIVO
                      </span>
                    </div>

                    <div>
                      <p className="text-base font-extrabold text-white">{generatedCompany.empresa}</p>
                      <p className="text-xs text-gray-400">{generatedCompany.email}</p>
                    </div>

                    <div className="bg-black/50 p-4 rounded-2xl border border-dashed border-[#D4A574] text-center space-y-1">
                      <span className="text-[11px] text-gray-400">Chave de Ativação (8 Caracteres):</span>
                      <div className="text-3xl font-mono font-black text-[#D4A574] tracking-widest">
                        {generatedCompany.codigoAtivacao}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyCode(generatedCompany.codigoAtivacao)}
                        className="flex-1 bg-[#D4A574] hover:bg-[#c29363] text-[#1C1917] font-extrabold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                      >
                        {copiedCode === generatedCompany.codigoAtivacao ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span>{copiedCode === generatedCompany.codigoAtivacao ? 'Copiado!' : 'Copiar Chave'}</span>
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
                          <th className="py-3 px-4">Chave de Ativação</th>
                          <th className="py-3 px-4">Data Cadastro</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-[#2C2C2C]">
                        {filteredCompanies.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-gray-400">
                              Nenhuma empresa encontrada.
                            </td>
                          </tr>
                        ) : (
                          filteredCompanies.map((c) => (
                            <tr key={c.codigoAtivacao} className="hover:bg-gray-50/80 transition-colors">
                              {/* Empresa & Details */}
                              <td className="py-3.5 px-4 font-bold">
                                <div className="text-sm font-extrabold text-[#2C2C2C]">{c.empresa}</div>
                                <div className="text-[11px] font-normal text-gray-500">{c.email}</div>
                                {c.cnpj && (
                                  <div className="text-[10px] text-gray-400 font-mono">CNPJ: {c.cnpj}</div>
                                )}
                              </td>

                              {/* Activation Key with Copy & Edit */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-mono font-black text-[#E8571A] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 text-xs">
                                    {c.codigoAtivacao}
                                  </span>
                                  <button
                                    onClick={() => handleCopyCode(c.codigoAtivacao)}
                                    className="p-1 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
                                    title="Copiar Chave"
                                  >
                                    {copiedCode === c.codigoAtivacao ? (
                                      <Check className="w-3.5 h-3.5 text-green-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditKey(c)}
                                    className="p-1 text-gray-400 hover:text-[#E8571A] transition-colors cursor-pointer"
                                    title="Personalizar ou Alterar Chave de Ativação"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
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
