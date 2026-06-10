import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PostCard } from '../components/PostCard';
import { fetchLatestPosts } from '../services/posts';
import type { Post } from '../types';

const TYPE_GRID_MAIN = [
  { emoji: '🦏', name: 'サイ' },
  { emoji: '🐘', name: 'ゾウ' },
  { emoji: '🦁', name: 'ライオン' },
  { emoji: '🐂', name: 'バッファロー' },
  { emoji: '🐺', name: 'オオカミ' },
  { emoji: '🐋', name: 'クジラ' },
  { emoji: '🦅', name: 'ワシ' },
  { emoji: '🦬', name: 'バイソン' },
  { emoji: '🐆', name: 'チーター' },
  { emoji: '🐇', name: 'ウサギ' },
  { emoji: '🦅', name: 'ハヤブサ' },
  { emoji: '🐻', name: 'クマ' },
  { emoji: '🐍', name: 'アナコンダ' },
  { emoji: '🐆', name: 'ヒョウ' },
  { emoji: '🐟', name: 'マンタ' },
  { emoji: '🐙', name: 'タコ' },
  { emoji: '🐬', name: 'イルカ' },
  { emoji: '🦜', name: 'オウム' },
  { emoji: '🦦', name: 'カワウソ' },
  { emoji: '🦊', name: 'キツネ' },
];

const TYPE_GRID_SPECIAL = [
  { emoji: '🐉', name: 'ドラゴン', rare: 'dragon' },
  { emoji: '🥚', name: 'ドラゴンエッグ', rare: 'egg' },
];

const AXES = [
  { icon: '💪', label: '筋力', desc: '押す・踏ん張る・支える力' },
  { icon: '🔥', label: '持久力', desc: '動き続けるスタミナ' },
  { icon: '⚡', label: 'スピード', desc: '瞬発力・反応速度' },
  { icon: '🌊', label: '柔軟性', desc: '関節の可動域・しなやかさ' },
  { icon: '🎯', label: '調整力', desc: '連動性・リズム・バランス' },
];

