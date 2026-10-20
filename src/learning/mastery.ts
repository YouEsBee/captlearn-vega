import {Mastery} from './types';

const GAIN_ON_CORRECT = 0.15;
const LOSS_ON_WRONG = 0.2;

/** Score at which a word counts as learnt: it is shown as a blank in the video. */
export const LEARNT_THRESHOLD = 0.7;

export type MasteryMap = Record<string, Mastery>;

export function getScore(map: MasteryMap, wordId: string): number {
  return map[wordId]?.score ?? 0;
}

/** Returns a new map with one answer recorded for a word. Pure: does not mutate. */
export function recordAnswer(
  map: MasteryMap,
  wordId: string,
  correct: boolean,
): MasteryMap {
  const prev = map[wordId] ?? {wordId, score: 0, seen: 0, correct: 0};
  const score = correct
    ? Math.min(1, prev.score + GAIN_ON_CORRECT)
    : Math.max(0, prev.score - LOSS_ON_WRONG);
  return {
    ...map,
    [wordId]: {
      wordId,
      score,
      seen: prev.seen + 1,
      correct: prev.correct + (correct ? 1 : 0),
    },
  };
}

/** Marks a word as learnt (score at least LEARNT_THRESHOLD). Pure: does not mutate. */
export function markLearnt(map: MasteryMap, wordId: string): MasteryMap {
  const prev = map[wordId] ?? {wordId, score: 0, seen: 0, correct: 0};
  return {
    ...map,
    [wordId]: {...prev, wordId, score: Math.max(prev.score, LEARNT_THRESHOLD)},
  };
}

/** Records that a word appeared on screen, without changing its score. */
export function recordExposure(map: MasteryMap, wordId: string): MasteryMap {
  const prev = map[wordId] ?? {wordId, score: 0, seen: 0, correct: 0};
  return {...map, [wordId]: {...prev, seen: prev.seen + 1}};
}
