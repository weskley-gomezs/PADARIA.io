import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, QrCode, Search, CheckCircle, AlertCircle, Clock, Sparkles, Loader2, Check } from 'lucide-react';
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
  const [isScanning, setIsScanning] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      const offers = StorageService.getVipOffers(bakeryCode).filter(o => o.status === 'ativo');
      setActiveOffers(offers);
      setSearchTerm('');
      setSelectedOffer(null);
      setSuccessMsg(null);
      setIsScanning(true);
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, bakeryCode]);

  const startCamera = async () => {
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
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Câmera indisponível no VipScannerModal:', err);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Filter offers by search term (name or barcode)
  const filteredOffers = activeOffers.filter(o =>
    o.nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.productId && o.productId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectOffer = (offer: VipOffer) => {
    setSelectedOffer(offer);
    setIsScanning(false);
    stopCamera();
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
                    setIsScanning(true);
                    startCamera();
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
              {/* Camera Preview */}
              <div className="bg-black rounded-2xl overflow-hidden relative min-h-[200px] flex items-center justify-center">
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-48 object-cover opacity-90"
                  />
                ) : (
                  <div className="text-center p-6 text-gray-400 space-y-2">
                    <Camera className="w-8 h-8 text-amber-500 mx-auto opacity-80" />
                    <p className="text-xs font-semibold">Câmera indisponível ou permissão pendente</p>
                    <p className="text-[10px] text-gray-500">Selecione o produto na lista abaixo para dar baixa</p>
                  </div>
                )}
                {/* Scan Overlay Frame */}
                {isCameraActive && (
                  <div className="absolute inset-0 border-2 border-dashed border-amber-400/80 m-6 rounded-xl flex items-center justify-center pointer-events-none">
                    <span className="bg-black/60 text-amber-300 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">
                      Aponte para o Código do Produto
                    </span>
                  </div>
                )}
              </div>

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
