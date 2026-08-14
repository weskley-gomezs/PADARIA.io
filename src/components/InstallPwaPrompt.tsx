import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone, Monitor, Share, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPwaPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // 1. Detect if already running in standalone mode (PWA installed)
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setIsStandalone(isInStandalone);

    // 2. Detect Platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // 3. Listen for native PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Auto show pop-up after 2.5 seconds if not installed and not dismissed before in this session
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed && !isInStandalone) {
        setTimeout(() => setShowPopup(true), 2500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also listen for custom event from Navbar or anywhere in app
    const handleTriggerInstall = () => {
      setShowPopup(true);
      setShowGuideModal(true);
    };
    window.addEventListener('trigger-pwa-install', handleTriggerInstall);

    // If app installed
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowPopup(false);
      setShowGuideModal(false);
      setIsStandalone(true);
    });

    // Auto prompt check for iOS / Mobile fallback
    if (!isInStandalone) {
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => {
          setShowPopup(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger-pwa-install', handleTriggerInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setShowPopup(false);
          setShowGuideModal(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA install error:', err);
        setShowGuideModal(true);
      }
    } else {
      // If no native prompt event (iOS or already prompted), show instructions modal
      setShowGuideModal(true);
    }
  };

  const handleDismissPopup = () => {
    setShowPopup(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (isStandalone) return null;

  return (
    <>
      {/* FLOATING POP-UP INSTALL BANNER (DESKTOP & MOBILE) */}
      <AnimatePresence>
        {showPopup && !showGuideModal && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-[#1A1C23] text-white rounded-3xl p-5 shadow-2xl border-2 border-[#E8571A] backdrop-blur-xl"
          >
            {/* Top Close Button */}
            <button
              onClick={handleDismissPopup}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start space-x-4">
              {/* App Icon */}
              <div className="relative shrink-0">
                <img
                  src="https://i.imgur.com/HSJoe7l.png"
                  alt="Padariaio Icon"
                  className="w-14 h-14 rounded-2xl object-cover shadow-md border border-orange-500/30"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#E8571A] text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
                  ★
                </span>
              </div>

              {/* Text & Call to Action */}
              <div className="space-y-1 pr-6 flex-1">
                <div className="flex items-center space-x-1.5 text-xs font-black text-amber-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Baixar Aplicativo</span>
                </div>
                <h3 className="font-extrabold text-sm text-white leading-snug">
                  Instalar Padariaio no seu celular ou computador
                </h3>
                <p className="text-[11px] text-gray-300 font-medium leading-relaxed">
                  Acesso instantâneo de 1 clique direto da tela inicial, sem abrir navegador!
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex items-center gap-2 pt-2 border-t border-gray-800">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInstallClick}
                className="flex-1 py-3 px-4 rounded-xl bg-[#E8571A] hover:bg-[#d44e15] text-white text-xs font-black shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Instalar App Agora</span>
              </motion.button>

              <button
                onClick={() => setShowGuideModal(true)}
                className="py-3 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Como funciona?
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP-BY-STEP INSTALLATION GUIDE MODAL (DESKTOP & MOBILE) */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 relative"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1A1C23] to-[#111827] p-6 text-white relative">
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-4">
                  <img
                    src="https://i.imgur.com/HSJoe7l.png"
                    alt="Padariaio"
                    className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-[#E8571A]"
                  />
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
                      Aplicativo Oficial
                    </span>
                    <h2 className="text-xl font-black text-white mt-1">
                      Instalar PADARIA.io
                    </h2>
                    <p className="text-xs text-gray-300 font-medium">
                      Prático, rápido e funciona sem internet!
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Direct Action if prompt available */}
                {deferredPrompt && (
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-center space-y-3">
                    <p className="text-xs font-extrabold text-[#E8571A]">
                      ⚡ Seu navegador suporta instalação direta!
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleInstallClick}
                      className="w-full py-3.5 rounded-xl bg-[#E8571A] hover:bg-[#d44e15] text-white text-sm font-black shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Download className="w-5 h-5" />
                      <span>Clique para Instalar Agora</span>
                    </motion.button>
                  </div>
                )}

                {/* Platform Specific Instructions */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#E8571A]" />
                    <span>Instruções Passo a Passo por Dispositivo</span>
                  </h4>

                  {/* iOS Instructions */}
                  <div className={`p-4 rounded-2xl border transition-all ${platform === 'ios' ? 'bg-orange-50/70 border-orange-300 shadow-xs' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center space-x-2 font-black text-sm text-gray-900 mb-2">
                      <span>🍎 iPhone / iPad (Safari)</span>
                      {platform === 'ios' && (
                        <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] rounded-full uppercase">Seu Dispositivo</span>
                      )}
                    </div>
                    <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside font-medium">
                      <li>No navegador Safari, toque no botão de <strong>Compartilhar</strong> <Share className="w-3.5 h-3.5 inline text-blue-600" /> na barra inferior.</li>
                      <li>Role a lista de opções para baixo e selecione <strong>"Adicionar à Tela de Início"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-gray-800" />.</li>
                      <li>Confirme tocando em <strong>"Adicionar"</strong> no canto superior direito.</li>
                    </ol>
                  </div>

                  {/* Android Instructions */}
                  <div className={`p-4 rounded-2xl border transition-all ${platform === 'android' ? 'bg-orange-50/70 border-orange-300 shadow-xs' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center space-x-2 font-black text-sm text-gray-900 mb-2">
                      <span>🤖 Android (Chrome / Edge)</span>
                      {platform === 'android' && (
                        <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] rounded-full uppercase">Seu Dispositivo</span>
                      )}
                    </div>
                    <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside font-medium">
                      <li>Toque no menu de 3 pontos <strong>(⋮)</strong> no canto superior direito do Chrome.</li>
                      <li>Selecione a opção <strong>"Instalar Aplicativo"</strong> ou <strong>"Adicionar à Tela Inicial"</strong>.</li>
                      <li>Confirme a instalação para ter o ícone do PADARIA.io na sua tela.</li>
                    </ol>
                  </div>

                  {/* Desktop Instructions */}
                  <div className={`p-4 rounded-2xl border transition-all ${platform === 'desktop' ? 'bg-orange-50/70 border-orange-300 shadow-xs' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center space-x-2 font-black text-sm text-gray-900 mb-2">
                      <Monitor className="w-4 h-4 text-gray-800" />
                      <span>💻 Computador (Chrome / Edge / Mac / Windows)</span>
                      {platform === 'desktop' && (
                        <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] rounded-full uppercase">Seu Dispositivo</span>
                      )}
                    </div>
                    <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside font-medium">
                      <li>Procure pelo ícone de instalação <Download className="w-3.5 h-3.5 inline text-[#E8571A]" /> ou computador no canto direito da barra de endereço do seu navegador.</li>
                      <li>Ou clique no botão <strong>"Instalar App Agora"</strong> disponível nesta tela.</li>
                      <li>O app abrirá em uma janela própria como um aplicativo nativo no seu computador!</li>
                    </ol>
                  </div>
                </div>

                {/* Benefits */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-around text-center text-[11px] font-bold text-gray-600">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Sem ocupar memória
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Carregamento instantâneo
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    100% Grátis
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 p-4 border-t border-gray-200 text-center">
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Entendi, fechar guia
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