export function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const quizSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchLatestPosts(3).then(setPosts).finally(() => setLoading(false));
  }, []);

  return (
    <main>
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden py-20 px-4 text-center"
        style={{ background: 'linear-gradient(135deg, #D4EDD8 0%, #F8F7F2 100%)', minHeight: '85vh', display: 'flex', alignItems: 'center' }}
      >
        <div className="relative max-w-3xl mx-auto w-full">
          <p
            className="text-xs font-bold uppercase mb-4"
            style={{ color: '#2D8F4E', letterSpacing: '0.2em', fontFamily: 'Sora, sans-serif' }}
          >
            BODY TYPE DIAGNOSIS
          </p>
          <h1
            className="font-black leading-tight mb-6"
            style={{ fontSize: 'clamp(36px, 6vw, 52px)', color: '#1C2A1E' }}
          >
            あなたの身体、<br />何型の動物ですか？
          </h1>
          <p className="mb-3" style={{ color: '#4A6550', lineHeight: 1.8, fontSize: '20px' }}>
            筋力・持久力・スピード・柔軟性・調整力。<br className="hidden md:block" />
            5つの軸で測定し、22種類の動物タイプで表す身体診断。
          </p>
          <p className="mb-10" style={{ color: '#4A6550', fontSize: '16px' }}>
            性格でなく<strong style={{ color: '#1C2A1E' }}>「身体の特性」</strong>を診断する、動物版フィジカル診断。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/quiz/quick"
              className="inline-flex items-center justify-center gap-2 font-bold transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: '#F59E0B',
                color: '#1C2A1E',
                padding: '0 36px',
                borderRadius: '100px',
                boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
                fontSize: '18px',
                minHeight: '56px',
              }}
            >
              🐾 10問で簡単診断（無料）
            </Link>
            <Link
              to="/quiz"
              className="inline-flex items-center justify-center gap-2 font-bold transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: 'transparent',
                color: '#2D8F4E',
                padding: '0 28px',
                borderRadius: '100px',
                border: '2px solid #2D8F4E',
                fontSize: '16px',
                minHeight: '56px',
              }}
            >
              📊 60問で詳しく診断
            </Link>
          </div>
          <p className="mt-3 text-xs" style={{ color: '#4A6550' }}>詳細診断は結果をメールでお送りします</p>
          <div
            className="mt-12 flex justify-center cursor-pointer animate-bounce"
            style={{ color: '#4A6550' }}
            onClick={() => quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── What is this? ── */}
      <section ref={quizSectionRef} className="py-16 px-4" style={{ backgroundColor: '#F8F7F2' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#2D8F4E' }}>WHAT IS WILDFLOW?</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#1C2A1E' }}>
            身体のMBTI、はじめました。
          </h2>
          <p className="leading-relaxed mb-10" style={{ color: '#4A6550', fontSize: '18px', lineHeight: '1.8' }}>
            MBTIが「性格」を16タイプで分類するように、<br className="hidden md:block" />
            wildflow は「身体の特性」を22タイプの動物で分類します。<br className="hidden md:block" />
            あなたは力があるのに持久力がない「サイ型」？<br className="hidden md:block" />
            それとも器用なのにスピードが出ない「カワウソ型」？
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
            {AXES.map(ax => (
              <div
                key={ax.label}
                className="rounded-xl p-4 text-center"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8E4' }}
              >
                <p className="text-2xl mb-1">{ax.icon}</p>
                <p className="text-xs font-bold mb-1" style={{ color: '#1C2A1E' }}>{ax.label}</p>
                <p className="text-xs" style={{ color: '#4A6550' }}>{ax.desc}</p>
              </div>
            ))}
          </div>

          <Link
            to="/quiz/quick"
            className="inline-flex items-center gap-2 font-bold transition-all hover:-translate-y-0.5"
            style={{
              backgroundColor: '#F59E0B',
              color: '#1C2A1E',
              padding: '0 40px',
              borderRadius: '100px',
              boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
              fontSize: '18px',
              minHeight: '56px',
            }}
          >
            🐾 10問で簡単診断 →
          </Link>
        </div>
      </section>

      {/* ── 22 Types Grid ── */}
      <section className="py-16 px-4" style={{ backgroundColor: '#EDF7EE' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#2D8F4E' }}>22 TYPES</p>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1C2A1E' }}>あなたはどの動物？</h2>
          <p className="text-sm mb-10" style={{ color: '#4A6550' }}>22種類の動物タイプの中から、あなたの身体特性が判定されます。</p>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-3">
            {TYPE_GRID_MAIN.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl p-3 flex flex-col items-center gap-1 transition-all duration-200 cursor-default"
                style={{ backgroundColor: '#FFFFFF', border: '2px solid #E2E8E4' }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = '#2D8F4E';
                  el.style.backgroundColor = '#EDF7EE';
                  el.style.transform = 'translateY(-4px)';
                  el.style.boxShadow = '0 8px 24px rgba(45,143,78,0.15)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = '#E2E8E4';
                  el.style.backgroundColor = '#FFFFFF';
                  el.style.transform = '';
                  el.style.boxShadow = '';
                }}
              >
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-xs font-semibold" style={{ color: '#1C2A1E' }}>{t.name}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3 mb-10">
            {TYPE_GRID_SPECIAL.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl p-3 flex flex-col items-center gap-1 cursor-default"
                style={{
                  backgroundColor: t.rare === 'dragon' ? '#FDF8EF' : '#EFF6FF',
                  border: `2px solid ${t.rare === 'dragon' ? '#F59E0B' : '#3B82F6'}`,
                  minWidth: '80px',
                }}
              >
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-xs font-semibold" style={{ color: '#1C2A1E' }}>{t.name}</span>
              </div>
            ))}
          </div>

          <p className="text-sm mb-6" style={{ color: '#4A6550' }}>
            レア中のレア <span className="font-bold" style={{ color: '#F59E0B' }}>🐉 ドラゴン型</span> が出ることも。
          </p>
          <Link
            to="/quiz/quick"
            className="inline-flex items-center gap-2 font-bold transition-all"
            style={{
              color: '#2D8F4E',
              border: '2px solid #2D8F4E',
              padding: '0 32px',
              borderRadius: '100px',
              backgroundColor: 'transparent',
              fontSize: '18px',
              minHeight: '56px',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.backgroundColor = '#2D8F4E';
              el.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.backgroundColor = 'transparent';
              el.style.color = '#2D8F4E';
            }}
          >
            🐾 自分のタイプを調べる
          </Link>
        </div>
      </section>

      {/* ── Latest Posts ── */}
      {(loading || posts.length > 0) && (
        <section className="px-4 py-16" style={{ backgroundColor: '#FDF8EF' }}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold" style={{ color: '#1C2A1E' }}>最新記事</h2>
              <Link to="/blog" className="text-sm transition-colors hover:opacity-70" style={{ color: '#2D8F4E' }}>
                すべて見る →
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
                    <div className="skeleton aspect-video" />
                    <div className="p-4 space-y-2">
                      <div className="skeleton h-4 w-3/4" />
                      <div className="skeleton h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {posts.map(post => <PostCard key={post.id} post={post} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Bottom CTA ── */}
      <section className="py-20 px-4" style={{ backgroundColor: '#2D8F4E' }}>
        <div className="max-w-xl mx-auto text-center">
          <p className="text-4xl mb-4">🐾</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            あなたの野生、まだ眠っていませんか？
          </h2>
          <p className="mb-8" style={{ color: '#C8E6CA', fontSize: '18px', lineHeight: '1.8' }}>
            60問の本格診断で、あなたの身体の強みと弱みを動物タイプで可視化。<br />
            診断後にあなた専用の処方レッスンも提示されます。
          </p>
          <Link
            to="/quiz/quick"
            className="inline-flex items-center gap-2 font-bold transition-all hover:-translate-y-0.5"
            style={{
              backgroundColor: '#F59E0B',
              color: '#1C2A1E',
              padding: '0 40px',
              borderRadius: '100px',
              boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
              fontSize: '18px',
              minHeight: '56px',
            }}
          >
            🐾 10問で簡単診断（無料）
          </Link>
          <p className="mt-3 text-xs" style={{ color: '#A8D5A2' }}>10問 / 約1分 / 会員登録不要</p>
        </div>
      </section>
    </main>
  );
}
