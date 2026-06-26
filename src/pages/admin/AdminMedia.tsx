import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Image, Video, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { MediaFile } from '../../types';

export default function AdminMedia() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ url: '', filename: '', type: 'image', alt_en: '', alt_tc: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('mt_media').select('*').order('created_at', { ascending: false });
    setMedia(data ?? []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('mt_media').insert({ url: form.url, filename: form.filename || form.url.split('/').pop(), type: form.type, alt_en: form.alt_en, alt_tc: form.alt_tc });
    setForm({ url: '', filename: '', type: 'image', alt_en: '', alt_tc: '' });
    setShowAdd(false);
    load();
  }

  const filtered = media.filter(m => {
    const matchSearch = !search || m.filename.toLowerCase().includes(search.toLowerCase()) || m.alt_en.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || m.type === typeFilter;
    return matchSearch && matchType;
  });

  const inputCls = "w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900";
  const labelCls = "block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-neutral-900">Media Library</h1><p className="text-neutral-500 text-sm">{media.length} files</p></div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800">
          <Plus className="w-4 h-4" /> Add Media URL
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-neutral-900 mb-4">Add Media by URL</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className={labelCls}>Image/Video URL</label><input required value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} className={inputCls} placeholder="https://images.pexels.com/..." /></div>
            <div><label className={labelCls}>Filename (optional)</label><input value={form.filename} onChange={e => setForm(f => ({ ...f, filename: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div><label className={labelCls}>Alt Text EN</label><input value={form.alt_en} onChange={e => setForm(f => ({ ...f, alt_en: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>替代文字 TC</label><input value={form.alt_tc} onChange={e => setForm(f => ({ ...f, alt_tc: e.target.value }))} className={inputCls} /></div>
            <div className="col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm border border-neutral-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800">Add</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search media..." className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
        </div>
        {(['', 'image', 'video'] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${typeFilter === t ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-600'}`}>
            {t === '' ? 'All' : t === 'image' ? 'Images' : 'Videos'}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array(10).fill(0).map((_, i) => <div key={i} className="aspect-square bg-neutral-200 animate-pulse rounded-xl" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {filtered.map(file => (
            <div key={file.id} className="group relative bg-neutral-100 rounded-xl overflow-hidden aspect-square">
              {file.type === 'image' ? (
                <img src={file.url} alt={file.alt_en} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                  <Video className="w-8 h-8 text-white opacity-60" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <p className="text-white text-xs text-center truncate w-full">{file.filename}</p>
                <button onClick={async () => { if (!confirm('Delete?')) return; await supabase.from('mt_media').delete().eq('id', file.id); load(); }} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-neutral-400">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No media files yet. Add URLs above.</p>
        </div>
      )}
    </div>
  );
}
