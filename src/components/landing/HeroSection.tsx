import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  ChefHat,
  ShieldCheck,
  Clock,
  Sparkles,
  TrendingDown,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { Counter } from './Counter';

interface HeroSectionProps {
  onOpenWhatsApp: (msg?: string) => void;
  onEnterApp: () => void;
  onOpenDemoModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenWhatsApp,
  onEnterApp,
  onOpenDemoModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Subtle parallax effect on scroll for floating dashboard
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const bgGlowY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <section ref={containerRef} className="pt-32 sm:pt-40 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
      {/* Background Subtle Ambient Lights */}
      <motion.div
        style={{ y: bgGlowY }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.35, 0.5, 0.35],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[450px] bg-gradient-to-tr from-orange-200/40 via-amber-100/30 to-orange-400/20 blur-3xl pointer-events-none -z-10 rounded-full"
      />

      <div className="text-center space-y-8 max-w-4xl mx-auto">
        {/* 1. Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-orange-50/90 border border-orange-200/80 text-[#E8571A] text-xs font-black tracking-wide shadow-2xs backdrop-blur-xs"
        >
          <ChefHat className="w-4 h-4 text-[#E8571A]" />
          <span>TECNOLOGIA ESPECIALIZADA EM PANIFICAÇÃO</span>
        </motion.div>

        {/* 2. Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0B0F17] tracking-tight leading-[1.12]"
        >
          Software para Padaria: <br className="hidden sm:inline" />
          <span className="text-[#FF6B00] relative inline-block">
            Reduza desperdícios
            <svg
              className="absolute -bottom-2 left-0 w-full h-3 text-[#FF6B00]/20 pointer-events-none"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
            >
              <path d="M0 15 Q 50 0 100 15" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
          </span>
          , controle validades e organize sua produção.
        </motion.h1>

        {/* 3. Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-base sm:text-xl text-gray-600 font-medium max-w-3xl mx-auto leading-relaxed"
        >
          O <strong className="text-gray-900 font-bold">Padaria.io</strong> é o sistema para padaria completo que automatiza o controle de validade, gestão de estoque alimentício e redução de perdas na panificação e confeitaria com inteligência artificial.
        </motion.p>

        {/* 4. Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <button
            onClick={() => onOpenWhatsApp()}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#E8571A] text-white font-black text-base transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center space-x-3 cursor-pointer group"
          >
            <MessageCircle className="w-5 h-5 fill-white text-[#FF6B00] group-hover:scale-110 transition-transform" />
            <span>Agendar Demonstração Gratuita</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="#funcionalidades"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm transition-all border border-gray-300 shadow-2xs hover:shadow-xs flex items-center justify-center cursor-pointer hover:border-gray-400"
          >
            Conhecer a Plataforma
          </a>
        </motion.div>

        {/* Trust Highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="pt-3 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-semibold text-gray-500"
        >
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Demonstração ao vivo com especialista</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Implantação sem travar seu balcão</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Sem necessidade de cartão de crédito</span>
          </span>
        </motion.div>
      </div>

      {/* 5. FLOATING DASHBOARD HERO (Appears last) */}
      <motion.div
        style={{ y: dashboardY }}
        initial={{ opacity: 0, y: 50, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="mt-14 max-w-5xl mx-auto rounded-3xl bg-white border border-gray-200/90 shadow-2xl shadow-gray-900/10 overflow-hidden p-2 sm:p-4 relative backdrop-blur-xs"
      >
        {/* Top Browser Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/80 rounded-t-2xl mb-3">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-400 block" />
            <span className="w-3 h-3 rounded-full bg-amber-400 block" />
            <span className="w-3 h-3 rounded-full bg-emerald-400 block" />
          </div>
          <div className="text-[11px] font-bold text-gray-500 flex items-center space-x-1.5 bg-white px-3.5 py-1 rounded-full border border-gray-200/80 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>https://padaria.io/gestao-inteligente</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              ● Painel Operacional
            </span>
          </div>
        </div>

        {/* Floating Dashboard Live Indicators Grid */}
        <div className="p-4 sm:p-6 bg-gradient-to-b from-gray-50/60 via-white to-gray-50/30 rounded-2xl space-y-6">
          {/* 4 Animated Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs hover:border-orange-300 transition-all space-y-1">
              <span className="text-[11px] font-bold text-gray-500 block uppercase tracking-wider">Perdas Evitadas</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 flex items-center space-x-1">
                <span>R$ </span>
                <Counter to={1840} decimals={2} />
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block flex items-center space-x-1">
                <TrendingDown className="w-3 h-3" />
                <span>Lucro recuperado no mês</span>
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs hover:border-orange-300 transition-all space-y-1">
              <span className="text-[11px] font-bold text-gray-500 block uppercase tracking-wider">Redução de Descartes</span>
              <div className="text-xl sm:text-2xl font-black text-[#FF6B00]">
                -<Counter to={64.2} decimals={1} suffix="%" />
              </div>
              <span className="text-[10px] text-gray-500 font-medium block">Auditoria preventiva por foto</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs hover:border-orange-300 transition-all space-y-1">
              <span className="text-[11px] font-bold text-gray-500 block uppercase tracking-wider">Lotes Vencendo (3d)</span>
              <div className="text-xl sm:text-2xl font-black text-amber-600 flex items-center space-x-1">
                <Counter to={8} />
                <span className="text-sm font-bold text-gray-600"> lotes</span>
              </div>
              <span className="text-[10px] text-amber-700 font-bold block flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Alerta no WhatsApp da equipe</span>
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs hover:border-orange-300 transition-all space-y-1">
              <span className="text-[11px] font-bold text-gray-500 block uppercase tracking-wider">Eficiência da Cozinha</span>
              <div className="text-xl sm:text-2xl font-black text-gray-900">
                <Counter to={98.4} decimals={1} suffix="%" />
              </div>
              <span className="text-[10px] text-gray-500 font-medium block">Fornadas sincronizadas</span>
            </div>
          </div>

          {/* Interactive Row: Realtime Alerts & PadeIA Insight */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Realtime Alert Card */}
            <div className="md:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center font-bold shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900">Controle Preventivo de Validades</h4>
                    <p className="text-[11px] text-gray-500">Monitoramento automático de lotes da panificação e confeitaria</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-orange-50 text-[#FF6B00] text-[10px] font-extrabold rounded-lg border border-orange-200/60">
                  Prioridade Alta
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs border border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-bold text-gray-800">Torta Holandesa (Fatias de Confeitaria)</span>
                  </div>
                  <span className="text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded-md text-[10px]">
                    Vence Amanhã (12 fatias)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs border border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-bold text-gray-800">Pão de Queijo Recheado (Congelado)</span>
                  </div>
                  <span className="text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
                    Vence em 3 dias (5 kg)
                  </span>
                </div>
              </div>
            </div>

            {/* PadeIA Recommendation Box */}
            <div className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-white p-4 sm:p-5 rounded-2xl border border-orange-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-[#FF6B00]">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Sugestão PadeIA™</span>
                </div>
                <p className="text-xs text-gray-800 font-semibold leading-relaxed">
                  "Reduza a fornada de Pão Francês das 16h em 15% para eliminar sobras noturnas de balcão."
                </p>
              </div>
              <div className="pt-2 border-t border-orange-200/80 flex items-center justify-between text-[11px] font-bold text-[#FF6B00]">
                <span>Economia projetada: R$ 45,00/dia</span>
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
