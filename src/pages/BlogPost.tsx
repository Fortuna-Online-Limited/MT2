import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, Tag, ArrowLeft, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LangContext';
import type { BlogPost } from '../types';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLang();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (!slug) return;
    supabase.from('mt_blog_posts').select('*').eq('slug', slug).eq('is_published', true).maybeSingle().then(({ data }) => {
      setPost(data);
      setLoading(false);
      if (data) {
        supabase.from('mt_blog_posts').select('*').eq('is_published', true).neq('id', data.id).limit(3).then(({ data: rel }) => setRelated(rel ?? []));
        supabase.from('mt_blog_posts').update({ view_count: (data.view_count ?? 0) + 1 }).eq('id', data.id);
      }
    });
  }, [slug]);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 animate-pulse space-y-4">
      <div className="h-72 bg-neutral-200 rounded-2xl" />
      <div className="h-8 bg-neutral-200 rounded w-3/4" />
      <div className="h-4 bg-neutral-200 rounded" />
      <div className="h-4 bg-neutral-200 rounded w-5/6" />
    </div>
  );

  if (!post) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
      <p className="text-neutral-500">{t('Post not found', '找不到文章')}</p>
      <Link to="/blog" className="mt-4 inline-block text-sm font-medium underline">{t('Back to Blog', '返回博客')}</Link>
    </div>
  );

  const title = lang === 'tc' ? post.title_tc : post.title_en;
  const content = lang === 'tc' ? post.content_tc : post.content_en;

  function formatDate(d: string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString(lang === 'tc' ? 'zh-HK' : 'en-HK', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function renderContent(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold text-neutral-900 mt-8 mb-4">{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-neutral-900 mt-6 mb-3">{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-semibold text-neutral-900 mt-5 mb-2">{line.slice(4)}</h3>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-neutral-900 my-2">{line.slice(2, -2)}</p>;
      if (line.trim() === '') return <div key={i} className="h-3" />;
      return <p key={i} className="text-neutral-700 leading-relaxed">{line}</p>;
    });
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Back */}
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('Back to Blog', '返回博客')}
        </Link>

        {/* Cover */}
        {post.cover_image && (
          <div className="aspect-video rounded-2xl overflow-hidden bg-neutral-100 mb-8">
            <img src={post.cover_image} alt={title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                <Tag className="w-3 h-3" />{tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight mb-4">{title}</h1>

        <div className="flex items-center gap-4 text-sm text-neutral-500 mb-8 pb-6 border-b border-neutral-200">
          <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{post.author}</span>
          {post.published_at && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(post.published_at)}</span>}
          <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{post.view_count} {t('views', '次瀏覽')}</span>
        </div>

        {/* Content */}
        <div className="prose prose-neutral max-w-none space-y-2">
          {renderContent(content || '')}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="py-16 bg-neutral-50 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-8">{t('Related Posts', '相關文章')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map(p => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="group block bg-white border border-neutral-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-neutral-100 overflow-hidden">
                    <img src={p.cover_image || 'https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg?auto=compress&cs=tinysrgb&w=400'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-neutral-900 text-sm line-clamp-2">{lang === 'tc' ? p.title_tc : p.title_en}</h3>
                    <p className="text-xs text-neutral-400 mt-1">{formatDate(p.published_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
