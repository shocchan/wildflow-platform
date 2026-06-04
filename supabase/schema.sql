-- wildflow Supabase スキーマ & RLSポリシー
-- 認証方式: Supabase Auth（メアド＋パスワード）

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
drop policy if exists "authenticated_posts_all"      on posts;
drop policy if exists "quiz_results_anon_insert"     on quiz_results;

-- ───────────────────────────────────────────
-- posts RLSポリシー
-- ───────────────────────────────────────────

-- 1. 公開記事は誰でも読める（フロントのブログ表示用）
create policy "published_posts_public_read" on posts
  for select
  using (status = 'published');

-- 2. 書き込み（insert / update / delete）は認証済みユーザーのみ
--    Supabase Auth でログインしたユーザー（管理者）だけが操作可能
create policy "authenticated_posts_all" on posts
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ───────────────────────────────────────────
-- quiz_results RLSポリシー
-- ───────────────────────────────────────────

-- 診断結果の挿入は誰でも可（匿名ユーザーの診断結果を記録）
create policy "quiz_results_anon_insert" on quiz_results
  for insert
  with check (true);

-- ───────────────────────────────────────────
-- 管理者ユーザーの作成方法
-- ───────────────────────────────────────────
-- Supabase ダッシュボード > Authentication > Users > Add user
-- または以下のSQLを実行（パスワードは強力なものに変更すること）:
--
-- select auth.create_user(
--   email    := 'your-email@example.com',
--   password := 'your-strong-password'
-- );
--
-- ※ コードにパスワードを書かない。Supabase側で管理する。
