# wildflow バドミントン・ピボット 実装レポート（2026-09-18）

- リポジトリ: `~/wildflow-platform`（wild-flow.com）
- ブランチ: `feat/badminton-pivot`（push 済み。main には触れていない）
- 分岐元: `ux-audit/quick-wins-2026-09-09` の先端（34af25e）。main より2コミット先の、UX監査 Quick Wins を含む状態から切った。理由は「6. 自分で判断した箇所」参照。

## 0. 最初に伝えるべきこと：指示書が見つからなかった

`docs/wildflow-pivot-brief.md` は `~/ai-company` にも `~/wildflow-platform` にも存在せず、Mac 全体（Spotlight）・過去の Claude Code セッション・Google Drive・Claude Docs・ブックマークも探したが、同名・同内容のファイルは無かった。git 履歴にも痕跡が無い。**ファイルが保存されていない可能性が高い**（別ツールで書いた本文を保存し忘れた等）。

そのため、依頼文に書かれたタスク一覧（P0-1〜P1-9）と禁止事項だけを正として実装した。指示書にあるはずの次の2つは、AI が代筆した：

- **/badminton のコピー案**（見出し・本文）
- **5軸対応表**（筋力・持久力・スピード・柔軟性・調整力 × コートの場面 × Animal Flow の動き）

代筆の材料は、しょっちゃん自身が以前 Claude で作った冊子 `ANIMAL FLOW × BADMINTON`（Level 1 マニュアル準拠、~/Library/Application Support/Claude/local-agent-mode-sessions 配下の `AnimalFlow_Badminton_L1.docx`）。動きの名称と「バドに活かす」の対応関係はそこから取り、文章は書き直した。**指示書が見つかったら、/badminton のコピーと対応表を指示書のものに差し替えること。** 差し替え場所は `public/badminton.html` の `<header class="hero">` と `<section class="why" id="axes">`。

## 1. 完了したタスクと変更ファイル

| タスク | コミット | 変更ファイル |
|---|---|---|
| P0-1 トップのヒーロー改修 | cbd4c84 | `src/pages/HomePage.tsx` |
| P0-3 /beginner 新設 | d06c0c8 | `public/beginner.html`（新規・animalflow.html のコピーを再編集）、`vite.config.ts`（dev で `/beginner` → `beginner.html` に解決するミドルウェア） |
| P0-2 /badminton 新設 | 2689b76 | `public/badminton.html`（新規）、`public/sitemap.xml` |
| P0-4 診断結果の出口3ブロック | 9712901 | `src/utils/entry.ts`（新規・sessionStorage）、`src/components/ResultExits.tsx`（新規）、`src/pages/QuickQuiz.tsx`、`src/pages/QuickQuizResult.tsx` |
| P0-6 /lessons 空表示→通知フォーム | 1e7a938 | `src/components/LessonNotifyForm.tsx`（新規）、`src/pages/LessonsPage.tsx` |
| P1-7 バド症状×Animal Flow 対応表（10項目） | fd65cd9 | `public/badminton.html`（`#symptoms` セクション） |
| P1-8 ブログ記事3本 | e179d8a | `docs/blog-drafts/*.md`（下書き4ファイル。DB には入れていない。後述） |
| P1-9 60問リンクをナビとトップから外す（A案） | caad3d3 | `src/components/Header.tsx`、`src/components/Footer.tsx`、`src/pages/HomePage.tsx` |
| （追加）staging プレビュー用 CI | 2b5479c | `.github/workflows/staging-preview.yml`（新規） |

各コミットとも `npm run build`（tsc -b && vite build）が通ることを確認してからコミットした。375px 幅は各ページで `scrollWidth === 375`（横はみ出し無し）を確認し、トップ・/beginner・/badminton・/lessons・診断結果はスクリーンショットでも確認した。

### 動きの要点
- **トップ**: FV は「🏸 バドミントンをしている → /badminton」「🌱 運動は苦手・はじめて → /beginner」の2ボタンだけ。10問診断の CTA は「身体のMBTI」セクションと最下部に残した（FV からは消した）。
- **/badminton**（静的HTML）: ヒーロー → なぜ床の動きか（3カード + 写真枠）→ 5軸×コートの場面 対応表 → 症状10個 → 練習前5分（動画枠）→ 出口3つ（10問診断 / レッスン / kawabado 通常活動・UTM付き）。
- **/beginner**（静的HTML）: ヒーロー → こんな方へ（4つ）→ まず1分（Static Beast の手順 + 写真枠）→ 既存の Animal Flow 説明と6ステップ（animalflow.html 由来・本文そのまま）→ 出口3つ（10問診断 / レッスン / ブログ）。
- **診断結果**: `/quiz/quick?entry=badminton|beginner` で来ると `sessionStorage` に控え、結果ページの出口3ブロックが変わる。
  - badminton: ①伸びしろの軸→コートの場面と床の動き（/badminton#axes へ）②レッスン ③kawabado
  - beginner: ①伸びしろの軸→/beginner の該当ステップへ ②レッスン ③ブログ
  - それ以外: ①animalflow.html ②レッスン ③「あなたはどっち？」の2ボタン（+ 従来の kawabado 案内）
  - ②レッスンは「実際に買えるものだけ案内する」既存ロジック（G-3）をそのまま移した。診断ロジック・判定は触っていない。
