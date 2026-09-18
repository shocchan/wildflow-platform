import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PostCard } from '../components/PostCard';
import { fetchLatestPosts } from '../services/posts';
import { fetchProfileSettings } from '../services/settings';
import { track } from '../services/analytics';
import type { Post } from '../types';
import { useLang, langPath } from '../i18n/lang';
import { MESSAGES } from '../i18n/messages';

function InstructorAvatar() {
  const [photoUrl, setPhotoUrl] = useState('');
  useEffect(() => {
    fetchProfileSettings().then(p => { if (p.photo_url) setPhotoUrl(p.photo_url); }).catch(() => {});
  }, []);
  if (photoUrl) return <img src={photoUrl} alt="しょっちゃん" className="w-full h-full object-cover" />;
  return (
    <div className="w-full h-full flex items-center justify-center text-2xl" style={{ backgroundColor: '#EDF7EE' }}>
      🌊
    </div>
  );
}

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

export function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const quizSectionRef = useRef<HTMLElement>(null);
  const lang = useLang();
  const t = MESSAGES[lang].home;
  const AXES = t.axes;

  useEffect(() => {
    fetchLatestPosts(3).then(setPosts).finally(() => setLoading(false));
  }, []);

  return (
    <main>
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden py-20 px-4 md:px-8 lg:px-12 text-center"
        style={{ background: 'linear-gradient(135deg, #D4EDD8 0%, #F8F7F2 100%)', minHeight: '85vh', display: 'flex', alignItems: 'center' }}
      >
        <div className="relative max-w-3xl md:max-w-4xl mx-auto w-full">
          {/*
            2026-09-18 バドミントン・ピボット（P0-1）。
            FV は「あなたはどっち？」の分岐だけにして、診断CTAは下のセクションへ降ろした。
            ・バドミントン経験者 → /badminton（バド症状 × Animal Flow）
            ・運動が苦手／はじめて → /beginner（animalflow.html をやさしく再編集）
          */}
          <p
            className="text-xs font-bold uppercase mb-4"
            style={{ color: '#2D8F4E', letterSpacing: '0.2em', fontFamily: 'Sora, sans-serif' }}
          >
            {t.kicker}
          </p>
          <h1
            className="font-black leading-tight mb-6"
            style={{ fontSize: 'clamp(32px, 6vw, 52px)', color: '#1C2A1E' }}
          >
            {t.title1}<br />{t.title2}
          </h1>
          <p className="mb-3" style={{ color: '#4A6550', lineHeight: 1.8, fontSize: '18px' }}>
            {t.lead1}<br className="hidden md:block" />
            {t.lead2}
          </p>
          <p className="mb-6 font-bold" style={{ color: '#1C2A1E', fontSize: '16px' }}>
            {t.which}
          </p>
          {/* しょっちゃんキャラ（既存イラスト・青タオル）。ボタンの上に2体並べて、どちらの入口かを絵でも伝える */}
          <div className="flex justify-center items-end gap-2 mb-2" aria-hidden="true">
            <img src="/img/shocchan/smash.webp" alt="" width={370} height={320} style={{ width: '132px', height: 'auto' }} loading="eager" />
            <img src="/img/shocchan/handstand.webp" alt="" width={370} height={320} style={{ width: '132px', height: 'auto' }} loading="eager" />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 max-w-xl mx-auto">
            <a
              href={langPath('/badminton', lang)}
              onClick={() => track('click_primary_cta', { cta: 'hero_badminton', lang })}
              className="flex-1 inline-flex flex-col items-center justify-center gap-1 font-bold transition-all hover:-translate-y-0.5 px-6 py-4"
              style={{
                backgroundColor: '#f5a623',
                color: '#1C2A1E',
                borderRadius: '20px',
                boxShadow: '0 4px 14px rgba(245,166,35,0.4)',
                minHeight: '72px',
              }}
            >
              <span style={{ fontSize: '18px' }}>{t.badBtn}</span>
              <span className="text-xs font-medium" style={{ color: '#5a4a1e' }}>{t.badSub}</span>
            </a>
            <a
              href={langPath('/beginner', lang)}
              onClick={() => track('click_primary_cta', { cta: 'hero_beginner', lang })}
              className="flex-1 inline-flex flex-col items-center justify-center gap-1 font-bold transition-all hover:-translate-y-0.5 px-6 py-4"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#1C2A1E',
                border: '2px solid #2D8F4E',
                borderRadius: '20px',
                minHeight: '72px',
              }}
            >
              <span style={{ fontSize: '18px' }}>{t.begBtn}</span>
              <span className="text-xs font-medium" style={{ color: '#4A6550' }}>{t.begSub}</span>
            </a>
          </div>
          <p className="mt-4 text-sm" style={{ color: '#4A6550' }}>{t.neither}</p>
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
      <section ref={quizSectionRef} className="py-16 px-4 md:px-8 lg:px-12" style={{ backgroundColor: '#F8F7F2' }}>
        <div className="max-w-3xl md:max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#2D8F4E' }}>WHAT IS WILDFLOW?</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#1C2A1E' }}>
            {t.whatTitle}
          </h2>
          <p className="leading-relaxed mb-10" style={{ color: '#4A6550', fontSize: '18px', lineHeight: '1.8' }}>
            {t.whatBody[0]}<br className="hidden md:block" />
            {t.whatBody[1]}<br className="hidden md:block" />
            {t.whatBody[2]}<br className="hidden md:block" />
            {t.whatBody[3]}
          </p>

          {/* 5つの力をしょっちゃんの5ポーズで（ChatGPT生成） */}
          <img
            src="/img/shocchan/five-axes.webp"
            alt={t.fiveAlt}
            width={1600}
            height={504}
            className="mx-auto mb-4"
            style={{ width: '100%', maxWidth: '720px', height: 'auto' }}
            loading="lazy"
          />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
            {AXES.map(ax => (
              <div
                key={ax.label}
                className="rounded-xl p-4 text-center"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8E4' }}
              >
                <p className="text-2xl mb-1">{ax.icon}</p>
                <p className="text-xs font-bold mb-1" style={{ color: '#1C2A1E' }}>{ax.label}</p>
                <p className="text-sm" style={{ color: '#4A6550' }}>{ax.desc}</p>
              </div>
            ))}
          </div>

          <Link
            to="/quiz/quick"
            onClick={() => track('click_primary_cta', { cta: 'about_quick_quiz' })}
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
            {t.quickCta}
          </Link>
        </div>
      </section>

      {/* ── Instructor Mini Card ── */}
      <section className="py-8 px-4 md:px-8 lg:px-12" style={{ backgroundColor: '#F8F7F2' }}>
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border px-6 py-5 flex items-center gap-5" style={{ borderColor: '#E2E8E4' }}>
          <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden border-2" style={{ borderColor: '#2D8F4E' }}>
            <InstructorAvatar />
          </div>
          <div>
            <p className="text-xs font-bold uppercase mb-0.5" style={{ color: '#2D8F4E', letterSpacing: '0.1em' }}>{t.instructor}</p>
            <p className="font-black text-lg leading-tight mb-1" style={{ color: '#1C2A1E' }}>{t.instructorName}</p>
            <p className="text-sm leading-relaxed" style={{ color: '#4A6550' }}>{t.instructorBio}</p>
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-16 px-4 md:px-8 lg:px-12" style={{ backgroundColor: '#EDF7EE' }}>
        <div className="max-w-4xl md:max-w-6xl mx-auto">
          <p className="text-sm font-bold tracking-widest uppercase mb-3 text-center" style={{ color: '#1A6B38' }}>HOW IT WORKS</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" style={{ color: '#1C2A1E' }}>{t.howTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-6xl font-black opacity-20 mb-2" style={{ color: '#F59E0B' }}>01</div>
              <div className="text-3xl mb-3">{t.how[0].emoji}</div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#1C2A1E' }}>{t.how[0].title}</h3>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: '#4A6550' }}>{t.how[0].body}</p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-black opacity-20 mb-2" style={{ color: '#F59E0B' }}>02</div>
              <div className="text-3xl mb-3">{t.how[1].emoji}</div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#1C2A1E' }}>{t.how[1].title}</h3>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: '#4A6550' }}>{t.how[1].body}</p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-black opacity-20 mb-2" style={{ color: '#F59E0B' }}>03</div>
              <div className="text-3xl mb-3">{t.how[2].emoji}</div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#1C2A1E' }}>{t.how[2].title}</h3>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: '#4A6550' }}>{t.how[2].body}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Shanghai Story Banner ── */}
      <section className="py-14 px-4 md:px-8 lg:px-12" style={{ backgroundColor: '#1a3a2a' }}>
        <div className="max-w-3xl md:max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: '#6fcf97', letterSpacing: '0.15em' }}>WHY WILDFLOW</p>
          <h2 className="text-xl md:text-2xl font-black mb-5 leading-tight" style={{ color: '#FFFFFF' }}>
            {t.whyTitle1}<br className="hidden md:block" />{t.whyTitle2}
          </h2>
          <p className="mb-8 leading-relaxed" style={{ color: '#C8E6CA', fontSize: '16px', lineHeight: '1.9' }}>
            {t.whyBody1}<br className="hidden md:block" />
            {t.whyBody2}
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 font-bold transition-all hover:-translate-y-0.5"
            style={{
              backgroundColor: '#f5a623',
              color: '#1C2A1E',
              padding: '0 32px',
              borderRadius: '100px',
              fontSize: '16px',
              minHeight: '50px',
            }}
          >
            {t.whyCta}
          </Link>
          <p className="mt-4">
            <a href={langPath('/about-animalflow', lang)} className="text-sm underline" style={{ color: '#C8E6CA', minHeight: '44px', display: 'inline-block', padding: '10px 0' }}>
              {t.aboutCta}
            </a>
          </p>
        </div>
      </section>

      {/* ── 22 Types Grid ── */}
      <section className="py-16 px-4 md:px-8 lg:px-12" style={{ backgroundColor: '#EDF7EE' }}>
        <div className="max-w-3xl md:max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#2D8F4E' }}>22 TYPES</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#1C2A1E' }}>{t.typesTitle}</h2>
          <p className="text-sm md:text-base mb-10" style={{ color: '#4A6550' }}>{t.typesLead}</p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
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
                <span className="text-sm font-semibold" style={{ color: '#1C2A1E' }}>{t.name}</span>
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
                <span className="text-sm font-semibold" style={{ color: '#1C2A1E' }}>{t.name}</span>
              </div>
            ))}
          </div>

          <p className="text-sm mb-6" style={{ color: '#4A6550' }}>
            {t.rare} <span className="font-bold" style={{ color: '#F59E0B' }}>{t.dragon}</span> {t.rareTail}
          </p>
          <Link
            to="/quiz/quick"
            onClick={() => track('click_primary_cta', { cta: 'types_quick_quiz' })}
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
            {t.typesCta}
          </Link>
        </div>
      </section>

      {/* ── Latest Posts ── */}
      {(loading || posts.length > 0) && (
        <section className="px-4 md:px-8 lg:px-12 py-16" style={{ backgroundColor: '#FDF8EF' }}>
          <div className="max-w-5xl md:max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold" style={{ color: '#1C2A1E' }}>{t.latest}</h2>
              <Link to="/blog" className="text-sm transition-colors hover:opacity-70 inline-flex items-center" style={{ color: '#2D8F4E', minHeight: '44px', padding: '10px 0' }}>
                {t.seeAll}
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
      <section className="py-20 px-4 md:px-8 lg:px-12" style={{ backgroundColor: '#2D8F4E' }}>
        <div className="max-w-xl md:max-w-2xl mx-auto text-center">
          <p className="text-4xl mb-4">🐾</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t.bottomTitle}
          </h2>
          {/*
            文とボタンの行き先を合わせる（2026-09-09 UX監査 §16）。
            もとは「60問の本格診断で…」と書きながらボタンは10問診断へ飛んでいた。
            60問は名前とメールの入力が先に要るので、同じ扱いにはできない。
          */}
          <p className="mb-8" style={{ color: '#C8E6CA', fontSize: '18px', lineHeight: '1.8' }}>
            {t.bottomBody1}<strong className="text-white">{t.bottomStrong}</strong>{t.bottomBody2}<br />
            {t.bottomBody3}
          </p>
          <Link
            to="/quiz/quick"
            onClick={() => track('click_primary_cta', { cta: 'bottom_quick_quiz' })}
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
            {t.bottomCta}
          </Link>
          <p className="mt-3 text-sm" style={{ color: '#A8D5A2' }}>{t.bottomNote}</p>
          {/* 2026-09-18 P1-9（A案）: 60問への導線はトップから外した（結果ページには残る） */}
        </div>
      </section>
    </main>
  );
}
