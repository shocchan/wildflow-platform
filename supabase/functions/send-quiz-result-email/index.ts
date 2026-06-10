import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { name, email, wildType, scores, lesson } = await req.json()

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
https://wildflow-platform.shodorannga.workers.dev/lessons
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
      to: email,
      subject: `【wildflow】あなたの野生タイプ診断結果：${wildType}`,
      text: emailBody,
    }),
  })

  return new Response(JSON.stringify({ success: res.ok }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
