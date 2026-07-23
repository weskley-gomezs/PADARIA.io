import React, { useState } from 'react';
import { X, HelpCircle, Send, CheckCircle2, AlertCircle, LifeBuoy } from 'lucide-react';
import { TicketPriority, SupportTicket } from '../types';
import { StorageService } from '../services/storageService';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bakeryCode: string;
  empresaNome: string;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  bakeryCode,
  empresaNome,
}) => {
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<TicketPriority>('normal');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [activeTab, setActiveTab] = useState<'novo' | 'historico'>('novo');

  if (!isOpen) return null;

  const handleOpenModal = () => {
    setMyTickets(StorageService.getTickets(bakeryCode));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!assunto.trim() || !descricao.trim()) {
      setErrorMsg('Por favor, preencha o assunto e a descrição do problema.');
      return;
    }

    try {
      StorageService.createTicket(bakeryCode, empresaNome, assunto, descricao, prioridade);
      setIsSuccess(true);
      setAssunto('');
      setDescricao('');
      setPrioridade('normal');
      setMyTickets(StorageService.getTickets(bakeryCode));
      setTimeout(() => {
        setIsSuccess(false);
        setActiveTab('historico');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao enviar ticket de suporte.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-[#E0E0E0] shadow-2xl space-y-0 animate-scale-up">
        {/* Header */}
        <div className="bg-[#2C2C2C] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#D4A574] text-white rounded-xl">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Central de Suporte Padaria.io</h3>
              <p className="text-xs text-[#D4A574]">
                {empresaNome} • Código: {bakeryCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-[#FAFAF8]">
          <button
            onClick={() => setActiveTab('novo')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'novo'
                ? 'border-[#E8571A] text-[#E8571A] bg-white'
                : 'border-transparent text-gray-500 hover:text-[#2C2C2C]'
            }`}
          >
            Novo Ticket de Suporte
          </button>
          <button
            onClick={() => {
              setActiveTab('historico');
              setMyTickets(StorageService.getTickets(bakeryCode));
            }}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'historico'
                ? 'border-[#E8571A] text-[#E8571A] bg-white'
                : 'border-transparent text-gray-500 hover:text-[#2C2C2C]'
            }`}
          >
            Meus Chamados ({StorageService.getTickets(bakeryCode).length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'novo' ? (
            <div>
              {isSuccess ? (
                <div className="p-8 text-center space-y-3 bg-green-50 rounded-2xl border border-green-200">
                  <CheckCircle2 className="w-12 h-12 text-[#27AE60] mx-auto animate-bounce" />
                  <h4 className="text-lg font-extrabold text-[#27AE60]">Solicitação Enviada!</h4>
                  <p className="text-xs text-gray-600">
                    Sua equipe de suporte recebeu o chamado. Responderemos em até 24h comerciais.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2C2C2C] mb-1">Assunto / Título *</label>
                    <input
                      type="text"
                      value={assunto}
                      onChange={(e) => setAssunto(e.target.value)}
                      placeholder="Ex: Dúvida no treinamento / Sistema fora do ar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                      Prioridade do Problema
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPrioridade('normal')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          prioridade === 'normal'
                            ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-500'
                        }`}
                      >
                        🟡 Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrioridade('urgente')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          prioridade === 'urgente'
                            ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-500'
                        }`}
                      >
                        🟠 Urgente
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrioridade('critica')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          prioridade === 'critica'
                            ? 'bg-red-50 border-red-500 text-red-700 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-500'
                        }`}
                      >
                        🔴 Crítica
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                      Descrição Detalhada do Problema *
                    </label>
                    <textarea
                      rows={4}
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Descreva detalhadamente o que ocorreu, tela ou horário..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                      required
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-200">
                      {errorMsg}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#E8571A] hover:bg-[#d44e15] text-white font-extrabold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar Solicitação</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {myTickets.length === 0 ? (
                <div className="text-center py-8 text-gray-400 space-y-1">
                  <HelpCircle className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-xs font-bold">Nenhum chamado aberto ainda.</p>
                </div>
              ) : (
                myTickets.map((t) => (
                  <div key={t.id} className="p-4 bg-[#FAFAF8] border border-gray-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-[#2C2C2C]">{t.assunto}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.status === 'resolvido'
                            ? 'bg-green-100 text-green-700'
                            : t.status === 'em_andamento'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {t.status === 'resolvido' ? '✅ Resolvido' : t.status === 'em_andamento' ? '⏳ Em Andamento' : '🔴 Aberto'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2">{t.descricao}</p>

                    {t.respostaSuporte && (
                      <div className="p-3 bg-white border-l-4 border-[#D4A574] rounded-r-xl text-xs text-[#2C2C2C]">
                        <strong className="block text-[11px] text-[#D4A574] uppercase">Resposta do Suporte:</strong>
                        {t.respostaSuporte}
                      </div>
                    )}

                    <div className="text-[10px] text-gray-400 pt-1 flex justify-between">
                      <span>Prioridade: {t.prioridade.toUpperCase()}</span>
                      <span>Criado em: {new Date(t.dataCriacao).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
