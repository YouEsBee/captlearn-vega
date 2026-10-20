import {pinyin} from 'pinyin-pro';
import {LexiconEntry, Lang, NativeSegment, Segment} from './types';
import {MasteryMap, getScore} from './mastery';

const MAX_PHRASE_LENGTH = 4; // Chinese words are up to ~4 characters here
const CHINESE = /[一-鿿]/;

/** Index lexicon entries by target language word for fast lookup. */
export function indexLexicon(entries: LexiconEntry[]): Map<string, LexiconEntry> {
  return new Map(entries.map(e => [`${e.lang}:${e.word.toLowerCase()}`, e]));
}

/** Tone-marked pinyin for any Chinese text, including words missing from the lexicon. */
export function chinesePinyin(text: string): string | undefined {
  if (!CHINESE.test(text)) {
    return undefined;
  }
  return pinyin(text, {toneType: 'mark', separator: ' ', nonZh: 'consecutive'}).trim();
}

/**
 * Splits a caption line into segments. English splits on word boundaries.
 * Chinese has no spaces, so it uses longest-match against the lexicon.
 */
export function tokenize(
  text: string,
  lang: Lang,
  index: Map<string, LexiconEntry>,
): Segment[] {
  if (lang === 'en') {
    return text.split(/([A-Za-z']+)/).filter(Boolean).map(part => {
      const entry = /^[A-Za-z']+$/.test(part)
        ? index.get(`en:${part.toLowerCase()}`)
        : undefined;
      return entry ? {text: part, wordId: entry.id} : {text: part};
    });
  }

  const segments: Segment[] = [];
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (let len = Math.min(MAX_PHRASE_LENGTH, text.length - i); len >= 1; len--) {
      const candidate = text.slice(i, i + len);
      const entry = index.get(`zh:${candidate}`);
      if (entry) {
        segments.push({text: candidate, wordId: entry.id});
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Merge plain characters into one segment to keep the output short.
      const last = segments[segments.length - 1];
      if (last && !last.wordId) {
        last.text += text[i];
      } else {
        segments.push({text: text[i]});
      }
      i += 1;
    }
  }
  return segments;
}

/**
 * Decides what each Chinese segment shows: the Chinese and its pinyin always,
 * plus the English gloss while the word is not yet learnt (mastery below the threshold).
 */
export function applyGlosses(
  segments: Segment[],
  entriesById: Map<string, LexiconEntry>,
  mastery: MasteryMap,
  threshold: number,
): Segment[] {
  return segments.map(seg => {
    if (!CHINESE.test(seg.text)) {
      return seg;
    }
    const learnt = !!seg.wordId && getScore(mastery, seg.wordId) >= threshold;
    const entry = seg.wordId ? entriesById.get(seg.wordId) : undefined;
    return {
      text: seg.text,
      wordId: seg.wordId,
      // Learnt words drop the gloss: their English is blanked on the top line instead.
      gloss: learnt ? undefined : entry?.gloss,
      pinyin: chinesePinyin(seg.text),
    };
  });
}

/** Lexicon word ids in the order they first appear across the caption cues. */
export function wordIdsInCues(
  cues: {text: string}[],
  index: Map<string, LexiconEntry>,
  lang: Lang,
): string[] {
  const ids = new Set<string>();
  cues.forEach(cue =>
    tokenize(cue.text, lang, index).forEach(seg => {
      if (seg.wordId) {
        ids.add(seg.wordId);
      }
    }),
  );
  return [...ids];
}

/**
 * Splits the English line so that each learnt word becomes its own segment:
 * the English is shown as underscores with the Chinese word directly beneath.
 * A learnt gloss is matched in the translation; glosses separated by " / " are
 * matched individually (e.g. "we / us").
 */
export function splitNativeLine(
  native: string,
  learnt: {gloss: string; zh: string}[],
): NativeSegment[] {
  let segments: NativeSegment[] = [{text: native}];
  learnt.forEach(({gloss, zh}) =>
    gloss
      .split('/')
      .map(g => g.trim())
      .filter(Boolean)
      .forEach(g => {
        const escaped = g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(\\b${escaped}\\b)`, 'gi');
        segments = segments.flatMap(seg => {
          if (seg.zh) {
            return [seg];
          }
          // split with a capture group: odd indices are the matched gloss
          return seg.text.split(re).map((part, i) =>
            i % 2 === 1 ? {text: part, zh} : {text: part},
          ).filter(p => p.text.length > 0);
        });
      }),
  );
  return segments;
}
