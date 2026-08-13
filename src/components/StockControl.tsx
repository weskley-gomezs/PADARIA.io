import React, { useState, useMemo, useEffect } from 'react';
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
  Scale,
  Building2,
  ShieldCheck,
  Check,
  Plus
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { MovementType } from '../types';
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
    activeCompany,
    activeCode
  } = useData();

  // Sub-tab selection inside Stock Control
  // 'conference' = Conferência de Estoque (Default)
  // 'register'   = Cadastrar Produto no Estoque
  // 'movement'   = Lançar Movimentação Manual
  // 'history'    = Histórico de Divergências
  // 'recurrent'  = Itens Reincidentes
  const [subTab, setSubTab] = useState<'conference' | 'register' | 'movement' | 'history' | 'recurrent'>('conference');

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [historyPeriod, setHistoryPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  // ==========================================
  // 1. PRODUCT REGISTRATION FORM STATE
  // Exactly 4 fields requested: Nome, Valor (R$), Tipo de pesagem (Unidade), Estoque Inicial
  // ==========================================
  const [regName, setRegName] = useState<string>('');
  const [regCost, setRegCost] = useState<string>('');
  const [regUnit, setRegUnit] = useState<string>('kg');
  const [regInitialQty, setRegInitialQty] = useState<string>('');
  const [isSubmittingRegister, setIsSubmittingRegister] = useState<boolean>(false);
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState<string | null>(null);

  // Quick Inline Register Toggle inside Conference Form
  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState<boolean>(false);

  // Handle Product Registration
  const handleRegisterProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      alert('Por favor, informe o nome do produto.');
      return;
    }

    setIsSubmittingRegister(true);
    setRegisterSuccessMsg(null);

    try {
      const initialQty = parseFloat(regInitialQty.replace(',', '.')) || 0;
      const unitCost = parseFloat(regCost.replace(',', '.')) || 0;

      const created = await addInventoryItem(
        regName.trim(),
        regUnit,
        initialQty,
        unitCost
      );

      // Auto-select the newly created item for Conference & Movements
      setSelectedProductId(created.id);
      setMovProductId(created.id);

      setRegisterSuccessMsg(`Produto "${created.name}" cadastrado com sucesso com ${initialQty} ${regUnit} em estoque!`);

      // Clear register form
      setRegName('');
      setRegCost('');
      setRegInitialQty('');
      setIsQuickRegisterOpen(false);

      // Redirect to conference if registered from the register tab
      if (subTab === 'register') {
        setTimeout(() => {
          setSubTab('conference');
        }, 1200);
      }
    } catch (err: any) {
      alert('Erro ao cadastrar produto: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsSubmittingRegister(false);
    }
  };

  // ==========================================
  // 2. STOCK CONFERENCE FORM STATE
  // Pulls registered product, gets Initial, Production, Waste, Entries, and asks "Quanto foi achado no final do dia"
  // ==========================================
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [inputInitial, setInputInitial] = useState<string>('');
  const [inputProduction, setInputProduction] = useState<string>('0');
  const [inputWaste, setInputWaste] = useState<string>('0');
  const [inputEntries, setInputEntries] = useState<string>('0');
  const [foundInput, setFoundInput] = useState<string>('');
  const [countNotes, setCountNotes] = useState<string>('');
  const [isSubmittingCount, setIsSubmittingCount] = useState<boolean>(false);

  // Result card after saving conference
  const [countResult, setCountResult] = useState<{
    productName: string;
    initial: number;
    production: number;
    waste: number;
    entries: number;
    expected: number;
    found: number;
    variance: number;
    value: number;
    unit: string;
  } | null>(null);

  // Auto-fill initial stock reference when selected product changes
  useEffect(() => {
    if (!selectedProductId) {
      setInputInitial('');
      setInputProduction('0');
      setInputWaste('0');
      setInputEntries('0');
      setFoundInput('');
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

    setInputProduction('0');
    setInputWaste('0');
    setInputEntries('0');
    setFoundInput('');
    setCountResult(null);
  }, [selectedProductId, inventoryItems, products]);

  // Selected item info helper
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    const item = inventoryItems.find((i) => i.id === selectedProductId);
    if (item) {
      return {
        id: item.id,
        nome: item.name,
        unidade: item.unit || 'kg',
        valorKg: item.unitCost || 0,
        quantidade: item.currentQuantity,
        type: 'inventory'
      };
    }
    const prod = products.find((p) => p.id === selectedProductId);
    if (prod) {
      return {
        id: prod.id,
        nome: prod.nome,
        unidade: prod.unidade || (prod.peso ? 'kg' : 'unidade'),
        valorKg: prod.valorKg || (prod.valorTotal && prod.quantidade ? prod.valorTotal / prod.quantidade : 0) || 0,
        quantidade: prod.quantidade,
        type: 'product'
      };
    }
    return null;
  }, [selectedProductId, inventoryItems, products]);

  // Live Formula Calculations: (Inicial - Produção - Descarte + Entradas = Esperado)
  const numInitial = useMemo(() => parseFloat(inputInitial.replace(',', '.')) || 0, [inputInitial]);
  const numProduction = useMemo(() => parseFloat(inputProduction.replace(',', '.')) || 0, [inputProduction]);
  const numWaste = useMemo(() => parseFloat(inputWaste.replace(',', '.')) || 0, [inputWaste]);
  const numEntries = useMemo(() => parseFloat(inputEntries.replace(',', '.')) || 0, [inputEntries]);

  const liveExpected = useMemo(() => {
    return Number((numInitial - numProduction - numWaste + numEntries).toFixed(3));
  }, [numInitial, numProduction, numWaste, numEntries]);

  // Physical Found input parse and live variance
  const numFound = useMemo(() => parseFloat(foundInput.replace(',', '.')), [foundInput]);
  const liveVariance = useMemo(() => {
    if (isNaN(numFound)) return 0;
    return Number((numFound - liveExpected).toFixed(3));
  }, [numFound, liveExpected]);

  const liveVarianceValue = useMemo(() => {
    const cost = selectedProduct?.valorKg || 0;
    return Number((Math.abs(liveVariance) * cost).toFixed(2));
  }, [liveVariance, selectedProduct]);

  // Handle Submit Conference (Saves Encontrado as new Inicial for next day)
  const handleConfirmStockCount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedProduct) {
      alert('Selecione um produto para conferir.');
      return;
    }

    if (isNaN(numFound) || numFound < 0) {
      alert('Informe a quantidade física encontrada no final do dia.');
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
        numFound,
        selectedProduct.unidade,
        selectedProduct.valorKg,
        countNotes
      );

      setCountResult({
        productName: selectedProduct.nome,
        initial: numInitial,
        production: numProduction,
        waste: numWaste,
        entries: numEntries,
        expected: liveExpected,
        found: numFound,
        variance: result.varianceQuantity,
        value: result.varianceValue,
        unit: selectedProduct.unidade
      });

      // Reset movement breakdown inputs for next item
      setInputProduction('0');
      setInputWaste('0');
      setInputEntries('0');
      setFoundInput('');
      setCountNotes('');
    } catch (err: any) {
      alert('Erro ao registrar conferência física: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsSubmittingCount(false);
    }
  };

  // ==========================================
  // 3. MANUAL MOVEMENT FORM STATE
  // ==========================================
  const [movProductId, setMovProductId] = useState<string>('');
  const [movType, setMovType] = useState<MovementType>('ENTRY');
  const [movQuantity, setMovQuantity] = useState<string>('');
  const [movCost, setMovCost] = useState<string>('');
  const [movReason, setMovReason] = useState<string>('');
  const [isSubmittingMov, setIsSubmittingMov] = useState<boolean>(false);
  const [movSuccessMsg, setMovSuccessMsg] = useState<string | null>(null);

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
            valorKg: item.unitCost
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
        targetProd.unidade || 'kg',
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

  // Overall statistics for Top Metrics
  const stats = useMemo(() => {
    const totalPhysicalItems = inventoryItems.reduce((acc, i) => acc + (i.currentQuantity || 0), 0) +
                               products.reduce((acc, p) => acc + (p.quantidade || 0), 0);
    
    const now = new Date();
    const periodDays = historyPeriod === '7d' ? 7 : historyPeriod === '30d' ? 30 : 3650;
    const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const periodCounts = stockCounts.filter((c) => new Date(c.countedAt) >= cutoffDate);
    const totalDivergenceValue = periodCounts.reduce((acc, c) => acc + (c.varianceValue || 0), 0);
    const divergentCounts = periodCounts.filter((c) => Math.abs(c.varianceQuantity) > 0.001);
    
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

  // Recurrent Divergences
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

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 animate-fade-in">
      {/* Top Banner Header with App Mobile Badging */}
      <div className="bg-gradient-to-r from-[#111111] via-[#1E1E1E] to-[#2C2C2C] text-white p-4 sm:p-6 rounded-2xl shadow-md border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#FF6B00] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                Controle de Estoque
              </span>
              <div className="flex items-center space-x-1 text-xs text-amber-300 font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded-md">
                <Building2 className="w-3.5 h-3.5" />
                <span>Tenant: {activeCompany?.empresa || 'Minha Padaria'} ({activeCode || 'GERAL'})</span>
              </div>
            </div>

            <h1 className="text-lg sm:text-2xl font-black mt-2 flex items-center gap-2">
              <Boxes className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF6B00]" />
              <span>Gestão de Estoque & Conferência Diária</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
              Fórmula de fechamento: <strong className="text-amber-300">(Inicial - Produção - Descarte + Entradas = Esperado)</strong>.
              O estoque <strong className="text-emerald-300 font-bold">Encontrado</strong> é gravado como o <strong className="text-emerald-300 font-bold">Inicial</strong> para o dia seguinte sem duplicação.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10 self-start md:self-auto">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-gray-300 block">Sincronização Firestore</span>
              <span className="text-xs font-black text-emerald-300">Totalmente Ativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-wide">
              Valor Divergente
            </span>
            <div className="p-1.5 sm:p-2 bg-red-50 text-red-600 rounded-lg sm:rounded-xl">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-2xl font-black text-[#2C2C2C] block">
              R$ {stats.totalDivergenceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-500 block font-medium">
              acumulado no período
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-wide">
              Divergências
            </span>
            <div className="p-1.5 sm:p-2 bg-amber-50 text-amber-600 rounded-lg sm:rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-2xl font-black text-[#2C2C2C] block">
              {stats.divergentCountCount} <span className="text-xs text-gray-500 font-normal">itens</span>
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-500 block font-medium">
              com desvio
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-wide">
              Cadastrados
            </span>
            <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-2xl font-black text-[#2C2C2C] block">
              {inventoryItems.length} <span className="text-xs text-gray-500 font-normal">produtos</span>
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-500 block font-medium">
              no estoque ativo
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-wide">
              Maior Perda
            </span>
            <div className="p-1.5 sm:p-2 bg-orange-50 text-[#FF6B00] rounded-lg sm:rounded-xl">
              <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2">
            {stats.maxDivergentItem ? (
              <>
                <span className="text-xs sm:text-sm font-black text-red-600 truncate block">
                  {stats.maxDivergentItem.name}
                </span>
                <span className="text-[10px] text-gray-600 font-bold block">
                  {stats.maxDivergentItem.qty} {stats.maxDivergentItem.unit} (R$ {stats.maxDivergentItem.val.toFixed(2)})
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400 font-semibold block">Sem perdas relevantes</span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Touch-App Sub-Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs flex items-center overflow-x-auto gap-1 scrollbar-none">
        <button
          onClick={() => setSubTab('conference')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap cursor-pointer min-h-[44px] flex-1 justify-center ${
            subTab === 'conference'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-[#FF6B00]" />
          <span>Conferência de Estoque</span>
        </button>

        <button
          onClick={() => setSubTab('register')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap cursor-pointer min-h-[44px] flex-1 justify-center ${
            subTab === 'register'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-emerald-500" />
          <span>Cadastrar Produto</span>
        </button>

        <button
          onClick={() => setSubTab('movement')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap cursor-pointer min-h-[44px] flex-1 justify-center ${
            subTab === 'movement'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-500" />
          <span>Movimentação</span>
        </button>

        <button
          onClick={() => setSubTab('history')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap cursor-pointer min-h-[44px] flex-1 justify-center ${
            subTab === 'history'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <History className="w-4 h-4 text-amber-500" />
          <span>Histórico</span>
        </button>

        <button
          onClick={() => setSubTab('recurrent')}
          className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap cursor-pointer min-h-[44px] flex-1 justify-center relative ${
            subTab === 'recurrent'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-red-500" />
          <span>Reincidentes</span>
          {recurrentDivergences.length > 0 && (
            <span className="ml-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {recurrentDivergences.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: CONFERÊNCIA DE ESTOQUE (MAIN VIEW)                            */}
      {/* ========================================================================= */}
      {subTab === 'conference' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Left Panel: Selection and Conference Input */}
          <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 sm:space-y-5">
            <div className="border-b border-gray-100 pb-3 sm:pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#2C2C2C] flex items-center space-x-2">
                  <ClipboardCheck className="w-5 h-5 text-[#FF6B00]" />
                  <span>Conferência de Estoque Diária</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Puxe o produto cadastrado e informe quanto encontrou no final do dia.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSubTab('register')}
                className="hidden sm:flex items-center space-x-1 text-xs font-black text-[#FF6B00] hover:underline cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Produto</span>
              </button>
            </div>

            <form onSubmit={handleConfirmStockCount} className="space-y-4">
              {/* Product Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                    1. Selecione o Produto Cadastrado
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsQuickRegisterOpen(!isQuickRegisterOpen)}
                    className="text-xs font-black text-[#FF6B00] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isQuickRegisterOpen ? 'Fechar Cadastro Rápido' : '+ Cadastrar Novo Produto'}</span>
                  </button>
                </div>

                {/* Quick Register Inline Panel */}
                {isQuickRegisterOpen && (
                  <div className="bg-orange-50/70 border border-orange-200 p-4 rounded-xl space-y-3 mb-4 animate-scale-in">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase text-gray-800">
                        Cadastro Rápido de Produto
                      </h3>
                      <span className="text-[10px] text-gray-500 font-bold uppercase bg-white px-2 py-0.5 rounded border border-orange-200">
                        Tenant {activeCode}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-700 uppercase mb-1">
                          Nome do Produto *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Queijo Muçarela, Farinha de Trigo, Leite..."
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full h-11 px-3 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#FF6B00]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-700 uppercase mb-1">
                          Tipo de Pesagem / Unidade *
                        </label>
                        <select
                          value={regUnit}
                          onChange={(e) => setRegUnit(e.target.value)}
                          className="w-full h-11 px-3 bg-white border border-gray-300 rounded-xl text-xs font-extrabold text-gray-900 focus:ring-2 focus:ring-[#FF6B00] cursor-pointer"
                        >
                          <option value="kg">kg (Quilograma)</option>
                          <option value="l">l (Litro)</option>
                          <option value="ml">ml (Mililitro)</option>
                          <option value="g">g (Grama)</option>
                          <option value="unidade">unidade (Unid)</option>
                          <option value="embalagem">embalagem (Emb)</option>
                          <option value="caixa">caixa (Cx)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-700 uppercase mb-1">
                          Valor R$ (Custo Unitário) *
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Ex: 28.50"
                          value={regCost}
                          onChange={(e) => setRegCost(e.target.value)}
                          className="w-full h-11 px-3 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#FF6B00]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-700 uppercase mb-1">
                          Estoque Inicial *
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Ex: 10.5"
                          value={regInitialQty}
                          onChange={(e) => setRegInitialQty(e.target.value)}
                          className="w-full h-11 px-3 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#FF6B00]"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRegisterProduct}
                      disabled={isSubmittingRegister || !regName.trim()}
                      className="w-full h-11 bg-[#FF6B00] hover:bg-[#E8571A] text-white text-xs font-black uppercase rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isSubmittingRegister ? (
                        <span>Cadastrando...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Salvar Produto e Iniciar Conferência</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Main Product Select Dropdown */}
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full h-13 px-3.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-sm text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] cursor-pointer"
                  required
                >
                  <option value="">-- Clique para puxar o produto cadastrado --</option>
                  <optgroup label="Produtos Cadastrados no Estoque">
                    {inventoryItems.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} — Atual: {i.currentQuantity} {i.unit} (R$ {i.unitCost.toFixed(2)}/{i.unit})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Outros Produtos / Validade">
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — Atual: {p.quantidade} {p.unidade || 'unidade'}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Formula & Daily Inputs Panel */}
              {selectedProduct && (
                <>
                  <div className="bg-gray-50 p-3.5 sm:p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wide">
                        2. Movimentação Diária do Produto ({selectedProduct.unidade})
                      </span>
                      <span className="text-[10px] font-bold text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-300">
                        Custo: R$ {selectedProduct.valorKg.toFixed(2)} / {selectedProduct.unidade}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                      {/* Inicial */}
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-700 uppercase mb-1">
                          1. Inicial
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={inputInitial}
                          onChange={(e) => setInputInitial(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-black text-gray-900 focus:ring-1 focus:ring-[#FF6B00]"
                        />
                      </div>

                      {/* Produção */}
                      <div>
                        <label className="block text-[10px] font-extrabold text-amber-800 uppercase mb-1">
                          2. Produção (-)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={inputProduction}
                          onChange={(e) => setInputProduction(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-black text-amber-900 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Descarte */}
                      <div>
                        <label className="block text-[10px] font-extrabold text-red-700 uppercase mb-1">
                          3. Descarte (-)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={inputWaste}
                          onChange={(e) => setInputWaste(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-black text-red-800 focus:ring-1 focus:ring-red-500"
                        />
                      </div>

                      {/* Entradas */}
                      <div>
                        <label className="block text-[10px] font-extrabold text-emerald-700 uppercase mb-1">
                          4. Entradas (+)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={inputEntries}
                          onChange={(e) => setInputEntries(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-xs font-black text-emerald-800 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Formula Calculated Box */}
                  <div className="bg-amber-50/90 border border-amber-300 p-3.5 sm:p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-amber-950 uppercase block">
                        = ESTOQUE ESPERADO PELO SISTEMA
                      </span>
                      <span className="text-[11px] text-amber-900 font-medium mt-0.5 block">
                        Calculado: ({numInitial} Inicial - {numProduction} Prod - {numWaste} Desc + {numEntries} Entr)
                      </span>
                    </div>
                    <span className="text-lg sm:text-xl font-black text-[#FF6B00] bg-white px-3 py-1.5 rounded-lg border border-amber-300 shadow-2xs">
                      {liveExpected} {selectedProduct.unidade}
                    </span>
                  </div>

                  {/* Main Input: Quanto foi achado no final do dia */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-[#111111] uppercase tracking-wider">
                      3. QUANTO FOI ACHADO NO FINAL DO DIA? (Contagem Real na Balança)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        inputMode="decimal"
                        placeholder="Ex: 8.5"
                        value={foundInput}
                        onChange={(e) => setFoundInput(e.target.value)}
                        className="w-full h-14 pl-4 pr-20 bg-white border-2 border-[#111111] rounded-xl font-black text-xl text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black uppercase text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-300">
                        {selectedProduct.unidade}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1 font-medium">
                      💡 Este valor <strong className="text-emerald-700 font-bold">"Achado"</strong> será gravado como o <strong className="text-emerald-700 font-bold">"Inicial"</strong> para o dia seguinte, sem duplicar o estoque.
                    </p>
                  </div>

                  {/* Live Variance Analysis Box */}
                  {!isNaN(numFound) && (
                    <div
                      className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between transition-all ${
                        Math.abs(liveVariance) < 0.001
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : liveVariance < 0
                          ? 'bg-red-50 border-red-300 text-red-900'
                          : 'bg-blue-50 border-blue-300 text-blue-900'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-black uppercase block">Divergência Estimada:</span>
                        <span className="text-sm font-black">
                          {liveVariance > 0 ? '+' : ''}
                          {liveVariance} {selectedProduct.unidade}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold block">Impacto Financeiro:</span>
                        <strong className="text-base font-black">
                          R$ {liveVarianceValue.toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Count Notes */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Observações da Conferência (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Turno da noite, conferido na balança digital..."
                      value={countNotes}
                      onChange={(e) => setCountNotes(e.target.value)}
                      className="w-full h-11 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingCount}
                    className="w-full h-14 bg-[#FF6B00] hover:bg-[#E8571A] text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {isSubmittingCount ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Salvando no Firestore e Atualizando Inicial do Dia Seguinte...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>SALVAR E GRAVAR ACHADO COMO NOVO INICIAL</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          </div>

          {/* Right Panel: Result Summary Card & Quick History */}
          <div className="lg:col-span-5 space-y-4">
            {countResult ? (
              <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-[#111111] shadow-lg animate-scale-in space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-black uppercase text-gray-500 tracking-wider">
                    ✅ Conferência Salva com Sucesso
                  </span>
                  <span className="text-[10px] font-mono font-bold text-gray-400">
                    {formatDateToBR(new Date().toISOString())}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-[#2C2C2C]">{countResult.productName}</h3>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Inicial</span>
                      <span className="font-extrabold text-gray-800">{countResult.initial} {countResult.unit}</span>
                    </div>

                    <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">Produção (-)</span>
                      <span className="font-extrabold text-amber-900">-{countResult.production} {countResult.unit}</span>
                    </div>

                    <div className="bg-red-50 p-2.5 rounded-lg border border-red-200">
                      <span className="text-[10px] font-bold text-red-700 uppercase block">Descarte (-)</span>
                      <span className="font-extrabold text-red-800">-{countResult.waste} {countResult.unit}</span>
                    </div>

                    <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">Entradas (+)</span>
                      <span className="font-extrabold text-emerald-800">+{countResult.entries} {countResult.unit}</span>
                    </div>

                    <div className="bg-amber-100/60 p-2.5 rounded-lg border border-amber-300 col-span-1">
                      <span className="text-[10px] font-bold text-amber-900 uppercase block">Esperado</span>
                      <span className="font-black text-amber-950">{countResult.expected} {countResult.unit}</span>
                    </div>

                    <div className="bg-emerald-100/60 p-2.5 rounded-lg border border-emerald-300 col-span-1">
                      <span className="text-[10px] font-bold text-emerald-900 uppercase block">Achado (Novo Inicial)</span>
                      <span className="font-black text-emerald-950">{countResult.found} {countResult.unit}</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-xl border ${
                    Math.abs(countResult.variance) < 0.001
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : countResult.variance < 0
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : 'bg-blue-50 border-blue-300 text-blue-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase">Divergência:</span>
                    <span className="text-sm font-black">
                      {countResult.variance > 0 ? '+' : ''}
                      {countResult.variance} {countResult.unit}
                    </span>
                  </div>
                  <div className="mt-1 pt-1 border-t border-black/10 flex items-center justify-between text-xs">
                    <span className="font-bold">Impacto R$:</span>
                    <strong className="text-base font-black">
                      R$ {countResult.value.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    O estoque de <strong>"{countResult.productName}"</strong> foi atualizado para <strong>{countResult.found} {countResult.unit}</strong> no tenant <strong>{activeCode}</strong>.
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs text-center space-y-3">
                <div className="w-12 h-12 bg-orange-50 text-[#FF6B00] rounded-full flex items-center justify-center mx-auto">
                  <Boxes className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-[#2C2C2C]">Pronto para Conferir</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Escolha um produto cadastrado no menu ao lado para puxar seu estoque inicial e registrar a contagem final do dia.
                </p>
              </div>
            )}

            {/* Quick History List for Current Tenant */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-black text-[#2C2C2C] uppercase tracking-wider flex items-center space-x-1.5">
                  <History className="w-4 h-4 text-[#FF6B00]" />
                  <span>Últimas Conferências ({activeCode})</span>
                </h3>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {stockCounts.length}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {stockCounts.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-xs font-medium">
                    Nenhuma conferência realizada neste tenant ainda.
                  </div>
                ) : (
                  stockCounts.slice(0, 10).map((count) => (
                    <div
                      key={count.id}
                      className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-[#2C2C2C]">
                        <span className="truncate max-w-[160px]">{count.productName}</span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {formatDateToBR(count.countedAt)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-600 bg-white p-1.5 rounded border border-gray-200 font-mono">
                        <div><span className="text-gray-400">Esp:</span> {count.expectedQuantity} {count.unit}</div>
                        <div><span className="text-gray-400">Achado:</span> {count.physicalQuantity} {count.unit}</div>
                        <div className={count.varianceQuantity !== 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                          {count.varianceQuantity > 0 ? '+' : ''}{count.varianceQuantity}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: CADASTRO DEDICADO DE PRODUTO                                  */}
      {/* Exactly requested: Nome, Valor, Tipo de pesagem, Estoque Inicial         */}
      {/* ========================================================================= */}
      {subTab === 'register' && (
        <div className="max-w-2xl mx-auto bg-white p-5 sm:p-7 rounded-2xl border border-gray-200 shadow-xs space-y-5 animate-scale-in">
          <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-[#2C2C2C] flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <span>Cadastrar Novo Produto no Estoque</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Preencha os 4 dados básicos do produto para habilitar a conferência diária.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Tenant: {activeCode}
            </span>
          </div>

          {registerSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{registerSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegisterProduct} className="space-y-4">
            {/* Campo 1: Nome do Produto */}
            <div>
              <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                1. Nome do Produto *
              </label>
              <input
                type="text"
                placeholder="Ex: Farinha de Trigo Tipo 1, Queijo Muçarela, Leite Integral..."
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full h-13 px-4 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Campo 2: Valor R$ */}
              <div>
                <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                  2. Valor R$ (Custo Unitário)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="25.00"
                    value={regCost}
                    onChange={(e) => setRegCost(e.target.value)}
                    className="w-full h-12 pl-10 pr-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-extrabold text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>
              </div>

              {/* Campo 3: Tipo de Pesagem / Unidade */}
              <div>
                <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                  3. Tipo de Pesagem / Unidade
                </label>
                <select
                  value={regUnit}
                  onChange={(e) => setRegUnit(e.target.value)}
                  className="w-full h-12 px-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] cursor-pointer"
                >
                  <option value="kg">kg (Quilograma)</option>
                  <option value="l">l (Litro)</option>
                  <option value="ml">ml (Mililitro)</option>
                  <option value="g">g (Grama)</option>
                  <option value="unidade">unidade (Unid)</option>
                  <option value="embalagem">embalagem (Emb)</option>
                  <option value="caixa">caixa (Cx)</option>
                </select>
              </div>

              {/* Campo 4: Quanto tem em Estoque Inicial */}
              <div>
                <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                  4. Estoque Inicial
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 10.0"
                  value={regInitialQty}
                  onChange={(e) => setRegInitialQty(e.target.value)}
                  className="w-full h-12 px-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-extrabold text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingRegister || !regName.trim()}
                className="w-full h-14 bg-[#FF6B00] hover:bg-[#E8571A] text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
              >
                {isSubmittingRegister ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Salvando Produto...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>CADASTRAR PRODUTO E IR PARA CONFERÊNCIA</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: LANÇAR MOVIMENTAÇÃO MANUAL                                     */}
      {/* ========================================================================= */}
      {subTab === 'movement' && (
        <div className="max-w-2xl mx-auto bg-white p-5 sm:p-7 rounded-2xl border border-gray-200 shadow-xs space-y-5">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-extrabold text-[#2C2C2C] flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Registrar Movimentação de Estoque</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Lance entradas de notas, baixas por consumo interno ou descartes pontuais.
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Produto Cadastrado
              </label>
              <select
                value={movProductId}
                onChange={(e) => setMovProductId(e.target.value)}
                className="w-full h-12 px-3.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-sm text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] cursor-pointer"
                required
              >
                <option value="">-- Selecione o produto --</option>
                <optgroup label="Itens no Estoque">
                  {inventoryItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.currentQuantity} {i.unit})
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
                  inputMode="decimal"
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
                placeholder="Ex: Compra NF-10293, Receita de Pão Francês..."
                value={movReason}
                onChange={(e) => setMovReason(e.target.value)}
                className="w-full h-11 px-3.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingMov}
              className="w-full h-13 bg-[#111111] hover:bg-black text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              {isSubmittingMov ? (
                <span>Gravando Movimentação...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>REGISTRAR MOVIMENTAÇÃO</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: HISTÓRICO DE DIVERGÊNCIAS E AUDITORIA                          */}
      {/* ========================================================================= */}
      {subTab === 'history' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#2C2C2C] flex items-center space-x-2">
                <History className="w-5 h-5 text-amber-500" />
                <span>Histórico de Auditorias e Conferências</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Registros gravados no Firestore para o tenant {activeCode}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={historyPeriod}
                onChange={(e) => setHistoryPeriod(e.target.value as any)}
                className="h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 cursor-pointer"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="all">Todo o Histórico</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome do produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            />
          </div>

          <div className="space-y-2">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <span className="text-xs font-bold text-gray-500 block">Nenhuma conferência encontrada.</span>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-gray-50 hover:bg-gray-100/70 rounded-xl border border-gray-200 transition-all space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-extrabold text-sm text-[#2C2C2C]">
                      {item.productName}
                    </span>
                    <span className="text-xs font-mono text-gray-500 font-medium">
                      {formatDateToBR(item.countedAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono bg-white p-2.5 rounded-lg border border-gray-200">
                    <div><span className="text-gray-400 block text-[9px] uppercase">Inicial</span> {item.initialQuantity} {item.unit}</div>
                    <div><span className="text-gray-400 block text-[9px] uppercase">Esperado</span> {item.expectedQuantity} {item.unit}</div>
                    <div><span className="text-gray-400 block text-[9px] uppercase">Achado</span> {item.physicalQuantity} {item.unit}</div>
                    <div className={item.varianceQuantity !== 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                      <span className="text-gray-400 block text-[9px] uppercase font-normal">Divergência</span>
                      {item.varianceQuantity > 0 ? '+' : ''}{item.varianceQuantity} {item.unit}
                    </div>
                    <div className="font-black text-[#2C2C2C]">
                      <span className="text-gray-400 block text-[9px] uppercase font-normal">Valor Desvio</span>
                      R$ {item.varianceValue.toFixed(2)}
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-gray-500 italic">
                      Obs: {item.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: ITENS REINCIDENTES COM PERDAS SEGUIDAS                        */}
      {/* ========================================================================= */}
      {subTab === 'recurrent' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-extrabold text-[#2C2C2C] flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-red-500" />
              <span>Itens com Divergências Reincidentes</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Produtos que apresentaram desvio em 2 ou mais conferências.
            </p>
          </div>

          <div className="space-y-3">
            {recurrentDivergences.length === 0 ? (
              <div className="text-center py-10 bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <span className="text-xs font-black text-emerald-900 block">Nenhum produto reincidente com perdas recorrentes!</span>
                <span className="text-[11px] text-emerald-700 mt-0.5 block">Seu controle de estoque está com alta precisão.</span>
              </div>
            ) : (
              recurrentDivergences.map((rec) => (
                <div key={rec.productName} className="p-4 bg-red-50/60 border border-red-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-red-950">{rec.productName}</h3>
                    <span className="bg-red-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                      {rec.count} conferências com desvio
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-red-900 font-bold bg-white p-2.5 rounded-lg border border-red-200">
                    <span>Acumulado das perdas em R$:</span>
                    <strong className="text-sm font-black text-red-600">
                      R$ {rec.totalValue.toFixed(2)}
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
