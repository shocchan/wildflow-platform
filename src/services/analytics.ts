// GA4 計測サービス(最小構成)
//
// 方針:
// - 本番ドメイン(wild-flow.com)でのみ有効。staging(workers.dev)・localhostでは完全無効
//   → stagingアクセスが本番GA4に混入しない(採用方式:「stagingでは計測無効」)
// - Measurement ID は src/config/site.ts の GA4_MEASUREMENT_ID。空なら何もしない
// - UTMパラメータは初回着地時に sessionStorage へ保存し、SPA内の全イベントに付与
//   (セッション中は流入元を保持)
// - gtagスクリプトは有効時のみ動的ロード(index.htmlは変更しない)

import { GA4_MEASUREMENT_ID } from '../config/site';

const PROD_HOSTS = ['wild-flow.com', 'www.wild-flow.com'];
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const UTM_STORAGE_KEY = 'wf_utm';

let enabled = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/** 初回着地時のUTMを保存(SPA遷移後もセッション中は保持) */
function captureUtm(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const v = params.get(key);
    if (v) utm[key] = v.slice(0, 100);
  }
  if (Object.keys(utm).length > 0) {
    try { sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm)); } catch { /* private mode等 */ }
  }
  return getUtm();
}

export function getUtm(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(UTM_STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

/** アプリ起動時に1回呼ぶ。無効環境では何もしない */
export function initAnalytics(): void {
  if (!GA4_MEASUREMENT_ID) return;                          // ID未設定 → 無効
  if (!PROD_HOSTS.includes(window.location.hostname)) return; // staging/localhost → 無効
  enabled = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  gtag('js', new Date());
  // SPAのためpage_viewは自前送信(ルート遷移ごと)
  gtag('config', GA4_MEASUREMENT_ID, { send_page_view: false });

  const utm = captureUtm();
  // 動画経由の着地(utm_content=wf001 等)を専用イベントで記録
  if (utm.utm_content && /^wf\d+/i.test(utm.utm_content)) {
    track('video_landing', { video_code: utm.utm_content.toLowerCase() });
  }
}

/** イベント送信。無効環境ではno-op。UTMを常に付与 */
export function track(event: string, params: Record<string, unknown> = {}): void {
  if (!enabled) return;
  gtag('event', event, { ...getUtm(), ...params });
}

/** SPAルート遷移ごとのpage_view */
export function trackPageView(path: string): void {
  track('page_view', { page_path: path, page_location: window.location.href });
}
