import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  PlusCircle,
  History,
  Scale,
  Calendar,
  DollarSign,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Info,
  ShieldCheck
} from 'lucide-react';
import { StockCount } from '../types';
import { formatDateToBR } from '../utils/dateUtils';

interface DivergencesSectionProps {
  onOpenNewCountModal?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const DivergencesSection: React.FC<DivergencesSectionProps> = ({
  onOpenNewCountModal,
  onNavigateTab
}) => {
  const { stockCounts, products, inventoryItems, activeCode } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'divergent' | 'accurate'>('all');
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  // Filter stock counts by date & search & variance
  const filteredCounts = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (period === '7d') cutoff.setDate(now.getDate() - 7);
    if (period === '30d') cutoff.setDate(now.getDate() - 30);

    return stockCounts.filter((c) => {
      // Date filter
      if (period !== 'all') {
        const itemDate = new Date(c.countedAt || new Date().toISOString());
        if (itemDate < cutoff) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (!c.productName.toLowerCase().includes(term)) return false;
      }

      // Variance status filter
      const hasDivergence = Math.abs(c.varianceQuantity) > 0.001;
      if (filterType === 'divergent' && !hasDivergence) return false;
      if (filterType === 'accurate' && hasDivergence) return false;

      return true;
    });
  }, [stockCounts, period, searchTerm, filterType]);

  // Key Executive Metrics
  const metrics = useMemo(() => {
    const totalConferences = stockCounts.length;
    const divergentCounts = stockCounts.filter((c) => Math.abs(c.varianceQuantity) > 0.001);
    const accurateCounts = stockCounts.filter((c) => Math.abs(c.varianceQuantity) <= 0.001);

    const totalFinancialLoss = divergentCounts
      .filter((c) => c.varianceQuantity < 0)
      .reduce((sum, c) => sum + Math.abs(c.varianceValue || 0), 0);

    const totalSurplus = divergentCounts
      .filter((c) => c.varianceQuantity > 0)
      .reduce((sum, c) => sum + Math.abs(c.varianceValue || 0), 0);

    const netImpact = divergentCounts.reduce((sum, c) => sum + (c.varianceValue || 0), 0);

    const accuracyRate =
      totalConferences > 0 ? Math.round((accurateCounts.length / totalConferences) * 100) : 100;

    return {
      totalConferences,
      divergentCount: divergentCounts.length,
      accurateCount: accurateCounts.length,
      totalFinancialLoss,
      totalSurplus,
      netImpact,
      accuracyRate
    };
  }, [stockCounts]);

  // Reincident / Top Divergent Products
  const topDivergentItems = useMemo(() => {
    const map = new Map<string, { name: string; count: number; totalLossValue: number; unit: string }>();

    stockCounts.forEach((c) => {
      if (Math.abs(c.varianceQuantity) > 0.001) {
        const existing = map.get(c.productId) || {
          name: c.productName,
          count: 0,
          totalLossValue: 0,
          unit: c.unit || 'un'
        };
        existing.count += 1;
        existing.totalLossValue += Math.abs(c.varianceValue || 0);
        map.set(c.productId, existing);
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalLossValue - a.totalLossValue)
      .slice(0, 5);
  }, [stockCounts]);

  return (
    <div id="divergences-section" className="space-y-6 pb-12 animate-fadeIn">
      {/* ---------------------------------------------------- */}
      {/* 1. HEADER & ACTION BAR                               */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold uppercase tracking-wider mb-2">
              <Scale className="w-3.5 h-3.5" />
              Controle Físico vs. Contábil
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Divergências & Conferência de Estoque
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Compare a quantidade que o sistema espera com a contagem física real da padaria e descubra onde estão os desvios.
            </p>
          </div>

          <button
            id="btn-trigger-stock-count"
            onClick={onOpenNewCountModal || (() => onNavigateTab && onNavigateTab('stock'))}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-sm shadow-md transition-all active:scale-95 whitespace-nowrap self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Nova Conferência Física
          </button>
        </div>

        {/* 3 High-Impact Executive Variance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-100">
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Taxa de Acuracidade</span>
            <div className="text-2xl font-bold text-amber-950 mt-1 flex items-baseline gap-2">
              <span>{metrics.accuracyRate}%</span>
              <span className="text-xs font-normal text-amber-800">
                ({metrics.accurateCount}/{metrics.totalConferences} sem desvio)
              </span>
            </div>
            <p className="text-[11px] text-amber-800/80 mt-1">
              Percentual de conferências com estoque físico 100% alinhado.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-900">Perdas por Divergência</span>
            <div className="text-2xl font-bold text-rose-900 mt-1">
              R$ {metrics.totalFinancialLoss.toFixed(2)}
            </div>
            <p className="text-[11px] text-rose-700 mt-1">
              Valor de mercadoria que constava no sistema mas sumiu na contagem.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">Total de Divergências</span>
            <div className="text-2xl font-bold text-stone-900 mt-1">
              {metrics.divergentCount} itens
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Itens que apresentaram sobra ou falta na auditoria física.
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. REINCIDENT / TOP ITEMS SUMMARY (If Any)           */}
      {/* ---------------------------------------------------- */}
      {topDivergentItems.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-950 text-white shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-100 uppercase tracking-wider">
              Itens mais críticos com divergência acumulada
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {topDivergentItems.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{item.name}</h4>
                  <span className="text-xs text-amber-300/80">{item.count} conferências com divergência</span>
                </div>
                <span className="text-sm font-bold text-rose-300 bg-rose-950/60 px-2 py-1 rounded border border-rose-800">
                  - R$ {item.totalLossValue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. FILTERS & SEARCH                                  */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por produto conferido..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center rounded-lg bg-stone-100 p-0.5 text-xs font-semibold text-stone-600">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-md transition-colors ${filterType === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'hover:text-stone-900'}`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterType('divergent')}
              className={`px-3 py-1 rounded-md transition-colors ${filterType === 'divergent' ? 'bg-white text-amber-900 shadow-sm' : 'hover:text-stone-900'}`}
            >
              Com Divergência
            </button>
            <button
              onClick={() => setFilterType('accurate')}
              className={`px-3 py-1 rounded-md transition-colors ${filterType === 'accurate' ? 'bg-white text-emerald-900 shadow-sm' : 'hover:text-stone-900'}`}
            >
              Acuradas (100%)
            </button>
          </div>

          {/* Period Filter */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="all">Todo o Histórico</option>
          </select>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. DIVERGENCE COMPARISON TABLE                       */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Data / Hora</th>
                <th className="py-3.5 px-4">Produto</th>
                <th className="py-3.5 px-4 text-center">Esperado Sistema</th>
                <th className="py-3.5 px-4 text-center">Físico Contado</th>
                <th className="py-3.5 px-4 text-center">Divergência</th>
                <th className="py-3.5 px-4 text-right">Impacto Financeiro</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCounts.length > 0 ? (
                filteredCounts.map((count) => {
                  const hasDivergence = Math.abs(count.varianceQuantity) > 0.001;
                  const isNegative = count.varianceQuantity < 0;

                  return (
                    <tr key={count.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                        {new Date(count.countedAt || new Date().toISOString()).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        {count.productName}
                        {count.notes && (
                          <span className="block text-[11px] font-normal text-stone-400 italic mt-0.5">
                            Obs: {count.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-stone-700 whitespace-nowrap">
                        {count.expectedQuantity} {count.unit || 'un'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-stone-900 whitespace-nowrap">
                        {count.physicalQuantity} {count.unit || 'un'}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                            !hasDivergence
                              ? 'text-emerald-700 bg-emerald-50'
                              : isNegative
                              ? 'text-rose-700 bg-rose-50'
                              : 'text-blue-700 bg-blue-50'
                          }`}
                        >
                          {isNegative ? <TrendingDown className="w-3 h-3" /> : count.varianceQuantity > 0 ? <TrendingUp className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {count.varianceQuantity > 0 ? `+${count.varianceQuantity}` : count.varianceQuantity} {count.unit || 'un'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                        {count.varianceValue && Math.abs(count.varianceValue) > 0 ? (
                          <span className={isNegative ? 'text-rose-700' : 'text-blue-700'}>
                            {isNegative ? '-' : '+'} R$ {Math.abs(count.varianceValue).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-stone-400">R$ 0,00</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            !hasDivergence
                              ? 'bg-emerald-100 text-emerald-800'
                              : isNegative
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {!hasDivergence ? 'Exato' : isNegative ? 'Falta / Desvio' : 'Sobra'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <Scale className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-sm">Nenhuma conferência de estoque encontrada</p>
                    <p className="text-xs text-stone-400 mt-1">
                      Clique em "Nova Conferência Física" para auditar os itens do seu estoque.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
