import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, User, Search, Menu, X, ChevronDown,
  Globe, Heart, Phone
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { supabase } from '../../lib/supabase';
import type { Collection } from '../../types';

export default function Header() {
  const { itemCount } = useCart();
  const { user, signOut } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    supabase.from('mt_collections').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      setCollections(data ?? []);
    });
    supabase.from('mt_site_settings').select('*').eq('key', 'announcement_bar').maybeSingle().then(({ data }) => {
      if (data) setAnnouncement(lang === 'tc' ? data.value_tc : data.value_en);
    });
  }, [lang]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  const navLinks = [
    { label: t('Home', '首頁'), href: '/' },
    { label: t('Products', '所有產品'), href: '/products' },
    { label: t('Collections', '系列'), href: '/collections', hasDropdown: true },
    { label: t('Blog', '博客'), href: '/blog' },
    { label: t('About', '關於我們'), href: '/about' },
    { label: t('Contact', '聯絡'), href: '/contact' },
  ];

  return (
    <>
      {/* Announcement bar */}
      {announcement && (
        <div className="bg-neutral-900 text-white text-xs text-center py-2 px-4 tracking-wide">
          <Phone className="inline w-3 h-3 mr-1" />{announcement}
        </div>
      )}

      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-8 h-8 bg-neutral-900 rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-sm tracking-tight">MT</span>
              </div>
              <span className="font-semibold text-lg tracking-tight text-neutral-900 hidden sm:block">
                MT Brand
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map(link => (
                <div key={link.href} className="relative group">
                  {link.hasDropdown ? (
                    <button
                      className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
                      onMouseEnter={() => setCollectionsOpen(true)}
                      onMouseLeave={() => setCollectionsOpen(false)}
                    >
                      {link.label} <ChevronDown className="w-3 h-3" />
                    </button>
                  ) : (
                    <Link to={link.href} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors block">
                      {link.label}
                    </Link>
                  )}
                  {link.hasDropdown && collectionsOpen && (
                    <div
                      className="absolute top-full left-0 w-56 bg-white shadow-xl border border-neutral-100 rounded-lg py-2 mt-1"
                      onMouseEnter={() => setCollectionsOpen(true)}
                      onMouseLeave={() => setCollectionsOpen(false)}
                    >
                      {collections.map(c => (
                        <Link
                          key={c.id}
                          to={`/collections/${c.slug}`}
                          className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                          onClick={() => setCollectionsOpen(false)}
                        >
                          {lang === 'tc' ? c.name_tc : c.name_en}
                        </Link>
                      ))}
                      <div className="border-t border-neutral-100 mt-1 pt-1">
                        <Link to="/collections" className="block px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50" onClick={() => setCollectionsOpen(false)}>
                          {t('View All Collections', '查看所有系列')}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-1">
              {/* Language toggle */}
              <button
                onClick={() => setLang(lang === 'en' ? 'tc' : 'en')}
                className="flex items-center gap-1 px-2 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                title="Switch Language"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{lang === 'en' ? '中文' : 'EN'}</span>
              </button>

              {/* Search */}
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors">
                <Search className="w-5 h-5" />
              </button>

              {/* Account */}
              {user ? (
                <div className="relative group">
                  <button className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors">
                    <User className="w-5 h-5" />
                  </button>
                  <div className="absolute right-0 top-full w-44 bg-white shadow-xl border border-neutral-100 rounded-lg py-2 hidden group-hover:block">
                    <Link to="/account" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">{t('My Account', '我的帳戶')}</Link>
                    <Link to="/account/orders" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">{t('Orders', '訂單')}</Link>
                    <button onClick={signOut} className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">{t('Sign Out', '登出')}</button>
                  </div>
                </div>
              ) : (
                <Link to="/auth/login" className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors">
                  <User className="w-5 h-5" />
                </Link>
              )}

              {/* Wishlist placeholder */}
              <button className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors hidden sm:block">
                <Heart className="w-5 h-5" />
              </button>

              {/* Cart */}
              <Link to="/cart" className="relative p-2 text-neutral-600 hover:text-neutral-900 transition-colors">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-neutral-900 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {/* Mobile menu button */}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-neutral-600 hover:text-neutral-900 transition-colors ml-1">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Search bar */}
          {searchOpen && (
            <div className="border-t border-neutral-100 py-3">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('Search products...', '搜尋產品...')}
                  className="flex-1 outline-none text-sm text-neutral-900 placeholder-neutral-400"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-neutral-100 bg-white">
            <nav className="px-4 py-2 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block py-2.5 text-sm font-medium text-neutral-700 border-b border-neutral-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {collections.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider py-2">{t('Collections', '系列')}</p>
                  {collections.map(c => (
                    <Link
                      key={c.id}
                      to={`/collections/${c.slug}`}
                      className="block py-2 text-sm text-neutral-600 pl-3"
                      onClick={() => setMobileOpen(false)}
                    >
                      {lang === 'tc' ? c.name_tc : c.name_en}
                    </Link>
                  ))}
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
