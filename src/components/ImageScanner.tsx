import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Loader2, Upload, RefreshCw } from 'lucide-react';

interface ImageScannerProps {
  bakeryCode?: string;
  onScanResult: (result: { nome: string; dataFabricacao?: string; dataValidade?: string; valorKg?: number; valorTotal?: number }) => void;
  onClose: () => void;
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

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setCameraAvailable(false);
      }
    };
    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const processImageBase64 = async (imageBase64: string) => {
    setIsProcessing(true);
    setError('');

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

      onScanResult({
        nome: data.nome || '',
        dataFabricacao: data.dataFabricacao || '',
        dataValidade: data.dataValidade || '',
        valorKg: data.valorKg,
        valorTotal: data.valorTotal
      });

    } catch (err: any) {
      console.error('Erro na análise de imagem:', err);
      setError(err.message || 'Falha ao analisar a imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
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
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative">
        <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-[#E8571A]" />
            <h3 className="font-bold text-[#2C2C2C]">Leitor IA (Rótulos)</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 cursor-pointer"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 bg-black relative flex flex-col items-center justify-center min-h-[280px]">
          {previewImage && isProcessing ? (
            <div className="relative w-full h-[280px] flex items-center justify-center">
              <img src={previewImage} alt="Preview" className="w-full h-full object-contain rounded-lg opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#D4A574] mb-2" />
                <span className="font-bold text-sm">A IA está lendo o rótulo...</span>
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
            <div className="text-center p-6 text-gray-300 flex flex-col items-center">
              <Upload className="w-12 h-12 text-[#D4A574] mb-3" />
              <p className="text-sm font-semibold mb-1">Câmera não disponível no dispositivo</p>
              <p className="text-xs text-gray-400 mb-4">Selecione ou tire uma foto através do gerenciador de arquivos.</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-x-4 bottom-4 bg-red-900/90 border border-red-500 text-white text-xs p-3 rounded-xl flex flex-col items-center text-center space-y-2">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded-lg font-bold text-[11px] flex items-center space-x-1"
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
              <span>Tirar Foto e Analisar</span>
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

          <p className="text-[11px] text-gray-500 text-center pt-1">
            Aponte a câmera para o rótulo do produto ou envie uma foto com o nome e validade visíveis.
          </p>
        </div>
      </div>
    </div>
  );
};
