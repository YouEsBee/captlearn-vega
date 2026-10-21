import {parseCaptions} from '../../src/captions/captions';

describe("reading a video's captions from the backend", () => {
  it('takes its lines in the order they are spoken', () => {
    const later = {start: 3, end: 6.5, text: '我喜欢学习中文。', native: 'I like learning Chinese.'};
    const first = {start: 0, end: 3, text: '你好！', native: 'Hello!'};
    expect(parseCaptions([later, first])).toEqual([first, later]);
  });

  it('drops lines a hand fix has broken, keeping the rest', () => {
    const good = {start: 0, end: 3, text: '你好！', native: 'Hello!'};
    const broken = [
      {start: '0:04', end: 6, text: '今天', native: 'Today'},
      {start: 7, end: 7, text: '天气', native: 'Weather'},
      {start: 8, end: 9, text: '', native: 'Nothing'},
      {start: 9, end: 10, text: '很好', native: 42},
      null,
    ];
    expect(parseCaptions([good, ...broken])).toEqual([good]);
  });

  it('is empty when the response is not a list', () => {
    expect(parseCaptions({error: 'not found'})).toEqual([]);
  });
});
