# Vega app store requirements

Research for store-launch ticket 01 (`.scratch/store-launch/issues/01-vega-store-requirements.md`): what a Vega OS (Fire TV) app must meet to be accepted on the Amazon Appstore for its first public release.

Sources read on 2026-10-21. Vega docs are version 0.24, which the docs site marks as latest. React Native for Vega API pages (such as BackHandler) use their own version scheme, which tracks the React Native release (0.83). Every claim links to the page it came from; "not found" means the primary source was checked and says nothing on the point. This is not legal advice: the licensing and age questions in sections 4 and 5 need a lawyer before launch.

## Summary

1. **Submission is the normal Appstore flow** with a VPKG instead of an APK. Amazon runs its Fire TV test criteria plus a Vega lifecycle test list, and requires testing on a physical Fire TV Stick before submitting.
2. **Remote and Back are the most likely failures today.** CaptLearn registers no `BackHandler`, and on Vega an unhandled Back exits the app. So Back exits from every screen, where test 4.5 expects it to go to the previous screen. The player also does nothing when the app goes to the background.
3. **Video rights are the biggest content risk.** Amazon's IP policy gives "reproductions or translations of copyrighted content without proper authorization" as an example of infringement. Generating Mandarin captions and English translations of someone else's video needs rights to translate it, not only rights to stream it.
4. **The privacy load is light if data stays on the TV.** Profiles live only in AsyncStorage, and the backend receives only a video ID and language codes. Even so, the privacy questionnaire, a privacy policy and the account-deletion questions all become mandatory once any user-linked data is collected or transferred. That includes crash reporting, analytics and cloud accounts.
5. **The Appstore has no AI-specific rule; Google's Gemini terms do.** Amazon's policy pages say nothing about AI-generated content. Google's Gemini API and Google Cloud generative AI terms both forbid use in an app "directed towards or is likely to be accessed by individuals under the age of 18". Amazon treats educational apps as possibly child-directed. The audience decision and the caption-generation choice have to be settled together.

## 1. Submission and certification

### Steps

