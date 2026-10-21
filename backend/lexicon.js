// Builds a video's lexicon from its captions: segment the Mandarin with jieba,
// gloss each word from CC-CEDICT and give it an HSK level.
const fs = require('fs');
const path = require('path');
const {Jieba} = require('@node-rs/jieba');
const {dict: jiebaDict} = require('@node-rs/jieba/dict');

const TONE_MARKS = {
  a: 'āáǎà',
  e: 'ēéěè',
  i: 'īíǐì',
  o: 'ōóǒò',
  u: 'ūúǔù',
  ü: 'ǖǘǚǜ',
};

/** One CEDICT syllable such as "lu:4" or "men5" in tone marks: "lǜ", "men". */
function markTone(syllable) {
  const match = /^([a-zü:]+)([1-5])$/i.exec(syllable);
  if (!match) {
    return syllable;
  }
  const letters = match[1].replace(/u:/gi, 'ü').toLowerCase();
  const tone = Number(match[2]);
  if (tone === 5) {
    return letters;
  }
  // The mark goes on a or e, on the o of "ou", and otherwise on the last vowel.
  const vowels = [...letters].map((ch, i) => (TONE_MARKS[ch] ? i : -1)).filter(i => i >= 0);
  if (vowels.length === 0) {
    return letters;
  }
  let at = vowels.find(i => letters[i] === 'a' || letters[i] === 'e');
  if (at === undefined) {
    at = letters.includes('ou') ? letters.indexOf('ou') : vowels[vowels.length - 1];
  }
  return letters.slice(0, at) + TONE_MARKS[letters[at]][tone - 1] + letters.slice(at + 1);
}

/** A whole CEDICT reading in tone marks, as one word: "hei1 an4" → "hēi'àn". */
function toneMarked(reading) {
  return reading
    .split(/\s+/)
    .filter(s => /^[a-zü:]+[1-5]$/i.test(s))
    .map(markTone)
    .map((s, i) => (i > 0 && /^[aeo]/.test(s.normalize('NFD')) ? `'${s}` : s))
    .join('');
}

/** CC-CEDICT's text → simplified headword → its entries, in file order. */
function parseCedict(text) {
  const words = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = /^(\S+) (\S+) \[([^\]]*)\] \/(.*)\/\s*$/.exec(line);
    if (!match) {
      continue;
    }
    const [, , simplified, reading, senses] = match;
    const entries = words.get(simplified) ?? [];
    entries.push({reading, senses: senses.split('/')});
    words.set(simplified, entries);
  }
  return words;
}

/**
 * HSK 3.0's levels 7 to 9 are one band, so they share level 7, along with words HSK
 * does not list at all (a word-frequency level for those is left for later).
 */
const TOP_LEVEL = 7;

/** An HSK list, one "word<TAB>level" per line → word → level. */
function parseHsk(text) {
  const levels = new Map();
  for (const line of text.split(/\r?\n/)) {
    const [word, level] = line.split('\t').map(s => s.trim());
    const n = parseInt(level, 10);
    if (word && Number.isFinite(n)) {
      levels.set(word, n);
    }
  }
  return levels;
}

/**
 * Particles and function words: grammar with no English word of their own to learn,
 * so a gloss for them would mislead.
 */
const FUNCTION_WORDS = new Set([
  // structural and aspect particles
  '的', '地', '得', '之', '所', '了', '着', '过', '们',
  // sentence-final and modal particles
  '吗', '呢', '吧', '啊', '呀', '嘛', '啦', '哇', '哦', '噢', '喔', '么', '咯', '呗',
  // fillers and interjections
  '嗯', '呃', '哈', '唉', '哎', '诶', '欸',
  // coverbs that only mark grammar, and the general classifier
  '把', '被', '个',
]);

/** Numbers, written in Chinese or in digits, including ordinals such as 第三. */
const NUMBER = /^第?[〇零一二三四五六七八九十百千万亿两0-9０-９.%]+$/;

/**
 * Whether a word is worth teaching. Many single characters only make sense inside longer
 * words, so a single character is taught only when HSK lists it as a word on its own.
 */
function isTeachable(word, levels) {
  if (FUNCTION_WORDS.has(word) || NUMBER.test(word)) {
    return false;
  }
  return [...word].length > 1 || levels.has(word);
}

