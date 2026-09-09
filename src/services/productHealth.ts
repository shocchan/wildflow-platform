// いま実際に買えるものがあるか（2026-09-09 G-1 / G-2 / G-3）。
//
// 【なぜ要るか】
// 2026-09-09 の監査で、公開中のレッスンが全期間で1件・日付は2026-07-20（終了済み）だった。
// トップの5つのCTAはすべて診断へ、診断の結果はレッスンへ、レッスンは常に空。
// つまり**導線の終点に商品が無い**状態が2か月近く続き、サイトのどこにも警告が出なかった。
//
// この module は「買えるものがあるか」を1か所で答える。
//   - 管理画面 … 0件なら警告を出す（G-1）
//   - 診断結果 … 0件のときは「予約できます」と書かない（G-3。嘘のCTAを出さない）
import { supabase } from './supabaseClient';

export interface ProductHealth {
  /** 何か1つでも申し込めるものがあるか */
  ok: boolean;
  /** 今日以降に開催予定の公開レッスン数 */
  upcomingLessons: number;
  /** 公開中のパッケージ数 */
  publishedPackages: number;
  nextLessonDate: string | null;
  /** 単発レッスンを今すぐ申し込めるか。「まずは単発で体験」と書けるかの判定 */
  singleLessonBuyable: boolean;
}

const EMPTY: ProductHealth = {
  ok: false, upcomingLessons: 0, publishedPackages: 0,
  nextLessonDate: null, singleLessonBuyable: false,
};

/**
 * 在庫の状態。読めなかったときは null を返す
 * （0件と「読めなかった」を同じ顔にしない。0件だと言い切れないときは何も言わない）。
 */
export async function fetchProductHealth(): Promise<ProductHealth | null> {
  const today = new Date().toISOString().slice(0, 10);
  const [lessons, packages] = await Promise.all([
    supabase.from('lessons').select('date').eq('status', 'published').gte('date', today).order('date', { ascending: true }),
    supabase.from('lesson_packages').select('id').eq('status', 'published'),
  ]);
  if (lessons.error || packages.error) return null;
  const upcomingLessons = lessons.data?.length ?? 0;
  const publishedPackages = packages.data?.length ?? 0;
  return {
    ...EMPTY,
    ok: upcomingLessons > 0 || publishedPackages > 0,
    upcomingLessons,
    publishedPackages,
    nextLessonDate: (lessons.data?.[0]?.date as string | undefined) ?? null,
    singleLessonBuyable: upcomingLessons > 0,
  };
}
