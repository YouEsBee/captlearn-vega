// Gemini-based transcription + translation. Replaces the Transcribe/Translate steps.
// Install: npm install @google/genai
const {GoogleGenAI, Type} = require('@google/genai');

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
// Set GEMINI_MODEL to a current model ID from Google's model list. Not hard-coded
// here, because model IDs change.
const MODEL = process.env.GEMINI_MODEL;

const MAX_LINE_SECONDS = 6;

const cueSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      // Gemini places M:SS.s clock times on audio far better than raw second counts,
      // which drift long.
      start: {type: Type.STRING, description: 'Start time as M:SS.s from the beginning'},
      end: {type: Type.STRING, description: 'End time as M:SS.s from the beginning'},
      text: {type: Type.STRING, description: 'Caption text in the spoken language'},
      native: {type: Type.STRING, description: 'Natural translation into the learner language'},
    },
    required: ['start', 'end', 'text', 'native'],
  },
};

/** Uploads a local audio file and waits until Gemini can read it. */
async function uploadAudio(path, mimeType) {
  let file = await ai.files.upload({file: path, config: {mimeType}});
  while (file.state === 'PROCESSING') {
    await new Promise(r => setTimeout(r, 2000));
    file = await ai.files.get({name: file.name});
  }
  if (file.state !== 'ACTIVE') {
    throw new Error(`Gemini file upload failed: ${file.state}`);
  }
  return file;
}

/**
 * Sends the audio to Gemini and returns cues:
 * [{start, end, text, native}]
 * sourceLang / nativeLang are human names, e.g. 'Mandarin Chinese' and 'English'.
 */
async function transcribeAndTranslate(audioPath, mimeType, sourceLang, nativeLang, durationSeconds) {
  const file = await uploadAudio(audioPath, mimeType);

  const prompt = [
    `Transcribe the speech in this audio. The spoken language is ${sourceLang}.`,
    `The audio is ${clockTime(durationSeconds)} long, so no time is later than that.`,
    `Split it into caption lines of at most ${MAX_LINE_SECONDS} seconds each.`,
    'For each line give:',
    '- start and end as M:SS.s clock times from the beginning of the audio, e.g. 1:05.3',
    `- text: the exact spoken words in ${sourceLang}`,
    `- native: a natural ${nativeLang} translation of that line`,
    'Only transcribe speech that is actually heard. Do not invent words for silence or music.',
  ].join('\n');

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [{fileData: {fileUri: file.uri, mimeType: file.mimeType}}, {text: prompt}],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: cueSchema,
      temperature: 0, // keep timings and text stable between runs
    },
  });

  const raw = JSON.parse(response.text).map(c => ({
    ...c,
    start: parseClock(c.start),
    end: Math.min(parseClock(c.end), durationSeconds),
  }));
  return validateCues(raw);
}

/** 75.4 → "1:15.4" */
function clockTime(seconds) {
  const m = Math.floor(seconds / 60);
  return `${m}:${(seconds - m * 60).toFixed(1).padStart(4, '0')}`;
}

/** "1:15.4" (or "0:01:15.4", or "75.4") → 75.4; NaN when unreadable. */
function parseClock(value) {
  const parts = String(value).trim().split(':');
  if (parts.length > 3 || parts.some(p => !/^\d+(\.\d+)?$/.test(p))) {
    return NaN;
  }
  return parts.reduce((total, p) => total * 60 + Number(p), 0);
}

/**
 * Model output is not trusted: drop bad rows, sort, and remove overlaps
 * so the overlay never shows two lines at once.
 */
function validateCues(raw) {
  const cues = raw
    .filter(
      c =>
        Number.isFinite(c.start) &&
        Number.isFinite(c.end) &&
        c.end > c.start &&
        typeof c.text === 'string' &&
        c.text.trim() !== '',
    )
    .map(c => ({
      start: c.start,
      end: Math.min(c.end, c.start + MAX_LINE_SECONDS * 2),
      text: c.text.trim(),
      native: (c.native || '').trim(),
    }))
    .sort((a, b) => a.start - b.start);

  for (let i = 1; i < cues.length; i++) {
    if (cues[i].start < cues[i - 1].end) {
      cues[i - 1].end = cues[i].start;
    }
  }
  return cues.filter(c => c.end > c.start);
}

module.exports = {transcribeAndTranslate, validateCues, parseClock};
