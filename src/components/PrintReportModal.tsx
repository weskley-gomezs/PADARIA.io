import React, { useState } from 'react';
import { X, Printer, ChefHat, Filter } from 'lucide-react';
import { Product, BakeryCompany } from '../types';
import { formatDateToBR, getRelativeExpirationText } from '../utils/dateUtils';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: BakeryCompany;
  products: Product[];
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  company,
  products,
}) => {
  const [periodFilter, setPeriodFilter] = useState<'todos' | 'dia' | 'semana' | 'mes'>('todos');

  if (!isOpen) return null;

  const expiredList = products.filter((p) => p.status === 'vencido');
  const expiringList = products.filter((p) => p.status === 'vencendo');
  const normalList = products.filter((p) => p.status === 'normal');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentYearMonth = todayStr.substring(0, 7);

  const filteredExpiredList = expiredList.filter((item) => {
    if (periodFilter === 'todos') return true;
    if (periodFilter === 'dia') {
      return item.dataValidade === todayStr || item.dataCadastro === todayStr;
    }
    if (periodFilter === 'mes') {
      return (
        (item.dataValidade && item.dataValidade.startsWith(currentYearMonth)) ||
        (item.dataCadastro && item.dataCadastro.startsWith(currentYearMonth)) ||
        item.status === 'vencido'
      );
    }
    if (periodFilter === 'semana') {
      if (item.dataValidade === todayStr || item.dataCadastro === todayStr) return true;
      const refDate = item.dataCadastro || item.dataValidade;
      if (!refDate) return false;
      const itemDate = new Date(refDate).getTime();
      const now = new Date().getTime();
      const diffDays = Math.abs((now - itemDate) / (1000 * 3600 * 24));
      return diffDays <= 7 || item.status === 'vencido';
    }
    return true;
  });

  const totalExpiredValue = filteredExpiredList.reduce(
    (acc, p) => acc + (p.valorTotal || p.quantidade * (p.valorKg || 12)),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  const todayFormatted = formatDateToBR(todayStr);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-[#E0E0E0] space-y-4 sm:space-y-6 max-h-[95vh] sm:max-h-[90vh] flex flex-col print:max-w-none print:w-full print:h-auto print:shadow-none print:border-none print:p-0">
        {/* Actions bar (hidden during print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-3 print:hidden">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center space-x-2">
              <Printer className="w-5 h-5 text-[#E8571A]" />
              <h3 className="text-base sm:text-lg font-extrabold text-[#2C2C2C]">Relatório de Produtos Vencidos</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 sm:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Filter Buttons */}
            <div className="bg-gray-100 p-1 rounded-xl flex text-xs font-bold overflow-x-auto no-scrollbar w-full sm:w-auto justify-between">
              <button
                onClick={() => setPeriodFilter('todos')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all min-h-[36px] ${
                  periodFilter === 'todos' ? 'bg-[#2C2C2C] text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setPeriodFilter('dia')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all min-h-[36px] ${
                  periodFilter === 'dia' ? 'bg-[#E8571A] text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setPeriodFilter('semana')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all min-h-[36px] ${
                  periodFilter === 'semana' ? 'bg-[#E8571A] text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setPeriodFilter('mes')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all min-h-[36px] ${
                  periodFilter === 'mes' ? 'bg-[#E8571A] text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                Mês
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none px-4 py-2 bg-[#D4A574] hover:bg-[#c29363] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition-all min-h-[38px] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Salvar PDF</span>
              </button>
              <button onClick={onClose} className="hidden sm:block p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="overflow-y-auto space-y-4 sm:space-y-6 pr-1 grow print:overflow-visible">
          {/* Header Document */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#2C2C2C] pb-4 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2C2C2C] text-[#D4A574] rounded-xl flex items-center justify-center shrink-0">
                <ChefHat className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#2C2C2C] leading-tight">{company.empresa}</h2>
                <p className="text-xs text-gray-500">
                  Código: <strong>{company.codigoAtivacao}</strong> | Contato: {company.email}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs bg-gray-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-gray-200">
              <p className="font-extrabold text-[#2C2C2C]">RELATÓRIO DE PERDAS E VENCIDOS</p>
              <p className="text-gray-500">Filtro: <span className="uppercase font-bold">{periodFilter}</span> | Emissão: {todayFormatted}</p>
            </div>
          </div>

          {/* Quick Summary Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
            <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-[10px] font-bold text-red-600 uppercase">Qtd Vencidos ({periodFilter})</p>
              <p className="text-lg sm:text-xl font-black text-red-700">
                {filteredExpiredList.reduce((acc, p) => acc + p.quantidade, 0)} un
              </p>
            </div>
            <div className="p-2.5 sm:p-3 bg-red-100 border border-red-300 rounded-xl">
              <p className="text-[10px] font-bold text-red-700 uppercase">Valor Total Vencido</p>
              <p className="text-lg sm:text-xl font-black text-red-800">R$ {totalExpiredValue.toFixed(2)}</p>
            </div>
            <div className="p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[10px] font-bold text-amber-600 uppercase">Vencendo (3d)</p>
              <p className="text-lg sm:text-xl font-black text-amber-700">{expiringList.length} itens</p>
            </div>
            <div className="p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-[10px] font-bold text-green-600 uppercase">Normais</p>
              <p className="text-lg sm:text-xl font-black text-green-700">{normalList.length} itens</p>
            </div>
          </div>

          {/* Specifications Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-1">
              <h4 className="text-xs sm:text-sm font-black text-[#2C2C2C]">
                Especificações de Produtos Vencidos ({filteredExpiredList.length} itens)
              </h4>
            </div>

            {filteredExpiredList.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center italic border border-dashed border-gray-200 rounded-xl">
                Nenhum produto vencido encontrado para o filtro selecionado ({periodFilter}).
              </p>
            ) : (
              <>
                {/* Mobile Cards View (Visible on Mobile, Hidden on Print & Desktop) */}
                <div className="block md:hidden space-y-2.5 print:hidden">
                  {filteredExpiredList.map((item) => {
                    const unitVal = item.valorKg || 12.0;
                    const totalVal = item.valorTotal || item.quantidade * unitVal;
                    return (
                      <div key={item.id} className="p-3 bg-red-50/50 border border-red-200/80 rounded-xl space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="font-extrabold text-[#2C2C2C] text-sm leading-tight">{item.nome}</h5>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-[10px] font-semibold bg-red-100 text-red-800 px-2 py-0.5 rounded-md">
                                {item.categoria || 'Geral'}
                              </span>
                              {item.barcode && (
                                <span className="text-[10px] font-mono text-gray-500">
                                  #{item.barcode}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-red-600 text-white font-black text-[9px] rounded-lg uppercase whitespace-nowrap shrink-0">
                            VENCIDO
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-red-100 text-[11px]">
                          <div>
                            <span className="text-gray-500 block text-[10px]">Validade:</span>
                            <span className="font-bold text-red-700">{formatDateToBR(item.dataValidade)}</span>
                            <span className="text-[10px] text-red-600 block">({getRelativeExpirationText(item.diasParaVencer)})</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px]">Fabricação:</span>
                            <span className="font-medium text-gray-700">{formatDateToBR(item.dataFabricacao)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-red-100/80 bg-red-100/30 -mx-3 -mb-3 p-2.5 rounded-b-xl">
                          <div className="text-[11px]">
                            <span className="text-gray-600">Qtd: </span>
                            <span className="font-extrabold text-[#2C2C2C]">{item.quantidade} un</span>
                            <span className="text-gray-500 text-[10px]"> (R$ {unitVal.toFixed(2)}/un)</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 block">Prejuízo</span>
                            <span className="font-black text-red-900 text-sm">R$ {totalVal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop & Print Table View */}
                <div className="hidden md:block print:block overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-[#2C2C2C] font-bold border-b border-gray-300">
                        <th className="py-2.5 px-3">Produto / Categoria</th>
                        <th className="py-2.5 px-3">Código de Barras</th>
                        <th className="py-2.5 px-3">Fabricação</th>
                        <th className="py-2.5 px-3">Validade</th>
                        <th className="py-2.5 px-3">Qtd</th>
                        <th className="py-2.5 px-3">Valor Unit/KG</th>
                        <th className="py-2.5 px-3">Valor Total</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredExpiredList.map((item) => {
                        const unitVal = item.valorKg || 12.0;
                        const totalVal = item.valorTotal || item.quantidade * unitVal;
                        return (
                          <tr key={item.id} className="bg-red-50/40 hover:bg-red-50 font-medium">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-red-900">{item.nome}</div>
                              <div className="text-[10px] text-gray-500">{item.categoria || 'Geral'}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-gray-600">{item.barcode || 'N/D'}</td>
                            <td className="py-2.5 px-3 text-gray-600">{formatDateToBR(item.dataFabricacao)}</td>
                            <td className="py-2.5 px-3 font-bold text-red-700">
                              {formatDateToBR(item.dataValidade)}
                            </td>
                            <td className="py-2.5 px-3 font-bold">{item.quantidade} un</td>
                            <td className="py-2.5 px-3">R$ {unitVal.toFixed(2)}</td>
                            <td className="py-2.5 px-3 font-bold text-red-900">R$ {totalVal.toFixed(2)}</td>
                            <td className="py-2.5 px-3 uppercase text-[10px] font-black text-red-600">
                              VENCIDO ({getRelativeExpirationText(item.diasParaVencer)})
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Signature Footer */}
          <div className="pt-6 sm:pt-10 border-t border-gray-300 flex flex-col sm:flex-row justify-between gap-4 text-xs text-gray-500">
            <div>
              <div className="w-56 border-b border-gray-400 mb-1"></div>
              <p>Assinatura do Gerente / Responsável Técnico</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-bold text-[#2C2C2C]">PADARIA.io Compliance & Waste Control</p>
              <p>Relatório gerado automaticamente pelo sistema</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
