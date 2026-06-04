-- wildflow Supabase スキーマ & RLSポリシー

-- ───────────────────────────────────────────
-- posts テーブル
-- ───────────────────────────────────────────
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  thumbnail_url text,
  youtube_url text,
  external_url text,
  tags text[] default '{}',
  status text not null default 'draft' check (status in ('published', 'draft')),
  created_at timestamptz not null default now()
);

-- ───────────────────────────────────────────
-- quiz_results テーブル
-- ───────────────────────────────────────────
create table if not exists quiz_results (
  id uuid primary key default gen_random_uuid(),
  animal_type text not null check (animal_type in ('lion', 'cheetah', 'monkey', 'sloth')),
  created_at timestamptz not null default now()
);

-- ───────────────────────────────────────────
-- RLS 有効化
-- ───────────────────────────────────────────
alter table posts enable row level security;
alter table quiz_results enable row level security;

-- 既存ポリシーをクリア（再実行時の冪等性確保）
drop policy if exists "published_posts_public_read"  on posts;
drop policy if exists "all_posts_anon_write"         on posts;
drop policy if exists "quiz_results_anon_insert"     on quiz_results;

-- ───────────────────────────────────────────
-- posts RLSポリシー
-- ───────────────────────────────────────────

-- 1. 公開記事は誰でも読める（フロントのブログ表示用）
create policy "published_posts_public_read" on posts
  for select
  using (status = 'published');

-- 2. 書き込み（insert / update / delete）は anon キーで全許可
--    ※ wildflow の管理画面は固定パスワード認証（Supabase Auth 未使用）のため
--       anon キーで全操作を許可。本番では IP制限 or Edge Function 経由を推奨。
create policy "all_posts_anon_write" on posts
  for all
  using (true)
  with check (true);

-- ───────────────────────────────────────────
-- quiz_results RLSポリシー
-- ───────────────────────────────────────────

-- 診断結果の集計は誰でも挿入可（匿名ユーザーの診断結果を記録）
create policy "quiz_results_anon_insert" on quiz_results
  for insert
  with check (true);
