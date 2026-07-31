import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Clock,
  FileText,
  Users,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Check,
  Menu,
  X,
  Lock,
  Camera,
  Crown,
  Tag,
  Share2,
  DollarSign,
  TrendingUp,
  Image,
  Flame,
  ShoppingBag,
  ArrowUpRight,
  TrendingDown,
  Sparkle,
  Copy,
  Layers,
  BarChart3,
  Award
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
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Active step interactive preview in Hero/IA section
  const [activeStep, setActiveStep] = useState<number>(1);

  // Demo Form State
  const [demoName, setDemoName] = useState('');
  const [demoBakery, setDemoBakery] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto cycle active step for Hero/IA demo preview
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev >= 5 ? 1 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName || !demoBakery || !demoPhone) return;

    setDemoSubmitted(true);
    const text = encodeURIComponent(
      `Olá! Meu nome é ${demoName}, da padaria ${demoBakery} (Tel: ${demoPhone}). Gostaria de agendar uma demonstração do sistema PADARIA.io.`
    );
    window.open(`https://wa.me/5561996507712?text=${text}`, '_blank');

    setTimeout(() => {
      setDemoModalOpen(false);
      setDemoSubmitted(false);
      setDemoName('');
      setDemoBakery('');
      setDemoPhone('');
    }, 2000);
  };

  const whatsappUrl =
    "https://wa.me/5561996507712?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20o%20sistema%20PADARIA.io.";

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#E8571A] selection:text-white overflow-x-hidden">
      {/* NAVBAR */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md shadow-xs border-b border-gray-200/60 py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-200/80 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
              <img
                src="https://i.imgur.com/r41aOzi.png"
                alt="PADARIA.io Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-black text-xl tracking-tight text-[#1A1A1A]">
                  PADARIA<span className="text-[#E8571A]">.io</span>
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider hidden sm:block">
                Gestão Inteligente & Clube VIP
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-gray-600">
            <a
              href="#comparacao"
              className="hover:text-[#E8571A] transition-colors cursor-pointer"
            >
              Comparação
            </a>
            <a
              href="#faturamento"
              className="hover:text-[#E8571A] transition-colors cursor-pointer"
            >
              Recuperação
            </a>
            <a
              href="#clube-vip"
              className="hover:text-[#E8571A] transition-colors cursor-pointer"
            >
              Clube VIP
            </a>
            <a
              href="#ia"
              className="hover:text-[#E8571A] transition-colors cursor-pointer"
            >
              Tecnologia IA
            </a>
            <a
              href="#beneficios"
              className="hover:text-[#E8571A] transition-colors cursor-pointer"
            >
              Benefícios
            </a>
            <a
              href="#resultados"
              className="hover:text-[#E8571A] transition-colors cursor-pointer"
            >
              Resultados
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => setDemoModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-gray-700 hover:text-[#E8571A] hover:bg-orange-50/50 transition-all cursor-pointer border border-transparent hover:border-orange-200"
            >
              Ver Demonstração
            </button>
            <button
              onClick={onEnterApp}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#1F2937] hover:bg-[#111827] text-white transition-all shadow-md hover:shadow-lg flex items-center space-x-2 cursor-pointer border border-gray-800"
            >
              <span>Acessar Sistema</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E8571A]" />
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
          <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 pt-3 pb-6 space-y-3 animate-fade-in">
            <a
              href="#comparacao"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-700 hover:text-[#E8571A]"
            >
              Comparação
            </a>
            <a
              href="#faturamento"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-700 hover:text-[#E8571A]"
            >
              Recuperação de Dinheiro
            </a>
            <a
              href="#clube-vip"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-700 hover:text-[#E8571A]"
            >
              Clube VIP
            </a>
            <a
              href="#ia"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-700 hover:text-[#E8571A]"
            >
              Tecnologia IA
            </a>
            <a
              href="#beneficios"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-700 hover:text-[#E8571A]"
            >
              Benefícios
            </a>
            <a
              href="#resultados"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-700 hover:text-[#E8571A]"
            >
              Resultados
            </a>
            <div className="pt-2 space-y-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setDemoModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-extrabold text-gray-800 bg-gray-100 hover:bg-gray-200 text-center"
              >
                Ver Demonstração
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onEnterApp();
                }}
                className="w-full py-3 rounded-xl text-xs font-black bg-[#E8571A] text-white text-center shadow-md flex items-center justify-center space-x-2"
              >
                <span>Acessar Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="pt-32 sm:pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        {/* Subtle decorative background gradient blobs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-tr from-amber-200/30 via-orange-300/20 to-transparent blur-3xl pointer-events-none -z-10 rounded-full"></div>

        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-[#E8571A] text-xs font-extrabold tracking-wide uppercase shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#E8571A] animate-pulse" />
            <span>Sistema Inteligente Anti-Prejuízo + Clube VIP</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#1A1A1A] tracking-tight leading-[1.08] uppercase">
            PARE DE JOGAR <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[#E8571A] via-[#D44E15] to-[#B33B0A] bg-clip-text text-transparent">
              DINHEIRO NO LIXO.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-gray-600 font-medium max-w-3xl mx-auto leading-relaxed">
            Com apenas uma foto da etiqueta, o <strong className="text-gray-900 font-black">PADARIA.io</strong> identifica produtos próximos ao vencimento, ajuda você a vendê-los antes da perda e controla automaticamente o desperdício.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#E8571A] hover:bg-[#d44e15] text-white text-base font-extrabold shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 hover:scale-[1.02] transition-all flex items-center justify-center space-x-3 cursor-pointer group"
            >
              <span>Teste grátis por 1 dia</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-gray-50 text-[#1A1A1A] border-2 border-gray-200 text-base font-extrabold shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Ver demonstração</span>
            </button>
          </div>

          {/* Micro trust indicators */}
          <div className="pt-3 flex items-center justify-center space-x-6 text-xs text-gray-500 font-bold">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Sem necessidade de cartão</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Ativação em 1 minuto</span>
            </span>
            <span className="flex items-center space-x-1.5 hidden sm:flex">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>100% Online</span>
            </span>
          </div>
        </div>

        {/* HERO VISUAL FLOW ILLUSTRATION */}
        <div className="mt-14 max-w-5xl mx-auto bg-white rounded-3xl border border-gray-200/90 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="text-center mb-6">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#E8571A] block">
              COMO O PADARIA.IO FUNCIONA PASSO A PASSO
            </span>
            <h3 className="text-lg sm:text-xl font-black text-gray-900 mt-1">
              Do Escaneamento à Recuperação do Faturamento
            </h3>
          </div>

          {/* Stepper Flow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative z-10">
            {/* Step 1 */}
            <div
              onClick={() => setActiveStep(1)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                activeStep === 1
                  ? 'bg-orange-50/80 border-[#E8571A] shadow-md ring-2 ring-orange-400/20'
                  : 'bg-gray-50/60 border-gray-200 hover:bg-gray-100/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-xl bg-[#E8571A] text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <Camera className="w-4 h-4 text-[#E8571A]" />
              </div>
              <p className="text-xs font-extrabold text-gray-900 leading-snug">
                Fotografar Etiqueta
              </p>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Funcionário tira foto pelo celular
              </p>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => setActiveStep(2)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                activeStep === 2
                  ? 'bg-amber-50/80 border-amber-500 shadow-md ring-2 ring-amber-400/20'
                  : 'bg-gray-50/60 border-gray-200 hover:bg-gray-100/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-xl bg-amber-500 text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-xs font-extrabold text-gray-900 leading-snug">
                IA Lê os Dados
              </p>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Extrai produto, lote e data de validade
              </p>
            </div>

            {/* Step 3 */}
            <div
              onClick={() => setActiveStep(3)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                activeStep === 3
                  ? 'bg-purple-50/80 border-purple-500 shadow-md ring-2 ring-purple-400/20'
                  : 'bg-gray-50/60 border-gray-200 hover:bg-gray-100/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-xl bg-purple-600 text-white text-xs font-black flex items-center justify-center">
                  3
                </span>
                <Crown className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xs font-extrabold text-gray-900 leading-snug">
                Entra no Clube VIP
              </p>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Gera oferta e mensagem promocional
              </p>
            </div>

            {/* Step 4 */}
            <div
              onClick={() => setActiveStep(4)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                activeStep === 4
                  ? 'bg-emerald-50/80 border-emerald-500 shadow-md ring-2 ring-emerald-400/20'
                  : 'bg-gray-50/60 border-gray-200 hover:bg-gray-100/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                  4
                </span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs font-extrabold text-gray-900 leading-snug">
                Produto Vendido
              </p>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Cliente compra com desconto atrativo
              </p>
            </div>

            {/* Step 5 */}
            <div
              onClick={() => setActiveStep(5)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                activeStep === 5
                  ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-400/20'
                  : 'bg-gray-50/60 border-gray-200 hover:bg-gray-100/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                  5
                </span>
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs font-extrabold text-gray-900 leading-snug">
                Relatório de Economia
              </p>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Controle do dinheiro recuperado
              </p>
            </div>
          </div>

          {/* Live Dynamic Preview Area corresponding to activeStep */}
          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-[#1F2937] text-white shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Sparkles className="w-40 h-40" />
            </div>

            {activeStep === 1 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
                <div className="space-y-2 max-w-md">
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black rounded-full uppercase">
                    Passo 1: Captura Rápida
                  </span>
                  <h4 className="text-xl font-black">Escaneamento via Câmera do Celular</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Sem digitação manual exaustiva. O operador simplesmente aponta o celular para a etiqueta de fabricação ou caixa.
                  </p>
                </div>
                <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 w-full md:w-80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                    <span>📷 Câmera Ativa</span>
                    <span className="text-emerald-400 animate-pulse">● Pronto</span>
                  </div>
                  <div className="h-28 bg-gray-900 rounded-xl border-2 border-dashed border-orange-500/50 flex flex-col items-center justify-center text-center p-2">
                    <Camera className="w-8 h-8 text-orange-400 mb-1 animate-bounce" />
                    <span className="text-[11px] font-bold text-gray-300">Enquadre a etiqueta de validade</span>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
                <div className="space-y-2 max-w-md">
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black rounded-full uppercase">
                    Passo 2: Inteligência Artificial
                  </span>
                  <h4 className="text-xl font-black">Processamento OCR & Visão Computacional</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Nossa IA lê o nome do produto, o peso, o valor original e calcula instantaneamente os dias exatos para o vencimento.
                  </p>
                </div>
                <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 w-full md:w-80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <span>🤖 Leitura IA</span>
                    <span className="text-xs font-black">100% Precisão</span>
                  </div>
                  <div className="space-y-1.5 text-xs bg-gray-900 p-3 rounded-xl border border-gray-700">
                    <div className="flex justify-between text-gray-300">
                      <span>Produto:</span>
                      <strong className="text-white">Bolo de Fubá com Goiabada</strong>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Validade:</span>
                      <strong className="text-amber-400">2 dias restantes</strong>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Preço Original:</span>
                      <strong className="text-white">R$ 18,00</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
                <div className="space-y-2 max-w-md">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-black rounded-full uppercase">
                    Passo 3: Automação Comercial
                  </span>
                  <h4 className="text-xl font-black">Inclusão Automática no Clube VIP</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    O sistema sugere o desconto ideal (ex: 20% OFF) e gera um card promocional com mensagem formatada para WhatsApp em 1 clique.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/60 to-purple-800/40 p-4 rounded-2xl border border-purple-500/40 w-full md:w-80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-purple-300">
                    <span>👑 Clube VIP Ativo</span>
                    <span className="bg-purple-500 text-white text-[9px] px-2 py-0.5 rounded-full">20% OFF</span>
                  </div>
                  <div className="p-3 bg-purple-950/80 rounded-xl text-xs space-y-1 text-purple-100 border border-purple-500/30">
                    <p className="font-bold">🥖 OFERTA DO CLUBE VIP</p>
                    <p className="text-[11px] opacity-90">Bolo de Fubá de R$ 18,00 por apenas <strong>R$ 14,40</strong>!</p>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
                <div className="space-y-2 max-w-md">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-full uppercase">
                    Passo 4: Dinheiro no Caixa
                  </span>
                  <h4 className="text-xl font-black">Venda Concluída com Sucesso</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    O produto é vendido rapidamente ao invés de vencer na prateleira. O prejuízo vira faturamento limpo.
                  </p>
                </div>
                <div className="bg-emerald-950/80 p-4 rounded-2xl border border-emerald-500/40 w-full md:w-80 text-center space-y-2">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-emerald-300">Venda Registrada!</p>
                  <p className="text-2xl font-black text-white">+ R$ 14,40</p>
                  <p className="text-[10px] text-emerald-400 font-medium">Recuperado antes do vencimento</p>
                </div>
              </div>
            )}

            {activeStep === 5 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
                <div className="space-y-2 max-w-md">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black rounded-full uppercase">
                    Passo 5: Controle Financeiro
                  </span>
                  <h4 className="text-xl font-black">Dashboard & Histórico de Economia</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Acompanhe em tempo real quanto dinheiro sua padaria deixou de perder neste mês e quais setores são mais eficientes.
                  </p>
                </div>
                <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 w-full md:w-80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-400">
                    <span>📊 Economia do Mês</span>
                    <span className="text-emerald-400">+ 84% recuperado</span>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 flex justify-between items-center">
                    <span className="text-xs text-gray-400">Total Recuperado:</span>
                    <strong className="text-xl font-black text-emerald-400">R$ 2.450,00</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SEGUNDA SEÇÃO - COMPARAÇÃO (SEM PADARIA.IO vs COM PADARIA.IO) */}
      <section id="comparacao" className="py-20 bg-white border-y border-gray-200/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 max-w-3xl mx-auto mb-14">
            <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-black uppercase tracking-wider">
              A Escolha é Simples
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#1A1A1A] tracking-tight">
              O que acontece com o seu dinheiro hoje?
            </h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium">
              Compare a rotina tradicional com a eficiência automatizada do PADARIA.io.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* SEM PADARIA.IO */}
            <div className="bg-gradient-to-b from-red-50/50 to-white rounded-3xl p-6 sm:p-8 border-2 border-red-200 shadow-sm space-y-6 relative">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-black text-lg">
                  ❌
                </div>
                <div>
                  <h3 className="text-xl font-black text-red-950 uppercase">SEM PADARIA.IO</h3>
                  <p className="text-xs text-red-600 font-bold">O caminho tradicional para o prejuízo</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3 p-3.5 bg-red-100/40 rounded-2xl border border-red-200/60">
                  <span className="text-red-500 font-black">❌</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">Produto vence na prateleira</h4>
                    <p className="text-xs text-gray-600">Ninguém percebe a validade chegando ao fim a tempo.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 bg-red-100/40 rounded-2xl border border-red-200/60">
                  <span className="text-red-500 font-black">❌</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">Vai direto para o lixo</h4>
                    <p className="text-xs text-gray-600">Alimentos nobres e caros são descartados sem gerar 1 centavo.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 bg-red-100/40 rounded-2xl border border-red-200/60">
                  <span className="text-red-500 font-black">❌</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">Prejuízo 100% absorvido</h4>
                    <p className="text-xs text-gray-600">O custo de matéria-prima e mão de obra vai para o ralo.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 bg-red-100/40 rounded-2xl border border-red-200/60">
                  <span className="text-red-500 font-black">❌</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">Sem nenhum controle</h4>
                    <p className="text-xs text-gray-600">A gerência não sabe quanto está perdendo nem onde está errando.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-center">
                <span className="text-xs font-black text-red-700 uppercase block">
                  Resultado Final:
                </span>
                <span className="text-sm font-extrabold text-red-900">
                  Perda contínua de margem de lucro todos os meses.
                </span>
              </div>
            </div>

            {/* COM PADARIA.IO */}
            <div className="bg-gradient-to-b from-emerald-50/50 to-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-400 shadow-xl space-y-6 relative">
              {/* Highlight Badge */}
              <div className="absolute -top-3.5 right-6 px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-full shadow-md">
                Solução Inteligente
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg">
                  ✅
                </div>
                <div>
                  <h3 className="text-xl font-black text-emerald-950 uppercase">COM PADARIA.IO</h3>
                  <p className="text-xs text-emerald-600 font-bold">Gestão inteligente e faturamento recuperado</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3 p-3.5 bg-emerald-100/40 rounded-2xl border border-emerald-200/60">
                  <span className="text-emerald-600 font-black">✅</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">Produto identificado dias antes</h4>
                    <p className="text-xs text-gray-600">Escaneamento por foto antecipa o vencimento com precisão.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 bg-emerald-100/40 rounded-2xl border border-emerald-200/60">
                  <span className="text-emerald-600 font-black">✅</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">Promoção sugerida e criada</h4>
                    <p className="text-xs text-gray-600">Entra direto no Clube VIP com desconto atrativo calibrado.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 bg-emerald-100/40 rounded-2xl border border-emerald-200/60">
                  <span className="text-emerald-600 font-black">✅</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">Mensagem pronta para WhatsApp</h4>
                    <p className="text-xs text-gray-600">Envio em 1 clique para a base de clientes do bairro.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 bg-emerald-100/40 rounded-2xl border border-emerald-200/60">
                  <span className="text-emerald-600 font-black">✅</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">Cliente compra & dinheiro recuperado</h4>
                    <p className="text-xs text-gray-600">O produto é vendido com rapidez e o capital retorna para a padaria.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                <span className="text-xs font-black text-emerald-700 uppercase block">
                  Resultado Final:
                </span>
                <span className="text-sm font-extrabold text-emerald-900">
                  Menos perdas, clientes fidelizados e mais dinheiro no caixa!
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NOVA SEÇÃO - TRANSFORME DESPERDÍCIO EM FATURAMENTO */}
      <section id="faturamento" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#1F2937] via-[#111827] to-[#030712] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#E8571A]/10 blur-3xl pointer-events-none rounded-full"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-black uppercase">
                <TrendingUp className="w-4 h-4" />
                <span>Nova Filosofia de Lucro</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Transforme desperdício em <span className="text-[#E8571A]">faturamento.</span>
              </h2>

              <p className="text-sm sm:text-base text-gray-300 font-medium leading-relaxed">
                Quando faltar poucos dias para um produto vencer, o sistema alerta a equipe e sugere automaticamente a inclusão no <strong className="text-white">Clube VIP</strong>.
              </p>

              <p className="text-xs sm:text-sm text-gray-400 font-medium">
                Em questão de segundos, você gera e disponibiliza:
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black">
                    🏷️
                  </div>
                  <div>
                    <strong className="text-xs text-white block">Oferta Estratégica</strong>
                    <span className="text-[10px] text-gray-400">Preço promocional calibrado</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
                    🖼️
                  </div>
                  <div>
                    <strong className="text-xs text-white block">Card / Panfleto</strong>
                    <span className="text-[10px] text-gray-400">Arte digital instantânea</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                    💬
                  </div>
                  <div>
                    <strong className="text-xs text-white block">Mensagem Formatada</strong>
                    <span className="text-[10px] text-gray-400">Pronta para WhatsApp</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
                    🔥
                  </div>
                  <div>
                    <strong className="text-xs text-white block">Promoção Ativa</strong>
                    <span className="text-[10px] text-gray-400">Tudo pronto para divulgar</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onEnterApp}
                  className="px-6 py-3.5 rounded-2xl bg-[#E8571A] hover:bg-[#d44e15] text-white text-xs font-black shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <span>Ativar Clube VIP na minha padaria</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Illustrative Card/Flyer Mockup */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-sm bg-gradient-to-br from-[#E8571A] to-[#D4A574] rounded-3xl p-6 text-white shadow-2xl border-4 border-white/20 space-y-4 relative">
                <div className="text-center space-y-1">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest inline-block">
                    ⭐ OFERTA DO CLUBE VIP ⭐
                  </span>
                  <h3 className="text-xl font-black uppercase tracking-tight">PADARIA DO BAIRRO</h3>
                </div>

                <div className="bg-white text-gray-800 rounded-2xl p-4 shadow-xl text-center space-y-2 relative">
                  <span className="absolute -top-3 -right-3 bg-red-500 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-md">
                    25% OFF
                  </span>
                  <span className="text-[10px] text-[#E8571A] font-extrabold uppercase tracking-wider block">
                    Vencimento em 2 dias
                  </span>
                  <h4 className="text-base font-black text-gray-900">Mini Sonhos com Doce de Leite (500g)</h4>
                  <div className="flex items-center justify-center space-x-3 pt-1">
                    <span className="text-xs text-gray-400 line-through">De R$ 20,00</span>
                    <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      Por R$ 15,00
                    </span>
                  </div>
                </div>

                <div className="text-center space-y-1 text-[11px] font-bold text-orange-100">
                  <p>📲 Garanta o seu pelo WhatsApp da Padaria!</p>
                  <p className="text-[9px] opacity-80">Retirada no balcão • Promoção por tempo limitado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLUBE VIP DA PADARIA */}
      <section id="clube-vip" className="py-20 bg-white border-t border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black uppercase">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>Ferramenta de Engajamento & Vendas</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-[#1A1A1A] tracking-tight">
              Clube VIP da Padaria
            </h2>
            <p className="text-base text-gray-600 font-bold">
              Fidelize clientes e venda mais todos os dias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Divulgue Item 1 */}
            <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-amber-200/80 hover:border-amber-400 transition-all space-y-3 text-center group">
              <div className="text-3xl group-hover:scale-110 transition-transform">🥖</div>
              <h3 className="text-sm font-black text-gray-900">Pão saindo quentinho</h3>
              <p className="text-xs text-gray-500 font-medium">
                Avisos instantâneos de fornada para atrair vizinhos ao balcão.
              </p>
            </div>

            {/* Divulgue Item 2 */}
            <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-amber-200/80 hover:border-amber-400 transition-all space-y-3 text-center group">
              <div className="text-3xl group-hover:scale-110 transition-transform">🥐</div>
              <h3 className="text-sm font-black text-gray-900">Pão de Queijo & Salgados</h3>
              <p className="text-xs text-gray-500 font-medium">
                Promoções de café da manhã e lanches da tarde.
              </p>
            </div>

            {/* Divulgue Item 3 */}
            <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-amber-200/80 hover:border-amber-400 transition-all space-y-3 text-center group">
              <div className="text-3xl group-hover:scale-110 transition-transform">🎂</div>
              <h3 className="text-sm font-black text-gray-900">Bolos & Confeitaria</h3>
              <p className="text-xs text-gray-500 font-medium">
                Giro rápido de sobremesas e itens especiais.
              </p>
            </div>

            {/* Divulgue Item 4 */}
            <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-amber-200/80 hover:border-amber-400 transition-all space-y-3 text-center group">
              <div className="text-3xl group-hover:scale-110 transition-transform">☕</div>
              <h3 className="text-sm font-black text-gray-900">Combos & Promoções</h3>
              <p className="text-xs text-gray-500 font-medium">
                Ofertas especiais para aumento de ticket médio.
              </p>
            </div>

            {/* Divulgue Item 5 */}
            <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-orange-300 bg-orange-50/30 hover:border-orange-500 transition-all space-y-3 text-center group">
              <div className="text-3xl group-hover:scale-110 transition-transform">💰</div>
              <h3 className="text-sm font-black text-orange-950">Próximos ao Vencimento</h3>
              <p className="text-xs text-orange-900 font-bold">
                Descontos imperdíveis que queimam estoque antes da perda.
              </p>
            </div>
          </div>

          <div className="p-6 bg-amber-50/60 rounded-3xl border border-amber-200 text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-black text-amber-800 uppercase tracking-widest block">
              ⚡ Velocidade Absoluta
            </span>
            <p className="text-sm font-extrabold text-gray-900">
              Crie, format e envie ofertas do Clube VIP em poucos segundos para seu canal do WhatsApp!
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO IA - UMA FOTO. ALGUNS SEGUNDOS. TUDO ORGANIZADO */}
      <section id="ia" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-orange-50 text-[#E8571A] border border-orange-200 text-xs font-black uppercase">
            <Sparkles className="w-4 h-4 text-[#E8571A]" />
            <span>Visão Computacional Avançada</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#1A1A1A] tracking-tight">
            Uma foto. Alguns segundos. Tudo organizado.
          </h2>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Entenda como nossa Inteligência Artificial simplifica a rotina da sua equipe.
          </p>
        </div>

        {/* Timeline Visual Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-center items-center">
          {/* Node 1 */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E8571A] flex items-center justify-center mx-auto font-black">
              📷
            </div>
            <strong className="text-xs font-black text-gray-900 block">1. Foto</strong>
            <span className="text-[10px] text-gray-500 font-medium">Captura simples da etiqueta</span>
          </div>

          <div className="hidden md:block text-gray-300 font-black">➔</div>

          {/* Node 2 */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto font-black">
              🤖
            </div>
            <strong className="text-xs font-black text-gray-900 block">2. IA</strong>
            <span className="text-[10px] text-gray-500 font-medium">Leitura inteligente dos dados</span>
          </div>

          <div className="hidden md:block text-gray-300 font-black">➔</div>

          {/* Node 3 */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto font-black">
              📦
            </div>
            <strong className="text-xs font-black text-gray-900 block">3. Cadastrado</strong>
            <span className="text-[10px] text-gray-500 font-medium">Produto salvo no sistema</span>
          </div>

          <div className="hidden md:block text-gray-300 font-black">➔</div>

          {/* Node 4 */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto font-black">
              ⏳
            </div>
            <strong className="text-xs font-black text-gray-900 block">4. Dias Restantes</strong>
            <span className="text-[10px] text-gray-500 font-medium">Contagem regressiva exata</span>
          </div>
        </div>

        {/* Second Row of Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center items-center mt-4 max-w-4xl mx-auto">
          {/* Node 5 */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto font-black">
              ⚡
            </div>
            <strong className="text-xs font-black text-gray-900 block">5. Status</strong>
            <span className="text-[10px] text-gray-500 font-medium">Alerta visual automático</span>
          </div>

          <div className="hidden md:block text-gray-300 font-black">➔</div>

          {/* Node 6 */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto font-black">
              👑
            </div>
            <strong className="text-xs font-black text-gray-900 block">6. Oferta Sugerida</strong>
            <span className="text-[10px] text-gray-500 font-medium">Clube VIP em 1 clique</span>
          </div>

          <div className="hidden md:block text-gray-300 font-black">➔</div>

          {/* Node 7 */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#1F2937] text-white flex items-center justify-center mx-auto font-black">
              📊
            </div>
            <strong className="text-xs font-black text-gray-900 block">7. Relatório</strong>
            <span className="text-[10px] text-gray-500 font-medium">Controle total financeiro</span>
          </div>
        </div>
      </section>

      {/* SEÇÃO BENEFÍCIOS (CARDS MODERNOS) */}
      <section id="beneficios" className="py-20 bg-white border-t border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-xs font-black uppercase tracking-wider">
              Recursos do Ecossistema
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#1A1A1A] tracking-tight">
              Tudo o que sua padaria precisa para crescer
            </h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium">
              Ferramentas desenvolvidas especificamente para a realidade de panificadoras e confeitarias.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-3xl bg-[#FDFBF7] border border-gray-200 hover:border-[#E8571A] hover:shadow-lg transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-gray-900">Recupera faturamento</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Transforme itens que seriam descarrilados em receita real antes do vencimento.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-3xl bg-[#FDFBF7] border border-gray-200 hover:border-[#E8571A] hover:shadow-lg transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <TrendingDown className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-gray-900">Reduz desperdício</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Diminua em até 80% o volume de alimentos descartados no lixo todos os meses.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-3xl bg-[#FDFBF7] border border-gray-200 hover:border-[#E8571A] hover:shadow-lg transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-gray-900">Economiza tempo</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Elimine planilhas manuais e conferências demoradas na retaguarda.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-3xl bg-[#FDFBF7] border border-gray-200 hover:border-[#E8571A] hover:shadow-lg transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#E8571A] flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-gray-900">IA Integrada</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Reconhecimento fotográfico inteligente de etiquetas, produtos e validades.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-3xl bg-[#FDFBF7] border border-gray-200 hover:border-[#E8571A] hover:shadow-lg transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-gray-900">Relatórios Inteligentes</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Métricas claras de perdas evidadas, custos e desempenho por departamento.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-3xl bg-[#FDFBF7] border border-gray-200 hover:border-[#E8571A] hover:shadow-lg transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-gray-900">Clube VIP Integrado</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Módulo completo para fidelizar clientes com ofertas relâmpago no WhatsApp.
              </p>
            </div>

            {/* Card 7 */}
            <div className="p-6 rounded-3xl bg-[#FDFBF7] border border-gray-200 hover:border-[#E8571A] hover:shadow-lg transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-gray-900">Histórico Completo</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Rastreabilidade de todas as vendas e baixas efetuadas na padaria.
              </p>
            </div>

            {/* Card 8 */}
            <div className="p-6 rounded-3xl bg-[#FDFBF7] border border-gray-200 hover:border-[#E8571A] hover:shadow-lg transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-gray-900">Dashboard em Tempo Real</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Acompanhamento instantâneo do estado de validade de toda a loja.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO RESULTADOS / INDICADORES */}
      <section id="resultados" className="py-20 bg-gradient-to-b from-[#1F2937] to-[#111827] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase">
              Resultados Reais
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Impacto direto na saúde financeira da sua padaria
            </h2>
            <p className="text-sm sm:text-base text-gray-300 font-medium">
              Indicadores acumulados obtidos por panificadoras parceiras utilizando o PADARIA.io.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Indicator 1 */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center space-y-2 hover:bg-white/10 transition-all">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest block">
                Produtos Recuperados
              </span>
              <p className="text-3xl sm:text-4xl font-black text-white">1.480+</p>
              <span className="text-[11px] text-gray-400 block font-medium">Itens vendidos antes de vencer</span>
            </div>

            {/* Indicator 2 */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center space-y-2 hover:bg-white/10 transition-all">
              <span className="text-xs font-black text-blue-400 uppercase tracking-widest block">
                Valor Recuperado
              </span>
              <p className="text-3xl sm:text-4xl font-black text-white">R$ 42.500+</p>
              <span className="text-[11px] text-gray-400 block font-medium">Receita direta do Clube VIP</span>
            </div>

            {/* Indicator 3 */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center space-y-2 hover:bg-white/10 transition-all">
              <span className="text-xs font-black text-orange-400 uppercase tracking-widest block">
                Redução de Descarte
              </span>
              <p className="text-3xl sm:text-4xl font-black text-white">-78%</p>
              <span className="text-[11px] text-gray-400 block font-medium">Queda no lixo da produção</span>
            </div>

            {/* Indicator 4 */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center space-y-2 hover:bg-white/10 transition-all">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">
                Economia Gerada
              </span>
              <p className="text-3xl sm:text-4xl font-black text-white">R$ 85.000+</p>
              <span className="text-[11px] text-gray-400 block font-medium">Total preservado no caixa</span>
            </div>

            {/* Indicator 5 */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center space-y-2 hover:bg-white/10 transition-all">
              <span className="text-xs font-black text-purple-400 uppercase tracking-widest block">
                Tempo Economizado
              </span>
              <p className="text-3xl sm:text-4xl font-black text-white">15h/sem</p>
              <span className="text-[11px] text-gray-400 block font-medium">Menos rotina operacional</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 bg-white border-t border-gray-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-[#E8571A] uppercase tracking-wider">Tire suas Dúvidas</span>
            <h2 className="text-3xl font-black text-gray-900">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Como o sistema ajuda a recuperar o dinheiro dos produtos próximos ao vencimento?",
                a: "Assim que um produto próximo ao vencimento é escaneado ou identificado, o PADARIA.io calcula um desconto ideal e cria uma oferta no Clube VIP. Você compartilha a oferta em 1 clique no WhatsApp da padaria e seus clientes compram rapidamente o produto no balcão."
              },
              {
                q: "Preciso baixar algum aplicativo pesado no celular?",
                a: "Não! O PADARIA.io é 100% web e roda direto no navegador do celular, tablet ou computador, sem ocupar espaço na memória do dispositivo."
              },
              {
                q: "Qualquer funcionário consegue usar a câmera para cadastrar?",
                a: "Sim. A interface é extremamente simples e intuitiva. Basta abrir o scanner, tirar a foto da etiqueta e a IA faz todo o reconhecimento dos dados automaticamente."
              },
              {
                q: "Como funciona o teste grátis?",
                a: "Você pode acessar o sistema imediatamente e testar sem necessidade de cadastrar cartão de crédito ou assinar compromissos."
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-2xl overflow-hidden transition-all bg-[#FDFBF7]"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full p-5 text-left font-black text-sm text-gray-900 flex justify-between items-center cursor-pointer hover:bg-gray-100/60"
                >
                  <span>{item.q}</span>
                  {faqOpen === idx ? (
                    <ChevronUp className="w-5 h-5 text-[#E8571A] shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </button>
                {faqOpen === idx && (
                  <div className="px-5 pb-5 text-xs text-gray-600 font-medium leading-relaxed border-t border-gray-100 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[#E8571A] via-[#D44E15] to-[#B33B0A] rounded-3xl p-8 sm:p-16 text-center text-white shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

          <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest inline-block border border-white/30">
            Decisão de Negócio
          </span>

          <h2 className="text-3xl sm:text-6xl font-black tracking-tight leading-tight max-w-3xl mx-auto uppercase">
            Sua padaria perde dinheiro todos os dias. <br />
            <span className="text-amber-200">A pergunta é: Até quando?</span>
          </h2>

          <p className="text-sm sm:text-base text-orange-100 font-medium max-w-2xl mx-auto leading-relaxed">
            Junte-se às padarias que já pararam de jogar alimentos fora e estão recuperando faturamento todos os meses.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white text-[#1A1A1A] hover:bg-gray-100 text-base font-black shadow-2xl hover:scale-105 transition-all flex items-center justify-center space-x-3 cursor-pointer group"
            >
              <span>Quero testar gratuitamente</span>
              <ArrowRight className="w-5 h-5 text-[#E8571A] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <p className="text-xs text-orange-200 font-bold pt-2">
            ⚡ Acesso imediato • Sem cartão de crédito
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#111827] text-gray-400 py-12 border-t border-gray-800 text-xs font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-white p-0.5 flex items-center justify-center">
                <img
                  src="https://i.imgur.com/r41aOzi.png"
                  alt="PADARIA.io"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-black text-lg text-white">
                PADARIA<span className="text-[#E8571A]">.io</span>
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-gray-400">
              <a href="#comparacao" className="hover:text-white transition-colors">
                Comparação
              </a>
              <a href="#faturamento" className="hover:text-white transition-colors">
                Recuperação
              </a>
              <a href="#clube-vip" className="hover:text-white transition-colors">
                Clube VIP
              </a>
              <a href="#ia" className="hover:text-white transition-colors">
                Tecnologia IA
              </a>
              <a href="#beneficios" className="hover:text-white transition-colors">
                Benefícios
              </a>
              <a href="#resultados" className="hover:text-white transition-colors">
                Resultados
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={onOpenPrivacy}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Política de Privacidade
              </button>
              <span>•</span>
              <button
                onClick={onOpenAdmin}
                className="hover:text-white transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Lock className="w-3 h-3 text-[#E8571A]" />
                <span>Portal Gestor</span>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-500 gap-4">
            <p>© {new Date().getFullYear()} PADARIA.io - Todos os direitos reservados.</p>
            <p className="flex items-center space-x-1">
              <span>Inteligência em Gestão de Validade & Vendas</span>
            </p>
          </div>
        </div>
      </footer>

      {/* DEMO MODAL */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 relative animate-scale-up text-gray-900">
            <button
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-orange-50 text-[#E8571A] rounded-full text-[10px] font-black uppercase">
                <Zap className="w-3.5 h-3.5" />
                <span>Atendimento Especializado</span>
              </div>
              <h3 className="text-xl font-black text-gray-900">Agendar Demonstração</h3>
              <p className="text-xs text-gray-500 font-medium">
                Preencha os dados abaixo para conversar com um de nossos especialistas no WhatsApp.
              </p>
            </div>

            {demoSubmitted ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="font-black text-sm text-emerald-900">Redirecionando para o WhatsApp...</h4>
                <p className="text-xs text-emerald-700">Aguarde alguns segundos.</p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Seu Nome</label>
                  <input
                    type="text"
                    required
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-[#E8571A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome da Padaria</label>
                  <input
                    type="text"
                    required
                    value={demoBakery}
                    onChange={(e) => setDemoBakery(e.target.value)}
                    placeholder="Ex: Padaria Pão Doce"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-[#E8571A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp de Contato</label>
                  <input
                    type="tel"
                    required
                    value={demoPhone}
                    onChange={(e) => setDemoPhone(e.target.value)}
                    placeholder="Ex: (61) 99999-9999"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-[#E8571A] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#E8571A] hover:bg-[#d44e15] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Falar com Consultor no WhatsApp</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
