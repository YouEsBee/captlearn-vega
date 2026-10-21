// Backend for CaptLearn. Extracts audio from a video, runs Gemini, caches cues,
// and makes each video's lexicon from its captions.
// Run: GEMINI_API_KEY=... GEMINI_MODEL=... node server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const {execFile} = require('child_process');
const {promisify} = require('util');
const {transcribeAndTranslate} = require('./gemini');
const {
  CACHE_DIR,
  safeId,
  cachePath,
  lexiconPath,
  saveLexicon,
  saveLexiconFromCaptions,
} = require('./cache');

const execFileAsync = promisify(execFile);
const app = express();
app.use(express.json());
// Serves the test videos so the Vega player can stream them over HTTP.
// express.static supports Range requests, which video playback needs.
app.use('/media', express.static(path.join(__dirname, 'media')));

const MEDIA_DIR = path.join(__dirname, 'media'); // put test videos here
fs.mkdirSync(CACHE_DIR, {recursive: true});

// In-memory job status. Fine for a demo; use a database for anything real.
const jobs = new Map(); // videoId -> {state: 'running' | 'done' | 'error', error?}

const LANGS = {
  zh: 'Mandarin Chinese',
  en: 'English',
};

async function extractAudio(videoPath, outPath) {
  // Mono 16 kHz MP3 keeps uploads small and is enough for speech.
  await execFileAsync('ffmpeg', [
    '-y', '-i', videoPath, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '64k', outPath,
  ]);
}

// POST /videos/:id/captions?source=zh&native=en
// Starts the job and returns at once, because Gemini can take a while.
app.post('/videos/:id/captions', (req, res) => {
  const {id} = req.params;
  const source = req.query.source || 'zh';
  const native = req.query.native || 'en';
  if (!safeId(id) || !LANGS[source] || !LANGS[native]) {
    return res.status(400).json({error: 'bad id or language'});
  }
  if (jobs.get(id)?.state === 'running') {
    return res.status(202).json({state: 'running'});
  }
  if (fs.existsSync(cachePath(id, source))) {
    return res.json({state: 'done'});
  }

  const videoPath = path.join(MEDIA_DIR, `${id}.mp4`);
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({error: 'video not found'});
  }

  jobs.set(id, {state: 'running'});
  res.status(202).json({state: 'running'});

  (async () => {
    const audioPath = path.join(CACHE_DIR, `${id}.mp3`);
    try {
      await extractAudio(videoPath, audioPath);
      const cues = await transcribeAndTranslate(
        audioPath,
        'audio/mp3',
        LANGS[source],
        LANGS[native],
      );
      if (source === 'zh') {
        // Made alongside the captions. A failure here still keeps the captions:
        // GET /videos/:id/lexicon tries again.
        try {
          saveLexicon(id, cues);
        } catch (err) {
          console.error(`lexicon for ${id} failed:`, err);
        }
      }
      fs.writeFileSync(cachePath(id, source), JSON.stringify(cues, null, 2));
      jobs.set(id, {state: 'done'});
    } catch (err) {
      console.error(`job ${id} failed:`, err);
      jobs.set(id, {state: 'error', error: String(err.message || err)});
    } finally {
      fs.rmSync(audioPath, {force: true});
    }
  })();
});

// GET /videos/:id/captions?source=zh
// Returns cues when ready, or the job state otherwise.
app.get('/videos/:id/captions', (req, res) => {
  const {id} = req.params;
  const source = req.query.source || 'zh';
  if (!safeId(id)) {
    return res.status(400).json({error: 'bad id'});
  }
  const file = cachePath(id, source);
  if (fs.existsSync(file)) {
    return res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
  }
  const job = jobs.get(id) || {state: 'none'};
  res.status(job.state === 'error' ? 500 : 202).json(job);
});

// GET /videos/:id/lexicon
// The video's teachable words. Made from its cached Mandarin captions if it is missing,
// for captions cached before lexicons existed.
app.get('/videos/:id/lexicon', (req, res) => {
  const {id} = req.params;
  if (!safeId(id)) {
    return res.status(400).json({error: 'bad id'});
  }
  if (!fs.existsSync(lexiconPath(id))) {
    if (!fs.existsSync(cachePath(id, 'zh'))) {
      return res.status(404).json({error: 'no captions yet'});
    }
    try {
      saveLexiconFromCaptions(id);
    } catch (err) {
      console.error(`lexicon for ${id} failed:`, err);
      return res.status(500).json({error: String(err.message || err)});
    }
  }
  res.json(JSON.parse(fs.readFileSync(lexiconPath(id), 'utf8')));
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`CaptLearn backend on :${port}`));
