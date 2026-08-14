import React, { useState } from 'react';
import { ArticleData } from '../../data/seoData';
import { SeoHead } from './SeoHead';
import { Breadcrumbs } from './Breadcrumbs';
import { ConversionBanner } from './ConversionBanner';
import { Calendar, Clock, UserCheck, CheckCircle2, HelpCircle, ChevronDown, ChevronUp, ArrowRight, Share2, Sparkles, BookOpen } from 'lucide-react';

interface ArticlePageViewProps {
  article: ArticleData;
  onNavigate: (path: string) => void;
  onOpenDemo?: () => void;
}

export const ArticlePageView: React.FC<ArticlePageViewProps> = ({
  article,
  onNavigate,
  onOpenDemo
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  // Article Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': article.h1,
    'description': article.metaDescription,
    'author': {
      '@type': 'Organization',
      'name': 'Padariaio',
      'url': 'https://padariaio.com.br'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Padariaio',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://i.imgur.com/HSJoe7l.png'
      }
    },
    'datePublished': article.datePublished,
    'dateModified': article.dateModified,
    'mainEntityOfPage': article.url
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': article.breadcrumbs.map((item, idx) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'name': item.name,
      'item': item.url
    }))
  };

  // FAQ Schema
  const faqSchema = article.faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': article.faq.map(f => ({
      '@type': 'Question',
      'name': f.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': f.answer
      }
    }))
  } : null;

  const fullSchema = [breadcrumbSchema, articleSchema, ...(faqSchema ? [faqSchema] : [])];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.metaDescription,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <article className="min-h-screen bg-[#FDFBF7] text-gray-900 pt-20 pb-16">
      <SeoHead
        title={article.title}
        description={article.metaDescription}
        canonical={article.url}
        ogType="article"
        schema={fullSchema}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={article.breadcrumbs} onNavigate={onNavigate} />

        {/* Article Header */}
        <header className="mt-4 mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-[#FF6B00]/10 text-[#D85A00] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-[#FF6B00]/20">
              {article.category}
            </span>
            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.readTime}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 tracking-tight leading-tight mb-5 font-display">
            {article.h1}
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed font-normal mb-6">
            {article.subtitle}
          </p>

          {/* Author & Date Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-gray-200/80 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00] font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{article.author}</p>
                <p className="text-gray-500 text-xs">{article.authorRole}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Atualizado em {new Date(article.dateModified).toLocaleDateString('pt-BR')}</span>
              </div>

              <button
                onClick={handleShare}
                className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer text-xs font-medium"
                title="Compartilhar artigo"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? 'Link Copiado!' : 'Compartilhar'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Article Summary Box */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 sm:p-7 mb-10 text-gray-900 shadow-xs">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-[#FF6B00]" />
            <span>Resumo Executivo</span>
          </div>
          <p className="text-base sm:text-lg text-gray-800 leading-relaxed font-medium">
            {article.summary}
          </p>
        </div>

        {/* Article Body Content */}
        <main className="bg-white rounded-3xl p-6 sm:p-12 border border-gray-200/80 shadow-xs space-y-10">
          {article.sections.map((section, idx) => (
            <section key={idx} className="space-y-4">
              {section.level === 'h2' ? (
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight pt-2 border-t border-gray-100 first:border-0 first:pt-0">
                  {section.heading}
                </h2>
              ) : (
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {section.heading}
                </h3>
              )}

              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                {section.text}
              </p>

              {section.list && section.list.length > 0 && (
                <ul className="space-y-2.5 my-4 bg-gray-50/80 p-5 sm:p-6 rounded-2xl border border-gray-100">
                  {section.list.map((item, lIdx) => (
                    <li key={lIdx} className="flex items-start space-x-3 text-sm sm:text-base text-gray-800">
                      <CheckCircle2 className="w-4 h-4 text-[#FF6B00] shrink-0 mt-1" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.table && (
                <div className="overflow-x-auto my-6 rounded-2xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {section.table.headers.map((header, hIdx) => (
                          <th key={hIdx} className="px-5 py-3 font-bold text-gray-900">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {section.table.rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-5 py-3.5 text-gray-700 leading-relaxed">
                              {cIdx === 0 ? <strong className="text-gray-950 font-semibold">{cell}</strong> : cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {section.callout && (
                <div className="border-l-4 border-[#FF6B00] bg-orange-50/60 p-5 rounded-r-2xl text-gray-900 font-medium leading-relaxed text-sm sm:text-base">
                  {section.callout}
                </div>
              )}
            </section>
          ))}

          {/* Internal FAQ */}
          {article.faq && article.faq.length > 0 && (
            <div className="pt-8 border-t border-gray-200 space-y-4">
              <div className="flex items-center space-x-2 text-[#D85A00] font-bold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Dúvidas Frequentes</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-950">
                Perguntas Frequentes sobre este Artigo
              </h2>

              <div className="space-y-3">
                {article.faq.map((faq, fIdx) => {
                  const isOpen = openFaqIndex === fIdx;
                  return (
                    <div key={fIdx} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : fIdx)}
                        className="w-full flex items-center justify-between p-4 text-left font-bold text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-sm sm:text-base"
                      >
                        <span className="pr-4">{faq.question}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#FF6B00] shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="p-4 pt-0 text-gray-700 text-sm leading-relaxed bg-gray-50/50 border-t border-gray-100">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Conversion Banner Section */}
        <ConversionBanner
          onOpenDemo={onOpenDemo}
          title="Coloque este método em prática na sua padaria com o Padariaio"
          subtitle="Controle estoque, validade, perdas e divergências pelo celular ou computador em minutos."
          contextTag="Aplicação Prática"
        />

        {/* Related Articles & Cluster Navigation */}
        {article.relatedArticles && article.relatedArticles.length > 0 && (
          <footer className="mt-10 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
            <div className="flex items-center space-x-2 text-[#FF6B00] mb-2 font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Continue Lendo</span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
              Artigos Recomendados para Gestores de Padaria
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {article.relatedArticles.map((rel, rIdx) => (
                <button
                  key={rIdx}
                  onClick={() => onNavigate(`/conteudos/${rel.slug}`)}
                  className="flex flex-col justify-between text-left p-5 rounded-2xl border border-gray-200 hover:border-[#FF6B00] hover:shadow-sm transition-all group bg-stone-50/50 cursor-pointer"
                >
                  <div>
                    <span className="text-[11px] font-bold text-[#D85A00] uppercase tracking-wider block mb-1">
                      {rel.category}
                    </span>
                    <h3 className="font-bold text-gray-900 group-hover:text-[#FF6B00] transition-colors text-sm sm:text-base leading-snug">
                      {rel.title}
                    </h3>
                  </div>
                  <div className="mt-4 inline-flex items-center space-x-1 text-xs font-bold text-[#FF6B00] group-hover:translate-x-1 transition-transform">
                    <span>Ler artigo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => onNavigate('/conteudos')}
                className="text-sm font-bold text-gray-800 hover:text-[#FF6B00] transition-colors cursor-pointer"
              >
                ← Ver todos os artigos no Centro de Conteúdos
              </button>

              <button
                onClick={() => onNavigate('/')}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 cursor-pointer"
              >
                Início
              </button>
            </div>
          </footer>
        )}
      </div>
    </article>
  );
};
