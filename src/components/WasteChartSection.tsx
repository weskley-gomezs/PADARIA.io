import React from 'react';
import { Product } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingDown, AlertCircle, Lightbulb, BarChart3 } from 'lucide-react';

interface WasteChartSectionProps {
  products: Product[];
}

export const WasteChartSection: React.FC<WasteChartSectionProps> = ({ products }) => {
  // Aggregate waste value by month (using dataValidade YYYY-MM) for expired or all products
  const monthlyDataMap: { [key: string]: { month: string; totalWaste: number; count: number } } = {};

  products.forEach((p) => {
    // Consider expired or all products to show trend
    if (p.dataValidade) {
      const parts = p.dataValidade.split('-');
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

  // If no data, provide dummy/placeholder or empty state
  const totalWasteAllTime = chartData.reduce((acc, curr) => acc + curr.totalWaste, 0);

  // Generate actionable insights
  const getInsights = () => {
    if (chartData.length === 0) {
      return "Nenhum dado de perdas registrado no momento. Cadastre produtos e registre descartes para gerar insights automáticos.";
    }
    const highestMonth = [...chartData].sort((a, b) => b.totalWaste - a.totalWaste)[0];
    return `O mês com maior projeção/registro de perdas é ${highestMonth.month} (Total de R$ ${highestMonth.totalWaste.toFixed(2)}). Recomendamos ajustar a produção antecipada em dias de menor movimento e intensificar promoções de queima de estoque 48h antes da validade.`;
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 text-[#E8571A] rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#2C2C2C]">Valor Total de Perdas por Mês</h2>
            <p className="text-xs text-gray-500">Análise gráfica de desperdício e vencimentos para tomada de decisão</p>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-orange-50 text-[#E8571A] border border-orange-200 rounded-xl text-xs font-bold">
          Total Acumulado: R$ {totalWasteAllTime.toFixed(2)}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <TrendingDown className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="font-bold text-sm">Sem dados suficientes para exibir o gráfico.</p>
          <p className="text-xs mt-1">Cadastre produtos com datas de validade e valores para visualizar o relatório mensal.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6B7280' }} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `R$ ${val}`}
                />
                <Tooltip 
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Valor de Perdas']}
                  contentStyle={{ backgroundColor: '#2C2C2C', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="totalWaste" fill="#E8571A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Actionable Insights Box */}
          <div className="p-4 bg-[#FAFAF8] border border-orange-200 rounded-2xl flex items-start space-x-3">
            <div className="p-2 bg-[#F5E6D3] text-[#E8571A] rounded-xl shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#2C2C2C]">Insights Acionáveis para o Gestor</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {getInsights()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
