// Remakes a video's lexicon from its cached Mandarin captions and prints it for checking by eye.
// Run: node makeLexicon.js <video id>
// This overwrites cache/<id>.lexicon.json, so any glosses fixed by hand there are lost.
const fs = require('fs');
const {safeId, cachePath, lexiconPath, saveLexiconFromCaptions} = require('./cache');

const id = process.argv[2];
if (!id || !safeId(id)) {
  console.error('Usage: node makeLexicon.js <video id>');
  process.exit(1);
}
if (!fs.existsSync(cachePath(id, 'zh'))) {
  console.error(`No captions at ${cachePath(id, 'zh')}: make them first.`);
  process.exit(1);
}

const entries = saveLexiconFromCaptions(id);
for (const e of entries) {
  console.log(`${e.word}\t${e.pinyin}\tHSK ${e.level}\t${e.gloss}`);
}
console.log(`\n${entries.length} words saved to ${lexiconPath(id)}. Fix any bad gloss there by hand.`);
