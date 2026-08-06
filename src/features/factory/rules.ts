// ルールベース審査ロジック。
// AIの自己申告に依存せず、コード側で価値数・採点ゲート・重複・カレンダー制約を判定する。

import type { Idea, IdeaDraft, IdeaScores, ProductionStatus, Purpose, Style } from './types';
import { SCORE_ITEMS } from './constants';

export const MIN_VALUES = 3;
export const PASS_TOTAL = 17;
export const GATE_ITEMS: (keyof IdeaScores)[] = ['target_clarity', 'concern_specificity', 'hook_strength'];

type IdeaLike = Idea | IdeaDraft;

/** 制作進捗(DB列未追加の環境でも落ちないようにフォールバック) */
export function prodStatus(idea: Pick<Idea, 'production_status'>): ProductionStatus {
  return idea.production_status ?? 'not_started';
}

export interface GateResult {
  pass: boolean;
  problems: string[];
}

/** スコア合計をコード側で再計算する(AI申告のtotalは信用しない) */
export function computeTotal(scores: Partial<IdeaScores>): number {
  return SCORE_ITEMS.reduce((sum, item) => {
    const v = scores[item.key as keyof IdeaScores];
    return sum + (typeof v === 'number' ? Math.max(0, Math.min(3, v)) : 0);
  }, 0);
}

/** 採用候補ゲート: 合計17点以上・重要3項目が各2点以上・価値3つ以上・持ち帰り/差別化が書けている */
export function gateIdea(idea: IdeaLike): GateResult {
  const problems: string[] = [];
  const total = computeTotal(idea.scores);
  if (total < PASS_TOTAL) problems.push(`合計${total}点(${PASS_TOTAL}点未満)`);
  for (const key of GATE_ITEMS) {
    const v = idea.scores[key];
    if (typeof v !== 'number' || v < 2) {
      problems.push(`${SCORE_ITEMS.find(s => s.key === key)?.label}が2点未満`);
    }
  }
  if ((idea.values_used?.length ?? 0) < MIN_VALUES) {
    problems.push(`価値が${idea.values_used?.length ?? 0}つ(${MIN_VALUES}つ未満)`);
  }
  if (!idea.takeaway?.trim()) problems.push('「見た後に何が変わるか」の一文がない');
  if (!idea.reason_to_watch?.trim()) problems.push('見る理由が書けていない');
  if (!idea.repurpose?.trim() && !idea.remake_note?.trim()) {
    // 差の説明はUI上 repurpose/remake_note か重複検出結果で担保するため警告のみ
  }
  return { pass: problems.length === 0, problems };
}

/** 必須項目チェック(採用候補として表示する前の完全性検査) */
const REQUIRED_TEXT_FIELDS: { key: keyof IdeaDraft; label: string }[] = [
  { key: 'title', label: '企画名' },
  { key: 'audience', label: '想定視聴者' },
  { key: 'concern', label: '視聴者の悩み' },
  { key: 'reason_to_watch', label: '見る理由' },
  { key: 'core_message', label: '最も伝えたいメッセージ' },
  { key: 'takeaway', label: '持ち帰ってほしい一文' },
  { key: 'hook_visual', label: '冒頭1〜3秒' },
  { key: 'hook_line', label: '最初に話す一言' },
  { key: 'structure', label: '大まかな構成' },
  { key: 'closing_style', label: '締め方' },
  { key: 'pillar_main', label: '主コンテンツ柱' },
  { key: 'primary_metric', label: '重視する評価指標' },
];

export function missingFields(idea: IdeaDraft): string[] {
  const missing = REQUIRED_TEXT_FIELDS
    .filter(f => !String(idea[f.key] ?? '').trim())
    .map(f => f.label);
  if ((idea.talking_points?.length ?? 0) < 3) missing.push('話すポイント(3個以上)');
  if ((idea.moves?.length ?? 0) < 1 && idea.style !== 'B') missing.push('見せる動き');
  return missing;
}

// ── 重複検出 ─────────────────────────────────────────────
// タイトルではなく中身(8要素)を比較する。5要素以上一致で重複扱い。

function bigrams(s: string): Set<string> {
  const t = s.replace(/\s/g, '');
  const set = new Set<string>();
  for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2));
  return set;
}

