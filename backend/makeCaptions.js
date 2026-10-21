// Makes catalogue videos' captions ahead of time, so the app never waits on Gemini:
// Gemini captions each video's audio, then its lexicon is made from them. Both are saved
// beside the video as media/<id>/captions.json and media/<id>/lexicon.json, and the
// timings are printed so they can be checked by eye against the video.
// Run: GEMINI_API_KEY=... GEMINI_MODEL=... node makeCaptions.js [video id ...]
// With no ids, it captions every catalogue video that has no captions yet. Naming a video
// remakes its captions and lexicon, which loses any fixes made to them by hand.
const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFile} = require('child_process');
const {promisify} = require('util');
const {transcribeAndTranslate} = require('./gemini');
const {dictionaryFromDisk} = require('./lexicon');
const {safeId, videoFiles, saveCaptions, readCatalogue} = require('./media');

const execFileAsync = promisify(execFile);

async function extractAudio(videoPath, outPath) {
  // Mono 16 kHz MP3 keeps uploads small and is enough for speech.
  await execFileAsync('ffmpeg', [
    '-y', '-i', videoPath, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '64k', outPath,
  ]);
}

/** "75.4" → "1:15.4", to compare with the video player's clock. */
function clock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = (seconds - m * 60).toFixed(1).padStart(4, '0');
  return `${m}:${s}`;
}

async function caption(id, dictionary) {
  const files = videoFiles(id);
  if (!fs.existsSync(files.video)) {
    throw new Error(`no video at ${files.video}`);
  }
  const audioPath = path.join(os.tmpdir(), `captlearn-${id}.mp3`);
  try {
    await extractAudio(files.video, audioPath);
    const cues = await transcribeAndTranslate(audioPath, 'audio/mp3', 'Mandarin Chinese', 'English');
    const entries = saveCaptions(files, cues, dictionary);
    for (const c of cues) {
      console.log(`${clock(c.start)} - ${clock(c.end)}\t${c.text}\t${c.native}`);
    }
    console.log(`${id}: ${cues.length} lines and ${entries.length} words saved in ${files.folder}`);
  } finally {
    fs.rmSync(audioPath, {force: true});
  }
}

async function main() {
  const ids = process.argv.slice(2);
  const bad = ids.filter(id => !safeId(id));
  if (bad.length > 0) {
    console.error(`Bad video id: ${bad.join(', ')}`);
    process.exit(1);
  }
  const todo =
    ids.length > 0
      ? ids
      : readCatalogue()
          .map(v => v.id)
          .filter(id => !fs.existsSync(videoFiles(id).captions));
  if (todo.length === 0) {
    console.log('Every catalogue video has captions. Name a video to remake its captions.');
    return;
  }
  // Loaded first, so a missing dictionary stops the run before any Gemini call.
  const dictionary = dictionaryFromDisk();
  let failed = 0;
  for (const id of todo) {
    try {
      await caption(id, dictionary);
    } catch (err) {
      failed++;
      console.error(`${id} failed:`, err.message || err);
    }
  }
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
