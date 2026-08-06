-- ═══════════════════════════════════════════════════════════════
-- 企画工場 追加マイグレーション (2026-07-27b)
-- ① pf_results: 1企画×複数プラットフォーム投稿の管理項目を追加
-- ② バドミントン素材: 本人の競技経験として承認(kawabado数値・実績は禁止のまま)
-- 適用: Supabase SQL Editor で実行(冪等)
-- ═══════════════════════════════════════════════════════════════

-- ① 投稿結果に URL・編集差分メモを追加
--    (pf_results は元々 idea_id に unique 制約がなく、1企画に複数行=複数PF登録可能)
alter table pf_results add column if not exists post_url text not null default '';
alter table pf_results add column if not exists edit_variant text not null default '';
  -- edit_variant: 動画が3PFで同一なら空、差分があれば内容を記録(例: 「TikTokのみトレンド音源差し替え」)

-- ② バドミントン素材を「本人の競技経験」として承認範囲を明確化
update pf_materials
set
  title = 'バドミントン競技の本人経験(左右差・切り返し・体重移動・連動)',
  body = 'バドミントンを本人が継続している。競技中に感じる左右差・切り返し・体重移動・身体の連動と、Animal Flowの練習を通じて本人が感じた身体上の気づき(競技者としての主観的な経験)を語れる。',
  wildflow_relevance = '競技者向け応用企画(athlete)の一次情報。本人の身体感覚・主観的経験の範囲でwild-flowで使用可',
  public_usage_status = 'approved',
  approved_by_owner = true,
  approved_at = now(),
  verified = true,
  fact_status = 'confirmed',
  source_reference = '本人承認(2026-07-27 指示): 本人の競技経験としてwild-flowで使用可',
  prohibited_claims = 'kawabadoの参加人数・大会実績・売上・参加者情報・他の参加者の身体的変化には言及しない。「Animal Flowで必ずバドミントンが上達する」等の断言、医学的・科学的根拠が必要な効果の断言、「競技練習の代替になる」という表現は禁止'
where title = 'バドミントンコミュニティの主宰経験';

-- 確認用:
-- select title, public_usage_status, approved_by_owner from pf_materials order by created_at;
