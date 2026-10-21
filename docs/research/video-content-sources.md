# Video content sources

Research for store-launch ticket 03 (`.scratch/store-launch/issues/03-video-content-sources.md`): where a commercial language-learning TV app can legally get Mandarin video to stream, on what terms, and what rights it needs to add captions and translations.

Sources read on 2026-10-21. Every claim links to the page it came from; "not checked" means the point was not looked up, and "not found" means it was searched for and no source covered it. This is not legal advice. Points marked **[Lawyer]** need review by a media or IP lawyer before CaptLearn relies on them, and any licence needs that review before it is signed.

## Summary

1. **YouTube embedding doesn't fit the app.** YouTube's policies forbid charging to watch embedded videos, drawing anything over the player, and separating the audio. At most it could be a free discovery tier with captions beside the player.
2. **Creative Commons works only for CC BY and CC BY-SA**, plus Taiwan's open government data licence. NC rules out a paid app and ND rules out translation. The pool of usable Mandarin video is small, and files must come from the creator, not be downloaded from YouTube.
3. **The main public-domain pool is the Voice of America Mandarin archive**, as US government work, once segments with wire-agency footage are screened out. Old Chinese films are mostly still protected in the US.
4. **Licensing from creators or distributors is the route to a real catalogue.** Lingopie and Viki both license. The licence must grant subtitles and translations, AI processing, connected-TV streaming, the territory and marketing use. No prices are public, so this needs quotes.
5. **Original or commissioned content costs the most up front but gives full control.** It needs work-for-hire or assignment contracts and releases from everyone on camera.
6. **Recommendation:** launch with commissioned creator videos plus vetted CC BY and public-domain filler, add distributor licences once there is revenue, and keep a rights register with proof for every video.

| Option | Licence cost | Captions and translations? | Paid app? | Fit |
|---|---|---|---|---|
| Public domain (US government works, expired films) | None | Yes | Yes | Narrow. The VOA Mandarin archive is the main pool; old films are poor teaching material |
| CC BY, CC BY-SA, Taiwan OGDL | None (attribution) | Yes | Yes | Starter or filler catalogue. Sparse, and each file has to be checked |
| CC NC or ND (for example TED) | None, for non-commercial use only | ND: no. NC: not in a paid app | No | Not usable without a separate paid licence |
| YouTube embed (IFrame player in a WebView) | None | Only beside the player, never over it; audio for Gemini is barred | No | Breaks the overlaid captions and the paywall |
| Licence from creators or distributors | Negotiated; not public | Only if the licence grants it | Yes, if subscription or ad-supported rights are granted | Best route to a real catalogue |
| Original or commissioned | Highest up front (production) | Yes | Yes | Full control |

## CaptLearn today

- **Video:** one demo video. `src/config.ts` sets `DEMO_VIDEO_ID = 'test1_compat'`, and the player streams it from `${BACKEND_URL}/media/<id>.mp4` (`src/screens/PlayerScreen.tsx`). The backend serves `backend/media/` with `express.static` (`backend/server.js`), and that folder is git-ignored.
- **Captions:** the backend extracts the audio with ffmpeg, uploads it to Gemini, and gets back Mandarin cues with an English translation per cue (`backend/gemini.js`). It caches the cues in `backend/cache/`.
- **Display:** `CaptionOverlay` draws both lines over the video surface. Learnt words are blanked from the English line, with their Chinese shown beneath (`src/components/CaptionOverlay.tsx`).

So every video in a public catalogue gets copied to a server, streamed, sent to an AI service, translated, and shown with captions drawn over the picture.

## 1. What the app does to a video, in rights terms

Each step is a separate act that the rights holder controls, so a source has to permit all of them:

1. **Copy and host** the file (CDN, transcoding): the reproduction right.
2. **Stream it to paying users** on Fire TV: the distribution, public performance or "making available" right, for a given territory and platform (subscription or ad-supported, on connected TV).
3. **Send the audio to Gemini** for transcription: another reproduction. Some licences now ban AI processing outright (TED's does; see section 3).
4. **Show Mandarin captions and an English translation** in sync with the picture.
   - US law lists translations among derivative works ([17 U.S.C. § 101](https://www.law.cornell.edu/uscode/text/17/101), "derivative work").
   - PRC law gives the author a separate right of translation, "to transform the work from one language into another language" (Copyright Law of the PRC, Art. 10(15), [official English text via China Daily/NPC](https://subsites.chinadaily.com.cn/npc/2020-11/11/c_674691_2.htm)).
   - Creative Commons treats translation as adaptation: "translating a work from one language to another ... [is] generally considered [an] adaptation" ([CC FAQ](https://creativecommons.org/faq/)).
5. **Change the captions per learner** by blanking learnt words. The changed text is CaptLearn's own, but it modifies a translation that CaptLearn holds only under licence. **[Lawyer]** Make sure a licence covers modified, interactive subtitles, not just fixed subtitle tracks.
6. **Use clips, stills and titles in marketing** and the Appstore listing. The licence has to say so.

A same-language Mandarin transcript is arguably less than an adaptation, but the English translation almost certainly is one. **[Lawyer]** Confirm per jurisdiction: the US, the PRC, Taiwan and the store territories CaptLearn launches in.

### What Amazon requires

- The [Amazon Appstore IP policy](https://developer.amazon.com/docs/policy-center/intellectual-property.html) says "Your apps, including app metadata, must not infringe on the intellectual property rights" of others, and "You must have permission to use third-party copyrighted content".
- A disclaimer doesn't help: "any unauthorized use of a third party's intellectual property, regardless of any disclosure or disclaimer," can be infringement ([Appstore Policy FAQ](https://developer.amazon.com/docs/policy-center/faq-policy.html)). The FAQ says the developer "should either have obtained a license or otherwise received permission" from the owner.
- **Consequence:** keep a rights file for every video (the licence, CC proof as a screenshot and URL, release forms), so that a takedown or review question can be answered quickly. The store requirements research (`docs/research/vega-store-requirements.md`, section 3) reaches the same conclusion.

## 2. Public domain

### US federal government works: Voice of America Mandarin

- **Law:** "Copyright protection under this title is not available for any work of the United States Government" ([17 U.S.C. § 105](https://www.law.cornell.edu/uscode/text/17/105)).
- **VOA's terms** ([VOA terms of use](https://www.voanews.com/p/5338.html)):
  - "All text, audio and video material produced exclusively by the Voice of America is in the public domain."
  - Material VOA licensed from others (AP, Reuters, AFP) "is not in the public domain."
  - VOA asks that credit go to "voanews.com, Voice of America, or VOA".
- **Cost:** no licence fee. The labour is screening out every segment with wire footage, third-party music or clips from other broadcasters.
- **Captions and translations:** allowed; no copyright restricts them.
- **Caveats:**
  - VOA's contracts with AP, Reuters and AFP ended in March 2025 (reported by [AP via Click2Houston](https://www.click2houston.com/business/2025/03/14/voice-of-america-ending-contracts-with-associated-press-reuters-and-agence-france-presse/)). Older archive footage still contains wire material, so check it file by file.
  - VOA's operations were heavily cut in 2025, so treat the archive as the asset, not a source of new video. The current state of the VOA Mandarin service was not checked.
  - Public domain is a US status. A foreign court could treat US government works differently. **[Lawyer]** if CaptLearn launches outside the US.
  - The content is news and politics: useful for advanced learners, but sensitive, and likely to be blocked or contested in any China-facing distribution.
  - People interviewed in the footage may have personality or publicity rights. **[Lawyer]**

### Expired copyright: old films

- **PRC term:** rights in an audiovisual work last 50 years, "expiring on December 31" of the fiftieth year after first publication (Copyright Law of the PRC as amended in 2020, Art. 23, [text](https://subsites.chinadaily.com.cn/npc/2020-11/11/c_674691_2.htm)).
- **US term:** works published before 1978 get 95 years. Works from 1930 entered the US public domain on 1 January 2026 ([Duke Center for the Study of the Public Domain, Public Domain Day 2026](https://cspd.law.duke.edu//publicdomainday/2026/)).
- **Copyright restoration:** under [17 U.S.C. § 104A](https://www.law.cornell.edu/uscode/text/17/104A), US copyright "vests automatically" in foreign works that had fallen into the US public domain only for failing US formalities, unless their term had already expired in the source country. So a Chinese film still protected in China when restoration took effect (1996) can be protected in the US for 95 years.
- **Result:** the only Mandarin films safely in the public domain in both the US and the PRC are roughly those from the 1930s to the mid-1940s. Many are silent or have poor audio and dated speech, so they make weak teaching material. Underlying scripts and music can have separate, longer terms (life plus 50 years in the PRC).
- **Cost:** no licence fee, but rights research per title is expensive. **[Lawyer]** per title. Not recommended as a main source.

## 3. Creative Commons and open government licences

### What each licence allows

- **CC BY 4.0:** a worldwide, royalty-free licence to "produce, reproduce, and Share Adapted Material", and Adapted Material explicitly includes material that is "translated" ([CC BY 4.0 legal code](https://creativecommons.org/licenses/by/4.0/legalcode.en), §1(a), §2(a)(1)).
  - Attribution must name the creator and include a copyright notice, a licence notice and a link where practicable. The user must also "indicate if You modified the Licensed Material" (§3(a)(1)).
  - **Usable** commercially with captions and translations. Add a credit on screen or on the detail page, plus a line such as "Mandarin captions and English translation added by CaptLearn".
- **CC BY-SA:** the same, but the adapted version (the captioned video, and arguably the caption track) must be shared under BY-SA. **[Lawyer]** whether that forces CaptLearn to release its Gemini caption tracks under BY-SA. That may be acceptable.
- **CC BY-ND:** the user may "produce and reproduce, but not Share, Adapted Material" ([CC BY-ND 4.0 legal code](https://creativecommons.org/licenses/by-nd/4.0/legalcode.en), §2(a)(1)(B)). Transcoding is allowed, because "technical modifications" never produce Adapted Material (§2(a)(4)). A translated subtitle track shown with the video is very likely an adaptation. **Not usable.**
- **NC (NonCommercial):** use "not primarily intended for or directed toward commercial advantage or monetary compensation" ([CC FAQ](https://creativecommons.org/faq/)). A paid app fails this. **Not usable** without a separate licence.

**Example: TED.** TED talks are CC BY-NC-ND. TED's policy says commercial use includes ad-supported use. It prohibits "adding to" the content, allows translation only through TED's own translator programme, and prohibits putting TED content into "artificial intelligence or machine learning workflows" without a separate written licence ([TED Talks Usage Policy](https://www.ted.com/about/our-organization/our-policies-terms/ted-talks-usage-policy); [TED Terms of Use](https://www.ted.com/about/our-organization/our-policies-terms/ted-com-terms-of-use)). TED sells commercial licences ([How do I license TED content?](https://help.ted.com/hc/en-us/articles/360004233294-How-do-I-license-TED-or-TEDx-content)), so it belongs under licensing (section 5), not here.

### Where to find CC BY Mandarin video

- **YouTube's Creative Commons filter.** Uploaders can mark videos CC BY, but YouTube says it "can't grant you rights to use someone else's content", and a video with a Content ID claim can't be marked CC BY ([YouTube Help: Creative Commons](https://support.google.com/youtube/answer/2797468)). Two traps:
  1. The uploader may not own what they marked CC BY. Check that it is the creator's own channel.
  2. Downloading from YouTube breaches YouTube's Terms even when the video is CC BY. Users may not "download ... or otherwise use any part of the Service or any Content" except "as expressly authorized by the Service" or "with prior written permission from YouTube and, if applicable, the respective rights holders" ([YouTube Terms of Service](https://www.youtube.com/static?template=terms)). Ask the creator for the original file instead. That is also a good opening for a direct licence (section 5).
- **Taiwan Open Government Data License (OGDL) v1.0** ([data.gov.tw licence](https://data.gov.tw/en/license)):
  - It grants a "perpetual, worldwide, non-exclusive, irrevocable, royalty-free" licence to reproduce, distribute and adapt "for any purpose", including derivative works "as products or services".
  - It states "The License is compatible with the Creative Commons Attribution License 4.0 International."
  - Attribution is mandatory, and failing to attribute voids the licence from the start.
  - Some Taiwanese agencies publish video and media under it; check each dataset's licence field.
  - This is Taiwan Mandarin, usually with Traditional characters, which affects which accent and script CaptLearn teaches.
- **Wikimedia Commons** ([Category: Videos in Chinese](https://commons.wikimedia.org/wiki/Category:Videos_in_Chinese)): each file has its own licence on its description page. Expect a small, uneven pool.

**Cost:** no licence fee. The labour is finding, verifying and logging each video. There is little conversational Mandarin under CC BY, and its quality varies, so treat this as a starter or filler catalogue.

## 4. Platform APIs: YouTube embedding

It is technically possible on Vega. Vega's WebView runs on Chromium and talks to the React Native app through a messaging bridge ([Vega WebView overview](https://developer.amazon.com/docs/vega/0.24/overview-of-webview.html)). YouTube requires embedded players to use OS-provided WebViews and to send an HTTP Referer ([YouTube Required Minimum Functionality](https://developers.google.com/youtube/terms/required-minimum-functionality)). But YouTube's policies conflict with how CaptLearn works:

| CaptLearn needs | YouTube rule | Source |
|---|---|---|
| Captions drawn over the video | "You must not display overlays, frames, or other visual elements in front of any part of a YouTube embedded player" | [Required Minimum Functionality](https://developers.google.com/youtube/terms/required-minimum-functionality) |
| A paid subscription | "API Clients must not charge users to watch content in an embedded YouTube player", and must not "gate access to a video by requiring a user to take an action other than clicking the play button" (III.F.3.a and b) | [YouTube API Developer Policies](https://developers.google.com/youtube/terms/developer-policies) (updated 2026-10-15) |
| Audio sent to Gemini for transcription | Must not "separate, isolate, or modify the audio or video components" (III.I.7); must not "download, import, backup, cache, or store copies" without prior written approval (III.E.1.a) | [Developer Policies](https://developers.google.com/youtube/terms/developer-policies) |
| Existing caption tracks instead | `captions.download` "requires the user to have permission to edit the video", so only the owner can authorise it | [YouTube Data API: captions.download](https://developers.google.com/youtube/v3/docs/captions/download) |
| Its own player controls (remote, pausing for word lookup) | Must not "modify, build upon, or block any portion or functionality of a YouTube player" (III.I.6) | [Developer Policies](https://developers.google.com/youtube/terms/developer-policies) |

- **Gemini and YouTube URLs:** the Gemini API can take a public YouTube URL directly. The feature is in preview, and "You can only upload public videos" ([Gemini video understanding](https://ai.google.dev/gemini-api/docs/video-understanding)). That page says nothing about YouTube's terms or the owner's rights in the translation. **[Lawyer]** Using it does not by itself give CaptLearn the right to show a translation in a paid app.
- **The most a compliant integration could be:** a free tier with the YouTube player in one part of the screen and CaptLearn's captions beside or below it, not over it, using transcripts from creators who agree. That is a discovery or marketing channel, not the product.
- **Cost:** none, but it rules out charging and overlays. Not recommended as the main source.

## 5. Licensing from creators or distributors

### How comparable apps source video

- **Lingopie** is the closest comparable: a paid streaming app on Fire TV, Roku and Google TV, with Chinese among its 15 languages ([lingopie.com](https://lingopie.com/)).
  - "Licensed content comes from streaming services and broadcasters worldwide", plus "Lingopie Exclusives", original productions "created and directed by the Lingopie team specifically for language learners" ([What is Lingopie?](https://lingopie.com/blog/what-is-lingopie/)).
  - Example deal: eight anime titles from TMS Entertainment, launched 25 March 2022 ([TMS press release](https://tmsanime.com/news/lingopie-tms-anime-deal)).
  - Other announced partners include ZDF Enterprises ([World Screen](https://worldscreen.com/?p=255426)) and RTVE ([Wikipedia](https://en.wikipedia.org/wiki/Lingopie), a secondary source).
  - Trade reporting says Lingopie often takes broadcasters' back catalogues that aren't licensed elsewhere. In 2026 it signed a microdrama co-production deal with COL Group ([Señal News](https://senalnews.com/en/content/col-group-and-lingopie-launch-dramarizz-and-sign-10-title-microdrama-deal), a secondary source).
- **Rakuten Viki** is not a learning app but a streamer of Mandarin and other Asian dramas with community subtitles. It licenses dramas from China, Taiwan, Korea and Japan and has volunteers subtitle them ([Wikipedia](https://en.wikipedia.org/wiki/Rakuten_Viki); [StreamTV Insider](https://www.streamtvinsider.com/video/deeper-dive-rakuten-viki-built-a-huge-streaming-service-community-rewards); both secondary sources). It shows that distributors will grant subtitle-creation rights to a streamer.
- **FluentU** has two sources: a curated library ("Handpicked, organized, and annotated") that includes "original FluentU content created just for language learners", and a Chrome extension for Netflix and YouTube ([fluentu.com](https://www.fluentu.com/)).
  - For YouTube content it says such use is "allowed, but also actively encouraged by the YouTube API monetization guidelines" ([FluentU help](https://www.fluentu.com/help/are-there-copyright-issues-since-you-use-youtube-videos/)).
  - The page it cites ([creating_monetizable_applications](https://developers.google.com/youtube/creating_monetizable_applications)) now serves the general YouTube API Terms, and the current Developer Policies bar charging to watch embedded videos (III.F.3.a).
  - Don't copy FluentU's YouTube model without a lawyer and, ideally, written approval from YouTube.
- **Language Reactor** hosts no video. It is a desktop Chrome extension that adds dual subtitles and a dictionary "when watching films and series on the Netflix website" and on YouTube, using the user's own access ([Chrome Web Store listing](https://chromewebstore.google.com/detail/language-reactor/hoombieeljmmljlkjmnheibnpciblicm)). It runs on "Google Chrome on desktop and laptop computers running Windows and MacOS". The model doesn't carry over to a Fire TV app, which can't inject into the Netflix or YouTube apps.

### Who to approach for Mandarin

- **Individual Mandarin YouTube creators** (vlogs, street interviews, comprehensible-input channels): the cheapest licences, fast to negotiate, and they can supply source files and clean audio.
  - Precedent: Easy Languages runs a licensed franchise network and has partnered with an app company, Seedlang ([Easy Languages about](https://www.easy-languages.org/about); [Wikipedia](https://en.wikipedia.org/wiki/Easy_Languages_(YouTube))).
  - Whether Easy Languages licenses to other third-party apps was not found. Ask them.
- **PTS, Taiwan's public broadcaster**, runs an international channel of Mandarin and Taiwanese content with English subtitles ([Taiwan News](https://www.taiwannews.com.tw/zh/news/4305808); [PTS](https://www.pts.org.tw/)). No public licensing catalogue was found. Contact them directly.
- **TED**, for a commercial licence of Mandarin-language TEDx talks ([TED licensing](https://help.ted.com/hc/en-us/articles/360004233294-How-do-I-license-TED-or-TEDx-content)). Note the AI-workflow clause (section 3).
- **PRC and Taiwan drama distributors and sales agents**, met through markets such as MIPCOM and ATF. Back-catalogue titles cost less. Pricing was not found; deals are confidential.

### Licence checklist for the lawyer

- Territory (US first, or worldwide?) and term; exclusive or non-exclusive.
- Platform and media: subscription and/or ad-supported streaming on connected-TV apps, naming Fire TV and the Amazon Appstore.
- **An express right to create, show and modify Mandarin and English subtitles and translations**, including interactive or partly blanked captions, and who owns the subtitle files CaptLearn creates.
- **Express permission for automated and AI processing** (Gemini transcription and translation), and that the licensor's content is not used to train models beyond what Gemini's terms allow.
- Hosting, transcoding and CDN rights; DRM requirements; offline download (yes or no).
- Music and other third-party clearances. Music in TV shows is often cleared only for the original broadcast. **[Lawyer]**
- Marketing rights: clips, stills, titles and key art in the Appstore listing.
- Fees: flat fee, minimum guarantee plus revenue share, or per view. Reporting and audit duties.
- A takedown or withdrawal clause, and what happens to learners partway through a course.

**Cost:** no prices for any of these sources were found. Get quotes.

## 6. Original or commissioned content

- **Precedent:** Lingopie Exclusives ([What is Lingopie?](https://lingopie.com/blog/what-is-lingopie/)), FluentU's originals ([fluentu.com](https://www.fluentu.com/)) and Easy Languages' own production network ([about](https://www.easy-languages.org/about)).
- **Rights:** CaptLearn owns everything if the contracts are right:
  - work-made-for-hire or full assignment from producers, writers and editors
  - talent releases from everyone on camera (likeness and voice; worldwide, perpetual, all media)
  - location releases
  - licensed or original music

  **[Lawyer]** Work-for-hire rules differ for contractors in the PRC and Taiwan. Use assignment clauses under a chosen governing law.
- **Captions and translations:** no restriction. CaptLearn can also get clean audio and scripts, which should improve Gemini's caption accuracy, and can grade the language by HSK level.
- **Cost:** the highest up front of all the options (crew, talent, editing), and it scales with ambition. Commissioning short graded videos from Mandarin creators who already have cameras and studios should cost far less than producing drama. No figures were found; get quotes from 3 to 5 creators.
- **Upside:** a catalogue no one can pull, no revenue share, and full freedom with features such as blanking, slow-down and re-dubbing.

## Next steps

1. **Pick the launch territory.** US only is simplest. It sets which public-domain rules apply and what each licence must cover.
2. **Build a rights register** before adding any video CaptLearn doesn't own: one row per video, with source, licence, proof (URL or contract), attribution text, territory, expiry and whether AI processing is allowed.
3. **Pilot 2 or 3 commissioned or licensed creator videos** under a short-form licence reviewed by a lawyer, to set a price benchmark.
4. **Screen the VOA Mandarin archive and Taiwan OGDL datasets** for clips with no wire footage or music, as free filler.
5. **Book a media or IP lawyer** to review the licence template, the reach of CC BY-SA share-alike over caption tracks, PRC and Taiwan translation rights, the publicity rights of people on camera, and the Gemini processing clause.

## Open questions

- **VOA Mandarin:** its current operating status, and whether its output since 2025 is still the work of federal employees.
- **Prices:** actual licence prices from creators, PTS, TED and drama distributors. None are public.
- **CC BY volume:** whether any Mandarin CC BY catalogue big enough to matter exists. Searches during this research found only scattered files.
- **YouTube approval:** whether YouTube would give a paid learning app written approval under III.E.1.a or III.G.1.c. That seems unlikely and would need direct contact with YouTube.
