import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

interface FormData {
  email: string; firstName: string; lastName: string; phone: string;
  address1: string; address2: string; city: string; region: string; postal: string; country: string;
  paymentMethod: string; notes: string;
}

const INITIAL: FormData = { email: '', firstName: '', lastName: '', phone: '', address1: '', address2: '', city: '', region: '', postal: '', country: 'MO', paymentMethod: 'bank_transfer', notes: '' };

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>({ ...INITIAL, email: user?.email ?? '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const shippingCost = total >= 400 ? 0 : 30;
  const orderTotal = total + shippingCost;

  function set(key: keyof FormData, value: string) { setForm(f => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    setError('');

    const { data: order, error: oErr } = await supabase.from('mt_orders').insert({
      user_id: user?.id ?? null,
      email: form.email,
      first_name: form.firstName,
      last_name: form.lastName,
      phone: form.phone,
      subtotal: total,
      shipping_cost: shippingCost,
      total: orderTotal,
      shipping_address: { line1: form.address1, line2: form.address2, city: form.city, region: form.region, postal_code: form.postal, country: form.country },
      payment_method: form.paymentMethod,
      notes: form.notes,
      status: 'pending',
      payment_status: 'unpaid',
    }).select().maybeSingle();

    if (oErr || !order) { setError(t('Failed to place order. Please try again.', '下單失敗，請重試。')); setLoading(false); return; }

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product ? (item.product.name_en) : 'Product',
      product_image: item.product?.images?.[0] ?? '',
      price: item.product?.price ?? 0,
      quantity: item.quantity,
      subtotal: (item.product?.price ?? 0) * item.quantity,
    }));

    await supabase.from('mt_order_items').insert(orderItems);
    await clearCart();
    setOrderNumber(order.order_number);
    setSuccess(true);
    setLoading(false);
  }

  if (success) return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">{t('Order Confirmed!', '訂單已確認！')}</h1>
      <p className="text-neutral-500 text-sm mb-1">{t('Thank you for your purchase.', '感謝您的購買。')}</p>
      <p className="text-sm font-medium text-neutral-700 mb-6">{t('Order', '訂單')} #{orderNumber}</p>
      <p className="text-xs text-neutral-400 mb-8">{t('A confirmation email will be sent shortly.', '確認電郵將很快發送。')}</p>
      <button onClick={() => navigate('/products')} className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-colors">
        {t('Continue Shopping', '繼續購物')}
      </button>
    </div>
  );

  const inputCls = "w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all";
  const labelCls = "block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-neutral-900 mb-8">{t('Checkout', '結帳')}</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Contact */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5">
              <h2 className="font-bold text-neutral-900 mb-4">{t('Contact Information', '聯絡資料')}</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>{t('Email', '電郵')}</label>
                  <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t('First Name', '名字')}</label>
                    <input type="text" required value={form.firstName} onChange={e => set('firstName', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('Last Name', '姓氏')}</label>
                    <input type="text" required value={form.lastName} onChange={e => set('lastName', e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('Phone', '電話')}</label>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5">
              <h2 className="font-bold text-neutral-900 mb-4">{t('Shipping Address', '送貨地址')}</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>{t('Address Line 1', '地址第一行')}</label>
                  <input type="text" required value={form.address1} onChange={e => set('address1', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('Address Line 2 (Optional)', '地址第二行（可選）')}</label>
                  <input type="text" value={form.address2} onChange={e => set('address2', e.target.value)} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t('City / District', '城市/地區')}</label>
                    <input type="text" required value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('Region', '地區')}</label>
                    <input type="text" value={form.region} onChange={e => set('region', e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t('Postal Code', '郵政編碼')}</label>
                    <input type="text" value={form.postal} onChange={e => set('postal', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('Country', '國家')}</label>
                    <select value={form.country} onChange={e => set('country', e.target.value)} className={inputCls}>
                      <option value="HK">Hong Kong (HK)</option>
                      <option value="MO">Macau (MO)</option>
                      <option value="CN">China (CN)</option>
                      <option value="TW">Taiwan (TW)</option>
                      <option value="SG">Singapore (SG)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5">
              <h2 className="font-bold text-neutral-900 mb-4">{t('Payment Method', '付款方式')}</h2>
              <div className="space-y-2">
                {[
                  { value: 'bank_transfer', label: t('Bank Transfer', '銀行轉帳') },
                  { value: 'fps', label: 'FPS (轉數快)' },
                  { value: 'credit_card', label: t('Credit Card (coming soon)', '信用卡（即將推出）') },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${form.paymentMethod === opt.value ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'}`}>
                    <input type="radio" name="payment" value={opt.value} checked={form.paymentMethod === opt.value} onChange={e => set('paymentMethod', e.target.value)} className="text-neutral-900" />
                    <span className="text-sm font-medium text-neutral-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <label className={labelCls}>{t('Order Notes (Optional)', '訂單備注（可選）')}</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className={inputCls} placeholder={t('Any special instructions...', '任何特殊要求...')} />
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 sticky top-24">
              <h2 className="font-bold text-neutral-900 mb-4">{t('Order Summary', '訂單摘要')}</h2>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.product?.images?.[0] || 'https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg?auto=compress&cs=tinysrgb&w=80'} alt="" className="w-12 h-12 object-cover rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-800 truncate">{item.product?.name_en}</p>
                      <p className="text-xs text-neutral-500">×{item.quantity}</p>
                    </div>
                    <span className="text-xs font-medium">MOP${((item.product?.price ?? 0) * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-neutral-200 pt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-neutral-600">{t('Subtotal', '小計')}</span><span>MOP${total.toFixed(0)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-600">{t('Shipping', '運費')}</span><span className={shippingCost === 0 ? 'text-emerald-600' : ''}>{shippingCost === 0 ? t('Free', '免費') : `MOP$${shippingCost}`}</span></div>
                <div className="flex justify-between font-bold text-base pt-1 border-t border-neutral-200"><span>{t('Total', '總計')}</span><span>MOP${orderTotal.toFixed(0)}</span></div>
              </div>
              {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
              <button type="submit" disabled={loading || items.length === 0} className="mt-5 w-full py-3.5 bg-neutral-900 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? t('Placing Order...', '下單中...') : t('Place Order', '下訂單')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
