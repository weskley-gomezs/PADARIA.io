import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, ArrowRight, ShieldCheck, CheckCircle2, ChefHat } from 'lucide-react';

interface FinalCtaSectionProps {
  onOpenWhatsApp: (msg?: string) => void;
  onEnterApp: () => void;
  onOpenDemoModal: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  onOpenWhatsApp,
  onEnterApp,
  onOpenDemoModal,
}) => {
  return (
    <section className="w-full bg-[#0B0F17] text-white py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden my-12 border-t border-gray-800 shadow-2xl">
      {/* Background Ambient Orange Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[400px] bg-[#FF6B00]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 text-center space-y-8">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-[#FF6B00] text-xs font-black uppercase tracking-widest border border-orange-500/20"
        >
          <ChefHat className="w-4 h-4 text-[#FF6B00]" />
          <span>TRANSFORMAÇÃO IMEDIATA</span>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight"
        >
          Vamos transformar a gestão da sua padaria?
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-base sm:text-xl text-gray-300 font-medium max-w-2xl mx-auto leading-relaxed"
        >
          Agende uma demonstração e descubra como o Padariaio pode ajudar sua equipe a identificar, acompanhar e reduzir perdas.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <button
            onClick={() => onOpenWhatsApp('Olá! Gostaria de agendar uma demonstração gratuita do Padariaio.')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#E8571A] text-white font-black text-base transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center space-x-3 cursor-pointer group"
          >
            <MessageCircle className="w-5 h-5 fill-white text-[#FF6B00] group-hover:scale-110 transition-transform" />
            <span>Agendar demonstração</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm transition-all border border-gray-700 flex items-center justify-center cursor-pointer hover:border-gray-500"
          >
            Acessar Sistema
          </button>
        </motion.div>

        {/* Guarantee details */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-semibold text-gray-400"
        >
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sem fidelidade nem multas</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Implantação rápida e suporte dedicado</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Segurança de dados 100% na nuvem</span>
          </span>
        </motion.div>
      </div>
    </section>
  );
};
