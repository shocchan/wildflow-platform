import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { quickQuestions } from '../data/quickQuizQuestions';
import { calcQuickResult } from '../utils/calcQuickType';
import { track } from '../services/analytics';
import { getEntry, rememberEntryFromSearch } from '../utils/entry';
import { ENTRY_COPY, questionsForEntry } from '../data/entryCopy';
import { useLang } from '../i18n/lang';
import { MESSAGES } from '../i18n/messages';

export function QuickQuiz() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [current]);

  // /badminton・/beginner からの流入は ?entry= で分かる。先に控えてから、見出し・質問文を入口ごとに出し分ける
  // （P0-4 + 言い回し差し替え）。ロジック（id・軸・逆転）は quickQuestions のまま。
  const [entry] = useState(() => { rememberEntryFromSearch(search); return getEntry(); });
  const lang = useLang();
  const copy = ENTRY_COPY[lang][entry];
  const questions = questionsForEntry(entry, quickQuestions, lang);
  const tq = MESSAGES[lang].quiz;
  const LABELS = tq.labels;

  useEffect(() => {
    track('start_wild_type_diagnosis', { quiz_type: 'quick', entry });
  }, [entry]);

  const handleSelect = (value: number) => {
    if (isTransitioning) return;
    setSelected(value);
    setIsTransitioning(true);

    setTimeout(() => {
      const newAnswers = { ...answers, [questions[current].id]: value };
      setAnswers(newAnswers);

      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
        setSelected(null);
        setIsTransitioning(false);
      } else {
        const result = calcQuickResult(newAnswers, questions);
        navigate('/quiz/quick/result', { state: { result } });
      }
    }, 300);
  };

  const handlePrev = () => {
    if (current === 0 || isTransitioning) return;
    const prevIndex = current - 1;
    setCurrent(prevIndex);
    setSelected(answers[questions[prevIndex].id] ?? null);
  };

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <main className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-12">
      <div className="text-center mb-8">
        <p className="text-sm font-medium mb-1" style={{ color: '#2D8F4E' }}>{copy.quizName}</p>
        <h1 className="font-black" style={{ color: '#1C2A1E', fontSize: '28px', lineHeight: '1.3' }}>
          {copy.quizHeading}
        </h1>
        <p className="text-xs mt-2" style={{ color: '#4A6550' }}>{tq.note(copy.axesWord)}</p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center text-xs mb-2" style={{ color: '#4A6550' }}>
          <span>{tq.progress(current + 1, questions.length)}</span>
          {current > 0 && (
            <button
              onClick={handlePrev}
              disabled={selected !== null}
              className="text-xs transition-colors disabled:opacity-30 flex items-center gap-1"
              style={{ color: '#4A6550' }}
            >
              {tq.prev}
            </button>
          )}
        </div>
        <div className="rounded-full overflow-hidden" style={{ backgroundColor: '#E2E8E4', height: '8px' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: '#2D8F4E' }}
          />
        </div>
      </div>

      <div
        key={current}
        className="quiz-question-enter p-6 rounded-2xl border mb-6"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
      >
        <p className="text-base font-bold text-center leading-snug" style={{ color: '#1C2A1E' }}>
          {q.text}
        </p>
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
