import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Loader2, Upload, RefreshCw, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { calculateDaysRemaining, formatDateToBR } from '../utils/dateUtils';

interface ImageScannerProps {
  bakeryCode?: string;
  onScanResult: (result: { nome: string; dataFabricacao?: string; dataValidade?: string; valorKg?: number; valorTotal?: number }) => void;
  onClose: () => void;
}

interface ScanAnalysis {
  nome: string;
  dataFabricacao?: string;
  dataValidade?: string;
  valorKg?: number;
  valorTotal?: number;
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
      const response = await fetch('/api/analyze-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, bakeryCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Erro ao analisar imagem.');
      }

      const valDate = data.dataValidade || '';
      const daysRemaining = valDate ? calculateDaysRemaining(valDate) : undefined;
      const isExpired = daysRemaining !== undefined ? daysRemaining < 0 : false;

      setScanAnalysis({
        nome: data.nome || 'Produto Sem Nome',
        dataFabricacao: data.dataFabricacao || '',
        dataValidade: valDate,
        valorKg: data.valorKg,
        valorTotal: data.valorTotal,
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
    onScanResult({
      nome: scanAnalysis.nome,
      dataFabricacao: scanAnalysis.dataFabricacao,
      dataValidade: scanAnalysis.dataValidade,
      valorKg: scanAnalysis.valorKg,
      valorTotal: scanAnalysis.valorTotal,
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
    <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative animate-scale-up">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-[#E8571A]" />
            <h3 className="font-bold text-[#2C2C2C]">Leitor IA (Rótulos & Validade)</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 cursor-pointer"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Main Content Area */}
        {scanAnalysis ? (
          /* SCAN ANALYSIS RESULT SCREEN */
          <div className="p-5 space-y-4">
            {/* Validity Banner */}
            {scanAnalysis.isExpired ? (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-center space-y-2">
                <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white uppercase tracking-wider inline-block mb-1">
                    🔴 PRODUTO VENCIDO
                  </span>
                  <h4 className="text-base font-black text-red-900 leading-snug">
                    {scanAnalysis.daysRemaining !== undefined
                      ? `Vencido há ${Math.abs(scanAnalysis.daysRemaining)} dia(s)`
                      : 'Data Expirada'}
                  </h4>
                  <p className="text-xs text-red-700 font-semibold mt-1">
                    Ultrapassou a data de vencimento ({formatDateToBR(scanAnalysis.dataValidade || '')}). Não pode ser vendido e deve ser descartado.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider inline-block mb-1">
                    🟢 DENTRO DA VALIDADE
                  </span>
                  <h4 className="text-base font-black text-emerald-900 leading-snug">
                    {scanAnalysis.daysRemaining === 0
                      ? 'VENCE HOJE! (Pode ser vendido normalmente)'
                      : `Vence em ${scanAnalysis.daysRemaining} dia(s)`}
                  </h4>
                  <p className="text-xs text-emerald-800 font-semibold mt-1">
                    {scanAnalysis.daysRemaining === 0
                      ? 'Produtos que vencem no dia de fabricação ou hoje podem ser vendidos normalmente ou colocados em oferta no Clube VIP.'
                      : 'Produto dentro do prazo de validade e próprio para consumo/venda.'}
                  </p>
                </div>
              </div>
            )}

            {/* Product Details Box */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between border-b border-gray-200 pb-1.5">
                <span className="font-bold text-gray-500">Produto:</span>
                <span className="font-extrabold text-gray-900">{scanAnalysis.nome}</span>
              </div>
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
              {(scanAnalysis.valorTotal || scanAnalysis.valorKg) && (
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Valor / Preço:</span>
                  <span className="font-black text-gray-900">
                    {scanAnalysis.valorTotal ? `R$ ${scanAnalysis.valorTotal.toFixed(2)}` : `R$ ${scanAnalysis.valorKg?.toFixed(2)}/kg`}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleConfirmResult}
                className={`w-full py-3.5 rounded-xl font-black text-sm text-white shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  scanAnalysis.isExpired
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                }`}
              >
                <span>{scanAnalysis.isExpired ? 'Confirmar para Controle de Descarte' : 'Confirmar e Usar Dados'}</span>
              </button>

              <button
                onClick={handleRescan}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Escanear Outro Rótulo</span>
              </button>
            </div>
          </div>
        ) : (
          /* SCANNER CAMERA & FILE INPUT */
          <>
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
          </>
        )}
      </div>
    </div>
  );
};
