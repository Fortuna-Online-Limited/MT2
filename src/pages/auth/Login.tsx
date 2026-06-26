import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

export default function Login() {
  const { signIn } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await signIn(email, password);
    if (err) { setError(t('Invalid email or password.', '電郵或密碼無效。')); setLoading(false); return; }
    navigate('/');
  }

  const inputCls = "w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all";

  return (
    <div className="min-h-screen flex">
      {/* Left image */}
      <div className="hidden lg:block flex-1 bg-neutral-900 relative overflow-hidden">
        <img src="https://images.pexels.com/photos/5650803/pexels-photo-5650803.jpeg?auto=compress&cs=tinysrgb&w=1280" alt="" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-neutral-900 font-bold text-lg">MT</span>
            </div>
            <h2 className="text-3xl font-bold">{t('Welcome back', '歡迎回來')}</h2>
            <p className="text-white/60 mt-2">{t('Sign in to your account', '登入您的帳戶')}</p>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-neutral-900 rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">MT</span>
            </div>
            <span className="font-semibold text-lg">MT Brand</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">{t('Sign In', '登入')}</h1>
          <p className="text-sm text-neutral-500 mb-6">
            {t("Don't have an account?", '還沒有帳戶？')}{' '}
            <Link to="/auth/register" className="text-neutral-900 font-medium hover:underline">{t('Sign up', '立即註冊')}</Link>
          </p>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{t('Email', '電郵')}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{t('Password', '密碼')}</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className={inputCls + ' pr-10'} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-neutral-900 text-white font-semibold rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t('Signing in...', '登入中...') : t('Sign In', '登入')}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
            <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-700">{t('← Back to Store', '← 返回商店')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