- **/lessons**: 開催予定0件のときに、興味（バド向け／はじめての方向け／どちらでも）+ メールの通知登録フォームを表示。保存先は既存の `quiz_leads`（`name='（開催通知）'`, `wild_type='開催通知希望：…'`, `source='lesson_notify'`）。`source` 列が無い環境では 10問診断と同じく PGRST204 を検知して source 抜きで入れ直す。受講者の声3件は元のまま。**送信の実地テストは本番DBに書くことになるのでしていない。**

## 2. スキップ／未完了のタスクと理由

| 項目 | 状態 | 理由 |
|---|---|---|
| P1-8 ブログ記事の **公開** | 下書きのみ（`~/wildflow-platform/docs/blog-drafts/`） | ブログは Supabase `posts` テーブル配信で、書き込みは管理者ログインが必要。AI が本番DBに直接 INSERT するのは「本番とお金は確認後」の方針に反するため、markdown 下書きにした。公開手順は同ディレクトリの README.md。 |
| 手元からの staging デプロイ | 失敗 → CI に切り替え | ローカルの wrangler OAuth トークンに `workers:write` が無い（`wrangler login` の再実行が必要で、これは本人しかできない）。代わりに `feat/**` ブランチの push で staging Worker にだけ配信する CI を追加した。 |
| P0-5（kawabado 側） | 対象外 | 指示どおり。 |

## 3. 自分で判断した箇所と理由（「最も無難な方」を選んだ）

1. **指示書が無いまま進めた**（0. 参照）。止めるより、依頼文の一覧で作り切って差し替え箇所を明示する方が戻ってきたときの手戻りが少ない。
2. **分岐元を main ではなく `ux-audit/quick-wins-2026-09-09` の先端にした。** `git checkout -b` を打った時点のブランチがこれで、main より2コミット先（診断→行動の行き止まり修正、買えるもの検知）。今回の実装はその2コミット（`ProductHealth`、`KawabadoInvite`）に依存しているため、main から切ると壊れる。main へ入れるときは ux-audit の2コミットごと入れる必要がある。
3. **/beginner と /badminton を静的HTML（public/）にした。** 指示が「animalflow.html のコピーを流用」だったため。React ページにするとヘッダー／フッターが付く代わりに、animalflow.html の見た目・動画枠の仕組みを捨てることになる。静的HTMLはサイト共通ヘッダーが無いので、代わりにページ上部に戻り導線（ロゴ・3リンク）を置いた。URL は `/beginner`（拡張子なし）。本番 Workers の assets 設定が `.html` を自動解決するので動く（`/animalflow` と同じ）。vite dev だけは解決しないので `vite.config.ts` に小さなミドルウェアを足した。
4. **entry の控えは sessionStorage、キーは `wildflow.entry.v1`。** 既存の診断結果の控え（`wildflow.quickQuiz.result.v1`）と同じ作法。個人情報は含まない。`?entry=` が無いときは前の控えを消さない（/badminton → 診断 → 結果 → 再診断 でも入口が残る）。
5. **通知フォームの保存先に既存の `quiz_leads` を使った。** 新テーブル・マイグレーションは禁止のため。管理画面のリードタブでそのまま読める。`scores` は `{}` を入れている（列が NOT NULL でも通るように）。
6. **P1-9 は A案（ナビとトップだけ）。** 結果ページの「60問で詳しく診断する」と `/quiz` ルート自体、sitemap の `/quiz` は残した。フッターの「野生診断」は `/quiz` → `/quiz/quick` に変えた。
7. **ヘッダーに「バド向け」「はじめての方」を追加し、「ホーム」を外した**（ロゴが兼ねる）。リンクが9本になり 1024px 未満で折り返したので、PC ナビの表示を `md`（768px）→ `lg`（1024px）以上に変え、それ未満はハンバーガーにした。
8. **効果表現**: 全ページ・全記事で「治る／改善する」は使わず、「〜が起きにくくなる体の使い方」「治療ではない」「痛みが続くなら医療機関へ」を明記した。
9. **kawabado への送客 UTM**: `/badminton` の出口は `utm_campaign=badminton_page`、診断結果（バド入口）は `quick_quiz_result_badminton`。既存の作法（`kawabadoActivityUrl`）どおり。
10. **CI ワークフローを1本追加した**（staging のみ、main・本番デプロイには一切触れない）。手元から staging を出せないための代替。不要なら `.github/workflows/staging-preview.yml` を消すだけ。

