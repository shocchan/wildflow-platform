import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  // CORS プリフライト（これが無いとブラウザからの呼び出しが全てブロックされる）
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { name, email, wildType, scores, lesson } = await req.json()
    console.log(`[quiz-email] request received: wildType=${wildType} email=${email?.replace(/(.{2}).*(@.*)/, '$1***$2')}`)

    if (!name || !email || !wildType || !scores) {
      console.error('[quiz-email] validation failed: missing fields')
      return jsonResponse({ success: false, error: '必須項目が不足しています' }, 400)
    }

    const apiKey = Deno.env.get('RESEND_API_KEY')
    if (!apiKey) {
      console.error('[quiz-email] RESEND_API_KEY is not set')
      return jsonResponse({ success: false, error: 'メール設定エラー（APIキー未設定）' }, 500)
    }

    // wild-flow.com が Resend でドメイン認証されたら MAIL_FROM secret を
    // 'wildflow <info@wild-flow.com>' に設定する（未認証のまま使うと Resend が拒否する）
    const mailFrom = Deno.env.get('MAIL_FROM') ?? 'wildflow <onboarding@resend.dev>'

    const abilityLabels: Record<string, string> = {
      strength: '筋力', endurance: '持久力', speed: 'スピード',
      flexibility: '柔軟性', coordination: '調整力',
    };

    const scoresText = Object.entries(scores as Record<string, number>)
      .map(([k, v]) => `${abilityLabels[k] ?? k}：${v}点`)
      .join('\n');

    const emailBody = `
${name} 様

wildflow 野生タイプ詳細診断の結果をお送りします。

━━━━━━━━━━━━━━━━━━━━━━━━
【あなたの野生タイプ】
${wildType}
━━━━━━━━━━━━━━━━━━━━━━━━

【5軸スコア】
${scoresText}

━━━━━━━━━━━━━━━━━━━━━━━━
【おすすめレッスン】
${lesson}

レッスン予約はこちら：
https://wild-flow.com/lessons
━━━━━━━━━━━━━━━━━━━━━━━━

ご不明な点は shodorannga@gmail.com までお気軽にご連絡ください。

wildflow
https://wild-flow.com/
  `

    console.log(`[quiz-email] sending via Resend: from=${mailFrom}`)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: mailFrom,
        to: email,
        subject: `【wildflow】あなたの野生タイプ診断結果：${wildType}`,
        text: emailBody,
      }),
    })

    const resBody = await res.text()
    if (!res.ok) {
      // onboarding@resend.dev はアカウント所有者宛以外 403 になる。ここで必ずログに残す
      console.error(`[quiz-email] Resend error: status=${res.status} body=${resBody}`)
      return jsonResponse({ success: false, error: `Resend API error (${res.status})`, detail: resBody }, 502)
    }

    console.log(`[quiz-email] sent OK: ${resBody}`)
    return jsonResponse({ success: true })
  } catch (e) {
    console.error(`[quiz-email] unexpected error: ${e}`)
    return jsonResponse({ success: false, error: String(e) }, 500)
  }
})
