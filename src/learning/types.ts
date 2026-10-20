export type Lang = 'en' | 'zh';

export interface Settings {
  nativeLang: Lang; // language the learner already knows (glosses use this)
  targetLang: Lang; // language of the captions being learned
  glossThreshold: number; // words with mastery below this get a gloss; at or above, their English is blanked
}

export interface Cue {
  start: number; // seconds
  end: number; // seconds
  text: string; // caption text in targetLang
  native?: string; // translation shown on the top line
}

export interface LexiconEntry {
  id: string;
  lang: Lang; // language of `word`
  word: string;
  gloss: string; // meaning in the native language
  pinyin?: string; // Chinese only
  level: number; // 1 = easiest
}

export interface Mastery {
  wordId: string;
  score: number; // 0..1
  seen: number;
  correct: number;
}

/** One piece of a caption line after substitution. */
export interface Segment {
  text: string;
  wordId?: string; // set when the segment is a known lexicon word
  gloss?: string; // shown next to the word when the learner is not yet fluent
  pinyin?: string; // shown for every Chinese segment
}

/** One piece of the English line. A learnt word has `zh`: shown as underscores with the Chinese beneath. */
export interface NativeSegment {
  text: string;
  zh?: string;
}
