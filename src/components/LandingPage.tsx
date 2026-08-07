import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  FileText,
  Users,
  RefreshCw,
  Sparkles,
  MessageCircle,
  Menu,
  X,
  Layers,
  BarChart3,
  Cloud,
  Headphones,
  Settings,
  AlertTriangle,
  Trash2,
  PieChart,
  ChefHat,
  Smartphone,
  Laptop,
  Check,
  Building,
  TrendingUp,
  Send,
  Zap,
  Bot,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';

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
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  
  // Interactive Demonstration section tab state
  const [activeDemoTab, setActiveDemoTab] = useState<'validade' | 'producao' | 'desperdicio' | 'dashboard' | 'ia'>('dashboard');

  // Demo Form State
  const [demoName, setDemoName] = useState('');
  const [demoBakery, setDemoBakery] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const WHATSAPP_NUMBER = '5561996507712';

  const openWhatsApp = (customMessage?: string) => {
    const text = encodeURIComponent(
      customMessage || 'Olá! Gostaria de agendar uma demonstração gratuita do Padaria.io para minha padaria.'
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName || !demoBakery || !demoPhone) return;

    setDemoSubmitted(true);
    const msg = `Olá! Meu nome é ${demoName}, proprietário/gerente da padaria "${demoBakery}". Telefone para contato: ${demoPhone}. Gostaria de agendar uma demonstração gratuita do Padaria.io.`;
    openWhatsApp(msg);

    setTimeout(() => {
      setDemoModalOpen(false);
      setDemoSubmitted(false);
      setDemoName('');
      setDemoBakery('');
      setDemoPhone('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#111827] font-sans selection:bg-[#E8571A] selection:text-white overflow-x-hidden">
      {/* HEADER / NAVBAR */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-200/80 py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src="https://i.imgur.com/ZGsjvWy.png"
              alt="PADARIA.io Logo"
              className="h-14 sm:h-16 object-contain group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-gray-600">
            <a href="#desafios" className="hover:text-[#E8571A] transition-colors cursor-pointer">
              Desafios
            </a>
            <a href="#como-funciona" className="hover:text-[#E8571A] transition-colors cursor-pointer">
              Como Funciona
            </a>
            <a href="#funcionalidades" className="hover:text-[#E8571A] transition-colors cursor-pointer">
              Funcionalidades
            </a>
            <a href="#diferenciais" className="hover:text-[#E8571A] transition-colors cursor-pointer">
              Diferenciais
            </a>
            <a href="#demonstracao" className="hover:text-[#E8571A] transition-colors cursor-pointer">
              Demonstração
            </a>
            <a href="#faq" className="hover:text-[#E8571A] transition-colors cursor-pointer">
              Perguntas Frequentes
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={onEnterApp}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer border border-gray-200"
              title="Área reservada para clientes cadastrados"
            >
              Acessar Sistema
            </button>
            <button
              onClick={() => openWhatsApp()}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#E8571A] hover:bg-[#d44e15] text-white transition-all shadow-md hover:shadow-lg flex items-center space-x-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#E8571A]" />
              <span>Agendar Demonstração Gratuita</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/98 backdrop-blur-md border-b border-gray-200 px-4 pt-3 pb-6 space-y-3 shadow-xl">
            <a
              href="#desafios"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-700 hover:text-[#E8571A]"
            >
              Desafios
            </a>
            <a
              href="#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-700 hover:text-[#E8571A]"
            >
              Como Funciona
            </a>
            <a
              href="#funcionalidades"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-700 hover:text-[#E8571A]"
            >
              Funcionalidades
            </a>
            <a
              href="#diferenciais"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-700 hover:text-[#E8571A]"
            >
              Diferenciais
            </a>
            <a
              href="#demonstracao"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-700 hover:text-[#E8571A]"
            >
              Demonstração
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-700 hover:text-[#E8571A]"
            >
              Perguntas Frequentes (FAQ)
            </a>
            <div className="pt-3 space-y-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openWhatsApp();
                }}
                className="w-full py-3 rounded-xl text-xs font-black bg-[#E8571A] text-white text-center shadow-md flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#E8571A]" />
                <span>Agendar Demonstração Gratuita</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onEnterApp();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 text-center"
              >
                Acessar Sistema (Clientes)
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 1. HERO SECTION */}
      <section className="pt-32 sm:pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        {/* Subtle decorative background gradient blob */}
        <motion.div
          animate={{
            y: [0, -15, 0],
            opacity: [0.3, 0.45, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-tr from-orange-200/50 via-amber-200/30 to-orange-400/20 blur-3xl pointer-events-none -z-10 rounded-full"
        />

        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-orange-50/90 border border-orange-200 text-[#E8571A] text-xs font-black tracking-wide shadow-2xs"
          >
            <ChefHat className="w-4 h-4 text-[#E8571A]" />
            <span>PLATAFORMA ESPECIALIZADA PARA PADARIAS, CONFEITARIAS E CAFETERIAS</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#1A1A1A] tracking-tight leading-[1.12]"
          >
            Software para Padaria: Reduza desperdícios, controle validades e organize sua produção.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-gray-600 font-medium max-w-3xl mx-auto leading-relaxed"
          >
            O <strong className="text-gray-900 font-bold">Padaria.io</strong> é o sistema para padaria completo que automatiza o controle de validade, gestão de estoque alimentício e redução de perdas na panificação e confeitaria com inteligência artificial.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <button
              onClick={() => openWhatsApp()}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#E8571A] hover:bg-[#d44e15] text-white font-black text-base transition-all shadow-lg hover:shadow-orange-500/25 flex items-center justify-center space-x-3 cursor-pointer group"
            >
              <MessageCircle className="w-5 h-5 fill-white text-[#E8571A] group-hover:scale-110 transition-transform" />
              <span>Agendar Demonstração Gratuita</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#funcionalidades"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm transition-all border border-gray-300 shadow-2xs hover:shadow-sm flex items-center justify-center cursor-pointer"
            >
              Conhecer a Plataforma
            </a>
          </motion.div>

          {/* Trust Highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-semibold text-gray-500"
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

        {/* HERO MOCKUP / SYSTEM PREVIEW */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-14 max-w-5xl mx-auto rounded-3xl bg-white border border-gray-200/90 shadow-2xl overflow-hidden p-2 sm:p-4 relative"
        >
          {/* Top Browser Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/80 rounded-t-2xl mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-400 block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 block" />
            </div>
            <div className="text-[11px] font-bold text-gray-400 flex items-center space-x-1 bg-white px-3 py-1 rounded-full border border-gray-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>https://padaria.io/gestao-inteligente</span>
            </div>
            <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              ● Ao Vivo
            </div>
          </div>

          {/* System Interface Snippet Mockup */}
          <div className="p-4 sm:p-6 bg-gradient-to-b from-gray-50/50 to-white rounded-2xl space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-gray-500 block uppercase">Desperdício Auditado</span>
                <span className="text-lg sm:text-2xl font-black text-emerald-600">-64.2%</span>
                <span className="text-[10px] text-gray-400 font-medium block">vs. mês anterior</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-gray-500 block uppercase">Itens a Vencer (3d)</span>
                <span className="text-lg sm:text-2xl font-black text-amber-600">8 lotes</span>
                <span className="text-[10px] text-gray-400 font-medium block">Notificação no celular</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-gray-500 block uppercase">Eficiência de Produção</span>
                <span className="text-lg sm:text-2xl font-black text-gray-900">98.4%</span>
                <span className="text-[10px] text-gray-400 font-medium block">Fornadas sincronizadas</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-gray-500 block uppercase">Aproveitamento PadeIA</span>
                <span className="text-lg sm:text-2xl font-black text-[#E8571A]">R$ 1.840,00</span>
                <span className="text-[10px] text-gray-400 font-medium block">Lucro recuperado</span>
              </div>
            </div>

            {/* Interactive Preview Row */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Alert Card */}
              <div className="md:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900">Validade Alerta Preventivo</h4>
                      <p className="text-[11px] text-gray-500">Próximos lotes da confeitaria e panificação</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-orange-50 text-[#E8571A] text-[10px] font-extrabold rounded-lg">
                    Ação Recomendada
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs">
                    <span className="font-bold text-gray-800">Bolo de Cenoura com Cobertura (Lote 402)</span>
                    <span className="text-amber-600 font-extrabold">Vence Amanhã (12 un)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs">
                    <span className="font-bold text-gray-800">Pão de Queijo Recheado (Congelado)</span>
                    <span className="text-emerald-600 font-extrabold">Vence em 3 dias (5 kg)</span>
                  </div>
                </div>
              </div>

              {/* PadeIA Recommendation Box */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 sm:p-5 rounded-2xl border border-orange-200/70 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-[#E8571A]">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-wider">Sugestão PadeIA</span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium leading-snug">
                    "Reduza a fornada das 16h de Pão Francês em 15% para eliminar sobras noturnas de balcão."
                  </p>
                </div>
                <div className="pt-2 border-t border-orange-200/60 flex items-center justify-between text-[11px] font-bold text-[#E8571A]">
                  <span>Economia projetada: R$ 45,00/dia</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. SEÇÃO DE PROBLEMAS */}
      <section id="desafios" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-3xl border border-gray-200/80 my-10 shadow-xs">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-14">
          <span className="text-xs font-black text-[#E8571A] uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            DESAFIOS DA OPERAÇÃO
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Sua padaria, confeitaria ou cafeteria enfrenta algum destes desafios?
          </h2>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Gerenciar um estabelecimento alimentício sem um software para padaria especializado custa caro e gera perdas diárias.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Problem Card 1 */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#FDFBF7] border border-gray-200/80 space-y-3 hover:border-orange-300 transition-all shadow-2xs"
          >
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Controle de validade ineficiente</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Insumos e produtos vencidos no estoque ou balcão sem aviso prévio, gerando multas da Vigilância Sanitária e prejuízos.
            </p>
          </motion.div>

          {/* Problem Card 2 */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#FDFBF7] border border-gray-200/80 space-y-3 hover:border-orange-300 transition-all shadow-2xs"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <ChefHat className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Gestão de produção sem previsibilidade</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Fornadas calculadas no "achismo", causando excesso de sobra de pães e salgados ao final do dia ou falta nos horários de pico.
            </p>
          </motion.div>

          {/* Problem Card 3 */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#FDFBF7] border border-gray-200/80 space-y-3 hover:border-orange-300 transition-all shadow-2xs"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Controle em papel ou planilhas</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Anotações em cadernos ou planilhas difíceis de atualizar, sem padronização entre os turnos e sujeitas a erros humanos.
            </p>
          </motion.div>

          {/* Problem Card 4 */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#FDFBF7] border border-gray-200/80 space-y-3 hover:border-orange-300 transition-all shadow-2xs"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Alto índice de desperdício</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Matérias-primas e produtos do estoque descartados sem controle de perdas, elevando o custo de fabricação.
            </p>
          </motion.div>

          {/* Problem Card 5 */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#FDFBF7] border border-gray-200/80 space-y-3 hover:border-orange-300 transition-all shadow-2xs sm:col-span-2 lg:col-span-1"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Estoque alimentício desorganizado</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Falta de controle de estoque para padaria e confeitaria, sem indicadores claros do valor real em risco no estabelecimento.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3. COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black text-[#E8571A] uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            PASSO A PASSO SIMPLES
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Como funciona a implantação do Padaria.io
          </h2>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Sua equipe começa a ter controle sem interrupção no fluxo de atendimento ou na cozinha.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-[#E8571A] text-white font-black flex items-center justify-center text-sm">
              01
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Agende uma demonstração</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Preencha o formulário ou entre em contato pelo WhatsApp para agendar uma conversa sem compromisso.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-[#E8571A] text-white font-black flex items-center justify-center text-sm">
              02
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Entendemos sua operação</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Analisamos a rotina da sua padaria, setores de produção, principais produtos e gargalos de desperdício.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-[#E8571A] text-white font-black flex items-center justify-center text-sm">
              03
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Configuramos o Padaria.io</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Ajustamos cadastros, regras de alertas de validade e parâmetros ideais para o seu estabelecimento.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-[#E8571A] text-white font-black flex items-center justify-center text-sm">
              04
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Sua equipe começa a utilizar</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Oferecemos treinamento intuitivo e acompanhamento contínuo para garantir a máxima adesão e resultados.
            </p>
          </div>
        </div>

        {/* CTA Banner inside process */}
        <div className="mt-12 bg-orange-50 border border-orange-200/80 rounded-2xl p-6 text-center max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h4 className="text-sm font-extrabold text-gray-900">Quer ver o sistema na prática hoje mesmo?</h4>
            <p className="text-xs text-gray-600">Apresentação online rápida de 15 minutos adaptada para sua padaria.</p>
          </div>
          <button
            onClick={() => openWhatsApp()}
            className="shrink-0 px-6 py-3 rounded-xl bg-[#E8571A] hover:bg-[#d44e15] text-white text-xs font-black transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white text-[#E8571A]" />
            <span>Agendar no WhatsApp</span>
          </button>
        </div>
      </section>

      {/* 4. FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-3xl border border-gray-200/80 my-10 shadow-xs">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black text-[#E8571A] uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            RECURSOS COMPLETOS
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Tudo o que você precisa para uma gestão eficiente
          </h2>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Ferramentas desenvolvidas sob medida para a rotina de panificação e confeitaria.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Controle de Validade */}
          <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-gray-200/80 space-y-3 hover:border-orange-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-900 flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Controle de Validade</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Monitoramento preventivo de lotes, alertas de vencimento próximo e gestão de exposição.
              </p>
            </div>
          </div>

          {/* 2. Gestão de Produção */}
          <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-gray-200/80 space-y-3 hover:border-orange-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-900 flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Gestão de Produção</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Programação diária de fornadas, fichas técnicas padronizadas e controle de fornecimento.
              </p>
            </div>
          </div>

          {/* 3. Controle de Desperdícios */}
          <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-gray-200/80 space-y-3 hover:border-orange-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-900 flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Controle de Desperdícios</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Auditoria de baixas por foto, motivos das perdas e mensuração financeira exata.
              </p>
            </div>
          </div>

          {/* 4. Dashboard */}
          <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-gray-200/80 space-y-3 hover:border-orange-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-900 flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Dashboard</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Painel gerencial com indicadores visuais em tempo real para tomada de decisão ágil.
              </p>
            </div>
          </div>

          {/* 5. Relatórios */}
          <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-gray-200/80 space-y-3 hover:border-orange-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-900 flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Relatórios</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Relatórios consolidados de perdas, validades e histórico prontos para impressão ou exportação.
              </p>
            </div>
          </div>

          {/* 6. Cadastros */}
          <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-gray-200/80 space-y-3 hover:border-orange-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-900 flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Cadastros</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Cadastro simplificado de produtos, categorias, fornecedores e receitas de produção.
              </p>
            </div>
          </div>

          {/* 7. Usuários */}
          <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-gray-200/80 space-y-3 hover:border-orange-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-900 flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Usuários</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Níveis de acesso diferenciados para gerência, operadores de balcão e equipe de cozinha.
              </p>
            </div>
          </div>

          {/* 8. Inteligência Artificial */}
          <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-gray-200/80 space-y-3 hover:border-orange-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-900 flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Inteligência Artificial</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                A assistente PadeIA analisa o histórico para sugerir ajustes nas fornadas e receitas de reaproveitamento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DIFERENCIAIS */}
      <section id="diferenciais" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black text-[#E8571A] uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            NOSSO COMPROMISSO
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-snug">
            Não somos apenas um software. <br className="hidden sm:block" />
            Nós ajudamos sua padaria a crescer.
          </h2>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Entendemos que tecnologia só funciona quando está aliada a suporte próximo e facilidade no dia a dia.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Diferencial 1 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Implantação personalizada</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Acompanhamento passo a passo para cadastrar e estruturar os parâmetros específicos do seu negócio.
            </p>
          </div>

          {/* Diferencial 2 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Suporte humano</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Equipe pronta para ajudar sua gerência e funcionários via WhatsApp ou chamadas sempre que precisar.
            </p>
          </div>

          {/* Diferencial 3 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Atualizações constantes</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Novas melhorias e funcionalidades desenvolvidas continuadamente a partir do feedback dos nossos clientes.
            </p>
          </div>

          {/* Diferencial 4 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Plataforma em nuvem</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Sem necessidade de servidores locais. Acesse de forma segura pelo celular, tablet ou computador.
            </p>
          </div>

          {/* Diferencial 5 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3 sm:col-span-2 lg:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Fácil utilização</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Telas limpas e botões grandes pensados para a correria do balcão e da cozinha de produção, garantindo que qualquer colaborador aprenda em poucos minutos.
            </p>
          </div>
        </div>
      </section>

      {/* 6. DEMONSTRAÇÃO EXCLUSIVA */}
      <section id="demonstracao" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-3xl border border-gray-200/80 my-10 shadow-xs">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
          <span className="text-xs font-black text-[#E8571A] uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            INTERFACE EM AÇÃO
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Veja o Padaria.io funcionando
          </h2>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Conheça a simplicidade das telas e a clareza das informações no dia a dia da sua operação.
          </p>
        </div>

        {/* Demo Tab Selectors */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-3xl mx-auto">
          <button
            onClick={() => setActiveDemoTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
              activeDemoTab === 'dashboard'
                ? 'bg-[#E8571A] text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveDemoTab('validade')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
              activeDemoTab === 'validade'
                ? 'bg-[#E8571A] text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Controle de Validades
          </button>
          <button
            onClick={() => setActiveDemoTab('producao')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
              activeDemoTab === 'producao'
                ? 'bg-[#E8571A] text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Gestão de Produção
          </button>
          <button
            onClick={() => setActiveDemoTab('desperdicio')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
              activeDemoTab === 'desperdicio'
                ? 'bg-[#E8571A] text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Relatório de Desperdícios
          </button>
          <button
            onClick={() => setActiveDemoTab('ia')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
              activeDemoTab === 'ia'
                ? 'bg-[#E8571A] text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Assistente PadeIA
          </button>
        </div>

        {/* Dynamic Interactive Tab Preview */}
        <div className="bg-[#FDFBF7] p-6 sm:p-8 rounded-2xl border border-gray-200/90 max-w-4xl mx-auto min-h-[320px] flex flex-col justify-between shadow-2xs">
          {activeDemoTab === 'dashboard' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h4 className="text-sm font-black text-gray-900 flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-[#E8571A]" />
                  <span>Painel de Controle - Visão Geral da Padaria</span>
                </h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full">
                  Atualizado em Tempo Real
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-left">
                  <span className="text-[10px] text-gray-400 font-bold block">Fornadas do Dia</span>
                  <span className="text-lg font-black text-gray-900">14 fornadas</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-left">
                  <span className="text-[10px] text-gray-400 font-bold block">Taxa de Perda</span>
                  <span className="text-lg font-black text-emerald-600">1.2% (Meta ok)</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-left col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-gray-400 font-bold block">Lotes Auditados</span>
                  <span className="text-lg font-black text-blue-600">100% gravados</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium pt-2">
                Visão consolidada das suas vendas, produções ativas e baixas diárias para manter a diretoria e a gerência sempre informadas.
              </p>
            </div>
          )}

          {activeDemoTab === 'validade' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h4 className="text-sm font-black text-gray-900 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#E8571A]" />
                  <span>Módulo de Controle Preventivo de Validades</span>
                </h4>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full">
                  Alertas Ativos
                </span>
              </div>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-gray-900 block">Torta Holandesa (Fatia)</span>
                    <span className="text-[10px] text-gray-500">Setor: Confeitaria Central</span>
                  </div>
                  <span className="text-rose-600 font-black bg-rose-50 px-2 py-1 rounded-lg text-[10px]">
                    Vence Hoje (3 un)
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-gray-900 block">Broa de Milho Tradicional</span>
                    <span className="text-[10px] text-gray-500">Setor: Balcão Principal</span>
                  </div>
                  <span className="text-amber-600 font-black bg-amber-50 px-2 py-1 rounded-lg text-[10px]">
                    Vence em 2 dias (15 un)
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Notificações organizadas por urgência para que sua equipe de balcão tome medidas preventivas antes do vencimento.
              </p>
            </div>
          )}

          {activeDemoTab === 'producao' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h4 className="text-sm font-black text-gray-900 flex items-center space-x-2">
                  <ChefHat className="w-4 h-4 text-[#E8571A]" />
                  <span>Programação da Cozinha e Fornadas</span>
                </h4>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-black px-2 py-0.5 rounded-full">
                  Turno Manhã
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2 text-left">
                <div className="flex justify-between text-xs font-bold text-gray-800">
                  <span>Pão Francês - 06:00h</span>
                  <span className="text-emerald-600">30 kg (Concluído)</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-800">
                  <span>Pão Doce de Leite - 08:30h</span>
                  <span className="text-amber-600">12 kg (Em andamento)</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-800">
                  <span>Croissant Folhado - 11:00h</span>
                  <span className="text-gray-400">8 kg (Agendado)</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Evite a falta de pão quente nos horários nobres e previna excessos desnecessários nos momentos de menor movimento.
              </p>
            </div>
          )}

          {activeDemoTab === 'desperdicio' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h4 className="text-sm font-black text-gray-900 flex items-center space-x-2">
                  <Trash2 className="w-4 h-4 text-[#E8571A]" />
                  <span>Auditoria e Baixas por Foto</span>
                </h4>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-black px-2 py-0.5 rounded-full">
                  Relatório Sanitário
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 text-left space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-gray-900">
                  <span>Mês Atual: R$ 340,00 descartados</span>
                  <span className="text-emerald-600">-78% vs Mês Anterior</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Motivo principal: Excesso de umidade no armazenamento (Resolvido).
                </p>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Sua equipe tira foto e registra o motivo de qualquer perda. Nada é descartado sem rastro ou justificativa.
              </p>
            </div>
          )}

          {activeDemoTab === 'ia' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h4 className="text-sm font-black text-gray-900 flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-[#E8571A]" />
                  <span>Assistente Virtual PadeIA</span>
                </h4>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-black px-2 py-0.5 rounded-full">
                  Inteligência Ativa
                </span>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200 text-left space-y-2">
                <p className="text-xs font-bold text-gray-800">
                  "Detectei que o consumo de Croissant de Presunto aumenta 35% aos sábados de manhã. Deseja ajustar a sugestão de fornada?"
                </p>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Análises automatizadas que auxiliam seu mestre padeiro a tomar decisões certeiras sem precisar de tabelas complexas.
              </p>
            </div>
          )}

          {/* Section Action Button */}
          <div className="pt-6 text-center border-t border-gray-200/80">
            <button
              onClick={() => openWhatsApp()}
              className="px-8 py-3.5 rounded-xl bg-[#E8571A] hover:bg-[#d44e15] text-white font-black text-sm transition-all shadow-md flex items-center justify-center space-x-2 mx-auto cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#E8571A]" />
              <span>Quero uma Demonstração</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6.5. PERGUNTAS FREQUENTES (SEO FAQ SECTION) */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto my-10">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-14">
          <span className="text-xs font-black text-[#E8571A] uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            DÚVIDAS FREQUENTES
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Perguntas Frequentes sobre Software para Padaria
          </h2>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Tire suas dúvidas sobre o funcionamento do Padaria.io, controle de validade e gestão de perdas na panificação.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              question: "Qual é o diferencial do Padaria.io comparado a um ERP tradicional de caixa?",
              answer: "O Padaria.io é um software para padaria focado especificamente no controle de validade, gestão de estoque alimentício e redução de desperdício em tempo real. Enquanto um ERP tradicional de caixa foca nas vendas do PDV, o Padaria.io atua no balcão e na cozinha de produção para prevenir perdas e vencimentos antes que aconteçam."
            },
            {
              question: "Como funciona o controle de validade e vencimento no sistema?",
              answer: "Nossa plataforma automatiza o monitoramento de lotes e datas de vencimento via leitura de etiquetas e assistente PadeIA™. O sistema emite alertas preventivos por nível de urgência para que sua equipe execute ações de exposição prioritária, degustação ou remarcação antes do vencimento do item."
            },
            {
              question: "O sistema de gestão atende também confeitarias, cafeterias e food service?",
              answer: "Sim! O software foi desenvolvido sob medida para todo o setor de alimentação que lida com produtos perecíveis e manipulação de insumos — incluindo padarias artesanais, confeitarias, cafeterias, rotisserias e pequenos mercados."
            },
            {
              question: "Como o Padaria.io auxilia no cumprimento das normas da Vigilância Sanitária?",
              answer: "A plataforma registra cada baixa de descarte com foto, lote, data e justificativa técnica. Isso gera um histórico sanitário auditável que comprova as boas práticas de manipulação de alimentos e etiquetagem perante a fiscalização sanitária."
            },
            {
              question: "A inteligência artificial PadeIA™ necessita de treinamentos complexos?",
              answer: "Não. A PadeIA™ é uma assistente conversacional simples e inteligente. Basta falar ou digitar em português para que ela calcule prejuízos, registre descartes, leia dados de etiquetas e ofereça sugestões para ajustar suas fornadas diárias."
            },
            {
              question: "Quais dispositivos são compatíveis com a plataforma em nuvem?",
              answer: "O Padaria.io é 100% responsivo e em nuvem. Funciona em smartphones (Android e iOS), tablets de balcão, notebooks e computadores sem necessidade de instalação de servidores locais."
            }
          ].map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between space-x-4 cursor-pointer hover:bg-gray-50/80 transition-colors"
                >
                  <span className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center space-x-3">
                    <HelpCircle className="w-5 h-5 text-[#E8571A] shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 pt-0 text-xs sm:text-sm text-gray-600 font-medium leading-relaxed border-t border-gray-100 bg-gray-50/50">
                    <p className="pt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. CTA FINAL (Conversion focus) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-[#1F2937] via-[#111827] to-[#0A0F1D] text-white p-8 sm:p-14 text-center space-y-8 relative overflow-hidden shadow-2xl border border-gray-800">
          {/* Subtle glowing circle */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#E8571A]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 max-w-3xl mx-auto relative z-10">
            <span className="inline-block px-4 py-1 rounded-full bg-orange-500/20 text-[#E8571A] text-xs font-black uppercase tracking-widest border border-orange-500/30">
              PRÓXIMO PASSO PARA SUA PADARIA
            </span>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Vamos transformar a gestão da sua padaria?
            </h2>

            <p className="text-sm sm:text-lg text-gray-300 font-medium leading-relaxed">
              Agende uma demonstração gratuita e descubra como o <strong className="text-white font-bold">Padaria.io</strong> pode ajudar sua equipe a produzir melhor, reduzir desperdícios e aumentar a organização.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button
              onClick={() => openWhatsApp()}
              className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-[#E8571A] hover:bg-[#d44e15] text-white font-black text-base transition-all shadow-lg hover:shadow-orange-500/30 flex items-center justify-center space-x-3 cursor-pointer group"
            >
              <MessageCircle className="w-5 h-5 fill-white text-[#E8571A] group-hover:scale-110 transition-transform" />
              <span>Agendar Demonstração</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <p className="text-xs text-gray-400 font-medium pt-2 relative z-10">
            Atendimento imediato via WhatsApp de segunda a sábado.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200/80 py-12 px-4 sm:px-6 lg:px-8 text-xs font-medium text-gray-500">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-8 border-b border-gray-100">
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Soluções</h4>
              <ul className="space-y-1.5 text-gray-600">
                <li><a href="#funcionalidades" className="hover:text-[#E8571A]">Software para Padaria</a></li>
                <li><a href="#funcionalidades" className="hover:text-[#E8571A]">Controle de Validade</a></li>
                <li><a href="#funcionalidades" className="hover:text-[#E8571A]">Controle de Estoque</a></li>
                <li><a href="#funcionalidades" className="hover:text-[#E8571A]">Gestão de Desperdício</a></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Segmentos</h4>
              <ul className="space-y-1.5 text-gray-600">
                <li><a href="#desafios" className="hover:text-[#E8571A]">Padarias & Panificadoras</a></li>
                <li><a href="#desafios" className="hover:text-[#E8571A]">Confeiteiras & Docerias</a></li>
                <li><a href="#desafios" className="hover:text-[#E8571A]">Cafeterias & Bistrôs</a></li>
                <li><a href="#desafios" className="hover:text-[#E8571A]">Food Service & Mercados</a></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Plataforma</h4>
              <ul className="space-y-1.5 text-gray-600">
                <li><a href="#como-funciona" className="hover:text-[#E8571A]">Como Funciona</a></li>
                <li><a href="#diferenciais" className="hover:text-[#E8571A]">Diferenciais</a></li>
                <li><a href="#demonstracao" className="hover:text-[#E8571A]">Demonstração Interativa</a></li>
                <li><a href="#faq" className="hover:text-[#E8571A]">Perguntas Frequentes</a></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Legal & Suporte</h4>
              <ul className="space-y-1.5 text-gray-600">
                <li><button onClick={onOpenPrivacy} className="hover:text-[#E8571A] text-left cursor-pointer">Política de Privacidade</button></li>
                <li><button onClick={onOpenAdmin} className="hover:text-[#E8571A] text-left cursor-pointer">Painel de Gestão</button></li>
                <li><button onClick={onEnterApp} className="hover:text-[#E8571A] text-left cursor-pointer">Acessar Sistema</button></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <img
                src="https://i.imgur.com/ZGsjvWy.png"
                alt="PADARIA.io Logo - Software para Padaria"
                className="h-10 object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="text-gray-400">|</span>
              <span>Gestão Inteligente e Controle de Validade para Padarias</span>
            </div>

            <div className="flex items-center space-x-6 text-gray-600 font-bold">
              <button onClick={onOpenPrivacy} className="hover:text-[#E8571A] cursor-pointer">
                Privacidade
              </button>
              <button onClick={onOpenAdmin} className="hover:text-[#E8571A] cursor-pointer">
                Painel Admin
              </button>
              <button onClick={onEnterApp} className="hover:text-[#E8571A] cursor-pointer">
                Acessar Sistema
              </button>
            </div>

            <div>
              © {new Date().getFullYear()} PADARIA.io - Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>

      {/* DEMO MODAL (FALLBACK FOR DIRECT FORM ENTRY) */}
      <AnimatePresence>
        {demoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-200 shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => setDemoModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#E8571A] flex items-center justify-center mx-auto">
                  <MessageCircle className="w-6 h-6 fill-[#E8571A] text-orange-100" />
                </div>
                <h3 className="text-xl font-black text-gray-900">Agender Demonstração Gratuita</h3>
                <p className="text-xs text-gray-600 font-medium">
                  Preencha seus dados para conectar diretamente com nossa equipe no WhatsApp.
                </p>
              </div>

              {demoSubmitted ? (
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-black text-emerald-900">Redirecionando para o WhatsApp...</h4>
                  <p className="text-xs text-emerald-700">Se a janela não abrir, clique no botão abaixo.</p>
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-gray-700 mb-1">Seu Nome</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Silva"
                      value={demoName}
                      onChange={(e) => setDemoName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#E8571A] focus:border-transparent outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-gray-700 mb-1">Nome da Padaria / Estabelecimento</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Padaria Pão D'Ouro"
                      value={demoBakery}
                      onChange={(e) => setDemoBakery(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#E8571A] focus:border-transparent outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-gray-700 mb-1">WhatsApp de Contato</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: (61) 99999-9999"
                      value={demoPhone}
                      onChange={(e) => setDemoPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#E8571A] focus:border-transparent outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#E8571A] hover:bg-[#d44e15] text-white font-black text-xs transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Confirmar e Abrir no WhatsApp</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDemoModalOpen(false);
                        openWhatsApp();
                      }}
                      className="text-[11px] font-bold text-gray-500 hover:text-[#E8571A] underline cursor-pointer"
                    >
                      Ou clique aqui para abrir diretamente no WhatsApp
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
