import { useState } from 'react';

const FAQS = [
  {
    q: 'Animal Flowとは何ですか？',
    a: '床と重力を使って動物の動きを再現する、全身連動型のトレーニングです。特別な道具は不要で、マット1枚あれば始められます。',
  },
  {
    q: '体が硬くても参加できますか？',
    a: 'はい、むしろ体が硬い方こそ効果を実感しやすいです。「伸びしろがある」状態からスタートできます。',
  },
  {
    q: '運動初心者でも大丈夫ですか？',
    a: '大丈夫です。wildflowのレッスンは初心者の方を対象としています。正しいフォームより「楽しく動く感覚」を大切にしています。',
  },
  {
    q: 'レッスンはオンラインですか？対面ですか？',
    a: '現在は対面レッスンのみ開催しています。開催場所は埼玉県川口・蕨エリアのレンタルスペースを利用しています。',
  },
  {
    q: '支払い方法は何がありますか？',
    a: 'PayPay・WeChat Payに対応しています。お申し込み後に案内メールをお送りします。',
  },
  {
    q: 'キャンセルはできますか？',
    a: 'レッスン開催14日前までは全額返金いたします。13日前〜前日は50%返金、当日・無断欠席は返金不可となります。',
  },
  {
    q: '野生診断とレッスンはどう繋がりますか？',
    a: '診断で分かった「伸びしろアビリティ」に対応したレッスンを受けることで、効率よく身体の可能性を引き出せます。',
  },
  {
    q: '中国語対応はできますか？',
    a: 'はい。インストラクターしょっちゃんは日本語教師として中国語話者の方と日常的に関わっており、中国語でのご案内も可能です。',
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border rounded-xl overflow-hidden transition-all"
      style={{ borderColor: open ? '#2D8F4E' : '#E2E8E4', backgroundColor: '#FFFFFF' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-5 py-4 flex items-start gap-4 transition-colors"
        style={{ backgroundColor: open ? '#EDF7EE' : '#FFFFFF' }}
      >
        <span
          className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center mt-0.5"
          style={{ backgroundColor: open ? '#2D8F4E' : '#E2E8E4', color: open ? '#FFFFFF' : '#4A6550' }}
        >
          Q
        </span>
        <span className="font-bold text-sm md:text-base flex-1 leading-relaxed" style={{ color: '#1C2A1E' }}>
          {q}
        </span>
        <span
          className="flex-shrink-0 text-lg transition-transform duration-200 mt-0.5"
          style={{
            color: '#2D8F4E',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 flex gap-4">
          <span
            className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center mt-0.5"
            style={{ backgroundColor: '#FDF8EF', color: '#F59E0B' }}
          >
            A
          </span>
          <p className="text-sm md:text-base leading-relaxed flex-1" style={{ color: '#4A6550' }}>
            {a}
          </p>
        </div>
      )}
    </div>
  );
}

export function FaqPage() {
  return (
    <main className="max-w-3xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-16">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#2D8F4E' }}>
        FAQ
      </p>
      <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ color: '#1C2A1E' }}>
        よくある質問
      </h1>
      <p className="text-sm mb-10" style={{ color: '#4A6550' }}>
        解決しない場合は{' '}
        <a href="/contact" className="underline hover:opacity-70" style={{ color: '#2D8F4E' }}>
          お問い合わせ
        </a>
        {' '}からご連絡ください。
      </p>

      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <AccordionItem key={i} q={faq.q} a={faq.a} />
        ))}
      </div>

      {/* Bottom CTA */}
      <div
        className="mt-12 rounded-2xl p-6 text-center"
        style={{ backgroundColor: '#EDF7EE', border: '1px solid #C8E6CA' }}
      >
        <p className="font-bold mb-2" style={{ color: '#1C2A1E' }}>まだ解決しない場合は</p>
        <p className="text-sm mb-4" style={{ color: '#4A6550' }}>お気軽にお問い合わせください。3営業日以内にご返信します。</p>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#2D8F4E', fontSize: '15px' }}
        >
          お問い合わせフォームへ →
        </a>
      </div>
    </main>
  );
}
