import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Truck, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LangContext';
import ProductCard from '../components/ui/ProductCard';
import type { Product, Collection } from '../types';

export default function Home() {
  const { lang, t } = useLang();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');

  useEffect(() => {
    supabase.from('mt_products').select('*, collection:mt_collections(*)').eq('is_active', true).eq('is_featured', true).limit(8).then(({ data }) => setProducts((data as Product[]) ?? []));
    supabase.from('mt_collections').select('*').eq('is_active', true).order('sort_order').limit(4).then(({ data }) => setCollections(data ?? []));
    supabase.from('mt_site_settings').select('key, value_en, value_tc').in('key', ['hero_title', 'hero_subtitle']).then(({ data }) => {
      const map: Record<string, { en: string; tc: string }> = {};
      (data ?? []).forEach(s => { map[s.key] = { en: s.value_en, tc: s.value_tc }; });
      setHeroTitle(lang === 'tc' ? (map.hero_title?.tc || '') : (map.hero_title?.en || ''));
      setHeroSubtitle(lang === 'tc' ? (map.hero_subtitle?.tc || '') : (map.hero_subtitle?.en || ''));
    });
  }, [lang]);

  const features = [
    { icon: Truck, label: t('Free Shipping', '免費運送'), desc: t('On orders over MOP$400', '訂單滿MOP$400') },
    { icon: RefreshCw, label: t('30-Day Returns', '30天退換'), desc: t('Hassle-free returns', '輕鬆退換') },
    { icon: Shield, label: t('Secure Payment', '安全付款'), desc: t('SSL encrypted checkout', 'SSL加密結帳') },
    { icon: Star, label: t('Premium Quality', '優質品質'), desc: t('Curated & quality-tested', '精選及品質測試') },
  ];

  const collectionImages = ['/Shampoo.jpg', '/Hairline_Pen.webp'];

  return (
    <>
      {/* Hero */}
      <section className="relative h-[80vh] min-h-[560px] flex items-center overflow-hidden bg-[#c4b47a]">
        <div className="absolute inset-0">
          <img
            src="/3804268972957164528 copy copy.webp"
            alt="MODAMODA Hero"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#6b5c30]/60 via-[#6b5c30]/10 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="max-w-lg">
            <span className="inline-block px-3 py-1 bg-black/20 backdrop-blur-sm border border-white/30 text-white text-xs font-medium rounded-full mb-4 tracking-wider uppercase">
              {t('ALL-IN-ONE Gray Hair Care', '全效灰髮護理')}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 drop-shadow-lg">
              {heroTitle || t('MODAMODA', 'MODAMODA')}
            </h1>
            <p className="text-lg text-white/90 mb-8 leading-relaxed drop-shadow">
              {heroSubtitle || t('Upgraded formula — PH 5.5 mild acidity for healthy, vibrant hair', '升級配方 — PH 5.5弱酸性，呵護秀髮健康亮澤')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products" className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-colors flex items-center gap-2">
                {t('Shop Now', '立即購物')} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/collections" className="px-6 py-3 bg-white/15 backdrop-blur-sm border border-white/40 text-white font-semibold rounded-full hover:bg-white/25 transition-colors">
                {t('View Collections', '查看系列')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features bar */}
      <section className="bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{label}</p>
                  <p className="text-xs text-neutral-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collections grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t('Shop by Collection', '按系列購物')}</h2>
            <p className="text-neutral-500 mt-1 text-sm">{t('Explore our curated collections', '探索我們的精選系列')}</p>
          </div>
          <Link to="/collections" className="text-sm font-medium text-neutral-900 flex items-center gap-1 hover:gap-2 transition-all">
            {t('View all', '查看全部')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(collections.length > 0 ? collections : Array(4).fill(null)).map((col, i) => (
            <Link
              key={col?.id ?? i}
              to={col ? `/collections/${col.slug}` : '/collections'}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-neutral-100"
            >
              <img
                src={col?.image || collectionImages[i % collectionImages.length]}
                alt={col ? (lang === 'tc' ? col.name_tc : col.name_en) : ''}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-sm">
                  {col ? (lang === 'tc' ? col.name_tc : col.name_en) : t('Collection', '系列')}
                </h3>
                <p className="text-white/60 text-xs mt-0.5">{t('Shop Now', '立即購物')}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="py-12 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t('Featured Products', '精選產品')}</h2>
              <p className="text-neutral-500 mt-1 text-sm">{t('Handpicked for you', '為您精心挑選')}</p>
            </div>
            <Link to="/products" className="text-sm font-medium text-neutral-900 flex items-center gap-1 hover:gap-2 transition-all">
              {t('View all', '查看全部')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-20 text-neutral-400">
              <p className="text-sm">{t('Products coming soon', '產品即將上架')}</p>
              <Link to="/admin/products" className="mt-2 text-xs text-neutral-500 underline">{t('Add products in admin', '在後台添加產品')}</Link>
            </div>
          )}
        </div>
      </section>

      {/* Banner */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl overflow-hidden">
          <img
            src="/3804268972957164528.webp"
            alt="Banner"
            className="w-full h-80 object-cover object-center"
          />
          <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center">
            <div className="text-center text-white px-6">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">{t('Up to 30% Off', '高達7折優惠')}</h2>
              <p className="text-white/80 mb-6">{t('Shop our sale collection today', '立即選購特賣系列')}</p>
              <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-neutral-900 font-semibold rounded-full hover:bg-neutral-100 transition-colors">
                {t('Shop Now', '立即購物')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-10">{t('What Our Customers Say', '客戶評價')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah L.', review: t('Absolutely love the quality! Will definitely order again.', '產品質量非常好！絕對會再次訂購。'), rating: 5 },
              { name: 'Michael C.', review: t('Fast shipping and beautiful packaging. The product exceeded my expectations.', '運送快速，包裝精美。產品超出我的預期。'), rating: 5 },
              { name: 'Amy T.', review: t('Great customer service and premium quality products. Highly recommend!', '出色的客戶服務和優質產品。強烈推薦！'), rating: 5 },
            ].map(({ name, review, rating }) => (
              <div key={name} className="bg-white rounded-2xl p-6 border border-neutral-100">
                <div className="flex mb-3">
                  {Array(rating).fill(0).map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed mb-4">"{review}"</p>
                <p className="text-sm font-semibold text-neutral-900">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
