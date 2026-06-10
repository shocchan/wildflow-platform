import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { entryData, lessonData } = await req.json()

  const emailBody = `
${entryData.name} 様

wildflow Animal Flowレッスンへのお申し込みありがとうございます。

━━━━━━━━━━━━━━━━━━━━━━━━
【レッスン情報】
━━━━━━━━━━━━━━━━━━━━━━━━
レッスン名：${lessonData.title}
日時：${lessonData.date} ${lessonData.start_time}〜${lessonData.end_time}
場所：${lessonData.location}
インストラクター：${lessonData.instructor}

━━━━━━━━━━━━━━━━━━━━━━━━
【お支払いについて】
━━━━━━━━━━━━━━━━━━━━━━━━
参加費：¥${Number(lessonData.price).toLocaleString()}
支払い期限：${lessonData.payment_deadline ?? 'レッスン前日まで'}

■ PayPay でのお支払い
PayPay ID：${lessonData.paypay_id}

お支払い後、返信不要です。
支払いが確認できない場合はキャンセルとなる場合があります。

━━━━━━━━━━━━━━━━━━━━━━━━

ご不明な点は shodorannga@gmail.com までお気軽にご連絡ください。

wildflow
https://wildflow-platform.shodorannga.workers.dev/
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'wildflow <onboarding@resend.dev>',
      to: entryData.email,
      subject: `【wildflow】${lessonData.title} お申し込み確認・支払い案内`,
      text: emailBody,
    }),
  })

  return new Response(JSON.stringify({ success: res.ok }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
