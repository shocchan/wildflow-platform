import type { QuickQuestion } from '../data/quickQuizQuestions';

type Ability = 'strength' | 'endurance' | 'speed' | 'flexibility' | 'coordination';
type Answers = Record<string, number>;

export interface QuickResult {
  lowestAbility: Ability;
  secondLowest: Ability;
  scores: Record<Ability, number>;
}

export const ABILITY_LABELS: Record<Ability, string> = {
  strength: '筋力',
  endurance: '持久力',
  speed: 'スピード',
  flexibility: '柔軟性',
  coordination: '調整力',
};

export const ABILITY_TO_ANIMALS: Record<Ability, string[]> = {
  strength:     ['🐺 オオカミ型', '🐆 チーター型', '🐍 アナコンダ型', '🐬 イルカ型'],
  endurance:    ['🦏 サイ型', '🐇 ウサギ型', '🐆 ヒョウ型', '🦜 オウム型'],
  speed:        ['🐘 ゾウ型', '🐋 クジラ型', '🐟 マンタ型', '🦦 カワウソ型'],
  flexibility:  ['🦁 ライオン型', '🦅 ワシ型', '🦅 ハヤブサ型', '🦊 キツネ型'],
  coordination: ['🐂 バッファロー型', '🦬 バイソン型', '🐻 クマ型', '🐙 タコ型'],
};

export const ABILITY_LESSON: Record<Ability, string> = {
  strength:     '💪 筋力レッスン BEAST — コアと肩甲骨の安定性を高める1時間',
  endurance:    '🫁 持久力レッスン CRAB FLOW — 全身持久力を底上げするサーキット',
  speed:        '⚡ スピードレッスン KICKTHROUGH — 瞬発力と反応速度を鍛える',
  flexibility:  '🌿 柔軟性レッスン SCORPION — 可動域を広げる全身ストレッチ',
  coordination: '🎯 調整力レッスン APE — 身体の連動性を高めるムーブメント',
};

export function calcQuickResult(
  answers: Answers,
  questions: QuickQuestion[]
): QuickResult {
  const raw: Record<Ability, number[]> = {
    strength: [], endurance: [], speed: [], flexibility: [], coordination: [],
  };

  questions.forEach(q => {
    const val = answers[q.id] ?? 2;
    const score = q.reversed ? (5 - val) : val;
    raw[q.ability].push(score);
  });

  const scores = {} as Record<Ability, number>;
  (Object.keys(raw) as Ability[]).forEach(ab => {
    const sum = raw[ab].reduce((a, b) => a + b, 0);
    scores[ab] = Math.round((sum / (raw[ab].length * 4)) * 100);
  });

  const sorted = (Object.keys(scores) as Ability[]).sort(
    (a, b) => scores[a] - scores[b]
  );

  return {
    lowestAbility: sorted[0],
    secondLowest: sorted[1],
    scores,
  };
}
