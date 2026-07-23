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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-[#E0E0E0] space-y-6 max-h-[90vh] flex flex-col print:max-w-none print:w-full print:h-auto print:shadow-none print:border-none print:p-0">
        {/* Actions bar (hidden during print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-3 print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-[#E8571A]" />
            <h3 className="text-lg font-extrabold text-[#2C2C2C]">Relatório de Produtos Vencidos & PDF</h3>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {/* Filter Buttons */}
            <div className="bg-gray-100 p-1 rounded-xl flex text-xs font-bold">
              <button
                onClick={() => setPeriodFilter('todos')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodFilter === 'todos' ? 'bg-[#2C2C2C] text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setPeriodFilter('dia')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodFilter === 'dia' ? 'bg-[#E8571A] text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setPeriodFilter('semana')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodFilter === 'semana' ? 'bg-[#E8571A] text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setPeriodFilter('mes')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodFilter === 'mes' ? 'bg-[#E8571A] text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                Mês
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#D4A574] hover:bg-[#c29363] text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="overflow-y-auto space-y-6 pr-1 grow print:overflow-visible">
          {/* Header Document */}
          <div className="flex items-center justify-between border-b-2 border-[#2C2C2C] pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-[#2C2C2C] text-[#D4A574] rounded-xl flex items-center justify-center">
                <ChefHat className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#2C2C2C]">{company.empresa}</h2>
                <p className="text-xs text-gray-500">
                  Código: <strong>{company.codigoAtivacao}</strong> | Contato: {company.email}
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <p className="font-bold text-[#2C2C2C]">RELATÓRIO DE PERDAS E VENCIDOS</p>
              <p className="text-gray-500">Filtro: <span className="uppercase font-bold">{periodFilter}</span> | Emissão: {todayFormatted}</p>
            </div>
          </div>

          {/* Quick Summary Numbers */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-[10px] font-bold text-red-600 uppercase">Qtd Vencidos ({periodFilter})</p>
              <p className="text-xl font-black text-red-700">
                {filteredExpiredList.reduce((acc, p) => acc + p.quantidade, 0)} un
              </p>
            </div>
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl">
              <p className="text-[10px] font-bold text-red-700 uppercase">Valor Total Vencido</p>
              <p className="text-xl font-black text-red-800">R$ {totalExpiredValue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[10px] font-bold text-amber-600 uppercase">Vencendo (3d)</p>
              <p className="text-xl font-black text-amber-700">{expiringList.length} itens</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-[10px] font-bold text-green-600 uppercase">Normais</p>
              <p className="text-xl font-black text-green-700">{normalList.length} itens</p>
            </div>
          </div>

          {/* Table of Expired items with Full Specifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-1">
              <h4 className="text-sm font-black text-[#2C2C2C]">
                Especificações Completas de Produtos Vencidos ({filteredExpiredList.length} itens)
              </h4>
            </div>

            {filteredExpiredList.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center italic border border-dashed border-gray-200 rounded-xl">
                Nenhum produto vencido encontrado para o filtro selecionado ({periodFilter}).
              </p>
            ) : (
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
            )}
          </div>

          {/* Signature Footer */}
          <div className="pt-10 border-t border-gray-300 flex justify-between text-xs text-gray-500">
            <div>
              <div className="w-56 border-b border-gray-400 mb-1"></div>
              <p>Assinatura do Gerente / Responsável Técnico</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#2C2C2C]">PADARIA.io Compliance & Waste Control</p>
              <p>Relatório gerado automaticamente pelo sistema</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
