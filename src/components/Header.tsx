import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'ホーム' },
  { to: '/blog', label: 'ブログ' },
  { to: '/quiz', label: '野生診断' },
  { to: '/profile', label: 'プロフィール' },
];

export function Header() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}>
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight" style={{ color: '#3b82f6' }}>wild</span>
          <span className="text-2xl font-black tracking-tight text-white">flow</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-sm font-medium transition-colors"
              style={{ color: pathname === to ? '#3b82f6' : '#94a3b8' }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-slate-400"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="メニュー"
        >
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-5 h-0.5 bg-current" />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t px-4 py-3 flex flex-col gap-3" style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}>
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-sm font-medium py-1"
              style={{ color: pathname === to ? '#3b82f6' : '#94a3b8' }}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
