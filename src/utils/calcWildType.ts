import type { Ability, Question } from '../data/quizQuestions';
import type { WildType, WildTypeName } from '../data/wildTypes';
import { wildTypes } from '../data/wildTypes';

type Answers = Record<string, number>;

export interface AbilityScores {
  strength: number;
  endurance: number;
  speed: number;
  flexibility: number;
  coordination: number;
}

export function calcAbilityScores(answers: Answers, questions: Question[]): AbilityScores {
  const scores: AbilityScores = { strength: 0, endurance: 0, speed: 0, flexibility: 0, coordination: 0 };
  const counts: AbilityScores = { strength: 0, endurance: 0, speed: 0, flexibility: 0, coordination: 0 };

  questions.forEach(q => {
    const raw = answers[q.id] ?? 3;
    const value = q.reversed ? (6 - raw) : raw;
    scores[q.ability] += value;
    counts[q.ability]++;
  });

  const abilities: Ability[] = ['strength', 'endurance', 'speed', 'flexibility', 'coordination'];
  abilities.forEach(ab => {
    scores[ab] = Math.round((scores[ab] / (counts[ab] * 5)) * 100);
  });

  return scores;
}

export function determineWildType(scores: AbilityScores): WildType {
  const abilities: Ability[] = ['strength', 'endurance', 'speed', 'flexibility', 'coordination'];

  const maxScore = Math.max(...abilities.map(a => scores[a]));
  const minScore = Math.min(...abilities.map(a => scores[a]));
  const diff = maxScore - minScore;
  const avgScore = abilities.reduce((sum, a) => sum + scores[a], 0) / abilities.length;

  if (avgScore >= 65 && diff < 20) {
    return wildTypes.find(t => t.id === 'dragon')!;
  }

  if (diff < 20) {
    return wildTypes.find(t => t.id === 'dragon_egg')!;
  }

  const highAbility = abilities.reduce((a, b) => scores[a] >= scores[b] ? a : b);
  const lowAbility = abilities.reduce((a, b) => scores[a] <= scores[b] ? a : b);

  const abilityToTypeId: Record<string, Record<string, WildTypeName>> = {
    strength:     { endurance: 'rhino', speed: 'elephant', flexibility: 'lion', coordination: 'buffalo' },
    endurance:    { strength: 'wolf', speed: 'whale', flexibility: 'eagle', coordination: 'bison' },
    speed:        { strength: 'cheetah', endurance: 'rabbit', flexibility: 'falcon', coordination: 'bear' },
    flexibility:  { strength: 'anaconda', endurance: 'leopard', speed: 'manta', coordination: 'octopus' },
    coordination: { strength: 'dolphin', endurance: 'parrot', speed: 'otter', flexibility: 'fox' },
  };

  const typeId = abilityToTypeId[highAbility]?.[lowAbility];
  return wildTypes.find(t => t.id === typeId) ?? wildTypes.find(t => t.id === 'dragon_egg')!;
}
