import React, { useState, useEffect, useMemo } from 'react';
import {
  Cake,
  Utensils,
  Candy,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  AlertCircle,
  Plus,
  Minus,
  Check,
  Store,
  ChevronRight,
  ShoppingBag,
  Info
} from 'lucide-react';
import {
  PartyKit,
  PartyOrder,
  PartyBakeryPublicConfig,
  FlavorDistributionItem,
  PartyKitAddon
} from '../../types';
import {
  validateOrderDateTime,
  calculateOrderTotals,
  createWhatsAppOrderMessage,
  generatePublicBakerySlug
} from '../../utils/partyOrderEngine';
import { StorageService } from '../../services/storageService';

interface PublicPartyOrderPageProps {
  bakerySlug?: string;
  bakeryCode?: string;
  onBackToApp?: () => void;
  overrideConfig?: PartyBakeryPublicConfig | null;
  overrideKits?: PartyKit[];
  isLivePreviewMode?: boolean;
  previewDevice?: 'mobile' | 'desktop';
}

export const PublicPartyOrderPage: React.FC<PublicPartyOrderPageProps> = ({
  bakerySlug,
  bakeryCode: initialBakeryCode,
  onBackToApp,
  overrideConfig,
  overrideKits,
  isLivePreviewMode = false,
  previewDevice = 'mobile'
}) => {
  const isMobileSim = isLivePreviewMode && previewDevice === 'mobile';
  const [loading, setLoading] = useState(!overrideConfig);
  const [config, setConfig] = useState<PartyBakeryPublicConfig | null>(overrideConfig || null);
  const [kits, setKits] = useState<PartyKit[]>(overrideKits || []);
  const [resolvedBakeryCode, setResolvedBakeryCode] = useState<string | null>(initialBakeryCode || overrideConfig?.bakeryCode || null);

  // Sync if override props update in live editor mode
  useEffect(() => {
    if (overrideConfig) {
      setConfig(overrideConfig);
      setLoading(false);
    }
  }, [overrideConfig]);

  useEffect(() => {
    if (overrideKits) {
      setKits(overrideKits);
      if (overrideKits.length > 0 && (!selectedKit || !overrideKits.some(k => k.id === selectedKit.id))) {
        setSelectedKit(overrideKits[0]);
      }
      setLoading(false);
    }
  }, [overrideKits]);

  // Stepper state
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [selectedKit, setSelectedKit] = useState<PartyKit | null>(null);

  // Bolo Choices
  const [selectedMassa, setSelectedMassa] = useState<string>('');
  const [cakeAudience, setCakeAudience] = useState<string>('Neutro');
  const [selectedRecheios, setSelectedRecheios] = useState<string[]>([]);
  const [cakeTheme, setCakeTheme] = useState('');
  const [cakeColor, setCakeColor] = useState('Rosa');
  const [customColor, setCustomColor] = useState('');
  const [birthdayName, setBirthdayName] = useState('');
  const [birthdayAge, setBirthdayAge] = useState<string>('');
  const [cakeMessage, setCakeMessage] = useState('');
  const [cakeSpecialDetails, setCakeSpecialDetails] = useState('');
  const [sendWhatsAppInspiration, setSendWhatsAppInspiration] = useState(false);

  // Salgados Distribution
  const [salgadosDist, setSalgadosDist] = useState<Record<string, number>>({});

  // Docinhos Distribution
  const [docinhosDist, setDocinhosDist] = useState<Record<string, number>>({});

  // Addons Quantities
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});

  // Agendamento & Cliente
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('15:00');
  const [clientName, setClientName] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [deliveryType, setDeliveryType] = useState<'retirada' | 'entrega'>('retirada');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<PartyOrder | null>(null);
  const [errorValidation, setErrorValidation] = useState<string | null>(null);

  // Load Bakery and Kits
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let code = initialBakeryCode;
        if (!code && bakerySlug) {
          code = await StorageService.getBakeryCodeBySlug(bakerySlug);
        }
        if (!code) {
          code = StorageService.getActiveBakeryCode() || 'PADARIA01';
        }
        setResolvedBakeryCode(code);

        // Fetch Public Config and Kits
        const [loadedConfig, loadedKits] = await Promise.all([
          StorageService.getPartyPublicConfig(code),
          StorageService.getPartyKits(code)
        ]);

        setConfig(loadedConfig);
        const activeKits = loadedKits.filter(k => k.status === 'publicado');
        setKits(activeKits);

        if (activeKits.length > 0 && !selectedKit) {
          setSelectedKit(activeKits[0]);
        }
      } catch (err) {
        console.error('Error loading public party data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [bakerySlug, initialBakeryCode]);

  // When kit is chosen or changed, initialize distributions
  useEffect(() => {
    if (selectedKit) {
      // Massa
      if (selectedKit.bolo.opcoesMassa && selectedKit.bolo.opcoesMassa.length > 0) {
        setSelectedMassa(selectedKit.bolo.opcoesMassa[0]);
      } else {
        setSelectedMassa('Massa Branca Tradicional (Pão de Ló)');
      }

      // Recheios
      setSelectedRecheios(selectedKit.bolo.recheiosDisponiveis.slice(0, 1));

      // Salgados distribution
      const sSabores = selectedKit.salgados.saboresDisponiveis.slice(0, Math.min(2, selectedKit.salgados.maxSabores));
      const sTotal = selectedKit.salgados.quantidadeTotal;
      const initialSalgados: Record<string, number> = {};
      if (sSabores.length > 0) {
        const perFlavor = Math.floor(sTotal / sSabores.length);
        sSabores.forEach((s, idx) => {
          initialSalgados[s] = idx === 0 ? perFlavor + (sTotal % sSabores.length) : perFlavor;
        });
      }
      setSalgadosDist(initialSalgados);

      // Docinhos distribution
      const dSabores = selectedKit.docinhos.saboresDisponiveis.slice(0, Math.min(2, selectedKit.docinhos.maxSabores));
      const dTotal = selectedKit.docinhos.quantidadeTotal;
      const initialDocinhos: Record<string, number> = {};
      if (dSabores.length > 0) {
        const perFlavor = Math.floor(dTotal / dSabores.length);
        dSabores.forEach((d, idx) => {
          initialDocinhos[d] = idx === 0 ? perFlavor + (dTotal % dSabores.length) : perFlavor;
        });
      }
      setDocinhosDist(initialDocinhos);
    }
  }, [selectedKit]);

  // Calculate live totals
  const totals = useMemo(() => {
    if (!selectedKit) return { precoBase: 0, valorAdicionais: 0, valorTotal: 0, taxaEntrega: 0, itensAdicionaisEscolhidos: [] };
    const deliveryFee = deliveryType === 'entrega' ? (config?.taxaEntregaPadrao || 0) : 0;
    return calculateOrderTotals(selectedKit, addonQuantities, deliveryFee);
  }, [selectedKit, addonQuantities, deliveryType, config]);

  // Salgados sum
  const currentSalgadosSum = Object.values(salgadosDist).reduce((a, b) => a + b, 0);
  const targetSalgados = selectedKit?.salgados.quantidadeTotal || 0;

  // Docinhos sum
  const currentDocinhosSum = Object.values(docinhosDist).reduce((a, b) => a + b, 0);
  const targetDocinhos = selectedKit?.docinhos.quantidadeTotal || 0;

  // Min Date string (YYYY-MM-DD)
  const minDateString = useMemo(() => {
    const minHours = config?.antecedenciaMinimaHoras || 24;
    const minTarget = new Date(Date.now() + minHours * 60 * 60 * 1000);
    return minTarget.toISOString().split('T')[0];
  }, [config]);

  // Handle Recheio toggle
  const handleToggleRecheio = (r: string) => {
    if (!selectedKit) return;
    if (selectedRecheios.includes(r)) {
      setSelectedRecheios(selectedRecheios.filter(item => item !== r));
    } else {
      if (selectedRecheios.length < selectedKit.bolo.maxRecheios) {
        setSelectedRecheios([...selectedRecheios, r]);
      }
    }
  };

  // Adjust Salgados
  const handleAdjustSalgado = (sabor: string, delta: number) => {
    if (!selectedKit) return;
    const current = salgadosDist[sabor] || 0;
    const nextVal = Math.max(0, current + delta);
    const newDist = { ...salgadosDist };
    if (nextVal === 0) {
      delete newDist[sabor];
    } else {
      newDist[sabor] = nextVal;
    }
    setSalgadosDist(newDist);
  };

  // Adjust Docinhos
  const handleAdjustDocinho = (sabor: string, delta: number) => {
    if (!selectedKit) return;
    const current = docinhosDist[sabor] || 0;
    const nextVal = Math.max(0, current + delta);
    const newDist = { ...docinhosDist };
    if (nextVal === 0) {
      delete newDist[sabor];
    } else {
      newDist[sabor] = nextVal;
    }
    setDocinhosDist(newDist);
  };

  // Quick Distribute Equally Salgados
  const handleDistributeEquallySalgados = () => {
    if (!selectedKit) return;
    const sabores = selectedKit.salgados.saboresDisponiveis.slice(0, selectedKit.salgados.maxSabores);
    if (sabores.length === 0) return;
    const total = selectedKit.salgados.quantidadeTotal;
    const perFlavor = Math.floor(total / sabores.length);
    const newDist: Record<string, number> = {};
    sabores.forEach((s, idx) => {
      newDist[s] = idx === 0 ? perFlavor + (total % sabores.length) : perFlavor;
    });
    setSalgadosDist(newDist);
  };

  // Quick Distribute Equally Docinhos
  const handleDistributeEquallyDocinhos = () => {
    if (!selectedKit) return;
    const sabores = selectedKit.docinhos.saboresDisponiveis.slice(0, selectedKit.docinhos.maxSabores);
    if (sabores.length === 0) return;
    const total = selectedKit.docinhos.quantidadeTotal;
    const perFlavor = Math.floor(total / sabores.length);
    const newDist: Record<string, number> = {};
    sabores.forEach((s, idx) => {
      newDist[s] = idx === 0 ? perFlavor + (total % sabores.length) : perFlavor;
    });
    setDocinhosDist(newDist);
  };

  // Adjust Addon
  const handleAdjustAddon = (addonId: string, delta: number) => {
    const current = addonQuantities[addonId] || 0;
    const nextVal = Math.max(0, current + delta);
    setAddonQuantities({
      ...addonQuantities,
      [addonId]: nextVal
    });
  };

  // Submit Order
  const handleFinalizeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidation(null);

    if (!selectedKit || !resolvedBakeryCode) {
      setErrorValidation('Por favor, selecione um kit festa.');
      return;
    }

    if (selectedRecheios.length === 0) {
      setErrorValidation('Selecione pelo menos 1 recheio para o bolo.');
      setStep(2);
      return;
    }

    if (currentSalgadosSum !== targetSalgados) {
      setErrorValidation(`A soma dos salgados deve ser exatamente ${targetSalgados} unidades (atual: ${currentSalgadosSum}).`);
      setStep(3);
      return;
    }

    if (currentDocinhosSum !== targetDocinhos) {
      setErrorValidation(`A soma dos docinhos deve ser exatamente ${targetDocinhos} unidades (atual: ${currentDocinhosSum}).`);
      setStep(4);
      return;
    }

    if (!eventDate) {
      setErrorValidation('Por favor, informe a data da sua comemoração.');
      setStep(6);
      return;
    }

    if (!clientName.trim() || !clientWhatsapp.trim()) {
      setErrorValidation('Por favor, preencha seu nome e WhatsApp para contato.');
      setStep(6);
      return;
    }

    // Validate date/time limits
    const dateVal = validateOrderDateTime(eventDate, eventTime, config?.antecedenciaMinimaHoras || 24);
    if (!dateVal.valid) {
      setErrorValidation(dateVal.message || 'Data e horário inválidos.');
      setStep(6);
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const datePart = now.slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderId = `PED-${datePart}-${randomSuffix}`;

      const salgadosArray: FlavorDistributionItem[] = Object.entries(salgadosDist)
        .filter(([_, q]) => q > 0)
        .map(([sabor, quantidade]) => ({ sabor, quantidade }));

      const docinhosArray: FlavorDistributionItem[] = Object.entries(docinhosDist)
        .filter(([_, q]) => q > 0)
        .map(([sabor, quantidade]) => ({ sabor, quantidade }));

      const newOrder: PartyOrder = {
        id: orderId,
        bakeryCode: resolvedBakeryCode,
        kitId: selectedKit.id,
        kitNome: selectedKit.nome,
        status: 'NOVO',
        precoBase: selectedKit.precoBase,
        valorAdicionais: totals.valorAdicionais,
        valorTotal: totals.valorTotal,
        taxaEntrega: totals.taxaEntrega,
        cliente: {
          nome: clientName.trim(),
          whatsapp: clientWhatsapp.trim(),
          email: clientEmail.trim() || undefined,
          tipoEntrega: deliveryType,
          enderecoEntrega: deliveryType === 'entrega' ? deliveryAddress.trim() : undefined,
          observacoes: clientNotes.trim() || undefined,
        },
        agendamento: {
          data: eventDate,
          horario: eventTime,
        },
        bolo: {
          massa: selectedMassa || undefined,
          recheiosEscolhidos: selectedRecheios,
          publicoAlvo: cakeAudience,
          tema: cakeTheme.trim() || undefined,
          cor: cakeColor === 'Outra' ? (customColor.trim() || 'Personalizada') : cakeColor,
          corPersonalizada: customColor.trim() || undefined,
          nomeAniversariante: birthdayName.trim() || undefined,
          idadeAniversariante: birthdayAge ? parseInt(birthdayAge) : undefined,
          mensagem: cakeMessage.trim() || undefined,
          detalhesEspeciais: cakeSpecialDetails.trim() || undefined,
          enviaraInspiracaoWhatsApp: sendWhatsAppInspiration,
        },
        salgados: {
          total: targetSalgados,
          distribuicao: salgadosArray,
        },
        docinhos: {
          total: targetDocinhos,
          distribuicao: docinhosArray,
        },
        adicionaisEscolhidos: totals.itensAdicionaisEscolhidos,
        statusHistory: [
          {
            status: 'NOVO',
            changedAt: now,
            changedBy: 'Cliente via Site',
            nota: 'Pedido enviado pelo cliente online'
          }
        ],
        createdAt: now,
        updatedAt: now,
      };

      await StorageService.savePartyOrder(newOrder);
      setCreatedOrder(newOrder);
      setStep(7); // Success Screen
    } catch (err: any) {
      console.error('Error saving party order:', err);
      setErrorValidation('Erro ao processar seu pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50/40 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-gray-700">Carregando cardápio de Kit Festa...</p>
        </div>
      </div>
    );
  }

  const bakeryTitle = config?.nomeExibicao || config?.nomePublico || 'Padaria & Confeitaria Artesanal';
  const bakeryLogo = config?.logoUrl;
  const bakeryPhone = config?.telefoneWhatsapp || config?.whatsapp || '11999999999';

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 pb-28">
      {/* Header Banner */}
      <header className="bg-gradient-to-r from-[#E8571A] to-[#FF7A00] text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {bakeryLogo ? (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white p-1 border border-white/40 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={bakeryLogo} alt={bakeryTitle} className="w-full h-full object-contain rounded-xl" />
                </div>
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shadow-inner shrink-0">
                  <Cake className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <span className="inline-block px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-100 mb-1">
                  Cardápio de Encomendas
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">{bakeryTitle}</h1>
                <p className="text-xs text-white/90 font-medium flex items-center space-x-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Antecedência mínima: {config?.antecedenciaMinimaHoras || 24}h</span>
                </p>
              </div>
            </div>

            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl font-bold transition-colors"
              >
                Voltar ao Painel
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* SUCCESS SCREEN */}
        {step === 7 && createdOrder && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 bg-orange-100 text-[#E8571A] rounded-full text-xs font-black uppercase tracking-wider">
                Pedido #{createdOrder.id}
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-2">
                Encomenda Recebida com Sucesso!
              </h2>
              <p className="text-xs text-gray-600 max-w-md mx-auto mt-1">
                Muito obrigado, <strong>{createdOrder.cliente.nome}</strong>! Nossa equipe já registrou sua encomenda para o dia{' '}
                <strong>{createdOrder.agendamento.data.split('-').reverse().join('/')} às {createdOrder.agendamento.horario}</strong>.
              </p>
            </div>

            {/* WhatsApp Direct Action */}
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-left space-y-3">
              <p className="text-xs font-black text-emerald-900 flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>Próximo Passo Importante:</span>
              </p>
              <p className="text-xs text-emerald-800">
                Envie o resumo da sua encomenda diretamente para o WhatsApp da padaria para confirmação imediata e envio da foto de inspiração do bolo.
              </p>
              <a
                href={`https://wa.me/${bakeryPhone.replace(/\D/g, '').startsWith('55') ? bakeryPhone.replace(/\D/g, '') : '55' + bakeryPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  createWhatsAppOrderMessage(createdOrder, bakeryTitle)
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Enviar Confirmação no WhatsApp da Padaria</span>
              </a>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left text-xs space-y-2">
              <div className="flex justify-between font-bold text-gray-700">
                <span>Kit Escolhido:</span>
                <span>{createdOrder.kitNome}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-700">
                <span>Valor Total:</span>
                <span className="text-[#E8571A] font-black">
                  R$ {createdOrder.valorTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Forma de Entrega:</span>
                <span className="capitalize">{createdOrder.cliente.tipoEntrega}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setCreatedOrder(null);
              }}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 underline cursor-pointer"
            >
              Fazer outra encomenda
            </button>
          </div>
        )}

        {/* ORDERING STEPS */}
        {step !== 7 && (
          <>
            {/* Step Navigation Bar */}
            <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between overflow-x-auto no-scrollbar gap-1 text-xs font-bold">
              {[
                { s: 1, label: '1. Kit Festa' },
                { s: 2, label: '2. Bolo' },
                { s: 3, label: '3. Salgados' },
                { s: 4, label: '4. Docinhos' },
                { s: 5, label: '5. Adicionais' },
                { s: 6, label: '6. Agendamento' },
              ].map(({ s, label }) => (
                <button
                  key={s}
                  onClick={() => setStep(s as any)}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    step === s
                      ? 'bg-[#E8571A] text-white shadow-xs font-black'
                      : step > s
                      ? 'bg-orange-50 text-[#E8571A]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {errorValidation && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorValidation}</span>
              </div>
            )}

            {/* STEP 1: ESCOLHA DO KIT */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center sm:text-left">
                  <h2 className="text-lg font-black text-gray-900">Escolha o seu Kit Festa Ideal</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Selecione o tamanho ideal para sua festa. Você poderá personalizar bolo, salgados e doces a seguir.
                  </p>
                </div>

                <div className={`grid gap-4 ${isMobileSim ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {kits.map((kit) => {
                    const isSelected = selectedKit?.id === kit.id;
                    return (
                      <div
                        key={kit.id}
                        onClick={() => setSelectedKit(kit)}
                        className={`relative bg-white rounded-3xl border-2 overflow-hidden transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md ${
                          isSelected ? 'border-[#E8571A] ring-2 ring-orange-500/20' : 'border-gray-200'
                        }`}
                      >
                        {/* Header Badge Strip without photo */}
                        <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                          <span className="px-2.5 py-1 bg-white border border-gray-200 text-gray-800 rounded-full text-[11px] sm:text-xs font-black flex items-center space-x-1.5 shadow-2xs shrink-0">
                            <Cake className="w-3.5 h-3.5 text-[#E8571A] shrink-0" />
                            <span>Serve ~{kit.quantidadePessoas} Pessoas</span>
                          </span>

                          {isSelected ? (
                            <span className="px-2.5 py-1 bg-[#E8571A] text-white rounded-full text-[11px] sm:text-xs font-black flex items-center space-x-1 shadow-xs shrink-0">
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span>Selecionado</span>
                            </span>
                          ) : (
                            <span className="text-[11px] sm:text-xs font-bold text-gray-400 shrink-0">
                              Clique p/ escolher
                            </span>
                          )}
                        </div>

                        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight">{kit.nome}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{kit.descricao}</p>

                            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold text-gray-600">
                              <span className="px-2 py-0.5 bg-gray-100 rounded-lg">🎂 {kit.bolo.tamanhoDescricao}</span>
                              <span className="px-2 py-0.5 bg-orange-50 text-orange-800 rounded-lg">🥟 {kit.salgados.quantidadeTotal} Salgados</span>
                              <span className="px-2 py-0.5 bg-pink-50 text-pink-800 rounded-lg">🍬 {kit.docinhos.quantidadeTotal} Doces</span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                            <div className="shrink-0">
                              <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">A partir de</span>
                              <span className="text-base sm:text-lg font-black text-[#E8571A]">
                                R$ {kit.precoBase.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedKit(kit);
                                setStep(2);
                              }}
                              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1 shrink-0 cursor-pointer ${
                                isSelected
                                  ? 'bg-[#E8571A] text-white shadow-xs'
                                  : 'bg-gray-900 hover:bg-black text-white'
                              }`}
                            >
                              <span>Personalizar</span>
                              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: PERSONALIZAÇÃO DO BOLO */}
            {step === 2 && selectedKit && (
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-2xs space-y-5">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <Cake className="w-5 h-5 text-amber-600" />
                  <div>
                    <h2 className="text-base font-black text-gray-900">Personalize o seu Bolo</h2>
                    <p className="text-xs text-gray-500">
                      {selectedKit.bolo.tamanhoDescricao} • Escolha a massa e até {selectedKit.bolo.maxRecheios} recheio(s)
                    </p>
                  </div>
                </div>

                {/* Opção de Massa do Bolo */}
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-2">
                    1. Escolha a Massa do Bolo *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(selectedKit.bolo.opcoesMassa && selectedKit.bolo.opcoesMassa.length > 0
                      ? selectedKit.bolo.opcoesMassa
                      : ['Massa Branca Tradicional (Pão de Ló)', 'Massa de Chocolate 50% Cacau']
                    ).map((massa) => {
                      const isChecked = selectedMassa === massa;
                      return (
                        <button
                          key={massa}
                          type="button"
                          onClick={() => setSelectedMassa(massa)}
                          className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isChecked
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{massa}</span>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isChecked ? 'bg-white text-amber-600' : 'border-gray-300'}`}>
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recheios Selection */}
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-2">
                    2. Escolha os Recheios ({selectedRecheios.length}/{selectedKit.bolo.maxRecheios}) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedKit.bolo.recheiosDisponiveis.map((recheio) => {
                      const isChecked = selectedRecheios.includes(recheio);
                      return (
                        <button
                          key={recheio}
                          type="button"
                          onClick={() => handleToggleRecheio(recheio)}
                          className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isChecked
                              ? 'bg-amber-50/80 border-amber-400 text-amber-950 shadow-2xs'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{recheio}</span>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isChecked ? 'bg-amber-500 border-amber-600 text-white' : 'border-gray-300'}`}>
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Público-Alvo do Bolo */}
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-2">
                    3. Público-Alvo / Estilo da Decoração
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'Infantil', label: '🧒 Infantil / Crianças' },
                      { id: 'Feminino', label: '🌸 Feminino / Delicado' },
                      { id: 'Masculino', label: '🎩 Masculino / Moderno' },
                      { id: 'Neutro', label: '✨ Neutro / Elegante' },
                      { id: 'Outro', label: '🎈 Outro Tema' },
                    ].map((aud) => {
                      const isSelected = cakeAudience === aud.id;
                      return (
                        <button
                          key={aud.id}
                          type="button"
                          onClick={() => setCakeAudience(aud.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-orange-50 border-[#E8571A] text-[#E8571A] font-black shadow-2xs'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {aud.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tema e Cor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tema da Festa / Decoração</label>
                    <input
                      type="text"
                      value={cakeTheme}
                      onChange={(e) => setCakeTheme(e.target.value)}
                      placeholder="Ex: Girassol, Futebol, Princesas, Homem Aranha..."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Cor Predominante da Cobertura</label>
                    <select
                      value={cakeColor}
                      onChange={(e) => setCakeColor(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    >
                      <option value="Branco Clássico">Branco Clássico</option>
                      <option value="Rosa">Rosa Suave</option>
                      <option value="Azul">Azul Royal</option>
                      <option value="Vermelho">Vermelho Vibrante</option>
                      <option value="Dourado / Amarelo">Dourado / Amarelo</option>
                      <option value="Lilás / Roxo">Lilás / Roxo</option>
                      <option value="Verde">Verde Floresta</option>
                      <option value="Outra">Outra (Digitar abaixo)</option>
                    </select>
                  </div>
                </div>

                {cakeColor === 'Outra' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Especifique a Cor Desejada</label>
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="Ex: Degradê de Rosa com Dourado"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Nome e Idade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Aniversariante</label>
                    <input
                      type="text"
                      value={birthdayName}
                      onChange={(e) => setBirthdayName(e.target.value)}
                      placeholder="Ex: Larissa"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Idade a Comemorar (opcional)</label>
                    <input
                      type="number"
                      min="1"
                      value={birthdayAge}
                      onChange={(e) => setBirthdayAge(e.target.value)}
                      placeholder="Ex: 5"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mensagem ou Frase no Bolo</label>
                  <input
                    type="text"
                    value={cakeMessage}
                    onChange={(e) => setCakeMessage(e.target.value)}
                    placeholder="Ex: Parabéns Larissa!"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                {/* Checkbox envio de foto WhatsApp */}
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendWhatsAppInspiration}
                      onChange={(e) => setSendWhatsAppInspiration(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-black text-emerald-900">
                      📸 Tenho uma foto de inspiração e vou enviar no WhatsApp da padaria!
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 3: SALGADOS */}
            {step === 3 && selectedKit && (
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <Utensils className="w-5 h-5 text-[#E8571A]" />
                    <div>
                      <h2 className="text-base font-black text-gray-900">Escolha dos Salgados</h2>
                      <p className="text-xs text-gray-500">
                        Total do kit: {targetSalgados} unidades • Ajuste as quantidades por sabor
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleDistributeEquallySalgados}
                      className="px-2.5 py-1 text-[11px] font-bold text-[#E8571A] bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Dividir Igualmente
                    </button>
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
                      currentSalgadosSum === targetSalgados
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-amber-50 border-amber-300 text-amber-700'
                    }`}>
                      {currentSalgadosSum} / {targetSalgados} un
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedKit.salgados.saboresDisponiveis.map((sabor) => {
                    const count = salgadosDist[sabor] || 0;
                    return (
                      <div
                        key={sabor}
                        className="flex items-center justify-between p-3.5 bg-gray-50/70 rounded-2xl border border-gray-200"
                      >
                        <span className="text-xs font-bold text-gray-900">{sabor}</span>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleAdjustSalgado(sabor, -5)}
                            disabled={count <= 0}
                            className="w-8 h-8 rounded-xl bg-white border border-gray-300 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 transition-colors disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-12 text-center text-xs font-black text-gray-900">
                            {count} un
                          </span>

                          <button
                            type="button"
                            onClick={() => handleAdjustSalgado(sabor, 5)}
                            disabled={currentSalgadosSum >= targetSalgados}
                            className="w-8 h-8 rounded-xl bg-[#E8571A] text-white flex items-center justify-center font-bold hover:opacity-90 transition-colors disabled:opacity-30 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: DOCINHOS */}
            {step === 4 && selectedKit && (
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <Candy className="w-5 h-5 text-pink-600" />
                    <div>
                      <h2 className="text-base font-black text-gray-900">Escolha dos Docinhos</h2>
                      <p className="text-xs text-gray-500">
                        Total do kit: {targetDocinhos} unidades • Ajuste as quantidades por sabor
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleDistributeEquallyDocinhos}
                      className="px-2.5 py-1 text-[11px] font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Dividir Igualmente
                    </button>
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
                      currentDocinhosSum === targetDocinhos
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-amber-50 border-amber-300 text-amber-700'
                    }`}>
                      {currentDocinhosSum} / {targetDocinhos} un
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedKit.docinhos.saboresDisponiveis.map((sabor) => {
                    const count = docinhosDist[sabor] || 0;
                    return (
                      <div
                        key={sabor}
                        className="flex items-center justify-between p-3.5 bg-gray-50/70 rounded-2xl border border-gray-200"
                      >
                        <span className="text-xs font-bold text-gray-900">{sabor}</span>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleAdjustDocinho(sabor, -5)}
                            disabled={count <= 0}
                            className="w-8 h-8 rounded-xl bg-white border border-gray-300 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 transition-colors disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-12 text-center text-xs font-black text-gray-900">
                            {count} un
                          </span>

                          <button
                            type="button"
                            onClick={() => handleAdjustDocinho(sabor, 5)}
                            disabled={currentDocinhosSum >= targetDocinhos}
                            className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold hover:opacity-90 transition-colors disabled:opacity-30 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: ADICIONAIS */}
            {step === 5 && selectedKit && (
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-2xs space-y-5">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-base font-black text-gray-900">Deseja Adicionar Algo Mais?</h2>
                    <p className="text-xs text-gray-500">
                      Opcional: Velas, refrigerantes gelados, descartáveis e topos especiais.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {selectedKit.adicionais.filter(a => a.ativo).map((addon) => {
                    const count = addonQuantities[addon.id] || 0;
                    return (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between p-3.5 bg-blue-50/40 rounded-2xl border border-blue-100"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900">{addon.nome}</p>
                          <p className="text-[11px] font-black text-blue-700">
                            + R$ {addon.preco.toFixed(2).replace('.', ',')}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleAdjustAddon(addon.id, -1)}
                            disabled={count <= 0}
                            className="w-8 h-8 rounded-xl bg-white border border-gray-300 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 transition-colors disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-8 text-center text-xs font-black text-gray-900">
                            {count}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleAdjustAddon(addon.id, 1)}
                            className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold hover:opacity-90 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 6: AGENDAMENTO E CLIENTE */}
            {step === 6 && selectedKit && (
              <form onSubmit={handleFinalizeOrder} className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-2xs space-y-5">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <Calendar className="w-5 h-5 text-[#E8571A]" />
                  <div>
                    <h2 className="text-base font-black text-gray-900">Data, Horário e Seus Dados</h2>
                    <p className="text-xs text-gray-500">
                      Última etapa para finalizar seu pedido com a padaria
                    </p>
                  </div>
                </div>

                {/* Agendamento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-gray-800 mb-1">
                      Data da Entrega / Retirada *
                    </label>
                    <input
                      type="date"
                      min={minDateString}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-800 mb-1">
                      Horário Desejado *
                    </label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Tipo de Entrega */}
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1.5">
                    Como deseja receber o pedido? *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('retirada')}
                      className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                        deliveryType === 'retirada'
                          ? 'bg-orange-50 border-[#E8571A] text-[#E8571A] shadow-2xs font-black'
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      <Store className="w-4 h-4 mb-1" />
                      <span>🏬 Retirar no Balcão</span>
                      <p className="text-[10px] text-gray-400 font-normal">Grátis na loja</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('entrega')}
                      className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                        deliveryType === 'entrega'
                          ? 'bg-orange-50 border-[#E8571A] text-[#E8571A] shadow-2xs font-black'
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      <MapPin className="w-4 h-4 mb-1" />
                      <span>🚚 Entrega no Endereço</span>
                      <p className="text-[10px] text-gray-400 font-normal">
                        {config?.taxaEntregaPadrao ? `+ R$ ${config.taxaEntregaPadrao.toFixed(2)}` : 'A combinar'}
                      </p>
                    </button>
                  </div>
                </div>

                {deliveryType === 'entrega' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Endereço Completo de Entrega (Rua, Número, Bairro, Compl.) *
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={2}
                      required
                      placeholder="Ex: Rua das Flores, 123, Apto 402 - Bairro Centro"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Dados do Cliente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                      placeholder="Ex: Maria Silva"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Seu WhatsApp (com DDD) *
                    </label>
                    <input
                      type="tel"
                      value={clientWhatsapp}
                      onChange={(e) => setClientWhatsapp(e.target.value)}
                      required
                      placeholder="(11) 99999-9999"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Observações Adicionais ou Restrições
                  </label>
                  <textarea
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    rows={2}
                    placeholder="Ex: Salgados bem fritinhos, por favor!"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </form>
            )}
          </>
        )}
      </main>

      {/* STICKY BOTTOM SUMMARY BAR */}
      {step !== 7 && selectedKit && (
        <div className={`${isLivePreviewMode ? 'sticky bottom-0 z-40 shadow-lg p-3' : 'fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md shadow-2xl p-3 sm:p-4'} bg-white/95 border-t border-gray-200`}>
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-gray-500 font-medium truncate">
                {selectedKit.nome}
              </p>
              <p className="text-base sm:text-lg font-black text-[#E8571A]">
                R$ {totals.valorTotal.toFixed(2).replace('.', ',')}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as any)}
                  className="px-3 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Voltar
                </button>
              )}

              {step < 6 ? (
                <button
                  type="button"
                  onClick={() => setStep((step + 1) as any)}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-[#E8571A] hover:opacity-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <span>Avançar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalizeOrder}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Enviando Pedido...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Encomenda</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
