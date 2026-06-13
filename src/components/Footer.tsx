import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_LINKS = [
  { to: '/blog', label: 'ブログ' },
  { to: '/quiz', label: '野生診断' },
  { to: '/lessons', label: 'レッスン' },
  { to: '/recovery', label: 'リカバリー' },
  { to: '/profile', label: 'プロフィール' },
];

const LEGAL_LINKS = [
  { to: '/faq', label: 'よくある質問' },
  { to: '/contact', label: 'お問い合わせ' },
  { to: '/legal', label: '特定商取引法に基づく表記' },
  { to: '/privacy', label: 'プライバシーポリシー' },
];

export function Footer() {
  const { isAuthenticated } = useAuth();
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
          <p className="text-xs" style={{ color: '#4A6550' }}>野生の身体を、すべての人へ。</p>
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
            <Link
              to="/admin"
              className="text-sm hover:text-white transition-colors"
              style={{ color: '#6A8A72', minHeight: '36px', display: 'inline-flex', alignItems: 'center' }}
            >
              管理
            </Link>
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
