import React, { useState } from 'react';
import { SeoPageData } from '../../data/seoData';
import { SeoHead } from './SeoHead';
import { Breadcrumbs } from './Breadcrumbs';
import { ConversionBanner } from './ConversionBanner';
import { CheckCircle, HelpCircle, ChevronDown, ChevronUp, ArrowRight, Layers, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';

interface ClusterPageViewProps {
  data: SeoPageData;
  onNavigate: (path: string) => void;
  onOpenDemo?: () => void;
}

export const ClusterPageView: React.FC<ClusterPageViewProps> = ({
  data,
  onNavigate,
  onOpenDemo
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Generate FAQPage JSON-LD schema
  const faqSchema = data.faqs ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': data.faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  } : null;

  // Breadcrumb JSON-LD schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': data.breadcrumbs.map((item, idx) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'name': item.name,
      'item': item.url
    }))
  };

  // SoftwareApplication JSON-LD schema
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Padariaio',
    'operatingSystem': 'Web, Android, iOS, Windows, macOS',
    'applicationCategory': 'BusinessApplication',
    'description': data.metaDescription,
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'BRL'
    }
  };

  const fullSchema = [breadcrumbSchema, softwareSchema, ...(faqSchema ? [faqSchema] : [])];

  return (
    <article className="min-h-screen bg-[#FDFBF7] text-gray-900 pt-20 pb-16">
      <SeoHead
        title={data.title}
        description={data.metaDescription}
        canonical={data.url}
        schema={fullSchema}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={data.breadcrumbs} onNavigate={onNavigate} />

        {/* Page Header */}
        <header className="mt-4 mb-10">
          <div className="inline-flex items-center space-x-2 bg-[#FF6B00]/10 text-[#D85A00] px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-[#FF6B00]/20">
            <Layers className="w-3.5 h-3.5" />
            <span>{data.categoryName}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-gray-950 tracking-tight leading-tight mb-6 font-display">
            {data.h1}
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed font-normal max-w-4xl">
            {data.subtitle}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500">
            <span className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Conteúdo Auditado por Especialistas em Panificação
            </span>
            <span className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-xs">
              <Sparkles className="w-4 h-4 text-[#FF6B00]" />
              Atualizado para a Legislação Sanitária 2026
            </span>
          </div>
        </header>

        {/* Main Content Sections */}
        <main className="space-y-12">
          {data.contentSections.map((section, idx) => (
            <section
              key={idx}
              className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-xs transition-all hover:border-gray-300"
            >
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-5 tracking-tight">
                {section.title}
              </h2>

              <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6">
                {section.text}
              </p>

              {section.points && section.points.length > 0 && (
                <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-100/80 mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900 mb-3">
                    Principais Pontos de Atenção:
                  </h3>
                  <ul className="space-y-3">
                    {section.points.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start space-x-3 text-gray-800 text-sm sm:text-base">
                        <CheckCircle className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
                        <span className="leading-snug">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {section.table && (
                <div className="overflow-x-auto my-6 rounded-2xl border border-gray-200 shadow-xs">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {section.table.headers.map((header, hIdx) => (
                          <th key={hIdx} className="px-5 py-3.5 font-bold text-gray-900">
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

              {section.highlight && (
                <div className="border-l-4 border-[#FF6B00] bg-orange-50/60 p-5 rounded-r-2xl my-6 text-gray-900 font-medium leading-relaxed text-sm sm:text-base">
                  <span className="font-bold text-[#D85A00] block mb-1">Impacto Prático:</span>
                  {section.highlight}
                </div>
              )}
            </section>
          ))}

          {/* Conversion Banner Section */}
          <ConversionBanner
            onOpenDemo={onOpenDemo}
            title="Pronto para acabar com as perdas e divergências na sua padaria?"
            subtitle="Veja como o Padariaio automatiza o controle de estoque, validades e registro fotográfico de quebras na rotina real da sua loja."
            contextTag="Demonstração Gratuita"
          />

          {/* FAQ Accordion Section */}
          {data.faqs && data.faqs.length > 0 && (
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-xs">
              <div className="flex items-center space-x-2 text-[#D85A00] mb-2 font-bold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Tire Suas Dúvidas</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">
                Perguntas Frequentes sobre {data.categoryName}
              </h2>

              <div className="space-y-4">
                {data.faqs.map((faq, fIdx) => {
                  const isOpen = openFaqIndex === fIdx;
                  return (
                    <div
                      key={fIdx}
                      className="border border-gray-200 rounded-2xl overflow-hidden transition-colors"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : fIdx)}
                        className="w-full flex items-center justify-between p-5 text-left font-bold text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-base sm:text-lg"
                        aria-expanded={isOpen}
                      >
                        <span className="pr-4">{faq.question}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-[#FF6B00] shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="p-5 pt-0 text-gray-700 text-sm sm:text-base leading-relaxed border-t border-gray-100 bg-gray-50/50">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Related Topic Clusters and Interlinking */}
          {data.relatedPages && data.relatedPages.length > 0 && (
            <section className="bg-stone-50 rounded-3xl p-6 sm:p-10 border border-stone-200">
              <div className="flex items-center space-x-2 text-stone-600 mb-2 font-bold text-xs uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>Aprofunde seus Conhecimentos</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
                Tópicos Relacionados de Gestão de Panificação
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {data.relatedPages.map((page, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => onNavigate(`/${page.slug}`)}
                    className="flex flex-col justify-between text-left bg-white p-6 rounded-2xl border border-gray-200 hover:border-[#FF6B00] hover:shadow-md transition-all group cursor-pointer"
                  >
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-[#FF6B00] transition-colors mb-2 text-base">
                        {page.title}
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed mb-4">
                        {page.desc}
                      </p>
                    </div>
                    <div className="inline-flex items-center space-x-1 text-xs font-bold text-[#FF6B00] group-hover:translate-x-1 transition-transform">
                      <span>Ler guia completo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={() => onNavigate('/conteudos')}
                  className="inline-flex items-center space-x-2 text-sm font-bold text-gray-800 hover:text-[#FF6B00] transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#FF6B00]" />
                  <span>Ver todos os artigos e checklists no Centro de Conteúdos</span>
                </button>

                <button
                  onClick={() => onNavigate('/')}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                  ← Voltar para a Página Inicial
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </article>
  );
};
