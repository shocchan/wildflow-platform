import { Link } from 'react-router-dom';
import type { Post } from '../types';

interface Props {
  post: Post;
}

export function PostCard({ post }: Props) {
  const date = new Date(post.created_at).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <Link
      to={`/blog/${post.id}`}
      className="block rounded-xl overflow-hidden border transition-all hover:border-blue-500 hover:-translate-y-0.5"
      style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
    >
      {post.thumbnail_url && (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}
      {!post.thumbnail_url && (
        <div className="aspect-video flex items-center justify-center text-4xl" style={{ backgroundColor: '#1a3a5c' }}>
          🌊
        </div>
      )}
      <div className="p-4">
        <div className="flex flex-wrap gap-1 mb-2">
          {post.tags?.map(tag => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#1e3a5f', color: '#7dd3fc' }}
            >
              #{tag}
            </span>
          ))}
        </div>
        <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 mb-2">
          {post.title}
        </h3>
        <p className="text-xs" style={{ color: '#64748b' }}>{date}</p>
      </div>
    </Link>
  );
}
