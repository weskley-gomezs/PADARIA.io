import React, { useState } from 'react';
import { ARTICLES_DATA, CLUSTER_PAGES } from '../../data/seoData';
import { SeoHead } from './SeoHead';
import { Breadcrumbs } from './Breadcrumbs';
import { ConversionBanner } from './ConversionBanner';
import { BookOpen, Search, Clock, ArrowRight, Sparkles, Layers, ShieldCheck, FileCheck } from 'lucide-react';

interface ContentsHubViewProps {
  onNavigate: (path: string) => void;
  onOpenDemo?: () => void;
}

export const ContentsHubView: React.FC<ContentsHubViewProps> = ({
  onNavigate,
  onOpenDemo
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const articlesList = Object.values(ARTICLES_DATA);
  const clusterList = Object.values(CLUSTER_PAGES);

  const categories = ['Todos', 'Gestão de Estoque', 'Redução de Perdas', 'Controle de Validade', 'Divergências', 'Checklists Operacionais', 'Tecnologia'];

  const filteredArticles = articlesList.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.metaDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Todos' || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const hubSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'Centro de Conteúdos e Guias para Padarias | Padaria.io',
    'description': 'Guias práticos, artigos técnicos e checklists para gestão de estoque, controle de validade e redução de perdas em padarias e confeitarias.',
    'url': 'https://padaria.io/conteudos'
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 pt-20 pb-16">
      <SeoHead
        title="Centro de Conteúdos e Guias para Padarias | Padaria.io"
        description="Aprenda a controlar estoque de farinhas e frios, reduzir desperdício de fornadas, evitar multas sanitárias e zerar divergências na sua padaria."
        canonical="https://padaria.io/conteudos"
        schema={hubSchema}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { name: 'Início', url: 'https://padaria.io/' },
            { name: 'Conteúdos e Guias', url: 'https://padaria.io/conteudos' }
          ]}
          onNavigate={onNavigate}
        />

        {/* Hero Section */}
        <header className="mt-4 mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-[#FF6B00]/10 text-[#D85A00] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-[#FF6B00]/20">
            <BookOpen className="w-4 h-4" />
            <span>Biblioteca de Gestão de Panificação</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-gray-950 tracking-tight leading-tight mb-5 font-display">
            Guias Práticos e Estratégias para Padarias Lucrativas
          </h1>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Metodologias comprovadas para donos, gerentes e mestres padeiros reduzirem desperdícios, organizarem o estoque de perecíveis e blindarem o caixa.
          </p>

          {/* Search Box */}
          <div className="mt-8 relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por estoque, farinha, perdas, queijo, validade..."
              className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl border border-gray-300 shadow-xs focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00] text-gray-900 placeholder-gray-400 text-sm sm:text-base outline-hidden transition-all"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#FF6B00] text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {/* Pillars / Core Topic Clusters Fast Navigation */}
        <section className="mb-14 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
          <div className="flex items-center space-x-2 text-[#D85A00] font-bold text-xs uppercase tracking-wider mb-2">
            <Layers className="w-4 h-4" />
            <span>Pilares de Conhecimento</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-6">
            Páginas de Referência Temática
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {clusterList.slice(0, 4).map((cluster, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(`/${cluster.slug}`)}
                className="text-left p-4 rounded-2xl border border-gray-200 hover:border-[#FF6B00] hover:bg-orange-50/20 transition-all group bg-stone-50/50 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-extrabold text-[#D85A00] uppercase tracking-wider block mb-1">
                    {cluster.categoryName}
                  </span>
                  <h3 className="font-bold text-gray-900 group-hover:text-[#FF6B00] transition-colors text-sm leading-snug">
                    {cluster.title.split('|')[0]}
                  </h3>
                </div>
                <div className="mt-3 inline-flex items-center space-x-1 text-xs font-bold text-[#FF6B00]">
                  <span>Acessar pilar</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Articles Grid */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-gray-950 tracking-tight">
              Artigos e Manuais Práticos ({filteredArticles.length})
            </h2>
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}
                className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-200">
              <p className="text-gray-500 font-medium">Nenhum artigo encontrado para a sua busca.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}
                className="mt-3 text-sm font-bold text-[#FF6B00] cursor-pointer"
              >
                Ver todos os artigos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article, idx) => (
                <article
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs hover:border-[#FF6B00] hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                  onClick={() => onNavigate(`/conteudos/${article.slug}`)}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="bg-[#FF6B00]/10 text-[#D85A00] px-2.5 py-0.5 rounded-full font-bold">
                        {article.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readTime}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#FF6B00] transition-colors leading-snug mb-3 font-display">
                      {article.h1}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4">
                      {article.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">
                      Por {article.author.split(' ')[0]}
                    </span>
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#FF6B00] group-hover:translate-x-1 transition-transform">
                      <span>Ler guia</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Conversion Banner */}
        <ConversionBanner
          onOpenDemo={onOpenDemo}
          title="Leve o método do Padaria.io para a sua operação"
          subtitle="Pare de perder dinheiro com insumos vencidos e quebras não auditadas. Agende uma apresentação personalizada."
          contextTag="Demonstração Gratuita"
        />
      </div>
    </div>
  );
};
