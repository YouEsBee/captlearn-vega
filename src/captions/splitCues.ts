import {tokenize} from '../learning/substitute';
import {Cue, LexiconEntry, Lang} from '../learning/types';

/** Most target-language characters shown on screen at once, so the text can be large. */
const MAX_CHARS = 10;
/** Punctuation that always ends a piece. */
const BREAK_AFTER = /[，。！？；、,.!?;]$/;

/**
 * Splits long caption lines into shorter pieces, each shown for its own part of the cue's time.
 * Pieces break at punctuation or word boundaries, never inside a word. The English line is
 * split in the same proportion, and each piece's time is shared out by its length.
 */
export function splitCues(
  cues: Cue[],
  lang: Lang,
  index: Map<string, LexiconEntry>,
): Cue[] {
  return cues.flatMap(cue => splitCue(cue, lang, index));
}

function splitCue(cue: Cue, lang: Lang, index: Map<string, LexiconEntry>): Cue[] {
  const words = tokenize(cue.text, lang, index).map(t => t.text);

  // Group the words into pieces.
  const pieces: string[] = [];
  let current = '';
  words.forEach(word => {
    if (current && current.length + word.length > MAX_CHARS) {
      pieces.push(current);
      current = '';
    }
    current += word;
    if (BREAK_AFTER.test(current)) {
      pieces.push(current);
      current = '';
    }
  });
  if (current) {
    pieces.push(current);
  }
  if (pieces.length <= 1) {
    return [cue];
  }

  const total = pieces.reduce((sum, p) => sum + p.length, 0);
  const nativeWords = (cue.native ?? '').split(/\s+/).filter(Boolean);
  const duration = cue.end - cue.start;

  let charsBefore = 0;
  const nativeBefore = (fraction: number) =>
    Math.round(fraction * nativeWords.length);

  return pieces.map((text, i) => {
    const startFraction = charsBefore / total;
    charsBefore += text.length;
    const endFraction = charsBefore / total;
    const nativeFrom = i === 0 ? 0 : nativeBefore(startFraction);
    const nativeTo = i === pieces.length - 1 ? nativeWords.length : nativeBefore(endFraction);
    return {
      start: cue.start + duration * startFraction,
      end: cue.start + duration * endFraction,
      text,
      native: cue.native === undefined ? undefined : nativeWords.slice(nativeFrom, nativeTo).join(' '),
    };
  });
}
