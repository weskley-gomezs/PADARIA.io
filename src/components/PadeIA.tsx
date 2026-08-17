import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Calculator,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Crown,
  Moon,
  BarChart3,
  RefreshCw,
  Zap,
  CheckCircle2,
  DollarSign,
  Package,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Trash2,
  Mic,
  MicOff,
  Loader2,
  Volume2,
  Square,
  Edit3,
  ArrowLeft,
  Camera,
  Plus,
  Scale
} from 'lucide-react';
import Markdown from 'react-markdown';
import { BakeryCompany, Product, SaleHistoryItem, VipOffer } from '../types';
import { StorageService } from '../services/storageService';
import { formatDateToBR, formatDateToISO } from '../utils/dateUtils';
import { auth } from '../services/firebase';
import { authenticatedFetch } from '../services/authApiHelper';

interface PadeIAProps {
  company: BakeryCompany;
  products: Product[];
  salesHistory: SaleHistoryItem[];
  vipOffers: VipOffer[];
  onOpenVipOfferModal?: (product: Product) => void;
  onOpenScanner?: () => void;
  onNavigateBack?: () => void;
}

export interface RegisteredActionItem {
  type: 'produto' | 'descarte' | 'divergencia';
  nome: string;
  quantidade: number;
  valorKg?: number;
  valorTotal?: number;
  dataValidade?: string;
  motivo?: string;
  expectedQuantity?: number;
  physicalQuantity?: number;
  varianceQuantity?: number;
  unit?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  registeredProducts?: RegisteredActionItem[];
}

const cleanDisplayText = (text: string) => {
  if (!text) return '';
  return text
    .replace(/```(?:json:action|json)[\s\S]*?```/gi, '')
    .replace(/\{\s*"action"\s*:\s*"(?:REGISTER_PRODUCT|REGISTER_PRODUCTS|REGISTER_DISCARD|REGISTER_DISCARDS|REGISTER_EXPIRED|REGISTER_DIVERGENCE|REGISTER_STOCK_COUNT)"[\s\S]*?\}/gi, '')
    .trim();
};

interface ExtractedAction {
  type: 'product' | 'discard' | 'divergence';
  data: any;
}

const extractAllActions = (text: string): ExtractedAction[] => {
  const actions: ExtractedAction[] = [];
  if (!text) return actions;

  // 1. Search for ```json:action ... ``` or ```json ... ``` blocks
  const blockRegex = /```(?:json:action|json)\s*([\s\S]*?)\s*```/gi;
  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed) {
        if ((parsed.action === 'REGISTER_PRODUCT' || parsed.action === 'REGISTER_PROD') && parsed.product) {
          actions.push({ type: 'product', data: parsed.product });
        } else if (parsed.action === 'REGISTER_PRODUCTS' && Array.isArray(parsed.products)) {
          parsed.products.forEach((p: any) => actions.push({ type: 'product', data: p }));
        } else if ((parsed.action === 'REGISTER_DISCARD' || parsed.action === 'REGISTER_EXPIRED') && (parsed.discard || parsed.product)) {
          actions.push({ type: 'discard', data: parsed.discard || parsed.product });
        } else if (parsed.action === 'REGISTER_DISCARDS' && Array.isArray(parsed.discards)) {
          parsed.discards.forEach((d: any) => actions.push({ type: 'discard', data: d }));
        } else if ((parsed.action === 'REGISTER_DIVERGENCE' || parsed.action === 'REGISTER_STOCK_COUNT') && (parsed.divergence || parsed.stockCount)) {
          actions.push({ type: 'divergence', data: parsed.divergence || parsed.stockCount });
        } else if (parsed.nome && (parsed.quantidade || parsed.valorKg || parsed.dataValidade)) {
          actions.push({ type: 'product', data: parsed });
        }
      }
    } catch (e) {
      console.warn('[PadeIA Action Parser] Erro ao parsear bloco JSON:', e);
    }
  }

  // 2. Fallback: Search for any raw JSON object containing "action"
  if (actions.length === 0) {
    const rawMatches = text.match(/\{\s*"action"\s*:\s*"(?:REGISTER_PRODUCT|REGISTER_PRODUCTS|REGISTER_DISCARD|REGISTER_DISCARDS|REGISTER_EXPIRED|REGISTER_DIVERGENCE|REGISTER_STOCK_COUNT)"[\s\S]*?\}/gi);
    if (rawMatches) {
      for (const m of rawMatches) {
        try {
          const parsed = JSON.parse(m);
          if (parsed.action === 'REGISTER_PRODUCT' && parsed.product) {
            actions.push({ type: 'product', data: parsed.product });
          } else if (parsed.action === 'REGISTER_DISCARD' && (parsed.discard || parsed.product)) {
            actions.push({ type: 'discard', data: parsed.discard || parsed.product });
          } else if (parsed.action === 'REGISTER_DIVERGENCE' && (parsed.divergence || parsed.stockCount)) {
            actions.push({ type: 'divergence', data: parsed.divergence || parsed.stockCount });
          }
        } catch (_) {}
      }
    }
  }

  return actions;
};

