import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { StorageService } from '../services/storageService';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut } from 'firebase/auth';
import {
  BakeryCompany,
  Product,
  ProductStatus,
  SaleHistoryItem,
  SupportTicket,
  DailyClosing,
  VipOffer,
  TicketPriority,
  TicketStatus,
  VipOfferStatus,
  BillingInfo,
  ContractInfo,
  InventoryMovement,
  StockCount,
  MovementType,
  InventoryItem,
  OperationalTask,
  TaskShift,
  TaskStatus,
  TaskCategory
} from '../types';
import { Unsubscribe } from 'firebase/firestore';
import { formatDateToISO } from '../utils/dateUtils';

export const DEFAULT_CATEGORIES = [
  'Panificação',
  'Confeitaria',
  'Laticínios',
  'Frios & Embutidos',
  'Salgados',
  'Bebidas',
  'Embalados',
  'Geral',
];

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
  inventoryMovements: InventoryMovement[];
  stockCounts: StockCount[];
  inventoryItems: InventoryItem[];
  operationalTasks: OperationalTask[];
  isAdminLoggedIn: boolean;
  isLoading: boolean;
  authUser: any;

  // Setters / Nav
  setCurrentView: (view: 'landing' | 'app' | 'admin') => void;
  setActiveCode: (code: string | null) => void;
  setIsAdminLoggedIn: (loggedIn: boolean) => void;

  // Auth operations
  loginAsBakery: (code: string) => Promise<boolean>;
  loginAsBakeryWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
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

  // Inventory & Physical Stock Control
  addMovement: (
    productId: string,
    productName: string,
    type: MovementType,
    quantity: number,
    unit?: string,
    costAtMovement?: number,
    reason?: string
  ) => Promise<InventoryMovement>;
  addStockCount: (
    productId: string,
    productName: string,
    initialQuantity: number,
    entriesQuantity: number,
    productionQuantity: number,
    wasteQuantity: number,
    expectedQuantity: number,
    physicalQuantity: number,
    unit?: string,
    unitCost?: number,
    notes?: string
  ) => Promise<StockCount>;
  addInventoryItem: (
    name: string,
    unit: string,
    initialQuantity: number,
    unitCost: number,
    category?: string
  ) => Promise<InventoryItem>;
  updateInventoryItem: (
    id: string,
    name: string,
    unitCost?: number,
    unit?: string,
    category?: string
  ) => Promise<InventoryItem>;
  deleteInventoryItem: (id: string) => Promise<void>;
  calculateExpectedStock: (productId: string) => {
    expected: number;
    initial: number;
    entries: number;
    sales: number;
    waste: number;
    adjustments: number;
    unit: string;
    cost: number;
  };

  // Operational Routines / Team Tasks
  addOperationalTask: (taskData: Omit<OperationalTask, 'id' | 'createdAt'>) => Promise<OperationalTask>;
  updateOperationalTask: (id: string, updates: Partial<OperationalTask>) => Promise<OperationalTask | null>;
  toggleOperationalTask: (id: string, completedBy?: string, notes?: string) => Promise<OperationalTask | null>;
  deleteOperationalTask: (id: string) => Promise<void>;

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

  // Category management
  categories: string[];
  addCategory: (categoryName: string) => Promise<boolean>;
  renameCategory: (oldName: string, newName: string) => Promise<boolean>;
  deleteCategory: (categoryName: string, fallbackCategory?: string) => Promise<boolean>;
  resetCategories: () => Promise<boolean>;
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
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [operationalTasks, setOperationalTasks] = useState<OperationalTask[]>([]);
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

  const isAdminEmail = (email?: string | null) => email === 'admin@padariaio.com.br' || email === 'weskleyg4000@gmail.com';

  const setActiveCode = useCallback((code: string | null) => {
    const cleanCode = code ? code.trim().toUpperCase() : null;
    StorageService.setActiveBakeryCode(cleanCode);
    setActiveCodeState(cleanCode);
    if (cleanCode && auth.currentUser && !isAdminEmail(auth.currentUser.email)) {
      StorageService.setUserBakeryMapping(
        auth.currentUser.uid,
        cleanCode,
        auth.currentUser.email || `${cleanCode.toLowerCase()}@padariaio.com.br`,
        'owner'
      ).catch(() => {});
    }
  }, []);

  // Initialize service & Firebase Auth listener
  useEffect(() => {
    const init = async () => {
      await StorageService.init();
    };
    init();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('[AUTH] Confirmed user session:', user.uid, user.email);
        if (isAdminEmail(user.email)) {
          const savedCode = StorageService.getActiveBakeryCode();
          if (savedCode) {
            setActiveCodeState(savedCode);
            const comp = await StorageService.getCompanyByCodeAsync(savedCode);
            if (comp) {
              setActiveCompany(comp);
            } else {
              setActiveCompany(null);
            }
          } else {
            setActiveCodeState(null);
            setActiveCompany(null);
          }
          setIsAdminLoggedIn(true);
          setAuthUser(user);
        } else {
          let mapping = await StorageService.getUserBakeryMapping(user.uid);
          if (!mapping || !mapping.bakeryCode) {
            const code = StorageService.getActiveBakeryCode();
            if (code) {
              await StorageService.setUserBakeryMapping(user.uid, code, user.email || `${code.toLowerCase()}@padariaio.com.br`, 'owner');
              mapping = { bakeryCode: code, role: 'owner' };
            }
          }
          if (mapping && mapping.bakeryCode) {
            const cleanCode = mapping.bakeryCode.trim().toUpperCase();
            await StorageService.setUserBakeryMapping(user.uid, cleanCode, user.email || `${cleanCode.toLowerCase()}@padariaio.com.br`, mapping.role || 'owner');
            StorageService.setActiveBakeryCode(cleanCode);
            const comp = await StorageService.getCompanyByCodeAsync(cleanCode);
            if (comp) setActiveCompany(comp);
            setActiveCodeState(cleanCode);
            setAuthUser(user);
          } else {
            setAuthUser(user);
          }
        }
      } else {
        console.log('[AUTH] No user session found - resetting active tenant and state');
        setAuthUser(null);
        setActiveCodeState(null);
        setActiveCompany(null);
        StorageService.setActiveBakeryCode(null);
        setProducts([]);
        setSalesHistory([]);
        setVipOffers([]);
        setDailyClosings([]);
        setTickets([]);
        setInventoryMovements([]);
        setStockCounts([]);
        setInventoryItems([]);
        setOperationalTasks([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load and cache tenant data on demand when tenant changes (with race condition prevention)
  const fetchGenerationRef = useRef(0);
  const refreshTenantData = useCallback(async (code: string, showLoading = false) => {
    if (!auth.currentUser) {
      console.warn('[DATA] Skipping refreshTenantData: auth.currentUser is null');
      return;
    }
    const cleanCode = code.trim().toUpperCase();
    if (!isAdminEmail(auth.currentUser.email)) {
      await StorageService.setUserBakeryMapping(
        auth.currentUser.uid,
        cleanCode,
        auth.currentUser.email || `${cleanCode.toLowerCase()}@padariaio.com.br`,
        'owner'
      );
    }
    const currentGen = ++fetchGenerationRef.current;
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const [prods, sales, vips, closings, ticks, movs, counts, invItems, tasks] = await Promise.all([
        StorageService.getProductsFromServer(cleanCode),
        StorageService.getSalesHistoryFromServer(cleanCode),
        StorageService.getVipOffersFromServer(cleanCode),
        StorageService.getDailyClosingsFromServer(cleanCode),
        StorageService.getTicketsFromServer(cleanCode),
        StorageService.getInventoryMovementsFromServer(cleanCode),
        StorageService.getStockCountsFromServer(cleanCode),
        StorageService.getInventoryItemsFromServer(cleanCode),
        StorageService.getOperationalTasksFromServer(cleanCode)
      ]);
      if (currentGen === fetchGenerationRef.current) {
        setProducts(prods);
        setSalesHistory(sales);
        setVipOffers(vips);
        setDailyClosings(closings);
        setTickets(ticks);
        setInventoryMovements(movs);
        setStockCounts(counts);
        setInventoryItems(invItems);
        setOperationalTasks(tasks);
      }
    } catch (e) {
      if (currentGen === fetchGenerationRef.current) {
        console.error('Error fetching tenant data on-demand:', e);
      }
    } finally {
      if (showLoading && currentGen === fetchGenerationRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Real-time Subscriptions Manager (Strictly Gated on authUser)
  useEffect(() => {
    let unsubs: Unsubscribe[] = [];

    if (authUser && activeCode) {
      console.log('[DATA] Initializing tenant subscriptions for:', activeCode, 'User:', authUser.uid);
      // 1. Fetch current active company immediately
      StorageService.getCompanyByCodeAsync(activeCode).then((comp) => {
        if (comp && (comp.ativo || isAdminEmail(authUser.email))) {
          setActiveCompany(comp);
        } else if (comp && !comp.ativo) {
          setActiveCompany(null);
          setActiveCode(null);
        }
      });

      // 2. Single Company Listener
      try {
        const unsubComp = StorageService.subscribeCompany(activeCode, (comp) => {
          if (comp && (comp.ativo || isAdminEmail(authUser.email))) {
            setActiveCompany(comp);
          } else {
            setActiveCompany(null);
            if (comp && !comp.ativo) {
              setActiveCode(null);
            }
          }
        });
        unsubs.push(unsubComp);
      } catch (err) {
        console.warn('Error subscribing to company:', err);
      }

      // Trigger server-side pull for other items immediately upon change
      refreshTenantData(activeCode, true);
    } else {
      setActiveCompany(null);
      setProducts([]);
      setSalesHistory([]);
      setVipOffers([]);
      setDailyClosings([]);
      setTickets([]);
      setInventoryMovements([]);
      setStockCounts([]);
      setInventoryItems([]);
      setOperationalTasks([]);
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [authUser, activeCode, refreshTenantData]);

  // Load Admin Support Tickets on demand when viewing Admin or LoggedIn
  useEffect(() => {
    if (isAdminLoggedIn && !activeCode && authUser && isAdminEmail(authUser.email)) {
      StorageService.getTicketsFromServer().then((allTickets) => {
        setTickets(allTickets);
      }).catch(err => {
        console.error('Error fetching admin tickets:', err);
      });
    }
  }, [isAdminLoggedIn, activeCode, authUser]);

  // Auth handlers
  const loginAsBakeryWithCredentials = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = pass.trim();

      const comp = await StorageService.getCompanyByCredentialsAsync(cleanEmail, cleanPass);
      if (!comp) {
        setIsLoading(false);
        return { success: false, error: 'E-mail ou senha incorretos. Verifique suas credenciais ou solicite apoio ao suporte.' };
      }

      if (!comp.ativo) {
        setIsLoading(false);
        return { success: false, error: 'Esta panificadora está desativada. Solicite a reativação no Painel Admin.' };
      }

      const todayStr = formatDateToISO(new Date());
      if (comp.financeiro?.dataFimTeste && todayStr > comp.financeiro.dataFimTeste) {
        const isPaid = comp.financeiro.statusAssinatura === 'ativo' || comp.financeiro.statusAssinatura === 'concluido';
        if (!isPaid) {
          setIsLoading(false);
          return { success: false, error: 'O período de teste da sua panificadora expirou. Entre em contato para reativação.' };
        }
      }

      const authEmail = comp.email || `${comp.codigoAtivacao.toLowerCase()}@padariaio.com.br`;
      const authPassword = comp.senha || `Padaria@${comp.codigoAtivacao}!2026`;

      // Pre-set active code to prevent async onAuthStateChanged race conditions
      StorageService.setActiveBakeryCode(comp.codigoAtivacao);
      setActiveCodeState(comp.codigoAtivacao);

      let user: any = null;
      try {
        const cred = await signInWithEmailAndPassword(auth, authEmail, authPassword);
        user = cred.user;
      } catch (signInErr) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
          user = cred.user;
        } catch (createErr) {
          try {
            const cred = await signInAnonymously(auth);
            user = cred.user;
          } catch (anonErr) {
            console.warn('Firebase auth fallback warning:', anonErr);
          }
        }
      }

      if (user) {
        await StorageService.setUserBakeryMapping(user.uid, comp.codigoAtivacao, authEmail, 'owner');
        setAuthUser(user);
      } else {
        setAuthUser({ uid: 'local_' + comp.codigoAtivacao, email: authEmail });
      }

      StorageService.setActiveBakeryCode(comp.codigoAtivacao);
      setActiveCode(comp.codigoAtivacao);
      setActiveCompany(comp);

      await refreshTenantData(comp.codigoAtivacao, false);

      setIsLoading(false);
      return { success: true };
    } catch (e: any) {
      console.error('Error in loginAsBakeryWithCredentials:', e);
      setIsLoading(false);
      return { success: false, error: e.message || 'Erro inesperado ao realizar login.' };
    }
  };

  const loginAsBakery = async (code: string): Promise<boolean> => {
    const trimmedCode = code.trim().toUpperCase();
    const comp = await StorageService.getCompanyByCodeAsync(trimmedCode);
    if (!comp || !comp.ativo) {
      return false;
    }

    try {
      const email = comp.email || `${trimmedCode.toLowerCase()}@padariaio.com.br`;
      const password = comp.senha || `Padaria@${trimmedCode}!2026`;

      // Pre-set active code to prevent async onAuthStateChanged race conditions
      StorageService.setActiveBakeryCode(trimmedCode);
      setActiveCodeState(trimmedCode);

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
      setAuthUser(user);
      setActiveCompany(comp);
      StorageService.setActiveBakeryCode(trimmedCode);
      setActiveCode(trimmedCode);
      await refreshTenantData(trimmedCode, false);
      return true;
    } catch (e) {
      console.error('Error during secure loginAsBakery:', e);
      setActiveCompany(comp);
      StorageService.setActiveBakeryCode(trimmedCode);
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
    // Password-based admin login is disabled for zero-trust security.
    console.warn('[SECURITY] Tentativa de login administrativo por senha desativada.');
    return false;
  };

  const logoutAdmin = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out admin from Firebase Auth:', e);
    }
    setIsAdminLoggedIn(false);
    setAuthUser(null);
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
    peso?: number,
    statusOverride?: ProductStatus
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
      status: statusOverride || 'normal',
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
        peso,
        statusOverride
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
      if (sale && activeCode) {
        setSalesHistory((prev) => prev.map((s) => (s.id === tempSale.id ? sale : s)));
        // Record automatic SALE movement
        StorageService.addInventoryMovement(
          activeCode,
          product.id,
          product.nome,
          'SALE',
          product.quantidade,
          product.unidade || (product.peso ? 'kg' : 'unidade'),
          product.valorKg || (product.valorTotal && product.quantidade ? product.valorTotal / product.quantidade : 0) || 0,
          'Venda registrada no sistema',
          authUser?.email
        ).catch(() => {});
      }
      return sale;
    } catch (err) {
      // Rollback
      setProducts((prev) => [product, ...prev]);
      setSalesHistory((prev) => prev.filter((s) => s.id !== tempSale.id));
      throw err;
    }
  };

  // Stock Control Methods
  const addMovement = async (
    productId: string,
    productName: string,
    type: MovementType,
    quantity: number,
    unit: string = 'kg',
    costAtMovement: number = 0,
    reason?: string
  ): Promise<InventoryMovement> => {
    if (!activeCode) throw new Error('Bakery code required');

    const tempMovement: InventoryMovement = {
      id: 'temp_mov_' + Date.now(),
      bakeryCode: activeCode,
      productId,
      productName,
      type,
      quantity,
      unit,
      costAtMovement,
      reason,
      createdAt: new Date().toISOString(),
      createdBy: authUser?.email || 'sistema'
    };

    setInventoryMovements((prev) => [tempMovement, ...prev]);

    try {
      const realMov = await StorageService.addInventoryMovement(
        activeCode,
        productId,
        productName,
        type,
        quantity,
        unit,
        costAtMovement,
        reason,
        authUser?.email
      );
      setInventoryMovements((prev) => prev.map((m) => (m.id === tempMovement.id ? realMov : m)));
      return realMov;
    } catch (err) {
      setInventoryMovements((prev) => prev.filter((m) => m.id !== tempMovement.id));
      throw err;
    }
  };

  const addStockCount = async (
    productId: string,
    productName: string,
    initialQuantity: number,
    entriesQuantity: number,
    productionQuantity: number,
    wasteQuantity: number,
    expectedQuantity: number,
    physicalQuantity: number,
    unit: string = 'kg',
    unitCost: number = 0,
    notes?: string
  ): Promise<StockCount> => {
    if (!activeCode) throw new Error('Bakery code required');

    const initial = Number(initialQuantity) || 0;
    const entries = Number(entriesQuantity) || 0;
    const production = Number(productionQuantity) || 0;
    const waste = Number(wasteQuantity) || 0;
    const expected = Number(expectedQuantity) || (initial + entries - production - waste);
    const physical = Number(physicalQuantity) || 0;
    const varianceQty = Number((physical - expected).toFixed(3));
    const varianceVal = Number((Math.abs(varianceQty) * unitCost).toFixed(2));

    const tempCount: StockCount = {
      id: 'temp_count_' + Date.now(),
      bakeryCode: activeCode,
      productId,
      productName,
      initialQuantity: initial,
      entriesQuantity: entries,
      productionQuantity: production,
      wasteQuantity: waste,
      expectedQuantity: expected,
      physicalQuantity: physical,
      varianceQuantity: varianceQty,
      varianceValue: varianceVal,
      unit,
      unitCost,
      notes,
      countedAt: new Date().toISOString(),
      countedBy: authUser?.email || 'sistema'
    };

    setStockCounts((prev) => [tempCount, ...prev]);

    // Optimistically update inventory items state so currentQuantity = physical (for next cycle reference!)
    setInventoryItems((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, currentQuantity: physical } : i))
    );

    // Optimistically update products state so quantidade = physical
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, quantidade: physical } : p))
    );

    // Automatically record waste (descarte) as system-wide waste (desperdício) if wasteQuantity > 0
    if (waste > 0) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const estValue = Number((waste * unitCost).toFixed(2));
        await addProduct(
          productName,
          waste,
          todayStr,
          'Estoque', // categoria
          undefined, // barcode
          unitCost, // valorKg
          undefined, // dataFabricacao
          estValue, // valorTotal
          'Descarte', // motivo
          notes || 'Gerado automaticamente pela Conferência de Estoque', // notas
          undefined, // peso
          'vencido' // statusOverride (forces status to 'vencido' to show as desperdício)
        );
      } catch (err) {
        console.error('[AUTO_WASTE] Erro ao registrar descarte como desperdício:', err);
      }
    }

    try {
      const realCount = await StorageService.addStockCount(
        activeCode,
        productId,
        productName,
        initialQuantity,
        entriesQuantity,
        productionQuantity,
        wasteQuantity,
        expectedQuantity,
        physicalQuantity,
        unit,
        unitCost,
        notes,
        authUser?.email
      );
      setStockCounts((prev) => prev.map((c) => (c.id === tempCount.id ? realCount : c)));
      refreshTenantData(activeCode);
      return realCount;
    } catch (err) {
      setStockCounts((prev) => prev.filter((c) => c.id !== tempCount.id));
      throw err;
    }
  };

  const addInventoryItem = async (
    name: string,
    unit: string,
    initialQuantity: number,
    unitCost: number,
    category?: string
  ): Promise<InventoryItem> => {
    if (!activeCode) throw new Error('Bakery code required');

    const tempItem: InventoryItem = {
      id: 'temp_inv_' + Date.now(),
      bakeryCode: activeCode,
      name: name.trim(),
      unit,
      currentQuantity: Number(initialQuantity) || 0,
      initialQuantity: Number(initialQuantity) || 0,
      unitCost: Number(unitCost) || 0,
      category: category || 'Panificação',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: authUser?.email || 'sistema'
    };

    setInventoryItems((prev) => [tempItem, ...prev]);

    try {
      const realItem = await StorageService.addInventoryItem(
        activeCode,
        name,
        unit,
        initialQuantity,
        unitCost,
        authUser?.email,
        category
      );
      setInventoryItems((prev) => prev.map((i) => (i.id === tempItem.id ? realItem : i)));
      const freshMovs = await StorageService.getInventoryMovementsFromServer(activeCode);
      setInventoryMovements(freshMovs);
      return realItem;
    } catch (err) {
      setInventoryItems((prev) => prev.filter((i) => i.id !== tempItem.id));
      throw err;
    }
  };

  const updateInventoryItem = async (
    id: string,
    name: string,
    unitCost?: number,
    unit?: string,
    category?: string
  ): Promise<InventoryItem> => {
    const realUpdated = await StorageService.updateInventoryItem(id, name, unitCost, unit, category);
    setInventoryItems((prev) => prev.map((i) => (i.id === id ? realUpdated : i)));
    return realUpdated;
  };

  const deleteInventoryItem = async (id: string): Promise<void> => {
    await StorageService.deleteInventoryItem(id);
    setInventoryItems((prev) => prev.filter((i) => i.id !== id));
  };

  const calculateExpectedStock = useCallback(
    (productId: string) => {
      // 1. Try to find in inventoryItems first
      const item = inventoryItems.find((i) => i.id === productId);
      if (item) {
        const unit = item.unit || 'kg';
        const cost = item.unitCost || 0;
        const initial = Number(item.currentQuantity) || 0;
        return {
          expected: initial,
          initial,
          entries: 0,
          sales: 0,
          waste: 0,
          adjustments: 0,
          unit,
          cost
        };
      }

      // 2. Fallback to products from expiration module
      const prod = products.find((p) => p.id === productId);
      if (prod) {
        const unit = prod.unidade || (prod.peso ? 'kg' : 'unidade');
        const cost =
          prod.valorKg || (prod.valorTotal && prod.quantidade ? prod.valorTotal / prod.quantidade : 0) || 0;
        const initial = Number(prod.quantidade) || 0;
        return {
          expected: initial,
          initial,
          entries: 0,
          sales: 0,
          waste: 0,
          adjustments: 0,
          unit,
          cost
        };
      }

      return {
        expected: 0,
        initial: 0,
        entries: 0,
        sales: 0,
        waste: 0,
        adjustments: 0,
        unit: 'kg',
        cost: 0
      };
    },
    [products, inventoryItems]
  );

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
  // ----------------------------------------------------
  // OPERATIONAL TASKS & TEAM ROUTINES
  // ----------------------------------------------------
  const addOperationalTask = async (taskData: Omit<OperationalTask, 'id' | 'createdAt'>): Promise<OperationalTask> => {
    const created = await StorageService.addOperationalTask(taskData);
    setOperationalTasks((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
    return created;
  };

  const updateOperationalTask = async (id: string, updates: Partial<OperationalTask>): Promise<OperationalTask | null> => {
    const updated = await StorageService.updateOperationalTask(id, updates);
    if (updated) {
      setOperationalTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    return updated;
  };

  const toggleOperationalTask = async (id: string, completedBy?: string, notes?: string): Promise<OperationalTask | null> => {
    const updated = await StorageService.toggleOperationalTask(id, completedBy, notes);
    if (updated) {
      setOperationalTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    return updated;
  };

  const deleteOperationalTask = async (id: string): Promise<void> => {
    setOperationalTasks((prev) => prev.filter((t) => t.id !== id));
    await StorageService.deleteOperationalTask(id);
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

  // Category management logic
  const categories = React.useMemo(() => {
    const custom = activeCompany?.categoriasCustomizadas;
    if (custom && Array.isArray(custom) && custom.length > 0) {
      return custom;
    }
    return DEFAULT_CATEGORIES;
  }, [activeCompany?.categoriasCustomizadas]);

  const addCategory = async (categoryName: string): Promise<boolean> => {
    const trimmed = categoryName.trim();
    if (!trimmed) return false;
    const currentList = activeCompany?.categoriasCustomizadas && activeCompany.categoriasCustomizadas.length > 0
      ? activeCompany.categoriasCustomizadas
      : [...DEFAULT_CATEGORIES];

    if (currentList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }

    const updated = [...currentList, trimmed];
    if (activeCompany) {
      setActiveCompany({ ...activeCompany, categoriasCustomizadas: updated });
      if (activeCode) {
        await StorageService.updateCompanyCategories(activeCode, updated);
      }
    }
    return true;
  };

  const renameCategory = async (oldName: string, newName: string): Promise<boolean> => {
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedNew.toLowerCase() === oldName.toLowerCase()) return false;

    const currentList = activeCompany?.categoriasCustomizadas && activeCompany.categoriasCustomizadas.length > 0
      ? activeCompany.categoriasCustomizadas
      : [...DEFAULT_CATEGORIES];

    const updatedList = currentList.map((c) => (c === oldName ? trimmedNew : c));

    if (activeCompany) {
      setActiveCompany({ ...activeCompany, categoriasCustomizadas: updatedList });
      if (activeCode) {
        await StorageService.updateCompanyCategories(activeCode, updatedList);
        await StorageService.renameCategoryInProducts(activeCode, oldName, trimmedNew);
      }
    }

    setProducts((prev) => prev.map((p) => (p.categoria === oldName ? { ...p, categoria: trimmedNew } : p)));
    setVipOffers((prev) => prev.map((v) => (v.categoria === oldName ? { ...v, categoria: trimmedNew } : v)));
    setInventoryItems((prev) => prev.map((i) => (i.category === oldName ? { ...i, category: trimmedNew } : i)));

    return true;
  };

  const deleteCategory = async (categoryName: string, fallbackCategory?: string): Promise<boolean> => {
    const currentList = activeCompany?.categoriasCustomizadas && activeCompany.categoriasCustomizadas.length > 0
      ? activeCompany.categoriasCustomizadas
      : [...DEFAULT_CATEGORIES];

    let updatedList = currentList.filter((c) => c !== categoryName);
    if (updatedList.length === 0) {
      updatedList = ['Geral'];
    }

    const fallback = fallbackCategory || updatedList[0] || 'Geral';

    if (activeCompany) {
      setActiveCompany({ ...activeCompany, categoriasCustomizadas: updatedList });
      if (activeCode) {
        await StorageService.updateCompanyCategories(activeCode, updatedList);
        await StorageService.replaceCategoryInProducts(activeCode, categoryName, fallback);
      }
    }

    setProducts((prev) => prev.map((p) => (p.categoria === categoryName ? { ...p, categoria: fallback } : p)));
    setVipOffers((prev) => prev.map((v) => (v.categoria === categoryName ? { ...v, categoria: fallback } : v)));
    setInventoryItems((prev) => prev.map((i) => (i.category === categoryName ? { ...i, category: fallback } : i)));

    return true;
  };

  const resetCategories = async (): Promise<boolean> => {
    const updatedList = [...DEFAULT_CATEGORIES];
    if (activeCompany) {
      setActiveCompany({ ...activeCompany, categoriasCustomizadas: updatedList });
      if (activeCode) {
        await StorageService.updateCompanyCategories(activeCode, updatedList);
      }
    }
    return true;
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
        inventoryMovements,
        stockCounts,
        inventoryItems,
        operationalTasks,
        isAdminLoggedIn,
        isLoading,
        authUser,

        setCurrentView: handleSetCurrentView,
        setActiveCode,
        setIsAdminLoggedIn,

        loginAsBakery,
        loginAsBakeryWithCredentials,
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

        addMovement,
        addStockCount,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        calculateExpectedStock,

        addOperationalTask,
        updateOperationalTask,
        toggleOperationalTask,
        deleteOperationalTask,

        addCompany,
        toggleCompanyStatus,
        deleteCompany,
        updateCompanyBilling,
        updateCompanyContract,
        updateCompanyPassword,
        updateCompanyCNPJ,
        deleteCompaniesWithoutCNPJ,
        clearAllSystemData,

        // Category management
        categories,
        addCategory,
        renameCategory,
        deleteCategory,
        resetCategories
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
