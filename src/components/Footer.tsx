import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t mt-16 py-8" style={{ borderColor: '#1e3a5f', backgroundColor: '#050a14' }}>
      <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <Link to="/" className="flex items-center gap-1">
            <span className="font-black" style={{ color: '#3b82f6' }}>wild</span>
            <span className="font-black text-white">flow</span>
          </Link>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>野生の身体を、すべての人へ。</p>
        </div>
        <div className="flex gap-6 text-xs" style={{ color: '#475569' }}>
          <Link to="/blog" className="hover:text-blue-400 transition-colors">ブログ</Link>
          <Link to="/quiz" className="hover:text-blue-400 transition-colors">野生診断</Link>
          <Link to="/profile" className="hover:text-blue-400 transition-colors">プロフィール</Link>
          <Link to="/admin" className="hover:text-blue-400 transition-colors">管理</Link>
        </div>
        <p className="text-xs" style={{ color: '#334155' }}>© 2026 wildflow</p>
      </div>
    </footer>
  );
}
