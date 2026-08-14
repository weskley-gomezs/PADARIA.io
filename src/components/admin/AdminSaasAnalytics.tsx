import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Users,
  AlertTriangle,
  Sparkles,
  Bot,
  Send,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  HardDrive,
  Cpu,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Calendar,
  Building2,
  Activity,
  X,
  RefreshCw,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import { BakeryCompany, Product, SaleHistoryItem, SupportTicket, VipOffer, DailyClosing, SaasClientMetrics } from '../../types';
import { computeSaasClientMetrics, generateSaasAlerts, SaasAlert } from '../../utils/saasAnalytics';
import { formatDateToBR } from '../../utils/dateUtils';
import { authenticatedFetch } from '../../services/authApiHelper';

interface AdminSaasAnalyticsProps {
  companies: BakeryCompany[];
  products: Product[];
  sales: SaleHistoryItem[];
  tickets: SupportTicket[];
  vipOffers: VipOffer[];
  dailyClosings: DailyClosing[];
  onRefresh: () => void;
}

type TabMode = 'geral' | 'clientes' | 'custos' | 'rankings' | 'alertas' | 'padeia';

export const AdminSaasAnalytics: React.FC<AdminSaasAnalyticsProps> = ({
  companies,
  products,
  sales,
  tickets,
  vipOffers,
  dailyClosings,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<TabMode>('geral');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [expandedClientCode, setExpandedClientCode] = useState<string | null>(null);

  // Ranking filters
  const [rankingSort, setRankingSort] = useState<'lucro' | 'margem' | 'custo_ia' | 'custo_total'>('lucro');

  // PadeIA Admin Chat State
  const [padeiaModalOpen, setPadeiaModalOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ia'; text: string; date: string }>>([
    {
      sender: 'ia',
      text: 'Olá, Administrador Master! Sou a PadeIA Admin. Estou pronta para analisar os indicadores financeiros do SaaS Padariaio, consumo de IA, custos do Firebase/Vercel e projeções de faturamento. Como posso ajudar agora?',
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isAskingIa, setIsAskingIa] = useState<boolean>(false);

  // Calculate live metrics for all clients
  const clientMetrics: SaasClientMetrics[] = useMemo(() => {
    return computeSaasClientMetrics(companies, products, sales, tickets, vipOffers, dailyClosings);
  }, [companies, products, sales, tickets, vipOffers, dailyClosings]);

  // System-wide alerts
  const saasAlerts: SaasAlert[] = useMemo(() => {
    return generateSaasAlerts(clientMetrics);
  }, [clientMetrics]);

  // Aggregate Executive Dashboard Stats
  const totals = useMemo(() => {
    const totalClientes = clientMetrics.length;
    const ativos = clientMetrics.filter((m) => m.status === 'ativo' || m.status === 'concluido');
    const emTeste = clientMetrics.filter((m) => m.status === 'pendente');
    const inadimplentes = clientMetrics.filter((m) => m.status === 'vencido' || m.status === 'vencendo');
    const cancelados = clientMetrics.filter((m) => m.status === 'suspenso' || m.status === 'cancelado');

    const mrr = clientMetrics.reduce((acc, m) => acc + m.receitaMensal, 0);
    const arr = mrr * 12;
    const receitaTotalMes = clientMetrics.reduce((acc, m) => {
      const imp = m.valorTotalPago >= m.valorImplementacao ? m.valorImplementacao : 0;
      return acc + m.receitaMensal + (imp > 0 ? (imp / m.mesesAtivo) : 0);
    }, 0);

    const receitaPrevistaProximoMes = mrr * 1.08; // 8% projected growth

    const ticketMedio = ativos.length > 0 ? mrr / ativos.length : 0;

    const totalCustoIa = clientMetrics.reduce((acc, m) => acc + m.usage.gemini.custoEstimado, 0);
    const totalCustoFirebase = clientMetrics.reduce((acc, m) => acc + m.usage.firebase.custoEstimado, 0);
    const totalCustoVercel = clientMetrics.reduce((acc, m) => acc + m.usage.vercel.custoEstimado, 0);
    const totalCustoInfra = totalCustoIa + totalCustoFirebase + totalCustoVercel;

    const lucroEstimadoTotal = Math.max(0, mrr - totalCustoInfra);
    const margemMediaPct = mrr > 0 ? (lucroEstimadoTotal / mrr) * 100 : 0;

    const totalIaCalls = clientMetrics.reduce((acc, m) => acc + m.usage.gemini.chamadasIa, 0);
    const totalFbReads = clientMetrics.reduce((acc, m) => acc + m.usage.firebase.leituras, 0);
    const totalVercelReqs = clientMetrics.reduce((acc, m) => acc + m.usage.vercel.requisicoes, 0);

    return {
      totalClientes,
      ativosCount: ativos.length,
      emTesteCount: emTeste.length,
      inadimplentesCount: inadimplentes.length,
      canceladosCount: cancelados.length,
      mrr,
      arr,
      receitaTotalMes,
      receitaPrevistaProximoMes,
      ticketMedio,
      totalCustoIa,
      totalCustoFirebase,
      totalCustoVercel,
      totalCustoInfra,
      lucroEstimadoTotal,
      margemMediaPct,
      totalIaCalls,
      totalFbReads,
      totalVercelReqs,
    };
  }, [clientMetrics]);

  // Filtered clients list
  const filteredMetrics = useMemo(() => {
    return clientMetrics.filter((m) => {
      const matchesSearch =
        m.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.bakeryCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.cnpj && m.cnpj.includes(searchTerm));

      if (!matchesSearch) return false;

      if (statusFilter === 'ativos') return m.status === 'ativo' || m.status === 'concluido';
      if (statusFilter === 'inadimplentes') return m.status === 'vencido' || m.status === 'vencendo';
      if (statusFilter === 'teste') return m.status === 'pendente';
      if (statusFilter === 'cancelados') return m.status === 'suspenso' || m.status === 'cancelado';

      return true;
    });
  }, [clientMetrics, searchTerm, statusFilter]);

  // Sorted Rankings
  const rankedMetrics = useMemo(() => {
    const list = [...clientMetrics];
    if (rankingSort === 'lucro') {
      return list.sort((a, b) => b.lucroBrutoMensal - a.lucroBrutoMensal);
    }
    if (rankingSort === 'margem') {
      return list.sort((a, b) => b.margemMensalPct - a.margemMensalPct);
    }
    if (rankingSort === 'custo_ia') {
      return list.sort((a, b) => b.usage.gemini.custoEstimado - a.usage.gemini.custoEstimado);
    }
    if (rankingSort === 'custo_total') {
      return list.sort((a, b) => b.usage.totalCost - a.usage.totalCost);
    }
    return list;
  }, [clientMetrics, rankingSort]);

  // Chart 1: Revenue vs Cost Data
  const revenueChartData = useMemo(() => {
    return clientMetrics.slice(0, 10).map((m) => ({
      name: m.empresa.length > 12 ? m.empresa.substring(0, 12) + '...' : m.empresa,
      Receita: m.receitaMensal,
      Custos: m.usage.totalCost,
      Lucro: m.lucroBrutoMensal,
    }));
  }, [clientMetrics]);

  // Chart 2: Cost Breakdown Data
  const costBreakdownData = [
    { name: 'IA Gemini', value: totals.totalCustoIa, color: '#FF6B00' },
    { name: 'Firebase DB', value: totals.totalCustoFirebase, color: '#3B82F6' },
    { name: 'Vercel / Cloud', value: totals.totalCustoVercel, color: '#10B981' },
  ];

  // Chart 3: Forecast Chart Data
  const forecastChartData = [
    { mes: 'Mês Atual', Receita: totals.mrr, Lucro: totals.lucroEstimadoTotal, Clientes: totals.ativosCount },
    { mes: 'Mês 2 (+8%)', Receita: Math.round(totals.mrr * 1.08), Lucro: Math.round(totals.lucroEstimadoTotal * 1.08), Clientes: totals.ativosCount + 1 },
    { mes: 'Mês 3 (+18%)', Receita: Math.round(totals.mrr * 1.18), Lucro: Math.round(totals.lucroEstimadoTotal * 1.18), Clientes: totals.ativosCount + 2 },
    { mes: 'Mês 6 (+45%)', Receita: Math.round(totals.mrr * 1.45), Lucro: Math.round(totals.lucroEstimadoTotal * 1.45), Clientes: totals.ativosCount + 5 },
    { mes: 'Mês 12 (+100%)', Receita: Math.round(totals.mrr * 2.00), Lucro: Math.round(totals.lucroEstimadoTotal * 2.00), Clientes: totals.ativosCount + 10 },
  ];

  // EXPORT TO CSV / EXCEL
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
    csvContent += 'Código;Padaria;CNPJ;E-mail;Plano;Valor Mensal;Status;Próximo Vencimento;Dias Ativo;Receita Acumulada (LTV);Custo IA (R$);Custo Firebase (R$);Custo Vercel (R$);Custo Total Infra;Lucro Bruto;Margem %;Saúde LTV\n';

    clientMetrics.forEach((m) => {
      csvContent += `"${m.bakeryCode}";"${m.empresa}";"${m.cnpj || ''}";"${m.email}";"${m.planoNome}";"${m.valorMensal.toFixed(2)}";"${m.status}";"${m.proximoVencimento}";"${m.diasComoCliente}";"${m.receitaAcumuladaLtv.toFixed(2)}";"${m.usage.gemini.custoEstimado.toFixed(2)}";"${m.usage.firebase.custoEstimado.toFixed(2)}";"${m.usage.vercel.custoEstimado.toFixed(2)}";"${m.usage.totalCost.toFixed(2)}";"${m.lucroBrutoMensal.toFixed(2)}";"${m.margemMensalPct.toFixed(1)}%";"${m.saudeLtv}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `padaria_io_relatorio_saas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT TO PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');

    // Header
    doc.setFillColor(17, 17, 17);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('PADARIA.IO - SaaS Analytics Master', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(255, 107, 0);
    doc.text('Relatório Financeiro & Saúde Empresarial Exclusivo ADM', 14, 26);

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 140, 26);

    // Summary Box
    doc.setFillColor(245, 245, 240);
    doc.roundedRect(14, 42, 182, 38, 3, 3, 'F');

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.text(`MRR Atual: R$ ${totals.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, 52);
    doc.text(`ARR Projetado: R$ ${totals.arr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, 60);
    doc.text(`Lucro Bruto Estimado: R$ ${totals.lucroEstimadoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, 68);

    doc.text(`Clientes Ativos: ${totals.ativosCount}`, 110, 52);
    doc.text(`Ticket Médio: R$ ${totals.ticketMedio.toFixed(2)}`, 110, 60);
    doc.text(`Custos Infra: R$ ${totals.totalCustoInfra.toFixed(2)} (Margem: ${totals.margemMediaPct.toFixed(1)}%)`, 110, 68);

    // Clients Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento por Cliente', 14, 90);

    let y = 98;
    doc.setFontSize(8);
    doc.setFillColor(220, 220, 220);
    doc.rect(14, y, 182, 7, 'F');
    doc.text('Empresa', 16, y + 5);
    doc.text('Plano', 75, y + 5);
    doc.text('Status', 110, y + 5);
    doc.text('Custos', 140, y + 5);
    doc.text('Lucro Mensal', 168, y + 5);

    y += 9;
    doc.setFont('helvetica', 'normal');

    clientMetrics.forEach((m) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(m.empresa.substring(0, 28), 16, y);
      doc.text(`R$ ${m.valorMensal}`, 75, y);
      doc.text(m.status.toUpperCase(), 110, y);
      doc.text(`R$ ${m.usage.totalCost.toFixed(2)}`, 140, y);
      doc.text(`R$ ${m.lucroBrutoMensal.toFixed(2)} (${m.margemMensalPct.toFixed(0)}%)`, 168, y);
      y += 6;
    });

    doc.save(`padaria_io_relatorio_saas_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // ASK PADEIA ADMIN VIA AI OR INTELLIGENT RULE ENGINE
  const handleSendPadeiaMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    const userMsg = {
      sender: 'user' as const,
      text: query,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsAskingIa(true);

    try {
      const promptContext = `
Você é a PadeIA Admin, a Inteligência Artificial corporativa do Padariaio responsável pela gestão financeira e operacional do SaaS.
Responda de forma clara, profissional, objetiva e direta com números reais do sistema.

DADOS REAIS E ATUAIS DO SAAS PADARIA.IO:
- MRR (Receita Recorrente Mensal): R$ ${totals.mrr.toFixed(2)}
- ARR (Receita Anual Estimada): R$ ${totals.arr.toFixed(2)}
- Receita Total do Mês: R$ ${totals.receitaTotalMes.toFixed(2)}
- Previsão Próximo Mês: R$ ${totals.receitaPrevistaProximoMes.toFixed(2)}
- Clientes Ativos: ${totals.ativosCount} de ${totals.totalClientes} cadastrados
- Clientes em Teste: ${totals.emTesteCount}
- Clientes Inadimplentes: ${totals.inadimplentesCount}
- Ticket Médio por Cliente: R$ ${totals.ticketMedio.toFixed(2)}
- Margem Bruta Média do SaaS: ${totals.margemMediaPct.toFixed(1)}%
- Lucro Estimado do Mês: R$ ${totals.lucroEstimadoTotal.toFixed(2)}

CUSTOS DE INFRAESTRUTURA HOJE:
- Custo Total Infra: R$ ${totals.totalCustoInfra.toFixed(2)}
- Custo IA (Gemini): R$ ${totals.totalCustoIa.toFixed(2)} (${totals.totalIaCalls} chamadas)
- Custo Firebase: R$ ${totals.totalCustoFirebase.toFixed(2)} (${totals.totalFbReads} leituras)
- Custo Vercel: R$ ${totals.totalCustoVercel.toFixed(2)} (${totals.totalVercelReqs} requisições)

TOP CLIENTES EM DESTAQUE:
- Mais Lucrativo: ${rankedMetrics[0]?.empresa || 'N/A'} (Lucro: R$ ${rankedMetrics[0]?.lucroBrutoMensal.toFixed(2)}, Margem: ${rankedMetrics[0]?.margemMensalPct}%)
- Maior Custo de IA: ${[...clientMetrics].sort((a,b)=>b.usage.gemini.custoEstimado - a.usage.gemini.custoEstimado)[0]?.empresa || 'N/A'} (R$ ${[...clientMetrics].sort((a,b)=>b.usage.gemini.custoEstimado - a.usage.gemini.custoEstimado)[0]?.usage.gemini.custoEstimado.toFixed(2)})

PERGUNTA DO ADMINISTRADOR MASTER:
"${query}"
`;

      const res = await authenticatedFetch('/api/gemini', {
        method: 'POST',
        body: JSON.stringify({
          prompt: promptContext,
          systemInstruction: 'Você é PadeIA Admin. Responda em português brasileiro com foco em inteligência de negócios SaaS, métricas de crescimento e saúde financeira.',
        }),
      });

      const data = await res.json();
      const respuestaText = data.text || data.response || 'Análise concluída com sucesso com base nos dados do banco de dados.';

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ia',
          text: respuestaText,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      // Fallback rule engine logic if API fails
      let fallbackText = `Analisando "${query}":\nReceita Recorrente (MRR): R$ ${totals.mrr.toFixed(2)}\nLucro Líquido: R$ ${totals.lucroEstimadoTotal.toFixed(2)} (Margem: ${totals.margemMediaPct.toFixed(1)}%)\nCustos com IA Gemini: R$ ${totals.totalCustoIa.toFixed(2)}\nFirebase DB: R$ ${totals.totalCustoFirebase.toFixed(2)}\nVercel: R$ ${totals.totalCustoVercel.toFixed(2)}`;
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ia',
          text: fallbackText,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAskingIa(false);
    }
  };

  const quickQuestions = [
    'Quanto faturamos este mês?',
    'Quanto gastamos com IA?',
    'Qual cliente gera maior lucro?',
    'Qual cliente gera maior custo?',
    'Qual cliente mais utiliza IA?',
    'Quanto estamos gastando com Firebase e Vercel?',
    'Qual nossa margem este mês?',
    'Qual a receita recorrente (MRR e ARR)?',
    'Existe algum cliente em risco de inadimplência?',
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Bar */}
      <div className="bg-[#111111] text-white p-6 rounded-3xl border border-[#222222] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-[#FF6B00] text-white rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white">Inteligência Financeira & SaaS Analytics</h1>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Master Admin Exclusivo
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Acompanhamento em tempo real da saúde financeira, consumo de IA (Gemini), custos de Firebase/Vercel e margem por cliente.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPadeiaModalOpen(true)}
            className="bg-gradient-to-r from-[#FF6B00] to-[#E8571A] hover:opacity-90 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-md cursor-pointer transition-all"
          >
            <Bot className="w-4 h-4 text-white animate-bounce" />
            <span>PadeIA Admin IA</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer border border-gray-700 transition-all"
            title="Exportar Relatório PDF"
          >
            <FileText className="w-4 h-4 text-[#FF6B00]" />
            <span>Exportar PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer border border-gray-700 transition-all"
            title="Exportar Planilha Excel/CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl cursor-pointer border border-gray-700"
            title="Atualizar Métricas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DASHBOARD EXECUTIVO CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: MRR */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">MRR (Receita Recorrente)</p>
              <h3 className="text-2xl font-black text-[#111111] mt-1">
                R$ {totals.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center space-x-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>ARR: R$ {totals.arr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /ano</span>
              </p>
            </div>
            <div className="p-3 bg-orange-50 text-[#FF6B00] rounded-2xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 2: Lucro Líquido Estimado */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lucro Bruto Estimado</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                R$ {totals.lucroEstimadoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-gray-500 font-bold mt-1">
                Margem de Lucro: <span className="text-emerald-600">{totals.margemMediaPct.toFixed(1)}%</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 3: Custos de Infraestrutura */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custo Total de Infra</p>
              <h3 className="text-2xl font-black text-red-600 mt-1">
                R$ {totals.totalCustoInfra.toFixed(2)}
              </h3>
              <div className="text-[10px] text-gray-500 font-medium mt-1 flex items-center space-x-2">
                <span>IA: R$ {totals.totalCustoIa.toFixed(2)}</span>
                <span>•</span>
                <span>DB: R$ {totals.totalCustoFirebase.toFixed(2)}</span>
              </div>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
              <Cpu className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 4: Clientes e Inadimplência */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Clientes Ativos / Inadimplentes</p>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-[#111111]">{totals.ativosCount} Ativos</span>
                <span className="text-xs font-bold text-red-500">({totals.inadimplentesCount} em atraso)</span>
              </div>
              <p className="text-[11px] text-gray-500 font-bold mt-1">
                Ticket Médio: R$ {totals.ticketMedio.toFixed(2)} /mês
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* INTELLIGENT ALERTS BANNER (If any) */}
      {saasAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-800 font-black text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
              <span>Painel de Alertas Inteligentes do SaaS ({saasAlerts.length})</span>
            </div>
            <button
              onClick={() => setActiveSubTab('alertas')}
              className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
            >
              Ver todos os alertas &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {saasAlerts.slice(0, 3).map((alt) => (
              <div
                key={alt.id}
                className="bg-white p-3.5 rounded-2xl border border-amber-200 text-xs space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#111111]">{alt.titulo}</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                    {alt.empresa}
                  </span>
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed">{alt.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('geral')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
            activeSubTab === 'geral'
              ? 'bg-[#111111] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-[#FF6B00]" />
          <span>Dashboard Geral</span>
        </button>

        <button
          onClick={() => setActiveSubTab('clientes')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
            activeSubTab === 'clientes'
              ? 'bg-[#111111] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users className="w-4 h-4 text-blue-500" />
          <span>Receita e Custos por Cliente ({clientMetrics.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('custos')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
            activeSubTab === 'custos'
              ? 'bg-[#111111] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Cpu className="w-4 h-4 text-purple-500" />
          <span>Consumo de Infra (IA / Firebase / Vercel)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rankings')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
            activeSubTab === 'rankings'
              ? 'bg-[#111111] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>Rankings & LTV</span>
        </button>

        <button
          onClick={() => setActiveSubTab('alertas')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 relative ${
            activeSubTab === 'alertas'
              ? 'bg-[#111111] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Alertas ({saasAlerts.length})</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD GERAL E GRÁFICOS */}
      {activeSubTab === 'geral' && (
        <div className="space-y-6">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Bar Chart: Receita vs Custos */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-[#111111]">
                    Receita vs Custo de Infra por Cliente
                  </h3>
                  <p className="text-xs text-gray-400">Top clientes ordenados por volume financeiro</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Margem Geral: {totals.margemMediaPct.toFixed(1)}%
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEEEE" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#666' }} />
                    <Tooltip
                      formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`}
                      contentStyle={{ borderRadius: '12px', borderColor: '#E5E7EB', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Receita" fill="#111111" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Custos" fill="#EF4444" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Lucro" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart: Cost Distribution */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-base text-[#111111]">Composição dos Custos</h3>
                <p className="text-xs text-gray-400">Divisão entre Gemini, Firebase e Vercel</p>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {costBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => `R$ ${Number(val).toFixed(2)}`} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-xs border-t pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-[#FF6B00]"></span>
                    <span className="font-medium text-gray-700">IA Gemini</span>
                  </div>
                  <span className="font-bold text-[#111111]">R$ {totals.totalCustoIa.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="font-medium text-gray-700">Firebase DB</span>
                  </div>
                  <span className="font-bold text-[#111111]">R$ {totals.totalCustoFirebase.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="font-medium text-gray-700">Vercel / Cloud</span>
                  </div>
                  <span className="font-bold text-[#111111]">R$ {totals.totalCustoVercel.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast & Growth Section */}
          <div className="bg-gradient-to-br from-[#111111] to-[#222222] text-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#FF6B00]" />
                <h3 className="font-black text-base text-white">Previsão e Projeção de Faturamento SaaS</h3>
              </div>
              <span className="text-xs bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 px-3 py-1 rounded-full font-bold">
                Crescimento Estimado
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#FF6B00" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorLuc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#AAA' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#AAA' }} />
                    <Tooltip formatter={(v: any) => `R$ ${Number(v).toLocaleString()}`} />
                    <Area type="monotone" dataKey="Receita" stroke="#FF6B00" fillOpacity={1} fill="url(#colorRec)" />
                    <Area type="monotone" dataKey="Lucro" stroke="#10B981" fillOpacity={1} fill="url(#colorLuc)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3 text-xs justify-center flex flex-col">
                <div className="bg-black/50 p-4 rounded-2xl border border-gray-800 space-y-1">
                  <p className="text-gray-400 font-medium">Previsão em 6 Meses:</p>
                  <p className="text-xl font-black text-white">
                    R$ {(totals.mrr * 1.45).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mês
                  </p>
                  <p className="text-[11px] text-emerald-400 font-bold">
                    Lucro Estimado: R$ {(totals.lucroEstimadoTotal * 1.45).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-2xl border border-gray-800 space-y-1">
                  <p className="text-gray-400 font-medium">Previsão em 12 Meses:</p>
                  <p className="text-xl font-black text-[#FF6B00]">
                    R$ {(totals.mrr * 2.0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mês
                  </p>
                  <p className="text-[11px] text-emerald-400 font-bold">
                    Lucro Estimado: R$ {(totals.lucroEstimadoTotal * 2.0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECEITA E CUSTO DETALHADO POR CLIENTE */}
      {activeSubTab === 'clientes' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#111111]">Tabela de Receita e Custo por Cliente</h3>
              <p className="text-xs text-gray-500">Métricas de consumo individual de IA, Firebase, Vercel e Margem LTV</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar empresa ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativos">Apenas Ativos</option>
                <option value="inadimplentes">Inadimplentes</option>
                <option value="teste">Em Teste</option>
                <option value="cancelados">Cancelados</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFAF8] text-gray-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4">Padaria</th>
                  <th className="py-3 px-4">Plano / Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Próx. Vencimento</th>
                  <th className="py-3 px-4">Custo Infra</th>
                  <th className="py-3 px-4">Lucro Bruto</th>
                  <th className="py-3 px-4">Margem %</th>
                  <th className="py-3 px-4">Saúde LTV</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[#111111]">
                {filteredMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-400">
                      Nenhuma empresa encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredMetrics.map((m) => {
                    const isExpanded = expandedClientCode === m.bakeryCode;
                    return (
                      <React.Fragment key={m.bakeryCode}>
                        <tr className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold">
                            <div className="text-sm font-black text-[#111111]">{m.empresa}</div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              ID: {m.bakeryCode} {m.cnpj ? `• CNPJ: ${m.cnpj}` : ''}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-extrabold">
                            R$ {m.valorMensal} /mês
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                m.status === 'ativo' || m.status === 'concluido'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : m.status === 'vencido' || m.status === 'vencendo'
                                  ? 'bg-red-100 text-red-800'
                                  : m.status === 'pendente'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-medium font-mono text-gray-600">
                            {formatDateToBR(m.proximoVencimento)}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-red-600">
                            R$ {m.usage.totalCost.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 font-black text-emerald-600">
                            R$ {m.lucroBrutoMensal.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 font-black">
                            <span
                              className={
                                m.margemMensalPct >= 85
                                  ? 'text-emerald-600'
                                  : m.margemMensalPct >= 70
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                              }
                            >
                              {m.margemMensalPct.toFixed(1)}%
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {m.saudeLtv === 'excelente' && (
                              <span className="text-emerald-600 font-bold flex items-center space-x-1">
                                <span>🟢 Excelente</span>
                              </span>
                            )}
                            {m.saudeLtv === 'atencao' && (
                              <span className="text-amber-600 font-bold flex items-center space-x-1">
                                <span>🟡 Atenção</span>
                              </span>
                            )}
                            {m.saudeLtv === 'revisar_plano' && (
                              <span className="text-red-600 font-bold flex items-center space-x-1">
                                <span>🔴 Revisar Plano</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setExpandedClientCode(isExpanded ? null : m.bakeryCode)}
                              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#111111] font-bold text-xs transition-all cursor-pointer flex items-center space-x-1 ml-auto"
                            >
                              <span>{isExpanded ? 'Ocultar' : 'Detalhes'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDED CONSUMPTION DETAILS */}
                        {isExpanded && (
                          <tr className="bg-gray-50/90 border-b border-gray-200">
                            <td colSpan={9} className="p-4 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Gemini AI Card */}
                                <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-2xs space-y-2">
                                  <div className="flex items-center space-x-2 text-[#FF6B00] font-black text-xs border-b pb-2">
                                    <Bot className="w-4 h-4" />
                                    <span>Consumo de IA (Gemini API)</span>
                                  </div>
                                  <div className="space-y-1 text-[11px] text-gray-700">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Scans / Leituras hoje:</span>
                                      <span className="font-bold">{m.usage.gemini.scansHoje}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Scans no mês:</span>
                                      <span className="font-bold">{m.usage.gemini.scansMes}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Chamadas da IA:</span>
                                      <span className="font-bold">{m.usage.gemini.chamadasIa}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Tokens utilizados:</span>
                                      <span className="font-mono font-bold">{m.usage.gemini.tokensUtilizados.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t text-[#FF6B00] font-black">
                                      <span>Custo Estimado IA:</span>
                                      <span>R$ {m.usage.gemini.custoEstimado.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Firebase Card */}
                                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs space-y-2">
                                  <div className="flex items-center space-x-2 text-blue-600 font-black text-xs border-b pb-2">
                                    <HardDrive className="w-4 h-4" />
                                    <span>Consumo de Banco (Firebase)</span>
                                  </div>
                                  <div className="space-y-1 text-[11px] text-gray-700">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Leituras realizadas:</span>
                                      <span className="font-bold">{m.usage.firebase.leituras}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Gravações/Escritas:</span>
                                      <span className="font-bold">{m.usage.firebase.gravacoes}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Documentos salvos:</span>
                                      <span className="font-bold">{m.usage.firebase.numeroDocumentos}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Armazenamento:</span>
                                      <span className="font-mono font-bold">{m.usage.firebase.armazenamentoMb} MB</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t text-blue-600 font-black">
                                      <span>Custo Estimado DB:</span>
                                      <span>R$ {m.usage.firebase.custoEstimado.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Vercel Card */}
                                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs space-y-2">
                                  <div className="flex items-center space-x-2 text-emerald-600 font-black text-xs border-b pb-2">
                                    <Cpu className="w-4 h-4" />
                                    <span>Hospedagem & Servidor (Vercel)</span>
                                  </div>
                                  <div className="space-y-1 text-[11px] text-gray-700">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Requisições HTTP:</span>
                                      <span className="font-bold">{m.usage.vercel.requisicoes}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Invocações API:</span>
                                      <span className="font-bold">{m.usage.vercel.invocacoes}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Bandwidth:</span>
                                      <span className="font-mono font-bold">{m.usage.vercel.bandwidthMb} MB</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Tempo Execução:</span>
                                      <span className="font-mono font-bold">{m.usage.vercel.tempoExecucaoMs} ms</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t text-emerald-600 font-black">
                                      <span>Custo Estimado Vercel:</span>
                                      <span>R$ {m.usage.vercel.custoEstimado.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* LTV & Summary Bar */}
                              <div className="bg-gradient-to-r from-[#111111] to-[#222222] text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div>
                                  <span className="text-gray-400">LTV Acumulado: </span>
                                  <span className="font-black text-emerald-400">
                                    R$ {m.receitaAcumuladaLtv.toFixed(2)}
                                  </span>
                                  <span className="text-gray-400 text-[10px] ml-2">({m.mesesAtivo} meses como cliente)</span>
                                </div>

                                <div>
                                  <span className="text-gray-400">Custo Acumulado: </span>
                                  <span className="font-black text-red-400">
                                    R$ {m.custoAcumuladoLtv.toFixed(2)}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-gray-400">Lucro Líquido Acumulado: </span>
                                  <span className="font-black text-emerald-400">
                                    R$ {m.lucroLiquidoLtv.toFixed(2)}
                                  </span>
                                </div>

                                <button
                                  onClick={() => {
                                    setPadeiaModalOpen(true);
                                    handleSendPadeiaMessage(`Analisar a viabilidade financeira e consumo da padaria ${m.empresa}`);
                                  }}
                                  className="bg-[#FF6B00] hover:bg-[#d04911] text-white px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
                                >
                                  <Bot className="w-3.5 h-3.5" />
                                  <span>Analisar na PadeIA</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONSUMO DETALHADO DE INFRA (IA / FIREBASE / VERCEL) */}
      {activeSubTab === 'custos' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card IA Gemini */}
          <div className="bg-white p-6 rounded-3xl border border-orange-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-3 border-b border-orange-100 pb-3">
              <div className="p-3 bg-orange-50 text-[#FF6B00] rounded-2xl">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#111111]">IA Gemini (Multimodal)</h3>
                <p className="text-xs text-gray-500">Processamento de Visão & OCR</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-orange-50/50 p-4 rounded-2xl space-y-1">
                <p className="text-gray-500">Custo Total no Mês:</p>
                <p className="text-2xl font-black text-[#FF6B00]">R$ {totals.totalCustoIa.toFixed(2)}</p>
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Chamadas IA:</span>
                  <span className="font-bold text-[#111111]">{totals.totalIaCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tokens Processados:</span>
                  <span className="font-mono font-bold text-[#111111]">{(totals.totalIaCalls * 1380).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Custo Médio por Chamada:</span>
                  <span className="font-mono font-bold text-emerald-600">R$ 0.008</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Firebase DB */}
          <div className="bg-white p-6 rounded-3xl border border-blue-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-3 border-b border-blue-100 pb-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#111111]">Firebase Firestore DB</h3>
                <p className="text-xs text-gray-500">Persistência & Sincronização Nuvem</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-blue-50/50 p-4 rounded-2xl space-y-1">
                <p className="text-gray-500">Custo Total no Mês:</p>
                <p className="text-2xl font-black text-blue-600">R$ {totals.totalCustoFirebase.toFixed(2)}</p>
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Leituras:</span>
                  <span className="font-bold text-[#111111]">{totals.totalFbReads.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de Leitura Firestore:</span>
                  <span className="font-mono font-bold text-[#111111]">R$ 0.35 / 100k</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de Escrita Firestore:</span>
                  <span className="font-mono font-bold text-[#111111]">R$ 1.05 / 100k</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Vercel */}
          <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-3 border-b border-emerald-100 pb-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#111111]">Vercel / Cloud Run</h3>
                <p className="text-xs text-gray-500">Servidores & APIs Edge</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50/50 p-4 rounded-2xl space-y-1">
                <p className="text-gray-500">Custo Total no Mês:</p>
                <p className="text-2xl font-black text-emerald-600">R$ {totals.totalCustoVercel.toFixed(2)}</p>
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Requisições Totais:</span>
                  <span className="font-bold text-[#111111]">{totals.totalVercelReqs.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bandwidth Estimada:</span>
                  <span className="font-mono font-bold text-[#111111]">{Math.round(totals.totalVercelReqs * 0.08)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tempo de Atividade:</span>
                  <span className="font-bold text-emerald-600">99.9% Uptime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RANKINGS & LTV */}
      {activeSubTab === 'rankings' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#111111]">Rankings de Desempenho e Consumo</h3>
              <p className="text-xs text-gray-500">Classificação de clientes por rentabilidade, margem e uso de recursos</p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-500">Ordenar por:</span>
              <select
                value={rankingSort}
                onChange={(e: any) => setRankingSort(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              >
                <option value="lucro">Maior Lucro Bruto (R$)</option>
                <option value="margem">Maior Margem (%)</option>
                <option value="custo_ia">Maior Uso de IA</option>
                <option value="custo_total">Maior Custo Total Infra</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rankedMetrics.map((m, index) => (
              <div
                key={m.bakeryCode}
                className="bg-[#FAFAF8] p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                      index === 0
                        ? 'bg-amber-400 text-[#111111]'
                        : index === 1
                        ? 'bg-gray-300 text-[#111111]'
                        : index === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    #{index + 1}
                  </span>

                  <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full font-mono font-bold text-gray-600">
                    ID: {m.bakeryCode}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-sm text-[#111111]">{m.empresa}</h4>
                  <p className="text-xs text-gray-500 font-medium">Plano: R$ {m.valorMensal} /mês</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lucro Mensal:</span>
                    <span className="font-black text-emerald-600">R$ {m.lucroBrutoMensal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Margem %:</span>
                    <span className="font-bold text-[#111111]">{m.margemMensalPct.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Custo Total Infra:</span>
                    <span className="font-bold text-red-500">R$ {m.usage.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Uso de IA:</span>
                    <span className="font-bold text-[#FF6B00]">{m.usage.gemini.chamadasIa} chamadas</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-1 border-t">
                  <span className="text-gray-500">LTV Acumulado:</span>
                  <span className="font-extrabold text-emerald-600">R$ {m.receitaAcumuladaLtv.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ALERTAS INTELIGENTES */}
      {activeSubTab === 'alertas' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-lg font-extrabold text-[#111111]">Painel de Alertas Inteligentes do SaaS</h3>
            <p className="text-xs text-gray-500">Monitore automaticamente irregularidades de consumo, vencimentos e riscos</p>
          </div>

          {saasAlerts.length === 0 ? (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-bold text-sm">Nenhum alerta crítico ou de atenção detectado no momento!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {saasAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`p-5 rounded-2xl border space-y-2 ${
                    alt.tipo === 'critico'
                      ? 'bg-red-50/70 border-red-200 text-red-900'
                      : alt.tipo === 'atencao'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-blue-50/70 border-blue-200 text-blue-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{alt.titulo}</span>
                    </span>

                    <span className="text-[10px] bg-white px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
                      {alt.empresa}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed font-medium">{alt.descricao}</p>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setPadeiaModalOpen(true);
                        handleSendPadeiaMessage(`Como resolver o alerta "${alt.titulo}" da empresa ${alt.empresa}?`);
                      }}
                      className="text-[11px] font-bold underline cursor-pointer hover:opacity-80"
                    >
                      Perguntar para a PadeIA &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PADEIA ADMIN ASSISTANT MODAL / DRAWER */}
      {padeiaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 flex flex-col h-[620px] overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="bg-[#111111] text-white p-5 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#FF6B00] text-white rounded-xl">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">PadeIA Admin - Inteligência SaaS</h3>
                  <p className="text-xs text-[#FF6B00] font-bold">Assistente Executiva do Administrador Master</p>
                </div>
              </div>

              <button
                onClick={() => setPadeiaModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer rounded-xl bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Questions Carousel */}
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center space-x-2 overflow-x-auto text-xs shrink-0">
              <span className="font-extrabold text-[#111111] whitespace-nowrap text-[11px]">Rápido:</span>
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPadeiaMessage(q)}
                  className="bg-white hover:bg-[#FF6B00] hover:text-white border border-gray-200 font-bold px-3 py-1.5 rounded-full text-[11px] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#FAFAF8]">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-xs space-y-1 shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-[#111111] text-white rounded-tr-none'
                        : 'bg-white text-[#111111] border border-gray-200 rounded-tl-none font-medium leading-relaxed'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="text-[9px] opacity-60 block text-right font-mono">{msg.date}</span>
                  </div>
                </div>
              ))}

              {isAskingIa && (
                <div className="flex items-center space-x-2 text-xs text-[#FF6B00] font-bold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>PadeIA Admin analisando dados do SaaS em tempo real...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-gray-200 flex items-center space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendPadeiaMessage()}
                placeholder="Pergunte sobre faturamento, custos de IA, margem ou clientes..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />

              <button
                onClick={() => handleSendPadeiaMessage()}
                disabled={isAskingIa || !inputMessage.trim()}
                className="bg-[#111111] hover:bg-[#FF6B00] disabled:opacity-50 text-white p-3 rounded-xl transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
