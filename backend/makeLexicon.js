// Remakes a video's lexicon from its captions and prints it for checking by eye.
// Run: node makeLexicon.js <video id>
// This overwrites media/<id>/lexicon.json, so any glosses fixed by hand there are lost.
const fs = require('fs');
const {dictionaryFromDisk} = require('./lexicon');
const {safeId, videoFiles, saveLexicon} = require('./media');

const id = process.argv[2];
if (!id || !safeId(id)) {
  console.error('Usage: node makeLexicon.js <video id>');
  process.exit(1);
}
const files = videoFiles(id);
if (!fs.existsSync(files.captions)) {
  console.error(`No captions at ${files.captions}: make them first with makeCaptions.js.`);
  process.exit(1);
}

const cues = JSON.parse(fs.readFileSync(files.captions, 'utf8'));
const entries = saveLexicon(files, cues, dictionaryFromDisk());
for (const e of entries) {
  console.log(`${e.word}\t${e.pinyin}\tHSK ${e.level}\t${e.gloss}`);
}
console.log(`\n${entries.length} words saved to ${files.lexicon}. Fix any bad gloss there by hand.`);
