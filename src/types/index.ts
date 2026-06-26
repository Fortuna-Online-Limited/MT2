export interface Product {
  id: string;
  name_en: string;
  name_tc: string;
  slug: string;
  description_en: string;
  description_tc: string;
  price: number;
  compare_price: number | null;
  images: string[];
  videos: string[];
  collection_id: string | null;
  tags: string[];
  inventory_qty: number;
  sku: string;
  is_active: boolean;
  is_featured: boolean;
  meta_title_en: string;
  meta_title_tc: string;
  meta_description_en: string;
  meta_description_tc: string;
  created_at: string;
  updated_at: string;
  collection?: Collection;
}

export interface Collection {
  id: string;
  name_en: string;
  name_tc: string;
  slug: string;
  description_en: string;
  description_tc: string;
  image: string;
  is_active: boolean;
  sort_order: number;
  meta_title_en: string;
  meta_title_tc: string;
  meta_description_en: string;
  meta_description_tc: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  session_id: string;
  product_id: string;
  variant_label: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  shipping_address: Address;
  billing_address: Address;
  payment_method: string;
  payment_status: 'unpaid' | 'paid' | 'refunded';
  notes: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string;
  variant_label: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

export interface BlogPost {
  id: string;
  title_en: string;
  title_tc: string;
  slug: string;
  excerpt_en: string;
  excerpt_tc: string;
  content_en: string;
  content_tc: string;
  cover_image: string;
  author: string;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  view_count: number;
  meta_title_en: string;
  meta_title_tc: string;
  meta_description_en: string;
  meta_description_tc: string;
  created_at: string;
  updated_at: string;
}

export interface FaqItem {
  id: string;
  question_en: string;
  question_tc: string;
  answer_en: string;
  answer_tc: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Page {
  id: string;
  slug: string;
  title_en: string;
  title_tc: string;
  content_en: string;
  content_tc: string;
  meta_title_en: string;
  meta_title_tc: string;
  meta_description_en: string;
  meta_description_tc: string;
  updated_at: string;
}

export interface SeoSetting {
  id: string;
  page_key: string;
  meta_title_en: string;
  meta_title_tc: string;
  meta_description_en: string;
  meta_description_tc: string;
  og_image: string;
  keywords_en: string;
  keywords_tc: string;
  canonical_url: string;
  robots: string;
  structured_data: Record<string, unknown>;
  updated_at: string;
}

export interface MediaFile {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'video';
  alt_en: string;
  alt_tc: string;
  file_size: number;
  width: number | null;
  height: number | null;
  mime_type: string;
  tags: string[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  visitor_name: string;
  visitor_email: string;
  sender: 'user' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value_en: string;
  value_tc: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface CustomerProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  default_address: Address;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export type Language = 'en' | 'tc';
