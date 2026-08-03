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
  Edit3
} from 'lucide-react';
import Markdown from 'react-markdown';
import { BakeryCompany, Product, SaleHistoryItem, VipOffer } from '../types';

interface PadeIAProps {
  company: BakeryCompany;
  products: Product[];
  salesHistory: SaleHistoryItem[];
  vipOffers: VipOffer[];
  onOpenVipOfferModal?: (product: Product) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const PadeIA: React.FC<PadeIAProps> = ({
  company,
  products,
  salesHistory,
  vipOffers,
  onOpenVipOfferModal
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'resumo' | 'precificacao' | 'alertas'>('chat');
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: `Olá! Eu sou a **PadeIA™**, sua gerente inteligente especializada em panificação. 🥖✨

Estou conectada ao estoque e histórico de **${company.empresa}** em tempo real. Como posso te ajudar a reduzir perdas e lucrar mais hoje?`,
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

  // Cleanup audio stream on unmount
  useEffect(() => {
    return () => {
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

  // Start Voice Recording
  const handleStartVoice = async () => {
    setVoiceError('');
    setVoiceTranscript('');
    speechCapturedTextRef.current = '';
    audioChunksRef.current = [];
    isListeningRef.current = true;

    try {
      // Request microphone permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      setVoiceStatus('listening');

      // Initialize MediaRecorder as continuous background audio capture backup
      try {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.start(250); // Record in 250ms chunks
      } catch (recorderErr) {
        console.warn('[PadeIA Voice] Erro ao iniciar MediaRecorder:', recorderErr);
      }

      // Initialize Web Speech API if available in browser
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.lang = 'pt-BR';
          recognition.interimResults = true;
          recognition.continuous = true; // Crucial for non-ending speech recognition in Chrome

          recognition.onstart = () => {
            console.log('[PadeIA Voice] SpeechRecognition iniciado com sucesso');
          };

          recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = 0; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }

            const currentText = (finalTranscript || interimTranscript).trim();
            if (currentText) {
              speechCapturedTextRef.current = currentText;
              setVoiceTranscript(currentText);
              setInputMessage(currentText); // Updates input field live as user speaks!
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('[PadeIA Voice] SpeechRecognition error:', event.error);
            if (event.error === 'not-allowed' || event.error === 'permission-denied') {
              isListeningRef.current = false;
              stopVoiceRecording();
              setVoiceStatus('error');
              setVoiceError('Permissão do microfone negada no navegador. Clique no ícone de cadeado na barra de endereço para permitir o microfone.');
            }
          };

          recognition.onend = () => {
            console.log('[PadeIA Voice] SpeechRecognition onend');
            if (isListeningRef.current && recognitionRef.current) {
              try {
                recognition.start();
              } catch (_) {}
            }
          };

          recognition.start();
        } catch (recInitErr) {
          console.warn('[PadeIA Voice] Web Speech API não pôde ser iniciado:', recInitErr);
        }
      }
    } catch (err: any) {
      console.error('[PadeIA Voice] Erro de acesso ao microfone:', err);
      stopVoiceRecording();
      setVoiceStatus('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setVoiceError('Permissão do microfone negada. Por favor, permita o acesso ao microfone nas configurações do seu navegador.');
      } else {
        setVoiceError('Não foi possível conectar ao microfone. Verifique se o dispositivo está conectado.');
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

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
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
            const res = await fetch('/api/padeia/speech-to-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Audio,
                mimeType
              })
            });

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
    "📊 Qual foi meu prejuízo este mês?",
    "⏰ Quais produtos vencem nos próximos 3 dias?",
    "🌙 Como fazer o Fechamento Inteligente do dia?",
    "🏷️ Qual categoria mais gera desperdício?",
    "💰 Como reaproveitar sobras na produção de amanhã?",
    "📋 Gere um resumo executivo completo da padaria"
  ];

  // Calculations for KPI summaries
  const expiredProducts = products.filter((p) => p.status === 'vencido');
  const expiringProducts = products.filter((p) => p.status === 'vencendo');
  const normalProducts = products.filter((p) => p.status === 'normal');

  const expiredValue = expiredProducts.reduce(
    (acc, p) => acc + (p.valorTotal || p.quantidade * (p.valorKg || 12)),
    0
  );
  const expiringValue = expiringProducts.reduce(
    (acc, p) => acc + (p.valorTotal || p.quantidade * (p.valorKg || 12)),
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
    const val = p.valorTotal || p.quantidade * (p.valorKg || 12);
    categoryLossMap[cat] = (categoryLossMap[cat] || 0) + val;
  });
  const topCategory = Object.entries(categoryLossMap).sort((a, b) => b[1] - a[1])[0] || ['Pães e Massas', 0];

  // Send message to backend /api/padeia/chat
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputMessage.trim();
    if (!messageText || isLoading) return;

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

