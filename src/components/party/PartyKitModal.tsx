import React, { useState, useEffect } from 'react';
import {
  X,
  Cake,
  Utensils,
  Candy,
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  DollarSign,
  Users,
  Settings,
  Layers,
  HelpCircle,
  Clock,
  Palette,
  Camera,
  ChevronRight
} from 'lucide-react';
import {
  PartyKit,
  PartyKitStatus,
  DistributionType,
  PartyKitAddon,
  CakePersonalizationConfig
} from '../../types';

interface PartyKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (kit: PartyKit) => Promise<void>;
  onDelete?: (kitId: string) => Promise<void>;
  kitToEdit?: PartyKit | null;
  bakeryCode: string;
}

const DEFAULT_RECHEIOS = [
  'Brigadeiro Tradicional',
  'Ninho Suave',
  'Morango com Chantininho',
  'Prestígio Cremoso',
  'Dois Amores',
  'Abacaxi com Coco Artesanal',
  'Doce de Leite com Ameixa',
  'Maracujá Cremoso'
];

const DEFAULT_SALGADOS = [
  'Coxinha de Frango com Catupiry',
  'Bolinha de Queijo Crocante',
  'Kibe Tradicional com Hortelã',
  'Risoles de Presunto e Queijo',
  'Enroladinho de Salsicha',
  'Empadinha de Frango Assada',
  'Croquete de Carne'
];

const DEFAULT_DOCINHOS = [
  'Brigadeiro Tradicional Gourmet',
  'Beijinho de Coco Fresco',
  'Cajuzinho com Amendoim',
  'Ninho com Nutella',
  'Bicho de Pé (Morango)',
  'Dois Amores Gourmet'
];

