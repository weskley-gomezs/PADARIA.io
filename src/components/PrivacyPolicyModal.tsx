import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#E0E0E0] space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-[#D4A574]" />
            <h3 className="text-lg font-extrabold text-[#2C2C2C]">Política de Privacidade & Termos</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 text-xs text-[#2C2C2C] leading-relaxed pr-2 grow">
          <section className="space-y-1">
            <h4 className="font-bold text-sm text-[#E8571A]">1. Coleta e Uso de Dados</h4>
            <p>
              O sistema <strong>PADARIA.io</strong> armazena exclusivamente os dados de inventário, produtos, datas de validade e cadastros operacionais necessários para o monitoramento e vigilância sanitária interna de panificadoras e estabelecimentos comerciais.
            </p>
          </section>

          <section className="space-y-1">
            <h4 className="font-bold text-sm text-[#E8571A]">2. Segurança e Controle por Código de Ativação</h4>
            <p>
              Cada panificadora vincula seus dados a um <strong>Código de Ativação único de 8 caracteres</strong>. Este código concede acesso restrito ao ambiente da sua empresa. Nenhuma informação de inventário é compartilhada com concorrentes ou terceiros não autorizados.
            </p>
          </section>

          <section className="space-y-1">
            <h4 className="font-bold text-sm text-[#E8571A]">3. Armazenamento e Sincronização em Nuvem</h4>
            <p>
              Os dados são armazenados localmente e sincronizados de forma segura via arquitetura Firebase/Cloud para garantir alta disponibilidade e redundância contra perdas acidentais de registros de lotes e produtos.
            </p>
          </section>

          <section className="space-y-1">
            <h4 className="font-bold text-sm text-[#E8571A]">4. Conformidade com a Vigilância Sanitária</h4>
            <p>
              O PADARIA.io é uma ferramenta de gestão preventiva para mitigação do descarte de alimentos e conformidade sanitária. O controle físico diário dos lotes permanece sob responsabilidade do gestor da panificadora.
            </p>
          </section>
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#D4A574] hover:bg-[#c29363] text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            Fechar e Fechar Termos
          </button>
        </div>
      </div>
    </div>
  );
};
