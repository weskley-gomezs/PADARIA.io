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
import { SeoHead } from './seo/SeoHead';
import { MessageCircle, MapPin, Phone, Mail, ShieldCheck, Layers, BookOpen } from 'lucide-react';
import { CLUSTER_PAGES, ARTICLES_DATA } from '../data/seoData';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenAdmin: () => void;
  onOpenPrivacy: () => void;
  onNavigate?: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenAdmin,
  onOpenPrivacy,
  onNavigate,
}) => {
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const WHATSAPP_NUMBER = '5561996507712';

  const openWhatsApp = (customMessage?: string) => {
    const text = encodeURIComponent(
      customMessage || 'Olá! Gostaria de agendar uma demonstração gratuita do Padaria.io para minha padaria.'
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleLinkClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  // Structured Data Schemas for the Homepage
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Padaria.io',
    'legalName': 'AEGIS Tecnologia e Gestão Ltda',
    'url': 'https://padaria.io',
    'logo': 'https://i.imgur.com/HSJoe7l.png',
    'description': 'Software para padarias especializado em controle de estoque, perdas, validade e divergências para panificação e confeitaria.',
    'telephone': '+55-61-99650-7712',
    'email': 'contato@padaria.io',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Brasília',
      'addressRegion': 'DF',
      'addressCountry': 'BR'
    },
    'areaServed': {
      '@type': 'Country',
      'name': 'Brasil'
    }
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Padaria.io',
    'url': 'https://padaria.io',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://padaria.io/conteudos?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Padaria.io',
    'operatingSystem': 'Web, Android, iOS, Windows, macOS',
    'applicationCategory': 'BusinessApplication',
    'description': 'Software completo para gestão de estoque, controle de validade, prevenção de desperdício e auditoria fotográfica de perdas em padarias.',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'BRL'
    }
  };

  const homeSchema = [organizationSchema, websiteSchema, softwareSchema];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#111827] font-sans selection:bg-[#FF6B00] selection:text-white overflow-x-hidden antialiased">
      {/* Dynamic SEO Meta Tags & JSON-LD */}
      <SeoHead
        title="Software para Padarias | Controle de Estoque, Perdas e Validades | Padaria.io"
        description="O software para padaria completo para controle de estoque, redução de perdas, alertas de validade e divergências de contagem. Agende sua demonstração gratuita."
        canonical="https://padaria.io/"
        schema={homeSchema}
      />

      {/* Sticky Header Navbar */}
      <LandingHeader
        onEnterApp={onEnterApp}
        onOpenWhatsApp={openWhatsApp}
        onOpenDemoModal={() => setDemoModalOpen(true)}
        onNavigate={onNavigate}
      />

      {/* Main Sections Hierarchy */}
      <main>
        {/* 1. Hero Section */}
        <HeroSection
          onOpenWhatsApp={openWhatsApp}
          onEnterApp={onEnterApp}
          onOpenDemoModal={() => setDemoModalOpen(true)}
        />

        {/* 2. Seção de Impacto — Laranja */}
        <ImpactOrangeSection />

        {/* 3. Seção das Dores / Desafios da Operação */}
        <PainsSection />

        {/* 4. Como Funciona em 4 Passos */}
        <HowItWorksSection onOpenWhatsApp={() => openWhatsApp()} />

        {/* 5. Funcionalidades em Bento Grid */}
        <FeaturesBentoGrid />

        {/* 6. Gráfico de Redução de Perdas & Retorno */}
        <DarkChartSection />

        {/* 7. Demonstração do Sistema Interativa */}
        <SystemDemoSection onOpenWhatsApp={() => openWhatsApp()} />

        {/* 8. Antes x Depois */}
        <BeforeAfterSection />

        {/* 9. Prova de Valor */}
        <ValueProofSection />

        {/* 10. FAQ */}
        <FaqSection onOpenWhatsApp={() => openWhatsApp()} />

        {/* 11. CTA Final */}
        <FinalCtaSection
          onOpenWhatsApp={openWhatsApp}
          onEnterApp={onEnterApp}
          onOpenDemoModal={() => setDemoModalOpen(true)}
        />
      </main>

      {/* Comprehensive SEO & Institutional Footer */}
      <footer className="bg-[#0B0F17] text-gray-400 pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800 text-xs font-medium">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Col 1: Brand & Presentation */}
          <div className="lg:col-span-2 space-y-4">
            <button
              onClick={() => handleLinkClick('/')}
              className="flex items-center space-x-2 text-left cursor-pointer"
            >
              <img
                src="https://i.imgur.com/ZGsjvWy.png"
                alt="Padaria.io"
                className="h-10 object-contain"
                referrerPolicy="no-referrer"
              />
            </button>
            <p className="text-gray-400 leading-relaxed max-w-sm text-xs sm:text-sm">
              O <strong className="text-white">Padaria.io</strong> é a plataforma especializada em controle de estoque, prevenção de perdas, auditoria de descarte e gestão de validade para padarias, confeitarias e food service em todo o Brasil.
            </p>
            <div className="space-y-2 pt-2 text-xs text-gray-400">
              <p className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                <span>Sede em Brasília - DF | Atendimento em todo o território nacional</span>
              </p>
              <p className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                <span>WhatsApp Consultoria: +55 (61) 99650-7712</span>
              </p>
              <p className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                <span>E-mail: contato@padaria.io</span>
              </p>
              <p className="flex items-center space-x-2 text-gray-500">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                <span>Razão Social: AEGIS Tecnologia e Gestão Ltda</span>
              </p>
            </div>
          </div>

          {/* Col 2: Soluções & Pilares */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-white font-bold text-xs uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Soluções por Área</span>
            </div>
            <ul className="space-y-2">
              {Object.values(CLUSTER_PAGES).slice(0, 5).map((page) => (
                <li key={page.slug}>
                  <button
                    onClick={() => handleLinkClick(`/${page.slug}`)}
                    className="text-left hover:text-[#FF6B00] transition-colors cursor-pointer text-xs"
                  >
                    {page.title.split('|')[0]}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Pilares de Gestão */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-white font-bold text-xs uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Gestão Operacional</span>
            </div>
            <ul className="space-y-2">
              {Object.values(CLUSTER_PAGES).slice(5).map((page) => (
                <li key={page.slug}>
                  <button
                    onClick={() => handleLinkClick(`/${page.slug}`)}
                    className="text-left hover:text-[#FF6B00] transition-colors cursor-pointer text-xs"
                  >
                    {page.title.split('|')[0]}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => handleLinkClick('/conteudos')}
                  className="text-left font-bold text-[#FF6B00] hover:underline cursor-pointer text-xs"
                >
                  Ver todos os 8 Pilares Temáticos →
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Manuais & Artigos Populares */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-white font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Manuais Práticos</span>
            </div>
            <ul className="space-y-2">
              {Object.values(ARTICLES_DATA).slice(0, 5).map((art) => (
                <li key={art.slug}>
                  <button
                    onClick={() => handleLinkClick(`/conteudos/${art.slug}`)}
                    className="text-left hover:text-[#FF6B00] transition-colors cursor-pointer text-xs line-clamp-1"
                    title={art.h1}
                  >
                    {art.h1}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => handleLinkClick('/conteudos')}
                  className="text-left font-bold text-[#FF6B00] hover:underline cursor-pointer text-xs"
                >
                  Biblioteca de Artigos e Guias →
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="max-w-7xl mx-auto pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between text-gray-500 gap-4 text-center sm:text-left text-xs">
          <div>
            © {new Date().getFullYear()} Padaria.io — AEGIS Tecnologia e Gestão Ltda. Todos os direitos reservados.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400 font-semibold">
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
              className="hover:text-[#FF6B00] transition-colors cursor-pointer font-bold text-white bg-gray-800 px-3 py-1 rounded-lg hover:bg-gray-700"
            >
              Acessar Sistema
            </button>
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
