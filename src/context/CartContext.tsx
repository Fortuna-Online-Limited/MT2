import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CartItem } from '../types';

function getSessionId(): string {
  let id = localStorage.getItem('mt_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('mt_session_id', id);
  }
  return id;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionId = getSessionId();

  const refreshCart = useCallback(async () => {
    const { data } = await supabase
      .from('mt_cart_items')
      .select('*, product:mt_products(*)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    setItems((data as CartItem[]) ?? []);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { refreshCart(); }, [refreshCart]);

  async function addItem(productId: string, quantity = 1) {
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      await updateQuantity(existing.id, existing.quantity + quantity);
    } else {
      await supabase.from('mt_cart_items').insert({ session_id: sessionId, product_id: productId, quantity });
      await refreshCart();
    }
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) { await removeItem(itemId); return; }
    await supabase.from('mt_cart_items').update({ quantity }).eq('id', itemId);
    await refreshCart();
  }

  async function removeItem(itemId: string) {
    await supabase.from('mt_cart_items').delete().eq('id', itemId);
    await refreshCart();
  }

  async function clearCart() {
    await supabase.from('mt_cart_items').delete().eq('session_id', sessionId);
    setItems([]);
  }

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, total, loading, addItem, updateQuantity, removeItem, clearCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
