import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, MessageCircle, ArrowRight, Home, ChefHat, Sparkles } from 'lucide-react';

interface LandingHeaderProps {
  onEnterApp: () => void;
  onOpenWhatsApp: (msg?: string) => void;
  onOpenDemoModal: () => void;
  onNavigate?: (path: string) => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onEnterApp,
  onOpenWhatsApp,
  onOpenDemoModal,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    setSolutionsDropdownOpen(false);
    if (href.startsWith('/')) {
      if (onNavigate) {
        onNavigate(href);
      } else {
        window.location.href = href;
      }
    } else {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const solutionLinks = [
    { name: 'Software para Padarias', href: '/software-para-padarias', desc: 'Sistema completo para gestão de panificação' },
    { name: 'Controle de Estoque', href: '/controle-de-estoque-para-padarias', desc: 'Gestão de insumos, farinhas e frios' },
    { name: 'Controle de Perdas', href: '/controle-de-perdas-para-padarias', desc: 'Auditoria de quebras e baixas por foto' },
    { name: 'Controle de Validade', href: '/controle-de-validade-para-padarias', desc: 'Alertas preventivos e conformidade sanitária' },
    { name: 'Divergência de Estoque', href: '/divergencia-de-estoque', desc: 'Conferência física x esperado' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-22">
          {/* Brand Logo */}
          <button
            onClick={() => handleNavClick('/')}
            className="flex items-center shrink-0 cursor-pointer group text-left"
          >
            <img
              src="https://i.imgur.com/ZGsjvWy.png"
              alt="PADARIA.io Logo"
              className="h-12 sm:h-16 object-contain transition-transform group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </button>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center space-x-6">
            {/* Soluções Dropdown */}
            <div
              className="relative py-2"
              onMouseEnter={() => setSolutionsDropdownOpen(true)}
              onMouseLeave={() => setSolutionsDropdownOpen(false)}
            >
              <button
                className="text-xs font-bold text-gray-700 hover:text-[#FF6B00] transition-colors flex items-center space-x-1 cursor-pointer"
                onClick={() => handleNavClick('/software-para-padarias')}
              >
                <span>Soluções</span>
                <span className="text-[10px] text-gray-400">▾</span>
              </button>

              <AnimatePresence>
                {solutionsDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-80 bg-white rounded-2xl shadow-xl border border-gray-200/90 p-3 space-y-1 z-50"
                  >
                    {solutionLinks.map((sol) => (
                      <button
                        key={sol.name}
                        onClick={() => handleNavClick(sol.href)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-orange-50/50 transition-colors group cursor-pointer"
                      >
                        <p className="text-xs font-bold text-gray-900 group-hover:text-[#FF6B00] transition-colors">
                          {sol.name}
                        </p>
                        <p className="text-[11px] text-gray-500 line-clamp-1">{sol.desc}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => handleNavClick('/#desafios')}
              className="text-xs font-bold text-gray-700 hover:text-[#FF6B00] transition-colors cursor-pointer"
            >
              Desafios
            </button>

            <button
              onClick={() => handleNavClick('/#como-funciona')}
              className="text-xs font-bold text-gray-700 hover:text-[#FF6B00] transition-colors cursor-pointer"
            >
              Como Funciona
            </button>

            <button
              onClick={() => handleNavClick('/#funcionalidades')}
              className="text-xs font-bold text-gray-700 hover:text-[#FF6B00] transition-colors cursor-pointer"
            >
              Funcionalidades
            </button>

            <button
              onClick={() => handleNavClick('/conteudos')}
              className="text-xs font-bold text-gray-700 hover:text-[#FF6B00] transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
              <span>Guias & Artigos</span>
            </button>

            <button
              onClick={() => handleNavClick('/#faq')}
              className="text-xs font-bold text-gray-700 hover:text-[#FF6B00] transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={onEnterApp}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-all cursor-pointer border border-transparent hover:border-gray-200"
            >
              Acessar Sistema
            </button>

            <button
              onClick={onOpenDemoModal}
              className="px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#E8571A] text-white text-xs font-extrabold transition-all shadow-md shadow-orange-500/20 hover:shadow-orange-500/35 hover:scale-[1.03] active:scale-[0.98] flex items-center space-x-2 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white text-[#FF6B00]" />
              <span>Agendar demonstração</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-gray-100 text-gray-700 hover:text-gray-900 cursor-pointer focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-gray-200 bg-white px-4 py-6 space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF6B00] px-2 block mb-2">
                Soluções Especializadas
              </span>
              {solutionLinks.map((sol) => (
                <button
                  key={sol.name}
                  onClick={() => handleNavClick(sol.href)}
                  className="w-full text-left p-2 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-[#FF6B00] transition-colors"
                >
                  {sol.name}
                </button>
              ))}
            </div>

            <nav className="flex flex-col space-y-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => handleNavClick('/conteudos')}
                className="text-left text-xs font-bold text-gray-800 hover:text-[#FF6B00] py-2 px-2"
              >
                📚 Biblioteca de Conteúdos & Guias
              </button>
              <button
                onClick={() => handleNavClick('/#desafios')}
                className="text-left text-xs font-bold text-gray-800 hover:text-[#FF6B00] py-2 px-2"
              >
                Desafios da Panificação
              </button>
              <button
                onClick={() => handleNavClick('/#como-funciona')}
                className="text-left text-xs font-bold text-gray-800 hover:text-[#FF6B00] py-2 px-2"
              >
                Como Funciona
              </button>
              <button
                onClick={() => handleNavClick('/#funcionalidades')}
                className="text-left text-xs font-bold text-gray-800 hover:text-[#FF6B00] py-2 px-2"
              >
                Funcionalidades
              </button>
              <button
                onClick={() => handleNavClick('/#faq')}
                className="text-left text-xs font-bold text-gray-800 hover:text-[#FF6B00] py-2 px-2"
              >
                Perguntas Frequentes (FAQ)
              </button>
            </nav>

            <div className="flex flex-col space-y-2.5 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDemoModal();
                }}
                className="w-full py-3.5 rounded-xl bg-[#FF6B00] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md shadow-orange-500/20 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#FF6B00]" />
                <span>Agendar demonstração</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onEnterApp();
                }}
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-800 text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer hover:bg-gray-200"
              >
                <ChefHat className="w-4 h-4 text-[#FF6B00]" />
                <span>Acessar Sistema</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
