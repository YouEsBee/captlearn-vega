import AsyncStorage from '@react-native-async-storage/async-storage';
import {MasteryMap} from '../learning/mastery';
import {Lang} from '../learning/types';

/** A local learner profile. Each user has their own language and progress. */
export interface User {
  id: string;
  nickname: string;
  targetLang: Lang;
  mastery: MasteryMap;
}

export interface AppState {
  users: User[];
  currentUserId: string | null;
}

const STATE_KEY = 'captlearn.state';
const EMPTY: AppState = {users: [], currentUserId: null};

/**
 * Bumped when the shape of saved progress changes. Older progress is cleared, not migrated:
 * version 2 replaced score-based mastery with the learnt flag and review schedule.
 */
const PROGRESS_VERSION = 2;

interface StoredState extends AppState {
  progressVersion?: number;
}

/** Reads saved state. Progress from an older version is cleared; profiles are kept. */
export function parseState(raw: string | null): AppState {
  if (!raw) {
    return EMPTY;
  }
  const {progressVersion, ...stored} = JSON.parse(raw) as StoredState;
  const state = {...EMPTY, ...stored};
  return progressVersion === PROGRESS_VERSION
    ? state
    : {...state, users: state.users.map(u => ({...u, mastery: {}}))};
}

/** Writes state for storage, tagged with the current progress version. */
export function serializeState(state: AppState): string {
  const stored: StoredState = {...state, progressVersion: PROGRESS_VERSION};
  return JSON.stringify(stored);
}

/** Every read and write is guarded: a failed store must never crash the app. */
export async function loadState(): Promise<AppState> {
  try {
    return parseState(await AsyncStorage.getItem(STATE_KEY));
  } catch {
    return EMPTY;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STATE_KEY, serializeState(state));
  } catch {
    // Ignore: this session's changes are simply not persisted.
  }
}
