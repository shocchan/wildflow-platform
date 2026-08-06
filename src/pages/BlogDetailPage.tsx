import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { fetchPostById } from '../services/posts';
import { track } from '../services/analytics';
import type { Post } from '../types';

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
  return m ? m[1] : null;
}

export function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchPostById(id).then(p => {
      setPost(p);
      if (p) track('view_content', { content_type: 'blog', content_id: id });
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="max-w-3xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-12 space-y-4">
      <div className="skeleton h-8 w-3/4" />
      <div className="skeleton h-4 w-1/4" />
      <div className="skeleton aspect-video rounded-xl" />
      <div className="space-y-2">
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-4" />)}
      </div>
    </div>
  );

  if (!post) return (
    <div className="max-w-3xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-20 text-center">
      <p className="text-6xl mb-4">🌊</p>
      <p className="text-xl font-bold mb-2" style={{ color: '#1C2A1E' }}>記事が見つかりません</p>
      <Link to="/blog" className="hover:underline" style={{ color: '#2D8F4E' }}>← ブログ一覧に戻る</Link>
    </div>
  );

  const date = new Date(post.created_at).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const ytId = post.youtube_url ? youtubeId(post.youtube_url) : null;

  return (
    <main className="max-w-3xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-12">
      <Link
        to="/blog"
        className="text-sm mb-6 inline-flex items-center gap-1 transition-colors hover:opacity-70"
        style={{ color: '#2D8F4E', minHeight: '44px' }}
      >
        ← ブログ一覧
      </Link>

      <div className="flex flex-wrap gap-1 mb-3">
        {post.tags?.map(tag => (
          <span key={tag} className="text-sm px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EDF7EE', color: '#2D8F4E' }}>
            #{tag}
          </span>
        ))}
      </div>

      <h1 className="text-2xl md:text-3xl font-black leading-tight mb-3" style={{ color: '#1C2A1E' }}>{post.title}</h1>
      <p className="text-sm mb-8" style={{ color: '#6B7280' }}>{date}</p>

      {post.thumbnail_url && (
        <img src={post.thumbnail_url} alt={post.title} className="w-full rounded-xl mb-8 object-cover" />
      )}

      {ytId && (
        <div className="mb-8 aspect-video rounded-xl overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            title="YouTube動画"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {post.content_type === 'markdown' ? (
        <div className="prose-wild">
          <ReactMarkdown>{post.body}</ReactMarkdown>
        </div>
      ) : (
        <div
          className="prose-wild"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      )}

      {post.external_url && (
        <div className="mt-10 p-4 rounded-xl border" style={{ borderColor: '#E2E8E4', backgroundColor: '#EDF7EE' }}>
          <p className="text-sm mb-2 font-bold" style={{ color: '#4A6550' }}>関連リンク</p>
          <a
            href={post.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline break-all text-sm"
            style={{ color: '#2D8F4E' }}
          >
            {post.external_url}
          </a>
        </div>
      )}

      <div className="mt-12 pt-8 border-t" style={{ borderColor: '#E2E8E4' }}>
        <Link
          to="/blog"
          className="text-sm transition-colors hover:opacity-70 inline-flex items-center"
          style={{ color: '#2D8F4E', minHeight: '44px' }}
        >
          ← ブログ一覧に戻る
        </Link>
      </div>
    </main>
  );
}
