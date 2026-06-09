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
  const color = isHigh ? '#22c55e' : isLow ? '#ef4444' : '#64748b';
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: isHigh ? '#22c55e' : isLow ? '#ef4444' : '#94a3b8' }}>{label}</span>
        <span style={{ color }}>{score}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1e3a5f' }}>
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
  const accentColor = isDragon ? '#f59e0b' : isEgg ? '#06b6d4' : '#3b82f6';

  const maxScore = Math.max(...ABILITY_ORDER.map(a => scores[a]));
  const minScore = Math.min(...ABILITY_ORDER.map(a => scores[a]));

  const tweetText = encodeURIComponent(
    `私の野生タイプは「${result.emoji} ${result.name}」でした！\n${result.catch}\n\n${result.hashtag}\nhttps://wildflow-platform.pages.dev/quiz`
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 text-center">
      {isDragon && (
        <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#f59e0b' }}>
          ✨ レアタイプ出現
        </p>
      )}
      {isEgg && (
        <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#06b6d4' }}>
          🥚 野生覚醒前
        </p>
      )}

      <p className="text-8xl mb-4">{result.emoji}</p>
      <p className="text-sm font-medium tracking-widest uppercase mb-2" style={{ color: accentColor }}>
        あなたの野生タイプは
      </p>
      <h1 className="text-4xl font-black text-white mb-2">{result.name}</h1>
      <p className="text-base font-bold mb-8" style={{ color: accentColor }}>{result.subtitle}</p>

      <div
        className="p-6 rounded-2xl border mb-6 text-left"
        style={{ backgroundColor: '#111827', borderColor: isDragon ? '#854d0e' : isEgg ? '#164e63' : '#1e3a5f' }}
      >
        <p className="text-sm font-bold mb-3" style={{ color: accentColor }}>💬 {result.catch}</p>
        <p className="text-slate-300 leading-relaxed text-sm mb-6">{result.description}</p>

        <p className="text-xs font-bold mb-3" style={{ color: '#94a3b8' }}>── 5軸能力スコア ──</p>
        {ABILITY_ORDER.map(ab => (
          <AbilityBar
            key={ab}
            label={ABILITY_LABELS[ab]}
            score={scores[ab]}
            isHigh={scores[ab] === maxScore}
            isLow={scores[ab] === minScore && scores[ab] !== maxScore}
          />
        ))}

        <div className="mt-5 p-4 rounded-xl" style={{ backgroundColor: '#050a14', borderLeft: `3px solid ${accentColor}` }}>
          <p className="text-xs font-bold mb-1" style={{ color: accentColor }}>🎯 処方レッスン</p>
          <p className="text-sm text-slate-300">{result.lesson}</p>
        </div>
      </div>

      <p className="text-xs mb-6" style={{ color: '#475569' }}>{result.hashtag}</p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all hover:opacity-80"
          style={{ backgroundColor: '#1d9bf0' }}
        >
          𝕏 Xでシェアする
        </a>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold border transition-all hover:bg-white/5"
          style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
        >
          もう一度診断する
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
  const [result, setResult] = useState<WildType | null>(null);
  const [scores, setScores] = useState<AbilityScores | null>(null);

  // prevent accidental back navigation mid-quiz
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [current]);

  const handleSelect = (value: number) => {
    if (selected !== null) return;
    setSelected(value);

    setTimeout(async () => {
      const newAnswers = { ...answers, [questions[current].id]: value };
      setAnswers(newAnswers);

      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
        setSelected(null);
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

  const reset = () => {
    setStep('quiz');
    setCurrent(0);
    setAnswers({});
    setSelected(null);
    setResult(null);
    setScores(null);
  };

  if (step === 'result' && result && scores) {
    return <ResultView result={result} scores={scores} onReset={reset} />;
  }

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="text-sm font-medium mb-1" style={{ color: '#3b82f6' }}>野生タイプ診断 v2</p>
        <h1 className="text-2xl font-black text-white">あなたの野生タイプを診断する</h1>
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-xs mb-2" style={{ color: '#64748b' }}>
          <span>質問 {current + 1} / {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1e3a5f' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: '#3b82f6' }}
          />
        </div>
      </div>

      <div className="p-6 rounded-2xl border mb-6" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}>
        <p className="text-base font-bold text-white text-center leading-snug">{q.text}</p>
      </div>

      <div className="space-y-3">
        {LABELS.map((label, i) => {
          const value = i + 1;
          const isSelected = selected === value;
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              disabled={selected !== null}
              className="w-full text-left p-4 rounded-xl border transition-all duration-150 hover:bg-gray-800 active:scale-[0.98] disabled:cursor-default"
              style={{
                backgroundColor: isSelected ? '#1e3a5f' : '#111827',
                borderColor: isSelected ? '#3b82f6' : '#1e3a5f',
                color: isSelected ? '#ffffff' : '#cbd5e1',
                borderLeftWidth: '3px',
                borderLeftColor: isSelected ? '#3b82f6' : '#1e3a5f',
              }}
            >
              <span className="text-sm font-medium mr-2" style={{ color: '#475569' }}>{value}</span>
              {label}
            </button>
          );
        })}
      </div>
    </main>
  );
}
