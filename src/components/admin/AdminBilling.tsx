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
} from 'lucide-react';
import { BakeryCompany, BillingStatus, FinancialStats } from '../../types';
import { StorageService } from '../../services/storageService';
import { calculateDaysRemaining, formatDateToBR, formatDateToISO } from '../../utils/dateUtils';
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
  const [editValorImp, setEditValorImp] = useState<number>(1500);
  const [editValorMensal, setEditValorMensal] = useState<number>(199);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStartEdit = (company: BakeryCompany) => {
    setEditingCode(company.codigoAtivacao);
    setEditStatus(company.financeiro?.statusAssinatura || 'pendente');
    setEditDueDate(company.financeiro?.dataProximaCobranca || formatDateToISO(new Date()));
    setEditValorImp(company.financeiro?.valorImplementacao || 1500);
    setEditValorMensal(company.financeiro?.valorMensalidade || 199);
  };

  const handleSaveBillingStatus = (code: string) => {
    StorageService.updateCompanyBilling(code, {
      statusAssinatura: editStatus,
      dataProximaCobranca: editDueDate,
      valorImplementacao: Number(editValorImp) || 1500,
      valorMensalidade: Number(editValorMensal) || 199,
    });
    setEditingCode(null);
    onRefresh();
    showToast(`Status, datas e valores financeiros atualizados com sucesso!`);
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

  const handleMarkAsPaid = (code: string) => {
    StorageService.updateCompanyBilling(code, {
      implementacaoPaga: true,
      statusAssinatura: 'ativo',
      dataPagamentoImplementacao: new Date().toISOString(),
    });
    onRefresh();
    showToast(`Pagamento de implementação e ativação confirmados!`);
  };

  const handleSimulateWebhook = async (company: BakeryCompany, eventType: 'PAYMENT_CONFIRMED' | 'SUBSCRIPTION_DELETED') => {
    try {
      showToast(`Enviando evento de Webhook Asaas (${eventType})...`);
      const payload = {
        event: eventType,
        payment: {
          id: 'pay_test_' + Date.now(),
          customer: company.financeiro?.asaasCustomerId || 'cus_test',
          subscription: company.financeiro?.asaasSubscriptionId || 'sub_test',
          value: company.financeiro?.valorMensalidade || 199,
          status: eventType === 'PAYMENT_CONFIRMED' ? 'CONFIRMED' : 'CANCELLED',
          description: 'Mensalidade Assinatura PADARIA.io - Pagamento Confirmado',
        },
        subscription: {
          id: company.financeiro?.asaasSubscriptionId || 'sub_test',
          customer: company.financeiro?.asaasCustomerId || 'cus_test',
          status: eventType === 'PAYMENT_CONFIRMED' ? 'ACTIVE' : 'INACTIVE',
        },
      };

      const res = await fetch('/api/asaas/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      onRefresh();
      if (data.processed) {
        showToast(`⚡ Webhook processado! Status da ${company.empresa} alterado para '${data.updatedStatus}' na Firestore.`);
      } else {
        showToast(`Webhook executado: ${data.message}`);
      }
    } catch (err: any) {
      showToast(`Erro ao simular webhook: ${err.message}`);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Receita Implantação / Setup */}
        <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Setup Implantação</p>
            <p className="text-3xl font-black text-[#FF6B00] mt-1">
              R$ {(stats.receitaImplementacaoPendente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] font-bold text-emerald-600 mt-1">
              R$ {(stats.receitaImplementacaoPaga || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Recebido
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Receipt className="w-6 h-6" />
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
                <th className="py-3 px-4">Setup Implantação</th>
                <th className="py-3 px-4">Mensalidade</th>
                <th className="py-3 px-4">Status Recorrência / Asaas</th>
                <th className="py-3 px-4">Próximo Vencimento</th>
                <th className="py-3 px-4 text-right">Ações & WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[#111111]">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    Nenhuma empresa encontrada com o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => {
                  const fin = c.financeiro || {
                    implementacaoPaga: false,
                    valorImplementacao: 1500,
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
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#FF6B00]">
                        {c.codigoAtivacao}
                      </td>

                      {/* Implementation Value */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Setup (R$)</label>
                            <input
                              type="number"
                              value={editValorImp}
                              onChange={(e) => setEditValorImp(Number(e.target.value))}
                              className="w-28 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-[#FF6B00] focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {fin.implementacaoPaga ? (
                              <span className="inline-flex items-center space-x-1 text-green-700 font-bold bg-green-50 px-2.5 py-1 rounded-lg text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                <span>R$ {(fin.valorImplementacao || 1500).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Pago)</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleMarkAsPaid(c.codigoAtivacao)}
                                className="inline-flex items-center space-x-1 text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs"
                                title="Clique para confirmar pagamento da implementação"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>R$ {(fin.valorImplementacao || 1500).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Pendente)</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Monthly Fee Value */}
                      <td className="py-3.5 px-4 font-bold text-[#111111]">
                        {isEditing ? (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Mensal (R$)</label>
                            <input
                              type="number"
                              value={editValorMensal}
                              onChange={(e) => setEditValorMensal(Number(e.target.value))}
                              className="w-28 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-[#FF6B00] focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div>
                            <span className="text-sm font-black text-[#111111]">
                              R$ {(fin.valorMensalidade || 199).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-gray-400 block font-normal">/mês</span>
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
                              title="Alterar Valor de Implantação, Mensalidade, Status ou Vencimento"
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

                            {/* Asaas Webhook Test Trigger */}
                            <button
                              onClick={() => handleSimulateWebhook(c, fin.statusAssinatura === 'ativo' ? 'SUBSCRIPTION_DELETED' : 'PAYMENT_CONFIRMED')}
                              className="px-2 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6B00] font-extrabold text-[10px] transition-all cursor-pointer inline-flex items-center space-x-1 border border-orange-200"
                              title="Testar recebimento do Webhook Asaas e atualização automática na Firestore"
                            >
                              <Zap className="w-3 h-3 text-[#FF6B00]" />
                              <span>Testar Webhook</span>
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
    </div>
  );
};



