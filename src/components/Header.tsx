import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang, langPath } from '../i18n/lang';
import { MESSAGES } from '../i18n/messages';
import { LangToggle } from './LangToggle';

export function Header() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const lang = useLang();
  const t = MESSAGES[lang].nav;

  // 2026-09-18 バドミントン・ピボット: 入口2つをナビに出す。静的HTMLは SPA ルーティングを通さず通常遷移させる
  // 2026-09-19: 言語切替。静的ページは zh のとき /zh/ 配下へ（langPath）
  const navLinks = [
    { to: '/blog', label: t.blog },
    { to: '/badminton', label: t.badminton, external: true },
    { to: '/beginner', label: t.beginner, external: true },
    { to: '/quiz/quick', label: t.quiz },
    { to: '/lessons', label: t.lessons },
    { to: '/about-animalflow', label: t.about, external: true },
    { to: '/recovery', label: t.recovery },
    { to: '/profile', label: t.profile },
  ];

  const styleFor = (to: string, size: string) => ({
    color: pathname === to ? '#2D8F4E' : '#1C2A1E',
    fontWeight: pathname === to ? 700 : 500,
    fontSize: size,
    minHeight: '44px',
    padding: '0 6px',
    whiteSpace: 'nowrap',
  } as const);

  return (
    <header className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: '#E2E8E4' }}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-1.5">
          <img src="/img/shocchan/face.webp" alt="" width={240} height={240} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          <span className="text-2xl font-black tracking-tight" style={{ color: '#2D8F4E' }}>wild</span>
          <span className="text-2xl font-black tracking-tight" style={{ color: '#1C2A1E' }}>flow</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-2">
          {navLinks.map(({ to, label, external }) => external ? (
            <a key={to} href={langPath(to, lang)} className="transition-colors inline-flex items-center" style={styleFor(to, '14px')}>{label}</a>
          ) : (
            <Link key={to} to={to} className="transition-colors inline-flex items-center" style={styleFor(to, '14px')}>{label}</Link>
          ))}
          <span className="ml-2"><LangToggle compact /></span>
        </nav>

        <div className="lg:hidden flex items-center gap-2">
          <LangToggle compact />
          <button className="p-2" style={{ color: '#1C2A1E' }} onClick={() => setMenuOpen(o => !o)} aria-label={t.menu}>
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t bg-white px-4 py-3 flex flex-col gap-3" style={{ borderColor: '#E2E8E4' }}>
          {navLinks.map(({ to, label, external }) => external ? (
            <a key={to} href={langPath(to, lang)} className="inline-flex items-center" style={styleFor(to, '16px')} onClick={() => setMenuOpen(false)}>{label}</a>
          ) : (
            <Link key={to} to={to} className="inline-flex items-center" style={styleFor(to, '16px')} onClick={() => setMenuOpen(false)}>{label}</Link>
          ))}
        </div>
      )}
    </header>
  );
}
