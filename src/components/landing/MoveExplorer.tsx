import { useState } from 'react';
import type { Landing, Move } from '../../i18n/landing';
import { track } from '../../services/analytics';

const AXIS_COLOR: Record<Move['axis'], string> = {
  strength: '#F59E0B', endurance: '#EF6B4A', speed: '#3B82F6', flexibility: '#2D8F4E', coordination: '#8B5CF6',
};

/** 6つの動きをタップで切り替え、しょっちゃんのイラスト＋手順＋「コートでは／ふだんは」を見せる */
export function MoveExplorer({ t, onStart }: { t: Landing; onStart: (m: Move) => void }) {
  const [i, setI] = useState(1);
  const m = t.moves[i];
  const color = AXIS_COLOR[m.axis];
  return (
    <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8E4', boxShadow: '0 24px 60px rgba(28,42,30,.08)' }}>
      {/* タブ */}
      <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-2" style={{ scrollbarWidth: 'none' }} role="tablist">
        {t.moves.map((mv, idx) => (
          <button
            key={mv.key}
            role="tab"
            aria-selected={idx === i}
            onClick={() => { setI(idx); track('explore_move', { move: mv.key }); }}
            className="flex-shrink-0 flex items-center gap-2 rounded-full pl-1 pr-4 py-1 text-sm font-bold transition-all"
            style={{
              backgroundColor: idx === i ? '#1C2A1E' : '#F8F7F2',
              color: idx === i ? '#FFFFFF' : '#4A6550',
              border: `1px solid ${idx === i ? '#1C2A1E' : '#E2E8E4'}`,
              minHeight: '44px',
            }}
          >
            <img src={`/img/shocchan/${mv.key}.webp`} alt="" width={64} height={64} style={{ width: '34px', height: '34px', objectFit: 'contain', borderRadius: '50%', backgroundColor: '#EDF7EE' }} />
            <span className="whitespace-nowrap">{mv.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 p-5 md:p-8 items-center">
        <div className="relative flex justify-center">
          <div className="absolute inset-x-8 bottom-4 h-10 rounded-[50%]" style={{ background: 'radial-gradient(closest-side, rgba(28,42,30,.18), transparent)' }} />
          <img
            key={m.key}
            src={`/img/shocchan/${m.key}.webp`}
            alt={m.name}
            width={1024}
            height={1024}
            className="wf-pop relative"
            style={{ width: '100%', maxWidth: '360px', height: 'auto' }}
          />
          <span className="absolute top-2 left-2 text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: color }}>{m.tag}</span>
        </div>
        <div>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color }}>{m.en}</p>
          <h3 className="text-2xl md:text-3xl font-black mb-3" style={{ color: '#1C2A1E' }}>{m.name}</h3>
          <p className="text-xs font-bold mb-2" style={{ color: '#4A6550' }}>{t.explorer.stepsLabel}</p>
          <ol className="space-y-2 mb-4">
            {m.steps.map((s, k) => (
              <li key={k} className="flex gap-3 text-sm md:text-base" style={{ color: '#1C2A1E' }}>
                <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white" style={{ backgroundColor: color }}>{k + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl p-3" style={{ backgroundColor: '#FDF8EF' }}>
              <p className="text-xs font-bold mb-1" style={{ color: '#B9760F' }}>{t.explorer.courtLabel}</p>
              <p className="text-sm" style={{ color: '#4A6550' }}>{m.court}</p>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: '#EDF7EE' }}>
              <p className="text-xs font-bold mb-1" style={{ color: '#1A6B38' }}>{t.explorer.dailyLabel}</p>
              <p className="text-sm" style={{ color: '#4A6550' }}>{m.daily}</p>
            </div>
          </div>
          <button
            onClick={() => { onStart(m); track('start_challenge', { move: m.key, from: 'explorer' }); }}
            className="inline-flex items-center gap-2 font-bold text-white rounded-full px-6 transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: '#1C2A1E', minHeight: '52px', fontSize: '16px' }}
          >
            {t.explorer.start(m.name)}
            <span className="text-xs font-medium opacity-70">{m.dose.label}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
