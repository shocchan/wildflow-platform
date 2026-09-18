/**
 * 入口（どのページから診断に来たか）の控え。2026-09-18 バドミントン・ピボット P0-4。
 *
 * /badminton・/beginner のリンクは `/quiz/quick?entry=badminton` のように entry を付けて診断へ飛ぶ。
 * 診断開始時にそれを sessionStorage に控え、結果ページの「出口3ブロック」を入口ごとに出し分ける。
 * 個人情報は含まない。同じタブのあいだだけ残る。
 */
export type Entry = 'badminton' | 'beginner' | 'general';

const ENTRY_KEY = 'wildflow.entry.v1';
const VALID: Entry[] = ['badminton', 'beginner'];

/** `?entry=` を読み、正しい値なら控える。無ければ何もしない（前の控えを消さない） */
export function rememberEntryFromSearch(search: string): void {
  const v = new URLSearchParams(search).get('entry');
  if (!v || !VALID.includes(v as Entry)) return;
  try { sessionStorage.setItem(ENTRY_KEY, v); } catch { /* private mode 等 */ }
}

export function getEntry(): Entry {
  try {
    const v = sessionStorage.getItem(ENTRY_KEY);
    return v && VALID.includes(v as Entry) ? (v as Entry) : 'general';
  } catch {
    return 'general';
  }
}
