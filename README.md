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
- Put each catalogue video from `src/data/catalogue.ts` in `backend/media` as `<id>.mp4`, with its thumbnail as `<id>.jpg`.
- Put the dictionaries that each video's lexicon (its teachable words) is made from in `backend/data`:
    - `cedict_ts.u8`: CC-CEDICT, unzipped from https://www.mdbg.net/chinese/dictionary?page=cc-cedict
    - `hsk.tsv`: the HSK 3.0 word list, one `word<TAB>level` line per word (levels 7 to 9 can be written as 7)
- A video's lexicon is made with its captions and saved as `backend/cache/<id>.lexicon.json`. Skim each one and fix any bad gloss in that file by hand. `npm run lexicon -- <id>` in `backend` remakes one from its captions and prints it (this overwrites hand fixes).
- Run the backend via command line with
```
GEMINI_API_KEY=YOUR_API_KEY GEMINI_MODEL=YOUR_GEMINI_MODEL node server.js
```
- In a new command line, install cloudfared. This is to set up a tunnel to host the video for local streaming.
    - Windows: ```winget install --id Cloudflare.cloudflared```
    - Mac: ```brew install cloudfared```
        - Ensure Homebrew is installed before running this command
- Then run the following command in the terminal:
```
cloudflared tunnel --url http://localhost:8080
```
- Copy the url from the command line, e.g. https://funky-but-interesting-name.trycloudfare.com, then paste the url into ```config.ts``` file's ```BACKEND_URL``` constant.
- To launch the app: Build the app in Vega Studio with the wrench button, followed by the play button to launch the app in the emulator.