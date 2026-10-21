# Chinese lexicon data sources

Research for store-launch ticket 02 (`.scratch/store-launch/issues/02-chinese-lexicon-sources.md`): what data and tools a commercial app can use to build a Mandarin lexicon automatically for any video, and what each source's licence requires of a paid Amazon Appstore app.

Sources read on 2026-10-21. Every claim links to the page it came from; "not checked" means the point was not looked up, and "not found" means the source was read and says nothing on it. This is not legal advice: the CC BY-SA reading in section 5 and the HSK question in section 3 need a lawyer before launch.

## Summary

1. **Segment on the backend with jieba.** Use `@node-rs/jieba` (MIT, prebuilt binaries) in `backend/`, with `jieba-wasm` as a fallback. Load a user dictionary of CC-CEDICT and HSK words so segments line up with entries the app can gloss. Hermes, the TV's JavaScript engine, does not list `Intl.Segmenter` among its Intl APIs, so segmentation can't move to the device for free. The app's longest-match tokenizer stays as a fallback.
2. **Glosses and pinyin come from CC-CEDICT** (CC BY-SA 4.0, 125,109 entries). Unihan covers single characters only. Wenlin's ABC dictionary is the paid route if share-alike is unacceptable.
3. **CC BY-SA allows a paid app, with two duties.** The app needs a credits screen. Any lexicon data derived from CEDICT must stay CC BY-SA and must not be locked by DRM or extra terms. App code, UI and caption tracks can stay proprietary. The safe design is to keep the lexicon as its own artifact and publish it openly.
4. **Levels come from the 2025 HSK 3.0 syllabus**, with HSK 2.0 as a second field. Nobody clearly grants reuse rights to the HSK lists, so store each word's level on CaptLearn's own entries and don't republish the lists.
5. **Frequency fills the gaps.** For words with no HSK level, use wordfreq's data (CC BY-SA 4.0, includes SUBTLEX-CH, credit both). SUBTLEX-CH downloaded directly from Ghent is research-only.
6. **Permissive tools still carry a duty.** MIT and Unicode-licensed code or data that ships in the app, such as `pinyin-pro`, needs its copyright and licence notice in the app's third-party notices.
7. **Avoid** THULAC, LTP and HanLP's models (research-only or paid), and Stanford CoreNLP (GPL v3).

## CaptLearn today

- **Lexicon:** `src/data/sampleLexicon.ts` holds 31 hand-written Chinese `LexiconEntry` rows plus 3 English ones. The fields are `id, lang, word, gloss, level` and an optional `pinyin`, which only the Chinese rows have (`src/learning/types.ts`).
- **Ids:** Chinese ids are mostly toneless pinyin, such as `zh-women` for 我们; some are shortened, such as `zh-cong` for 从未. Mastery is stored per word id (`src/learning/mastery.ts`), so changing the id scheme orphans learners' progress on the demo words.
- **Tokenizer:** `src/learning/substitute.ts` splits Chinese by longest match, up to 4 characters, against the lexicon. It finds only words already in the list.
- **Pinyin:** captions get pinyin per segment from `pinyin-pro` 3.29.5 (`chinesePinyin()`). The quiz and summary screens show the entry's own `pinyin` field.
- **Runtime:** the backend is Node/Express (`backend/`); the app runs on Hermes (React Native for Vega).

## 1. Word segmentation

Chinese has no spaces, so a lexicon for any video needs a real segmenter.

