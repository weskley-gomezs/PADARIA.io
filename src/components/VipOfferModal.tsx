import React, { useState, useEffect } from 'react';
import { X, Percent, Tag, Calendar, Sparkles, Check } from 'lucide-react';
import { calculateDaysRemaining } from '../utils/dateUtils';

interface VipOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    valorOriginal: number;
    valorPromocional: number;
    desconto: number;
    nomeProduto: string;
    categoria: string;
  }) => void;
  productInfo: {
    productId: string;
    nomeProduto: string;
    categoria: string;
    valorOriginal: number;
    dataValidade: string;
  };
}

export const VipOfferModal: React.FC<VipOfferModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productInfo,
}) => {
  const [nomeProduto, setNomeProduto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [valorOriginal, setValorOriginal] = useState(15);
  const [desconto, setDesconto] = useState(10);
  const [valorPromocional, setValorPromocional] = useState(13.5);

  const daysRemaining = calculateDaysRemaining(productInfo.dataValidade);

  // Suggested discount logic based on days remaining
  // 3 days -> 10%
  // 2 days -> 15%
  // 1 day (or 0 days) -> 20%
  useEffect(() => {
    if (isOpen) {
      setNomeProduto(productInfo.nomeProduto);
      setCategoria(productInfo.categoria || 'Geral');
      
      const orig = productInfo.valorOriginal && productInfo.valorOriginal > 0 
        ? productInfo.valorOriginal 
        : 15.0;
      setValorOriginal(orig);

      let suggestedDiscount = 10;
      if (daysRemaining === 2) {
        suggestedDiscount = 15;
      } else if (daysRemaining <= 1) {
        suggestedDiscount = 20;
      }
      setDesconto(suggestedDiscount);
      
      const promo = orig * (1 - suggestedDiscount / 100);
      setValorPromocional(Number(promo.toFixed(2)));
    }
  }, [isOpen, productInfo, daysRemaining]);

  // Recalculate promotional value when original or discount changes
  const handleOriginalChange = (val: number) => {
    setValorOriginal(val);
    const promo = val * (1 - desconto / 100);
    setValorPromocional(Number(promo.toFixed(2)));
  };

  const handleDiscountChange = (val: number) => {
    setDesconto(val);
    const promo = valorOriginal * (1 - val / 100);
    setValorPromocional(Number(promo.toFixed(2)));
  };

  const handlePromoChange = (val: number) => {
    setValorPromocional(val);
    if (valorOriginal > 0) {
      const calculatedDiscount = ((valorOriginal - val) / valorOriginal) * 100;
      setDesconto(Number(calculatedDiscount.toFixed(1)));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      valorOriginal,
      valorPromocional,
      desconto,
      nomeProduto,
      categoria,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-150 space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#2C2C2C]">
                Deseja enviar este produto para o Clube VIP?
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">Clube VIP PADARIA.io • Evite desperdício e recupere receita</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Alert */}
        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs text-amber-800 space-y-1">
          <span className="font-extrabold flex items-center gap-1">
            ⚠️ Produto próximo ao vencimento ({daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'})
          </span>
          <p className="text-gray-600">
            Sugerimos automaticamente um desconto de <strong>{desconto}%</strong> para acelerar as vendas e evitar perdas.
          </p>
          <div className="mt-2 pt-2 border-t border-amber-200/60 text-[11px] text-amber-900 font-semibold flex items-center gap-1.5">
            <span>🏷️</span>
            <span>A busca no caixa via Scanner Clube VIP é realizada pelo <strong>Código de Barras</strong> do produto.</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Produto */}
          <div>
            <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
              Nome do Produto
            </label>
            <input
              type="text"
              value={nomeProduto}
              onChange={(e) => setNomeProduto(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Valor Original */}
            <div>
              <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                Preço Original (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorOriginal || ''}
                  onChange={(e) => handleOriginalChange(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold text-gray-700"
                  required
                />
              </div>
            </div>

            {/* Desconto Sugerido */}
            <div>
              <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                Desconto (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={desconto || ''}
                  onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                  className="w-full pr-8 pl-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold text-[#E8571A]"
                  required
                />
                <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
              </div>
            </div>
          </div>

          {/* Valor Promocional */}
          <div>
            <label className="block text-xs font-bold text-emerald-700 mb-1">
              Preço Promocional Clube VIP (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-emerald-600 font-bold">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorPromocional || ''}
                onChange={(e) => handlePromoChange(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-extrabold text-emerald-700"
                required
              />
              <Tag className="w-4 h-4 text-emerald-500 absolute right-3 top-3" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Não
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/10 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Sim</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
