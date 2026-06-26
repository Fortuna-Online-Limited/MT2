import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLang } from '../context/LangContext';

export default function Cart() {
  const { items, itemCount, total, updateQuantity, removeItem, loading } = useCart();
  const { lang, t } = useLang();

  const FREE_SHIPPING_THRESHOLD = 400;
  const shippingCost = total >= FREE_SHIPPING_THRESHOLD ? 0 : 30;
  const orderTotal = total + shippingCost;

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-pulse space-y-4">
      {Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-neutral-200 rounded-xl" />)}
    </div>
  );

  if (items.length === 0) return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-24 text-center">
      <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <ShoppingBag className="w-9 h-9 text-neutral-400" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">{t('Your cart is empty', '購物車是空的')}</h1>
      <p className="text-neutral-500 text-sm mb-6">{t('Add some products to get started', '添加一些產品開始購物')}</p>
      <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-colors">
        {t('Start Shopping', '開始購物')} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t('Shopping Cart', '購物車')}</h1>
      <p className="text-neutral-500 text-sm mb-8">{itemCount} {t('items', '件')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => {
            const name = item.product ? (lang === 'tc' ? item.product.name_tc : item.product.name_en) : '';
            const image = item.product?.images?.[0] || 'https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg?auto=compress&cs=tinysrgb&w=200';
            const price = item.product?.price ?? 0;
            return (
              <div key={item.id} className="flex gap-4 p-4 bg-white border border-neutral-200 rounded-2xl">
                <Link to={item.product ? `/products/${item.product.slug}` : '#'} className="flex-shrink-0">
                  <img src={image} alt={name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={item.product ? `/products/${item.product.slug}` : '#'} className="font-medium text-neutral-900 text-sm leading-snug hover:underline line-clamp-2">{name}</Link>
                    <button onClick={() => removeItem(item.id)} className="text-neutral-400 hover:text-neutral-600 flex-shrink-0 ml-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">MOP${price.toFixed(0)} {t('each', '每件')}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-neutral-200 rounded-lg">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 rounded-l-lg">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 rounded-r-lg">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900">MOP${(price * item.quantity).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 sticky top-24">
            <h2 className="font-bold text-neutral-900 mb-4">{t('Order Summary', '訂單摘要')}</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">{t('Subtotal', '小計')}</span>
                <span className="font-medium">MOP${total.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">{t('Shipping', '運費')}</span>
                <span className={`font-medium ${shippingCost === 0 ? 'text-emerald-600' : ''}`}>
                  {shippingCost === 0 ? t('Free', '免費') : `MOP$${shippingCost}`}
                </span>
              </div>
              {total < FREE_SHIPPING_THRESHOLD && (
                <div className="pt-2 pb-1">
                  <div className="text-xs text-neutral-500 mb-1.5">
                    {t(`Add MOP$${(FREE_SHIPPING_THRESHOLD - total).toFixed(0)} more for free shipping`, `再加MOP$${(FREE_SHIPPING_THRESHOLD - total).toFixed(0)}即享免運費`)}
                  </div>
                  <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-neutral-900 rounded-full transition-all" style={{ width: `${Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)}%` }} />
                  </div>
                </div>
              )}
              <div className="border-t border-neutral-200 pt-3 flex justify-between font-bold text-base">
                <span>{t('Total', '總計')}</span>
                <span>MOP${orderTotal.toFixed(0)}</span>
              </div>
            </div>
            <Link to="/checkout" className="mt-5 w-full py-3.5 bg-neutral-900 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors block text-center">
              {t('Proceed to Checkout', '前往結帳')} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/products" className="mt-3 text-sm text-neutral-500 hover:text-neutral-700 text-center block">{t('Continue Shopping', '繼續購物')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
