import { BakeryCompany, Product, SaleHistoryItem, AdminStats, SupportTicket, TicketPriority, TicketStatus, FinancialStats, BillingInfo, BillingStatus, ContractInfo } from '../types';
import { INITIAL_COMPANIES, INITIAL_PRODUCTS } from '../data/initialData';
import { calculateDaysRemaining, getProductStatus, formatDateToISO, generateActivationCode } from '../utils/dateUtils';
import { db, testFirestoreConnection } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const KEYS = {
  COMPANIES: 'padarias_companies_v1',
  PRODUCTS: 'padarias_products_v1',
  SALES_HISTORY: 'padarias_sales_history_v1',
  TICKETS: 'padarias_tickets_v1',
  ADMIN_AUTH: 'padarias_admin_authenticated',
  BAKERY_SESSION: 'padarias_active_session',
  ADMIN_PASSWORD: 'padarias_admin_password',
  ASAAS_CONFIG: 'padarias_asaas_config_v1',
};

export interface AsaasConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  webhookUrl: string;
  ativo: boolean;
  walletId?: string;
}

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
      setItem(KEYS.COMPANIES, INITIAL_COMPANIES);
    }
    if (!localStorage.getItem(KEYS.PRODUCTS)) {
      setItem(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
    if (!localStorage.getItem(KEYS.SALES_HISTORY)) {
      setItem(KEYS.SALES_HISTORY, []);
    }
    if (!localStorage.getItem(KEYS.TICKETS)) {
      setItem(KEYS.TICKETS, []);
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

  static purgeDemoDataFromLocal(): void {
    const demoCodes = ['AB12CD34', 'PAD8X92M', 'DEMO9999'];
    const demoProdIds = [
      'prod-101', 'prod-102', 'prod-103', 'prod-104', 'prod-105', 'prod-106', 'prod-107',
      'prod-201', 'prod-202', 'prod-203'
    ];

    let companies = getItem<BakeryCompany[]>(KEYS.COMPANIES, []);
    companies = companies.filter(c => !demoCodes.includes(c.codigoAtivacao.toUpperCase()));
    setItem(KEYS.COMPANIES, companies);

    let products = getItem<Product[]>(KEYS.PRODUCTS, []);
    products = products.filter(p => !demoCodes.includes(p.bakeryCode.toUpperCase()) && !demoProdIds.includes(p.id));
    setItem(KEYS.PRODUCTS, products);

    let sales = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    sales = sales.filter(s => !demoCodes.includes(s.bakeryCode.toUpperCase()));
    setItem(KEYS.SALES_HISTORY, sales);

    if (StorageService.getActiveBakeryCode() && demoCodes.includes(StorageService.getActiveBakeryCode()!.toUpperCase())) {
      StorageService.setActiveBakeryCode(null);
    }
  }

  static async clearAllSystemData(): Promise<void> {
    const demoCodes = ['AB12CD34', 'PAD8X92M', 'DEMO9999'];
    const demoProdIds = [
      'prod-101', 'prod-102', 'prod-103', 'prod-104', 'prod-105', 'prod-106', 'prod-107',
      'prod-201', 'prod-202', 'prod-203'
    ];

    for (const code of demoCodes) {
      deleteDoc(doc(db, 'companies', code)).catch(() => {});
    }
    for (const pid of demoProdIds) {
      deleteDoc(doc(db, 'products', pid)).catch(() => {});
    }

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
          const demoCodes = ['AB12CD34', 'PAD8X92M', 'DEMO9999'];
          compSnap.forEach((d) => {
            const data = d.data() as BakeryCompany;
            if (data && data.codigoAtivacao && !demoCodes.includes(data.codigoAtivacao.toUpperCase())) {
              remoteCompanies.push(data);
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
          const demoCodes = ['AB12CD34', 'PAD8X92M', 'DEMO9999'];
          const demoProdIds = [
            'prod-101', 'prod-102', 'prod-103', 'prod-104', 'prod-105', 'prod-106', 'prod-107',
            'prod-201', 'prod-202', 'prod-203'
          ];
          prodSnap.forEach((d) => {
            const data = d.data() as Product;
            if (
              data &&
              data.bakeryCode &&
              !demoCodes.includes(data.bakeryCode.toUpperCase()) &&
              !demoProdIds.includes(data.id)
            ) {
              remoteProducts.push(data);
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
    } catch (err) {
      console.error('Error syncing from Firestore:', err);
    }
  }

  // Admin Password
  static getAdminPassword(): string {
    return getItem(KEYS.ADMIN_PASSWORD, 'admin123');
  }

  static setAdminPassword(newPass: string): void {
    const trimmed = newPass.trim();
    setItem(KEYS.ADMIN_PASSWORD, trimmed);

    setDoc(doc(db, 'settings', 'admin'), {
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

  // Companies CRUD
  static getCompanies(): BakeryCompany[] {
    return getItem<BakeryCompany[]>(KEYS.COMPANIES, []);
  }

  static getCompanyByCode(code: string): BakeryCompany | undefined {
    const companies = StorageService.getCompanies();
    const cleanCode = code.trim().toUpperCase();
    return companies.find((c) => c.codigoAtivacao.toUpperCase() === cleanCode);
  }

  static addCompany(empresa: string, email: string, telefone?: string, cnpj?: string): BakeryCompany {
    const companies = StorageService.getCompanies();
    let code = generateActivationCode();
    while (companies.some((c) => c.codigoAtivacao === code)) {
      code = generateActivationCode();
    }

    const todayStr = formatDateToISO(new Date());
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = formatDateToISO(nextMonth);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = formatDateToISO(nextYear);

    const defaultBilling: BillingInfo = {
      implementacaoPaga: false,
      valorImplementacao: 1500,
      assinaturaMensalAtiva: true,
      valorMensalidade: 199,
      dataProximaCobranca: nextMonthStr,
      statusAssinatura: 'pendente',
      historicoCobrancas: [
        {
          id: 'inv_' + Date.now(),
          data: todayStr,
          valor: 1500,
          tipo: 'implementacao',
          status: 'pendente',
          linkBoleto: `https://pagar.me/invoice/imp_${code}`,
        },
      ],
    };

    const newCompany: BakeryCompany = {
      codigoAtivacao: code,
      empresa: empresa.trim(),
      email: email.trim(),
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
      },
    };

    companies.unshift(newCompany);
    setItem(KEYS.COMPANIES, companies);

    setDoc(doc(db, 'companies', code), newCompany).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `companies/${code}`);
    });

    return newCompany;
  }

  static toggleCompanyStatus(code: string): boolean {
    const companies = StorageService.getCompanies();
    const company = companies.find((c) => c.codigoAtivacao === code);
    if (company) {
      company.ativo = !company.ativo;
      setItem(KEYS.COMPANIES, companies);

      setDoc(doc(db, 'companies', code), company).catch((e) => {
        handleFirestoreError(e, OperationType.WRITE, `companies/${code}`);
      });

      return company.ativo;
    }
    return false;
  }

  static updateCompanyCode(oldCode: string, newCode: string): boolean {
    const companies = StorageService.getCompanies();
    const company = companies.find((c) => c.codigoAtivacao === oldCode);
    if (!company) return false;

    const cleanNewCode = newCode.trim().toUpperCase();

    if (companies.some((c) => c.codigoAtivacao === cleanNewCode && c.codigoAtivacao !== oldCode)) {
      throw new Error('Código de ativação já está em uso por outra padaria.');
    }

    company.codigoAtivacao = cleanNewCode;
    setItem(KEYS.COMPANIES, companies);

    deleteDoc(doc(db, 'companies', oldCode)).catch(() => {});
    setDoc(doc(db, 'companies', cleanNewCode), company).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `companies/${cleanNewCode}`);
    });

    const products = getItem<Product[]>(KEYS.PRODUCTS, []);
    products.forEach((p) => {
      if (p.bakeryCode === oldCode) {
        p.bakeryCode = cleanNewCode;
        setDoc(doc(db, 'products', p.id), p).catch(() => {});
      }
    });
    setItem(KEYS.PRODUCTS, products);

    const history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    history.forEach((h) => {
      if (h.bakeryCode === oldCode) {
        h.bakeryCode = cleanNewCode;
        setDoc(doc(db, 'sales', h.id), h).catch(() => {});
      }
    });
    setItem(KEYS.SALES_HISTORY, history);

    if (StorageService.getActiveBakeryCode() === oldCode) {
      StorageService.setActiveBakeryCode(cleanNewCode);
    }

    return true;
  }

  static deleteCompany(code: string): void {
    let companies = StorageService.getCompanies();
    companies = companies.filter((c) => c.codigoAtivacao !== code);
    setItem(KEYS.COMPANIES, companies);

    deleteDoc(doc(db, 'companies', code)).catch((e) => {
      handleFirestoreError(e, OperationType.DELETE, `companies/${code}`);
    });

    let products = getItem<Product[]>(KEYS.PRODUCTS, []);
    const productsToRemove = products.filter((p) => p.bakeryCode === code);
    productsToRemove.forEach((p) => deleteDoc(doc(db, 'products', p.id)).catch(() => {}));
    products = products.filter((p) => p.bakeryCode !== code);
    setItem(KEYS.PRODUCTS, products);

    let history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    const salesToRemove = history.filter((h) => h.bakeryCode === code);
    salesToRemove.forEach((h) => deleteDoc(doc(db, 'sales', h.id)).catch(() => {}));
    history = history.filter((h) => h.bakeryCode !== code);
    setItem(KEYS.SALES_HISTORY, history);
  }

  static updateCompanyCNPJ(code: string, cnpj: string): BakeryCompany | undefined {
    const companies = StorageService.getCompanies();
    const comp = companies.find((c) => c.codigoAtivacao === code);
    if (!comp) return undefined;

    comp.cnpj = cnpj.trim();
    setItem(KEYS.COMPANIES, companies);
    setDoc(doc(db, 'companies', code), comp).catch(() => {});
    return comp;
  }

  // Financial & Billing Methods
  static getFinancialStats(): FinancialStats {
    const companies = StorageService.getCompanies();
    const activeClients = companies.filter((c) => c.ativo && c.financeiro?.statusAssinatura === 'ativo').length;
    
    // MRR = Sum of monthly fees of active clients
    const mrr = companies.reduce((acc, c) => {
      if (c.ativo && c.financeiro?.statusAssinatura === 'ativo') {
        return acc + (c.financeiro.valorMensalidade || 199);
      }
      return acc;
    }, 0);

    // Pending implementation fees
    const pendingImp = companies.reduce((acc, c) => {
      if (!c.financeiro?.implementacaoPaga) {
        return acc + (c.financeiro?.valorImplementacao || 1500);
      }
      return acc;
    }, 0);

    // Upcoming renewals within 30 days
    const upcomingRenewals = companies.filter((c) => c.ativo && c.financeiro?.statusAssinatura !== 'cancelado').length;

    return {
      totalClientesAtivos: activeClients,
      mrr,
      receitaImplementacaoPendente: pendingImp,
      proximosVencimentos: upcomingRenewals,
    };
  }

  static updateCompanyBilling(code: string, updates: Partial<BillingInfo>): BakeryCompany | undefined {
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

    setItem(KEYS.COMPANIES, companies);
    setDoc(doc(db, 'companies', code), comp).catch(() => {});
    return comp;
  }

  static sendImplementationInvoice(code: string): string {
    const comp = StorageService.getCompanyByCode(code);
    if (!comp) return '';
    const config = StorageService.getAsaasConfig();
    const domain = config.environment === 'sandbox' ? 'sandbox.asaas.com' : 'www.asaas.com';
    const invoiceLink = `https://${domain}/c/imp_${code.toLowerCase()}_${Date.now().toString(36)}`;
    
    // Update invoice status
    StorageService.updateCompanyBilling(code, {
      ultimoLinkPagamento: invoiceLink,
      tipoUltimoLink: 'implementacao',
      historicoCobrancas: [
        ...(comp.financeiro?.historicoCobrancas || []),
        {
          id: 'inv_imp_' + Date.now(),
          data: formatDateToISO(new Date()),
          valor: comp.financeiro?.valorImplementacao || 1500,
          tipo: 'implementacao',
          status: 'pendente',
          linkBoleto: invoiceLink,
        },
      ],
    });

    return invoiceLink;
  }

  static generateRecurringBoleto(code: string): string {
    const comp = StorageService.getCompanyByCode(code);
    if (!comp) return '';
    const config = StorageService.getAsaasConfig();
    const domain = config.environment === 'sandbox' ? 'sandbox.asaas.com' : 'www.asaas.com';
    const boletoLink = `https://${domain}/c/sub_${code.toLowerCase()}_${Date.now().toString(36)}`;

    StorageService.updateCompanyBilling(code, {
      ultimoLinkPagamento: boletoLink,
      tipoUltimoLink: 'mensalidade',
      historicoCobrancas: [
        ...(comp.financeiro?.historicoCobrancas || []),
        {
          id: 'inv_rec_' + Date.now(),
          data: formatDateToISO(new Date()),
          valor: comp.financeiro?.valorMensalidade || 199,
          tipo: 'mensalidade',
          status: 'pendente',
          linkBoleto: boletoLink,
        },
      ],
    });

    return boletoLink;
  }

  static toggleCompanyBillingSuspension(code: string): BillingStatus {
    const comp = StorageService.getCompanyByCode(code);
    if (!comp) return 'cancelado';

    const currentStatus = comp.financeiro?.statusAssinatura || 'pendente';
    const newStatus: BillingStatus = currentStatus === 'suspenso' ? 'ativo' : 'suspenso';

    // Also toggle active status of company access
    comp.ativo = newStatus === 'ativo';

    StorageService.updateCompanyBilling(code, {
      statusAssinatura: newStatus,
    });

    return newStatus;
  }

  static updateCompanyContract(code: string, updates: Partial<ContractInfo>): BakeryCompany | undefined {
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

    setItem(KEYS.COMPANIES, companies);
    setDoc(doc(db, 'companies', code), comp).catch(() => {});
    return comp;
  }

  static updateCompanyBillingStatus(
    code: string,
    newStatus: BillingStatus,
    dueDate?: string
  ): BakeryCompany | undefined {
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
    setDoc(doc(db, 'companies', code), comp).catch(() => {});
    return comp;
  }

  static getAsaasConfig(): AsaasConfig {
    return {
      apiKey: import.meta.env.VITE_ASAAS_API_KEY || '$asaas_api_key_padariaio_live_2026',
      environment: (import.meta.env.VITE_ASAAS_ENVIRONMENT as 'sandbox' | 'production') || 'production',
      webhookUrl: `${window.location.origin}/api/webhooks/asaas`,
      ativo: true,
      walletId: 'padariaio_main_wallet',
    };
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

  static createTicket(
    bakeryCode: string,
    empresaNome: string,
    assunto: string,
    descricao: string,
    prioridade: TicketPriority
  ): SupportTicket {
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

    setDoc(doc(db, 'tickets', newTicket.id), newTicket).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `tickets/${newTicket.id}`);
    });

    return newTicket;
  }

  static updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    respostaSuporte?: string
  ): SupportTicket | null {
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

    setDoc(doc(db, 'tickets', ticketId), ticket).catch((e) => {
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

    setItem(KEYS.PRODUCTS, updatedProducts);

    if (bakeryCode) {
      const cleanCode = bakeryCode.trim().toUpperCase();
      return updatedProducts.filter((p) => p.bakeryCode.toUpperCase() === cleanCode);
    }

    return updatedProducts;
  }

  static addProduct(
    bakeryCode: string,
    nome: string,
    quantidade: number,
    dataValidade: string,
    categoria?: string
  ): Product {
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
    };

    products.unshift(newProduct);
    setItem(KEYS.PRODUCTS, products);

    setDoc(doc(db, 'products', newProduct.id), newProduct).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `products/${newProduct.id}`);
    });

    return newProduct;
  }

  static updateProduct(
    id: string,
    nome: string,
    quantidade: number,
    dataValidade: string,
    categoria?: string
  ): Product {
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
    };

    products[index] = updated;
    setItem(KEYS.PRODUCTS, updated);

    setDoc(doc(db, 'products', updated.id), updated).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `products/${updated.id}`);
    });

    return updated;
  }

  static deleteProduct(id: string): void {
    let products = StorageService.getProducts();
    products = products.filter((p) => p.id !== id);
    setItem(KEYS.PRODUCTS, products);

    deleteDoc(doc(db, 'products', id)).catch((e) => {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
    });
  }

  static markAsSold(id: string): SaleHistoryItem | null {
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

    setDoc(doc(db, 'sales', historyItem.id), historyItem).catch((e) => {
      handleFirestoreError(e, OperationType.WRITE, `sales/${historyItem.id}`);
    });

    StorageService.deleteProduct(id);

    return historyItem;
  }

  static getSalesHistory(bakeryCode: string): SaleHistoryItem[] {
    const history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    const cleanCode = bakeryCode.trim().toUpperCase();
    return history.filter((h) => h.bakeryCode.toUpperCase() === cleanCode);
  }

  static restoreSoldProduct(historyId: string): Product | null {
    const history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    const saleIndex = history.findIndex((h) => h.id === historyId);
    if (saleIndex === -1) return null;

    const item = history[saleIndex];

    const restoredProduct = StorageService.addProduct(
      item.bakeryCode,
      item.nomeProduto,
      item.quantidade,
      item.dataValidade,
      'Restaurado'
    );

    history.splice(saleIndex, 1);
    setItem(KEYS.SALES_HISTORY, history);

    deleteDoc(doc(db, 'sales', historyId)).catch(() => {});

    return restoredProduct;
  }

  static clearSalesHistory(bakeryCode: string): void {
    let history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    const cleanCode = bakeryCode.trim().toUpperCase();
    const toDelete = history.filter((h) => h.bakeryCode.toUpperCase() === cleanCode);
    toDelete.forEach((h) => deleteDoc(doc(db, 'sales', h.id)).catch(() => {}));

    history = history.filter((h) => h.bakeryCode.toUpperCase() !== cleanCode);
    setItem(KEYS.SALES_HISTORY, history);
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
    setItem(KEYS.ADMIN_PASSWORD, 'admin123');
    setItem(KEYS.ADMIN_AUTH, false);
    setItem(KEYS.BAKERY_SESSION, null);
  }
}
