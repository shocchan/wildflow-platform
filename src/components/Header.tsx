import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'ホーム' },
  { to: '/blog', label: 'ブログ' },
  { to: '/quiz', label: '野生診断' },
  { to: '/lessons', label: 'レッスン' },
  { to: '/profile', label: 'プロフィール' },
];

export function Header() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: '#E2E8E4' }}>
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1">
          <span className="text-2xl font-black tracking-tight" style={{ color: '#2D8F4E' }}>wild</span>
          <span className="text-2xl font-black tracking-tight" style={{ color: '#1C2A1E' }}>flow</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-sm transition-colors"
              style={{
                color: pathname === to ? '#2D8F4E' : '#1C2A1E',
                fontWeight: pathname === to ? 700 : 500,
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          style={{ color: '#1C2A1E' }}
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
        <div className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-3" style={{ borderColor: '#E2E8E4' }}>
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-sm py-1"
              style={{
                color: pathname === to ? '#2D8F4E' : '#1C2A1E',
                fontWeight: pathname === to ? 700 : 500,
              }}
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
