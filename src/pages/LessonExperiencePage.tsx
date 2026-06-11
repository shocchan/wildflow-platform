import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface Testimonial {
  name: string;
  animal_type: string;
  comment: string;
}

export function LessonExperiencePage() {
  const [photos, setPhotos] = useState<string[]>(['', '', '', '', '', '']);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'experience_photos')
      .single()
      .then(({ data }) => {
        if (data?.value?.photos) setPhotos(data.value.photos);
      });
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'experience_testimonials')
      .single()
      .then(({ data }) => {
        if (data?.value?.testimonials) setTestimonials(data.value.testimonials);
      });
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <p className="text-sm font-medium mb-2" style={{ color: '#1A6B38' }}>レッスン体験イメージ</p>
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
          style={{ backgroundColor: '#2D8F4E', minHeight: '44px' }}
        >
          レッスン詳細を見る →
        </a>
      </div>

      {/* こんな方におすすめ */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-5" style={{ color: '#1C2A1E' }}>こんな方におすすめ</h2>
        <div className="p-6 rounded-2xl border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}>
          <ul className="space-y-3">
            {[
              '運動したいけどジムは続かない',
              '体が硬くてヨガは敷居が高い',
              '正しいフォームよりも楽しく動きたい',
              '自分の身体をもっと知りたい',
              'Animal Flowに興味があるけど未経験',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm leading-relaxed" style={{ color: '#1C2A1E' }}>
                <span style={{ color: '#2D8F4E' }}>🐾</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 60分の流れ */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-5" style={{ color: '#1C2A1E' }}>60分の流れ</h2>
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
                  <span className="text-sm font-bold" style={{ color: '#1A6B38' }}>{block.time}</span>
                  <span className="text-sm font-bold" style={{ color: '#1C2A1E' }}>{block.title}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#5a7a62' }}>{block.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* レッスンの様子（写真ギャラリー） */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-5" style={{ color: '#1C2A1E' }}>レッスンの様子</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((url, i) => (
            <div key={i} className="aspect-video rounded-xl overflow-hidden">
              {url ? (
                <img
                  src={url}
                  alt={`レッスン風景${i + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-2"
                  style={{ backgroundColor: '#EDF7EE' }}
                >
                  <span className="text-3xl">📷</span>
                  <span className="text-sm" style={{ color: '#9CA3AF' }}>レッスン写真</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 受講者の声 */}
      {testimonials.some(t => t.comment) && (
        <section className="py-16">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: '#1C2A1E' }}>受講者の声</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.filter(t => t.comment).map((t, i) => (
              <div key={i} className="rounded-xl p-6 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}>
                <p className="text-2xl mb-3">💬</p>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#1C2A1E' }}>「{t.comment}」</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#EDF7EE', color: '#2D8F4E' }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#1C2A1E' }}>{t.name}</p>
                    {t.animal_type && (
                      <p className="text-xs" style={{ color: '#4A6550' }}>🐾 {t.animal_type}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* よくある質問 */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-5" style={{ color: '#1C2A1E' }}>よくある質問</h2>
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
              <p className="text-sm leading-relaxed" style={{ color: '#5a7a62' }}>A. {item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div
        className="p-8 rounded-2xl text-center"
        style={{ backgroundColor: '#EDF7EE' }}
      >
        <h2 className="text-2xl font-bold mb-3" style={{ color: '#1C2A1E' }}>
          まずは診断で自分の身体を知ろう
        </h2>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: '#4A6550' }}>
          どのアビリティを伸ばすべきかを知ることから始まります。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/quiz/quick"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold border-2 transition-opacity hover:opacity-80"
            style={{ borderColor: '#2D8F4E', color: '#2D8F4E', backgroundColor: 'transparent', minHeight: '44px' }}
          >
            10問で簡単診断 →
          </a>
          <a
            href="/lessons"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#2D8F4E', minHeight: '44px' }}
          >
            レッスン詳細を見る →
          </a>
        </div>
      </div>
    </main>
  );
}
