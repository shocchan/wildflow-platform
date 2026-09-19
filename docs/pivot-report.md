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


---

# 追記（2026-09-18 深夜）：しょっちゃんキャラのイラストを全ページに

CEO の「しょっちゃんキャラを使ってイラストをはめ込んで。生成は ChatGPT で」を受けて実施。同じブランチに2コミット追加、staging 反映。

## 使った素材
- **既存イラスト8枚**（`~/Downloads/しょっちゃんのイラスト類/`：正面・スマッシュ・逆立ち・喜び・綱渡り・サーブ・フォア・バック。青タオル＋グレーパーカーの統一画風・透過）→ `public/img/shocchan/*.webp`
- **ChatGPT 生成10枚**（上の4枚を参照画像として添付し、同じ画風で。ブリーフは `docs/wildflow-illustration-brief.md`）
  - 床の動き: `beast`（膝浮かせ・修正1回）／`crab`／`crab-reach`／`wrist`／`underswitch`／`beast-reach`
  - バドの症状: `knee-wobble`（着地で膝が笑う）／`high-stance`（構えが高い）／`shoulder-stuck`（ハイバックで肩）
  - `five-axes`（5つの力を5ポーズで、横長1枚）
  - すべて透過PNG → 余白トリム → WebP（q82、最大1024px、1枚50〜120KB）。md5 で10枚が別物であることを確認。元PNGはリポジトリに入れていない（Downloads に残っている）
  - 検品で直したもの: 1枚目のビーストは膝が床についていたので「膝を2〜3cm浮かせて4点支持」で再生成。他は1回目採用。文字・吹き出しの混入なし
  - ChatGPT の会話が1回固まった（停止ボタンが消えない）ので、新しい会話に生成済み2枚を参照として渡して続行した

## どこに入れたか
| ページ | 場所 | 画像 |
|---|---|---|
| トップ | ヒーローの2ボタン上 | smash（バド）・handstand（はじめて） |
| トップ | 「身体のMBTI」5軸カードの上 | five-axes |
| /badminton | ヒーロー | knee-wobble（コピー「膝が笑う」と一致） |
| /badminton | 「床の上でつくれる」3カード下 | beast |
| /badminton | 5軸対応表の上 | five-axes |
| /badminton | 症状10カードの右上 | 01 knee-wobble／02 high-stance／03 shoulder-stuck／04 crab-reach／05 beast／06・07 underswitch／08・10 beast-reach／09 wrist |
| /badminton | 練習前5分の手順上 | wrist・beast・crab-reach の3枚並び |
| /badminton | 出口 01・03、上部バーのロゴ | serve・joy・face |
| /beginner | ヒーロー／こんな方へ／まず1分／出口02／ロゴ | handstand／balance／beast／joy／face |
| /routine（A4） | STEP1〜3 の写真枠 → イラストに差し替え／ロゴ | wrist・beast・crab-reach／face |
| 診断結果 | 「今日やる1動作」の手順横 | 軸ごとに beast／crab／underswitch／crab-reach／beast-reach |
| /lessons | 通知フォームの上 | face |

## 写真素材リストの変更
- `/routine` の写真3枚と `/beginner`「まず1分」の写真は **イラストで埋まったので必須ではなくなった**（撮れれば差し替え可）。
- `/badminton` ヒーロー下の体育館写真（1600×900）と、動画5本＋6本は引き続き必要。

## 確認したこと
- `npm run build` 通過。375px で /badminton・/beginner・/routine・診断結果・トップの横はみ出し無し、画像の欠損0。
- 症状カードは見出しと画像が重ならないよう右側に84pxの領域を確保。

## 保留（CEO 判断）
- five-axes の5ポーズの「順番」は 筋力→持久力→スピード→柔軟性→調整力 で生成したが、③スピードと④柔軟性がやや似て見える。気になれば個別に再生成する（ブリーフの #10）。
- ブログ3本の本文画像はまだ写真のコメント枠のまま。イラスト（beast／crab／crab-reach）を仮に入れてもよい。


---

# 追記（2026-09-19）：中国語切替と「Animal Flowとは」ページ

CEO の「もっとブラッシュアップ。中国語も切り替えられるように。Animal Flowの歴史や魅力を知れるページを」を受けて実施。ブランチは同じ `feat/badminton-pivot`、staging 反映済み、本番未変更。

