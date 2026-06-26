import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LangContext';
import type { Page } from '../types';


export default function About() {
  const { lang, t } = useLang();
  const [page, setPage] = useState<Page | null>(null);

  useEffect(() => {
    supabase.from('mt_pages').select('*').eq('slug', 'about').maybeSingle().then(({ data }) => setPage(data));
  }, []);

  const title = page ? (lang === 'tc' ? page.title_tc : page.title_en) : t('About Us', '關於我們');
  const content = page ? (lang === 'tc' ? page.content_tc : page.content_en) : '';

  function renderContent(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold text-neutral-900 mt-8 mb-4">{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-semibold text-neutral-900 mt-6 mb-3">{line.slice(3)}</h2>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-neutral-800 my-2">{line.slice(2, -2)}</p>;
      if (line.trim() === '') return <div key={i} className="h-3" />;
      return <p key={i} className="text-neutral-700 leading-relaxed">{line}</p>;
    });
  }

  return (
    <>
      {/* Hero */}
      <div className="relative h-64 sm:h-80 bg-neutral-900 overflow-hidden">
        <img src="https://images.pexels.com/photos/5650803/pexels-photo-5650803.jpeg?auto=compress&cs=tinysrgb&w=1280" alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl sm:text-5xl font-bold">{title}</h1>
            <p className="text-white/60 mt-2">{t('Our story, mission, and values', '我們的故事、使命和價值觀')}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {content && (
          <div className="prose prose-neutral max-w-none space-y-2 mb-16">
            {renderContent(content)}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 my-16 py-10 border-y border-neutral-200">
          {[
            { num: '10K+', label: t('Happy Customers', '滿意客戶') },
            { num: '500+', label: t('Products', '產品') },
            { num: '5+', label: t('Years in Business', '業務年限') },
          ].map(({ num, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-neutral-900">{num}</p>
              <p className="text-sm text-neutral-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
