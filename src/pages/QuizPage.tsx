import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { questions } from '../data/quizQuestions';
import { calcAbilityScores, determineWildType } from '../utils/calcWildType';

const LABELS = ['まったく違う', '少し違う', 'どちらでもない', '少しそう', 'とてもそう'];

const ABILITY_LABELS: Record<string, string> = {
  strength: '筋力',
  endurance: '持久力',
  speed: '敏捷性',
  flexibility: '柔軟性',
  coordination: '協調性',
};

const SITE_URL = 'https://wildflow-platform.shodorannga.workers.dev';

type Step = 'gate' | 'quiz' | 'done';

interface DoneData {
  wildTypeName: string;
  lowestAbilityLabel: string;
}

function getEncouragementMessage(current: number, total: number): string {
  const progress = current / total;
  if (progress === 0) return 'さあ、はじめよう！';
  if (progress <= 0.2) return 'いいスタート！この調子で！';
  if (progress <= 0.4) return '順調です！もう少し続けて！';
  if (progress === 0.5) return '折り返し地点！あと半分！';
  if (progress <= 0.7) return 'もう少し！ゴールが見えてきた！';
  if (progress <= 0.9) return 'あと少し！最後まで頑張ろう！';
  return 'ラストスパート！🔥';
}

export function QuizPage() {
  const [step, setStep] = useState<Step>('gate');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [gateError, setGateError] = useState('');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [doneData, setDoneData] = useState<DoneData | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);

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

        const abilities = ['strength', 'endurance', 'speed', 'flexibility', 'coordination'] as const;
        const lowestAbility = abilities.reduce((a, b) => abilityScores[a] <= abilityScores[b] ? a : b);
        setDoneData({
          wildTypeName: wildType.name,
          lowestAbilityLabel: ABILITY_LABELS[lowestAbility],
        });
        setStep('done');

        // 以下は結果表示を妨げない（non-blocking）が、失敗は必ずコンソールに残す
        try {
          const { error } = await supabase.from('quiz_results').insert([{
            animal_type: wildType.id,
            scores: abilityScores,
          }]);
          if (error) console.error('[quiz] quiz_results insert failed:', error.message);
        } catch (e) { console.error('[quiz] quiz_results insert failed:', e); }
        try {
          const { error } = await supabase.from('quiz_leads').insert([{
            name: userName,
            email: userEmail,
            wild_type: wildType.name,
            scores: abilityScores,
          }]);
          if (error) console.error('[quiz] quiz_leads insert failed:', error.message);
        } catch (e) { console.error('[quiz] quiz_leads insert failed:', e); }
        try {
          const { data, error } = await supabase.functions.invoke('send-quiz-result-email', {
            body: {
              name: userName,
              email: userEmail,
              wildType: wildType.name,
              scores: abilityScores,
              lesson: wildType.lesson,
            },
          });
          if (error) console.error('[quiz] result email failed:', error);
          else if (data && data.success === false) console.error('[quiz] result email rejected:', data);
        } catch (e) { console.error('[quiz] result email failed:', e); }
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
    setStep('gate');
    setCurrent(0);
    setAnswers({});
    setSelected(null);
    setIsTransitioning(false);
    setDoneData(null);
  };

  if (step === 'gate') {
    const handleGateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!userName.trim() || !userEmail.trim()) {
        setGateError('お名前とメールアドレスを入力してください');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
        setGateError('正しいメールアドレスを入力してください');
        return;
      }
      setGateError('');
      setStep('quiz');
    };

    return (
      <main className="max-w-lg md:max-w-2xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        <div className="text-center mb-8">
          <p className="text-sm font-medium mb-1" style={{ color: '#2D8F4E' }}>詳細診断 — 約5分</p>
          <h1 className="font-black mb-3" style={{ color: '#1C2A1E', fontSize: '36px', lineHeight: '1.3' }}>
            60問で詳しく診断する
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#4A6550' }}>
            60問に答えると、22タイプの中からあなたの野生タイプを<br />
            詳しく診断します。結果はメールでお送りします。
          </p>
        </div>

        <form
          onSubmit={handleGateSubmit}
          className="p-6 rounded-2xl border"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
        >
          <div className="mb-4">
            <label className="block text-sm font-bold mb-1" style={{ color: '#1C2A1E' }}>
              お名前 <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="山田 太郎"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
              style={{ borderColor: '#E2E8E4', color: '#1C2A1E' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#2D8F4E')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8E4')}
            />
          </div>
          <div className="mb-5">
            <label className="block text-sm font-bold mb-1" style={{ color: '#1C2A1E' }}>
              メールアドレス <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={e => setUserEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
              style={{ borderColor: '#E2E8E4', color: '#1C2A1E' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#2D8F4E')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8E4')}
            />
          </div>
          {gateError && (
            <p className="text-sm mb-4" style={{ color: '#EF4444' }}>{gateError}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-full font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#2D8F4E' }}
          >
            診断をはじめる →
          </button>
          <p className="text-sm text-center mt-3" style={{ color: '#A8D5A2' }}>
            入力いただいた情報は診断結果の送付にのみ使用します。
          </p>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#4A6550' }}>
          まず1分で試したい方は{' '}
          <a href="/quiz/quick" style={{ color: '#2D8F4E', fontWeight: 700 }}>
            10問の簡易診断 →
          </a>
        </p>
      </main>
    );
  }

  if (step === 'done') {
    const shareText = `wildflow の野生タイプ詳細診断を受けました🐉\n結果はメールで届きます。あなたも診断してみて！\n#wildflow #身体のMBTI\n${SITE_URL}/quiz`;

    const handleCopy = () => {
      navigator.clipboard.writeText(`${SITE_URL}/quiz`);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    };

    return (
      <main className="max-w-lg md:max-w-2xl mx-auto px-4 md:px-8 lg:px-12 py-16 text-center">
        <p className="text-5xl mb-6">📬</p>
        <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: '#2D8F4E' }}>
          診断完了
        </p>
        <h1 className="text-2xl font-black mb-6" style={{ color: '#1C2A1E' }}>
          診断結果をメールでお送りしました！
        </h1>

        {/* 結果プレビュー */}
        {doneData && (
          <div
            className="p-5 rounded-2xl mb-6 text-left"
            style={{ backgroundColor: '#EDF7EE', borderLeft: '4px solid #2D8F4E' }}
          >
            <p className="text-sm font-bold mb-2" style={{ color: '#2D8F4E' }}>診断結果のヒント</p>
            <p className="text-sm" style={{ color: '#1C2A1E' }}>
              あなたは <strong>{doneData.lowestAbilityLabel}が伸びしろ</strong> のタイプです。
            </p>
            <p className="text-sm mt-2" style={{ color: '#4A6550' }}>
              詳しい野生タイプと5軸スコアはメールでご確認ください 📧
            </p>
          </div>
        )}

        <div
          className="p-6 rounded-2xl border mb-6 text-left"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
        >
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#1C2A1E' }}>
            <span className="font-bold">{userName}</span> さんの診断結果を{' '}
            <span className="font-bold">{userEmail}</span> に送りました。
          </p>
          <p className="text-sm" style={{ color: '#4A6550' }}>
            数分以内に届かない場合は迷惑メールフォルダをご確認ください。
          </p>
          <p className="text-sm mt-3" style={{ color: '#4A6550' }}>
            ご不明な点は{' '}
            <a href="mailto:info@kawabado.com" style={{ color: '#2D8F4E', fontWeight: 700 }}>
              info@kawabado.com
            </a>{' '}
            までご連絡ください。
          </p>
        </div>

        {/* シェアボタン */}
        <div
          className="p-5 rounded-2xl border mb-6"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
        >
          <p className="text-sm font-bold mb-3" style={{ color: '#1C2A1E' }}>📣 友達にシェアする</p>
          <div className="flex flex-col gap-3">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#000000' }}
            >
              𝕏 でシェアする
            </a>
            <a
              href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(`${SITE_URL}/quiz`)}&text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#06C755' }}
            >
              LINE でシェアする
            </a>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm border-2 transition-opacity hover:opacity-80"
              style={{ borderColor: '#E2E8E4', color: '#1C2A1E', backgroundColor: '#F8F7F2' }}
            >
              {urlCopied ? '✅ コピーしました！' : '🔗 URLをコピー（XHS・lemon8用）'}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/lessons"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#2D8F4E' }}
          >
            🏃 レッスンを見る
          </a>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold border-2 transition-opacity hover:opacity-70"
            style={{ borderColor: '#2D8F4E', color: '#2D8F4E', backgroundColor: 'transparent' }}
          >
            🔄 もう一度診断する
          </button>
        </div>
      </main>
    );
  }

  const q = questions[current];

  return (
    <main className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-12">
      <div className="text-center mb-8">
        <p className="text-sm font-medium mb-1" style={{ color: '#2D8F4E' }}>野生タイプ診断</p>
        <h1 className="font-black" style={{ color: '#1C2A1E', fontSize: '32px', lineHeight: '1.3' }}>あなたの野生タイプを診断する</h1>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center text-sm mb-2" style={{ color: '#4A6550' }}>
          <span>質問 {current + 1} / {questions.length}</span>
          {current > 0 && (
            <button
              onClick={handlePrev}
              disabled={selected !== null}
              className="text-sm transition-colors disabled:opacity-30 flex items-center gap-1"
              style={{ color: '#4A6550' }}
            >
              ← 前の質問へ
            </button>
          )}
        </div>
        <div className="rounded-full overflow-hidden" style={{ backgroundColor: '#E2E8E4', height: '8px' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${((current + 1) / questions.length) * 100}%`, backgroundColor: '#2D8F4E' }}
          />
        </div>
        {/* 励ましメッセージ */}
        <p className="text-sm text-center mt-2 font-medium" style={{ color: '#2D8F4E' }}>
          {getEncouragementMessage(current, questions.length)}
        </p>
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
