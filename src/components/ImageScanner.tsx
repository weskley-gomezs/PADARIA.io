import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';

interface ImageScannerProps {
  bakeryCode?: string;
  onScanResult: (result: { nome: string; dataFabricacao?: string; dataValidade?: string; valorKg?: number; valorTotal?: number }) => void;
  onClose: () => void;
}

export const ImageScanner: React.FC<ImageScannerProps> = ({ bakeryCode, onScanResult, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

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
        setError('Não foi possível acessar a câmera.');
      }
    };
    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsProcessing(true);
    setError('');
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
    
    try {
      const response = await fetch('/api/analyze-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, bakeryCode }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao analisar imagem.');
      }
      
      onScanResult({
        nome: data.nome || '',
        dataFabricacao: data.dataFabricacao || '',
        dataValidade: data.dataValidade || '',
        valorKg: data.valorKg,
        valorTotal: data.valorTotal
      });
      
    } catch (err: any) {
      setError(err.message || 'Falha ao analisar a imagem. Tente novamente.');
      setIsProcessing(false);
    }
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
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 bg-black relative flex flex-col items-center justify-center min-h-[300px]">
          {error ? (
            <div className="text-red-500 text-sm text-center py-8 bg-black/50 p-4 rounded">{error}</div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-auto max-h-[400px] object-cover rounded-lg ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
                  <Loader2 className="w-10 h-10 animate-spin text-[#D4A574] mb-2" />
                  <span className="font-bold text-sm">A IA está lendo o rótulo...</span>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 flex flex-col items-center">
          <button
            onClick={handleCapture}
            disabled={isProcessing || !!error}
            className="w-full py-3 bg-[#E8571A] hover:bg-[#d64e16] disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex justify-center items-center space-x-2"
          >
            <Camera className="w-5 h-5" />
            <span>Tirar Foto e Analisar</span>
          </button>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Aponte a câmera para o rótulo e a data de validade.
          </p>
        </div>
      </div>
    </div>
  );
};
