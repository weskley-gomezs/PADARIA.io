import React, { useState, useEffect } from 'react';
import { 
  Crown, Share2, Copy, Check, Trash2, Calendar, Filter, Sparkles, 
  TrendingUp, Coins, Flame, Image, Tag, X, ChevronDown, CheckCircle, 
  AlertTriangle, RefreshCw, Clock, QrCode, Edit2, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { VipOffer, VipOfferStatus } from '../types';
import { StorageService } from '../services/storageService';
import { calculateDaysRemaining, formatDateToBR, getRelativeExpirationText } from '../utils/dateUtils';
import { VipScannerModal } from './VipScannerModal';

interface VipClubSectionProps {
  bakeryCode: string;
}

export const VipClubSection: React.FC<VipClubSectionProps> = ({ bakeryCode }) => {
  const [offers, setOffers] = useState<VipOffer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [statusFilter, setStatusFilter] = useState<'todos' | VipOfferStatus>('todos');
  const [periodFilter, setPeriodFilter] = useState<'todos' | 'hoje' | '7dias' | 'mes'>('todos');
  
  // Selection/Modals state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOfferForArt, setSelectedOfferForArt] = useState<VipOffer | null>(null);
  const [selectedOfferForSale, setSelectedOfferForSale] = useState<VipOffer | null>(null);
  const [salePriceInput, setSalePriceInput] = useState<string>('');
  
  // Edit Discount Modal state
  const [selectedOfferForEdit, setSelectedOfferForEdit] = useState<VipOffer | null>(null);
  const [editDiscountInput, setEditDiscountInput] = useState<string>('');
  const [editPromoInput, setEditPromoInput] = useState<string>('');

  // VIP Scanner Modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);

  // Subscribe to real-time updates of VIP Offers
  useEffect(() => {
    setLoading(true);
    const unsubscribe = StorageService.subscribeVipOffers((data) => {
      setOffers(data);
      setLoading(false);
    }, bakeryCode);

    return () => unsubscribe();
  }, [bakeryCode]);

  // AUTO-SYNC: Auto-transition active expired offers to 'descartado'
  useEffect(() => {
    const handleAutoExpire = async () => {
      const activeExpired = offers.filter(
        (o) => o.status === 'ativo' && calculateDaysRemaining(o.dataValidade) <= 0
      );
      if (activeExpired.length > 0) {
        setSyncing(true);
        for (const offer of activeExpired) {
          await StorageService.updateVipOfferStatus(offer.id, 'descartado');
        }
        setSyncing(false);
      }
    };
    if (offers.length > 0) {
      handleAutoExpire();
    }
  }, [offers]);

  // CALCULATE 5 DASHBOARD INDICATORS
  const totalOffersCreated = offers.length;
  const soldOffers = offers.filter(o => o.status === 'vendido');
  const activeOffers = offers.filter(o => o.status === 'ativo');
  const discardedOffers = offers.filter(o => o.status === 'descartado');

  // 1. Dinheiro Recuperado (R$)
  const totalRecoveredValue = soldOffers.reduce((sum, o) => sum + (o.valorVenda || o.valorPromocional), 0);

  // 2. Produtos salvos do descarte (Count)
  const totalRecoveredCount = soldOffers.length;

  // 3. Produtos descartados (Count)
  const totalDiscardedCount = discardedOffers.length;

  // 4. Taxa de recuperação (%)
  const totalResolved = soldOffers.length + discardedOffers.length;
  const recoveryRatePercent = totalResolved > 0 
    ? Math.round((soldOffers.length / totalResolved) * 100) 
    : (totalOffersCreated > 0 ? Math.round((soldOffers.length / totalOffersCreated) * 100) : 0);

  // 5. Economia gerada no mês (R$)
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const monthSoldOffers = soldOffers.filter(o => (o.dataVenda || o.updatedAt || o.createdAt).startsWith(currentMonthStr));
  const monthSavingsValue = monthSoldOffers.reduce((sum, o) => sum + (o.valorVenda || o.valorPromocional), 0);

  // MONTHLY RECOVERY CHART DATA
  const monthlyDataMap: { [key: string]: { month: string; recoveredValue: number; count: number } } = {};
  soldOffers.forEach((o) => {
    const refDate = o.dataVenda || o.updatedAt || o.createdAt;
    if (refDate) {
      const parts = refDate.substring(0, 10).split('-');
      if (parts.length >= 2) {
        const yearMonth = `${parts[0]}-${parts[1]}`;
        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
        const monthLabel = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        const val = o.valorVenda || o.valorPromocional;
        if (!monthlyDataMap[yearMonth]) {
          monthlyDataMap[yearMonth] = {
            month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
            recoveredValue: 0,
            count: 0,
          };
        }
        monthlyDataMap[yearMonth].recoveredValue += val;
        monthlyDataMap[yearMonth].count += 1;
      }
    }
  });

  const chartData = Object.keys(monthlyDataMap)
    .sort()
    .map((key) => monthlyDataMap[key]);

  // PERIOD & STATUS FILTERING LOGIC
  const getFilteredOffers = () => {
    let result = [...offers];

    // Filter by status
    if (statusFilter !== 'todos') {
      result = result.filter(o => o.status === statusFilter);
    }

    // Filter by period
    const today = new Date();
    today.setHours(0,0,0,0);

    if (periodFilter === 'hoje') {
      const todayStr = today.toISOString().substring(0, 10);
      result = result.filter(o => o.createdAt.startsWith(todayStr));
    } else if (periodFilter === '7dias') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      result = result.filter(o => new Date(o.createdAt) >= sevenDaysAgo);
    } else if (periodFilter === 'mes') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      result = result.filter(o => new Date(o.createdAt) >= startOfMonth);
    }

    return result;
  };

  const filteredOffers = getFilteredOffers();

  // FLUXO 3: COPY PROMOTIONAL MESSAGE (Strictly formatted template)
  const handleCopyMessage = (offer: VipOffer) => {
    const text = `🥖 Clube VIP da Padaria

Hoje temos uma oferta especial.

🍰 ${offer.nomeProduto}

💰 De R$ ${offer.valorOriginal.toFixed(2).replace('.', ',')} por R$ ${offer.valorPromocional.toFixed(2).replace('.', ',')}

Oferta válida enquanto durar o estoque.

Disponível somente na loja.`;

    navigator.clipboard.writeText(text);
    setCopiedId(offer.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // EDIT DISCOUNT ACTION
  const handleOpenEditModal = (offer: VipOffer) => {
    setSelectedOfferForEdit(offer);
    setEditDiscountInput(offer.desconto.toString());
    setEditPromoInput(offer.valorPromocional.toString());
  };

  const handleSaveDiscountEdit = async () => {
    if (!selectedOfferForEdit) return;
    const discount = parseFloat(editDiscountInput) || 0;
    let promo = parseFloat(editPromoInput);
    if (isNaN(promo) || promo <= 0) {
      promo = selectedOfferForEdit.valorOriginal * (1 - discount / 100);
    }
    await StorageService.updateVipOffer(selectedOfferForEdit.id, {
      desconto: discount,
      valorPromocional: Number(promo.toFixed(2)),
    });
    setSelectedOfferForEdit(null);
  };

  // MARK AS SOLD ACTION
  const handleOpenSaleModal = (offer: VipOffer) => {
    setSelectedOfferForSale(offer);
    setSalePriceInput(offer.valorPromocional.toString());
  };

  const handleConfirmSale = async () => {
    if (!selectedOfferForSale) return;
    const price = parseFloat(salePriceInput) || selectedOfferForSale.valorPromocional;
    
    await StorageService.updateVipOfferStatus(selectedOfferForSale.id, 'vendido', {
      dataVenda: new Date().toISOString(),
      valorVenda: price,
    });

    setSelectedOfferForSale(null);
  };

  // REMOVE ACTION
  const handleRemoveOffer = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza de que deseja remover a oferta de "${name}" da promoção do Clube VIP?`)) {
      await StorageService.deleteVipOffer(id);
    }
  };

  // HELPER FOR BADGE COLORS
  const getStatusBadge = (status: VipOfferStatus) => {
    switch (status) {
      case 'ativo':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>EM_PROMOCAO</span>
          </span>
        );
      case 'vendido':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Vendido</span>
          </span>
        );
      case 'descartado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-200 flex items-center space-x-1">
            <X className="w-3 h-3 text-gray-400" />
            <span>Descartado</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER ROW WITH SCANNER BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Crown className="w-7 h-7 text-[#E8571A]" />
            <h2 className="text-xl sm:text-2xl font-black text-[#2C2C2C] tracking-tight">
              Clube VIP PADARIA.io
            </h2>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Transforme produtos próximos do vencimento em oportunidade de venda antes que sejam descartados.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Scanner Button */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>Scanner Clube VIP</span>
          </button>

          {syncing && (
            <div className="flex items-center space-x-2 text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Sincronizando...</span>
            </div>
          )}
        </div>
      </div>

      {/* DASHBOARD INDICATORS (5 REQUIRED INDICATORS) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Indicator 1: Dinheiro Recuperado */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-1 shadow-xs">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">
            Dinheiro Recuperado
          </span>
          <span className="text-2xl font-black text-[#2C2C2C] block">
            R$ {totalRecoveredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-gray-400 block font-medium">
            Receita obtida em vendas
          </span>
        </div>

        {/* Indicator 2: Produtos Salvos do Descarte */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-1 shadow-xs">
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
            Produtos Salvos
          </span>
          <span className="text-2xl font-black text-[#2C2C2C] block">
            {totalRecoveredCount}
          </span>
          <span className="text-[10px] text-gray-400 block font-medium">
            Vendidos antes de vencer
          </span>
        </div>

        {/* Indicator 3: Produtos Descartados */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-1 shadow-xs">
          <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">
            Produtos Descartados
          </span>
          <span className="text-2xl font-black text-gray-700 block">
            {totalDiscardedCount}
          </span>
          <span className="text-[10px] text-gray-400 block font-medium">
            Vencidos sem venda
          </span>
        </div>

        {/* Indicator 4: Taxa de Recuperação (%) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-1 shadow-xs">
          <span className="text-[10px] font-extrabold text-[#E8571A] uppercase tracking-wider block">
            Taxa de Recuperação
          </span>
          <span className="text-2xl font-black text-[#2C2C2C] block">
            {recoveryRatePercent}%
          </span>
          <span className="text-[10px] text-gray-400 block font-medium">
            Eficácia do Clube VIP
          </span>
        </div>

        {/* Indicator 5: Economia Gerada no Mês */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-1 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">
            Economia no Mês
          </span>
          <span className="text-2xl font-black text-amber-700 block">
            R$ {monthSavingsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-gray-400 block font-medium">
            Recuperação este mês
          </span>
        </div>
      </div>

      {/* MONTHLY AND ANNUAL RECOVERY CHART */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#E8571A]" />
            <h3 className="text-sm sm:text-base font-extrabold text-[#2C2C2C]">
              Evolução da Recuperação de Produtos (Mensal / Anual)
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
            Total Recuperado: R$ {totalRecoveredValue.toFixed(2)}
          </span>
        </div>

        {chartData.length === 0 ? (
          <div className="text-center py-8 text-gray-400 space-y-1">
            <TrendingUp className="w-8 h-8 mx-auto text-amber-500 opacity-60" />
            <p className="text-xs font-bold text-gray-600">Sem dados de recuperação registrados ainda.</p>
            <p className="text-[11px] text-gray-400">Adicione produtos ao Clube VIP e confirme as vendas para acompanhar o gráfico de evolução.</p>
          </div>
        ) : (
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6B7280' }} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `R$ ${val}`}
                />
                <Tooltip 
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Receita Recuperada']}
                  contentStyle={{ backgroundColor: '#2C2C2C', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="recoveredValue" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* FILTER & CONTROL PANEL */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'todos' 
                ? 'bg-[#1F2937] text-white shadow-sm' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('ativo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'ativo' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            🔥 Em Promoção ({activeOffers.length})
          </button>
          <button
            onClick={() => setStatusFilter('vendido')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'vendido' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            ✅ Vendidos ({soldOffers.length})
          </button>
          <button
            onClick={() => setStatusFilter('descartado')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'descartado' 
                ? 'bg-gray-500 text-white shadow-sm' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            🗑️ Descartados ({discardedOffers.length})
          </button>
        </div>

        {/* Period Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-gray-400" /> Período:
          </span>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as any)}
            className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
          >
            <option value="todos">Todos os registros</option>
            <option value="hoje">Hoje</option>
            <option value="7dias">Últimos 7 dias</option>
            <option value="mes">Este mês</option>
          </select>
        </div>
      </div>

      {/* OFFERS TABLE (FLUXO 4) */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <div className="w-8 h-8 border-4 border-[#E8571A] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold">Carregando Clube VIP...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mx-auto">
              <Crown className="w-6 h-6 text-amber-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-700">Nenhuma oferta cadastrada no Clube VIP</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Quando a IA analisar um rótulo de produto com até 3 dias para vencer, o sistema oferecerá a opção de enviar para o Clube VIP!
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-3.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Produto em Promoção</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Valor Original / Promo</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Desconto</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Dias Restantes</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOffers.map((offer) => {
                  const daysLeft = calculateDaysRemaining(offer.dataValidade);
                  return (
                    <tr key={offer.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Produto */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-sm text-gray-800">{offer.nomeProduto}</div>
                        <div className="text-[11px] text-gray-400 font-medium">{offer.categoria}</div>
                      </td>

                      {/* Preços */}
                      <td className="py-4 px-4">
                        <div className="text-xs text-gray-400 line-through">
                          R$ {offer.valorOriginal.toFixed(2)}
                        </div>
                        <div className="text-sm font-extrabold text-emerald-600">
                          R$ {offer.valorPromocional.toFixed(2)}
                        </div>
                      </td>

                      {/* Desconto */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-black border border-red-100">
                          <span>{offer.desconto}%</span>
                          <span className="text-[9px] font-bold">OFF</span>
                        </span>
                      </td>

                      {/* Dias Restantes */}
                      <td className="py-4 px-4">
                        {offer.status === 'ativo' ? (
                          <div className="space-y-0.5">
                            <div className={`text-xs font-bold flex items-center space-x-1 ${
                              daysLeft <= 1 ? 'text-red-500' : 'text-amber-500'
                            }`}>
                              <Clock className="w-3.5 h-3.5" />
                              <span>{getRelativeExpirationText(daysLeft)}</span>
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium">
                              Vence: {formatDateToBR(offer.dataValidade)}
                            </div>
                          </div>
                        ) : offer.status === 'vendido' && offer.dataVenda ? (
                          <span className="text-xs text-gray-400 font-medium">
                            Vendido em {new Date(offer.dataVenda).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">
                            N/A
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {getStatusBadge(offer.status)}
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {offer.status === 'ativo' && (
                            <>
                              {/* Copiar Mensagem Pronta (FLUXO 3) */}
                              <button
                                onClick={() => handleCopyMessage(offer)}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all inline-flex items-center space-x-1 cursor-pointer ${
                                  copiedId === offer.id 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                                title="Copiar mensagem pronta do Clube VIP"
                              >
                                {copiedId === offer.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copiar Mensagem</span>
                                  </>
                                )}
                              </button>

                              {/* Editar Desconto (FLUXO 4) */}
                              <button
                                onClick={() => handleOpenEditModal(offer)}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1 border border-blue-200"
                                title="Editar desconto da promoção"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>Editar Desconto</span>
                              </button>

                              {/* Gerar Arte */}
                              <button
                                onClick={() => setSelectedOfferForArt(offer)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1 border border-amber-200"
                                title="Visualizar panfleto / arte promocional"
                              >
                                <Image className="w-3.5 h-3.5 text-amber-600" />
                                <span>Ver Arte</span>
                              </button>

                              {/* Confirmar Venda */}
                              <button
                                onClick={() => handleOpenSaleModal(offer)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1 shadow-sm"
                                title="Confirmar venda do produto promocional"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Vendido!</span>
                              </button>
                            </>
                          )}

                          {/* Remover da promoção (FLUXO 4) */}
                          <button
                            onClick={() => handleRemoveOffer(offer.id, offer.nomeProduto)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remover da promoção"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIP SCANNER MODAL */}
      <VipScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        bakeryCode={bakeryCode}
      />

      {/* EDIT DISCOUNT MODAL (FLUXO 4) */}
      {selectedOfferForEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-extrabold text-sm text-[#2C2C2C] flex items-center gap-1">
                <Edit2 className="w-4 h-4 text-blue-600" /> Editar Desconto da Promoção
              </span>
              <button
                onClick={() => setSelectedOfferForEdit(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Ajuste o percentual de desconto do produto <strong>{selectedOfferForEdit.nomeProduto}</strong> no Clube VIP.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Desconto (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editDiscountInput}
                  onChange={(e) => {
                    setEditDiscountInput(e.target.value);
                    const disc = parseFloat(e.target.value) || 0;
                    const newPromo = selectedOfferForEdit.valorOriginal * (1 - disc / 100);
                    setEditPromoInput(newPromo.toFixed(2));
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-blue-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Valor Promocional Final (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPromoInput}
                  onChange={(e) => {
                    setEditPromoInput(e.target.value);
                    const p = parseFloat(e.target.value) || 0;
                    if (selectedOfferForEdit.valorOriginal > 0) {
                      const disc = ((selectedOfferForEdit.valorOriginal - p) / selectedOfferForEdit.valorOriginal) * 100;
                      setEditDiscountInput(disc.toFixed(1));
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-extrabold text-emerald-700"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedOfferForEdit(null)}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDiscountEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SALE MODAL */}
      {selectedOfferForSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-extrabold text-sm text-[#2C2C2C] flex items-center gap-1">
                💰 Confirmar Venda
              </span>
              <button
                onClick={() => setSelectedOfferForSale(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Registrar que o produto <strong>{selectedOfferForSale.nomeProduto}</strong> foi vendido através do Clube VIP!
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Valor Real da Venda (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePriceInput}
                    onChange={(e) => setSalePriceInput(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-[#2C2C2C]"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedOfferForSale(null)}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSale}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARTE / FLYER PREVIEW MODAL */}
      {selectedOfferForArt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up border border-gray-100 flex flex-col">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="font-extrabold text-sm text-[#2C2C2C] flex items-center gap-1">
                <Image className="w-4 h-4 text-amber-500" /> Panfleto Promocional
              </span>
              <button
                onClick={() => setSelectedOfferForArt(null)}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* THE ARTWORK CANVAS */}
            <div className="p-6 bg-gradient-to-b from-amber-50/20 to-orange-50/10 flex items-center justify-center">
              <div id="flyer-art" className="w-full max-w-[320px] aspect-[4/5] bg-gradient-to-br from-[#E8571A] to-[#D4A574] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border-4 border-white">
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10 pointer-events-none"></div>
                <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>

                <div className="text-center space-y-1">
                  <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase">
                    ⭐ OFERTA DO CLUBE VIP ⭐
                  </div>
                  <h4 className="text-xl font-black tracking-tight leading-none uppercase pt-2">
                    PADARIA.io
                  </h4>
                </div>

                <div className="bg-white text-gray-800 rounded-2xl p-4 shadow-lg text-center space-y-2.5 z-10 my-4 relative">
                  <div className="absolute -top-3.5 -right-3.5 bg-red-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-md border-2 border-white transform rotate-12 flex items-center gap-0.5">
                    <span>{selectedOfferForArt.desconto}%</span>
                    <span className="text-[8px] font-bold">OFF</span>
                  </div>

                  <span className="text-[10px] text-[#E8571A] font-extrabold uppercase tracking-widest block">
                    Aproveite Já!
                  </span>
                  
                  <h5 className="text-lg font-black text-[#2C2C2C] leading-tight line-clamp-2">
                    {selectedOfferForArt.nomeProduto}
                  </h5>

                  <div className="flex items-center justify-center space-x-3 pt-1">
                    <div className="text-xs text-gray-400 line-through">
                      De: R$ {selectedOfferForArt.valorOriginal.toFixed(2)}
                    </div>
                    <div className="text-base font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      Por: R$ {selectedOfferForArt.valorPromocional.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-1 z-10">
                  <div className="text-[10px] text-orange-100 font-bold">
                    ⏳ Válido até: {formatDateToBR(selectedOfferForArt.dataValidade)}
                  </div>
                  <div className="text-[9px] text-white/80 font-medium">
                    Consulte disponibilidade de estoque • Retirada na loja
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2">
              <button
                onClick={() => handleCopyMessage(selectedOfferForArt)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Copiar Mensagem
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#E8571A] hover:bg-[#d44e15] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Imprimir ou Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
