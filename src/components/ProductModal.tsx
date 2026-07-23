import React, { useState, useEffect } from 'react';
import { X, Calendar, Package, Tag, Save, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { formatDateToISO } from '../utils/dateUtils';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nome: string, quantidade: number, dataValidade: string, categoria?: string) => void;
  productToEdit?: Product | null;
}

const CATEGORIES = [
  'Panificação',
  'Confeitaria',
  'Laticínios',
  'Frios & Embutidos',
  'Salgados',
  'Bebidas',
  'Embalados',
  'Geral',
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
}) => {
  const [nome, setNome] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [dataValidade, setDataValidade] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('Panificação');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const todayIso = formatDateToISO(new Date());

  useEffect(() => {
    if (productToEdit) {
      setNome(productToEdit.nome);
      setQuantidade(productToEdit.quantidade);
      setDataValidade(productToEdit.dataValidade);
      setCategoria(productToEdit.categoria || 'Panificação');
    } else {
      setNome('');
      setQuantidade(1);
      // Default validity date to 3 days from today
      const future = new Date();
      future.setDate(future.getDate() + 3);
      setDataValidade(formatDateToISO(future));
      setCategoria('Panificação');
    }
    setErrorMsg('');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nome.trim()) {
      setErrorMsg('Por favor, informe o nome do produto.');
      return;
    }

    if (quantidade <= 0) {
      setErrorMsg('A quantidade deve ser um número positivo (mínimo 1).');
      return;
    }

    if (!dataValidade) {
      setErrorMsg('Por favor, selecione a data de validade.');
      return;
    }

    // Validation: Prevent past dates when creating new product
    if (!productToEdit && dataValidade < todayIso) {
      setErrorMsg('A data de validade não pode ser no passado ao cadastrar novo produto.');
      return;
    }

    onSave(nome, quantidade, dataValidade, categoria);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E0E0E0] space-y-6 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#F5E6D3] text-[#E8571A] rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-[#2C2C2C]">
              {productToEdit ? 'Editar Produto' : 'Adicionar Novo Produto'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Produto */}
          <div>
            <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
              Nome do Produto *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Pão Francês, Bolo de Chocolate..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm"
              required
              autoFocus
            />
          </div>

          {/* Quantidade & Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data de Validade */}
          <div>
            <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
              Data de Validade * (DD/MM/YYYY)
            </label>
            <div className="relative">
              <input
                type="date"
                value={dataValidade}
                min={!productToEdit ? todayIso : undefined}
                onChange={(e) => setDataValidade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm font-bold text-[#2C2C2C]"
                required
              />
              <Calendar className="w-5 h-5 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Produtos vencendo em até 3 dias receberão alerta amarelo. Vencidos ficarão em vermelho.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#D4A574] hover:bg-[#c29363] text-white shadow-sm transition-all flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{productToEdit ? 'Atualizar Produto' : 'Salvar Produto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
