import React, { useState, useEffect } from 'react';
import {
  Moon,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Share2,
  Calendar,
  Sparkles,
  Clock,
  Save,
  Package,
  BarChart2,
  Lock,
  Edit2,
  Trash2,
  ShoppingBag,
  Heart,
  ArrowRightLeft,
  Check,
  RefreshCw,
  Info
} from 'lucide-react';
import { BakeryCompany, Product, DailyClosing, ClosingItem } from '../types';
import { StorageService } from '../services/storageService';
import { formatDateToBR, formatDateToISO } from '../utils/dateUtils';

interface FechamentoInteligenteProps {
  company: BakeryCompany;
  products: Product[];
  onOpenReport?: () => void;
}

export const FechamentoInteligente: React.FC<FechamentoInteligenteProps> = ({
  company,
  products,
  onOpenReport,
}) => {
  const todayISO = formatDateToISO(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [operatorName, setOperatorName] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [targetMaxLoss, setTargetMaxLoss] = useState<number>(50.0);

  const [closingsHistory, setClosingsHistory] = useState<DailyClosing[]>([]);
  const [allItems, setAllItems] = useState<ClosingItem[]>([]);
  const [processedItemIds, setProcessedItemIds] = useState<Set<string>>(new Set());

  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'summary' | 'padeia' | 'history'>('audit');
  const [subFilter, setSubFilter] = useState<'pending' | 'processed'>('pending');
  const [editingClosingId, setEditingClosingId] = useState<string | null>(null);

  // Load history from StorageService
  useEffect(() => {
    const unsub = StorageService.subscribeDailyClosings((data) => {
      setClosingsHistory(data);
    }, company.codigoAtivacao);

    return () => unsub();
  }, [company.codigoAtivacao]);

  // Check if item is expired (dataValidade < selectedDate or today)
  const isItemExpired = (itemValidade: string) => {
    if (!itemValidade) return false;
    const itemDate = new Date(itemValidade + 'T23:59:59');
    const targetDate = new Date(selectedDate + 'T00:00:00');
    return itemDate < targetDate;
  };

  // Sync products for selected closing date
  useEffect(() => {
    const existingClosing = closingsHistory.find((c) => c.dataFechamento === selectedDate);
    if (existingClosing) {
      setAllItems(existingClosing.itens || []);
      setOperatorName(existingClosing.responsavel || '');
      setGeneralNotes(existingClosing.observacoes || '');
      setIsSaved(existingClosing.status === 'concluido');
      // All items in existing closing are considered processed
      const ids = new Set((existingClosing.itens || []).map((i) => i.productId));
      setProcessedItemIds(ids);
    } else {
      // Auto-generate candidate items for closing from products expiring or registered
      const candidateProducts = products.filter((p) => {
        if (!p.dataValidade) return true;
        // Include products expiring up to today or near
        return p.diasParaVencer <= 3 || p.dataValidade <= selectedDate;
      });

      const items: ClosingItem[] = candidateProducts.map((p) => {
        const valUnit = p.valorKg && p.valorKg > 0 ? p.valorKg : 12.0;
        const totalVal = p.valorTotal && p.valorTotal > 0 ? p.valorTotal : p.quantidade * valUnit;
        const expired = isItemExpired(p.dataValidade);

        return {
          productId: p.id,
          nomeProduto: p.nome,
          categoria: p.categoria || 'Geral',
          quantidade: p.quantidade,
          dataValidade: p.dataValidade,
          valorEstimado: totalVal,
          // Business Rule 1 & 2: If expired, automatically set to descarte
          acaoTomada: expired ? 'descarte' : 'vendido',
          isVencido: expired,
          observacoes: expired
            ? 'Vencido. Conforme boas práticas sanitárias, descarte obrigatório.'
            : 'Soberana de balcão.',
        };
      });

      setAllItems(items);
      setProcessedItemIds(new Set());
      setIsSaved(false);
    }
  }, [selectedDate, products, closingsHistory]);

  // Action Handlers
  const handleConfirmItemAction = (
    productId: string,
    action: 'vendido' | 'descarte' | 'transferido' | 'doacao',
    note?: string
  ) => {
    setAllItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const expired = isItemExpired(item.dataValidade);
          // Force descarte if expired
          const finalAction = expired ? 'descarte' : action;
          let defaultNote = note || item.observacoes;
          if (expired) {
            defaultNote = 'Descarte sanitário obrigatório por validade expirada.';
          } else if (action === 'vendido') {
            defaultNote = 'Vendido no balcão ao final do expediente.';
          } else if (action === 'transferido') {
            defaultNote = 'Transferido para outro setor de produção/armazenamento.';
          } else if (action === 'doacao') {
            defaultNote = 'Encaminhado para doação com validade em dia.';
          } else if (action === 'descarte') {
            defaultNote = 'Descarte preventivo de balcão.';
          }

          return {
            ...item,
            acaoTomada: finalAction,
            isVencido: expired,
            observacoes: defaultNote,
          };
        }
        return item;
      })
    );

    // Business Rule 4: Mark item as processed so it moves out of pending
    setProcessedItemIds((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
  };

  const handleReturnToPending = (productId: string) => {
    setProcessedItemIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  // Filter pending vs processed
  const pendingItems = allItems.filter((i) => !processedItemIds.has(i.productId));
  const processedItems = allItems.filter((i) => processedItemIds.has(i.productId));

  // Financial Calculations - Automatically updated as soon as actions or items are updated
  const totalAudited = allItems.length;
  const processedCount = processedItems.length;

  const totalPerdaReais = allItems
    .filter((i) => i.acaoTomada === 'descarte')
    .reduce((acc, i) => acc + i.valorEstimado, 0);

  const totalVendidoReais = allItems
    .filter((i) => i.acaoTomada === 'vendido')
    .reduce((acc, i) => acc + i.valorEstimado, 0);

  const totalDoadoReais = allItems
    .filter((i) => i.acaoTomada === 'doacao')
    .reduce((acc, i) => acc + i.valorEstimado, 0);

  const totalTransferidoReais = allItems
    .filter((i) => i.acaoTomada === 'transferido')
    .reduce((acc, i) => acc + i.valorEstimado, 0);

  const totalEstimadoProcessado = allItems.reduce((acc, i) => acc + i.valorEstimado, 0);
  const efficiencyPercentage =
    totalEstimadoProcessado > 0
      ? Math.round(((totalEstimadoProcessado - totalPerdaReais) / totalEstimadoProcessado) * 100)
      : 100;

  // Save closing to Firebase / Local Storage
  const handleSaveClosing = async () => {
    try {
      const payload = {
        bakeryCode: company.codigoAtivacao,
        dataFechamento: selectedDate,
        status: 'concluido' as const,
        totalItensAuditados: totalAudited,
        totalPerdaReais: totalPerdaReais,
        totalReaproveitadoReais: totalVendidoReais + totalDoadoReais + totalTransferidoReais,
        taxaAproveitamento: efficiencyPercentage,
        observacoes: generalNotes,
        responsavel: operatorName || 'Operador Responsável',
        itens: allItems,
      };

      await StorageService.saveDailyClosing(payload);
      setIsSaved(true);
      setEditingClosingId(null);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar fechamento:', err);
    }
  };

  // Check if closing can be edited (within 24 hours)
  const isWithin24Hours = (closing: DailyClosing) => {
    const closingTime = new Date(closing.createdAt || `${closing.dataFechamento}T20:00:00`).getTime();
    const currentTime = new Date().getTime();
    const diffHours = (currentTime - closingTime) / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  const handleEditPastClosing = (closing: DailyClosing) => {
    if (!isWithin24Hours(closing)) {
      alert('Este fechamento possui mais de 24 horas e está bloqueado para edição para preservar o histórico.');
      return;
    }
    setSelectedDate(closing.dataFechamento);
    setAllItems(closing.itens || []);
    setOperatorName(closing.responsavel || '');
    setGeneralNotes(closing.observacoes || '');
    const ids = new Set((closing.itens || []).map((i) => i.productId));
    setProcessedItemIds(ids);
    setEditingClosingId(closing.id);
    setActiveTab('audit');
    setSubFilter('processed');
  };

  const generateWhatsAppSummary = () => {
    const text = `🌙 *FECHAMENTO INTELIGENTE - ${company.empresa}*
📅 *Data:* ${formatDateToBR(selectedDate)}
👤 *Responsável:* ${operatorName || 'Gerência'}

📊 *BALANÇO DO EXPEDIENTE:*
• Itens Concluídos: ${totalAudited} de ${allItems.length} produtos
• Vendas Finais: R$ ${totalVendidoReais.toFixed(2)}
• Transferidos / Doados: R$ ${(totalDoadoReais + totalTransferidoReais).toFixed(2)}
• Prejuízo em Descarte: *R$ ${totalPerdaReais.toFixed(2)}*
• Taxa de Eficiência: *${efficiencyPercentage}%*
🎯 *Meta Diária de Perda:* R$ ${targetMaxLoss.toFixed(2)} (${
      totalPerdaReais <= targetMaxLoss ? '✅ DENTRO DA META' : '⚠️ ACIMA DA META'
    })

📝 *Observações:* ${generalNotes || 'Fechamento concluído com sucesso conforme boas práticas.'}

_Gerado pelo PADARIA.io v2.5_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-24 right-6 z-50 bg-[#111111] text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold border border-emerald-500/50 flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Fechamento Diário salvo e indicadores recalculados!</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-[#1F2937] via-[#111827] to-[#2C2C2C] text-white p-6 rounded-3xl border border-gray-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-[#FF6B00]/20 rounded-xl text-[#FF6B00] border border-[#FF6B00]/30">
                <Moon className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Fechamento Inteligente</h2>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  isSaved
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {isSaved ? 'Concluído' : 'Em Andamento'}
              </span>
              {editingClosingId && (
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-500/30 flex items-center space-x-1">
                  <Edit2 className="w-3 h-3" />
                  <span>Modo Edição (Janela 24h)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-300">
              Conferência de sobras, separação de vencidos e fechamento seguro do expediente.
            </p>
          </div>

          {/* Date Picker & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-gray-800/80 border border-gray-700 px-3 py-1.5 rounded-xl flex items-center space-x-2 text-xs">
              <Calendar className="w-4 h-4 text-[#FF6B00]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveClosing}
              className="px-4 py-2.5 bg-gradient-to-r from-[#FF6B00] to-[#E8571A] hover:from-[#e05e00] hover:to-[#d44e15] text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaved ? 'Atualizar Fechamento' : 'Concluir Fechamento'}</span>
            </button>
          </div>
        </div>

        {/* Quick Numbers Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-800 text-xs">
          <div className="bg-gray-900/60 p-3.5 rounded-2xl border border-gray-800">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Pendentes de Fechamento</span>
            <p className="text-lg font-black text-amber-400 mt-0.5">{pendingItems.length} produtos</p>
          </div>

          <div className="bg-gray-900/60 p-3.5 rounded-2xl border border-gray-800">
            <span className="text-[10px] text-emerald-400 font-bold uppercase">Concluídos / Processados</span>
            <p className="text-lg font-black text-emerald-400 mt-0.5">{processedItems.length} produtos</p>
          </div>

          <div className="bg-gray-900/60 p-3.5 rounded-2xl border border-gray-800">
            <span className="text-[10px] text-red-400 font-bold uppercase">Prejuízo (Descartes)</span>
            <p className="text-lg font-black text-red-400 mt-0.5">R$ {totalPerdaReais.toFixed(2)}</p>
          </div>

          <div className="bg-gray-900/60 p-3.5 rounded-2xl border border-gray-800">
            <span className="text-[10px] text-amber-300 font-bold uppercase">Eficiência Sanitária</span>
            <p className="text-lg font-black text-amber-300 mt-0.5">{efficiencyPercentage}%</p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#1F2937] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span>1. Confiabilidade & Sobras ({pendingItems.length} pendentes)</span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-[#1F2937] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>2. Resumo Financeiro</span>
        </button>

        <button
          onClick={() => setActiveTab('padeia')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'padeia'
              ? 'bg-[#1F2937] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>3. Análise PadeIA™</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#1F2937] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>Histórico (Correção 24h)</span>
        </button>
      </div>

      {/* TAB 1: AUDITORIA DE SOBRAS */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#1F2937]">Conferência das Sobras do Dia</h3>
              <p className="text-xs text-gray-500">
                Produtos vencidos são classificados obrigatoriamente para descarte sanitário.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Operador Responsável"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 font-medium focus:ring-2 focus:ring-[#1F2937] outline-none"
              />
            </div>
          </div>

          {/* Sub-Filter: Pendentes vs Finalizados */}
          <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-xl text-xs font-bold w-fit">
            <button
              onClick={() => setSubFilter('pending')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                subFilter === 'pending'
                  ? 'bg-white text-[#1F2937] shadow-xs font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              📋 Pendentes ({pendingItems.length})
            </button>
            <button
              onClick={() => setSubFilter('processed')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                subFilter === 'processed'
                  ? 'bg-white text-emerald-700 shadow-xs font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              ✅ Finalizados do Dia ({processedItems.length})
            </button>
          </div>

          {/* LISTA DE PENDENTES */}
          {subFilter === 'pending' && (
            <div>
              {pendingItems.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-emerald-200 bg-emerald-50/20 rounded-2xl space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="font-extrabold text-[#1F2937] text-sm">Todas as sobras pendentes foram processadas!</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Excelente trabalho. Todos os produtos foram destinados e movidos para a lista de Finalizados do Dia.
                  </p>
                  <button
                    onClick={() => setSubFilter('processed')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs inline-flex items-center space-x-2 cursor-pointer"
                  >
                    <span>Ver Produtos Finalizados</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingItems.map((item) => {
                    const expired = isItemExpired(item.dataValidade);

                    return (
                      <div
                        key={item.productId}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          expired
                            ? 'bg-red-50/60 border-red-200'
                            : 'bg-[#FAFAF8] border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-black text-sm text-[#1F2937] flex items-center space-x-2">
                              <span>{item.nomeProduto}</span>
                              <span className="text-[10px] bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded-md">
                                {item.categoria}
                              </span>
                              {expired && (
                                <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-md flex items-center space-x-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>VENCIDO</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Validade: <strong>{formatDateToBR(item.dataValidade)}</strong> • Quantidade em Balcão: <strong>{item.quantidade} un</strong>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-gray-400 font-bold">Valor Estimado</span>
                            <div className="text-base font-black text-[#1F2937]">R$ {item.valorEstimado.toFixed(2)}</div>
                          </div>
                        </div>

                        {/* BUSINESS RULE 1, 2, 3: EXPIRED PRODUCTS HAVE NO OTHER OPTIONS EXCEPT "CONFIRMAR DESCARTE" */}
                        {expired ? (
                          <div className="p-3 bg-red-100/80 border border-red-200 rounded-xl space-y-2">
                            <div className="flex items-center space-x-2 text-red-900 font-extrabold text-xs">
                              <Info className="w-4 h-4 text-red-600 shrink-0" />
                              <span>
                                Este produto está vencido. Conforme as boas práticas sanitárias, ele deve ser descartado.
                              </span>
                            </div>
                            <div className="pt-1 flex justify-end">
                              <button
                                onClick={() => handleConfirmItemAction(item.productId, 'descarte')}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>🗑️ Confirmar descarte</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* VALID PRODUCTS: ALLOW VENDIDO, TRANSFERIDO, DOACAO, DESCARTE */
                          <div className="space-y-2 pt-2 border-t border-gray-200">
                            <span className="text-xs font-bold text-gray-600 block">
                              Selecione a ação final do item para concluir o fechamento:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <button
                                onClick={() => handleConfirmItemAction(item.productId, 'vendido')}
                                className="p-2.5 rounded-xl text-xs font-extrabold bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>🛒 Vendido</span>
                              </button>

                              <button
                                onClick={() => handleConfirmItemAction(item.productId, 'transferido')}
                                className="p-2.5 rounded-xl text-xs font-extrabold bg-blue-50 hover:bg-blue-600 text-blue-800 hover:text-white border border-blue-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span>🔁 Transferido</span>
                              </button>

                              <button
                                onClick={() => handleConfirmItemAction(item.productId, 'doacao')}
                                className="p-2.5 rounded-xl text-xs font-extrabold bg-purple-50 hover:bg-purple-600 text-purple-800 hover:text-white border border-purple-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                              >
                                <Heart className="w-3.5 h-3.5" />
                                <span>🎁 Doado</span>
                              </button>

                              <button
                                onClick={() => handleConfirmItemAction(item.productId, 'descarte')}
                                className="p-2.5 rounded-xl text-xs font-extrabold bg-red-50 hover:bg-red-600 text-red-800 hover:text-white border border-red-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>🗑️ Descarte</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LISTA DE FINALIZADOS / PROCESSADOS */}
          {subFilter === 'processed' && (
            <div>
              {processedItems.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-200 rounded-2xl">
                  <p className="text-xs text-gray-500 italic">Nenhum produto foi processado até o momento hoje.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processedItems.map((item) => (
                    <div
                      key={item.productId}
                      className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-extrabold text-[#1F2937] flex items-center space-x-2">
                          <span>{item.nomeProduto}</span>
                          <span className="text-[10px] bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded-md">
                            {item.categoria}
                          </span>
                        </div>
                        <p className="text-gray-500 mt-0.5">
                          {item.observacoes || 'Concluído'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase ${
                            item.acaoTomada === 'vendido'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.acaoTomada === 'transferido'
                              ? 'bg-blue-100 text-blue-800'
                              : item.acaoTomada === 'doacao'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.acaoTomada} • R$ {item.valorEstimado.toFixed(2)}
                        </span>

                        <button
                          onClick={() => handleReturnToPending(item.productId)}
                          className="px-2 py-1 text-[10px] font-extrabold text-gray-600 hover:text-black border border-gray-300 rounded-md hover:bg-white transition-all cursor-pointer flex items-center space-x-1"
                          title="Voltar para pendentes para alterar opção"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Alterar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* General Notes */}
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-xs font-extrabold text-[#1F2937] uppercase tracking-wider mb-2">
              Observações Gerais do Expediente
            </label>
            <textarea
              rows={3}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Ex: Picos de movimento na parte da manhã. Clima ameno aumentou procura por tortas e pão doce."
              className="w-full p-3 text-xs rounded-xl border border-gray-300 font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F2937]"
            />
          </div>
        </div>
      )}

      {/* TAB 2: RESUMO FINANCEIRO */}
      {activeTab === 'summary' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-[#1F2937]">Balanço Financeiro e Eficiência Sanitária</h3>
            <p className="text-xs text-gray-500">Valores consolidados dos produtos processados no fechamento do dia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase">Vendas Finais</span>
              <div className="text-2xl font-black text-emerald-950">R$ {totalVendidoReais.toFixed(2)}</div>
              <p className="text-[10px] text-emerald-700">Faturamento preservado no balcão.</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
              <span className="text-[10px] font-extrabold text-blue-800 uppercase">Transferidos / Doados</span>
              <div className="text-2xl font-black text-blue-950">R$ {(totalDoadoReais + totalTransferidoReais).toFixed(2)}</div>
              <p className="text-[10px] text-blue-700">Outros setores ou uso social.</p>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-1">
              <span className="text-[10px] font-extrabold text-red-800 uppercase">Prejuízo (Descartes)</span>
              <div className="text-2xl font-black text-red-950">R$ {totalPerdaReais.toFixed(2)}</div>
              <p className="text-[10px] text-red-700">Perda real por descarte sanitário.</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
              <span className="text-[10px] font-extrabold text-amber-800 uppercase">Meta Diária Perda</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-bold">Até R$</span>
                <input
                  type="number"
                  value={targetMaxLoss}
                  onChange={(e) => setTargetMaxLoss(Number(e.target.value))}
                  className="w-20 px-2 py-0.5 text-xs font-black rounded-md border border-amber-300 bg-white"
                />
              </div>
              <p className="text-[10px] text-amber-900 font-extrabold mt-1">
                {totalPerdaReais <= targetMaxLoss ? '✅ DENTRO DA META' : '⚠️ ACIMA DA META'}
              </p>
            </div>
          </div>

          {/* Share & Report Buttons */}
          <div className="p-5 bg-[#FAFAF8] rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-sm text-[#1F2937]">Relatório Executivo para Gerência</h4>
              <p className="text-xs text-gray-500">Envie o resumo diretamente via WhatsApp para acompanhamento.</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={generateWhatsAppSummary}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar no WhatsApp</span>
              </button>

              {onOpenReport && (
                <button
                  onClick={onOpenReport}
                  className="px-4 py-2.5 rounded-xl bg-[#1F2937] hover:bg-black text-white font-extrabold text-xs transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#FF6B00]" />
                  <span>Imprimir Relatório</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PADEIA */}
      {activeTab === 'padeia' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-[#FF6B00] to-[#E8571A] text-white rounded-xl">
              <Sparkles className="w-6 h-6 text-amber-200 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1F2937]">Parecer Diagnóstico PadeIA™</h3>
              <p className="text-xs text-gray-500">Inteligência calibrada para prevenção de perdas sanitárias.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 space-y-2">
              <h4 className="font-extrabold text-xs text-orange-900 uppercase flex items-center space-x-1.5">
                <span>🥖 Calibragem de Fornadas</span>
              </h4>
              <p className="text-xs text-gray-700 leading-relaxed">
                Com base nos descartes registrados, recomenda-se reduzir em <strong>12% a produção da primeira fornada matutina</strong> de salgados assados e acompanhar a demanda do meio-dia.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <h4 className="font-extrabold text-xs text-emerald-900 uppercase flex items-center space-x-1.5">
                <span>🛡️ Boas Práticas Sanitárias</span>
              </h4>
              <p className="text-xs text-gray-700 leading-relaxed">
                Todos os itens vencidos foram descartados corretamente, mantendo a padaria 100% em conformidade com as normas sanitárias e livrando o estabelecimento de multas e contaminações.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HISTÓRICO DE FECHAMENTOS (COM REGRA DE 24 HORAS) */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-[#1F2937]">Histórico de Fechamentos (Correções até 24h)</h3>
            <p className="text-xs text-gray-500">
              Conforme as regras de gestão, você pode editar um fechamento por até 24 horas. Após esse período o registro é bloqueado.
            </p>
          </div>

          {closingsHistory.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-8 text-center border border-dashed border-gray-200 rounded-xl">
              Nenhum fechamento registrado anteriormente.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-[#1F2937] font-bold border-b border-gray-200">
                    <th className="py-3 px-4">Data Fechamento</th>
                    <th className="py-3 px-4">Responsável</th>
                    <th className="py-3 px-4">Itens Auditados</th>
                    <th className="py-3 px-4">Prejuízo (Descartes)</th>
                    <th className="py-3 px-4">Eficiência</th>
                    <th className="py-3 px-4">Status / Janela 24h</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {closingsHistory.map((closing) => {
                    const canEdit = isWithin24Hours(closing);

                    return (
                      <tr key={closing.id} className="hover:bg-gray-50/80">
                        <td className="py-3 px-4 font-bold text-[#1F2937]">
                          {formatDateToBR(closing.dataFechamento)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{closing.responsavel || 'Operador'}</td>
                        <td className="py-3 px-4 font-semibold">{closing.totalItensAuditados} un</td>
                        <td className="py-3 px-4 text-red-600 font-bold">R$ {closing.totalPerdaReais.toFixed(2)}</td>
                        <td className="py-3 px-4 font-extrabold text-emerald-600">{closing.taxaAproveitamento}%</td>
                        <td className="py-3 px-4">
                          {canEdit ? (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase inline-flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>Edição Liberada (24h)</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md bg-gray-200 text-gray-700 text-[10px] font-black uppercase inline-flex items-center space-x-1">
                              <Lock className="w-3 h-3" />
                              <span>Bloqueado (&gt;24h)</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {canEdit ? (
                            <button
                              onClick={() => handleEditPastClosing(closing)}
                              className="px-3 py-1.5 rounded-lg bg-[#1F2937] hover:bg-black text-white font-extrabold text-[11px] transition-all shadow-xs flex items-center space-x-1 ml-auto cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 text-[#FF6B00]" />
                              <span>Editar Fechamento</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-bold italic">
                              Sem alterações
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
    </div>
  );
};

