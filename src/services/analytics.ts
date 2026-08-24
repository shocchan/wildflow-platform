// GA4 計測サービス(最小構成)
//
// 方針:
// - 本番ドメイン(wild-flow.com)でのみ有効。staging(workers.dev)・localhostでは完全無効
//   → stagingアクセスが本番GA4に混入しない(採用方式:「stagingでは計測無効」)
// - Measurement ID は src/config/site.ts の GA4_MEASUREMENT_ID(環境変数 VITE_GA4_ID)。空なら何もしない
// - UTMパラメータは初回着地時に sessionStorage へ保存し、SPA内の全イベントに付与
//   (セッション中は流入元を保持)
// - gtagスクリプトは有効時のみ動的ロード(index.htmlは変更しない)
// - 自己トラフィック除外: ?notrack=1 を付けて開いたブラウザは以後ずっと計測対象外
//   (?notrack=0 で解除)。/admin 系を開いたブラウザも運営者とみなし自動で除外する
//   → 1日10PV規模のサイトで、しょっちゃん自身の閲覧が数字を埋めてしまうのを防ぐ

import { GA4_MEASUREMENT_ID } from '../config/site';

const PROD_HOSTS = ['wild-flow.com', 'www.wild-flow.com'];
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const UTM_STORAGE_KEY = 'wf_utm';
const NOTRACK_KEY = 'wf_notrack';

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

/**
 * ?notrack=1 / ?notrack=0 を処理する。
 * GA4のIDが未設定でも先に処理するので、CEOは今のうちに ?notrack=1 で自分を除外しておける。
 */
function processNotrackFlag(): void {
  try {
    const flag = new URLSearchParams(window.location.search).get('notrack');
    if (flag === '1') localStorage.setItem(NOTRACK_KEY, '1');
    if (flag === '0') localStorage.removeItem(NOTRACK_KEY);
    // /admin 系を開いたブラウザ＝運営者。以後ずっと計測対象外にする
    if (window.location.pathname.startsWith('/admin')) localStorage.setItem(NOTRACK_KEY, '1');
  } catch { /* private mode等でstorageが使えない場合は何もしない */ }
}

/** このブラウザが計測から除外されているか */
export function isTrackingOptedOut(): boolean {
  try { return localStorage.getItem(NOTRACK_KEY) === '1'; } catch { return false; }
}

/** アプリ起動時に1回呼ぶ。無効環境では何もしない */
export function initAnalytics(): void {
  processNotrackFlag();
  if (!GA4_MEASUREMENT_ID) return;                          // ID未設定 → 無効
  if (!PROD_HOSTS.includes(window.location.hostname)) return; // staging/localhost → 無効
  if (isTrackingOptedOut()) return;                           // 運営者自身 → 無効
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
  // SPA遷移で /admin に入った場合もここで運営者と判定して以後除外する
  // (initAnalytics は初回ロード時のパスしか見ていないため)
  if (path.startsWith('/admin')) {
    try { localStorage.setItem(NOTRACK_KEY, '1'); } catch { /* noop */ }
    enabled = false;
    return;
  }
  track('page_view', { page_path: path, page_location: window.location.href });
}
