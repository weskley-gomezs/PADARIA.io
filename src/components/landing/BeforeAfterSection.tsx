import React from 'react';
import { motion } from 'motion/react';
import { XCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const BeforeAfterSection: React.FC = () => {
  const beforePoints = [
    'Perdas e descartes difíceis de identificar',
    'Registros em cadernos ou planilhas espalhadas',
    'Dependência da memória dos funcionários do turno',
    'Prejuízo financeiro descoberto só no fim do mês',
    'Pouca previsibilidade para programar as próximas fornadas',
  ];

  const afterPoints = [
    'Perdas auditadas e registradas com foto por lote',
    'Visão financeira em tempo real do estoque em risco',
    'Acompanhamento automático das datas de vencimento',
    'Relatórios prontos e históricos sanitários completos',
    'Inteligência artificial para sugerir ajustes de produção',
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto my-10">
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto mb-14">
        <span className="text-xs font-black text-[#FF6B00] uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-200/80">
          TRANSFORMAÇÃO OPERACIONAL
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0B0F17] tracking-tight">
          A diferença no dia a dia da sua padaria
        </h2>
        <p className="text-sm sm:text-base text-gray-600 font-medium">
          Compare a gestão sem controle com a tranquilidade de operar com o Padariaio.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
        {/* Left Side: SEM CONTROLE */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-rose-100 text-rose-600 font-bold">
                <XCircle className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">
                  GESTÃO TRADICIONAL
                </span>
                <h3 className="text-xl font-black text-gray-900">SEM CONTROLE</h3>
              </div>
            </div>

            <ul className="space-y-3 pt-2">
              {beforePoints.map((pt, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-xs font-semibold text-gray-600 leading-relaxed">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-100 text-xs font-bold text-rose-600">
            Risco constante de perdas de insumo e multas sanitárias.
          </div>
        </motion.div>

        {/* Right Side: COM PADARIA.IO (Highlighted with Orange) */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-[#111827] via-[#0F172A] to-[#0B0F17] text-white p-6 sm:p-8 rounded-3xl border border-orange-500/40 shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden"
        >
          {/* Subtle Orange Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B00]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-[#FF6B00] text-white font-bold shadow-md shadow-orange-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] font-black text-[#FF6B00] uppercase tracking-wider block">
                  GESTÃO INTELIGENTE
                </span>
                <h3 className="text-xl font-black text-white flex items-center space-x-2">
                  <span>COM PADARIA.IO</span>
                </h3>
              </div>
            </div>

            <ul className="space-y-3 pt-2">
              {afterPoints.map((pt, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-xs font-bold text-gray-100 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-800 text-xs font-bold text-[#FF6B00] flex items-center justify-between relative z-10">
            <span>Redução imediata de desperdício e lucro preservado</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
