import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Loader2, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { BlogPost } from '../../types';

interface BlogForm { title_en: string; title_tc: string; slug: string; excerpt_en: string; excerpt_tc: string; content_en: string; content_tc: string; cover_image: string; author: string; tags: string; is_published: boolean; meta_title_en: string; meta_title_tc: string; meta_description_en: string; meta_description_tc: string; }
const EMPTY: BlogForm = { title_en: '', title_tc: '', slug: '', excerpt_en: '', excerpt_tc: '', content_en: '', content_tc: '', cover_image: '', author: 'Admin', tags: '', is_published: false, meta_title_en: '', meta_title_tc: '', meta_description_en: '', meta_description_tc: '' };
function toSlug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'content' | 'seo'>('content');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('mt_blog_posts').select('*').order('created_at', { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  }

  function openEdit(p: BlogPost) {
    setEditing(p);
    setForm({ title_en: p.title_en, title_tc: p.title_tc, slug: p.slug, excerpt_en: p.excerpt_en, excerpt_tc: p.excerpt_tc, content_en: p.content_en, content_tc: p.content_tc, cover_image: p.cover_image, author: p.author, tags: (p.tags ?? []).join(', '), is_published: p.is_published, meta_title_en: p.meta_title_en, meta_title_tc: p.meta_title_tc, meta_description_en: p.meta_description_en, meta_description_tc: p.meta_description_tc });
    setTab('content');
    setModalOpen(true);
  }

  function set(k: keyof BlogForm, v: string | boolean) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    setSaving(true);
    const payload = { title_en: form.title_en, title_tc: form.title_tc, slug: form.slug || toSlug(form.title_en), excerpt_en: form.excerpt_en, excerpt_tc: form.excerpt_tc, content_en: form.content_en, content_tc: form.content_tc, cover_image: form.cover_image, author: form.author, tags: form.tags.split(',').map(s => s.trim()).filter(Boolean), is_published: form.is_published, published_at: form.is_published ? new Date().toISOString() : null, meta_title_en: form.meta_title_en, meta_title_tc: form.meta_title_tc, meta_description_en: form.meta_description_en, meta_description_tc: form.meta_description_tc, updated_at: new Date().toISOString() };
    if (editing) await supabase.from('mt_blog_posts').update(payload).eq('id', editing.id);
    else await supabase.from('mt_blog_posts').insert(payload);
    setSaving(false);
    setModalOpen(false);
    load();
  }

  const inputCls = "w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900";
  const labelCls = "block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-neutral-900">Blog Posts</h1><p className="text-neutral-500 text-sm">{posts.length} posts</p></div>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setTab('content'); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {loading ? <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-14 bg-neutral-200 animate-pulse rounded-lg" />)}</div> : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Post</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden sm:table-cell">Author</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {posts.map(p => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.cover_image && <img src={p.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                      <div>
                        <p className="font-medium text-neutral-900">{p.title_en}</p>
                        <p className="text-xs text-neutral-400">{p.title_tc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs hidden sm:table-cell">{p.author}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.is_published ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>
                      {p.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {p.is_published && <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"><Eye className="w-3.5 h-3.5" /></a>}
                      <button onClick={() => openEdit(p)} className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { if (!confirm('Delete?')) return; await supabase.from('mt_blog_posts').delete().eq('id', p.id); load(); }} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-neutral-400 text-sm">No posts yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h2 className="font-bold text-neutral-900">{editing ? 'Edit Post' : 'New Post'}</h2>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-neutral-400" /></button>
            </div>
            <div className="flex gap-4 px-6 pt-4 border-b border-neutral-200">
              {(['content', 'seo'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>{t}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {tab === 'content' && <>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Title EN</label><input value={form.title_en} onChange={e => { set('title_en', e.target.value); if (!editing) set('slug', toSlug(e.target.value)); }} className={inputCls} /></div>
                  <div><label className={labelCls}>標題 TC</label><input value={form.title_tc} onChange={e => set('title_tc', e.target.value)} className={inputCls} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Slug</label><input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Author</label><input value={form.author} onChange={e => set('author', e.target.value)} className={inputCls} /></div>
                </div>
                <div><label className={labelCls}>Cover Image URL</label><input value={form.cover_image} onChange={e => set('cover_image', e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Tags (comma-separated)</label><input value={form.tags} onChange={e => set('tags', e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Excerpt EN</label><textarea value={form.excerpt_en} onChange={e => set('excerpt_en', e.target.value)} rows={2} className={inputCls} /></div>
                <div><label className={labelCls}>摘要 TC</label><textarea value={form.excerpt_tc} onChange={e => set('excerpt_tc', e.target.value)} rows={2} className={inputCls} /></div>
                <div><label className={labelCls}>Content EN (supports # headings and **bold**)</label><textarea value={form.content_en} onChange={e => set('content_en', e.target.value)} rows={10} className={inputCls} /></div>
                <div><label className={labelCls}>內容 TC</label><textarea value={form.content_tc} onChange={e => set('content_tc', e.target.value)} rows={10} className={inputCls} /></div>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} className="w-4 h-4" /> Published</label>
              </>}
              {tab === 'seo' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Meta Title EN</label><input value={form.meta_title_en} onChange={e => set('meta_title_en', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Meta Title TC</label><input value={form.meta_title_tc} onChange={e => set('meta_title_tc', e.target.value)} className={inputCls} /></div>
                  <div className="col-span-2"><label className={labelCls}>Meta Description EN</label><textarea value={form.meta_description_en} onChange={e => set('meta_description_en', e.target.value)} rows={2} className={inputCls} /></div>
                  <div className="col-span-2"><label className={labelCls}>Meta Description TC</label><textarea value={form.meta_description_tc} onChange={e => set('meta_description_tc', e.target.value)} rows={2} className={inputCls} /></div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:border-neutral-300">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {saving ? 'Saving...' : 'Save Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