export const PadeIA: React.FC<PadeIAProps> = ({
  company,
  products,
  salesHistory,
  vipOffers,
  onOpenVipOfferModal,
  onOpenScanner,
  onNavigateBack
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'resumo' | 'precificacao' | 'alertas'>('chat');
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: `Olá! Eu sou a **PadeIA™**.

Posso analisar suas perdas, vencimentos, descartes e ajudar você a tomar decisões melhores na operação.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice Command State
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'ready' | 'error'>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isListeningRef = useRef<boolean>(false);
  const speechCapturedTextRef = useRef<string>('');

  useEffect(() => {
    const handleVoiceTrigger = () => {
      setActiveTab('chat');
      setTimeout(() => {
        handleStartVoice();
      }, 150);
    };
    window.addEventListener('start-padeia-voice', handleVoiceTrigger);
    return () => {
      window.removeEventListener('start-padeia-voice', handleVoiceTrigger);
      stopVoiceRecording();
    };
  }, []);

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const stopVoiceRecording = () => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    stopMediaStream();
  };

  // Helper function to eliminate repeated words or duplicated phrase chunks
  const deduplicateText = (text: string): string => {
    if (!text) return '';
    const trimmed = text.trim();
    const words = trimmed.split(/\s+/);
    if (words.length <= 1) return trimmed;

    // 1. Remove immediate duplicate single words (e.g. "hoje hoje")
    const singleClean: string[] = [];
    for (let i = 0; i < words.length; i++) {
      if (i > 0 && words[i].toLowerCase() === words[i - 1].toLowerCase()) {
        continue;
      }
      singleClean.push(words[i]);
    }

    // 2. Remove repeated multi-word chunks (e.g. "Produzi 100 coxinhas Produzi 100 coxinhas")
    let currentWords = [...singleClean];
    let changed = true;

    while (changed) {
      changed = false;
      for (let len = Math.min(15, Math.floor(currentWords.length / 2)); len >= 1; len--) {
        for (let i = 0; i <= currentWords.length - 2 * len; i++) {
          const phrase1 = currentWords.slice(i, i + len).map((w) => w.toLowerCase()).join(' ');
          const phrase2 = currentWords.slice(i + len, i + 2 * len).map((w) => w.toLowerCase()).join(' ');
          if (phrase1 && phrase1 === phrase2) {
            currentWords.splice(i + len, len);
            changed = true;
            break;
          }
        }
        if (changed) break;
      }
    }

    return currentWords.join(' ').trim();
  };

  // Start Voice Recording
  const handleStartVoice = async () => {
    setVoiceError('');
    setVoiceTranscript('');
    speechCapturedTextRef.current = '';
    audioChunksRef.current = [];
    isListeningRef.current = true;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (_) {}
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'pt-BR';
        recognition.interimResults = true;
        recognition.continuous = false; // Single clean continuous sentence capture without repeating buffers

        recognition.onstart = () => {
          console.log('[PadeIA Voice] Web Speech API iniciado.');
          setVoiceStatus('listening');
          setVoiceTranscript('Ouvindo... Fale seu comando agora...');
        };

        recognition.onresult = (event: any) => {
          let rawText = '';

          for (let i = 0; i < event.results.length; ++i) {
            rawText += event.results[i][0].transcript + ' ';
          }

          const cleanedText = deduplicateText(rawText);
          if (cleanedText) {
            speechCapturedTextRef.current = cleanedText;
            setVoiceTranscript(cleanedText);
            setInputMessage(cleanedText); // Fill input message live as user speaks
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('[PadeIA Voice] SpeechRecognition onerror:', event.error);
          if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            isListeningRef.current = false;
            stopVoiceRecording();
            setVoiceStatus('error');
            setVoiceError('Permissão de microfone negada. Clique no ícone de cadeado no navegador para permitir o microfone.');
          } else if (event.error === 'no-speech') {
            console.log('[PadeIA Voice] Nenhuma fala detectada.');
          } else if (event.error !== 'aborted') {
            console.log('[PadeIA Voice] Alternando para gravador Gemini...');
            try { recognition.abort(); } catch (_) {}
            recognitionRef.current = null;
            startMediaRecorderFallback();
          }
        };

        recognition.onend = () => {
          console.log('[PadeIA Voice] SpeechRecognition onend');
          if (isListeningRef.current) {
            const rawCaptured = speechCapturedTextRef.current;
            const captured = deduplicateText(rawCaptured);
            isListeningRef.current = false;
            stopMediaStream();

            if (captured) {
              setVoiceStatus('ready');
              setVoiceTranscript(captured);
              setInputMessage(captured);
            } else {
              setVoiceStatus('idle');
            }
          }
        };

        recognition.start();
      } catch (err: any) {
        console.warn('[PadeIA Voice] Falha ao iniciar SpeechRecognition, usando MediaRecorder:', err);
        startMediaRecorderFallback();
      }
    } else {
      startMediaRecorderFallback();
    }
  };

  // Fallback Method: MediaRecorder + Gemini Flash STT (works in all browsers and devices)
  const startMediaRecorderFallback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setVoiceStatus('listening');
      setVoiceTranscript('Ouvindo... Fale o seu comando agora e depois clique em Concluir.');
    } catch (err: any) {
      console.error('[PadeIA Voice] Erro ao obter microfone para MediaRecorder:', err);
      stopVoiceRecording();
      setVoiceStatus('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setVoiceError('Permissão do microfone negada no navegador. Por favor, libere o microfone.');
      } else {
        setVoiceError('Não foi possível conectar ao microfone do dispositivo.');
      }
    }
  };

  // Stop Recording and Process Audio/Text
  const handleStopVoice = async () => {
    isListeningRef.current = false;

    // Stop Web Speech API
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }

    // Stop MediaRecorder and wait for onstop
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        const recorder = mediaRecorderRef.current;
        if (!recorder) {
          resolve();
          return;
        }
        recorder.onstop = () => {
          resolve();
        };
        try {
          recorder.stop();
        } catch (_) {
          resolve();
        }
      });
    }

    stopMediaStream();

    const textFromSpeechAPI = speechCapturedTextRef.current.trim();

    if (textFromSpeechAPI) {
      // Web Speech API captured text successfully!
      setVoiceTranscript(textFromSpeechAPI);
      setInputMessage(textFromSpeechAPI);
      setVoiceStatus('ready');
      return;
    }

    // Fall back to backend Gemini Flash STT using recorded audio chunks
    if (audioChunksRef.current.length > 0) {
      setVoiceStatus('processing');
      setVoiceTranscript('Convertendo áudio em texto com a PadeIA™...');

      try {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (audioBlob.size < 100) {
          setVoiceStatus('error');
          setVoiceError('Nenhum som foi detectado. Fale mais perto do microfone e tente novamente.');
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result as string;
            const res = await authenticatedFetch('/api/padeia/speech-to-text', {
              method: 'POST',
              body: JSON.stringify({
                audioBase64: base64Audio,
                mimeType
              })
            });

            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
              throw new Error('Resposta inválida do servidor (formato HTML/Texto).');
            }

            const data = await res.json();
            if (res.ok && data.text) {
              const textResult = data.text.trim();
              setVoiceTranscript(textResult);
              setInputMessage(textResult);
              setVoiceStatus('ready');
            } else {
              throw new Error(data.error || 'Erro na conversão do áudio.');
            }
          } catch (sttErr: any) {
            console.error('[PadeIA Voice] Backend STT error:', sttErr);
            setVoiceStatus('error');
            setVoiceError('Não foi possível identificar o comando de voz. Tente falar novamente.');
          }
        };
      } catch (err: any) {
        setVoiceStatus('error');
        setVoiceError('Erro ao processar áudio do microfone.');
      }
    } else {
      setVoiceStatus('error');
      setVoiceError('Nenhum comando de voz foi capturado. Tente falar novamente.');
    }
  };

  // Confirm & Send voice transcript to PadeIA
  const handleConfirmVoiceSend = async () => {
    const textToSend = inputMessage.trim() || voiceTranscript.trim();
    if (!textToSend) return;

    setVoiceStatus('idle');
    setVoiceTranscript('');
    await handleSendMessage(textToSend);
  };

  const handleCancelVoice = () => {
    stopVoiceRecording();
    setVoiceStatus('idle');
    setVoiceTranscript('');
    setVoiceError('');
  };

  // Pricing Assistant state
  const [costPrice, setCostPrice] = useState<string>('10.00');
  const [desiredMargin, setDesiredMargin] = useState<string>('40');
  const [daysToExpire, setDaysToExpire] = useState<string>('2');
  const [selectedProductName, setSelectedProductName] = useState<string>('');

  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeTab]);

  // Quick Questions
  const quickQuestions = [
    "Quanto perdi este mês?",
    "O que está vencendo?",
    "Qual produto mais gera perdas?",
    "📷 Analisar etiqueta",
    "Como reduzir meus descartes?"
  ];

  // Calculations for KPI summaries
  const expiredProducts = products.filter((p) => p.status === 'vencido');
  const expiringProducts = products.filter((p) => p.status === 'vencendo');
  const normalProducts = products.filter((p) => p.status === 'normal');

  const expiredValue = expiredProducts.reduce(
    (acc, p) => acc + (p.valorTotal || (p.peso && p.valorKg ? p.peso * p.valorKg : p.quantidade * (p.valorKg || 12))),
    0
  );
  const expiringValue = expiringProducts.reduce(
    (acc, p) => acc + (p.valorTotal || (p.peso && p.valorKg ? p.peso * p.valorKg : p.quantidade * (p.valorKg || 12))),
    0
  );

  const activeVipOffers = vipOffers.filter((o) => o.status === 'ativo');
  const vipPotentialRecovered = activeVipOffers.reduce((acc, o) => acc + o.valorPromocional, 0);
  const vipSoldOffers = vipOffers.filter((o) => o.status === 'vendido');
  const vipTotalRecovered = vipSoldOffers.reduce((acc, o) => acc + (o.valorPromocional || o.valorOriginal), 0);

  // Top waste category calculation
  const categoryLossMap: Record<string, number> = {};
  expiredProducts.forEach((p) => {
    const cat = p.categoria || 'Geral';
    const val = p.valorTotal || (p.peso && p.valorKg ? p.peso * p.valorKg : p.quantidade * (p.valorKg || 12));
    categoryLossMap[cat] = (categoryLossMap[cat] || 0) + val;
  });
  const topCategory = Object.entries(categoryLossMap).sort((a, b) => b[1] - a[1])[0] || ['Pães e Massas', 0];

  // Send message to backend /api/padeia/chat
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputMessage.trim();
    if (!messageText || isLoading) return;

    if ((messageText.includes('Analisar etiqueta') || messageText.includes('📷')) && onOpenScanner) {
      onOpenScanner();
      if (!textToSend) setInputMessage('');
      return;
    }

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare history payload
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.text
      }));

      let response: Response | null = null;
      let contentType = '';
      let data: any = {};
      let text = '';

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await authenticatedFetch('/api/padeia/chat', {
            method: 'POST',
            body: JSON.stringify({
              message: messageText,
              history: historyPayload,
              bakeryCode: company?.codigoAtivacao
            })
          });

          contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            break;
          }

          text = await response.text();
          if (attempt === 0 && (text.includes('Please wait while your application starts') || text.includes('<!doctype html>'))) {
            console.warn('[PADEIA] Servidor aquecendo (Warmup). Tentando novamente em 3 segundos...');
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }
          break;
        } catch (fetchErr) {
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }
          throw fetchErr;
        }
      }

      if (!response || !response.ok) {
        let errorMessage = `Erro HTTP ${response?.status || 500}`;

        if (contentType.includes('application/json') && response) {
          try {
            data = await response.json();
            errorMessage = data?.message || data?.error || errorMessage;
          } catch (_) {}
        } else {
          console.error('[PADEIA] Non-JSON error response:', text);
          if (text.includes('Please wait while your application starts')) {
            errorMessage = 'O servidor da aplicação está inicializando. Por favor, tente novamente em alguns segundos.';
          }
        }

        throw new Error(errorMessage);
      }

      if (!contentType.includes('application/json')) {
        console.error('[PADEIA] Non-JSON success response:', text);
        if (text.includes('Please wait while your application starts')) {
          throw new Error('O servidor da aplicação está inicializando. Por favor, tente novamente em alguns segundos.');
        }
        throw new Error('O servidor respondeu com formato inválido (HTML/Texto) em vez de JSON.');
      }

      data = await response.json();

      const rawReply = data.reply || 'Não consegui obter uma resposta no momento. Tente novamente.';

      // Extract and execute actions (Products, Discards/Losses, Divergences)
      let extractedActions = extractAllActions(rawReply);

      // Fallback: If user message indicated registration/loss/divergence and AI didn't return structured JSON
      if (extractedActions.length === 0 && company?.codigoAtivacao) {
        const lowerMsg = messageText.toLowerCase();

        // Check 1: Discard / Expired / Loss
        if (/\b(descart|perdi|venc|estrag|jogou fora|sobra|perda|lixo)\b/i.test(lowerMsg)) {
          let qty = 1;
          const qtyMatch = messageText.match(/(\d+)\s*(?:unidades?|kg|litros?|pcts?|pacotes?|caixas?|g|gramas?|un)?/i);
          if (qtyMatch && qtyMatch[1]) qty = parseInt(qtyMatch[1]) || 1;

          let unitPrice = 5.0;
          if (lowerMsg.includes('centavo')) {
            const centMatch = lowerMsg.match(/(\d+)\s*centavos?/);
            if (centMatch) unitPrice = parseInt(centMatch[1]) / 100;
          } else {
            const priceMatch = lowerMsg.match(/(?:r\$)?\s*(\d+[.,]?\d*)\s*(?:reais|real)?/i);
            if (priceMatch) {
              const pVal = parseFloat(priceMatch[1].replace(',', '.'));
              if (!isNaN(pVal) && pVal > 0 && pVal !== qty) unitPrice = pVal;
            }
          }

          let cleanName = messageText
            .replace(/\b(descarte|descartar|perdi|perda|vencido|venceu|estragou|estragado|jogou fora|sobra|sobras|cadastre|cadastrar|registre|registrar)\b/gi, '')
            .replace(/\b(\d+)\s*(?:unidades?|kg|litros?|pcts?|pacotes?|caixas?|g|gramas?|un)?\b/gi, '')
            .replace(/\b(?:de|o|a|os|as|cada|um|uma|custando|por|reais|centavos|r\$)\b/gi, '')
            .replace(/[\d.,]+\s*centavos?/gi, '')
            .replace(/[\d.,]+/g, '')
            .trim();
          if (cleanName.length < 2) cleanName = 'Produto Descartado';

          // Try matching price with existing product in stock
          const matchExisting = products.find(p => p.nome.toLowerCase().includes(cleanName.toLowerCase()));
          if (matchExisting) {
            unitPrice = matchExisting.valorKg || (matchExisting.valorTotal ? matchExisting.valorTotal / matchExisting.quantidade : unitPrice);
            cleanName = matchExisting.nome;
          }

          extractedActions.push({
            type: 'discard',
            data: {
              nome: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
              quantidade: qty,
              dataValidade: formatDateToISO(new Date()),
              categoria: matchExisting?.categoria || 'Geral',
              valorKg: unitPrice,
              valorTotal: qty * unitPrice,
              motivo: 'Descarte'
            }
          });
        }
        // Check 2: Divergence / Stock Count
        else if (/\b(diverg[eê]ncia|diferen[cç]a no estoque|contagem f[íi]sica|confer[eê]ncia|invent[áa]rio)\b/i.test(lowerMsg)) {
          let physicalQty = 0;
          let expectedQty = 0;

          const numMatches = messageText.match(/\d+/g);
          if (numMatches && numMatches.length >= 2) {
            physicalQty = parseInt(numMatches[0]) || 0;
            expectedQty = parseInt(numMatches[1]) || 0;
          } else if (numMatches && numMatches.length === 1) {
            physicalQty = parseInt(numMatches[0]) || 0;
            expectedQty = physicalQty + 5;
          }

          let cleanName = messageText
            .replace(/\b(divergência|divergencia|diferença|estoque|contagem|física|conferência|conferencia|inventário|inventario|cadastre|registre)\b/gi, '')
            .replace(/\b(\d+)\s*(?:unidades?|kg|litros?|pcts?|pacotes?|caixas?|g|gramas?|un)?\b/gi, '')
            .replace(/\b(?:de|o|a|os|as|na|no|em|com|para)\b/gi, '')
            .trim();
          if (cleanName.length < 2) cleanName = 'Item de Estoque';

          const matchExisting = products.find(p => p.nome.toLowerCase().includes(cleanName.toLowerCase()));

          extractedActions.push({
            type: 'divergence',
            data: {
              productName: matchExisting ? matchExisting.nome : cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
              expectedQuantity: expectedQty || 20,
              physicalQuantity: physicalQty || 15,
              unit: 'kg',
              unitCost: matchExisting?.valorKg || 5.0,
              notes: 'Conferência física registrada via PadeIA'
            }
          });
        }
        // Check 3: Regular Product Registration
        else if (/\b(cadastr|registr|adicione|coloque|novo produto|entrou|produzi|fiz|comprei)\b/i.test(lowerMsg)) {
          let qty = 1;
          const qtyMatch = messageText.match(/(\d+)\s*(?:unidades?|kg|litros?|pcts?|pacotes?|caixas?|g|gramas?|un)?/i);
          if (qtyMatch && qtyMatch[1]) qty = parseInt(qtyMatch[1]) || 1;

          let unitPrice = 1.0;
          if (lowerMsg.includes('centavo')) {
            const centMatch = lowerMsg.match(/(\d+)\s*centavos?/);
            if (centMatch) unitPrice = parseInt(centMatch[1]) / 100;
          } else {
            const priceMatch = lowerMsg.match(/(?:r\$)?\s*(\d+[.,]?\d*)\s*(?:reais|real)?/i);
            if (priceMatch) {
              const pVal = parseFloat(priceMatch[1].replace(',', '.'));
              if (!isNaN(pVal) && pVal > 0 && pVal !== qty) unitPrice = pVal;
            }
          }

          let cleanName = messageText
            .replace(/\b(cadastre|cadastrar|registre|registrar|adicione|adicionar|coloque|colocar|novo produto|entrou|produzi|fiz|comprei)\b/gi, '')
            .replace(/\b(\d+)\s*(?:unidades?|kg|litros?|pcts?|pacotes?|caixas?|g|gramas?|un)?\b/gi, '')
            .replace(/\b(?:de|o|a|os|as|cada|um|uma|custando|por|reais|centavos|r\$)\b/gi, '')
            .replace(/[\d.,]+\s*centavos?/gi, '')
            .replace(/[\d.,]+/g, '')
            .trim();
          if (cleanName.length < 2) cleanName = 'Produto Geral';

          const target = new Date();
          target.setDate(target.getDate() + 2);
          extractedActions.push({
            type: 'product',
            data: {
              nome: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
              quantidade: qty,
              dataValidade: formatDateToISO(target),
              categoria: 'Geral',
              valorKg: unitPrice,
              valorTotal: qty * unitPrice
            }
          });
        }
      }

      const registeredItems: RegisteredActionItem[] = [];

      if (extractedActions.length > 0 && company?.codigoAtivacao) {
        for (const act of extractedActions) {
          try {
            if (act.type === 'discard') {
              const d = act.data;
              const prodName = (d.nome || d.productName || 'Produto Descartado').trim();
              const qty = Math.max(1, Number(d.quantidade) || 1);
              const unitPrice = Number(d.valorKg) || Number(d.precoUnitario) || Number(d.unitCost) || 0;
              const lotValue = Number(d.valorTotal) || (qty * unitPrice);
              const todayStr = formatDateToISO(new Date());

              // Add discarded product with status 'vencido' and past/today date so it feeds losses & expired items
              const addedWasteProd = await StorageService.addProduct(
                company.codigoAtivacao,
                prodName,
                qty,
                todayStr,
                d.categoria || 'Geral',
                d.barcode || '',
                unitPrice,
                todayStr,
                lotValue,
                d.motivo || 'Descarte',
                'Descarte/Vencido registrado via PadeIA',
                undefined,
                'vencido'
              );

              // Also record Inventory Movement of type WASTE
              await StorageService.addInventoryMovement(
                addedWasteProd.id,
                prodName,
                company.codigoAtivacao,
                'WASTE',
                qty,
                'un',
                unitPrice,
                d.motivo || 'Descarte via PadeIA'
              ).catch((e) => console.warn('Movement waste record non-blocking error:', e));

              // If product exists in active stock, reconcile it
              const activeExisting = products.find(p => p.nome.toLowerCase() === prodName.toLowerCase() && p.status !== 'vencido');
              if (activeExisting) {
                const newQty = Math.max(0, activeExisting.quantidade - qty);
                if (newQty > 0) {
                  await StorageService.updateProduct(
                    activeExisting.id,
                    activeExisting.nome,
                    newQty,
                    activeExisting.dataValidade,
                    activeExisting.categoria,
                    activeExisting.barcode,
                    activeExisting.valorKg,
                    activeExisting.dataFabricacao,
                    activeExisting.valorKg ? newQty * activeExisting.valorKg : undefined,
                    activeExisting.motivo,
                    activeExisting.notas,
                    activeExisting.peso
                  );
                }
              }

              window.dispatchEvent(new CustomEvent('padaria-data-changed', { detail: { key: 'products' } }));

              registeredItems.push({
                type: 'descarte',
                nome: prodName,
                quantidade: qty,
                valorKg: unitPrice,
                valorTotal: lotValue,
                dataValidade: todayStr,
                motivo: d.motivo || 'Descarte'
              });
              console.log(`✅ [PadeIA] Descarte registrado: ${prodName} (Qtd: ${qty}, Perda: R$ ${lotValue})`);
            } else if (act.type === 'divergence') {
              const div = act.data;
              const prodName = (div.productName || div.nome || 'Item de Estoque').trim();
              const expected = Number(div.expectedQuantity) || 0;
              const physical = Number(div.physicalQuantity) || 0;
              const unit = div.unit || 'kg';
              const unitCost = Number(div.unitCost) || Number(div.valorKg) || 0;
              const matchingProd = products.find(p => p.nome.toLowerCase().includes(prodName.toLowerCase()));
              const prodId = matchingProd ? matchingProd.id : 'div_' + Date.now();

              await StorageService.addStockCount(
                company.codigoAtivacao,
                prodId,
                prodName,
                expected,
                0,
                0,
                0,
                expected,
                physical,
                unit,
                unitCost,
                div.notes || 'Registrado via PadeIA'
              );

              registeredItems.push({
                type: 'divergencia',
                nome: prodName,
                quantidade: physical,
                expectedQuantity: expected,
                physicalQuantity: physical,
                varianceQuantity: physical - expected,
                unit,
                valorKg: unitCost
              });
              console.log(`✅ [PadeIA] Divergência registrada: ${prodName} (Físico: ${physical}, Esperado: ${expected})`);
            } else {
              // Regular Product Registration
              const p = act.data;
              const prodName = (p.nome || p.productName || 'Produto Geral').trim();
              const qty = Math.max(1, Number(p.quantidade) || 1);
              const unitPrice = Number(p.valorKg) || Number(p.precoUnitario) || 0;
              const lotValue = Number(p.valorTotal) || (qty * unitPrice);

              let validDate = p.dataValidade || '';
              if (!validDate || !/^\d{4}-\d{2}-\d{2}$/.test(validDate)) {
                const target = new Date();
                target.setDate(target.getDate() + 2);
                validDate = formatDateToISO(target);
              }

              await StorageService.addProduct(
                company.codigoAtivacao,
                prodName,
                qty,
                validDate,
                p.categoria || 'Geral',
                p.barcode || '',
                unitPrice,
                p.dataFabricacao || formatDateToISO(new Date()),
                lotValue,
                'Cadastro via PadeIA'
              );

              registeredItems.push({
                type: 'produto',
                nome: prodName,
                quantidade: qty,
                valorKg: unitPrice,
                valorTotal: lotValue,
                dataValidade: validDate
              });
              console.log(`✅ [PadeIA] Produto cadastrado: ${prodName} (Qtd: ${qty}, Lote: R$ ${lotValue})`);
            }
          } catch (actionErr) {
            console.error('Erro ao executar ação PadeIA no StorageService:', actionErr);
          }
        }
      }

      const modelReply: ChatMessage = {
        id: 'model_' + Date.now(),
        role: 'model',
        text: rawReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        registeredProducts: registeredItems.length > 0 ? registeredItems : undefined
      };

      setMessages((prev) => [...prev, modelReply]);
    } catch (err: any) {
      console.error('Erro na PadeIA:', err);
      const errorMsg: ChatMessage = {
        id: 'error_' + Date.now(),
        role: 'model',
        text: `⚠️ **Ocorreu um erro temporário de comunicação.**\n\n${err.message || 'Por favor, tente novamente em alguns instantes.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Pricing calculator helper logic
  const parseNum = (val: string) => parseFloat(val.replace(',', '.')) || 0;
  const numCost = parseNum(costPrice);
  const numMargin = parseNum(desiredMargin);
  const numDays = parseNum(daysToExpire);

  const normalSellPrice = numCost * (1 + numMargin / 100);
  
  // Recommended discount based on days to expire
  let recDiscountPercent = 20;
  if (numDays <= 0) recDiscountPercent = 60;
  else if (numDays === 1) recDiscountPercent = 50;
  else if (numDays === 2) recDiscountPercent = 35;
  else if (numDays === 3) recDiscountPercent = 25;

  const promoPrice = normalSellPrice * (1 - recDiscountPercent / 100);
  const profitPerUnit = promoPrice - numCost;
  const isBelowCost = promoPrice < numCost;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] sm:h-[750px] min-h-[500px] w-full max-w-full box-border">
      {/* MOBILE APP HEADER */}
      <div className="sm:hidden bg-[#111111] text-white p-3.5 flex items-center justify-between border-b border-gray-800 shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          {onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0 active:scale-95 transition-transform"
              title="Voltar ao Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
              <h2 className="text-base font-black text-white tracking-tight truncate">PadeIA™</h2>
            </div>
            <p className="text-[11px] text-gray-300 truncate font-medium">Gerente inteligente da sua panificação</p>
          </div>
        </div>

        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="px-3 py-1.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black flex items-center space-x-1.5 shrink-0 shadow-sm cursor-pointer"
            title="Escanear Etiqueta do Produto"
          >
            <Camera className="w-4 h-4" />
            <span>Foto</span>
          </button>
        )}
      </div>

      {/* DESKTOP BRANDING HEADER */}
      <div className="hidden sm:flex bg-gradient-to-r from-[#111111] via-[#1F2937] to-[#2C2C2C] text-white p-6 md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-800 w-full max-w-full overflow-hidden box-border">
        <div className="flex items-center space-x-3.5">
          <div className="relative shrink-0">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-[#E8571A] flex items-center justify-center text-white shadow-lg shadow-orange-500/20 ring-2 ring-white/20">
              <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 animate-pulse text-amber-200" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-[#111111] rounded-full" title="PadeIA™ Online"></span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white truncate">PadeIA™</h2>
              <span className="bg-orange-500/20 text-[#FF6B00] border border-orange-500/30 text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider shrink-0">
                IA Oficial Padariaio
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-300 font-medium mt-0.5 truncate">
              Sua gerente inteligente especializada em panificação
            </p>
          </div>
        </div>

        {/* TOP NAVIGATION TABS */}
        <div className="flex items-center bg-black/40 p-1 sm:p-1.5 rounded-xl border border-white/10 gap-1 overflow-x-auto no-scrollbar w-full max-w-full">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-[#FF6B00] text-white shadow-md font-extrabold'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Inteligente</span>
          </button>

          <button
            onClick={() => setActiveTab('resumo')}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'resumo'
                ? 'bg-[#FF6B00] text-white shadow-md font-extrabold'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Indicadores & Resumo</span>
          </button>

          <button
            onClick={() => setActiveTab('precificacao')}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === 'precificacao'
                ? 'bg-[#FF6B00] text-white shadow-md font-extrabold'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Precificação IA</span>
          </button>

          <button
            onClick={() => setActiveTab('alertas')}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer relative ${
              activeTab === 'alertas'
                ? 'bg-[#FF6B00] text-white shadow-md font-extrabold'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            <span>Alertas ({expiringProducts.length + expiredProducts.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CHAT INTELIGENTE */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col justify-between bg-gray-50/50 w-full max-w-full min-h-0 overflow-hidden">
          {/* Quick Questions & Voice Action Chips */}
          <div className="p-2.5 sm:p-3 bg-white border-b border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar w-full max-w-full">
            {/* PROMINENT VOICE BUTTON */}
            <button
              onClick={voiceStatus === 'listening' ? handleStopVoice : handleStartVoice}
              disabled={isLoading || voiceStatus === 'processing'}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm flex items-center space-x-1.5 ${
                voiceStatus === 'listening'
                  ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white'
              }`}
              title="Converse com a PadeIA por comando de voz"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-200" />
              <span>🎙️ Falar com PadeIA</span>
            </button>

            <span className="text-gray-300 shrink-0">|</span>

            <span className="text-[11px] font-extrabold uppercase text-gray-400 shrink-0 flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Pergunte:</span>
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-orange-50 hover:text-[#E8571A] hover:border-orange-200 border border-gray-200 text-xs text-gray-700 font-semibold transition-all shrink-0 cursor-pointer shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div 
            className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-3.5 sm:space-y-4 min-h-0 w-full max-w-full box-border overscroll-y-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3 max-w-[95%] sm:max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-[#1F2937] text-white'
                      : 'bg-gradient-to-tr from-[#FF6B00] to-[#E8571A] text-white'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-200" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-3 sm:p-4 text-xs sm:text-sm space-y-2 shadow-xs break-words [overflow-wrap:anywhere] max-w-full overflow-hidden ${
                    msg.role === 'user'
                      ? 'bg-[#1F2937] text-white rounded-tr-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b pb-1.5 mb-1.5 border-current/10">
                    <span className="font-extrabold text-[11px] opacity-80">
                      {msg.role === 'user' ? 'Você' : 'PadeIA™'}
                    </span>
                    <span className="text-[10px] opacity-60 font-mono">{msg.timestamp}</span>
                  </div>

                  <div className="markdown-body leading-relaxed space-y-1 overflow-x-auto max-w-full break-words [overflow-wrap:anywhere]">
                    <Markdown>{cleanDisplayText(msg.text)}</Markdown>
                  </div>

                  {msg.registeredProducts && msg.registeredProducts.length > 0 && (
                    <div className="mt-3 space-y-2 text-xs">
                      {msg.registeredProducts.map((p, idx) => {
                        if (p.type === 'descarte') {
                          return (
                            <div key={idx} className="p-3 bg-red-50 border border-red-300 rounded-xl space-y-1.5 text-red-950 shadow-xs">
                              <div className="flex items-center space-x-1.5 font-black text-red-800 border-b border-red-200 pb-1">
                                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                <span>Descarte / Vencido Registrado no Sistema</span>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-red-200 flex flex-col space-y-1 shadow-2xs">
                                <div className="flex justify-between items-center font-bold text-gray-900">
                                  <span className="text-sm text-red-900">{p.nome}</span>
                                  <span className="text-red-700 font-black bg-red-100 px-2 py-0.5 rounded-md text-[11px]">
                                    Perda: R$ {(p.valorTotal || 0).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] text-gray-600 pt-0.5">
                                  <span>Qtd Descartada: <strong>{p.quantidade} un</strong></span>
                                  <span>Data: <strong>{formatDateToBR(p.dataValidade)}</strong></span>
                                </div>
                                <div className="text-[10px] text-red-700 font-semibold pt-0.5 flex items-center space-x-1">
                                  <span>✓ Contabilizado nas perdas e no Resumo do Dono</span>
                                </div>
                              </div>
                            </div>
                          );
                        } else if (p.type === 'divergencia') {
                          return (
                            <div key={idx} className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 text-amber-950 shadow-xs">
                              <div className="flex items-center space-x-1.5 font-black text-amber-800 border-b border-amber-200 pb-1">
                                <Scale className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Divergência de Estoque Registrada</span>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-amber-200 flex flex-col space-y-1 shadow-2xs">
                                <div className="flex justify-between items-center font-bold text-gray-900">
                                  <span className="text-sm text-amber-950">{p.nome}</span>
                                  <span className={`font-black px-2 py-0.5 rounded-md text-[11px] ${(p.varianceQuantity || 0) < 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    Diferença: {(p.varianceQuantity || 0) > 0 ? `+${p.varianceQuantity}` : p.varianceQuantity} {p.unit || 'kg'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] text-gray-600 pt-0.5">
                                  <span>Físico: <strong>{p.physicalQuantity} {p.unit || 'kg'}</strong></span>
                                  <span>Esperado: <strong>{p.expectedQuantity} {p.unit || 'kg'}</strong></span>
                                </div>
                                <div className="text-[10px] text-amber-800 font-semibold pt-0.5 flex items-center space-x-1">
                                  <span>✓ Atualizado no módulo de Divergências e Estoque</span>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={idx} className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1.5 text-emerald-950 shadow-xs">
                            <div className="flex items-center space-x-1.5 font-black text-emerald-800 border-b border-emerald-200 pb-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Produto Cadastrado com Sucesso no Sistema</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex flex-col space-y-1 shadow-2xs">
                              <div className="flex justify-between items-center font-bold text-gray-900">
                                <span className="text-sm">{p.nome}</span>
                                <span className="text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                                  Lote Total: R$ {(p.valorTotal || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[11px] text-gray-600 pt-0.5">
                                <span>Qtd: <strong>{p.quantidade} un</strong> × R$ {(p.valorKg || 0).toFixed(2)}/un</span>
                                <span>Validade: <strong>{formatDateToBR(p.dataValidade)}</strong></span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 sm:gap-3 max-w-[85%] mr-auto items-center animate-fade-in">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-[#E8571A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-spin" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 text-xs text-gray-600 flex items-center space-x-2 shadow-xs">
                  <span className="font-bold text-[#E8571A]">PadeIA™</span>
                  <span>analisando o estoque...</span>
                  <span className="flex space-x-1 ml-1.5">
                    <span className="w-1.5 h-1.5 bg-[#E8571A] rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-[#E8571A] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#E8571A] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Bar & Voice Command Panel */}
          <div className="p-2.5 sm:p-4 bg-white border-t border-gray-200 w-full max-w-full box-border">
            {/* VOICE STATUS CARD OVERLAY */}
            {voiceStatus !== 'idle' && (
              <div
                className={`mb-3 p-3 sm:p-3.5 rounded-2xl border transition-all shadow-md flex flex-col space-y-2.5 w-full max-w-full overflow-hidden box-border ${
                  voiceStatus === 'listening'
                    ? 'border-red-300 bg-red-50/80'
                    : voiceStatus === 'processing'
                    ? 'border-amber-300 bg-amber-50/80'
                    : voiceStatus === 'ready'
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-red-400 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {voiceStatus === 'listening' && (
                      <>
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                        </span>
                        <span className="font-extrabold text-xs text-red-700 uppercase tracking-wider">
                          Ouvindo...
                        </span>
                      </>
                    )}

                    {voiceStatus === 'processing' && (
                      <>
                        <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                        <span className="font-extrabold text-xs text-amber-700 uppercase tracking-wider">
                          Processando...
                        </span>
                      </>
                    )}

                    {voiceStatus === 'ready' && (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-extrabold text-xs text-emerald-700 uppercase tracking-wider">
                          Resposta Pronta / Prévia
                        </span>
                      </>
                    )}

                    {voiceStatus === 'error' && (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="font-extrabold text-xs text-red-700 uppercase tracking-wider">
                          Aviso
                        </span>
                      </>
                    )}
                  </div>

                  {voiceStatus === 'listening' && (
                    <button
                      type="button"
                      onClick={handleStopVoice}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer shrink-0"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Concluir fala</span>
                    </button>
                  )}

                  {voiceStatus === 'error' && (
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleStartVoice}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Tentar novamente
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelVoice}
                        className="text-xs text-gray-500 hover:text-gray-700 font-bold"
                      >
                        Fechar
                      </button>
                    </div>
                  )}
                </div>

                {/* Content Body */}
                {voiceStatus === 'error' ? (
                  <p className="text-xs text-red-800 font-medium bg-white/80 p-2.5 rounded-xl border border-red-200">
                    {voiceError}
                  </p>
                ) : (
                  <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-800 font-medium flex flex-col space-y-1 shadow-xs">
                    <span className="text-[10px] uppercase font-extrabold text-gray-400">
                      {voiceStatus === 'listening' ? 'Fale seu comando:' : 'Texto reconhecido:'}
                    </span>
                    <p className="text-xs text-gray-900 font-semibold italic">
                      "{voiceTranscript || inputMessage || 'Aguardando sua fala...'}"
                    </p>
                  </div>
                )}

                {/* Ready / Confirmation Action Bar */}
                {voiceStatus === 'ready' && (
                  <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCancelVoice}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleStartVoice}
                      className="px-3 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-800 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Falar Novamente</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmVoiceSend}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>🚀 Enviar</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5 sm:gap-2 w-full max-w-full"
            >
              {onOpenScanner && (
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="p-2.5 sm:p-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#E8571A] border border-orange-200 font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer min-w-[40px] min-h-[40px]"
                  title="Fotografar etiqueta do produto"
                >
                  <Camera className="w-4 h-4 text-[#E8571A]" />
                </button>
              )}

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pergunte à PadeIA..."
                disabled={isLoading || voiceStatus === 'listening'}
                className="flex-1 min-w-0 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] text-gray-800 bg-gray-50 focus:bg-white font-medium box-border"
              />

              {/* MICROPHONE VOICE BUTTON */}
              <button
                type="button"
                onClick={voiceStatus === 'listening' ? handleStopVoice : handleStartVoice}
                disabled={isLoading || voiceStatus === 'processing'}
                className={`p-2.5 sm:px-3.5 sm:py-3 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center space-x-1 cursor-pointer shrink-0 min-w-[40px] min-h-[40px] ${
                  voiceStatus === 'listening'
                    ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-300'
                    : voiceStatus === 'processing'
                    ? 'bg-amber-500 text-white cursor-wait'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                title="Comando por Voz (Microfone)"
              >
                {voiceStatus === 'listening' ? (
                  <>
                    <Square className="w-4 h-4 fill-current text-white" />
                    <span className="hidden sm:inline">Parar</span>
                  </>
                ) : voiceStatus === 'processing' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span className="hidden sm:inline">Processando...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-white" />
                    <span className="hidden sm:inline font-extrabold">🎙️ Falar</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim() || voiceStatus === 'listening'}
                className="px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E8571A] hover:from-[#e05e00] hover:to-[#d44e15] text-white font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center space-x-1 disabled:opacity-50 cursor-pointer shrink-0 min-w-[40px] min-h-[40px]"
              >
                <span>Enviar</span>
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </button>
            </form>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-gray-400 mt-2 px-1 gap-1 leading-normal w-full max-w-full">
              <span className="break-words">PadeIA™ v2.5 • Inteligência nativa de panificação do Padariaio</span>
              {messages.length > 2 && (
                <button
                  type="button"
                  onClick={() =>
                    setMessages([
                      {
                        id: 'reset',
                        role: 'model',
                        text: 'Histórico de conversa limpo! Como posso te ajudar agora?',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ])
                  }
                  className="text-gray-400 hover:text-red-600 transition-colors flex items-center space-x-1 shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar conversa</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESUMO & INDICADORES (KPI DASHBOARD) */}
      {activeTab === 'resumo' && (
        <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto min-h-0">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#1F2937] flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-[#FF6B00]" />
                <span>Indicadores de Desperdício e Recuperação</span>
              </h3>
              <p className="text-xs text-gray-500">
                Visão consolidada do gerenciador PadeIA™ para tomada de decisão
              </p>
            </div>
          </div>

          {/* 4 Cards Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-red-50/60 border border-red-200 rounded-2xl">
              <span className="text-[10px] font-extrabold text-red-700 uppercase tracking-wider block">
                Prejuízo em Vencidos
              </span>
              <div className="text-xl sm:text-2xl font-black text-red-800 mt-1">
                R$ {expiredValue.toFixed(2)}
              </div>
              <span className="text-[10px] text-red-600 font-bold block mt-1">
                {expiredProducts.length} itens vencidos
              </span>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
              <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">
                Valor em Risco (3 dias)
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-800 mt-1">
                R$ {expiringValue.toFixed(2)}
              </div>
              <span className="text-[10px] text-amber-700 font-bold block mt-1">
                {expiringProducts.length} itens a vencer
              </span>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                Itens Ativos no Monitoramento
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-800 mt-1">
                {products.length} un
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                Cadastrados no sistema
              </span>
            </div>

            <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl">
              <span className="text-[10px] font-extrabold text-orange-700 uppercase tracking-wider block">
                Maior Categoria de Perda
              </span>
              <div className="text-base sm:text-lg font-black text-orange-800 mt-1 truncate">
                {topCategory[0]}
              </div>
              <span className="text-[10px] text-orange-700 font-bold block mt-1">
                R$ {(topCategory[1] as number).toFixed(2)} acumulados
              </span>
            </div>
          </div>

          {/* Strategic Insights Cards from PadeIA */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Recomendações Estratégicas da PadeIA™</span>
            </h4>

            <div className="grid md:grid-cols-2 gap-3">
              {/* Insight 1 */}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50/30 border border-orange-200 rounded-2xl flex items-start space-x-3">
                <div className="p-2 bg-[#FF6B00] text-white rounded-xl font-bold shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-[#1F2937]">Controle Preventivo de Validades</h5>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Você possui <strong>{expiringProducts.length} produtos</strong> que vencem em até 3 dias. Acompanhe o lote para planejar a readequação de estoque e zerar os descartes!
                  </p>
                  <button
                    onClick={() => setActiveTab('alertas')}
                    className="mt-2 text-xs font-bold text-[#FF6B00] hover:underline inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Ver produtos em risco</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Insight 2 */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/30 border border-blue-200 rounded-2xl flex items-start space-x-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl font-bold shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-[#1F2937]">Ajuste de Produção (PVPS)</h5>
                  <p className="text-xs text-gray-600 mt-0.5">
                    A categoria <strong>{topCategory[0]}</strong> representa a maior fonte de perdas da sua padaria. Recomendamos aplicar a regra PVPS no balcão e reavaliar a quantidade de matéria-prima das próximas fornadas.
                  </p>
                  <button
                    onClick={() => handleSendMessage(`PadeIA, como reduzir a perda na categoria ${topCategory[0]}?`)}
                    className="mt-2 text-xs font-bold text-blue-600 hover:underline inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Perguntar estratégia à PadeIA</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRECIFICAÇÃO INTELIGENTE */}
      {activeTab === 'precificacao' && (
        <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto min-h-0">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base sm:text-lg font-black text-[#1F2937] flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-[#FF6B00]" />
              <span>Calculadora de Precificação para Produtos Próximos ao Vencimento</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Cálculo seguro que evita vender abaixo do custo e maximiza a recuperação de caixa no balcão
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Input Parameters Form */}
            <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-200">
              <h4 className="text-xs font-extrabold uppercase text-gray-600 tracking-wider">
                1. Parâmetros do Produto
              </h4>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Preço de Custo Unitário (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-gray-300 text-gray-800 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Margem de Lucro Desejada em Venda Normal (%)
                </label>
                <input
                  type="number"
                  value={desiredMargin}
                  onChange={(e) => setDesiredMargin(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-gray-300 text-gray-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Dias Restantes para o Vencimento
                </label>
                <select
                  value={daysToExpire}
                  onChange={(e) => setDaysToExpire(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-gray-300 text-gray-800 bg-white"
                >
                  <option value="0">Vence Hoje (Urgência Máxima)</option>
                  <option value="1">Vence Amanhã (1 dia)</option>
                  <option value="2">Vence em 2 dias</option>
                  <option value="3">Vence em 3 dias</option>
                  <option value="5">Vence em 5 dias ou mais</option>
                </select>
              </div>
            </div>

            {/* Calculated Results Box */}
            <div className="space-y-4 bg-gradient-to-br from-[#1F2937] to-[#111111] text-white p-5 rounded-2xl shadow-md border border-gray-800 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF6B00] flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recomendação PadeIA™</span>
                  </span>
                  <span className="text-[10px] bg-orange-500/20 text-[#FF6B00] font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
                    Desconto de {recDiscountPercent}% Sugerido
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Preço Normal</span>
                    <span className="text-base font-black text-gray-200">R$ {normalSellPrice.toFixed(2)}</span>
                  </div>

                  <div className="bg-[#FF6B00]/20 p-3 rounded-xl border border-[#FF6B00]/40">
                    <span className="text-[10px] text-[#FF6B00] font-bold uppercase block">Preço Promocional VIP</span>
                    <span className="text-xl font-black text-white">R$ {promoPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                  <span className="text-gray-300">Resultado por unidade vendida:</span>
                  <span className={`font-black ${profitPerUnit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {profitPerUnit >= 0 ? `+ R$ ${profitPerUnit.toFixed(2)} (Lucro)` : `- R$ ${Math.abs(profitPerUnit).toFixed(2)} (Abaixo do Custo)`}
                  </span>
                </div>

                {isBelowCost && (
                  <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Atenção: Este desconto coloca o valor promocional abaixo do custo de fabricação.</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    handleSendMessage(`PadeIA, me explique detalhadamente a estratégia para precificar um produto com custo de R$ ${numCost.toFixed(2)} que vence em ${numDays} dias.`);
                    setActiveTab('chat');
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Pedir Análise Completa no Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ALERTAS INTELIGENTES */}
      {activeTab === 'alertas' && (
        <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto min-h-0">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#1F2937] flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Alertas Inteligentes de Validade e Estoque</span>
              </h3>
              <p className="text-xs text-gray-500">
                Itens identificados automaticamente pela PadeIA™ que exigem ação preventiva imediata
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {expiringProducts.length === 0 && expiredProducts.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-emerald-800 text-base">Tudo sob controle!</h4>
                <p className="text-xs text-emerald-700">
                  A PadeIA™ não identificou nenhum produto vencido ou vencendo nos próximos 3 dias no seu estoque. Parabéns pela gestão!
                </p>
              </div>
            ) : (
              <>
                {/* Expiring Products Alert Group */}
                {expiringProducts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>{expiringProducts.length} Produtos Vencendo nos Próximos 3 Dias</span>
                    </h4>

                    <div className="grid gap-2">
                      {expiringProducts.map((p) => (
                        <div
                          key={p.id}
                          className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-black text-[#1F2937] text-sm block">{p.nome}</span>
                            <div className="flex items-center space-x-2 text-gray-600 text-[11px] mt-0.5">
                              <span>Qtd: <strong>{p.quantidade} un</strong></span>
                              <span>•</span>
                              <span>Validade: <strong>{p.dataValidade}</strong></span>
                              <span>•</span>
                              <span className="text-amber-800 font-bold">Vence em {p.diasParaVencer} dias</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expired Products Alert Group */}
                {expiredProducts.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-extrabold text-red-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>{expiredProducts.length} Produtos Vencidos (Dar Baixa de Descarte)</span>
                    </h4>

                    <div className="grid gap-2">
                      {expiredProducts.map((p) => (
                        <div
                          key={p.id}
                          className="p-3.5 bg-red-50/60 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-black text-red-900 text-sm block">{p.nome}</span>
                            <div className="flex items-center space-x-2 text-red-700 text-[11px] mt-0.5">
                              <span>Qtd: <strong>{p.quantidade} un</strong></span>
                              <span>•</span>
                              <span>Venceu em: <strong>{p.dataValidade}</strong></span>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2.5 py-1 rounded-full uppercase">
                            Vencido
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
