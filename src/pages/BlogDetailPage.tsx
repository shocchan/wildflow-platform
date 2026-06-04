import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { fetchPostById } from '../services/posts';
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
    fetchPostById(id).then(setPost).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
      <div className="skeleton h-8 w-3/4" />
      <div className="skeleton h-4 w-1/4" />
      <div className="skeleton aspect-video rounded-xl" />
      <div className="space-y-2">
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-4" />)}
      </div>
    </div>
  );

  if (!post) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-6xl mb-4">🌊</p>
      <p className="text-white text-xl font-bold mb-2">記事が見つかりません</p>
      <Link to="/blog" className="text-blue-400 hover:underline">← ブログ一覧に戻る</Link>
    </div>
  );

  const date = new Date(post.created_at).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const ytId = post.youtube_url ? youtubeId(post.youtube_url) : null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/blog" className="text-sm mb-6 inline-block transition-colors hover:text-blue-300" style={{ color: '#3b82f6' }}>
        ← ブログ一覧
      </Link>

      <div className="flex flex-wrap gap-1 mb-3">
        {post.tags?.map(tag => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1e3a5f', color: '#7dd3fc' }}>
            #{tag}
          </span>
        ))}
      </div>

      <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">{post.title}</h1>
      <p className="text-sm mb-8" style={{ color: '#475569' }}>{date}</p>

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

      <div className="prose-wild">
        <ReactMarkdown>{post.body}</ReactMarkdown>
      </div>

      {post.external_url && (
        <div className="mt-10 p-4 rounded-xl border" style={{ borderColor: '#1e3a5f', backgroundColor: '#111827' }}>
          <p className="text-sm mb-2" style={{ color: '#94a3b8' }}>関連リンク</p>
          <a
            href={post.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline break-all text-sm"
          >
            {post.external_url}
          </a>
        </div>
      )}

      <div className="mt-12 pt-8 border-t" style={{ borderColor: '#1e3a5f' }}>
        <Link to="/blog" className="text-sm transition-colors hover:text-blue-300" style={{ color: '#3b82f6' }}>
          ← ブログ一覧に戻る
        </Link>
      </div>
    </main>
  );
}