## 1. 日本語／中文の切替

**React 側（トップ・ヘッダー・フッター・10問診断・結果・出口3ブロック・今日やる1動作・レッスン通知フォーム・kawabado案内）**
- `src/i18n/lang.ts`：言語の決め方は URL `?lang=zh|ja` → localStorage `wildflow.lang.v1` → ブラウザ言語（zh-*）→ ja。切替はヘッダーの「日本語｜中文」ボタン（PC はナビ右端、スマホはハンバーガーの左）。
- `src/i18n/messages.ts`：ja / zh の辞書。型を共有しているので、片方だけ文言を足すとビルドで落ちる。
- `src/data/entryCopy.ts`：入口×言語ごとの診断の看板・見出し・質問文（10問すべて zh 版あり。**id・軸・逆転は不変**なので判定は変わらない）。「今日やる1動作」の手順も zh 版。
- 保存データは日本語のまま（管理画面が日本語のため）。zh からのリードは `wild_type` に `/zh` または `[zh]` が付く。
- 未対応（日本語のみ）: ブログ本文、レッスン一覧の本文、60問診断、法務・FAQ・お問い合わせ、管理画面。

**静的ページ側（/badminton・/beginner・/routine・/about-animalflow）**
- `/zh/badminton` などを `scripts/build-zh-pages.py` が `scripts/zh/<page>.json`（日→中の対応表）から生成。生成物はコミット済み。
- 各ページの上部バーに「日本語｜中文」。hreflang・canonical・og:locale も zh 用に。zh 版のリンクは `/zh/…` と `?lang=zh` 付きに自動で書き換わる（kawabado も `/zh/activity` へ）。
- **日本語ページを直したら**：対応表に追記 → `python3 scripts/build-zh-pages.py` → 未翻訳（ひらがな・カタカナが残る文）が一覧で出るので0にする → コミット。
- `/animalflow.html`（元の6ステップ紹介）は zh 版を作っていない。zh のときはそのリンクを `/zh/beginner` に向けている。

## 2. /about-animalflow（Animal Flowとは）
- 構成：何か（QMTの定義・「animal＝人間という動物」）→ 歴史（マイク・フィッチの自重トレの探求 → Global Bodyweight Training による体系化 → L1/L2 ワークショップ → 上海でしょっちゃんが出会う）→ 4つの柱 → 6つの構成要素 → 研究で報告されていること（Matthews 2016・Buxton 2020）→ 続けたくなる5つの理由 → しょっちゃんの一言 → 出口3つ。
- **事実の出どころは Level 1 マニュアル（しょっちゃん受講分）の記述に限定**した。発表年など確認できないことは書いていない。研究は「〜と報告されています」の言い方に統一し、効果保証をしないただし書きを置いた。末尾に「公式ページではない」と明記。
- イラスト：beast-reach（ヒーロー）・beast（What）・joy（引用）。写真枠は無し。
- ナビ「Animal Flowとは」、トップの「WHY WILDFLOW」直下、/beginner 上部バーから到達できる。sitemap に追加。

## 3. 確認したこと
- `npm run build` 通過。375px で /about-animalflow・/zh/badminton・トップ（zh）・診断→結果（zh）・/lessons（zh）の横はみ出し無し。
- zh の診断は「羽毛球体能检查」→ 質問が中国語 → 結果の見出し・今日やる1動作・出口3ブロック・メール登録の文言まで中国語。
- 対応表の未翻訳チェックは4ページとも0。

## 4. 保留・CEO判断
- 中国語の訳は AI（Claude）が書いた簡体字。**中国語話者のしょっちゃんが一度通読して自然さを直す**のが確実。直す場所は `scripts/zh/*.json` と `src/i18n/messages.ts`・`src/data/entryCopy.ts`。
- 全社ルール「中国語話者向けと日本人向けの見込客・コンテンツは混ぜない」との関係：今回は同じページの言語切替なので、リードは同じ `quiz_leads` に入る（言語印つき）。分けたい場合は `source` を `quick_zh` にする等の判断が要る。
- 「しょっちゃん」の中国語表記は「翔酱（Shocchan）」にした。別の表記が良ければ辞書を一括置換。

---

# 追記（2026-09-19 午後）：トップ全面刷新「読むより、床」

