import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, QrCode, Search, CheckCircle, AlertCircle, Clock, Loader2, Check, RefreshCw, Upload, Plus, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
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
  const [cart, setCart] = useState<VipOffer[]>([]);
  const [isCheckoutView, setIsCheckoutView] = useState(false);
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
      setCart([]);
      setIsCheckoutView(false);
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
    const rawText = decodedText.trim();
    if (!rawText) return;

    const lowerText = rawText.toLowerCase();
    const digitsOnly = rawText.replace(/\D/g, '');

    const allActive = StorageService.getVipOffers(bakeryCode).filter(o => o.status === 'ativo');
    // Filter out offers already queued in cart
    const unselectedOffers = allActive.filter(o => !cart.some(c => c.id === o.id));
    const products = StorageService.getProducts(bakeryCode);

    // Helper to check if two barcodes match
    const checkBarcodeMatch = (targetBarcode?: string) => {
      if (!targetBarcode) return false;
      const targetTrimmed = targetBarcode.trim().toLowerCase();
      if (targetTrimmed === lowerText) return true;

      const targetDigits = targetBarcode.replace(/\D/g, '');
      if (digitsOnly && targetDigits && (digitsOnly === targetDigits || targetDigits.endsWith(digitsOnly) || digitsOnly.endsWith(targetDigits))) {
        return true;
      }
      return false;
    };

    // 1. Direct match on available VipOffers
    let matchedOffer = unselectedOffers.find(o => {
      if (checkBarcodeMatch(o.barcode)) return true;
      if (o.id.toLowerCase() === lowerText || (o.productId && o.productId.toLowerCase() === lowerText)) return true;
      return false;
    });

    // 2. Direct match on inventory products
    if (!matchedOffer) {
      const matchedProduct = products.find(p => 
        checkBarcodeMatch(p.barcode) || p.id.toLowerCase() === lowerText
      );

      if (matchedProduct) {
        matchedOffer = unselectedOffers.find(o => 
          o.productId === matchedProduct.id ||
          (o.barcode && checkBarcodeMatch(o.barcode)) ||
          o.nomeProduto.toLowerCase().trim() === matchedProduct.nome.toLowerCase().trim()
        );
      }
    }

    // 3. Fallback to fuzzy name match if no barcode match was found
    if (!matchedOffer) {
      matchedOffer = unselectedOffers.find(o => o.nomeProduto.toLowerCase().includes(lowerText));
    }

    if (matchedOffer) {
      setSelectedOffer(matchedOffer);
      setScanNotice(null);
      stopScanner();
    } else {
      // Check if item was already in cart
      const alreadyInCart = allActive.find(o => checkBarcodeMatch(o.barcode) || o.nomeProduto.toLowerCase().includes(lowerText));
      if (alreadyInCart && cart.some(c => c.id === alreadyInCart.id)) {
        setScanNotice(`O produto "${alreadyInCart.nomeProduto}" já foi adicionado ao carrinho.`);
      } else {
        setSearchTerm(rawText);
        setScanNotice(`Código "${rawText}" lido! Selecione a oferta correspondente na lista abaixo.`);
      }
    }
  };

  const startScanner = async () => {
    setCameraError(null);

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
    setCart([]);
    setIsCheckoutView(false);
    setSelectedOffer(null);
    onClose();
  };

  const allProducts = StorageService.getProducts(bakeryCode);

  const getOfferBarcode = (offer: VipOffer) => {
    if (offer.barcode) return offer.barcode;
    if (offer.productId) {
      const p = allProducts.find(item => item.id === offer.productId);
      if (p && p.barcode) return p.barcode;
    }
    return '';
  };

  // Offers not yet added to cart
  const availableOffers = activeOffers.filter(o => !cart.some(c => c.id === o.id));

  // Filter available offers by search term
  const filteredOffers = availableOffers.filter(o => {
    if (!searchTerm.trim()) return true;

    const term = searchTerm.trim().toLowerCase();
    const termDigits = term.replace(/\D/g, '');

    if (o.nomeProduto.toLowerCase().includes(term)) return true;
    if (o.categoria.toLowerCase().includes(term)) return true;
    if (o.id.toLowerCase().includes(term) || (o.productId && o.productId.toLowerCase().includes(term))) return true;

    if (o.barcode) {
      if (o.barcode.toLowerCase().includes(term)) return true;
      const bDigits = o.barcode.replace(/\D/g, '');
      if (termDigits && bDigits && (bDigits.includes(termDigits) || termDigits.includes(bDigits))) return true;
    }

    if (o.productId) {
      const prod = allProducts.find(p => p.id === o.productId);
      if (prod) {
        if (prod.nome.toLowerCase().includes(term)) return true;
        if (prod.barcode) {
          if (prod.barcode.toLowerCase().includes(term)) return true;
          const pDigits = prod.barcode.replace(/\D/g, '');
          if (termDigits && pDigits && (pDigits.includes(termDigits) || termDigits.includes(pDigits))) return true;
        }
      }
    }

    return false;
  });

  const handleSelectOffer = (offer: VipOffer) => {
    setSelectedOffer(offer);
    stopScanner();
  };

  // Add item to cart and reactivate scanner for next item
  const handleAddToCartAndScanNext = () => {
    if (!selectedOffer) return;
    const addedItemName = selectedOffer.nomeProduto;
    setCart(prev => [...prev, selectedOffer]);
    setSelectedOffer(null);
    setScanNotice(`✅ "${addedItemName}" adicionado ao total! Escaneie o próximo item.`);
    setTimeout(() => {
      startScanner();
    }, 100);
  };

  // Add item to cart and open checkout total summary view
  const handleAddToCartAndCheckout = () => {
    if (!selectedOffer) return;
    setCart(prev => [...prev, selectedOffer]);
    setSelectedOffer(null);
    setIsCheckoutView(true);
    stopScanner();
  };

  // Remove single item from cart
  const handleRemoveFromCart = (index: number) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart.splice(index, 1);
      if (newCart.length === 0) {
        setIsCheckoutView(false);
        setTimeout(() => startScanner(), 100);
      }
      return newCart;
    });
  };

  // Clear all items in cart
  const handleCancelAll = () => {
    setCart([]);
    setSelectedOffer(null);
    setIsCheckoutView(false);
    setScanNotice('Venda cancelada. O carrinho foi limpo.');
    setTimeout(() => startScanner(), 100);
  };

  // Finalize batch sale for all cart items
  const handleConfirmFinalSale = async () => {
    if (cart.length === 0) return;
    setIsConfirming(true);

    try {
      const products = StorageService.getProducts(bakeryCode);

      for (const offer of cart) {
        // 1. Mark as sold in VIP Club
        await StorageService.updateVipOfferStatus(offer.id, 'vendido', {
          dataVenda: new Date().toISOString(),
          valorVenda: offer.valorPromocional,
        });

        // 2. Decrement or remove from product inventory in PADARIA.io
        if (offer.productId) {
          const product = products.find(p => p.id === offer.productId);
          if (product) {
            if (product.quantidade > 1) {
              product.quantidade -= 1; // decrement local quantity reference for loop
              await StorageService.updateProduct(
                product.id,
                product.nome,
                product.quantidade,
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
      }

      // Celebrate
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });

      const totalValue = cart.reduce((acc, item) => acc + item.valorPromocional, 0);
      setSuccessMsg(`Venda de ${cart.length} produto(s) confirmada! Total: R$ ${totalValue.toFixed(2)}`);
      setCart([]);
      setIsCheckoutView(false);
      
      if (onSaleConfirmed) {
        onSaleConfirmed();
      }

      setTimeout(() => {
        setSuccessMsg(null);
        handleClose();
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Erro ao finalizar venda.');
    } finally {
      setIsConfirming(false);
    }
  };

  const totalCartValue = cart.reduce((acc, item) => acc + item.valorPromocional, 0);

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
              <p className="text-[11px] text-gray-400">Escaneamento rápido com adição ao total</p>
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
            /* SUCCESS MESSAGE SCREEN */
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-gray-800">Venda Finalizada!</h4>
              <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 py-2 px-4 rounded-xl border border-emerald-200 inline-block max-w-xs mx-auto">
                {successMsg}
              </p>
            </div>
          ) : isCheckoutView ? (
            /* CHECKOUT SUMMARY & TOTAL VIEW */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <button
                  onClick={() => {
                    setIsCheckoutView(false);
                    setTimeout(() => startScanner(), 100);
                  }}
                  className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar ao Leitor</span>
                </button>
                <span className="text-xs font-extrabold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
                  {cart.length} {cart.length === 1 ? 'item no carrinho' : 'itens no carrinho'}
                </span>
              </div>

              {/* Items List in Cart */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-extrabold text-xs text-gray-900">
                        {item.nomeProduto}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2 mt-0.5">
                        <span>{item.categoria}</span>
                        {getOfferBarcode(item) && (
                          <span className="font-mono bg-amber-100/80 text-amber-900 px-1 rounded">
                            EAN: {getOfferBarcode(item)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-600">
                          R$ {item.valorPromocional.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-gray-400 line-through">
                          R$ {item.valorOriginal.toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(idx)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* TOTAL DISPLAY BOX */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider block">
                    VALOR TOTAL PARA O CAIXA
                  </span>
                  <span className="text-2xl font-black text-emerald-700">
                    R$ {totalCartValue.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-500 block">Total de itens:</span>
                  <span className="text-lg font-black text-gray-800">{cart.length}</span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Confirme a venda para dar baixa automática dos itens no Clube VIP e estoque do sistema.
                </span>
              </div>

              {/* ACTION BUTTONS FOR CHECKOUT */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsCheckoutView(false);
                      setTimeout(() => startScanner(), 100);
                    }}
                    className="py-3 px-3 bg-amber-500 hover:bg-amber-600 text-gray-900 font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Outro Item</span>
                  </button>

                  <button
                    onClick={handleConfirmFinalSale}
                    disabled={isConfirming}
                    className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isConfirming ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Finalizar Venda</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleCancelAll}
                  disabled={isConfirming}
                  className="w-full py-2.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancelar Tudo</span>
                </button>
              </div>
            </div>
          ) : selectedOffer ? (
            /* PRODUCT FOUND CARD - ASK TO ADD OR CHECKOUT */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/60 border-2 border-amber-300/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-white uppercase tracking-wider">
                    🔥 ITEM IDENTIFICADO
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
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 font-medium">{selectedOffer.categoria}</span>
                    {getOfferBarcode(selectedOffer) && (
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded">
                        EAN: {getOfferBarcode(selectedOffer)}
                      </span>
                    )}
                  </div>
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

                {cart.length > 0 && (
                  <div className="p-2.5 bg-amber-100/80 rounded-xl text-xs text-amber-900 font-extrabold flex items-center justify-between">
                    <span>Carrinho Atual: {cart.length} item(ns)</span>
                    <span>Subtotal: R$ {(totalCartValue + selectedOffer.valorPromocional).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* PROMPT ACTION BUTTONS */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleAddToCartAndScanNext}
                    className="py-3 px-3 bg-amber-500 hover:bg-amber-600 text-gray-900 font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar + Ler Próximo</span>
                  </button>

                  <button
                    onClick={handleAddToCartAndCheckout}
                    className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Finalizar e Ver Total</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSelectedOffer(null);
                    if (cart.length > 0) {
                      setIsCheckoutView(true);
                    } else {
                      startScanner();
                    }
                  }}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancelar Item</span>
                </button>
              </div>
            </div>
          ) : (
            /* SCANNER CAMERA & LIST LOOKUP */
            <div className="space-y-4">
              {/* RUNNING CART BANNER IF CART NOT EMPTY */}
              {cart.length > 0 && (
                <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                      🛒 CARRINHO EM ANDAMENTO
                    </span>
                    <span className="text-sm font-extrabold text-emerald-900">
                      {cart.length} {cart.length === 1 ? 'item' : 'itens'} • R$ {totalCartValue.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        stopScanner();
                        setIsCheckoutView(true);
                      }}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-xs"
                    >
                      Ver Total / Finalizar
                    </button>
                    <button
                      onClick={handleCancelAll}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Limpar carrinho"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

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
                      <span>Câmera Ativa • Aponte para o Código</span>
                    </div>
                    <span className="text-[10px] text-gray-300 font-mono">Pronto</span>
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
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-bold flex items-center justify-between animate-fade-in">
                  <span>{scanNotice}</span>
                  <button onClick={() => setScanNotice(null)} className="text-amber-600 hover:text-amber-900 cursor-pointer">
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
                  Produtos Disponíveis no Clube VIP ({filteredOffers.length})
                </span>

                {filteredOffers.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-2xl text-xs font-medium">
                    {cart.length > 0 && availableOffers.length === 0
                      ? 'Todos os produtos disponíveis em oferta foram adicionados ao carrinho!'
                      : 'Nenhum produto ativo em oferta encontrado.'}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {filteredOffers.map((offer) => {
                      const daysLeft = calculateDaysRemaining(offer.dataValidade);
                      const barcode = getOfferBarcode(offer);
                      return (
                        <div
                          key={offer.id}
                          onClick={() => handleSelectOffer(offer)}
                          className="p-3 bg-white hover:bg-amber-50/80 border border-gray-200 hover:border-amber-300 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-extrabold text-xs text-gray-900 group-hover:text-amber-900 flex items-center gap-1.5 flex-wrap">
                              <span>{offer.nomeProduto}</span>
                              {barcode && (
                                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded">
                                  EAN: {barcode}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                              Vence em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} ({formatDateToBR(offer.dataValidade)})
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-2">
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

