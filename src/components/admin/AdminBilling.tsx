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
} from 'lucide-react';
import { BakeryCompany, BillingStatus, FinancialStats } from '../../types';
import { StorageService } from '../../services/storageService';
import { calculateDaysRemaining, formatDateToBR, formatDateToISO } from '../../utils/dateUtils';

interface AdminBillingProps {
  companies: BakeryCompany[];
  stats: FinancialStats;
  onRefresh: () => void;
}

export const AdminBilling: React.FC<AdminBillingProps> = ({ companies, stats, onRefresh }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Status & Due Date Editing State per Company
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<BillingStatus>('pendente');
  const [editDueDate, setEditDueDate] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStartEdit = (company: BakeryCompany) => {
    setEditingCode(company.codigoAtivacao);
    setEditStatus(company.financeiro?.statusAssinatura || 'pendente');
    setEditDueDate(company.financeiro?.dataProximaCobranca || formatDateToISO(new Date()));
  };

  const handleSaveBillingStatus = (code: string) => {
    StorageService.updateCompanyBillingStatus(code, editStatus, editDueDate);
    setEditingCode(null);
    onRefresh();
    showToast(`Status e data de vencimento atualizados com sucesso!`);
  };

  const handleToggleSuspension = async (code: string, name: string) => {
    const newStatus = await StorageService.toggleCompanyBillingSuspension(code);
    onRefresh();
    if (newStatus === 'suspenso') {
      showToast(`Acesso da padaria ${name} SUSPENSO por inadimplência!`);
    } else {
      showToast(`Acesso da padaria ${name} REATIVADO com sucesso!`);
    }
  };

  const handleMarkAsPaid = (code: string) => {
    StorageService.updateCompanyBilling(code, {
      implementacaoPaga: true,
      statusAssinatura: 'concluido',
      dataPagamentoImplementacao: new Date().toISOString(),
    });
    onRefresh();
    showToast(`Pagamento de implementação confirmado! Status alterado para Concluído.`);
  };

  // Calculate alert counts
  const overdueCompanies = companies.filter((c) => {
    const dateStr = c.financeiro?.dataProximaCobranca;
    if (!dateStr) return false;
    return calculateDaysRemaining(dateStr) < 0 && c.financeiro?.statusAssinatura !== 'suspenso';
  });

  const dueSoonCompanies = companies.filter((c) => {
    const dateStr = c.financeiro?.dataProximaCobranca;
    if (!dateStr) return false;
    const days = calculateDaysRemaining(dateStr);
    return days >= 0 && days <= 5 && c.financeiro?.statusAssinatura !== 'suspenso';
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#2C2C2C] text-white px-5 py-3.5 rounded-2xl border border-[#D4A574] shadow-2xl flex items-center space-x-3 text-xs animate-fade-in">
          <Zap className="w-4 h-4 text-[#D4A574]" />
          <span className="font-bold">{toastMessage}</span>
        </div>
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
                Alertas do Sistema de Cobranças
              </p>
              <p className="text-xs text-amber-900 font-medium">
                {overdueCompanies.length > 0 && (
                  <span className="text-red-700 font-bold mr-2">
                    🔴 {overdueCompanies.length} padaria(s) VENCIDA(S)!
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
            Acompanhe na tabela abaixo
          </span>
        </div>
      )}

      {/* Dashboard Financeiro Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clientes Ativos */}
        <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Clientes Concluídos / Ativos</p>
            <p className="text-3xl font-black text-[#27AE60] mt-1">{stats.totalClientesAtivos}</p>
            <p className="text-[11px] text-gray-400 mt-1">Assinaturas adimplentes</p>
          </div>
          <div className="p-3 bg-green-50 text-[#27AE60] rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* MRR */}
        <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receita Recorrente (MRR)</p>
            <p className="text-3xl font-black text-[#2C2C2C] mt-1">
              R$ {stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-orange-600 font-semibold mt-1">R$ 199/mês por cliente</p>
          </div>
          <div className="p-3 bg-[#F5E6D3] text-[#D4A574] rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Implementações Pendentes */}
        <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Implementações Pendentes</p>
            <p className="text-3xl font-black text-[#E8571A] mt-1">
              R$ {stats.receitaImplementacaoPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">R$ 1.500 setup/cliente</p>
          </div>
          <div className="p-3 bg-orange-50 text-[#E8571A] rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Próximos Vencimentos */}
        <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vencimentos Próximos</p>
            <p className="text-3xl font-black text-[#2C2C2C] mt-1">{dueSoonCompanies.length + overdueCompanies.length}</p>
            <p className="text-[11px] text-gray-400 mt-1">Requer atenção comercial</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#2C2C2C]">Gestão de Status de Faturamento e Vencimentos</h2>
            <p className="text-xs text-gray-500">
              Altere o status de &quot;Em Configuração&quot; para &quot;Concluído&quot;, defina as datas de vencimento mensais e receba alertas automáticos
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAFAF8] text-gray-500 font-extrabold uppercase tracking-wider border-b border-gray-200">
                <th className="py-3 px-4">Padaria</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Implementação</th>
                <th className="py-3 px-4">Status Atual</th>
                <th className="py-3 px-4">Data de Vencimento</th>
                <th className="py-3 px-4 text-right">Ações & Alteração de Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[#2C2C2C]">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Nenhuma padaria cadastrada no sistema.
                  </td>
                </tr>
              ) : (
                companies.map((c) => {
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
                      {/* Padaria Name */}
                      <td className="py-3.5 px-4 font-bold">
                        <div className="text-sm font-extrabold text-[#2C2C2C]">{c.empresa}</div>
                        <div className="text-[10px] text-gray-400">{c.email}</div>
                        {c.cnpj && (
                          <div className="text-[10px] text-gray-500 font-mono">CNPJ: {c.cnpj}</div>
                        )}
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#E8571A]">
                        {c.codigoAtivacao}
                      </td>

                      {/* Implementation */}
                      <td className="py-3.5 px-4">
                        {fin.implementacaoPaga ? (
                          <span className="inline-flex items-center space-x-1 text-green-700 font-bold bg-green-50 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            <span>R$ 1.500 (Pago)</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMarkAsPaid(c.codigoAtivacao)}
                            className="inline-flex items-center space-x-1 text-amber-700 font-bold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            title="Clique para confirmar pagamento de R$ 1.500"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>R$ 1.500 (Pendente)</span>
                          </button>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as BillingStatus)}
                            className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-2 focus:ring-[#E8571A] focus:outline-none"
                          >
                            <option value="pendente">⏳ Em Configuração</option>
                            <option value="concluido">✅ Concluído / Ativo</option>
                            <option value="vencendo">🟡 Vencendo em breve</option>
                            <option value="vencido">🔴 Inadimplente / Vencido</option>
                            <option value="suspenso">⛔ Suspenso</option>
                          </select>
                        ) : (
                          <div>
                            {(fin.statusAssinatura === 'concluido' || fin.statusAssinatura === 'ativo') && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-green-100 text-[#27AE60] uppercase inline-flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>Concluído / Ativo</span>
                              </span>
                            )}
                            {fin.statusAssinatura === 'pendente' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase inline-flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Em Configuração</span>
                              </span>
                            )}
                            {fin.statusAssinatura === 'vencendo' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 uppercase inline-flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Vencendo Em Breve</span>
                              </span>
                            )}
                            {fin.statusAssinatura === 'vencido' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 uppercase inline-flex items-center space-x-1 animate-pulse">
                                <AlertOctagon className="w-3 h-3" />
                                <span>Inadimplente / Vencido</span>
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

                      {/* Next Billing Date & Alert Badge */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-mono focus:ring-2 focus:ring-[#E8571A] focus:outline-none"
                          />
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5 font-mono font-bold text-gray-800">
                              <Calendar className="w-3.5 h-3.5 text-[#E8571A]" />
                              <span>{formatDateToBR(fin.dataProximaCobranca)}</span>
                            </div>

                            {/* Dynamic Alert Badges */}
                            {daysLeft < 0 ? (
                              <span className="inline-block text-[10px] font-extrabold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                                🚨 Vencido há {Math.abs(daysLeft)} dia(s)!
                              </span>
                            ) : daysLeft <= 5 ? (
                              <span className="inline-block text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                ⚠️ Vence em {daysLeft === 0 ? 'HOJE' : `${daysLeft} dia(s)`}
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded">
                                🟢 Em dia ({daysLeft}d restantes)
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
                            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition-all cursor-pointer inline-flex items-center space-x-1 shadow-xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Salvar</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(c)}
                              className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#2C2C2C] font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1"
                              title="Alterar Status ou Vencimento"
                            >
                              <Sliders className="w-3 h-3 text-[#E8571A]" />
                              <span>Editar Status</span>
                            </button>

                            <button
                              onClick={() => handleToggleSuspension(c.codigoAtivacao, c.empresa)}
                              className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1 ${
                                fin.statusAssinatura === 'suspenso'
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-red-50 hover:bg-red-100 text-red-600'
                              }`}
                            >
                              <AlertOctagon className="w-3 h-3" />
                              <span>{fin.statusAssinatura === 'suspenso' ? 'Reativar' : 'Suspender'}</span>
                            </button>
                          </>
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

