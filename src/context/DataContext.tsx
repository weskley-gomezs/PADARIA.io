import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { StorageService } from '../services/storageService';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut } from 'firebase/auth';
import {
  BakeryCompany,
  Product,
  SaleHistoryItem,
  SupportTicket,
  DailyClosing,
  VipOffer,
  TicketPriority,
  TicketStatus,
  VipOfferStatus,
  BillingInfo,
  ContractInfo
} from '../types';
import { Unsubscribe } from 'firebase/firestore';

interface DataContextType {
  // Core states
  currentView: 'landing' | 'app' | 'admin';
  activeCode: string | null;
  activeCompany: BakeryCompany | null;
  products: Product[];
  salesHistory: SaleHistoryItem[];
  vipOffers: VipOffer[];
  dailyClosings: DailyClosing[];
  tickets: SupportTicket[];
  isAdminLoggedIn: boolean;
  isLoading: boolean;
  authUser: any;

  // Setters / Nav
  setCurrentView: (view: 'landing' | 'app' | 'admin') => void;
  setActiveCode: (code: string | null) => void;
  setIsAdminLoggedIn: (loggedIn: boolean) => void;

  // Auth operations
  loginAsBakery: (code: string) => Promise<boolean>;
  logoutBakery: () => void;
  loginAsAdmin: (password: string) => Promise<boolean>;
  logoutAdmin: () => void;

  // Product actions (with Optimistic Updates)
  addProduct: (
    nome: string,
    quantidade: number,
    dataValidade: string,
    categoria?: string,
    barcode?: string,
    valorKg?: number,
    dataFabricacao?: string,
    valorTotal?: number,
    motivo?: string,
    notas?: string,
    peso?: number
  ) => Promise<Product>;
  updateProduct: (
    id: string,
    nome: string,
    quantidade: number,
    dataValidade: string,
    categoria?: string,
    barcode?: string,
    valorKg?: number,
    dataFabricacao?: string,
    valorTotal?: number,
    motivo?: string,
    notas?: string,
    peso?: number
  ) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  markAsSold: (id: string) => Promise<SaleHistoryItem | null>;
  restoreSoldProduct: (historyId: string) => Promise<Product | null>;
  clearSalesHistory: () => Promise<void>;

  // VIP Offers actions (with Optimistic Updates)
  addVipOffer: (
    productId: string,
    nomeProduto: string,
    categoria: string,
    valorOriginal: number,
    valorPromocional: number,
    desconto: number,
    dataValidade: string,
    barcode?: string
  ) => Promise<VipOffer>;
  updateVipOfferStatus: (id: string, status: VipOfferStatus) => Promise<VipOffer | null>;
  updateVipOffer: (
    id: string,
    updates: {
      valorOriginal?: number;
      valorPromocional?: number;
      desconto?: number;
      nomeProduto?: string;
    }
  ) => Promise<VipOffer | null>;
  deleteVipOffer: (id: string) => Promise<void>;

  // Support / Tickets
  createTicket: (
    assunto: string,
    descricao: string,
    prioridade: TicketPriority
  ) => Promise<SupportTicket>;
  updateTicketStatus: (id: string, status: TicketStatus) => Promise<SupportTicket | null>;

