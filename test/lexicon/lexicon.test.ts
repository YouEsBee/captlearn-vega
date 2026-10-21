import {mergeLexicons, parseLexicon} from '../../src/lexicon/lexicon';
import {LexiconEntry} from '../../src/learning/types';

function zh(word: string, gloss: string, level = 1): LexiconEntry {
  return {id: `zh-${word}`, lang: 'zh', word, gloss, pinyin: 'pīnyīn', level};
}

describe("reading a video's lexicon from the backend", () => {
  it('takes the entries of the lexicon file', () => {
    const file = {licence: 'CC BY-SA 4.0', credit: 'CC-CEDICT', entries: [zh('火锅', 'hotpot', 4)]};
    expect(parseLexicon(file)).toEqual([zh('火锅', 'hotpot', 4)]);
  });

  it('drops entries a hand edit has broken, keeping the rest', () => {
    const broken = [{id: 'zh-吃', word: '吃', level: 1}, {...zh('人', 'person'), level: 'one'}, null];
    expect(parseLexicon({entries: [zh('火锅', 'hotpot', 4), ...broken]})).toEqual([
      zh('火锅', 'hotpot', 4),
    ]);
  });

  it('is empty when the response is not a lexicon file', () => {
    expect(parseLexicon({error: 'no captions yet'})).toEqual([]);
    expect(parseLexicon(null)).toEqual([]);
  });
});

describe('the words the learner can be quizzed on', () => {
  it("are every video's words, each word once, in catalogue order", () => {
    const first = [zh('我们', 'we'), zh('火锅', 'hotpot', 4)];
    const second = [zh('火锅', 'hot pot', 4), zh('夜市', 'night market', 5)];
    expect(mergeLexicons([first, second])).toEqual([
      zh('我们', 'we'),
      zh('火锅', 'hotpot', 4),
      zh('夜市', 'night market', 5),
    ]);
  });
});
