import {Cue} from '../learning/types';

/** Whether a value is a usable caption line. Captions files have their timings fixed by hand. */
function isCue(value: unknown): value is Cue {
  const c = value as Partial<Cue> | null;
  return (
    !!c &&
    Number.isFinite(c.start) &&
    Number.isFinite(c.end) &&
    (c.end as number) > (c.start as number) &&
    typeof c.text === 'string' &&
    c.text.trim() !== '' &&
    (c.native === undefined || typeof c.native === 'string')
  );
}

/**
 * The lines of a captions file from the backend: [{start, end, text, native}], sorted by start.
 * Broken lines are dropped, and anything that is not a list gives no lines.
 */
export function parseCaptions(body: unknown): Cue[] {
  return Array.isArray(body) ? body.filter(isCue).sort((a, b) => a.start - b.start) : [];
}

/** Returns the cue active at playback time `t`, or undefined. */
export function activeCue(cues: Cue[], t: number): Cue | undefined {
  return cues.find(c => t >= c.start && t < c.end);
}
