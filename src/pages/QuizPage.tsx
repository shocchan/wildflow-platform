import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { questions } from '../data/quizQuestions';
import { calcAbilityScores, determineWildType } from '../utils/calcWildType';
import type { AbilityScores } from '../utils/calcWildType';
import type { WildType } from '../data/wildTypes';

const LABELS = ['まったく違う', '少し違う', 'どちらでもない', '少しそう', 'とてもそう'];

const ABILITY_LABELS: Record<string, string> = {
  strength: '筋力',
  endurance: '持久力',
  speed: 'スピード',
  flexibility: '柔軟性',
  coordination: '調整力',
};

const ABILITY_ORDER = ['strength', 'endurance', 'speed', 'flexibility', 'coordination'] as const;

type Step = 'quiz' | 'result';

function AbilityBar({ label, score, isHigh, isLow }: { label: string; score: number; isHigh: boolean; isLow: boolean }) {
  const color = isHigh ? '#2D8F4E' : isLow ? '#EF4444' : '#4A6550';
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: isHigh ? '#2D8F4E' : isLow ? '#EF4444' : '#4A6550' }}>
          {label}
          {isHigh && <span className="ml-1 text-xs" style={{ color: '#2D8F4E' }}>▲ 高い</span>}
          {isLow && <span className="ml-1 text-xs" style={{ color: '#EF4444' }}>▼ 伸びしろ</span>}
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

function ResultView({ result, scores, onReset }: { result: WildType; scores: AbilityScores; onReset: () => void }) {
  const isDragon = result.special === 'dragon';
  const isEgg = result.special === 'egg';
  const accentColor = isDragon ? '#F59E0B' : isEgg ? '#3B82F6' : '#2D8F4E';

  const maxScore = Math.max(...ABILITY_ORDER.map(a => scores[a]));
  const minScore = Math.min(...ABILITY_ORDER.map(a => scores[a]));

  const tweetText = encodeURIComponent(
    `私の野生タイプは「${result.emoji} ${result.name}」でした！\n${result.catch}\n\n${result.hashtag}\nhttps://wildflow-platform.pages.dev/quiz`
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 text-center" style={{ backgroundColor: '#F8F7F2' }}>
      {isDragon && (
        <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#F59E0B' }}>
          ✨ レアタイプ出現
        </p>
      )}
      {isEgg && (
        <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#3B82F6' }}>
          🥚 野生覚醒前
        </p>
      )}

      <p className="text-8xl mb-4">{result.emoji}</p>
      <p className="text-sm font-medium tracking-widest uppercase mb-2" style={{ color: accentColor }}>
        あなたの野生タイプは
      </p>
      <h1 className="text-4xl font-black mb-2" style={{ color: '#1C2A1E' }}>{result.name}</h1>
      <p className="text-base font-bold mb-8" style={{ color: accentColor }}>{result.subtitle}</p>

      <div
        className="p-6 rounded-2xl border mb-6 text-left"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: isDragon ? '#F59E0B' : isEgg ? '#3B82F6' : '#E2E8E4',
        }}
      >
        <p className="text-sm font-bold mb-3" style={{ color: accentColor }}>💬 {result.catch}</p>
        <p className="leading-relaxed text-sm mb-6" style={{ color: '#4A6550' }}>{result.description}</p>

        <p className="text-xs font-bold mb-3" style={{ color: '#4A6550' }}>── 5軸能力スコア ──</p>
        {ABILITY_ORDER.map(ab => (
          <AbilityBar
            key={ab}
            label={ABILITY_LABELS[ab]}
            score={scores[ab]}
            isHigh={scores[ab] === maxScore}
            isLow={scores[ab] === minScore && scores[ab] !== maxScore}
          />
        ))}

        <div
          className="mt-5 p-4 rounded-xl"
          style={{ backgroundColor: '#EDF7EE', borderLeft: `3px solid ${accentColor}` }}
        >
          <p className="text-xs font-bold mb-1" style={{ color: accentColor }}>🎯 処方レッスン</p>
          <p className="text-sm" style={{ color: '#1C2A1E' }}>{result.lesson}</p>
          <p className="text-xs mt-2" style={{ color: '#4A6550' }}>
            あなたのタイプに最適化されたトレーニングプログラムです。まずはこのレッスンから始めてみてください。
          </p>
          <a
            href="/#quiz-start"
            className="inline-flex items-center gap-1 mt-3 text-sm font-bold transition-colors hover:opacity-70"
            style={{ color: accentColor }}
          >
            レッスンの詳細を見る →
          </a>
        </div>
      </div>

      <p className="text-xs mb-6" style={{ color: '#4A6550' }}>{result.hashtag}</p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all hover:opacity-80"
          style={{ backgroundColor: '#1d9bf0' }}
        >
          𝕏 X でポストする
        </a>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 font-bold border-2 transition-all hover:opacity-80"
          style={{
            borderColor: '#2D8F4E',
            color: '#2D8F4E',
            padding: '14px 32px',
            borderRadius: '100px',
            backgroundColor: 'transparent',
          }}
        >
          🔄 もう一度診断する
        </button>
      </div>
    </main>
  );
}

