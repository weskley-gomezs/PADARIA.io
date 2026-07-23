import React from 'react';
import { X, Printer, ChefHat, CheckCircle2 } from 'lucide-react';
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
  if (!isOpen) return null;

  const expiredList = products.filter((p) => p.status === 'vencido');
  const expiringList = products.filter((p) => p.status === 'vencendo');
  const normalList = products.filter((p) => p.status === 'normal');

  const handlePrint = () => {
    window.print();
  };

  const todayFormatted = formatDateToBR(new Date().toISOString().split('T')[0]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-[#E0E0E0] space-y-6 max-h-[90vh] flex flex-col print:max-w-none print:w-full print:h-auto print:shadow-none print:border-none print:p-0">
        {/* Actions bar (hidden during print) */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-[#E8571A]" />
            <h3 className="text-lg font-extrabold text-[#2C2C2C]">Relatório de Validades para Impressão</h3>
          </div>
          <div className="flex items-center space-x-2">
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
              <p className="font-bold text-[#2C2C2C]">RELATÓRIO DE MONITORAMENTO</p>
              <p className="text-gray-500">Emissão: {todayFormatted}</p>
            </div>
          </div>

          {/* Quick Summary Numbers */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-[10px] font-bold text-red-600 uppercase">Vencidos</p>
              <p className="text-xl font-black text-red-700">{expiredList.length}</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[10px] font-bold text-amber-600 uppercase">Vencendo (3d)</p>
              <p className="text-xl font-black text-amber-700">{expiringList.length}</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-[10px] font-bold text-green-600 uppercase">Normais</p>
              <p className="text-xl font-black text-green-700">{normalList.length}</p>
            </div>
          </div>

          {/* Table of Expired / Expiring items */}
          <div className="space-y-2">
            <h4 className="text-sm font-black text-[#2C2C2C] border-b border-gray-200 pb-1">
              Itens Críticos (Atenção Imediata)
            </h4>

            {expiredList.length === 0 && expiringList.length === 0 ? (
              <p className="text-xs text-gray-500 py-3 italic">Nenhum produto crítico no momento.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-[#2C2C2C] font-bold border-b border-gray-300">
                    <th className="py-2 px-3">Produto</th>
                    <th className="py-2 px-3">Qtd</th>
                    <th className="py-2 px-3">Validade</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expiredList.map((item) => (
                    <tr key={item.id} className="bg-red-50/50 font-medium">
                      <td className="py-2 px-3 font-bold text-red-900">{item.nome}</td>
                      <td className="py-2 px-3">{item.quantidade} un</td>
                      <td className="py-2 px-3 font-bold text-red-700">
                        {formatDateToBR(item.dataValidade)}
                      </td>
                      <td className="py-2 px-3 uppercase text-[10px] font-black text-red-600">
                        VENCIDO ({getRelativeExpirationText(item.diasParaVencer)})
                      </td>
                    </tr>
                  ))}

                  {expiringList.map((item) => (
                    <tr key={item.id} className="bg-amber-50/50">
                      <td className="py-2 px-3 font-bold text-amber-900">{item.nome}</td>
                      <td className="py-2 px-3">{item.quantidade} un</td>
                      <td className="py-2 px-3 font-bold text-amber-700">
                        {formatDateToBR(item.dataValidade)}
                      </td>
                      <td className="py-2 px-3 uppercase text-[10px] font-black text-amber-600">
                        VENCENDO ({getRelativeExpirationText(item.diasParaVencer)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Full List */}
          <div className="space-y-2">
            <h4 className="text-sm font-black text-[#2C2C2C] border-b border-gray-200 pb-1">
              Inventário Completo Monitorado
            </h4>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                  <th className="py-2 px-3">Produto</th>
                  <th className="py-2 px-3">Categoria</th>
                  <th className="py-2 px-3">Qtd</th>
                  <th className="py-2 px-3">Validade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1.5 px-3 font-medium">{item.nome}</td>
                    <td className="py-1.5 px-3 text-gray-500">{item.categoria || 'Geral'}</td>
                    <td className="py-1.5 px-3 font-bold">{item.quantidade} un</td>
                    <td className="py-1.5 px-3">{formatDateToBR(item.dataValidade)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signature Footer */}
          <div className="pt-8 border-t border-gray-300 flex justify-between text-xs text-gray-500">
            <div>
              <div className="w-48 border-b border-gray-400 mb-1"></div>
              <p>Assinatura do Gerente Responsável</p>
            </div>
            <div className="text-right">
              <p>PADARIA.io System Compliance Report</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
