import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { QuickResult } from '../utils/calcQuickType';
import { ABILITY_LABELS, ABILITY_TO_ANIMALS, ABILITY_LESSON } from '../utils/calcQuickType';

const ABILITY_ORDER = ['strength', 'endurance', 'speed', 'flexibility', 'coordination'] as const;

const SITE_URL = 'https://wildflow-platform.shodorannga.workers.dev';

function AbilityBar({ label, score, isLow }: { label: string; score: number; isLow: boolean }) {
  const color = isLow ? '#F59E0B' : '#2D8F4E';
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span style={{ color }}>
          {label}
          {isLow && <span className="ml-1 text-sm">▲ 伸びしろ</span>}
        </span>
        <span style={{ color }}>{score}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E2E8E4' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function QuickQuizResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as QuickResult | undefined;
  const [copied, setCopied] = useState(false);

  if (!result) {
    navigate('/quiz/quick');
    return null;
  }

  const { lowestAbility, secondLowest, scores } = result;
  const lowestLabel = ABILITY_LABELS[lowestAbility];
  const animals = ABILITY_TO_ANIMALS[lowestAbility];
  const lesson = ABILITY_LESSON[lowestAbility];

  const shareTextX = `私は${lowestLabel}が伸びしろの身体タイプでした！🐾\nあなたの野生タイプは何型？ #wildflow #身体のMBTI\n${SITE_URL}/quiz/quick`;
  const shareTextLine = `私は${lowestLabel}が伸びしろの身体タイプでした！あなたは？wildflowで診断してみて👇 ${SITE_URL}/quiz/quick`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${SITE_URL}/quiz/quick`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="text-sm font-medium mb-1" style={{ color: '#1A6B38' }}>簡易診断 結果</p>
        <h1 className="font-black mb-2" style={{ color: '#1C2A1E', fontSize: '36px', lineHeight: '1.3' }}>
          あなたが最も伸ばせるアビリティは
        </h1>
        <div
          className="inline-block px-6 py-3 rounded-2xl mt-2"
          style={{ backgroundColor: '#FEF3C7', border: '2px solid #F59E0B' }}
        >
          <p className="text-2xl font-black" style={{ color: '#D97706' }}>
            🌱 {lowestLabel}
          </p>
        </div>
      </div>

      {/* スコアグラフ */}
      <div
        className="p-6 rounded-2xl border mb-6"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
      >
        <p className="text-sm font-bold mb-4" style={{ color: '#4A6550' }}>── 5軸アビリティスコア ──</p>
        {ABILITY_ORDER.map(ab => (
          <AbilityBar
            key={ab}
            label={ABILITY_LABELS[ab]}
            score={scores[ab]}
            isLow={ab === lowestAbility || ab === secondLowest}
          />
        ))}
      </div>

      {/* 該当動物タイプ */}
      <div
        className="p-6 rounded-2xl border mb-6"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
      >
        <h2 className="text-lg font-bold mb-3" style={{ color: '#1C2A1E' }}>
          このアビリティが伸びしろの動物タイプ
        </h2>
        <p className="text-sm mb-3" style={{ color: '#4A6550' }}>
          「{lowestLabel}」が伸びしろの動物タイプはこれら：
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {animals.map(animal => (
            <span
              key={animal}
              className="px-3 py-1.5 rounded-full text-sm font-bold"
              style={{ backgroundColor: '#EDF7EE', color: '#2D8F4E', border: '1px solid #2D8F4E' }}
            >
              {animal}
            </span>
          ))}
        </div>
        <p className="text-xs" style={{ color: '#4A6550' }}>
          あなたがどのタイプに当てはまるかは、詳細診断（60問）で判定できます。
        </p>
      </div>

      {/* おすすめレッスン */}
      <div
        className="p-5 rounded-2xl mb-6"
        style={{ backgroundColor: '#EDF7EE', borderLeft: '4px solid #2D8F4E' }}
      >
        <h2 className="text-base font-bold mb-1" style={{ color: '#1A6B38' }}>🎯 おすすめレッスン</h2>
        <p className="text-sm font-bold" style={{ color: '#1C2A1E' }}>{lesson}</p>
        <a
          href="/lessons"
          className="inline-flex items-center gap-1 mt-3 text-sm font-bold transition-opacity hover:opacity-70"
          style={{ color: '#2D8F4E', minHeight: '44px' }}
        >
          レッスン詳細を見る →
        </a>
      </div>

      {/* 詳細診断CTA */}
      <div
        className="p-6 rounded-2xl border text-center mb-6"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#2D8F4E', borderWidth: '2px' }}
      >
        <p className="font-bold mb-1" style={{ color: '#1C2A1E' }}>どのタイプか詳しく知りたい方は</p>
        <p className="text-sm mb-4" style={{ color: '#4A6550' }}>
          60問の詳細診断で、22タイプの中からあなたの野生タイプを完全判定。
          結果はメールでお送りします。
        </p>
        <a
          href="/quiz"
          className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#2D8F4E' }}
        >
          📊 60問で詳しく診断する →
        </a>
      </div>

      {/* シェアボタン */}
      <div
        className="p-5 rounded-2xl border mb-6"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
      >
        <p className="text-sm font-bold mb-3 text-center" style={{ color: '#1C2A1E' }}>
          📣 友達にシェアする
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTextX)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#000000' }}
          >
            𝕏 でシェアする
          </a>
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(`${SITE_URL}/quiz/quick`)}&text=${encodeURIComponent(shareTextLine)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#06C755' }}
          >
            LINE でシェアする
          </a>
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm border-2 transition-opacity hover:opacity-80"
            style={{ borderColor: '#E2E8E4', color: '#1C2A1E', backgroundColor: '#F8F7F2' }}
          >
            {copied ? '✅ コピーしました！' : '🔗 URLをコピー（XHS・lemon8用）'}
          </button>
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={() => navigate('/quiz/quick')}
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: '#4A6550' }}
        >
          🔄 もう一度簡易診断する
        </button>
      </div>
    </main>
  );
}
