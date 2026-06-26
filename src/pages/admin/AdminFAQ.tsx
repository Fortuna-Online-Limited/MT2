import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { FaqItem } from '../../types';

interface FaqForm { question_en: string; question_tc: string; answer_en: string; answer_tc: string; category: string; sort_order: string; is_active: boolean; }
const EMPTY: FaqForm = { question_en: '', question_tc: '', answer_en: '', answer_tc: '', category: 'General', sort_order: '0', is_active: true };

export default function AdminFAQ() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [form, setForm] = useState<FaqForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('mt_faq_items').select('*').order('sort_order');
    setItems(data ?? []);
    setLoading(false);
  }

  function openEdit(item: FaqItem) {
    setEditing(item);
    setForm({ question_en: item.question_en, question_tc: item.question_tc, answer_en: item.answer_en, answer_tc: item.answer_tc, category: item.category, sort_order: String(item.sort_order), is_active: item.is_active });
    setModalOpen(true);
  }

  function set(k: keyof FaqForm, v: string | boolean) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    setSaving(true);
    const payload = { question_en: form.question_en, question_tc: form.question_tc, answer_en: form.answer_en, answer_tc: form.answer_tc, category: form.category, sort_order: parseInt(form.sort_order) || 0, is_active: form.is_active, updated_at: new Date().toISOString() };
    if (editing) await supabase.from('mt_faq_items').update(payload).eq('id', editing.id);
    else await supabase.from('mt_faq_items').insert(payload);
    setSaving(false);
    setModalOpen(false);
    load();
  }

  const inputCls = "w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900";
  const labelCls = "block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1";
  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-neutral-900">FAQ</h1><p className="text-neutral-500 text-sm">{items.length} questions</p></div>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800">
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      {loading ? <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-neutral-200 animate-pulse rounded-lg" />)}</div> : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Question</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-neutral-400 text-xs">{item.sort_order}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900 text-sm truncate max-w-xs">{item.question_en}</p>
                    <p className="text-xs text-neutral-400 truncate max-w-xs">{item.question_tc}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs hidden sm:table-cell">{item.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>{item.is_active ? 'Active' : 'Hidden'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { if (!confirm('Delete?')) return; await supabase.from('mt_faq_items').delete().eq('id', item.id); load(); }} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-neutral-400 text-sm">No FAQ items yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h2 className="font-bold text-neutral-900">{editing ? 'Edit Question' : 'New Question'}</h2>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-neutral-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className={labelCls}>Question (EN)</label><input value={form.question_en} onChange={e => set('question_en', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>問題 (TC)</label><input value={form.question_tc} onChange={e => set('question_tc', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Answer (EN)</label><textarea value={form.answer_en} onChange={e => set('answer_en', e.target.value)} rows={4} className={inputCls} /></div>
              <div><label className={labelCls}>答案 (TC)</label><textarea value={form.answer_tc} onChange={e => set('answer_tc', e.target.value)} rows={4} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Category</label><input value={form.category} onChange={e => set('category', e.target.value)} list="faq-cats" className={inputCls} /><datalist id="faq-cats">{categories.map(c => <option key={c} value={c} />)}</datalist></div>
                <div><label className={labelCls}>Sort Order</label><input type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} className={inputCls} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4" /> Active</label>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-neutral-200 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
