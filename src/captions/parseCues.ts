import {Cue} from '../learning/types';

/** Parses an SRT or WebVTT string into cues sorted by start time. */
export function parseCues(input: string): Cue[] {
  const blocks = input
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(Boolean);

  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    const timingIndex = lines.findIndex(l => l.includes('-->'));
    if (timingIndex === -1) {
      continue; // header (WEBVTT), numbering-only block, or NOTE
    }
    const [startStr, endStr] = lines[timingIndex].split('-->').map(s => s.trim());
    const start = parseTime(startStr);
    const end = parseTime(endStr.split(/\s+/)[0]);
    const text = lines
      .slice(timingIndex + 1)
      .join(' ')
      .replace(/<[^>]+>/g, '') // strip inline tags like <i> or <c.color>
      .trim();
    if (text && !Number.isNaN(start) && !Number.isNaN(end)) {
      cues.push({start, end, text});
    }
  }
  return cues.sort((a, b) => a.start - b.start);
}

/** Accepts "00:01:02,500" (SRT), "01:02.500" and "00:01:02.500" (VTT). */
export function parseTime(value: string): number {
  const parts = value.replace(',', '.').split(':').map(Number);
  if (parts.some(Number.isNaN) || parts.length < 2 || parts.length > 3) {
    return NaN;
  }
  const [h, m, s] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
  return h * 3600 + m * 60 + s;
}

/** Returns the cue active at playback time `t`, or undefined. */
export function activeCue(cues: Cue[], t: number): Cue | undefined {
  return cues.find(c => t >= c.start && t < c.end);
}
