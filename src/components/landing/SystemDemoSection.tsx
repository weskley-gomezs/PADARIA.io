import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  Clock,
  ChefHat,
  Trash2,
  Bot,
  MessageCircle,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface SystemDemoSectionProps {
  onOpenWhatsApp: () => void;
}

export const SystemDemoSection: React.FC<SystemDemoSectionProps> = ({ onOpenWhatsApp }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'validade' | 'producao' | 'desperdicio' | 'ia'>('dashboard');

  return (
    <section id="demonstracao" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-3xl border border-gray-200/80 my-10 shadow-xs">
      <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
        <span className="text-xs font-black text-[#FF6B00] uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-200/80">
          INTERFACE EM AÇÃO
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0B0F17] tracking-tight">
          Veja como o Padaria.io funciona no dia a dia
        </h2>
        <p className="text-sm sm:text-base text-gray-600 font-medium">
          Conheça a clareza das telas e a simplicidade das rotinas para gerência, balcão e cozinha.
        </p>
      </div>

      {/* Demo Tab Selectors */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-3xl mx-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#FF6B00] text-white shadow-md shadow-orange-500/20'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('validade')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'validade'
              ? 'bg-[#FF6B00] text-white shadow-md shadow-orange-500/20'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Controle de Validades
        </button>
        <button
          onClick={() => setActiveTab('producao')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'producao'
              ? 'bg-[#FF6B00] text-white shadow-md shadow-orange-500/20'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Gestão de Produção
        </button>
        <button
          onClick={() => setActiveTab('desperdicio')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'desperdicio'
              ? 'bg-[#FF6B00] text-white shadow-md shadow-orange-500/20'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Relatório de Desperdícios
        </button>
        <button
          onClick={() => setActiveTab('ia')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'ia'
              ? 'bg-[#FF6B00] text-white shadow-md shadow-orange-500/20'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Assistente PadeIA™
        </button>
      </div>

      {/* Premium System Mockup Frame */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-[#FAFAF8] rounded-3xl border border-gray-200/90 max-w-4xl mx-auto shadow-xl overflow-hidden p-3 sm:p-6 relative"
      >
        {/* Top Browser Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200/80 bg-white rounded-t-2xl mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-400 block" />
            <span className="w-3 h-3 rounded-full bg-amber-400 block" />
            <span className="w-3 h-3 rounded-full bg-emerald-400 block" />
          </div>
          <div className="text-[11px] font-bold text-gray-500 flex items-center space-x-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>https://app.padaria.io/modulos/{activeTab}</span>
          </div>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            ● Ativo
          </span>
        </div>

        {/* Dynamic Tab Content */}
        <div className="p-4 sm:p-6 bg-white rounded-2xl border border-gray-200/80 min-h-[340px] flex flex-col justify-between shadow-2xs">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h4 className="text-sm font-black text-gray-900 flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-[#FF6B00]" />
                    <span>Painel Gerencial - Visão Geral do Estabelecimento</span>
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full">
                    Sincronizado
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left">
                    <span className="text-[10px] text-gray-500 font-bold block uppercase">Fornadas Concluídas</span>
                    <span className="text-xl font-black text-gray-900">14 fornadas</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left">
                    <span className="text-[10px] text-gray-500 font-bold block uppercase">Taxa de Perda Global</span>
                    <span className="text-xl font-black text-emerald-600">1,2% (Dentro da meta)</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-500 font-bold block uppercase">Lotes Auditados</span>
                    <span className="text-xl font-black text-blue-600">100% gravados</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-medium pt-2">
                  Visão rápida e consolidada de vendas, produções ativas e baixas diárias para manter proprietários e gerentes sempre atualizados.
                </p>
              </motion.div>
            )}

            {activeTab === 'validade' && (
              <motion.div
                key="validade"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h4 className="text-sm font-black text-gray-900 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#FF6B00]" />
                    <span>Módulo de Controle Preventivo de Validades</span>
                  </h4>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2.5 py-0.5 rounded-full">
                    Alertas Ativos
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-gray-900 block">Torta Holandesa (Fatia)</span>
                      <span className="text-[10px] text-gray-500 font-medium">Setor: Confeitaria Central</span>
                    </div>
                    <span className="text-rose-600 font-black bg-rose-50 px-2.5 py-1 rounded-lg text-[10px] border border-rose-200">
                      Vence Hoje (3 un)
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-gray-900 block">Broa de Milho Tradicional</span>
                      <span className="text-[10px] text-gray-500 font-medium">Setor: Balcão Principal</span>
                    </div>
                    <span className="text-amber-600 font-black bg-amber-50 px-2.5 py-1 rounded-lg text-[10px] border border-amber-200">
                      Vence em 2 dias (15 un)
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Notificações preventivas organizadas por nível de prioridade para que sua equipe tome medidas de exposição ou degustação antes do vencimento.
                </p>
              </motion.div>
            )}

            {activeTab === 'producao' && (
              <motion.div
                key="producao"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h4 className="text-sm font-black text-gray-900 flex items-center space-x-2">
                    <ChefHat className="w-4 h-4 text-[#FF6B00]" />
                    <span>Programação da Cozinha e Fornadas</span>
                  </h4>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-black px-2.5 py-0.5 rounded-full">
                    Turno Manhã
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-left">
                  <div className="flex justify-between text-xs font-bold text-gray-800">
                    <span>Pão Francês - 06:00h</span>
                    <span className="text-emerald-600 font-extrabold">30 kg (Concluído)</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-800">
                    <span>Pão Doce de Leite - 08:30h</span>
                    <span className="text-amber-600 font-extrabold">12 kg (Em andamento)</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-800">
                    <span>Croissant Folhado - 11:00h</span>
                    <span className="text-gray-400 font-extrabold">8 kg (Agendado)</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Garanta pão quente no balcão nos horários de maior fluxo e evite desperdícios de sobras no encerramento.
                </p>
              </motion.div>
            )}

            {activeTab === 'desperdicio' && (
              <motion.div
                key="desperdicio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h4 className="text-sm font-black text-gray-900 flex items-center space-x-2">
                    <Trash2 className="w-4 h-4 text-[#FF6B00]" />
                    <span>Auditoria e Baixas de Descarte por Foto</span>
                  </h4>
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-black px-2.5 py-0.5 rounded-full">
                    Relatório Sanitário
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-gray-900">
                    <span>Mês Atual: R$ 340,00 descartados</span>
                    <span className="text-emerald-600 font-black">-78% vs Mês Anterior</span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Motivo principal: Excesso de umidade na câmara fria (Problema sanado).
                  </p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Foto do produto e justificativa técnica gravadas no sistema. Nenhuma perda sem explicação.
                </p>
              </motion.div>
            )}

            {activeTab === 'ia' && (
              <motion.div
                key="ia"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h4 className="text-sm font-black text-gray-900 flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-[#FF6B00]" />
                    <span>Assistente Virtual PadeIA™</span>
                  </h4>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-black px-2.5 py-0.5 rounded-full">
                    Inteligência Ativa
                  </span>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200 text-left space-y-2">
                  <p className="text-xs font-bold text-gray-800">
                    "Detectei que a venda de Croissants Folhados cresce 35% aos sábados. Deseja ajustar a sugestão da primeira fornada de amanhã?"
                  </p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Análises conversacionais simples para ajudar mestre padeiro e gerência a tomarem decisões certeiras sem complicações.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Call to Action */}
          <div className="pt-6 text-center border-t border-gray-100">
            <button
              onClick={onOpenWhatsApp}
              className="px-8 py-3.5 rounded-xl bg-[#FF6B00] hover:bg-[#E8571A] text-white font-black text-xs transition-all shadow-md hover:shadow-orange-500/25 flex items-center justify-center space-x-2 mx-auto cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#FF6B00]" />
              <span>Quero Agendar uma Demonstração</span>
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
