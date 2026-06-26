import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Heart, Share2, ChevronLeft, ChevronRight, Truck, RefreshCw, Shield, Star, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LangContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ui/ProductCard';
import type { Product } from '../types';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLang();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('mt_products')
      .select('*, collection:mt_collections(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        setProduct(data as Product);
        setLoading(false);
        if (data?.collection_id) {
          supabase.from('mt_products').select('*, collection:mt_collections(*)').eq('collection_id', data.collection_id).eq('is_active', true).neq('id', data.id).limit(4).then(({ data: rel }) => setRelated((rel as Product[]) ?? []));
        }
      });
  }, [slug]);

  async function handleAddToCart() {
    if (!product) return;
    setAdding(true);
    await addItem(product.id, qty);
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-square bg-neutral-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-3/4" />
          <div className="h-6 bg-neutral-200 rounded w-1/4" />
          <div className="h-4 bg-neutral-200 rounded" />
          <div className="h-4 bg-neutral-200 rounded w-5/6" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
      <p className="text-neutral-500">{t('Product not found', '找不到產品')}</p>
      <Link to="/products" className="mt-4 inline-block text-sm font-medium text-neutral-900 underline">{t('Back to products', '返回產品頁')}</Link>
    </div>
  );

  const name = lang === 'tc' ? product.name_tc : product.name_en;
  const description = lang === 'tc' ? product.description_tc : product.description_en;
  const images = product.images?.length > 0 ? product.images : ['https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg?auto=compress&cs=tinysrgb&w=800'];
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.compare_price!) * 100) : 0;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
          <Link to="/" className="hover:text-neutral-600">{t('Home', '首頁')}</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-neutral-600">{t('Products', '產品')}</Link>
          {product.collection && (
            <>
              <span>/</span>
              <Link to={`/collections/${product.collection.slug}`} className="hover:text-neutral-600">
                {lang === 'tc' ? product.collection.name_tc : product.collection.name_en}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-neutral-700 truncate max-w-xs">{name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 group">
              <img
                src={images[imgIdx]}
                alt={name}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-white">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-white">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {hasDiscount && (
                <div className="absolute top-3 left-3 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                  -{discountPct}%
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-neutral-900' : 'border-transparent hover:border-neutral-300'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {product.collection && (
              <Link to={`/collections/${product.collection.slug}`} className="text-xs font-semibold text-neutral-500 uppercase tracking-wider hover:text-neutral-700 mb-2">
                {lang === 'tc' ? product.collection.name_tc : product.collection.name_en}
              </Link>
            )}
            <h1 className="text-3xl font-bold text-neutral-900 mb-3">{name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-2xl font-bold text-neutral-900">MOP${product.price.toFixed(0)}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-neutral-400 line-through">MOP${product.compare_price!.toFixed(0)}</span>
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 text-sm font-medium rounded">-{discountPct}%</span>
                </>
              )}
            </div>

            {/* Rating placeholder */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">{Array(5).fill(0).map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}</div>
              <span className="text-sm text-neutral-500">(24 {t('reviews', '評價')})</span>
            </div>

            {/* Description */}
            {description && <p className="text-neutral-600 text-sm leading-relaxed mb-6">{description}</p>}

            {/* SKU */}
            {product.sku && <p className="text-xs text-neutral-400 mb-4">{t('SKU', 'SKU')}: {product.sku}</p>}

            {/* Stock */}
            <div className={`flex items-center gap-2 text-sm mb-6 ${product.inventory_qty > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              <Package className="w-4 h-4" />
              {product.inventory_qty > 10 ? t('In Stock', '有貨') : product.inventory_qty > 0 ? t(`Only ${product.inventory_qty} left`, `僅剩${product.inventory_qty}件`) : t('Out of Stock', '售罄')}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-neutral-700">{t('Quantity', '數量')}</span>
              <div className="flex items-center border border-neutral-200 rounded-lg">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 rounded-l-lg transition-colors">-</button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.inventory_qty || 99, q + 1))} className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 rounded-r-lg transition-colors">+</button>
              </div>
            </div>

            {/* Add to cart */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={adding || product.inventory_qty === 0}
                className="flex-1 py-3.5 bg-neutral-900 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                <ShoppingBag className="w-5 h-5" />
                {added ? t('Added to Cart!', '已加入購物車！') : adding ? t('Adding...', '加入中...') : product.inventory_qty === 0 ? t('Out of Stock', '售罄') : t('Add to Cart', '加入購物車')}
              </button>
              <button className="w-12 h-12 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-600 hover:border-neutral-400 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-600 hover:border-neutral-400 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Trust badges */}
            <div className="border-t border-neutral-100 pt-5 space-y-3">
              {[
                { icon: Truck, text: t('Free shipping on orders over MOP$400', '訂單滿MOP$400免運費') },
                { icon: RefreshCw, text: t('30-day hassle-free returns', '30天輕鬆退換') },
                { icon: Shield, text: t('100% authentic guarantee', '100%正品保證') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-neutral-600">
                  <Icon className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-neutral-100">
                {product.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="py-16 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-8">{t('You May Also Like', '您可能也喜歡')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
