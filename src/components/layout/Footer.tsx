import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { supabase } from '../../lib/supabase';

export default function Footer() {
  const { t, lang } = useLang();
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('mt_site_settings').select('key, value_en, value_tc').then(({ data }) => {
      const map: Record<string, string> = {};
      (data ?? []).forEach(s => { map[s.key] = lang === 'tc' ? s.value_tc : s.value_en; });
      setSettings(map);
    });
  }, [lang]);

  const shopLinks = [
    { label: t('All Products', '所有產品'), href: '/products' },
    { label: t('New Arrivals', '新品上市'), href: '/collections/new-arrivals' },
    { label: t('Best Sellers', '暢銷產品'), href: '/collections/best-sellers' },
    { label: t('Premium Series', '頂級系列'), href: '/collections/premium-series' },
  ];

  const infoLinks = [
    { label: t('About Us', '關於我們'), href: '/about' },
    { label: t('Blog', '博客'), href: '/blog' },
    { label: t('FAQ', '常見問題'), href: '/faq' },
    { label: t('Contact Us', '聯絡我們'), href: '/contact' },
  ];

  const policyLinks = [
    { label: t('Privacy Policy', '私隱政策'), href: '/policy/privacy-policy' },
    { label: t('Terms of Service', '服務條款'), href: '/policy/terms-of-service' },
    { label: t('Shipping Policy', '運送政策'), href: '/policy/shipping-policy' },
    { label: t('Return Policy', '退貨政策'), href: '/faq' },
  ];

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      {/* Newsletter */}
      <div className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white text-xl font-semibold">{t('Stay in the loop', '保持聯繫')}</h3>
              <p className="text-sm mt-1 text-neutral-400">{t('Get exclusive offers and the latest news.', '獲取獨家優惠和最新消息。')}</p>
            </div>
            <form className="flex w-full md:w-auto gap-2 max-w-md" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder={t('Enter your email', '輸入您的電郵')}
                className="flex-1 px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
              />
              <button type="submit" className="px-4 py-2.5 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors flex items-center gap-1">
                {t('Subscribe', '訂閱')} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
                <span className="text-neutral-900 font-bold text-sm tracking-tight">MT</span>
              </div>
              <span className="font-semibold text-white text-lg">MT Brand</span>
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              {settings.site_tagline || t('Premium Quality, Timeless Style', '優質品質，永恆風格')}
            </p>
            <div className="flex items-center gap-3">
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noreferrer" className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-neutral-700 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noreferrer" className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-neutral-700 transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              <a href="#" className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-neutral-700 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">{t('Shop', '購物')}</h4>
            <ul className="space-y-2.5">
              {shopLinks.map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="text-sm text-neutral-400 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">{t('Company', '公司')}</h4>
            <ul className="space-y-2.5">
              {infoLinks.map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="text-sm text-neutral-400 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">{t('Policies', '政策')}</h4>
            <ul className="space-y-2.5">
              {policyLinks.map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="text-sm text-neutral-400 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">{t('Contact', '聯絡')}</h4>
            <ul className="space-y-3">
              {settings.contact_email && (
                <li className="flex items-start gap-2 text-sm text-neutral-400">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <a href={`mailto:${settings.contact_email}`} className="hover:text-white transition-colors">{settings.contact_email}</a>
                </li>
              )}
              {settings.contact_phone && (
                <li className="flex items-start gap-2 text-sm text-neutral-400">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{settings.contact_phone}</span>
                </li>
              )}
              {settings.contact_address && (
                <li className="flex items-start gap-2 text-sm text-neutral-400">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{settings.contact_address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">
            &copy; {new Date().getFullYear()} MT Brand. {t('All rights reserved.', '版權所有。')}
          </p>
          <div className="flex items-center gap-4">
            <img src="https://images.pexels.com/photos/5632400/pexels-photo-5632400.jpeg?auto=compress&cs=tinysrgb&w=1&h=1" alt="" className="hidden" />
            <span className="text-xs text-neutral-500">{t('Secured by SSL', 'SSL 安全保護')}</span>
            <div className="flex gap-2 text-xs text-neutral-600">
              <span>Visa</span>
              <span>Mastercard</span>
              <span>PayPal</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
