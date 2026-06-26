import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLang } from '../../context/LangContext';
import type { Product } from '../../types';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const { lang, t } = useLang();
  const [adding, setAdding] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const name = lang === 'tc' ? product.name_tc : product.name_en;
  const image = product.images?.[imgIdx] || 'https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg?auto=compress&cs=tinysrgb&w=600';
  const hoverImage = product.images?.[1];
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.compare_price!) * 100) : 0;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    await addItem(product.id);
    setTimeout(() => setAdding(false), 800);
  }

  return (
    <div className="group relative">
      <Link to={`/products/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative overflow-hidden rounded-xl bg-neutral-100 aspect-[3/4]">
          <img
            src={image}
            alt={name}
            className={`w-full h-full object-cover transition-all duration-500 ${hoverImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
          />
          {hoverImage && (
            <img
              src={hoverImage}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                -{discountPct}%
              </span>
            )}
            {product.is_featured && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-semibold rounded-full">
                {t('Featured', '精選')}
              </span>
            )}
            {product.inventory_qty === 0 && (
              <span className="px-2 py-0.5 bg-neutral-500 text-white text-xs font-semibold rounded-full">
                {t('Sold Out', '售罄')}
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110">
            <Heart className="w-4 h-4 text-neutral-600" />
          </button>

          {/* Quick add */}
          <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              disabled={adding || product.inventory_qty === 0}
              className="w-full py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-60"
            >
              <ShoppingBag className="w-4 h-4" />
              {adding ? t('Added!', '已加入!') : product.inventory_qty === 0 ? t('Sold Out', '售罄') : t('Quick Add', '快速加入')}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 space-y-1">
          <h3 className="text-sm font-medium text-neutral-900 line-clamp-2 leading-snug">{name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-900">MOP${product.price.toFixed(0)}</span>
            {hasDiscount && (
              <span className="text-xs text-neutral-400 line-through">MOP${product.compare_price!.toFixed(0)}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
