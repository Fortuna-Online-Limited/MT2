import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LangContext';
import type { FaqItem } from '../types';

export default function FAQ() {
  const { lang, t } = useLang();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    supabase.from('mt_faq_items').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      setItems(data ?? []);
      setLoading(false);
    });
  }, []);

  const categories = Array.from(new Set(items.map(i => i.category)));
  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    const question = lang === 'tc' ? item.question_tc : item.question_en;
    const answer = lang === 'tc' ? item.answer_tc : item.answer_en;
    const matchesSearch = !q || question.toLowerCase().includes(q) || answer.toLowerCase().includes(q);
    const matchesCat = !category || item.category === category;
    return matchesSearch && matchesCat;
  });

  const grouped = categories.reduce((acc, cat) => {
    const catItems = filtered.filter(i => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, FaqItem[]>);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-neutral-900">{t('Frequently Asked Questions', '常見問題')}</h1>
        <p className="text-neutral-500 mt-2">{t("Can't find the answer? Contact us directly.", '找不到答案？直接聯絡我們。')}</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('Search questions...', '搜尋問題...')}
          className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
        />
      </div>

      {/* Category tabs */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setCategory('')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${!category ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}>
            {t('All', '全部')}
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat === category ? '' : cat)} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${category === cat ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-14 bg-neutral-200 animate-pulse rounded-xl" />)}
        </div>
      ) : Object.keys(grouped).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              {categories.length > 1 && (
                <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">{cat}</h2>
              )}
              <div className="space-y-2">
                {catItems.map(item => {
                  const question = lang === 'tc' ? item.question_tc : item.question_en;
                  const answer = lang === 'tc' ? item.answer_tc : item.answer_en;
                  const isOpen = openId === item.id;
                  return (
                    <div key={item.id} className={`border rounded-xl overflow-hidden transition-all ${isOpen ? 'border-neutral-300 shadow-sm' : 'border-neutral-200 hover:border-neutral-300'}`}>
                      <button
                        onClick={() => setOpenId(isOpen ? null : item.id)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left"
                      >
                        <span className="font-medium text-neutral-900 text-sm pr-4">{question}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-neutral-500 flex-shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-0">
                          <p className="text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-4">{answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-neutral-400">
          <p>{t('No results found', '找不到結果')}</p>
        </div>
      )}

      {/* Contact CTA */}
      <div className="mt-12 p-6 bg-neutral-50 rounded-2xl border border-neutral-200 text-center">
        <h3 className="font-bold text-neutral-900 mb-1">{t('Still have questions?', '仍有疑問？')}</h3>
        <p className="text-sm text-neutral-500 mb-4">{t("We're here to help you.", '我們隨時為您提供幫助。')}</p>
        <a href="/contact" className="inline-block px-6 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-full hover:bg-neutral-800 transition-colors">
          {t('Contact Us', '聯絡我們')}
        </a>
      </div>
    </div>
  );
}
