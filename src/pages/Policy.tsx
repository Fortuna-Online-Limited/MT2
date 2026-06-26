import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LangContext';
import type { Page } from '../types';

export default function Policy() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLang();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from('mt_pages').select('*').eq('slug', slug).maybeSingle().then(({ data }) => {
      setPage(data);
      setLoading(false);
    });
  }, [slug]);

  const policyLinks = [
    { slug: 'privacy-policy', label: t('Privacy Policy', '私隱政策') },
    { slug: 'terms-of-service', label: t('Terms of Service', '服務條款') },
    { slug: 'shipping-policy', label: t('Shipping Policy', '運送政策') },
  ];

  function renderContent(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold text-neutral-900 mt-8 mb-4">{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold text-neutral-900 mt-6 mb-3">{line.slice(3)}</h2>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-neutral-800 my-2">{line.slice(2, -2)}</p>;
      if (line.trim() === '') return <div key={i} className="h-2.5" />;
      return <p key={i} className="text-neutral-600 leading-relaxed">{line}</p>;
    });
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-pulse space-y-4">
      <div className="h-8 bg-neutral-200 rounded w-1/2" />
      {Array(8).fill(0).map((_, i) => <div key={i} className="h-4 bg-neutral-200 rounded" />)}
    </div>
  );

  if (!page) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
      <p className="text-neutral-500">{t('Page not found', '找不到頁面')}</p>
    </div>
  );

  const title = lang === 'tc' ? page.title_tc : page.title_en;
  const content = lang === 'tc' ? page.content_tc : page.content_en;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <nav className="sticky top-24 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">{t('Policies', '政策')}</p>
            {policyLinks.map(link => (
              <Link
                key={link.slug}
                to={`/policy/${link.slug}`}
                className={`block px-4 py-2.5 rounded-xl text-sm transition-colors ${slug === link.slug ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="prose prose-neutral max-w-none space-y-1.5">
            {renderContent(content || '')}
          </div>
          <div className="mt-10 pt-6 border-t border-neutral-200 text-xs text-neutral-400">
            {t('Last updated', '最後更新')}: {new Date(page.updated_at).toLocaleDateString(lang === 'tc' ? 'zh-HK' : 'en-HK', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
}
