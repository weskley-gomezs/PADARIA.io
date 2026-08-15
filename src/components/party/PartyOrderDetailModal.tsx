import React, { useState } from 'react';
import {
  X,
  Cake,
  Utensils,
  Candy,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  MessageSquare,
  AlertCircle,
  ChefHat,
  Package,
  Layers,
  ArrowRight,
  Printer
} from 'lucide-react';
import { PartyOrder, PartyOrderStatus } from '../../types';
import { createBakeryContactClientMessage } from '../../utils/partyOrderEngine';

interface PartyOrderDetailModalProps {
  order: PartyOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: PartyOrderStatus, nota?: string) => Promise<void>;
  bakeryName: string;
}

const STATUS_CONFIG: Record<PartyOrderStatus, { label: string; color: string; bg: string; icon: any }> = {
  NOVO: { label: 'Novo Pedido', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300', icon: Sparkles },
  EM_ANALISE: { label: 'Em Análise', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-300', icon: Clock },
  CONFIRMADO: { label: 'Confirmado', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300', icon: CheckCircle2 },
  EM_PRODUCAO: { label: 'Em Produção', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-300', icon: ChefHat },
  PRONTO: { label: 'Pronto p/ Retirada', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300', icon: Package },
  RETIRADO: { label: 'Retirado no Balcão', color: 'text-teal-700', bg: 'bg-teal-100 border-teal-300', icon: CheckCircle2 },
  ENTREGUE: { label: 'Entregue / Concluído', color: 'text-gray-700', bg: 'bg-gray-200 border-gray-300', icon: CheckCircle2 },
  CANCELADO: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-100 border-red-300', icon: AlertCircle },
};

const STATUS_SEQUENCE: PartyOrderStatus[] = ['NOVO', 'EM_ANALISE', 'CONFIRMADO', 'EM_PRODUCAO', 'PRONTO', 'ENTREGUE'];

export const PartyOrderDetailModal: React.FC<PartyOrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  bakeryName
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  if (!isOpen || !order) return null;

  const currentStatusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.NOVO;
  const currentIndex = STATUS_SEQUENCE.indexOf(order.status);
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_SEQUENCE.length - 1 ? STATUS_SEQUENCE[currentIndex + 1] : null;

  const handleAdvanceStatus = async (targetStatus: PartyOrderStatus) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(order.id, targetStatus, noteInput.trim() || undefined);
      setNoteInput('');
    } catch (e) {
      console.error('Error updating status:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const cleanPhone = order.cliente.whatsapp.replace(/\D/g, '');
  const whatsAppUrl = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}?text=${encodeURIComponent(
    createBakeryContactClientMessage(bakeryName, order.cliente.nome, order.id)
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden my-auto animate-fade-in flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black">{order.id}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${currentStatusInfo.bg} ${currentStatusInfo.color}`}>
                  {currentStatusInfo.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-300">
                Recebido em {new Date(order.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Action Ribbon: Status Stepper */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">Etapas de Produção:</span>
              {nextStatus && (
                <button
                  onClick={() => handleAdvanceStatus(nextStatus)}
                  disabled={isUpdating}
                  className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#E8571A] text-white rounded-lg text-xs font-extrabold flex items-center space-x-1 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <span>Avançar para {STATUS_CONFIG[nextStatus].label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-1 pt-1">
              {STATUS_SEQUENCE.map((s, idx) => {
                const isPastOrCurrent = currentIndex >= idx;
                const isCurrent = order.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleAdvanceStatus(s)}
                    disabled={isUpdating}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                      isCurrent
                        ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                        : isPastOrCurrent
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span>{STATUS_CONFIG[s].label}</span>
                  </button>
                );
              })}

              {order.status !== 'CANCELADO' && (
                <button
                  onClick={() => {
                    if (confirm('Deseja realmente cancelar esta encomenda?')) {
                      handleAdvanceStatus('CANCELADO');
                    }
                  }}
                  className="px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          {/* Grid: Cliente + Agendamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dados do Cliente */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2.5">
              <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-gray-600" />
                <span>Dados do Cliente</span>
              </h3>
              <div>
                <p className="text-sm font-black text-gray-900">{order.cliente.nome}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{order.cliente.whatsapp}</span>
                  </a>
                </div>
                {order.cliente.email && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>{order.cliente.email}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-500">Tipo de Entrega: </span>
                <span className="text-xs font-black text-gray-800 uppercase">
                  {order.cliente.tipoEntrega === 'entrega' ? '🚚 Entrega no Endereço' : '🏬 Retirada no Balcão'}
                </span>
                {order.cliente.enderecoEntrega && (
                  <p className="text-xs text-gray-700 mt-1 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    {order.cliente.enderecoEntrega}
                  </p>
                )}
              </div>

              {order.cliente.observacoes && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-gray-500">Observações do Cliente:</span>
                  <p className="text-xs text-gray-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-0.5">
                    {order.cliente.observacoes}
                  </p>
                </div>
              )}
            </div>

            {/* Dados do Agendamento e Valores */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2.5">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-600" />
                  <span>Data e Horário</span>
                </h3>

                <div className="bg-orange-50 p-3 rounded-xl border border-orange-200">
                  <p className="text-xs text-orange-900 font-bold">Data de Entrega/Retirada:</p>
                  <p className="text-base font-black text-[#E8571A]">
                    {order.agendamento.data.split('-').reverse().join('/')} às {order.agendamento.horario}
                  </p>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Kit ({order.kitNome}):</span>
                    <span className="font-bold">R$ {order.precoBase.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {order.valorAdicionais > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Adicionais:</span>
                      <span className="font-bold">+ R$ {order.valorAdicionais.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-gray-900 pt-1.5 border-t border-gray-200">
                    <span>Valor Total:</span>
                    <span className="text-[#E8571A]">R$ {order.valorTotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>

              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl text-center flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Conversar no WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Detalhes da Composição do Kit */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">
              Composição Escolhida do Pedido
            </h3>

            {/* 1. BOLO */}
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
              <div className="flex items-center space-x-2">
                <Cake className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-black text-gray-900">1. Bolo Personalizado</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {order.bolo.massa && (
                  <div>
                    <span className="text-gray-500 font-medium">Massa Escolhida: </span>
                    <p className="font-bold text-amber-950">{order.bolo.massa}</p>
                  </div>
                )}

                <div>
                  <span className="text-gray-500 font-medium">Recheios Escolhidos: </span>
                  <p className="font-bold text-gray-900">
                    {order.bolo.recheiosEscolhidos.join(' + ') || 'Não especificado'}
                  </p>
                </div>

                {order.bolo.publicoAlvo && (
                  <div>
                    <span className="text-gray-500 font-medium">Público / Estilo: </span>
                    <span className="font-bold text-gray-900">{order.bolo.publicoAlvo}</span>
                  </div>
                )}

                {order.bolo.tema && (
                  <div>
                    <span className="text-gray-500 font-medium">Tema: </span>
                    <span className="font-bold text-gray-900">{order.bolo.tema}</span>
                  </div>
                )}

                {(order.bolo.cor || order.bolo.corPersonalizada) && (
                  <div>
                    <span className="text-gray-500 font-medium">Cor Predominante: </span>
                    <span className="font-bold text-gray-900">
                      {order.bolo.corPersonalizada || order.bolo.cor}
                    </span>
                  </div>
                )}

                {order.bolo.nomeAniversariante && (
                  <div>
                    <span className="text-gray-500 font-medium">Nome Aniversariante: </span>
                    <span className="font-bold text-gray-900">{order.bolo.nomeAniversariante}</span>
                  </div>
                )}

                {order.bolo.idadeAniversariante !== undefined && order.bolo.idadeAniversariante > 0 && (
                  <div>
                    <span className="text-gray-500 font-medium">Idade: </span>
                    <span className="font-bold text-gray-900">{order.bolo.idadeAniversariante} anos</span>
                  </div>
                )}
              </div>

              {order.bolo.mensagem && (
                <div className="pt-2 border-t border-amber-200/60 text-xs">
                  <span className="text-gray-500 font-medium">Mensagem no Bolo: </span>
                  <span className="font-bold text-gray-900">"{order.bolo.mensagem}"</span>
                </div>
              )}

              {order.bolo.detalhesEspeciais && (
                <div className="pt-1 text-xs">
                  <span className="text-gray-500 font-medium">Detalhes Especiais: </span>
                  <span className="text-gray-800">{order.bolo.detalhesEspeciais}</span>
                </div>
              )}

              {order.bolo.enviaraInspiracaoWhatsApp && (
                <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cliente marcou que enviará a foto de inspiração pelo WhatsApp.</span>
                </div>
              )}
            </div>

            {/* 2. SALGADOS */}
            <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Utensils className="w-4 h-4 text-orange-700" />
                  <h4 className="text-xs font-black text-gray-900">
                    2. Salgados ({order.salgados.total} unidades)
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {order.salgados.distribuicao.map((item, i) => (
                  <div key={i} className="p-2 bg-white rounded-lg border border-orange-200 text-xs">
                    <p className="font-bold text-gray-900 truncate">{item.sabor}</p>
                    <p className="text-[#E8571A] font-black">{item.quantidade} un</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. DOCINHOS */}
            <div className="p-4 bg-pink-50/50 rounded-xl border border-pink-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Candy className="w-4 h-4 text-pink-700" />
                  <h4 className="text-xs font-black text-gray-900">
                    3. Docinhos ({order.docinhos.total} unidades)
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {order.docinhos.distribuicao.map((item, i) => (
                  <div key={i} className="p-2 bg-white rounded-lg border border-pink-200 text-xs">
                    <p className="font-bold text-gray-900 truncate">{item.sabor}</p>
                    <p className="text-pink-600 font-black">{item.quantidade} un</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. ADICIONAIS */}
            {order.adicionaisEscolhidos && order.adicionaisEscolhidos.length > 0 && (
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-blue-700" />
                  <h4 className="text-xs font-black text-gray-900">4. Itens Adicionais</h4>
                </div>

                <div className="space-y-1">
                  {order.adicionaisEscolhidos.map((add, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-blue-200">
                      <span className="font-bold text-gray-800">
                        {add.quantidade}x {add.nome}
                      </span>
                      <span className="font-black text-blue-700">
                        R$ {(add.preco * add.quantidade).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Histórico de Status */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="border-t border-gray-200 pt-3">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Histórico de Alterações
              </h4>
              <div className="space-y-1.5 text-xs text-gray-600">
                {order.statusHistory.map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-gray-800">{STATUS_CONFIG[h.status]?.label || h.status}</span>
                      {h.nota && <span className="text-gray-500 italic">({h.nota})</span>}
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {new Date(h.changedAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Ficha de Produção</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
