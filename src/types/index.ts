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
  categoriasCustomizadas?: string[];
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
  category?: string;
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

// ==========================================
// MÓDULO DE ENCOMENDAS DE KIT FESTA
// ==========================================

export type PartyKitStatus = 'rascunho' | 'publicado' | 'pausado' | 'arquivado';
export type DistributionType = 'equal' | 'free' | 'min_per_flavor';

export interface CakePersonalizationConfig {
  allowTheme: boolean;
  allowColor: boolean;
  allowName: boolean;
  nameRequired?: boolean;
  allowAge: boolean;
  ageRequired?: boolean;
  allowMessage: boolean;
  allowDetails: boolean;
  allowWhatsAppInspiration: boolean;
  allowMassaChoice?: boolean;
}

export interface PartyKitAddon {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  ativo: boolean;
  imagemUrl?: string;
}

export interface PartyKit {
  id: string;
  bakeryCode: string;
  nome: string;
  descricao: string;
  fotoPrincipal?: string;
  galeria?: string[];
  precoBase: number;
  quantidadePessoas: number;
  status: PartyKitStatus;
  bolo: {
    tamanhoDescricao: string; // e.g. "Bolo de 1.5kg (aprox. 15 a 20 fatias)"
    maxRecheios: number; // e.g. 1 ou 2
    recheiosDisponiveis: string[];
    opcoesMassa?: string[]; // e.g. ["Massa Branca (Pão de Ló)", "Massa de Chocolate 50%"]
    personalizacao: CakePersonalizationConfig;
  };
  salgados: {
    quantidadeTotal: number; // e.g. 50, 100, 150
    maxSabores: number; // e.g. 2, 3, 4
    regraDistribuicao: DistributionType; // 'equal' | 'free' | 'min_per_flavor'
    minimoPorSabor?: number; // e.g. 25
    saboresDisponiveis: string[];
  };
  docinhos: {
    quantidadeTotal: number; // e.g. 25, 50, 100
    maxSabores: number; // e.g. 2, 4
    regraDistribuicao: DistributionType; // 'equal' | 'free' | 'min_per_flavor'
    minimoPorSabor?: number; // e.g. 25
    saboresDisponiveis: string[];
  };
  adicionais: PartyKitAddon[];
  createdAt: string;
  updatedAt: string;
}

export interface PartyOrderOptionItem {
  sabor: string;
  quantidade: number;
}

export type FlavorDistributionItem = PartyOrderOptionItem;

export interface PartyOrderChosenAddon {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
}

export type PartyOrderStatus = 
  | 'NOVO' 
  | 'EM_ANALISE' 
  | 'CONFIRMADO' 
  | 'EM_PRODUCAO' 
  | 'PRONTO' 
  | 'ENTREGUE' 
  | 'RETIRADO' 
  | 'CANCELADO';

export interface PartyOrderStatusHistory {
  status: PartyOrderStatus;
  changedAt: string; // ISO string
  changedBy?: string;
  nota?: string;
}

export interface PartyOrder {
  id: string; // PED-YYYYMMDD-XXXX ou PD-000123
  numeroPedidoFormatado?: string;
  bakeryCode: string;
  kitId: string;
  kitNome: string;
  precoBase: number;
  valorAdicionais: number;
  taxaEntrega?: number;
  valorTotal: number;
  bolo: {
    massa?: string;
    recheiosEscolhidos: string[];
    publicoAlvo?: string;
    tema?: string;
    cor?: string;
    corPersonalizada?: string;
    nomeAniversariante?: string;
    idadeAniversariante?: number;
    mensagem?: string;
    detalhesEspeciais?: string;
    enviaraInspiracaoWhatsApp: boolean;
  };
  salgados: {
    distribuicao: PartyOrderOptionItem[];
    total: number;
  };
  docinhos: {
    distribuicao: PartyOrderOptionItem[];
    total: number;
  };
  adicionaisEscolhidos: PartyOrderChosenAddon[];
  cliente: {
    nome: string;
    whatsapp: string;
    email?: string;
    observacoes?: string;
    tipoEntrega: 'retirada' | 'entrega';
    enderecoEntrega?: string;
  };
  agendamento: {
    data: string; // YYYY-MM-DD
    horario: string; // HH:mm
  };
  status: PartyOrderStatus;
  statusHistory: PartyOrderStatusHistory[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface PartyOrderRules {
  antecedenciaMinimaDias: number; // 1, 2, 3, 5, 7
  horarioLimite: string; // "18:00"
  diasDisponiveis: {
    segunda: boolean;
    terca: boolean;
    quarta: boolean;
    quinta: boolean;
    sexta: boolean;
    sabado: boolean;
    domingo: boolean;
  };
  horariosRetirada: string[]; // ["10:00", "12:00", "14:00", "16:00", "18:00"]
  maxPedidosPorDia: number; // e.g. 15
  permitirEntrega: boolean;
}

export interface PartyBakeryPublicConfig {
  bakeryCode: string;
  slug: string; // unique slug e.g. "padaria-do-joao"
  nomePublico: string;
  nomeExibicao?: string;
  logoUrl?: string;
  capaUrl?: string;
  descricao: string;
  telefone: string;
  whatsapp: string;
  telefoneWhatsapp?: string;
  endereco: string;
  horarioFuncionamento: string;
  instagram?: string;
  mensagemApresentacao: string;
  paginaAtiva: boolean;
  ativo?: boolean;
  exibirEndereco: boolean;
  exibirTelefone: boolean;
  exibirWhatsApp: boolean;
  exibirInstagram: boolean;
  antecedenciaMinimaHoras?: number;
  taxaEntregaPadrao?: number;
  valorMinimoEntregaGratis?: number;
  regioesAtendidas?: string;
  observacoesEntrega?: string;
  diasBloqueados?: string[];
  permiteEntrega?: boolean;
  permiteRetirada?: boolean;
  regras: PartyOrderRules;
  updatedAt: string;
}




