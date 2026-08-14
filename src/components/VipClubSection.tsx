import React from 'react';
import { 
  Crown, Sparkles, TrendingUp, Clock, Wrench, ShieldCheck, Zap, ArrowRight, CheckCircle2
} from 'lucide-react';

interface VipClubSectionProps {
  bakeryCode: string;
}

export const VipClubSection: React.FC<VipClubSectionProps> = ({ bakeryCode }) => {
  return (
    <div className="space-y-6 animate-fade-in" id="vip-club-section">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-xs">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-[#2C2C2C] tracking-tight">
                Clube VIP PADARIA.io
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                Em Manutenção
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              Módulo de ofertas exclusivas, promoções relâmpago e resgate de produtos
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-200 shadow-xs">
            <Wrench className="w-4 h-4 mr-2 text-amber-600 animate-spin" />
            <span>Atualização de Recursos em Andamento</span>
          </span>
        </div>
      </div>

      {/* MAIN MAINTENANCE CARD */}
      <div className="bg-gradient-to-b from-stone-900 via-stone-850 to-stone-900 text-white rounded-3xl p-8 sm:p-12 border border-stone-700/60 shadow-xl relative overflow-hidden text-center">
        {/* Background glow & accents */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
          {/* Animated Icon Badge */}
          <div className="inline-flex items-center justify-center relative">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Crown className="w-10 h-10" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#E8571A] border-2 border-stone-900 flex items-center justify-center text-white shadow-md">
              <Wrench className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-amber-400/10 text-amber-300 border border-amber-400/30">
              Manutenção Programada & Novas Melhorias
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Aba Clube VIP em Manutenção
            </h3>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Estamos atualizando e aprimorando a infraestrutura de ofertas exclusivas e integração com canais VIP (WhatsApp / Telegram) para trazer ainda mais agilidade no resgate de produtos e aumento de receita para a sua padaria.
            </p>
          </div>

          {/* Feature Highlights being updated */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
            <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-4.5 space-y-2.5 backdrop-blur-sm shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-200">
                Disparo Ágil de Ofertas
              </h4>
              <p className="text-[12px] text-stone-400 leading-snug">
                Integração aprimorada para criação e compartilhamento instantâneo de promoções relâmpago com texto padronizado.
              </p>
            </div>

            <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-4.5 space-y-2.5 backdrop-blur-sm shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-200">
                Artes com IA (PadeIA™)
              </h4>
              <p className="text-[12px] text-stone-400 leading-snug">
                Geração de artes promocionais prontas para postar nos canais de clientes e murais digitais.
              </p>
            </div>

            <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-4.5 space-y-2.5 backdrop-blur-sm shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-200">
                Métricas de Conversão
              </h4>
              <p className="text-[12px] text-stone-400 leading-snug">
                Cálculo em tempo real de dinheiro recuperado e histórico auditável de produtos salvos do descarte.
              </p>
            </div>
          </div>

          {/* Status & Safe Data Badge */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-stone-400 font-semibold">
            <div className="flex items-center space-x-1.5 bg-stone-800/60 px-3.5 py-2 rounded-xl border border-stone-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Seus dados e históricos continuam 100% seguros</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-stone-800/60 px-3.5 py-2 rounded-xl border border-stone-700">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Previsão de liberação em breve</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
