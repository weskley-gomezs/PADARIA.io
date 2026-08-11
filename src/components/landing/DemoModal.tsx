import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, Building2, User, Phone, CheckCircle2 } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWhatsApp: (customMsg?: string) => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose, onOpenWhatsApp }) => {
  const [name, setName] = useState('');
  const [bakeryName, setBakeryName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `Olá! Meu nome é ${name || 'Gestor(a)'}, da padaria ${
      bakeryName || 'Panificação'
    }. Gostaria de agendar uma demonstração gratuita do Padaria.io. Meu telefone: ${
      phone || 'não informado'
    }.`;
    onOpenWhatsApp(message);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl border border-gray-200 max-w-lg w-full shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-[#FF6B00] uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              DEMONSTRAÇÃO GRATUITA
            </span>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              Agende uma apresentação personalizada
            </h3>
            <p className="text-xs text-gray-600 font-medium">
              Preencha seus dados para conectar direto com um especialista no WhatsApp.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Seu Nome</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 text-xs font-medium text-gray-900 outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Nome da Padaria ou Confeitaria</span>
              </label>
              <input
                type="text"
                required
                value={bakeryName}
                onChange={(e) => setBakeryName(e.target.value)}
                placeholder="Ex: Padaria Pão Doce"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 text-xs font-medium text-gray-900 outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>WhatsApp com DDD</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: (11) 99999-8888"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 text-xs font-medium text-gray-900 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-[#FF6B00] hover:bg-[#E8571A] text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 hover:shadow-orange-500/35 flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#FF6B00]" />
              <span>Confirmar e Falar no WhatsApp</span>
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 flex items-center justify-center space-x-2 text-[11px] font-bold text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Atendimento em minutos sem compromisso</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
