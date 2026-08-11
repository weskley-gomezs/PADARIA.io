import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, MessageCircle, ArrowRight, Home, ChefHat, Sparkles } from 'lucide-react';

interface LandingHeaderProps {
  onEnterApp: () => void;
  onOpenWhatsApp: (msg?: string) => void;
  onOpenDemoModal: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onEnterApp,
  onOpenWhatsApp,
  onOpenDemoModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Desafios', href: '#desafios' },
    { name: 'Como Funciona', href: '#como-funciona' },
    { name: 'Funcionalidades', href: '#funcionalidades' },
    { name: 'Demonstração', href: '#demonstracao' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-22">
          {/* Brand Logo */}
          <a href="#" className="flex items-center shrink-0 cursor-pointer group">
            <img
              src="https://i.imgur.com/ZGsjvWy.png"
              alt="PADARIA.io Logo"
              className="h-12 sm:h-16 object-contain transition-transform group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </a>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center space-x-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs font-bold text-gray-700 hover:text-[#FF6B00] transition-colors relative py-1 group"
              >
                <span>{link.name}</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FF6B00] transition-all duration-200 group-hover:w-full" />
              </a>
            ))}
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
            className="lg:hidden border-t border-gray-200 bg-white px-4 py-6 space-y-5 shadow-2xl"
          >
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-bold text-gray-800 hover:text-[#FF6B00] py-2 border-b border-gray-100 transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            <div className="flex flex-col space-y-2.5 pt-2">
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
