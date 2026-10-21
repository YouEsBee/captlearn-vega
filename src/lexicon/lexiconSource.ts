import {BACKEND_URL} from '../config';
import {LexiconEntry} from '../learning/types';
import {parseLexicon} from './lexicon';

/**
 * Returns a video's lexicon: its teachable words, made by the backend alongside its captions.
 * Load it once the captions have loaded, so the backend has made it.
 * Empty if the backend can't be reached or has none, so the video plays with no quiz.
 */
export async function loadLexicon(videoId: string): Promise<LexiconEntry[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/videos/${videoId}/lexicon`);
    if (res.status === 200) {
      return parseLexicon(await res.json());
    }
    console.warn(`[lexicon] GET ${res.status} for ${videoId}`);
  } catch (err) {
    console.warn(`[lexicon] cannot reach ${BACKEND_URL}:`, err);
  }
  return [];
}
