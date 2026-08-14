import React, { useState, useMemo } from 'react';
import {
  Folder,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  Layers,
  Tag,
  Package,
  ChevronRight,
  ChevronDown,
  Search,
  ExternalLink,
  DollarSign,
  Boxes,
  Calendar,
  AlertTriangle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { formatDateToBR } from '../utils/dateUtils';

interface CategorySettingsProps {
  onNavigateToRegister?: (categoryName: string) => void;
  onNavigateToEdit?: (itemId: string, itemType: 'inventory' | 'product') => void;
  onNavigateToConference?: (itemId: string) => void;
}

export const CategorySettings: React.FC<CategorySettingsProps> = ({
  onNavigateToRegister,
  onNavigateToEdit,
  onNavigateToConference
}) => {
  const {
    categories,
    products,
    inventoryItems,
    addCategory,
    renameCategory,
    deleteCategory,
    resetCategories
  } = useData();

  // Selected category for viewing products
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [searchInCat, setSearchInCat] = useState<string>('');

  // New Category State
  const [newCatName, setNewCatName] = useState<string>('');
  const [isSubmittingNew, setIsSubmittingNew] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Rename Category Modal / Inline State
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

  // Delete Category Modal State
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [fallbackCat, setFallbackCat] = useState<string>('Geral');

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setFeedbackMsg({ type: 'error', text: 'Por favor, digite o nome da categoria.' });
      return;
    }

    setIsSubmittingNew(true);
    const success = await addCategory(trimmed);
    setIsSubmittingNew(false);

    if (success) {
      setFeedbackMsg({ type: 'success', text: `Categoria "${trimmed}" criada com sucesso!` });
      setNewCatName('');
      setSelectedCat(trimmed);
    } else {
      setFeedbackMsg({ type: 'error', text: `A categoria "${trimmed}" já existe.` });
    }
  };

  // Handle Start Rename
  const handleStartRename = (e: React.MouseEvent, cat: string) => {
    e.stopPropagation();
    setEditingCat(cat);
    setRenameValue(cat);
  };

  // Handle Save Rename
  const handleSaveRename = async () => {
    if (!editingCat) return;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === editingCat) {
      setEditingCat(null);
      return;
    }

    const oldName = editingCat;
    const success = await renameCategory(oldName, trimmed);
    if (success) {
      setFeedbackMsg({ type: 'success', text: `Categoria alterada de "${oldName}" para "${trimmed}".` });
      if (selectedCat === oldName) {
        setSelectedCat(trimmed);
      }
    } else {
      setFeedbackMsg({ type: 'error', text: 'Não foi possível renomear a categoria. Verifique se o nome já existe.' });
    }
    setEditingCat(null);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingCat) return;
    const catToDelete = deletingCat;
    const targetFallback = fallbackCat || 'Geral';

    const success = await deleteCategory(catToDelete, targetFallback);
    if (success) {
      setFeedbackMsg({
        type: 'success',
        text: `Categoria "${catToDelete}" removida. Produtos associados foram reatribuídos para "${targetFallback}".`
      });
      if (selectedCat === catToDelete) {
        setSelectedCat(null);
      }
    } else {
      setFeedbackMsg({ type: 'error', text: 'Erro ao remover a categoria.' });
    }
    setDeletingCat(null);
  };

  // Handle Reset Defaults
  const handleResetDefaults = async () => {
    if (window.confirm('Tem certeza que deseja restaurar a lista padrão de categorias?')) {
      await resetCategories();
      setFeedbackMsg({ type: 'success', text: 'Categorias restauradas para o padrão com sucesso.' });
      setSelectedCat(null);
    }
  };

  // Aggregated items helper per category
  const getCategoryItems = (catName: string) => {
    const norm = catName.trim().toLowerCase();
    const matchedInventory = inventoryItems.filter(
      (i) => (i.category || 'Geral').trim().toLowerCase() === norm
    );
    const matchedProducts = products.filter(
      (p) => (p.categoria || 'Geral').trim().toLowerCase() === norm
    );
    const totalStockValue = matchedInventory.reduce(
      (acc, i) => acc + (i.currentQuantity || 0) * (i.unitCost || 0),
      0
    );
    return {
      inventoryItems: matchedInventory,
      products: matchedProducts,
      totalCount: matchedInventory.length + matchedProducts.length,
      totalStockValue
    };
  };

  // Details for currently selected category
  const selectedDetails = useMemo(() => {
    if (!selectedCat) return null;
    const data = getCategoryItems(selectedCat);
    const filterTerm = searchInCat.trim().toLowerCase();

    const filteredInventory = data.inventoryItems.filter((i) =>
      i.name.toLowerCase().includes(filterTerm)
    );
    const filteredProducts = data.products.filter((p) =>
      p.nome.toLowerCase().includes(filterTerm)
    );

    return {
      category: selectedCat,
      ...data,
      filteredInventory,
      filteredProducts
    };
  }, [selectedCat, inventoryItems, products, searchInCat]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-extrabold text-[#1F2937] flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#E8571A]" />
            <span>Categorias de Produtos e Insumos</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Gerencie as categorias da padaria e <strong>clique em qualquer categoria</strong> para visualizar todos os produtos cadastrados nela.
          </p>
        </div>
        <button
          onClick={handleResetDefaults}
          className="self-start sm:self-auto px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
          title="Restaurar lista padrão"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Padrões</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create New Category Form */}
      <form onSubmit={handleAddCategory} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
        <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide">
          Criar Nova Categoria
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Ex: Molhos, Insumos Secos, Frios, Congelados..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs font-bold rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#E8571A]"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmittingNew || !newCatName.trim()}
            className="px-4 py-2.5 bg-[#E8571A] hover:bg-[#d44e15] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Categoria</span>
          </button>
        </div>
      </form>

      {/* Active Categories Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wide">
              Categorias ({categories.length})
            </span>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Clique em um card para inspecionar
            </span>
          </div>
          {selectedCat && (
            <button
              onClick={() => setSelectedCat(null)}
              className="text-[11px] font-bold text-gray-500 hover:text-gray-800 underline cursor-pointer"
            >
              Fechar Visualização
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const data = getCategoryItems(cat);
            const isEditing = editingCat === cat;
            const isSelected = selectedCat === cat;

            return (
              <div
                key={cat}
                onClick={() => {
                  if (!isEditing) {
                    setSelectedCat(isSelected ? null : cat);
                    setSearchInCat('');
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'border-[#FF6B00] bg-orange-50/40 ring-2 ring-orange-300 shadow-sm'
                    : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50/80 bg-white shadow-2xs'
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      autoFocus
                      className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#E8571A] focus:outline-none bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename();
                        if (e.key === 'Escape') setEditingCat(null);
                      }}
                    />
                    <button
                      onClick={handleSaveRename}
                      className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer shrink-0"
                      title="Salvar"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingCat(null)}
                      className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg cursor-pointer shrink-0"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between h-full space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isSelected
                              ? 'bg-[#FF6B00] text-white'
                              : 'bg-orange-100 text-[#FF6B00] group-hover:bg-[#FF6B00] group-hover:text-white transition-colors'
                          }`}
                        >
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-900 truncate">
                            {cat}
                          </p>
                          <p className="text-[11px] font-bold text-gray-500 flex items-center space-x-1 mt-0.5">
                            <Package className="w-3 h-3 text-gray-400" />
                            <span>
                              {data.totalCount} {data.totalCount === 1 ? 'produto' : 'produtos'}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleStartRename(e, cat)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-all cursor-pointer"
                          title="Renomear Categoria"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingCat(cat);
                            const remaining = categories.filter((c) => c !== cat);
                            setFallbackCat(remaining[0] || 'Geral');
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Remover Categoria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Breakdown bar */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-500">
                      <div className="flex items-center space-x-1.5">
                        <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                          {data.inventoryItems.length} estoque
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                          {data.products.length} lotes
                        </span>
                      </div>
                      <span className={`flex items-center gap-0.5 ${isSelected ? 'text-[#FF6B00] font-black' : 'text-gray-400 group-hover:text-gray-700'}`}>
                        <span>{isSelected ? 'Ocultar' : 'Ver'}</span>
                        {isSelected ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETAILED CATEGORY PRODUCT INSPECTOR PANEL                                  */}
      {/* ========================================================================= */}
      {selectedDetails && (
        <div className="bg-gradient-to-br from-orange-50/50 to-white border-2 border-orange-200 p-4 sm:p-6 rounded-2xl space-y-5 animate-scale-in shadow-xs">
          {/* Inspector Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-orange-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase text-white bg-[#FF6B00] px-2 py-0.5 rounded-md">
                  Categoria Selecionada
                </span>
                <span className="text-sm font-black text-gray-900">
                  {selectedDetails.category}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Visualizando todos os {selectedDetails.totalCount} itens e insumos vinculados a esta categoria.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateToRegister && (
                <button
                  onClick={() => onNavigateToRegister(selectedDetails.category)}
                  className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#E8571A] text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Produto Nesta Categoria</span>
                </button>
              )}
              <button
                onClick={() => setSelectedCat(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                title="Fechar Detalhes"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search bar inside category */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Filtrar produtos em "${selectedDetails.category}"...`}
                value={searchInCat}
                onChange={(e) => setSearchInCat(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            <div className="flex items-center space-x-3 text-xs font-bold text-gray-600 self-end sm:self-auto">
              <span className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                Total de Itens: <strong className="text-gray-900">{selectedDetails.totalCount}</strong>
              </span>
              {selectedDetails.totalStockValue > 0 && (
                <span className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 font-extrabold shadow-2xs">
                  Valor Estimado: R$ {selectedDetails.totalStockValue.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Products / Inventory list */}
          {selectedDetails.totalCount === 0 ? (
            <div className="p-8 bg-white border border-dashed border-orange-300 rounded-xl text-center space-y-3">
              <Package className="w-10 h-10 text-orange-300 mx-auto" />
              <div>
                <h4 className="text-sm font-black text-gray-800">
                  Nenhum produto cadastrado na categoria "{selectedDetails.category}" ainda.
                </h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                  Ao cadastrar um novo produto no estoque ou registrar um lote de validade, selecione esta categoria para que ele apareça aqui.
                </p>
              </div>
              {onNavigateToRegister && (
                <button
                  onClick={() => onNavigateToRegister(selectedDetails.category)}
                  className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E8571A] text-white text-xs font-black uppercase rounded-xl transition-all shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Primeiro Produto</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. Inventory Items Section */}
              {selectedDetails.filteredInventory.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-purple-900 tracking-wider flex items-center space-x-1.5">
                      <Boxes className="w-3.5 h-3.5 text-purple-600" />
                      <span>Itens do Estoque ({selectedDetails.filteredInventory.length})</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {selectedDetails.filteredInventory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-white border border-purple-200 rounded-xl shadow-2xs hover:border-purple-400 transition-all flex flex-col justify-between space-y-2"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-black text-gray-900 block truncate">
                              {item.name}
                            </span>
                            <span className="text-[9px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 shrink-0 uppercase">
                              Estoque
                            </span>
                          </div>

                          <div className="mt-1.5 space-y-0.5 text-[11px] font-bold text-gray-500">
                            <p className="flex items-center justify-between">
                              <span>Quantidade Atual:</span>
                              <strong className="text-gray-900 font-black">
                                {item.currentQuantity} {item.unit}
                              </strong>
                            </p>
                            <p className="flex items-center justify-between">
                              <span>Custo Unitário:</span>
                              <span className="text-gray-700">
                                R$ {(item.unitCost || 0).toFixed(2)} / {item.unit}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Quick action buttons */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-end space-x-1.5">
                          {onNavigateToConference && (
                            <button
                              type="button"
                              onClick={() => onNavigateToConference(item.id)}
                              className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-[#FF6B00] text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                              title="Iniciar conferência deste produto"
                            >
                              Conferir
                            </button>
                          )}
                          {onNavigateToEdit && (
                            <button
                              type="button"
                              onClick={() => onNavigateToEdit(item.id, 'inventory')}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-black rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                              title="Editar este produto"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Editar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Expiration Products Section */}
              {selectedDetails.filteredProducts.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-blue-900 tracking-wider flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lotes de Validade ({selectedDetails.filteredProducts.length})</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {selectedDetails.filteredProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3 bg-white border border-blue-200 rounded-xl shadow-2xs hover:border-blue-400 transition-all flex flex-col justify-between space-y-2"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-black text-gray-900 block truncate">
                              {prod.nome}
                            </span>
                            <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0 uppercase">
                              Lote
                            </span>
                          </div>

                          <div className="mt-1.5 space-y-0.5 text-[11px] font-bold text-gray-500">
                            <p className="flex items-center justify-between">
                              <span>Quantidade:</span>
                              <strong className="text-gray-900 font-black">
                                {prod.quantidade} {prod.unidade || (prod.peso ? 'kg' : 'unid')}
                              </strong>
                            </p>
                            <p className="flex items-center justify-between">
                              <span>Validade:</span>
                              <span className="text-gray-700">
                                {formatDateToBR(prod.dataValidade)}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Quick action buttons */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-end space-x-1.5">
                          {onNavigateToEdit && (
                            <button
                              type="button"
                              onClick={() => onNavigateToEdit(prod.id, 'product')}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-black rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                              title="Editar este lote"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Editar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDetails.filteredInventory.length === 0 && selectedDetails.filteredProducts.length === 0 && (
                <p className="text-xs text-gray-400 italic py-4 text-center">
                  Nenhum produto encontrado com o termo "{searchInCat}".
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-gray-200 shadow-2xl animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#1F2937]">
                    Remover Categoria "{deletingCat}"
                  </h4>
                  <p className="text-xs text-gray-500">
                    Confirme a remoção e escolha a nova categoria para os itens existentes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeletingCat(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {getCategoryItems(deletingCat).totalCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <p className="text-xs font-bold text-amber-800 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Atenção: Existem {getCategoryItems(deletingCat).totalCount} produtos registrados nesta categoria!
                  </span>
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Mover produtos existentes para:
                  </label>
                  <select
                    value={fallbackCat}
                    onChange={(e) => setFallbackCat(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-amber-300 bg-white focus:outline-none cursor-pointer"
                  >
                    {categories
                      .filter((c) => c !== deletingCat)
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    {!categories.some((c) => c === 'Geral') && <option value="Geral">Geral</option>}
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeletingCat(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Confirmar Remoção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

