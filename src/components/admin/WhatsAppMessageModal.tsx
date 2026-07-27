import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Copy,
  Check,
  Phone,
  Building2,
  Clock,
  AlertTriangle,
  Sparkles,
  Key,
  Receipt,
} from 'lucide-react';
import { BakeryCompany } from '../../types';
import { formatDateToBR } from '../../utils/dateUtils';

interface WhatsAppMessageModalProps {
  company: BakeryCompany | null;
  onClose: () => void;
}

type TemplateType = 'lembrete' | 'atraso' | 'boas_vindas' | 'implementacao';

export const WhatsAppMessageModal: React.FC<WhatsAppMessageModalProps> = ({
  company,
  onClose,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('lembrete');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (company) {
      const rawPhone = company.telefone ? company.telefone.replace(/\D/g, '') : '';
      setPhoneInput(rawPhone);
      generateMessage('lembrete', company, rawPhone);
    }
  }, [company]);

  if (!company) return null;

  const generateMessage = (type: TemplateType, c: BakeryCompany, phone: string) => {
    const currentDomain = typeof window !== 'undefined' ? window.location.origin : 'https://padariaio.com';
    const link = c.financeiro?.asaasPaymentLink 
      || c.financeiro?.ultimoLinkPagamento 
      || (c.financeiro?.historicoCobrancas && c.financeiro.historicoCobrancas[0]?.linkBoleto)
      || currentDomain;

    const valorMensal = (c.financeiro?.valorMensalidade || 199).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const valorImp = (c.financeiro?.valorImplementacao || 1500).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const dataVenc = formatDateToBR(c.financeiro?.dataProximaCobranca || '');

    let text = '';

    switch (type) {
      case 'lembrete':
        text = `Olá *${c.empresa}*! Tudo bem?\n\nPassando para lembrar que a mensalidade do seu sistema *PADARIA.io* (R$ ${valorMensal}) vence em *${dataVenc}*.\n\nVocê pode realizar o pagamento diretamente por este link do Asaas:\n🔗 ${link}\n\nCódigo da Empresa: *${c.codigoAtivacao}*\nQualquer dúvida estamos à disposição!`;
        break;

      case 'atraso':
        text = `Aviso Importante - *${c.empresa}*\n\nIdentificamos que a mensalidade do sistema *PADARIA.io* no valor de *R$ ${valorMensal}* venceu em *${dataVenc}* e consta pendente.\n\nPara manter o acesso ativo aos alertas de validade e vigilância sanitária, efetue o pagamento no link abaixo:\n🔗 ${link}\n\nCaso já tenha efetuado o pagamento, por favor desconsidere esta mensagem.`;
        break;

      case 'boas_vindas':
        text = `Seja bem-vindo ao *PADARIA.io*! 🚀\n\nO cadastro da *${c.empresa}* foi concluído com sucesso.\n\n🔑 *Sua Chave de Ativação / Código:* \`${c.codigoAtivacao}\` \n\nPara acessar o sistema:\n1. Acesse: ${currentDomain}\n2. Digite o código de 8 dígitos: *${c.codigoAtivacao}*\n3. Pronto! Seu controle de validade está ativo.`;
        break;

      case 'implementacao':
        text = `Olá *${c.empresa}*!\n\nSegue o link para pagamento da *Taxa de Implementação e Configuração* do sistema *PADARIA.io* no valor de *R$ ${valorImp}*:\n\n🔗 ${link}\n\nApós o pagamento, o suporte técnico realizará o treinamento da equipe. Obrigado!`;
        break;

      default:
        text = '';
    }

    setMessageText(text);
  };

  const handleTemplateChange = (type: TemplateType) => {
    setSelectedTemplate(type);
    generateMessage(type, company, phoneInput);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = phoneInput.replace(/\D/g, '');
    let fullPhone = cleanPhone;
    if (cleanPhone.length >= 10 && !cleanPhone.startsWith('55')) {
      fullPhone = '55' + cleanPhone;
    }

    const encoded = encodeURIComponent(messageText);
    const url = fullPhone
      ? `https://wa.me/${fullPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden space-y-0">
        {/* Header */}
        <div className="bg-[#2C2C2C] text-white p-5 flex items-center justify-between border-b border-[#D4A574]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-md">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Mensagens Prontas do WhatsApp</h3>
              <p className="text-xs text-gray-300">
                Empresa: <span className="font-bold text-[#D4A574]">{company.empresa}</span> ({company.codigoAtivacao})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Template Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Selecione o Modelo de Mensagem:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTemplateChange('lembrete')}
                className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer flex items-center space-x-2 ${
                  selectedTemplate === 'lembrete'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1. Lembrete Vencimento</span>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateChange('atraso')}
                className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer flex items-center space-x-2 ${
                  selectedTemplate === 'atraso'
                    ? 'bg-red-50 border-red-500 text-red-900 font-bold shadow-xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>2. Aviso de Atraso</span>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateChange('boas_vindas')}
                className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer flex items-center space-x-2 ${
                  selectedTemplate === 'boas_vindas'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Key className="w-4 h-4 text-blue-600 shrink-0" />
                <span>3. Boas-Vindas & Chave</span>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateChange('implementacao')}
                className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer flex items-center space-x-2 ${
                  selectedTemplate === 'implementacao'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Receipt className="w-4 h-4 text-amber-600 shrink-0" />
                <span>4. Taxa Implementação</span>
              </button>
            </div>
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Número do WhatsApp (DDD + Número):</span>
            </label>
            <input
              type="text"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Ex: 11999998888"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold"
            />
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Texto da Mensagem (Você pode editar livremente):
            </label>
            <textarea
              rows={7}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-sans text-gray-800 bg-[#FAFAF8] leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Texto Copiado!' : 'Copiar Texto'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Enviar via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
