// Each catalogue video's files sit side by side in media/<id>/: video.mp4 and thumbnail.jpg,
// put there by hand, and captions.json and lexicon.json, made ahead of time by makeCaptions.js.
// The catalogue list is catalogue.json, next to this file.
const fs = require('fs');
const path = require('path');
const {lexiconFile, makeLexicon} = require('./lexicon');

const MEDIA_DIR = path.join(__dirname, 'media');
const CATALOGUE_FILE = path.join(__dirname, 'catalogue.json');

/** Only allow simple IDs, so an ID can't name a path outside the media folder. */
function safeId(id) {
  return /^[A-Za-z0-9_-]{1,64}$/.test(id);
}

/** The paths of one video's files. The app's catalogueSource.ts asks for the same names. */
function videoFiles(id, mediaDir = MEDIA_DIR) {
  const folder = path.join(mediaDir, id);
  return {
    folder,
    video: path.join(folder, 'video.mp4'),
    thumbnail: path.join(folder, 'thumbnail.jpg'),
    captions: path.join(folder, 'captions.json'),
    lexicon: path.join(folder, 'lexicon.json'),
  };
}

/** Makes a video's lexicon from its Mandarin caption cues and saves it. Returns the entries. */
function saveLexicon(files, cues, dictionary) {
  const entries = makeLexicon(cues, dictionary);
  fs.mkdirSync(files.folder, {recursive: true});
  fs.writeFileSync(files.lexicon, JSON.stringify(lexiconFile(entries), null, 2));
  return entries;
}

/**
 * Saves a video's caption cues and the lexicon made from them. Returns the lexicon entries.
 * The lexicon is saved first, so a video never has captions without its lexicon.
 */
function saveCaptions(files, cues, dictionary) {
  const entries = saveLexicon(files, cues, dictionary);
  fs.writeFileSync(files.captions, JSON.stringify(cues, null, 2));
  return entries;
}

/** The catalogue list: [{id, title, lengthSeconds, level, credit}]. */
function readCatalogue(catalogueFile = CATALOGUE_FILE) {
  return JSON.parse(fs.readFileSync(catalogueFile, 'utf8'));
}

module.exports = {MEDIA_DIR, CATALOGUE_FILE, safeId, videoFiles, saveCaptions, saveLexicon, readCatalogue};
