const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {once} = require('events');
const {createApp} = require('../server');
const {saveCaptions, videoFiles} = require('../media');
const {loadDictionary} = require('../lexicon');

/** Starts the backend on a free port over a fresh media folder and catalogue file. */
async function serve(t, catalogue = []) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'captlearn-'));
  const mediaDir = path.join(root, 'media');
  const catalogueFile = path.join(root, 'catalogue.json');
  fs.mkdirSync(mediaDir);
  fs.writeFileSync(catalogueFile, JSON.stringify(catalogue));
  const server = createApp({mediaDir, catalogueFile}).listen(0);
  await once(server, 'listening');
  t.after(() => {
    server.close();
    fs.rmSync(root, {recursive: true, force: true});
  });
  return {url: `http://127.0.0.1:${server.address().port}`, mediaDir};
}

test('serves the catalogue list for the home screen', async t => {
  const catalogue = [
    {id: 'voa-1', title: 'Saying hello', lengthSeconds: 95, level: 1, credit: 'VOA'},
  ];
  const {url} = await serve(t, catalogue);
  const res = await fetch(`${url}/catalogue.json`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), catalogue);
});

test("streams part of a video file, as the player asks for", async t => {
  const {url, mediaDir} = await serve(t);
  fs.mkdirSync(path.join(mediaDir, 'voa-1'));
  fs.writeFileSync(path.join(mediaDir, 'voa-1', 'video.mp4'), '0123456789');
  const res = await fetch(`${url}/media/voa-1/video.mp4`, {headers: {Range: 'bytes=2-5'}});
  assert.equal(res.status, 206);
  assert.equal(await res.text(), '2345');
});

test('serves captions made ahead of time, with the lexicon made from them beside them', async t => {
  const {url, mediaDir} = await serve(t);
  const dictionary = loadDictionary({
    cedict: '火鍋 火锅 [huo3 guo1] /hotpot/\n吃 吃 [chi1] /to eat/\n',
    hsk: '火锅\t4\n吃\t1\n',
  });
  const cues = [{start: 0, end: 2.5, text: '吃火锅', native: 'Eat hotpot'}];
  saveCaptions(videoFiles('voa-1', mediaDir), cues, dictionary);

  assert.deepEqual(await (await fetch(`${url}/media/voa-1/captions.json`)).json(), cues);
  const lexicon = await (await fetch(`${url}/media/voa-1/lexicon.json`)).json();
  assert.deepEqual(
    lexicon.entries.map(e => `${e.word} ${e.gloss}`),
    ['吃 to eat', '火锅 hotpot'],
  );
  assert.match(lexicon.licence, /CC BY-SA 4\.0/);
});
