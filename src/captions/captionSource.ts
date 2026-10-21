import {Cue} from '../learning/types';
import {captionsUrl} from '../catalogue/catalogueSource';
import {parseCaptions} from './captions';

/**
 * A video's captions, made ahead of time and served as a static file: [{start, end, text, native}].
 * Empty if the backend can't be reached or has none, so the video plays with no captions or quiz.
 */
export async function loadCaptions(videoId: string): Promise<Cue[]> {
  try {
    const res = await fetch(captionsUrl(videoId));
    if (res.status === 200) {
      return parseCaptions(await res.json());
    }
    console.warn(`[captions] GET ${res.status} for ${videoId}`);
  } catch (err) {
    console.warn(`[captions] cannot load ${videoId}:`, err);
  }
  return [];
}
