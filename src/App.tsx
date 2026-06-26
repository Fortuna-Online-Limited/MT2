import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LangProvider } from './context/LangContext';
import Layout from './components/layout/Layout';
import AdminLayout from './components/admin/AdminLayout';

// Public pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import FAQ from './pages/FAQ';
import About from './pages/About';
import Contact from './pages/Contact';
import Policy from './pages/Policy';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCollections from './pages/admin/AdminCollections';
import AdminOrders from './pages/admin/AdminOrders';
import AdminBlog from './pages/admin/AdminBlog';
import AdminFAQ from './pages/admin/AdminFAQ';
import AdminPages from './pages/admin/AdminPages';
import AdminSEO from './pages/admin/AdminSEO';
import AdminMedia from './pages/admin/AdminMedia';
import AdminChat from './pages/admin/AdminChat';
import AdminSettings from './pages/admin/AdminSettings';
import AdminImport from './pages/admin/AdminImport';

function AdminGuard() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/auth/login" replace />;
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

function PublicLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Public store */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/collections/:slug" element={<CollectionDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/policy/:slug" element={<Policy />} />
              </Route>

              {/* Auth (no header/footer) */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />

              {/* Admin */}
              <Route element={<AdminGuard />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/collections" element={<AdminCollections />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/blog" element={<AdminBlog />} />
                <Route path="/admin/faq" element={<AdminFAQ />} />
                <Route path="/admin/pages" element={<AdminPages />} />
                <Route path="/admin/seo" element={<AdminSEO />} />
                <Route path="/admin/media" element={<AdminMedia />} />
                <Route path="/admin/chat" element={<AdminChat />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/import" element={<AdminImport />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  );
}
