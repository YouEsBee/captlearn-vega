import {BACKEND_URL} from '../config';
import {Cue} from '../learning/types';
import {parseCues} from './parseCues';
import {sampleSrt} from '../data/sampleCues';

const cache = new Map<string, Cue[]>();
const POLL_MS = 5000;
const MAX_POLLS = 60; // about 5 minutes

/**
 * Returns cues for a video: [{start, end, text, native}].
 * Asks the backend to start processing if needed, then polls until the cues are ready.
 * Falls back to the sample captions if the backend can't be reached or fails.
 */
export async function loadCaptions(
  videoId: string,
  source = 'zh',
  native = 'en',
): Promise<Cue[]> {
  const key = `${videoId}:${source}:${native}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const base = `${BACKEND_URL}/videos/${videoId}/captions`;
  try {
    // Starts the job, or returns immediately if the cues are already cached.
    const start = await fetch(`${base}?source=${source}&native=${native}`, {
      method: 'POST',
    });
    console.log(`[captions] POST ${start.status}`);

    for (let i = 0; i < MAX_POLLS; i++) {
      const res = await fetch(`${base}?source=${source}`);
      console.log(`[captions] GET ${res.status}`);
      if (res.status === 200) {
        const cues = (await res.json()) as Cue[];
        cache.set(key, cues);
        return cues;
      }
      if (res.status === 500) {
        console.warn('[captions] backend job failed');
        break;
      }
      await new Promise<void>(resolve => setTimeout(resolve, POLL_MS));
    }
  } catch (err) {
    // Usually means the device can't reach BACKEND_URL.
    console.warn(`[captions] cannot reach ${BACKEND_URL}:`, err);
  }

  console.warn('[captions] using sample captions instead');
  return parseCues(sampleSrt);
}
