const test = require('node:test');
const assert = require('node:assert/strict');
const {parseClock} = require('../gemini');

test('reads M:SS.s clock times as seconds', () => {
  assert.equal(parseClock('1:15.4'), 75.4);
  assert.equal(parseClock('0:03.1'), 3.1);
});

test('reads H:MM:SS.s and plain seconds too', () => {
  assert.equal(parseClock('0:01:15.4'), 75.4);
  assert.equal(parseClock('75.4'), 75.4);
});

test('gives NaN for anything else, so the line is dropped', () => {
  assert.ok(Number.isNaN(parseClock('1:xx')));
  assert.ok(Number.isNaN(parseClock('')));
  assert.ok(Number.isNaN(parseClock(undefined)));
});
