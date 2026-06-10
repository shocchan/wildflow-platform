import { useEffect, useState } from 'react';
import { PostCard } from '../components/PostCard';
import { fetchPublishedPosts } from '../services/posts';
import type { Post } from '../types';

export function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    fetchPublishedPosts().then(setPosts).finally(() => setLoading(false));
  }, []);

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));
  const filtered = selectedTag ? posts.filter(p => p.tags?.includes(selectedTag)) : posts;

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="font-black mb-2" style={{ color: '#1C2A1E', fontSize: '32px' }}>ブログ</h1>
      <p className="mb-8" style={{ color: '#4A6550', fontSize: '18px', lineHeight: '1.8' }}>野生の知恵と身体づくりのヒントを届けます</p>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedTag(null)}
            className="text-xs px-3 py-1 rounded-full border transition-colors"
            style={{
              borderColor: selectedTag === null ? '#2D8F4E' : '#E2E8E4',
              color: selectedTag === null ? '#2D8F4E' : '#4A6550',
              backgroundColor: selectedTag === null ? '#EDF7EE' : 'transparent',
            }}
          >
            すべて
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className="text-xs px-3 py-1 rounded-full border transition-colors"
              style={{
                borderColor: selectedTag === tag ? '#2D8F4E' : '#E2E8E4',
                color: selectedTag === tag ? '#2D8F4E' : '#4A6550',
                backgroundColor: selectedTag === tag ? '#EDF7EE' : 'transparent',
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
              <div className="skeleton aspect-video" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-6xl mb-6">🌿</p>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#1C2A1E' }}>コンテンツ準備中です</h2>
          <p className="leading-relaxed mb-8 max-w-sm" style={{ color: '#4A6550', fontSize: '16px' }}>
            野生の知恵と身体づくりのヒントをお届けする予定です。<br />
            まずは野生タイプ診断を受けてみてください！
          </p>
          <a
            href="/quiz"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all hover:scale-105"
            style={{ backgroundColor: '#2D8F4E', minHeight: '56px', fontSize: '18px' }}
          >
            野生タイプ診断を受ける →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map(post => <PostCard key={post.id} post={post} />)}
          {!selectedTag && filtered.length < 3 && Array.from({ length: 3 - filtered.length }).map((_, i) => (
            <div
              key={`coming-${i}`}
              className="rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2 min-h-[180px]"
              style={{ border: '1px dashed #E2E8E4', opacity: 0.6 }}
            >
              <p className="text-2xl">🔜</p>
              <p className="text-sm font-bold" style={{ color: '#4A6550' }}>近日公開予定</p>
              <p className="text-xs" style={{ color: '#6B8F72' }}>新しい記事を準備中です</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
