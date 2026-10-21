// Backend for CaptLearn. Serves the catalogue list and each catalogue video's files as
// static files: the video, its thumbnail, and the captions and lexicon made ahead of time
// by makeCaptions.js. Nothing here calls Gemini.
// Run: node server.js
const express = require('express');
const {MEDIA_DIR, CATALOGUE_FILE} = require('./media');

/**
 * The backend app. GET /catalogue.json is the catalogue list, and GET /media/<id>/<file>
 * is one of a video's files (video.mp4, thumbnail.jpg, captions.json, lexicon.json).
 */
function createApp({mediaDir = MEDIA_DIR, catalogueFile = CATALOGUE_FILE} = {}) {
  const app = express();
  app.get('/catalogue.json', (req, res) => res.sendFile(catalogueFile));
  // express.static supports Range requests, which video playback needs.
  app.use('/media', express.static(mediaDir));
  return app;
}

module.exports = {createApp};

if (require.main === module) {
  const port = process.env.PORT || 8080;
  createApp().listen(port, () => console.log(`CaptLearn backend on :${port}`));
}
