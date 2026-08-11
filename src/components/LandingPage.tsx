import React, { useState } from 'react';
import { LandingHeader } from './landing/LandingHeader';
import { HeroSection } from './landing/HeroSection';
import { ImpactOrangeSection } from './landing/ImpactOrangeSection';
import { PainsSection } from './landing/PainsSection';
import { HowItWorksSection } from './landing/HowItWorksSection';
import { FeaturesBentoGrid } from './landing/FeaturesBentoGrid';
import { DarkChartSection } from './landing/DarkChartSection';
import { SystemDemoSection } from './landing/SystemDemoSection';
import { BeforeAfterSection } from './landing/BeforeAfterSection';
import { ValueProofSection } from './landing/ValueProofSection';
import { FaqSection } from './landing/FaqSection';
import { FinalCtaSection } from './landing/FinalCtaSection';
import { DemoModal } from './landing/DemoModal';
import { MessageCircle } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenAdmin: () => void;
  onOpenPrivacy: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenAdmin,
  onOpenPrivacy,
}) => {
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const WHATSAPP_NUMBER = '5561996507712';

  const openWhatsApp = (customMessage?: string) => {
    const text = encodeURIComponent(
      customMessage || 'Olá! Gostaria de agendar uma demonstração gratuita do Padaria.io para minha padaria.'
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#111827] font-sans selection:bg-[#FF6B00] selection:text-white overflow-x-hidden antialiased">
      {/* Sticky Header Navbar */}
      <LandingHeader
        onEnterApp={onEnterApp}
        onOpenWhatsApp={openWhatsApp}
        onOpenDemoModal={() => setDemoModalOpen(true)}
      />

      {/* Main Sections Hierarchy */}
      <main>
        {/* 1. Hero Section (Cinematográfico + Dashboard Hero Flutuante) */}
        <HeroSection
          onOpenWhatsApp={openWhatsApp}
          onEnterApp={onEnterApp}
          onOpenDemoModal={() => setDemoModalOpen(true)}
        />

        {/* 2. Nova Seção de Impacto — Laranja (Width Completa) */}
        <ImpactOrangeSection />

        {/* 3. Seção das Dores / Desafios da Operação */}
        <PainsSection />

        {/* 4. Como Funciona em 4 Passos com Linha Conectora */}
        <HowItWorksSection onOpenWhatsApp={() => openWhatsApp()} />

        {/* 5. Funcionalidades em Bento Grid (com PadeIA™ Dark Card & Typing Animation) */}
        <FeaturesBentoGrid />

        {/* 6. Nova Seção Laranja Escuro / Gráfico de Crescimento */}
        <DarkChartSection />

        {/* 7. Demonstração do Sistema Interativa (Tabs & Premium Frame) */}
        <SystemDemoSection onOpenWhatsApp={() => openWhatsApp()} />

        {/* 8. Antes x Depois (Comparativo Visual) */}
        <BeforeAfterSection />

        {/* 9. Prova de Valor (Frase de Alto Impacto em Fundo Escuro) */}
        <ValueProofSection />

        {/* 10. FAQ (Perguntas Frequentes em Acordeão) */}
        <FaqSection onOpenWhatsApp={() => openWhatsApp()} />

        {/* 11. CTA Final (Grand Finale com Fundo Escuro e Brilho Laranja) */}
        <FinalCtaSection
          onOpenWhatsApp={openWhatsApp}
          onEnterApp={onEnterApp}
          onOpenDemoModal={() => setDemoModalOpen(true)}
        />
      </main>

      {/* Footer */}
      <footer className="bg-[#0B0F17] text-gray-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <img
                src="https://i.imgur.com/ZGsjvWy.png"
                alt="Padaria.io"
                className="h-10 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-gray-400 font-semibold max-w-md">
              Tecnologia especializada em gestão de validade, produção e redução de perdas para a panificação e confeitaria.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-300 font-bold">
            <button
              onClick={onOpenPrivacy}
              className="hover:text-[#FF6B00] transition-colors cursor-pointer"
            >
              Política de Privacidade
            </button>
            <button
              onClick={onOpenAdmin}
              className="hover:text-[#FF6B00] transition-colors cursor-pointer"
            >
              Painel Administrativo
            </button>
            <button
              onClick={onEnterApp}
              className="hover:text-[#FF6B00] transition-colors cursor-pointer"
            >
              Acessar Plataforma
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between text-gray-500 gap-4 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} Padaria.io — Todos os direitos reservados.
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <span>Desenvolvido para panificadoras de alto desempenho</span>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Quick Action Badge */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => openWhatsApp()}
          className="p-4 bg-[#FF6B00] hover:bg-[#E8571A] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer group relative"
          title="Falar no WhatsApp"
        >
          <MessageCircle className="w-6 h-6 fill-white text-[#FF6B00]" />
          <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
            Falar com Especialista
          </span>
        </button>
      </div>

      {/* Interactive Demo Scheduling Modal */}
      <DemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onOpenWhatsApp={openWhatsApp}
      />
    </div>
  );
};
