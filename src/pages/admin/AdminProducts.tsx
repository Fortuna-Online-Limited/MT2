import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Loader2, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Product, Collection } from '../../types';

interface ProductForm {
  name_en: string; name_tc: string; slug: string; description_en: string; description_tc: string;
  price: string; compare_price: string; images: string; collection_id: string;
  inventory_qty: string; sku: string; is_active: boolean; is_featured: boolean;
  meta_title_en: string; meta_title_tc: string; meta_description_en: string; meta_description_tc: string; tags: string;
}

const EMPTY: ProductForm = { name_en: '', name_tc: '', slug: '', description_en: '', description_tc: '', price: '', compare_price: '', images: '', collection_id: '', inventory_qty: '0', sku: '', is_active: true, is_featured: false, meta_title_en: '', meta_title_tc: '', meta_description_en: '', meta_description_tc: '', tags: '' };

function toSlug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [{ data: prods }, { data: cols }] = await Promise.all([
      supabase.from('mt_products').select('*, collection:mt_collections(*)').order('created_at', { ascending: false }),
      supabase.from('mt_collections').select('*').order('sort_order'),
    ]);
    setProducts((prods as Product[]) ?? []);
    setCollections(cols ?? []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name_en: p.name_en, name_tc: p.name_tc, slug: p.slug,
      description_en: p.description_en, description_tc: p.description_tc,
      price: String(p.price), compare_price: p.compare_price ? String(p.compare_price) : '',
      images: (p.images ?? []).join('\n'), collection_id: p.collection_id ?? '',
      inventory_qty: String(p.inventory_qty), sku: p.sku,
      is_active: p.is_active, is_featured: p.is_featured,
      meta_title_en: p.meta_title_en, meta_title_tc: p.meta_title_tc,
      meta_description_en: p.meta_description_en, meta_description_tc: p.meta_description_tc,
      tags: (p.tags ?? []).join(', '),
    });
    setModalOpen(true);
  }

  function set(k: keyof ProductForm, v: string | boolean) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.name_en || !form.price) return;
    setSaving(true);
    const payload = {
      name_en: form.name_en, name_tc: form.name_tc,
      slug: form.slug || toSlug(form.name_en),
      description_en: form.description_en, description_tc: form.description_tc,
      price: parseFloat(form.price) || 0,
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      images: form.images.split('\n').map(s => s.trim()).filter(Boolean),
      collection_id: form.collection_id || null,
      inventory_qty: parseInt(form.inventory_qty) || 0,
      sku: form.sku, is_active: form.is_active, is_featured: form.is_featured,
      meta_title_en: form.meta_title_en, meta_title_tc: form.meta_title_tc,
      meta_description_en: form.meta_description_en, meta_description_tc: form.meta_description_tc,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      await supabase.from('mt_products').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('mt_products').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    await supabase.from('mt_products').delete().eq('id', id);
    loadData();
  }

  const filtered = products.filter(p =>
    !search || p.name_en.toLowerCase().includes(search.toLowerCase()) || p.name_tc.includes(search)
  );

  const inputCls = "w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900";
  const labelCls = "block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
          <p className="text-neutral-500 text-sm">{products.length} total products</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-14 bg-neutral-200 animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden sm:table-cell">Collection</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden md:table-cell">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center"><Package className="w-4 h-4 text-neutral-400" /></div>
                      )}
                      <div>
                        <p className="font-medium text-neutral-900">{p.name_en}</p>
                        <p className="text-xs text-neutral-400">{p.name_tc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{p.collection?.name_en ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">MOP${p.price.toFixed(0)}</td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">{p.inventory_qty}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>
                      {p.is_active ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-400 text-sm">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h2 className="font-bold text-neutral-900">{editing ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-neutral-400 hover:text-neutral-600" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Name (EN)</label><input value={form.name_en} onChange={e => { set('name_en', e.target.value); if (!editing) set('slug', toSlug(e.target.value)); }} className={inputCls} /></div>
                <div><label className={labelCls}>名稱 (TC)</label><input value={form.name_tc} onChange={e => set('name_tc', e.target.value)} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Slug (URL)</label><input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelCls}>Price (MOP$)</label><input type="number" value={form.price} onChange={e => set('price', e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Compare Price</label><input type="number" value={form.compare_price} onChange={e => set('compare_price', e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Stock Qty</label><input type="number" value={form.inventory_qty} onChange={e => set('inventory_qty', e.target.value)} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>SKU</label><input value={form.sku} onChange={e => set('sku', e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Collection</label>
                  <select value={form.collection_id} onChange={e => set('collection_id', e.target.value)} className={inputCls}>
                    <option value="">None</option>
                    {collections.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                  </select>
                </div>
              </div>
              <div><label className={labelCls}>Description (EN)</label><textarea value={form.description_en} onChange={e => set('description_en', e.target.value)} rows={3} className={inputCls} /></div>
              <div><label className={labelCls}>描述 (TC)</label><textarea value={form.description_tc} onChange={e => set('description_tc', e.target.value)} rows={3} className={inputCls} /></div>
              <div><label className={labelCls}>Image URLs (one per line)</label><textarea value={form.images} onChange={e => set('images', e.target.value)} rows={3} className={inputCls} placeholder="https://example.com/image.jpg" /></div>
              <div><label className={labelCls}>Tags (comma-separated)</label><input value={form.tags} onChange={e => set('tags', e.target.value)} className={inputCls} placeholder="tag1, tag2, tag3" /></div>
              <div className="border-t border-neutral-200 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">SEO</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Meta Title EN</label><input value={form.meta_title_en} onChange={e => set('meta_title_en', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Meta Title TC</label><input value={form.meta_title_tc} onChange={e => set('meta_title_tc', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Meta Description EN</label><input value={form.meta_description_en} onChange={e => set('meta_description_en', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Meta Description TC</label><input value={form.meta_description_tc} onChange={e => set('meta_description_tc', e.target.value)} className={inputCls} /></div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 rounded" /> Active
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} className="w-4 h-4 rounded" /> Featured
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-60 flex items-center gap-2 transition-colors">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
