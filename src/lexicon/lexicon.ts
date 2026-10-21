import {LexiconEntry} from '../learning/types';

/** Whether a value is a usable lexicon entry. Lexicon files are checked by eye and edited by hand. */
function isEntry(value: unknown): value is LexiconEntry {
  const e = value as Partial<LexiconEntry> | null;
  return (
    !!e &&
    typeof e.id === 'string' &&
    typeof e.lang === 'string' &&
    typeof e.word === 'string' &&
    typeof e.gloss === 'string' &&
    e.gloss !== '' &&
    typeof e.level === 'number' &&
    (e.pinyin === undefined || typeof e.pinyin === 'string')
  );
}

/**
 * The entries of a lexicon file from the backend: {licence, credit, entries}.
 * Broken entries are dropped, and anything that is not a lexicon file gives no entries.
 */
export function parseLexicon(body: unknown): LexiconEntry[] {
  const entries = (body as {entries?: unknown} | null)?.entries;
  return Array.isArray(entries) ? entries.filter(isEntry) : [];
}

/**
 * One lexicon from every video's: each word once, in catalogue order. A word in several
 * videos keeps its entry from the first, so its gloss is the same everywhere.
 */
export function mergeLexicons(lexicons: LexiconEntry[][]): LexiconEntry[] {
  const byId = new Map<string, LexiconEntry>();
  lexicons.flat().forEach(e => {
    if (!byId.has(e.id)) {
      byId.set(e.id, e);
    }
  });
  return [...byId.values()];
}
