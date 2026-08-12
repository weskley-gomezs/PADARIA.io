import React, { useState } from 'react';
import {
  CreditCard,
  Send,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Receipt,
  Building2,
  AlertTriangle,
  Calendar,
  Save,
  Sliders,
  Sparkles,
  Link2,
  CheckCircle,
  ExternalLink,
  Info,
  Copy,
  Check,
  Share2,
  MessageSquare,
  QrCode,
  DollarSign,
  XCircle,
  Filter,
  X,
  RefreshCw,
} from 'lucide-react';
import { BakeryCompany, BillingStatus, FinancialStats } from '../../types';
import { StorageService } from '../../services/storageService';
import { calculateDaysRemaining, formatDateToBR, formatDateToISO } from '../../utils/dateUtils';
import { auth } from '../../services/firebase';

async function getAuthHeaders() {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('Erro ao obter token auth:', err);
  }
  return headers;
}
import { WhatsAppMessageModal } from './WhatsAppMessageModal';

interface AdminBillingProps {
  companies: BakeryCompany[];
  stats: FinancialStats;
  onRefresh: () => void;
}

type FilterStatus = 'todos' | 'pagando' | 'inadimplente' | 'cancelado';

export const AdminBilling: React.FC<AdminBillingProps> = ({ companies, stats, onRefresh }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [whatsAppModalCompany, setWhatsAppModalCompany] = useState<BakeryCompany | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('todos');

  // Status & Due Date Editing State per Company
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<BillingStatus>('pendente');
  const [editDueDate, setEditDueDate] = useState<string>('');
  const [editValorMensal, setEditValorMensal] = useState<number>(199);

  // Monthly Subscription Asaas Send Modal State
  const [sendSubModalCompany, setSendSubModalCompany] = useState<BakeryCompany | null>(null);
  const [sendSubValue, setSendSubValue] = useState<number>(199);
  const [sendSubDueDate, setSendSubDueDate] = useState<string>(formatDateToISO(new Date()));
  const [isSendingSub, setIsSendingSub] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStartEdit = (company: BakeryCompany) => {
    setEditingCode(company.codigoAtivacao);
    setEditStatus(company.financeiro?.statusAssinatura || 'pendente');
    setEditDueDate(company.financeiro?.dataProximaCobranca || formatDateToISO(new Date()));
    setEditValorMensal(company.financeiro?.valorMensalidade ?? 199);
  };

  const handleSaveBillingStatus = async (code: string) => {
    try {
      await StorageService.updateCompanyBilling(code, {
        statusAssinatura: editStatus,
        dataProximaCobranca: editDueDate,
        valorMensalidade: isNaN(Number(editValorMensal)) ? 199 : Number(editValorMensal),
      });
      setEditingCode(null);
      onRefresh();
      showToast(`Valor da mensalidade, status e vencimento atualizados!`);
    } catch (err: any) {
      console.error("Erro ao salvar dados financeiros:", err);
      showToast(`Erro ao salvar dados financeiros: ${err.message || err}`);
    }
  };

  const handleOpenWhatsAppModal = (c: BakeryCompany) => {
    setWhatsAppModalCompany(c);
  };

  const handleToggleSuspension = async (code: string, name: string) => {
    const newStatus = await StorageService.toggleCompanyBillingSuspension(code);
    onRefresh();
    if (newStatus === 'suspenso' || newStatus === 'cancelado') {
      showToast(`Assinatura da padaria ${name} CANCELADA / SUSPENSA por inadimplência!`);
    } else {
      showToast(`Assinatura da padaria ${name} REATIVADA com sucesso!`);
    }
  };

  const handleOpenSendSubModal = (c: BakeryCompany) => {
    setSendSubModalCompany(c);
    setSendSubValue(c.financeiro?.valorMensalidade ?? 199);
    setSendSubDueDate(c.financeiro?.dataProximaCobranca || formatDateToISO(new Date()));
  };

  const handleSendMonthlyBoleto = async () => {
    if (!sendSubModalCompany) return;
    setIsSendingSub(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/asaas/send-monthly-subscription', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          codigoAtivacao: sendSubModalCompany.codigoAtivacao,
          empresa: sendSubModalCompany.empresa,
          email: sendSubModalCompany.email,
          telefone: sendSubModalCompany.telefone,
          cnpj: sendSubModalCompany.cnpj,
          valorMensalidade: sendSubValue,
          dataVencimento: sendSubDueDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar mensalidade no Asaas.');
      }

      await StorageService.updateCompanyBilling(sendSubModalCompany.codigoAtivacao, {
        valorMensalidade: sendSubValue,
        dataProximaCobranca: sendSubDueDate,
        asaasSubscriptionId: data.subscriptionId,
        asaasPaymentLink: data.paymentUrl,
        ultimoLinkPagamento: data.paymentUrl,
        tipoUltimoLink: 'mensalidade',
        statusAssinatura: 'pendente',
      });

      setSendSubModalCompany(null);
      onRefresh();
      showToast(data.message || `Assinatura mensal enviada e ativada para ${sendSubModalCompany.email}!`);
    } catch (err: any) {
      showToast(`Erro: ${err.message}`);
    } finally {
      setIsSendingSub(false);
    }
  };

  const handleCopyPaymentLink = async (company: BakeryCompany) => {
    const fin = company.financeiro;
    const existingLink = fin?.asaasPaymentLink 
      || fin?.ultimoLinkPagamento 
      || (fin?.historicoCobrancas && fin.historicoCobrancas[0]?.linkBoleto);

    if (existingLink && existingLink.startsWith('http')) {
      navigator.clipboard.writeText(existingLink);
      showToast(`📋 Link do Asaas (${existingLink}) copiado com sucesso!`);
      return;
    }

    try {
      showToast(`🔄 Obtendo link do Asaas para ${company.empresa}...`);
      const headers = await getAuthHeaders();
      const res = await fetch('/api/asaas/get-payment-link', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          codigoAtivacao: company.codigoAtivacao,
          empresa: company.empresa,
          email: company.email,
          telefone: company.telefone,
          cnpj: company.cnpj,
          valorMensalidade: fin?.valorMensalidade || 199,
          valorImplementacao: fin?.valorImplementacao || 1500,
          asaasCustomerId: fin?.asaasCustomerId,
          asaasSubscriptionId: fin?.asaasSubscriptionId,
        }),
      });

      const data = await res.json();
      if (data.paymentUrl) {
        navigator.clipboard.writeText(data.paymentUrl);
        showToast(`📋 Link do Asaas (${data.paymentUrl}) copiado para ${company.empresa}!`);
        onRefresh();
      } else {
        showToast(`⚠️ Não foi possível obter o link do Asaas.`);
      }
    } catch (err: any) {
      showToast(`Erro ao obter link do Asaas: ${err.message}`);
    }
  };

  // Calculate alert counts
  const overdueCompanies = companies.filter((c) => {
    const dateStr = c.financeiro?.dataProximaCobranca;
    if (!dateStr) return false;
    return calculateDaysRemaining(dateStr) < 0 && c.financeiro?.statusAssinatura !== 'suspenso' && c.financeiro?.statusAssinatura !== 'cancelado';
  });

  const dueSoonCompanies = companies.filter((c) => {
    const dateStr = c.financeiro?.dataProximaCobranca;
    if (!dateStr) return false;
    const days = calculateDaysRemaining(dateStr);
    return days >= 0 && days <= 5 && c.financeiro?.statusAssinatura !== 'suspenso' && c.financeiro?.statusAssinatura !== 'cancelado';
  });

  const filteredCompanies = companies.filter((c) => {
    const status = c.financeiro?.statusAssinatura || 'pendente';
    if (filter === 'pagando') return status === 'ativo' || status === 'concluido';
    if (filter === 'inadimplente') return status === 'pendente' || status === 'vencido' || status === 'vencendo';
    if (filter === 'cancelado') return status === 'cancelado' || status === 'suspenso';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#111111] text-white px-5 py-3.5 rounded-2xl border border-[#FF6B00] shadow-2xl flex items-center space-x-3 text-xs animate-fade-in">
          <Zap className="w-4 h-4 text-[#FF6B00]" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* WhatsApp Message Modal */}
      {whatsAppModalCompany && (
        <WhatsAppMessageModal
          company={whatsAppModalCompany}
          onClose={() => setWhatsAppModalCompany(null)}
        />
      )}

      {/* Warning Banner for Due / Overdue Payments */}
      {(overdueCompanies.length > 0 || dueSoonCompanies.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-[#2C2C2C]">
                Alertas de Cobrança e Inadimplência Asaas
              </p>
              <p className="text-xs text-amber-900 font-medium">
                {overdueCompanies.length > 0 && (
                  <span className="text-red-700 font-bold mr-2">
                    🔴 {overdueCompanies.length} padaria(s) com pagamento VENCIDO!
                  </span>
                )}
                {dueSoonCompanies.length > 0 && (
                  <span className="text-amber-700 font-bold">
                    🟡 {dueSoonCompanies.length} vencendo nos próximos 5 dias.
                  </span>
                )}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-200/60 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            Acompanhe a régua de cobrança abaixo
          </span>
        </div>
      )}

      {/* Dashboard Financeiro Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* MRR Total Recorrente */}
        <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receita Recorrente (MRR)</p>
            <p className="text-3xl font-black text-[#111111] mt-1">
              R$ {(stats.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#FF6B00] font-bold mt-1">
              R$ {(stats.mrrTotalProjetado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Projetado
            </p>
          </div>
          <div className="p-3 bg-orange-50 text-[#FF6B00] rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Clientes Pagando vs Inadimplentes */}
        <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assinaturas Ativas</p>
            <p className="text-3xl font-black text-[#27AE60] mt-1">
              {stats.clientesAdimplentes || stats.totalClientesAtivos || 0} <span className="text-sm text-gray-400 font-normal">/ {stats.totalClientes || companies.length}</span>
            </p>
            <p className="text-[11px] text-red-600 font-semibold mt-1">
              {stats.clientesInadimplentes || 0} inadimplente(s) / pendente(s)
            </p>
          </div>
          <div className="p-3 bg-green-50 text-[#27AE60] rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Cancelados Automático pelo Asaas */}
        <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cancelados no Asaas</p>
            <p className="text-3xl font-black text-red-600 mt-1">
              {stats.clientesCanceladosAsaas || 0}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Cancelados por falta de pagamento</p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#111111]">Dashboard Financeiro de Assinaturas Recorrentes</h2>
            <p className="text-xs text-gray-500">
              Controle se a padaria está pagando ou em atraso, defina a mensalidade personalizada e envie notificações do WhatsApp
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              onClick={() => setFilter('todos')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'todos' ? 'bg-[#111111] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos ({companies.length})
            </button>
            <button
              onClick={() => setFilter('pagando')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'pagando' ? 'bg-[#27AE60] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pagando ({stats.clientesAdimplentes || 0})
            </button>
            <button
              onClick={() => setFilter('inadimplente')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'inadimplente' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Atrasados ({stats.clientesInadimplentes || 0})
            </button>
            <button
              onClick={() => setFilter('cancelado')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'cancelado' ? 'bg-red-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cancelados ({stats.clientesCanceladosAsaas || 0})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAFAF8] text-gray-500 font-extrabold uppercase tracking-wider border-b border-gray-200">
                <th className="py-3 px-4">Empresa</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Mensalidade</th>
                <th className="py-3 px-4">Status Recorrência / Asaas</th>
                <th className="py-3 px-4">Próximo Vencimento</th>
                <th className="py-3 px-4 text-right">Ações & WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[#111111]">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Nenhuma empresa encontrada com o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => {
                  const fin = c.financeiro || {
                    valorMensalidade: 199,
                    statusAssinatura: 'pendente',
                    dataProximaCobranca: formatDateToISO(new Date()),
                  };

                  const isEditing = editingCode === c.codigoAtivacao;
                  const daysLeft = calculateDaysRemaining(fin.dataProximaCobranca);

                  return (
                    <tr key={c.codigoAtivacao} className="hover:bg-gray-50/80 transition-colors">
                      {/* Empresa Name & CNPJ */}
                      <td className="py-3.5 px-4 font-bold">
                        <div className="text-sm font-extrabold text-[#111111]">{c.empresa}</div>
                        <div className="text-[10px] text-gray-500">{c.email}</div>
                        {c.cnpj && (
                          <div className="text-[10px] text-gray-400 font-mono">CNPJ: {c.cnpj}</div>
                        )}
                        {c.financeiro?.dataFimTeste && (
                          <div className="mt-1">
                            {(() => {
                              const daysLeft = calculateDaysRemaining(c.financeiro.dataFimTeste!);
                              const isPaid = fin.statusAssinatura === 'ativo' || fin.statusAssinatura === 'concluido';
                              if (isPaid) {
                                return <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded">Assinatura Ativa</span>;
                              }
                              if (daysLeft > 0) {
                                return <span className="text-[10px] text-blue-700 font-extrabold bg-blue-50 px-2 py-0.5 rounded">Teste: Restam {daysLeft} dia(s)</span>;
                              }
                              return <span className="text-[10px] text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded">Teste Expirado</span>;
                            })()}
                          </div>
                        )}
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#FF6B00]">
                        {c.codigoAtivacao}
                      </td>

                      {/* Monthly Fee Value */}
                      <td className="py-3.5 px-4 font-bold text-[#111111]">
                        {isEditing ? (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Mensalidade (R$)</label>
                            <input
                              type="number"
                              value={editValorMensal}
                              onChange={(e) => setEditValorMensal(Number(e.target.value))}
                              className="w-28 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-[#FF6B00] focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div>
                              <span className="text-sm font-black text-[#111111]">
                                R$ {(fin.valorMensalidade || 199).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] text-gray-400 block font-normal">/mês</span>
                            </div>

                            <button
                              onClick={() => handleOpenSendSubModal(c)}
                              className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 transition-all cursor-pointer flex items-center space-x-1"
                              title="Definir vencimento e enviar boleto de mensalidade via Asaas"
                            >
                              <CreditCard className="w-3 h-3 text-indigo-600" />
                              <span>Enviar Mensalidade</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Status Assinatura */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as BillingStatus)}
                            className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-2 focus:ring-[#FF6B00] focus:outline-none"
                          >
                            <option value="ativo">✅ Pagando / Ativo Recorrente</option>
                            <option value="pendente">⏳ Pendente de Pagamento</option>
                            <option value="vencendo">🟡 Vencendo em Breve</option>
                            <option value="vencido">🔴 Inadimplente / Em Atraso</option>
                            <option value="cancelado">❌ Cancelado pelo Asaas (Inadimplente)</option>
                            <option value="suspenso">⛔ Suspenso</option>
                          </select>
                        ) : (
                          <div>
                            {(fin.statusAssinatura === 'concluido' || fin.statusAssinatura === 'ativo') && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-green-100 text-[#27AE60] uppercase inline-flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>Pagando / Ativo</span>
                              </span>
                            )}
                            {fin.statusAssinatura === 'pendente' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase inline-flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Pendente Pagamento</span>
                              </span>
                            )}
                            {fin.statusAssinatura === 'vencendo' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 uppercase inline-flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Vencendo em Breve</span>
                              </span>
                            )}
                            {fin.statusAssinatura === 'vencido' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 uppercase inline-flex items-center space-x-1 animate-pulse">
                                <AlertOctagon className="w-3 h-3" />
                                <span>Inadimplente / Vencido</span>
                              </span>
                            )}
                            {fin.statusAssinatura === 'cancelado' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-950 text-red-200 uppercase inline-flex items-center space-x-1 border border-red-800">
                                <XCircle className="w-3 h-3 text-red-400" />
                                <span>Cancelado (Asaas)</span>
                              </span>
                            )}
                            {fin.statusAssinatura === 'suspenso' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gray-200 text-gray-700 uppercase">
                                ⛔ Suspenso
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Next Billing Date */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-mono focus:ring-2 focus:ring-[#FF6B00] focus:outline-none"
                          />
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5 font-mono font-bold text-gray-800">
                              <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" />
                              <span>{formatDateToBR(fin.dataProximaCobranca)}</span>
                            </div>

                            {/* Dynamic Alert Badges */}
                            {fin.statusAssinatura === 'cancelado' ? (
                              <span className="inline-block text-[10px] font-extrabold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                                ❌ Assinatura Cancelada
                              </span>
                            ) : daysLeft < 0 ? (
                              <span className="inline-block text-[10px] font-extrabold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                                🚨 Vencido há {Math.abs(daysLeft)}d!
                              </span>
                            ) : daysLeft <= 5 ? (
                              <span className="inline-block text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                ⚠️ Vence em {daysLeft === 0 ? 'HOJE' : `${daysLeft}d`}
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                🟢 Em dia ({daysLeft}d)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {isEditing ? (
                          <button
                            onClick={() => handleSaveBillingStatus(c.codigoAtivacao)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer inline-flex items-center space-x-1 shadow-xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Salvar</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-end space-x-1">
                            {/* WhatsApp Ready Messages Modal Launcher */}
                            <button
                              onClick={() => handleOpenWhatsAppModal(c)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1 shadow-xs"
                              title="Abrir mensagens prontas para enviar pelo WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>

                            <button
                              onClick={() => handleStartEdit(c)}
                              className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#111111] font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1"
                              title="Alterar Mensalidade, Status ou Vencimento"
                            >
                              <Sliders className="w-3.5 h-3.5 text-[#FF6B00]" />
                              <span>Editar</span>
                            </button>

                            <button
                              onClick={() => handleToggleSuspension(c.codigoAtivacao, c.empresa)}
                              className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1 ${
                                fin.statusAssinatura === 'suspenso' || fin.statusAssinatura === 'cancelado'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-red-50 hover:bg-red-100 text-red-600'
                              }`}
                              title={fin.statusAssinatura === 'suspenso' || fin.statusAssinatura === 'cancelado' ? 'Reativar Assinatura' : 'Cancelar / Suspender Assinatura'}
                            >
                              <AlertOctagon className="w-3.5 h-3.5" />
                              <span>{fin.statusAssinatura === 'suspenso' || fin.statusAssinatura === 'cancelado' ? 'Reativar' : 'Cancelar'}</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Enviar / Ativar Mensalidade via Asaas */}
      {sendSubModalCompany && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#111111]">Enviar Cobrança de Mensalidade</h3>
                  <p className="text-xs text-gray-500 font-medium">{sendSubModalCompany.empresa}</p>
                </div>
              </div>
              <button
                onClick={() => setSendSubModalCompany(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Valor da Mensalidade (R$)
                </label>
                <input
                  type="number"
                  value={sendSubValue}
                  onChange={(e) => setSendSubValue(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-[#111111] focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  placeholder="199"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Vencimento da 1ª Mensalidade (Data que começa a contar)
                </label>
                <input
                  type="date"
                  value={sendSubDueDate}
                  onChange={(e) => setSendSubDueDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-[#111111] focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 text-[11px] leading-relaxed">
                <p className="font-bold mb-0.5">Assinatura Mensal Recorrente:</p>
                <p>O 1º boleto no valor de <strong>R$ {sendSubValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> será enviado para <strong>{sendSubModalCompany.email}</strong> com vencimento em <strong>{formatDateToBR(sendSubDueDate)}</strong>. O Asaas continuará enviando mensalmente a partir desta data.</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSendSubModalCompany(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                disabled={isSendingSub}
              >
                Cancelar
              </button>
              <button
                onClick={handleSendMonthlyBoleto}
                disabled={isSendingSub}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSendingSub ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Ativando Recorrência...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Enviar & Ativar no Asaas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



