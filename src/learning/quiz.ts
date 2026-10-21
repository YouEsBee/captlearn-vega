import {LexiconEntry, Lang} from './types';
import {MasteryMap, dueWordIds, isNew} from './mastery';
import {indexLexicon, wordCountsInCues} from './substitute';

const MAX_NEW = 8;
const MAX_DUE = 5;
const WRONG_OPTIONS = 3;
/** Wrong options come from words within this many HSK levels of the answer. */
const NEARBY_LEVELS = 1;

export interface Question {
  entry: LexiconEntry;
  choices: string[];
}

interface QuizInput {
  /** Every word the learner can be quizzed on, including words from earlier videos. */
  lexicon: LexiconEntry[];
  /** The caption cues of the video about to be watched. */
  cues: {text: string}[];
  targetLang: Lang;
  mastery: MasteryMap;
  now: number;
  /** Source of randomness for picking and ordering options. Defaults to Math.random. */
  random?: () => number;
}

/** A shuffled copy (Fisher-Yates). */
function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Three wrong options at random from words at the same or a nearby HSK level,
 * topped up from the whole lexicon when too few are nearby.
 */
function wrongOptions(entry: LexiconEntry, pool: LexiconEntry[], random: () => number): string[] {
  const glosses = (entries: LexiconEntry[]) =>
    shuffle([...new Set(entries.map(e => e.gloss))], random).filter(g => g !== entry.gloss);
  const nearby = glosses(pool.filter(e => Math.abs(e.level - entry.level) <= NEARBY_LEVELS));
  const rest = glosses(pool).filter(g => !nearby.includes(g));
  return [...nearby, ...rest].slice(0, WRONG_OPTIONS);
}

/**
 * The questions before a video: up to 8 of its new words, most frequent first,
 * then lowest HSK level, followed by up to 5 due words from earlier videos, oldest due first.
 */
export function buildQuiz({
  lexicon,
  cues,
  targetLang,
  mastery,
  now,
  random = Math.random,
}: QuizInput): Question[] {
  const pool = lexicon.filter(e => e.lang === targetLang);
  const counts = wordCountsInCues(cues, indexLexicon(pool), targetLang);
  const count = (e: LexiconEntry) => counts.get(e.id) ?? 0;
  const newWords = pool
    .filter(e => count(e) > 0 && isNew(mastery, e.id))
    .sort((a, b) => count(b) - count(a) || a.level - b.level)
    .slice(0, MAX_NEW);
  const byId = new Map(pool.map(e => [e.id, e]));
  const dueWords = dueWordIds(mastery, now)
    .map(id => byId.get(id))
    .filter((e): e is LexiconEntry => !!e)
    .slice(0, MAX_DUE);
  return [...newWords, ...dueWords].map(entry => ({
    entry,
    choices: shuffle([entry.gloss, ...wrongOptions(entry, pool, random)], random),
  }));
}
