import {lessonSummary} from '../../src/learning/summary';
import {recordAnswer} from '../../src/learning/mastery';

const NOW = Date.UTC(2026, 0, 1);

describe('lesson summary', () => {
  it("groups the quiz's answers into newly learnt, reviewed and kept, and lapsed", () => {
    const summary = lessonSummary(
      [
        {wordId: 'zh-一', outcome: 'newlyLearnt'},
        {wordId: 'zh-二', outcome: 'missed'},
        {wordId: 'zh-三', outcome: 'kept'},
        {wordId: 'zh-四', outcome: 'lapsed'},
        {wordId: 'zh-五', outcome: 'newlyLearnt'},
      ],
      [],
      {},
    );
    expect(summary.newlyLearnt).toEqual(['zh-一', 'zh-五']);
    expect(summary.kept).toEqual(['zh-三']);
    expect(summary.lapsed).toEqual(['zh-四']);
  });

  it('counts the words in the video that are still glossed', () => {
    const mastery = recordAnswer({}, 'zh-一', true, NOW);
    const summary = lessonSummary([], ['zh-一', 'zh-二', 'zh-三'], mastery);
    expect(summary.stillGlossed).toBe(2);
  });

  it('a skipped quiz has empty groups', () => {
    const summary = lessonSummary([], ['zh-一'], {});
    expect(summary).toEqual({newlyLearnt: [], kept: [], lapsed: [], stillGlossed: 1});
  });
});
