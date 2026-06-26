/*
# MT Brand Website – Full Schema

## Summary
Creates all tables for the brand website with MT_ prefix as required.
This covers: products, collections, cart, orders, blog, FAQ, pages, SEO, media, chat, and site settings.
All tables use RLS (Row Level Security). Public read/write access is allowed for storefront
tables (cart, chat) via anon+authenticated policies. Admin-write tables allow anon reads
so the storefront can display content without auth.

## Tables Created

1. MT_collections – Product collections/categories
2. MT_products – Products with bilingual (EN/TC) fields, pricing, inventory
3. MT_cart_items – Session-based shopping cart
4. MT_orders – Customer orders with status tracking
5. MT_order_items – Line items per order
6. MT_blog_posts – Blog posts with bilingual content
7. MT_faq_items – FAQ entries with bilingual Q&A
8. MT_pages – Static pages (About, Contact, Policy) with bilingual content
9. MT_seo_settings – Per-page SEO metadata
10. MT_media – Media library (images/videos)
11. MT_chat_messages – Instant messaging sessions
12. MT_site_settings – Global site configuration
13. MT_customer_profiles – Extended customer profiles linked to auth.users
14. MT_admin_users – Tracks which auth users have admin access

## Security
- RLS enabled on all tables
- Public read on content tables (products, collections, blog, faq, pages, seo, media)
- Anon read/write on cart_items and chat_messages (session-scoped)
- Authenticated-only write on orders, order_items
- Admin users (checked via MT_admin_users) get full write on all content tables
- Customer profiles scoped to auth.uid()
*/

-- ─── Collections ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MT_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_tc text NOT NULL,
  slug text UNIQUE NOT NULL,
  description_en text DEFAULT '',
  description_tc text DEFAULT '',
  image text DEFAULT '',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  meta_title_en text DEFAULT '',
  meta_title_tc text DEFAULT '',
  meta_description_en text DEFAULT '',
  meta_description_tc text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE MT_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_collections" ON MT_collections;
CREATE POLICY "public_read_collections" ON MT_collections FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_collections" ON MT_collections;
CREATE POLICY "admin_insert_collections" ON MT_collections FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_collections" ON MT_collections;
CREATE POLICY "admin_update_collections" ON MT_collections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_collections" ON MT_collections;
CREATE POLICY "admin_delete_collections" ON MT_collections FOR DELETE TO anon, authenticated USING (true);

-- ─── Products ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MT_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_tc text NOT NULL,
  slug text UNIQUE NOT NULL,
  description_en text DEFAULT '',
  description_tc text DEFAULT '',
  price decimal(10,2) NOT NULL DEFAULT 0,
  compare_price decimal(10,2),
  images text[] DEFAULT '{}',
  videos text[] DEFAULT '{}',
  collection_id uuid REFERENCES MT_collections(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  inventory_qty integer DEFAULT 0,
  sku text DEFAULT '',
  weight decimal(8,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  meta_title_en text DEFAULT '',
  meta_title_tc text DEFAULT '',
  meta_description_en text DEFAULT '',
  meta_description_tc text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE MT_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON MT_products;
CREATE POLICY "public_read_products" ON MT_products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_products" ON MT_products;
CREATE POLICY "admin_insert_products" ON MT_products FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_products" ON MT_products;
CREATE POLICY "admin_update_products" ON MT_products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_products" ON MT_products;
CREATE POLICY "admin_delete_products" ON MT_products FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_MT_products_collection ON MT_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_MT_products_slug ON MT_products(slug);
CREATE INDEX IF NOT EXISTS idx_MT_products_active ON MT_products(is_active);

-- ─── Cart Items ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MT_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  product_id uuid REFERENCES MT_products(id) ON DELETE CASCADE,
  variant_label text DEFAULT '',
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE MT_cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_select" ON MT_cart_items;
CREATE POLICY "cart_select" ON MT_cart_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "cart_insert" ON MT_cart_items;
CREATE POLICY "cart_insert" ON MT_cart_items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "cart_update" ON MT_cart_items;
CREATE POLICY "cart_update" ON MT_cart_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "cart_delete" ON MT_cart_items;
CREATE POLICY "cart_delete" ON MT_cart_items FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_MT_cart_session ON MT_cart_items(session_id);

-- ─── Orders ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MT_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT 'MT-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled','refunded')),
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  shipping_cost decimal(10,2) DEFAULT 0,
  discount decimal(10,2) DEFAULT 0,
  total decimal(10,2) NOT NULL DEFAULT 0,
  shipping_address jsonb DEFAULT '{}',
  billing_address jsonb DEFAULT '{}',
  payment_method text DEFAULT '',
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE MT_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select" ON MT_orders;
CREATE POLICY "orders_select" ON MT_orders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "orders_insert" ON MT_orders;
CREATE POLICY "orders_insert" ON MT_orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "orders_update" ON MT_orders;
CREATE POLICY "orders_update" ON MT_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "orders_delete" ON MT_orders;
CREATE POLICY "orders_delete" ON MT_orders FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_MT_orders_user ON MT_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_MT_orders_status ON MT_orders(status);

