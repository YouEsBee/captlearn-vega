import {MasteryMap, isNew} from '../learning/mastery';
import {CatalogueRow, Video} from './types';

/** One row per HSK level, lowest level first. Each row keeps the catalogue's suggested order. */
export function catalogueRows(videos: Video[]): CatalogueRow[] {
  const levels = [...new Set(videos.map(v => v.level))].sort((a, b) => a - b);
  return levels.map(level => ({level, videos: videos.filter(v => v.level === level)}));
}

/** The first unwatched video in the catalogue's suggested order, or none once all are watched. */
export function nextVideo(videos: Video[], watched: string[]): Video | undefined {
  return videos.find(v => !watched.includes(v.id));
}

/** How many of a video's words are new to the learner: never answered correctly in a quiz. */
export function newWordCount(videoWordIds: string[], mastery: MasteryMap): number {
  return videoWordIds.filter(id => isNew(mastery, id)).length;
}

/** A video's length as m:ss, as shown on its card. */
export function formatLength(seconds: number): string {
  const total = Math.round(seconds);
  const secs = total % 60;
  return `${Math.floor(total / 60)}:${secs < 10 ? '0' : ''}${secs}`;
}

/** Whether a value is a usable catalogue video. The catalogue list is written by hand. */
function isVideo(value: unknown): value is Video {
  const v = value as Partial<Video> | null;
  return (
    !!v &&
    typeof v.id === 'string' &&
    v.id !== '' &&
    typeof v.title === 'string' &&
    typeof v.lengthSeconds === 'number' &&
    typeof v.level === 'number' &&
    typeof v.credit === 'string'
  );
}

/**
 * The videos of the catalogue list from the backend, in suggested order.
 * Broken videos are dropped, and anything that is not a list gives no videos.
 */
export function parseCatalogue(body: unknown): Video[] {
  return Array.isArray(body) ? body.filter(isVideo) : [];
}
