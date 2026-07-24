import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  Sparkles,
  Smartphone,
  Laptop,
  Tablet,
  CheckCircle2,
  ArrowRight,
  Clock,
  TrendingDown,
  FileText,
  Search,
  Cloud,
  Users,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Building,
  Check,
  AlertTriangle,
  Menu,
  X,
  Lock,
  Layers,
  BarChart2,
  Camera
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
  const [activeMockupTab, setActiveMockupTab] = useState<'dashboard' | 'ia' | 'produtos' | 'relatorios' | 'perdas'>('dashboard');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

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

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName || !demoBakery || !demoPhone) return;
    
    setDemoSubmitted(true);
    const text = encodeURIComponent(
      `Olá! Meu nome é ${demoName}, da padaria ${demoBakery} (Tel: ${demoPhone}). Gostaria de falar com um consultor sobre o sistema Padaria.io.`
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

  const whatsappUrl = "https://wa.me/5561996507712?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20o%20sistema%20Padaria.io.";

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans selection:bg-[#FF6B00] selection:text-white">
      {/* Navbar Transparente / Fixa */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-xs border-b border-gray-100 py-3.5' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-200 flex items-center justify-center p-0 overflow-hidden">
              <img 
                src="https://i.imgur.com/r41aOzi.png" 
                alt="Padaria.io Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-xl tracking-tight text-[#111111]">
                  PADARIA<span className="text-[#FF6B00]">.io</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium hidden sm:block">Inteligência em Gestão de Validade</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-gray-700">
            <a href="#problema" className="hover:text-black transition-colors">O Problema</a>
            <a href="#solucao" className="hover:text-black transition-colors">Como Funciona</a>
            <a href="#recursos" className="hover:text-black transition-colors">Recursos</a>
            <a href="#beneficios" className="hover:text-black transition-colors">Benefícios</a>
            <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={onEnterApp}
              className="px-4 py-2 text-xs font-bold text-gray-800 hover:text-black transition-colors cursor-pointer"
            >
              Acessar Sistema
            </button>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#00c864] text-black text-xs font-extrabold transition-all shadow-sm hover:shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Falar com um Consultor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-gray-800 hover:bg-gray-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 px-6 py-6 space-y-4 shadow-xl animate-fade-in">
            <a href="#problema" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-gray-800">O Problema</a>
            <a href="#solucao" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-gray-800">Como Funciona</a>
            <a href="#recursos" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-gray-800">Recursos</a>
            <a href="#beneficios" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-gray-800">Benefícios</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-gray-800">FAQ</a>
            <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onEnterApp();
                }}
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-900 font-bold text-xs"
              >
                Acessar Sistema com Código
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setDemoModalOpen(true);
                }}
                className="w-full py-3 rounded-xl bg-[#FF6B00] text-white font-extrabold text-xs flex items-center justify-center space-x-2"
              >
                <span>Falar com um Consultor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-gradient-to-b from-gray-50/50 via-white to-white">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6B00]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black text-white text-xs font-extrabold shadow-sm">
              <span className="text-[#FF6B00]">●</span>
              <span>Inteligência Artificial aplicada à Gestão de Validade</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-[#111111] tracking-tight leading-[1.1]">
              Pare de perder dinheiro com <span className="underline decoration-[#FF6B00] decoration-4 underline-offset-8">produtos vencendo</span> todos os dias.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
              Sistema inteligente que automatiza o controle de validade utilizando inteligência artificial para economizar tempo, eliminar perdas e organizar a operação da sua padaria.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#e66000] text-white font-black text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Falar com um Consultor</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-black hover:bg-gray-900 text-white font-black text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#FF6B00]" />
                <span>Falar no WhatsApp</span>
              </a>
            </div>

            <p className="text-xs text-gray-400 font-semibold pt-2">
              🔒 Contratação direta e personalizada • Sem cadastros automáticos ou cobranças online
            </p>
          </div>

          {/* Hero Mockup Preview (Notebook, Tablet, Celular) */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="relative rounded-3xl bg-black p-3 sm:p-5 shadow-2xl border border-gray-800">
              {/* Top window dots */}
              <div className="flex items-center space-x-2 mb-3 px-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-[11px] font-mono text-gray-400 ml-2">https://app.padaria.io/dashboard</span>
              </div>

              {/* Mockup Screen Content */}
              <div className="rounded-2xl bg-white overflow-hidden border border-gray-200 shadow-inner">
                <div className="bg-[#111111] text-white p-4 sm:p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FF6B00] text-black font-black flex items-center justify-center text-sm">
                      P
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base">Padaria & Confeitaria Sabor d'Ouro</h3>
                      <p className="text-[11px] text-gray-400 font-mono">Código Ativação: 8SSHQQTZ • Operação Ativa</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center space-x-2">
                    <span className="px-3 py-1 rounded-lg bg-orange-500/20 text-[#FF6B00] text-xs font-bold border border-orange-500/30">
                      ● Sistema em Tempo Real
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-8 space-y-6 bg-gray-50">
                  {/* Metric Cards Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                      <div className="text-[10px] font-bold text-red-600 uppercase">Prejuízo Evitado (Mês)</div>
                      <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">R$ 2.450,00</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                      <div className="text-[10px] font-bold text-amber-600 uppercase">Vencendo em 48h</div>
                      <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">14 itens</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                      <div className="text-[10px] font-bold text-orange-600 uppercase">Cadastro por IA</div>
                      <div className="text-xl sm:text-2xl font-black text-orange-600 mt-1">1.4s méd.</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                      <div className="text-[10px] font-bold text-gray-600 uppercase">Eficiência</div>
                      <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">98.4%</div>
                    </div>
                  </div>

                  {/* Active Table Preview */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-extrabold text-xs text-gray-800 uppercase tracking-wider">Monitoramento de Validade & Lotes</span>
                      <span className="text-[11px] font-bold text-[#FF6B00] bg-orange-50 px-2.5 py-1 rounded-lg">IA Ativa</span>
                    </div>
                    <div className="divide-y divide-gray-100 text-xs">
                      <div className="p-3.5 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="font-bold text-gray-900">Pão Integral Artesanal 500g</span>
                        </div>
                        <span className="text-gray-500">Validade: 28/07/2026 (5 dias)</span>
                        <span className="font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">Normal</span>
                      </div>
                      <div className="p-3.5 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="font-bold text-gray-900">Bolo de Chocolate Recheado</span>
                        </div>
                        <span className="text-gray-500">Validade: 24/07/2026 (Hoje)</span>
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Vencendo</span>
                      </div>
                      <div className="p-3.5 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="font-bold text-gray-900">Leite Pasteurizado 1L (Lote 04)</span>
                        </div>
                        <span className="text-gray-500">Validade: 22/07/2026 (Vencido)</span>
                        <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">Descartar</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-200 hidden sm:flex items-center space-x-3 animate-bounce">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center font-bold">
                ⚡
              </div>
              <div>
                <div className="text-xs font-black text-gray-900">Cadastro por IA</div>
                <div className="text-[10px] text-gray-500">Foto da etiqueta → Salvo!</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO PROBLEMA */}
      <section id="problema" className="py-24 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
              O Custo Oculto da Sua Padaria
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111]">
              Quanto a sua padaria perde por mês com produtos vencidos?
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Em padarias tradicionais, o controle manual de validade é falho, consome horas preciosas e resulta em prejuízos evitáveis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4 hover:border-red-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg">
                ⚠️
              </div>
              <h3 className="text-lg font-black text-gray-900">Produtos Vencendo na Prateleira</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Itens caros como queijos, frios, laticínios e doces estragam escondidos no fundo da geladeira porque ninguém conferiu a data a tempo.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4 hover:border-red-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg">
                📝
              </div>
              <h3 className="text-lg font-black text-gray-900">Controle Manual em Cadernos</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Anotações em papel ou planilhas confusas que ninguém atualiza geram erros humanos frequentes e falta de visibilidade do estoque.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4 hover:border-red-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg">
                💸
              </div>
              <h3 className="text-lg font-black text-gray-900">Desperdício e Prejuízo Invisível</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Dinheiro jogado no lixo todos os dias que poderia estar no lucro líquido da sua empresa e na remuneração da equipe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO SOLUÇÃO (COMO FUNCIONA A IA) */}
      <section id="solucao" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#FF6B00] bg-black px-3 py-1 rounded-full">
              Inteligência Artificial Aplicada
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111]">
              Como a Padaria.io resolve isso em segundos
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Um fluxo ultrarrápido desenhado para a correria do dia a dia da padaria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 text-center space-y-3 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-[#FF6B00] font-black text-xs flex items-center justify-center shadow-md">
                1
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white mx-auto flex items-center justify-center text-xl shadow-xs mt-2">
                📸
              </div>
              <h3 className="font-extrabold text-sm text-gray-900">Fotografe a Etiqueta</h3>
              <p className="text-[11px] text-gray-600">
                O funcionário tira uma foto rápida da etiqueta do produto ou da embalagem pelo celular.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 text-center space-y-3 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-[#FF6B00] font-black text-xs flex items-center justify-center shadow-md">
                2
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white mx-auto flex items-center justify-center text-xl shadow-xs mt-2">
                🤖
              </div>
              <h3 className="font-extrabold text-sm text-gray-900">IA Identifica</h3>
              <p className="text-[11px] text-gray-600">
                A Inteligência Artificial reconhece o nome, data de fabricação, validade, preço e peso/kg instantaneamente.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 text-center space-y-3 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-[#FF6B00] font-black text-xs flex items-center justify-center shadow-md">
                3
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white mx-auto flex items-center justify-center text-xl shadow-xs mt-2">
                ⚡
              </div>
              <h3 className="font-extrabold text-sm text-gray-900">Cadastro Automático</h3>
              <p className="text-[11px] text-gray-600">
                O produto é cadastrado no sistema em segundos, sem digitação manual demorada.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 text-center space-y-3 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-[#FF6B00] font-black text-xs flex items-center justify-center shadow-md">
                4
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white mx-auto flex items-center justify-center text-xl shadow-xs mt-2">
                🔔
              </div>
              <h3 className="font-extrabold text-sm text-gray-900">Alerta de Validade</h3>
              <p className="text-[11px] text-gray-600">
                O sistema monitora os dias restantes e avisa a equipe antes que o produto vença.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 text-center space-y-3 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-[#FF6B00] font-black text-xs flex items-center justify-center shadow-md">
                5
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white mx-auto flex items-center justify-center text-xl shadow-xs mt-2">
                📊
              </div>
              <h3 className="font-extrabold text-sm text-gray-900">Dashboard em Tempo Real</h3>
              <p className="text-[11px] text-gray-600">
                Gestão completa de perdas, relatórios financeiros e tomada de decisão assertiva.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD TABS PREVIEW (MOCKUPS REAIS) */}
      <section className="py-24 bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#FF6B00]">
              Telas Reais do Sistema
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              Simplicidade e poder em uma interface impecável
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Explore as principais abas do sistema projetado para donos e operadores de padarias.
            </p>
          </div>

          {/* Interactive Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveMockupTab('dashboard')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeMockupTab === 'dashboard' ? 'bg-[#FF6B00] text-black shadow-lg' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              📊 Dashboard Executivo
            </button>
            <button
              onClick={() => setActiveMockupTab('ia')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeMockupTab === 'ia' ? 'bg-[#FF6B00] text-black shadow-lg' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              🤖 Leitor IA de Etiquetas
            </button>
            <button
              onClick={() => setActiveMockupTab('produtos')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeMockupTab === 'produtos' ? 'bg-[#FF6B00] text-black shadow-lg' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              📦 Controle de Estoque
            </button>
            <button
              onClick={() => setActiveMockupTab('relatorios')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeMockupTab === 'relatorios' ? 'bg-[#FF6B00] text-black shadow-lg' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              📋 Relatórios Executivos
            </button>
            <button
              onClick={() => setActiveMockupTab('perdas')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeMockupTab === 'perdas' ? 'bg-[#FF6B00] text-black shadow-lg' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              📉 Gráficos de Perdas
            </button>
          </div>

          {/* Mockup Display Box */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
            {activeMockupTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-white">Dashboard Geral da Panificadora</h3>
                    <p className="text-xs text-gray-400">Visão consolidada do mês atual</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] text-xs font-bold border border-[#FF6B00]/30">
                    Atualizado agora
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-black/50 p-5 rounded-2xl border border-gray-800">
                    <div className="text-xs text-red-400 font-bold">Prejuízo Mensal Acumulado</div>
                    <div className="text-2xl font-black text-white mt-1">R$ 1.890,00</div>
                  </div>
                  <div className="bg-black/50 p-5 rounded-2xl border border-gray-800">
                    <div className="text-xs text-amber-400 font-bold">Itens Vencendo Hoje</div>
                    <div className="text-2xl font-black text-white mt-1">5 unidades</div>
                  </div>
                  <div className="bg-black/50 p-5 rounded-2xl border border-gray-800">
                    <div className="text-xs text-orange-400 font-bold">Economia Gerada por IA</div>
                    <div className="text-2xl font-black text-[#FF6B00] mt-1">R$ 1.250,00</div>
                  </div>
                </div>
              </div>
            )}

            {activeMockupTab === 'ia' && (
              <div className="space-y-6 animate-fade-in text-center max-w-xl mx-auto py-8">
                <div className="w-16 h-16 rounded-3xl bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center mx-auto text-2xl font-bold">
                  📸
                </div>
                <h3 className="text-xl font-black text-white">Scanner Inteligente por IA</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Basta apontar a câmera do celular para qualquer etiqueta de balança ou embalagem. Nossa inteligência artificial extrai automaticamente nome, validade, peso e preço em menos de 2 segundos.
                </p>
                <div className="p-4 bg-black/60 rounded-2xl border border-gray-800 text-left space-y-2 text-xs font-mono">
                  <div className="text-[#FF6B00]">✓ Produto Detectado: Pão de Centeio Artesanal</div>
                  <div>✓ Validade Identificada: 29/07/2026</div>
                  <div>✓ Preço por Kg: R$ 24,90</div>
                </div>
              </div>
            )}

            {activeMockupTab === 'produtos' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                  <h3 className="text-lg font-black text-white">Estoque & Descartes Ativos</h3>
                  <span className="text-xs text-gray-400">Total: 42 registros</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-4 bg-black/50 rounded-xl border border-gray-800 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">Queijo Mussarela Fatiado (Peça)</div>
                      <div className="text-gray-400 text-[11px]">Categoria: Frios • Validade: 25/07/2026</div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-bold">Vencendo Amanhã</span>
                  </div>
                  <div className="p-4 bg-black/50 rounded-xl border border-gray-800 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">Presunto Cozido Extra</div>
                      <div className="text-gray-400 text-[11px]">Categoria: Frios • Validade: 28/07/2026</div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-orange-500/20 text-[#FF6B00] font-bold">Estoque Normal</span>
                  </div>
                </div>
              </div>
            )}

            {activeMockupTab === 'relatorios' && (
              <div className="space-y-6 animate-fade-in text-center max-w-xl mx-auto py-8">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-2xl font-bold">
                  📋
                </div>
                <h3 className="text-xl font-black text-white">Relatórios Executivos em PDF</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Gere relatórios profissionais prontos para impressão ou auditoria sanitária com um único clique. Controle total de perdas por período, operador e categoria.
                </p>
              </div>
            )}

            {activeMockupTab === 'perdas' && (
              <div className="space-y-6 animate-fade-in text-center max-w-xl mx-auto py-8">
                <div className="w-16 h-16 rounded-3xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto text-2xl font-bold">
                  📉
                </div>
                <h3 className="text-xl font-black text-white">Gráficos de Evolução de Perdas</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Visualize tendências semanais e mensais de desperdício para ajustar fornadas e compras com precisão cirúrgica.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SEÇÃO RECURSOS (12 CARDS) */}
      <section id="recursos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#FF6B00] bg-black px-3 py-1 rounded-full">
              Recursos Avançados
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111]">
              Tudo o que sua padaria precisa para operar sem desperdícios
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Tecnologia de ponta desenvolvida sob medida para o setor de panificação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-[#FF6B00] transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-[#FF6B00] flex items-center justify-center font-bold">✓</div>
              <h3 className="font-extrabold text-sm text-gray-900">Controle de Validade</h3>
              <p className="text-xs text-gray-600">Acompanhamento rigoroso de datas críticas com alertas antecipados.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-[#FF6B00] transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-[#FF6B00] flex items-center justify-center font-bold">📉</div>
              <h3 className="font-extrabold text-sm text-gray-900">Controle de Perdas</h3>
              <p className="text-xs text-gray-600">Registro detalhado de descartes, avarias e quebras operacionais.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-[#FF6B00] transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-[#FF6B00] flex items-center justify-center font-bold">🤖</div>
              <h3 className="font-extrabold text-sm text-gray-900">Cadastro Automático por IA</h3>
              <p className="text-xs text-gray-600">Leitura instantânea de etiquetas por foto com inteligência artificial.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-[#FF6B00] transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-[#FF6B00] flex items-center justify-center font-bold">📊</div>
              <h3 className="font-extrabold text-sm text-gray-900">Dashboard Inteligente</h3>
              <p className="text-xs text-gray-600">Métricas financeiras e operacionais em tempo real no painel.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-[#FF6B00] transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-[#FF6B00] flex items-center justify-center font-bold">📋</div>
              <h3 className="font-extrabold text-sm text-gray-900">Relatórios Executivos</h3>
              <p className="text-xs text-gray-600">Exportação em PDF pronta para gerência e auditorias sanitárias.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-[#FF6B00] transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-[#FF6B00] flex items-center justify-center font-bold">📦</div>
              <h3 className="font-extrabold text-sm text-gray-900">Controle de Estoque</h3>
              <p className="text-xs text-gray-600">Gestão simplificada de lotes e categorias de produtos.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-[#FF6B00] transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-[#FF6B00] flex items-center justify-center font-bold">📖</div>
              <h3 className="font-extrabold text-sm text-gray-900">Histórico Completo</h3>
              <p className="text-xs text-gray-600">Rastreabilidade total de todas as movimentações e vendas.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-[#FF6B00] transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-[#FF6B00] flex items-center justify-center font-bold">🔔</div>
              <h3 className="font-extrabold text-sm text-gray-900">Alertas Automáticos</h3>
              <p className="text-xs text-gray-600">Notificações visuais e sonoras para produtos próximos ao vencimento.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-[#FF6B00] transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-[#FF6B00] flex items-center justify-center font-bold">🔍</div>
              <h3 className="font-extrabold text-sm text-gray-900">Busca Rápida</h3>
              <p className="text-xs text-gray-600">Encontre qualquer item instantaneamente por nome ou categoria.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-[#FF6B00] transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-[#FF6B00] flex items-center justify-center font-bold">☁️</div>
              <h3 className="font-extrabold text-sm text-gray-900">Sistema em Nuvem</h3>
              <p className="text-xs text-gray-600">Segurança de dados de nível bancário e acesso de qualquer lugar.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-[#FF6B00] transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-[#FF6B00] flex items-center justify-center font-bold">👥</div>
              <h3 className="font-extrabold text-sm text-gray-900">Múltiplos Operadores</h3>
              <p className="text-xs text-gray-600">Acesso simultâneo para balconistas, gerentes e administradores.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-[#FF6B00] transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-[#FF6B00] flex items-center justify-center font-bold">🔄</div>
              <h3 className="font-extrabold text-sm text-gray-900">Atualizações Automáticas</h3>
              <p className="text-xs text-gray-600">Novas funcionalidades adicionadas sem custo extra ou instalações.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO BENEFÍCIOS (NÚMEROS GRANDES) */}
      <section id="beneficios" className="py-24 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#FF6B00] bg-black px-3 py-1 rounded-full">
              Resultados Comprovados
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111]">
              Impacto direto no lucro e na organização da padaria
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-sm space-y-3">
              <div className="text-5xl sm:text-6xl font-black text-[#111111] tracking-tight">
                Até <span className="text-[#FF6B00]">80%</span>
              </div>
              <h3 className="font-extrabold text-base text-gray-900">Menos tempo no cadastro</h3>
              <p className="text-xs text-gray-600">
                A IA elimina a digitação manual, permitindo que sua equipe cadastre itens em segundos.
              </p>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-sm space-y-3">
              <div className="text-5xl sm:text-6xl font-black text-[#111111] tracking-tight">
                Redução
              </div>
              <h3 className="font-extrabold text-base text-gray-900">Significativa do Desperdício</h3>
              <p className="text-xs text-gray-600">
                Identifique produtos antes de vencerem e recupere receita com campanhas direcionadas.
              </p>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-sm space-y-3">
              <div className="text-5xl sm:text-6xl font-black text-[#111111] tracking-tight">
                100%
              </div>
              <h3 className="font-extrabold text-base text-gray-900">Informações Centralizadas</h3>
              <p className="text-xs text-gray-600">
                Gestão unificada em nuvem acessível pelo celular, tablet ou computador do caixa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO PROCESSO (COMO FUNCIONA A IMPLANTAÇÃO) */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#FF6B00] bg-black px-3 py-1 rounded-full">
              Implantação Simples
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111]">
              Como funciona para começar
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Acompanhamento humanizado do início ao fim por nossos especialistas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 space-y-4 relative">
              <div className="text-3xl font-black text-gray-300">01</div>
              <h3 className="font-black text-base text-gray-900">Entramos em contato</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Você solicita a demonstração e nossa equipe entra em contato rapidamente para entender suas necessidades.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 space-y-4 relative">
              <div className="text-3xl font-black text-gray-300">02</div>
              <h3 className="font-black text-base text-gray-900">Configuramos a padaria</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Criamos o seu código de ativação exclusivo e preparamos o ambiente personalizado para sua panificadora.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 space-y-4 relative">
              <div className="text-3xl font-black text-gray-300">03</div>
              <h3 className="font-black text-base text-gray-900">Treinamos sua equipe</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Realizamos um treinamento rápido com seus operadores para uso do leitor de IA e controle diário.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 space-y-4 relative">
              <div className="text-3xl font-black text-gray-300">04</div>
              <h3 className="font-black text-base text-gray-900">Sistema pronto para uso</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Sua padaria operando com controle total de validade e suporte contínuo da nossa equipe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS PLACEHOLDERS */}
      <section className="py-24 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#FF6B00] bg-black px-3 py-1 rounded-full">
              Nossos Parceiros
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111]">
              O que dizem os donos de padarias parceiras
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
              <div className="text-[#FF6B00] font-black text-xl">“</div>
              <p className="text-xs text-gray-700 leading-relaxed italic font-medium">
                "O leitor de etiquetas por IA mudou a rotina da nossa padaria. Reduzimos o tempo de cadastro pela metade e praticamente zeramos o descarte surpresa de frios."
              </p>
              <div className="pt-4 border-t border-gray-100">
                <div className="font-extrabold text-sm text-gray-900">Carlos Eduardo</div>
                <div className="text-[11px] text-gray-500">Panificadora Estrela do Bairro</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
              <div className="text-[#FF6B00] font-black text-xl">“</div>
              <p className="text-xs text-gray-700 leading-relaxed italic font-medium">
                "O suporte é excelente. O sistema é extremamente leve, funciona no celular de qualquer funcionário e nos deu clareza total sobre o estoque."
              </p>
              <div className="pt-4 border-t border-gray-100">
                <div className="font-extrabold text-sm text-gray-900">Marcos Vinícius</div>
                <div className="text-[11px] text-gray-500">Padaria & Confeitaria Sabor d'Ouro</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
              <div className="text-[#FF6B00] font-black text-xl">“</div>
              <p className="text-xs text-gray-700 leading-relaxed italic font-medium">
                "Antes perdíamos muito dinheiro com produtos vencendo no fundo do estoque. Com os alertas automáticos da Padaria.io, conseguimos agir antes de perder o produto."
              </p>
              <div className="pt-4 border-t border-gray-100">
                <div className="font-extrabold text-sm text-gray-900">Ana Paula Silveira</div>
                <div className="text-[11px] text-gray-500">Panificadora Pão Dourado</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#FF6B00] bg-black px-3 py-1 rounded-full">
              Dúvidas Frequentes
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111]">
              Tudo o que você precisa saber
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Preciso instalar alguma coisa no computador?",
                a: "Não! A Padaria.io é 100% em nuvem. Você pode acessar direto pelo navegador do computador, tablet ou celular, sem instalações complexas."
              },
              {
                q: "Funciona em celular?",
                a: "Sim, o sistema é totalmente otimizado para celulares e tablets, permitindo que os funcionários tirem fotos das etiquetas diretamente na área de produção ou estoque."
              },
              {
                q: "Posso usar em mais de um computador ou celular?",
                a: "Sim! Vários operadores podem acessar simultaneamente utilizando o código de ativação exclusivo da sua padaria."
              },
              {
                q: "Como funciona o suporte técnico?",
                a: "O suporte é humanizado e realizado diretamente via WhatsApp e canais dedicados com nossa equipe de consultores."
              },
              {
                q: "Como é feita a implantação?",
                a: "Nossa equipe cuida de toda a configuração inicial e cadastro da sua padaria. Você recebe o código de ativação pronto para uso."
              },
              {
                q: "Quanto tempo leva para começar?",
                a: "Em menos de 24 horas após o contato com nossa equipe, sua padaria já estará configurada e operando no sistema."
              },
              {
                q: "A IA reconhece qualquer etiqueta?",
                a: "Sim! Nossa inteligência artificial foi treinada para ler etiquetas de balança eletrônica, códigos de barras e embalagens de fabricantes."
              }
            ].map((faq, idx) => {
              const isOpen = faqOpen === idx;
              return (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setFaqOpen(isOpen ? null : idx)}
                    className="w-full p-6 text-left font-extrabold text-sm sm:text-base text-gray-900 flex items-center justify-between cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 bg-[#111111] text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF6B00]/15 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 text-[#FF6B00] text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Padaria.io</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Comece a reduzir perdas na sua padaria hoje mesmo.
          </h2>

          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
            Entre em contato com nossa equipe e agende uma demonstração personalizada para a sua panificadora.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setDemoModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#00c864] text-black font-black text-sm transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Falar com um Consultor</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-gray-100 text-black font-black text-sm transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-orange-600" />
              <span>Falar com um Consultor</span>
            </a>
          </div>

          <p className="text-xs text-gray-500 pt-2 font-medium">
            🔒 Atendimento direto e exclusivo • Sem planos automáticos ou taxas ocultas
          </p>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="bg-black text-gray-400 py-16 border-t border-gray-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-white p-1">
                <img src="https://i.imgur.com/r41aOzi.png" alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <span className="font-black text-white text-base">PADARIA<span className="text-[#FF6B00]">.io</span></span>
            </div>
            <p className="text-gray-500 text-[11px] leading-relaxed">
              Sistema inteligente de monitoramento de validade e redução de desperdícios para o setor de panificação.
            </p>
          </div>

          <div className="space-y-3">
            <div className="font-extrabold text-white text-xs uppercase tracking-wider">Empresa</div>
            <p className="font-bold text-gray-300">Equipe de Atendimento</p>
            <p className="text-gray-500 text-[11px]">Inovação e eficiência para o varejo de alimentos.</p>
          </div>

          <div className="space-y-3">
            <div className="font-extrabold text-white text-xs uppercase tracking-wider">Contato & Suporte</div>
            <p><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#FF6B00] transition-colors">WhatsApp: (61) 99650-7712</a></p>
            <p><a href="mailto:weskleyg4000@gmail.com" className="hover:text-[#FF6B00] transition-colors">Email: contato@padaria.io</a></p>
            <p className="text-gray-500">Instagram: @padaria.io</p>
          </div>

          <div className="space-y-3">
            <div className="font-extrabold text-white text-xs uppercase tracking-wider">Legal & Sistema</div>
            <p><button onClick={onOpenPrivacy} className="hover:text-white transition-colors cursor-pointer">Política de Privacidade</button></p>
            <p><button onClick={onOpenPrivacy} className="hover:text-white transition-colors cursor-pointer">Termos de Uso</button></p>
            <p><button onClick={onOpenAdmin} className="text-[#FF6B00] hover:underline font-bold cursor-pointer">Painel Administrativo</button></p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-600">
          <div>© 2026 Padaria.io • Todos os direitos reservados.</div>
          <div className="mt-2 sm:mt-0">Padaria.io v2.5 • Produção</div>
        </div>
      </footer>

      {/* DEMO REQUEST MODAL */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center font-bold">
                ✨
              </div>
              <h3 className="text-2xl font-black text-gray-900">Falar com um Consultor</h3>
              <p className="text-xs text-gray-600">
                Preencha seus dados para conversarmos diretamente via WhatsApp com nossa equipe.
              </p>
            </div>

            {demoSubmitted ? (
              <div className="p-6 bg-orange-50 border border-orange-200 text-orange-800 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-orange-600 mx-auto" />
                <div className="font-extrabold text-sm">Redirecionando para o WhatsApp...</div>
                <p className="text-xs text-orange-700">Nossa equipe já recebeu seu pedido de demonstração.</p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Seu Nome</label>
                  <input
                    type="text"
                    required
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome da Padaria</label>
                  <input
                    type="text"
                    required
                    value={demoBakery}
                    onChange={(e) => setDemoBakery(e.target.value)}
                    placeholder="Ex: Padaria Estrela do Bairro"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    required
                    value={demoPhone}
                    onChange={(e) => setDemoPhone(e.target.value)}
                    placeholder="Ex: (61) 99999-9999"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-[#FF6B00] hover:bg-[#00c864] text-black font-black text-xs transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Enviar para WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
