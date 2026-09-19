import { useEffect, useRef, useState } from 'react';
import type { Landing, Move } from '../../i18n/landing';
import { track } from '../../services/analytics';

type Phase = 'idle' | 'go' | 'rest' | 'done';
const REST = 5;

/**
 * 30秒チャレンジ。動きを選んで「スタート」→ 秒×回のカウントダウン（セット間5秒休憩）。
 * 音は鳴らさない（体育館で開く人がいる）。ページ内で完結、何も保存しない。
 */
export function ChallengeTimer({ t, move, onPick }: { t: Landing; move: Move; onPick: (m: Move) => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [set, setSet] = useState(1);
  const [left, setLeft] = useState(move.dose.sec);
  const tick = useRef<number | null>(null);

  const reset = (m: Move = move) => { if (tick.current) window.clearInterval(tick.current); setPhase('idle'); setSet(1); setLeft(m.dose.sec); };
  useEffect(() => { reset(move); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [move.key]);
  useEffect(() => () => { if (tick.current) window.clearInterval(tick.current); }, []);

  const start = () => {
    reset();
    setPhase('go');
    track('start_challenge', { move: move.key, from: 'timer' });
  };

  useEffect(() => {
    if (phase !== 'go' && phase !== 'rest') return;
    tick.current = window.setInterval(() => {
      setLeft(l => {
        if (l > 1) return l - 1;
        // 0 になった
        if (phase === 'go') {
          if (set >= move.dose.reps) { setPhase('done'); track('complete_challenge', { move: move.key }); return 0; }
          setPhase('rest'); return REST;
        }
        setSet(s => s + 1); setPhase('go'); return move.dose.sec;
      });
    }, 1000);
    return () => { if (tick.current) window.clearInterval(tick.current); };
  }, [phase, set, move]);

  const total = phase === 'rest' ? REST : move.dose.sec;
  const pct = phase === 'idle' ? 0 : phase === 'done' ? 100 : ((total - left) / total) * 100;
  const ringColor = phase === 'rest' ? '#3B82F6' : phase === 'done' ? '#2D8F4E' : '#F5A623';

  return (
    <div className="rounded-3xl p-5 md:p-8 text-white" style={{ background: 'linear-gradient(160deg, #1a3a2a 0%, #0f261a 100%)' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* 左：リング + 数字 */}
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: '220px', height: '220px' }}>
            <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={ringColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - pct / 100)}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {phase === 'idle' && <img src={`/img/shocchan/${move.key}.webp`} alt="" width={512} height={512} style={{ width: '130px', height: 'auto' }} className="wf-float" />}
              {(phase === 'go' || phase === 'rest') && (
                <>
                  <span className="text-6xl font-black tabular-nums" style={{ color: ringColor }}>{left}</span>
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#C8E6CA' }}>{phase === 'go' ? t.timer.go : t.timer.rest}</span>
                </>
              )}
              {phase === 'done' && <img src="/img/shocchan/joy.webp" alt="" width={370} height={320} style={{ width: '130px', height: 'auto' }} className="wf-pop" />}
            </div>
          </div>
          <p className="mt-2 text-sm font-bold" style={{ color: '#C8E6CA' }}>
            {phase === 'idle' ? move.dose.label : phase === 'done' ? t.timer.done : t.timer.set(set, move.dose.reps)}
          </p>
        </div>

        {/* 右：選択と操作 */}
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: '#6fcf97' }}>{t.timer.pick}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {t.moves.map(m => (
              <button key={m.key} onClick={() => onPick(m)} disabled={phase === 'go' || phase === 'rest'}
                className="text-xs font-bold rounded-full px-3 disabled:opacity-40"
                style={{ minHeight: '36px', backgroundColor: m.key === move.key ? '#F5A623' : 'rgba(255,255,255,.08)', color: m.key === move.key ? '#1a3a2a' : '#EAF3E6' }}>
                {m.name}
              </button>
            ))}
          </div>
          <h3 className="text-2xl font-black mb-1">{move.name} <span className="text-sm font-medium" style={{ color: '#9DB6A0' }}>{move.en}</span></h3>
          {phase === 'done' ? (
            <p className="text-sm mb-4" style={{ color: '#C8E6CA' }}>{t.timer.doneBody}</p>
          ) : (
            <ol className="text-sm mb-4 space-y-1" style={{ color: '#C8E6CA' }}>
              {move.steps.map((s, k) => <li key={k}>{k + 1}. {s}</li>)}
            </ol>
          )}
          <div className="flex flex-wrap gap-3">
            {phase === 'idle' && (
              <button onClick={start} className="font-black rounded-full px-8 transition-transform hover:-translate-y-0.5" style={{ backgroundColor: '#F5A623', color: '#1a3a2a', minHeight: '56px', fontSize: '18px' }}>
                ▶ {t.timer.ready}
              </button>
            )}
            {(phase === 'go' || phase === 'rest') && (
              <button onClick={() => reset()} className="font-bold rounded-full px-6" style={{ border: '2px solid rgba(255,255,255,.3)', minHeight: '48px' }}>{t.timer.stop}</button>
            )}
            {phase === 'done' && (
              <>
                <button onClick={start} className="font-bold rounded-full px-6" style={{ backgroundColor: '#F5A623', color: '#1a3a2a', minHeight: '48px' }}>{t.timer.again}</button>
                <a href="#axes" className="inline-flex items-center font-bold rounded-full px-6" style={{ border: '2px solid #6fcf97', color: '#EAF3E6', minHeight: '48px' }}>{t.axes.cta}</a>
              </>
            )}
          </div>
          <p className="mt-4 text-xs" style={{ color: '#7E977F' }}>{t.timer.caution}</p>
        </div>
      </div>
    </div>
  );
}
