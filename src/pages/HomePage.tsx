import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PostCard } from '../components/PostCard';
import { fetchLatestPosts } from '../services/posts';
import { track } from '../services/analytics';
import type { Post } from '../types';
import { useLang, langPath } from '../i18n/lang';
import { MESSAGES } from '../i18n/messages';
import { LANDING, type Move } from '../i18n/landing';
import { Reveal } from '../components/landing/Reveal';
import { MoveExplorer } from '../components/landing/MoveExplorer';
import { ChallengeTimer } from '../components/landing/ChallengeTimer';
import { kawabadoActivityUrl } from '../config/site';

/**
 * トップ（2026-09-19 全面刷新）。
 * 「読む」より「触る・やる」を前に出す：動きを触るエクスプローラー → 30秒チャレンジ → 入口2つ → 10問診断。
 * 実績数値・受講者の声は入れていない（素材が無いものは作らない）。
 */
export function HomePage() {
  const lang = useLang();
  const t = LANDING[lang];
  const tm = MESSAGES[lang].home;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [move, setMove] = useState<Move>(t.moves[1]);
  const timerRef = useRef<HTMLElement>(null);
  const bad = langPath('/badminton', lang);
  const beg = langPath('/beginner', lang);

  useEffect(() => { fetchLatestPosts(3).then(setPosts).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => { setMove(LANDING[lang].moves.find(m => m.key === move.key) ?? LANDING[lang].moves[1]); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [lang]);

  const jumpToTimer = (m: Move) => {
    setMove(m);
    timerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <main style={{ overflowX: 'clip' }}>
      {/* ── HERO ── */}
      <section className="relative text-white" style={{ background: 'radial-gradient(1200px 600px at 20% -10%, #2D8F4E 0%, transparent 60%), linear-gradient(160deg, #1a3a2a 0%, #0f261a 100%)' }}>
        <span className="wf-hero-glow" style={{ width: 420, height: 420, background: '#F5A623', right: '-120px', top: '10%', opacity: .28 }} />
        <span className="wf-hero-glow" style={{ width: 360, height: 360, background: '#3B82F6', left: '-140px', bottom: '-80px', opacity: .22 }} />
        <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-14 pb-16 md:pt-24 md:pb-24 grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-8 items-center">
          <div>
            <p className="text-xs font-bold tracking-[.22em] mb-5" style={{ color: '#6fcf97', fontFamily: 'Sora, sans-serif' }}>{t.hero.eyebrow}</p>
            <h1 className="font-black leading-[1.08] mb-6" style={{ fontSize: 'clamp(38px, 7vw, 74px)' }}>
              {t.hero.line1}<br />{t.hero.line2}<br /><span style={{ color: '#F5A623' }}>{t.hero.line3}</span>
            </h1>
            <p className="mb-8 max-w-xl" style={{ color: '#C8E6CA', fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.8 }}>{t.hero.lead}</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <a href={bad} onClick={() => track('click_primary_cta', { cta: 'hero_badminton', lang })}
                className="flex-1 rounded-2xl px-5 py-4 transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: '#F5A623', color: '#1a3a2a', boxShadow: '0 10px 30px rgba(245,166,35,.35)' }}>
                <span className="block font-black text-lg">{t.hero.ctaBad}</span>
                <span className="block text-xs font-medium opacity-80">{t.hero.ctaBadSub}</span>
              </a>
              <a href={beg} onClick={() => track('click_primary_cta', { cta: 'hero_beginner', lang })}
                className="flex-1 rounded-2xl px-5 py-4 transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.35)', color: '#fff' }}>
                <span className="block font-black text-lg">{t.hero.ctaBeg}</span>
                <span className="block text-xs font-medium opacity-80">{t.hero.ctaBegSub}</span>
              </a>
            </div>
            <button onClick={() => jumpToTimer(t.moves[1])} className="mt-5 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4" style={{ color: '#EAF3E6', minHeight: '44px' }}>
              {t.hero.tryNow}
            </button>
          </div>
          <div className="relative flex justify-center md:justify-end">
            <div className="absolute inset-x-10 bottom-6 h-12 rounded-[50%]" style={{ background: 'radial-gradient(closest-side, rgba(0,0,0,.45), transparent)' }} />
            <img src="/img/shocchan/beast-reach.webp" alt="" width={1024} height={949} className="wf-float relative" style={{ width: 'min(78vw, 420px)', height: 'auto', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,.35))' }} loading="eager" />
          </div>
        </div>
        {/* マーキー */}
        <div className="border-t border-white/10 py-3 overflow-hidden" aria-hidden="true">
          <div className="wf-marquee gap-10 text-sm font-bold tracking-widest" style={{ color: 'rgba(255,255,255,.45)', fontFamily: 'Sora, sans-serif' }}>
            {[...t.marquee, ...t.marquee].map((w, i) => <span key={i} className="whitespace-nowrap">✦ {w}</span>)}
          </div>
        </div>
      </section>

      {/* ── PROMISES ── */}
      <section className="px-4 md:px-8 py-16 md:py-20" style={{ backgroundColor: '#F8F7F2' }}>
        <div className="max-w-6xl mx-auto">
          <Reveal><h2 className="text-2xl md:text-4xl font-black text-center mb-10" style={{ color: '#1C2A1E' }}>{t.promises.title}</h2></Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {t.promises.items.map((p, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#fff', border: '1px solid #E2E8E4' }}>
                  <p className="font-black leading-none" style={{ fontSize: '56px', color: '#2D8F4E', fontFamily: 'Sora, sans-serif' }}>{p.big}<span className="text-lg ml-1" style={{ color: '#4A6550' }}>{p.unit}</span></p>
                  <p className="font-bold mt-2 mb-1" style={{ color: '#1C2A1E' }}>{p.label}</p>
                  <p className="text-sm" style={{ color: '#4A6550' }}>{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOVE EXPLORER ── */}
      <section className="px-4 md:px-8 py-16 md:py-24" style={{ backgroundColor: '#EDF7EE' }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-xs font-bold tracking-widest text-center mb-3" style={{ color: '#2D8F4E' }}>{t.explorer.eyebrow}</p>
            <h2 className="text-3xl md:text-5xl font-black text-center mb-3" style={{ color: '#1C2A1E' }}>{t.explorer.title}</h2>
            <p className="text-center max-w-2xl mx-auto mb-10" style={{ color: '#4A6550' }}>{t.explorer.lead}</p>
          </Reveal>
          <Reveal delay={100}><MoveExplorer t={t} onStart={jumpToTimer} /></Reveal>
        </div>
      </section>

      {/* ── 30-SEC CHALLENGE ── */}
      <section ref={timerRef} className="px-4 md:px-8 py-16 md:py-24" style={{ backgroundColor: '#F8F7F2' }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-xs font-bold tracking-widest text-center mb-3" style={{ color: '#F59E0B' }}>{t.timer.eyebrow}</p>
            <h2 className="text-3xl md:text-5xl font-black text-center mb-3" style={{ color: '#1C2A1E' }}>{t.timer.title}</h2>
            <p className="text-center max-w-2xl mx-auto mb-10" style={{ color: '#4A6550' }}>{t.timer.lead}</p>
          </Reveal>
          <Reveal delay={100}><ChallengeTimer t={t} move={move} onPick={setMove} /></Reveal>
        </div>
      </section>

      {/* ── LANES ── */}
      <section className="px-4 md:px-8 py-16 md:py-24" style={{ backgroundColor: '#fff' }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-xs font-bold tracking-widest text-center mb-3" style={{ color: '#2D8F4E' }}>{t.lanes.eyebrow}</p>
            <h2 className="text-3xl md:text-4xl font-black text-center mb-10" style={{ color: '#1C2A1E' }}>{t.lanes.title}</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { l: t.lanes.bad, href: bad, img: 'knee-wobble', bg: '#1a3a2a', fg: '#fff', sub: '#C8E6CA', btn: '#F5A623', btnFg: '#1a3a2a', cta: 'lane_badminton' },
              { l: t.lanes.beg, href: beg, img: 'handstand', bg: '#FDF8EF', fg: '#1C2A1E', sub: '#4A6550', btn: '#2D8F4E', btnFg: '#fff', cta: 'lane_beginner' },
            ].map((x, i) => (
              <Reveal key={i} delay={i * 120}>
                <a href={x.href} onClick={() => track('click_primary_cta', { cta: x.cta, lang })} className="block rounded-3xl p-6 md:p-8 h-full relative overflow-hidden transition-transform hover:-translate-y-1" style={{ backgroundColor: x.bg, color: x.fg }}>
                  <img src={`/img/shocchan/${x.img}.webp`} alt="" width={512} height={512} className="absolute -right-4 -bottom-4 opacity-90" style={{ width: '170px', height: 'auto' }} />
                  <h3 className="text-2xl font-black mb-3 pr-24">{x.l.title}</h3>
                  <p className="text-sm mb-4 pr-24" style={{ color: x.sub }}>{x.l.body}</p>
                  <ul className="text-sm space-y-1 mb-6 pr-28" style={{ color: x.sub }}>
                    {x.l.bullets.map((b, k) => <li key={k}>✔ {b}</li>)}
                  </ul>
                  <span className="inline-flex items-center font-bold rounded-full px-5" style={{ backgroundColor: x.btn, color: x.btnFg, minHeight: '48px' }}>{x.l.cta}</span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5 AXES + QUIZ ── */}
      <section id="axes" className="px-4 md:px-8 py-16 md:py-24" style={{ backgroundColor: '#EDF7EE' }}>
        <div className="max-w-5xl mx-auto text-center">
          <Reveal>
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#2D8F4E' }}>{t.axes.eyebrow}</p>
            <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ color: '#1C2A1E' }}>{t.axes.title}</h2>
            <p className="max-w-2xl mx-auto mb-8" style={{ color: '#4A6550' }}>{t.axes.lead}</p>
            <img src="/img/shocchan/five-axes.webp" alt={tm.fiveAlt} width={1600} height={504} className="mx-auto mb-6" style={{ width: '100%', maxWidth: '760px', height: 'auto' }} loading="lazy" />
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {tm.axes.map((ax, i) => (
              <Reveal key={ax.label} delay={i * 60}>
                <div className="rounded-xl p-4 h-full" style={{ backgroundColor: '#fff', border: '1px solid #E2E8E4' }}>
                  <p className="text-2xl mb-1">{ax.icon}</p>
                  <p className="text-sm font-bold mb-1" style={{ color: '#1C2A1E' }}>{ax.label}</p>
                  <p className="text-xs" style={{ color: '#4A6550' }}>{ax.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <Link to="/quiz/quick" onClick={() => track('click_primary_cta', { cta: 'axes_quick_quiz', lang })} className="inline-flex items-center gap-2 font-black rounded-full px-10 transition-transform hover:-translate-y-0.5" style={{ backgroundColor: '#F59E0B', color: '#1C2A1E', minHeight: '60px', fontSize: '18px', boxShadow: '0 10px 30px rgba(245,158,11,.35)' }}>
              {t.axes.cta}
            </Link>
            <p className="mt-3 text-xs" style={{ color: '#4A6550' }}>{t.axes.note}</p>
            <p className="mt-2 text-sm flex flex-wrap justify-center gap-4">
              <Link to="/quiz/quick?entry=badminton" className="underline font-bold" style={{ color: '#2D8F4E' }}>{t.axes.badQuiz}</Link>
              <Link to="/quiz/quick?entry=beginner" className="underline font-bold" style={{ color: '#2D8F4E' }}>{t.axes.begQuiz}</Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── STORY ── */}
      <section className="px-4 md:px-8 py-16 md:py-24 text-white" style={{ backgroundColor: '#1a3a2a' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[160px_1fr] gap-8 items-center">
          <Reveal><img src="/img/shocchan/joy.webp" alt="" width={370} height={320} className="mx-auto" style={{ width: '160px', height: 'auto' }} /></Reveal>
          <Reveal delay={100}>
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#6fcf97' }}>{t.story.eyebrow}</p>
            <p className="text-xl md:text-2xl font-bold leading-relaxed mb-4">「{t.story.quote}」</p>
            <p className="font-black">{t.story.who}</p>
            <p className="text-xs mb-5" style={{ color: '#9DB6A0' }}>{t.story.role}</p>
            <div className="flex flex-wrap gap-4 text-sm font-bold">
              <Link to="/blog" className="underline underline-offset-4" style={{ color: '#F5A623' }}>{t.story.read}</Link>
              <a href={langPath('/about-animalflow', lang)} className="underline underline-offset-4" style={{ color: '#EAF3E6' }}>{t.story.about}</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── LATEST ── */}
      {(loading || posts.length > 0) && (
        <section className="px-4 md:px-8 py-16" style={{ backgroundColor: '#FDF8EF' }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold" style={{ color: '#1C2A1E' }}>{t.latest.title}</h2>
              <Link to="/blog" className="text-sm inline-flex items-center" style={{ color: '#2D8F4E', minHeight: '44px' }}>{t.latest.all}</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loading ? [1, 2, 3].map(i => <div key={i} className="rounded-xl overflow-hidden bg-white"><div className="skeleton aspect-video" /><div className="p-4 space-y-2"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/2" /></div></div>)
                : posts.map(p => <PostCard key={p.id} post={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── BOTTOM ── */}
      <section className="px-4 md:px-8 py-20" style={{ backgroundColor: '#2D8F4E' }}>
        <div className="max-w-2xl mx-auto text-center text-white">
          <img src="/img/shocchan/beast.webp" alt="" width={512} height={512} className="mx-auto mb-4 wf-float" style={{ width: '150px', height: 'auto' }} />
          <h2 className="text-2xl md:text-3xl font-black mb-4">{t.bottom.title}</h2>
          <p className="mb-8" style={{ color: '#C8E6CA' }}>{t.bottom.body}</p>
          <Link to="/quiz/quick" onClick={() => track('click_primary_cta', { cta: 'bottom_quick_quiz', lang })} className="inline-flex items-center font-black rounded-full px-10 transition-transform hover:-translate-y-0.5" style={{ backgroundColor: '#F59E0B', color: '#1C2A1E', minHeight: '58px', fontSize: '18px' }}>{t.bottom.cta}</Link>
          <p className="mt-3 text-sm" style={{ color: '#A8D5A2' }}>{t.bottom.note}</p>
          <p className="mt-6 flex flex-wrap justify-center gap-5 text-sm font-bold">
            <Link to="/lessons" className="underline" style={{ color: '#EAF3E6' }}>{t.bottom.lessons}</Link>
            <a href={kawabadoActivityUrl('home_bottom').replace('/ja/', lang === 'zh' ? '/zh/' : '/ja/')} target="_blank" rel="noopener" onClick={() => track('click_kawabado_referral', { placement: 'home_bottom', lang })} className="underline" style={{ color: '#EAF3E6' }}>{t.bottom.kawabado}</a>
          </p>
        </div>
      </section>
    </main>
  );
}
