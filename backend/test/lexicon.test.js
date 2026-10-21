const test = require('node:test');
const assert = require('node:assert/strict');
const {loadDictionary, makeLexicon} = require('../lexicon');

// A few CC-CEDICT lines, in the file's own format: traditional simplified [pinyin] /senses/
const CEDICT = `# CC-CEDICT
我們 我们 [wo3 men5] /we; us/
一起 一起 [yi1 qi3] /in the same place/together/
吃 吃 [chi1] /to eat/
火鍋 火锅 [huo3 guo1] /hotpot/
的 的 [de5] /of; ~'s (possessive particle)/
了 了 [le5] /(modal particle intensifying preceding clause)/(completed action marker)/
嗎 吗 [ma5] /(question particle for "yes-no" questions)/
很 很 [hen3] /very; quite/
好 好 [hao3] /good/well/
一 一 [yi1] /one/
一百 一百 [yi1 bai3] /one hundred/
第三 第三 [di4 san1] /third/
兩 两 [liang3] /two/
個 个 [ge4] /individual/this/that/size/classifier for people or objects in general/
人 人 [ren2] /person/
年 年 [nian2] /year/
北京 北京 [Bei3 jing1] /Beijing, capital of the People's Republic of China/
方 方 [Fang1] /surname Fang/
方 方 [fang1] /square/
民 民 [min2] /(bound form) the people; inhabitants of a country/
喜歡 喜欢 [xi3 huan5] /(coll.) to like; to be fond of/
高 高 [Gao1] /surname Gao/
高 高 [gao1] /(of a person) tall/high/
書寫 书写 [shu1 xie3] /see 寫|写[xie3]/to write/
視頻 视频 [shi4 pin2] /video/
深淵 深渊 [shen1 yuan1] /abyss/
短視頻 短视频 [duan3 shi4 pin2] /short video/
黑暗 黑暗 [hei1 an4] /dark/darkness/
綠 绿 [lu:4] /green/
哪 哪 [na3] /how; which/
幾 几 [ji3] /how many; a few/
半 半 [ban4] /half/
`;

const HSK = `我们\t1
一起\t1
吃\t1
火锅\t4
的\t1
了\t1
吗\t1
很\t1
好\t1
一\t1
两\t1
个\t1
人\t1
年\t1
方\t3
高\t1
深渊\t8
绿\t2
哪\t1
几\t1
半\t2
`;

const dictionary = loadDictionary({cedict: CEDICT, hsk: HSK});
const lexicon = (...lines) => makeLexicon(lines.map(text => ({text})), dictionary);

test('glosses each word of the captions with its CEDICT sense, pinyin and HSK level', () => {
  assert.deepEqual(lexicon('我们一起吃火锅'), [
    {id: 'zh-我们', lang: 'zh', word: '我们', gloss: 'we', pinyin: 'wǒmen', level: 1},
    {id: 'zh-一起', lang: 'zh', word: '一起', gloss: 'in the same place', pinyin: 'yīqǐ', level: 1},
    {id: 'zh-吃', lang: 'zh', word: '吃', gloss: 'to eat', pinyin: 'chī', level: 1},
    {id: 'zh-火锅', lang: 'zh', word: '火锅', gloss: 'hotpot', pinyin: 'huǒguō', level: 4},
  ]);
});

const words = entries => entries.map(e => e.word);

test('skips particles and function words', () => {
  assert.deepEqual(words(lexicon('我们的火锅很好吗', '吃了')), ['我们', '火锅', '很', '好', '吃']);
});

test('skips numbers', () => {
  assert.deepEqual(words(lexicon('一百个人', '第三年', '两年', '一年')), ['人', '年']);
});

test('keeps question words and "half", which are words to learn rather than numbers', () => {
  assert.deepEqual(words(lexicon('哪', '几', '半')), ['哪', '几', '半']);
});

test('skips proper nouns', () => {
  assert.deepEqual(words(lexicon('我们北京')), ['我们']);
});

test('reads a word that is also a name by its common meaning', () => {
  assert.deepEqual(lexicon('方'), [
    {id: 'zh-方', lang: 'zh', word: '方', gloss: 'square', pinyin: 'fāng', level: 3},
  ]);
});

test('teaches a single character only when HSK lists it as a word on its own', () => {
  assert.deepEqual(words(lexicon('吃', '民')), ['吃']);
});

const glosses = entries => entries.map(e => e.gloss);

test('glosses a word with one short sense, without notes or cross-references', () => {
  assert.deepEqual(glosses(lexicon('喜欢', '高', '书写')), ['to like', 'tall', 'to write']);
});

const levels = entries => entries.map(e => e.level);

test('puts HSK levels 7 to 9, and words HSK does not list, in one top level 7', () => {
  assert.deepEqual(levels(lexicon('深渊', '视频')), [7, 7]);
});

test("segments with CEDICT's headwords, so words jieba doesn't know stay whole", () => {
  assert.deepEqual(words(lexicon('他看短视频')), ['短视频']);
});

test('lists each word once, in the order it is first spoken', () => {
  assert.deepEqual(words(lexicon('火锅，吃火锅', '我们吃')), ['火锅', '吃', '我们']);
});

const pinyins = entries => entries.map(e => e.pinyin);

test('writes pinyin with tone marks, ü, and an apostrophe between syllables that need one', () => {
  assert.deepEqual(pinyins(lexicon('黑暗', '绿', '我们')), ["hēi'àn", 'lǜ', 'wǒmen']);
});
