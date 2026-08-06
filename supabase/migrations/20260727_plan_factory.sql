-- ═══════════════════════════════════════════════════════════════
-- wild-flow SNS企画工場 (Plan Factory) スキーマ
-- 2026-07-27 (監査対応版)
-- 全テーブル pf_ プレフィックス。pf_admins に登録された管理者のみアクセス可。
-- 適用方法: SUPABASE_ACCESS_TOKEN を設定して `supabase db push`
--           または Supabase ダッシュボード > SQL Editor で実行
-- 再実行: 冪等(create if not exists / drop policy if exists / on conflict)
-- ロールバック: ファイル末尾のコメント参照
-- ═══════════════════════════════════════════════════════════════

-- ── 管理者テーブル(RLSの根拠) ─────────────────────────
-- 「authenticated なら誰でも」ではなく、このテーブルに登録された
-- ユーザーだけが企画工場のデータを操作できる。
-- 行の追加・削除は service_role / SQL Editor からのみ(クライアント用ポリシーなし)。
create table if not exists pf_admins (
  user_id uuid primary key,
  email text not null default '',
  created_at timestamptz not null default now()
);
alter table pf_admins enable row level security;
drop policy if exists "pf_admins_self_read" on pf_admins;
create policy "pf_admins_self_read" on pf_admins
  for select using (user_id = auth.uid());
-- insert/update/delete のポリシーは意図的に作らない(クライアントから管理者を追加できない)

-- 管理者判定関数(security invoker: 自分の行はRLSで見えるため definer 不要)
create or replace function pf_is_admin() returns boolean
language sql stable
as $$ select exists(select 1 from pf_admins where user_id = auth.uid()) $$;

-- 【初期seed】実行時点で存在する全ユーザーを管理者として登録する。
-- このプロジェクトのSupabase Authは管理者用アカウントのみの想定。
-- ⚠️ 実行前に auth.users に不明なアカウントがないことを確認すること。
insert into pf_admins (user_id, email)
select id, coalesce(email, '') from auth.users
on conflict (user_id) do nothing;

-- ── updated_at 自動更新トリガ ──────────────────────────
create or replace function pf_set_updated_at() returns trigger
language plpgsql
as $$ begin new.updated_at = now(); return new; end $$;

-- ── ブランド情報(1行運用) ──────────────────────────────
create table if not exists pf_brand (
  id uuid primary key default gen_random_uuid(),
  core_message text not null default '',
  sub_message text not null default '',
  worldview text[] not null default '{}',
  notes text not null default '',
  updated_at timestamptz not null default now()
);

-- ── 16種の価値マップ(追加可能) ─────────────────────────
create table if not exists pf_values (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  sort_order int not null default 0,
  active boolean not null default true
);

-- ── コンテンツの柱 ─────────────────────────────────────
create table if not exists pf_pillars (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  sort_order int not null default 0,
  active boolean not null default true
);

-- ── 視聴者タイプ ───────────────────────────────────────
create table if not exists pf_audiences (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  current_state text not null default '',
  concerns text[] not null default '{}',
  desired_change text not null default '',
  resistance text not null default '',
  messages_that_work text not null default '',
  responded_posts text not null default '',
  not_responded_posts text not null default '',
  sort_order int not null default 0,
  active boolean not null default true
);

