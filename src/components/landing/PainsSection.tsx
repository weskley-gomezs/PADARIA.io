import React from 'react';
import { motion } from 'motion/react';
import { Clock, ChefHat, FileText, Trash2, PieChart, AlertCircle } from 'lucide-react';

export const PainsSection: React.FC = () => {
  const painPoints = [
    {
      icon: Clock,
      iconBg: 'bg-rose-100 text-rose-600',
      title: 'Controle de validade ineficiente',
      description:
        'Insumos e produtos vencidos no estoque ou balcão sem aviso prévio, gerando riscos sanitários, multas e prejuízos diretos.',
    },
    {
      icon: ChefHat,
      iconBg: 'bg-amber-100 text-amber-700',
      title: 'Gestão de produção sem previsibilidade',
      description:
        'Fornadas calculadas no "achismo", causando excesso de sobra de pães e salgados no fim do dia ou falta em horários de pico.',
    },
    {
      icon: FileText,
      iconBg: 'bg-orange-100 text-[#FF6B00]',
      title: 'Controle em papel ou planilhas',
      description:
        'Anotações em cadernos ou planilhas difíceis de atualizar, sem padronização entre os turnos da cozinha e do balcão.',
    },
    {
      icon: Trash2,
      iconBg: 'bg-rose-100 text-rose-600',
      title: 'Alto índice de desperdício',
      description:
        'Matérias-primas e produtos do estoque descartados sem auditoria de perdas, elevando desnecessariamente o Custo das Mercadorias Vendidas (CMV).',
    },
    {
      icon: PieChart,
      iconBg: 'bg-purple-100 text-purple-700',
      title: 'Estoque alimentício desorganizado',
      description:
        'Falta de visão clara do estoque por categoria de produto, sem indicadores financeiros em tempo real do valor em risco no estabelecimento.',
    },
  ];

  return (
    <section id="desafios" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-3xl border border-gray-200/80 my-10 shadow-xs">
      <div className="text-center space-y-3 max-w-3xl mx-auto mb-14">
        <span className="text-xs font-black text-[#FF6B00] uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-200/80">
          DESAFIOS DA OPERAÇÃO
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0B0F17] tracking-tight">
          Sua padaria, confeitaria ou cafeteria enfrenta algum destes desafios?
        </h2>
        <p className="text-sm sm:text-base text-gray-600 font-medium">
          Gerenciar um estabelecimento alimentício sem um software para padaria especializado custa caro e gera perdas diárias.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {painPoints.map((pain, index) => {
          const Icon = pain.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -6, scale: 1.01 }}
              className={`p-6 rounded-2xl bg-[#FAFAF8] border border-gray-200/90 space-y-4 hover:border-[#FF6B00] hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-200 cursor-pointer group relative ${
                index === 4 ? 'sm:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl ${pain.iconBg} flex items-center justify-center font-bold group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-6 h-6" />
                </div>
                <AlertCircle className="w-4 h-4 text-gray-300 group-hover:text-[#FF6B00] transition-colors" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-gray-900 group-hover:text-[#FF6B00] transition-colors">
                  {pain.title}
                </h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  {pain.description}
                </p>
              </div>

              <div className="pt-2 text-[11px] font-bold text-[#FF6B00] opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                <span>Padariaio resolve esta dor</span>
                <span>→</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
