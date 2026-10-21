import {MasteryMap} from '../learning/mastery';
import {Settings} from '../learning/types';

/** Minimal key-value interface so the storage backend can be swapped later. */
export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

/** In-memory fallback. Data is lost when the app closes. */
export const memoryStore: KeyValueStore = (() => {
  const data = new Map<string, string>();
  return {
    get: key => data.get(key) ?? null,
    set: (key, value) => {
      data.set(key, value);
    },
  };
})();

const MASTERY_KEY = 'captlearn.mastery';
const SETTINGS_KEY = 'captlearn.settings';

export const defaultSettings: Settings = {
  nativeLang: 'en',
  targetLang: 'zh',
};

/** Every read and write is guarded: a failed store must never crash playback. */
export function loadMastery(store: KeyValueStore): MasteryMap {
  try {
    const raw = store.get(MASTERY_KEY);
    return raw ? (JSON.parse(raw) as MasteryMap) : {};
  } catch {
    return {};
  }
}

export function saveMastery(store: KeyValueStore, map: MasteryMap): void {
  try {
    store.set(MASTERY_KEY, JSON.stringify(map));
  } catch {
    // Ignore: progress is simply not persisted this time.
  }
}

export function loadSettings(store: KeyValueStore): Settings {
  try {
    const raw = store.get(SETTINGS_KEY);
    return raw ? {...defaultSettings, ...JSON.parse(raw)} : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(store: KeyValueStore, settings: Settings): void {
  try {
    store.set(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore.
  }
}
