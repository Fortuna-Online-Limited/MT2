import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LangContext';
import ProductCard from '../components/ui/ProductCard';
import type { Product, Collection } from '../types';

export default function Products() {
  const { lang, t } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const q = searchParams.get('q') ?? '';
  const collectionFilter = searchParams.get('collection') ?? '';
  const sortBy = searchParams.get('sort') ?? 'created_at:desc';
  const maxPrice = parseInt(searchParams.get('max_price') ?? '99999');

  useEffect(() => {
    supabase.from('mt_collections').select('*').eq('is_active', true).order('sort_order').then(({ data }) => setCollections(data ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const [col, dir] = sortBy.split(':');
    let query = supabase
      .from('mt_products')
      .select('*, collection:mt_collections(*)')
      .eq('is_active', true)
      .lte('price', maxPrice)
      .order(col, { ascending: dir === 'asc' });

    if (q) {
      query = query.or(`name_en.ilike.%${q}%,name_tc.ilike.%${q}%,description_en.ilike.%${q}%`);
    }
    if (collectionFilter) {
      query = query.eq('collection_id', collectionFilter);
    }

    query.then(({ data }) => {
      setProducts((data as Product[]) ?? []);
      setLoading(false);
    });
  }, [q, collectionFilter, sortBy, maxPrice]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    setSearchParams(params);
  }

  const sortOptions = [
    { value: 'created_at:desc', label: t('Newest', '最新') },
    { value: 'price:asc', label: t('Price: Low to High', '價格：由低至高') },
    { value: 'price:desc', label: t('Price: High to Low', '價格：由高至低') },
    { value: 'name_en:asc', label: t('Name: A-Z', '名稱：A-Z') },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900">{q ? t(`Search: "${q}"`, `搜尋：「${q}」`) : t('All Products', '所有產品')}</h1>
        <p className="text-neutral-500 text-sm mt-1">{products.length} {t('products', '件產品')}</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-neutral-200">
        <button onClick={() => setFilterOpen(!filterOpen)} className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-full text-sm font-medium hover:border-neutral-400 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          {t('Filter', '篩選')}
        </button>

        {/* Collection filter chips */}
        {collections.map(col => (
          <button
            key={col.id}
            onClick={() => setParam('collection', collectionFilter === col.id ? '' : col.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${collectionFilter === col.id ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}
          >
            {lang === 'tc' ? col.name_tc : col.name_en}
          </button>
        ))}

        {q && (
          <button onClick={() => setParam('q', '')} className="flex items-center gap-1 px-3 py-1.5 bg-neutral-100 rounded-full text-xs font-medium text-neutral-600 hover:bg-neutral-200">
            {t('Clear search', '清除搜尋')} <X className="w-3 h-3" />
          </button>
        )}

        <div className="ml-auto">
          <select
            value={sortBy}
            onChange={e => setParam('sort', e.target.value)}
            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">{t('Max Price (MOP$)', '最高價格 (MOP$)')}</label>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={maxPrice > 5000 ? 5000 : maxPrice}
                onChange={e => setParam('max_price', e.target.value === '5000' ? '' : e.target.value)}
                className="w-full mt-2"
              />
              <p className="text-xs text-neutral-500 mt-1">MOP$0 – MOP${maxPrice > 4999 ? '5,000+' : maxPrice}</p>
            </div>
          </div>
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-neutral-200 rounded-xl mb-3" />
              <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-neutral-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <Filter className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">{t('No products found', '找不到產品')}</p>
          <button onClick={() => setSearchParams({})} className="mt-3 text-sm text-neutral-900 underline">{t('Clear filters', '清除篩選')}</button>
        </div>
      )}
    </div>
  );
}
