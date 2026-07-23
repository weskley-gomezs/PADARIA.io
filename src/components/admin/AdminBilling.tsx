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
import { StorageService, AsaasConfig } from '../../services/storageService';
import { calculateDaysRemaining, formatDateToBR, formatDateToISO } from '../../utils/dateUtils';

interface AdminBillingProps {
  companies: BakeryCompany[];
  stats: FinancialStats;
  onRefresh: () => void;
}

export const AdminBilling: React.FC<AdminBillingProps> = ({ companies, stats, onRefresh }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Asaas Config State
  const [asaasConfig, setAsaasConfig] = useState<AsaasConfig>(() => StorageService.getAsaasConfig());
  const [isAsaasModalOpen, setIsAsaasModalOpen] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(asaasConfig.apiKey);
  const [envInput, setEnvInput] = useState<'sandbox' | 'production'>(asaasConfig.environment);

  // Status & Due Date Editing State per Company
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<BillingStatus>('pendente');
  const [editDueDate, setEditDueDate] = useState<string>('');

  // Payment Link Modal State
  const [activePaymentModal, setActivePaymentModal] = useState<{
    isOpen: boolean;
    companyName: string;
    companyPhone?: string;
    type: 'implementacao' | 'mensalidade';
    value: number;
    link: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

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

  const handleSendInvoice = (company: BakeryCompany) => {
    const link = StorageService.sendImplementationInvoice(company.codigoAtivacao);
    onRefresh();
    const valor = company.financeiro?.valorImplementacao || 1500;
    setActivePaymentModal({
      isOpen: true,
      companyName: company.empresa,
      companyPhone: company.telefone,
      type: 'implementacao',
      value: valor,
      link,
    });
    showToast(`Fatura de Implementação R$ ${valor} gerada via Asaas para ${company.empresa}!`);
  };

  const handleGenerateBoleto = (company: BakeryCompany) => {
    const link = StorageService.generateRecurringBoleto(company.codigoAtivacao);
    onRefresh();
    const valor = company.financeiro?.valorMensalidade || 199;
    setActivePaymentModal({
      isOpen: true,
      companyName: company.empresa,
      companyPhone: company.telefone,
      type: 'mensalidade',
      value: valor,
      link,
    });
    showToast(`Cobrança Recorrente Asaas R$ ${valor} gerada para ${company.empresa}!`);
  };

  const handleShowExistingLink = (company: BakeryCompany) => {
    const fin = company.financeiro;
    if (!fin?.ultimoLinkPagamento) return;
    setActivePaymentModal({
      isOpen: true,
      companyName: company.empresa,
      companyPhone: company.telefone,
      type: fin.tipoUltimoLink || 'implementacao',
      value: fin.tipoUltimoLink === 'mensalidade' ? (fin.valorMensalidade || 199) : (fin.valorImplementacao || 1500),
      link: fin.ultimoLinkPagamento,
    });
  };

  const handleCopyLink = (linkUrl: string) => {
    navigator.clipboard.writeText(linkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenWhatsApp = (modalData: { companyName: string; companyPhone?: string; type: 'implementacao' | 'mensalidade'; value: number; link: string }) => {
    const cleanPhone = modalData.companyPhone ? modalData.companyPhone.replace(/\D/g, '') : '';
    const textMsg = `Olá, equipe da *${modalData.companyName}*! 👋\n\nSegue o link de pagamento do sistema PADARIA.io via *Asaas*:\n\n📌 *Tipo:* ${modalData.type === 'implementacao' ? 'Taxa de Implementação & Setup' : 'Assinatura Mensalidade Recorrente'}\n💰 *Valor:* R$ ${modalData.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n💳 *Opções:* PIX Instantâneo, Boleto Bancário ou Cartão de Crédito\n\n🔗 *Link para Pagamento Direto:* \n${modalData.link}\n\nQualquer dúvida, estamos à disposição no suporte PADARIA.io!`;

    const encodedMsg = encodeURIComponent(textMsg);
    const whatsappUrl = cleanPhone 
      ? `https://wa.me/55${cleanPhone}?text=${encodedMsg}`
      : `https://wa.me/?text=${encodedMsg}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleToggleSuspension = (code: string, name: string) => {
    const newStatus = StorageService.toggleCompanyBillingSuspension(code);
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

  const handleSaveAsaasConfig = () => {
    const updated = StorageService.saveAsaasConfig({
      apiKey: apiKeyInput,
      environment: envInput,
    });
    setAsaasConfig(updated);
    setIsAsaasModalOpen(false);
    showToast('Configurações do Asaas salvas com sucesso!');
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
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">R$ 199/mês por cliente</p>
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

          <button
            onClick={() => setIsAsaasModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
          >
            <Sliders className="w-4 h-4 text-blue-200" />
            <span>Configurar Gateway Asaas</span>
          </button>
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
                              <span className="inline-block text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
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
                              onClick={() => handleSendInvoice(c)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#F5E6D3] hover:bg-[#D4A574] hover:text-white text-[#2C2C2C] font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1"
                              title="Gerar & Enviar Fatura de Implementação R$ 1.500 (Asaas)"
                            >
                              <Send className="w-3 h-3 text-[#E8571A]" />
                              <span>Fatura Imp.</span>
                            </button>

                            <button
                              onClick={() => handleGenerateBoleto(c)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1"
                              title="Gerar & Enviar Assinatura PIX / Boleto Asaas R$ 199"
                            >
                              <CreditCard className="w-3 h-3 text-blue-600" />
                              <span>PIX / Asaas</span>
                            </button>

                            {fin.ultimoLinkPagamento && (
                              <button
                                onClick={() => handleShowExistingLink(c)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1 border border-emerald-200"
                                title="Ver & Copiar Último Link Asaas Gerado"
                              >
                                <Link2 className="w-3 h-3 text-emerald-600" />
                                <span>Ver Link</span>
                              </button>
                            )}

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

      {/* Asaas Integration Banner Box */}
      <div className="p-6 bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white rounded-2xl space-y-4 border border-blue-500/40 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-700/60 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-white">
                  Gateway de Pagamentos Conectado: ASAAS
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase">
                  Ativo e Homologado
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Emissão automática de PIX estático e dinâmico, boletos bancários e cartão de crédito recorrente.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAsaasModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Gerenciar Chave Asaas</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
            <p className="text-gray-400 font-semibold">Ambiente Asaas</p>
            <p className="font-extrabold text-blue-300 uppercase tracking-wide">{asaasConfig.environment}</p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
            <p className="text-gray-400 font-semibold">Webhook Ativo</p>
            <p className="font-mono text-emerald-400 text-[11px] truncate">{asaasConfig.webhookUrl}</p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
            <p className="text-gray-400 font-semibold">Chave de API Asaas</p>
            <p className="font-mono text-amber-300 text-[11px] truncate">
              {asaasConfig.apiKey ? `${asaasConfig.apiKey.substring(0, 18)}...` : 'Não configurada'}
            </p>
          </div>
        </div>
      </div>

      {/* Asaas Configuration Modal */}
      {isAsaasModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#2C2C2C]">
                    Configurar Integração ASAAS
                  </h3>
                  <p className="text-xs text-gray-500">
                    Insira suas credenciais da conta do Asaas para cobrança automatizada
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAsaasModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#2C2C2C] mb-1">
                  Ambiente de Execução
                </label>
                <select
                  value={envInput}
                  onChange={(e) => setEnvInput(e.target.value as 'sandbox' | 'production')}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-[#2C2C2C] focus:ring-2 focus:ring-blue-500"
                >
                  <option value="production">🚀 Produção (Conta Real Asaas)</option>
                  <option value="sandbox">🧪 Sandbox (Testes e Homologação)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2C2C2C] mb-1">
                  Chave API Asaas ($asaas_api_key)
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Ex: $asaas_api_key_live_..."
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#2C2C2C] focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Encontre sua chave API no painel do Asaas em Integrar -&gt; Chaves de API.
                </p>
              </div>

              <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 space-y-1">
                <p className="font-bold text-blue-900 flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>URL do Webhook de Retorno Automático</span>
                </p>
                <p className="font-mono text-[11px] text-blue-800 break-all">
                  {asaasConfig.webhookUrl}
                </p>
                <p className="text-[10px] text-blue-700">
                  Ao receber pagamentos por PIX ou boleto, o Asaas notifica este webhook e altera o status da padaria para &quot;Concluído&quot; automaticamente.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setIsAsaasModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAsaasConfig}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Credenciais Asaas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asaas Active Payment Link Modal */}
      {activePaymentModal && activePaymentModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-base text-[#2C2C2C]">
                      Link de Pagamento ASAAS
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Pronto para envio
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    Cliente: <strong className="text-[#2C2C2C]">{activePaymentModal.companyName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePaymentModal(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Invoice Info Card */}
            <div className="bg-[#FAFAF8] p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-semibold">Tipo de Cobrança:</span>
                <span className="font-extrabold text-[#2C2C2C]">
                  {activePaymentModal.type === 'implementacao'
                    ? '🛠️ Taxa de Implementação & Setup'
                    : '🔄 Assinatura Mensalidade Recorrente'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-gray-200/60 pt-2">
                <span className="text-gray-500 font-semibold">Valor Total:</span>
                <span className="font-black text-lg text-[#27AE60]">
                  R$ {activePaymentModal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-gray-200/60 pt-2">
                <span className="text-gray-500 font-semibold">Gateway / Processador:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  ASAAS (PIX / Boleto / Cartão)
                </span>
              </div>
            </div>

            {/* Link Input with 1-Click Copy */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2C2C2C] flex items-center justify-between">
                <span>Link Direto de Pagamento (Asaas Checkout):</span>
                {copiedLink && (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado com sucesso!</span>
                  </span>
                )}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={activePaymentModal.link}
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-blue-700 select-all focus:outline-none"
                />
                <button
                  onClick={() => handleCopyLink(activePaymentModal.link)}
                  className="px-4 py-2.5 bg-[#E8571A] hover:bg-[#d44e15] text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons: WhatsApp & Open Browser */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleOpenWhatsApp(activePaymentModal)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar p/ WhatsApp do Cliente</span>
              </button>

              <button
                onClick={() => window.open(activePaymentModal.link, '_blank')}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir Checkout Asaas</span>
              </button>
            </div>

            {/* Note & QR Code Preview simulation */}
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start space-x-2">
              <QrCode className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p>
                O cliente poderá pagar instantaneamente por <strong>PIX com QR Code / Copia e Cola</strong>, <strong>Boleto Bancário</strong> ou <strong>Cartão de Crédito</strong>. Quando pago, a conta da padaria é ativada automaticamente pelo Webhook Asaas.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

