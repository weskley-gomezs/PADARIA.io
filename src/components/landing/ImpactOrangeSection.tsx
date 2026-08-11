import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ArrowDownRight, DollarSign, TrendingDown } from 'lucide-react';
import { Counter } from './Counter';

export const ImpactOrangeSection: React.FC = () => {
  return (
    <section className="w-full bg-gradient-to-r from-[#FF6B00] via-[#E8571A] to-[#D9480F] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden shadow-xl">
      {/* Subtle Geometric Animated Floating Shapes */}
      <motion.div
        animate={{
          rotate: [0, 360],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-12 -left-12 w-64 h-64 border-2 border-white/10 rounded-full pointer-events-none"
      />
      <motion.div
        animate={{
          rotate: [360, 0],
          x: [0, -25, 0],
          y: [0, 25, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute -bottom-16 -right-16 w-80 h-80 border-4 border-white/10 rounded-3xl pointer-events-none"
      />
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-12 text-center">
        {/* Main Impact Messages */}
        <div className="max-w-3xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/15 text-white text-xs font-black uppercase tracking-widest backdrop-blur-md border border-white/20"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-200" />
            <span>ALERTA DE GESTÃO FINANCEIRA</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight"
          >
            Você sabe quanto sua padaria perde todos os meses?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-xl text-orange-100 font-medium leading-relaxed max-w-2xl mx-auto"
          >
            Quando desperdícios e vencimentos não são registrados, o prejuízo desaparece dentro da operação e corrói a margem de lucro.
          </motion.p>
        </div>

        {/* 3 Metric Indicators with animated counters */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
          {/* Indicator 1 */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all space-y-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-orange-200 uppercase tracking-wider block">
                PERDAS IDENTIFICADAS
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                R$&nbsp;
                <Counter to={4850} decimals={2} />
              </div>
              <p className="text-xs text-orange-100/90 font-medium mt-1">
                Prejuízo silencioso médio por loja sem controle automatizado.
              </p>
            </div>
          </motion.div>

          {/* Indicator 2 */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all space-y-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-orange-200 uppercase tracking-wider block">
                PRODUTOS DESCARTADOS
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                -<Counter to={75} suffix="%" />
              </div>
              <p className="text-xs text-orange-100/90 font-medium mt-1">
                Queda imediata no descarte após implantar alertas de validade.
              </p>
            </div>
          </motion.div>

          {/* Indicator 3 */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all space-y-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-orange-200 uppercase tracking-wider block">
                VALOR RECUPERÁVEL
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                R$&nbsp;
                <Counter to={2100} decimals={2} />
              </div>
              <p className="text-xs text-orange-100/90 font-medium mt-1">
                Economia mensal média reutilizando insumos e ajustando fornadas.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