CEO の「原型止めなくていい。アニマルフローを取り入れたいと思えるリッチなサイトに」を受け、トップページを作り直した。同ブランチ、staging 反映、本番未変更。

## 新トップの構成（上から）
1. **ヒーロー**：深緑グラデ＋光のにじみ、浮遊するしょっちゃん（ビーストリーチ）、3行の大見出し「床に手をつく。それだけで、体は目を覚ます。」、入口2ボタン、「いま30秒やってみる」。下に動き名のマーキー。
2. **始めるのにいらないもの**：道具0個・床1枚・1日1分・運動経験0年（数字は事実ベースの「条件」であり実績ではない）。
3. **動きを触る（MoveExplorer）**：6動作をタブで切替。イラスト＋手順3つ＋「コートでは／ふだんの体では」。ボタンでタイマーへ。
4. **30秒チャレンジ（ChallengeTimer）**：動きを選んでスタート→ 秒×回のリング型カウントダウン（セット間5秒休憩）。無音・保存なし。完了でしょっちゃん「喜び」＋診断へ。
5. **入口2レーン**：バド（ダーク／膝が笑うイラスト）・はじめて（クリーム／逆立ち）。
6. **5つの力→10問診断**：5ポーズ横長イラスト＋軸カード＋バド版／はじめて版の診断リンク。
7. **ストーリー**：上海の引用（既存文の再構成）＋ブログ／about へ。
8. 最新記事、ボトムCTA（診断／レッスン／kawabado）。

## 技術
- `src/i18n/landing.ts`（ja/zh 辞書）、`src/components/landing/{Reveal,MoveExplorer,ChallengeTimer}.tsx`、`index.css` にアニメーション（reduced-motion 対応）。
- 旧トップの「身体のMBTI」「22タイプ一覧」「3ステップ」は削除（22タイプは診断結果・60問側に残る）。
- GA: `explore_move`, `start_challenge`, `complete_challenge` を追加。

## 確認
- build 通過、375px 横はみ出し無し、タイマー3セット完走を実測、画像欠損0、zh 切替でヒーロー〜ボトムまで中文。

## 保留
- 動画は依然として枠のみ（9/22 撮影後、TODAY_MOVE と各ページに URL を入れる）。
- ヒーローの背景は CSS のみ。体育館の写真1枚があれば置き換え候補。

---

# 追記（2026-09-19 夜）：図解を ChatGPT 生成に置き換え

CEO の「図形・解剖学的なものは ChatGPT に作らせた方がいい」を受け、私が描いた SVG 図（四足の仕組み・4つの柱の円）を ChatGPT 生成の図解に置き換え、他ページにも図解を追加した。**文字はすべて画像の外（HTML側）**にしてあるので、日中切替で図は共通。

| 画像（public/img/shocchan/） | 内容 | 使用箇所 |
|---|---|---|
| qmt-diagram.webp | ビースト姿勢の4接点が光り、脳へ点線でつながる仕組み図 | /about-animalflow「What」 |
| pillars-wheel.webp | 4色の円＋中央にしょっちゃん。ラベルは HTML の凡例 | /about-animalflow「4つの柱」 |
| journey-map.webp | 自重トレ→誕生→世界→上海/川口・蕨 の4駅 | /about-animalflow「History」（4つの見出しは HTML） |
| traveling.webp | Traveling Beast（前進中） | /about-animalflow 6要素の④ |
| court-vs-floor.webp | ランジ姿勢とビースト姿勢で同じ股関節が光る対比 | /badminton「コートの動きは床でつくれる」 |
| knee-vs-hip.webp | 着地で膝が内に入る（赤）／股関節で支える（緑）の対比 | /badminton 症状10カードの直上 |
| home-floor.webp | 朝のリビングでスマホを横に置いてビースト（背景あり） | /beginner「こんな方へ」 |

- 生成は Chrome の ChatGPT を Claude が操作（参照画像4枚添付、1枚ずつ、画風統一）。最初に誤って既存チャット「3スライド作成」に文面が入りかけたが送信前に消去し、新規チャットで実施。
- 検品: 文字混入なし・透過（home-floor のみ背景あり）・md5 で7枚が別物。WebP 73〜130KB。
- 確認: build 通過、375px 横はみ出しなし、画像欠損0、zh 版も生成済み（凡例・alt は中文）。