## 4. 9/22 の撮影で必要な素材リスト

すべて空枠（サイズと alt だけ設定）。写真は `class="ph-img"` の div、動画は `WF_VIDEOS` の空文字。

| # | ページ | 場所 | 素材 | 推奨サイズ | 差し替え方 |
|---|---|---|---|---|---|
| 1 | /badminton | 「コートの動きは、床の上でつくれる。」3カードの直下 | **写真**：体育館の床で Static Beast（四つん這い・膝浮かせ）。脇にラケットとシャトルを置く。横〜斜め前から | 1600×900（16:9） | `public/badminton.html` の `.ph-img.wide` を `<img src alt>` に |
| 2 | /badminton | 「練習前の5分。まずはこの3つ。」の右側 | **動画**：手首くるくる（30秒）→ Static Beast（10秒×3）→ Crab Reach（左右×3）を通しで。縦でも横でも可 | 60秒以内。YouTube か Vimeo に上げて URL を貼る | `public/badminton.html` 先頭の `WF_VIDEOS.routine` に URL |
| 3 | /beginner | 「まず1分。『四つん這いで止まる』だけ。」の右側 | **写真**：Static Beast を真横から。膝が2〜3cm浮いているのが分かる高さ | 1200×900（4:3） | `public/beginner.html` の `.ph-img` |
| 4 | /beginner | 6ステップ（①〜⑥）の各動画枠 | **動画**×6：手首くるくる／Static Beast・Crab／Loaded Beast・Ape Reach・Crab Reach／Traveling Beast・Crab／Underswitch・Kickthrough／Beast Flow | 各30〜60秒 | `public/beginner.html` 先頭の `WF_VIDEOS`（wrist / activation / fss / traveling / switches / flow）。※ `/animalflow.html` と同じ6本なので、撮ればそちらにも同じ URL を入れられる |
| 5 | ブログ①（膝） | サムネ + 本文2枚 | Static Beast 横から（サムネ兼用）／正面（膝が外を向く角度） | 1200×675 | `docs/blog-drafts/2026-09-18-badminton-knee-after-smash.md` のコメント位置 |
| 6 | ブログ②（持久力・腰） | サムネ + 本文2枚 | Static Crab 横から／正面（胸を天井に）。サムネは Traveling Crab の移動中 | 1200×675 | `…late-rally-stance.md` |
| 7 | ブログ③（肩） | サムネ + 本文（2枚組） | Crab Reach（片手を頭上後方・胸を開く）。構え→リーチの2枚 | 1200×675 ／ 800×600×2 | `…highback-shoulder.md` |
| 8 | トップ（任意） | ヒーロー背景 | 現状はグラデーションのみ。バド×床の1枚があれば差し替え候補 | 1600×900 | `src/pages/HomePage.tsx` の hero `style.background` |
| 9 | OGP（任意） | /badminton・/beginner の `og:image` | 現状は共通の `/ogp.png`。ページ専用があれば | 1200×630 | 各 HTML の `<meta property="og:image">` |

作らなかったもの: バド版の受講者の声、実績数値、効果の断定表現。/lessons の既存の声3件はそのまま。

## 5. プレビューURL

- **staging（Cloudflare Worker）**: https://wildflow-platform-staging.shodorannga.workers.dev/
  - トップ ／ `/badminton` ／ `/beginner` ／ `/lessons` ／ `/quiz/quick?entry=badminton` → 結果
  - 配信は GitHub Actions「Staging preview」（`feat/**` への push で自動）。初回の run: https://github.com/shocchan/wildflow-platform/actions/runs/35342831781
  - **CI の結果は末尾「7. プレビューの配信結果」を見ること。** CI の `CLOUDFLARE_API_TOKEN` に staging Worker の権限が無ければ失敗している。その場合は手元で `npx wrangler login`（本人操作）→ `npx wrangler deploy --env staging` で出せる。
- ブランチ: https://github.com/shocchan/wildflow-platform/tree/feat/badminton-pivot
- ローカル: `cd ~/wildflow-platform && git checkout feat/badminton-pivot && npm run dev` → http://localhost:5173

## 6. 戻ってきた人が最初に確認すべき点（3つ）

