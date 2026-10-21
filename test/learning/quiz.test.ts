import {buildQuiz} from '../../src/learning/quiz';
import {MasteryMap, recordAnswer} from '../../src/learning/mastery';
import {LexiconEntry} from '../../src/learning/types';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 1);

function zh(word: string, gloss: string, level: number): LexiconEntry {
  return {id: `zh-${word}`, lang: 'zh', word, gloss, level};
}

const lexicon: LexiconEntry[] = [
  zh('一', 'one', 1),
  zh('二', 'two', 1),
  zh('三', 'three', 2),
  zh('四', 'four', 3),
  zh('五', 'five', 1),
  zh('六', 'six', 2),
  zh('七', 'seven', 3),
  zh('八', 'eight', 1),
  zh('九', 'nine', 2),
  zh('十', 'ten', 3),
];

function quiz(cues: string[], mastery: MasteryMap = {}, now = NOW) {
  return buildQuiz({
    lexicon,
    cues: cues.map(text => ({text})),
    targetLang: 'zh',
    mastery,
    now,
  });
}

const words = (questions: {entry: LexiconEntry}[]) => questions.map(q => q.entry.word);

describe('new words in the quiz', () => {
  it('asks the most frequent new words in the video first, then the lowest HSK level', () => {
    // 四 three times; 三 and 二 twice (二 is level 1); 一 once.
    expect(words(quiz(['四三二一', '四三二', '四']))).toEqual(['四', '二', '三', '一']);
  });

  it('asks at most 8 new words', () => {
    expect(quiz(['一二三四五六七八九十'])).toHaveLength(8);
  });

  it('skips words that are not new', () => {
    const mastery = recordAnswer({}, 'zh-一', true, NOW);
    expect(words(quiz(['一二'], mastery))).toEqual(['二']);
  });

  it('is empty when the video has nothing to quiz', () => {
    expect(quiz(['你好'])).toEqual([]);
  });
});

describe('due words in the quiz', () => {
  /** Learns each word one day apart, so earlier words fall due first. */
  function learnInOrder(ids: string[]): MasteryMap {
    return ids.reduce((map, id, i) => recordAnswer(map, `zh-${id}`, true, NOW + i * DAY), {});
  }

  it('adds due words from earlier videos after the new words, oldest due first', () => {
    const mastery = learnInOrder(['九', '八']);
    expect(words(quiz(['一'], mastery, NOW + 10 * DAY))).toEqual(['一', '九', '八']);
  });

  it('adds at most 5 due words', () => {
    const mastery = learnInOrder(['二', '三', '四', '五', '六', '七', '八']);
    expect(words(quiz([], mastery, NOW + 10 * DAY))).toEqual(['二', '三', '四', '五', '六']);
  });

  it('leaves out learnt words that are not yet due', () => {
    const mastery = learnInOrder(['九', '八']);
    expect(words(quiz(['一'], mastery, NOW + DAY))).toEqual(['一', '九']);
  });
});

describe('wrong options', () => {
  /** A small seeded generator, so each run picks differently but repeatably. */
  function seeded(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
  }

  function optionsFor(word: string, seed: number, entries = lexicon) {
    const [question] = buildQuiz({
      lexicon: entries,
      cues: [{text: word}],
      targetLang: 'zh',
      mastery: {},
      now: NOW,
      random: seeded(seed),
    });
    return question.choices;
  }

  it('offers the answer and three wrong options', () => {
    const choices = optionsFor('一', 1);
    expect(choices).toHaveLength(4);
    expect(choices).toContain('one');
    expect(new Set(choices).size).toBe(4);
  });

  it('picks wrong options from the same or a nearby HSK level', () => {
    // 一 is level 1, so level 3 words (four, seven, ten) are too far away.
    for (let seed = 1; seed <= 20; seed++) {
      expect(optionsFor('一', seed)).not.toEqual(
        expect.arrayContaining([expect.stringMatching(/^(four|seven|ten)$/)]),
      );
    }
  });

  it('varies the wrong options between quizzes', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      optionsFor('一', seed).forEach(c => seen.add(c));
    }
    // one, plus all five other words at levels 1 and 2.
    expect([...seen].sort()).toEqual(['eight', 'five', 'nine', 'one', 'six', 'three', 'two'].sort());
  });

  it('falls back to the whole lexicon when too few words are nearby', () => {
    const sparse = [zh('一', 'one', 1), zh('二', 'two', 1), zh('五', 'five', 5), zh('六', 'six', 6)];
    expect(optionsFor('一', 1, sparse).sort()).toEqual(['five', 'one', 'six', 'two']);
  });
});
