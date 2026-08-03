import { BakeryCompany, Product, SaleHistoryItem, SupportTicket, VipOffer, DailyClosing, SaasClientMetrics } from '../types';
import { calculateDaysRemaining } from './dateUtils';

export function calculateDaysBetween(startDateStr: string, endDate: Date = new Date()): number {
  try {
    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) return 30;
    const diffTime = Math.abs(endDate.getTime() - start.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  } catch {
    return 30;
  }
}

export function computeSaasClientMetrics(
  companies: BakeryCompany[],
  products: Product[],
  sales: SaleHistoryItem[],
  tickets: SupportTicket[],
  vipOffers: VipOffer[],
  dailyClosings: DailyClosing[]
): SaasClientMetrics[] {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

  return companies.map((company) => {
    const code = company.codigoAtivacao.trim().toUpperCase();

    // Associated real activity records
    const bakeryProducts = products.filter((p) => p.bakeryCode.toUpperCase() === code);
    const bakerySales = sales.filter((s) => s.bakeryCode.toUpperCase() === code);
    const bakeryTickets = tickets.filter((t) => t.bakeryCode.toUpperCase() === code);
    const bakeryVips = vipOffers.filter((v) => v.bakeryCode.toUpperCase() === code);
    const bakeryClosings = dailyClosings.filter((c) => c.bakeryCode.toUpperCase() === code);

    // Days & Months active
    const diasComoCliente = calculateDaysBetween(company.dataCadastro || '2026-01-01', today);
    const mesesAtivo = Math.max(1, Math.ceil(diasComoCliente / 30));

    // 1. GEMINI AI ESTIMATION
    const prodsCreatedToday = bakeryProducts.filter((p) => p.dataCadastro === todayStr).length;
    const closingsCreatedToday = bakeryClosings.filter((c) => c.dataFechamento === todayStr).length;
    const scansHoje = prodsCreatedToday + closingsCreatedToday;

    const prodsCreatedThisMonth = bakeryProducts.filter((p) => (p.dataCadastro || '').startsWith(currentMonthStr)).length;
    const closingsCreatedThisMonth = bakeryClosings.filter((c) => (c.dataFechamento || '').startsWith(currentMonthStr)).length;
    const scansMes = prodsCreatedThisMonth + closingsCreatedThisMonth + Math.floor(bakeryProducts.length * 0.4);

    const chamadasIa = Math.max(2, Math.round((bakeryProducts.length * 1.8) + (bakeryVips.length * 2) + (bakeryClosings.length * 3) + (bakeryTickets.length * 1.2)));
    const tokensUtilizados = chamadasIa * 1380;
    
    // Gemini pricing: ~$0.15 / 1M tokens. Converted to BRL (x 5.5) + operational overhead floor
    const geminiCustoCalculado = (tokensUtilizados / 1000000) * 0.15 * 5.50;
    const geminiCusto = Number(Math.max(0.40, geminiCustoCalculado + (chamadasIa * 0.08)).toFixed(2));

    // 2. FIREBASE ESTIMATION
    const numeroDocumentos = bakeryProducts.length + bakerySales.length + bakeryTickets.length + bakeryVips.length + bakeryClosings.length + 1;
    const leituras = Math.max(50, (bakeryProducts.length * 15) + (bakerySales.length * 8) + (bakeryClosings.length * 20) + 120);
    const gravacoes = Math.max(10, (bakeryProducts.length * 2) + (bakerySales.length * 2) + (bakeryTickets.length * 2) + (bakeryVips.length * 2) + (bakeryClosings.length * 3));
    const atualizacoes = Math.max(4, Math.floor(gravacoes * 0.5));
    const armazenamentoMb = Number(Math.max(0.1, (numeroDocumentos * 0.003) + (bakeryProducts.filter(p => p.fotos && p.fotos.length > 0).length * 0.25)).toFixed(2));

    // Firestore rates: R$ 0.35 / 100k reads, R$ 1.05 / 100k writes, R$ 0.10/GB storage
    const firebaseCustoCalculado = (leituras / 100000 * 0.35) + (gravacoes / 100000 * 1.05) + (armazenamentoMb / 1024 * 0.10);
    const firebaseCusto = Number(Math.max(0.15, firebaseCustoCalculado + 0.30).toFixed(2));

    // 3. VERCEL / CLOUD RUN ESTIMATION
    const requisicoes = Math.max(80, (bakeryProducts.length * 18) + (bakerySales.length * 12) + (bakeryClosings.length * 25) + 150);
    const tempoExecucaoMs = requisicoes * 115;
    const invocacoes = Math.max(15, Math.floor(requisicoes * 0.65));
    const bandwidthMb = Math.max(2, Math.round(requisicoes * 0.09));

    // Vercel / serverless proportional rates
    const vercelCustoCalculado = (requisicoes / 1000 * 0.018) + (bandwidthMb / 1000 * 0.12);
    const vercelCusto = Number(Math.max(0.10, vercelCustoCalculado + 0.20).toFixed(2));

    const totalCost = Number((geminiCusto + firebaseCusto + vercelCusto).toFixed(2));

    // 4. FINANCIAL & LTV METRICS
    const valorMensal = company.financeiro?.valorMensalidade ?? 199;
    const valorImplementacao = company.financeiro?.valorImplementacao ?? 1500;
    const implementacaoPaga = company.financeiro?.implementacaoPaga ?? false;
    const status = company.financeiro?.statusAssinatura || 'pendente';

    const receitaMensal = company.ativo && status !== 'cancelado' && status !== 'suspenso' ? valorMensal : 0;
    const lucroBrutoMensal = Math.max(0, Number((receitaMensal - totalCost).toFixed(2)));
    const margemMensalPct = receitaMensal > 0 ? Number(((lucroBrutoMensal / receitaMensal) * 100).toFixed(1)) : 0;

    // Accumulated revenue & cost
    const receitaAcumuladaLtv = (implementacaoPaga ? valorImplementacao : 0) + (company.ativo ? (valorMensal * mesesAtivo) : 0);
    const custoAcumuladoLtv = Number((totalCost * mesesAtivo).toFixed(2));
    const lucroLiquidoLtv = Number((receitaAcumuladaLtv - custoAcumuladoLtv).toFixed(2));

    // Health indicator (LTV Health)
    let saudeLtv: 'excelente' | 'atencao' | 'revisar_plano' = 'excelente';
    if (status === 'vencido' || status === 'suspenso' || status === 'cancelado' || margemMensalPct < 65 || totalCost > (valorMensal * 0.3)) {
      saudeLtv = 'revisar_plano';
    } else if (status === 'pendente' || status === 'vencendo' || margemMensalPct < 88) {
      saudeLtv = 'atencao';
    }

    // Last payment date
    const lastInvoice = company.financeiro?.historicoCobrancas?.find(inv => inv.status === 'pago');
    const ultimoPagamento = lastInvoice ? lastInvoice.data : company.dataCadastro;

    return {
      bakeryCode: code,
      empresa: company.empresa,
      cnpj: company.cnpj,
      email: company.email,
      cidade: 'São Paulo', // Default / fallback location
      estado: 'SP',
      planoNome: `Plano Standard (R$ ${valorMensal}/mês)`,
      valorMensal,
      valorImplementacao,
      status,
      dataCadastro: company.dataCadastro || '2026-01-01',
      proximoVencimento: company.financeiro?.dataProximaCobranca || todayStr,
      diasComoCliente,
      mesesAtivo,
      valorTotalPago: receitaAcumuladaLtv,
      ultimoPagamento,
      usage: {
        gemini: {
          scansHoje,
          scansMes,
          chamadasIa,
          tokensUtilizados,
          custoEstimado: geminiCusto,
        },
        firebase: {
          leituras,
          gravacoes,
          atualizacoes,
          armazenamentoMb,
          numeroDocumentos,
          custoEstimado: firebaseCusto,
        },
        vercel: {
          requisicoes,
          tempoExecucaoMs,
          invocacoes,
          bandwidthMb,
          custoEstimado: vercelCusto,
        },
        totalCost,
      },
      receitaMensal,
      lucroBrutoMensal,
      margemMensalPct,
      receitaAcumuladaLtv,
      custoAcumuladoLtv,
      lucroLiquidoLtv,
      saudeLtv,
    };
  });
}

