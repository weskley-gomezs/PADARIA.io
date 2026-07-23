export type ProductStatus = 'normal' | 'vencendo' | 'vencido';

export interface Product {
  id: string;
  bakeryCode: string; // activation code linking to bakery
  nome: string;
  quantidade: number;
  dataValidade: string; // YYYY-MM-DD
  categoria?: string;
  dataCadastro: string; // ISO string or YYYY-MM-DD
  status: ProductStatus;
  diasParaVencer: number;
}

export interface SaleHistoryItem {
  id: string;
  bakeryCode: string;
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  dataValidade: string;
  dataVenda: string; // ISO string
}

export type BillingStatus = 'ativo' | 'pendente' | 'concluido' | 'vencendo' | 'vencido' | 'suspenso' | 'cancelado';

export interface InvoiceItem {
  id: string;
  data: string;
  valor: number;
  tipo: 'implementacao' | 'mensalidade';
  status: 'pago' | 'pendente' | 'cancelado';
  linkBoleto?: string;
  asaasPaymentId?: string;
}

export interface BillingInfo {
  implementacaoPaga: boolean;
  valorImplementacao: number; // default R$ 1500
  dataPagamentoImplementacao?: string;
  assinaturaMensalAtiva: boolean;
  valorMensalidade: number; // default R$ 199
  dataProximaCobranca: string; // YYYY-MM-DD
  statusAssinatura: BillingStatus;
  historicoCobrancas: InvoiceItem[];
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  diaVencimentoMensal?: number; // ex: 15
}

export interface ContractInfo {
  contratoAceito: boolean;
  dataAssinaturaContrato: string;
  dataVencimentoContrato: string;
  fornecedorNome?: string;
  responsavelTecnico?: string; // default "Weskley Gomes"
  clienteNome?: string;
  clienteCnpj?: string;
  valorImplementacao?: number; // default 1500
  valorMensalidade?: number; // default 199
  prazoVigenciaMeses?: number; // default 12
  observacoesAdicionais?: string;
}

export interface BakeryCompany {
  codigoAtivacao: string; // 8 chars alphanumeric unique ID
  empresa: string;
  email: string;
  telefone?: string;
  cnpj?: string;
  ativo: boolean;
  dataCadastro: string; // YYYY-MM-DD
  ultimoAcesso?: string;
  financeiro?: BillingInfo;
  contrato?: ContractInfo;
}

export type TicketPriority = 'normal' | 'urgente' | 'critica';
export type TicketStatus = 'aberto' | 'em_andamento' | 'resolvido';

export interface SupportTicket {
  id: string;
  bakeryCode: string;
  empresaNome: string;
  assunto: string;
  descricao: string;
  prioridade: TicketPriority;
  status: TicketStatus;
  dataCriacao: string; // ISO string
  dataResolucao?: string;
  respostaSuporte?: string;
  screenshotUrl?: string;
}

export interface AdminStats {
  totalPadarias: number;
  padariasAtivas: number;
  totalProdutos: number;
  produtosVencidos: number;
}

export interface FinancialStats {
  totalClientesAtivos: number;
  mrr: number; // Receita Mensal Recorrente
  receitaImplementacaoPendente: number;
  proximosVencimentos: number;
}
