import {BACKEND_URL} from '../config';
import {parseCatalogue} from './catalogue';
import {Video} from './types';

/** One of a catalogue video's files, which the backend serves side by side in media/<id>/ (backend/media.js). */
function mediaUrl(id: string, file: string): string {
  return `${BACKEND_URL}/media/${encodeURIComponent(id)}/${file}`;
}

/** Where the player streams a catalogue video from. */
export const videoUrl = (id: string) => mediaUrl(id, 'video.mp4');
/** The still shown on a video's card, and in the player until playback starts. */
export const thumbnailUrl = (id: string) => mediaUrl(id, 'thumbnail.jpg');
/** A video's captions, made ahead of time. */
export const captionsUrl = (id: string) => mediaUrl(id, 'captions.json');
/** A video's lexicon, made with its captions. */
export const lexiconUrl = (id: string) => mediaUrl(id, 'lexicon.json');

/** How long to wait for the catalogue before saying the backend can't be reached. */
const CATALOGUE_TIMEOUT_MS = 15000;

/**
 * The catalogue from the backend, in suggested order. Throws when the backend can't be
 * reached in time or has no videos, so the app can say so instead of loading forever.
 */
export async function loadCatalogue(): Promise<Video[]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('catalogue: timed out')), CATALOGUE_TIMEOUT_MS);
  });
  const res = await Promise.race([fetch(`${BACKEND_URL}/catalogue.json`), timeout]).finally(
    () => clearTimeout(timer),
  );
  if (res.status !== 200) {
    throw new Error(`catalogue: HTTP ${res.status}`);
  }
  const videos = parseCatalogue(await res.json());
  if (videos.length === 0) {
    throw new Error('catalogue: no videos');
  }
  return videos;
}
