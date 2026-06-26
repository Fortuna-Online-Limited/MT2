import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LangContext';
import type { Collection } from '../types';

export default function Collections() {
  const { lang, t } = useLang();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('mt_collections').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      setCollections(data ?? []);
      setLoading(false);
    });
  }, []);

  const fallbackImages = [
    'https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5650803/pexels-photo-5650803.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5650804/pexels-photo-5650804.jpeg?auto=compress&cs=tinysrgb&w=800',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-neutral-900">{t('Collections', '系列')}</h1>
        <p className="text-neutral-500 mt-2">{t('Explore our curated collections', '探索我們的精選系列')}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(4).fill(0).map((_, i) => <div key={i} className="aspect-[4/5] bg-neutral-200 rounded-2xl animate-pulse" />)}
        </div>
      ) : collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col, i) => (
            <Link key={col.id} to={`/collections/${col.slug}`} className="group relative rounded-2xl overflow-hidden bg-neutral-100 aspect-[4/5] block">
              <img
                src={col.image || fallbackImages[i % fallbackImages.length]}
                alt={lang === 'tc' ? col.name_tc : col.name_en}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-neutral-900/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2 className="text-xl font-bold text-white mb-1">{lang === 'tc' ? col.name_tc : col.name_en}</h2>
                {(lang === 'tc' ? col.description_tc : col.description_en) && (
                  <p className="text-white/70 text-sm line-clamp-2 mb-3">{lang === 'tc' ? col.description_tc : col.description_en}</p>
                )}
                <span className="inline-flex items-center gap-1.5 text-white text-sm font-medium group-hover:gap-2.5 transition-all">
                  {t('Shop Collection', '購物系列')} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-neutral-400">
          <p>{t('No collections yet', '尚無系列')}</p>
        </div>
      )}
    </div>
  );
}
