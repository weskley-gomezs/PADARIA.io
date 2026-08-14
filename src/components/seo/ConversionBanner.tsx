import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, MessageSquare } from 'lucide-react';

interface ConversionBannerProps {
  onOpenDemo?: () => void;
  title?: string;
  subtitle?: string;
  contextTag?: string;
}

export const ConversionBanner: React.FC<ConversionBannerProps> = ({
  onOpenDemo,
  title = 'Pronto para estancar o prejuízo invisível na sua padaria?',
  subtitle = 'Solicite uma demonstração guiada do Padariaio com um de nossos consultores de panificação e veja o sistema funcionando na prática.',
  contextTag = 'Demonstração Gratuita'
}) => {
  const handleWhatsApp = () => {
    const message = encodeURIComponent('Olá! Gostaria de agendar uma demonstração do Padariaio para a minha padaria.');
    window.open(`https://wa.me/5561996507712?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="my-12 bg-gradient-to-br from-slate-900 via-slate-950 to-neutral-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl border border-white/10 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#FF6B00]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center space-x-2 bg-[#FF6B00]/20 text-[#FF8533] border border-[#FF6B00]/30 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5" />
          <span>{contextTag}</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
          {title}
        </h2>

        <p className="text-gray-300 text-base sm:text-lg mb-8 leading-relaxed">
          {subtitle}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-300 mb-8 font-medium">
          <div className="flex items-center space-x-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-[#FF6B00] shrink-0" />
            <span>Sem necessidade de cartão</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <ShieldCheck className="w-4 h-4 text-[#FF6B00] shrink-0" />
            <span>Implantação 100% em nuvem</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <Zap className="w-4 h-4 text-[#FF6B00] shrink-0" />
            <span>Treinamento rápido da equipe</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {onOpenDemo ? (
            <button
              onClick={onOpenDemo}
              className="inline-flex items-center justify-center space-x-3 bg-[#FF6B00] hover:bg-[#E56000] text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-[#FF6B00]/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-base cursor-pointer"
            >
              <span>Testar Sistema na Prática</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : null}

          <button
            onClick={handleWhatsApp}
            className="inline-flex items-center justify-center space-x-3 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl border border-white/20 transition-all text-base cursor-pointer"
          >
            <MessageSquare className="w-5 h-5 text-green-400" />
            <span>Falar no WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
