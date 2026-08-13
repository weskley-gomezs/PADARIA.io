import { BakeryCompany, Product, ProductStatus, SaleHistoryItem, AdminStats, SupportTicket, TicketPriority, TicketStatus, FinancialStats, BillingInfo, BillingStatus, ContractInfo, VipOffer, DailyClosing, InventoryMovement, StockCount, MovementType, InventoryItem } from '../types/index.js';
import { calculateDaysRemaining, getProductStatus, formatDateToISO, generateActivationCode } from '../utils/dateUtils.js';
import { db, auth, testFirestoreConnection } from './firebase.js';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc, onSnapshot, Unsubscribe, query, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler.js';

export function removeUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }

  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, removeUndefined(value)])
    );
  }

  return obj;
}

const KEYS = {
  COMPANIES: 'padarias_companies_v1',
  PRODUCTS: 'padarias_products_v1',
  SALES_HISTORY: 'padarias_sales_history_v1',
  TICKETS: 'padarias_tickets_v1',
  ADMIN_AUTH: 'padarias_admin_authenticated',
  BAKERY_SESSION: 'padarias_active_session',
  ADMIN_PASSWORD: 'padarias_admin_password',
  ASAAS_SETTINGS: 'padarias_asaas_settings',
  VIP_OFFERS: 'padarias_vip_offers_v1',
  DAILY_CLOSINGS: 'padarias_fechamentos_v1',
  INVENTORY_MOVEMENTS: 'padarias_inventory_movements_v1',
  STOCK_COUNTS: 'padarias_stock_counts_v1',
  INVENTORY_ITEMS: 'padarias_inventory_items_v1',
};

const EXCLUDED_CODES = ['AB12CD34', 'PAD8X92M', 'DEMO9999', '6SSHQQTZ', '8FM8XCN6', 'CAVU5FKP'];
const DEMO_PROD_IDS = [
  'prod-101', 'prod-102', 'prod-103', 'prod-104', 'prod-105', 'prod-106', 'prod-107',
  'prod-201', 'prod-202', 'prod-203'
];

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Error reading localStorage key:', key, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error setting localStorage key:', key, e);
  }
}

export class StorageService {
  private static isInitialized = false;

  // Initialize local structures safely
  static async init(): Promise<void> {
    if (!localStorage.getItem(KEYS.COMPANIES)) {
      setItem(KEYS.COMPANIES, []);
    }
    if (!localStorage.getItem(KEYS.PRODUCTS)) {
      setItem(KEYS.PRODUCTS, []);
    }
    if (!localStorage.getItem(KEYS.SALES_HISTORY)) {
      setItem(KEYS.SALES_HISTORY, []);
    }
    if (!localStorage.getItem(KEYS.TICKETS)) {
      setItem(KEYS.TICKETS, []);
    }
    if (!localStorage.getItem(KEYS.VIP_OFFERS)) {
      setItem(KEYS.VIP_OFFERS, []);
    }
    if (!localStorage.getItem(KEYS.ADMIN_PASSWORD)) {
      setItem(KEYS.ADMIN_PASSWORD, 'admin123');
    }

    StorageService.purgeDemoDataFromLocal();
    StorageService.isInitialized = true;
  }