  // Daily Closings
  saveDailyClosing: (closing: Omit<DailyClosing, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<DailyClosing>;

  // Admin company actions
  addCompany: (
    empresa: string,
    email: string,
    senha?: string,
    telefone?: string,
    cnpj?: string,
    diasTesteGratis?: number,
    valorMensalidade?: number
  ) => Promise<BakeryCompany>;
  toggleCompanyStatus: (code: string) => Promise<boolean>;
  deleteCompany: (code: string) => Promise<void>;
  updateCompanyBilling: (code: string, updates: Partial<BillingInfo>) => Promise<BakeryCompany | undefined>;
  updateCompanyContract: (code: string, updates: Partial<ContractInfo>) => Promise<BakeryCompany | undefined>;
  updateCompanyPassword: (code: string, newPass: string) => Promise<BakeryCompany | undefined>;
  updateCompanyCNPJ: (code: string, cnpj: string) => Promise<BakeryCompany | undefined>;
  deleteCompaniesWithoutCNPJ: () => Promise<number>;
  clearAllSystemData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<'landing' | 'app' | 'admin'>(() => {
    if (window.location.pathname.startsWith('/admin')) return 'admin';
    if (window.location.pathname.startsWith('/app')) return 'app';
    return 'landing';
  });

  const [activeCode, setActiveCodeState] = useState<string | null>(null);
  const [activeCompany, setActiveCompany] = useState<BakeryCompany | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleHistoryItem[]>([]);
  const [vipOffers, setVipOffers] = useState<VipOffer[]>([]);
  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync state with path parameter
  const handleSetCurrentView = useCallback((view: 'landing' | 'app' | 'admin') => {
    setCurrentView(view);
    try {
      let targetPath = '/';
      if (view === 'admin') targetPath = '/admin';
      if (view === 'app') targetPath = '/app';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    } catch (e) {
      // Ignored in sandbox
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const setActiveCode = useCallback((code: string | null) => {
    StorageService.setActiveBakeryCode(code);
    setActiveCodeState(code);
  }, []);

  // Initialize service & Firebase Auth listener
  useEffect(() => {
    const init = async () => {
      await StorageService.init();
      setIsAdminLoggedIn(StorageService.isAdminAuthenticated());
    };
    init();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        const mapping = await StorageService.getUserBakeryMapping(user.uid);
        if (mapping && mapping.bakeryCode) {
          setActiveCodeState(mapping.bakeryCode);
          StorageService.setActiveBakeryCode(mapping.bakeryCode);
        } else {
          const code = StorageService.getActiveBakeryCode();
          if (code) {
            await StorageService.setUserBakeryMapping(user.uid, code, user.email || `${code.toLowerCase()}@padaria.io`, 'owner');
            setActiveCodeState(code);
          }
        }
      } else {
        setActiveCodeState(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load and cache tenant data on demand when tenant changes (with race condition prevention)
  const fetchGenerationRef = useRef(0);
  const refreshTenantData = useCallback(async (code: string) => {
    const currentGen = ++fetchGenerationRef.current;
    setIsLoading(true);
    try {
      const [prods, sales, vips, closings, ticks] = await Promise.all([
        StorageService.getProductsFromServer(code),
        StorageService.getSalesHistoryFromServer(code),
        StorageService.getVipOffersFromServer(code),
        StorageService.getDailyClosingsFromServer(code),
        StorageService.getTicketsFromServer(code)
      ]);
      if (currentGen === fetchGenerationRef.current) {
        setProducts(prods);
        setSalesHistory(sales);
        setVipOffers(vips);
        setDailyClosings(closings);
        setTickets(ticks);
      }
    } catch (e) {
      if (currentGen === fetchGenerationRef.current) {
        console.error('Error fetching tenant data on-demand:', e);
      }
    } finally {
      if (currentGen === fetchGenerationRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Real-time Subscriptions Manager (Only keep the singular active company status listener)
  useEffect(() => {
    let unsubs: Unsubscribe[] = [];

    if (activeCode) {
      // 1. Single Company Listener (High-end real-time security & status monitoring)
      const unsubComp = StorageService.subscribeCompany(activeCode, (comp) => {
        if (comp && comp.ativo) {
          setActiveCompany(comp);
        } else {
          setActiveCompany(null);
          if (comp && !comp.ativo) {
            setActiveCode(null);
          }
        }
      });
      unsubs.push(unsubComp);

      // Trigger server-side pull for other items immediately upon change (on-demand)
      refreshTenantData(activeCode);
    } else {
      setActiveCompany(null);
      setProducts([]);
      setSalesHistory([]);
      setVipOffers([]);
      setDailyClosings([]);
      setTickets([]);
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [activeCode, refreshTenantData]);

  // Load Admin Support Tickets on demand when viewing Admin or LoggedIn
  useEffect(() => {
    if ((isAdminLoggedIn || currentView === 'admin') && !activeCode) {
      StorageService.getTicketsFromServer().then((allTickets) => {
        setTickets(allTickets);
      }).catch(err => {
        console.error('Error fetching admin tickets:', err);
      });
    }
  }, [isAdminLoggedIn, currentView, activeCode]);

  // Auth handlers (Firebase Auth integrated)
  const loginAsBakery = async (code: string): Promise<boolean> => {
    const trimmedCode = code.trim().toUpperCase();
    const companies = StorageService.getCompanies();
    const found = companies.find(
      (c) => c.codigoAtivacao.toUpperCase() === trimmedCode
    );
    if (!found || !found.ativo) {
      return false;
    }

    try {
      const email = found.email || `${trimmedCode.toLowerCase()}@padaria.io`;
      const password = found.senha || `Padaria@${trimmedCode}!2026`;

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr) {
        try {
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } catch (createErr) {
          userCredential = await signInAnonymously(auth);
        }
      }

      const user = userCredential.user;
      await StorageService.setUserBakeryMapping(user.uid, trimmedCode, email, 'owner');
      setActiveCode(trimmedCode);
      return true;
    } catch (e) {
      console.error('Error during secure loginAsBakery:', e);
      setActiveCode(trimmedCode);
      return true;
    }
  };

  const logoutBakery = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out from Firebase Auth:', e);
    }

    if (activeCode) {
      const code = activeCode.trim().toUpperCase();
      localStorage.removeItem(`padarias_products_${code}`);
      localStorage.removeItem(`padarias_sales_history_${code}`);
      localStorage.removeItem(`padarias_vip_offers_${code}`);
      localStorage.removeItem(`padarias_fechamentos_${code}`);
      localStorage.removeItem(`padarias_tickets_${code}`);
    }
    localStorage.removeItem('padarias_products_v1');
    localStorage.removeItem('padarias_sales_history_v1');
    localStorage.removeItem('padarias_vip_offers_v1');
    localStorage.removeItem('padarias_fechamentos_v1');
    localStorage.removeItem('padarias_tickets_v1');

    setAuthUser(null);
    setActiveCode(null);
    setActiveCompany(null);
    setProducts([]);
    setSalesHistory([]);
    setVipOffers([]);
    setDailyClosings([]);
    setTickets([]);
  };

  const loginAsAdmin = async (password: string): Promise<boolean> => {
    if (password === 'admin123') { // standard simple check
      StorageService.setAdminAuthenticated(true);
      setIsAdminLoggedIn(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    StorageService.setAdminAuthenticated(false);
    setIsAdminLoggedIn(false);
  };

  // ----------------------------------------------------
  // PRODUCT OPERATIONS (with Optimistic Updates)
  // ----------------------------------------------------
  const addProduct = async (
    nome: string,
    quantidade: number,
    dataValidade: string,
    categoria?: string,
    barcode?: string,
    valorKg?: number,
    dataFabricacao?: string,
    valorTotal?: number,
    motivo?: string,
    notas?: string,
    peso?: number
  ): Promise<Product> => {
    if (!activeCode) throw new Error('Bakery code required');

    const tempId = 'temp_' + Date.now();
    const optProduct: Product = {
      id: tempId,
      bakeryCode: activeCode,
      nome,
      quantidade,
      dataValidade,
      categoria: categoria || 'Geral',
      barcode,
      valorKg,
      dataFabricacao,
      valorTotal,
      motivo,
      notas,
      peso,
      dataCadastro: new Date().toISOString().split('T')[0],
      status: 'normal',
      diasParaVencer: 10
    };

    // Optimistic state insert
    setProducts((prev) => [optProduct, ...prev]);

    try {
      const realProduct = await StorageService.addProduct(
        activeCode,
        nome,
        quantidade,
        dataValidade,
        categoria,
        barcode,
        valorKg,
        dataFabricacao,
        valorTotal,
        motivo,
        notas,
        peso
      );
      // Replace optimistic temp item with the real persisted one
      setProducts((prev) => prev.map((p) => (p.id === tempId ? realProduct : p)));
      return realProduct;
    } catch (err) {
      // Rollback optimistic insert
      setProducts((prev) => prev.filter((p) => p.id !== tempId));
      throw err;
    }
  };

  const updateProduct = async (
    id: string,
    nome: string,
    quantidade: number,
    dataValidade: string,
    categoria?: string,
    barcode?: string,
    valorKg?: number,
    dataFabricacao?: string,
    valorTotal?: number,
    motivo?: string,
    notas?: string,
    peso?: number
  ): Promise<Product> => {
    if (!activeCode) throw new Error('Bakery code required');

    const original = products.find((p) => p.id === id);
    if (!original) throw new Error('Product not found');

    const optUpdated: Product = {
      ...original,
      nome,
      quantidade,
      dataValidade,
      categoria: categoria || 'Geral',
      barcode,
      valorKg,
      dataFabricacao,
      valorTotal,
      motivo,
      notas,
      peso
    };

    // Optimistic update
    setProducts((prev) => prev.map((p) => (p.id === id ? optUpdated : p)));

    try {
      const realUpdated = await StorageService.updateProduct(
        id,
        nome,
        quantidade,
        dataValidade,
        categoria,
        barcode,
        valorKg,
        dataFabricacao,
        valorTotal,
        motivo,
        notas,
        peso
      );
      setProducts((prev) => prev.map((p) => (p.id === id ? realUpdated : p)));
      return realUpdated;
    } catch (err) {
      // Rollback
      setProducts((prev) => prev.map((p) => (p.id === id ? original : p)));
      throw err;
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    const original = products.find((p) => p.id === id);
    if (!original) return;

    // Optimistic delete
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      await StorageService.deleteProduct(id);
    } catch (err) {
      // Rollback
      setProducts((prev) => [original, ...prev]);
      throw err;
    }
  };

  const markAsSold = async (id: string): Promise<SaleHistoryItem | null> => {
    const product = products.find((p) => p.id === id);
    if (!product) return null;

    // Optimistic local state modification
    setProducts((prev) => prev.filter((p) => p.id !== id));
    const tempSale: SaleHistoryItem = {
      id: 'temp_sale_' + id,
      produtoId: id,
      bakeryCode: activeCode || '',
      nomeProduto: product.nome,
      quantidade: product.quantidade,
      dataValidade: product.dataValidade,
      dataVenda: new Date().toISOString()
    };
    setSalesHistory((prev) => [tempSale, ...prev]);

    try {
      const sale = await StorageService.markAsSold(id);
      if (sale) {
        setSalesHistory((prev) => prev.map((s) => (s.id === tempSale.id ? sale : s)));
      }
      return sale;
    } catch (err) {
      // Rollback
      setProducts((prev) => [product, ...prev]);
      setSalesHistory((prev) => prev.filter((s) => s.id !== tempSale.id));
      throw err;
    }
  };

  const restoreSoldProduct = async (historyId: string): Promise<Product | null> => {
    const saleItem = salesHistory.find((s) => s.id === historyId);
    if (!saleItem) return null;

    // Optimistic local state modification
    setSalesHistory((prev) => prev.filter((s) => s.id !== historyId));

    try {
      const restored = await StorageService.restoreSoldProduct(historyId);
      return restored;
    } catch (err) {
      // Rollback
      setSalesHistory((prev) => [saleItem, ...prev]);
      throw err;
    }
  };

  const clearSalesHistory = async (): Promise<void> => {
    if (!activeCode) return;
    const originalSales = [...salesHistory];

    setSalesHistory([]);

    try {
      await StorageService.clearSalesHistory(activeCode);
    } catch (err) {
      setSalesHistory(originalSales);
      throw err;
    }
  };

  // ----------------------------------------------------
  // VIP OFFERS OPERATIONS (with Optimistic Updates)
  // ----------------------------------------------------
  const addVipOffer = async (
    productId: string,
    nomeProduto: string,
    categoria: string,
    valorOriginal: number,
    valorPromocional: number,
    desconto: number,
    dataValidade: string,
    barcode?: string
  ): Promise<VipOffer> => {
    if (!activeCode) throw new Error('Bakery code required');

    const tempId = 'temp_vip_' + Date.now();
    const optOffer: VipOffer = {
      id: tempId,
      bakeryCode: activeCode,
      productId,
      nomeProduto,
      categoria,
      valorOriginal,
      valorPromocional,
      desconto,
      dataValidade,
      barcode,
      diasParaVencer: 1,
      status: 'ativo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setVipOffers((prev) => [optOffer, ...prev]);

    try {
      const realOffer = await StorageService.addVipOffer(
        activeCode,
        productId,
        nomeProduto,
        categoria,
        valorOriginal,
        valorPromocional,
        desconto,
        dataValidade,
        barcode
      );
      setVipOffers((prev) => prev.map((o) => (o.id === tempId ? realOffer : o)));
      return realOffer;
    } catch (err) {
      setVipOffers((prev) => prev.filter((o) => o.id !== tempId));
      throw err;
    }
  };

  const updateVipOfferStatus = async (id: string, status: VipOfferStatus): Promise<VipOffer | null> => {
    const original = vipOffers.find((o) => o.id === id);
    if (!original) return null;

    const optUpdated: VipOffer = { ...original, status, updatedAt: new Date().toISOString() };
    setVipOffers((prev) => prev.map((o) => (o.id === id ? optUpdated : o)));

    try {
      const res = await StorageService.updateVipOfferStatus(id, status);
      return res;
    } catch (err) {
      setVipOffers((prev) => prev.map((o) => (o.id === id ? original : o)));
      throw err;
    }
  };

  const updateVipOffer = async (
    id: string,
    updates: {
      valorOriginal?: number;
      valorPromocional?: number;
      desconto?: number;
      nomeProduto?: string;
    }
  ): Promise<VipOffer | null> => {
    const original = vipOffers.find((o) => o.id === id);
    if (!original) return null;

    const optUpdated: VipOffer = {
      ...original,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setVipOffers((prev) => prev.map((o) => (o.id === id ? optUpdated : o)));

    try {
      const res = await StorageService.updateVipOffer(id, updates);
      return res;
    } catch (err) {
      setVipOffers((prev) => prev.map((o) => (o.id === id ? original : o)));
      throw err;
    }
  };

  const deleteVipOffer = async (id: string): Promise<void> => {
    const original = vipOffers.find((o) => o.id === id);
    if (!original) return;

    setVipOffers((prev) => prev.filter((o) => o.id !== id));

    try {
      await StorageService.deleteVipOffer(id);
    } catch (err) {
      setVipOffers((prev) => [original, ...prev]);
      throw err;
    }
  };

  // ----------------------------------------------------
  // SUPPORT TICKETS (with Optimistic Updates)
  // ----------------------------------------------------
  const createTicket = async (
    assunto: string,
    descricao: string,
    prioridade: TicketPriority
  ): Promise<SupportTicket> => {
    if (!activeCode) throw new Error('Bakery code required');
    const companyName = activeCompany?.empresa || 'Minha Padaria';

    const tempId = 'temp_ticket_' + Date.now();
    const optTicket: SupportTicket = {
      id: tempId,
      bakeryCode: activeCode,
      empresaNome: companyName,
      assunto,
      descricao,
      prioridade,
      status: 'aberto',
      dataCriacao: new Date().toISOString()
    };

    setTickets((prev) => [optTicket, ...prev]);

    try {
      const realTicket = await StorageService.createTicket(activeCode, companyName, assunto, descricao, prioridade);
      setTickets((prev) => prev.map((t) => (t.id === tempId ? realTicket : t)));
      return realTicket;
    } catch (err) {
      setTickets((prev) => prev.filter((t) => t.id !== tempId));
      throw err;
    }
  };

  const updateTicketStatus = async (id: string, status: TicketStatus): Promise<SupportTicket | null> => {
    const original = tickets.find((t) => t.id === id);
    if (!original) return null;

    const optUpdated: SupportTicket = { ...original, status };
    setTickets((prev) => prev.map((t) => (t.id === id ? optUpdated : t)));

    try {
      const res = await StorageService.updateTicketStatus(id, status);
      return res;
    } catch (err) {
      setTickets((prev) => prev.map((t) => (t.id === id ? original : t)));
      throw err;
    }
  };

  // ----------------------------------------------------
  // DAILY CLOSINGS
  // ----------------------------------------------------
  const saveDailyClosing = async (
    closing: Omit<DailyClosing, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<DailyClosing> => {
    const realClosing = await StorageService.saveDailyClosing(closing);
    // Since subscribeDailyClosings list updates, it will merge normally. We can also optimistically set it:
    setDailyClosings((prev) => {
      const filtered = prev.filter((c) => c.id !== realClosing.id);
      return [realClosing, ...filtered];
    });
    return realClosing;
  };

  // ----------------------------------------------------
  // ADMIN ACTIONS (COMPANIES PERSISTENCE)
  // ----------------------------------------------------
  const addCompany = async (
    empresa: string,
    email: string,
    senha?: string,
    telefone?: string,
    cnpj?: string,
    diasTesteGratis?: number,
    valorMensalidade?: number
  ): Promise<BakeryCompany> => {
    const comp = await StorageService.addCompany(
      empresa,
      email,
      senha,
      telefone,
      cnpj,
      diasTesteGratis,
      valorMensalidade
    );
    return comp;
  };

  const toggleCompanyStatus = async (code: string): Promise<boolean> => {
    const res = await StorageService.toggleCompanyStatus(code);
    return res;
  };

  const deleteCompany = async (code: string): Promise<void> => {
    await StorageService.deleteCompany(code);
  };

  const updateCompanyBilling = async (code: string, updates: Partial<BillingInfo>): Promise<BakeryCompany | undefined> => {
    const res = await StorageService.updateCompanyBilling(code, updates);
    return res;
  };

  const updateCompanyContract = async (code: string, updates: Partial<ContractInfo>): Promise<BakeryCompany | undefined> => {
    const res = await StorageService.updateCompanyContract(code, updates);
    return res;
  };

  const updateCompanyPassword = async (code: string, newPass: string): Promise<BakeryCompany | undefined> => {
    const res = await StorageService.updateCompanyPassword(code, newPass);
    return res;
  };

  const updateCompanyCNPJ = async (code: string, cnpj: string): Promise<BakeryCompany | undefined> => {
    const res = await StorageService.updateCompanyCNPJ(code, cnpj);
    return res;
  };

  const deleteCompaniesWithoutCNPJ = async (): Promise<number> => {
    const count = await StorageService.deleteCompaniesWithoutCNPJ();
    return count;
  };

  const clearAllSystemData = async (): Promise<void> => {
    await StorageService.clearAllSystemData();
    logoutBakery();
  };

  return (
    <DataContext.Provider
      value={{
        currentView,
        activeCode,
        activeCompany,
        products,
        salesHistory,
        vipOffers,
        dailyClosings,
        tickets,
        isAdminLoggedIn,
        isLoading,
        authUser,

        setCurrentView: handleSetCurrentView,
        setActiveCode,
        setIsAdminLoggedIn,

        loginAsBakery,
        logoutBakery,
        loginAsAdmin,
        logoutAdmin,

        addProduct,
        updateProduct,
        deleteProduct,
        markAsSold,
        restoreSoldProduct,
        clearSalesHistory,

        addVipOffer,
        updateVipOfferStatus,
        updateVipOffer,
        deleteVipOffer,

        createTicket,
        updateTicketStatus,

        saveDailyClosing,

        addCompany,
        toggleCompanyStatus,
        deleteCompany,
        updateCompanyBilling,
        updateCompanyContract,
        updateCompanyPassword,
        updateCompanyCNPJ,
        deleteCompaniesWithoutCNPJ,
        clearAllSystemData
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
