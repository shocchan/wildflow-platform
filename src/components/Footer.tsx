import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Footer() {
  const { isAuthenticated } = useAuth();
  return (
    <footer className="border-t py-8" style={{ borderColor: '#E2E8E4', backgroundColor: '#1C2A1E' }}>
      <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <Link to="/" className="flex items-center gap-1">
            <span className="font-black" style={{ color: '#2D8F4E' }}>wild</span>
            <span className="font-black text-white">flow</span>
          </Link>
          <p className="text-xs mt-1" style={{ color: '#6B8F72' }}>野生の身体を、すべての人へ。</p>
        </div>
        <div className="flex gap-6 text-xs" style={{ color: '#6B8F72' }}>
          <Link to="/blog" className="hover:text-white transition-colors">ブログ</Link>
          <Link to="/quiz" className="hover:text-white transition-colors">野生診断</Link>
          <Link to="/profile" className="hover:text-white transition-colors">プロフィール</Link>
          {isAuthenticated && <Link to="/admin" className="hover:text-white transition-colors">管理</Link>}
        </div>
        <p className="text-xs" style={{ color: '#4A6550' }}>© 2026 wildflow</p>
      </div>
    </footer>
  );
}