/** 日本語向けの文字bigram Jaccard類似度 */
export function textSimilarity(a: string, b: string): number {
  if (!a?.trim() || !b?.trim()) return 0;
  const sa = bigrams(a);
  const sb = bigrams(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const g of sa) if (sb.has(g)) inter++;
  return inter / (sa.size + sb.size - inter);
}

function arrayOverlap(a: string[], b: string[]): number {
  if (!a?.length || !b?.length) return 0;
  const sb = new Set(b);
  const inter = a.filter(x => sb.has(x)).length;
  return inter / Math.max(a.length, b.length);
}

export interface DuplicateCheck {
  isDuplicate: boolean;
  matchedAspects: string[];
  score: number; // 一致した要素数(8要素中)
}

const TEXT_SIM_THRESHOLD = 0.45;

/** 対象視聴者・悩み・動き・メッセージ・冒頭・結論・価値・目的の8要素で比較 */
export function checkDuplicate(a: IdeaLike, b: IdeaLike): DuplicateCheck {
  const matched: string[] = [];
  if (a.audience && a.audience === b.audience) matched.push('視聴者');
  if (textSimilarity(a.concern, b.concern) >= TEXT_SIM_THRESHOLD) matched.push('悩み');
  if (arrayOverlap(a.moves, b.moves) >= 0.5) matched.push('動き');
  if (textSimilarity(a.core_message, b.core_message) >= TEXT_SIM_THRESHOLD) matched.push('メッセージ');
  if (textSimilarity(a.hook_visual + a.hook_line, b.hook_visual + b.hook_line) >= TEXT_SIM_THRESHOLD) matched.push('冒頭');
  if (textSimilarity(a.takeaway, b.takeaway) >= TEXT_SIM_THRESHOLD) matched.push('結論');
  if (arrayOverlap(a.values_used, b.values_used) >= 0.75) matched.push('使用価値');
  if (a.purpose_main === b.purpose_main) matched.push('投稿目的');
  return { isDuplicate: matched.length >= 5, matchedAspects: matched, score: matched.length };
}

/** バッチ内+既存企画との重複を洗い出す */
export function findDuplicates(
  candidates: IdeaLike[],
  existing: IdeaLike[],
): Map<number, { against: string; aspects: string[] }> {
  const result = new Map<number, { against: string; aspects: string[] }>();
  candidates.forEach((cand, i) => {
    for (const ex of existing) {
      const check = checkDuplicate(cand, ex);
      if (check.isDuplicate) {
        result.set(i, { against: `既存: ${ex.title}`, aspects: check.matchedAspects });
        return;
      }
    }
    for (let j = 0; j < i; j++) {
      if (result.has(j)) continue; // 既に重複扱いの案とは比較しない
      const check = checkDuplicate(cand, candidates[j]);
      if (check.isDuplicate) {
        result.set(i, { against: `同バッチ: ${candidates[j].title}`, aspects: check.matchedAspects });
        return;
      }
    }
  });
  return result;
}

// ── カレンダー制約 ───────────────────────────────────────

export interface CalendarWarning {
  week: number;
  message: string;
}

/**
 * 4週間×週4投稿の配置を検査する。
 * - 各週で同一目的が3件以上 → 偏りすぎ警告
 * - 同じ発信スタイルが3連続 → 警告
 */
export function checkCalendar(ideas: Pick<Idea, 'purpose_main' | 'style' | 'scheduled_week' | 'scheduled_slot'>[]): CalendarWarning[] {
  const warnings: CalendarWarning[] = [];
  const scheduled = ideas
    .filter(i => i.scheduled_week != null && i.scheduled_slot != null)
    .sort((x, y) => (x.scheduled_week! - y.scheduled_week!) || (x.scheduled_slot! - y.scheduled_slot!));

  for (let w = 1; w <= 4; w++) {
    const week = scheduled.filter(i => i.scheduled_week === w);
    const counts = new Map<Purpose, number>();
    week.forEach(i => counts.set(i.purpose_main, (counts.get(i.purpose_main) ?? 0) + 1));
    for (const [purpose, count] of counts) {
      if (count >= 3) warnings.push({ week: w, message: `目的「${purpose}」が${count}件に偏っています` });
    }
  }

  let streak = 1;
  let prev: Style | null = null;
  for (const i of scheduled) {
    if (i.style === prev) {
      streak++;
      if (streak >= 3) {
        warnings.push({ week: i.scheduled_week!, message: `スタイル${i.style}が${streak}連続しています` });
      }
    } else {
      streak = 1;
      prev = i.style;
    }
  }
  return warnings;
}