export const PartyKitModal: React.FC<PartyKitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  kitToEdit,
  bakeryCode
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'bolo' | 'salgados' | 'docinhos' | 'adicionais'>('geral');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fotoPrincipal, setFotoPrincipal] = useState('');
  const [precoBase, setPrecoBase] = useState<number>(180);
  const [quantidadePessoas, setQuantidadePessoas] = useState<number>(15);
  const [status, setStatus] = useState<PartyKitStatus>('publicado');

  // Bolo
  const [boloTamanhoDesc, setBoloTamanhoDesc] = useState('Bolo Artesanal 1.5kg (aprox. 15 fatias)');
  const [maxRecheios, setMaxRecheios] = useState<number>(2);
  const [recheios, setRecheios] = useState<string[]>(DEFAULT_RECHEIOS);
  const [newRecheioInput, setNewRecheioInput] = useState('');
  const [opcoesMassa, setOpcoesMassa] = useState<string[]>([
    'Massa Branca Tradicional (Pão de Ló)',
    'Massa de Chocolate 50% Cacau'
  ]);
  const [newMassaInput, setNewMassaInput] = useState('');
  const [cakePersonalization, setCakePersonalization] = useState<CakePersonalizationConfig>({
    allowTheme: true,
    allowColor: true,
    allowName: true,
    nameRequired: true,
    allowAge: true,
    ageRequired: false,
    allowMessage: true,
    allowDetails: true,
    allowWhatsAppInspiration: true,
  });

  // Salgados
  const [salgadosTotal, setSalgadosTotal] = useState<number>(60);
  const [salgadosMaxSabores, setSalgadosMaxSabores] = useState<number>(3);
  const [salgadosRegra, setSalgadosRegra] = useState<DistributionType>('min_per_flavor');
  const [salgadosMinimo, setSalgadosMinimo] = useState<number>(20);
  const [salgadosSabores, setSalgadosSabores] = useState<string[]>(DEFAULT_SALGADOS);
  const [newSalgadoInput, setNewSalgadoInput] = useState('');

  // Docinhos
  const [docinhosTotal, setDocinhosTotal] = useState<number>(30);
  const [docinhosMaxSabores, setDocinhosMaxSabores] = useState<number>(2);
  const [docinhosRegra, setDocinhosRegra] = useState<DistributionType>('min_per_flavor');
  const [docinhosMinimo, setDocinhosMinimo] = useState<number>(15);
  const [docinhosSabores, setDocinhosSabores] = useState<string[]>(DEFAULT_DOCINHOS);
  const [newDocinhoInput, setNewDocinhoInput] = useState('');

  // Adicionais
  const [adicionais, setAdicionais] = useState<PartyKitAddon[]>([
    { id: 'add-vela', nome: 'Vela Faísca Vulcânica / Estrela', preco: 15.0, ativo: true, descricao: 'Vela luminosa' },
    { id: 'add-topo', nome: 'Topo de Bolo Personalizado com Nome', preco: 28.0, ativo: true, descricao: 'Acabamento fotográfico' },
    { id: 'add-coca', nome: 'Refrigerante Coca-Cola 2L (Gelada)', preco: 14.0, ativo: true },
    { id: 'add-guarana', nome: 'Refrigerante Guaraná Antarctica 2L (Gelado)', preco: 12.0, ativo: true }
  ]);
  const [newAddonNome, setNewAddonNome] = useState('');
  const [newAddonPreco, setNewAddonPreco] = useState<number>(15);

  useEffect(() => {
    if (kitToEdit) {
      setNome(kitToEdit.nome || '');
      setDescricao(kitToEdit.descricao || '');
      setFotoPrincipal(kitToEdit.fotoPrincipal || '');
      setPrecoBase(kitToEdit.precoBase || 0);
      setQuantidadePessoas(kitToEdit.quantidadePessoas || 15);
      setStatus(kitToEdit.status || 'publicado');

      if (kitToEdit.bolo) {
        setBoloTamanhoDesc(kitToEdit.bolo.tamanhoDescricao || '');
        setMaxRecheios(kitToEdit.bolo.maxRecheios || 2);
        setRecheios(kitToEdit.bolo.recheiosDisponiveis || DEFAULT_RECHEIOS);
        if (kitToEdit.bolo.opcoesMassa && kitToEdit.bolo.opcoesMassa.length > 0) {
          setOpcoesMassa(kitToEdit.bolo.opcoesMassa);
        } else {
          setOpcoesMassa(['Massa Branca Tradicional (Pão de Ló)', 'Massa de Chocolate 50% Cacau']);
        }
        if (kitToEdit.bolo.personalizacao) {
          setCakePersonalization(kitToEdit.bolo.personalizacao);
        }
      }

      if (kitToEdit.salgados) {
        setSalgadosTotal(kitToEdit.salgados.quantidadeTotal || 60);
        setSalgadosMaxSabores(kitToEdit.salgados.maxSabores || 3);
        setSalgadosRegra(kitToEdit.salgados.regraDistribuicao || 'min_per_flavor');
        setSalgadosMinimo(kitToEdit.salgados.minimoPorSabor || 20);
        setSalgadosSabores(kitToEdit.salgados.saboresDisponiveis || DEFAULT_SALGADOS);
      }

      if (kitToEdit.docinhos) {
        setDocinhosTotal(kitToEdit.docinhos.quantidadeTotal || 30);
        setDocinhosMaxSabores(kitToEdit.docinhos.maxSabores || 2);
        setDocinhosRegra(kitToEdit.docinhos.regraDistribuicao || 'min_per_flavor');
        setDocinhosMinimo(kitToEdit.docinhos.minimoPorSabor || 15);
        setDocinhosSabores(kitToEdit.docinhos.saboresDisponiveis || DEFAULT_DOCINHOS);
      }

      if (kitToEdit.adicionais) {
        setAdicionais(kitToEdit.adicionais);
      }
    } else {
      // Reset to fresh form
      setNome('');
      setDescricao('');
      setFotoPrincipal('https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=600&auto=format&fit=crop&q=80');
      setPrecoBase(190);
      setQuantidadePessoas(15);
      setStatus('publicado');
      setBoloTamanhoDesc('Bolo Artesanal 1.5kg (aprox. 15 fatias)');
      setMaxRecheios(2);
      setRecheios(DEFAULT_RECHEIOS);
      setOpcoesMassa(['Massa Branca Tradicional (Pão de Ló)', 'Massa de Chocolate 50% Cacau']);
      setSalgadosTotal(60);
      setSalgadosMaxSabores(3);
      setSalgadosRegra('min_per_flavor');
      setSalgadosMinimo(20);
      setSalgadosSabores(DEFAULT_SALGADOS);
      setDocinhosTotal(30);
      setDocinhosMaxSabores(2);
      setDocinhosRegra('min_per_flavor');
      setDocinhosMinimo(15);
      setDocinhosSabores(DEFAULT_DOCINHOS);
    }
  }, [kitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddRecheio = () => {
    const trimmed = newRecheioInput.trim();
    if (trimmed && !recheios.includes(trimmed)) {
      setRecheios([...recheios, trimmed]);
      setNewRecheioInput('');
    }
  };

  const handleRemoveRecheio = (item: string) => {
    setRecheios(recheios.filter(r => r !== item));
  };

  const handleAddMassa = () => {
    const trimmed = newMassaInput.trim();
    if (trimmed && !opcoesMassa.includes(trimmed)) {
      setOpcoesMassa([...opcoesMassa, trimmed]);
      setNewMassaInput('');
    }
  };

  const handleRemoveMassa = (item: string) => {
    setOpcoesMassa(opcoesMassa.filter(m => m !== item));
  };

  const handleAddSalgado = () => {
    const trimmed = newSalgadoInput.trim();
    if (trimmed && !salgadosSabores.includes(trimmed)) {
      setSalgadosSabores([...salgadosSabores, trimmed]);
      setNewSalgadoInput('');
    }
  };

  const handleRemoveSalgado = (item: string) => {
    setSalgadosSabores(salgadosSabores.filter(s => s !== item));
  };

  const handleAddDocinho = () => {
    const trimmed = newDocinhoInput.trim();
    if (trimmed && !docinhosSabores.includes(trimmed)) {
      setDocinhosSabores([...docinhosSabores, trimmed]);
      setNewDocinhoInput('');
    }
  };

  const handleRemoveDocinho = (item: string) => {
    setDocinhosSabores(docinhosSabores.filter(d => d !== item));
  };

  const handleAddNewAddon = () => {
    const trimmed = newAddonNome.trim();
    if (!trimmed) return;
    const newId = `add-${Date.now()}`;
    setAdicionais([
      ...adicionais,
      { id: newId, nome: trimmed, preco: Number(newAddonPreco) || 10, ativo: true }
    ]);
    setNewAddonNome('');
    setNewAddonPreco(15);
  };

  const handleToggleAddon = (id: string) => {
    setAdicionais(adicionais.map(a => (a.id === id ? { ...a, ativo: !a.ativo } : a)));
  };

  const handleDeleteAddon = (id: string) => {
    setAdicionais(adicionais.filter(a => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nome.trim()) {
      setErrorMsg('O nome do kit é obrigatório.');
      setActiveTab('geral');
      return;
    }

    if (precoBase <= 0) {
      setErrorMsg('O preço base do kit deve ser maior que zero.');
      setActiveTab('geral');
      return;
    }

    if (recheios.length === 0) {
      setErrorMsg('Cadastre pelo menos 1 recheio para o bolo.');
      setActiveTab('bolo');
      return;
    }

    if (salgadosSabores.length === 0) {
      setErrorMsg('Cadastre pelo menos 1 sabor de salgado.');
      setActiveTab('salgados');
      return;
    }

    if (docinhosSabores.length === 0) {
      setErrorMsg('Cadastre pelo menos 1 sabor de docinho.');
      setActiveTab('docinhos');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const kitData: PartyKit = {
        id: kitToEdit ? kitToEdit.id : `kit-${Date.now()}`,
        bakeryCode,
        nome: nome.trim(),
        descricao: descricao.trim(),
        fotoPrincipal: fotoPrincipal.trim() || 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=600&auto=format&fit=crop&q=80',
        precoBase: Number(precoBase),
        quantidadePessoas: Number(quantidadePessoas) || 15,
        status,
        bolo: {
          tamanhoDescricao: boloTamanhoDesc.trim() || 'Bolo Artesanal Decorado',
          maxRecheios: Number(maxRecheios) || 2,
          recheiosDisponiveis: recheios,
          opcoesMassa: opcoesMassa,
          personalizacao: cakePersonalization,
        },
        salgados: {
          quantidadeTotal: Number(salgadosTotal) || 50,
          maxSabores: Number(salgadosMaxSabores) || 3,
          regraDistribuicao: salgadosRegra,
          minimoPorSabor: Number(salgadosMinimo) || 20,
          saboresDisponiveis: salgadosSabores,
        },
        docinhos: {
          quantidadeTotal: Number(docinhosTotal) || 25,
          maxSabores: Number(docinhosMaxSabores) || 2,
          regraDistribuicao: docinhosRegra,
          minimoPorSabor: Number(docinhosMinimo) || 15,
          saboresDisponiveis: docinhosSabores,
        },
        adicionais,
        createdAt: kitToEdit?.createdAt || now,
        updatedAt: now,
      };

      await onSave(kitData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar kit de festa.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden my-auto animate-fade-in flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-orange-500 to-[#E8571A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <h2 className="text-base sm:text-lg font-black">
              {kitToEdit ? 'Editar Kit Festa' : 'Novo Kit Festa'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector - Equal Grid & Compact Labels for PC & Mobile */}
        <div
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="grid grid-cols-5 border-b border-gray-200 bg-gray-50/90 p-1.5 gap-1 overflow-x-auto no-scrollbar shrink-0 text-center"
        >
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'geral'
                ? 'bg-white text-[#E8571A] shadow-xs font-black'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>1. Geral</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bolo')}
            className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'bolo'
                ? 'bg-white text-[#E8571A] shadow-xs font-black'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
            }`}
          >
            <Cake className="w-3.5 h-3.5" />
            <span>2. Bolo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('salgados')}
            className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'salgados'
                ? 'bg-white text-[#E8571A] shadow-xs font-black'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>3. Salgados</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('docinhos')}
            className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'docinhos'
                ? 'bg-white text-[#E8571A] shadow-xs font-black'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
            }`}
          >
            <Candy className="w-3.5 h-3.5" />
            <span>4. Doces</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('adicionais')}
            className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'adicionais'
                ? 'bg-white text-[#E8571A] shadow-xs font-black'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>5. Extras</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center space-x-2">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nome do Kit Festa *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Kit Festa Família (15 a 20 Pessoas)"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Descrição Atraente para o Cliente
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  placeholder="Ex: Delicioso kit completo com bolo personalizado, salgados fritos na hora bem crocantes e docinhos enrolados à mão."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Preço Base (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={precoBase}
                      onChange={(e) => setPrecoBase(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-sm font-black text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Rendimento (Pessoas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantidadePessoas}
                    onChange={(e) => setQuantidadePessoas(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Status do Kit
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PartyKitStatus)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value="publicado">🟢 Publicado (Visível na página)</option>
                    <option value="rascunho">🟡 Rascunho (Oculto)</option>
                    <option value="pausado">⏸️ Pausado (Esgotado temp.)</option>
                    <option value="arquivado">📁 Arquivado</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOLO */}
          {activeTab === 'bolo' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900">
                <p className="font-bold flex items-center space-x-1.5">
                  <Cake className="w-4 h-4 text-amber-700" />
                  <span>Configuração do Bolo e Recheios</span>
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Defina o tamanho descrito, quantidade máxima de recheios que o cliente pode escolher e os campos de personalização permitidos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Descrição do Tamanho / Peso do Bolo
                  </label>
                  <input
                    type="text"
                    value={boloTamanhoDesc}
                    onChange={(e) => setBoloTamanhoDesc(e.target.value)}
                    placeholder="Ex: Bolo de 1.5kg (aprox. 15 fatias)"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Máximo de Recheios por Bolo
                  </label>
                  <select
                    value={maxRecheios}
                    onChange={(e) => setMaxRecheios(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value={1}>1 Recheio</option>
                    <option value={2}>Até 2 Recheios</option>
                    <option value={3}>Até 3 Recheios</option>
                  </select>
                </div>
              </div>

              {/* Recheios Disponíveis */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Sabores de Recheios Disponíveis ({recheios.length})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newRecheioInput}
                    onChange={(e) => setNewRecheioInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRecheio();
                      }
                    }}
                    placeholder="Adicionar novo recheio (ex: Nutella com Morango)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddRecheio}
                    className="px-3 py-1.5 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                  {recheios.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-gray-300 text-gray-800 rounded-lg text-xs font-medium shadow-2xs"
                    >
                      <span>{r}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRecheio(r)}
                        className="text-red-500 hover:text-red-700 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Massas do Bolo Disponíveis */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Opções de Massa do Bolo ({opcoesMassa.length})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newMassaInput}
                    onChange={(e) => setNewMassaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMassa();
                      }
                    }}
                    placeholder="Adicionar opção de massa (ex: Massa Red Velvet)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddMassa}
                    className="px-3 py-1.5 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                  {opcoesMassa.map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-amber-300 text-amber-950 rounded-lg text-xs font-medium shadow-2xs"
                    >
                      <span>{m}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMassa(m)}
                        className="text-red-500 hover:text-red-700 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Personalização do Bolo */}
              <div className="border-t border-gray-200 pt-3">
                <label className="block text-xs font-black text-gray-800 mb-2">
                  Campos de Personalização do Bolo no Formulário do Cliente
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cakePersonalization.allowTheme}
                      onChange={(e) => setCakePersonalization({ ...cakePersonalization, allowTheme: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-semibold text-gray-700">Tema do Bolo (ex: Futebol, Princesas)</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cakePersonalization.allowColor}
                      onChange={(e) => setCakePersonalization({ ...cakePersonalization, allowColor: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-semibold text-gray-700">Cor Principal (com opção Outra cor)</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cakePersonalization.allowName}
                      onChange={(e) => setCakePersonalization({ ...cakePersonalization, allowName: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-semibold text-gray-700">Nome do Aniversariante</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cakePersonalization.allowAge}
                      onChange={(e) => setCakePersonalization({ ...cakePersonalization, allowAge: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-semibold text-gray-700">Idade / Velas</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cakePersonalization.allowMessage}
                      onChange={(e) => setCakePersonalization({ ...cakePersonalization, allowMessage: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-semibold text-gray-700">Mensagem Escrita no Bolo</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cakePersonalization.allowWhatsAppInspiration}
                      onChange={(e) => setCakePersonalization({ ...cakePersonalization, allowWhatsAppInspiration: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-semibold text-gray-700">Botão Enviar Foto no WhatsApp</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SALGADOS */}
          {activeTab === 'salgados' && (
            <div className="space-y-4">
              <div className="bg-orange-50/70 p-3.5 rounded-xl border border-orange-200 text-xs text-orange-900">
                <p className="font-bold flex items-center space-x-1.5">
                  <Utensils className="w-4 h-4 text-orange-700" />
                  <span>Configuração e Distribuição de Salgados</span>
                </p>
                <p className="text-[11px] text-orange-800 mt-0.5">
                  Defina a quantidade total de salgados inclusos, quantidade máxima de sabores e a regra matemática de distribuição.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Quantidade Total (Unidades)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={salgadosTotal}
                    onChange={(e) => setSalgadosTotal(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-black text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Máximo de Sabores
                  </label>
                  <select
                    value={salgadosMaxSabores}
                    onChange={(e) => setSalgadosMaxSabores(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value={1}>1 Sabor</option>
                    <option value={2}>Até 2 Sabores</option>
                    <option value={3}>Até 3 Sabores</option>
                    <option value={4}>Até 4 Sabores</option>
                    <option value={5}>Até 5 Sabores</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Regra de Distribuição
                  </label>
                  <select
                    value={salgadosRegra}
                    onChange={(e) => setSalgadosRegra(e.target.value as DistributionType)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value="min_per_flavor">Mínimo por Sabor (Recomendado)</option>
                    <option value="equal">Divisão Exata Igual</option>
                    <option value="free">Livre escolha das unidades</option>
                  </select>
                </div>
              </div>

              {salgadosRegra === 'min_per_flavor' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mínimo de unidades por cada sabor escolhido
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={salgadosMinimo}
                    onChange={(e) => setSalgadosMinimo(parseInt(e.target.value) || 5)}
                    className="w-full max-w-xs px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Ex: Se o cliente escolher Coxinha e Kibe, cada um precisará ter pelo menos {salgadosMinimo} unidades.
                  </p>
                </div>
              )}

              {/* Sabores de Salgados */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Sabores Disponíveis no Cardápio ({salgadosSabores.length})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSalgadoInput}
                    onChange={(e) => setNewSalgadoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSalgado();
                      }
                    }}
                    placeholder="Adicionar novo salgado (ex: Travesseirinho de Queijo)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddSalgado}
                    className="px-3 py-1.5 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                  {salgadosSabores.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-gray-300 text-gray-800 rounded-lg text-xs font-medium shadow-2xs"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSalgado(s)}
                        className="text-red-500 hover:text-red-700 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOCINHOS */}
          {activeTab === 'docinhos' && (
            <div className="space-y-4">
              <div className="bg-pink-50/70 p-3.5 rounded-xl border border-pink-200 text-xs text-pink-900">
                <p className="font-bold flex items-center space-x-1.5">
                  <Candy className="w-4 h-4 text-pink-700" />
                  <span>Configuração e Distribuição de Docinhos</span>
                </p>
                <p className="text-[11px] text-pink-800 mt-0.5">
                  Defina a quantidade total de docinhos, máximo de sabores e regra de distribuição.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Quantidade Total (Unidades)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={docinhosTotal}
                    onChange={(e) => setDocinhosTotal(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-black text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Máximo de Sabores
                  </label>
                  <select
                    value={docinhosMaxSabores}
                    onChange={(e) => setDocinhosMaxSabores(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value={1}>1 Sabor</option>
                    <option value={2}>Até 2 Sabores</option>
                    <option value={3}>Até 3 Sabores</option>
                    <option value={4}>Até 4 Sabores</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Regra de Distribuição
                  </label>
                  <select
                    value={docinhosRegra}
                    onChange={(e) => setDocinhosRegra(e.target.value as DistributionType)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value="min_per_flavor">Mínimo por Sabor (Recomendado)</option>
                    <option value="equal">Divisão Exata Igual</option>
                    <option value="free">Livre escolha das unidades</option>
                  </select>
                </div>
              </div>

              {docinhosRegra === 'min_per_flavor' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mínimo de unidades por cada sabor escolhido
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={docinhosMinimo}
                    onChange={(e) => setDocinhosMinimo(parseInt(e.target.value) || 5)}
                    className="w-full max-w-xs px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Sabores de Docinhos */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Sabores Disponíveis no Cardápio ({docinhosSabores.length})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newDocinhoInput}
                    onChange={(e) => setNewDocinhoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDocinho();
                      }
                    }}
                    placeholder="Adicionar novo doce (ex: Surpresa de Uva)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddDocinho}
                    className="px-3 py-1.5 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                  {docinhosSabores.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-gray-300 text-gray-800 rounded-lg text-xs font-medium shadow-2xs"
                    >
                      <span>{d}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocinho(d)}
                        className="text-red-500 hover:text-red-700 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ADICIONAIS */}
          {activeTab === 'adicionais' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-900">
                <p className="font-bold flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-blue-700" />
                  <span>Itens Adicionais e Opcionais para Venda Cruzada</span>
                </p>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Itens opcionais que o cliente pode adicionar ao carrinho durante o checkout para aumentar o tíquete médio (velas, refrigerantes, topo de bolo, descartáveis).
                </p>
              </div>

              {/* Add new addon input */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <label className="block text-xs font-bold text-gray-700">Novo Item Adicional</label>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={newAddonNome}
                    onChange={(e) => setNewAddonNome(e.target.value)}
                    placeholder="Nome do adicional (ex: Topo de Bolo Personalizado 3D)"
                    className="sm:col-span-8 px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                  <div className="sm:col-span-4 flex gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={newAddonPreco}
                      onChange={(e) => setNewAddonPreco(parseFloat(e.target.value) || 0)}
                      placeholder="Preço (R$)"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewAddon}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* List of existing addons */}
              <div className="space-y-2">
                {adicionais.map((add) => (
                  <div
                    key={add.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-2xs"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={add.ativo}
                        onChange={() => handleToggleAddon(add.id)}
                        className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <div>
                        <p className={`text-xs font-bold ${add.ativo ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                          {add.nome}
                        </p>
                        {add.descricao && <p className="text-[11px] text-gray-500">{add.descricao}</p>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-black text-gray-800">
                        R$ {Number(add.preco).toFixed(2).replace('.', ',')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddon(add.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Remover Adicional"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Controls - Clean App Style */}
          <div className="pt-3.5 border-t border-gray-200 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              {kitToEdit && onDelete && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Tem certeza que deseja excluir o kit "${kitToEdit.nome}"? Esta ação não pode ser desfeita.`)) {
                      await onDelete(kitToEdit.id);
                      onClose();
                    }
                  }}
                  className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                  title="Excluir Kit"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Excluir</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {activeTab !== 'geral' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'adicionais') setActiveTab('docinhos');
                    else if (activeTab === 'docinhos') setActiveTab('salgados');
                    else if (activeTab === 'salgados') setActiveTab('bolo');
                    else if (activeTab === 'bolo') setActiveTab('geral');
                  }}
                  className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Voltar
                </button>
              )}

              {activeTab !== 'adicionais' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'geral') setActiveTab('bolo');
                    else if (activeTab === 'bolo') setActiveTab('salgados');
                    else if (activeTab === 'salgados') setActiveTab('docinhos');
                    else if (activeTab === 'docinhos') setActiveTab('adicionais');
                  }}
                  className="px-3.5 sm:px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center space-x-1"
                >
                  <span>Próximo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-orange-500 to-[#E8571A] hover:opacity-90 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Salvar Kit</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
