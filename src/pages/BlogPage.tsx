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
      <h1 className="text-3xl font-black text-white mb-2">ブログ</h1>
      <p className="mb-8" style={{ color: '#94a3b8' }}>野生の知恵と身体づくりのヒントを届けます</p>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedTag(null)}
            className="text-xs px-3 py-1 rounded-full border transition-colors"
            style={{
              borderColor: selectedTag === null ? '#3b82f6' : '#1e3a5f',
              color: selectedTag === null ? '#3b82f6' : '#64748b',
              backgroundColor: selectedTag === null ? 'rgba(59,130,246,0.1)' : 'transparent',
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
                borderColor: selectedTag === tag ? '#3b82f6' : '#1e3a5f',
                color: selectedTag === tag ? '#3b82f6' : '#64748b',
                backgroundColor: selectedTag === tag ? 'rgba(59,130,246,0.1)' : 'transparent',
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
            <div key={i} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111827' }}>
              <div className="skeleton aspect-video" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-20" style={{ color: '#475569' }}>記事がありません</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </main>
  );
}
