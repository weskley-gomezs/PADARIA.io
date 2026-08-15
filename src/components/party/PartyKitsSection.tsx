import React, { useState, useMemo, useEffect } from 'react';
import {
  Cake,
  Utensils,
  Candy,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  Calendar,
  Clock,
  MessageSquare,
  ChevronRight,
  Settings,
  Share2,
  DollarSign,
  Users,
  Eye,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  ChefHat,
  Smartphone,
  Monitor,
  Save,
  X,
  RefreshCw,
  Upload
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PartyKit, PartyOrder, PartyOrderStatus, PartyBakeryPublicConfig } from '../../types';
import { PartyKitModal } from './PartyKitModal';
import { PartyOrderDetailModal } from './PartyOrderDetailModal';
import { PublicPartyOrderPage } from './PublicPartyOrderPage';
import { generatePublicBakerySlug, createBakeryContactClientMessage, getDefaultPublicConfig, getProductionOrderingUrl } from '../../utils/partyOrderEngine';

interface PartyKitsSectionProps {
  onOpenPublicOrderView?: (slug: string) => void;
}

export const PartyKitsSection: React.FC<PartyKitsSectionProps> = ({ onOpenPublicOrderView }) => {
  const {
    activeCode,
    activeCompany,
    partyKits,
    partyOrders,
    partyPublicConfig,
    savePartyKit,
    deletePartyKit,
    updatePartyOrderStatus,
    savePartyPublicConfig
  } = useData();

  const [activeTab, setActiveTab] = useState<'pedidos' | 'kits' | 'cardapio_editor' | 'configuracoes'>('pedidos');

  // Modals
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [kitToEdit, setKitToEdit] = useState<PartyKit | null>(null);

  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<PartyOrder | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);

  // Filters for Orders
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateQuickFilter, setDateQuickFilter] = useState<'todos' | 'hoje' | 'amanha' | 'semana'>('todos');

  // Settings Form State
  const [configNomeExibicao, setConfigNomeExibicao] = useState(
    partyPublicConfig?.nomeExibicao || activeCompany?.empresa || 'Minha Padaria'
  );
  const [configWhatsapp, setConfigWhatsapp] = useState(
    partyPublicConfig?.telefoneWhatsapp || activeCompany?.telefone || ''
  );
  const [configAntecedencia, setConfigAntecedencia] = useState<number>(
    partyPublicConfig?.antecedenciaMinimaHoras || 24
  );
  const [configTaxaEntrega, setConfigTaxaEntrega] = useState<number>(
    partyPublicConfig?.taxaEntregaPadrao || 15.0
  );
  const [configPermiteEntrega, setConfigPermiteEntrega] = useState<boolean>(
    partyPublicConfig?.permiteEntrega !== false
  );
  const [configPermiteRetirada, setConfigPermiteRetirada] = useState<boolean>(
    partyPublicConfig?.permiteRetirada !== false
  );
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Custom Menu Editor States (Live Preview)
  const [editorMassas, setEditorMassas] = useState<string[]>(
    partyPublicConfig?.opcoesMassaBolo || [
      'Massa Branca (Pão de Ló Tradicional)',
      'Massa de Chocolate 50% Cacau',
      'Massa Fofinha Amanteigada',
      'Massa Red Velvet Velvet',
      'Massa de Cenoura Especial'
    ]
  );
  const [newMassaInput, setNewMassaInput] = useState('');

  const [editorRecheios, setEditorRecheios] = useState<string[]>(
    partyPublicConfig?.opcoesRecheioBolo || [
      'Brigadeiro Tradicional Gourmet',
      'Ninho Cremoso com Morango',
      'Doce de Leite com Nozes',
      'Beijinho de Coco Fresco',
      'Prestígio com Chocolate',
      'Mousse de Maracujá',
      'Nutella Pura',
      'Abacaxi com Coco Artesanal',
      'Dois Amores (Preto e Branco)'
    ]
  );
  const [newRecheioInput, setNewRecheioInput] = useState('');

  const [editorSalgados, setEditorSalgados] = useState<string[]>(
    partyPublicConfig?.opcoesSalgados || [
      'Coxinha de Frango com Catupiry',
      'Kibe Tradicional com Hortelã',
      'Bolinha de Queijo Crocante',
      'Empadinha de Palmito Assada',
      'Esfiha de Carne Temperada',
      'Enroladinho de Salsicha',
      'Risoles de Presunto e Queijo'
    ]
  );
  const [newSalgadoInput, setNewSalgadoInput] = useState('');

  const [editorDocinhos, setEditorDocinhos] = useState<string[]>(
    partyPublicConfig?.opcoesDocinhos || [
      'Brigadeiro Tradicional Gourmet',
      'Beijinho de Coco Fresco',
      'Cajuzinho com Amendoim',
      'Bicho de Pé (Moranguinho)',
      'Ninho com Nutella',
      'Olho de Sogra'
    ]
  );
  const [newDocinhoInput, setNewDocinhoInput] = useState('');

  const [editorNome, setEditorNome] = useState(
    partyPublicConfig?.nomeExibicao || partyPublicConfig?.nomePublico || activeCompany?.empresa || 'Minha Padaria'
  );
  const [editorLogoUrl, setEditorLogoUrl] = useState(
    partyPublicConfig?.logoUrl || ''
  );
  const [editorMensagem, setEditorMensagem] = useState(
    partyPublicConfig?.mensagemApresentacao || '🎉 Monte seu Kit Festa personalizado em poucos passos e receba tudo fresquinho para sua comemoração!'
  );
  const [editorWhatsapp, setEditorWhatsapp] = useState(
    partyPublicConfig?.telefoneWhatsapp || partyPublicConfig?.whatsapp || activeCompany?.telefone || ''
  );
  const [editorSlug, setEditorSlug] = useState(
    partyPublicConfig?.slug || generatePublicBakerySlug(activeCompany?.empresa || 'padaria')
  );

  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  // Sync editor values when server/context config arrives
  useEffect(() => {
    if (partyPublicConfig) {
      if (partyPublicConfig.opcoesMassaBolo) setEditorMassas(partyPublicConfig.opcoesMassaBolo);
      if (partyPublicConfig.opcoesRecheioBolo) setEditorRecheios(partyPublicConfig.opcoesRecheioBolo);
      if (partyPublicConfig.opcoesSalgados) setEditorSalgados(partyPublicConfig.opcoesSalgados);
      if (partyPublicConfig.opcoesDocinhos) setEditorDocinhos(partyPublicConfig.opcoesDocinhos);
      if (partyPublicConfig.nomeExibicao || partyPublicConfig.nomePublico) {
        setEditorNome(partyPublicConfig.nomeExibicao || partyPublicConfig.nomePublico || '');
      }
      if (partyPublicConfig.logoUrl !== undefined) {
        setEditorLogoUrl(partyPublicConfig.logoUrl || '');
      }
      if (partyPublicConfig.mensagemApresentacao) setEditorMensagem(partyPublicConfig.mensagemApresentacao);
      if (partyPublicConfig.telefoneWhatsapp || partyPublicConfig.whatsapp) {
        setEditorWhatsapp(partyPublicConfig.telefoneWhatsapp || partyPublicConfig.whatsapp || '');
      }
      if (partyPublicConfig.slug) setEditorSlug(partyPublicConfig.slug);
    }
  }, [partyPublicConfig]);

  const bakerySlug = useMemo(() => {
    return editorSlug || partyPublicConfig?.slug || generatePublicBakerySlug(activeCompany?.empresa || 'padaria', activeCode || '01');
  }, [editorSlug, partyPublicConfig, activeCompany, activeCode]);

  const publicUrl = `https://padariaio.com.br/cardapio/${bakerySlug}`;
  const localPublicUrl = `${window.location.origin}/#/cardapio/${bakerySlug}`;

  // Reactive Live Preview Config
  const livePreviewConfig = useMemo<PartyBakeryPublicConfig>(() => {
    const base = partyPublicConfig || getDefaultPublicConfig(activeCode || '01', editorNome);
    return {
      ...base,
      bakeryCode: activeCode || '01',
      nomePublico: editorNome || 'Minha Padaria',
      nomeExibicao: editorNome,
      logoUrl: editorLogoUrl,
      slug: generatePublicBakerySlug(editorSlug || 'padaria'),
      whatsapp: editorWhatsapp,
      telefoneWhatsapp: editorWhatsapp,
      mensagemApresentacao: editorMensagem,
      opcoesMassaBolo: editorMassas,
      opcoesRecheioBolo: editorRecheios,
      opcoesSalgados: editorSalgados,
      opcoesDocinhos: editorDocinhos,
      antecedenciaMinimaHoras: configAntecedencia,
      taxaEntregaPadrao: configTaxaEntrega,
      permiteEntrega: configPermiteEntrega,
      permiteRetirada: configPermiteRetirada,
      updatedAt: new Date().toISOString()
    };
  }, [
    partyPublicConfig,
    activeCode,
    editorNome,
    editorLogoUrl,
    editorSlug,
    editorWhatsapp,
    editorMensagem,
    editorMassas,
    editorRecheios,
    editorSalgados,
    editorDocinhos,
    configAntecedencia,
    configTaxaEntrega,
    configPermiteEntrega,
    configPermiteRetirada
  ]);

  const handleSaveEditorConfig = async () => {
    if (!activeCode) return;
    setIsSavingConfig(true);
    try {
      await savePartyPublicConfig(livePreviewConfig);
      alert('🎉 Cardápio público e tipos de recheio salvos com sucesso!');
    } catch (err) {
      console.error('Error saving editor config:', err);
      alert('Erro ao salvar as alterações do cardápio.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const weekLimit = new Date();
    weekLimit.setDate(weekLimit.getDate() + 7);
    const weekLimitStr = weekLimit.toISOString().split('T')[0];

    return partyOrders.filter((order) => {
      // Status Filter
      if (statusFilter !== 'todos' && order.status !== statusFilter) return false;

      // Date Quick Filter
      if (dateQuickFilter === 'hoje' && order.agendamento.data !== todayStr) return false;
      if (dateQuickFilter === 'amanha' && order.agendamento.data !== tomorrowStr) return false;
      if (dateQuickFilter === 'semana' && (order.agendamento.data < todayStr || order.agendamento.data > weekLimitStr)) return false;

      // Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesClient = order.cliente.nome.toLowerCase().includes(term);
        const matchesId = order.id.toLowerCase().includes(term);
        const matchesKit = order.kitNome.toLowerCase().includes(term);
        const matchesPhone = order.cliente.whatsapp.includes(term);
        if (!matchesClient && !matchesId && !matchesKit && !matchesPhone) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by agendamento date + time
      const dateA = `${a.agendamento.data} ${a.agendamento.horario}`;
      const dateB = `${b.agendamento.data} ${b.agendamento.horario}`;
      return dateA.localeCompare(dateB);
    });
  }, [partyOrders, statusFilter, dateQuickFilter, searchTerm]);

  // Order Counts
  const counts = useMemo(() => {
    return {
      novo: partyOrders.filter((o) => o.status === 'NOVO').length,
      confirmado: partyOrders.filter((o) => o.status === 'CONFIRMADO').length,
      em_producao: partyOrders.filter((o) => o.status === 'EM_PRODUCAO').length,
      pronto: partyOrders.filter((o) => o.status === 'PRONTO').length,
      entregue: partyOrders.filter((o) => o.status === 'ENTREGUE').length,
      total: partyOrders.length
    };
  }, [partyOrders]);

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSavePublicConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCode) return;
    setIsSavingConfig(true);
    try {
      const baseConfig = partyPublicConfig || getDefaultPublicConfig(activeCode, configNomeExibicao.trim());
      const updated: PartyBakeryPublicConfig = {
        ...baseConfig,
        bakeryCode: activeCode,
        nomePublico: configNomeExibicao.trim() || baseConfig.nomePublico,
        nomeExibicao: configNomeExibicao.trim(),
        slug: bakerySlug,
        whatsapp: configWhatsapp.trim() || baseConfig.whatsapp,
        telefoneWhatsapp: configWhatsapp.trim(),
        antecedenciaMinimaHoras: Number(configAntecedencia) || 24,
        taxaEntregaPadrao: Number(configTaxaEntrega) || 0,
        permiteEntrega: configPermiteEntrega,
        permiteRetirada: configPermiteRetirada,
        paginaAtiva: true,
        ativo: true,
        regras: {
          ...baseConfig.regras,
          antecedenciaMinimaDias: Math.max(1, Math.round((Number(configAntecedencia) || 24) / 24)),
          permitirEntrega: configPermiteEntrega,
        },
        updatedAt: new Date().toISOString()
      };
      await savePartyPublicConfig(updated);
      alert('Configurações da página pública salvas com sucesso!');
    } catch (err) {
      console.error('Error saving party public config:', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const getStatusBadge = (status: PartyOrderStatus) => {
    switch (status) {
      case 'NOVO':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-black uppercase">Novo Pedido</span>;
      case 'CONFIRMADO':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-[10px] font-black uppercase">Confirmado</span>;
      case 'EM_PRODUCAO':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 rounded-full text-[10px] font-black uppercase">Em Produção</span>;
      case 'PRONTO':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-black uppercase">Pronto p/ Retirada</span>;
      case 'ENTREGUE':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-full text-[10px] font-black uppercase">Entregue</span>;
      case 'CANCELADO':
        return <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded-full text-[10px] font-black uppercase">Cancelado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-orange-500 via-[#E8571A] to-amber-600 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-black uppercase tracking-wider text-amber-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo de Encomendas & Kit Festa</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Gestão de Kit Festa & Pedidos Personalizados
          </h1>
          <p className="text-xs sm:text-sm text-white/90 max-w-xl">
            Configure seu cardápio de kits, receba pedidos dos clientes com personalização de bolos e salgados e acompanhe a esteira de produção.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyPublicLink}
            className="px-4 py-2.5 bg-white text-gray-900 hover:bg-amber-50 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Link Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-orange-600" />
                <span>Copiar Link do Cardápio</span>
              </>
            )}
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-black/30 hover:bg-black/40 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 backdrop-blur-xs border border-white/20 transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>Ver Cardápio Público</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        className="flex border-b border-gray-200 gap-1 sm:gap-2 overflow-x-auto no-scrollbar"
      >
        <button
          onClick={() => setActiveTab('pedidos')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'pedidos'
              ? 'border-[#E8571A] text-[#E8571A]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Cake className="w-4 h-4" />
          <span>Esteira de Pedidos</span>
          {counts.novo > 0 && (
            <span className="px-2 py-0.5 bg-orange-600 text-white rounded-full text-[10px] font-black animate-pulse">
              {counts.novo} novo{counts.novo > 1 ? 's' : ''}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('kits')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'kits'
              ? 'border-[#E8571A] text-[#E8571A]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Cardápio de Kits ({partyKits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cardapio_editor')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'cardapio_editor'
              ? 'border-[#E8571A] text-[#E8571A]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Eye className="w-4 h-4 text-orange-600" />
          <span>Editor do Cardápio & Visualização Ao Vivo</span>
          <span className="px-1.5 py-0.5 bg-orange-100 text-[#E8571A] rounded-full text-[10px] font-black uppercase">
            Ao Vivo
          </span>
        </button>

        <button
          onClick={() => setActiveTab('configuracoes')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'configuracoes'
              ? 'border-[#E8571A] text-[#E8571A]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuração & Link</span>
        </button>
      </div>

      {/* TAB 1: ESTEIRA DE ENCOMENDAS */}
      {activeTab === 'pedidos' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <button
              onClick={() => setStatusFilter(statusFilter === 'NOVO' ? 'todos' : 'NOVO')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                statusFilter === 'NOVO' ? 'bg-amber-100 border-amber-400 shadow-xs' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800">Novos</span>
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xl font-black text-amber-900 mt-1">{counts.novo}</p>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'CONFIRMADO' ? 'todos' : 'CONFIRMADO')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                statusFilter === 'CONFIRMADO' ? 'bg-blue-100 border-blue-400 shadow-xs' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-800">Confirmados</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl font-black text-blue-900 mt-1">{counts.confirmado}</p>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'EM_PRODUCAO' ? 'todos' : 'EM_PRODUCAO')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                statusFilter === 'EM_PRODUCAO' ? 'bg-purple-100 border-purple-400 shadow-xs' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-800">Em Produção</span>
                <ChefHat className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xl font-black text-purple-900 mt-1">{counts.em_producao}</p>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'PRONTO' ? 'todos' : 'PRONTO')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                statusFilter === 'PRONTO' ? 'bg-emerald-100 border-emerald-400 shadow-xs' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800">Prontos</span>
                <Package className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-black text-emerald-900 mt-1">{counts.pronto}</p>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'ENTREGUE' ? 'todos' : 'ENTREGUE')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                statusFilter === 'ENTREGUE' ? 'bg-gray-200 border-gray-400 shadow-xs' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700">Entregues</span>
                <Check className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-xl font-black text-gray-900 mt-1">{counts.entregue}</p>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, pedido ou telefone..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-gray-500 flex items-center space-x-1 shrink-0">
                <Calendar className="w-3.5 h-3.5" />
                <span>Período:</span>
              </span>

              {[
                { id: 'todos', label: 'Todos' },
                { id: 'hoje', label: 'Hoje' },
                { id: 'amanha', label: 'Amanhã' },
                { id: 'semana', label: 'Próx. 7 Dias' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDateQuickFilter(f.id as any)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer ${
                    dateQuickFilter === f.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}

              {statusFilter !== 'todos' && (
                <button
                  onClick={() => setStatusFilter('todos')}
                  className="text-xs text-orange-600 font-bold hover:underline ml-2 shrink-0"
                >
                  Limpar filtro
                </button>
              )}
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 space-y-3">
              <Cake className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-base font-black text-gray-800">Nenhuma encomenda encontrada</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Quando os clientes fizerem pedidos através da sua página pública, eles aparecerão automaticamente aqui.
              </p>
              <button
                onClick={handleCopyPublicLink}
                className="px-4 py-2 bg-[#E8571A] text-white text-xs font-bold rounded-xl shadow-xs hover:opacity-90 transition-all cursor-pointer"
              >
                Divulgar Página de Encomendas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((order) => {
                const cleanPhone = order.cliente.whatsapp.replace(/\D/g, '');
                const whatsAppUrl = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}?text=${encodeURIComponent(
                  createBakeryContactClientMessage(activeCompany?.empresa || 'Padaria', order.cliente.nome, order.id)
                )}`;

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderForDetail(order);
                      setIsOrderDetailModalOpen(true);
                    }}
                    className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900">{order.id}</span>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm font-black text-gray-900">{order.cliente.nome}</p>
                        <p className="text-xs font-black text-[#E8571A]">
                          R$ {order.valorTotal.toFixed(2).replace('.', ',')}
                        </p>
                      </div>

                      {/* Agendamento */}
                      <div className="mt-2 p-2 bg-orange-50/70 rounded-xl border border-orange-200/60 flex items-center justify-between text-xs text-orange-950">
                        <span className="font-bold flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-[#E8571A]" />
                          <span>{order.agendamento.data.split('-').reverse().join('/')} às {order.agendamento.horario}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-gray-600 capitalize">
                          {order.cliente.tipoEntrega === 'entrega' ? '🚚 Entrega' : '🏬 Retirada'}
                        </span>
                      </div>

                      {/* Summary breakdown */}
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        <p className="truncate">
                          🎂 <strong>Bolo:</strong> {order.bolo.recheiosEscolhidos.join(', ')}
                          {order.bolo.tema ? ` (Tema: ${order.bolo.tema})` : ''}
                        </p>
                        <p className="truncate">
                          🥟 <strong>Salgados:</strong> {order.salgados.total} un ({order.salgados.distribuicao.map(s => `${s.quantidade} ${s.sabor}`).join(', ')})
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <a
                        href={whatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderForDetail(order);
                          setIsOrderDetailModalOpen(true);
                        }}
                        className="text-xs font-bold text-gray-700 hover:text-black flex items-center space-x-1"
                      >
                        <span>Ver Detalhes</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KITS CADASTRADOS */}
      {activeTab === 'kits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-gray-900">Cardápio de Kits Festa</h2>
              <p className="text-xs text-gray-500">
                Gerencie os modelos de kits que seus clientes podem encomendar online.
              </p>
            </div>

            <button
              onClick={() => {
                setKitToEdit(null);
                setIsKitModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-[#E8571A] text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md hover:opacity-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Kit Festa</span>
            </button>
          </div>

          {partyKits.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 space-y-3">
              <Cake className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-base font-black text-gray-800">Nenhum kit cadastrado ainda</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Crie seu primeiro Kit Festa com bolo personalizado, salgadinhos e docinhos para começar a vender.
              </p>
              <button
                onClick={() => {
                  setKitToEdit(null);
                  setIsKitModalOpen(true);
                }}
                className="px-5 py-2.5 bg-orange-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-orange-700 cursor-pointer"
              >
                Criar Primeiro Kit Festa
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {partyKits.map((kit) => (
                <div
                  key={kit.id}
                  className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Header Badge Bar without photos */}
                  <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-xl bg-orange-100 border border-orange-200 text-[#E8571A] flex items-center justify-center font-black">
                        <Cake className="w-4 h-4" />
                      </div>
                      <span className="px-2.5 py-0.5 bg-white border border-gray-200 text-gray-800 rounded-full text-[11px] font-black shadow-2xs">
                        ~{kit.quantidadePessoas} Pessoas
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      kit.status === 'publicado' ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-white'
                    }`}>
                      {kit.status}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-sm font-black text-gray-900 line-clamp-1">{kit.nome}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{kit.descricao}</p>

                      <div className="mt-3 text-[11px] font-bold text-gray-600 space-y-1.5 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                        <p className="flex items-center space-x-1.5">
                          <span className="text-amber-600">🎂</span>
                          <span>{kit.bolo.tamanhoDescricao}</span>
                        </p>
                        <p className="flex items-center space-x-1.5">
                          <span className="text-orange-600">🥟</span>
                          <span>{kit.salgados.quantidadeTotal} Salgados ({kit.salgados.saboresDisponiveis.length} sabores)</span>
                        </p>
                        <p className="flex items-center space-x-1.5">
                          <span className="text-pink-600">🍬</span>
                          <span>{kit.docinhos.quantidadeTotal} Docinhos ({kit.docinhos.saboresDisponiveis.length} sabores)</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-base font-black text-[#E8571A]">
                        R$ {kit.precoBase.toFixed(2).replace('.', ',')}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            setKitToEdit(kit);
                            setIsKitModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Editar Kit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir o kit "${kit.nome}"? Esta ação não pode ser desfeita.`)) {
                              deletePartyKit(kit.id);
                            }
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Excluir Kit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EDITOR DO CARDÁPIO & VISUALIZAÇÃO AO VIVO */}
      {activeTab === 'cardapio_editor' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-[#E8571A] text-white p-5 rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <ChefHat className="w-6 h-6 text-amber-200" />
                <h2 className="text-lg font-black">Editor de Opções do Cardápio & Preview Ao Vivo</h2>
              </div>
              <p className="text-xs text-amber-100 mt-1 max-w-2xl">
                Personalize as massas de bolo, recheios, sabores de salgados e doces que os clientes verão ao pedir.
                Veja o resultado em tempo real no simulador ao lado!
              </p>
            </div>

            <button
              onClick={handleSaveEditorConfig}
              disabled={isSavingConfig}
              className="px-5 py-3 bg-white text-gray-900 hover:bg-amber-50 rounded-2xl text-xs font-black shadow-lg transition-all flex items-center space-x-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#E8571A]" />
              <span>{isSavingConfig ? 'Salvando...' : 'Salvar Cardápio'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: EDITORS (5 COLS ON LG) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Card 1: Identidade da Padaria e Link */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <Settings className="w-5 h-5 text-orange-600" />
                  <h3 className="text-sm font-black text-gray-900">Identidade do Cardápio & Link</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome Exibido no Cardápio</label>
                  <input
                    type="text"
                    value={editorNome}
                    onChange={(e) => setEditorNome(e.target.value)}
                    placeholder="Ex: Padaria Doce Sabor"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Logo da Padaria / Confeitaria</label>
                  <div className="flex items-center space-x-3">
                    {editorLogoUrl ? (
                      <div className="relative w-14 h-14 rounded-2xl border-2 border-orange-200 bg-white p-1 shadow-xs shrink-0">
                        <img src={editorLogoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                        <button
                          type="button"
                          onClick={() => setEditorLogoUrl('')}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-all cursor-pointer"
                          title="Remover Logo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center shrink-0">
                        <Cake className="w-6 h-6 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5">
                      <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#E8571A] border border-orange-200 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Carregar Imagem do Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 3 * 1024 * 1024) {
                                alert('A imagem do logo deve ter no máximo 3MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditorLogoUrl(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        value={editorLogoUrl}
                        onChange={(e) => setEditorLogoUrl(e.target.value)}
                        placeholder="Ou cole a URL da imagem (http...)"
                        className="w-full px-3 py-1 rounded-lg border border-gray-200 text-[11px] text-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Slug de Acesso no Link</label>
                  <div className="flex items-center space-x-1 text-xs">
                    <span className="text-gray-400 font-mono text-[11px] shrink-0">padariaio.com.br/cardapio/</span>
                    <input
                      type="text"
                      value={editorSlug}
                      onChange={(e) => setEditorSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-300 font-mono font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Link público oficial: <span className="font-bold text-orange-600">https://padariaio.com.br/cardapio/{editorSlug}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp Oficial para Receber Pedidos</label>
                  <input
                    type="text"
                    value={editorWhatsapp}
                    onChange={(e) => setEditorWhatsapp(e.target.value)}
                    placeholder="Ex: (11) 99999-8888"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mensagem de Boas-Vindas aos Clientes</label>
                  <textarea
                    rows={2}
                    value={editorMensagem}
                    onChange={(e) => setEditorMensagem(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Card 2: Massas de Bolo */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Cake className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-black text-gray-900">Massas de Bolo Disponíveis ({editorMassas.length})</h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {editorMassas.map((massa) => (
                    <span
                      key={massa}
                      className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                    >
                      <span>{massa}</span>
                      <button
                        type="button"
                        onClick={() => setEditorMassas(editorMassas.filter(i => i !== massa))}
                        className="text-amber-500 hover:text-red-600 cursor-pointer"
                        title="Remover"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newMassaInput}
                    onChange={(e) => setNewMassaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newMassaInput.trim() && !editorMassas.includes(newMassaInput.trim())) {
                          setEditorMassas([...editorMassas, newMassaInput.trim()]);
                          setNewMassaInput('');
                        }
                      }
                    }}
                    placeholder="Adicionar massa (ex: Red Velvet, Cenoura)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newMassaInput.trim() && !editorMassas.includes(newMassaInput.trim())) {
                        setEditorMassas([...editorMassas, newMassaInput.trim()]);
                        setNewMassaInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Recheios de Bolo */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-black text-gray-900">Recheios de Bolo Disponíveis ({editorRecheios.length})</h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {editorRecheios.map((recheio) => (
                    <span
                      key={recheio}
                      className="px-2.5 py-1 bg-amber-50 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                    >
                      <span>{recheio}</span>
                      <button
                        type="button"
                        onClick={() => setEditorRecheios(editorRecheios.filter(i => i !== recheio))}
                        className="text-amber-600 hover:text-red-600 cursor-pointer"
                        title="Remover"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newRecheioInput}
                    onChange={(e) => setNewRecheioInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newRecheioInput.trim() && !editorRecheios.includes(newRecheioInput.trim())) {
                          setEditorRecheios([...editorRecheios, newRecheioInput.trim()]);
                          setNewRecheioInput('');
                        }
                      }
                    }}
                    placeholder="Adicionar recheio (ex: Ninho com Nutella)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newRecheioInput.trim() && !editorRecheios.includes(newRecheioInput.trim())) {
                        setEditorRecheios([...editorRecheios, newRecheioInput.trim()]);
                        setNewRecheioInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Card 4: Sabores de Salgados */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Utensils className="w-4 h-4 text-orange-600" />
                    <h3 className="text-xs font-black text-gray-900">Sabores de Salgados ({editorSalgados.length})</h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {editorSalgados.map((salgado) => (
                    <span
                      key={salgado}
                      className="px-2.5 py-1 bg-orange-50 text-orange-900 border border-orange-200 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                    >
                      <span>{salgado}</span>
                      <button
                        type="button"
                        onClick={() => setEditorSalgados(editorSalgados.filter(i => i !== salgado))}
                        className="text-orange-500 hover:text-red-600 cursor-pointer"
                        title="Remover"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newSalgadoInput}
                    onChange={(e) => setNewSalgadoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newSalgadoInput.trim() && !editorSalgados.includes(newSalgadoInput.trim())) {
                          setEditorSalgados([...editorSalgados, newSalgadoInput.trim()]);
                          setNewSalgadoInput('');
                        }
                      }
                    }}
                    placeholder="Adicionar salgado (ex: Coxinha de Carne)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSalgadoInput.trim() && !editorSalgados.includes(newSalgadoInput.trim())) {
                        setEditorSalgados([...editorSalgados, newSalgadoInput.trim()]);
                        setNewSalgadoInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-[#E8571A] hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Card 5: Sabores de Docinhos */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Candy className="w-4 h-4 text-pink-600" />
                    <h3 className="text-xs font-black text-gray-900">Sabores de Docinhos ({editorDocinhos.length})</h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {editorDocinhos.map((docinho) => (
                    <span
                      key={docinho}
                      className="px-2.5 py-1 bg-pink-50 text-pink-900 border border-pink-200 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                    >
                      <span>{docinho}</span>
                      <button
                        type="button"
                        onClick={() => setEditorDocinhos(editorDocinhos.filter(i => i !== docinho))}
                        className="text-pink-500 hover:text-red-600 cursor-pointer"
                        title="Remover"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newDocinhoInput}
                    onChange={(e) => setNewDocinhoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newDocinhoInput.trim() && !editorDocinhos.includes(newDocinhoInput.trim())) {
                          setEditorDocinhos([...editorDocinhos, newDocinhoInput.trim()]);
                          setNewDocinhoInput('');
                        }
                      }
                    }}
                    placeholder="Adicionar docinho (ex: Bicho de Pé)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-pink-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newDocinhoInput.trim() && !editorDocinhos.includes(newDocinhoInput.trim())) {
                        setEditorDocinhos([...editorDocinhos, newDocinhoInput.trim()]);
                        setNewDocinhoInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Botão de Salvar Tudo */}
              <button
                type="button"
                onClick={handleSaveEditorConfig}
                disabled={isSavingConfig}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-[#E8571A] text-white rounded-2xl text-xs font-black shadow-md hover:opacity-95 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingConfig ? 'Salvando...' : 'Salvar Alterações no Cardápio'}</span>
              </button>

            </div>

            {/* RIGHT COLUMN: LIVE SIMULATOR / PREVIEW (7 COLS ON LG) */}
            <div className="lg:col-span-7 sticky top-4 space-y-3">
              <div className="bg-gray-900 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-md text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-extrabold">Simulador do Cardápio Público</span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex bg-gray-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                        previewDevice === 'mobile' ? 'bg-[#E8571A] text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Celular</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                        previewDevice === 'desktop' ? 'bg-[#E8571A] text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Expandido</span>
                    </button>
                  </div>

                  <a
                    href={localPublicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                    title="Abrir em Nova Aba"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* FRAME WRAPPER */}
              <div className="bg-gray-100 p-2 sm:p-4 rounded-3xl border border-gray-300 shadow-inner min-h-[600px] flex items-center justify-center">
                <div
                  className={`w-full transition-all duration-300 relative ${
                    previewDevice === 'mobile'
                      ? 'max-w-[400px] mx-auto border-[10px] border-slate-900 rounded-[40px] shadow-2xl overflow-y-auto max-h-[700px] bg-white my-2'
                      : 'w-full rounded-2xl border border-gray-200 shadow-md overflow-y-auto max-h-[750px] bg-white'
                  }`}
                >
                  <PublicPartyOrderPage
                    bakerySlug={editorSlug}
                    bakeryCode={activeCode || undefined}
                    overrideConfig={livePreviewConfig}
                    overrideKits={partyKits}
                    isLivePreviewMode={true}
                    previewDevice={previewDevice}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONFIGURAÇÕES DA PÁGINA PÚBLICA */}
      {activeTab === 'configuracoes' && (
        <form onSubmit={handleSavePublicConfig} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-5 max-w-2xl">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-black text-gray-900">Configurações da Página Pública & Atendimento</h2>
            <p className="text-xs text-gray-500">
              Personalize como seus clientes veem sua loja online e para onde as mensagens de WhatsApp serão enviadas.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Nome de Exibição da Padaria / Confeitaria *
              </label>
              <input
                type="text"
                value={configNomeExibicao}
                onChange={(e) => setConfigNomeExibicao(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                WhatsApp Oficial para Receber Pedidos (com DDD) *
              </label>
              <input
                type="text"
                value={configWhatsapp}
                onChange={(e) => setConfigWhatsapp(e.target.value)}
                required
                placeholder="(11) 99999-9999"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Antecedência Mínima de Pedido (em horas)
                </label>
                <input
                  type="number"
                  min="1"
                  value={configAntecedencia}
                  onChange={(e) => setConfigAntecedencia(parseInt(e.target.value) || 24)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-gray-400 mt-1">Ex: 24 horas para o cliente não pedir no mesmo dia.</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Taxa Padrão de Entrega (R$)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={configTaxaEntrega}
                  onChange={(e) => setConfigTaxaEntrega(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configPermiteRetirada}
                  onChange={(e) => setConfigPermiteRetirada(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="font-bold text-gray-800">Permitir retirada no balcão da loja</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configPermiteEntrega}
                  onChange={(e) => setConfigPermiteEntrega(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="font-bold text-gray-800">Permitir entrega no endereço</span>
              </label>
            </div>

            {/* Public URL Showcase */}
            <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200 space-y-2">
              <span className="text-[11px] font-black text-orange-900 uppercase tracking-wider">
                Link da sua Página Pública
              </span>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="flex-1 px-3 py-2 bg-white rounded-xl border border-orange-300 text-xs text-gray-700 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyPublicLink}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={isSavingConfig}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-[#E8571A] text-white rounded-xl text-xs font-black shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingConfig ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      )}

      {/* Kit Modal */}
      <PartyKitModal
        isOpen={isKitModalOpen}
        onClose={() => setIsKitModalOpen(false)}
        onSave={async (kit) => {
          await savePartyKit(kit);
        }}
        onDelete={async (kitId) => {
          await deletePartyKit(kitId);
        }}
        kitToEdit={kitToEdit}
        bakeryCode={activeCode || 'PADARIA01'}
      />

      {/* Order Detail Modal */}
      <PartyOrderDetailModal
        isOpen={isOrderDetailModalOpen}
        onClose={() => setIsOrderDetailModalOpen(false)}
        order={selectedOrderForDetail}
        onUpdateStatus={async (orderId, status, nota) => {
          await updatePartyOrderStatus(orderId, status, 'Operador da Padaria', nota);
          if (selectedOrderForDetail) {
            setSelectedOrderForDetail({
              ...selectedOrderForDetail,
              status
            });
          }
        }}
        bakeryName={activeCompany?.empresa || 'Padaria'}
      />
    </div>
  );
};
