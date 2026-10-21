import {parseState, serializeState} from '../../src/users/userStore';
import {recordAnswer} from '../../src/learning/mastery';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const NOW = Date.UTC(2026, 0, 1);

describe('stored app state', () => {
  it('starts empty when nothing is stored', () => {
    expect(parseState(null)).toEqual({users: [], currentUserId: null});
  });

  it('resets progress saved by the old score-based version, keeping the profiles', () => {
    const old = JSON.stringify({
      users: [
        {
          id: 'user-1',
          nickname: 'Ana',
          targetLang: 'zh',
          mastery: {'zh-ni': {wordId: 'zh-ni', score: 0.7, seen: 3, correct: 1}},
        },
      ],
      currentUserId: 'user-1',
    });
    expect(parseState(old)).toEqual({
      users: [{id: 'user-1', nickname: 'Ana', targetLang: 'zh', mastery: {}}],
      currentUserId: 'user-1',
    });
  });

  it('keeps progress saved by this version', () => {
    const state = {
      users: [
        {id: 'user-1', nickname: 'Ana', targetLang: 'zh' as const, mastery: recordAnswer({}, 'zh-ni', true, NOW)},
      ],
      currentUserId: 'user-1',
    };
    expect(parseState(serializeState(state))).toEqual(state);
  });
});
