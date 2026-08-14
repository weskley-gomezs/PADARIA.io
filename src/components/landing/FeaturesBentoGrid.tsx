import React from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  ChefHat,
  Trash2,
  BarChart3,
  FileText,
  Layers,
  Users,
  CheckCircle2,
  ShieldCheck,
  Camera,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { PadeIATypingCard } from './PadeIATypingCard';

export const FeaturesBentoGrid: React.FC = () => {
  return (
    <section id="funcionalidades" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-3xl border border-gray-200/80 my-10 shadow-xs">
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto mb-16">
        <span className="text-xs font-black text-[#FF6B00] uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-200/80">
          RECURSOS COMPLETOS
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0B0F17] tracking-tight">
          Tudo o que sua padaria precisa em uma só plataforma
        </h2>
        <p className="text-sm sm:text-base text-gray-600 font-medium">
          Funcionalidades desenvolvidas exclusivamente para a rotina intensa de panificação, confeitaria e rotisseria.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. FEATURED HERO CARD (Occupies 2 columns on desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="md:col-span-2 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 p-6 sm:p-8 rounded-3xl border border-orange-200/80 shadow-xs hover:border-[#FF6B00] transition-all space-y-6 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-[#FF6B00] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-orange-200">
                DESTAQUE OPERACIONAL
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-gray-900">
              Controle de Validade Preventivo em Tempo Real
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed max-w-2xl">
              Esqueça checagens manuais no fim do dia. O Padaria.io monitora datas de vencimento de insumos e produtos finalizados, gerando relatórios automáticos e alertas visuais no sistema por nível de urgência.
            </p>

            <ul className="grid sm:grid-cols-2 gap-2.5 pt-2 text-xs font-bold text-gray-700">
              <li className="flex items-center space-x-2 bg-white/80 p-2.5 rounded-xl border border-orange-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Alertas preventivos de 1 a 7 dias antes</span>
              </li>
              <li className="flex items-center space-x-2 bg-white/80 p-2.5 rounded-xl border border-orange-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Impressão de etiquetas de lote com QR Code</span>
              </li>
              <li className="flex items-center space-x-2 bg-white/80 p-2.5 rounded-xl border border-orange-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Gestão de exposição prioritária de balcão</span>
              </li>
              <li className="flex items-center space-x-2 bg-white/80 p-2.5 rounded-xl border border-orange-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Histórico auditável para Vigilância Sanitária</span>
              </li>
            </ul>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#FF6B00]">
            <span>Redução comprovada de até 80% em perdas de validade</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.div>

        {/* 2. PADEIA DARK CARD (1 column or spans cleanly) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="md:col-span-1"
        >
          <PadeIATypingCard />
        </motion.div>

        {/* 3. Gestão de Produção */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#FAFAF8] p-6 rounded-2xl border border-gray-200/90 shadow-2xs hover:border-[#FF6B00] transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <ChefHat className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-gray-900">Gestão de Produção & Fornadas</h3>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Programação diária de fornadas de pão francês, salgados e doces com sugestões de quantidade por horário de maior movimento.
          </p>
        </motion.div>

        {/* 4. Controle de Desperdícios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-[#FAFAF8] p-6 rounded-2xl border border-gray-200/90 shadow-2xs hover:border-[#FF6B00] transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-gray-900">Auditoria & Baixas por Foto</h3>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Sua equipe fotografa o produto descartado e registra o motivo exato. Transparência total sobre onde ocorrem as quebras.
          </p>
        </motion.div>

        {/* 5. Dashboard Gerencial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#FAFAF8] p-6 rounded-2xl border border-gray-200/90 shadow-2xs hover:border-[#FF6B00] transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-gray-900">Dashboard & Métricas em Tempo Real</h3>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Gráficos simples do total em R$ de perdas, taxa de aproveitamento do estoque e comparativo mensal do CMV.
          </p>
        </motion.div>

        {/* 6. Relatórios & Exportação */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="bg-[#FAFAF8] p-6 rounded-2xl border border-gray-200/90 shadow-2xs hover:border-[#FF6B00] transition-all space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-gray-900">Relatórios Prontos para Impressão</h3>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Gere PDFs e relatórios formatados para contabilidade, diretoria ou auditorias da fiscalização sanitária em poucos cliques.
          </p>
        </motion.div>

        {/* 7. Cadastros & Perfis de Usuário */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#FAFAF8] p-6 rounded-2xl border border-gray-200/90 shadow-2xs hover:border-[#FF6B00] transition-all space-y-3 md:col-span-2"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Controle de Acessos & Múltiplos Setores</h3>
              <p className="text-xs text-gray-500">Padronização entre Gerência, Balcão e Cozinha de Produção</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Perfis customizados para operadores de balcão, padeiros e gerentes. Defina quem pode registrar baixas, alterar fichas técnicas ou visualizar relatórios financeiros sensíveis.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
