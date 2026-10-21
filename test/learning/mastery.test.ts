import {answerOutcome, isDue, isLearnt, recordAnswer} from '../../src/learning/mastery';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 1);

describe('learnt', () => {
  it('a new word is not learnt', () => {
    expect(isLearnt({}, 'zh-ni')).toBe(false);
  });

  it('a correct answer on a new word makes it learnt', () => {
    const map = recordAnswer({}, 'zh-ni', true, NOW);
    expect(isLearnt(map, 'zh-ni')).toBe(true);
  });
});

describe('due', () => {
  it('a new word is never due', () => {
    expect(isDue({}, 'zh-ni', NOW + 100 * DAY)).toBe(false);
  });

  it('a newly learnt word is due about a day later', () => {
    const map = recordAnswer({}, 'zh-ni', true, NOW);
    expect(isDue(map, 'zh-ni', NOW + DAY - 1)).toBe(false);
    expect(isDue(map, 'zh-ni', NOW + DAY)).toBe(true);
  });
});

/** Answers a word correctly each time it falls due, `times` times, starting at NOW. */
function learnAndReview(times: number) {
  let map = recordAnswer({}, 'zh-ni', true, NOW);
  let now = NOW;
  for (let i = 1; i < times; i++) {
    now = map['zh-ni'].due;
    map = recordAnswer(map, 'zh-ni', true, now);
  }
  return {map, now};
}

describe('review gaps', () => {
  it('each correct review moves the word up a box with a longer gap: 1, 3, 7, 14, 30 days', () => {
    const gaps = [1, 2, 3, 4, 5].map(times => {
      const {map, now} = learnAndReview(times);
      return (map['zh-ni'].due - now) / DAY;
    });
    expect(gaps).toEqual([1, 3, 7, 14, 30]);
  });

  it('the top box stays at its gap', () => {
    const {map, now} = learnAndReview(8);
    expect((map['zh-ni'].due - now) / DAY).toBe(30);
    expect(isLearnt(map, 'zh-ni')).toBe(true);
  });
});

describe('wrong answers', () => {
  it('a wrong answer on a new word leaves it new and unscheduled', () => {
    const map = recordAnswer({}, 'zh-ni', false, NOW);
    expect(isLearnt(map, 'zh-ni')).toBe(false);
    expect(isDue(map, 'zh-ni', NOW + 100 * DAY)).toBe(false);
  });

  it('a wrong answer on a due word is a lapse: no longer learnt, due again a day later', () => {
    const {map: learnt, now} = learnAndReview(4);
    const due = learnt['zh-ni'].due;
    const lapsed = recordAnswer(learnt, 'zh-ni', false, due);
    expect(now).toBeLessThan(due);
    expect(isLearnt(lapsed, 'zh-ni')).toBe(false);
    expect(isDue(lapsed, 'zh-ni', due + DAY - 1)).toBe(false);
    expect(isDue(lapsed, 'zh-ni', due + DAY)).toBe(true);
  });

  it('a lapsed word is learnt again after a correct answer', () => {
    const {map: learnt} = learnAndReview(3);
    const due = learnt['zh-ni'].due;
    const lapsed = recordAnswer(learnt, 'zh-ni', false, due);
    const relearnt = recordAnswer(lapsed, 'zh-ni', true, due + DAY);
    expect(isLearnt(relearnt, 'zh-ni')).toBe(true);
  });
});

describe('answer outcome', () => {
  const learnt = recordAnswer({}, 'zh-ni', true, NOW);
  const lapsed = recordAnswer(learnt, 'zh-ni', false, NOW + DAY);

  it('a correct answer on a new word is newly learnt', () => {
    expect(answerOutcome({}, 'zh-ni', true)).toBe('newlyLearnt');
  });

  it('a correct answer on a learnt word is reviewed and kept', () => {
    expect(answerOutcome(learnt, 'zh-ni', true)).toBe('kept');
  });

  it('a wrong answer on a learnt word is a lapse', () => {
    expect(answerOutcome(learnt, 'zh-ni', false)).toBe('lapsed');
  });

  it('a correct answer on a lapsed word is newly learnt again', () => {
    expect(answerOutcome(lapsed, 'zh-ni', true)).toBe('newlyLearnt');
  });

  it('a wrong answer on a lapsed due word is another lapse', () => {
    expect(answerOutcome(lapsed, 'zh-ni', false)).toBe('lapsed');
  });

  it('a wrong answer on a new word is missed, and changes no group', () => {
    expect(answerOutcome({}, 'zh-ni', false)).toBe('missed');
  });
});
