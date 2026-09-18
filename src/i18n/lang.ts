import { useSyncExternalStore } from 'react';

/**
 * 表示言語（2026-09-19 ブラッシュアップ）。ja が既定。zh は簡体字。
 *
 * 決め方の優先順: URL の ?lang=zh|ja → localStorage → ブラウザ言語（zh-* なら zh）→ ja
 * 切替はヘッダーの LangToggle。静的HTML（/badminton 等）は /zh/ 配下の別ファイルなので、
 * React 側のリンクは langPath() で振り分ける。
 */
export type Lang = 'ja' | 'zh';

const KEY = 'wildflow.lang.v1';
const listeners = new Set<() => void>();

function detect(): Lang {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'zh' || q === 'ja') { localStorage.setItem(KEY, q); return q; }
    const s = localStorage.getItem(KEY);
    if (s === 'zh' || s === 'ja') return s;
    if ((navigator.language || '').toLowerCase().startsWith('zh')) return 'zh';
  } catch { /* private mode 等 */ }
  return 'ja';
}

let current: Lang = detect();
document.documentElement.lang = current === 'zh' ? 'zh-CN' : 'ja';

export function getLang(): Lang { return current; }

export function setLang(l: Lang): void {
  if (l === current) return;
  current = l;
  try { localStorage.setItem(KEY, l); } catch { /* noop */ }
  document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'ja';
  listeners.forEach(fn => fn());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => current,
    () => current,
  );
}

/** 静的HTMLページへのパス。zh のときは /zh/ 配下へ */
export function langPath(path: string, lang: Lang = current): string {
  const STATIC = ['/badminton', '/beginner', '/routine', '/about-animalflow', '/animalflow.html'];
  const base = path.split(/[?#]/)[0];
  if (lang === 'zh' && STATIC.includes(base)) {
    const p = base === '/animalflow.html' ? '/beginner' : base; // animalflow.html は zh 版が無いので beginner へ
    return '/zh' + p + path.slice(base.length);
  }
  return path;
}
