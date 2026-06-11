import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProfileSettings, type ProfileSettings } from '../services/settings';

const DEFAULTS: ProfileSettings = {
  name: 'しょっちゃん',
  tagline: '野生の身体を研究する人',
  photo_url: '',
  mission:
    '「野生の身体を、すべての人へ。」\n\n現代社会では、人間本来の野性的な身体感覚が失われつつあります。わたしは自らの身体実験を通じて、誰もが自分の野生タイプを知り、それに合った生き方・動き方を選択できる世界をつくりたいと思っています。',
  story:
    '2022年、上海。妻に連れられて行った"動物の動きを模した運動教室"で、\nインストラクターの一言が頭の中で何かをつないだ。\n\n帰り道に妻に言った。「自分、これの資格を取りたい」。\nインストラクター資格2人分・24万円、即決だった。\n\n日本語教師として中国人学習者と向き合う日々の中で、「身体の使い方」が言語習得にも、人生の質にも深く影響することに気づきました。\n\n自身の身体を実験台に、食事・運動・睡眠・マインドセットを徹底的に試し、その知見をこのメディア「wildflow」で発信しています。\n\n青いタオルを首に巻いた姿がトレードマーク。野生×知性がコンセプトです。',
  twitter_url: 'https://twitter.com/',
  xhs_url: 'https://xhslink.com/m/4cEpE8uM5oz',
  lemon8_url: 'https://s.lemon8-app.com/s/GgbxwycvTj',
};

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileSettings>(DEFAULTS);

  useEffect(() => {
    fetchProfileSettings().then(setProfile).catch(() => {/* use defaults */});
  }, []);

  const activities = [
    { icon: '🇨🇳', text: '中国人向け日本語講師（半年伴走コース）' },
    { icon: '✍️', text: 'wildflow ブログ・メディア運営' },
    { icon: '📱', text: '小紅書（RED）フォロワー5,000+' },
    { icon: '🧬', text: '野生タイプ診断メソッド研究・開発' },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-16" style={{ backgroundColor: '#F8F7F2' }}>
      <div className="text-center mb-12">
        {profile.photo_url ? (
          <img
            src={profile.photo_url}
            alt={profile.name}
            className="w-32 h-32 rounded-full mx-auto mb-6 object-cover border-4"
            style={{ borderColor: '#2D8F4E' }}
          />
        ) : (
          <div
            className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center text-5xl border-4"
            style={{ backgroundColor: '#EDF7EE', borderColor: '#2D8F4E' }}
          >
            🌊
          </div>
        )}
        <h1 className="text-3xl font-black mb-2" style={{ color: '#1C2A1E' }}>{profile.name}</h1>
        <p className="font-medium" style={{ color: '#2D8F4E' }}>{profile.tagline}</p>
      </div>

      <div className="space-y-8">
        <Section title="🦁 ミッション">
          <p className="leading-relaxed whitespace-pre-line" style={{ color: '#4A6550' }}>{profile.mission}</p>
        </Section>

        <Section title="📖 ストーリー">
          <p className="leading-relaxed whitespace-pre-line" style={{ color: '#4A6550' }}>{profile.story}</p>
          <Link
            to="/blog/8835329d-05f2-41f2-a1f3-798bb422dd5c"
            className="inline-block mt-4 font-bold hover:underline"
            style={{ color: '#2D8F4E' }}
          >
            → そのエピソードをブログで読む
          </Link>
        </Section>

        <Section title="🎯 活動">
          <ul className="space-y-3">
            {activities.map(item => (
              <li key={item.text} className="flex items-start gap-3" style={{ color: '#4A6550' }}>
                <span className="text-xl">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="📬 お問い合わせ">
          <p className="leading-relaxed mb-4" style={{ color: '#4A6550' }}>
            コラボ・取材・その他のお問い合わせは X（Twitter）のDMからお気軽にどうぞ。
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              maxWidth: '360px',
            }}
          >
            {profile.twitter_url && (
              <a
                href={profile.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 font-bold text-sm text-white transition-all hover:opacity-80"
                style={{ backgroundColor: '#1d9bf0', borderRadius: '12px', padding: '12px 16px' }}
              >
                𝕏 X でフォロー
              </a>
            )}
            {profile.xhs_url && (
              <a
                href={profile.xhs_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 font-bold text-sm text-white transition-all hover:opacity-80"
                style={{ backgroundColor: '#ff2442', borderRadius: '12px', padding: '12px 16px' }}
              >
                📕 小紅書
              </a>
            )}
            {profile.lemon8_url && (
              <a
                href={profile.lemon8_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 font-bold text-sm transition-all hover:opacity-80"
                style={{ backgroundColor: '#ffb800', color: '#1a1a1a', borderRadius: '12px', padding: '12px 16px' }}
              >
                🍋 lemon8
              </a>
            )}
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8ECD9' }}
    >
      <h2 className="text-lg font-bold mb-3" style={{ color: '#1C2A1E' }}>{title}</h2>
      {children}
    </div>
  );
                }
