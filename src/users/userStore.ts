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

/** Every read and write is guarded: a failed store must never crash the app. */
export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    return raw ? {...EMPTY, ...(JSON.parse(raw) as AppState)} : EMPTY;
  } catch {
    return EMPTY;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore: this session's changes are simply not persisted.
  }
}
