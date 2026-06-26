import React, { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { SiteSetting } from '../../types';

const EDITABLE_KEYS = [
  { key: 'site_name', label: 'Site Name' },
  { key: 'site_tagline', label: 'Tagline' },
  { key: 'contact_email', label: 'Contact Email' },
  { key: 'contact_phone', label: 'Contact Phone' },
  { key: 'contact_address', label: 'Contact Address' },
  { key: 'social_instagram', label: 'Instagram URL' },
  { key: 'social_facebook', label: 'Facebook URL' },
  { key: 'hero_title', label: 'Hero Title' },
  { key: 'hero_subtitle', label: 'Hero Subtitle' },
  { key: 'announcement_bar', label: 'Announcement Bar' },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [form, setForm] = useState<Record<string, { en: string; tc: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('mt_site_settings').select('*');
    const map: Record<string, SiteSetting> = {};
    const fMap: Record<string, { en: string; tc: string }> = {};
    (data ?? []).forEach(s => {
      map[s.key] = s;
      fMap[s.key] = { en: s.value_en, tc: s.value_tc };
    });
    setSettings(map);
    setForm(fMap);
    setLoading(false);
  }

  function set(key: string, lang: 'en' | 'tc', value: string) {
    setForm(f => ({ ...f, [key]: { ...f[key], [lang]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    for (const { key } of EDITABLE_KEYS) {
      const values = form[key];
      if (!values) continue;
      if (settings[key]) {
        await supabase.from('mt_site_settings').update({ value_en: values.en, value_tc: values.tc, updated_at: new Date().toISOString() }).eq('key', key);
      } else {
        await supabase.from('mt_site_settings').insert({ key, value_en: values.en, value_tc: values.tc });
      }
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Site Settings</h1>
          <p className="text-neutral-500 text-sm">Global settings for your brand website</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">{Array(8).fill(0).map((_, i) => <div key={i} className="h-16 bg-neutral-200 animate-pulse rounded-xl" />)}</div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-5">
          {EDITABLE_KEYS.map(({ key, label }) => (
            <div key={key}>
              <p className="font-semibold text-neutral-800 text-sm mb-2">{label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>English</label>
                  <input value={form[key]?.en ?? ''} onChange={e => set(key, 'en', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>繁體中文</label>
                  <input value={form[key]?.tc ?? ''} onChange={e => set(key, 'tc', e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
