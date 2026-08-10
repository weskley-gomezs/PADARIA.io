import React, { useState, useEffect } from 'react';
import { X, Calendar, Package, Save, AlertCircle, Camera, Barcode, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { formatDateToISO } from '../utils/dateUtils';
import { BarcodeScanner } from './BarcodeScanner';
import { ImageScanner } from './ImageScanner';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    nome: string,
    quantidade: number,
    dataValidade: string,
    categoria?: string,
    barcode?: string,
    valorKg?: number,
    dataFabricacao?: string,
    valorTotal?: number,
    motivo?: string,
    notas?: string,
    peso?: number
  ) => void;
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
  const [barcode, setBarcode] = useState<string>('');
  const [peso, setPeso] = useState<string>('');
  const [valorKg, setValorKg] = useState<string>('');
  const [valorTotal, setValorTotal] = useState<string>('');
  const [dataFabricacao, setDataFabricacao] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('Vencimento');
  const [notas, setNotas] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showScanner, setShowScanner] = useState(false);
  const [showImageScanner, setShowImageScanner] = useState(false);

  const todayIso = formatDateToISO(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = formatDateToISO(yesterday);

  useEffect(() => {
    if (productToEdit) {
      setNome(productToEdit.nome);
      setQuantidade(productToEdit.quantidade);
      setDataValidade(productToEdit.dataValidade);
      setCategoria(productToEdit.categoria || 'Panificação');
      setBarcode(productToEdit.barcode || '');
      setPeso(productToEdit.peso ? productToEdit.peso.toString() : '');
      setValorKg(productToEdit.valorKg ? productToEdit.valorKg.toString() : '');
      setValorTotal(productToEdit.valorTotal ? productToEdit.valorTotal.toString() : '');
      setDataFabricacao(productToEdit.dataFabricacao || '');
      setMotivo(productToEdit.motivo || 'Vencimento');
      setNotas(productToEdit.notas || '');
    } else {
      setNome('');
      setQuantidade(1);
      // Default validity date to today (can be registered from today or earlier)
      setDataValidade(todayIso);
      setCategoria('Panificação');
      setBarcode('');
      setPeso('');
      setValorKg('');
      setValorTotal('');
      setDataFabricacao('');
      setMotivo('Vencimento');
      setNotas('');
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

    // Validation: Require dataValidade and ensure it is EXPIRED
    if (!dataValidade) {
      setErrorMsg('Por favor, selecione a data de validade.');
      return;
    }

    if (dataValidade > todayIso) {
      setErrorMsg('⛔ Este sistema é EXCLUSIVO para controle de VENCIDOS, DESPERDÍCIOS e DESCARTES. Produtos com data de validade futura (a partir de amanhã) não podem ser cadastrados.');
      return;
    }

    onSave(
      nome,
      quantidade,
      dataValidade,
      categoria,
      barcode,
      valorKg ? parseFloat(valorKg) : undefined,
      dataFabricacao,
      valorTotal ? parseFloat(valorTotal) : undefined,
      motivo,
      notas,
      peso ? parseFloat(peso) : undefined
    );
    onClose();
  };

  const handleGenerateBarcode = () => {
    // Generate a valid-looking 13-digit EAN barcode starting with 789 (Brazil)
    const randomDigits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
    setBarcode(`789${randomDigits}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-[#E0E0E0] space-y-4 sm:space-y-5 max-h-[90dvh] sm:max-h-[90vh] overflow-y-auto animate-slide-up-mobile sm:animate-scale-up my-0 sm:my-auto">
        {/* Mobile drag pill indicator */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto sm:hidden -mt-1 mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#F5E6D3] text-[#E8571A] rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#2C2C2C]">
              {productToEdit ? 'Editar Produto' : 'Adicionar Novo Descarte'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!productToEdit && (
          <button
            onClick={() => setShowImageScanner(true)}
            className="w-full py-3 bg-gradient-to-r from-[#E8571A] to-[#D4A574] hover:opacity-90 text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Preencher Rótulo com IA</span>
          </button>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Código de Barras */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#2C2C2C]">
                Código de Barras (Busca & Leitura Automática)
              </label>
              {!barcode && (
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[11px] font-bold text-[#E8571A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Gerar Código</span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Barcode className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Ex: 7891234567890"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm font-mono font-semibold"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                title="Escanear Código com a Câmera"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            {/* Helper notice for Scanner */}
            <div className="mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-600 leading-snug">
              <span className="font-extrabold text-gray-800">💡 Dica de Leitura:</span> Mantenha o código de barras nítido na etiqueta para facilidade na busca e balanço de estoque.
            </div>
          </div>

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

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                Data de Fabricação
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dataFabricacao}
                  onChange={(e) => setDataFabricacao(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm text-[#2C2C2C]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                Data de Validade *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dataValidade}
                  max={!productToEdit ? yesterdayIso : undefined}
                  onChange={(e) => setDataValidade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm font-bold text-red-700 bg-red-50/30"
                  required
                />
                <Calendar className="w-5 h-5 text-red-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-red-600 font-bold mt-1">
            🔴 Atenção: Apenas produtos com validade expirada (anterior a hoje) são aceitos.
          </p>

          {/* Peso e Valores */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                Peso (KG)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="Ex: 0.350"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                Valor Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                placeholder="Ex: 25.50"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
                Valor/KG (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorKg}
                onChange={(e) => setValorKg(e.target.value)}
                placeholder="Ex: 15.90"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm"
              />
            </div>
          </div>

          {/* Motivo do Descarte */}
          <div>
            <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
              Motivo do Descarte *
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm bg-white"
            >
              <option value="Vencimento">Vencimento</option>
              <option value="Mofo/Fungos">Mofo/Fungos</option>
              <option value="Quebrado/Danificado">Quebrado/Danificado</option>
              <option value="Oferecido (não vendeu)">Oferecido (não vendeu)</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
              Notas (Opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ex: Problema de armazenagem, baixa demanda..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm resize-none"
            />
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
      
      {showScanner && (
        <BarcodeScanner
          onScan={(text) => {
            setBarcode(text);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showImageScanner && (
        <ImageScanner
          onScanResult={(result) => {
            if (result.nome) setNome(result.nome);
            if (result.quantidade) setQuantidade(result.quantidade);
            if (result.categoria) setCategoria(result.categoria);
            if (result.barcode) setBarcode(result.barcode);
            if (result.peso !== undefined && result.peso !== null) setPeso(result.peso.toString());
            if (result.dataFabricacao) {
              const df = new Date(result.dataFabricacao);
              if (!isNaN(df.getTime())) {
                setDataFabricacao(formatDateToISO(df));
              }
            }
            if (result.dataValidade) {
              const dv = new Date(result.dataValidade);
              if (!isNaN(dv.getTime())) {
                setDataValidade(formatDateToISO(dv));
              }
            }
            if (result.valorKg) {
              setValorKg(result.valorKg.toString());
            }
            if (result.valorTotal) {
              setValorTotal(result.valorTotal.toString());
            }
            setShowImageScanner(false);
          }}
          onClose={() => setShowImageScanner(false)}
        />
      )}
    </div>
  );
};
