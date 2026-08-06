import type { Purpose, Style } from './types';

export const PURPOSE_LABELS: Record<Purpose, string> = {
  awareness: '新規の人に知ってもらう',
  save: '保存してもらう',
  persona: '人柄や世界観を好きになってもらう',
  trust: 'レッスンやwild-flowへの信頼を作る',
};

export const STYLE_LABELS: Record<Style, string> = {
  A: '動きを見せる実演型',
  B: 'ゆとり風の穏やかな語り',
  C: '実演と語りの組み合わせ',
};

export const STATUS_LABELS: Record<string, string> = {
  candidate: '採用候補',
  adopted: '採用',
  hold: '保留',
  rejected: '却下',
  remake: 'リメイク候補',
  posted: '投稿済み',
};

// 主目的ごとの評価指標(投稿結果の見るべき数字)
export const PURPOSE_METRICS: Record<Purpose, string[]> = {
  awareness: ['再生数', '新規視聴者', 'フォロー', 'プロフィール閲覧'],
  save: ['保存数', '保存率', '質問コメント', '再視聴'],
  persona: ['平均視聴時間', '共感コメント', 'フォロー', '継続視聴'],
  trust: ['プロフィール閲覧', 'サイト遷移', '質問', '体験希望', '申込み'],
};

// 伸びなかった投稿の要因分析チェックリスト
export const ANALYSIS_FACTORS: { key: string; label: string }[] = [
  { key: 'weak_idea', label: '企画が弱かった' },
  { key: 'vague_target', label: '対象が曖昧だった' },
  { key: 'weak_hook', label: '冒頭が弱かった' },
  { key: 'late_payoff', label: '完成形を見せるのが遅かった' },
  { key: 'unclear_move', label: '動きが分かりにくかった' },
  { key: 'bad_angle', label: '撮影角度が悪かった' },
  { key: 'long_explanation', label: '説明が長かった' },
  { key: 'abstract_message', label: 'メッセージが抽象的だった' },
  { key: 'too_hard', label: '初心者には難しすぎた' },
  { key: 'too_basic', label: '上級者には基本的すぎた' },
  { key: 'metric_mismatch', label: '投稿目的と評価指標が合っていなかった' },
  { key: 'pushy_cta', label: '導線が強すぎた' },
  { key: 'no_persona', label: '人柄が伝わらなかった' },
  { key: 'weak_title_thumb', label: 'タイトルまたはサムネイルだけが弱かった' },
  { key: 'platform_mismatch', label: 'プラットフォームとの相性が悪かった' },
  { key: 'external', label: '投稿時間や外部要因の可能性' },
];

export const SCORE_ITEMS: { key: string; label: string }[] = [
  { key: 'target_clarity', label: '対象の明確さ' },
  { key: 'concern_specificity', label: '悩みの具体性' },
  { key: 'hook_strength', label: '冒頭の強さ' },
  { key: 'visual_value', label: '視覚価値' },
  { key: 'takeaway_value', label: '持ち帰れる価値' },
  { key: 'originality', label: '独自性' },
  { key: 'brand_fit', label: 'ブランド世界観との一致' },
  { key: 'filmability', label: '一人または少人数での撮影可能性' },
];

// 初回生成のピラー比率目安
export const BATCH_RATIO: { pillars: string[]; label: string; ratio: number }[] = [
  { pillars: ['beginner'], label: '初心者向け・実用', ratio: 0.3 },
  { pillars: ['technique', 'ability'], label: '動作解説・身体能力', ratio: 0.25 },
  { pillars: ['growth'], label: '成長・挑戦', ratio: 0.2 },
  { pillars: ['mind'], label: '穏やかな語り・世界観', ratio: 0.15 },
  { pillars: ['backstage', 'application'], label: 'レッスン・ブランドへの信頼', ratio: 0.1 },
];

export const MATERIAL_CATEGORIES = [
  '資格・実績(確定情報)',
  'Animal Flowを始めた経緯',
  'Level 1認定取得時の経験',
  '苦戦した動き',
  '得意な動き',
  '現在練習中の動き',
  '過去に誤解していたこと',
  '教える側になって気づいたこと',
  '初心者から受けた質問',
  'レッスン中に起きたこと',
  '分かりやすかった説明',
  '伝わりにくかった説明',
  'バドミントンとの接点',
  '筋力トレーニングとの接点',
  '日常動作との接点',
  '撮影時の失敗',
  '検証記録(7日間・30日間など)',
  '本人の考えや哲学',
  'その他',
];

export const PLATFORMS = ['Lemon8', 'TikTok', 'YouTubeショート', 'その他'];

// 制作進捗ラベル(企画ステータスとは独立)
export const PRODUCTION_STATUS_LABELS: Record<string, string> = {
  not_started: '未着手',
  awaiting_material: '素材待ち',
  preparing: '撮影準備中',
  shot: '撮影済み',
  editing: '編集中',
  ready: '投稿準備完了',
  posted: '投稿済み',
  unpublished: '公開停止',
};

/** 勝ちパターンの段階(成功回数から導出。「勝ちパターン」と断定しない) */
export function winStageLabel(successCount: number): string {
  if (successCount <= 0) return '仮説';
  if (successCount === 1) return '初回成功';
  if (successCount === 2) return '再現候補';
  return '勝ちパターン候補';
}

/** 投稿結果の率指標。分母を明示し、0除算は null を返す */
export const RATE_DEFS: { key: string; label: string; num: string; den: string }[] = [
  { key: 'save_rate', label: '保存率', num: 'saves', den: 'views' },
  { key: 'like_rate', label: 'いいね率', num: 'likes', den: 'views' },
  { key: 'comment_rate', label: 'コメント率', num: 'comments_count', den: 'views' },
  { key: 'share_rate', label: 'シェア率', num: 'shares', den: 'views' },
  { key: 'follow_rate', label: 'フォロー転換率', num: 'follows', den: 'views' },
  { key: 'profile_rate', label: 'プロフィール閲覧率', num: 'profile_views', den: 'views' },
  { key: 'site_rate', label: 'サイト遷移率', num: 'site_clicks', den: 'profile_views' },
  { key: 'trial_rate', label: '体験希望率', num: 'trial_requests', den: 'site_clicks' },
  { key: 'purchase_rate', label: '申込み率', num: 'purchases', den: 'site_clicks' },
];

/** 安全な割り算(分母0/null → null)。率は%で返す */
export function safeRate(num: number | null | undefined, den: number | null | undefined): number | null {
  if (num == null || den == null || den === 0) return null;
  return (num / den) * 100;
}

// 品質・安全ルール(生成プロンプトとUI表示の両方で使う)
export const QUALITY_RULES = [
  'Animal Flowの正式名称を確認せずに作らない',
  'Level 1で扱う範囲と、それ以外を区別する',
  'しょっちゃんが取得していない資格や実績を作らない',
  '本人が経験していないことを経験談にしない(素材DBにない体験談は使わず「一次情報の追加が必要」とする)',
  '医学的効果・治療効果を断言しない',
  '痛みや不調を診断しない',
  '誰でも同じ期間で習得できると断言しない',
  '初心者が危険な動きを真似しないようにする',
  '難しい動きには段階練習を用意する',
  '一般的な筋力トレーニングを否定しない',
  '他の運動方法を否定しない',
  '見栄えのよい動きだけを価値にしない',
  '過度な煽りを使用しない',
  '抽象的な精神論だけの企画を生成しない',
  '一人または少人数で現実的に撮影できる内容を優先する',
  '事実確認が必要な情報には警告を付ける',
];
