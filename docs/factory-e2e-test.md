# 企画工場 E2Eテスト手順(APIキー設定後に実施)

前提: DBマイグレーション適用済み・`wrangler secret put ANTHROPIC_API_KEY` 済み・デプロイ済み。
現時点のAI生成の状態: **コード実装済み(実API疎通は未確認)**。以下を順に実施して疎通を確認する。

## 0. 実施前チェック
- [ ] Supabase > Authentication > Users に不明なアカウントがないこと(pf_adminsのseed対象になるため)
- [ ] Supabase > Authentication > Sign In / Up で新規サインアップが無効になっていること(推奨)
- [ ] `select * from pf_admins;` に管理者のuser_idが入っていること

## 1. 認証・認可(Workerだけで確認可能)
```bash
# 未認証 → 401 になること
curl -s -X POST https://wild-flow.com/api/factory/generate -d '{}' | head -c 200
# 不正JWT → 401 になること
curl -s -X POST https://wild-flow.com/api/factory/generate -H 'Authorization: Bearer xxx' -d '{}' | head -c 200
```

## 2. 画面からの最小生成(実API疎通)
1. `/admin/factory` にログイン → 「⚙️ 生成」タブ
2. 生成数 **1**・モデル **標準** で「AI生成を実行」
3. 確認項目:
   - [ ] 実行ログに「モデル: claude-sonnet-5(または設定値)」が出る
   - [ ] 実測トークン(入力/出力)と実測費用($)が表示される
   - [ ] ジョブ履歴に completed のジョブが記録され、費用が入っている
   - [ ] 企画ボードに新しいWF-xxxが追加される(または除外理由がログに出る)

## 3. 検証系の動作確認
- [ ] 生成数10で1回実行 → 出力が途切れる場合の truncated 警告が正しく出るか
- [ ] 実行中にもう一度実行 → 「実行中の生成ジョブがあります」(429) になること
- [ ] 6回連続実行 → 6回目が「1時間の生成上限」(429) になること
- [ ] 生成直後にタブを閉じ、再度開く → ジョブ履歴に completed / 未取込 のジョブが残り、「取り込み」で企画化できること

## 4. データ品質の確認
- [ ] 生成された企画の values_used がすべて実在コードであること
- [ ] 未承認素材(バドミントン)への言及が生成物に含まれないこと
- [ ] scores合計とscore_totalが一致していること(コード側で再計算されている)

## 5. 費用確認
- Anthropic Console の Usage と、ジョブ履歴の estimated_cost_usd 合計を突き合わせる
  (sonnet-5は2026-08-31まで導入価格 $2/$10 のため、実請求はジョブ記録より安くなる)