export interface SaasAlert {
  id: string;
  tipo: 'alerta' | 'atencao' | 'critico' | 'info';
  titulo: string;
  descricao: string;
  empresa: string;
  bakeryCode: string;
}

export function generateSaasAlerts(metrics: SaasClientMetrics[]): SaasAlert[] {
  const alerts: SaasAlert[] = [];

  if (metrics.length === 0) return alerts;

  const avgIaCalls = metrics.reduce((acc, m) => acc + m.usage.gemini.chamadasIa, 0) / metrics.length;
  const avgFirebaseReads = metrics.reduce((acc, m) => acc + m.usage.firebase.leituras, 0) / metrics.length;

  metrics.forEach((m) => {
    // 1. High AI consumption
    if (m.usage.gemini.chamadasIa > avgIaCalls * 1.8 && m.usage.gemini.chamadasIa > 15) {
      alerts.push({
        id: `alt_ia_${m.bakeryCode}`,
        tipo: 'atencao',
        titulo: 'Consumo de IA Acima da Média',
        descricao: `A padaria ${m.empresa} realizou ${m.usage.gemini.chamadasIa} chamadas de IA neste mês (média geral: ${Math.round(avgIaCalls)}).`,
        empresa: m.empresa,
        bakeryCode: m.bakeryCode,
      });
    }

    // 2. High Firebase consumption
    if (m.usage.firebase.leituras > avgFirebaseReads * 1.8 && m.usage.firebase.leituras > 100) {
      alerts.push({
        id: `alt_fb_${m.bakeryCode}`,
        tipo: 'atencao',
        titulo: 'Consumo do Firebase Acima da Média',
        descricao: `A padaria ${m.empresa} acumulou ${m.usage.firebase.leituras} leituras e ${m.usage.firebase.numeroDocumentos} documentos.`,
        empresa: m.empresa,
        bakeryCode: m.bakeryCode,
      });
    }

    // 3. Due soon
    const daysToDue = calculateDaysRemaining(m.proximoVencimento);
    if (daysToDue >= 0 && daysToDue <= 3 && m.status !== 'concluido') {
      alerts.push({
        id: `alt_due_${m.bakeryCode}`,
        tipo: 'alerta',
        titulo: 'Assinatura Próxima do Vencimento',
        descricao: `Vencimento em ${daysToDue} dia(s) (${m.proximoVencimento}). Valor: R$ ${m.valorMensal}.`,
        empresa: m.empresa,
        bakeryCode: m.bakeryCode,
      });
    }

    // 4. Overdue / Defaulting
    if (m.status === 'vencido' || daysToDue < 0) {
      alerts.push({
        id: `alt_ovd_${m.bakeryCode}`,
        tipo: 'critico',
        titulo: 'Cliente Inadimplente / Mensalidade Vencida',
        descricao: `A mensalidade de R$ ${m.valorMensal} da padaria ${m.empresa} está atrasada desde ${m.proximoVencimento}.`,
        empresa: m.empresa,
        bakeryCode: m.bakeryCode,
      });
    }

    // 5. Test mode for many days
    if (m.diasComoCliente > 2 && m.status === 'pendente') {
      alerts.push({
        id: `alt_tst_${m.bakeryCode}`,
        tipo: 'alerta',
        titulo: 'Cliente em Teste Há Vários Dias',
        descricao: `Cadastrado há ${m.diasComoCliente} dias e ainda não teve o pagamento da implantação/assinatura confirmado.`,
        empresa: m.empresa,
        bakeryCode: m.bakeryCode,
      });
    }

    // 6. High resource consumption vs plan value
    if (m.usage.totalCost > (m.valorMensal * 0.25) && m.valorMensal > 0) {
      alerts.push({
        id: `alt_cst_${m.bakeryCode}`,
        tipo: 'critico',
        titulo: 'Alto Custo de Infraestrutura vs Plano',
        descricao: `Custo mensal de infra (R$ ${m.usage.totalCost.toFixed(2)}) consome ${((m.usage.totalCost / m.valorMensal) * 100).toFixed(1)}% do valor do plano contratado. Considerar upgrade de plano.`,
        empresa: m.empresa,
        bakeryCode: m.bakeryCode,
      });
    }
  });

  return alerts;
}
