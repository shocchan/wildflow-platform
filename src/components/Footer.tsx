import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../i18n/lang';
import { MESSAGES } from '../i18n/messages';

const LEGAL_LINKS = [
  { to: '/faq', label: 'よくある質問' },
  { to: '/contact', label: 'お問い合わせ' },
  { to: '/legal', label: '特定商取引法に基づく表記' },
  { to: '/privacy', label: 'プライバシーポリシー' },
];

export function Footer() {
  const { isAuthenticated } = useAuth();
  const lang = useLang();
  const t = MESSAGES[lang].nav;
  // 2026-09-18 P1-9（A案）: 60問（/quiz）はナビから外し、10問だけを出す
  const NAV_LINKS = [
    { to: '/blog', label: t.blog },
    { to: '/quiz/quick', label: t.quiz },
    { to: '/lessons', label: t.lessons },
    { to: '/recovery', label: t.recovery },
    { to: '/profile', label: t.profile },
  ];
  return (
    <footer style={{ backgroundColor: '#1C2A1E' }}>
      {/* メインフッター */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 flex flex-col md:flex-row gap-8 justify-between">
        {/* ブランド */}
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center gap-1 mb-2">
            <span className="font-black text-lg" style={{ color: '#2D8F4E' }}>wild</span>
            <span className="font-black text-lg text-white">flow</span>
          </Link>
          <p className="text-xs" style={{ color: '#4A6550' }}>{t.tagline}</p>
        </div>

        {/* ナビゲーション */}
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm hover:text-white transition-colors"
              style={{ color: '#6A8A72', minHeight: '36px', display: 'inline-flex', alignItems: 'center' }}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <>
              <Link
                to="/admin"
                className="text-sm hover:text-white transition-colors"
                style={{ color: '#6A8A72', minHeight: '36px', display: 'inline-flex', alignItems: 'center' }}
              >
                管理
              </Link>
              <Link
                to="/admin/factory"
                className="text-sm hover:text-white transition-colors"
                style={{ color: '#6A8A72', minHeight: '36px', display: 'inline-flex', alignItems: 'center' }}
              >
                企画工場
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ロウワーフッター */}
      <div className="border-t" style={{ borderColor: '#14231A' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {LEGAL_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs hover:text-white transition-colors"
                style={{ color: '#4A6550' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-xs flex-shrink-0" style={{ color: '#4A6550' }}>
            © 2026 wildflow
          </p>
        </div>
      </div>
    </footer>
  );
}
