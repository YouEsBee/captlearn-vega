# CaptLearn
A VegaOS TV app that teaches you another language while you watch.

## Description
This app is a proof of concept that streams a small catalogue of videos.
The user will first complete a quiz and thereafter watch a video with the English translations removed.

## Tech Stack
- Gemini for video subtitle transcription and translation
- React Native with Typescript for app development
- GitHub Pages to host the videos, captions and lexicons
- Cloudflared to test a local backend

## Set up (once)
- Clone this repository and open the project in VS Code.
- Install the Vega Studio plugin.
- Install the app's node packages, in the project root:
```bash
npm i
```
- Install the backend's node packages:
```bash
cd backend
npm i
```
- Only to run your own backend (see below): install cloudflared. This sets up a tunnel so the emulator can stream videos from your computer.
    - Windows: `winget install --id Cloudflare.cloudflared`
    - Mac: `brew install cloudflared` (install Homebrew first)
- Install `ffmpeg` if you will make captions (see below).

## Prepare the videos (once per video)
- The catalogue (each video's id, title, length in seconds, HSK level and credit) is `backend/catalogue.json`. Put each catalogue video in its own folder, `backend/media/<id>/`, as `video.mp4`, with its thumbnail as `thumbnail.jpg`.
- Put the dictionaries that each video's lexicon (its teachable words) is made from in `backend/data`:
    - `cedict_ts.u8`: CC-CEDICT, unzipped from https://www.mdbg.net/chinese/dictionary?page=cc-cedict
    - `hsk.tsv`: the HSK 3.0 word list, one `word<TAB>level` line per word (levels 7 to 9 can be written as 7)
- Make the captions ahead of time. In `backend`, run

  Mac / Linux / Git Bash:
  ```bash
  GEMINI_API_KEY=YOUR_API_KEY GEMINI_MODEL=YOUR_GEMINI_MODEL npm run captions
  ```
  Windows PowerShell:
  ```powershell
  $env:GEMINI_API_KEY="YOUR_API_KEY"; $env:GEMINI_MODEL="YOUR_GEMINI_MODEL"; npm run captions
  ```
  This captions every catalogue video that has none yet, and saves `captions.json` and `lexicon.json` beside each video. `npm run captions -- <id>` remakes one video's captions and lexicon (this overwrites hand fixes).
- Check each video's captions by eye: the script prints every line's timings. Play the video and fix any line that starts or ends at the wrong moment in its `captions.json` (`start` and `end` are seconds).
- Skim each `lexicon.json` and fix any bad gloss by hand. `npm run lexicon -- <id>` in `backend` remakes one from its captions and prints it (this overwrites hand fixes).

## Run
The app loads the catalogue and each video's files from the team's shared copy on GitHub Pages, https://alisakujou0711.github.io/captlearn-media (the [captlearn-media](https://github.com/alisakujou0711/captlearn-media) repo). That address is written into the app when it is built (`SHARED_BACKEND_URL` in `backendUrl.js`), so nobody's computer needs to be running.

In Vega Studio, build the app with the wrench button, then press the play button to launch it in the emulator. If the app can't reach its files, it shows an error screen with a Try again button: check that the TV or emulator is online.

### Update the shared videos
After adding a video or fixing captions or lexicons in `backend`, copy `backend/catalogue.json` and the changed `backend/media/<id>/` folders into the same places in a clone of captlearn-media, then commit and push it. GitHub Pages serves the new files within about ten minutes; the app picks them up without a rebuild. Each file must be under 100 MB.

### Run your own backend instead (optional)
To try files that aren't on GitHub Pages yet, run the backend on your computer and reach it through a tunnel. You need two command lines open.

1. Start the backend. From the project root:
   ```bash
   cd backend
   npm start
   ```
   You should see `CaptLearn backend on :8080`. It only serves files, so it needs no Gemini key. To use another port, set `PORT` first (e.g. `$env:PORT=3000; npm start` in PowerShell) and use it in the tunnel command. To check it works, open http://localhost:8080/catalogue.json in a browser.
2. Start the tunnel in a new command line:
   ```bash
   cloudflared tunnel --url http://localhost:8080
   ```
   Copy the url it prints, e.g. `https://funky-but-interesting-name.trycloudflare.com`. A quick tunnel's url changes every time you start it.
3. Copy `.env.example` to `.env` in the project root and set `BACKEND_URL` to the tunnel url:
   ```
   BACKEND_URL=https://funky-but-interesting-name.trycloudflare.com
   ```
   (Setting `BACKEND_URL` in the environment also works, and wins over `.env`; both win over the shared default.) Build the app again whenever the url changes, and delete `.env` to go back to GitHub Pages.

## Tests
- App: `npm test` in the project root.
- Backend: `npm test` in `backend`.
