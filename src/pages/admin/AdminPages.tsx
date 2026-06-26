import React, { useEffect, useState } from 'react';
import { Edit2, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Page } from '../../types';

const SLUGS = ['about', 'privacy-policy', 'terms-of-service', 'shipping-policy'];

export default function AdminPages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selected, setSelected] = useState<Page | null>(null);
  const [form, setForm] = useState<Partial<Page>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'en' | 'tc'>('en');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('mt_pages').select('*').order('slug');
    setPages(data ?? []);
    setLoading(false);
    if (data && data.length > 0) {
      setSelected(data[0]);
      setForm(data[0]);
    }
  }

  function selectPage(page: Page) {
    setSelected(page);
    setForm(page);
    setSaved(false);
  }

  function set(k: keyof Page, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    const payload = { title_en: form.title_en, title_tc: form.title_tc, content_en: form.content_en, content_tc: form.content_tc, meta_title_en: form.meta_title_en ?? '', meta_title_tc: form.meta_title_tc ?? '', meta_description_en: form.meta_description_en ?? '', meta_description_tc: form.meta_description_tc ?? '', updated_at: new Date().toISOString() };
    await supabase.from('mt_pages').update(payload).eq('id', selected.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load();
  }

  const inputCls = "w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900";
  const labelCls = "block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Pages</h1>
        <p className="text-neutral-500 text-sm">Edit static pages (About, Policies)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Page list */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Pages</p>
            {loading ? <div className="space-y-2">{Array(4).fill(0).map((_, i) => <div key={i} className="h-9 bg-neutral-200 animate-pulse rounded-lg" />)}</div> : (
              <div className="space-y-1">
                {pages.map(page => (
                  <button key={page.id} onClick={() => selectPage(page)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${selected?.id === page.id ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-600 hover:bg-neutral-50'}`}>
                    <p>{page.title_en}</p>
                    <p className={`text-xs ${selected?.id === page.id ? 'text-neutral-400' : 'text-neutral-400'}`}>{page.slug}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          {selected && (
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                <h2 className="font-bold text-neutral-900">{selected.title_en}</h2>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-60 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
                </button>
              </div>

              <div className="flex gap-4 px-6 pt-4 border-b border-neutral-200">
                {(['en', 'tc'] as const).map(l => (
                  <button key={l} onClick={() => setTab(l)} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === l ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500'}`}>
                    {l === 'en' ? 'English' : '繁體中文'}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className={labelCls}>{tab === 'en' ? 'Page Title (EN)' : '頁面標題 (TC)'}</label>
                  <input value={(tab === 'en' ? form.title_en : form.title_tc) ?? ''} onChange={e => set(tab === 'en' ? 'title_en' : 'title_tc', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{tab === 'en' ? 'Content (EN) – Supports # headings and **bold**' : '內容 (TC)'}</label>
                  <textarea value={(tab === 'en' ? form.content_en : form.content_tc) ?? ''} onChange={e => set(tab === 'en' ? 'content_en' : 'content_tc', e.target.value)} rows={16} className={inputCls + ' font-mono text-xs'} />
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-neutral-200 pt-4">
                  <div>
                    <label className={labelCls}>Meta Title ({tab.toUpperCase()})</label>
                    <input value={(tab === 'en' ? form.meta_title_en : form.meta_title_tc) ?? ''} onChange={e => set(tab === 'en' ? 'meta_title_en' : 'meta_title_tc', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Meta Description ({tab.toUpperCase()})</label>
                    <input value={(tab === 'en' ? form.meta_description_en : form.meta_description_tc) ?? ''} onChange={e => set(tab === 'en' ? 'meta_description_en' : 'meta_description_tc', e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
