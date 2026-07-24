import { BakeryCompany, Product, SaleHistoryItem, AdminStats, SupportTicket, TicketPriority, TicketStatus, FinancialStats, BillingInfo, BillingStatus, ContractInfo } from '../../types';
import { calculateDaysRemaining, getProductStatus, formatDateToISO, generateActivationCode } from '../../utils/dateUtils';
import { supabase } from './supabaseClient';

const KEYS = {
  COMPANIES: 'padarias_companies_v2',
  PRODUCTS: 'padarias_products_v2',
  SALES_HISTORY: 'padarias_sales_history_v2',
  TICKETS: 'padarias_tickets_v2',
  ADMIN_AUTH: 'padarias_admin_authenticated',
  BAKERY_SESSION: 'padarias_active_session',
  ADMIN_PASSWORD: 'padarias_admin_password',
};

const EXCLUDED_CODES = ['AB12CD34', 'PAD8X92M', 'DEMO9999', '6SSHQQTZ', '8FM8XCN6', 'CAVU5FKP'];
const DEMO_PROD_IDS = ['prod-101', 'prod-102', 'prod-103', 'prod-104', 'prod-105', 'prod-106', 'prod-107', 'prod-201', 'prod-202', 'prod-203'];

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
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

  static async init(): Promise<void> {
    if (!localStorage.getItem(KEYS.COMPANIES)) setItem(KEYS.COMPANIES, []);
    if (!localStorage.getItem(KEYS.PRODUCTS)) setItem(KEYS.PRODUCTS, []);
    if (!localStorage.getItem(KEYS.SALES_HISTORY)) setItem(KEYS.SALES_HISTORY, []);
    if (!localStorage.getItem(KEYS.TICKETS)) setItem(KEYS.TICKETS, []);
    if (!localStorage.getItem(KEYS.ADMIN_PASSWORD)) setItem(KEYS.ADMIN_PASSWORD, 'admin123');

    StorageService.purgeDemoDataFromLocal();

    if (!StorageService.isInitialized) {
      StorageService.isInitialized = true;
      await StorageService.pullFromSupabase();
    }
  }

  // Realtime Subscriptions via Supabase Realtime
  static subscribeCompanies(callback: (companies: BakeryCompany[]) => void): () => void {
    const localComps = getItem<BakeryCompany[]>(KEYS.COMPANIES, []);
    callback(localComps);

    try {
      const channel = supabase
        .channel('public:empresas')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'empresas' }, async () => {
          await StorageService.pullFromSupabase();
          callback(getItem<BakeryCompany[]>(KEYS.COMPANIES, []));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      return () => {};
    }
  }

  static subscribeProducts(callback: (products: Product[]) => void, bakeryCode?: string): () => void {
    const localProds = getItem<Product[]>(KEYS.PRODUCTS, []);
    if (bakeryCode) {
      callback(localProds.filter(p => p.bakeryCode.toUpperCase() === bakeryCode.trim().toUpperCase()));
    } else {
      callback(localProds);
    }

    try {
      const channel = supabase
        .channel('public:produtos')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, async () => {
          await StorageService.pullFromSupabase();
          const prods = getItem<Product[]>(KEYS.PRODUCTS, []);
          if (bakeryCode) {
            callback(prods.filter(p => p.bakeryCode.toUpperCase() === bakeryCode.trim().toUpperCase()));
          } else {
            callback(prods);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      return () => {};
    }
  }

  static subscribeSalesHistory(callback: (sales: SaleHistoryItem[]) => void, bakeryCode?: string): () => void {
    const localSales = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    if (bakeryCode) {
      callback(localSales.filter(s => s.bakeryCode.toUpperCase() === bakeryCode.trim().toUpperCase()));
    } else {
      callback(localSales);
    }
    return () => {};
  }

  static subscribeTickets(callback: (tickets: SupportTicket[]) => void, bakeryCode?: string): () => void {
    const localTickets = getItem<SupportTicket[]>(KEYS.TICKETS, []);
    if (bakeryCode) {
      callback(localTickets.filter(t => t.bakeryCode.toUpperCase() === bakeryCode.trim().toUpperCase()));
    } else {
      callback(localTickets);
    }
    return () => {};
  }

  static purgeDemoDataFromLocal(): void {
    let companies = getItem<BakeryCompany[]>(KEYS.COMPANIES, []);
    companies = companies.filter(c => !EXCLUDED_CODES.includes(c.codigoAtivacao.trim().toUpperCase()));
    setItem(KEYS.COMPANIES, companies);

    let products = getItem<Product[]>(KEYS.PRODUCTS, []);
    products = products.filter(p => !EXCLUDED_CODES.includes(p.bakeryCode.trim().toUpperCase()) && !DEMO_PROD_IDS.includes(p.id));
    setItem(KEYS.PRODUCTS, products);
  }

  static async clearAllSystemData(): Promise<void> {
    setItem(KEYS.COMPANIES, []);
    setItem(KEYS.PRODUCTS, []);
    setItem(KEYS.SALES_HISTORY, []);
    setItem(KEYS.TICKETS, []);
    setItem(KEYS.BAKERY_SESSION, null);
  }

  static async pullFromSupabase(): Promise<void> {
    try {
      const { data: compData, error: compError } = await supabase.from('empresas').select('*');
      if (!compError && compData) {
        const companies: BakeryCompany[] = compData.map((c: any) => ({
          codigoAtivacao: c.codigo_ativacao,
          empresa: c.nome,
          email: c.email,
          telefone: c.telefone || '',
          cnpj: c.cnpj || '',
          ativo: c.status,
          dataCadastro: c.created_at ? c.created_at.split('T')[0] : formatDateToISO(new Date()),
          ultimoAcesso: c.updated_at ? c.updated_at.split('T')[0] : undefined,
        }));
        if (companies.length > 0) {
          setItem(KEYS.COMPANIES, companies);
        }
      }

      const { data: prodData, error: prodError } = await supabase.from('produtos').select('*');
      if (!prodError && prodData) {
        const products: Product[] = prodData.map((p: any) => {
          const daysRemaining = calculateDaysRemaining(p.data_validade);
          return {
            id: p.id,
            bakeryCode: p.bakery_code,
            nome: p.nome,
            quantidade: p.quantidade || 1,
            dataValidade: p.data_validade,
            categoria: p.categoria_id || 'Geral',
            dataCadastro: p.created_at ? p.created_at.split('T')[0] : formatDateToISO(new Date()),
            status: getProductStatus(daysRemaining),
            diasParaVencer: daysRemaining,
            barcode: p.codigo_barras || '',
            valorKg: p.valor_kg,
            dataFabricacao: p.data_fabricacao,
            valorTotal: p.preco_venda,
            motivo: p.motivo || 'Vencimento',
            notas: p.notas || '',
          };
        });
        if (products.length > 0) {
          setItem(KEYS.PRODUCTS, products);
        }
      }
    } catch (e) {
      console.warn('Supabase pull warning, using local storage cache:', e);
    }
  }

  static getAdminPassword(): string {
    return getItem(KEYS.ADMIN_PASSWORD, 'admin123');
  }

  static async setAdminPassword(newPass: string): Promise<void> {
    const trimmed = newPass.trim();
    setItem(KEYS.ADMIN_PASSWORD, trimmed);
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

  static getActiveBakeryCode(): string | null {
    return getItem<string | null>(KEYS.BAKERY_SESSION, null);
  }

  static setActiveBakeryCode(code: string | null): void {
    setItem(KEYS.BAKERY_SESSION, code);
  }

  static getCompanies(): BakeryCompany[] {
    return getItem<BakeryCompany[]>(KEYS.COMPANIES, []);
  }

  static getCompanyByCode(code: string): BakeryCompany | undefined {
    const companies = StorageService.getCompanies();
    const cleanCode = code.trim().toUpperCase();
    return companies.find((c) => c.codigoAtivacao.toUpperCase() === cleanCode);
  }

  static async addCompany(empresa: string, email: string, telefone?: string, cnpj?: string): Promise<BakeryCompany> {
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

    const newCompany: BakeryCompany = {
      codigoAtivacao: code,
      empresa: empresa.trim(),
      email: email.trim(),
      telefone: telefone ? telefone.trim() : '',
      cnpj: cnpj ? cnpj.trim() : '',
      ativo: true,
      dataCadastro: todayStr,
      ultimoAcesso: todayStr,
      financeiro: {
        implementacaoPaga: false,
        valorImplementacao: 1500,
        assinaturaMensalAtiva: true,
        valorMensalidade: 199,
        dataProximaCobranca: nextMonthStr,
        statusAssinatura: 'pendente',
        historicoCobrancas: [],
      },
      contrato: {
        contratoAceito: true,
        dataAssinaturaContrato: todayStr,
        dataVencimentoContrato: formatDateToISO(nextYear),
        fornecedorNome: 'PADARIA.IO TECNOLOGIA E SISTEMAS',
        clienteNome: empresa.trim(),
      },
    };

    companies.unshift(newCompany);
    setItem(KEYS.COMPANIES, companies);

    try {
      await supabase.from('empresas').insert([{
        codigo_ativacao: code,
        nome: empresa.trim(),
        email: email.trim(),
        telefone: telefone || '',
        cnpj: cnpj || '',
        status: true,
      }]);
    } catch (e) {
      console.warn('Supabase insert company error:', e);
    }

    return newCompany;
  }

  static async toggleCompanyStatus(code: string): Promise<boolean> {
    const companies = StorageService.getCompanies();
    const company = companies.find((c) => c.codigoAtivacao === code);
    if (company) {
      company.ativo = !company.ativo;
      setItem(KEYS.COMPANIES, companies);

      try {
        await supabase.from('empresas').update({ status: company.ativo }).eq('codigo_ativacao', code);
      } catch (e) {}

      return company.ativo;
    }
    return false;
  }

  static async updateCompanyCode(oldCode: string, newCode: string): Promise<boolean> {
    const companies = StorageService.getCompanies();
    const company = companies.find((c) => c.codigoAtivacao === oldCode);
    if (!company) return false;

    const cleanNewCode = newCode.trim().toUpperCase();
    company.codigoAtivacao = cleanNewCode;
    setItem(KEYS.COMPANIES, companies);

    try {
      await supabase.from('empresas').update({ codigo_ativacao: cleanNewCode }).eq('codigo_ativacao', oldCode);
    } catch (e) {}

    return true;
  }

  static async deleteCompany(code: string): Promise<void> {
    let companies = StorageService.getCompanies();
    companies = companies.filter((c) => c.codigoAtivacao !== code);
    setItem(KEYS.COMPANIES, companies);

    try {
      await supabase.from('empresas').delete().eq('codigo_ativacao', code);
    } catch (e) {}
  }

  static async updateCompanyCNPJ(code: string, cnpj: string): Promise<BakeryCompany | undefined> {
    const companies = StorageService.getCompanies();
    const comp = companies.find((c) => c.codigoAtivacao === code);
    if (!comp) return undefined;

    comp.cnpj = cnpj.trim();
    setItem(KEYS.COMPANIES, companies);
    try {
      await supabase.from('empresas').update({ cnpj: comp.cnpj }).eq('codigo_ativacao', code);
    } catch (e) {}
    return comp;
  }

  static getFinancialStats(): FinancialStats {
    const companies = StorageService.getCompanies();
    const activeClients = companies.filter((c) => c.ativo).length;
    const mrr = activeClients * 199;
    return {
      totalClientesAtivos: activeClients,
      mrr,
      receitaImplementacaoPendente: companies.length * 1500,
      proximosVencimentos: activeClients,
    };
  }

  static async updateCompanyBilling(code: string, updates: Partial<BillingInfo>): Promise<BakeryCompany | undefined> {
    const companies = StorageService.getCompanies();
    const comp = companies.find((c) => c.codigoAtivacao === code);
    if (!comp) return undefined;
    comp.financeiro = { ...(comp.financeiro || { implementacaoPaga: false, valorImplementacao: 1500, assinaturaMensalAtiva: true, valorMensalidade: 199, dataProximaCobranca: formatDateToISO(new Date()), statusAssinatura: 'pendente', historicoCobrancas: [] }), ...updates };
    setItem(KEYS.COMPANIES, companies);
    return comp;
  }

  static async sendImplementationInvoice(code: string, link: string): Promise<string> {
    return link;
  }

  static async generateRecurringBoleto(code: string, link: string): Promise<string> {
    return link;
  }

  static async toggleCompanyBillingSuspension(code: string): Promise<BillingStatus> {
    const comp = StorageService.getCompanyByCode(code);
    if (!comp) return 'cancelado';
    return comp.financeiro?.statusAssinatura || 'pendente';
  }

  static async updateCompanyContract(code: string, updates: Partial<ContractInfo>): Promise<BakeryCompany | undefined> {
    const companies = StorageService.getCompanies();
    const comp = companies.find((c) => c.codigoAtivacao === code);
    if (!comp) return undefined;
    comp.contrato = { ...(comp.contrato || { contratoAceito: true, dataAssinaturaContrato: formatDateToISO(new Date()), dataVencimentoContrato: formatDateToISO(new Date()) }), ...updates };
    setItem(KEYS.COMPANIES, companies);
    return comp;
  }

  static async updateCompanyBillingStatus(code: string, newStatus: BillingStatus, dueDate?: string): Promise<BakeryCompany | undefined> {
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
    return comp;
  }

  static getTickets(bakeryCode?: string): SupportTicket[] {
    const all = getItem<SupportTicket[]>(KEYS.TICKETS, []);
    if (bakeryCode) {
      return all.filter((t) => t.bakeryCode.toUpperCase() === bakeryCode.trim().toUpperCase());
    }
    return all;
  }

  static async createTicket(bakeryCode: string, empresaNome: string, assunto: string, descricao: string, prioridade: TicketPriority): Promise<SupportTicket> {
    const tickets = StorageService.getTickets();
    const newTicket: SupportTicket = {
      id: 'tick_' + Date.now(),
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
    return newTicket;
  }

  static async updateTicketStatus(ticketId: string, status: TicketStatus, respostaSuporte?: string): Promise<SupportTicket | null> {
    const tickets = StorageService.getTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;
    ticket.status = status;
    if (respostaSuporte) ticket.respostaSuporte = respostaSuporte;
    setItem(KEYS.TICKETS, tickets);
    return ticket;
  }

  static getProducts(bakeryCode?: string): Product[] {
    const allProducts = getItem<Product[]>(KEYS.PRODUCTS, []);
    const updated = allProducts.map((p) => {
      const days = calculateDaysRemaining(p.dataValidade);
      return { ...p, diasParaVencer: days, status: getProductStatus(days) };
    });
    if (bakeryCode) {
      return updated.filter((p) => p.bakeryCode.toUpperCase() === bakeryCode.trim().toUpperCase());
    }
    return updated;
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
    notas?: string
  ): Promise<Product> {
    const products = StorageService.getProducts();
    const days = calculateDaysRemaining(dataValidade);
    const newProd: Product = {
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      bakeryCode: bakeryCode.trim().toUpperCase(),
      nome: nome.trim(),
      quantidade: Math.max(1, Number(quantidade)),
      dataValidade,
      categoria: categoria || 'Geral',
      dataCadastro: formatDateToISO(new Date()),
      diasParaVencer: days,
      status: getProductStatus(days),
      barcode: barcode || '',
      valorKg,
      dataFabricacao,
      valorTotal,
      motivo: motivo || 'Vencimento',
      notas: notas || '',
    };

    products.unshift(newProd);
    setItem(KEYS.PRODUCTS, products);

    try {
      await supabase.from('produtos').insert([{
        id: newProd.id,
        bakery_code: newProd.bakeryCode,
        nome: newProd.nome,
        quantidade: newProd.quantidade,
        data_validade: newProd.dataValidade,
        codigo_barras: newProd.barcode,
        valor_kg: newProd.valorKg,
        data_fabricacao: newProd.dataFabricacao,
        preco_venda: newProd.valorTotal,
        motivo: newProd.motivo,
        notas: newProd.notas,
      }]);
    } catch (e) {}

    return newProd;
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
    notas?: string
  ): Promise<Product> {
    const products = StorageService.getProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Produto não encontrado');

    const days = calculateDaysRemaining(dataValidade);
    const updated: Product = {
      ...products[idx],
      nome: nome.trim(),
      quantidade: Math.max(1, Number(quantidade)),
      dataValidade,
      categoria: categoria || products[idx].categoria,
      diasParaVencer: days,
      status: getProductStatus(days),
      barcode: barcode !== undefined ? barcode : products[idx].barcode,
      valorKg: valorKg !== undefined ? valorKg : products[idx].valorKg,
      dataFabricacao: dataFabricacao !== undefined ? dataFabricacao : products[idx].dataFabricacao,
      valorTotal: valorTotal !== undefined ? valorTotal : products[idx].valorTotal,
      motivo: motivo !== undefined ? motivo : products[idx].motivo,
      notas: notas !== undefined ? notas : products[idx].notas,
    };

    products[idx] = updated;
    setItem(KEYS.PRODUCTS, products);
    return updated;
  }

  static async deleteProduct(id: string): Promise<void> {
    let products = StorageService.getProducts();
    products = products.filter((p) => p.id !== id);
    setItem(KEYS.PRODUCTS, products);
    try {
      await supabase.from('produtos').delete().eq('id', id);
    } catch (e) {}
  }

  static async markAsSold(id: string): Promise<SaleHistoryItem | null> {
    const products = StorageService.getProducts();
    const product = products.find((p) => p.id === id);
    if (!product) return null;

    const saleItem: SaleHistoryItem = {
      id: 'sale_' + Date.now(),
      bakeryCode: product.bakeryCode,
      produtoId: product.id,
      nomeProduto: product.nome,
      quantidade: product.quantidade,
      dataValidade: product.dataValidade,
      dataVenda: new Date().toISOString(),
    };

    const history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    history.unshift(saleItem);
    setItem(KEYS.SALES_HISTORY, history);
    await StorageService.deleteProduct(id);
    return saleItem;
  }

  static getSalesHistory(bakeryCode: string): SaleHistoryItem[] {
    const history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    return history.filter((h) => h.bakeryCode.toUpperCase() === bakeryCode.trim().toUpperCase());
  }

  static async restoreSoldProduct(historyId: string): Promise<Product | null> {
    const history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    const idx = history.findIndex((h) => h.id === historyId);
    if (idx === -1) return null;
    const item = history[idx];
    const restored = await StorageService.addProduct(item.bakeryCode, item.nomeProduto, item.quantidade, item.dataValidade, 'Restaurado');
    history.splice(idx, 1);
    setItem(KEYS.SALES_HISTORY, history);
    return restored;
  }

  static async clearSalesHistory(bakeryCode: string): Promise<void> {
    let history = getItem<SaleHistoryItem[]>(KEYS.SALES_HISTORY, []);
    history = history.filter((h) => h.bakeryCode.toUpperCase() !== bakeryCode.trim().toUpperCase());
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
