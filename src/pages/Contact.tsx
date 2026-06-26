import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { supabase } from '../lib/supabase';

export default function Contact() {
  const { t, lang } = useLang();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('mt_site_settings').select('key, value_en, value_tc').then(({ data }) => {
      const m: Record<string, string> = {};
      (data ?? []).forEach(s => { m[s.key] = lang === 'tc' ? s.value_tc : s.value_en; });
      setSettings(m);
    });
  }, [lang]);

  function set(k: keyof typeof form, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  }

  const inputCls = "w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all";
  const labelCls = "block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5";

  return (
    <>
      {/* Hero */}
      <div className="relative h-52 bg-neutral-900 overflow-hidden">
        <img src="https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=1280" alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white">{t('Contact Us', '聯絡我們')}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Info */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-4">{t("Let's Talk", '讓我們交談')}</h2>
              <p className="text-sm text-neutral-500 leading-relaxed">{t("Have a question or want to learn more? We'd love to hear from you.", '有問題或想了解更多？我們很樂意收到您的消息。')}</p>
            </div>

            {[
              { icon: Mail, label: t('Email', '電郵'), value: settings.contact_email },
              { icon: Phone, label: t('Phone', '電話'), value: settings.contact_phone },
              { icon: MapPin, label: t('Address', '地址'), value: settings.contact_address },
            ].map(({ icon: Icon, label, value }) => value && (
              <div key={label} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{label}</p>
                  <p className="text-sm text-neutral-700 mt-0.5">{value}</p>
                </div>
              </div>
            ))}

            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xs font-semibold text-neutral-600 mb-1">{t('Business Hours', '營業時間')}</p>
              <p className="text-sm text-neutral-500">{t('Mon–Fri: 9am–6pm HKT', '週一至週五：上午9時至下午6時（香港時間）')}</p>
              <p className="text-sm text-neutral-500">{t('Sat: 10am–4pm HKT', '週六：上午10時至下午4時（香港時間）')}</p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="w-14 h-14 text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-neutral-900 mb-2">{t('Message Sent!', '訊息已發送！')}</h3>
                <p className="text-neutral-500 text-sm">{t("We'll get back to you within 24 hours.", '我們將在24小時內回覆您。')}</p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }} className="mt-6 px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-full hover:bg-neutral-800 transition-colors">
                  {t('Send Another', '再次發送')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t('Name', '姓名')}</label>
                    <input type="text" required value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('Email', '電郵')}</label>
                    <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('Subject', '主題')}</label>
                  <input type="text" required value={form.subject} onChange={e => set('subject', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('Message', '訊息')}</label>
                  <textarea required value={form.message} onChange={e => set('message', e.target.value)} rows={6} className={inputCls} placeholder={t('How can we help you?', '我們如何幫助您？')} />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3.5 bg-neutral-900 text-white font-semibold rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? t('Sending...', '發送中...') : t('Send Message', '發送訊息')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