export function QuizPage() {
  const [step, setStep] = useState<Step>('quiz');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [result, setResult] = useState<WildType | null>(null);
  const [scores, setScores] = useState<AbilityScores | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [current]);

  const handleSelect = (value: number) => {
    if (isTransitioning) return;
    setSelected(value);
    setIsTransitioning(true);

    setTimeout(async () => {
      const newAnswers = { ...answers, [questions[current].id]: value };
      setAnswers(newAnswers);

      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
        setSelected(null);
        setIsTransitioning(false);
      } else {
        const abilityScores = calcAbilityScores(newAnswers, questions);
        const wildType = determineWildType(abilityScores);
        setScores(abilityScores);
        setResult(wildType);
        setStep('result');
        try {
          await supabase.from('quiz_results').insert([{
            animal_type: wildType.id,
            scores: abilityScores,
          }]);
        } catch (_) { /* non-blocking */ }
      }
    }, 300);
  };

  const handlePrev = () => {
    if (current === 0 || isTransitioning) return;
    const prevIndex = current - 1;
    setCurrent(prevIndex);
    setSelected(answers[questions[prevIndex].id] ?? null);
  };

  const reset = () => {
    setStep('quiz');
    setCurrent(0);
    setAnswers({});
    setSelected(null);
    setIsTransitioning(false);
    setResult(null);
    setScores(null);
  };

  if (step === 'result' && result && scores) {
    return <ResultView result={result} scores={scores} onReset={reset} />;
  }

  const q = questions[current];

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="text-sm font-medium mb-1" style={{ color: '#2D8F4E' }}>野生タイプ診断</p>
        <h1 className="text-2xl font-black" style={{ color: '#1C2A1E' }}>あなたの野生タイプを診断する</h1>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center text-xs mb-2" style={{ color: '#4A6550' }}>
          <span>質問 {current + 1} / {questions.length}</span>
          {current > 0 && (
            <button
              onClick={handlePrev}
              disabled={selected !== null}
              className="text-xs transition-colors disabled:opacity-30 flex items-center gap-1"
              style={{ color: '#4A6550' }}
            >
              ← 前の質問へ
            </button>
          )}
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E2E8E4' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${((current + 1) / questions.length) * 100}%`, backgroundColor: '#2D8F4E' }}
          />
        </div>
      </div>

      <div
        key={current}
        className="quiz-question-enter p-6 rounded-2xl border mb-6"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
      >
        <p className="text-base font-bold text-center leading-snug" style={{ color: '#1C2A1E' }}>{q.text}</p>
      </div>

      <div className="space-y-3">
        {LABELS.map((label, i) => {
          const value = i + 1;
          const isSelected = selected === value;
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              disabled={isTransitioning}
              className="w-full text-left p-4 rounded-xl transition-all duration-150 active:scale-[0.98] disabled:cursor-default"
              style={{
                backgroundColor: isSelected ? '#EDF7EE' : '#FFFFFF',
                border: `2px solid ${isSelected ? '#2D8F4E' : '#E2E8E4'}`,
                borderLeftWidth: isSelected ? '4px' : '2px',
                color: '#1C2A1E',
              }}
            >
              <span className="text-sm font-medium mr-2" style={{ color: '#4A6550' }}>{value}</span>
              {label}
            </button>
          );
        })}
      </div>
    </main>
  );
}
