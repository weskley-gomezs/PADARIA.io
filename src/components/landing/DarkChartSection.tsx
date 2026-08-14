import React from 'react';
import { motion } from 'motion/react';
import { TrendingDown, ShieldCheck, Zap, ArrowRight, Activity } from 'lucide-react';

export const DarkChartSection: React.FC = () => {
  const chartSteps = [
    { label: 'Desperdício Desconhecido', value: '100%', height: 'h-48', color: 'bg-rose-500/80', desc: 'Prejuízo invisível na rotina' },
    { label: 'Identificação por Lote', value: '65%', height: 'h-36', color: 'bg-amber-500/80', desc: 'Alertas preventivos automáticos' },
    { label: 'Controle de Fornadas', value: '35%', height: 'h-24', color: 'bg-orange-500', desc: 'Ajuste de produção em tempo real' },
    { label: 'Redução Consolidada', value: '15%', height: 'h-14', color: 'bg-emerald-500', desc: 'Até -80% de prejuízo evitado' },
  ];

  return (
    <section className="w-full bg-[#0B0F17] text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden my-12 border-y border-gray-800 shadow-2xl">
      {/* Background Ambient Orange Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#FF6B00]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-14">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-orange-500/10 text-[#FF6B00] text-xs font-black uppercase tracking-widest border border-orange-500/20"
          >
            <Activity className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>VISIBILIDADE EM TEMPO REAL</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight"
          >
            Pare de descobrir o prejuízo no fim do mês.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base sm:text-xl text-gray-300 font-medium leading-relaxed max-w-2xl mx-auto"
          >
            Tenha uma visão clara das perdas enquanto elas acontecem e aja preventivamente antes do descarte.
          </motion.p>
        </div>

        {/* Animated Chart Progression */}
        <div className="bg-[#111827]/90 p-6 sm:p-10 rounded-3xl border border-gray-800/90 max-w-5xl mx-auto shadow-2xl backdrop-blur-md space-y-8">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4 text-xs font-bold text-gray-400">
            <span className="flex items-center space-x-2 text-white">
              <ShieldCheck className="w-4 h-4 text-[#FF6B00]" />
              <span>Evolução do Controle de Perdas no Padariaio</span>
            </span>
            <span className="text-emerald-400 font-mono">Simulação de Impacto Operacional</span>
          </div>

          {/* Bars Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 items-end pt-4 min-h-[260px]">
            {chartSteps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-3 group">
                {/* Bar */}
                <div className="w-full bg-gray-900/80 rounded-2xl p-2 border border-gray-800/80 flex items-end justify-center min-h-[180px] relative overflow-hidden">
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: idx * 0.2, ease: 'easeOut' }}
                    className={`w-full ${step.height} ${step.color} rounded-xl flex items-center justify-center font-black text-xs text-white shadow-lg transition-all group-hover:brightness-110`}
                  >
                    <span>{step.value}</span>
                  </motion.div>
                </div>

                {/* Step Label & Description */}
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-white block group-hover:text-[#FF6B00] transition-colors">
                    0{idx + 1}. {step.label}
                  </span>
                  <p className="text-[10px] text-gray-400 font-medium leading-tight">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Summary Bar */}
          <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-gray-300">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-[#FF6B00]" />
              <span>Com o Padariaio, o descarte de insumos deixa de ser um mistério para virar indicador de gestão.</span>
            </div>
            <div className="flex items-center space-x-1 text-[#FF6B00] font-black shrink-0">
              <span>Acompanhe ao vivo</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
