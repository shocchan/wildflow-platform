// pf_* テーブルへのCRUD。テーブル未作成(マイグレーション未適用)を検知できるようにする。

import { supabase } from '../../services/supabaseClient';
import type {
  Audience, Brand, GenerationJob, Idea, IdeaDraft, Material, Pillar, PostResult, ReferencePost, ValueDef, WinPattern,
} from './types';

/** マイグレーション未適用(テーブル不存在)エラーか判定 */
export function isMissingTableError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
  return /relation .* does not exist|Could not find the table|PGRST205|42P01/i.test(msg);
}

function throwIfError<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

// ── ブランド ──
export async function fetchBrand(): Promise<Brand | null> {
  const { data, error } = await supabase.from('pf_brand').select('*').limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Brand | null;
}
export async function saveBrand(brand: Partial<Brand> & { id?: string }): Promise<void> {
  if (brand.id) {
    const { error } = await supabase.from('pf_brand')
      .update({ ...brand, updated_at: new Date().toISOString() }).eq('id', brand.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('pf_brand').insert([brand]);
    if (error) throw new Error(error.message);
  }
}

// ── マスタ(価値・柱・視聴者) ──
export async function fetchValues(): Promise<ValueDef[]> {
  const { data, error } = await supabase.from('pf_values').select('*').order('sort_order');
  return throwIfError(data, error) as ValueDef[];
}
export async function upsertValue(v: Partial<ValueDef>): Promise<void> {
  const { error } = v.id
    ? await supabase.from('pf_values').update(v).eq('id', v.id)
    : await supabase.from('pf_values').insert([v]);
  if (error) throw new Error(error.message);
}

export async function fetchPillars(): Promise<Pillar[]> {
  const { data, error } = await supabase.from('pf_pillars').select('*').order('sort_order');
  return throwIfError(data, error) as Pillar[];
}

export async function fetchAudiences(): Promise<Audience[]> {
  const { data, error } = await supabase.from('pf_audiences').select('*').order('sort_order');
  return throwIfError(data, error) as Audience[];
}
export async function upsertAudience(a: Partial<Audience>): Promise<void> {
  const { error } = a.id
    ? await supabase.from('pf_audiences').update(a).eq('id', a.id)
    : await supabase.from('pf_audiences').insert([a]);
  if (error) throw new Error(error.message);
}

// ── 素材 ──
export async function fetchMaterials(): Promise<Material[]> {
  const { data, error } = await supabase.from('pf_materials').select('*').order('created_at', { ascending: false });
  return throwIfError(data, error) as Material[];
}
export async function upsertMaterial(m: Partial<Material>): Promise<void> {
  const payload = { ...m, updated_at: new Date().toISOString() };
  const { error } = m.id
    ? await supabase.from('pf_materials').update(payload).eq('id', m.id)
    : await supabase.from('pf_materials').insert([payload]);
  if (error) throw new Error(error.message);
}
export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('pf_materials').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── 参考投稿 ──
export async function fetchReferencePosts(): Promise<ReferencePost[]> {
  const { data, error } = await supabase.from('pf_reference_posts').select('*').order('created_at', { ascending: false });
  return throwIfError(data, error) as ReferencePost[];
}
export async function upsertReferencePost(p: Partial<ReferencePost>): Promise<void> {
  const { error } = p.id
    ? await supabase.from('pf_reference_posts').update(p).eq('id', p.id)
    : await supabase.from('pf_reference_posts').insert([p]);
  if (error) throw new Error(error.message);
}
export async function deleteReferencePost(id: string): Promise<void> {
  const { error } = await supabase.from('pf_reference_posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── 企画 ──
export async function fetchIdeas(): Promise<Idea[]> {
  const { data, error } = await supabase.from('pf_ideas').select('*').order('code');
  return throwIfError(data, error) as Idea[];
}
export async function insertIdeas(drafts: IdeaDraft[]): Promise<void> {
  const { error } = await supabase.from('pf_ideas').insert(drafts);
  if (error) throw new Error(error.message);
}

/**
 * 冪等な一括投入(seed用)。code のunique制約に基づき既存はスキップ、上書きしない。
 * 戻り値は実際に挿入された件数(スキップ数 = 総数 - 挿入数)。
 */
export async function upsertIdeasSkipExisting(drafts: IdeaDraft[]): Promise<number> {
  const { data, error } = await supabase.from('pf_ideas')
    .upsert(drafts, { onConflict: 'code', ignoreDuplicates: true })
    .select('code');
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}
export async function updateIdea(id: string, patch: Partial<Idea>): Promise<void> {
  const { error } = await supabase.from('pf_ideas')
    .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}
export async function nextIdeaCode(): Promise<string> {
  const { data, error } = await supabase.from('pf_ideas').select('code').order('code', { ascending: false }).limit(1);
  if (error) throw new Error(error.message);
  const last = data?.[0]?.code as string | undefined;
  const n = last?.match(/WF-(\d+)/)?.[1];
  return `WF-${String((n ? parseInt(n, 10) : 0) + 1).padStart(3, '0')}`;
}

// ── 投稿結果 ──
export async function fetchResults(): Promise<PostResult[]> {
  const { data, error } = await supabase.from('pf_results').select('*').order('posted_at', { ascending: false });
  return throwIfError(data, error) as PostResult[];
}
export async function upsertResult(r: Partial<PostResult>): Promise<void> {
  const { error } = r.id
    ? await supabase.from('pf_results').update(r).eq('id', r.id)
    : await supabase.from('pf_results').insert([r]);
  if (error) throw new Error(error.message);
}

// ── AI生成ジョブ ──
export async function fetchJobs(limit = 20): Promise<GenerationJob[]> {
  const { data, error } = await supabase.from('pf_generation_jobs')
    .select('*').order('created_at', { ascending: false }).limit(limit);
  return throwIfError(data, error) as GenerationJob[];
}
export async function createJob(job: Partial<GenerationJob>): Promise<GenerationJob> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('pf_generation_jobs')
    .insert([{ ...job, created_by: user?.id ?? null }])
    .select().single();
  return throwIfError(data, error) as GenerationJob;
}
export async function updateJob(id: string, patch: Partial<GenerationJob>): Promise<void> {
  const { error } = await supabase.from('pf_generation_jobs').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

// ── 勝ちパターン ──
export async function fetchWinPatterns(): Promise<WinPattern[]> {
  const { data, error } = await supabase.from('pf_win_patterns').select('*').order('updated_at', { ascending: false });
  return throwIfError(data, error) as WinPattern[];
}
export async function upsertWinPattern(w: Partial<WinPattern>): Promise<void> {
  const payload = { ...w, updated_at: new Date().toISOString() };
  const { error } = w.id
    ? await supabase.from('pf_win_patterns').update(payload).eq('id', w.id)
    : await supabase.from('pf_win_patterns').insert([payload]);
  if (error) throw new Error(error.message);
}
