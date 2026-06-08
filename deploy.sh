#!/bin/bash
# wildflow デプロイスクリプト
# 使い方: ./deploy.sh

set -e

echo "🔨 Building..."
npm run build

echo "🚀 Deploying to Cloudflare Pages..."
# CLOUDFLARE_API_TOKEN は環境変数として渡すこと
# 例: CLOUDFLARE_API_TOKEN=xxx ./deploy.sh
node_modules/.bin/wrangler pages deploy dist \
  --project-name wildflow-platform \
  --branch main \
  --commit-dirty=true

echo "✅ Deploy complete! https://wildflow-platform.pages.dev"
