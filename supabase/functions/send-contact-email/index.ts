import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: '必須項目が不足しています' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const CONTACT_EMAIL = Deno.env.get('CONTACT_EMAIL') ?? 'shodorannga@gmail.com'

    // 管理者への通知メール
    const adminBody = `
新しいお問い合わせが届きました。

━━━━━━━━━━━━━━━━━━━━━━━━
【送信者情報】
━━━━━━━━━━━━━━━━━━━━━━━━
お名前：${name}
メールアドレス：${email}

━━━━━━━━━━━━━━━━━━━━━━━━
【お問い合わせ内容】
━━━━━━━━━━━━━━━━━━━━━━━━
${message}

━━━━━━━━━━━━━━━━━━━━━━━━
返信先：${email}
wildflow お問い合わせフォーム
https://wildflow-platform.shodorannga.workers.dev/contact
`

    // ユーザーへの自動返信メール
    const userBody = `
${name} 様

wildflow へのお問い合わせありがとうございます。

以下の内容でお問い合わせを受け付けました。
3営業日以内にご返信いたします。

━━━━━━━━━━━━━━━━━━━━━━━━
【お問い合わせ内容】
━━━━━━━━━━━━━━━━━━━━━━━━
${message}
━━━━━━━━━━━━━━━━━━━━━━━━

ご不明な点は ${CONTACT_EMAIL} までお気軽にご連絡ください。

wildflow
https://wildflow-platform.shodorannga.workers.dev/
`

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    // 管理者通知
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'wildflow <onboarding@resend.dev>',
        to: CONTACT_EMAIL,
        reply_to: email,
        subject: `【wildflow お問い合わせ】${name} 様より`,
        text: adminBody,
      }),
    })

    // ユーザー自動返信
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'wildflow <onboarding@resend.dev>',
        to: email,
        subject: '【wildflow】お問い合わせを受け付けました',
        text: userBody,
      }),
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: 'サーバーエラーが発生しました' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
