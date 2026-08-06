// サイト全体で使用する定数。将来ドメイン取得後はここの1行を変えるだけで全ページ反映される。
export const SITE_CONFIG = {
  contactEmail: 'info@wild-flow.com',
  companyName: '株式会社中日文化交流諮詢',
  representativeName: '安田翔',
  siteUrl: 'https://wild-flow.com',
} as const;

// GA4のMeasurement ID。空文字の間は計測は完全に無効。
// しょっちゃんがGA4プロパティを作成したら 'G-XXXXXXXXXX' を設定する。
// (本番ドメイン wild-flow.com でのみ送信される。staging/localhostは常に無効 → analytics.ts)
export const GA4_MEASUREMENT_ID = '';
