import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { ClipboardList, Bot, Database, UserCheck, MessageCircle } from 'lucide-react';

interface HowItWorksSectionProps {
  onOpenWhatsApp: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onOpenWhatsApp }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Track scroll inside the process section for animated progress line
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start center', 'end center'],
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const steps = [
    {
      number: '01',
      tag: 'REGISTRE',
      title: 'Registre a operação',
      description:
        'Sua equipe de balcão ou cozinha insere validades, lotes de produção e baixas de perdas via celular, tablet ou leitor.',
      icon: ClipboardList,
    },
    {
      number: '02',
      tag: 'A IA ANALISA',
      title: 'A IA analisa os dados',
      description:
        'A PadeIA™ processa os históricos de venda e consumo para identificar padrões de consumo, lotes críticos e gargalos.',
      icon: Bot,
    },
    {
      number: '03',
      tag: 'OS DADOS ENTRAM NO SISTEMA',
      title: 'Atualização centralizada',
      description:
        'Todos os indicadores são consolidados no painel em tempo real com relatórios e alertas preventivos automáticos.',
      icon: Database,
    },
    {
      number: '04',
      tag: 'O GESTOR TOMA DECISÕES',
      title: 'Decisões lucrativas',
      description:
        'A gerência ajusta as próximas fornadas, promove itens próximos ao vencimento e elimina o prejuízo diário.',
      icon: UserCheck,
    },
  ];

  return (
    <section id="como-funciona" ref={sectionRef} className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center space-y-3 max-w-3xl mx-auto mb-16">
        <span className="text-xs font-black text-[#FF6B00] uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-200/80">
          PROCESSO INTUITIVO
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0B0F17] tracking-tight">
          Como o Padariaio transforma sua rotina em 4 passos
        </h2>
        <p className="text-sm sm:text-base text-gray-600 font-medium">
          Sua equipe ganha velocidade e controle sem complicar a operação do balcão ou da cozinha.
        </p>
      </div>

      <div className="relative">
        {/* Animated Connecting Line behind steps on Desktop */}
        <div className="hidden lg:block absolute top-1/2 left-10 right-10 h-1 bg-gray-200 -translate-y-12 -z-10 rounded-full" />
        <motion.div
          style={{ scaleX, transformOrigin: 'left' }}
          className="hidden lg:block absolute top-1/2 left-10 right-10 h-1 bg-gradient-to-r from-[#FF6B00] to-[#E8571A] -translate-y-12 -z-10 rounded-full shadow-xs"
        />

        {/* Steps Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-xl hover:border-orange-300 transition-all flex flex-col justify-between space-y-4 relative group"
              >
                <div className="space-y-4">
                  {/* Step Header */}
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-[#FF6B00] text-white font-black flex items-center justify-center text-sm shadow-md shadow-orange-500/20 group-hover:scale-110 transition-transform">
                      {step.number}
                    </div>
                    <span className="text-[10px] font-black text-[#FF6B00] bg-orange-50 px-2.5 py-1 rounded-md tracking-wider uppercase border border-orange-200/60">
                      {step.tag}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <h3 className="text-base font-extrabold text-gray-900 group-hover:text-[#FF6B00] transition-colors flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-[#FF6B00]" />
                      <span>{step.title}</span>
                    </h3>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-extrabold text-gray-400 group-hover:text-[#FF6B00] transition-colors">
                  <span>Passo {step.number} de 04</span>
                  <span>✓</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA Banner inside process */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 rounded-2xl p-6 text-center max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs"
      >
        <div className="text-left space-y-1">
          <h4 className="text-sm font-extrabold text-gray-900">Quer ver este processo na prática hoje mesmo?</h4>
          <p className="text-xs text-gray-600 font-medium">Apresentação online rápida de 15 minutos adaptada para sua padaria.</p>
        </div>
        <button
          onClick={onOpenWhatsApp}
          className="shrink-0 px-6 py-3 rounded-xl bg-[#FF6B00] hover:bg-[#E8571A] text-white text-xs font-black transition-all shadow-md hover:shadow-orange-500/25 flex items-center space-x-2 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 fill-white text-[#FF6B00]" />
          <span>Agendar no WhatsApp</span>
        </button>
      </motion.div>
    </section>
  );
};
