#!/bin/bash
# wildflow デプロイスクリプト
# 使い方: ./deploy.sh
#
# 本番の wild-flow.com は Cloudflare Workers（静的アセット配信、wrangler.json参照）に
# カスタムドメインとしてバインドされている。Cloudflare Pages ではない。
# 過去に誤って `wrangler pages deploy` を使っており、Pagesの方だけ更新されて
# wild-flow.com に反映されない事故があったため、`wrangler deploy` を使うこと。

set -e

echo "🔨 Building..."
npm run build

echo "🚀 Deploying to Cloudflare Workers (wild-flow.com)..."
# CLOUDFLARE_API_TOKEN は環境変数として渡すこと
# 例: CLOUDFLARE_API_TOKEN=xxx ./deploy.sh
node_modules/.bin/wrangler deploy

echo "✅ Deploy complete! https://wild-flow.com"
