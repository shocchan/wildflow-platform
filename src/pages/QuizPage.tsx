import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { AnimalType, AnimalProfile } from '../types';

const questions = [
  {
    q: '休日の朝、自然に目が覚めるのは何時ごろ？',
    options: [
      { label: '5〜6時（夜明けと同時）', type: 'lion' },
      { label: '7〜8時（すっきり早起き）', type: 'cheetah' },
      { label: '9〜10時（気分次第）', type: 'monkey' },
      { label: '11時以降（ゆっくり起きたい）', type: 'sloth' },
    ],
  },
  {
    q: '運動するなら、どんなスタイルが好き？',
    options: [
      { label: '高強度・長時間・とにかく限界まで', type: 'lion' },
      { label: '短時間・全力スプリント系', type: 'cheetah' },
      { label: 'チームスポーツ・みんなで楽しく', type: 'monkey' },
      { label: 'ヨガ・ストレッチ・のんびり系', type: 'sloth' },
    ],
  },
  {
    q: '食事のこだわりは？',
    options: [
      { label: 'タンパク質最優先・肉が大好き', type: 'lion' },
      { label: '高カロリー・エネルギーチャージ重視', type: 'cheetah' },
      { label: '雑食・なんでもおいしく食べる', type: 'monkey' },
      { label: 'ゆっくり少量・消化重視', type: 'sloth' },
    ],
  },
  {
    q: 'ストレスを感じたとき、どう対処する？',
    options: [
      { label: '激しい運動で発散する', type: 'lion' },
      { label: '走ったり動いたりして切り替える', type: 'cheetah' },
      { label: '友人と話して笑い飛ばす', type: 'monkey' },
      { label: 'とにかく休む・ぼーっとする', type: 'sloth' },
    ],
  },
  {
    q: '自分の体について一番当てはまるのは？',
    options: [
      { label: '持久力が高い・疲れにくい', type: 'lion' },
      { label: '瞬発力がある・反応が速い', type: 'cheetah' },
      { label: '器用・バランス感覚がいい', type: 'monkey' },
      { label: '省エネ体質・疲れやすいが回復も早い', type: 'sloth' },
    ],
  },
];

const profiles: Record<AnimalType, AnimalProfile> = {
  lion: {
    type: 'lion',
    name: 'ライオン型',
    emoji: '🦁',
    title: '王者の持久力',
    description: 'あなたは持久力と精神力を兼ね備えた王者タイプ。圧倒的な存在感と高いスタミナで、長期戦に強い。目標を決めたら最後まで諦めない。',
    traits: ['持久力が高い', '意志が強い', 'リーダー気質', '高強度トレが得意'],
    advice: 'オーバートレーニングに注意。休息を戦略的に入れることで、さらに強くなれる。',
    color: '#f59e0b',
  },
  cheetah: {
    type: 'cheetah',
    name: 'チーター型',
    emoji: '🐆',
    title: '閃光の瞬発力',
    description: '瞬発力と反応速度が武器の俊足タイプ。短時間で最大のパフォーマンスを発揮する。変化への適応力も高く、常に最先端を走る。',
    traits: ['瞬発力が高い', '反応が速い', '短期集中型', 'スプリント系が得意'],
    advice: '長期計画が苦手な傾向あり。ルーティンを少し取り入れると安定感が増す。',
    color: '#f97316',
  },
  monkey: {
    type: 'monkey',
    name: 'サル型',
    emoji: '🐒',
    title: '器用な万能型',
    description: '好奇心旺盛で何でもこなせる万能タイプ。バランス感覚が高く、チームの潤滑油になれる。楽しみながら成長できる天才肌。',
    traits: ['器用', 'バランス感覚がいい', '社交的', 'なんでも楽しめる'],
    advice: '一点特化が弱点になることも。好きな分野を深掘りすることで武器が磨かれる。',
    color: '#22c55e',
  },
  sloth: {
    type: 'sloth',
    name: 'ナマケモノ型',
    emoji: '🦥',
    title: '省エネの達人',
    description: '効率と回復力の天才。エネルギーを無駄に使わず、最小の動きで最大の効果を生む。ゆっくりじっくり、深く考える力がある。',
    traits: ['回復力が高い', '省エネ思考', 'じっくり型', 'ストレス耐性がある'],
    advice: '動き出しが遅れがちな点を意識して。最初の一歩さえ踏み出せば、独自のペースで着実に進める。',
    color: '#a78bfa',
  },
};

type Step = 'quiz' | 'result';

export function QuizPage() {
  const [step, setStep] = useState<Step>('quiz');
  const [current, setCurrent] = useState(0);
  const [scores, setScores] = useState<Record<AnimalType, number>>({ lion: 0, cheetah: 0, monkey: 0, sloth: 0 });
  const [result, setResult] = useState<AnimalType | null>(null);

  const handleAnswer = async (type: AnimalType) => {
    const next = { ...scores, [type]: scores[type] + 1 };
    setScores(next);

    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    } else {
      const winner = (Object.entries(next) as [AnimalType, number][])
        .sort((a, b) => b[1] - a[1])[0][0];
      setResult(winner);
      setStep('result');
      try {
        await supabase.from('quiz_results').insert([{ animal_type: winner }]);
      } catch (_) { /* non-blocking */ }
    }
  };

  const reset = () => {
    setStep('quiz');
    setCurrent(0);
    setScores({ lion: 0, cheetah: 0, monkey: 0, sloth: 0 });
    setResult(null);
  };

  if (step === 'result' && result) {
    const p = profiles[result];
    const tweetText = encodeURIComponent(`私の野生タイプは「${p.emoji} ${p.name}」でした！\n「${p.title}」\n\n#wildflow #野生タイプ診断\nhttps://wildflow.jp/quiz`);
    const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-7xl mb-4">{p.emoji}</p>
        <p className="text-sm font-medium tracking-widest uppercase mb-2" style={{ color: p.color }}>
          あなたの野生タイプは
        </p>
        <h1 className="text-4xl font-black text-white mb-2">{p.name}</h1>
        <p className="text-lg font-bold mb-6" style={{ color: p.color }}>{p.title}</p>

        <div className="p-6 rounded-2xl border mb-6 text-left" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}>
          <p className="text-slate-300 leading-relaxed mb-4">{p.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {p.traits.map(t => (
              <span key={t} className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#1a3a5c', color: '#7dd3fc' }}>
                {t}
              </span>
            ))}
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: '#050a14' }}>
            <p className="text-xs font-bold mb-1" style={{ color: p.color }}>🔑 アドバイス</p>
            <p className="text-sm text-slate-400">{p.advice}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all hover:opacity-80"
            style={{ backgroundColor: '#1d9bf0' }}
          >
            𝕏 結果をシェアする
          </a>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold border transition-all hover:bg-white/5"
            style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
          >
            もう一度診断する
          </button>
        </div>
      </main>
    );
  }

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <p className="text-sm font-medium mb-2" style={{ color: '#3b82f6' }}>野生タイプ診断</p>
        <h1 className="text-2xl font-black text-white">あなたの野生タイプを診断する</h1>
      </div>

      {/* Progress */}
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
        <p className="text-lg font-bold text-white text-center leading-snug">{q.q}</p>
      </div>

      <div className="space-y-3">
        {q.options.map(opt => (
          <button
            key={opt.label}
            onClick={() => handleAnswer(opt.type as AnimalType)}
            className="w-full text-left p-4 rounded-xl border transition-all hover:border-blue-500 hover:bg-blue-500/10"
            style={{ backgroundColor: '#111827', borderColor: '#1e3a5f', color: '#cbd5e1' }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </main>
  );
}
