import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, Upload } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');

  const startScanner = async () => {
    setError('');
    let scanner = scannerRef.current;
    if (!scanner) {
      scanner = new Html5Qrcode('reader');
      scannerRef.current = scanner;
    }

    if (scanner.isScanning) {
      try {
        await scanner.stop();
      } catch {}
    }

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE
      ],
    };

    try {
      await scanner.start(
        { facingMode: 'environment' },
        config as any,
        (decodedText) => {
          scanner?.stop().then(() => {
            onScan(decodedText);
          }).catch(() => onScan(decodedText));
        },
        () => {}
      );
    } catch (err: any) {
      console.warn('Câmera em ambiente falhou, tentando fallback para câmera frontal/webcam...', err);
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const backCam = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('traseira')) || cameras[0];
          await scanner.start(
            backCam.id,
            config as any,
            (decodedText) => {
              scanner?.stop().then(() => {
                onScan(decodedText);
              }).catch(() => onScan(decodedText));
            },
            () => {}
          );
        } else {
          setError('Nenhuma câmera encontrada. Clique no botão para tentar novamente ou envie uma foto.');
        }
      } catch (e2) {
        setError('Acesso à câmera não permitido. Clique no botão abaixo para tentar novamente ou escolha uma foto do código.');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode('reader');
        scannerRef.current = scanner;
      }
      const result = await scanner.scanFileV2(file, false);
      if (result && result.decodedText) {
        onScan(result.decodedText);
      }
    } catch (err) {
      setError('Não foi possível ler um código de barras nesta imagem. Tente enviar uma foto mais nítida do código.');
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative my-auto max-h-[90dvh] flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-[#E8571A]" />
            <h3 className="font-bold text-[#2C2C2C]">Escanear Código</h3>
          </div>
          <button
            onClick={() => {
              if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().then(onClose).catch(() => onClose());
              } else {
                onClose();
              }
            }}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 bg-black relative flex flex-col items-center justify-center min-h-[280px]">
          <div id="reader" className="w-full h-[260px] bg-black overflow-hidden rounded-lg"></div>

          {error && (
            <div className="absolute inset-x-4 bottom-4 bg-red-900/90 border border-red-500 text-white text-xs p-3 rounded-xl flex flex-col items-center text-center space-y-2 z-10">
              <span>{error}</span>
              <div className="flex gap-2">
                <button
                  onClick={startScanner}
                  className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded-lg font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Tentar Câmera</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold text-[11px] flex items-center space-x-1 cursor-pointer text-gray-200"
                >
                  <Upload className="w-3 h-3" />
                  <span>Foto do Código</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <div className="p-4 bg-gray-50 text-center space-y-2">
          <p className="text-xs text-gray-500 font-medium">
            Aponte a câmera para o código de barras ou envie uma imagem com o código.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold text-xs transition-colors flex justify-center items-center space-x-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-gray-600" />
            <span>Escolher Foto do Código de Barras</span>
          </button>
        </div>
      </div>
    </div>
  );
};
