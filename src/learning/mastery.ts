import {Mastery} from './types';

export type MasteryMap = Record<string, Mastery>;

const DAY = 24 * 60 * 60 * 1000;

/** Rough review gap for each Leitner box, in days. Tunable after the demo. */
const BOX_GAP_DAYS = [1, 3, 7, 14, 30];

/** A word is learnt when its most recent quiz answer was correct. The one rule for blanking. */
export function isLearnt(map: MasteryMap, wordId: string): boolean {
  return map[wordId]?.learnt ?? false;
}

/** Returns a new map with one quiz answer recorded for a word. Pure: does not mutate. */
export function recordAnswer(
  map: MasteryMap,
  wordId: string,
  correct: boolean,
  now: number,
): MasteryMap {
  const prev = map[wordId];
  if (!correct) {
    // A new word stays new. A learnt or lapsed word lapses: back to box 1, glossed until answered correctly.
    return prev
      ? {...map, [wordId]: {wordId, learnt: false, box: 1, due: now + BOX_GAP_DAYS[0] * DAY}}
      : map;
  }
  const box = prev ? Math.min(prev.box + 1, BOX_GAP_DAYS.length) : 1;
  return {...map, [wordId]: {wordId, learnt: true, box, due: now + BOX_GAP_DAYS[box - 1] * DAY}};
}

/** A word the learner has never answered correctly in a quiz. */
export function isNew(map: MasteryMap, wordId: string): boolean {
  return !map[wordId];
}

/** A learnt or lapsed word whose review gap has passed. New words are never due. */
export function isDue(map: MasteryMap, wordId: string, now: number): boolean {
  const m = map[wordId];
  return !!m && now >= m.due;
}

/** Ids of every due word, oldest due first. */
export function dueWordIds(map: MasteryMap, now: number): string[] {
  return Object.values(map)
    .filter(m => isDue(map, m.wordId, now))
    .sort((a, b) => a.due - b.due)
    .map(m => m.wordId);
}

/** What one quiz answer does to a word: `missed` is a wrong answer on a new word, in no summary group. */
export type AnswerOutcome = 'newlyLearnt' | 'kept' | 'lapsed' | 'missed';

/** The summary group for one quiz answer, worked out from progress before the answer is recorded. */
export function answerOutcome(map: MasteryMap, wordId: string, correct: boolean): AnswerOutcome {
  if (correct) {
    return isLearnt(map, wordId) ? 'kept' : 'newlyLearnt';
  }
  return isNew(map, wordId) ? 'missed' : 'lapsed';
}
