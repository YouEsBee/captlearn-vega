import {applyGlosses, indexLexicon, tokenize} from '../../src/learning/substitute';
import {MasteryMap, recordAnswer} from '../../src/learning/mastery';
import {LexiconEntry} from '../../src/learning/types';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 1);

const lexicon: LexiconEntry[] = [
  {id: 'zh-ni', lang: 'zh', word: '你', gloss: 'you', level: 1},
  {id: 'zh-hao', lang: 'zh', word: '好', gloss: 'good', level: 1},
];
const index = indexLexicon(lexicon);
const byId = new Map(lexicon.map(e => [e.id, e]));

function glosses(mastery: MasteryMap) {
  return applyGlosses(tokenize('你好', 'zh', index), byId, mastery).map(s => s.gloss);
}

describe('glossing while watching', () => {
  it('glosses every word that is not learnt', () => {
    expect(glosses({})).toEqual(['you', 'good']);
  });

  it('drops the gloss of a learnt word, since its English is blanked', () => {
    expect(glosses(recordAnswer({}, 'zh-ni', true, NOW))).toEqual([undefined, 'good']);
  });

  it('keeps an overdue word blanked until a quiz answer says otherwise', () => {
    // Learnt long ago and never reviewed: still learnt.
    const overdue = recordAnswer({}, 'zh-ni', true, NOW - 100 * DAY);
    expect(glosses(overdue)).toEqual([undefined, 'good']);
  });

  it('glosses a lapsed word again', () => {
    const learnt = recordAnswer({}, 'zh-ni', true, NOW);
    const lapsed = recordAnswer(learnt, 'zh-ni', false, NOW + DAY);
    expect(glosses(lapsed)).toEqual(['you', 'good']);
  });
});
