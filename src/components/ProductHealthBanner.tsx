// 「いま買えるものが無い」ことを管理者に知らせる（2026-09-09 G-1）。
//
// 診断は動く。LPも動く。レッスン一覧も表示される。**ただし中身が0件**——
// この状態はエラーを出さないので、誰も気づけないまま2か月続いた。
// 気づけるように、管理画面のいちばん上に出す。
import { useEffect, useState } from 'react';
import { fetchProductHealth, type ProductHealth } from '../services/productHealth';

export function ProductHealthBanner() {
  const [health, setHealth] = useState<ProductHealth | null | 'loading'>('loading');

  useEffect(() => {
    let alive = true;
    void fetchProductHealth().then((h) => { if (alive) setHealth(h); });
    return () => { alive = false; };
  }, []);

  // 読み込み中と「読めなかった」は何も言わない（0件だと言い切れないときは黙る）
  if (health === 'loading' || health === null) return null;
  if (health.upcomingLessons > 0) return null;

  const critical = !health.ok;
  return (
    <div
      role="status"
      className="mb-6 rounded-2xl border-2 p-5"
      style={{
        borderColor: critical ? '#EF4444' : '#F59E0B',
        backgroundColor: critical ? '#FEF2F2' : '#FFFBEB',
      }}
    >
      <p className="font-bold mb-1" style={{ color: '#1C2A1E' }}>
        {critical
          ? '⚠️ いま申し込めるものが1つもありません'
          : '⚠️ 開催予定の単発レッスンが0件です'}
      </p>
      <p className="text-sm leading-relaxed mb-3" style={{ color: '#5a7a62' }}>
        {critical
          ? 'サイトは「診断 → レッスン」で案内していますが、着いた先に商品がありません。診断を受けた人は全員ここで行き止まりになります。'
          : `トップとレッスンページは「まずは単発レッスンで体験してください」と書いていますが、開催予定が0件です。いま申し込めるのはフルパック（${health.publishedPackages}件）だけです。`}
      </p>
      <a
        href="/admin"
        className="inline-flex items-center px-5 rounded-xl font-bold text-sm text-white"
        style={{ backgroundColor: critical ? '#DC2626' : '#D97706', minHeight: '44px' }}
      >
        レッスンを1件公開する →
      </a>
    </div>
  );
}

export default ProductHealthBanner;
