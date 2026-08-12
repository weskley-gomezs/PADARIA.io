import React from 'react';
import { Product } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingDown, AlertCircle, Lightbulb, BarChart3 } from 'lucide-react';

interface WasteChartSectionProps {
  products: Product[];
}

export const WasteChartSection: React.FC<WasteChartSectionProps> = ({ products }) => {
  const [isInsightExpanded, setIsInsightExpanded] = React.useState(false);

  // Aggregate waste value by month (using dataValidade YYYY-MM) for expired or all products
  const monthlyDataMap: { [key: string]: { month: string; totalWaste: number; count: number } } = {};

  products.forEach((p) => {
    // Consider expired or discard products using registration date or validity date
    const refDate = (p.status === 'vencido' && p.dataCadastro) ? p.dataCadastro : (p.dataValidade || p.dataCadastro);
    if (refDate) {
      const parts = refDate.split('-');
      if (parts.length >= 2) {
        const yearMonth = `${parts[0]}-${parts[1]}`;
        // Format month label like "Jan/26", etc.
        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
        const monthLabel = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        
        const estValue = p.valorTotal || (p.quantidade * (p.valorKg || 12.0));

        if (!monthlyDataMap[yearMonth]) {
          monthlyDataMap[yearMonth] = {
            month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
            totalWaste: 0,
            count: 0,
          };
        }
        monthlyDataMap[yearMonth].totalWaste += estValue;
        monthlyDataMap[yearMonth].count += p.quantidade;
      }
    }
  });

  const chartData = Object.keys(monthlyDataMap)
    .sort()
    .map((key) => monthlyDataMap[key]);

  // Total waste all time
  const totalWasteAllTime = chartData.reduce((acc, curr) => acc + curr.totalWaste, 0);

  // Calculate last 30 days waste value
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const last30DaysWaste = products.reduce((acc, p) => {
    if (p.status === 'vencido' || p.motivo === 'Vencimento' || p.motivo === 'Descarte') {
      const refStr = p.dataCadastro || p.dataValidade;
      if (refStr) {
        const pDate = new Date(refStr);
        if (pDate >= thirtyDaysAgo) {
          return acc + (p.valorTotal || (p.quantidade * (p.valorKg || 12.0)));
        }
      }
    }
    return acc;
  }, 0);

  const display30DaysWaste = last30DaysWaste > 0 ? last30DaysWaste : (chartData[chartData.length - 1]?.totalWaste || totalWasteAllTime);

  // Generate actionable insights
  const getInsights = () => {
    if (chartData.length === 0) {
      return "Nenhum dado de perdas registrado no momento. Cadastre produtos e registre descartes para gerar insights automáticos.";
    }
    const highestMonth = [...chartData].sort((a, b) => b.totalWaste - a.totalWaste)[0];
    return `O mês com maior projeção/registro de perdas é ${highestMonth.month} (Total de R$ ${highestMonth.totalWaste.toFixed(2)}). Recomendamos ajustar a produção antecipada em dias de menor movimento e intensificar promoções de queima de estoque 48h antes da validade.`;
  };

  return (
    <div className="bg-white p-3.5 sm:p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3 sm:pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 sm:p-2.5 bg-amber-50 text-[#E8571A] rounded-xl shrink-0">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-lg font-extrabold text-[#2C2C2C]">Valor Total de Perdas por Mês</h2>
            <p className="text-[11px] sm:text-xs text-gray-500">Análise gráfica de desperdício e vencimentos</p>
          </div>
        </div>
        <div className="self-start md:self-auto px-3 py-1 bg-orange-50 text-[#E8571A] border border-orange-200 rounded-xl text-xs font-extrabold">
          Total Acumulado: R$ {totalWasteAllTime.toFixed(2)}
        </div>
      </div>

      {/* Main summary text shown before the chart as requested */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/50 border border-orange-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#E8571A] animate-ping" />
          <span className="text-xs sm:text-sm font-black text-[#1F2937]">
            R$ {display30DaysWaste.toFixed(2)} <span className="font-semibold text-gray-600">perdidos nos últimos 30 dias</span>
          </span>
        </div>
        <span className="text-[10px] uppercase font-mono font-bold text-orange-800 bg-orange-100/80 px-2 py-0.5 rounded-md hidden sm:inline-block">
          Últimos 30 Dias
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-gray-400">
          <TrendingDown className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 opacity-50" />
          <p className="font-bold text-xs sm:text-sm">Sem dados suficientes para exibir o gráfico.</p>
          <p className="text-[11px] sm:text-xs mt-1">Cadastre produtos com datas de validade e valores para visualizar o relatório mensal.</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Reduced height on mobile approx 30-40% (h-48 on mobile, h-72 on sm+) */}
          <div className="h-48 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#6B7280' }} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip 
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Valor de Perdas']}
                  contentStyle={{ backgroundColor: '#2C2C2C', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="totalWaste" fill="#E8571A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Actionable Insights Box - Compact on mobile */}
          <div className="p-3 sm:p-4 bg-[#FAFAF8] border border-orange-200 rounded-2xl flex flex-col sm:flex-row items-start gap-2.5 sm:gap-3">
            <div className="flex items-center space-x-2 sm:space-x-0">
              <div className="p-1.5 sm:p-2 bg-[#F5E6D3] text-[#E8571A] rounded-xl shrink-0">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#2C2C2C] sm:hidden">
                INSIGHTS DO GESTOR
              </h4>
            </div>

            <div className="space-y-1 flex-1 w-full">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#2C2C2C] hidden sm:block">
                INSIGHTS ACIONÁVEIS PARA O GESTOR
              </h4>
              <p className={`text-xs text-gray-700 leading-relaxed font-medium ${!isInsightExpanded ? 'line-clamp-2 sm:line-clamp-none' : ''}`}>
                {getInsights()}
              </p>

              {/* Mobile Expansion Toggle */}
              <button
                type="button"
                onClick={() => setIsInsightExpanded(!isInsightExpanded)}
                className="text-[11px] font-extrabold text-[#E8571A] underline mt-1 sm:hidden cursor-pointer"
              >
                {isInsightExpanded ? 'Ver menos ↑' : 'Ver mais detalhes ↓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