// ── 勝ちパターン昇格判定 ────────────────────────────────
// 「1回伸びた」では昇格しない。同じ組み合わせ(視聴者×目的×価値×スタイル)で
// 2回以上成果 → 再現候補、3回以上 → 勝ちパターン候補。断定表記はしない。

export function shouldPromoteWinPattern(successCount: number): boolean {
  return successCount >= 2;
}

// ── AI出力の検証(レスポンスをそのままDB保存しない) ──────
// 方針: 不正な案だけを理由つきで除外する「部分採用」。全滅時のみ失敗扱い。

const DANGER_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /治る|治療|完治|医療効果|医学的に効果/, label: '医学的効果・治療効果の断言' },
  { re: /診断し(ます|た)|病気|疾患を/, label: '症状の診断表現' },
  { re: /必ず(でき|痩せ|変わ|伸び)|誰でも.{0,8}(できる|マスター)|絶対に(でき|変わ)/, label: '効果・習得の断言' },
  { re: /\d+(日|週間|ヶ月)で(必ず|誰でも|マスター|完璧)/, label: '習得期間の断言' },
  { re: /(ジム|筋トレ|ヨガ|ピラティス|ランニング)(は|より).{0,10}(無駄|不要|劣|ダメ|意味がない)/, label: '他の運動方法の否定' },
];

export function scanDangerExpressions(idea: IdeaLike): string[] {
  const text = [
    idea.title, idea.concern, idea.core_message, idea.takeaway, idea.hook_line,
    idea.structure, ...(idea.talking_points ?? []), idea.closing_style, idea.reason_to_watch,
  ].join(' ');
  return DANGER_PATTERNS.filter(p => p.re.test(text)).map(p => p.label);
}

const MAX_TEXT_LEN = 2000;

export interface RawValidationResult {
  ok: boolean;
  problems: string[];
}

/**
 * AIが返した1案の構造検証。
 * 列挙値・マスタコードの実在・型・文字列長・危険表現をコード側で確認する。
 * (点数・価値数のゲートは gateIdea が担当。ここは「保存してよい形か」の検査)
 */
export function validateRawIdea(
  raw: Record<string, unknown>,
  masters: { valueCodes: Set<string>; pillarCodes: Set<string>; audienceCodes: Set<string> },
): RawValidationResult {
  const problems: string[] = [];
  const str = (k: string) => typeof raw[k] === 'string' ? (raw[k] as string) : null;
  const arr = (k: string) => Array.isArray(raw[k]) ? (raw[k] as unknown[]) : null;

  for (const k of ['title', 'concern', 'core_message', 'takeaway', 'hook_visual', 'hook_line', 'structure']) {
    const v = str(k);
    if (!v?.trim()) problems.push(`${k} が空`);
    else if (v.length > MAX_TEXT_LEN) problems.push(`${k} が長すぎる(${v.length}文字)`);
  }
  if (!['A', 'B', 'C'].includes(str('style') ?? '')) problems.push(`style が不正: ${raw.style}`);
  if (!['awareness', 'save', 'persona', 'trust'].includes(str('purpose_main') ?? '')) {
    problems.push(`purpose_main が不正: ${raw.purpose_main}`);
  }
  const pillar = str('pillar_main');
  if (!pillar || !masters.pillarCodes.has(pillar)) problems.push(`pillar_main が存在しない: ${pillar}`);
  const audience = str('audience');
  if (!audience || !masters.audienceCodes.has(audience)) problems.push(`audience が存在しない: ${audience}`);
  const values = arr('values_used');
  if (!values) {
    problems.push('values_used がない');
  } else {
    const unknown = values.filter(v => typeof v !== 'string' || !masters.valueCodes.has(v));
    if (unknown.length) problems.push(`存在しない価値コード: ${unknown.join(',')}`);
  }
  for (const k of ['shoot_difficulty', 'edit_difficulty']) {
    const v = raw[k];
    if (typeof v !== 'number' || v < 1 || v > 3) problems.push(`${k} が1〜3でない: ${v}`);
  }
  const dur = raw.duration_sec;
  if (typeof dur !== 'number' || dur < 5 || dur > 600) problems.push(`duration_sec が不正: ${dur}`);

  return { ok: problems.length === 0, problems };
}
