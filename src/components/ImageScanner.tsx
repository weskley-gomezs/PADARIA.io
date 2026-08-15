import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Loader2, Upload, RefreshCw, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { calculateDaysRemaining, formatDateToBR } from '../utils/dateUtils';
import { authenticatedFetch } from '../services/authApiHelper';

interface ImageScannerProps {
  bakeryCode?: string;
  onScanResult: (result: {
    nome: string;
    quantidade?: number;
    dataFabricacao?: string;
    dataValidade?: string;
    peso?: number;
    valorKg?: number;
    valorTotal?: number;
    barcode?: string;
    categoria?: string;
    tipoProduto?: 'individual' | 'lote' | 'peso';
  }) => void;
  onClose: () => void;
}

interface ScanAnalysis {
  nome: string;
  dataFabricacao?: string;
  dataValidade?: string;
  peso?: number;
  valorKg?: number;
  valorTotal?: number;
  barcode?: string;
  daysRemaining?: number;
  isExpired: boolean;
}

export const ImageScanner: React.FC<ImageScannerProps> = ({ bakeryCode, onScanResult, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scanAnalysis, setScanAnalysis] = useState<ScanAnalysis | null>(null);

  // Interactive product registration wizard state
  const [tipoProduto, setTipoProduto] = useState<'individual' | 'lote' | 'peso'>('individual');
  const [qtdIndividual, setQtdIndividual] = useState<number>(1);
  const [qtdLote, setQtdLote] = useState<number>(10);
  const [precoUnitarioLote, setPrecoUnitarioLote] = useState<number>(5.0);
  const [pesoKg, setPesoKg] = useState<number>(1.0);
  const [precoKg, setPrecoKg] = useState<number>(25.0);

  const startCamera = async () => {
    setError('');
    try {
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: 'environment' } } 
        });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      setStream(mediaStream);
      setCameraAvailable(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Câmera indisponível:', err);
      setCameraAvailable(false);
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const processImageBase64 = async (imageBase64: string) => {
    setIsProcessing(true);
    setError('');
    setScanAnalysis(null);

    try {
      const response = await authenticatedFetch('/api/analyze-product-image', {
        method: 'POST',
        body: JSON.stringify({ imageBase64 }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        let errorMessage = 'Erro ao analisar imagem.';
        if (contentType.includes('application/json')) {
          try {
            const errData = await response.json();
            errorMessage = errData.details || errData.error || errorMessage;
          } catch (_) {}
        } else {
          const rawText = await response.text();
          console.error('[SCANNER] Non-JSON error response:', rawText);
        }
        throw new Error(errorMessage);
      }

      if (!contentType.includes('application/json')) {
        const rawText = await response.text();
        console.error('[SCANNER] Non-JSON success response:', rawText);
        throw new Error('O servidor retornou uma resposta inválida (HTML/Texto) em vez de JSON.');
      }

      const data = await response.json();

      const valDate = data.dataValidade || '';
      const daysRemaining = valDate ? calculateDaysRemaining(valDate) : undefined;
      const isExpired = daysRemaining !== undefined ? daysRemaining <= 0 : false;

      // Set defaults for interactive registration wizard based on extracted label data
      if (typeof data.peso === 'number' && data.peso > 0) {
        setTipoProduto('peso');
        setPesoKg(data.peso);
        if (typeof data.valorKg === 'number' && data.valorKg > 0) {
          setPrecoKg(data.valorKg);
        } else if (typeof data.valorTotal === 'number' && data.valorTotal > 0) {
          setPrecoKg(parseFloat((data.valorTotal / data.peso).toFixed(2)));
        }
      } else if (typeof data.valorKg === 'number' && data.valorKg > 0) {
        setTipoProduto('peso');
        setPrecoKg(data.valorKg);
        setPesoKg(1.0);
      } else {
        setTipoProduto('individual');
        setQtdIndividual(1);
        setQtdLote(10);
        if (typeof data.valorTotal === 'number' && data.valorTotal > 0) {
          setPrecoUnitarioLote(parseFloat((data.valorTotal / 10).toFixed(2)));
        } else {
          setPrecoUnitarioLote(5.0);
        }
      }

      setScanAnalysis({
        nome: data.nome || 'Produto Sem Nome',
        dataFabricacao: data.dataFabricacao || '',
        dataValidade: valDate,
        peso: typeof data.peso === 'number' ? data.peso : undefined,
        valorKg: typeof data.valorKg === 'number' ? data.valorKg : undefined,
        valorTotal: typeof data.valorTotal === 'number' ? data.valorTotal : undefined,
        barcode: data.barcode || '',
        daysRemaining,
        isExpired,
      });

    } catch (err: any) {
      console.error('Erro na análise de imagem:', err);
      setError(err.message || 'Falha ao analisar a imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmResult = () => {
    if (!scanAnalysis) return;

    if (!scanAnalysis.isExpired) {
      alert('⛔ PRODUTO COM VALIDADE FUTURA!\n\nEste sistema é EXCLUSIVO para controle de VENCIDOS, DESPERDÍCIOS e DESCARTES. Apenas produtos que já venceram ou vencem hoje podem ser registrados.');
      return;
    }

    let finalQtd = 1;
    let finalValorTotal = scanAnalysis.valorTotal;
    let finalValorKg = scanAnalysis.valorKg;
    let finalPeso = scanAnalysis.peso;

    if (tipoProduto === 'individual') {
      finalQtd = Math.max(1, qtdIndividual);
      if (scanAnalysis.valorTotal) {
        finalValorTotal = scanAnalysis.valorTotal * finalQtd;
      }
    } else if (tipoProduto === 'lote') {
      finalQtd = Math.max(1, qtdLote);
      finalValorTotal = precoUnitarioLote * finalQtd;
    } else if (tipoProduto === 'peso') {
      finalQtd = 1;
      finalPeso = pesoKg;
      finalValorKg = precoKg;
      finalValorTotal = pesoKg * precoKg;
    }

    onScanResult({
      nome: scanAnalysis.nome,
      quantidade: finalQtd,
      dataFabricacao: scanAnalysis.dataFabricacao,
      dataValidade: scanAnalysis.dataValidade,
      peso: finalPeso,
      valorKg: finalValorKg,
      valorTotal: finalValorTotal,
      barcode: scanAnalysis.barcode,
      categoria: 'Geral',
      tipoProduto,
    });
  };

  const handleRescan = () => {
    setScanAnalysis(null);
    setPreviewImage(null);
    setError('');
    startCamera();
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
    setPreviewImage(imageBase64);
    await processImageBase64(imageBase64);
  };

  const handleSampleImage = async (url: string) => {
    try {
      setIsProcessing(true);
      setError('');
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setPreviewImage(base64);
        await processImageBase64(base64);
      };
      reader.readAsDataURL(blob);
    } catch (e: any) {
      console.error('Erro ao carregar imagem de exemplo:', e);
      setError('Erro ao carregar a imagem de exemplo.');
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setPreviewImage(base64);
        await processImageBase64(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-full sm:max-w-md shadow-2xl relative my-auto max-h-[90dvh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-scale-up box-border">
        {/* Header */}
        <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-gray-100 bg-gray-50 shrink-0">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-[#E8571A]" />
            <h3 className="font-bold text-[#2C2C2C] text-sm sm:text-base">Leitor IA (Rótulos & Validade)</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 cursor-pointer"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Main Content Area */}
        {scanAnalysis ? (
          /* SCAN ANALYSIS RESULT SCREEN */
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
              {/* Validity Banner */}
              {scanAnalysis.isExpired ? (
                <div className="p-3.5 sm:p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white uppercase tracking-wider inline-block mb-1">
                      🔴 PRODUTO VENCIDO / VENCE HOJE
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-red-900 leading-snug">
                      {scanAnalysis.daysRemaining !== undefined
                        ? (scanAnalysis.daysRemaining === 0 ? 'Vence hoje!' : `Vencido há ${Math.abs(scanAnalysis.daysRemaining)} dia(s)`)
                        : 'Data Expirada'}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-red-700 font-semibold mt-1">
                      {scanAnalysis.daysRemaining === 0
                        ? `Atingiu a data de validade hoje (${formatDateToBR(scanAnalysis.dataValidade || '')}). Deve ser retirado de venda e enviado para descarte/doação.`
                        : `Ultrapassou a data de vencimento (${formatDateToBR(scanAnalysis.dataValidade || '')}). Não pode ser vendido e deve ser descartado.`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 sm:p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white uppercase tracking-wider inline-block mb-1">
                      ⛔ PRODUTO DENTRO DA VALIDADE
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-red-900 leading-snug">
                      {scanAnalysis.daysRemaining === 0
                        ? 'Vence hoje!'
                        : `Vence em ${scanAnalysis.daysRemaining} dia(s)`}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-red-700 font-semibold mt-1">
                      Este produto ainda está na validade ({formatDateToBR(scanAnalysis.dataValidade || '')}). O Padariaio aceita apenas produtos que venceram ou que vencem hoje para o controle de perdas, doação e descarte.
                    </p>
                  </div>
                </div>
              )}

              {/* Product Details Box */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                <div className="flex justify-between border-b border-gray-200 pb-1.5">
                  <span className="font-bold text-gray-500">Produto Extraído:</span>
                  <span className="font-extrabold text-gray-900">{scanAnalysis.nome}</span>
                </div>
                {scanAnalysis.barcode && (
                  <div className="flex justify-between border-b border-gray-200 pb-1.5">
                    <span className="font-bold text-gray-500">Código de Barras:</span>
                    <span className="font-mono font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded">{scanAnalysis.barcode}</span>
                  </div>
                )}
                {scanAnalysis.dataFabricacao && (
                  <div className="flex justify-between border-b border-gray-200 pb-1.5">
                    <span className="font-bold text-gray-500">Data de Fabricação:</span>
                    <span className="font-bold text-gray-800">{formatDateToBR(scanAnalysis.dataFabricacao)}</span>
                  </div>
                )}
                {scanAnalysis.dataValidade && (
                  <div className="flex justify-between border-b border-gray-200 pb-1.5">
                    <span className="font-bold text-gray-500">Data de Validade:</span>
                    <span className={`font-black ${scanAnalysis.isExpired ? 'text-red-600' : 'text-emerald-700'}`}>
                      {formatDateToBR(scanAnalysis.dataValidade)}
                    </span>
                  </div>
                )}
                {scanAnalysis.valorTotal !== undefined && scanAnalysis.valorTotal !== null && (
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Preço Lido na Etiqueta:</span>
                    <span className="font-black text-emerald-800 text-xs">R$ {scanAnalysis.valorTotal.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* INTERACTIVE QUESTIONNAIRE */}
              <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl space-y-3">
                <div className="border-b border-orange-200/80 pb-2">
                  <p className="text-xs font-black text-orange-950">
                    Esse produto é:
                  </p>
                  <p className="text-[11px] text-orange-800 font-medium mt-0.5">
                    Selecione o tipo correto para calcular o estoque e valor:
                  </p>
                </div>

                {/* Type Options Radio/Buttons */}
                <div className="space-y-2">
                  {/* Option 1: Produto Individual */}
                  <button
                    type="button"
                    onClick={() => setTipoProduto('individual')}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start space-x-2.5 ${
                      tipoProduto === 'individual'
                        ? 'bg-white border-[#FF6B00] ring-2 ring-[#FF6B00]/20 shadow-xs'
                        : 'bg-white/80 border-gray-200 hover:bg-white text-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      tipoProduto === 'individual' ? 'border-[#FF6B00] bg-[#FF6B00]' : 'border-gray-400'
                    }`}>
                      {tipoProduto === 'individual' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="text-xs font-black text-gray-900 block">1 - Produto individual</span>
                      <span className="text-[10px] text-gray-500 font-medium block leading-tight">
                        (uma unidade corresponde a uma venda)
                      </span>
                    </div>
                  </button>

                  {/* Option 2: Produto em Lote */}
                  <button
                    type="button"
                    onClick={() => setTipoProduto('lote')}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start space-x-2.5 ${
                      tipoProduto === 'lote'
                        ? 'bg-white border-[#FF6B00] ring-2 ring-[#FF6B00]/20 shadow-xs'
                        : 'bg-white/80 border-gray-200 hover:bg-white text-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      tipoProduto === 'lote' ? 'border-[#FF6B00] bg-[#FF6B00]' : 'border-gray-400'
                    }`}>
                      {tipoProduto === 'lote' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="text-xs font-black text-gray-900 block">2 - Produto em lote</span>
                      <span className="text-[10px] text-gray-500 font-medium block leading-tight">
                        (várias unidades do mesmo produto foram produzidas ou embaladas juntas)
                      </span>
                    </div>
                  </button>

                  {/* Option 3: Vendido por Peso */}
                  <button
                    type="button"
                    onClick={() => setTipoProduto('peso')}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start space-x-2.5 ${
                      tipoProduto === 'peso'
                        ? 'bg-white border-[#FF6B00] ring-2 ring-[#FF6B00]/20 shadow-xs'
                        : 'bg-white/80 border-gray-200 hover:bg-white text-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      tipoProduto === 'peso' ? 'border-[#FF6B00] bg-[#FF6B00]' : 'border-gray-400'
                    }`}>
                      {tipoProduto === 'peso' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="text-xs font-black text-gray-900 block">3 - Vendido por peso (KG)</span>
                      <span className="text-[10px] text-gray-500 font-medium block leading-tight">
                        (produto comercializado por quilo/grama)
                      </span>
                    </div>
                  </button>
                </div>

                {/* Dynamic Follow-Up Questions */}
                <div className="pt-2 border-t border-orange-200/80 space-y-2">
                  {tipoProduto === 'individual' && (
                    <div>
                      <label className="block text-[11px] font-bold text-gray-800 mb-1">
                        Esse produto possui quantas unidades disponíveis?
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={qtdIndividual}
                        onChange={(e) => setQtdIndividual(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-gray-300 text-gray-900 bg-white"
                      />
                    </div>
                  )}

                  {tipoProduto === 'lote' && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-800 mb-1">
                          Quantas unidades existem nesse lote?
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={qtdLote}
                          onChange={(e) => setQtdLote(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-gray-300 text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-800 mb-1">
                          Preço unitário por item do lote (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={precoUnitarioLote}
                          onChange={(e) => setPrecoUnitarioLote(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-gray-300 text-gray-900 bg-white"
                        />
                      </div>
                      <div className="p-2 bg-emerald-100/60 rounded-lg text-[11px] text-emerald-900 font-bold flex justify-between">
                        <span>Valor Total do Lote:</span>
                        <span>R$ {(qtdLote * precoUnitarioLote).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {tipoProduto === 'peso' && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-800 mb-1">
                          Peso total disponível (KG):
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={pesoKg}
                          onChange={(e) => setPesoKg(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-gray-300 text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-800 mb-1">
                          Preço por KG (R$/KG):
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={precoKg}
                          onChange={(e) => setPrecoKg(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-gray-300 text-gray-900 bg-white"
                        />
                      </div>
                      <div className="p-2 bg-emerald-100/60 rounded-lg text-[11px] text-emerald-900 font-bold flex justify-between">
                        <span>Valor Total do Peso:</span>
                        <span>R$ {(pesoKg * precoKg).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fixed Action Footer at Bottom */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-100 space-y-2 shrink-0 shadow-md">
              {scanAnalysis.isExpired ? (
                <button
                  onClick={handleConfirmResult}
                  className="w-full py-3 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm text-white shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer bg-red-600 hover:bg-red-700 active:scale-98 shadow-red-500/20"
                >
                  <span>🔴 Confirmar para Controle de Descarte</span>
                </button>
              ) : (
                <div className="p-2.5 sm:p-3 bg-red-100 border border-red-300 rounded-xl text-center text-xs font-bold text-red-800">
                  ⛔ Registro Não Permitido: O Padariaio aceita apenas produtos que já venceram.
                </div>
              )}

              <button
                onClick={handleRescan}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Escanear Outro Rótulo</span>
              </button>
            </div>
          </div>
        ) : (
          /* SCANNER CAMERA & FILE INPUT */
          <div className="overflow-y-auto flex-1">
            <div className="p-4 bg-black relative flex flex-col items-center justify-center min-h-[280px]">
              {previewImage && isProcessing ? (
                <div className="relative w-full h-[280px] flex items-center justify-center">
                  <img src={previewImage} alt="Preview" className="w-full h-full object-contain rounded-lg opacity-60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#D4A574] mb-2" />
                    <span className="font-bold text-sm">A IA está analisando a validade...</span>
                  </div>
                </div>
              ) : cameraAvailable ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-auto max-h-[320px] object-cover rounded-lg ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : (
                <div className="text-center p-6 text-gray-300 flex flex-col items-center space-y-3">
                  <Upload className="w-12 h-12 text-[#D4A574]" />
                  <div>
                    <p className="text-sm font-semibold">Câmera não conectada ou aguardando permissão</p>
                    <p className="text-xs text-gray-400 mt-1">Toque abaixo para ativar ou selecione uma foto do rótulo.</p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-[#E8571A] text-white rounded-xl text-xs font-bold hover:bg-[#d64e16] transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tentar Ativar Câmera</span>
                  </button>
                </div>
              )}

              {error && (
                <div className="absolute inset-x-4 bottom-4 bg-red-900/90 border border-red-500 text-white text-xs p-3 rounded-xl flex flex-col items-center text-center space-y-2">
                  <span>{error}</span>
                  <button
                    onClick={() => setError('')}
                    className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded-lg font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Tentar Novamente</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 flex flex-col space-y-2">
              {cameraAvailable && (
                <button
                  onClick={handleCapture}
                  disabled={isProcessing}
                  className="w-full py-3 bg-[#E8571A] hover:bg-[#d64e16] disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex justify-center items-center space-x-2 cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>Tirar Foto e Analisar Validade</span>
                </button>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 rounded-xl font-semibold transition-colors flex justify-center items-center space-x-2 text-sm cursor-pointer"
              >
                <Upload className="w-4 h-4 text-gray-600" />
                <span>{cameraAvailable ? 'Ou Escolher Imagem da Galeria' : 'Escolher Foto do Rótulo'}</span>
              </button>

              {/* Sample AI Images */}
              <div className="pt-2 border-t border-gray-200 space-y-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block text-center">
                  Ou teste com exemplos reais da IA:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { url: 'https://i.imgur.com/NMV1vLB.jpeg', label: 'Rótulo 1' },
                    { url: 'https://i.imgur.com/Mu71dit.jpeg', label: 'Rótulo 2' },
                    { url: 'https://i.imgur.com/LB9lhBY.jpeg', label: 'Rótulo 3' },
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSampleImage(sample.url)}
                      disabled={isProcessing}
                      className="relative group rounded-xl overflow-hidden border border-gray-200 hover:border-[#E8571A] transition-all aspect-4/3 bg-black cursor-pointer disabled:opacity-50"
                      title="Clique para testar a IA com esta foto"
                    >
                      <img
                        src={sample.url}
                        alt={sample.label}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/80 text-white text-[9px] font-bold text-center py-0.5">
                        {sample.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-gray-500 text-center pt-1">
                Aponte a câmera para o rótulo do produto ou envie uma foto com o nome e validade visíveis.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
