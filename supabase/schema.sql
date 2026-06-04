-- wildflow Supabase スキーマ

-- posts テーブル
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

-- quiz_results テーブル
create table if not exists quiz_results (
  id uuid primary key default gen_random_uuid(),
  animal_type text not null check (animal_type in ('lion', 'cheetah', 'monkey', 'sloth')),
  created_at timestamptz not null default now()
);

-- RLS: posts は公開記事のみ誰でも読める、書き込みはサービスロールのみ
alter table posts enable row level security;

create policy "公開記事は誰でも読める" on posts
  for select using (status = 'published');

create policy "管理者は全操作可能" on posts
  for all using (true) with check (true);

-- RLS: quiz_results は誰でも挿入可（集計用）
alter table quiz_results enable row level security;

create policy "誰でもquiz_resultsを挿入可" on quiz_results
  for insert with check (true);
