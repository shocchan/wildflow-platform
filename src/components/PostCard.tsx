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
      className="block rounded-xl overflow-hidden border-2 transition-all hover:-translate-y-0.5"
      style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#2D8F4E'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#E2E8E4'; }}
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
        <div className="aspect-video flex items-center justify-center text-4xl" style={{ backgroundColor: '#EDF7EE' }}>
          🌊
        </div>
      )}
      <div className="p-4">
        <div className="flex flex-wrap gap-1 mb-2">
          {post.tags?.map(tag => (
            <span
              key={tag}
              className="text-sm px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#EDF7EE', color: '#2D8F4E' }}
            >
              #{tag}
            </span>
          ))}
        </div>
        <h3 className="font-bold leading-snug line-clamp-2 mb-2" style={{ color: '#1C2A1E', fontSize: '20px', lineHeight: '30px' }}>
          {post.title}
        </h3>
        <p className="text-sm" style={{ color: '#4A6550' }}>{date}</p>
      </div>
    </Link>
  );
}
