import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export const ValueProofSection: React.FC = () => {
  return (
    <section className="w-full bg-[#0B0F17] text-white py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden my-12 border-y border-gray-800 shadow-2xl">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-[#FF6B00] text-xs font-black uppercase tracking-widest border border-orange-500/20"
        >
          <Sparkles className="w-4 h-4 text-[#FF6B00]" />
          <span>NOSSA FILOSOFIA DE PRODUTO</span>
        </motion.div>

        {/* Big Display Quote */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18]"
        >
          "Você não precisa de mais um sistema. <br className="hidden sm:inline" />
          <span className="text-[#FF6B00]">Precisa enxergar onde sua padaria está perdendo dinheiro."</span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-base sm:text-2xl text-gray-300 font-semibold max-w-2xl mx-auto tracking-wide"
        >
          É isso que o Padaria.io foi desenvolvido para fazer.
        </motion.p>
      </div>
    </section>
  );
};
