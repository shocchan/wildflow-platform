-- 2026-08-24 10問診断（/quiz/quick）からのリード取得に対応する
--
-- 【背景】
-- トップの主要CTA4本すべてが10問診断（/quiz/quick）に向いているのに、
-- この診断はメールを1件も取らず DB にも何も保存していなかった。
-- 結果画面に「任意」のメール入力欄を置き、既存の quiz_leads に貯める。
--
-- 【このマイグレーションでやること】
--   1. quiz_leads に source 列を足して 60問(full) / 10問(quick) を区別できるようにする
--   2. RLS の意図を明文化する（匿名は INSERT のみ・SELECT は認証済み管理者のみ）
--
-- 【適用について】
-- ⚠️ このファイルはまだ本番に適用していない。CEO/親エージェントが適用する。
-- ⚠️ 適用前でもフロントは動く。QuickQuizResult.tsx は source 列が無い場合
--    （PostgREST の PGRST204）を検知して source 抜きで再INSERTするようにしてある。
--    適用後は source が正しく入る。

-- ───────────────────────────────────────────
-- 1. source 列
-- ───────────────────────────────────────────
-- 既存行はすべて60問診断由来なので default 'full' で埋まる。
alter table public.quiz_leads
  add column if not exists source text not null default 'full';

comment on column public.quiz_leads.source is
  'リードの取得元: full=60問診断(/quiz) / quick=10問診断の結果画面(/quiz/quick/result)';

-- ───────────────────────────────────────────
-- 2. RLS（意図の明文化・現状が正しければ実質No-op）
-- ───────────────────────────────────────────
-- 🚨 匿名(anon)に SELECT を与えないこと。与えるとメールアドレスが公開される。
--    ここでは INSERT ポリシーと、管理者(authenticated)向けポリシーだけを張る。
--    schema.sql の他テーブル（package_entries 等）と同じ作法。
alter table public.quiz_leads enable row level security;

drop policy if exists "quiz_leads_anon_insert"        on public.quiz_leads;
drop policy if exists "quiz_leads_authenticated_all"  on public.quiz_leads;

-- 匿名は書き込みのみ（読み返し不可）。フロントは .select() を付けずに insert している。
create policy "quiz_leads_anon_insert" on public.quiz_leads
  for insert with check (true);

-- 管理画面（/admin のリードタブ）はログイン済みユーザーとして読む
create policy "quiz_leads_authenticated_all" on public.quiz_leads
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ───────────────────────────────────────────
-- 【適用後の確認手順】(SQL Editor で実行 / 読み取りのみ)
-- ───────────────────────────────────────────
-- -- (a) 匿名SELECTポリシーが存在しないこと。roles に anon/public を含む
-- --     cmd='SELECT' の行が出たら即削除すること。
-- select policyname, cmd, roles, qual
--   from pg_policies where schemaname='public' and tablename='quiz_leads';
--
-- -- (b) 匿名キーで読めないことの実地確認（ターミナルから。200 + [] になればOK）
-- --   curl "$SUPABASE_URL/rest/v1/quiz_leads?select=email&limit=1" \
-- --     -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
--
-- -- (c) 取得元の内訳
-- select source, count(*) from public.quiz_leads group by source order by 2 desc;
