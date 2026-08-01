import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, QrCode, Search, CheckCircle, AlertCircle, Clock, Sparkles, Loader2, Check, RefreshCw, Upload } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { VipOffer } from '../types';
import { StorageService } from '../services/storageService';
import { calculateDaysRemaining, formatDateToBR, getRelativeExpirationText } from '../utils/dateUtils';

interface VipScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bakeryCode: string;
  onSaleConfirmed?: () => void;
}

export const VipScannerModal: React.FC<VipScannerModalProps> = ({
  isOpen,
  onClose,
  bakeryCode,
  onSaleConfirmed,
}) => {
  const [activeOffers, setActiveOffers] = useState<VipOffer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<VipOffer | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const offers = StorageService.getVipOffers(bakeryCode).filter(o => o.status === 'ativo');
      setActiveOffers(offers);
      setSearchTerm('');
      setSelectedOffer(null);
      setSuccessMsg(null);
      setCameraError(null);
      setScanNotice(null);
      
      // Give DOM time to render container div before mounting scanner
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, bakeryCode]);

  const handleBarcodeScanned = (decodedText: string) => {
    const text = decodedText.trim().toLowerCase();
    
    // Check if any active offer matches this barcode directly
    const offers = StorageService.getVipOffers(bakeryCode).filter(o => o.status === 'ativo');
    const matchedOffer = offers.find(o => 
      o.id.toLowerCase() === text ||
      (o.productId && o.productId.toLowerCase() === text) ||
      o.nomeProduto.toLowerCase().includes(text)
    );

    if (matchedOffer) {
      setSelectedOffer(matchedOffer);
      stopScanner();
    } else {
      // Check in product inventory if barcode matches product ID or product barcode
      const products = StorageService.getProducts(bakeryCode);
      const matchedProduct = products.find(p => p.id.toLowerCase() === text || (p.barcode && p.barcode.toLowerCase() === text));
      
      if (matchedProduct) {
        const vipForProduct = offers.find(o => o.productId === matchedProduct.id);
        if (vipForProduct) {
          setSelectedOffer(vipForProduct);
          stopScanner();
          return;
        }
      }

      setSearchTerm(decodedText);
      setScanNotice(`Código "${decodedText}" lido! Selecione a oferta correspondente na lista abaixo.`);
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    setScanNotice(null);

    const readerElem = document.getElementById('vip-barcode-reader');
    if (!readerElem) return;

    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.warn('Erro ao parar scanner anterior:', e);
      }
    }

    try {
      const html5Qrcode = new Html5Qrcode('vip-barcode-reader');
      scannerRef.current = html5Qrcode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.777778,
        videoConstraints: {
          facingMode: { ideal: 'environment' },
        },
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
        await html5Qrcode.start(
          { facingMode: 'environment' },
          config as any,
          (decodedText) => handleBarcodeScanned(decodedText),
          () => {}
        );
        setIsCameraActive(true);
      } catch (err) {
        console.warn('Falhou câmera traseira, buscando lista de câmeras...', err);
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const backCam = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('traseira')) || cameras[0];
          await html5Qrcode.start(
            backCam.id,
            config as any,
            (decodedText) => handleBarcodeScanned(decodedText),
            () => {}
          );
          setIsCameraActive(true);
        } else {
          setIsCameraActive(false);
          setCameraError('Nenhuma câmera encontrada. Clique no botão abaixo para dar permissão.');
        }
      }
    } catch (err: any) {
      console.warn('Erro ao acessar câmera no VipScannerModal:', err);
      setIsCameraActive(false);
      setCameraError('Acesso à câmera bloqueado ou pendente. Clique em "Ativar Câmera" ou envie uma foto do código.');
    }
  };

  const stopScanner = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode('vip-barcode-reader');
        scannerRef.current = scanner;
      }
      const result = await scanner.scanFileV2(file, false);
      if (result && result.decodedText) {
        handleBarcodeScanned(result.decodedText);
      }
    } catch (err) {
      setScanNotice('Não foi possível identificar um código de barras legível nesta imagem. Tente tirar outra foto mais de perto.');
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  // Filter offers by search term (name or barcode)
  const filteredOffers = activeOffers.filter(o =>
    o.nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.productId && o.productId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectOffer = (offer: VipOffer) => {
    setSelectedOffer(offer);
    stopScanner();
  };

  const handleConfirmSale = async () => {
    if (!selectedOffer) return;
    setIsConfirming(true);

    try {
      // 1. Mark as sold in VIP Club
      await StorageService.updateVipOfferStatus(selectedOffer.id, 'vendido', {
        dataVenda: new Date().toISOString(),
        valorVenda: selectedOffer.valorPromocional,
      });

      // 2. Decrement or remove from product inventory in PADARIA.io
      if (selectedOffer.productId) {
        const products = StorageService.getProducts(bakeryCode);
        const product = products.find(p => p.id === selectedOffer.productId);
        if (product) {
          if (product.quantidade > 1) {
            await StorageService.updateProduct(
              product.id,
              product.nome,
              product.quantidade - 1,
              product.dataValidade,
              product.categoria,
              product.barcode,
              product.valorKg,
              product.dataFabricacao,
              product.valorTotal
            );
          } else {
            await StorageService.deleteProduct(product.id);
          }
        }
      }

      // Celebrate
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      setSuccessMsg(`Venda do produto "${selectedOffer.nomeProduto}" confirmada com sucesso!`);
      setSelectedOffer(null);
      
      if (onSaleConfirmed) {
        onSaleConfirmed();
      }

      setTimeout(() => {
        setSuccessMsg(null);
        handleClose();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar venda.');
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 relative animate-scale-up">
        {/* Header */}
        <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Scanner Clube VIP</h3>
              <p className="text-[11px] text-gray-400">Escaneie o código de barras ou selecione o produto</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {successMsg ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-black text-gray-800">Venda Registrada!</h4>
              <p className="text-sm font-medium text-gray-600 max-w-xs mx-auto">{successMsg}</p>
            </div>
          ) : selectedOffer ? (
            /* PRODUCT FOUND CARD */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/60 border-2 border-amber-300/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-white uppercase tracking-wider">
                    🔥 EM PROMOÇÃO CLUBE VIP
                  </span>
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {getRelativeExpirationText(calculateDaysRemaining(selectedOffer.dataValidade))}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-black text-gray-900 leading-tight">
                    {selectedOffer.nomeProduto}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">{selectedOffer.categoria}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                  <div>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                      Preço Original
                    </span>
                    <span className="text-sm font-extrabold text-gray-500 line-through">
                      R$ {selectedOffer.valorOriginal.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">
                      Preço Promocional
                    </span>
                    <span className="text-xl font-black text-emerald-600">
                      R$ {selectedOffer.valorPromocional.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-amber-800 bg-white/80 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Ao confirmar, o produto será baixado do Clube VIP e do controle de estoque. O caixa da padaria continuará cobrando normalmente.
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedOffer(null);
                    startScanner();
                  }}
                  className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  disabled={isConfirming}
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmSale}
                  disabled={isConfirming}
                  className="w-2/3 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isConfirming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirmar Venda</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* SCANNER CAMERA & LIST LOOKUP */
            <div className="space-y-4">
              {/* Hidden File Input for Barcode Image Scanning */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Camera Preview / Html5Qrcode Reader */}
              <div className="bg-slate-950 rounded-2xl overflow-hidden relative min-h-[260px] border-2 border-slate-800 shadow-inner flex flex-col items-center justify-center">
                {/* Live Camera Active Banner */}
                {isCameraActive && (
                  <div className="absolute top-3 left-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center justify-between text-[11px] font-extrabold text-white z-10 pointer-events-none">
                    <div className="flex items-center space-x-2 text-amber-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Câmera Ativa • Leitura Nítida do Código</span>
                    </div>
                    <span className="text-[10px] text-gray-300 font-mono">100% Iluminado</span>
                  </div>
                )}

                <div id="vip-barcode-reader" className="w-full h-60 sm:h-64 bg-slate-950" />

                {!isCameraActive && (
                  <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 text-center space-y-3 z-10">
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
                      <Camera className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Câmera Aguardando Permissão ou Desativada</p>
                      <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                        {cameraError || 'Toque em Ativar Câmera para abrir o leitor nítido do código de barras.'}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs pt-1">
                      <button
                        onClick={startScanner}
                        className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-gray-900 font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Ativar Câmera Nítida</span>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold rounded-xl text-xs transition-all border border-slate-700 flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Foto do Código</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notice Banner */}
              {scanNotice && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-bold flex items-center justify-between">
                  <span>{scanNotice}</span>
                  <button onClick={() => setScanNotice(null)} className="text-amber-600 hover:text-amber-900">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Digite o nome do produto ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Active VIP Offers list */}
              <div className="space-y-2">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
                  Produtos em Oferta no Clube VIP ({filteredOffers.length})
                </span>

                {filteredOffers.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-2xl text-xs font-medium">
                    Nenhum produto ativo em oferta encontrado.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {filteredOffers.map((offer) => {
                      const daysLeft = calculateDaysRemaining(offer.dataValidade);
                      return (
                        <div
                          key={offer.id}
                          onClick={() => handleSelectOffer(offer)}
                          className="p-3 bg-white hover:bg-amber-50/80 border border-gray-200 hover:border-amber-300 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-extrabold text-xs text-gray-900 group-hover:text-amber-900">
                              {offer.nomeProduto}
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium">
                              Vence em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} ({formatDateToBR(offer.dataValidade)})
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-black text-emerald-600">
                              R$ {offer.valorPromocional.toFixed(2)}
                            </div>
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              -{offer.desconto}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
