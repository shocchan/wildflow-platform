-- ═══════════════════════════════════════════════════════════════
-- 企画工場 追加マイグレーション (2026-07-27c)
-- 企画ステータス(品質審査)と制作進捗(準備状態)の分離
-- 適用: Supabase SQL Editor で実行(冪等)
-- ═══════════════════════════════════════════════════════════════

-- 制作進捗(企画の採用/保留とは独立した、撮影・編集の準備状態)
alter table pf_ideas add column if not exists production_status text not null default 'not_started'
  check (production_status in
    ('not_started','awaiting_material','preparing','shot','editing','ready','posted','unpublished'));

-- 素材待ちの管理項目
alter table pf_ideas add column if not exists required_materials text not null default '';  -- 必要素材の要約
alter table pf_ideas add column if not exists material_deadline date;                       -- 撮影可能予定日/準備期限
alter table pf_ideas add column if not exists alternative_note text not null default '';    -- 期限に間に合わない場合の代替企画候補

-- WF-016: 実際の失敗映像が必要なため「素材待ち」で初期化
update pf_ideas set
  production_status = 'awaiting_material',
  required_materials = '実際の練習の失敗映像: ①動きを間違えた ②左右が分からなくなった ③途中で止まった ④フォームを見返して修正した、の各カット/同じ動きの成功映像との比較/本人が実際に感じたことのメモ。【厳守】存在しない失敗を再現して実際の失敗として扱わない。演出として再現する場合は動画内に「再現」と明記する',
  alternative_note = '素材が揃わない場合の代替: WF-023「Level 1で最初に習うこと」(保留中)の冒頭を設計し直して繰り上げ、またはWF-012型の方針語り企画を新規設計(いずれも信頼枠)'
where code = 'WF-016';

-- 確認用:
-- select code, status, production_status, material_deadline from pf_ideas where status = 'adopted' order by code;
