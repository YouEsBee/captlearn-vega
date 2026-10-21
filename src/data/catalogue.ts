import {BACKEND_URL} from '../config';
import {Video} from '../catalogue/types';

/**
 * The demo catalogue, in suggested order: 3 short public-domain VOA Mandarin clips on everyday
 * topics that share vocabulary, so a word learnt in one is blanked in the next.
 * Each clip is screened for wire-agency footage (AP, Reuters, AFP), which is not public domain.
 * The backend serves each clip as media/<id>.mp4 with its thumbnail as media/<id>.jpg.
 * The titles, lengths and levels below are placeholders until the clips are chosen:
 * replace them with each chosen clip's own.
 */
export const CATALOGUE: Video[] = [
  {id: 'voa-1', title: 'Saying hello to new neighbours', lengthSeconds: 95, level: 1, credit: 'VOA'},
  {id: 'voa-2', title: 'A weekend at the night market', lengthSeconds: 130, level: 1, credit: 'VOA'},
  {id: 'voa-3', title: 'Looking for a flat in the city', lengthSeconds: 165, level: 2, credit: 'VOA'},
];

/** Where the player streams a catalogue video from. */
export function videoUrl(id: string): string {
  return `${BACKEND_URL}/media/${id}.mp4`;
}

/** The still shown on a video's home screen card. */
export function thumbnailUrl(id: string): string {
  return `${BACKEND_URL}/media/${id}.jpg`;
}