/** Senses that point elsewhere instead of giving a meaning. */
const REFERENCE =
  /^(see( also)?|(old |archaic |japanese |korean |erroneous )?variant of|surname|cl:|used in|also written|also pr\.|abbr\. for|same as)\b/i;

/**
 * The first sensible sense of an entry, trimmed to one short English meaning:
 * notes in brackets and anything after a semicolon go. Undefined when no sense gives a meaning.
 */
function pickGloss(senses) {
  for (const sense of senses) {
    if (REFERENCE.test(sense.trim())) {
      continue;
    }
    const gloss = sense
      .split(';')[0]
      .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (gloss) {
      return gloss;
    }
  }
  return undefined;
}

/** jieba's own word frequencies, so it still segments like jieba where words overlap. */
function jiebaFrequencies() {
  const freqs = new Map();
  for (const line of String(jiebaDict).split('\n')) {
    const [word, freq] = line.split(' ');
    if (word) {
      freqs.set(word, Number(freq));
    }
  }
  return freqs;
}

/**
 * Loads the dictionaries a lexicon is made from. `cedict` and `hsk` are the files' text.
 * jieba segments with CC-CEDICT's headwords, so each segment is a word CEDICT can gloss.
 */
function loadDictionary({cedict, hsk}) {
  const words = parseCedict(cedict);
  const freqs = jiebaFrequencies();
  const userDict = [...words.keys()].map(w => `${w} ${freqs.get(w) ?? 3}`).join('\n');
  return {
    words,
    levels: parseHsk(hsk),
    jieba: Jieba.withDict(Buffer.from(userDict)),
  };
}

/**
 * The teachable words of a video's captions, in the order they are first spoken,
 * as LexiconEntry rows: {id, lang, word, gloss, pinyin, level}.
 */
function makeLexicon(cues, dictionary) {
  const {words, levels, jieba} = dictionary;
  const lexicon = new Map();
  for (const cue of cues) {
    for (const word of jieba.cut(cue.text, true)) {
      if (lexicon.has(word) || !isTeachable(word, levels)) {
        continue;
      }
      // CEDICT writes proper nouns with a capitalised reading. They stay in jieba's
      // dictionary, so a name is one segment, but they are not taught.
      const sense = (words.get(word) ?? [])
        .filter(e => !/^[A-Z]/.test(e.reading))
        .map(e => ({reading: e.reading, gloss: pickGloss(e.senses)}))
        .find(e => e.gloss);
      if (!sense) {
        continue;
      }
      lexicon.set(word, {
        id: `zh-${word}`,
        lang: 'zh',
        word,
        gloss: sense.gloss,
        pinyin: toneMarked(sense.reading),
        level: Math.min(levels.get(word) ?? TOP_LEVEL, TOP_LEVEL),
      });
    }
  }
  return [...lexicon.values()];
}

const DATA_DIR = path.join(__dirname, 'data');
const CEDICT_FILE = 'cedict_ts.u8';
const HSK_FILE = 'hsk.tsv';
let loadedDictionary;

/**
 * The dictionaries in backend/data, loaded once: CC-CEDICT as cedict_ts.u8 and the
 * HSK 3.0 word list as hsk.tsv. Throws an error that says what to fetch when one is missing.
 */
function dictionaryFromDisk() {
  if (!loadedDictionary) {
    const read = (file, from) => {
      const full = path.join(DATA_DIR, file);
      if (!fs.existsSync(full)) {
        throw new Error(`${full} is missing: get it from ${from} (see README)`);
      }
      return fs.readFileSync(full, 'utf8');
    };
    loadedDictionary = loadDictionary({
      cedict: read(CEDICT_FILE, 'https://www.mdbg.net/chinese/dictionary?page=cc-cedict'),
      hsk: read(HSK_FILE, 'an HSK 3.0 word list, one "word<TAB>level" per line'),
    });
  }
  return loadedDictionary;
}

/**
 * A lexicon as saved and served. The glosses are adapted from CC-CEDICT, so the file
 * carries CEDICT's CC BY-SA 4.0 licence and credit.
 */
function lexiconFile(entries) {
  return {
    licence: 'CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/',
    credit:
      'Glosses and pinyin adapted from CC-CEDICT (MDBG, cc-cedict.org): one sense per word, trimmed, with HSK levels added.',
    entries,
  };
}

module.exports = {loadDictionary, makeLexicon, dictionaryFromDisk, lexiconFile};