  // Real-time Subscriptions using Firestore onSnapshot (Guarded for Auth)
  static subscribeCompany(code: string, callback: (company: BakeryCompany | null) => void): Unsubscribe {
    if (!auth.currentUser) {
      const localComps = StorageService.getCompanies();
      const found = localComps.find(c => c.codigoAtivacao.toUpperCase() === code.trim().toUpperCase());
      callback(found || null);
      return () => {};
    }

    const docRef = doc(db, 'companies', code.trim().toUpperCase());
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const company = snapshot.data() as BakeryCompany;
          const validated = StorageService.validateAndCheckTrials([company])[0] || null;
          callback(validated);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn('Error subscribing to company doc, fallback to local storage:', err);
        const localComps = StorageService.getCompanies();
        const found = localComps.find(c => c.codigoAtivacao.toUpperCase() === code.trim().toUpperCase());
        callback(found || null);
      }
    );
  }

  static subscribeCompanies(callback: (companies: BakeryCompany[]) => void): Unsubscribe {
    if (!auth.currentUser) {
      callback(StorageService.getCompanies());
      return () => {};
    }

    const colRef = collection(db, 'companies');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const companies: BakeryCompany[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as BakeryCompany;
          if (data && data.codigoAtivacao) {
            const cleanCode = data.codigoAtivacao.trim().toUpperCase();
            if (EXCLUDED_CODES.includes(cleanCode)) {
              deleteDoc(doc(db, 'companies', d.id)).catch(() => {});
            } else {
              companies.push(data);
            }
          }
        });
        const validated = StorageService.validateAndCheckTrials(companies);
        setItem(KEYS.COMPANIES, validated);
        callback(validated);
      },
      (err) => {
        if (err.message?.includes('Quota') || String(err).includes('Quota')) {
          console.warn('Quota limit exceeded for companies subscription, falling back to local storage.');
          callback(StorageService.getCompanies());
        } else {
          console.error('Error subscribing to companies:', err);
        }
      }
    );
  }

  static subscribeProducts(callback: (products: Product[]) => void, bakeryCode?: string): Unsubscribe {
    let q: any = collection(db, 'products');
    if (bakeryCode) {
      q = query(q, where('bakeryCode', '==', bakeryCode.trim().toUpperCase()));
    }
    return onSnapshot(
      q,
      (snapshot) => {
        const products: Product[] = [];
        snapshot.forEach((d) => {
          const p = d.data() as Product;
          if (p && p.id) {
            if (
              (p.bakeryCode && EXCLUDED_CODES.includes(p.bakeryCode.trim().toUpperCase())) ||
              DEMO_PROD_IDS.includes(p.id)
            ) {
              deleteDoc(doc(db, 'products', d.id)).catch(() => {});
            } else {
              const daysRemaining = calculateDaysRemaining(p.dataValidade);
              const status = getProductStatus(daysRemaining);
              products.push({
                ...p,
                diasParaVencer: daysRemaining,
                status,
              });
            }
          }
        });

        if (bakeryCode) {
          // Merge or overwrite local cache for this tenant
          setItem(KEYS.PRODUCTS, products);
          callback(products);
        } else {
          setItem(KEYS.PRODUCTS, products);
          callback(products);
        }
      },
      (err) => {
        if (err.message?.includes('Quota') || String(err).includes('Quota')) {
          console.warn('Quota limit exceeded for products subscription, falling back to local storage.');
          callback(StorageService.getProducts(bakeryCode));
        } else {
          console.error('Error subscribing to products:', err);
        }
      }
    );
  }

  static subscribeSalesHistory(callback: (sales: SaleHistoryItem[]) => void, bakeryCode?: string): Unsubscribe {
    let q: any = collection(db, 'sales');
    if (bakeryCode) {
      q = query(q, where('bakeryCode', '==', bakeryCode.trim().toUpperCase()));
    }
    return onSnapshot(
      q,
      (snapshot) => {
        const sales: SaleHistoryItem[] = [];
        snapshot.forEach((d) => {
          const s = d.data() as SaleHistoryItem;
          if (s && s.id) {
            if (s.bakeryCode && EXCLUDED_CODES.includes(s.bakeryCode.trim().toUpperCase())) {
              deleteDoc(doc(db, 'sales', d.id)).catch(() => {});
            } else {
              sales.push(s);
            }
          }
        });

        setItem(KEYS.SALES_HISTORY, sales);
        callback(sales);
      },
      (err) => {
        if (err.message?.includes('Quota') || String(err).includes('Quota')) {
          console.warn('Quota limit exceeded for sales subscription, falling back to local storage.');
          callback(StorageService.getSalesHistory(bakeryCode));
        } else {
          console.error('Error subscribing to sales:', err);
        }
      }
    );
  }

  static subscribeTickets(callback: (tickets: SupportTicket[]) => void, bakeryCode?: string): Unsubscribe {
    let q: any = collection(db, 'tickets');
    if (bakeryCode) {
      q = query(q, where('bakeryCode', '==', bakeryCode.trim().toUpperCase()));
    }
    return onSnapshot(
      q,
      (snapshot) => {
        const tickets: SupportTicket[] = [];
        snapshot.forEach((d) => {
          const t = d.data() as SupportTicket;
          if (t && t.id) {
            if (t.bakeryCode && EXCLUDED_CODES.includes(t.bakeryCode.trim().toUpperCase())) {
              deleteDoc(doc(db, 'tickets', d.id)).catch(() => {});
            } else {
              tickets.push(t);
            }
          }
        });

        setItem(KEYS.TICKETS, tickets);
        callback(tickets);
      },
      (err) => {
        if (err.message?.includes('Quota') || String(err).includes('Quota')) {
          console.warn('Quota limit exceeded for tickets subscription, falling back to local storage.');
          callback(StorageService.getTickets(bakeryCode));
        } else {
          console.error('Error subscribing to tickets:', err);
        }
      }
    );
  }

  static purgeDemoDataFromLocal(): void {
    let companies = getItem<BakeryCompany[]>(KEYS.COMPANIES, []);
    companies = companies.filter(c => !EXCLUDED_CODES.includes(c.codigoAtivacao.trim().toUpperCase()));
    setItem(KEYS.COMPANIES, companies);

    let products = getItem<Product[]>(KEYS.PRODUCTS, []);
    products = products.filter(p => !EXCLUDED_CODES.includes(p.bakeryCode.trim().toUpperCase()) && !DEMO_PROD_IDS.includes(p.id));
    setItem(KEYS.PRODUCTS, products);

    let sales = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    sales = sales.filter(s => !EXCLUDED_CODES.includes(s.bakeryCode.trim().toUpperCase()));
    setItem(KEYS.SALES_HISTORY, sales);

    let tickets = getItem<SupportTicket[]>(KEYS.TICKETS, []);
    tickets = tickets.filter(t => !EXCLUDED_CODES.includes(t.bakeryCode.trim().toUpperCase()));
    setItem(KEYS.TICKETS, tickets);

    if (StorageService.getActiveBakeryCode() && EXCLUDED_CODES.includes(StorageService.getActiveBakeryCode()!.trim().toUpperCase())) {
      StorageService.setActiveBakeryCode(null);
    }

    // Proactively clean up Firestore docs for excluded codes
    for (const code of EXCLUDED_CODES) {
      deleteDoc(doc(db, 'companies', code)).catch(() => {});
    }
  }

  static async clearAllSystemData(): Promise<void> {
    try {
      // 1. Delete all companies from Firestore
      const compSnap = await getDocs(collection(db, 'companies')).catch(() => null);
      if (compSnap && !compSnap.empty) {
        for (const d of compSnap.docs) {
          await deleteDoc(doc(db, 'companies', d.id)).catch(() => {});
        }
      }

      // 2. Delete all products from Firestore
      const prodSnap = await getDocs(collection(db, 'products')).catch(() => null);
      if (prodSnap && !prodSnap.empty) {
        for (const d of prodSnap.docs) {
          await deleteDoc(doc(db, 'products', d.id)).catch(() => {});
        }
      }

      // 3. Delete all sales from Firestore
      const salesSnap = await getDocs(collection(db, 'sales')).catch(() => null);
      if (salesSnap && !salesSnap.empty) {
        for (const d of salesSnap.docs) {
          await deleteDoc(doc(db, 'sales', d.id)).catch(() => {});
        }
      }

      // 4. Delete all tickets from Firestore
      const ticketsSnap = await getDocs(collection(db, 'tickets')).catch(() => null);
      if (ticketsSnap && !ticketsSnap.empty) {
        for (const d of ticketsSnap.docs) {
          await deleteDoc(doc(db, 'tickets', d.id)).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Erro ao limpar coleções no Firestore:', e);
    }

    // 5. Reset local storage
    setItem(KEYS.COMPANIES, []);
    setItem(KEYS.PRODUCTS, []);
    setItem(KEYS.SALES_HISTORY, []);
    setItem(KEYS.TICKETS, []);
    setItem(KEYS.BAKERY_SESSION, null);
  }

  static async pullFromFirestore(): Promise<void> {
    if (!auth.currentUser || auth.currentUser.email !== 'admin@padaria.io') {
      return;
    }
    try {
      // 1. Settings (Only specific config document for admin)
      try {
        const adminDoc = await getDoc(doc(db, 'settings', 'admin'));
        if (adminDoc.exists()) {
          const data = adminDoc.data();
          if (data && data.adminPassword) {
            setItem(KEYS.ADMIN_PASSWORD, data.adminPassword);
          }
        }
      } catch (e) {
        console.warn('Firestore fetch settings warning:', e);
      }
    } catch (err: any) {
      console.error('Error syncing settings from Firestore:', err);
    }
  }

  // Admin Password
  static getAdminPassword(): string {
    return getItem(KEYS.ADMIN_PASSWORD, 'admin123');
  }

  static async setAdminPassword(newPass: string): Promise<void> {
    const trimmed = newPass.trim();
    setItem(KEYS.ADMIN_PASSWORD, trimmed);

    await setDoc(doc(db, 'settings', 'admin'), {
      adminPassword: trimmed,
      updatedAt: new Date().toISOString(),
    }).catch((err) => {
      console.error('Failed to save admin password to Firestore', err);
    });
  }

  static verifyAdminPassword(inputPass: string): boolean {
    return inputPass.trim() === StorageService.getAdminPassword();
  }

  static isAdminAuthenticated(): boolean {
    return getItem(KEYS.ADMIN_AUTH, false);
  }

  static setAdminAuthenticated(auth: boolean): void {
    setItem(KEYS.ADMIN_AUTH, auth);
  }

  // Bakery Session
  static getActiveBakeryCode(): string | null {
    return getItem<string | null>(KEYS.BAKERY_SESSION, null);
  }

  static setActiveBakeryCode(code: string | null): void {
    setItem(KEYS.BAKERY_SESSION, code);
  }

  // Asaas Settings
  static getAsaasSettings(): { apiKey: string; environment: 'sandbox' | 'production' } {
    return getItem(KEYS.ASAAS_SETTINGS, { apiKey: '', environment: 'sandbox' });
  }

  static setAsaasSettings(apiKey: string, environment: 'sandbox' | 'production'): void {
    setItem(KEYS.ASAAS_SETTINGS, { apiKey: apiKey.trim(), environment });
  }

  static validateAndCheckTrials(companies: BakeryCompany[]): BakeryCompany[] {
    const todayStr = formatDateToISO(new Date());
    let updated = false;

    for (const c of companies) {
      if (c.financeiro && c.financeiro.dataFimTeste) {
        const trialEndDate = c.financeiro.dataFimTeste;
        const isTrialOver = todayStr > trialEndDate;
        const isPaidOrActive = c.financeiro.statusAssinatura === 'ativo' || c.financeiro.statusAssinatura === 'concluido';

        if (isTrialOver && !isPaidOrActive) {
          if (c.ativo) {
            c.ativo = false;
            c.financeiro.statusAssinatura = 'vencido';
            updated = true;
            setDoc(doc(db, 'companies', c.codigoAtivacao), removeUndefined(c)).catch(() => {});
          }
        }
      }
    }

    if (updated) {
      setItem(KEYS.COMPANIES, companies);
    }

    return companies;
  }

  // Companies CRUD
  static getCompanies(): BakeryCompany[] {
    const comps = getItem<BakeryCompany[]>(KEYS.COMPANIES, []);
    return StorageService.validateAndCheckTrials(comps);
  }

  static getCompanyByCode(code: string): BakeryCompany | undefined {
    const companies = StorageService.getCompanies();
    const cleanCode = code.trim().toUpperCase();
    return companies.find((c) => c.codigoAtivacao.toUpperCase() === cleanCode);
  }

  static async getCompanyByCodeAsync(code: string): Promise<BakeryCompany | undefined> {
    const cleanCode = code.trim().toUpperCase();
    let comp = StorageService.getCompanyByCode(cleanCode);
    if (comp) return comp;

    try {
      const docRef = doc(db, 'companies', cleanCode);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as BakeryCompany;
        const validated = StorageService.validateAndCheckTrials([data])[0];
        if (validated) {
          const companies = StorageService.getCompanies();
          const existingIdx = companies.findIndex(c => c.codigoAtivacao.toUpperCase() === cleanCode);
          if (existingIdx >= 0) companies[existingIdx] = validated;
          else companies.push(validated);
          setItem(KEYS.COMPANIES, companies);
        }
        return validated;
      }
    } catch (err) {
      console.warn('Error fetching company doc from Firestore:', err);
    }
    return undefined;
  }

  static getCompanyByEmail(email: string): BakeryCompany | undefined {
    const companies = StorageService.getCompanies();
    const cleanEmail = email.trim().toLowerCase();
    return companies.find((c) => c.email.trim().toLowerCase() === cleanEmail);
  }

  static getCompanyByCredentials(email: string, pass: string): BakeryCompany | undefined {
    const companies = StorageService.getCompanies();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
    const comp = companies.find((c) => {
      const emailMatches = (c.email && c.email.trim().toLowerCase() === cleanEmail) ||
                           (c.codigoAtivacao && c.codigoAtivacao.trim().toLowerCase() === cleanEmail);
      const storedPwd = (c.senha && c.senha.trim()) ? c.senha.trim() : 'padaria123';
      const passMatches = storedPwd === cleanPass ||
                          (c.codigoAtivacao && c.codigoAtivacao.toUpperCase() === cleanPass.toUpperCase());
      return emailMatches && passMatches;
    });

    if (comp) {
      const todayStr = formatDateToISO(new Date());
      if (comp.financeiro?.dataFimTeste && todayStr > comp.financeiro.dataFimTeste) {
        const isPaid = comp.financeiro.statusAssinatura === 'ativo' || comp.financeiro.statusAssinatura === 'concluido';
        if (!isPaid) {
          comp.ativo = false;
          comp.financeiro.statusAssinatura = 'vencido';
          setItem(KEYS.COMPANIES, companies);
          setDoc(doc(db, 'companies', comp.codigoAtivacao), removeUndefined(comp)).catch(() => {});
          return undefined;
        }
      }
      if (!comp.ativo) {
        return undefined;
      }
    }

    return comp;
  }

  static async getCompanyByCredentialsAsync(email: string, pass: string): Promise<BakeryCompany | undefined> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Check local cache first
    let comp = StorageService.getCompanyByCredentials(cleanEmail, cleanPass);
    if (comp) return comp;

    // 2. Direct document fetch by code if input is an activation code
    try {
      const docRef = doc(db, 'companies', cleanEmail.toUpperCase());
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as BakeryCompany;
        if (data && data.codigoAtivacao) {
          const validated = StorageService.validateAndCheckTrials([data])[0];
          if (validated) {
            const companies = StorageService.getCompanies();
            const existingIdx = companies.findIndex(c => c.codigoAtivacao.toUpperCase() === validated.codigoAtivacao.toUpperCase());
            if (existingIdx >= 0) companies[existingIdx] = validated;
            else companies.push(validated);
            setItem(KEYS.COMPANIES, companies);

            const storedPwd = (validated.senha && validated.senha.trim()) ? validated.senha.trim() : 'padaria123';
            const passMatches = storedPwd === cleanPass || validated.codigoAtivacao.toUpperCase() === cleanPass.toUpperCase();
            if (passMatches && validated.ativo) return validated;
          }
        }
      }
    } catch (e) {
      // continue to collection query
    }

    // 3. Fetch all companies from Firestore if local cache / direct doc didn't match
    try {
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (anonErr) {
          console.warn('Anonymous auth before fetching companies warning:', anonErr);
        }
      }
      const colRef = collection(db, 'companies');
      const snap = await getDocs(colRef);
      const companies: BakeryCompany[] = [];
      snap.forEach((d) => {
        const data = d.data() as BakeryCompany;
        if (data && data.codigoAtivacao) {
          companies.push(data);
        }
      });

      // If database is completely empty, seed default padaria so login works out-of-the-box
      if (companies.length === 0) {
        const defaultCompany: BakeryCompany = {
          codigoAtivacao: 'PAD12345',
          empresa: 'Panificadora Modelo',
          email: 'padaria@padaria.io',
          senha: 'padaria123',
          telefone: '(61) 99999-8888',
          cnpj: '00.000.000/0001-91',
          ativo: true,
          dataCadastro: formatDateToISO(new Date()),
          ultimoAcesso: formatDateToISO(new Date()),
          financeiro: {
            diasTesteGratis: 30,
            dataFimTeste: '2030-12-31',
            implementacaoPaga: true,
            valorImplementacao: 0,
            assinaturaMensalAtiva: true,
            valorMensalidade: 199,
            dataProximaCobranca: '2030-12-31',
            statusAssinatura: 'ativo',
            historicoCobrancas: []
          },
          contrato: {
            contratoAceito: true,
            dataAssinaturaContrato: formatDateToISO(new Date()),
            dataVencimentoContrato: '2030-12-31',
            fornecedorNome: 'PADARIA.IO TECNOLOGIA E SISTEMAS',
            clienteNome: 'Panificadora Modelo',
            clienteCnpj: '00.000.000/0001-91',
            valorImplementacao: 0,
            valorMensalidade: 199
          }
        };
        companies.push(defaultCompany);
        setDoc(doc(db, 'companies', 'PAD12345'), removeUndefined(defaultCompany)).catch(() => {});
      }

      if (companies.length > 0) {
        const validated = StorageService.validateAndCheckTrials(companies);
        setItem(KEYS.COMPANIES, validated);
        comp = validated.find((c) => {
          const emailMatches = (c.email && c.email.trim().toLowerCase() === cleanEmail) ||
                               (c.codigoAtivacao && c.codigoAtivacao.trim().toLowerCase() === cleanEmail);
          const storedPwd = (c.senha && c.senha.trim()) ? c.senha.trim() : 'padaria123';
          const passMatches = storedPwd === cleanPass ||
                              (c.codigoAtivacao && c.codigoAtivacao.toUpperCase() === cleanPass.toUpperCase());
          return emailMatches && passMatches;
        });
      }
    } catch (err) {
      console.warn('Error fetching companies from Firestore during credential check:', err);
    }

    return comp;
  }

  static async updateCompanyPassword(code: string, newPassword: string): Promise<BakeryCompany | undefined> {
    const companies = StorageService.getCompanies();
    const company = companies.find((c) => c.codigoAtivacao.toUpperCase() === code.trim().toUpperCase());
    if (company) {
      company.senha = newPassword.trim();
      setItem(KEYS.COMPANIES, companies);

      await setDoc(doc(db, 'companies', company.codigoAtivacao), removeUndefined(company)).catch((e) => {
        handleFirestoreError(e, OperationType.WRITE, `companies/${company.codigoAtivacao}`);
      });
      return company;
    }
    return undefined;
  }

  static async updateCompanyName(code: string, newName: string): Promise<BakeryCompany | undefined> {
    const companies = StorageService.getCompanies();
    const company = companies.find((c) => c.codigoAtivacao.toUpperCase() === code.trim().toUpperCase());
    if (company) {
      company.empresa = newName.trim();
      if (company.contrato) {
        company.contrato.clienteNome = newName.trim();
      }
      setItem(KEYS.COMPANIES, companies);

      await setDoc(doc(db, 'companies', company.codigoAtivacao), removeUndefined(company)).catch((e) => {
        handleFirestoreError(e, OperationType.WRITE, `companies/${company.codigoAtivacao}`);
      });
      return company;
    }
    return undefined;
  }

  static async addCompany(
    empresa: string,
    email: string,
    senha?: string,
    telefone?: string,
    cnpj?: string,
    diasTesteGratis = 7,
    valorMensalidade = 199
  ): Promise<BakeryCompany> {
    const companies = StorageService.getCompanies();
    let code = generateActivationCode();
    while (companies.some((c) => c.codigoAtivacao === code)) {
      code = generateActivationCode();
    }

    const todayStr = formatDateToISO(new Date());
    const trialDays = Number(diasTesteGratis) >= 0 ? Number(diasTesteGratis) : 7;
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);
    const trialEndDateStr = formatDateToISO(trialEndDate);

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = formatDateToISO(nextYear);

    const defaultBilling: BillingInfo = {
      diasTesteGratis: trialDays,
      dataFimTeste: trialEndDateStr,
      implementacaoPaga: true,
      valorImplementacao: 0,
      assinaturaMensalAtiva: true,
      valorMensalidade: Number(valorMensalidade) || 199,
      dataProximaCobranca: trialEndDateStr,
      statusAssinatura: 'ativo',
      historicoCobrancas: [],
    };

    const companyPassword = senha && senha.trim() ? senha.trim() : 'padaria123';

    const newCompany: BakeryCompany = {
      codigoAtivacao: code,
      empresa: empresa.trim(),
      email: email.trim(),
      senha: companyPassword,
      telefone: telefone ? telefone.trim() : '',
      cnpj: cnpj ? cnpj.trim() : '',
      ativo: true,
      dataCadastro: todayStr,
      ultimoAcesso: todayStr,
      financeiro: defaultBilling,
      contrato: {
        contratoAceito: true,
        dataAssinaturaContrato: todayStr,
        dataVencimentoContrato: nextYearStr,
        fornecedorNome: 'PADARIA.IO TECNOLOGIA E SISTEMAS - Weskley Gomes',
        clienteNome: empresa.trim(),
        clienteCnpj: cnpj ? cnpj.trim() : '',
        valorImplementacao: 0,
        valorMensalidade: Number(valorMensalidade) || 199,
      },
    };

    companies.unshift(newCompany);
    setItem(KEYS.COMPANIES, companies);

    console.log("DADOS ANTES DO FIRESTORE", JSON.stringify(newCompany));
    const cleanData = removeUndefined(newCompany);

    await setDoc(doc(db, 'companies', code), cleanData).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `companies/${code}`);
    });

    return newCompany;
  }

  static async toggleCompanyStatus(code: string): Promise<boolean> {
    const companies = StorageService.getCompanies();
    const company = companies.find((c) => c.codigoAtivacao === code);
    if (company) {
      company.ativo = !company.ativo;
      setItem(KEYS.COMPANIES, companies);

      console.log("DADOS ANTES DO FIRESTORE", JSON.stringify(company));
      await setDoc(doc(db, 'companies', code), removeUndefined(company)).catch((e) => {
        handleFirestoreError(e, OperationType.WRITE, `companies/${code}`);
      });

      return company.ativo;
    }
    return false;
  }

  static async updateCompanyCode(oldCode: string, newCode: string): Promise<boolean> {
    const companies = StorageService.getCompanies();
    const company = companies.find((c) => c.codigoAtivacao === oldCode);
    if (!company) return false;

    const cleanNewCode = newCode.trim().toUpperCase();

    if (companies.some((c) => c.codigoAtivacao === cleanNewCode && c.codigoAtivacao !== oldCode)) {
      throw new Error('Código de ativação já está em uso por outra padaria.');
    }

    company.codigoAtivacao = cleanNewCode;
    setItem(KEYS.COMPANIES, companies);

    await deleteDoc(doc(db, 'companies', oldCode)).catch(() => {});
    console.log("DADOS ANTES DO FIRESTORE", JSON.stringify(company));
    await setDoc(doc(db, 'companies', cleanNewCode), removeUndefined(company)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `companies/${cleanNewCode}`);
    });

    const products = getItem<Product[]>(KEYS.PRODUCTS, []);
    for (const p of products) {
      if (p.bakeryCode === oldCode) {
        p.bakeryCode = cleanNewCode;
        await setDoc(doc(db, 'products', p.id), p).catch(() => {});
      }
    }
    setItem(KEYS.PRODUCTS, products);

    const history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    for (const h of history) {
      if (h.bakeryCode === oldCode) {
        h.bakeryCode = cleanNewCode;
        await setDoc(doc(db, 'sales', h.id), h).catch(() => {});
      }
    }
    setItem(KEYS.SALES_HISTORY, history);

    if (StorageService.getActiveBakeryCode() === oldCode) {
      StorageService.setActiveBakeryCode(cleanNewCode);
    }

    return true;
  }

  static async deleteCompany(code: string): Promise<void> {
    const cleanCode = code.trim().toUpperCase();

    // 1. Delete company doc from Firestore
    await deleteDoc(doc(db, 'companies', cleanCode)).catch((e) => {
      handleFirestoreError(e, OperationType.DELETE, `companies/${cleanCode}`);
    });

    // 2. Remove company from localStorage
    let companies = StorageService.getCompanies();
    companies = companies.filter((c) => c.codigoAtivacao.toUpperCase() !== cleanCode);
    setItem(KEYS.COMPANIES, companies);

    // 3. Remove products associated with this company in Firestore and localStorage
    let products = getItem<Product[]>(KEYS.PRODUCTS, []);
    const productsToRemove = products.filter((p) => p.bakeryCode && p.bakeryCode.trim().toUpperCase() === cleanCode);
    for (const p of productsToRemove) {
      await deleteDoc(doc(db, 'products', p.id)).catch(() => {});
    }
    products = products.filter((p) => !p.bakeryCode || p.bakeryCode.trim().toUpperCase() !== cleanCode);
    setItem(KEYS.PRODUCTS, products);

    // 4. Remove sales associated with this company in Firestore and localStorage
    let history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    const salesToRemove = history.filter((h) => h.bakeryCode && h.bakeryCode.trim().toUpperCase() === cleanCode);
    for (const h of salesToRemove) {
      await deleteDoc(doc(db, 'sales', h.id)).catch(() => {});
    }
    history = history.filter((h) => !h.bakeryCode || h.bakeryCode.trim().toUpperCase() !== cleanCode);
    setItem(KEYS.SALES_HISTORY, history);

    // 5. Remove tickets associated with this company in Firestore and localStorage
    let tickets = getItem<SupportTicket[]>(KEYS.TICKETS, []);
    const ticketsToRemove = tickets.filter((t) => t.bakeryCode && t.bakeryCode.trim().toUpperCase() === cleanCode);
    for (const t of ticketsToRemove) {
      await deleteDoc(doc(db, 'tickets', t.id)).catch(() => {});
    }
    tickets = tickets.filter((t) => !t.bakeryCode || t.bakeryCode.trim().toUpperCase() !== cleanCode);
    setItem(KEYS.TICKETS, tickets);

    // 6. Reset active session if needed
    if (StorageService.getActiveBakeryCode()?.trim().toUpperCase() === cleanCode) {
      StorageService.setActiveBakeryCode(null);
    }
  }

  static async deleteCompaniesWithoutCNPJ(): Promise<number> {
    const deletedCodes = new Set<string>();

    // 1. Scan Firestore companies directly
    try {
      const compSnap = await getDocs(collection(db, 'companies')).catch(() => null);
      if (compSnap && !compSnap.empty) {
        for (const d of compSnap.docs) {
          const data = d.data() as BakeryCompany;
          const cnpjClean = (data?.cnpj || '').replace(/\D/g, '');
          if (!cnpjClean || cnpjClean.length === 0) {
            const code = data?.codigoAtivacao || d.id;
            if (code) {
              await deleteDoc(doc(db, 'companies', d.id)).catch(() => {});
              deletedCodes.add(code.trim().toUpperCase());
            }
          }
        }
      }
    } catch (e) {
      console.error('Erro ao verificar empresas no Firestore:', e);
    }

    // 2. Scan LocalStorage companies
    const localCompanies = StorageService.getCompanies();
    for (const c of localCompanies) {
      const cnpjClean = (c?.cnpj || '').replace(/\D/g, '');
      if (!cnpjClean || cnpjClean.length === 0) {
        if (c.codigoAtivacao) {
          deletedCodes.add(c.codigoAtivacao.trim().toUpperCase());
        }
      }
    }

    // 3. Delete all matching companies and their products/sales/tickets
    for (const code of deletedCodes) {
      await StorageService.deleteCompany(code);
    }

    // 4. Update LocalStorage
    let updatedCompanies = StorageService.getCompanies();
    updatedCompanies = updatedCompanies.filter((c) => {
      const clean = (c?.cnpj || '').replace(/\D/g, '');
      return clean.length > 0;
    });
    setItem(KEYS.COMPANIES, updatedCompanies);

    return deletedCodes.size;
  }

  static async updateCompanyCNPJ(code: string, cnpj: string): Promise<BakeryCompany | undefined> {
    const companies = StorageService.getCompanies();
    const comp = companies.find((c) => c.codigoAtivacao === code);
    if (!comp) return undefined;

    comp.cnpj = cnpj.trim();
    setItem(KEYS.COMPANIES, companies);
    console.log("DADOS ANTES DO FIRESTORE", JSON.stringify(comp));
    await setDoc(doc(db, 'companies', code), removeUndefined(comp)).catch(() => {});
    return comp;
  }

  // Financial & Billing Methods
  static getFinancialStats(): FinancialStats {
    const companies = StorageService.getCompanies();
    const totalClientes = companies.length;
    const totalClientesAtivos = companies.filter((c) => c.ativo).length;

    // MRR Total Projetado: Soma de todas as mensalidades das empresas ativas (não canceladas)
    const mrrTotalProjetado = companies.reduce((acc, c) => {
      if (c.ativo && c.financeiro?.statusAssinatura !== 'cancelado') {
        return acc + (c.financeiro?.valorMensalidade || 199);
      }
      return acc;
    }, 0);

    // MRR Ativo (Pagando): Soma de quem tem statusAssinatura === 'ativo' ou 'concluido'
    const mrrAtivo = companies.reduce((acc, c) => {
      if (c.ativo && (c.financeiro?.statusAssinatura === 'ativo' || c.financeiro?.statusAssinatura === 'concluido')) {
        return acc + (c.financeiro?.valorMensalidade || 199);
      }
      return acc;
    }, 0);

    // Usa MRR Ativo se houver, caso contrário o total projetado para não zerar o dashboard
    const mrr = mrrAtivo > 0 ? mrrAtivo : mrrTotalProjetado;

    // Receita de Implantação
    const receitaImplementacaoPaga = companies.reduce((acc, c) => {
      if (c.financeiro?.implementacaoPaga) {
        return acc + (c.financeiro?.valorImplementacao || 1500);
      }
      return acc;
    }, 0);

    const receitaImplementacaoPendente = companies.reduce((acc, c) => {
      if (!c.financeiro?.implementacaoPaga) {
        return acc + (c.financeiro?.valorImplementacao || 1500);
      }
      return acc;
    }, 0);

    const proximosVencimentos = companies.filter((c) => c.ativo && c.financeiro?.statusAssinatura !== 'cancelado').length;

    const clientesAdimplentes = companies.filter(
      (c) => c.ativo && (c.financeiro?.statusAssinatura === 'ativo' || c.financeiro?.statusAssinatura === 'concluido')
    ).length;

    const clientesInadimplentes = companies.filter(
      (c) => c.ativo && (c.financeiro?.statusAssinatura === 'pendente' || c.financeiro?.statusAssinatura === 'vencido' || c.financeiro?.statusAssinatura === 'vencendo')
    ).length;

    const clientesCanceladosAsaas = companies.filter(
      (c) => c.financeiro?.statusAssinatura === 'suspenso' || c.financeiro?.statusAssinatura === 'cancelado'
    ).length;

    return {
      totalClientes,
      totalClientesAtivos,
      mrrTotalProjetado,
      mrrAtivo,
      mrr,
      receitaImplementacaoPaga,
      receitaImplementacaoPendente,
      proximosVencimentos,
      clientesAdimplentes,
      clientesInadimplentes,
      clientesCanceladosAsaas,
    };
  }

  static async updateCompanyBilling(code: string, updates: Partial<BillingInfo>): Promise<BakeryCompany | undefined> {
    const companies = StorageService.getCompanies();
    const comp = companies.find((c) => c.codigoAtivacao === code);
    if (!comp) return undefined;

    comp.financeiro = {
      ...(comp.financeiro || {
        implementacaoPaga: false,
        valorImplementacao: 1500,
        assinaturaMensalAtiva: true,
        valorMensalidade: 199,
        dataProximaCobranca: formatDateToISO(new Date()),
        statusAssinatura: 'pendente',
        historicoCobrancas: [],
      }),
      ...updates,
    };

    // Keep contract values in sync with billing values
    if (comp.contrato) {
      if (updates.valorImplementacao !== undefined) {
        comp.contrato.valorImplementacao = updates.valorImplementacao;
      }
      if (updates.valorMensalidade !== undefined) {
        comp.contrato.valorMensalidade = updates.valorMensalidade;
      }
    }

    setItem(KEYS.COMPANIES, companies);
    console.log("DADOS ANTES DO FIRESTORE", JSON.stringify(comp));
    await setDoc(doc(db, 'companies', code), removeUndefined(comp)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `companies/${code}`);
    });
    return comp;
  }

  static async sendImplementationInvoice(code: string, link: string): Promise<string> {
    const comp = StorageService.getCompanyByCode(code);
    if (!comp) return '';
    
    await StorageService.updateCompanyBilling(code, {
      ultimoLinkPagamento: link,
      tipoUltimoLink: 'implementacao',
      historicoCobrancas: [
        ...(comp.financeiro?.historicoCobrancas || []),
        {
          id: 'inv_imp_' + Date.now(),
          data: formatDateToISO(new Date()),
          valor: comp.financeiro?.valorImplementacao || 1500,
          tipo: 'implementacao',
          status: 'pendente',
          linkBoleto: link,
        },
      ],
    });

    return link;
  }

  static async generateRecurringBoleto(code: string, link: string): Promise<string> {
    const comp = StorageService.getCompanyByCode(code);
    if (!comp) return '';

    await StorageService.updateCompanyBilling(code, {
      ultimoLinkPagamento: link,
      tipoUltimoLink: 'mensalidade',
      historicoCobrancas: [
        ...(comp.financeiro?.historicoCobrancas || []),
        {
          id: 'inv_rec_' + Date.now(),
          data: formatDateToISO(new Date()),
          valor: comp.financeiro?.valorMensalidade || 199,
          tipo: 'mensalidade',
          status: 'pendente',
          linkBoleto: link,
        },
      ],
    });

    return link;
  }

  static async toggleCompanyBillingSuspension(code: string): Promise<BillingStatus> {
    const comp = StorageService.getCompanyByCode(code);
    if (!comp) return 'cancelado';

    const currentStatus = comp.financeiro?.statusAssinatura || 'pendente';
    const newStatus: BillingStatus = currentStatus === 'suspenso' ? 'ativo' : 'suspenso';

    comp.ativo = newStatus === 'ativo';

    await StorageService.updateCompanyBilling(code, {
      statusAssinatura: newStatus,
    });

    return newStatus;
  }

  static async updateCompanyContract(code: string, updates: Partial<ContractInfo>): Promise<BakeryCompany | undefined> {
    const companies = StorageService.getCompanies();
    const comp = companies.find((c) => c.codigoAtivacao === code);
    if (!comp) return undefined;

    comp.contrato = {
      ...(comp.contrato || {
        contratoAceito: true,
        dataAssinaturaContrato: formatDateToISO(new Date()),
        dataVencimentoContrato: formatDateToISO(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
      }),
      ...updates,
    };

    if (updates.clienteCnpj) {
      comp.cnpj = updates.clienteCnpj;
    }

    // Keep billing values in sync with contract values
    if (comp.financeiro) {
      if (updates.valorImplementacao !== undefined) {
        comp.financeiro.valorImplementacao = updates.valorImplementacao;
      }
      if (updates.valorMensalidade !== undefined) {
        comp.financeiro.valorMensalidade = updates.valorMensalidade;
      }
    }

    setItem(KEYS.COMPANIES, companies);
    console.log("DADOS ANTES DO FIRESTORE", JSON.stringify(comp));
    await setDoc(doc(db, 'companies', code), removeUndefined(comp)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `companies/${code}`);
    });
    return comp;
  }

  static async updateCompanyBillingStatus(
    code: string,
    newStatus: BillingStatus,
    dueDate?: string
  ): Promise<BakeryCompany | undefined> {
    const companies = StorageService.getCompanies();
    const comp = companies.find((c) => c.codigoAtivacao === code);
    if (!comp) return undefined;

    const todayStr = formatDateToISO(new Date());
    const targetDueDate = dueDate || comp.financeiro?.dataProximaCobranca || todayStr;

    const isFullyActive = newStatus === 'concluido' || newStatus === 'ativo';

    comp.ativo = isFullyActive || newStatus === 'vencendo';

    comp.financeiro = {
      ...(comp.financeiro || {
        implementacaoPaga: false,
        valorImplementacao: 1500,
        assinaturaMensalAtiva: true,
        valorMensalidade: 199,
        dataProximaCobranca: targetDueDate,
        statusAssinatura: newStatus,
        historicoCobrancas: [],
      }),
      statusAssinatura: newStatus,
      dataProximaCobranca: targetDueDate,
      implementacaoPaga: isFullyActive ? true : (comp.financeiro?.implementacaoPaga ?? false),
    };

    setItem(KEYS.COMPANIES, companies);
    console.log("DADOS ANTES DO FIRESTORE", JSON.stringify(comp));
    await setDoc(doc(db, 'companies', code), removeUndefined(comp)).catch(() => {});
    return comp;
  }

  // Support Tickets
  static getTickets(bakeryCode?: string): SupportTicket[] {
    const all = getItem<SupportTicket[]>(KEYS.TICKETS, []);
    if (bakeryCode) {
      const cleanCode = bakeryCode.trim().toUpperCase();
      return all.filter((t) => t.bakeryCode.toUpperCase() === cleanCode);
    }
    return all;
  }

  static async createTicket(
    bakeryCode: string,
    empresaNome: string,
    assunto: string,
    descricao: string,
    prioridade: TicketPriority
  ): Promise<SupportTicket> {
    const tickets = StorageService.getTickets();
    const newTicket: SupportTicket = {
      id: 'tick_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      bakeryCode: bakeryCode.trim().toUpperCase(),
      empresaNome: empresaNome.trim(),
      assunto: assunto.trim(),
      descricao: descricao.trim(),
      prioridade,
      status: 'aberto',
      dataCriacao: new Date().toISOString(),
    };

    tickets.unshift(newTicket);
    setItem(KEYS.TICKETS, tickets);

    await setDoc(doc(db, 'tickets', newTicket.id), removeUndefined(newTicket)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `tickets/${newTicket.id}`);
    });

    return newTicket;
  }

  static async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    respostaSuporte?: string
  ): Promise<SupportTicket | null> {
    const tickets = StorageService.getTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    ticket.status = status;
    if (status === 'resolvido') {
      ticket.dataResolucao = new Date().toISOString();
    }
    if (respostaSuporte) {
      ticket.respostaSuporte = respostaSuporte.trim();
    }

    setItem(KEYS.TICKETS, tickets);

    await setDoc(doc(db, 'tickets', ticketId), removeUndefined(ticket)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `tickets/${ticketId}`);
    });

    return ticket;
  }

  // Products CRUD
  static getProducts(bakeryCode?: string): Product[] {
    const allProducts = getItem<Product[]>(KEYS.PRODUCTS, []);

    const updatedProducts = allProducts.map((p) => {
      const daysRemaining = calculateDaysRemaining(p.dataValidade);
      const status = getProductStatus(daysRemaining);
      return {
        ...p,
        diasParaVencer: daysRemaining,
        status,
      };
    });

    if (bakeryCode) {
      const cleanCode = bakeryCode.trim().toUpperCase();
      return updatedProducts.filter((p) => p.bakeryCode.toUpperCase() === cleanCode);
    }

    return updatedProducts;
  }

  static async addProduct(
    bakeryCode: string,
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
  ): Promise<Product> {
    const products = StorageService.getProducts();
    const bakeryProducts = products.filter((p) => p.bakeryCode === bakeryCode);

    if (bakeryProducts.length >= 500) {
      throw new Error('Limite máximo de 500 produtos por padaria atingido!');
    }

    const daysRemaining = calculateDaysRemaining(dataValidade);
    const calculatedValorTotal = valorTotal !== undefined && valorTotal > 0
      ? valorTotal
      : (peso && valorKg ? Number((peso * valorKg).toFixed(2)) : (valorKg ? Number((quantidade * valorKg).toFixed(2)) : undefined));

    const newProduct: Product = {
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      bakeryCode: bakeryCode.trim().toUpperCase(),
      nome: nome.trim(),
      quantidade: Math.max(1, Number(quantidade)),
      dataValidade,
      categoria: categoria ? categoria.trim() : 'Geral',
      dataCadastro: formatDateToISO(new Date()),
      diasParaVencer: daysRemaining,
      status: statusOverride !== undefined ? statusOverride : getProductStatus(daysRemaining),
      barcode: barcode ? barcode.trim() : '',
      peso: peso,
      valorKg: valorKg,
      dataFabricacao: dataFabricacao,
      valorTotal: calculatedValorTotal,
      motivo: motivo ? motivo.trim() : 'Vencimento',
      notas: notas ? notas.trim() : '',
    };

    products.unshift(newProduct);
    setItem(KEYS.PRODUCTS, products);

    await setDoc(doc(db, 'products', newProduct.id), removeUndefined(newProduct)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `products/${newProduct.id}`);
    });

    return newProduct;
  }

  static async updateProduct(
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
    peso?: number,
    statusOverride?: ProductStatus
  ): Promise<Product> {
    const products = StorageService.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Produto não encontrado');
    }

    const daysRemaining = calculateDaysRemaining(dataValidade);
    const newWeight = peso !== undefined ? peso : products[index].peso;
    const newValorKg = valorKg !== undefined ? valorKg : products[index].valorKg;
    const newQuantidade = Math.max(1, Number(quantidade));
    const calculatedValorTotal = valorTotal !== undefined
      ? valorTotal
      : (newWeight && newValorKg ? Number((newWeight * newValorKg).toFixed(2)) : (newValorKg ? Number((newQuantidade * newValorKg).toFixed(2)) : products[index].valorTotal));

    const updated: Product = {
      ...products[index],
      nome: nome.trim(),
      quantidade: newQuantidade,
      dataValidade,
      categoria: categoria ? categoria.trim() : products[index].categoria || 'Geral',
      diasParaVencer: daysRemaining,
      status: statusOverride !== undefined ? statusOverride : getProductStatus(daysRemaining),
      barcode: barcode !== undefined ? barcode.trim() : products[index].barcode,
      peso: newWeight,
      valorKg: newValorKg,
      dataFabricacao: dataFabricacao !== undefined ? dataFabricacao : products[index].dataFabricacao,
      valorTotal: calculatedValorTotal,
      motivo: motivo !== undefined ? motivo.trim() : products[index].motivo,
      notas: notas !== undefined ? notas.trim() : products[index].notas,
    };

    products[index] = updated;
    setItem(KEYS.PRODUCTS, products);

    await setDoc(doc(db, 'products', updated.id), removeUndefined(updated)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `products/${updated.id}`);
    });

    return updated;
  }

  static async deleteProduct(id: string): Promise<void> {
    let products = StorageService.getProducts();
    products = products.filter((p) => p.id !== id);
    setItem(KEYS.PRODUCTS, products);

    await deleteDoc(doc(db, 'products', id)).catch((e) => {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
    });
  }

  static async markAsSold(id: string): Promise<SaleHistoryItem | null> {
    const products = StorageService.getProducts();
    const product = products.find((p) => p.id === id);
    if (!product) return null;

    const historyItem: SaleHistoryItem = {
      id: 'sale_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      bakeryCode: product.bakeryCode,
      produtoId: product.id,
      nomeProduto: product.nome,
      quantidade: product.quantidade,
      dataValidade: product.dataValidade,
      dataVenda: new Date().toISOString(),
    };

    const history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    history.unshift(historyItem);
    setItem(KEYS.SALES_HISTORY, history);

    await setDoc(doc(db, 'sales', historyItem.id), removeUndefined(historyItem)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `sales/${historyItem.id}`);
    });

    await StorageService.deleteProduct(id);

    return historyItem;
  }

  static getSalesHistory(bakeryCode?: string): SaleHistoryItem[] {
    const history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    if (!bakeryCode) return history;
    const cleanCode = bakeryCode.trim().toUpperCase();
    return history.filter((h) => h.bakeryCode && h.bakeryCode.toUpperCase() === cleanCode);
  }

  static async restoreSoldProduct(historyId: string): Promise<Product | null> {
    const history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    const saleIndex = history.findIndex((h) => h.id === historyId);
    if (saleIndex === -1) return null;

    const item = history[saleIndex];

    const restoredProduct = await StorageService.addProduct(
      item.bakeryCode,
      item.nomeProduto,
      item.quantidade,
      item.dataValidade,
      'Restaurado'
    );

    history.splice(saleIndex, 1);
    setItem(KEYS.SALES_HISTORY, history);

    await deleteDoc(doc(db, 'sales', historyId)).catch(() => {});

    return restoredProduct;
  }

  static async clearSalesHistory(bakeryCode: string): Promise<void> {
    let history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    const cleanCode = bakeryCode.trim().toUpperCase();
    const toDelete = history.filter((h) => h.bakeryCode.toUpperCase() === cleanCode);
    for (const h of toDelete) {
      await deleteDoc(doc(db, 'sales', h.id)).catch(() => {});
    }

    history = history.filter((h) => h.bakeryCode.toUpperCase() !== cleanCode);
    setItem(KEYS.SALES_HISTORY, history);
  }

  // VIP Offers CRUD
  static subscribeVipOffers(callback: (offers: VipOffer[]) => void, bakeryCode?: string): Unsubscribe {
    let q: any = collection(db, 'vipOffers');
    if (bakeryCode) {
      q = query(q, where('bakeryCode', '==', bakeryCode.trim().toUpperCase()));
    }
    return onSnapshot(
      q,
      (snapshot) => {
        const offers: VipOffer[] = [];
        snapshot.forEach((d) => {
          const o = d.data() as VipOffer;
          if (o && o.id) {
            const daysRemaining = calculateDaysRemaining(o.dataValidade);
            offers.push({
              ...o,
              diasParaVencer: daysRemaining,
            });
          }
        });
        setItem(KEYS.VIP_OFFERS, offers);
        callback(offers);
      },
      (err) => {
        if (err.message?.includes('Quota') || String(err).includes('Quota')) {
          console.warn('Quota limit exceeded for vipOffers subscription, falling back to local storage.');
          callback(StorageService.getVipOffers(bakeryCode));
        } else {
          console.error('Error subscribing to vipOffers:', err);
        }
      }
    );
  }

  static getVipOffers(bakeryCode?: string): VipOffer[] {
    const all = getItem<VipOffer[]>(KEYS.VIP_OFFERS, []);
    const updated = all.map((o) => {
      const daysRemaining = calculateDaysRemaining(o.dataValidade);
      return {
        ...o,
        diasParaVencer: daysRemaining,
      };
    });

    if (bakeryCode) {
      const cleanCode = bakeryCode.trim().toUpperCase();
      return updated.filter((o) => o.bakeryCode.toUpperCase() === cleanCode);
    }
    return updated;
  }

  static async addVipOffer(
    bakeryCode: string,
    productId: string,
    nomeProduto: string,
    categoria: string,
    valorOriginal: number,
    valorPromocional: number,
    desconto: number,
    dataValidade: string,
    barcode?: string
  ): Promise<VipOffer> {
    const offers = StorageService.getVipOffers();
    const daysRemaining = calculateDaysRemaining(dataValidade);
    
    const newOffer: VipOffer = {
      id: 'vip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      bakeryCode: bakeryCode.trim().toUpperCase(),
      productId,
      nomeProduto: nomeProduto.trim(),
      categoria: categoria || 'Geral',
      valorOriginal: Number(valorOriginal),
      valorPromocional: Number(valorPromocional),
      desconto: Number(desconto),
      dataValidade,
      diasParaVencer: daysRemaining,
      status: 'ativo',
      barcode: barcode ? barcode.trim() : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    offers.unshift(newOffer);
    setItem(KEYS.VIP_OFFERS, offers);

    await setDoc(doc(db, 'vipOffers', newOffer.id), removeUndefined(newOffer)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `vipOffers/${newOffer.id}`);
    });

    return newOffer;
  }

  static async updateVipOfferStatus(
    id: string,
    status: 'ativo' | 'vendido' | 'descartado',
    additionalData?: { dataVenda?: string; valorVenda?: number }
  ): Promise<VipOffer | null> {
    const offers = StorageService.getVipOffers();
    const index = offers.findIndex((o) => o.id === id);
    if (index === -1) return null;

    const updated: VipOffer = {
      ...offers[index],
      status,
      updatedAt: new Date().toISOString(),
      ...additionalData,
    };

    offers[index] = updated;
    setItem(KEYS.VIP_OFFERS, offers);

    await setDoc(doc(db, 'vipOffers', id), removeUndefined(updated)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `vipOffers/${id}`);
    });

    return updated;
  }

  static async updateVipOffer(
    id: string,
    updates: {
      valorOriginal?: number;
      valorPromocional?: number;
      desconto?: number;
      nomeProduto?: string;
    }
  ): Promise<VipOffer | null> {
    const offers = StorageService.getVipOffers();
    const index = offers.findIndex((o) => o.id === id);
    if (index === -1) return null;

    const updated: VipOffer = {
      ...offers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    offers[index] = updated;
    setItem(KEYS.VIP_OFFERS, offers);

    await setDoc(doc(db, 'vipOffers', id), removeUndefined(updated)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `vipOffers/${id}`);
    });

    return updated;
  }

  static async deleteVipOffer(id: string): Promise<void> {
    let offers = StorageService.getVipOffers();
    offers = offers.filter((o) => o.id !== id);
    setItem(KEYS.VIP_OFFERS, offers);

    await deleteDoc(doc(db, 'vipOffers', id)).catch((e) => {
      handleFirestoreError(e, OperationType.DELETE, `vipOffers/${id}`);
    });
  }

  // Daily Closing Methods (Fechamento Inteligente)
  static getDailyClosings(bakeryCode?: string): DailyClosing[] {
    const all = getItem<DailyClosing[]>(KEYS.DAILY_CLOSINGS, []);
    if (!bakeryCode) return all;
    return all.filter((c) => c.bakeryCode.toUpperCase() === bakeryCode.trim().toUpperCase());
  }

  static async saveDailyClosing(closing: Omit<DailyClosing, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<DailyClosing> {
    const closings = StorageService.getDailyClosings();
    const now = new Date().toISOString();
    const id = closing.id || 'closing_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newClosing: DailyClosing = {
      ...closing,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const existingIdx = closings.findIndex((c) => c.id === id);
    if (existingIdx >= 0) {
      closings[existingIdx] = newClosing;
    } else {
      closings.unshift(newClosing);
    }

    setItem(KEYS.DAILY_CLOSINGS, closings);

    await setDoc(doc(db, 'dailyClosings', id), removeUndefined(newClosing)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `dailyClosings/${id}`);
    });

    return newClosing;
  }

  static subscribeDailyClosings(callback: (closings: DailyClosing[]) => void, bakeryCode?: string): Unsubscribe {
    let q: any = collection(db, 'dailyClosings');
    if (bakeryCode) {
      q = query(q, where('bakeryCode', '==', bakeryCode.trim().toUpperCase()));
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const closings: DailyClosing[] = [];
        snapshot.forEach((d) => {
          const c = d.data() as DailyClosing;
          closings.push(c);
        });
        closings.sort((a, b) => new Date(b.dataFechamento).getTime() - new Date(a.dataFechamento).getTime());
        setItem(KEYS.DAILY_CLOSINGS, closings);
        callback(closings);
      },
      (err) => {
        console.warn('Daily closings subscription error, using local storage fallback:', err);
        callback(StorageService.getDailyClosings(bakeryCode));
      }
    );

    return unsub;
  }

  static getAdminStats(): AdminStats {
    const companies = StorageService.getCompanies();
    const products = StorageService.getProducts();

    return {
      totalPadarias: companies.length,
      padariasAtivas: companies.filter((c) => c.ativo).length,
      totalProdutos: products.length,
      produtosVencidos: products.filter((p) => p.status === 'vencido').length,
    };
  }

  // ON-DEMAND SERVERSIDE FETCHERS (Extremely cost-effective, no permanent listeners)
  static async getCompaniesFromServer(): Promise<BakeryCompany[]> {
    if (!auth.currentUser) {
      console.warn('[DATA] getCompaniesFromServer skipped: user not authenticated');
      return StorageService.getCompanies();
    }
    try {
      const compSnap = await getDocs(collection(db, 'companies'));
      const remoteCompanies: BakeryCompany[] = [];
      compSnap.forEach((d) => {
        const data = d.data() as BakeryCompany;
        if (data && data.codigoAtivacao) {
          const cleanCode = data.codigoAtivacao.trim().toUpperCase();
          if (EXCLUDED_CODES.includes(cleanCode)) {
            deleteDoc(doc(db, 'companies', d.id)).catch(() => {});
          } else {
            remoteCompanies.push(data);
          }
        }
      });
      const validated = StorageService.validateAndCheckTrials(remoteCompanies);
      setItem(KEYS.COMPANIES, validated);
      return validated;
    } catch (e) {
      console.error('Error fetching companies from server:', e);
      return StorageService.getCompanies();
    }
  }

  static async getProductsFromServer(bakeryCode: string): Promise<Product[]> {
    if (!auth.currentUser) {
      console.warn('[DATA] getProductsFromServer skipped: user not authenticated');
      return StorageService.getProducts(bakeryCode);
    }
    try {
      const q = query(collection(db, 'products'), where('bakeryCode', '==', bakeryCode.trim().toUpperCase()));
      const snapshot = await getDocs(q);
      const products: Product[] = [];
      snapshot.forEach((d) => {
        const p = d.data() as Product;
        if (p && p.id) {
          if (
            !(p.bakeryCode && EXCLUDED_CODES.includes(p.bakeryCode.trim().toUpperCase())) &&
            !DEMO_PROD_IDS.includes(p.id)
          ) {
            const daysRemaining = calculateDaysRemaining(p.dataValidade);
            const status = getProductStatus(daysRemaining);
            products.push({
              ...p,
              diasParaVencer: daysRemaining,
              status,
            });
          }
        }
      });
      // Store only this tenant's products locally to isolate
      setItem(`padarias_products_${bakeryCode.trim().toUpperCase()}`, products);
      setItem(KEYS.PRODUCTS, products); // backward compatibility
      return products;
    } catch (e) {
      console.error('Error fetching products from Firestore:', e);
      return StorageService.getProducts(bakeryCode);
    }
  }

  static async getSalesHistoryFromServer(
    bakeryCode: string,
    startDate?: string,
    endDate?: string,
    limitCount = 300
  ): Promise<SaleHistoryItem[]> {
    if (!auth.currentUser) {
      console.warn('[DATA] getSalesHistoryFromServer skipped: user not authenticated');
      return StorageService.getSalesHistory(bakeryCode);
    }
    try {
      const q = query(
        collection(db, 'sales'),
        where('bakeryCode', '==', bakeryCode.trim().toUpperCase())
      );
      const snapshot = await getDocs(q);
      let sales: SaleHistoryItem[] = [];
      snapshot.forEach((d) => {
        const s = d.data() as SaleHistoryItem;
        if (s && s.id) {
          if (!(s.bakeryCode && EXCLUDED_CODES.includes(s.bakeryCode.trim().toUpperCase()))) {
            sales.push(s);
          }
        }
      });

      // Sort by date descending
      sales.sort((a, b) => new Date(b.dataVenda).getTime() - new Date(a.dataVenda).getTime());

      // Filter by period
      if (startDate) {
        sales = sales.filter((s) => s.dataVenda >= startDate);
      }
      if (endDate) {
        sales = sales.filter((s) => s.dataVenda <= endDate + 'T23:59:59');
      }

      const isolatedKey = `padarias_sales_history_${bakeryCode.trim().toUpperCase()}`;
      setItem(isolatedKey, sales);
      setItem(KEYS.SALES_HISTORY, sales); // backward compatibility
      return sales.slice(0, limitCount);
    } catch (e) {
      console.error('Error fetching sales history from server:', e);
      return StorageService.getSalesHistory(bakeryCode);
    }
  }

  static async getVipOffersFromServer(bakeryCode: string): Promise<VipOffer[]> {
    if (!auth.currentUser) {
      console.warn('[DATA] getVipOffersFromServer skipped: user not authenticated');
      return StorageService.getVipOffers(bakeryCode);
    }
    try {
      const q = query(
        collection(db, 'vipOffers'),
        where('bakeryCode', '==', bakeryCode.trim().toUpperCase())
      );
      const snapshot = await getDocs(q);
      const offers: VipOffer[] = [];
      snapshot.forEach((d) => {
        const o = d.data() as VipOffer;
        if (o && o.id) {
          offers.push({
            ...o,
            diasParaVencer: calculateDaysRemaining(o.dataValidade),
          });
        }
      });
      const isolatedKey = `padarias_vip_offers_${bakeryCode.trim().toUpperCase()}`;
      setItem(isolatedKey, offers);
      setItem(KEYS.VIP_OFFERS, offers); // backward compatibility
      return offers;
    } catch (e) {
      console.error('Error fetching VIP offers:', e);
      return StorageService.getVipOffers(bakeryCode);
    }
  }

  static async getDailyClosingsFromServer(bakeryCode: string, limitCount = 90): Promise<DailyClosing[]> {
    if (!auth.currentUser) {
      console.warn('[DATA] getDailyClosingsFromServer skipped: user not authenticated');
      return StorageService.getDailyClosings(bakeryCode);
    }
    try {
      const q = query(
        collection(db, 'dailyClosings'),
        where('bakeryCode', '==', bakeryCode.trim().toUpperCase())
      );
      const snapshot = await getDocs(q);
      const closings: DailyClosing[] = [];
      snapshot.forEach((d) => {
        const c = d.data() as DailyClosing;
        if (c && c.id) {
          closings.push(c);
        }
      });
      closings.sort((a, b) => new Date(b.dataFechamento).getTime() - new Date(a.dataFechamento).getTime());
      const isolatedKey = `padarias_fechamentos_${bakeryCode.trim().toUpperCase()}`;
      setItem(isolatedKey, closings);
      setItem(KEYS.DAILY_CLOSINGS, closings); // backward compatibility
      return closings.slice(0, limitCount);
    } catch (e) {
      console.error('Error fetching daily closings:', e);
      return StorageService.getDailyClosings(bakeryCode);
    }
  }

  static async getTicketsFromServer(bakeryCode?: string): Promise<SupportTicket[]> {
    if (!auth.currentUser) {
      console.warn('[DATA] getTicketsFromServer skipped: user not authenticated');
      return StorageService.getTickets(bakeryCode);
    }
    try {
      let q: any = collection(db, 'tickets');
      if (bakeryCode) {
        q = query(q, where('bakeryCode', '==', bakeryCode.trim().toUpperCase()));
      }
      const snapshot = await getDocs(q);
      const tickets: SupportTicket[] = [];
      snapshot.forEach((d) => {
        const t = d.data() as SupportTicket;
        if (t && t.id) {
          if (!(t.bakeryCode && EXCLUDED_CODES.includes(t.bakeryCode.trim().toUpperCase()))) {
            tickets.push(t);
          }
        }
      });
      if (bakeryCode) {
        const isolatedKey = `padarias_tickets_${bakeryCode.trim().toUpperCase()}`;
        setItem(isolatedKey, tickets);
      }
      setItem(KEYS.TICKETS, tickets); // backward compatibility
      return tickets;
    } catch (e) {
      console.error('Error fetching tickets from server:', e);
      return StorageService.getTickets(bakeryCode);
    }
  }

  // Admin global fetches
  static async getProductsFromServerAdmin(): Promise<Product[]> {
    if (!auth.currentUser) {
      return StorageService.getProducts();
    }
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const products: Product[] = [];
      snapshot.forEach((d) => {
        const p = d.data() as Product;
        if (p && p.id) {
          if (
            !(p.bakeryCode && EXCLUDED_CODES.includes(p.bakeryCode.trim().toUpperCase())) &&
            !DEMO_PROD_IDS.includes(p.id)
          ) {
            const daysRemaining = calculateDaysRemaining(p.dataValidade);
            const status = getProductStatus(daysRemaining);
            products.push({
              ...p,
              diasParaVencer: daysRemaining,
              status,
            });
          }
        }
      });
      setItem(KEYS.PRODUCTS, products);
      return products;
    } catch (e) {
      console.error('Error fetching admin products:', e);
      return StorageService.getProducts();
    }
  }

  static async getSalesHistoryFromServerAdmin(): Promise<SaleHistoryItem[]> {
    if (!auth.currentUser) {
      return StorageService.getSalesHistory();
    }
    try {
      const snapshot = await getDocs(collection(db, 'sales'));
      const sales: SaleHistoryItem[] = [];
      snapshot.forEach((d) => {
        const s = d.data() as SaleHistoryItem;
        if (s && s.id) {
          if (!(s.bakeryCode && EXCLUDED_CODES.includes(s.bakeryCode.trim().toUpperCase()))) {
            sales.push(s);
          }
        }
      });
      setItem(KEYS.SALES_HISTORY, sales);
      return sales;
    } catch (e) {
      console.error('Error fetching admin sales:', e);
      return StorageService.getSalesHistory();
    }
  }

  static async getVipOffersFromServerAdmin(): Promise<VipOffer[]> {
    if (!auth.currentUser) {
      return StorageService.getVipOffers();
    }
    try {
      const snapshot = await getDocs(collection(db, 'vipOffers'));
      const offers: VipOffer[] = [];
      snapshot.forEach((d) => {
        const o = d.data() as VipOffer;
        if (o && o.id) {
          offers.push({
            ...o,
            diasParaVencer: calculateDaysRemaining(o.dataValidade),
          });
        }
      });
      setItem(KEYS.VIP_OFFERS, offers);
      return offers;
    } catch (e) {
      console.error('Error fetching admin VIP offers:', e);
      return StorageService.getVipOffers();
    }
  }

  static async getDailyClosingsFromServerAdmin(): Promise<DailyClosing[]> {
    if (!auth.currentUser) {
      return StorageService.getDailyClosings();
    }
    try {
      const snapshot = await getDocs(collection(db, 'dailyClosings'));
      const closings: DailyClosing[] = [];
      snapshot.forEach((d) => {
        const c = d.data() as DailyClosing;
        if (c && c.id) {
          closings.push(c);
        }
      });
      setItem(KEYS.DAILY_CLOSINGS, closings);
      return closings;
    } catch (e) {
      console.error('Error fetching admin daily closings:', e);
      return StorageService.getDailyClosings();
    }
  }

  static resetAllData(): void {
    setItem(KEYS.COMPANIES, []);
    setItem(KEYS.PRODUCTS, []);
    setItem(KEYS.SALES_HISTORY, []);
    setItem(KEYS.TICKETS, []);
    setItem(KEYS.VIP_OFFERS, []);
    setItem(KEYS.ADMIN_PASSWORD, 'admin123');
    setItem(KEYS.ADMIN_AUTH, false);
    setItem(KEYS.BAKERY_SESSION, null);
  }

  static async getUserBakeryMapping(uid: string): Promise<{ bakeryCode: string; role: string } | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists() && snap.data()?.bakeryCode) {
        return snap.data() as { bakeryCode: string; role: string };
      }
      const mappingSnap = await getDoc(doc(db, 'user_bakery_mappings', uid));
      if (mappingSnap.exists() && mappingSnap.data()?.bakeryCode) {
        return mappingSnap.data() as { bakeryCode: string; role: string };
      }
      return null;
    } catch (e) {
      console.error('Error fetching user bakery mapping:', e);
      return null;
    }
  }

  static async setUserBakeryMapping(uid: string, bakeryCode: string, email: string, role: string = 'owner'): Promise<void> {
    const cleanCode = bakeryCode.trim().toUpperCase();
    const data = removeUndefined({
      uid,
      bakeryCode: cleanCode,
      email,
      role,
      updatedAt: new Date().toISOString()
    });
    try {
      await Promise.all([
        setDoc(doc(db, 'users', uid), data, { merge: true }).catch((err) => console.warn('Warning updating /users doc:', err)),
        setDoc(doc(db, 'user_bakery_mappings', uid), data, { merge: true }).catch((err) => console.warn('Warning updating /user_bakery_mappings doc:', err))
      ]);
    } catch (e) {
      console.error('Error setting user bakery mapping:', e);
    }
  }

  // Inventory Movements CRUD & Server Sync
  static getInventoryMovements(bakeryCode?: string): InventoryMovement[] {
    const all = getItem<InventoryMovement[]>(KEYS.INVENTORY_MOVEMENTS, []);
    if (!bakeryCode) return all;
    const cleanCode = bakeryCode.trim().toUpperCase();
    return all.filter((m) => m.bakeryCode && m.bakeryCode.toUpperCase() === cleanCode);
  }

  static async addInventoryMovement(
    bakeryCode: string,
    productId: string,
    productName: string,
    type: MovementType,
    quantity: number,
    unit: string = 'kg',
    costAtMovement: number = 0,
    reason?: string,
    createdBy?: string,
    skipStockSync: boolean = false
  ): Promise<InventoryMovement> {
    const movements = StorageService.getInventoryMovements();
    const id = 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const cleanCode = bakeryCode.trim().toUpperCase();

    const movement: InventoryMovement = {
      id,
      bakeryCode: cleanCode,
      productId,
      productName,
      type,
      quantity: Number(quantity),
      unit: unit || 'kg',
      costAtMovement: Number(costAtMovement) || 0,
      reason: reason || '',
      createdAt: new Date().toISOString(),
      createdBy: createdBy || 'sistema',
    };

    movements.unshift(movement);
    setItem(KEYS.INVENTORY_MOVEMENTS, movements);

    await setDoc(doc(db, 'inventoryMovements', id), removeUndefined(movement)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `inventoryMovements/${id}`);
    });

    if (!skipStockSync) {
      // Sync with InventoryItem currentQuantity if it is an inventory item
      const items = StorageService.getInventoryItems();
      const itemIdx = items.findIndex((i) => i.id === productId);
      if (itemIdx >= 0) {
        const item = items[itemIdx];
        let qtyChange = Number(quantity);
        if (type === 'SALE' || type === 'WASTE' || type === 'INTERNAL_USE') {
          qtyChange = -Math.abs(qtyChange);
        }
        const newQty = Number((item.currentQuantity + qtyChange).toFixed(3));
        item.currentQuantity = Math.max(0, newQty);
        item.updatedAt = new Date().toISOString();
        setItem(KEYS.INVENTORY_ITEMS, items);

        await setDoc(doc(db, 'inventoryItems', productId), removeUndefined(item)).catch((e) => {
          handleFirestoreError(e, OperationType.WRITE, `inventoryItems/${productId}`);
        });
      }

      // Sync with Products list if productId matches a product
      const products = StorageService.getProducts(cleanCode);
      const prodIdx = products.findIndex((p) => p.id === productId);
      if (prodIdx >= 0) {
        const targetProd = products[prodIdx];
        let qtyChange = Number(quantity);
        if (type === 'SALE' || type === 'WASTE' || type === 'INTERNAL_USE') {
          qtyChange = -Math.abs(qtyChange);
        }
        const newQty = Math.max(0, Number((targetProd.quantidade + qtyChange).toFixed(3)));
        const newWeight = targetProd.peso && targetProd.quantidade > 0
          ? Math.max(0, Number((targetProd.peso + (qtyChange * (targetProd.peso / targetProd.quantidade))).toFixed(3)))
          : targetProd.peso;
        const unitCost = costAtMovement || targetProd.valorKg;
        const newValorTotal = unitCost && unitCost > 0
          ? Number((newWeight ? newWeight * unitCost : newQty * unitCost).toFixed(2))
          : targetProd.valorTotal;

        await StorageService.updateProduct(
          targetProd.id,
          targetProd.nome,
          newQty,
          targetProd.dataValidade,
          targetProd.categoria,
          targetProd.barcode,
          unitCost,
          targetProd.dataFabricacao,
          newValorTotal,
          targetProd.motivo,
          targetProd.notas,
          newWeight
        );
      }
    }

    return movement;
  }

  static async getInventoryMovementsFromServer(bakeryCode: string): Promise<InventoryMovement[]> {
    if (!auth.currentUser) {
      console.warn('[DATA] getInventoryMovementsFromServer skipped: user not authenticated');
      return StorageService.getInventoryMovements(bakeryCode);
    }
    try {
      const q = query(
        collection(db, 'inventoryMovements'),
        where('bakeryCode', '==', bakeryCode.trim().toUpperCase())
      );
      const snapshot = await getDocs(q);
      const list: InventoryMovement[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as InventoryMovement;
        if (item && item.id) list.push(item);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItem(`padarias_movements_${bakeryCode.trim().toUpperCase()}`, list);
      setItem(KEYS.INVENTORY_MOVEMENTS, list);
      return list;
    } catch (e) {
      console.error('Error fetching inventory movements from server:', e);
      return StorageService.getInventoryMovements(bakeryCode);
    }
  }

  // Stock Counts / Physical Inventory CRUD & Server Sync
  static getStockCounts(bakeryCode?: string): StockCount[] {
    const all = getItem<StockCount[]>(KEYS.STOCK_COUNTS, []);
    if (!bakeryCode) return all;
    const cleanCode = bakeryCode.trim().toUpperCase();
    return all.filter((c) => c.bakeryCode && c.bakeryCode.toUpperCase() === cleanCode);
  }

  static async addStockCount(
    bakeryCode: string,
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
    notes?: string,
    countedBy?: string
  ): Promise<StockCount> {
    const counts = StorageService.getStockCounts();
    const id = 'count_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const cleanCode = bakeryCode.trim().toUpperCase();

    const initial = Number(initialQuantity) || 0;
    const entries = Number(entriesQuantity) || 0;
    const production = Number(productionQuantity) || 0;
    const waste = Number(wasteQuantity) || 0;
    const expected = Number(expectedQuantity) || (initial - production - waste + entries);
    const physical = Number(physicalQuantity) || 0;
    const varianceQty = Number((physical - expected).toFixed(3));
    const cost = Number(unitCost) || 0;
    const varianceVal = Number((Math.abs(varianceQty) * cost).toFixed(2));

    const stockCount: StockCount = {
      id,
      bakeryCode: cleanCode,
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
      unit: unit || 'kg',
      unitCost: cost,
      notes: notes || '',
      countedAt: new Date().toISOString(),
      countedBy: countedBy || 'sistema',
    };

    counts.unshift(stockCount);
    setItem(KEYS.STOCK_COUNTS, counts);

    await setDoc(doc(db, 'stockCounts', id), removeUndefined(stockCount)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `stockCounts/${id}`);
    });

    // Directly set physical quantity as the current reference quantity for the item (no double addition)
    const items = StorageService.getInventoryItems();
    const itemIdx = items.findIndex((i) => i.id === productId);
    if (itemIdx >= 0) {
      const item = items[itemIdx];
      item.currentQuantity = physical;
      item.updatedAt = new Date().toISOString();
      setItem(KEYS.INVENTORY_ITEMS, items);

      await setDoc(doc(db, 'inventoryItems', productId), removeUndefined(item)).catch((e) => {
        handleFirestoreError(e, OperationType.WRITE, `inventoryItems/${productId}`);
      });
    }

    // Update product quantity to match physical count if it matches a Product
    const products = StorageService.getProducts(cleanCode);
    const prodIdx = products.findIndex((p) => p.id === productId);
    if (prodIdx >= 0) {
      const targetProd = products[prodIdx];
      const newWeight = targetProd.peso && targetProd.quantidade > 0
        ? Number((physical * (targetProd.peso / targetProd.quantidade)).toFixed(3))
        : targetProd.peso;
      const unitCost = cost || targetProd.valorKg;
      const newValorTotal = unitCost && unitCost > 0
        ? Number((newWeight ? newWeight * unitCost : physical * unitCost).toFixed(2))
        : targetProd.valorTotal;

      await StorageService.updateProduct(
        targetProd.id,
        targetProd.nome,
        physical,
        targetProd.dataValidade,
        targetProd.categoria,
        targetProd.barcode,
        unitCost,
        targetProd.dataFabricacao,
        newValorTotal,
        targetProd.motivo,
        targetProd.notas,
        newWeight
      );
    }

    return stockCount;
  }

  static async getStockCountsFromServer(bakeryCode: string): Promise<StockCount[]> {
    if (!auth.currentUser) {
      console.warn('[DATA] getStockCountsFromServer skipped: user not authenticated');
      return StorageService.getStockCounts(bakeryCode);
    }
    try {
      const q = query(
        collection(db, 'stockCounts'),
        where('bakeryCode', '==', bakeryCode.trim().toUpperCase())
      );
      const snapshot = await getDocs(q);
      const list: StockCount[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as StockCount;
        if (item && item.id) list.push(item);
      });
      list.sort((a, b) => new Date(b.countedAt).getTime() - new Date(a.countedAt).getTime());
      setItem(`padarias_counts_${bakeryCode.trim().toUpperCase()}`, list);
      setItem(KEYS.STOCK_COUNTS, list);
      return list;
    } catch (e) {
      console.error('Error fetching stock counts from server:', e);
      return StorageService.getStockCounts(bakeryCode);
    }
  }

  // Inventory Items (Stock module items) CRUD & Server Sync
  static getInventoryItems(bakeryCode?: string): InventoryItem[] {
    const all = getItem<InventoryItem[]>(KEYS.INVENTORY_ITEMS, []);
    if (!bakeryCode) return all;
    const cleanCode = bakeryCode.trim().toUpperCase();
    return all.filter((i) => i.bakeryCode && i.bakeryCode.toUpperCase() === cleanCode);
  }

  static async addInventoryItem(
    bakeryCode: string,
    name: string,
    unit: string,
    initialQuantity: number,
    unitCost: number,
    createdBy?: string
  ): Promise<InventoryItem> {
    const items = StorageService.getInventoryItems();
    const id = 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const cleanCode = bakeryCode.trim().toUpperCase();

    const newQty = Number(initialQuantity) || 0;
    const cost = Number(unitCost) || 0;

    const inventoryItem: InventoryItem = {
      id,
      bakeryCode: cleanCode,
      name: name.trim(),
      unit: unit || 'kg',
      currentQuantity: newQty,
      initialQuantity: newQty,
      unitCost: cost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: createdBy || 'sistema',
    };

    items.unshift(inventoryItem);
    setItem(KEYS.INVENTORY_ITEMS, items);

    await setDoc(doc(db, 'inventoryItems', id), removeUndefined(inventoryItem)).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `inventoryItems/${id}`);
    });

    // Register initial ENTRY movement for this newly created inventory item
    await StorageService.addInventoryMovement(
      cleanCode,
      id,
      name.trim(),
      'ENTRY',
      newQty,
      unit || 'kg',
      cost,
      'Quantidade inicial no cadastro do item',
      createdBy,
      true
    );

    return inventoryItem;
  }

  static async getInventoryItemsFromServer(bakeryCode: string): Promise<InventoryItem[]> {
    if (!auth.currentUser) {
      console.warn('[DATA] getInventoryItemsFromServer skipped: user not authenticated');
      return StorageService.getInventoryItems(bakeryCode);
    }
    try {
      const q = query(
        collection(db, 'inventoryItems'),
        where('bakeryCode', '==', bakeryCode.trim().toUpperCase())
      );
      const snapshot = await getDocs(q);
      const list: InventoryItem[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as InventoryItem;
        if (item && item.id) list.push(item);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItem(`padarias_inv_items_${bakeryCode.trim().toUpperCase()}`, list);
      setItem(KEYS.INVENTORY_ITEMS, list);
      return list;
    } catch (e) {
      console.error('Error fetching inventory items from server:', e);
      return StorageService.getInventoryItems(bakeryCode);
    }
  }
}
