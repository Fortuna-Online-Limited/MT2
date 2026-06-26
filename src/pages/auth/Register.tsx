import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

export default function Register() {
  const { signUp } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPw: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k: keyof typeof form, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPw) { setError(t('Passwords do not match.', '密碼不一致。')); return; }
    if (form.password.length < 6) { setError(t('Password must be at least 6 characters.', '密碼至少需要6個字符。')); return; }
    setLoading(true);
    setError('');
    const { error: err } = await signUp(form.email, form.password, form.firstName, form.lastName);
    if (err) { setError(err.message); setLoading(false); return; }
    navigate('/');
  }

  const inputCls = "w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all";

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block flex-1 bg-neutral-900 relative overflow-hidden">
        <img src="https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=1280" alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-neutral-900 font-bold text-lg">MT</span>
            </div>
            <h2 className="text-3xl font-bold">{t('Join MT Brand', '加入MT品牌')}</h2>
            <p className="text-white/60 mt-2">{t('Create your account today', '立即創建您的帳戶')}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 lg:max-w-md flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-neutral-900 rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">MT</span>
            </div>
            <span className="font-semibold text-lg">MT Brand</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">{t('Create Account', '創建帳戶')}</h1>
          <p className="text-sm text-neutral-500 mb-6">
            {t('Already have an account?', '已有帳戶？')}{' '}
            <Link to="/auth/login" className="text-neutral-900 font-medium hover:underline">{t('Sign in', '登入')}</Link>
          </p>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{t('First Name', '名字')}</label>
                <input type="text" required value={form.firstName} onChange={e => set('firstName', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{t('Last Name', '姓氏')}</label>
                <input type="text" required value={form.lastName} onChange={e => set('lastName', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{t('Email', '電郵')}</label>
              <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{t('Password', '密碼')}</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={e => set('password', e.target.value)} className={inputCls + ' pr-10'} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{t('Confirm Password', '確認密碼')}</label>
              <input type="password" required value={form.confirmPw} onChange={e => set('confirmPw', e.target.value)} className={inputCls} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-neutral-900 text-white font-semibold rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t('Creating Account...', '創建帳戶中...') : t('Create Account', '創建帳戶')}
            </button>
          </form>

          <p className="mt-4 text-xs text-neutral-400 text-center">
            {t('By creating an account, you agree to our', '創建帳戶即表示您同意我們的')}{' '}
            <Link to="/policy/terms-of-service" className="underline">{t('Terms of Service', '服務條款')}</Link>
          </p>
          <div className="mt-4 pt-4 border-t border-neutral-100 text-center">
            <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-700">{t('← Back to Store', '← 返回商店')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
