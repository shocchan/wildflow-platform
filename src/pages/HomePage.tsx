import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PostCard } from '../components/PostCard';
import { fetchLatestPosts } from '../services/posts';
import type { Post } from '../types';

const TYPE_GRID = [
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
  { emoji: '🐉', name: 'ドラゴン' },
  { emoji: '🥚', name: 'ドラゴンエッグ' },
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
      <section className="relative overflow-hidden py-16 px-4 text-center">
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, #3b82f6 0%, transparent 70%)' }}
        />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#3b82f6' }}>
            BODY TYPE DIAGNOSIS
          </p>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
            あなたの身体、<br />何型の動物ですか？
          </h1>
          <p className="text-base md:text-lg mb-3" style={{ color: '#94a3b8' }}>
            筋力・持久力・スピード・柔軟性・調整力。<br className="hidden md:block" />
            5つの軸で測定し、22種類の動物タイプで表す身体診断。
          </p>
          <p className="text-sm mb-10" style={{ color: '#475569' }}>
            性格でなく<strong className="text-white">「身体の特性」</strong>を診断する、動物版フィジカル診断。
          </p>
          <Link
            to="/quiz"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white text-lg transition-all hover:scale-105"
            style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 30px rgba(59,130,246,0.5)' }}
          >
            🐾 無料で診断する
          </Link>
          <p className="mt-3 text-xs" style={{ color: '#475569' }}>60問 / 5軸測定 / 22タイプ判定</p>
          <div
            className="mt-12 flex justify-center cursor-pointer animate-bounce"
            style={{ color: '#475569' }}
            onClick={() => quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── What is this? ── */}
      <section ref={quizSectionRef} className="py-16 px-4" style={{ backgroundColor: '#050a14' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3b82f6' }}>WHAT IS WILDFLOW?</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            身体のMBTI、はじめました。
          </h2>
          <p className="text-sm leading-relaxed mb-10" style={{ color: '#94a3b8' }}>
            MBTIが「性格」を16タイプで分類するように、<br className="hidden md:block" />
            wildflow は「身体の特性」を22タイプの動物で分類します。<br className="hidden md:block" />
            あなたは力があるのに持久力がない「サイ型」？<br className="hidden md:block" />
            それとも器用なのにスピードが出ない「カワウソ型」？
          </p>

          {/* 5 Axes */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
            {AXES.map(ax => (
              <div key={ax.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111827', border: '1px solid #1e3a5f' }}>
                <p className="text-2xl mb-1">{ax.icon}</p>
                <p className="text-xs font-bold text-white mb-1">{ax.label}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>{ax.desc}</p>
              </div>
            ))}
          </div>

          <Link
            to="/quiz"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all hover:scale-105"
            style={{ backgroundColor: '#3b82f6' }}
          >
            診断スタート →
          </Link>
        </div>
      </section>

      {/* ── 22 Types Grid ── */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3b82f6' }}>22 TYPES</p>
          <h2 className="text-2xl font-bold text-white mb-2">あなたはどの動物？</h2>
          <p className="text-sm mb-10" style={{ color: '#64748b' }}>22種類の動物タイプの中から、あなたの身体特性が判定されます。</p>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-10">
            {TYPE_GRID.map((t, i) => (
              <div
                key={i}
                className="rounded-xl p-2 flex flex-col items-center gap-1 transition-all hover:scale-110 cursor-default"
                style={{ backgroundColor: '#111827', border: '1px solid #1e3a5f' }}
              >
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-xs" style={{ color: '#64748b' }}>{t.name}</span>
              </div>
            ))}
          </div>

          <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>
            レア中のレア <span className="font-bold" style={{ color: '#f59e0b' }}>🐉 ドラゴン型</span> が出ることも。
          </p>
          <Link
            to="/quiz"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold border transition-all hover:bg-white/5"
            style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
          >
            🐾 自分のタイプを調べる
          </Link>
        </div>
      </section>

      {/* ── Latest Posts ── */}
      {(loading || posts.length > 0) && (
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">最新記事</h2>
            <Link to="/blog" className="text-sm transition-colors hover:text-blue-300" style={{ color: '#3b82f6' }}>
              すべて見る →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111827' }}>
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
        </section>
      )}

      {/* ── Bottom CTA ── */}
      <section className="py-20 px-4" style={{ backgroundColor: '#050a14' }}>
        <div className="max-w-xl mx-auto text-center">
          <p className="text-4xl mb-4">🐾</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            あなたの野生、まだ眠っていませんか？
          </h2>
          <p className="text-sm mb-8" style={{ color: '#94a3b8' }}>
            60問の本格診断で、あなたの身体の強みと弱みを動物タイプで可視化。<br />
            診断後にあなた専用の処方レッスンも提示されます。
          </p>
          <Link
            to="/quiz"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white transition-all hover:scale-105"
            style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}
          >
            無料で診断スタート →
          </Link>
          <p className="mt-3 text-xs" style={{ color: '#475569' }}>60問 / 無料 / 会員登録不要</p>
        </div>
      </section>
    </main>
  );
}
