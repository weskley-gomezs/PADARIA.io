import React from 'react';
import { X, AlertTriangle, Clock, CheckCircle2, PackageCheck } from 'lucide-react';
import { Product } from '../types';
import { formatDateToBR, getRelativeExpirationText } from '../utils/dateUtils';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expiredProducts: Product[];
  expiringProducts: Product[];
  onMarkAsSold: (id: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  expiredProducts,
  expiringProducts,
  onMarkAsSold,
}) => {
  if (!isOpen) return null;

  const total = expiredProducts.length + expiringProducts.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E0E0E0] space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 text-[#E74C3C] rounded-xl">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#2C2C2C]">Alertas de Validade Crítica</h3>
              <p className="text-xs text-gray-500">{total} itens necessitam de atenção na panificadora</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto space-y-4 pr-1 grow">
          {/* Expired items section */}
          {expiredProducts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E74C3C] uppercase tracking-wider flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Produtos Vencidos ({expiredProducts.length})</span>
                </span>
                <span className="text-[10px] text-red-500 font-semibold">Remover das prateleiras</span>
              </div>

              <div className="space-y-2">
                {expiredProducts.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#2C2C2C]">{item.nome}</p>
                      <div className="text-gray-500 space-x-2">
                        <span>Qtd: <strong>{item.quantidade} un</strong></span>
                        <span>•</span>
                        <span className="text-red-600 font-bold">
                          {getRelativeExpirationText(item.diasParaVencer)} ({formatDateToBR(item.dataValidade)})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onMarkAsSold(item.id)}
                      className="px-2.5 py-1.5 bg-[#27AE60] hover:bg-green-700 text-white font-bold rounded-lg shrink-0 flex items-center space-x-1 transition-all"
                      title="Marcar como Baixado/Vendido"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Baixar</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiring soon items section */}
          {expiringProducts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F39C12] uppercase tracking-wider flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Vencendo nos próximos 3 dias ({expiringProducts.length})</span>
                </span>
                <span className="text-[10px] text-amber-600 font-semibold">Aplicar desconto ou promoção</span>
              </div>

              <div className="space-y-2">
                {expiringProducts.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#2C2C2C]">{item.nome}</p>
                      <div className="text-gray-500 space-x-2">
                        <span>Qtd: <strong>{item.quantidade} un</strong></span>
                        <span>•</span>
                        <span className="text-amber-700 font-bold">
                          {getRelativeExpirationText(item.diasParaVencer)} ({formatDateToBR(item.dataValidade)})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onMarkAsSold(item.id)}
                      className="px-2.5 py-1.5 bg-[#27AE60] hover:bg-green-700 text-white font-bold rounded-lg shrink-0 flex items-center space-x-1 transition-all"
                      title="Marcar como Vendido"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Vendido</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {total === 0 && (
            <div className="text-center py-10 space-y-2">
              <div className="w-12 h-12 bg-green-100 text-[#27AE60] rounded-full mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#2C2C2C]">Tudo em dia!</p>
              <p className="text-xs text-gray-500">Nenhum produto vencido ou com validade próxima no momento.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2C2C2C] hover:bg-black text-white font-bold text-xs rounded-xl transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
