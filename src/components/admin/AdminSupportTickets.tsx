import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Send,
  Building2,
  Filter,
} from 'lucide-react';
import { SupportTicket, TicketStatus } from '../../types';
import { StorageService } from '../../services/storageService';

interface AdminSupportTicketsProps {
  onRefresh: () => void;
}

export const AdminSupportTickets: React.FC<AdminSupportTicketsProps> = ({ onRefresh }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  React.useEffect(() => {
    const unsub = StorageService.subscribeTickets((updatedTickets) => {
      setTickets(updatedTickets);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    await StorageService.updateTicketStatus(ticketId, newStatus);
    onRefresh();
    showToast('Status do chamado atualizado com sucesso!');
  };

  const handleSendReply = async (e: React.FormEvent, ticketId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    await StorageService.updateTicketStatus(ticketId, 'resolvido', replyText.trim());
    setReplyText('');
    setReplyingTicketId(null);
    onRefresh();
    showToast('Resposta enviada e chamado resolvido!');
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const pendingCount = tickets.filter((t) => t.status === 'aberto').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="p-3 bg-[#2C2C2C] text-[#D4A574] rounded-xl text-xs font-bold border border-[#D4A574] animate-bounce">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-6 h-6 text-[#E8571A]" />
            <h2 className="text-xl font-extrabold text-[#2C2C2C]">Atendimento & Tickets de Suporte</h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-black">
                {pendingCount} PENDENTES
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Gerencie dúvidas, erros e solicitações abertas pelas panificadoras parceiras
          </p>
        </div>

        {/* Filter Pills */}
        <div className="bg-[#FAFAF8] p-1.5 rounded-xl border border-gray-200 flex text-xs font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-[#2C2C2C] text-white'
                : 'text-gray-500 hover:text-[#2C2C2C]'
            }`}
          >
            Todos ({tickets.length})
          </button>
          <button
            onClick={() => setStatusFilter('aberto')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'aberto'
                ? 'bg-red-500 text-white'
                : 'text-gray-500 hover:text-red-600'
            }`}
          >
            Abertos ({tickets.filter((t) => t.status === 'aberto').length})
          </button>
          <button
            onClick={() => setStatusFilter('em_andamento')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'em_andamento'
                ? 'bg-amber-500 text-white'
                : 'text-gray-500 hover:text-amber-600'
            }`}
          >
            Em Andamento ({tickets.filter((t) => t.status === 'em_andamento').length})
          </button>
          <button
            onClick={() => setStatusFilter('resolvido')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'resolvido'
                ? 'bg-[#27AE60] text-white'
                : 'text-gray-500 hover:text-[#27AE60]'
            }`}
          >
            Resolvidos ({tickets.filter((t) => t.status === 'resolvido').length})
          </button>
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-[#E0E0E0] text-gray-400">
            <CheckCircle2 className="w-10 h-10 mx-auto text-[#27AE60] mb-2" />
            <p className="font-bold text-sm">Nenhum chamado de suporte nesta categoria.</p>
          </div>
        ) : (
          filteredTickets.map((t) => (
            <div
              key={t.id}
              className={`bg-white p-6 rounded-2xl border transition-all space-y-4 shadow-xs ${
                t.status === 'aberto'
                  ? 'border-l-4 border-l-red-500 border-gray-200'
                  : t.status === 'em_andamento'
                  ? 'border-l-4 border-l-amber-500 border-gray-200'
                  : 'border-l-4 border-l-[#27AE60] border-gray-200 opacity-80'
              }`}
            >
              {/* Ticket Top bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-extrabold text-base text-[#2C2C2C]">{t.assunto}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      t.prioridade === 'critica'
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : t.prioridade === 'urgente'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    🔥 Prioridade: {t.prioridade.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-500 flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-[#D4A574]" />
                    <span>{t.empresaNome}</span>
                  </span>
                  <span className="text-[11px] text-gray-400">
                    ({new Date(t.dataCriacao).toLocaleDateString('pt-BR')})
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="text-xs text-gray-700 bg-[#FAFAF8] p-4 rounded-xl border border-gray-100 whitespace-pre-wrap">
                {t.descricao}
              </div>

              {/* Existing Support Reply */}
              {t.respostaSuporte && (
                <div className="p-4 bg-emerald-50/50 border-l-4 border-l-[#27AE60] rounded-r-xl text-xs space-y-1">
                  <strong className="text-[#27AE60] font-black uppercase tracking-wider block">
                    Resposta Enviada pelo Administrador:
                  </strong>
                  <p className="text-gray-800">{t.respostaSuporte}</p>
                </div>
              )}

              {/* Reply Form / Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-400">Status:</span>
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'aberto')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      t.status === 'aberto' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Aberto
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'em_andamento')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      t.status === 'em_andamento' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Em Andamento
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'resolvido')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      t.status === 'resolvido' ? 'bg-[#27AE60] text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Resolvido
                  </button>
                </div>

                {replyingTicketId !== t.id ? (
                  <button
                    onClick={() => {
                      setReplyingTicketId(t.id);
                      setReplyText(t.respostaSuporte || '');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#D4A574]" />
                    <span>Responder Chamado</span>
                  </button>
                ) : (
                  <form
                    onSubmit={(e) => handleSendReply(e, t.id)}
                    className="w-full sm:w-auto flex items-center space-x-2"
                  >
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Digite a resposta para o cliente..."
                      className="px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] w-full sm:w-80"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-[#27AE60] hover:bg-green-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center space-x-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
