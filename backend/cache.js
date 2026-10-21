// The cache folder: each video's captions as <id>.<lang>.json and its lexicon as
// <id>.lexicon.json, side by side.
const fs = require('fs');
const path = require('path');
const {dictionaryFromDisk, lexiconFile, makeLexicon} = require('./lexicon');

const CACHE_DIR = path.join(__dirname, 'cache');

/** Only allow simple IDs so a request can't read arbitrary paths. */
function safeId(id) {
  return /^[A-Za-z0-9_-]{1,64}$/.test(id);
}

function cachePath(id, targetLang) {
  return path.join(CACHE_DIR, `${id}.${targetLang}.json`);
}

function lexiconPath(id) {
  return path.join(CACHE_DIR, `${id}.lexicon.json`);
}

/** Makes a video's lexicon from its Mandarin caption cues and saves it. Returns the entries. */
function saveLexicon(id, cues) {
  const entries = makeLexicon(cues, dictionaryFromDisk());
  fs.mkdirSync(CACHE_DIR, {recursive: true});
  fs.writeFileSync(lexiconPath(id), JSON.stringify(lexiconFile(entries), null, 2));
  return entries;
}

/** Makes a video's lexicon from its cached Mandarin captions, which must exist, and saves it. */
function saveLexiconFromCaptions(id) {
  return saveLexicon(id, JSON.parse(fs.readFileSync(cachePath(id, 'zh'), 'utf8')));
}

module.exports = {CACHE_DIR, safeId, cachePath, lexiconPath, saveLexicon, saveLexiconFromCaptions};
