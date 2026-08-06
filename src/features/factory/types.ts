// SNS企画工場の型定義。DBスキーマ(pf_*)と1:1対応。

export type IdeaStatus = 'candidate' | 'adopted' | 'hold' | 'rejected' | 'remake' | 'posted';
// 制作進捗(品質審査のIdeaStatusとは独立した準備状態)
export type ProductionStatus =
  | 'not_started' | 'awaiting_material' | 'preparing' | 'shot'
  | 'editing' | 'ready' | 'posted' | 'unpublished';
export type Style = 'A' | 'B' | 'C'; // A:実演型 B:穏やかな語り C:組み合わせ
export type Purpose = 'awareness' | 'save' | 'persona' | 'trust';

export interface Brand {
  id: string;
  core_message: string;
  sub_message: string;
  worldview: string[];
  notes: string;
  updated_at: string;
}

export interface ValueDef {
  id: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
  active: boolean;
}

export interface Pillar {
  id: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
  active: boolean;
}

export interface Audience {
  id: string;
  code: string;
  name: string;
  current_state: string;
  concerns: string[];
  desired_change: string;
  resistance: string;
  messages_that_work: string;
  responded_posts: string;
  not_responded_posts: string;
  sort_order: number;
  active: boolean;
}

export interface Material {
  id: string;
  category: string;
  title: string;
  body: string;
  verified: boolean;
  source_type: 'owner_input' | 'site_copy' | 'interview' | 'other';
  source_reference: string;       // どのファイル・ページ・発言から取得したか
  fact_status: 'confirmed' | 'site_published' | 'unverified';
  wildflow_relevance: string;
  public_usage_status: 'approved' | 'unconfirmed' | 'prohibited';
  approved_by_owner: boolean;     // 本人がSNS使用を承認済みか
  approved_at: string | null;
  prohibited_claims: string;      // この素材について語ってはいけないこと
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/** AI生成に投入してよい素材か(本人未確認の素材は自動投入しない) */
export function isMaterialUsable(m: Material): boolean {
  return m.approved_by_owner && m.public_usage_status === 'approved';
}

export interface GenerationJob {
  id: string;
  created_by: string | null;
  status: 'processing' | 'completed' | 'failed';
  quality: 'standard' | 'high';
  model: string;
  params: { count?: number; pillarFocus?: string; note?: string };
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost_usd: number | null;
  error: string;
  ideas_json: unknown[] | null;
  imported: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferencePost {
  id: string;
  url: string;
  platform: string;
  author: string;
  posted_at: string | null;
  title: string;
  hook: string;
  duration_sec: number | null;
  views: number | null;
  likes: number | null;
  saves: number | null;
  comments: number | null;
  shares: number | null;
  follower_count: number | null;
  theme: string;
  target_audience: string;
  values_used: string[];
  value_locations: string;
  why_chosen: string;
  reproducible: string;
  not_reproducible: string;
  application_notes: string;
  created_at: string;
}

// 8項目の審査(各0〜3点、合計24点満点)
export interface IdeaScores {
  target_clarity: number;      // 対象の明確さ
  concern_specificity: number; // 悩みの具体性
  hook_strength: number;       // 冒頭の強さ
  visual_value: number;        // 視覚価値
  takeaway_value: number;      // 持ち帰れる価値
  originality: number;         // 独自性
  brand_fit: number;           // ブランド世界観との一致
  filmability: number;         // 一人または少人数での撮影可能性
}

export interface Idea {
  id: string;
  code: string;
  title: string;
  batch_id: string;
  status: IdeaStatus;
  style: Style;
  purpose_main: Purpose;
  purpose_sub: string;
  pillar_main: string;
  pillar_sub: string[];
  audience: string;
  concern: string;
  reason_to_watch: string;
  core_message: string;
  takeaway: string;
  hook_visual: string;
  hook_line: string;
  moves: string[];
  camera_angles: string;
  comparison_footage: string;
  structure: string;
  talking_points: string[];
  material_ids: string[];
  needs_material: boolean;
  avoid_misunderstanding: string;
  safety_notes: string;
  closing_question: string;
  closing_style: string;
  comment_prompt: string;
  keywords: string[];
  lesson_cta: boolean;
  lesson_cta_phrase: string;
  duration_sec: number;
  shoot_difficulty: number;
  edit_difficulty: number;
  values_used: string[];
  scores: Partial<IdeaScores>;
  score_total: number;
  primary_metric: string;
  repurpose: string;
  remake_note: string;
  remake_of: string | null;
  duplicate_of: string | null;
  reject_reason: string;
  scheduled_week: number | null;
  scheduled_slot: number | null;
  production_status: ProductionStatus;
  required_materials: string;        // 素材待ちの場合の必要素材の要約
  material_deadline: string | null;  // 撮影可能予定日/準備期限
  alternative_note: string;          // 期限に間に合わない場合の代替企画候補
  created_at: string;
  updated_at: string;
}

export type IdeaDraft = Omit<Idea, 'id' | 'created_at' | 'updated_at'>;

export interface PostResult {
  id: string;
  idea_id: string | null;
  platform: string;
  posted_at: string | null;
  actual_title: string;
  thumb_desc: string;
  duration_sec: number | null;
  views: number | null;
  new_viewers: number | null;
  avg_watch_sec: number | null;
  retention_pct: number | null;
  likes: number | null;
  saves: number | null;
  comments_count: number | null;
  shares: number | null;
  follows: number | null;
  profile_views: number | null;
  site_clicks: number | null;
  lesson_inquiries: number | null;
  trial_requests: number | null;
  purchases: number | null;
  comment_summary: string;
  self_review: string;
  production_issues: string;
  analysis: Record<string, boolean>; // 伸びなかった要因チェックリスト
  success_judgment: 'success' | 'fail' | null; // 主目的に対する成果判定
  success_basis: string;                       // 判定に使った指標と基準(必ず記録)
  post_url: string;                            // 投稿URL(PFごと)
  edit_variant: string;                        // 動画の編集差分(空=3PF同一)
  created_at: string;
}

export interface WinPattern {
  id: string;
  audience: string;
  purpose_main: string; // 投稿目的が違う企画を同じ成功として数えない
  concern: string;
  theme: string;
  values_combo: string[];
  hook_type: string;
  duration_sec: number | null;
  style: string;
  cta_strength: string;
  metric: string;
  success_count: number;
  fail_count: number;
  platforms: string[];
  effective_purposes: string[];
  reproducibility: string;
  confidence: 'low' | 'mid' | 'high';
  next_hypothesis: string;
  status: 'candidate' | 'confirmed' | 'retired';
  created_at: string;
  updated_at: string;
}