      const response = await fetch('/api/padeia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: historyPayload,
          contextData: {
            company,
            products,
            salesHistory,
            vipOffers
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao consultar a PadeIA™');
      }

      const modelReply: ChatMessage = {
        id: 'model_' + Date.now(),
        role: 'model',
        text: data.reply || 'Não consegui obter uma resposta no momento. Tente novamente.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[750px]">
      {/* BRANDING HEADER */}
      <div className="bg-gradient-to-r from-[#111111] via-[#1F2937] to-[#2C2C2C] text-white p-4 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-800">
        <div className="flex items-center space-x-3.5">
          <div className="relative">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-[#E8571A] flex items-center justify-center text-white shadow-lg shadow-orange-500/20 ring-2 ring-white/20">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse text-amber-200" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#111111] rounded-full" title="PadeIA™ Online"></span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">PadeIA™</h2>
              <span className="bg-orange-500/20 text-[#FF6B00] border border-orange-500/30 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                IA Oficial Padaria.io
              </span>
            </div>
            <p className="text-xs text-gray-300 font-medium mt-0.5">
              Sua gerente inteligente especializada em panificação
            </p>
          </div>
        </div>

        {/* TOP NAVIGATION TABS */}
        <div className="flex items-center bg-black/40 p-1.5 rounded-xl border border-white/10 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
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
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
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
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
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
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer relative ${
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
        <div className="flex-1 flex flex-col justify-between bg-gray-50/50">
          {/* Quick Questions & Voice Action Chips */}
          <div className="p-3 bg-white border-b border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* PROMINENT VOICE BUTTON */}
            <button
              onClick={voiceStatus === 'listening' ? handleStopVoice : handleStartVoice}
              disabled={isLoading || voiceStatus === 'processing'}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm flex items-center space-x-1.5 ${
                voiceStatus === 'listening'
                  ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white'
              }`}
              title="Converse com a PadeIA por comando de voz"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-200" />
              <span>🎙️ Falar com a PadeIA</span>
            </button>

            <span className="text-gray-300">|</span>

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
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[500px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-[#1F2937] text-white'
                      : 'bg-gradient-to-tr from-[#FF6B00] to-[#E8571A] text-white'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-4 text-xs sm:text-sm space-y-2 shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-[#1F2937] text-white rounded-tr-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 border-b pb-1.5 mb-1.5 border-current/10">
                    <span className="font-extrabold text-[11px] opacity-80">
                      {msg.role === 'user' ? 'Você' : 'PadeIA™'}
                    </span>
                    <span className="text-[10px] opacity-60 font-mono">{msg.timestamp}</span>
                  </div>

                  <div className="markdown-body leading-relaxed space-y-1">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Typing Indicator */}
            {isLoading && (
              <div className="flex gap-3 max-w-[85%] mr-auto items-center animate-fade-in">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-[#E8571A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4 text-amber-200 animate-spin" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 text-xs text-gray-600 flex items-center space-x-2 shadow-xs">
                  <span className="font-bold text-[#E8571A]">PadeIA™</span>
                  <span>está analisando os dados do estoque...</span>
                  <span className="flex space-x-1 ml-2">
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
          <div className="p-3 sm:p-4 bg-white border-t border-gray-200">
            {/* VOICE STATUS CARD OVERLAY */}
            {voiceStatus !== 'idle' && (
              <div
                className={`mb-3 p-3.5 rounded-2xl border transition-all shadow-md flex flex-col space-y-2.5 ${
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
                          Resposta Pronta / Prévia do Texto
                        </span>
                      </>
                    )}

                    {voiceStatus === 'error' && (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="font-extrabold text-xs text-red-700 uppercase tracking-wider">
                          Aviso de Microfone
                        </span>
                      </>
                    )}
                  </div>

                  {voiceStatus === 'listening' && (
                    <button
                      type="button"
                      onClick={handleStopVoice}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Concluir fala</span>
                    </button>
                  )}

                  {voiceStatus === 'error' && (
                    <div className="flex items-center space-x-2">
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
                  <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-800 font-medium flex flex-col space-y-1 shadow-xs">
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
                  <div className="flex items-center justify-end gap-2 pt-1">
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
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>🚀 Enviar para PadeIA</span>
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
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pergunte sobre perdas, validade, fechamento ou precificação..."
                disabled={isLoading || voiceStatus === 'listening'}
                className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] text-gray-800 bg-gray-50 focus:bg-white font-medium"
              />

              {/* MICROPHONE VOICE BUTTON */}
              <button
                type="button"
                onClick={voiceStatus === 'listening' ? handleStopVoice : handleStartVoice}
                disabled={isLoading || voiceStatus === 'processing'}
                className={`px-3.5 py-3 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 ${
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
                    <span className="hidden sm:inline font-extrabold">🎙️ Falar com a PadeIA</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim() || voiceStatus === 'listening'}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E8571A] hover:from-[#e05e00] hover:to-[#d44e15] text-white font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer shrink-0"
              >
                <span>Enviar</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2 px-1">
              <span>PadeIA™ v2.5 • Inteligência nativa de panificação do Padaria.io</span>
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
                  className="text-gray-400 hover:text-red-600 transition-colors flex items-center space-x-1"
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
        <div className="p-4 sm:p-6 space-y-6">
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
                  <h5 className="font-bold text-xs text-[#1F2937]">Fechamento Inteligente do Expediente</h5>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Você possui <strong>{expiringProducts.length} produtos</strong> que vencem em até 3 dias. Realize o Fechamento Inteligente ao final do expediente para converter sobras de balcão em torradas, pudins e farinha de rosca!
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
        <div className="p-4 sm:p-6 space-y-6">
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
        <div className="p-4 sm:p-6 space-y-4">
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
