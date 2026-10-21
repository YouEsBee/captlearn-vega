// The backend address the app is built with. babel.config.js writes it into src/config.ts
// at build time, from BACKEND_URL in the environment or else in a .env file here.
const fs = require('fs');
const path = require('path');

/** BACKEND_URL from `env`, or else from the .env file's text, with no trailing slash. Empty if unset. */
function backendUrl(env, dotenv) {
  let url = (env.BACKEND_URL || '').trim();
  if (!url) {
    for (const line of dotenv.split(/\r?\n/)) {
      const match = /^\s*BACKEND_URL\s*=\s*(.*)$/.exec(line);
      if (match) {
        url = match[1].trim().replace(/^(["'])(.*)\1$/, '$2');
      }
    }
  }
  return url.trim().replace(/\/+$/, '');
}

/** The address for this build, read from the environment and the project's .env file. */
function readBackendUrl() {
  const file = path.join(__dirname, '.env');
  return backendUrl(process.env, fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');
}

module.exports = {backendUrl, readBackendUrl};
