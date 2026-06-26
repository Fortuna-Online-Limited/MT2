import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, FileText, MessageSquare, TrendingUp, DollarSign, Users, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, messages: 0, revenue: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('mt_products').select('*', { count: 'exact', head: true }),
      supabase.from('mt_orders').select('total').eq('payment_status', 'paid'),
      supabase.from('mt_chat_messages').select('*', { count: 'exact', head: true }).eq('sender', 'user').eq('is_read', false),
      supabase.from('mt_orders').select('*', { count: 'exact', head: true }),
    ]).then(([prods, ordersData, msgs, orderCount]) => {
      const revenue = (ordersData.data ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0);
      setStats({
        products: prods.count ?? 0,
        orders: orderCount.count ?? 0,
        messages: msgs.count ?? 0,
        revenue,
      });
    });
  }, []);

  const statCards = [
    { label: 'Total Products', value: stats.products, icon: Package, href: '/admin/products', color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, href: '/admin/orders', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Revenue (Paid)', value: `MOP$${stats.revenue.toLocaleString()}`, icon: DollarSign, href: '/admin/orders', color: 'bg-amber-50 text-amber-600' },
    { label: 'Unread Messages', value: stats.messages, icon: MessageSquare, href: '/admin/chat', color: 'bg-purple-50 text-purple-600' },
  ];

  const quickLinks = [
    { label: 'Add Product', href: '/admin/products?new=1', icon: Package },
    { label: 'SEO Settings', href: '/admin/seo', icon: Eye },
    { label: 'Write Blog Post', href: '/admin/blog?new=1', icon: FileText },
    { label: 'Site Settings', href: '/admin/settings', icon: TrendingUp },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-0.5">MT Brand Admin Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.href} className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-neutral-500">{card.label}</p>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="font-semibold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map(link => {
              const Icon = link.icon;
              return (
                <Link key={link.label} to={link.href} className="flex items-center gap-2.5 p-3 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors">
                  <Icon className="w-4 h-4 text-neutral-500" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="font-semibold text-neutral-900 mb-4">Getting Started</h2>
          <ol className="space-y-2.5">
            {[
              { text: 'Add your first products', href: '/admin/products' },
              { text: 'Configure SEO settings', href: '/admin/seo' },
              { text: 'Update site settings', href: '/admin/settings' },
              { text: 'Create blog posts', href: '/admin/blog' },
              { text: 'Upload media files', href: '/admin/media' },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 bg-neutral-100 rounded-full text-xs text-neutral-500 flex items-center justify-center font-medium flex-shrink-0">{i + 1}</span>
                <Link to={item.href} className="text-sm text-neutral-700 hover:text-neutral-900 hover:underline transition-colors">{item.text}</Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
