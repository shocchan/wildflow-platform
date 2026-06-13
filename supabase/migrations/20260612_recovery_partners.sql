-- ============================================================
-- recovery_partners テーブル + ダミーデータ
-- ============================================================

create table if not exists public.recovery_partners (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  category        text not null,
  ability_tag     text,
  image_url       text not null default '',
  station_info    text not null default '',
  address         text not null default '',
  description     text not null default '',
  booking_url     text not null default '',
  display_order   integer not null default 1,
  is_published    boolean not null default false
);

-- RLS：認証ユーザーのみ全件操作可 / 匿名ユーザーは公開済みのみ参照可
alter table public.recovery_partners enable row level security;

create policy "Public read published"
  on public.recovery_partners for select
  using (is_published = true);

create policy "Admin all"
  on public.recovery_partners for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ダミーデータ 2件
insert into public.recovery_partners
  (name, category, ability_tag, image_url, station_info, address, description, booking_url, display_order, is_published)
values
  (
    'サンプルヨガスタジオ',
    'yoga',
    'flexibility',
    '',
    '川口駅 徒歩5分',
    '埼玉県川口市（仮）',
    '柔軟性の伸びしろを感じた方へ。やさしいヨガで体をゆるめましょう。',
    '#',
    1,
    true
  ),
  (
    'サンプル整骨院',
    'seikotsuin',
    null,
    '',
    '蕨駅 徒歩3分',
    '埼玉県蕨市（仮）',
    '運動後のケアや体の痛みに。経験豊富な施術で身体を整えます。',
    '#',
    2,
    true
  );

-- ============================================================
-- recovery-images ストレージバケット（Supabase Dashboard で手動作成も可）
-- ※ SQL では bucket の作成は storage スキーマの関数で行う
-- ============================================================
insert into storage.buckets (id, name, public)
values ('recovery-images', 'recovery-images', true)
on conflict (id) do nothing;

create policy "Public read recovery-images"
  on storage.objects for select
  using (bucket_id = 'recovery-images');

create policy "Auth upload recovery-images"
  on storage.objects for insert
  with check (bucket_id = 'recovery-images' and auth.role() = 'authenticated');

create policy "Auth delete recovery-images"
  on storage.objects for delete
  using (bucket_id = 'recovery-images' and auth.role() = 'authenticated');
