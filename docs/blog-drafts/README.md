# ブログ下書き（2026-09-18 バドミントン・ピボット P1-8）

wild-flow.com のブログは Supabase の `posts` テーブルから配信されている（`src/services/posts.ts`）。
書き込みはログイン済みの管理者だけなので、AI は本番DBに直接入れず、ここに下書きとして置いた。

## 公開手順（CEO）

1. wild-flow.com/admin にログイン → ブログ投稿タブで新規作成。
2. 各ファイルの frontmatter（`---` の間）を見て、タイトル・タグを入力。**本文の形式は markdown** を選ぶ。
3. frontmatter より下の本文をそのまま貼る。`<!-- 写真① … -->` のコメント行は、撮影した写真に差し替えるか削除する。
4. サムネイルは各ファイルの `thumbnail:` に推奨サイズと構図を書いてある。無ければサムネイル無しで公開してよい。
5. `status: draft` → 公開時に「公開」にする。

## 3本

| ファイル | 軸 | 主な出口 |
|---|---|---|
| `2026-09-18-badminton-knee-after-smash.md` | 筋力・膝 | /badminton#symptoms、10問診断 |
| `2026-09-18-badminton-late-rally-stance.md` | 持久力・腰 | /badminton#axes、/lessons |
| `2026-09-18-badminton-highback-shoulder.md` | 柔軟性・肩 | /badminton#routine、/beginner#t3 |

効果の断定表現（「治る」「改善する」）は使っていない。すべて「〜が起きにくくなる体の使い方」の言い方で統一。
受講者の声・実績数値・写真は入れていない（素材が無いものは作らない方針）。
