import {catalogueRows, formatLength, newWordCount, nextVideo} from '../../src/catalogue/catalogue';
import {recordAnswer} from '../../src/learning/mastery';
import {Video} from '../../src/catalogue/types';

function video(id: string, level: number): Video {
  return {id, title: id, lengthSeconds: 90, level, credit: 'VOA'};
}

describe('home screen rows', () => {
  it('puts videos in one row per HSK level, lowest level first, keeping the suggested order', () => {
    const rows = catalogueRows([video('a', 2), video('b', 1), video('c', 2), video('d', 1)]);
    expect(rows.map(r => r.level)).toEqual([1, 2]);
    expect(rows.map(r => r.videos.map(v => v.id))).toEqual([
      ['b', 'd'],
      ['a', 'c'],
    ]);
  });
});

describe('the next video', () => {
  const videos = [video('a', 2), video('b', 1), video('c', 1)];

  it('is the first unwatched video in suggested order, whatever its row', () => {
    expect(nextVideo(videos, ['a'])?.id).toBe('b');
    expect(nextVideo(videos, ['b'])?.id).toBe('a');
  });

  it('is none once every video is watched', () => {
    expect(nextVideo(videos, ['c', 'b', 'a'])).toBeUndefined();
  });
});

describe('new words on a video card', () => {
  const NOW = Date.UTC(2026, 0, 1);

  it("counts the video's words the learner has never answered correctly", () => {
    let mastery = recordAnswer({}, 'zh-一', true, NOW); // learnt
    mastery = recordAnswer(mastery, 'zh-二', true, NOW);
    mastery = recordAnswer(mastery, 'zh-二', false, NOW); // lapsed, so not new
    mastery = recordAnswer(mastery, 'zh-三', false, NOW); // answered wrong, still new
    expect(newWordCount(['zh-一', 'zh-二', 'zh-三', 'zh-四'], mastery)).toBe(2);
  });
});

describe('video length on a card', () => {
  it('reads as minutes and seconds', () => {
    expect(formatLength(65)).toBe('1:05');
    expect(formatLength(180)).toBe('3:00');
    expect(formatLength(42.6)).toBe('0:43');
  });
});
