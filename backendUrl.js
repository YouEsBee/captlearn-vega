// The backend address the app is built with. babel.config.js writes it into src/config.ts
// at build time, from BACKEND_URL in the environment, else in a .env file here, else the
// shared default below.
const fs = require('fs');
const path = require('path');

// The team's shared copy of the backend's files on GitHub Pages (the captlearn-media repo), so a
// fresh clone builds without a .env and works with nobody's computer running.
const SHARED_BACKEND_URL = 'https://alisakujou0711.github.io/captlearn-media';

/** BACKEND_URL from `env`, or else from the .env file's text, or else `shared`, with no trailing slash. Empty if none. */
function backendUrl(env, dotenv, shared = '') {
  let url = (env.BACKEND_URL || '').trim();
  if (!url) {
    for (const line of dotenv.split(/\r?\n/)) {
      const match = /^\s*BACKEND_URL\s*=\s*(.*)$/.exec(line);
      if (match) {
        url = match[1].trim().replace(/^(["'])(.*)\1$/, '$2');
      }
    }
  }
  if (!url.trim()) {
    url = shared;
  }
  return url.trim().replace(/\/+$/, '');
}

/** The address for this build, read from the environment, the project's .env file and the shared default. */
function readBackendUrl() {
  const file = path.join(__dirname, '.env');
  return backendUrl(
    process.env,
    fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '',
    SHARED_BACKEND_URL,
  );
}

module.exports = {backendUrl, readBackendUrl};
