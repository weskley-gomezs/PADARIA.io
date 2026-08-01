import { BakeryCompany, Product, SaleHistoryItem, AdminStats, SupportTicket, TicketPriority, TicketStatus, FinancialStats, BillingInfo, BillingStatus, ContractInfo, VipOffer } from '../types/index.js';
import { calculateDaysRemaining, getProductStatus, formatDateToISO, generateActivationCode } from '../utils/dateUtils.js';
import { db, testFirestoreConnection } from './firebase.js';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
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

  // Initialize and sync with Firestore
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

    if (!StorageService.isInitialized) {
      StorageService.isInitialized = true;
      testFirestoreConnection();
      await StorageService.pullFromFirestore();
    }
  }

  // Real-time Subscriptions using Firestore onSnapshot
  static subscribeCompanies(callback: (companies: BakeryCompany[]) => void): Unsubscribe {
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
        setItem(KEYS.COMPANIES, companies);
        callback(companies);
      },
      (err) => {
        if (err.message?.includes('Quota') || String(err).includes('Quota')) {
          console.warn('Quota limit exceeded for companies subscription, falling back to local storage.');
        } else {
          console.error('Error subscribing to companies:', err);
        }
      }
    );
  }

  static subscribeProducts(callback: (products: Product[]) => void, bakeryCode?: string): Unsubscribe {
    const colRef = collection(db, 'products');
    return onSnapshot(
      colRef,
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
        setItem(KEYS.PRODUCTS, products);

        if (bakeryCode) {
          const cleanCode = bakeryCode.trim().toUpperCase();
          callback(products.filter((p) => p.bakeryCode.toUpperCase() === cleanCode));
        } else {
          callback(products);
        }
      },
      (err) => {
        if (err.message?.includes('Quota') || String(err).includes('Quota')) {
          console.warn('Quota limit exceeded for products subscription, falling back to local storage.');
        } else {
          console.error('Error subscribing to products:', err);
        }
      }
    );
  }

  static subscribeSalesHistory(callback: (sales: SaleHistoryItem[]) => void, bakeryCode?: string): Unsubscribe {
    const colRef = collection(db, 'sales');
    return onSnapshot(
      colRef,
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

        if (bakeryCode) {
          const cleanCode = bakeryCode.trim().toUpperCase();
          callback(sales.filter((s) => s.bakeryCode.toUpperCase() === cleanCode));
        } else {
          callback(sales);
        }
      },
      (err) => {
        if (err.message?.includes('Quota') || String(err).includes('Quota')) {
          console.warn('Quota limit exceeded for sales subscription, falling back to local storage.');
        } else {
          console.error('Error subscribing to sales:', err);
        }
      }
    );
  }

  static subscribeTickets(callback: (tickets: SupportTicket[]) => void, bakeryCode?: string): Unsubscribe {
    const colRef = collection(db, 'tickets');
    return onSnapshot(
      colRef,
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

        if (bakeryCode) {
          const cleanCode = bakeryCode.trim().toUpperCase();
          callback(tickets.filter((t) => t.bakeryCode.toUpperCase() === cleanCode));
        } else {
          callback(tickets);
        }
      },
      (err) => {
        if (err.message?.includes('Quota') || String(err).includes('Quota')) {
          console.warn('Quota limit exceeded for tickets subscription, falling back to local storage.');
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
    try {
      // 1. Settings
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

      // 2. Companies
      try {
        const compSnap = await getDocs(collection(db, 'companies'));
        if (!compSnap.empty) {
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
          setItem(KEYS.COMPANIES, remoteCompanies);
        }
      } catch (e) {
        console.warn('Firestore fetch companies warning:', e);
      }

      // 3. Products
      try {
        const prodSnap = await getDocs(collection(db, 'products'));
        if (!prodSnap.empty) {
          const remoteProducts: Product[] = [];
          prodSnap.forEach((d) => {
            const data = d.data() as Product;
            if (data && data.bakeryCode) {
              const cleanCode = data.bakeryCode.trim().toUpperCase();
              if (EXCLUDED_CODES.includes(cleanCode) || DEMO_PROD_IDS.includes(data.id)) {
                deleteDoc(doc(db, 'products', d.id)).catch(() => {});
              } else {
                remoteProducts.push(data);
              }
            }
          });
          setItem(KEYS.PRODUCTS, remoteProducts);
        }
      } catch (e) {
        console.warn('Firestore fetch products warning:', e);
      }

      // 4. Sales History
      try {
        const salesSnap = await getDocs(collection(db, 'sales'));
        if (!salesSnap.empty) {
          const remoteSales: SaleHistoryItem[] = [];
          salesSnap.forEach((d) => remoteSales.push(d.data() as SaleHistoryItem));
          setItem(KEYS.SALES_HISTORY, remoteSales);
        }
      } catch (e) {
        console.warn('Firestore fetch sales warning:', e);
      }

      // 5. Tickets
      try {
        const ticketsSnap = await getDocs(collection(db, 'tickets'));
        if (!ticketsSnap.empty) {
          const remoteTickets: SupportTicket[] = [];
          ticketsSnap.forEach((d) => remoteTickets.push(d.data() as SupportTicket));
          setItem(KEYS.TICKETS, remoteTickets);
        }
      } catch (e) {
        console.warn('Firestore fetch tickets warning:', e);
      }

      // 6. VIP Offers
      try {
        const vipSnap = await getDocs(collection(db, 'vipOffers'));
        if (!vipSnap.empty) {
          const remoteVipOffers: VipOffer[] = [];
          vipSnap.forEach((d) => remoteVipOffers.push(d.data() as VipOffer));
          setItem(KEYS.VIP_OFFERS, remoteVipOffers);
        }
      } catch (e) {
        console.warn('Firestore fetch vipOffers warning:', e);
      }
    } catch (err: any) {
      if (err.message?.includes('Quota') || String(err).includes('Quota')) {
        console.warn('Quota limit exceeded during pullFromFirestore, falling back to local storage.');
      } else {
        console.error('Error syncing from Firestore:', err);
      }
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

  // Companies CRUD
  static getCompanies(): BakeryCompany[] {
    return getItem<BakeryCompany[]>(KEYS.COMPANIES, []);
  }

  static getCompanyByCode(code: string): BakeryCompany | undefined {
    const companies = StorageService.getCompanies();
    const cleanCode = code.trim().toUpperCase();
    return companies.find((c) => c.codigoAtivacao.toUpperCase() === cleanCode);
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
    return companies.find((c) => {
      const emailMatches = c.email.trim().toLowerCase() === cleanEmail;
      const storedPwd = (c.senha && c.senha.trim()) ? c.senha.trim() : 'padaria123';
      const passMatches = storedPwd === cleanPass || c.codigoAtivacao.toUpperCase() === cleanPass.toUpperCase();
      return emailMatches && passMatches;
    });
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

  static async addCompany(
    empresa: string,
    email: string,
    senha?: string,
    telefone?: string,
    cnpj?: string,
    valorImplementacao = 1500,
    valorMensalidade = 199,
    teste1Dia = false,
    asaasInfo?: {
      customerId?: string;
      subscriptionId?: string;
      paymentLink?: string;
      asaasEnvironment?: 'sandbox' | 'production';
    },
    dataInicioCobranca?: string
  ): Promise<BakeryCompany> {
    const companies = StorageService.getCompanies();
    let code = generateActivationCode();
    while (companies.some((c) => c.codigoAtivacao === code)) {
      code = generateActivationCode();
    }

    const todayStr = formatDateToISO(new Date());
    let nextDueDateStr = '';

    if (dataInicioCobranca && dataInicioCobranca.trim() !== '') {
      nextDueDateStr = dataInicioCobranca.trim();
    } else {
      const nextMonth = new Date();
      if (teste1Dia) {
        nextMonth.setDate(nextMonth.getDate() + 1);
      } else {
        nextMonth.setMonth(nextMonth.getMonth() + 1);
      }
      nextDueDateStr = formatDateToISO(nextMonth);
    }

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = formatDateToISO(nextYear);

    const defaultBilling: BillingInfo = {
      implementacaoPaga: false,
      valorImplementacao: Number(valorImplementacao) || 1500,
      assinaturaMensalAtiva: true,
      valorMensalidade: Number(valorMensalidade) || 199,
      dataProximaCobranca: nextDueDateStr,
      statusAssinatura: teste1Dia ? 'ativo' : 'pendente',
      teste1Dia: teste1Dia,
      asaasCustomerId: asaasInfo?.customerId || null,
      asaasSubscriptionId: asaasInfo?.subscriptionId || null,
      asaasPaymentLink: asaasInfo?.paymentLink || null,
      asaasEnvironment: asaasInfo?.asaasEnvironment || 'sandbox',
      ultimoLinkPagamento: asaasInfo?.paymentLink || null,
      tipoUltimoLink: 'implementacao',
      historicoCobrancas: [
        {
          id: 'inv_' + Date.now(),
          data: todayStr,
          valor: Number(valorImplementacao) || 1500,
          tipo: 'implementacao',
          status: 'pendente',
          linkBoleto: asaasInfo?.paymentLink || '',
        },
      ],
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
        valorImplementacao: Number(valorImplementacao) || 1500,
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
    peso?: number
  ): Promise<Product> {
    const products = StorageService.getProducts();
    const bakeryProducts = products.filter((p) => p.bakeryCode === bakeryCode);

    if (bakeryProducts.length >= 500) {
      throw new Error('Limite máximo de 500 produtos por padaria atingido!');
    }

    const daysRemaining = calculateDaysRemaining(dataValidade);
    const newProduct: Product = {
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      bakeryCode: bakeryCode.trim().toUpperCase(),
      nome: nome.trim(),
      quantidade: Math.max(1, Number(quantidade)),
      dataValidade,
      categoria: categoria ? categoria.trim() : 'Geral',
      dataCadastro: formatDateToISO(new Date()),
      diasParaVencer: daysRemaining,
      status: getProductStatus(daysRemaining),
      barcode: barcode ? barcode.trim() : '',
      peso: peso,
      valorKg: valorKg,
      dataFabricacao: dataFabricacao,
      valorTotal: valorTotal,
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
    peso?: number
  ): Promise<Product> {
    const products = StorageService.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Produto não encontrado');
    }

    const daysRemaining = calculateDaysRemaining(dataValidade);
    const updated: Product = {
      ...products[index],
      nome: nome.trim(),
      quantidade: Math.max(1, Number(quantidade)),
      dataValidade,
      categoria: categoria ? categoria.trim() : products[index].categoria || 'Geral',
      diasParaVencer: daysRemaining,
      status: getProductStatus(daysRemaining),
      barcode: barcode !== undefined ? barcode.trim() : products[index].barcode,
      peso: peso !== undefined ? peso : products[index].peso,
      valorKg: valorKg !== undefined ? valorKg : products[index].valorKg,
      dataFabricacao: dataFabricacao !== undefined ? dataFabricacao : products[index].dataFabricacao,
      valorTotal: valorTotal !== undefined ? valorTotal : products[index].valorTotal,
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

  static getSalesHistory(bakeryCode: string): SaleHistoryItem[] {
    const history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    const cleanCode = bakeryCode.trim().toUpperCase();
    return history.filter((h) => h.bakeryCode.toUpperCase() === cleanCode);
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
    const colRef = collection(db, 'vipOffers');
    return onSnapshot(
      colRef,
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

        if (bakeryCode) {
          const cleanCode = bakeryCode.trim().toUpperCase();
          callback(offers.filter((o) => o.bakeryCode.toUpperCase() === cleanCode));
        } else {
          callback(offers);
        }
      },
      (err) => {
        if (err.message?.includes('Quota') || String(err).includes('Quota')) {
          console.warn('Quota limit exceeded for vipOffers subscription, falling back to local storage.');
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
}
