import {LexiconEntry} from '../learning/types';
import {lexiconUrl} from '../catalogue/catalogueSource';
import {parseLexicon} from './lexicon';

/**
 * A video's lexicon: its teachable words, made ahead of time with its captions.
 * Empty if the backend can't be reached or has none, so the video plays with no quiz.
 */
export async function loadLexicon(videoId: string): Promise<LexiconEntry[]> {
  try {
    const res = await fetch(lexiconUrl(videoId));
    if (res.status === 200) {
      return parseLexicon(await res.json());
    }
    console.warn(`[lexicon] GET ${res.status} for ${videoId}`);
  } catch (err) {
    console.warn(`[lexicon] cannot load ${videoId}:`, err);
  }
  return [];
}
