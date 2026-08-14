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
  barcode?: string;
  peso?: number;
  valorKg?: number;
  unidade?: string; // kg, g, unidade, L, ml, caixa, pacote
  estoqueInicial?: number;
  dataFabricacao?: string;
  valorTotal?: number;
  motivo?: string;
  notas?: string;
  fotos?: string[];
}

export type MovementType = 'ENTRY' | 'SALE' | 'WASTE' | 'ADJUSTMENT' | 'INTERNAL_USE';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  bakeryCode: string;
  type: MovementType;
  quantity: number;
  unit: string;
  costAtMovement: number;
  reason?: string;
  createdAt: string; // ISO string
  createdBy?: string;
}

export interface StockCount {
  id: string;
  productId: string;
  productName: string;
  bakeryCode: string;
  initialQuantity: number;
  entriesQuantity: number;
  productionQuantity: number;
  wasteQuantity: number;
  expectedQuantity: number;
  physicalQuantity: number;
  varianceQuantity: number; // physicalQuantity - expectedQuantity
  varianceValue: number; // Math.abs(varianceQuantity) * unitCost
  unit: string;
  unitCost: number;
  notes?: string;
  countedAt: string; // ISO string
  countedBy?: string;
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
}

export interface BillingInfo {
  diasTesteGratis?: number;
  dataFimTeste?: string;
  implementacaoPaga?: boolean;
  valorImplementacao?: number;
  dataPagamentoImplementacao?: string;
  assinaturaMensalAtiva: boolean;
  valorMensalidade: number; // default R$ 199
  dataProximaCobranca: string; // YYYY-MM-DD
  statusAssinatura: BillingStatus;
  historicoCobrancas: InvoiceItem[];
  ultimoLinkPagamento?: string | null;
  tipoUltimoLink?: 'implementacao' | 'mensalidade';
  diaVencimentoMensal?: number; // ex: 15
  teste1Dia?: boolean;
  asaasCustomerId?: string | null;
  asaasSubscriptionId?: string | null;
  asaasPaymentLink?: string | null;
  asaasEnvironment?: 'sandbox' | 'production' | null;
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
  senha?: string; // Access password for email + password login
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
  totalClientes: number;
  totalClientesAtivos: number;
  mrrTotalProjetado: number;
  mrrAtivo: number;
  mrr: number;
  receitaImplementacaoPaga: number;
  receitaImplementacaoPendente: number;
  proximosVencimentos: number;
  clientesAdimplentes: number;
  clientesInadimplentes: number;
  clientesCanceladosAsaas: number;
}

export type VipOfferStatus = 'ativo' | 'vendido' | 'descartado';

export interface VipOffer {
  id: string;
  bakeryCode: string;
  productId: string;
  nomeProduto: string;
  categoria: string;
  valorOriginal: number;
  valorPromocional: number;
  desconto: number; // percentage (e.g. 15 for 15%)
  dataValidade: string; // YYYY-MM-DD
  diasParaVencer: number;
  status: VipOfferStatus;
  barcode?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  dataVenda?: string; // ISO string when status is 'vendido'
  valorVenda?: number; // actual revenue from sale when status is 'vendido'
}

export interface ClosingItem {
  productId: string;
  nomeProduto: string;
  categoria?: string;
  quantidade: number;
  dataValidade: string;
  valorEstimado: number;
  acaoTomada: 'vendido' | 'descarte' | 'transferido' | 'doacao';
  qtdVendida?: number;
  qtdDescartada?: number;
  qtdTransferida?: number;
  qtdDoada?: number;
  isVencido?: boolean;
  observacoes?: string;
  barcode?: string;
}

export interface DailyClosing {
  id: string;
  bakeryCode: string;
  dataFechamento: string; // YYYY-MM-DD
  status: 'aberto' | 'concluido';
  totalItensAuditados: number;
  totalPerdaReais: number;
  totalReaproveitadoReais: number;
  taxaAproveitamento: number; // percentage 0-100
  observacoes?: string;
  responsavel?: string;
  itens: ClosingItem[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface ClientResourceUsage {
  gemini: {
    scansHoje: number;
    scansMes: number;
    chamadasIa: number;
    tokensUtilizados: number;
    custoEstimado: number;
  };
  firebase: {
    leituras: number;
    gravacoes: number;
    atualizacoes: number;
    armazenamentoMb: number;
    numeroDocumentos: number;
    custoEstimado: number;
  };
  vercel: {
    requisicoes: number;
    tempoExecucaoMs: number;
    invocacoes: number;
    bandwidthMb: number;
    custoEstimado: number;
  };
  totalCost: number;
}

export interface SaasClientMetrics {
  bakeryCode: string;
  empresa: string;
  cnpj?: string;
  email: string;
  cidade?: string;
  estado?: string;
  planoNome: string;
  valorMensal: number;
  valorImplementacao: number;
  status: BillingStatus;
  dataCadastro: string;
  proximoVencimento: string;
  diasComoCliente: number;
  mesesAtivo: number;
  valorTotalPago: number;
  ultimoPagamento: string;
  usage: ClientResourceUsage;
  receitaMensal: number;
  lucroBrutoMensal: number;
  margemMensalPct: number;
  receitaAcumuladaLtv: number;
  custoAcumuladoLtv: number;
  lucroLiquidoLtv: number;
  saudeLtv: 'excelente' | 'atencao' | 'revisar_plano';
}

export interface InventoryItem {
  id: string;
  bakeryCode: string;
  name: string;
  unit: string; // kg, g, unidade, litro, ml, caixa, pacote
  currentQuantity: number;
  initialQuantity: number;
  unitCost: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  createdBy: string;
}

export type TaskShift = 'manha' | 'tarde' | 'noite' | 'geral';
export type TaskStatus = 'pendente' | 'concluida' | 'atrasada';
export type TaskCategory = 'conferencia' | 'perdas' | 'producao' | 'fechamento' | 'limpeza' | 'geral';

export interface OperationalTask {
  id: string;
  bakeryCode: string;
  title: string;
  description?: string;
  shift: TaskShift;
  category: TaskCategory;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  completedAt?: string; // ISO string
  completedBy?: string;
  assignedTo?: string;
  notes?: string;
  createdAt: string; // ISO string
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
}




