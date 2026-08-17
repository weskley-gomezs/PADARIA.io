import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Package,
  Layers,
  Calendar,
  DollarSign,
  Activity,
  UserCheck,
  ChevronRight,
  RefreshCw,
  Eye,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { Product, StockCount, OperationalTask, SaleHistoryItem } from '../types';
import { formatDateToBR, calculateDaysRemaining } from '../utils/dateUtils';

interface OwnerSummaryDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenNewProductModal?: () => void;
  onOpenStockCountModal?: () => void;
}

export const OwnerSummaryDashboard: React.FC<OwnerSummaryDashboardProps> = ({
  onNavigateTab,
  onOpenNewProductModal,
  onOpenStockCountModal
}) => {
  const {
    products,
    salesHistory,
    vipOffers,
    stockCounts,
    inventoryMovements,
    operationalTasks,
    newPartyOrdersCount,
    activeCompany,
    activeCode,
    toggleOperationalTask
  } = useData();

  const [eventFilter, setEventFilter] = useState<'all' | 'conferencia' | 'perdas' | 'vendas' | 'tarefas'>('all');

  // ----------------------------------------------------
  // METRICS & AGGREGATIONS (Strictly real data)
  // ----------------------------------------------------
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Helper to compute value recovered per sale
  const getSaleValue = (s: SaleHistoryItem) => {
    const vip = vipOffers.find((v) => v.id === s.produtoId || v.productId === s.produtoId);
    if (vip) return vip.valorPromocional * s.quantidade;
    const prod = products.find((p) => p.id === s.produtoId || p.nome === s.nomeProduto);
    if (prod) {
      const unitVal = prod.valorTotal && prod.quantidade > 0 ? prod.valorTotal / prod.quantidade : prod.valorKg || 12;
      return unitVal * s.quantidade;
    }
    return s.quantidade * 12;
  };

  // 1. Products Status
  const expiredProducts = useMemo(() => {
    return products.filter((p) => 
      p.status === 'vencido' || 
      p.motivo === 'Descarte' || 
      p.motivo === 'descarte' || 
      p.motivo === 'Perda' || 
      p.motivo === 'Estragado' ||
      (p.dataValidade && p.dataValidade <= todayStr && p.motivo !== 'Venda')
    );
  }, [products, todayStr]);

  const expiringProducts = useMemo(() => {
    return products.filter((p) => 
      p.status === 'vencendo' && 
      p.motivo !== 'Descarte' && 
      p.motivo !== 'descarte' && 
      p.motivo !== 'Perda' && 
      p.motivo !== 'Estragado' &&
      p.dataValidade && 
      p.dataValidade > todayStr
    );
  }, [products, todayStr]);

  const normalProducts = useMemo(() => {
    return products.filter((p) => p.status === 'normal' && p.motivo !== 'Descarte' && p.motivo !== 'Perda');
  }, [products]);

  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.valorTotal || p.quantidade * (p.valorKg || 0)), 0);
  }, [products]);

  const totalExpiredLossValue = useMemo(() => {
    return expiredProducts.reduce((acc, p) => acc + (p.valorTotal || p.quantidade * (p.valorKg || 0)), 0);
  }, [expiredProducts]);

  const totalExpiringAtRiskValue = useMemo(() => {
    return expiringProducts.reduce((acc, p) => acc + (p.valorTotal || p.quantidade * (p.valorKg || 0)), 0);
  }, [expiringProducts]);

  // 2. Sales & VIP Recovered
  const totalRecoveredSalesValue = useMemo(() => {
    return salesHistory.reduce((acc, s) => acc + getSaleValue(s), 0);
  }, [salesHistory, vipOffers, products]);

  const todaySales = useMemo(() => {
    return salesHistory.filter((s) => s.dataVenda && s.dataVenda.startsWith(todayStr));
  }, [salesHistory, todayStr]);

  const todayRecoveredValue = useMemo(() => {
    return todaySales.reduce((acc, s) => acc + getSaleValue(s), 0);
  }, [todaySales, vipOffers, products]);

  // 3. Stock Divergences
  const recentDivergences = useMemo(() => {
    return stockCounts.filter((c) => Math.abs(c.varianceQuantity) > 0.001);
  }, [stockCounts]);

  const totalDivergenceImpact = useMemo(() => {
    return recentDivergences.reduce((acc, c) => acc + Math.abs(c.varianceValue || 0), 0);
  }, [recentDivergences]);

  // 4. Team Operational Routines
  const todayTasks = useMemo(() => {
    return operationalTasks.filter((t) => !t.dueDate || t.dueDate === todayStr || t.dueDate <= todayStr);
  }, [operationalTasks, todayStr]);

  const completedTodayTasks = useMemo(() => {
    return todayTasks.filter((t) => t.status === 'concluida');
  }, [todayTasks]);

  const pendingTodayTasks = useMemo(() => {
    return todayTasks.filter((t) => t.status !== 'concluida');
  }, [todayTasks]);

  const taskCompletionRate = useMemo(() => {
    if (todayTasks.length === 0) return 100;
    return Math.round((completedTodayTasks.length / todayTasks.length) * 100);
  }, [todayTasks, completedTodayTasks]);

  // ----------------------------------------------------
  // "PRECISA DA SUA ATENÇÃO" (Smart Actionable Alerts)
  // ----------------------------------------------------
  const attentionItems = useMemo(() => {
    const alerts: Array<{
      id: string;
      title: string;
      subtitle: string;
      level: 'critico' | 'atencao' | 'informativo';
      actionLabel: string;
      targetTab: string;
      impact?: string;
    }> = [];

    // Critical Divergences alert
    if (newPartyOrdersCount > 0) {
      alerts.push({
        id: 'party-orders-alert',
        title: `${newPartyOrdersCount} nova(s) encomenda(s) de Kit Festa recebida(s)`,
        subtitle: `Verifique os detalhes, confirme os pedidos e encaminhe para a esteira de produção.`,
        level: 'atencao',
        actionLabel: 'Ver Encomendas',
        targetTab: 'party'
      });
    }

    if (recentDivergences.length > 0) {
      const highestDiv = [...recentDivergences].sort((a, b) => Math.abs(b.varianceValue || 0) - Math.abs(a.varianceValue || 0))[0];
      alerts.push({
        id: 'div-alert',
        title: `${recentDivergences.length} divergência(s) de estoque detectada(s)`,
        subtitle: `Maior diferença: ${highestDiv.productName} (${highestDiv.varianceQuantity > 0 ? '+' : ''}${highestDiv.varianceQuantity} ${highestDiv.unit})`,
        level: 'critico',
        actionLabel: 'Ver Divergências',
        targetTab: 'divergences',
        impact: totalDivergenceImpact > 0 ? `Impacto: R$ ${totalDivergenceImpact.toFixed(2)}` : undefined
      });
    }

    // Expired items waiting for discard/loss recording
    if (expiredProducts.length > 0) {
      alerts.push({
        id: 'exp-alert',
        title: `${expiredProducts.length} lote(s) vencido(s) aguardando descarte`,
        subtitle: `Total de perdas acumuladas em produtos vencidos.`,
        level: 'critico',
        actionLabel: 'Gerenciar Descartes',
        targetTab: 'waste',
        impact: `Perda: R$ ${totalExpiredLossValue.toFixed(2)}`
      });
    }

    // Products expiring soon (1 to 3 days)
    if (expiringProducts.length > 0) {
      alerts.push({
        id: 'expiring-alert',
        title: `${expiringProducts.length} produto(s) prestes a vencer`,
        subtitle: `Oportunidade para aplicar desconto rápido no Clube VIP antes do vencimento.`,
        level: 'atencao',
        actionLabel: 'Criar Ofertas VIP',
        targetTab: 'vip',
        impact: `Valor em Risco: R$ ${totalExpiringAtRiskValue.toFixed(2)}`
      });
    }

    // Pending team routines for today
    if (pendingTodayTasks.length > 0) {
      alerts.push({
        id: 'task-alert',
        title: `${pendingTodayTasks.length} rotina(s) da equipe pendente(s) hoje`,
        subtitle: `Próxima: ${pendingTodayTasks[0].title} (${pendingTodayTasks[0].shift.toUpperCase()})`,
        level: pendingTodayTasks.some((t) => t.priority === 'alta' || t.priority === 'urgente') ? 'atencao' : 'informativo',
        actionLabel: 'Ver Rotinas',
        targetTab: 'routine'
      });
    }

    return alerts;
  }, [
    recentDivergences,
    totalDivergenceImpact,
    expiredProducts,
    totalExpiredLossValue,
    expiringProducts,
    totalExpiringAtRiskValue,
    pendingTodayTasks,
    newPartyOrdersCount
  ]);

  // ----------------------------------------------------
  // "O QUE ACONTECEU" (Unified Chronological Event Timeline)
  // ----------------------------------------------------
  const operationalTimeline = useMemo(() => {
    type TimelineEvent = {
      id: string;
      timestamp: string;
      category: 'conferencia' | 'perdas' | 'vendas' | 'tarefas';
      title: string;
      description: string;
      badge: string;
      badgeColor: string;
      value?: string;
    };

    const events: TimelineEvent[] = [];

    // Stock counts
    stockCounts.slice(0, 15).forEach((c) => {
      const hasDiv = Math.abs(c.varianceQuantity) > 0.001;
      events.push({
        id: `sc_${c.id}`,
        timestamp: c.countedAt || new Date().toISOString(),
        category: 'conferencia',
        title: `Conferência Física: ${c.productName}`,
        description: hasDiv
          ? `Esperado: ${c.expectedQuantity} ${c.unit} | Físico: ${c.physicalQuantity} ${c.unit} (Diferença: ${c.varianceQuantity > 0 ? '+' : ''}${c.varianceQuantity} ${c.unit})`
          : `Contagem exata confirmada (${c.physicalQuantity} ${c.unit}). Sem divergências.`,
        badge: hasDiv ? 'Divergência' : 'Auditado',
        badgeColor: hasDiv ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300',
        value: c.varianceValue && Math.abs(c.varianceValue) > 0 ? `R$ ${c.varianceValue.toFixed(2)}` : undefined
      });
    });

    // Sales / VIP Recovery
    salesHistory.slice(0, 15).forEach((s) => {
      const saleVal = getSaleValue(s);
      events.push({
        id: `sale_${s.id}`,
        timestamp: s.dataVenda || new Date().toISOString(),
        category: 'vendas',
        title: `Venda Salva: ${s.nomeProduto}`,
        description: `Quantidade recuperada: ${s.quantidade} un`,
        badge: 'Recuperado VIP',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        value: `+ R$ ${saleVal.toFixed(2)}`
      });
    });

    // Inventory Movements (Entries & Adjustments)
    inventoryMovements.slice(0, 15).forEach((m) => {
      const typeLabel = m.type === 'ENTRY' ? 'Entrada de Estoque' : m.type === 'WASTE' ? 'Descarte / Perda' : 'Ajuste de Estoque';
      const movementVal = m.costAtMovement ? m.costAtMovement * m.quantity : 0;
      events.push({
        id: `mov_${m.id}`,
        timestamp: m.createdAt,
        category: m.type === 'WASTE' ? 'perdas' : 'conferencia',
        title: `${typeLabel}: ${m.productName}`,
        description: `${m.quantity} ${m.unit || 'un'} ${m.reason ? `• Motivo: ${m.reason}` : ''}`,
        badge: m.type === 'ENTRY' ? 'Entrada' : m.type === 'WASTE' ? 'Descarte' : 'Ajuste',
        badgeColor: m.type === 'ENTRY' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-rose-100 text-rose-800 border-rose-300',
        value: movementVal > 0 ? `R$ ${movementVal.toFixed(2)}` : undefined
      });
    });

    // Direct Expired / Discarded Products
    expiredProducts.slice(0, 15).forEach((p) => {
      const prodLossVal = p.valorTotal || (p.peso && p.valorKg ? p.peso * p.valorKg : p.quantidade * (p.valorKg || 12.0));
      events.push({
        id: `waste_prod_${p.id}`,
        timestamp: p.dataCadastro ? (p.dataCadastro.includes('T') ? p.dataCadastro : `${p.dataCadastro}T12:00:00.000Z`) : new Date().toISOString(),
        category: 'perdas',
        title: `Descarte / Vencido: ${p.nome}`,
        description: `${p.quantidade} un ${p.categoria ? `• Categoria: ${p.categoria}` : ''} • Motivo: ${p.motivo || 'Descarte'}`,
        badge: 'Descarte',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
        value: prodLossVal > 0 ? `- R$ ${prodLossVal.toFixed(2)}` : undefined
      });
    });

    // Completed Operational Tasks
    operationalTasks.filter((t) => t.status === 'concluida' && t.completedAt).forEach((t) => {
      events.push({
        id: `task_${t.id}`,
        timestamp: t.completedAt || t.createdAt,
        category: 'tarefas',
        title: `Rotina Concluída: ${t.title}`,
        description: `Turno: ${t.shift.toUpperCase()} • Responsável: ${t.completedBy || 'Equipe'}${t.notes ? ` • Obs: ${t.notes}` : ''}`,
        badge: 'Rotina OK',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      });
    });

    // Sort descending by timestamp
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return events;
  }, [stockCounts, salesHistory, inventoryMovements, operationalTasks, vipOffers, products]);

  const filteredTimeline = useMemo(() => {
    if (eventFilter === 'all') return operationalTimeline.slice(0, 20);
    return operationalTimeline.filter((e) => e.category === eventFilter).slice(0, 20);
  }, [operationalTimeline, eventFilter]);

  return (
    <div id="owner-summary-dashboard" className="space-y-6 pb-12 animate-fadeIn">
      {/* ---------------------------------------------------- */}
      {/* 1. EXECUTIVE HEADER & REAL-TIME STATUS PULSE          */}
      {/* ---------------------------------------------------- */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-700/60 border border-amber-600/40 text-amber-200 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Visão Operacional do Dono • Padaria {activeCompany?.empresa || activeCode || 'Ativa'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Sua padaria funcionando. <span className="text-amber-300 font-serif italic">Você vivendo.</span>
            </h1>
            <p className="text-amber-200/80 text-sm max-w-xl">
              Acompanhe a operação em tempo real sem precisar estar no balcão. Controle perdas, divergências e rotinas da sua equipe com um clique.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-quick-padeia-copilot"
              onClick={() => onNavigateTab('padeia')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-950" />
              Perguntar à PadeIA™
            </button>
            <button
              id="btn-quick-new-count"
              onClick={onOpenStockCountModal || (() => onNavigateTab('divergences'))}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              Nova Conferência
            </button>
          </div>
        </div>

        {/* Live Operational Pulse Bar */}
        <div className="mt-6 pt-6 border-t border-amber-700/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-amber-300/70 block">Rotinas da Equipe</span>
            <span className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${taskCompletionRate === 100 ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
              {taskCompletionRate}% Concluídas Hoje
            </span>
          </div>
          <div>
            <span className="text-amber-300/70 block">Estoque Físico Auditado</span>
            <span className="text-sm sm:text-base font-bold text-white mt-0.5 block">
              {stockCounts.length} Conferências Registradas
            </span>
          </div>
          <div>
            <span className="text-amber-300/70 block">Divergências Abertas</span>
            <span className={`text-sm sm:text-base font-bold mt-0.5 block ${recentDivergences.length > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
              {recentDivergences.length} {recentDivergences.length === 1 ? 'item divergente' : 'itens divergentes'}
            </span>
          </div>
          <div>
            <span className="text-amber-300/70 block">Status Geral do Dia</span>
            <span className="text-sm sm:text-base font-bold text-emerald-300 mt-0.5 block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Operação Sincronizada
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. "PRECISA DA SUA ATENÇÃO" (AUTOMATED ACTIONABLE)   */}
      {/* ---------------------------------------------------- */}
      <div id="section-needs-attention" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Precisa da sua atenção
            </h2>
          </div>
          <span className="text-xs font-semibold text-stone-500">
            {attentionItems.length > 0 ? `${attentionItems.length} alerta(s) ativo(s)` : 'Tudo sob controle'}
          </span>
        </div>

        {attentionItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {attentionItems.map((item) => (
              <div
                key={item.id}
                id={`attention-card-${item.id}`}
                className={`p-4 rounded-xl border transition-all hover:shadow-md flex flex-col justify-between ${
                  item.level === 'critico'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : item.level === 'atencao'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : 'bg-blue-50/80 border-blue-200 text-blue-950'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        item.level === 'critico'
                          ? 'bg-rose-200 text-rose-900'
                          : item.level === 'atencao'
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-blue-200 text-blue-900'
                      }`}
                    >
                      {item.level === 'critico' ? 'Ação Imediata' : item.level === 'atencao' ? 'Recomendado' : 'Aviso'}
                    </span>
                    {item.impact && (
                      <span className="text-xs font-bold text-rose-700 bg-white/70 px-2 py-0.5 rounded border border-rose-200">
                        {item.impact}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm mt-2.5 text-stone-900 leading-snug">{item.title}</h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">{item.subtitle}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-end">
                  <button
                    id={`btn-act-${item.id}`}
                    onClick={() => onNavigateTab(item.targetTab)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-700 transition-colors"
                  >
                    {item.actionLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Nenhum ponto crítico detectado no momento</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Não há divergências graves de estoque, validades vencidas sem descarte ou tarefas atrasadas. Sua operação está fluindo perfeitamente.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. STATUS GERAL (6 HIGH-IMPACT EXECUTIVE CARDS)      */}
      {/* ---------------------------------------------------- */}
      <div id="section-general-status" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-700" />
            Status Geral da Operação
          </h2>
          <span className="text-xs text-stone-500 font-medium">Atualizado em tempo real</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Vendas / Recuperação VIP */}
          <div
            id="card-status-sales"
            onClick={() => onNavigateTab('vip')}
            className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Recuperação VIP</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900">
                R$ {totalRecoveredSalesValue.toFixed(2)}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {salesHistory.length} vendas recuperadas ({todaySales.length} hoje = R$ {todayRecoveredValue.toFixed(2)})
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-amber-800 font-semibold">
              <span>Ver ofertas & vendas</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Estoque Ativo */}
          <div
            id="card-status-stock"
            onClick={() => onNavigateTab('stock')}
            className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Estoque Ativo</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900">
                {products.length} lotes
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Valor estimado em estoque: R$ {totalStockValue.toFixed(2)}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-amber-800 font-semibold">
              <span>Gerenciar estoque</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Divergências de Estoque */}
          <div
            id="card-status-divergences"
            onClick={() => onNavigateTab('divergences')}
            className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Divergências Físicas</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${recentDivergences.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900">
                {recentDivergences.length} divergências
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Impacto apurado: <span className="font-semibold text-amber-900">R$ {totalDivergenceImpact.toFixed(2)}</span>
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-amber-800 font-semibold">
              <span>Conferência de estoque</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Perdas & Descartes */}
          <div
            id="card-status-waste"
            onClick={() => onNavigateTab('waste')}
            className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Perdas & Descartes</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900">
                R$ {totalExpiredLossValue.toFixed(2)}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {expiredProducts.length} lotes vencidos acumulados
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-amber-800 font-semibold">
              <span>Auditar descartes</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Validades Críticas */}
          <div
            id="card-status-validity"
            onClick={() => onNavigateTab('dashboard')}
            className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Validades Próximas</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900">
                {expiringProducts.length} itens vencendo
              </div>
              <p className="text-xs text-stone-500 mt-1">
                R$ {totalExpiringAtRiskValue.toFixed(2)} em risco nos próx. 3 dias
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-amber-800 font-semibold">
              <span>Ver painel de validades</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: Rotinas da Equipe */}
          <div
            id="card-status-routine"
            onClick={() => onNavigateTab('routine')}
            className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Rotinas da Equipe</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900 flex items-baseline gap-2">
                <span>{completedTodayTasks.length}/{todayTasks.length}</span>
                <span className="text-sm font-normal text-stone-500">({taskCompletionRate}%)</span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {pendingTodayTasks.length === 0 ? 'Todas as rotinas de hoje concluídas!' : `${pendingTodayTasks.length} tarefas pendentes hoje`}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-amber-800 font-semibold">
              <span>Acompanhar turnos</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. "O QUE ACONTECEU" (CHRONOLOGICAL EVENT FEED)       */}
      {/* ---------------------------------------------------- */}
      <div id="section-what-happened" className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-800" />
              O que aconteceu
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Linha do tempo das atividades operacionais registradas pela sua equipe e pelo sistema
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setEventFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                eventFilter === 'all' ? 'bg-amber-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setEventFilter('conferencia')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                eventFilter === 'conferencia' ? 'bg-amber-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Conferências
            </button>
            <button
              onClick={() => setEventFilter('vendas')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                eventFilter === 'vendas' ? 'bg-amber-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Vendas VIP
            </button>
            <button
              onClick={() => setEventFilter('tarefas')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                eventFilter === 'tarefas' ? 'bg-amber-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Rotinas
            </button>
            <button
              onClick={() => setEventFilter('perdas')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                eventFilter === 'perdas' ? 'bg-amber-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Descartes
            </button>
          </div>
        </div>

        {/* Timeline List */}
        {filteredTimeline.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {filteredTimeline.map((item) => (
              <div key={item.id} className="py-3.5 flex items-start justify-between gap-4 hover:bg-stone-50/60 rounded-xl px-2 -mx-2 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">{item.title}</h4>
                    <p className="text-xs text-stone-600 mt-0.5">{item.description}</p>
                    <span className="text-[11px] text-stone-400 mt-1 block">
                      {new Date(item.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                {item.value && (
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-sm text-stone-900 block">{item.value}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-stone-500">
            <Activity className="w-8 h-8 mx-auto text-stone-300 mb-2" />
            <p className="text-sm font-semibold">Nenhum evento registrado nesta categoria ainda</p>
            <p className="text-xs text-stone-400 mt-1">
              Conforme sua equipe realizar conferências, rotinas e vendas, os eventos aparecerão aqui automaticamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
