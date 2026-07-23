import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    const scanner = new Html5Qrcode('reader');
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
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
          } as any,
          (decodedText) => {
            scanner.stop().then(() => {
              onScan(decodedText);
            });
          },
          (err) => {
            // Ignored, happens constantly during scanning
          }
        );
      } catch (err: any) {
        setError('Não foi possível acessar a câmera. Verifique as permissões.');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative">
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
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 bg-black relative">
          {error ? (
            <div className="text-red-500 text-sm text-center py-8">{error}</div>
          ) : (
            <div id="reader" className="w-full h-[300px] bg-black overflow-hidden rounded-lg"></div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Aponte a câmera para o código de barras do produto.
          </p>
        </div>
      </div>
    </div>
  );
};
