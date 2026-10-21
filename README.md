# CaptLearn
A VegaOS TV app that teaches you another language while you watch.

## Description
This app is a proof of concept, currently by streaming a local video.
The user will first complete a quiz and thereafter watch a video with the English translations removed.

## Tech Stack
- Gemini for video subtitle transcription and translation
- React Native with Typescript for app development
- Cloudfared to test local video

## Set up
- Clone this repository and open the project in VS Code.
- Install all node packages with ```npm i```
- Install Vega Studio plugin.
- Change directory into backend and install all node packages with ```npm i```
- The catalogue (each video's id, title, length in seconds, HSK level and credit) is `backend/catalogue.json`. Put each catalogue video in its own folder, `backend/media/<id>/`, as `video.mp4`, with its thumbnail as `thumbnail.jpg`.
- Put the dictionaries that each video's lexicon (its teachable words) is made from in `backend/data`:
    - `cedict_ts.u8`: CC-CEDICT, unzipped from https://www.mdbg.net/chinese/dictionary?page=cc-cedict
    - `hsk.tsv`: the HSK 3.0 word list, one `word<TAB>level` line per word (levels 7 to 9 can be written as 7)
- Make the captions ahead of time, once per video. In `backend`, run
```
GEMINI_API_KEY=YOUR_API_KEY GEMINI_MODEL=YOUR_GEMINI_MODEL npm run captions
```
  This captions every catalogue video that has none yet (it needs `ffmpeg`), and saves `captions.json` and `lexicon.json` beside each video. `npm run captions -- <id>` remakes one video's captions and lexicon (this overwrites hand fixes).
- Check each video's captions by eye: the script prints every line's timings. Play the video and fix any line that starts or ends at the wrong moment in its `captions.json` (`start` and `end` are seconds).
- Skim each `lexicon.json` and fix any bad gloss by hand. `npm run lexicon -- <id>` in `backend` remakes one from its captions and prints it (this overwrites hand fixes).
- Run the backend via command line with `npm start` in `backend`. It only serves files, so it needs no Gemini key.
- In a new command line, install cloudfared. This is to set up a tunnel to host the video for local streaming.
    - Windows: ```winget install --id Cloudflare.cloudflared```
    - Mac: ```brew install cloudfared```
        - Ensure Homebrew is installed before running this command
- Then run the following command in the terminal:
```
cloudflared tunnel --url http://localhost:8080
```
- Copy the url from the command line, e.g. https://funky-but-interesting-name.trycloudfare.com. A quick tunnel's url changes every time; a named Cloudflare tunnel keeps it the same.
- Set the app's backend address, which is written into the app when it is built: copy `.env.example` to `.env` and set `BACKEND_URL` in it to that url (or set `BACKEND_URL` in the environment, which wins). Build the app again whenever it changes. If the app can't reach the backend, it shows an error screen with a Try again button.
- To launch the app: Build the app in Vega Studio with the wrench button, followed by the play button to launch the app in the emulator.