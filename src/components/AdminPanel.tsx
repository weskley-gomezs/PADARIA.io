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

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('empresas');

  // Form states
  const [empresaName, setEmpresaName] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [telefoneInput, setTelefoneInput] = useState<string>('');
  const [cnpjInput, setCnpjInput] = useState<string>('');
  const [generatedCompany, setGeneratedCompany] = useState<BakeryCompany | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

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
    if (authStatus) {
      loadAdminData();
    }
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

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!empresaName.trim() || !emailInput.trim()) {
      setFormError('Por favor, preencha o Nome da Padaria e o E-mail.');
      return;
    }

    try {
      const newComp = StorageService.addCompany(empresaName, emailInput, telefoneInput, cnpjInput);
      setGeneratedCompany(newComp);
      setEmpresaName('');
      setEmailInput('');
      setTelefoneInput('');
      setCnpjInput('');
      loadAdminData();

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

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleStatus = (code: string) => {
    StorageService.toggleCompanyStatus(code);
    loadAdminData();
  };

  const handleDeleteCompany = (code: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir a padaria "${name}"? Todos os produtos vinculados também serão removidos.`)) {
      StorageService.deleteCompany(code);
      if (generatedCompany?.codigoAtivacao === code) {
        setGeneratedCompany(null);
      }
      loadAdminData();
    }
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.codigoAtivacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-[#E0E0E0] p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-[#2C2C2C] text-[#D4A574] rounded-2xl flex items-center justify-center shadow-md">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-[#2C2C2C]">
              Acesso Administrativo
            </h2>
            <p className="text-xs text-gray-500">
              Painel de Controle Central - PADARIA.io
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">
                Senha Master / Admin
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite sua senha de Admin"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm"
                  autoFocus
                />
                <Lock className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Acessar Painel Admin</span>
              <ArrowRight className="w-4 h-4 text-[#D4A574]" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD WITH TABS
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Admin */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#2C2C2C] text-[#D4A574] text-xs font-bold uppercase tracking-wider">
              ADMINISTRADOR MASTER
            </span>
            <h1 className="text-2xl font-extrabold text-[#2C2C2C]">Painel Central - PADARIA.io</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Gestão de empresas, faturamento recorrente, contratos em PDF e tickets de suporte
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={async () => {
              if (confirm('Deseja realmente limpar todos os dados do sistema e do banco de dados? Esta ação zerará a lista de padarias e estoques.')) {
                await StorageService.clearAllSystemData();
                loadAdminData();
                setGeneratedCompany(null);
                alert('Sistema limpo com sucesso!');
              }
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Zerar todos os registros do sistema"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Sistema</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('empresas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'empresas'
              ? 'bg-[#2C2C2C] text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#D4A574]" />
          <span>Cadastros & Ativação</span>
        </button>

        <button
          onClick={() => setActiveTab('cobranca')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'cobranca'
              ? 'bg-[#2C2C2C] text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <DollarSign className="w-4 h-4 text-green-500" />
          <span>Cobrança & Faturamento</span>
        </button>

        <button
          onClick={() => setActiveTab('contratos')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'contratos'
              ? 'bg-[#2C2C2C] text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-4 h-4 text-[#E8571A]" />
          <span>Contrato & Documentos</span>
        </button>

        <button
          onClick={() => setActiveTab('suporte')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'suporte'
              ? 'bg-[#2C2C2C] text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-blue-500" />
          <span>Suporte & Tickets</span>
        </button>

        <button
          onClick={() => setActiveTab('treinamento')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'treinamento'
              ? 'bg-[#2C2C2C] text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span>Plano de Treinamento</span>
        </button>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'empresas' && (
        <div className="space-y-8 animate-fade-in">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total de Padarias</p>
                <p className="text-3xl font-black text-[#2C2C2C] mt-1">{stats.totalPadarias}</p>
              </div>
              <div className="p-3 bg-[#F5E6D3] text-[#D4A574] rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Padarias Ativas</p>
                <p className="text-3xl font-black text-[#27AE60] mt-1">{stats.padariasAtivas}</p>
              </div>
              <div className="p-3 bg-green-50 text-[#27AE60] rounded-xl">
                <Power className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Produtos Monitorados</p>
                <p className="text-3xl font-black text-[#2C2C2C] mt-1">{stats.totalProdutos}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Package className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Produtos Vencidos</p>
                <p className="text-3xl font-black text-[#E74C3C] mt-1">{stats.produtosVencidos}</p>
              </div>
              <div className="p-3 bg-red-50 text-[#E74C3C] rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Main Content Grid: Register Form + Activation Code Alert */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Form & Activation Code Banner */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <PlusCircle className="w-5 h-5 text-[#E8571A]" />
                  <h2 className="text-lg font-extrabold text-[#2C2C2C]">1. Cadastrar Nova Padaria</h2>
                </div>

                <form onSubmit={handleCreateCompany} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                      Nome da Padaria / Panificadora *
                    </label>
                    <input
                      type="text"
                      value={empresaName}
                      onChange={(e) => setEmpresaName(e.target.value)}
                      placeholder="Ex: Padaria São João"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm"
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
                      placeholder="Ex: gerencia@padaria.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                      Telefone / WhatsApp (opcional)
                    </label>
                    <input
                      type="text"
                      value={telefoneInput}
                      onChange={(e) => setTelefoneInput(e.target.value)}
                      placeholder="(11) 99999-8888"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                      CNPJ da Panificadora (para o contrato)
                    </label>
                    <input
                      type="text"
                      value={cnpjInput}
                      onChange={(e) => setCnpjInput(e.target.value)}
                      placeholder="Ex: 12.345.678/0001-90"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm font-mono"
                    />
                  </div>

                  {formError && (
                    <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg font-medium">{formError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#D4A574] hover:bg-[#c29363] text-white font-bold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Key className="w-4 h-4" />
                    <span>Gerar Código de Ativação</span>
                  </button>
                </form>
              </div>

              {/* Newly Generated Code Display Banner */}
              {generatedCompany && (
                <div className="bg-gradient-to-br from-[#2C2C2C] to-[#1a1a1a] text-white p-6 rounded-2xl shadow-md border border-[#D4A574] space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D4A574] uppercase tracking-widest flex items-center space-x-1">
                      <Sparkles className="w-4 h-4 text-[#E8571A]" />
                      <span>Código de Ativação Gerado!</span>
                    </span>
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold">
                      ATIVO
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-300">Empresa Cadastrada:</p>
                    <p className="text-base font-extrabold text-white">{generatedCompany.empresa}</p>
                    <p className="text-xs text-gray-400">{generatedCompany.email}</p>
                  </div>

                  <div className="bg-black/40 p-4 rounded-xl border border-dashed border-[#D4A574] text-center space-y-2">
                    <span className="text-xs text-gray-400">Código de Acesso de 8 Caracteres:</span>
                    <div className="text-3xl font-mono font-black text-[#D4A574] tracking-widest">
                      {generatedCompany.codigoAtivacao}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyCode(generatedCompany.codigoAtivacao)}
                      className="flex-1 bg-[#D4A574] hover:bg-[#c29363] text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCode ? 'Copiado!' : 'Copiar Código'}</span>
                    </button>

                    <button
                      onClick={() => onLoginAsBakery(generatedCompany.codigoAtivacao)}
                      className="bg-[#E8571A] hover:bg-[#d04911] text-white font-bold px-3 py-2.5 rounded-xl text-xs transition-all flex items-center space-x-1 cursor-pointer"
                      title="Testar acesso como esta padaria"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">Acessar App</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Registered Companies Table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-[#2C2C2C]">2. Empresas Cadastradas</h2>
                    <p className="text-xs text-gray-500">Lista completa com status e códigos de ativação</p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAFAF8] text-gray-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-gray-200">
                        <th className="py-3 px-4">Padaria</th>
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Cadastro</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-[#2C2C2C]">
                      {filteredCompanies.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-400">
                            Nenhuma empresa encontrada.
                          </td>
                        </tr>
                      ) : (
                        filteredCompanies.map((c) => (
                          <tr key={c.codigoAtivacao} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold">
                              <div>{c.empresa}</div>
                              <div className="text-[11px] font-normal text-gray-500">{c.email}</div>
                              {c.telefone && <div className="text-[10px] text-gray-400">{c.telefone}</div>}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-mono font-bold text-[#E8571A] bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                  {c.codigoAtivacao}
                                </span>
                                <button
                                  onClick={() => handleCopyCode(c.codigoAtivacao)}
                                  className="text-gray-400 hover:text-[#2C2C2C] p-1 cursor-pointer"
                                  title="Copiar Código"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-gray-500">{c.dataCadastro}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  c.ativo
                                    ? 'bg-green-100 text-[#27AE60]'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {c.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1">
                              {/* Test Login shortcut button */}
                              <button
                                onClick={() => onLoginAsBakery(c.codigoAtivacao)}
                                className="p-1.5 rounded-lg bg-[#F5E6D3] hover:bg-[#D4A574] hover:text-white text-[#2C2C2C] transition-colors cursor-pointer"
                                title="Acessar como esta padaria"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Active Status */}
                              <button
                                onClick={() => handleToggleStatus(c.codigoAtivacao)}
                                className={`p-1.5 rounded-lg text-white transition-colors cursor-pointer ${
                                  c.ativo ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'
                                }`}
                                title={c.ativo ? 'Desativar Empresa' : 'Reativar Empresa'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteCompany(c.codigoAtivacao, c.empresa)}
                                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors cursor-pointer"
                                title="Excluir Padaria"
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

      {/* COBRANÇA & FATURAMENTO TAB */}
      {activeTab === 'cobranca' && (
        <div className="animate-fade-in">
          <AdminBilling companies={companies} stats={financialStats} onRefresh={loadAdminData} />
        </div>
      )}

      {/* CONTRATOS & DOCUMENTOS TAB */}
      {activeTab === 'contratos' && (
        <div className="animate-fade-in">
          <AdminContracts companies={companies} onCompanyUpdate={loadAdminData} />
        </div>
      )}

      {/* SUPORTE & TICKETS TAB */}
      {activeTab === 'suporte' && (
        <div className="animate-fade-in">
          <AdminSupportTickets onRefresh={loadAdminData} />
        </div>
      )}

      {/* PLANO DE TREINAMENTO TAB */}
      {activeTab === 'treinamento' && (
        <div className="animate-fade-in">
          <AdminTrainingPlan companies={companies} />
        </div>
      )}
    </div>
  );
};
