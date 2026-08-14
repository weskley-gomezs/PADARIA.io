import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';

interface FaqSectionProps {
  onOpenWhatsApp: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ onOpenWhatsApp }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'O Padariaio substitui o meu sistema de caixa e frente de loja (PDV)?',
      answer:
        'Não. O Padariaio é um sistema especializado para retaguarda, focado exclusivamente no controle de validade, gestão de produção, controle de estoque alimentício e redução de desperdícios. Ele trabalha de forma complementar ao seu PDV atual sem necessitar trocar seus caixas.',
    },
    {
      question: 'Minha equipe do balcão e da cozinha terá dificuldade para usar?',
      answer:
        'De forma alguma! A plataforma foi desenvolvida exatamente para o ritmo acelerado de padarias e confeitarias. As telas são ultra-intuitivas e o registro de baixas pode ser feito rapidamente em celulares, tablets ou com leitor de código de barras.',
    },
    {
      question: 'Como funciona o alerta e relatório de validade?',
      answer:
        'O Padariaio monitora as datas de vencimento cadastradas e gera relatórios em tempo real com semáforo de urgência no painel gerencial, apontando quais itens precisam de ação imediata (degustação, promoção, produção ou exposição prioritária).',
    },
    {
      question: 'Preciso instalar algum servidor caro na minha padaria?',
      answer:
        'Não! O Padariaio é 100% na nuvem (SaaS). Você e sua equipe acessam de qualquer navegador, tablet ou smartphone com internet, sem custos com servidores locais ou manutenção de TI.',
    },
    {
      question: 'Como funciona a demonstração gratuita?',
      answer:
        'Você solicita o agendamento no WhatsApp e um de nossos especialistas em gestão de panificação faz uma apresentação online de 15 a 20 minutos focada na realidade e tamanho do seu estabelecimento.',
    },
    {
      question: 'Existe fidelidade ou multa contratual?',
      answer:
        'Não cobramos fidelidade ou multas rescisórias. Nosso compromisso é gerar economia real no seu balcão todos os meses.',
    },
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto my-10">
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto mb-14">
        <span className="text-xs font-black text-[#FF6B00] uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-200/80">
          TIRE SUAS DÚVIDAS
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0B0F17] tracking-tight">
          Perguntas Frequentes
        </h2>
        <p className="text-sm sm:text-base text-gray-600 font-medium">
          Tudo o que você precisa saber sobre o Padariaio antes de começar.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-[#FF6B00] shadow-md shadow-orange-500/10 ring-1 ring-[#FF6B00]/20'
                  : 'border-gray-200/90 hover:border-gray-300 shadow-2xs'
              }`}
            >
              <button
                onClick={() => toggleAccordion(idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
              >
                <span className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center space-x-3">
                  <HelpCircle className={`w-5 h-5 shrink-0 ${isOpen ? 'text-[#FF6B00]' : 'text-gray-400'}`} />
                  <span>{faq.question}</span>
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-1 rounded-lg bg-gray-100 text-gray-600 shrink-0"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.span>
              </button>

              <AnimatePresence mode="wait">
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 font-medium leading-relaxed border-t border-gray-100">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* WhatsApp Help Box */}
      <div className="mt-10 p-6 bg-orange-50/80 rounded-2xl border border-orange-200/80 text-center space-y-3">
        <h4 className="text-sm font-extrabold text-gray-900">Ainda tem alguma dúvida específica sobre a sua padaria?</h4>
        <p className="text-xs text-gray-600 font-medium">Nossa equipe especializada responde direto pelo WhatsApp.</p>
        <button
          onClick={onOpenWhatsApp}
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#E8571A] text-white text-xs font-black transition-all shadow-md cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 fill-white text-[#FF6B00]" />
          <span>Falar com especialista agora</span>
        </button>
      </div>
    </section>
  );
};
