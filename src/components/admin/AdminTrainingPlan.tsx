import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Download,
  Building2,
  ChefHat,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Printer,
  Users,
} from 'lucide-react';
import { BakeryCompany } from '../../types';
import { generateTrainingGuidePDF } from '../../utils/pdfGenerator';

interface AdminTrainingPlanProps {
  companies: BakeryCompany[];
}

export const AdminTrainingPlan: React.FC<AdminTrainingPlanProps> = ({ companies }) => {
  const [selectedCompany, setSelectedCompany] = useState<BakeryCompany | null>(
    companies[0] || null
  );

  const steps = [
    {
      num: 1,
      title: 'Acesso e Código de Ativação (8 Dígitos)',
      desc: 'Entre com o código de 8 dígitos gerado pelo administrador no painel inicial. O login fica gravado com segurança no dispositivo.',
      icon: Smartphone,
      color: 'bg-amber-50 text-[#D4A574]',
    },
    {
      num: 2,
      title: 'Cadastro Rápido de Produtos & Lotes',
      desc: 'Ao fabricar pães, bolos, frios ou confeitaria, cadastre a quantidade e a data de validade de cada lote em menos de 10 segundos.',
      icon: ChefHat,
      color: 'bg-orange-50 text-[#E8571A]',
    },
    {
      num: 3,
      title: 'Monitoramento Visual e Alertas de Validade',
      desc: 'O sistema classifica automaticamente em 🟢 Válido, 🟡 Atenção (vencendo em até 3 dias - ideal para promoções) e 🔴 Vencido (remover da vitrine).',
      icon: ShieldCheck,
      color: 'bg-red-50 text-red-600',
    },
    {
      num: 4,
      title: 'Baixa de Estoque e Vendas de Balcão',
      desc: 'Ao vender ou descartar um item, clique em "Vendido" para registrar no histórico. O sistema permite restaurar itens em caso de erro.',
      icon: CheckCircle2,
      color: 'bg-green-50 text-[#27AE60]',
    },
    {
      num: 5,
      title: 'Relatório para Vigilância Sanitária',
      desc: 'Utilize o botão "Imprimir Relatório" para gerar folhas organizadas prontas para auditorias sanitárias e controle de perdas.',
      icon: Printer,
      color: 'bg-blue-50 text-blue-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-[#E8571A]" />
            <h2 className="text-xl font-extrabold text-[#2C2C2C]">
              Plano de Treinamento e Operação - PADARIA.io
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Guia prático em 5 etapas para gerentes, padeiros e atendentes de balcão
          </p>
        </div>

        {selectedCompany && (
          <button
            onClick={() => generateTrainingGuidePDF(selectedCompany)}
            className="px-4 py-2.5 rounded-xl bg-[#E8571A] hover:bg-[#d44e15] text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Manual do Usuário (PDF)</span>
          </button>
        )}
      </div>

      {/* Select Company for Custom Manual */}
      <div className="bg-white p-5 rounded-2xl border border-[#E0E0E0] flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Building2 className="w-5 h-5 text-[#D4A574]" />
          <span className="text-xs font-bold text-[#2C2C2C]">Selecione a Padaria para Personalizar:</span>
        </div>
        <select
          value={selectedCompany?.codigoAtivacao || ''}
          onChange={(e) => {
            const comp = companies.find((c) => c.codigoAtivacao === e.target.value);
            if (comp) setSelectedCompany(comp);
          }}
          className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
        >
          {companies.map((c) => (
            <option key={c.codigoAtivacao} value={c.codigoAtivacao}>
              {c.empresa} ({c.codigoAtivacao})
            </option>
          ))}
        </select>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.num}
              className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-4 hover:border-[#D4A574] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-[#D4A574]">ETAPA 0{s.num}</span>
                <div className={`p-3 rounded-2xl ${s.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <h3 className="font-extrabold text-base text-[#2C2C2C]">{s.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
            </div>
          );
        })}

        {/* Action card */}
        <div className="bg-gradient-to-br from-[#2C2C2C] to-[#1a1a1a] text-white p-6 rounded-2xl border border-[#D4A574] flex flex-col justify-between space-y-4 shadow-md">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#D4A574] uppercase tracking-wider flex items-center space-x-1">
              <Sparkles className="w-4 h-4 text-[#E8571A]" />
              <span>Gerar PDF Completo</span>
            </span>
            <h3 className="font-black text-lg text-white">Manual Prático de Operação</h3>
            <p className="text-xs text-gray-300">
              Imprima este documento em A4 e afixe na área de produção ou balcão da panificadora.
            </p>
          </div>

          {selectedCompany && (
            <button
              onClick={() => generateTrainingGuidePDF(selectedCompany)}
              className="w-full bg-[#D4A574] hover:bg-[#c29363] text-white font-extrabold py-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <span>Baixar Guia PDF de {selectedCompany.empresa}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
