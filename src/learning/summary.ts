import {AnswerOutcome, MasteryMap, isLearnt} from './mastery';

/** One answered quiz question. */
export interface QuizAnswer {
  wordId: string;
  outcome: AnswerOutcome;
}

export interface LessonSummary {
  newlyLearnt: string[];
  kept: string[];
  lapsed: string[];
  /** How many of the video's words are still glossed (not learnt). */
  stillGlossed: number;
}

/** What the quiz changed, plus how many of the video's words are still glossed. */
export function lessonSummary(
  answers: QuizAnswer[],
  videoWordIds: string[],
  mastery: MasteryMap,
): LessonSummary {
  const group = (outcome: AnswerOutcome) =>
    answers.filter(a => a.outcome === outcome).map(a => a.wordId);
  return {
    newlyLearnt: group('newlyLearnt'),
    kept: group('kept'),
    lapsed: group('lapsed'),
    stillGlossed: videoWordIds.filter(id => !isLearnt(mastery, id)).length,
  };
}
