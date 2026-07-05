-- 2026-07-06 本番バグ調査で判明した DB 側の修正
--
-- 【調査結果】
-- レッスン申し込み失敗の根本原因は RLS の INSERT 拒否ではなく、
-- insert 直後の .select().single()（PostgREST の return=representation）が
-- SELECT ポリシー不在で 42501 になることだった。
--   - 匿名 INSERT 単体: lesson_entries / package_entries / quiz_leads / quiz_results すべて 201 成功
--   - INSERT + 読み返し: 42501 "new row violates row-level security policy"
-- → フロント側で読み返しを廃止して解決済み（このマイグレーションは必須ではない）。
--    ログイン済み管理者ブラウザでは成功していたため「スマホだけ壊れている」ように見えていた。
--
-- 【このマイグレーションでやること】
-- quiz_results に scores カラムが無く、診断の匿名統計 insert が
-- PGRST204 (Could not find the 'scores' column) で失敗し続けているため追加する。

alter table public.quiz_results add column if not exists scores jsonb;

-- 【運用メモ】テストデータの掃除（本調査で作成した行）
-- delete from public.lesson_entries where name like '%テスト（削除可）%' or name = '動作確認テスト';
-- delete from public.package_entries where name like '%テスト（削除可）%';
-- delete from public.quiz_leads where name like '%テスト（削除可）%';
-- delete from public.quiz_results where animal_type = 'test-debug';
