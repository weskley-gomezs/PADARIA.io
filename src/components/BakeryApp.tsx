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

interface BakeryAppProps {
  onOpenAdmin: () => void;
  presetCode?: string | null;
}

export const BakeryApp: React.FC<BakeryAppProps> = ({ onOpenAdmin, presetCode }) => {
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

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);

  // Accordion UI state
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);
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

  useEffect(() => {
    if (activeCode) {
      const comp = StorageService.getCompanyByCode(activeCode);
      if (comp && comp.ativo) {
        setCompany(comp);
        loadBakeryData(activeCode);
      } else {
        // Invalid or deactivated company
        if (comp && !comp.ativo) {
          setLoginError('Empresa inativa. Entre em contato com o suporte/administrador.');
        } else {
          setLoginError('Código de ativação não encontrado.');
        }
        setActiveCode(null);
        StorageService.setActiveBakeryCode(null);
      }
    } else {
      setCompany(null);
    }
  }, [activeCode]);

  const loadBakeryData = (code: string) => {
    const prods = StorageService.getProducts(code);
    setProducts(prods);
    const history = StorageService.getSalesHistory(code);
    setSalesHistory(history);
  };

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
  const handleSaveProduct = (
    nome: string,
    quantidade: number,
    dataValidade: string,
    categoria?: string
  ) => {
    if (!company) return;

    try {
      if (productToEdit) {
        StorageService.updateProduct(productToEdit.id, nome, quantidade, dataValidade, categoria);
        showToast('Produto atualizado com sucesso!');
      } else {
        StorageService.addProduct(company.codigoAtivacao, nome, quantidade, dataValidade, categoria);
        showToast('Produto cadastrado com sucesso!');
      }
      loadBakeryData(company.codigoAtivacao);
      setProductToEdit(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar produto.');
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (!company) return;
    if (confirm(`Deseja realmente excluir o produto "${name}"?`)) {
      StorageService.deleteProduct(id);
      loadBakeryData(company.codigoAtivacao);
      showToast('Produto excluído.');
    }
  };

  const handleMarkAsSold = (id: string) => {
    if (!company) return;
    const sold = StorageService.markAsSold(id);
    if (sold) {
      loadBakeryData(company.codigoAtivacao);
      showToast(`Item "${sold.nomeProduto}" marcado como vendido! ✅`);
      // Celebration effect
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
      });
    }
  };

  const handleRestoreSold = (historyId: string) => {
    if (!company) return;
    const restored = StorageService.restoreSoldProduct(historyId);
    if (restored) {
      loadBakeryData(company.codigoAtivacao);
      showToast(`Produto "${restored.nome}" restaurado ao estoque.`);
    }
  };

  const handleRegenerateCode = () => {
    if (!company) return;
    const newCode = generateActivationCode();
    if (confirm(`Deseja gerar um novo código de ativação? O novo código será: ${newCode}`)) {
      try {
        StorageService.updateCompanyCode(company.codigoAtivacao, newCode);
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

  // Filtered Table Data
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.categoria && p.categoria.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || p.categoria === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categoriesList = Array.from(new Set(products.map((p) => p.categoria || 'Geral')));

  // IF NOT LOGGED IN -> RENDER ACTIVATION CODE LOGIN SCREEN
  if (!activeCode || !company) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E0E0E0] p-8 space-y-6 animate-scale-up">
          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4A574] to-[#E8571A] text-white flex items-center justify-center shadow-lg relative">
              <ChefHat className="w-9 h-9" />
              <div className="absolute -bottom-1 -right-1 bg-[#2C2C2C] p-1 rounded-full border-2 border-white">
                <Clock className="w-3.5 h-3.5 text-[#D4A574]" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-black text-[#2C2C2C]">
                PADARIA<span className="text-[#E8571A]">.io</span>
              </h1>
              <p className="text-xs text-gray-500 mt-1">Acesso do Aplicativo da Panificadora</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[#2C2C2C] uppercase tracking-wider mb-1">
                Código de Ativação (8 Dígitos)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={8}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="EX: AB12CD34"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 font-mono font-bold text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574] uppercase text-[#2C2C2C]"
                  autoFocus
                  required
                />
                <Key className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1 text-center">
                Digite o código fornecido pelo seu administrador.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-center">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#D4A574] hover:bg-[#c29363] text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md text-sm flex items-center justify-center space-x-2"
            >
              <span>Entrar no Sistema</span>
              <Sparkles className="w-4 h-4 text-amber-200" />
            </button>
          </form>

          {/* Demo Shortcuts */}
          <div className="pt-4 border-t border-gray-100 text-center space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Códigos de Demonstração Rápidos:
            </span>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <button
                onClick={() => {
                  setCodeInput('AB12CD34');
                  StorageService.setActiveBakeryCode('AB12CD34');
                  setActiveCode('AB12CD34');
                }}
                className="px-2.5 py-1.5 bg-[#F5E6D3] hover:bg-[#D4A574] hover:text-white rounded-lg text-xs font-mono font-bold text-[#2C2C2C] transition-all"
              >
                AB12CD34 (Pão D'Ouro)
              </button>
              <button
                onClick={() => {
                  setCodeInput('PAD8X92M');
                  StorageService.setActiveBakeryCode('PAD8X92M');
                  setActiveCode('PAD8X92M');
                }}
                className="px-2.5 py-1.5 bg-orange-50 hover:bg-[#E8571A] hover:text-white rounded-lg text-xs font-mono font-bold text-[#E8571A] transition-all"
              >
                PAD8X92M (Panificadora Imperial)
              </button>
            </div>
            <div className="pt-2">
              <button
                onClick={onOpenAdmin}
                className="text-xs text-gray-500 underline hover:text-[#2C2C2C]"
              >
                Não possui código? Acesse o Painel Admin para gerar um.
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD WHEN LOGGED IN
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2C2C2C] text-white font-bold px-4 py-3 rounded-xl shadow-xl text-xs border border-[#D4A574] animate-bounce flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#D4A574]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-[#2C2C2C]">{company.empresa}</h1>
            <span className="px-2.5 py-1 bg-orange-50 text-[#E8571A] border border-orange-200 text-xs font-mono font-bold rounded-lg">
              CÓDIGO: {company.codigoAtivacao}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Monitoramento em tempo real de validades e estoque • Responsável: {company.email}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSupportOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-[#E8571A] hover:text-white text-[#E8571A] text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border border-orange-200"
            title="Solicitar Suporte Técnico"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Suporte</span>
          </button>

          <button
            onClick={() => setIsPrintReportOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#F5E6D3] hover:bg-[#D4A574] hover:text-white text-[#2C2C2C] text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório</span>
          </button>

          <button
            onClick={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#D4A574] hover:bg-[#c29363] text-white text-xs font-extrabold shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Produto</span>
          </button>
        </div>
      </div>

      {/* 1. RESUMO RÁPIDO CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Card 1: Normais */}
        <div
          onClick={() => setStatusFilter('normal')}
          className={`bg-white border rounded-xl p-6 flex items-center gap-5 cursor-pointer transition-all shadow-xs ${
            statusFilter === 'normal'
              ? 'border-[#27AE60] ring-2 ring-[#27AE60]/30'
              : 'border-[#E0E0E0] hover:border-[#27AE60]'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] text-[#27AE60] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">PRODUTOS NORMAIS</div>
            <div className="text-2xl font-black text-[#2C2C2C] mt-0.5">{normalProducts.length}</div>
            <div className="text-[11px] text-gray-400">Validade segura (&gt; 3 dias)</div>
          </div>
        </div>

        {/* Card 2: Vencendo em breve */}
        <div
          onClick={() => setStatusFilter('vencendo')}
          className={`bg-white border rounded-xl p-6 flex items-center gap-5 cursor-pointer transition-all shadow-xs ${
            statusFilter === 'vencendo'
              ? 'border-[#F39C12] ring-2 ring-[#F39C12]/30'
              : 'border-[#E0E0E0] hover:border-[#F39C12]'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-[#FFF3E0] text-[#F39C12] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">VENCENDO EM BREVE</div>
            <div className="text-2xl font-black text-[#2C2C2C] mt-0.5">{expiringProducts.length}</div>
            <div className="text-[11px] text-amber-600 font-medium">Recomendado aplicar promoção</div>
          </div>
        </div>

        {/* Card 3: Vencidos */}
        <div
          onClick={() => setStatusFilter('vencido')}
          className={`bg-white border rounded-xl p-6 flex items-center gap-5 cursor-pointer transition-all shadow-xs ${
            statusFilter === 'vencido'
              ? 'border-[#E74C3C] ring-2 ring-[#E74C3C]/30'
              : 'border-[#E0E0E0] hover:border-[#E74C3C]'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-[#FFEBEE] text-[#E74C3C] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#E74C3C] uppercase tracking-wider">PRODUTOS VENCIDOS</div>
            <div className="text-2xl font-black text-[#E74C3C] mt-0.5">{expiredProducts.length}</div>
            <div className="text-[11px] text-red-500 font-semibold">Remover da área de venda</div>
          </div>
        </div>
      </div>

      {/* Critical Warning Alert Banner */}
      {(expiredProducts.length > 0 || expiringProducts.length > 0) && (
        <div className="bg-gradient-to-r from-red-500 via-amber-500 to-amber-600 text-white p-4 rounded-2xl shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-extrabold">Atenção Crítica no Estoque!</p>
              <p className="text-xs text-white/90">
                Existem <strong>{expiredProducts.length}</strong> produtos vencidos e{' '}
                <strong>{expiringProducts.length}</strong> vencendo em até 3 dias.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="px-4 py-2 bg-white text-[#2C2C2C] hover:bg-gray-100 font-extrabold text-xs rounded-xl shadow-xs shrink-0 transition-all"
          >
            Ver Detalhes Críticos
          </button>
        </div>
      )}

      {/* 2. GERENCIAR PRODUTOS (TABELA INTERATIVA) */}
      <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-4">
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-extrabold text-[#2C2C2C]">2. Gerenciar Produtos</h2>
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

            {/* Status Filter Pills */}
            <div className="bg-[#FAFAF8] p-1 rounded-xl border border-gray-200 flex text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-[#2C2C2C] text-white'
                    : 'text-gray-500 hover:text-[#2C2C2C]'
                }`}
              >
                Todos ({products.length})
              </button>
              <button
                onClick={() => setStatusFilter('normal')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  statusFilter === 'normal'
                    ? 'bg-[#27AE60] text-white'
                    : 'text-gray-500 hover:text-[#27AE60]'
                }`}
              >
                Normais ({normalProducts.length})
              </button>
              <button
                onClick={() => setStatusFilter('vencendo')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  statusFilter === 'vencendo'
                    ? 'bg-[#F39C12] text-white'
                    : 'text-gray-500 hover:text-[#F39C12]'
                }`}
              >
                Vencendo ({expiringProducts.length})
              </button>
              <button
                onClick={() => setStatusFilter('vencido')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  statusFilter === 'vencido'
                    ? 'bg-[#E74C3C] text-white'
                    : 'text-gray-500 hover:text-[#E74C3C]'
                }`}
              >
                Vencidos ({expiredProducts.length})
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAF8] text-gray-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-gray-200">
                <th className="py-3.5 px-4">Produto</th>
                <th className="py-3.5 px-4">Quantidade</th>
                <th className="py-3.5 px-4">Data de Validade</th>
                <th className="py-3.5 px-4">Status Visual</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-[#2C2C2C]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <p className="font-bold text-sm">Nenhum produto encontrado.</p>
                    <p className="text-xs mt-1">Clique em "+ Adicionar Produto" para cadastrar itens no estoque.</p>
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

                    {/* Data de Validade */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-sm">{formatDateToBR(p.dataValidade)}</div>
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

                    {/* Status Visual Badge */}
                    <td className="py-3.5 px-4">
                      {p.status === 'vencido' && (
                        <div className="status-pill status-red animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Vencido!</span>
                        </div>
                      )}

                      {p.status === 'vencendo' && (
                        <div className="status-pill status-yellow">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Atenção</span>
                        </div>
                      )}

                      {p.status === 'normal' && (
                        <div className="status-pill status-green">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Válido</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {/* Marcar como Vendido */}
                      <button
                        onClick={() => handleMarkAsSold(p.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#27AE60] hover:bg-green-700 text-white font-bold text-xs transition-all shadow-xs inline-flex items-center space-x-1"
                        title="Marcar como Vendido"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Vendido</span>
                      </button>

                      {/* Editar */}
                      <button
                        onClick={() => {
                          setProductToEdit(p);
                          setIsProductModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-[#F5E6D3] hover:bg-[#D4A574] hover:text-white text-[#2C2C2C] transition-colors"
                        title="Editar Produto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Deletar */}
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.nome)}
                        className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
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

      {/* 3. HISTÓRICO DE VENDAS / BAIXAS (SEÇÃO EXPANSÍVEL) */}
      <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-xs overflow-hidden">
        <button
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#F5E6D3] text-[#2C2C2C] rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#2C2C2C]">
                3. Histórico de Vendas / Baixas ({salesHistory.length})
              </h2>
              <p className="text-xs text-gray-500">
                Produtos marcados como vendidos. Opção de restaurar em caso de erro acidental.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#D4A574]">
              {isHistoryExpanded ? 'Ocultar' : 'Expandir'}
            </span>
            {isHistoryExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {isHistoryExpanded && (
          <div className="p-6 pt-0 border-t border-gray-100 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-bold text-gray-400 uppercase">
                Registro de itens baixados
              </span>
              {salesHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Deseja realmente limpar todo o histórico de vendas?')) {
                      StorageService.clearSalesHistory(company.codigoAtivacao);
                      loadBakeryData(company.codigoAtivacao);
                      showToast('Histórico de vendas limpo.');
                    }
                  }}
                  className="text-xs text-red-600 hover:underline font-bold"
                >
                  Limpar Histórico
                </button>
              )}
            </div>

            {salesHistory.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center italic">
                Nenhum produto foi marcado como vendido ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAFAF8] text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                      <th className="py-2.5 px-3">Produto Vendido</th>
                      <th className="py-2.5 px-3">Quantidade</th>
                      <th className="py-2.5 px-3">Data da Venda</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {salesHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 font-bold text-[#2C2C2C]">{item.nomeProduto}</td>
                        <td className="py-2.5 px-3 font-bold">{item.quantidade} un</td>
                        <td className="py-2.5 px-3 text-gray-500">
                          {new Date(item.dataVenda).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleRestoreSold(item.id)}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-lg transition-colors inline-flex items-center space-x-1"
                            title="Restaurar ao Estoque"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restaurar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. CONFIGURAÇÕES DA PADARIA */}
      <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-xs overflow-hidden">
        <button
          onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gray-100 text-[#2C2C2C] rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#2C2C2C]">4. Configurações da Panificadora</h2>
              <p className="text-xs text-gray-500">Gerenciar conta, código de ativação e dados de segurança</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#D4A574]">
              {isSettingsExpanded ? 'Ocultar' : 'Expandir'}
            </span>
            {isSettingsExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {isSettingsExpanded && (
          <div className="p-6 pt-0 border-t border-gray-100 space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Box 1: Change Activation Code */}
              <div className="p-4 bg-[#FAFAF8] border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-[#E8571A]" />
                  <h4 className="font-extrabold text-sm text-[#2C2C2C]">Código de Ativação</h4>
                </div>
                <p className="text-xs text-gray-500">
                  Código atual: <strong className="font-mono text-[#E8571A]">{company.codigoAtivacao}</strong>
                </p>
                <button
                  onClick={handleRegenerateCode}
                  className="px-3.5 py-2 bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
                >
                  Gerar Novo Código de Ativação
                </button>
              </div>

              {/* Box 2: Privacy Policy & Terms */}
              <div className="p-4 bg-[#FAFAF8] border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-[#D4A574]" />
                  <h4 className="font-extrabold text-sm text-[#2C2C2C]">Segurança & Privacidade</h4>
                </div>
                <p className="text-xs text-gray-500">
                  Conformidade sanitária, termos de uso e política de privacidade do sistema.
                </p>
                <button
                  onClick={() => setIsPrivacyOpen(true)}
                  className="px-3.5 py-2 bg-[#F5E6D3] hover:bg-[#D4A574] hover:text-white text-[#2C2C2C] text-xs font-bold rounded-xl transition-all"
                >
                  Ver Política de Privacidade
                </button>
              </div>
            </div>

            {/* Logout button */}
            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-400">Sessão salva no navegador (válida por 30 dias)</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all flex items-center space-x-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        expiredProducts={expiredProducts}
        expiringProducts={expiringProducts}
        onMarkAsSold={handleMarkAsSold}
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

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => {
          setProductToEdit(null);
          setIsProductModalOpen(true);
        }}
        className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-[#E8571A] hover:bg-[#d44e15] text-white rounded-full flex items-center justify-center text-3xl font-light shadow-xl shadow-[#E8571A]/30 transition-all transform hover:scale-110 active:scale-95 cursor-pointer border-2 border-white"
        title="Adicionar Novo Produto"
      >
        +
      </button>
    </div>
  );
};