1. **指示書の所在。** `docs/wildflow-pivot-brief.md` が無かった。手元にあれば、/badminton のコピーと5軸対応表を指示書のものに差し替える（差し替え場所は 0. に記載）。無ければ、AI 代筆のままで良いか判断する。
2. **staging の表示（特にスマホ）。** トップの分岐ボタン → /badminton → 「10問診断」→ 結果ページの出口3ブロックが「🏸 バドミントンの体に戻すと」になっているか。/lessons の通知フォームが出ているか（送信テストは本番DBに1行入るので、テストするなら管理画面のリードタブで消す前提で）。
3. **main へ入れる前の前提。** このブランチは `ux-audit/quick-wins-2026-09-09` の上に乗っている（main より2コミット先）。main へマージするときは ux-audit の2コミットも一緒に入る。本番デプロイは `./deploy.sh` で CEO 判断（今回は実行していない）。あわせて Supabase の `20260824_quiz_leads_source.sql` が未適用だと、通知フォームのリードは `source` 無し（= 'full' 扱い）で入るので、管理画面では `name='（開催通知）'` で見分ける。

## 7. プレビューの配信結果

- GitHub Actions「Staging preview」run 35342831781: **success**（2026-09-18 21:1x JST）。
- 確認済み: staging のトップが返す JS のハッシュ（`index-C57PBMWW.js`）が手元の `feat/badminton-pivot` のビルドと一致。`/badminton`・`/beginner` が新しい静的HTMLを返す（200）。
- つまり **https://wildflow-platform-staging.shodorannga.workers.dev/ で今回の変更がそのまま見られる。** 本番 wild-flow.com は変更していない。


---

# 追記（2026-09-18 夜）：「ガラッと改善案」の実装

CEO の「全部ガラッと改善案を実行して。staging で」を受けて、同じブランチ `feat/badminton-pivot` に追加した。本番は未変更。

## 実装したもの

| 提案 | 実装 | ファイル |
|---|---|---|
| 診断ページの見出し・質問文を入口ごとに | バド入口：「バド体力チェック／コートで先に疲れるのはどこ？」+ 10問すべてコートの言い回しに。はじめて入口：やさしい言い回し。**id・軸・逆転は元のまま**なので配点・判定は不変 | `src/data/entryCopy.ts`（新規）、`src/pages/QuickQuiz.tsx` |
| 診断の名前を用途別に | バド体力チェック／はじめての身体チェック／簡易診断。結果ページの見出しも連動 | 同上、`src/pages/QuickQuizResult.tsx` |
| 結果を「今日やる1動作」で始める | 結果の直後に軸ごとの1動作（手順3つ + 30秒動画枠）。動画URLは `entryCopy.ts` の `TODAY_MOVE[軸].video` に入れるだけ | `src/components/TodayMove.tsx`（新規） |
| メール登録の理由を変える | 「解説を送る」→「その軸の動きを週1本・30秒動画つきで送る」。バド入口は A4 シートもすぐ届く、と明記 | `src/data/entryCopy.ts`、`QuickQuizResult.tsx` |
| 60問・22タイプはバドで使わない | バド入口では「動物タイプ」ブロックと「60問で詳しく」を出さない。はじめて／その他では残す | `QuickQuizResult.tsx` |
| 練習前5分を印刷できる1枚に | `/routine`：A4 1枚の印刷CSS付き。写真3枚は空枠。「今日のコートで意識する」チェック欄付き。noindex | `public/routine.html`（新規） |
| 症状10項目をセルフチェックに | カードにチェックボックス。チェックすると、共通する床の動きを集計して上位3つを表示。保存も送信もしない | `public/badminton.html`（`#symptoms`） |

## やらなかったもの
- **kawabado 側の逆導線**（活動ページ→/badminton）: 別リポジトリ（P0-5 相当）のため今回も対象外。
- **Level 1 冊子の販売／特典化**: 冊子は Animal Flow® 公式マニュアル準拠の内容で、配布の可否（著作権）を CEO が判断する必要がある。代わりに A4 ルーティンシート（自作コピー）を特典にした。
- **週1本の動画メール**: 送る仕組み（配信）はまだ無い。登録は quiz_leads に貯まるだけ。文言で約束しているので、配信手段（Resend で手動でもよい）を決めるまでは、登録者に手動で送る前提。

## 追加の素材（9/22）
- `/routine` の写真3枚：手首くるくる（手元）／Static Beast（横）／Crab Reach（斜め前）。各 800×600。
- 「今日やる1動作」の30秒動画×5（Static Beast／Static Crab／Underswitch／Crab Reach／Beast Reach）。縦動画可。
- `/routine` 右下の QR（wild-flow.com/badminton へ）。

## 確認したこと
- `npm run build` 通過。375px で /badminton・/routine・診断・結果の横はみ出し無し。
- バド入口で診断→結果：見出し「コートで先に音を上げるのは」、直後に「今日やる1動作」、動物タイプと60問は非表示、出口3ブロックはバド版。
