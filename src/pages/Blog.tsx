import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LangContext';
import type { BlogPost } from '../types';

export default function Blog() {
  const { lang, t } = useLang();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState('');

  useEffect(() => {
    let query = supabase.from('mt_blog_posts').select('*').eq('is_published', true).order('published_at', { ascending: false });
    query.then(({ data }) => { setPosts(data ?? []); setLoading(false); });
  }, []);

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags ?? [])));
  const filtered = tag ? posts.filter(p => p.tags?.includes(tag)) : posts;

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(lang === 'tc' ? 'zh-HK' : 'en-HK', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-neutral-900">{t('Blog & Stories', '博客與故事')}</h1>
        <p className="text-neutral-500 mt-2">{t('The latest news, tips, and stories from MT Brand', '來自MT品牌的最新消息、技巧與故事')}</p>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button onClick={() => setTag('')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${!tag ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}>
            {t('All', '全部')}
          </button>
          {allTags.map(t_ => (
            <button key={t_} onClick={() => setTag(t_ === tag ? '' : t_)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${tag === t_ ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}>
              {t_}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse bg-neutral-200 rounded-2xl h-72" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <>
          {/* Featured post */}
          {!tag && filtered.length > 0 && (
            <Link to={`/blog/${filtered[0].slug}`} className="block group mb-8">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/7] bg-neutral-100">
                <img src={filtered[0].cover_image || 'https://images.pexels.com/photos/5650803/pexels-photo-5650803.jpeg?auto=compress&cs=tinysrgb&w=1280'} alt={lang === 'tc' ? filtered[0].title_tc : filtered[0].title_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/70 via-neutral-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 max-w-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    {filtered[0].tags?.slice(0, 2).map(t => <span key={t} className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">{t}</span>)}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{lang === 'tc' ? filtered[0].title_tc : filtered[0].title_en}</h2>
                  <p className="text-white/70 text-sm line-clamp-2">{lang === 'tc' ? filtered[0].excerpt_tc : filtered[0].excerpt_en}</p>
                  <div className="flex items-center gap-3 mt-3 text-white/60 text-xs">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{filtered[0].author}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(filtered[0].published_at)}</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Post grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(tag ? filtered : filtered.slice(1)).map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group block bg-white border border-neutral-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-neutral-100 overflow-hidden">
                  <img src={post.cover_image || 'https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg?auto=compress&cs=tinysrgb&w=600'} alt={lang === 'tc' ? post.title_tc : post.title_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  {post.tags?.[0] && (
                    <span className="inline-flex items-center gap-1 text-xs text-neutral-500 mb-2"><Tag className="w-3 h-3" />{post.tags[0]}</span>
                  )}
                  <h3 className="font-bold text-neutral-900 text-base leading-snug mb-2 group-hover:text-neutral-600 transition-colors line-clamp-2">
                    {lang === 'tc' ? post.title_tc : post.title_en}
                  </h3>
                  <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{lang === 'tc' ? post.excerpt_tc : post.excerpt_en}</p>
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author}</span>
                    <span>{formatDate(post.published_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-neutral-400">
          <p>{t('No blog posts yet', '暫無博客文章')}</p>
        </div>
      )}
    </div>
  );
}
