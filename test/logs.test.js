// -----------------------------------------------------------------------------
// Quiet logs: a normal cycle writes nothing at the info level, and a failure
// that lasts writes one line when it starts and one when it ends.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAll, createWorld, discovered } from './helpers/world.js';
import { GDANSK, WARSZAWA, indexAt } from './helpers/network.js';

const HOUR = 3_600_000;

/** Capture the log lines (the SDK logger writes through console) at a level. */
function capture(t, level) {
  const previous = process.env.LOG_LEVEL;
  process.env.LOG_LEVEL = level;
  t.after(() => {
    process.env.LOG_LEVEL = previous;
  });
  const lines = [];
  for (const stream of ['log', 'error']) {
    t.mock.method(console, stream, (...args) => lines.push(args.join(' ')));
  }
  return lines;
}

test('a normal cycle writes nothing at the info level', async (t) => {
  const lines = capture(t, 'info');
  const w = await createWorld({ config: { stations: `${WARSZAWA},${GDANSK}` } });
  await createAll(w);
  // Start-up says what it reads and what it found: lifecycle.
  assert.ok(
    lines.some((line) => line.includes('[INFO]') && line.includes('Station #530 found')),
    lines.join('\n'),
  );
  const before = lines.length;
  for (let i = 0; i < 12; i += 1) {
    w.advance(HOUR / 2);
    await w.app.poller.cycle();
    await w.gladys.fake.widgetGet('air_quality', { language: 'fr' });
    await w.gladys.fake.poll(discovered(w, WARSZAWA));
    await w.gladys.fake.sceneAction('get_air_quality', {});
  }
  assert.deepEqual(lines.slice(before), []);
});

test('a lasting failure: one line when it starts, one when it ends', async (t) => {
  const lines = capture(t, 'info');
  const w = await createWorld({ config: { stations: `${WARSZAWA},${GDANSK}` } });
  await createAll(w);
  const before = lines.length;
  w.network.down = true;
  for (let i = 0; i < 6; i += 1) {
    w.advance(HOUR);
    await w.app.poller.cycle();
  }
  w.network.down = false;
  w.advance(HOUR);
  await w.app.poller.cycle();
  const logged = lines.slice(before);
  assert.equal(logged.filter((line) => line.includes('unreachable')).length, 1, logged.join('\n'));
  assert.equal(logged.filter((line) => line.includes('answers again')).length, 1);
  assert.equal(logged.length, 2, logged.join('\n'));
});

test('one station failing alone: said once, and its return', async (t) => {
  const lines = capture(t, 'info');
  const w = await createWorld({ config: { stations: `${WARSZAWA},${GDANSK}` } });
  await createAll(w);
  const before = lines.length;
  w.network.index[WARSZAWA] = { status: 500 };
  for (let i = 0; i < 4; i += 1) {
    w.advance(HOUR);
    await w.app.poller.cycle();
  }
  w.network.index[WARSZAWA] = indexAt(0, '2026-10-24 11:12:00');
  w.advance(HOUR);
  await w.app.poller.cycle();
  const logged = lines.slice(before);
  assert.equal(logged.length, 2, logged.join('\n'));
  assert.match(logged[0], /\[WARN\].*GIOŚ Warszawa, Al\. Niepodległości: GIOŚ API: HTTP 500/);
  assert.match(logged[1], /\[INFO\].*GIOŚ Warszawa, Al\. Niepodległości: read again/);
});