| Tool | Runs in | Licence | Notes |
|---|---|---|---|
| [jieba](https://github.com/fxsjy/jieba) (original) | Python | [MIT](https://raw.githubusercontent.com/fxsjy/jieba/master/LICENSE) | Free for commercial use; keep the notice. Ships `dict.txt` (word, frequency, part of speech) and supports user dictionaries |
| [nodejieba](https://github.com/yanyiwu/nodejieba) 3.5.8 | Node, native C++ addon | MIT | Downloads prebuilt binaries with `@mapbox/node-pre-gyp`, or compiles from source. Node 18 or later. Has `cut`, `cutHMM`, `cutAll`, `cutForSearch`, `tag`, `extract`, `insertWord` and `load({userDict})` ([package.json](https://github.com/yanyiwu/nodejieba/blob/master/package.json)) |
| [@node-rs/jieba](https://github.com/napi-rs/node-rs/tree/main/packages/jieba) 2.0.4 | Node, N-API over Rust jieba-rs | MIT | Prebuilt for 14 targets, including Linux x64 and arm64 (gnu and musl), Windows, macOS, Android and `wasm32-wasip1-threads`, so no toolchain is needed ([package.json](https://raw.githubusercontent.com/napi-rs/node-rs/main/packages/jieba/package.json)). Has `Jieba.withDict(dict)`, `cut` and TF-IDF keyword extraction; the default dictionary is `@node-rs/jieba/dict` |
| [jieba-rs](https://github.com/messense/jieba-rs) | Rust | MIT | The core of the two above. Embedded default dictionary; optional TF-IDF and TextRank |
| [jieba-wasm](https://github.com/fengkx/jieba-wasm) | Node and browser (WASM) | MIT | WASM binding to jieba-rs with `cut`, `cut_all`, `cut_for_search`, `tokenize`, `add_word` and `with_dict`. No native build |
| [`Intl.Segmenter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) (word granularity) | Node (V8 and ICU) | ICU data: [Unicode License v3](https://www.unicode.org/license.txt) | No dependencies; official Node binaries ship with full ICU ([Node Intl](https://nodejs.org/api/intl.html)). ICU segments Chinese with a word dictionary ([ICU boundary analysis](https://unicode-org.github.io/icu/userguide/boundaryanalysis/)). No custom dictionary or part of speech, so segments may not match lexicon entries. [Hermes's Intl list](https://github.com/facebook/hermes/blob/main/doc/IntlAPIs.md) doesn't include it, so treat it as backend-only. That page describes Hermes on Android and iOS; Vega's Hermes build was not checked |
| [pinyin-pro](https://github.com/zh-lx/pinyin-pro) `segment()` | Any JS, including Hermes | MIT | Available from v3.24.0; CaptLearn already depends on 3.29.5. Returns words with pinyin. [Its docs](https://pinyin-pro.cn/use/segment.html) say to load a fuller dictionary with `addDict` first, such as `@pinyin-pro/data/modern`. That data package's licence was not checked |
| [pkuseg](https://github.com/lancopku/pkuseg-python) | Python | MIT (code) | The README gives no licence for the pretrained models in its releases. Not Node |
| [THULAC](https://github.com/thunlp/THULAC-Python) | Python, C++, Java | Free for research only | Commercial use needs a negotiated licence, although the GitHub sidebar shows MIT. **Avoid** |
| [LTP](https://github.com/HIT-SCIR/ltp) (HIT) | Python | Free for academic use; commercial use is paid | **Avoid**, or buy a licence |
| [HanLP](https://github.com/hankcs/HanLP) | Python, REST | Code Apache-2.0. Multilingual models CC BY-NC-SA 4.0; Chinese models research and teaching only | The models are non-commercial. **Avoid** |
| [Stanford CoreNLP](https://stanfordnlp.github.io/CoreNLP/) | Java | GPL v3 or later (commercial licence available) | Not Node. GPL obligations apply on distribution, so backend-only use is possible, but it is heavy for this job |

**Recommendation:**

- Use `@node-rs/jieba` in `backend/`. It has prebuilt binaries for every likely server target, and it shares the jieba-rs core with `jieba-wasm`, so either can replace the other.
- Load a user dictionary of CC-CEDICT headwords plus HSK words, so that jieba's segments are words the lexicon can gloss.
- Segment on the backend, not the TV. Hermes doesn't list `Intl.Segmenter`, and shipping a full dictionary to the device would add to the app's size and memory (not measured). The device then needs only the per-video entries.
- MIT asks only that the copyright and licence notice go with copies of the software. A backend-only `@node-rs/jieba` isn't distributed, so this bites only if jieba or its dictionary ships in the app.

**Caveat on jieba's `dict.txt`:** it is MIT as part of jieba, but its origin is undocumented. The [wordfreq README](https://github.com/rspeer/wordfreq) calls it a list "whose provenance we don't really know". Don't use its frequency column for levels.

## 2. English glosses and pinyin

| Source | Licence | Notes |
|---|---|---|
| [CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cc-cedict) | **CC BY-SA 4.0** | 125,109 entries; latest release 2026-09-25. Downloads are UTF-8 `.zip` or `.txt.gz` with traditional and simplified forms, numbered pinyin (`pin1 yin1`, to convert to tone marks) and `/`-separated English senses. The format is documented on the [CC-CEDICT wiki](https://cc-cedict.org/wiki/) |
| [Unihan](https://www.unicode.org/reports/tr38/) `kDefinition` | [Unicode License v3](https://www.unicode.org/license.txt) (permissive; keep the notice) | **Characters only, not words.** Unicode says a definitive English gloss is impossible, so use it as a fallback for single-character tokens. `kMandarin` and `kHanyuPinlu` give readings |
| Wiktionary, via [wiktextract](https://github.com/tatuylonen/wiktextract) or [kaikki.org](https://kaikki.org/dictionary/rawdata.html) | Text CC BY-SA 4.0 and GFDL ([Wiktionary copyrights](https://en.wiktionary.org/wiki/Wiktionary:Copyrights)); wiktextract code MIT | Richer than CEDICT but noisier, with the same share-alike duties |
| [ABC Chinese-English Dictionary](https://wenlin.com/abc) (Wenlin) | Commercial, licensed case by case | [Wenlin licenses its data](https://wenlin.com/node/46) to developers and names Pleco and Hanping as licensees. No public price |
| Gemini-generated glosses | [Gemini API terms](https://ai.google.dev/gemini-api/terms): Google doesn't claim ownership of output, may generate similar output for others, and the developer is responsible for its use | No dataset licence, and glosses can fit each video's context. Costs money per call and can hallucinate. On the unpaid tier Google may use inputs and outputs, and humans may review them. **If Gemini picks or rewrites CEDICT senses, treat the result as CEDICT-derived** (section 5) |

**Recommendation:**

- Use CC-CEDICT as the base gloss and pinyin source. It is the largest free word-level Chinese-English dictionary found in this research.
- Fill `gloss` with the first one or two senses, trimmed.
- Fill `pinyin` from the CEDICT reading of the whole word, which resolves polyphones better than per-character conversion. Fall back to `pinyin-pro` for words CEDICT lacks. Captions would need to read `entry.pinyin` for this to show there; today they recompute pinyin with `pinyin-pro`.
- Optionally let Gemini pick the right sense in context, and accept the share-alike consequences in section 5.

## 3. Difficulty levels

### HSK lists

| List | Issuer and status | Cumulative words per level |
|---|---|---|
| **HSK 2.0** (2010) | Hanban/CTI. Six levels. Still used for some 2026 test dates until HSK 3.0 replaces it (secondary source only: [Wikipedia](https://en.wikipedia.org/wiki/Hanyu_Shuiping_Kaoshi)) | 150 / 300 / 600 / 1,200 / 2,500 / 5,000 |
| **GF0025-2021** *国际中文教育中文水平等级标准* (the 2021 "HSK 3.0" standard) | A national language standard from the Ministry of Education and the State Language Commission, effective 2021-07-01. Defines "three stages, nine levels" for syllables, characters, vocabulary and grammar ([MOE, 2021-03-31](http://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/s5987/202103/t20210329_523304.html)) | 500 / 1,272 / 2,245 / 3,245 / 4,316 / 5,456 / 11,092 (levels 7 to 9) |
| **HSK 3.0 syllabus (2025)** *新版HSK考试大纲* | Launched by the Center for Language Education and Cooperation (CLEC, 语合中心) at the 2025 World Chinese Language Conference. MOE says new products follow both GF0025-2021 and this syllabus ([MOE, 2025-11-17](http://www.moe.gov.cn/jyb_xwfb/s5147/202511/t20251117_1420566.html)). **Its word lists differ from GF0025-2021.** The official 406-page [PDF](https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf) is on the site of Chinese Testing International (CTI) ([chinesetest.cn](https://www.chinesetest.cn/)) | 300 / 500 / 1,000 / 2,000 / 3,600 / 5,400 / 11,000 (levels 7 to 9) |

The word counts for both HSK 3.0 rows come from Wikipedia's table, which cites chinesetest.cn and moe.gov.cn. The official 2025 PDF is encrypted and its text could not be extracted, so check the counts against it before relying on them.

**Licence status of the HSK lists is unclear; treat it as a risk.**

- **State documents:** PRC Copyright Law Article 5 excludes laws, regulations and "other documents of legislative, administrative or judicial nature" ([WIPO Lex](https://www.wipo.int/wipolex/zh/text/198977)). GF0025-2021 comes from two state bodies, so it *may* be excluded, but that isn't certain.
- **The 2025 syllabus:** it comes from CLEC/CTI. [chinesetest.cn's legal notice](https://www.chinesetest.cn/legal-notice) says all site content is copyrighted by CTI or its content providers, and allows only reasonable quoting for news or free public information.
- **Community repos don't settle it.** A repo can't grant rights it doesn't hold:
  - [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) is MIT but bundles CC-CEDICT glosses. Relabelling BY-SA glosses as MIT looks inconsistent with share-alike (an inference, not a ruling).
  - [krmanik/HSK-3.0](https://github.com/krmanik/HSK-3.0) marks its lists CC BY-SA 4.0 ([License.md](https://github.com/krmanik/HSK-3.0/blob/main/License.md)).
  - [elkmovie/hsk30](https://github.com/elkmovie/hsk30) is MIT.
- **Lower-risk use:** store the HSK level as a fact about each word inside CaptLearn's own entries, and don't ship or show the lists as lists. Get a legal read before marketing the app as "HSK".

**Recommendation:** use the 2025 syllabus level as the primary `level`, since the HSK 3.0 exam tests it. Keep HSK 2.0 as an optional second field, because some 2026 learners may still sit HSK 2.0. Map levels 7 to 9 to one band.

### Word-frequency lists, for words outside HSK

| Source | Licence | Notes |
|---|---|---|
| **SUBTLEX-CH** ([Cai and Brysbaert 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC2880003/)) | The paper is CC BY; the data is "freely available for research purposes", because a non-commercial grant funded it | 33.5M words of film and TV subtitles, a close match for video. **Not cleared for commercial use if downloaded directly** from Ghent (`expsy.ugent.be/subtlex-ch`) |
| [**wordfreq**](https://github.com/rspeer/wordfreq) (Python) | Code Apache-2.0; **data CC BY-SA 4.0** ([README](https://raw.githubusercontent.com/rspeer/wordfreq/master/README.md)) | Chinese draws on Wikipedia, subtitles (OpenSubtitles and SUBTLEX), news, books, web text, Twitter and the jieba list. The author got Brysbaert's permission to distribute SUBTLEX in wordfreq "for any purpose", on two conditions: credit the SUBTLEX authors, and keep it clear that SUBTLEX is freely available data. The data is a snapshot to about 2021 and won't be updated |
| [**nodewordfreq**](https://cdn.jsdelivr.net/npm/nodewordfreq@0.2.1/package.json) 0.2.1 | Apache-2.0 (package) | A Node port of wordfreq that bundles data and depends on nodejieba. The bundled data is presumably wordfreq's CC BY-SA data; not checked |
| jieba `dict.txt` frequencies | MIT (with jieba) | Unknown origin (section 1), so use it only for segmentation |
| CaptLearn's own corpus | CaptLearn's | Count word frequency across CaptLearn's Gemini caption tracks over time. No third-party terms apply |

**Recommendation:** for words with no HSK level, compute a Zipf frequency from wordfreq's Chinese data and bucket it into the same `level` scale. Export that data once to a JSON table for the backend, which avoids a Python runtime. The table is CC BY-SA 4.0 and must credit wordfreq and SUBTLEX.

## 4. Supporting tools

- **Pinyin:** [`pinyin-pro`](https://github.com/zh-lx/pinyin-pro) (MIT, already a dependency) handles polyphones and tone sandhi. Its package licence is MIT; where its bundled dictionary data comes from is not stated in its README (not found).
- **Traditional to simplified:** if Gemini ever returns traditional text, [`opencc-js`](https://github.com/nk2028/opencc-js) (MIT, pure JS) converts it. The licence of its bundled `opencc-data` was not checked.

## 5. What CC BY-SA 4.0 requires of a paid app

Read from the [legal code](https://creativecommons.org/licenses/by-sa/4.0/legalcode.en) and the [CC FAQ](https://creativecommons.org/faq/). It applies to CC-CEDICT, wordfreq's data and Wiktionary. Capitalised terms such as Share and Adapted Material are defined in the legal code.

1. **Commercial use is allowed.** BY-SA has no NonCommercial term. Section 2(a)(1) grants a worldwide, royalty-free licence to reproduce and Share, so selling the app is fine.
2. **Attribution (section 3(a)).** Credit the creator (CC-CEDICT / MDBG), give the licence link, and say the data was modified. Section 3(a)(2) allows this "in any reasonable manner" for the medium. In practice:
   - add an About or Credits screen in the app that lists CC-CEDICT, wordfreq and SUBTLEX-CH with licence links
   - repeat the credits in the Appstore listing or on a web page
3. **Share-alike applies to the data, not the app (section 3(b)).**
   - Trimming senses, converting pinyin, adding HSK levels or merging Gemini rewrites all produce Adapted Material.
   - If CaptLearn Shares that material, whether in the app bundle or served from the backend, it must carry CC BY-SA 4.0 or a compatible licence, with the licence text or link.
   - The CC FAQ says CC licences don't require a collection to be SA-licensed. This note reads that as letting app code, UI and CaptLearn's Gemini caption tracks stay proprietary, as long as they aren't themselves adaptations of CEDICT data. That reading is an inference for a lawyer to confirm.
4. **No DRM or extra terms on the data (sections 2(a)(5)(C) and 3(b)(3)).** CaptLearn may not add terms, or apply effective technological measures, that restrict recipients' rights in the CEDICT-derived data. Amazon's [submission FAQ](https://developer.amazon.com/docs/app-submission/faq-submission.html) says Appstore DRM is opt-in; the page doesn't mention Vega, so whether it applies to a Vega package (VPKG) was not found. Two ways to stay safe:
   - Publish the derived lexicon openly (a public URL or repo with a LICENSE file), so no recipient's rights depend on unpacking the app. Or serve the data from the backend rather than bundling it.
   - Make sure the app's EULA excludes the third-party data from its restrictions.
5. **Database right (section 4(b)).** Where sui generis database rights exist (for example in the EU), copying all or a substantial part of CC-CEDICT into CaptLearn's own database makes that database Adapted Material, though not its individual contents. Share-alike applies once that database is Shared, for example by serving entries from it to the TV. Keep it apart from user and mastery data.
6. **Facts are free.** The CC FAQ notes that facts aren't subject to copyright. A bare word-to-pinyin fact is arguably unprotected, but CEDICT's English glosses are creative expression, so treat glosses as licensed.

**Design consequence:** keep the lexicon as its own build artifact, for example `backend/data/zh-en-lexicon.json`.

- Generate it from CC-CEDICT, HSK levels and wordfreq.
- Give it a header stating CC BY-SA 4.0 with attribution, and publish it.
- Keep it apart from proprietary code and per-user data.
- Per-video `LexiconEntry[]` slices sent to the TV are excerpts of it and carry its licence and credits.

## 6. Mapping to `LexiconEntry`

The backend segments each Gemini caption track with jieba, joins each segment to CC-CEDICT for gloss and pinyin, then to HSK and frequency data for `level`. It returns pre-segmented cues and a per-video `LexiconEntry[]`.

| Field | From |
|---|---|
| `id` | Open (see below). The branch draft proposed `zh-<simplified>`, or `zh-<simplified>-<CEDICT line>` when one headword has several readings |
| `word` | CC-CEDICT simplified headword, as segmented by jieba |
| `gloss` | First one or two CC-CEDICT senses, trimmed, optionally chosen by Gemini in context |
| `pinyin` | CC-CEDICT reading converted to tone marks; `pinyin-pro` as fallback |
| `level` | HSK 2025 level (1 to 6, with 7 to 9 as 7); otherwise a frequency band from wordfreq's Zipf score |

Today's toneless-pinyin ids would collide for homophones in a generated lexicon, and mastery is stored per id. Choosing the id scheme, and whether to migrate the 31 demo ids, belongs to the lexicon pipeline (store-launch ticket 06).

## Open questions

- **HSK counts:** the exact per-level word lists and counts in the official 2025 syllabus PDF. The PDF is encrypted, so the counts above come from Wikipedia.
- **HSK rights:** whether the GF0025-2021 and 2025 HSK lists can be reused commercially. This needs a legal opinion.
- **DRM:** whether Appstore DRM can be applied to a Vega VPKG, and how that interacts with CC BY-SA section 2(a)(5)(C).
- **`pinyin-pro`'s data:** where the dictionary bundled in `pinyin-pro` 3.29.5, which ships on the TV, comes from, and whether its MIT licence covers it.
- **Unchecked licences:** `@pinyin-pro/data`, `opencc-data`, the nodewordfreq data bundle and the pkuseg pretrained models.
- **CC-CEDICT wiki:** it timed out during this research, so the licence and attribution statement come from the MDBG distribution page.