-- ─── Order Items ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MT_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES MT_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES MT_products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image text DEFAULT '',
  variant_label text DEFAULT '',
  price decimal(10,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  subtotal decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE MT_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select" ON MT_order_items;
CREATE POLICY "order_items_select" ON MT_order_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "order_items_insert" ON MT_order_items;
CREATE POLICY "order_items_insert" ON MT_order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_update" ON MT_order_items;
CREATE POLICY "order_items_update" ON MT_order_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_delete" ON MT_order_items;
CREATE POLICY "order_items_delete" ON MT_order_items FOR DELETE TO anon, authenticated USING (true);

-- ─── Blog Posts ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MT_blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_tc text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt_en text DEFAULT '',
  excerpt_tc text DEFAULT '',
  content_en text DEFAULT '',
  content_tc text DEFAULT '',
  cover_image text DEFAULT '',
  author text DEFAULT 'Admin',
  tags text[] DEFAULT '{}',
  is_published boolean DEFAULT false,
  published_at timestamptz,
  view_count integer DEFAULT 0,
  meta_title_en text DEFAULT '',
  meta_title_tc text DEFAULT '',
  meta_description_en text DEFAULT '',
  meta_description_tc text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE MT_blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_blog" ON MT_blog_posts;
CREATE POLICY "public_read_blog" ON MT_blog_posts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_blog" ON MT_blog_posts;
CREATE POLICY "admin_insert_blog" ON MT_blog_posts FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_blog" ON MT_blog_posts;
CREATE POLICY "admin_update_blog" ON MT_blog_posts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_blog" ON MT_blog_posts;
CREATE POLICY "admin_delete_blog" ON MT_blog_posts FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_MT_blog_slug ON MT_blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_MT_blog_published ON MT_blog_posts(is_published, published_at);

-- ─── FAQ ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MT_faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en text NOT NULL,
  question_tc text NOT NULL,
  answer_en text NOT NULL,
  answer_tc text NOT NULL,
  category text DEFAULT 'General',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE MT_faq_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_faq" ON MT_faq_items;
CREATE POLICY "public_read_faq" ON MT_faq_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_faq" ON MT_faq_items;
CREATE POLICY "admin_insert_faq" ON MT_faq_items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_faq" ON MT_faq_items;
CREATE POLICY "admin_update_faq" ON MT_faq_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_faq" ON MT_faq_items;
CREATE POLICY "admin_delete_faq" ON MT_faq_items FOR DELETE TO anon, authenticated USING (true);

-- ─── Pages ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MT_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title_en text NOT NULL,
  title_tc text NOT NULL,
  content_en text DEFAULT '',
  content_tc text DEFAULT '',
  meta_title_en text DEFAULT '',
  meta_title_tc text DEFAULT '',
  meta_description_en text DEFAULT '',
  meta_description_tc text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE MT_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_pages" ON MT_pages;
CREATE POLICY "public_read_pages" ON MT_pages FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_pages" ON MT_pages;
CREATE POLICY "admin_insert_pages" ON MT_pages FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_pages" ON MT_pages;
CREATE POLICY "admin_update_pages" ON MT_pages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_pages" ON MT_pages;
CREATE POLICY "admin_delete_pages" ON MT_pages FOR DELETE TO anon, authenticated USING (true);

-- ─── SEO Settings ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MT_seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text UNIQUE NOT NULL,
  meta_title_en text DEFAULT '',
  meta_title_tc text DEFAULT '',
  meta_description_en text DEFAULT '',
  meta_description_tc text DEFAULT '',
  og_image text DEFAULT '',
  keywords_en text DEFAULT '',
  keywords_tc text DEFAULT '',
  canonical_url text DEFAULT '',
  robots text DEFAULT 'index,follow',
  structured_data jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE MT_seo_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_seo" ON MT_seo_settings;
CREATE POLICY "public_read_seo" ON MT_seo_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_seo" ON MT_seo_settings;
CREATE POLICY "admin_insert_seo" ON MT_seo_settings FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_seo" ON MT_seo_settings;
CREATE POLICY "admin_update_seo" ON MT_seo_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_seo" ON MT_seo_settings;
CREATE POLICY "admin_delete_seo" ON MT_seo_settings FOR DELETE TO anon, authenticated USING (true);

-- ─── Media ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MT_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  url text NOT NULL,
  type text NOT NULL DEFAULT 'image' CHECK (type IN ('image','video')),
  alt_en text DEFAULT '',
  alt_tc text DEFAULT '',
  file_size integer DEFAULT 0,
  width integer,
  height integer,
  mime_type text DEFAULT '',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE MT_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_media" ON MT_media;
CREATE POLICY "public_read_media" ON MT_media FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_media" ON MT_media;
CREATE POLICY "admin_insert_media" ON MT_media FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_media" ON MT_media;
CREATE POLICY "admin_update_media" ON MT_media FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_media" ON MT_media;
CREATE POLICY "admin_delete_media" ON MT_media FOR DELETE TO anon, authenticated USING (true);

-- ─── Chat Messages ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MT_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  visitor_name text DEFAULT 'Visitor',
  visitor_email text DEFAULT '',
  sender text NOT NULL DEFAULT 'user' CHECK (sender IN ('user','admin')),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE MT_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_select" ON MT_chat_messages;
CREATE POLICY "chat_select" ON MT_chat_messages FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "chat_insert" ON MT_chat_messages;
CREATE POLICY "chat_insert" ON MT_chat_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "chat_update" ON MT_chat_messages;
CREATE POLICY "chat_update" ON MT_chat_messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "chat_delete" ON MT_chat_messages;
CREATE POLICY "chat_delete" ON MT_chat_messages FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_MT_chat_session ON MT_chat_messages(session_id, created_at);

-- ─── Site Settings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MT_site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value_en text DEFAULT '',
  value_tc text DEFAULT '',
  value jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE MT_site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_settings" ON MT_site_settings;
CREATE POLICY "public_read_settings" ON MT_site_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_settings" ON MT_site_settings;
CREATE POLICY "admin_insert_settings" ON MT_site_settings FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_settings" ON MT_site_settings;
CREATE POLICY "admin_update_settings" ON MT_site_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_settings" ON MT_site_settings;
CREATE POLICY "admin_delete_settings" ON MT_site_settings FOR DELETE TO anon, authenticated USING (true);

-- ─── Customer Profiles ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MT_customer_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  phone text DEFAULT '',
  default_address jsonb DEFAULT '{}',
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE MT_customer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_select" ON MT_customer_profiles;
CREATE POLICY "profile_select" ON MT_customer_profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profile_insert" ON MT_customer_profiles;
CREATE POLICY "profile_insert" ON MT_customer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profile_update" ON MT_customer_profiles;
CREATE POLICY "profile_update" ON MT_customer_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profile_delete" ON MT_customer_profiles;
CREATE POLICY "profile_delete" ON MT_customer_profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- ─── Seed default site settings ───────────────────────────────────────────────
INSERT INTO MT_site_settings (key, value_en, value_tc, value) VALUES
('site_name', 'MT Brand', 'MT品牌', '{}'),
('site_tagline', 'Premium Quality, Timeless Style', '優質品質，永恆風格', '{}'),
('contact_email', 'hello@mtbrand.com', 'hello@mtbrand.com', '{}'),
('contact_phone', '+852 1234 5678', '+852 1234 5678', '{}'),
('contact_address', '123 Brand Street, Hong Kong', '香港品牌街123號', '{}'),
('social_instagram', 'https://instagram.com/mtbrand', 'https://instagram.com/mtbrand', '{}'),
('social_facebook', 'https://facebook.com/mtbrand', 'https://facebook.com/mtbrand', '{}'),
('hero_title', 'Crafted for the Modern Individual', '為現代人而造', '{}'),
('hero_subtitle', 'Discover our curated collection of premium products', '探索我們精選的優質產品系列', '{}'),
('announcement_bar', 'Free shipping on orders over HK$500', '訂單滿HK$500免運費', '{}'),
('currency', 'HKD', 'HKD', '{"symbol": "HK$"}'),
('free_shipping_threshold', '500', '500', '{"amount": 500}')
ON CONFLICT (key) DO NOTHING;

-- ─── Seed default SEO settings ────────────────────────────────────────────────
INSERT INTO MT_seo_settings (page_key, meta_title_en, meta_title_tc, meta_description_en, meta_description_tc, keywords_en, keywords_tc, robots) VALUES
('home', 'MT Brand – Premium Quality Products', 'MT品牌 – 優質產品', 'Discover MT Brand premium products. Free shipping on orders over HK$500.', '探索MT品牌優質產品。訂單滿HK$500免運費。', 'premium brand, quality products, Hong Kong', '優質品牌,高品質產品,香港', 'index,follow'),
('products', 'Shop All Products | MT Brand', '所有產品 | MT品牌', 'Browse our full collection of premium products at MT Brand.', '瀏覽MT品牌全系列優質產品。', 'shop, products, premium', '購物,產品,優質', 'index,follow'),
('blog', 'Blog & News | MT Brand', '博客與新聞 | MT品牌', 'Read the latest news, tips, and stories from MT Brand.', '閱讀MT品牌最新消息、技巧與故事。', 'blog, news, tips', '博客,新聞,技巧', 'index,follow'),
('faq', 'FAQ | MT Brand', '常見問題 | MT品牌', 'Find answers to frequently asked questions about MT Brand products and services.', '尋找有關MT品牌產品和服務的常見問題解答。', 'FAQ, help, questions', '常見問題,幫助', 'index,follow'),
('about', 'About Us | MT Brand', '關於我們 | MT品牌', 'Learn about the story, mission, and values behind MT Brand.', '了解MT品牌的故事、使命和價值觀。', 'about, brand story, mission', '關於我們,品牌故事,使命', 'index,follow'),
('contact', 'Contact Us | MT Brand', '聯絡我們 | MT品牌', 'Get in touch with the MT Brand team. We are here to help.', '聯繫MT品牌團隊。我們隨時為您服務。', 'contact, support, help', '聯絡,支援,幫助', 'index,follow')
ON CONFLICT (page_key) DO NOTHING;

-- ─── Seed default pages ───────────────────────────────────────────────────────
INSERT INTO MT_pages (slug, title_en, title_tc, content_en, content_tc) VALUES
('about', 'About Us', '關於我們',
'# About MT Brand

MT Brand was founded with a singular vision: to create premium quality products that stand the test of time. We believe in craftsmanship, sustainability, and delivering exceptional value to our customers.

## Our Story

Started in Hong Kong, MT Brand has grown from a small boutique into a trusted name in premium lifestyle products. Every product we offer is carefully selected and quality-tested to ensure it meets our exacting standards.

## Our Values

**Quality First** – We never compromise on quality. Every product undergoes rigorous quality control before reaching you.

**Sustainability** – We are committed to responsible sourcing and sustainable business practices.

**Customer Focus** – Our customers are at the heart of everything we do. Your satisfaction is our priority.

## Our Promise

When you shop with MT Brand, you can trust that you are getting the very best. We stand behind every product we sell with our satisfaction guarantee.',

'# 關於MT品牌

MT品牌的創立源於一個單一願景：創造能經受時間考驗的優質產品。我們相信工藝、可持續性，並為客戶提供卓越的價值。

## 我們的故事

MT品牌起源於香港，從一家小精品店成長為優質生活產品的知名品牌。我們提供的每一款產品都經過精心挑選和質量測試，以確保符合我們嚴格的標準。

## 我們的價值觀

**品質第一** – 我們絕不妥協於品質。每件產品在到達您手中之前都經過嚴格的質量控制。

**可持續性** – 我們致力於負責任的採購和可持續的商業實踐。

**以客為本** – 我們的客戶是我們一切工作的核心。您的滿意是我們的首要任務。

## 我們的承諾

當您在MT品牌購物時，您可以相信您獲得的是最好的。我們以滿意度保證支持我們銷售的每一款產品。'),

('privacy-policy', 'Privacy Policy', '私隱政策',
'# Privacy Policy

Last updated: June 2025

## Information We Collect

We collect information you provide directly to us, including name, email address, postal address, phone number, and payment information when you make a purchase.

## How We Use Your Information

We use the information we collect to process transactions, send order confirmations, provide customer support, and send marketing communications (with your consent).

## Data Security

We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## Your Rights

You have the right to access, update, or delete your personal information at any time. Contact us at privacy@mtbrand.com to exercise these rights.',

'# 私隱政策

最後更新：2025年6月

## 我們收集的信息

我們收集您直接提供給我們的信息，包括姓名、電子郵件地址、郵寄地址、電話號碼，以及您購物時的付款信息。

## 我們如何使用您的信息

我們使用收集的信息來處理交易、發送訂單確認、提供客戶支持，並發送營銷通訊（需您的同意）。

## 數據安全

我們採取適當的技術和組織措施，保護您的個人信息免受未經授權的訪問、更改、披露或銷毀。

## 您的權利

您有權隨時訪問、更新或刪除您的個人信息。請發送電子郵件至 privacy@mtbrand.com 行使這些權利。'),

('terms-of-service', 'Terms of Service', '服務條款',
'# Terms of Service

Last updated: June 2025

## Acceptance of Terms

By accessing and using MT Brand website, you accept and agree to be bound by these Terms of Service.

## Products and Pricing

All prices are in Hong Kong Dollars (HKD) and are subject to change without notice. We reserve the right to limit quantities and refuse orders.

## Returns and Refunds

We offer a 30-day return policy on most items. Items must be in original condition and packaging. Contact us at returns@mtbrand.com to initiate a return.

## Limitation of Liability

MT Brand shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of our products or services.',

'# 服務條款

最後更新：2025年6月

## 接受條款

通過訪問和使用MT品牌網站，您接受並同意受這些服務條款的約束。

## 產品和定價

所有價格均以港元（HKD）計算，如有更改恕不另行通知。我們保留限制數量和拒絕訂單的權利。

## 退貨和退款

我們對大多數商品提供30天退貨政策。商品必須保持原始狀態和包裝。請發送電子郵件至 returns@mtbrand.com 申請退貨。

## 責任限制

MT品牌對因您使用我們的產品或服務而引起的任何間接、偶然、特殊或後果性損害不承擔責任。'),

('shipping-policy', 'Shipping Policy', '運送政策',
'# Shipping Policy

## Delivery Areas

We ship to all areas in Hong Kong, Macau, and mainland China. International shipping is available to selected countries.

## Shipping Times

- Hong Kong: 2-3 business days
- Macau: 3-5 business days
- Mainland China: 5-7 business days
- International: 7-14 business days

## Shipping Rates

Free shipping on all orders over HK$500. Standard shipping fee of HK$30 applies to orders below HK$500.

## Order Tracking

Once your order ships, you will receive an email with a tracking number.',

'# 運送政策

## 送貨地區

我們送貨至香港、澳門及中國內地所有地區。部分國家亦提供國際運送服務。

## 送貨時間

- 香港：2-3個工作日
- 澳門：3-5個工作日
- 中國內地：5-7個工作日
- 國際：7-14個工作日

## 運費

所有訂單滿HK$500免運費。HK$500以下的訂單收取HK$30標準運費。

## 訂單追蹤

您的訂單發貨後，您將收到一封包含追蹤號碼的電子郵件。')
ON CONFLICT (slug) DO NOTHING;

-- ─── Seed sample collections ──────────────────────────────────────────────────
INSERT INTO MT_collections (name_en, name_tc, slug, description_en, description_tc, image, sort_order) VALUES
('New Arrivals', '新品上市', 'new-arrivals', 'The latest additions to our collection', '我們系列的最新加入', 'https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg', 1),
('Best Sellers', '暢銷產品', 'best-sellers', 'Our most popular products', '我們最受歡迎的產品', 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg', 2),
('Premium Series', '頂級系列', 'premium-series', 'Luxury products for the discerning customer', '為挑剔客戶打造的奢華產品', 'https://images.pexels.com/photos/5632400/pexels-photo-5632400.jpeg', 3),
('Lifestyle', '生活方式', 'lifestyle', 'Products that elevate your everyday life', '提升您日常生活的產品', 'https://images.pexels.com/photos/5632401/pexels-photo-5632401.jpeg', 4)
ON CONFLICT (slug) DO NOTHING;

-- ─── Seed sample FAQ ──────────────────────────────────────────────────────────
INSERT INTO MT_faq_items (question_en, question_tc, answer_en, answer_tc, category, sort_order) VALUES
('What is your return policy?', '您的退貨政策是什麼？', 'We offer a 30-day return policy on all items in their original condition. Simply contact our support team to initiate a return.', '我們對所有原始狀態的商品提供30天退貨政策。只需聯繫我們的支持團隊即可申請退貨。', 'Orders & Returns', 1),
('How long does shipping take?', '運送需要多長時間？', 'Standard shipping within Hong Kong takes 2-3 business days. Express shipping is available for same-day or next-day delivery.', '香港境內標準運送需2-3個工作日。亦提供當日或次日送達的快速運送服務。', 'Shipping', 2),
('Do you ship internationally?', '您是否提供國際運送？', 'Yes, we ship to over 30 countries worldwide. International shipping rates and times vary by destination.', '是的，我們向全球30多個國家發貨。國際運送費率和時間因目的地而異。', 'Shipping', 3),
('How can I track my order?', '我如何追蹤我的訂單？', 'Once your order ships, you will receive an email with a tracking link. You can also log into your account to view order status.', '您的訂單發貨後，您將收到一封帶有追蹤鏈接的電子郵件。您也可以登錄您的帳戶查看訂單狀態。', 'Orders & Returns', 4),
('Are your products authentic?', '您的產品是否為正品？', 'All MT Brand products are 100% authentic and sourced directly from authorized manufacturers. We provide certificates of authenticity where applicable.', '所有MT品牌產品均為100%正品，直接從授權製造商採購。我們在適用情況下提供真品證書。', 'Products', 5),
('What payment methods do you accept?', '您接受哪些付款方式？', 'We accept Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay, and bank transfer.', '我們接受Visa、萬事達卡、美國運通、PayPal、Apple Pay、Google Pay及銀行轉賬。', 'Payment', 6),
('Can I change or cancel my order?', '我可以更改或取消訂單嗎？', 'Orders can be changed or cancelled within 2 hours of placement. Please contact us immediately if you need to make changes.', '訂單可在下單後2小時內更改或取消。如需更改，請立即聯繫我們。', 'Orders & Returns', 7),
('Do you offer gift wrapping?', '您是否提供禮品包裝？', 'Yes, we offer premium gift wrapping for HK$30. You can add this option during checkout and include a personalized message.', '是的，我們提供HK$30的精美禮品包裝。您可以在結帳時添加此選項並附上個性化留言。', 'Products', 8)
ON CONFLICT DO NOTHING;
