import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Loader2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { SeoSetting } from '../../types';

const PAGE_KEYS = ['home', 'products', 'blog', 'faq', 'about', 'contact', 'cart', 'checkout'];

export default function AdminSEO() {
  const [settings, setSettings] = useState<Record<string, SeoSetting>>({});
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState('home');
  const [form, setForm] = useState<Partial<SeoSetting>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('mt_seo_settings').select('*');
    const map: Record<string, SeoSetting> = {};
    (data ?? []).forEach(s => { map[s.page_key] = s; });
    setSettings(map);
    setLoading(false);
    const initial = map['home'] ?? { page_key: 'home' };
    setForm(initial);
  }

  function selectPage(key: string) {
    setSelectedKey(key);
    setForm(settings[key] ?? { page_key: key });
    setSaved(false);
  }

  function set(k: keyof SeoSetting, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    setSaving(true);
    const payload = { page_key: selectedKey, meta_title_en: form.meta_title_en ?? '', meta_title_tc: form.meta_title_tc ?? '', meta_description_en: form.meta_description_en ?? '', meta_description_tc: form.meta_description_tc ?? '', og_image: form.og_image ?? '', keywords_en: form.keywords_en ?? '', keywords_tc: form.keywords_tc ?? '', canonical_url: form.canonical_url ?? '', robots: form.robots ?? 'index,follow', updated_at: new Date().toISOString() };
    const existing = settings[selectedKey];
    if (existing?.id) {
      await supabase.from('mt_seo_settings').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('mt_seo_settings').insert(payload);
    }
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
        <h1 className="text-2xl font-bold text-neutral-900">SEO Settings</h1>
        <p className="text-neutral-500 text-sm">Manage meta titles, descriptions, keywords, and robots directives per page</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Page selector */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Pages</p>
            <div className="space-y-1">
              {PAGE_KEYS.map(key => (
                <button key={key} onClick={() => selectPage(key)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${selectedKey === key ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-600 hover:bg-neutral-50'}`}>
                  <span className="capitalize">{key}</span>
                  {settings[key] && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-neutral-900 capitalize">{selectedKey} – SEO</h2>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-60 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
              </button>
            </div>

            {loading ? <div className="space-y-3">{Array(6).fill(0).map((_, i) => <div key={i} className="h-10 bg-neutral-200 animate-pulse rounded" />)}</div> : (
              <>
                {/* Meta Titles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Meta Title (EN)</label>
                    <input value={form.meta_title_en ?? ''} onChange={e => set('meta_title_en', e.target.value)} className={inputCls} placeholder="Page title for search engines" maxLength={70} />
                    <p className="text-xs text-neutral-400 mt-1">{(form.meta_title_en ?? '').length}/70 chars</p>
                  </div>
                  <div>
                    <label className={labelCls}>Meta Title (TC)</label>
                    <input value={form.meta_title_tc ?? ''} onChange={e => set('meta_title_tc', e.target.value)} className={inputCls} maxLength={70} />
                    <p className="text-xs text-neutral-400 mt-1">{(form.meta_title_tc ?? '').length}/70 chars</p>
                  </div>
                </div>

                {/* Meta Descriptions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Meta Description (EN)</label>
                    <textarea value={form.meta_description_en ?? ''} onChange={e => set('meta_description_en', e.target.value)} className={inputCls} rows={3} placeholder="Brief description for search results" maxLength={160} />
                    <p className="text-xs text-neutral-400 mt-1">{(form.meta_description_en ?? '').length}/160 chars</p>
                  </div>
                  <div>
                    <label className={labelCls}>Meta Description (TC)</label>
                    <textarea value={form.meta_description_tc ?? ''} onChange={e => set('meta_description_tc', e.target.value)} className={inputCls} rows={3} maxLength={160} />
                    <p className="text-xs text-neutral-400 mt-1">{(form.meta_description_tc ?? '').length}/160 chars</p>
                  </div>
                </div>

                {/* Keywords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Keywords (EN)</label>
                    <input value={form.keywords_en ?? ''} onChange={e => set('keywords_en', e.target.value)} className={inputCls} placeholder="keyword1, keyword2, keyword3" />
                  </div>
                  <div>
                    <label className={labelCls}>關鍵詞 (TC)</label>
                    <input value={form.keywords_tc ?? ''} onChange={e => set('keywords_tc', e.target.value)} className={inputCls} />
                  </div>
                </div>

                {/* OG Image & Canonical */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>OG Image URL</label>
                    <input value={form.og_image ?? ''} onChange={e => set('og_image', e.target.value)} className={inputCls} placeholder="https://..." />
                    <p className="text-xs text-neutral-400 mt-1">Recommended: 1200×630px</p>
                  </div>
                  <div>
                    <label className={labelCls}>Canonical URL</label>
                    <input value={form.canonical_url ?? ''} onChange={e => set('canonical_url', e.target.value)} className={inputCls} placeholder="https://www.mtbrand.com/..." />
                  </div>
                </div>

                {/* Robots */}
                <div className="max-w-xs">
                  <label className={labelCls}>Robots Directive</label>
                  <select value={form.robots ?? 'index,follow'} onChange={e => set('robots', e.target.value)} className={inputCls}>
                    <option value="index,follow">index, follow</option>
                    <option value="noindex,follow">noindex, follow</option>
                    <option value="index,nofollow">index, nofollow</option>
                    <option value="noindex,nofollow">noindex, nofollow</option>
                  </select>
                </div>

                {/* Preview */}
                <div className="mt-2 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Search Preview</p>
                  <div className="space-y-0.5">
                    <p className="text-blue-700 text-base font-medium leading-tight truncate">{form.meta_title_en || 'Page Title'}</p>
                    <p className="text-emerald-700 text-xs">https://www.mtbrand.com/{selectedKey !== 'home' ? selectedKey : ''}</p>
                    <p className="text-neutral-600 text-xs leading-relaxed line-clamp-2">{form.meta_description_en || 'Page description will appear here in search results...'}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
