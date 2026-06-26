import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Collection } from '../../types';

interface ColForm { name_en: string; name_tc: string; slug: string; description_en: string; description_tc: string; image: string; sort_order: string; is_active: boolean; meta_title_en: string; meta_title_tc: string; meta_description_en: string; meta_description_tc: string; }
const EMPTY: ColForm = { name_en: '', name_tc: '', slug: '', description_en: '', description_tc: '', image: '', sort_order: '0', is_active: true, meta_title_en: '', meta_title_tc: '', meta_description_en: '', meta_description_tc: '' };
function toSlug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

export default function AdminCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState<ColForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('mt_collections').select('*').order('sort_order');
    setCollections(data ?? []);
    setLoading(false);
  }

  function openEdit(c: Collection) {
    setEditing(c);
    setForm({ name_en: c.name_en, name_tc: c.name_tc, slug: c.slug, description_en: c.description_en, description_tc: c.description_tc, image: c.image, sort_order: String(c.sort_order), is_active: c.is_active, meta_title_en: c.meta_title_en, meta_title_tc: c.meta_title_tc, meta_description_en: c.meta_description_en, meta_description_tc: c.meta_description_tc });
    setModalOpen(true);
  }

  function set(k: keyof ColForm, v: string | boolean) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    setSaving(true);
    const payload = { name_en: form.name_en, name_tc: form.name_tc, slug: form.slug || toSlug(form.name_en), description_en: form.description_en, description_tc: form.description_tc, image: form.image, sort_order: parseInt(form.sort_order) || 0, is_active: form.is_active, meta_title_en: form.meta_title_en, meta_title_tc: form.meta_title_tc, meta_description_en: form.meta_description_en, meta_description_tc: form.meta_description_tc, updated_at: new Date().toISOString() };
    if (editing) await supabase.from('mt_collections').update(payload).eq('id', editing.id);
    else await supabase.from('mt_collections').insert(payload);
    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this collection?')) return;
    await supabase.from('mt_collections').delete().eq('id', id);
    load();
  }

  const inputCls = "w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900";
  const labelCls = "block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-neutral-900">Collections</h1><p className="text-neutral-500 text-sm">{collections.length} collections</p></div>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
          <Plus className="w-4 h-4" /> Add Collection
        </button>
      </div>

      {loading ? <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-neutral-200 animate-pulse rounded-lg" />)}</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(col => (
            <div key={col.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
              <div className="aspect-[3/1] bg-neutral-100 overflow-hidden">
                {col.image && <img src={col.image} alt={col.name_en} className="w-full h-full object-cover" />}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-neutral-900">{col.name_en}</p>
                    <p className="text-sm text-neutral-500">{col.name_tc}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(col)} className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(col.id)} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${col.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>{col.is_active ? 'Active' : 'Hidden'}</span>
                  <span className="text-xs text-neutral-400">Order: {col.sort_order}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h2 className="font-bold text-neutral-900">{editing ? 'Edit Collection' : 'New Collection'}</h2>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-neutral-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Name EN</label><input value={form.name_en} onChange={e => { set('name_en', e.target.value); if (!editing) set('slug', toSlug(e.target.value)); }} className={inputCls} /></div>
                <div><label className={labelCls}>名稱 TC</label><input value={form.name_tc} onChange={e => set('name_tc', e.target.value)} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Slug</label><input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Description EN</label><textarea value={form.description_en} onChange={e => set('description_en', e.target.value)} rows={2} className={inputCls} /></div>
              <div><label className={labelCls}>描述 TC</label><textarea value={form.description_tc} onChange={e => set('description_tc', e.target.value)} rows={2} className={inputCls} /></div>
              <div><label className={labelCls}>Cover Image URL</label><input value={form.image} onChange={e => set('image', e.target.value)} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Sort Order</label><input type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} className={inputCls} /></div>
                <div className="flex items-center gap-2 pt-6"><input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4" /><label className="text-sm">Active</label></div>
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">SEO</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Meta Title EN</label><input value={form.meta_title_en} onChange={e => set('meta_title_en', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Meta Title TC</label><input value={form.meta_title_tc} onChange={e => set('meta_title_tc', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Meta Desc EN</label><input value={form.meta_description_en} onChange={e => set('meta_description_en', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Meta Desc TC</label><input value={form.meta_description_tc} onChange={e => set('meta_description_tc', e.target.value)} className={inputCls} /></div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:border-neutral-300">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
