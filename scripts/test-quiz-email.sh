#!/bin/bash
# 診断結果メール送信の動作確認スクリプト
#
# 使い方:
#   ./scripts/test-quiz-email.sh [宛先メールアドレス] [function名]
#   例: ./scripts/test-quiz-email.sh shodorannga@gmail.com send-quiz-result-email
#
# チェック内容:
#   1. CORS プリフライト（OPTIONS）が 200 を返すか
#      → 500/404 ならブラウザからの呼び出しは全てブロックされる
#   2. POST で success:true が返るか（Resend API まで通るか）
#      → success:false + 403 なら送信元ドメイン未認証の可能性大
#        （onboarding@resend.dev はアカウント所有者宛にしか送れない）

set -u
cd "$(dirname "$0")/.."

TO="${1:-shodorannga@gmail.com}"
FN="${2:-send-quiz-result-email}"
ANON=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d= -f2)
URL="https://sfpgajxqmcymzetjwypz.supabase.co/functions/v1/$FN"

echo "🔍 対象: $URL"
echo "📧 宛先: $TO"
echo

echo "=== 1) CORS プリフライト (OPTIONS) ==="
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$URL" \
  -H "Authorization: Bearer $ANON" \
  -H "Origin: https://wild-flow.com" \
  -H "Access-Control-Request-Method: POST")
if [ "$CODE" = "200" ]; then
  echo "✅ OPTIONS $CODE — ブラウザからの呼び出しOK"
elif [ "$CODE" = "404" ]; then
  echo "❌ OPTIONS 404 — function がデプロイされていない"
else
  echo "❌ OPTIONS $CODE — CORS 未対応。ブラウザからの呼び出しは全滅する"
fi
echo

echo "=== 2) POST 送信テスト ==="
RES=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$URL" \
  -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" \
  -H "Origin: https://wild-flow.com" \
  -d "{\"name\":\"動作確認テスト\",\"email\":\"$TO\",\"wildType\":\"チーター型\",\"scores\":{\"strength\":3,\"endurance\":4,\"speed\":5,\"flexibility\":2,\"coordination\":3},\"lesson\":\"スピード強化レッスン\"}")
BODY=$(echo "$RES" | sed '$d')
STATUS=$(echo "$RES" | tail -1 | cut -d: -f2)
echo "HTTP $STATUS"
echo "$BODY"
echo

if echo "$BODY" | grep -q '"success":true'; then
  echo "✅ 送信成功 — $TO の受信トレイを確認してください"
else
  echo "❌ 送信失敗 — 上のレスポンス詳細と Supabase Dashboard の Edge Function ログ"
  echo "   (https://supabase.com/dashboard/project/sfpgajxqmcymzetjwypz/functions) を確認"
fi
