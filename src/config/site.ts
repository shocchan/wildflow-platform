// サイト全体で使用する定数。将来ドメイン取得後はここの1行を変えるだけで全ページ反映される。
export const SITE_CONFIG = {
  contactEmail: 'info@wild-flow.com',
  companyName: '株式会社中日文化交流諮詢',
  representativeName: '安田翔',
  siteUrl: 'https://wild-flow.com',
} as const;

// GA4のMeasurement ID。
//
// 【重要】ここにIDを直書きしない。ビルド時の環境変数 VITE_GA4_ID から読む。
//   - ローカル : .env に `VITE_GA4_ID=G-XXXXXXXXXX`（.env はgit管理外）
//   - 本番     : GitHub の Secrets に VITE_GA4_ID を登録
//                （.github/workflows/deploy.yml の Build ステップで注入している）
// 未設定（空文字）の間は initAnalytics が即returnし、計測は完全に無効。
// 本番ドメイン wild-flow.com でのみ送信される（staging/localhostは常に無効 → analytics.ts）。
export const GA4_MEASUREMENT_ID: string =
  ((import.meta.env.VITE_GA4_ID as string | undefined) ?? '').trim();

// ───────────────────────────────────────────
// kawabado（川口・蕨のバドミントン活動）への送客
// ───────────────────────────────────────────
// wildflowの読者（川口・蕨で「体を動かしたい人」）と対象が重なるため、
// 文脈のある本文リンクとして案内する。流入をkawabado側で計測できるよう
// UTMを必ず付ける（kawabado側は utm_* を sessionStorage に保存して計測する）。
const KAWABADO_ACTIVITY_URL = 'https://kawabado.com/ja/activity';

/** kawabadoの通常活動ページURL（UTM付き）。campaign は設置場所が分かる名前にする */
export function kawabadoActivityUrl(campaign: string): string {
  const params = new URLSearchParams({
    utm_source: 'wildflow',
    utm_medium: 'referral',
    utm_campaign: campaign,
  });
  return `${KAWABADO_ACTIVITY_URL}?${params.toString()}`;
}
