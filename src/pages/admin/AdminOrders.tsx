import React, { useEffect, useState } from 'react';
import { Eye, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Order } from '../../types';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;
const STATUS_COLORS: Record<string, string> = { pending: 'bg-yellow-50 text-yellow-700', processing: 'bg-blue-50 text-blue-700', shipped: 'bg-indigo-50 text-indigo-700', delivered: 'bg-emerald-50 text-emerald-700', cancelled: 'bg-red-50 text-red-700', refunded: 'bg-neutral-100 text-neutral-600' };

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('mt_orders').select('*, items:mt_order_items(*)').order('created_at', { ascending: false });
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('mt_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    load();
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: status as Order['status'] } : null);
  }

  const filtered = filter ? orders.filter(o => o.status === filter) : orders;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-neutral-900">Orders</h1><p className="text-neutral-500 text-sm">{orders.length} total orders</p></div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter('')} className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${!filter ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-600'}`}>All</button>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s === filter ? '' : s)} className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors capitalize ${filter === s ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-600'}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="h-14 bg-neutral-200 animate-pulse rounded-lg" />)}</div> : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden sm:table-cell">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden md:table-cell">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{order.order_number}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="font-medium text-neutral-900">{order.first_name} {order.last_name}</p>
                    <p className="text-xs text-neutral-400">{order.email}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">MOP${order.total.toFixed(0)}</td>
                  <td className="px-4 py-3">
                    <div className="relative inline-block">
                      <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)} className={`appearance-none pl-2 pr-6 py-1 rounded-full text-xs font-medium cursor-pointer border-0 ${STATUS_COLORS[order.status]}`}>
                        {STATUSES.map(s => <option key={s} value={s} className="bg-white text-neutral-800 capitalize">{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs hidden md:table-cell">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(order)} className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"><Eye className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-400 text-sm">No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Order detail drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 sticky top-0 bg-white z-10">
              <div>
                <p className="font-bold text-neutral-900">Order {selected.order_number}</p>
                <p className={`text-xs font-medium mt-0.5 ${STATUS_COLORS[selected.status]} px-2 py-0.5 rounded-full inline-block`}>{selected.status}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-neutral-400 hover:text-neutral-600 p-1">✕</button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Customer</p>
                <p className="text-sm font-medium">{selected.first_name} {selected.last_name}</p>
                <p className="text-sm text-neutral-500">{selected.email}</p>
                {selected.phone && <p className="text-sm text-neutral-500">{selected.phone}</p>}
              </div>
              {selected.shipping_address?.line1 && (
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Shipping Address</p>
                  <p className="text-sm text-neutral-700">{selected.shipping_address.line1}</p>
                  {selected.shipping_address.line2 && <p className="text-sm text-neutral-700">{selected.shipping_address.line2}</p>}
                  <p className="text-sm text-neutral-700">{selected.shipping_address.city}, {selected.shipping_address.country}</p>
                </div>
              )}
              {selected.items && selected.items.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Items</p>
                  <div className="space-y-2">
                    {selected.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-neutral-700">{item.product_name} ×{item.quantity}</span>
                        <span className="font-medium">MOP${item.subtotal.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t border-neutral-200 pt-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>MOP${selected.subtotal.toFixed(0)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span>MOP${selected.shipping_cost.toFixed(0)}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>MOP${selected.total.toFixed(0)}</span></div>
              </div>
              {selected.notes && (
                <div><p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Notes</p><p className="text-sm text-neutral-600">{selected.notes}</p></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
