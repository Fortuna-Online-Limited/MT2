import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderOpen, FileText, HelpCircle,
  Search, Image, MessageSquare, Settings, ShoppingCart, ChevronLeft,
  LogOut, Menu, X, ExternalLink, Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Import Excel', href: '/admin/import', icon: Upload },
  { label: 'Collections', href: '/admin/collections', icon: FolderOpen },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Blog', href: '/admin/blog', icon: FileText },
  { label: 'FAQ', href: '/admin/faq', icon: HelpCircle },
  { label: 'Pages', href: '/admin/pages', icon: FileText },
  { label: 'SEO', href: '/admin/seo', icon: Search },
  { label: 'Media', href: '/admin/media', icon: Image },
  { label: 'Chat', href: '/admin/chat', icon: MessageSquare },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/auth/login');
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
            <span className="text-neutral-900 font-bold text-sm">MT</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">MT Brand</p>
            <p className="text-neutral-500 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-white/10 text-white font-medium' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-neutral-800 space-y-1">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition-colors">
          <ExternalLink className="w-4 h-4" /> View Store
        </a>
        <div className="px-3 py-2 text-xs text-neutral-500">
          <p className="font-medium text-neutral-400">{profile?.first_name} {profile?.last_name}</p>
          <p>Admin</p>
        </div>
        <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-neutral-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 bg-neutral-900 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-56 bg-neutral-900 flex flex-col">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-neutral-600 hover:text-neutral-900">
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Store
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
