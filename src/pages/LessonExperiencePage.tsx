export function LessonExperiencePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <p className="text-sm font-medium mb-2" style={{ color: '#2D8F4E' }}>レッスン体験イメージ</p>
        <h1
          className="font-black mb-6 leading-tight"
          style={{ color: '#1C2A1E', fontSize: 'clamp(24px, 5vw, 40px)' }}
        >
          1時間後、あなたは自分の身体の<br />
          新しい可能性に気づくはずです。
        </h1>
        <a
          href="/lessons"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#2D8F4E' }}
        >
          レッスンを予約する →
        </a>
      </div>

      {/* こんな方におすすめ */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-5" style={{ color: '#1C2A1E' }}>こんな方におすすめ</h2>
        <div className="p-6 rounded-2xl border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}>
          <ul className="space-y-3">
            {[
              '運動したいけどジムは続かない',
              '体が硬くてヨガは敷居が高い',
              '正しいフォームよりも楽しく動きたい',
              '自分の身体をもっと知りたい',
              'Animal Flowに興味があるけど未経験',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm" style={{ color: '#1C2A1E' }}>
                <span style={{ color: '#2D8F4E' }}>🐾</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 60分の流れ */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-5" style={{ color: '#1C2A1E' }}>60分の流れ</h2>
        <div className="space-y-3">
          {[
            { time: '00–10分', title: 'Prep', desc: '手首・関節の準備。身体に動く準備を整えます。', emoji: '🤲' },
            { time: '10–20分', title: 'Activate', desc: '身体を覚醒させる動き。血流を上げていきます。', emoji: '⚡' },
            { time: '20–40分', title: 'Move / S&T', desc: 'スキル練習。今日のテーマアビリティを集中的に動きます。', emoji: '🦅' },
            { time: '40–50分', title: 'Flow', desc: '連続した流れで動きをつなぎます。自由に表現する時間。', emoji: '🌊' },
            { time: '50–60分', title: 'Cool down', desc: '静寂と振り返り。身体と対話する時間。', emoji: '🍃' },
          ].map((block, i) => (
            <div
              key={i}
              className="flex gap-4 p-4 rounded-xl border"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4', borderLeft: '4px solid #2D8F4E' }}
            >
              <div className="text-2xl flex-shrink-0">{block.emoji}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold" style={{ color: '#2D8F4E' }}>{block.time}</span>
                  <span className="text-sm font-bold" style={{ color: '#1C2A1E' }}>{block.title}</span>
                </div>
                <p className="text-sm" style={{ color: '#5a7a62' }}>{block.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* よくある質問 */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-5" style={{ color: '#1C2A1E' }}>よくある質問</h2>
        <div className="space-y-4">
          {[
            {
              q: '運動が苦手でも大丈夫？',
              a: '大丈夫です。未経験者から参加できます。自分のペースで動いていただけます。',
            },
            {
              q: '服装・持ち物は？',
              a: '動きやすい服装でお越しください。ヨガマットは会場にあります。水分補給用のドリンクをお持ちいただくと安心です。',
            },
            {
              q: '場所はどこですか？',
              a: '埼玉県川口・蕨エリアで開催しています。詳細はレッスン詳細ページでご確認ください。',
            },
            {
              q: '支払いはどうすれば？',
              a: '申し込み後、PayPay / WeChat Pay の支払い案内メールをお送りします。期限内にお支払いください。',
            },
            {
              q: '一人で参加しても大丈夫？',
              a: 'もちろんです！一人参加が大半です。レッスン中はインストラクターが丁寧にサポートします。',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
            >
              <p className="text-sm font-bold mb-2" style={{ color: '#1C2A1E' }}>Q. {item.q}</p>
              <p className="text-sm" style={{ color: '#5a7a62' }}>A. {item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 写真ギャラリー（プレースホルダー） */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-5" style={{ color: '#1C2A1E' }}>レッスンの様子</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="aspect-square rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#EDF7EE' }}
            >
              <div className="text-center">
                <span className="text-3xl block mb-1">📷</span>
                <span className="text-xs" style={{ color: '#9ca3af' }}>写真{i}</span>
              </div>
              {/* 後から <img src={photoUrls[i]} className="w-full h-full object-cover rounded-xl" /> に差し替え */}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div
        className="p-8 rounded-2xl text-center"
        style={{ backgroundColor: '#EDF7EE' }}
      >
        <h2 className="text-xl font-bold mb-3" style={{ color: '#1C2A1E' }}>
          まずは診断で自分の身体を知ろう
        </h2>
        <p className="text-sm mb-6" style={{ color: '#4A6550' }}>
          どのアビリティを伸ばすべきかを知ることから始まります。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/quiz/quick"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold border-2 transition-opacity hover:opacity-80"
            style={{ borderColor: '#2D8F4E', color: '#2D8F4E', backgroundColor: 'transparent' }}
          >
            10問で簡単診断 →
          </a>
          <a
            href="/lessons"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#2D8F4E' }}
          >
            レッスンを予約する →
          </a>
        </div>
      </div>
    </main>
  );
}
