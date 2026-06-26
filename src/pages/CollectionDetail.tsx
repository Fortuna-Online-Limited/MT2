import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LangContext';
import ProductCard from '../components/ui/ProductCard';
import type { Collection, Product } from '../types';

export default function CollectionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLang();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from('mt_collections').select('*').eq('slug', slug).maybeSingle().then(({ data }) => {
      setCollection(data);
      if (data) {
        supabase.from('mt_products').select('*, collection:mt_collections(*)').eq('collection_id', data.id).eq('is_active', true).then(({ data: prods }) => {
          setProducts((prods as Product[]) ?? []);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, [slug]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-pulse">
      <div className="h-48 bg-neutral-200 rounded-2xl mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => <div key={i} className="aspect-[3/4] bg-neutral-200 rounded-xl" />)}
      </div>
    </div>
  );

  if (!collection) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
      <p className="text-neutral-500">{t('Collection not found', '找不到系列')}</p>
      <Link to="/collections" className="mt-4 inline-block text-sm font-medium text-neutral-900 underline">{t('View all collections', '查看所有系列')}</Link>
    </div>
  );

  const name = lang === 'tc' ? collection.name_tc : collection.name_en;
  const description = lang === 'tc' ? collection.description_tc : collection.description_en;

  return (
    <>
      {/* Hero */}
      <div className="relative h-56 sm:h-72 overflow-hidden bg-neutral-900">
        {collection.image && (
          <img src={collection.image} alt={name} className="w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <nav className="flex justify-center items-center gap-2 text-xs text-white/60 mb-3">
              <Link to="/" className="hover:text-white">{t('Home', '首頁')}</Link>
              <span>/</span>
              <Link to="/collections" className="hover:text-white">{t('Collections', '系列')}</Link>
              <span>/</span>
              <span className="text-white">{name}</span>
            </nav>
            <h1 className="text-4xl font-bold">{name}</h1>
            {description && <p className="text-white/70 mt-2 max-w-md mx-auto text-sm">{description}</p>}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-sm text-neutral-500 mb-6">{products.length} {t('products', '件產品')}</p>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-neutral-400">
            <p>{t('No products in this collection yet', '此系列暫無產品')}</p>
          </div>
        )}
      </div>
    </>
  );
}
