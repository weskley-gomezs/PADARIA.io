import React, { useState, useMemo } from 'react';
import {
  Boxes,
  ClipboardCheck,
  PlusCircle,
  History,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Layers,
  HelpCircle,
  RotateCcw,
  RefreshCw,
  Scale
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Product, MovementType } from '../types';
import { formatDateToBR } from '../utils/dateUtils';

export const StockControl: React.FC = () => {
  const {
    products,
    inventoryMovements,
    stockCounts,
    inventoryItems,
    addMovement,
    addStockCount,
    addInventoryItem,
    calculateExpectedStock,
    activeCompany
  } = useData();

  // Selected sub-tab
  const [subTab, setSubTab] = useState<'count' | 'movement' | 'history' | 'recurrent'>('count');

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [historyPeriod, setHistoryPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  // Physical Count Form State
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [inputInitial, setInputInitial] = useState<string>('');
  const [inputEntries, setInputEntries] = useState<string>('0');
  const [inputProduction, setInputProduction] = useState<string>('0');
  const [inputWaste, setInputWaste] = useState<string>('0');
  const [physicalInput, setPhysicalInput] = useState<string>('');
  const [countNotes, setCountNotes] = useState<string>('');
  const [isSubmittingCount, setIsSubmittingCount] = useState<boolean>(false);
  const [countResult, setCountResult] = useState<{
    productName: string;
    initial: number;
    entries: number;
    production: number;
    waste: number;
    expected: number;
    physical: number;
    variance: number;
    value: number;
    unit: string;
  } | null>(null);

  // Manual Movement Form State
  const [movProductId, setMovProductId] = useState<string>('');
  const [movType, setMovType] = useState<MovementType>('ENTRY');
  const [movQuantity, setMovQuantity] = useState<string>('');
  const [movCost, setMovCost] = useState<string>('');
  const [movReason, setMovReason] = useState<string>('');
  const [isSubmittingMov, setIsSubmittingMov] = useState<boolean>(false);
  const [movSuccessMsg, setMovSuccessMsg] = useState<string | null>(null);

  // Quick Register Stock Item State
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemInitialQty, setNewItemInitialQty] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [isSubmittingNewItem, setIsSubmittingNewItem] = useState(false);

  // Auto-fill initial stock reference when product changes
  React.useEffect(() => {
    if (!selectedProductId) {
      setInputInitial('');
      setInputEntries('0');
      setInputProduction('0');
      setInputWaste('0');
      setPhysicalInput('');
      setCountResult(null);
      return;
    }
    const item = inventoryItems.find((i) => i.id === selectedProductId);
    if (item) {
      setInputInitial(item.currentQuantity.toString());
    } else {
      const prod = products.find((p) => p.id === selectedProductId);
      if (prod) {
        setInputInitial(prod.quantidade.toString());
      } else {
        setInputInitial('0');
      }
    }
    setInputEntries('0');
    setInputProduction('0');
    setInputWaste('0');
    setPhysicalInput('');
    setCountResult(null);
  }, [selectedProductId, inventoryItems, products]);

  const handleRegisterNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setIsSubmittingNewItem(true);
    try {
      const initialQty = parseFloat(newItemInitialQty.replace(',', '.')) || 0;
      const unitCost = parseFloat(newItemCost.replace(',', '.')) || 0;

      const created = await addInventoryItem(
        newItemName.trim(),
        newItemUnit,
        initialQty,
        unitCost
      );

      // Auto-select the newly created item
      setSelectedProductId(created.id);
      setMovProductId(created.id);

      // Reset new item form
      setNewItemName('');
      setNewItemInitialQty('');
      setNewItemCost('');
      setIsAddingNewItem(false);
    } catch (err: any) {
      alert('Erro ao cadastrar item de estoque: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsSubmittingNewItem(false);
    }
  };

  // Selected product calculations for Physical Count
  const selectedProduct = useMemo(() => {
    const item = inventoryItems.find((i) => i.id === selectedProductId);
    if (item) {
      return {
        id: item.id,
        nome: item.name,
        unidade: item.unit,
        quantidade: item.currentQuantity,
        valorKg: item.unitCost,
        categoria: 'Estoque',
        dataValidade: '',
        status: 'ok' as any
      } as any;
    }
    return products.find((p) => p.id === selectedProductId) || null;
  }, [inventoryItems, products, selectedProductId]);

  const stockInfo = useMemo(() => {
    if (!selectedProductId) return null;
    return calculateExpectedStock(selectedProductId);
  }, [selectedProductId, calculateExpectedStock]);

  // Live calculation values for current form
  const numInitial = useMemo(() => parseFloat(inputInitial.replace(',', '.')) || 0, [inputInitial]);
  const numEntries = useMemo(() => parseFloat(inputEntries.replace(',', '.')) || 0, [inputEntries]);
  const numProduction = useMemo(() => parseFloat(inputProduction.replace(',', '.')) || 0, [inputProduction]);
  const numWaste = useMemo(() => parseFloat(inputWaste.replace(',', '.')) || 0, [inputWaste]);

  const liveExpected = useMemo(() => {
    return Number((numInitial + numEntries - numProduction - numWaste).toFixed(3));
  }, [numInitial, numEntries, numProduction, numWaste]);

  const numPhysical = useMemo(() => parseFloat(physicalInput.replace(',', '.')), [physicalInput]);
  const liveVariance = useMemo(() => {
    if (isNaN(numPhysical)) return 0;
    return Number((numPhysical - liveExpected).toFixed(3));
  }, [numPhysical, liveExpected]);

  const liveVarianceValue = useMemo(() => {
    const cost = stockInfo?.cost || 0;
    return Number((Math.abs(liveVariance) * cost).toFixed(2));
  }, [liveVariance, stockInfo]);

  // Overall statistics for Top Metrics
  const stats = useMemo(() => {
    const totalPhysicalItems = inventoryItems.reduce((acc, i) => acc + (i.currentQuantity || 0), 0) +
                               products.reduce((acc, p) => acc + (p.quantidade || 0), 0);
    
    // Filter stock counts by period
    const now = new Date();
    const periodDays = historyPeriod === '7d' ? 7 : historyPeriod === '30d' ? 30 : 3650;
    const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const periodCounts = stockCounts.filter((c) => new Date(c.countedAt) >= cutoffDate);

    const totalDivergenceValue = periodCounts.reduce((acc, c) => acc + (c.varianceValue || 0), 0);
    const divergentCounts = periodCounts.filter((c) => Math.abs(c.varianceQuantity) > 0.001);
    
    // Find biggest divergent product
    let maxDivergentItem: { name: string; qty: number; unit: string; val: number } | null = null;
    if (divergentCounts.length > 0) {
      const sorted = [...divergentCounts].sort((a, b) => b.varianceValue - a.varianceValue);
      const top = sorted[0];
      maxDivergentItem = {
        name: top.productName,
        qty: top.varianceQuantity,
        unit: top.unit,
        val: top.varianceValue
      };
    }

    return {
      totalPhysicalItems,
      totalDivergenceValue,
      divergentCountCount: divergentCounts.length,
      maxDivergentItem
    };
  }, [products, inventoryItems, stockCounts, historyPeriod]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    let list = [...stockCounts];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((c) => c.productName.toLowerCase().includes(term));
    }

    const now = new Date();
    const periodDays = historyPeriod === '7d' ? 7 : historyPeriod === '30d' ? 30 : 3650;
    const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    list = list.filter((c) => new Date(c.countedAt) >= cutoffDate);
    return list.sort((a, b) => new Date(b.countedAt).getTime() - new Date(a.countedAt).getTime());
  }, [stockCounts, searchTerm, historyPeriod]);

  // Recurrent Divergences (Products with 2+ divergent counts)
  const recurrentDivergences = useMemo(() => {
    const map = new Map<string, { productName: string; count: number; totalValue: number; lastUnit: string; history: typeof stockCounts }>();

    stockCounts.forEach((c) => {
      if (Math.abs(c.varianceQuantity) > 0.001) {
        const key = c.productId || c.productName.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
          existing.totalValue += c.varianceValue;
          existing.history.push(c);
        } else {
          map.set(key, {
            productName: c.productName,
            count: 1,
            totalValue: c.varianceValue,
            lastUnit: c.unit,
            history: [c]
          });
        }
      }
    });

    return Array.from(map.values()).filter((item) => item.count >= 2).sort((a, b) => b.count - a.count);
  }, [stockCounts]);

  // Handle Submit Physical Count
  const handleConfirmStockCount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedProduct || !stockInfo) return;

    if (isNaN(numPhysical) || numPhysical < 0) {
      alert('Por favor, informe a quantidade física encontrada.');
      return;
    }

    setIsSubmittingCount(true);
    try {
      const result = await addStockCount(
        selectedProductId,
        selectedProduct.nome,
        numInitial,
        numEntries,
        numProduction,
        numWaste,
        liveExpected,
        numPhysical,
        stockInfo.unit,
        stockInfo.cost,
        countNotes
      );

      setCountResult({
        productName: selectedProduct.nome,
        initial: numInitial,
        entries: numEntries,
        production: numProduction,
        waste: numWaste,
        expected: liveExpected,
        physical: numPhysical,
        variance: result.varianceQuantity,
        value: result.varianceValue,
        unit: stockInfo.unit
      });

      // Reset movement breakdown inputs for next conference
      setInputEntries('0');
      setInputProduction('0');
      setInputWaste('0');
      setPhysicalInput('');
      setCountNotes('');
    } catch (err: any) {
      alert('Erro ao registrar conferência física: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsSubmittingCount(false);
    }
  };

  // Handle Submit Manual Movement
  const handleConfirmMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movProductId) return;

    const targetProd = inventoryItems.find((i) => i.id === movProductId)
      ? (() => {
          const item = inventoryItems.find((i) => i.id === movProductId)!;
          return {
            id: item.id,
            nome: item.name,
            unidade: item.unit,
            quantidade: item.currentQuantity,
            valorKg: item.unitCost,
            peso: 0
          };
        })()
      : products.find((p) => p.id === movProductId);

    if (!targetProd) return;

    const qty = parseFloat(movQuantity.replace(',', '.'));
    if (isNaN(qty) || qty <= 0) {
      alert('Por favor, informe uma quantidade válida.');
      return;
    }

    const costVal = movCost ? parseFloat(movCost.replace(',', '.')) : (targetProd.valorKg || 0);

    setIsSubmittingMov(true);
    setMovSuccessMsg(null);
    try {
      await addMovement(
        targetProd.id,
        targetProd.nome,
        movType,
        qty,
        targetProd.unidade || (targetProd.peso ? 'kg' : 'unidade'),
        costVal,
        movReason || 'Movimentação manual registrada no estoque'
      );

      setMovSuccessMsg(`Movimentação de ${movType === 'ENTRY' ? 'Entrada (+)' : movType === 'WASTE' ? 'Descarte (-)' : 'Uso Interno (-)'} registrada com sucesso!`);
      setMovQuantity('');
      setMovCost('');
      setMovReason('');
    } catch (err: any) {
      alert('Erro ao registrar movimentação: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsSubmittingMov(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-[#111111] via-[#1E1E1E] to-[#2C2C2C] text-white p-5 sm:p-7 rounded-2xl shadow-md border border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#FF6B00] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                Módulo Avançado
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {activeCompany?.empresa || 'Gestão de Padaria'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1 flex items-center gap-2">
              <Boxes className="w-6 h-6 text-[#FF6B00]" />
              <span>Controle de Estoque & Divergências</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
              Compare instantaneamente o <strong className="text-amber-300">Estoque Esperado pelo Sistema</strong> com o <strong className="text-green-300">Estoque Físico Contado</strong> e identifique divergências reais em kg e em R$.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
            <Scale className="w-5 h-5 text-[#FF6B00]" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-300 block">Status da Auditoria</span>
              <span className="text-xs font-black text-emerald-400">Zero-Trust Ativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Valor em Divergência */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Valor Divergente</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-2xl font-black text-[#2C2C2C]">
              R$ {stats.totalDivergenceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-gray-500 block font-medium mt-0.5">
              acumulado em divergências
            </span>
          </div>
        </div>

        {/* Card 2: Divergências Registradas */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Conferências c/ Diferença</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-2xl font-black text-[#2C2C2C]">
              {stats.divergentCountCount} <span className="text-xs text-gray-500 font-normal">itens</span>
            </span>
            <span className="text-[11px] text-gray-500 block font-medium mt-0.5">
              no período selecionado
            </span>
          </div>
        </div>

        {/* Card 3: Itens no Estoque Físico */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cadastrados no Estoque</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-2xl font-black text-[#2C2C2C]">
              {inventoryItems.length} <span className="text-xs text-gray-500 font-normal">itens</span>
            </span>
            <span className="text-[11px] text-gray-500 block font-medium mt-0.5">
              disponíveis para contagem
            </span>
          </div>
        </div>

        {/* Card 4: Maior Divergência */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Maior Perca Registrada</span>
            <div className="p-2 bg-orange-50 text-[#FF6B00] rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {stats.maxDivergentItem ? (
              <>
                <span className="text-sm font-black text-red-600 truncate block" title={stats.maxDivergentItem.name}>
                  {stats.maxDivergentItem.name}
                </span>
                <span className="text-[11px] text-gray-600 font-bold block mt-0.5">
                  {stats.maxDivergentItem.qty} {stats.maxDivergentItem.unit} (R$ {stats.maxDivergentItem.val.toFixed(2)})
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400 font-semibold block mt-1">Nenhuma divergência grave</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between overflow-x-auto gap-1">
        <button
          onClick={() => setSubTab('count')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer min-h-[44px] flex-1 justify-center ${
            subTab === 'count'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-[#FF6B00]" />
          <span>Conferência Física</span>
        </button>

        <button
          onClick={() => setSubTab('movement')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer min-h-[44px] flex-1 justify-center ${
            subTab === 'movement'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-emerald-500" />
          <span>Lançar Movimentação</span>
        </button>

        <button
          onClick={() => setSubTab('history')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer min-h-[44px] flex-1 justify-center ${
            subTab === 'history'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <History className="w-4 h-4 text-blue-500" />
          <span>Histórico de Divergências</span>
        </button>

        <button
          onClick={() => setSubTab('recurrent')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer min-h-[44px] flex-1 justify-center relative ${
            subTab === 'recurrent'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-amber-500" />
          <span>Itens Reincidentes</span>
          {recurrentDivergences.length > 0 && (
            <span className="ml-1 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {recurrentDivergences.length}
            </span>
          )}
        </button>
      </div>

      {/* SUB-TAB 1: CONFERÊNCIA FÍSICA */}
      {subTab === 'count' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Select & Enter Daily Stock Closing */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-extrabold text-[#2C2C2C] flex items-center space-x-2">
                <ClipboardCheck className="w-5 h-5 text-[#FF6B00]" />
                <span>Conferência Diária / Fechamento de Estoque</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Informe a movimentação do dia e o valor físico contado na balança para apurar a divergência real.
              </p>
            </div>

            <form onSubmit={handleConfirmStockCount} className="space-y-4">
              {/* Product Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    1. Selecione o Produto / Ingrediente
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewItem(!isAddingNewItem)}
                    className="text-xs font-black text-[#FF6B00] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isAddingNewItem ? 'Fechar cadastro' : '+ Cadastrar item no estoque'}</span>
                  </button>
                </div>

                {isAddingNewItem ? (
                  <div className="bg-orange-50/50 border border-orange-200 p-4 rounded-xl space-y-3 mb-4 animate-scale-in">
                    <h3 className="text-xs font-black uppercase text-gray-700">Novo Item do Estoque</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Nome do Item</label>
                        <input
                          type="text"
                          placeholder="Ex: Queijo muçarela, Presunto, Farinha..."
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#FF6B00]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Unidade</label>
                        <select
                          value={newItemUnit}
                          onChange={(e) => setNewItemUnit(e.target.value)}
                          className="w-full h-10 px-2 bg-white border border-gray-300 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          <option value="kg">kg (Quilograma)</option>
                          <option value="unidade">unidade (Unid)</option>
                          <option value="litro">litro (L)</option>
                          <option value="g">grama (g)</option>
                          <option value="embalagem">embalagem (Emb)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Qtd. Inicial em Estoque</label>
                        <input
                          type="text"
                          placeholder="Ex: 10.0"
                          value={newItemInitialQty}
                          onChange={(e) => setNewItemInitialQty(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#FF6B00]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Custo Unitário (R$)</label>
                        <input
                          type="text"
                          placeholder="Ex: 24.50"
                          value={newItemCost}
                          onChange={(e) => setNewItemCost(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#FF6B00]"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRegisterNewItem}
                      disabled={isSubmittingNewItem || !newItemName.trim()}
                      className="w-full h-10 bg-[#FF6B00] hover:bg-[#E8571A] text-white text-xs font-black uppercase rounded-lg shadow-sm cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {isSubmittingNewItem ? 'Salvando...' : 'Salvar Item e Selecionar'}
                    </button>
                  </div>
                ) : null}

                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                  }}
                  className="w-full h-12 px-3.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-sm text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] cursor-pointer"
                  required
                >
                  <option value="">-- Clique para escolher o produto --</option>
                  <optgroup label="Itens Cadastrados no Estoque">
                    {inventoryItems.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.currentQuantity} {i.unit}) - Custo: R$ {i.unitCost.toFixed(2)}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Produtos do Controle de Validade (Legado)">
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.quantidade} {p.unidade || (p.peso ? 'kg' : 'unidade')}) - {p.categoria || 'Geral'}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Selected Product Daily Breakdown Form */}
              {selectedProduct && stockInfo && (
                <>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wide block">
                      2. Movimentação do Período ({stockInfo.unit})
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                          Estoque Inicial
                        </label>
                        <input
                          type="text"
                          value={inputInitial}
                          onChange={(e) => setInputInitial(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:ring-1 focus:ring-[#FF6B00]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">
                          Entradas (+)
                        </label>
                        <input
                          type="text"
                          value={inputEntries}
                          onChange={(e) => setInputEntries(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-amber-800 uppercase mb-1">
                          Para Produção (-)
                        </label>
                        <input
                          type="text"
                          value={inputProduction}
                          onChange={(e) => setInputProduction(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-bold text-amber-900 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-red-700 uppercase mb-1">
                          Descartado (-)
                        </label>
                        <input
                          type="text"
                          value={inputWaste}
                          onChange={(e) => setInputWaste(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-bold text-red-800 focus:ring-1 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Calculated Expected Stock Box */}
                  <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-amber-900 uppercase block">
                        Estoque Esperado pelo Sistema
                      </span>
                      <span className="text-[11px] text-amber-800 font-medium">
                        Calculado: {numInitial} + {numEntries} - {numProduction} - {numWaste}
                      </span>
                    </div>
                    <span className="text-lg font-black text-[#FF6B00] bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-2xs">
                      {liveExpected} {stockInfo.unit}
                    </span>
                  </div>

                  {/* Physical Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      3. Quanto Você Realmente Encontrou no Estoque? ({stockInfo.unit})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="Ex: 5.5"
                        value={physicalInput}
                        onChange={(e) => setPhysicalInput(e.target.value)}
                        className="w-full h-14 pl-4 pr-16 bg-white border-2 border-[#111111] rounded-xl font-extrabold text-lg text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black uppercase text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        {stockInfo.unit}
                      </span>
                    </div>
                  </div>

                  {/* Live Calculated Divergence */}
                  {!isNaN(numPhysical) && (
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${
                      Math.abs(liveVariance) < 0.001
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : liveVariance < 0
                        ? 'bg-red-50 border-red-300 text-red-900'
                        : 'bg-blue-50 border-blue-300 text-blue-900'
                    }`}>
                      <div>
                        <span className="text-xs font-black uppercase block">Divergência Estimada:</span>
                        <span className="text-sm font-black">
                          {liveVariance > 0 ? '+' : ''}{liveVariance} {stockInfo.unit}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold block">Impacto Financeiro:</span>
                        <span className="text-base font-black">
                          R$ {liveVarianceValue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Observações da Contagem (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Balança digital conferida, saco rasgado..."
                      value={countNotes}
                      onChange={(e) => setCountNotes(e.target.value)}
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingCount}
                    className="w-full h-13 bg-[#FF6B00] hover:bg-[#E8571A] text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {isSubmittingCount ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Salvando e Atualizando Referência...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>🎯 CONFIRMAR FECHAMENTO DE ESTOQUE</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          </div>

          {/* Right Panel: Instant Result & Divergence Analysis */}
          <div className="lg:col-span-5 space-y-4">
            {countResult ? (
              <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-[#111111] shadow-lg animate-scale-in space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-black uppercase text-gray-500 tracking-wider">
                    Resultado da Conferência
                  </span>
                  <span className="text-[10px] font-mono font-bold text-gray-400">
                    {formatDateToBR(new Date().toISOString())}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-[#2C2C2C]">{countResult.productName}</h3>

                  {/* Complete 8 Metric Summary Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Estoque Inicial</span>
                      <span className="font-extrabold text-gray-800">{countResult.initial} {countResult.unit}</span>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">Entradas (+)</span>
                      <span className="font-extrabold text-emerald-800">+{countResult.entries} {countResult.unit}</span>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">Para Produção (-)</span>
                      <span className="font-extrabold text-amber-900">-{countResult.production} {countResult.unit}</span>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-bold text-red-700 uppercase block">Descartado (-)</span>
                      <span className="font-extrabold text-red-800">-{countResult.waste} {countResult.unit}</span>
                    </div>

                    <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 col-span-1">
                      <span className="text-[10px] font-bold text-amber-900 uppercase block">Estoque Esperado</span>
                      <span className="font-black text-amber-900">{countResult.expected} {countResult.unit}</span>
                    </div>

                    <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200 col-span-1">
                      <span className="text-[10px] font-bold text-emerald-900 uppercase block">Físico Encontrado</span>
                      <span className="font-black text-emerald-900">{countResult.physical} {countResult.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Variance Highlight Box */}
                <div
                  className={`p-4 rounded-xl border ${
                    Math.abs(countResult.variance) < 0.001
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : countResult.variance < 0
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : 'bg-blue-50 border-blue-300 text-blue-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase">
                      Divergência Apurada:
                    </span>
                    <span className="text-sm font-black">
                      {countResult.variance > 0 ? '+' : ''}
                      {countResult.variance} {countResult.unit}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-black/10 flex items-center justify-between text-xs">
                    <span className="font-bold">Valor da Divergência:</span>
                    <strong className="text-base font-black">
                      R$ {countResult.value.toFixed(2)}
                    </strong>
                  </div>
                </div>

                {/* Neutral Non-Accusatory AI Guidance */}
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <div className="flex items-start space-x-2">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block mb-1">Orientação PadeIA™:</strong>
                      {Math.abs(countResult.variance) < 0.001 ? (
                        <span>O estoque físico bateu perfeitamente com a quantidade registrada no sistema. Parabéns pelo controle!</span>
                      ) : (
                        <span>
                          Foi identificada uma diferença de {countResult.variance} {countResult.unit} no estoque. Recomendamos verificar se houve registros pendentes de consumo interno, lote de produção, alteração na receita ou descartes não lançados.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs text-center space-y-3">
                <div className="w-12 h-12 bg-orange-50 text-[#FF6B00] rounded-full flex items-center justify-center mx-auto">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-[#2C2C2C]">Pronto para Conferir</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Ao preencher o formulário ao lado e confirmar, o sistema calculará automaticamente o desvio e atualizará o estoque com precisão.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LANÇAR MOVIMENTAÇÃO MANUAL */}
      {subTab === 'movement' && (
        <div className="max-w-2xl mx-auto bg-white p-5 sm:p-7 rounded-2xl border border-gray-200 shadow-xs space-y-5">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-extrabold text-[#2C2C2C] flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>Registrar Movimentação no Estoque</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Lance compras recebidas, uso na produção ou baixa por consumo interno.
            </p>
          </div>

          {movSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{movSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleConfirmMovement} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Produto / Ingrediente
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewItem(!isAddingNewItem)}
                  className="text-xs font-black text-[#FF6B00] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{isAddingNewItem ? 'Fechar cadastro' : '+ Cadastrar item no estoque'}</span>
                </button>
              </div>

              {isAddingNewItem ? (
                <div className="bg-orange-50/50 border border-orange-200 p-4 rounded-xl space-y-3 mb-4 animate-scale-in">
                  <h3 className="text-xs font-black uppercase text-gray-700">Novo Item do Estoque</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Nome do Item</label>
                      <input
                        type="text"
                        placeholder="Ex: Queijo muçarela, Presunto, Farinha..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#FF6B00]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Unidade</label>
                      <select
                        value={newItemUnit}
                        onChange={(e) => setNewItemUnit(e.target.value)}
                        className="w-full h-10 px-2 bg-white border border-gray-300 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        <option value="kg">kg (Quilograma)</option>
                        <option value="unidade">unidade (Unid)</option>
                        <option value="litro">litro (L)</option>
                        <option value="g">grama (g)</option>
                        <option value="embalagem">embalagem (Emb)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Qtd. Inicial em Estoque</label>
                      <input
                        type="text"
                        placeholder="Ex: 10.0"
                        value={newItemInitialQty}
                        onChange={(e) => setNewItemInitialQty(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#FF6B00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Custo Unitário (R$)</label>
                      <input
                        type="text"
                        placeholder="Ex: 24.50"
                        value={newItemCost}
                        onChange={(e) => setNewItemCost(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#FF6B00]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRegisterNewItem}
                    disabled={isSubmittingNewItem || !newItemName.trim()}
                    className="w-full h-10 bg-[#FF6B00] hover:bg-[#E8571A] text-white text-xs font-black uppercase rounded-lg shadow-sm cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isSubmittingNewItem ? 'Salvando...' : 'Salvar Item e Selecionar'}
                  </button>
                </div>
              ) : null}

              <select
                value={movProductId}
                onChange={(e) => setMovProductId(e.target.value)}
                className="w-full h-12 px-3.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-sm text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] cursor-pointer"
                required
              >
                <option value="">-- Selecione o produto --</option>
                <optgroup label="Itens Cadastrados no Estoque">
                  {inventoryItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.currentQuantity} {i.unit})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Produtos do Controle de Validade (Legado)">
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.quantidade} {p.unidade || (p.peso ? 'kg' : 'unidade')})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Tipo de Movimento
                </label>
                <select
                  value={movType}
                  onChange={(e) => setMovType(e.target.value as MovementType)}
                  className="w-full h-12 px-3 bg-gray-50 border border-gray-300 rounded-xl font-bold text-sm text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] cursor-pointer"
                >
                  <option value="ENTRY">➕ Entrada de Compra (+)</option>
                  <option value="INTERNAL_USE">🍞 Uso na Produção / Consumo (-)</option>
                  <option value="WASTE">🗑️ Baixa por Descarte (-)</option>
                  <option value="ADJUSTMENT">⚙️ Ajuste de Correção (+/-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Quantidade
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="Ex: 2.0"
                  value={movQuantity}
                  onChange={(e) => setMovQuantity(e.target.value)}
                  className="w-full h-12 px-3.5 bg-gray-50 border border-gray-300 rounded-xl font-extrabold text-sm text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Motivo / Justificativa
              </label>
              <input
                type="text"
                placeholder="Ex: Recebimento de fornecedor nota #1042..."
                value={movReason}
                onChange={(e) => setMovReason(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingMov || !movProductId}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
            >
              {isSubmittingMov ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>REGISTRAR MOVIMENTAÇÃO</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: HISTÓRICO DE DIVERGÊNCIAS */}
      {subTab === 'history' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#2C2C2C] flex items-center space-x-2">
                <History className="w-5 h-5 text-blue-600" />
                <span>Histórico Completo de Auditorias & Conferências</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Todas as contagens registradas e seus impactos em quantidade e valor.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <select
                value={historyPeriod}
                onChange={(e) => setHistoryPeriod(e.target.value as any)}
                className="h-9 px-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-[#2C2C2C] focus:outline-none"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="all">Todo o Histórico</option>
              </select>
            </div>
          </div>

          {/* Records Table / Mobile Cards */}
          {filteredHistory.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              Nenhuma conferência física registrada para o filtro selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-extrabold uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-3">Produto</th>
                    <th className="py-3 px-3 text-right">Inicial</th>
                    <th className="py-3 px-3 text-right">Entradas</th>
                    <th className="py-3 px-3 text-right">Produção</th>
                    <th className="py-3 px-3 text-right">Descarte</th>
                    <th className="py-3 px-3 text-right">Esperado</th>
                    <th className="py-3 px-3 text-right">Contado</th>
                    <th className="py-3 px-3 text-right">Divergência</th>
                    <th className="py-3 px-3 text-right">Valor (R$)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {filteredHistory.map((item) => {
                    const isZero = Math.abs(item.varianceQuantity) < 0.001;
                    const isNeg = item.varianceQuantity < 0;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                          {formatDateToBR(item.countedAt)}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#2C2C2C]">
                          {item.productName}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-gray-600">
                          {item.initialQuantity ?? 0} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-emerald-700">
                          +{item.entriesQuantity ?? 0} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-amber-800">
                          -{item.productionQuantity ?? 0} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-red-600">
                          -{item.wasteQuantity ?? 0} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-amber-900">
                          {item.expectedQuantity} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-emerald-700">
                          {item.physicalQuantity} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-black">
                          <span
                            className={
                              isZero
                                ? 'text-gray-500'
                                : isNeg
                                ? 'text-red-600'
                                : 'text-blue-600'
                            }
                          >
                            {item.varianceQuantity > 0 ? '+' : ''}
                            {item.varianceQuantity} {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-gray-900">
                          R$ {item.varianceValue.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isZero ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                              🟢 OK
                            </span>
                          ) : isNeg ? (
                            <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                              🔴 Faltou
                            </span>
                          ) : (
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                              🔵 Sobrou
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: DIVERGÊNCIAS REINCIDENTES */}
      {subTab === 'recurrent' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-extrabold text-[#2C2C2C] flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              <span>Análise de Reincidência de Divergências</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Produtos com 2 ou mais contagens divergentes. Identifique gargalos e ajuste fichas técnicas ou porcionamento.
            </p>
          </div>

          {recurrentDivergences.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              Nenhum produto com divergências repetidas identificado até o momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recurrentDivergences.map((item, idx) => (
                <div key={idx} className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-[#2C2C2C]">{item.productName}</h3>
                    <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {item.count} conferências c/ desvio
                    </span>
                  </div>

                  <div className="text-xs text-amber-900 font-semibold">
                    <span>Acumulado financeiro divergente: </span>
                    <strong className="text-red-700 font-black">R$ {item.totalValue.toFixed(2)}</strong>
                  </div>

                  <p className="text-[11px] text-gray-600 leading-normal pt-1 border-t border-amber-200/60">
                    💡 <strong>Insight PadeIA:</strong> Este produto apresentou divergência repetida em {item.count} conferências físicas. Verifique se o rendimento do lote ou receita está adequado.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
