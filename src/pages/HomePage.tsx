import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PostCard } from '../components/PostCard';
import { fetchLatestPosts } from '../services/posts';
import type { Post } from '../types';

export function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestPosts(3).then(setPosts).finally(() => setLoading(false));
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4 text-center">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, #3b82f6 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-sm font-medium tracking-widest uppercase mb-4" style={{ color: '#3b82f6' }}>
            wildflow
          </p>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
            野生の身体を、<br />すべての人へ。
          </h1>
          <p className="text-lg md:text-xl mb-10" style={{ color: '#94a3b8' }}>
            現代に眠る野生の感覚を取り戻す。<br className="hidden md:block" />
            しょっちゃんが届けるフィジカル×ライフスタイルメディア。
          </p>
          <Link
            to="/quiz"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white text-lg transition-all hover:scale-105 hover:shadow-lg"
            style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}
          >
            🦁 野生タイプ診断を受ける
          </Link>
          <p className="mt-4 text-sm" style={{ color: '#475569' }}>無料・30秒で診断完了</p>
        </div>
      </section>

      {/* Latest Posts */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">最新記事</h2>
          <Link to="/blog" className="text-sm transition-colors hover:text-blue-300" style={{ color: '#3b82f6' }}>
            すべて見る →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111827' }}>
                <div className="skeleton aspect-video" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center py-12" style={{ color: '#475569' }}>まだ記事がありません</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </section>

      {/* Quiz CTA */}
      <section className="py-20 px-4" style={{ backgroundColor: '#050a14' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-4xl mb-4">🦁🐆🐒🦥</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            あなたの野生タイプは何型？
          </h2>
          <p className="mb-8" style={{ color: '#94a3b8' }}>
            ライオン・チーター・サル・ナマケモノ。<br />
            5問の質問で、あなたの身体の本質がわかる。
          </p>
          <Link
            to="/quiz"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white border transition-all hover:bg-blue-500"
            style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
          >
            今すぐ診断する →
          </Link>
        </div>
      </section>
    </main>
  );
}