From [Publish Your App (Vega 0.24)](https://developer.amazon.com/docs/vega/0.24/app-submission.html):

- **Binary:** upload a VPKG.
- **Manifest:** the manifest must register `com.amazon.category.main`. Without it the app "can't launch from the Fire TV Home launcher" and fails submission. CaptLearn's `manifest.toml` already has it.
- **Developer Console:**
  1. Choose **Add a New App**.
  2. Upload the VPKG.
  3. On **Target Your App**, choose the Vega device under **Amazon Fire TV > Amazon Vega TV**.
  4. Fill in **Appstore Details**.
  5. Choose **Submit App**.
- **Listing:** don't mention "Vega" in any listing field.
- **Same or separate listing:** Amazon recommends sharing one listing with a Fire OS build of the same package name. CaptLearn has no Fire OS build, so it gets its own listing. If it adds a Fire OS build later, that build must use the package name `com.youesbee.captlearn`.
- **Versioning:** the Appstore uses the build number to block downgrades, so every update needs a higher build number than the last VPKG.

From the [submission and compliance blog (Feb 2025)](https://developer.amazon.com/apps-and-games/blogs/2025/02/navigating-app-submission-and-compliance), the console also needs:

- target devices, countries and target audience
- the 13-field content rating questionnaire, which sets the maturity rating
- the User Data Privacy Questionnaire
- IAP items set up before submission, if the app sells anything

### Before you submit

- **Physical device:** test on a Fire TV Stick; the Vega Virtual Device is not enough ([Test Before Submission](https://developer.amazon.com/docs/vega/0.24/test-before-submission.html)).
- **Presubmission checklist** ([checklist](https://developer.amazon.com/docs/app-submission/presubmission-checklist.html)):
  - Be ready to show licences for any third-party IP.
  - Amazon may ask for test login credentials.
  - Amazon "will not publish apps if they fail to launch properly, crash frequently, or contain other obvious defects."
- **Live App Testing** ([Vega LAT](https://developer.amazon.com/docs/vega/0.24/live-app-testing-understanding.html)) lets you ship a build to named tester groups against production Amazon services. You can run up to five packages in parallel, then promote a tested version to live. Use it for a closed beta before the public release.

### Listing assets

Fire TV assets, all without transparency ([Appstore Details](https://developer.amazon.com/docs/app-submission/appstore-details.html)):

| Asset | Size | Notes |
|---|---|---|
| App icon | 1280×720 PNG | Keep title art in the 882×448 safe area |
| Screenshots | 1920×1080 | 3 to 10 |
| Background image | 1920×1080 | Keep the subject in the 1214×830 safe area, to the right |
| Small icon | 114×114 PNG | Shared Appstore listing icon, transparent |
| Large icon | 512×512 PNG | Shared Appstore listing icon, transparent |

Fire TV shows only the first 200 characters of the short description.

### What Amazon tests

Amazon runs these on submitted apps.

**Vega lifecycle tests** ([Test Before Submission](https://developer.amazon.com/docs/vega/0.24/test-before-submission.html)):

1. Exit with Back and relaunch.
2. Exit with Home during playback: no audio leaks onto the launcher.
3. Switch to another app and back: no crash, blank screen or A/V desync.
4. Unplug HDMI during playback: playback pauses and resumes from the same position.
5. Change the HDMI input or power the TV off: same as 4.
6. Restart the device and relaunch: the app works and login details persist.
7. Screensaver while paused: video stays paused.
8. Alexa query during playback: video pauses and then resumes.
9. Bluetooth audio, connected before or during playback.

**General Fire TV test criteria** ([Test Criteria](https://developer.amazon.com/docs/app-testing/test-criteria.html), updated Sep 18, 2026). The ones that matter for CaptLearn:

- **2.3:** show a loading indicator if loading takes more than 15 s. This applies to Gemini caption jobs.
- **2.5 and 2.7:** no crashes or hard locks; the frame rate never stays below 25 fps.
- **2.6:** don't buffer video to eMMC; keep foreground writes under 50 MB/hr.
- **2.9:** fill the screen. Full compatibility needs 90%, and 80% still passes only if the app is centred and not in a corner.
- **2.11:** show a visible focus highlight.
- **2.13:** no screen traps; users must never be forced out with Home.
- **2.18 and 3.13:** handle audio focus correctly.
- **2.19:** pause on HDMI loss.
- **2.22:** exit within 2 s of pressing Home.
- **3.1 and 3.2:** core features, and every feature in the listing, must work.
- **3.7 and 3.8:** saved data survives restart and update.
- **3.14:** while playing content, video apps must keep the screen on (`FLAG_KEEP_SCREEN_ON`) and never enter daydream or standby.
- **Group 4 (remote):**
  - 4.1: Select acts on the focused item.
  - 4.3: the D-pad moves focus.
  - 4.5: Back "returns to the previous screen" and must not force close or loop.
  - 4.6: media keys work in playback.
  - 4.8: the app survives a 10 to 15 minute one-handed remote session.

**Content policy:** apps must also follow the Appstore Content Policy (section 3).

## 2. TV UX behaviour

### Remote navigation and focus

- **Focus model:** Vega uses Cartesian D-pad focus by default. You can override it with `nextFocus*` props, `FocusManager` and `TVFocusGuideView` ([Focus Management](https://developer.amazon.com/docs/vega/0.24/focus-management.html)).
- **Initial focus:** `hasTVPreferredFocus` works only on first mount.
- **Focus indicator:** Vega gives most components no focus styling, so the app must draw its own. Amazon recommends a border or size change that stays visible in High Contrast mode.
- **Focus restoration:** "The Vega platform does not provide built-in focus restoration capabilities." The page says some React Navigation stack navigators restore focus, but its table marks both `@amazon-devices/react-navigation__stack` and `__native-stack` as having no automatic focus restoration. Store the last focused element per screen and restore it with `FocusManager.setFocus()` when the screen returns.
- **Fire TV rules** ([Design and UX Guidelines](https://developer.amazon.com/docs/fire-tv/design-and-user-experience-guidelines.html)): every actionable element must be reachable with the D-pad, and Select briefly shows a selected state.
- **Text entry:** keep text entry to a minimum (test 2.10). CaptLearn's onboarding nickname entry is the only place it types; keep it short.

### Back button

- **Default on Vega:** if no `BackHandler` listener returns `true`, Vega "programmatically invokes the default back button functionality to exit the app" ([BackHandler, RN for Vega 0.83](https://developer.amazon.com/docs/react-native-vega/0.83/backhandler.html)). Listeners run newest-first.
- **Requirement:** test 4.5 expects Back to go to the previous screen without force closing or entering an infinite loop. It also says "Use of the Back button is not required". Exiting from the top-level screen isn't covered by 4.5; treating it as acceptable is an inference from the BackHandler default and the WebView guidance below.
- **Recommended pattern:** Amazon's WebView TV guidance ([WebView best practices](https://developer.amazon.com/docs/vega/0.24/webview-development-best-practices-tv.html)) recommends going back through earlier screens first. At the top level, show a popup before closing the app.
- **CaptLearn today:**
  - `App.tsx` switches screens with React state, and nothing in `src/` registers a `BackHandler`.
  - So the remote Back key exits the app from every screen, including mid-quiz and mid-video. The on-screen "Back" buttons are not wired to the remote's Back key.

### Background, foreground and media lifecycle

- **Media requirements** ([Media player requirements](https://developer.amazon.com/docs/vega/0.24/media-player-requirements.html)):
  - When the app goes to the background, it must release playback resources. For VOD, "the app must release the media resources and go back to the Movie or Content detail page."
  - Keeping the playback position for resume is recommended.
  - The first Vega Fire TV supports only one secure decoder.
  - Captions need the `com.amazon.devconf.privilege.accessibility` privilege. CaptLearn's manifest already lists it and the media services the page requires.
- **Lifecycle** ([Foreground/background](https://developer.amazon.com/docs/vega/0.24/foreground-background.html)): watch the `AppState` API, stop playback and free memory when backgrounded, and treat the return to foreground as a warm start.
- **CaptLearn today:** `PlayerScreen.tsx` has no `AppState` listener, so it doesn't release the player on background.

### Safe areas and 10-foot UI

The safe-area rules are in the Fire TV [Design and UX Guidelines](https://developer.amazon.com/docs/fire-tv/design-and-user-experience-guidelines.html). That page is Fire OS docs from 2020; the Vega docs set no separate safe-area rule.

- **Design size:** design for 1920×1080.
- **Overscan:** keep all UI out of the outer 5% of each edge. Keep focused items and text inside the inner 90%. At 1080p that means 96 px left and right and 54 px top and bottom (derived from the 5% rule; the page gives no pixel values).
- **Text size:** body text at least 14sp, about 28 px at 1080p. Everything must be readable from about 10 feet (test 2.10).
- **Captions:** CaptLearn's caption overlay (`CaptionOverlay.tsx`) sits 80 px from the bottom, which is fine. It sits only 64 px from the left and right edges, inside the 96 px margin, so it needs to move in.

## 3. Content and media policy for a video-streaming app

- **Family-friendly:** the Appstore is "a family-friendly environment". Content without safeguards for young customers may be rejected or suppressed ([Content Policy](https://developer.amazon.com/docs/policy-center/understanding-content-policy.html); [Restricted Content](https://developer.amazon.com/docs/policy-center/restricted-content.html)).
- **Language:** examples of violations include "vulgarity, profanity, explicit material". This applies to the videos and to machine-made captions and translations.
- **IP** ([IP, Deception and Spam Policy](https://developer.amazon.com/docs/policy-center/intellectual-property.html)):
  - The app and its metadata must not infringe copyright, trademark or publicity rights.
  - Unauthorised "reproductions or translations of copyrighted content" is an example of infringement.
  - A disclaimer does not cure it ("regardless of any disclosure or disclaimer").
  - The developer is "ultimately responsible" for holding the rights.
  - The presubmission checklist says to be ready to show the licence.
- **What this means for choosing video sources (store-launch ticket 03):** for any third-party clip, the licence must cover streaming *and* creating and showing translated captions. Screenshots and the listing must not use others' logos or stills without permission.
- **User-generated content:** if the app ever lets users add or link content, it needs:
  - terms users accept before posting
  - filtering
  - a way to report and remove content, with moderation
  - an age verification system ([Content Policy](https://developer.amazon.com/docs/policy-center/understanding-content-policy.html))

  None applies today.
- **Monetisation** ([Monetization Policy](https://developer.amazon.com/docs/policy-center/monetization.html)):
  - Digital content sold for use in the app must go through Amazon IAP.
  - The app may not send users elsewhere to pay.
  - It may not require account creation for purchasable content unless it uses IAP.

  This bears on the open business-model question.
- **Ratings:** Amazon sets the maturity rating from the questionnaire and may override it. Mismatched ratings are a common rejection reason ([blog](https://developer.amazon.com/apps-and-games/blogs/2025/02/navigating-app-submission-and-compliance)).

## 4. Privacy and data collection

### Amazon's rules

[Privacy and Security Policy](https://developer.amazon.com/docs/policy-center/privacy-security.html):

- **Privacy policy:** any app that collects personal data needs one, shown both **in the app** and **on the detail page**. It must say what is collected, how it is used and who it is shared with, including data collected by third-party SDKs.
- **Consent:** get consent before collecting. If users wouldn't expect the collection, disclose it in normal app flow (not "behind a menu, policy, or terms of service") and collect only after an affirmative action.
- **Data handling:** collect only the data your features need, and send it securely ("e.g., over HTTPS").
- **Sharing:** transferring data to third-party service providers without consent counts as misuse.
- **Disclosure on request:** you must list every integrated third-party service within 30 days if Amazon asks.

[User Data Privacy Policy](https://developer.amazon.com/docs/policy-center/user-data-privacy.html) and [Privacy Labels](https://developer.amazon.com/docs/app-submission/appstore-privacy-labels.html):

- **The console question:** "Does your app collect user data or transfer user data to third-parties?" A yes requires:
  - a privacy policy URL
  - a per-category declaration with a purpose for each category, including categories collected by SDKs
- **Blocked publishing:** since Q2 2025, an incomplete questionnaire blocks publishing.
- **What counts:** "User data" means data linked to an identifiable user. Anonymous data needs no disclosure.
- **Categories that could apply to CaptLearn:**
  - User Info: nickname, user IDs
  - App Activity: quiz answers, mastery
  - Device or Other IDs
  - App Info and Performance: crash logs, diagnostics

[User Account and Data Deletion](https://developer.amazon.com/docs/app-submission/user-account-and-data-deletion.html):

- **Applies to:** every app that collects user data must answer the deletion questions. These have been required to publish since June 2025.
- **In-app and on the web:** an app with account creation must offer account deletion "within and outside the app", and give a web link straight to the deletion option.
- **What counts as deletion:** deactivation doesn't count. Deleting an account means deleting its data.
- **Retention:** you must disclose any data you keep.

### Children

[Child-Directed App (COPPA) Policy](https://developer.amazon.com/docs/policy-center/privacy-children.html):

- **Who counts as a child:** under 13, or under 16 in the EU, Australia and Japan.
- **Educational subject matter:** it is one of the factors that can make an app child-directed. A multi-audience app is treated as child-directed "unless you confirm children are not using the app".
- **If child-directed:**
  - content must be age-appropriate
  - COPPA (verifiable parental consent) applies
  - no Amazon ad programs
  - only "child-suitable" SDKs that collect personal information

### CaptLearn today

- **Profiles:** nickname, target language and mastery are stored only in on-device AsyncStorage (`src/users/userStore.ts`).
- **Backend requests:** the backend receives only a video ID and `source`/`native` language codes (`src/captions/captionSource.ts`), plus the device IP, which every HTTP request carries. The player also streams the video itself from the same backend (`${BACKEND_URL}/media/${videoId}.mp4` in `PlayerScreen.tsx`), so the backend sees one request per video watched.
- **Likely answer today:** if the backend logs nothing linked to a user and the app has no analytics or crash SDK, the questionnaire answer can probably be "no". Amazon's pages don't say how on-device-only data is treated, so this is an inference.
- **What flips it to "yes":** any of the following:
  - cloud accounts or progress sync
  - crash reporting or analytics (both on the release-readiness list)
  - logging device IDs or IPs against usage

  Once the answer is yes, CaptLearn needs a privacy policy (in the app and at a URL), consent where users wouldn't expect collection, a web account-deletion link, and the questionnaire answers.
- **Account deletion:** an in-app delete already exists (`DeleteAccountScreen.tsx`). It covers the "within the app" half of the deletion rule if profiles ever become real accounts.
- **Gemini data:** only audio extracted from the videos goes to Gemini, not learner data. Section 5 covers Google's rules on that data.

## 5. Third-party AI-generated content

### Amazon

- **No AI-specific rule:** none of these pages mentions AI or generated content:
  - [Content Policy](https://developer.amazon.com/docs/policy-center/understanding-content-policy.html)
  - [Restricted Content](https://developer.amazon.com/docs/policy-center/restricted-content.html)
  - [IP policy](https://developer.amazon.com/docs/policy-center/intellectual-property.html)
  - [Policy FAQ](https://developer.amazon.com/docs/policy-center/faq-policy.html)
  - the [submission blog](https://developer.amazon.com/apps-and-games/blogs/2025/02/navigating-app-submission-and-compliance)

  A web search on 2026-10-21 also found no Appstore AI policy.
- **General rules still apply to generated captions:**
  - family-friendly language (profanity in an auto-translation is the app's content)
  - IP (translations of copyrighted material)
  - not misrepresenting what the app does

### Google (Gemini, which makes CaptLearn's captions)

[Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms), effective March 23, 2026:

- **Age:** users must be 18 or older. The services may not be used "as part of a website, application, or other service that is directed towards or is likely to be accessed by individuals under the age of 18."
- **Paid tier for some regions:** apps offered to users in the EEA, Switzerland or the UK may use only Paid Services.
- **Unpaid tier:** Google may use prompts and responses to improve its products, and humans may review them. Don't send personal information on the unpaid tier.
- **Safety and responsibility:**
  - The developer sets safety settings and must not bypass protections.
  - Output "may sometimes provide inaccurate or offensive content".
  - The developer is responsible for the content and for anyone it is shared with.
  - Attribution may be required when returned with the output.
- **Intended use:** "professional or business purposes, not for consumer use." This wording is about who the developer is, but it is worth confirming with counsel.

[Google Cloud Service Specific Terms](https://cloud.google.com/terms/service-terms) §20(d), for Gemini via Vertex AI, last modified October 12, 2026:

- **Same age restriction:** the customer won't let end users "use a Generative AI Service as part of a website, Customer Application, or other online service that is directed towards or is likely to be accessed by individuals under the age of 18."
- **So:** switching to Vertex AI does not avoid this restriction.

### Why this matters

- **The conflict:** CaptLearn is an educational TV app on a shared family device, and Amazon names educational subject matter as a child-directed factor. That clashes with Google's under-18 restriction.
- **Open question:** whether pre-generating captions on the backend and serving them as fixed content counts as "use as part of" the app is unclear from the text. That question is for a lawyer.
- **Options to decide between:**
  1. Target and rate the app for adults (18+), and say so in the target-audience and content-rating answers.
  2. Generate captions with a provider whose terms allow general-audience apps.
  3. Use human-made or licensed captions, possibly with AI-assisted drafting under terms that allow it.

## Gaps in CaptLearn found during this research

These are inputs for the "TV experience polish" and "Release readiness" items on the store-launch map (`.scratch/store-launch/map.md`). "TC" means the Fire TV test criteria; "Lifecycle" means the numbered Vega lifecycle tests in section 1.

1. **Back key:** register a `BackHandler` that steps back one screen. At the top level, ask before exiting. TC 4.5.
2. **Background playback:** add an `AppState` listener in `PlayerScreen` that pauses and releases the player, and returns to the pre-video screen on background. Vega media requirements; Lifecycle 2 to 5.
3. **Focus:** confirm a visible focus border on every focusable element, and restore focus when returning to a screen. TC 2.11 and 4.3.
4. **Safe area:** keep UI and captions inside the 96 px and 54 px margins. The caption overlay's 64 px side inset is too small today.
5. **Loading:** show a loading indicator for caption jobs that take more than 15 s. TC 2.3.
6. **Backend:** replace the Cloudflare quick-tunnel `BACKEND_URL` with a stable HTTPS backend. It serves both the captions and the video stream.
7. **Versioning:** bump the build number on every submission.
8. **Device test:** test on a physical Fire TV Stick that runs Vega before submitting.
9. **Before launch:** decide the audience and the caption-generation provider together (section 5), and clear video and translation rights (section 3).