-- ── しょっちゃん固有素材DB(出典・承認メタデータつき) ──
create table if not exists pf_materials (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  body text not null default '',
  verified boolean not null default false,          -- 後方互換(fact_status='confirmed'|'site_published'と同義)
  source_type text not null default 'owner_input'
    check (source_type in ('owner_input','site_copy','interview','other')),
  source_reference text not null default '',        -- どのファイル・ページ・発言から取得したか
  fact_status text not null default 'unverified'
    check (fact_status in ('confirmed','site_published','unverified')),
  wildflow_relevance text not null default '',      -- wild-flowとの関連性
  public_usage_status text not null default 'unconfirmed'
    check (public_usage_status in ('approved','unconfirmed','prohibited')),
  approved_by_owner boolean not null default false, -- 本人がSNS使用を承認済みか
  approved_at timestamptz,
  prohibited_claims text not null default '',       -- この素材に関して語ってはいけないこと
  notes text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 競合・参考投稿の価値マップ ─────────────────────────
create table if not exists pf_reference_posts (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  platform text not null default '',
  author text not null default '',
  posted_at date,
  title text not null default '',
  hook text not null default '',
  duration_sec int,
  views bigint,
  likes bigint,
  saves bigint,
  comments bigint,
  shares bigint,
  follower_count bigint,
  theme text not null default '',
  target_audience text not null default '',
  values_used text[] not null default '{}',
  value_locations text not null default '',
  why_chosen text not null default '',
  reproducible text not null default '',
  not_reproducible text not null default '',
  application_notes text not null default '',
  created_at timestamptz not null default now()
);

-- ── 企画本体 ───────────────────────────────────────────
create table if not exists pf_ideas (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,           -- 管理番号 WF-001 等(unique制約が二重投入を防ぐ)
  title text not null,
  batch_id text not null default '',
  status text not null default 'candidate'
    check (status in ('candidate','adopted','hold','rejected','remake','posted')),
  style text not null default 'A' check (style in ('A','B','C')),
  purpose_main text not null default 'awareness'
    check (purpose_main in ('awareness','save','persona','trust')),
  purpose_sub text not null default '',
  pillar_main text not null default '',
  pillar_sub text[] not null default '{}',
  audience text not null default '',
  concern text not null default '',
  reason_to_watch text not null default '',
  core_message text not null default '',
  takeaway text not null default '',
  hook_visual text not null default '',
  hook_line text not null default '',
  moves text[] not null default '{}',
  camera_angles text not null default '',
  comparison_footage text not null default '',
  structure text not null default '',
  talking_points text[] not null default '{}',
  material_ids uuid[] not null default '{}',
  needs_material boolean not null default false,
  avoid_misunderstanding text not null default '',
  safety_notes text not null default '',
  closing_question text not null default '',
  closing_style text not null default '',
  comment_prompt text not null default '',
  keywords text[] not null default '{}',
  lesson_cta boolean not null default false,
  lesson_cta_phrase text not null default '',
  duration_sec int not null default 45 check (duration_sec between 5 and 600),
  shoot_difficulty int not null default 1 check (shoot_difficulty between 1 and 3),
  edit_difficulty int not null default 1 check (edit_difficulty between 1 and 3),
  values_used text[] not null default '{}',
  scores jsonb not null default '{}',
  score_total int not null default 0 check (score_total between 0 and 24),
  primary_metric text not null default '',
  repurpose text not null default '',
  remake_note text not null default '',
  remake_of uuid references pf_ideas(id) on delete set null,
  duplicate_of uuid references pf_ideas(id) on delete set null,
  reject_reason text not null default '',
  scheduled_week int check (scheduled_week between 1 and 4),
  scheduled_slot int check (scheduled_slot between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── AI生成ジョブ(状態管理・費用記録・レート制限の根拠) ──
create table if not exists pf_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid,
  status text not null default 'processing'
    check (status in ('processing','completed','failed')),
  quality text not null default 'standard' check (quality in ('standard','high')),
  model text not null default '',
  params jsonb not null default '{}',      -- 件数・柱・追加指示
  input_tokens int,
  output_tokens int,
  estimated_cost_usd numeric,              -- usageから計算した実測ベースの推定費用
  error text not null default '',
  ideas_json jsonb,                        -- 生成結果(ブラウザ切断でも失われない)
  imported boolean not null default false, -- pf_ideas への取り込み済みフラグ
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pf_generation_jobs_created_at_idx on pf_generation_jobs (created_at desc);

-- ── 投稿結果 ───────────────────────────────────────────
create table if not exists pf_results (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references pf_ideas(id) on delete set null,
  platform text not null default '',
  posted_at date,
  actual_title text not null default '',
  thumb_desc text not null default '',
  duration_sec int,
  views bigint,
  new_viewers bigint,
  avg_watch_sec numeric,
  retention_pct numeric,
  likes bigint,
  saves bigint,
  comments_count bigint,
  shares bigint,
  follows bigint,
  profile_views bigint,
  site_clicks bigint,
  lesson_inquiries int,
  trial_requests int,
  purchases int,
  comment_summary text not null default '',
  self_review text not null default '',
  production_issues text not null default '',
  analysis jsonb not null default '{}',
  success_judgment text check (success_judgment in ('success','fail')),  -- null=判定保留
  success_basis text not null default '',  -- 判定に使った指標と基準(必ず記録)
  created_at timestamptz not null default now()
);

-- ── 勝ちパターン候補 ───────────────────────────────────
-- 「勝ちパターン」と断定せず、成功回数に応じた段階(仮説→初回成功→再現候補→勝ちパターン候補)で扱う
create table if not exists pf_win_patterns (
  id uuid primary key default gen_random_uuid(),
  audience text not null default '',
  purpose_main text not null default '',   -- 投稿目的が違う企画を同じ成功として数えない
  concern text not null default '',
  theme text not null default '',
  values_combo text[] not null default '{}',
  hook_type text not null default '',
  duration_sec int,
  style text not null default '',
  cta_strength text not null default '',
  metric text not null default '',         -- 成功判定に使用した指標
  success_count int not null default 0,
  fail_count int not null default 0,
  platforms text[] not null default '{}',
  effective_purposes text[] not null default '{}',
  reproducibility text not null default '',
  confidence text not null default 'low' check (confidence in ('low','mid','high')),
  next_hypothesis text not null default '',
  status text not null default 'candidate' check (status in ('candidate','confirmed','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ═══ updated_at トリガ設定 ═══════════════════════════════
do $$
declare t text;
begin
  foreach t in array array['pf_brand','pf_materials','pf_ideas','pf_win_patterns','pf_generation_jobs']
  loop
    execute format('drop trigger if exists %s_set_updated_at on %I', t, t);
    execute format('create trigger %s_set_updated_at before update on %I for each row execute function pf_set_updated_at()', t, t);
  end loop;
end $$;

-- ═══ RLS: pf_admins 登録者のみ全操作可。anon・一般authenticatedは全拒否 ═══
do $$
declare t text;
begin
  foreach t in array array['pf_brand','pf_values','pf_pillars','pf_audiences','pf_materials',
                           'pf_reference_posts','pf_ideas','pf_results','pf_win_patterns','pf_generation_jobs']
  loop
    execute format('alter table %I enable row level security', t);
    -- 旧ポリシー(authenticated全員許可)が残っていれば必ず削除
    execute format('drop policy if exists "%s_auth_all" on %I', t, t);
    execute format('drop policy if exists "%s_admin_select" on %I', t, t);
    execute format('drop policy if exists "%s_admin_insert" on %I', t, t);
    execute format('drop policy if exists "%s_admin_update" on %I', t, t);
    execute format('drop policy if exists "%s_admin_delete" on %I', t, t);
    execute format('create policy "%s_admin_select" on %I for select using (pf_is_admin())', t, t);
    execute format('create policy "%s_admin_insert" on %I for insert with check (pf_is_admin())', t, t);
    execute format('create policy "%s_admin_update" on %I for update using (pf_is_admin()) with check (pf_is_admin())', t, t);
    execute format('create policy "%s_admin_delete" on %I for delete using (pf_is_admin())', t, t);
  end loop;
end $$;

-- ═══ マスタseed(冪等) ═══════════════════════════════════

insert into pf_brand (core_message, sub_message, worldview)
select '身体は、鍛えるだけではなく、使い方を学ぶことで自由になっていく。',
       '自分の身体を、自分で思いどおりに動かせる楽しさを伝える。',
       array['穏やか','自然体','遊び心','自分との対話','身体を理解する楽しさ','成長を急ぎすぎない','人と比べすぎない','小さな変化を楽しむ','身体能力と心の自由をつなげる']
where not exists (select 1 from pf_brand);

insert into pf_values (code, name, description, sort_order) values
  ('expertise','専門性','正しい知識・指導者としての裏付け',1),
  ('trend','トレンド性','今話題の切り口・音源・フォーマット',2),
  ('info_density','情報量','1本に凝縮された学びの量',3),
  ('experience','経験・実績','本人の実体験・検証の裏付け',4),
  ('rare_angle','珍しい切り口','他で見ない視点・組み合わせ',5),
  ('clarity','わかりやすさ','初心者でも一度で理解できる説明',6),
  ('relatability','親近感','等身大・失敗も見せる距離の近さ',7),
  ('production','編集・演出','テンポ・テロップ・見せ方の工夫',8),
  ('visual_pleasure','視覚的な気持ちよさ','流れる動き・美しいフォームの快感',9),
  ('growth','成長・変化','ビフォーアフター・上達の過程',10),
  ('body_awareness','身体への気づき','「自分の身体もそうかも」という発見',11),
  ('practical','実用性','その場で試せる・生活に使える',12),
  ('challenge','挑戦性','難しい動きへの挑戦・やってみたくなる',13),
  ('calm_world','穏やかな世界観','急かさない・比べない空気感',14),
  ('firsthand','インストラクターとしての一次情報','教える側だから知っている事実',15),
  ('surprise','意外性','常識の逆・予想を裏切る展開',16)
on conflict (code) do nothing;

insert into pf_pillars (code, name, description, sort_order) values
  ('beginner','初心者向けAnimal Flow','運動が苦手でも床さえあれば始められる入口',1),
  ('technique','動作解説・技術改善','ムーブの正しいやり方・よくある間違い',2),
  ('ability','身体能力別コンテンツ','柔軟性・体幹・連動性など能力別の改善',3),
  ('growth','成長・挑戦コンテンツ','検証記録・チャレンジ・ビフォーアフター',4),
  ('mind','身体と心についての穏やかな語り','身体を通じた気づき・世界観の共有',5),
  ('application','他のスポーツや日常への応用','バドミントン・筋トレ・日常動作との接点',6),
  ('backstage','インストラクターとしての裏側','練習・失敗・レッスン現場のリアル',7)
on conflict (code) do nothing;

insert into pf_audiences (code, name, current_state, concerns, desired_change, resistance, messages_that_work, sort_order) values
  ('beginner','運動を始めたい初心者',
   '運動習慣ゼロ〜ほぼゼロ。ジムは続かなかった経験がある',
   array['何から始めればいいか分からない','ジム代がもったいない','体力がなさすぎて恥ずかしい','三日坊主になりそう'],
   '無理なく続く運動習慣。身体が軽くなる感覚',
   'きつそう・難しそう・自分には無理そうという先入観',
   '道具ゼロ・床さえあればOK。1日1分から。できなくて当たり前から始める',1),
  ('lifter','筋トレ経験はあるが身体操作に課題を感じる人',
   'ジム歴あり。重量は伸びたが身体が硬い・動きがぎこちない自覚がある',
   array['筋肉はあるのに動きが硬い','肩や腰に違和感が出やすい','種目がマンネリ化している','可動域が狭い'],
   'しなやかに動ける身体。トレーニングの質の向上',
   '自重や床の運動は負荷が低そう・物足りなさそうという疑い',
   '筋トレを否定しない。筋力×身体操作で伸びしろが解放される',2),
  ('calm','身体と心を穏やかに整えたい人',
   'ストレスや疲労感が強い。ヨガやストレッチに興味がある層',
   array['疲れが抜けない','呼吸が浅い気がする','自分の時間が取れていない','激しい運動は気が進まない'],
   '心身が整う習慣。自分と向き合う時間',
   '運動系コンテンツの煽り・比較文化への苦手意識',
   '急がない・比べない。床の上で自分の身体と対話する時間',3),
  ('athlete','スポーツパフォーマンスを高めたい人',
   '競技経験者。伸び悩みや怪我予防に関心',
   array['俊敏性・切り返しが伸びない','怪我を繰り返す','体幹の弱さを指摘される','競技練習以外に何をすべきか不明'],
   '競技に直結する身体能力の向上・怪我しにくい身体',
   '競技と関係なさそうなトレーニングへの懐疑',
   '四足の動きが連動性・体幹・切り返しの土台を作る',4),
  ('hesitant','Animal Flowを知っているが難しそうで始められていない人',
   'SNSでAnimal Flow動画を見たことがある。かっこいいが自分には無理と感じている',
   array['動画の技が難しすぎる','最初の一歩が分からない','身体が硬いから無理だと思っている','独学で変な癖がつきそう'],
   '段階を踏めばできるという確信。最初の成功体験',
   '上級者向けコンテンツばかりで入口が見えない',
   'どんな技も分解すれば段階練習できる。段階分けの考え方を示す',5)
on conflict (code) do nothing;

-- 一次情報素材のseed(出典・承認状態つき。冪等)
insert into pf_materials (category, title, body, verified, source_type, source_reference, fact_status,
                          wildflow_relevance, public_usage_status, approved_by_owner, approved_at,
                          prohibited_claims, tags)
select * from (values
  ('始めた経緯',
   '上海でAnimal Flowに出会い24万円を即決した話',
   '妻に連れられて行った上海の運動教室でAnimal Flowに出会う。インストラクターの一言が頭の中で何かをつなぎ、「これを日本に持ち帰らなければ」と理屈なく感じて24万円のコースを即決した。',
   true, 'site_copy',
   'wild-flow.com トップページ掲載コピー(src/pages/HomePage.tsx)+公開済みブログ記事「妻に連れられて行った上海の謎の運動教室が、24万円を即決させた話」(2026-06-10公開)',
   'site_published',
   'wild-flowブランドの起源ストーリーとして本人がサイトに公開済み',
   'approved', true, now(),
   '教室名・講師名・日付・24万円の内訳など未提供の詳細を創作しない',
   array['origin','上海','即決']),
  ('本人の考えや哲学',
   '日本語教師×野生身体研究家という肩書き',
   '本業は日本語教師。教えるプロとしての「分かりやすく伝える技術」を身体の分野に持ち込んでいる。',
   true, 'site_copy',
   'wild-flow.com トップページ掲載コピー(src/pages/HomePage.tsx 講師カード)',
   'site_published',
   'ブランドの差別化要素として本人がサイトに公開済み',
   'approved', true, now(),
   '日本語教育の具体的な勤務先・経歴年数など未提供の詳細を創作しない',
   array['背景','教える技術']),
  ('資格・実績(確定情報)',
   'Animal Flow Level 1 認定インストラクター(資格保有の事実)',
   'Animal Flow Level 1の認定インストラクターである(2026-07-27 本人明示)。確定しているのは資格保有の事実のみ。取得時の経験談は別素材として本人からの提供待ち。',
   true, 'owner_input',
   '本人申告(2026-07-27 企画工場監査指示にて明示)',
   'confirmed',
   'インストラクターとしての信頼の根拠。専門性・一次情報価値の裏付け',
   'approved', true, now(),
   '取得日・取得場所・講師名・講習中に苦戦した内容・認定試験の内容・指導人数・指導実績の数値・取得時の感情や発言は未提供のため創作しない',
   array['資格','Level1','確定']),
  ('バドミントンとの接点',
   'バドミントン競技の本人経験(左右差・切り返し・体重移動・連動)',
   'バドミントンを本人が継続している。競技中に感じる左右差・切り返し・体重移動・身体の連動と、Animal Flowの練習を通じて本人が感じた身体上の気づき(競技者としての主観的な経験)を語れる。',
   true, 'owner_input',
   '本人承認(2026-07-27 指示): 本人の競技経験としてwild-flowで使用可',
   'confirmed',
   '競技者向け応用企画(athlete)の一次情報。本人の身体感覚・主観的経験の範囲でwild-flowで使用可',
   'approved', true, now(),
   'kawabadoの参加人数・大会実績・売上・参加者情報・他の参加者の身体的変化には言及しない。「Animal Flowで必ずバドミントンが上達する」等の断言、医学的・科学的根拠が必要な効果の断言、「競技練習の代替になる」という表現は禁止',
   array['バドミントン','競技','本人経験'])
) as v(category, title, body, verified, source_type, source_reference, fact_status,
       wildflow_relevance, public_usage_status, approved_by_owner, approved_at, prohibited_claims, tags)
where not exists (select 1 from pf_materials);

-- ═══════════════════════════════════════════════════════════════
-- 【ロールバック】(必要な場合のみ手動実行)
-- drop table if exists pf_results, pf_generation_jobs, pf_win_patterns,
--   pf_reference_posts, pf_ideas, pf_materials, pf_audiences, pf_pillars,
--   pf_values, pf_brand, pf_admins cascade;
-- drop function if exists pf_is_admin(), pf_set_updated_at() cascade;
-- ═══════════════════════════════════════════════════════════════
