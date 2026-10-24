// -----------------------------------------------------------------------------
// The integration end to end, on the SDK's fake Gladys and the real GIOŚ
// answers: discovery, states, freshness, the container's own polling, the
// scene triggers, the status of the Configuration screen.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAll, createWorld, discovered, featureId } from './helpers/world.js';
import { GDANSK, KRAKOW, WARSZAWA, indexAt } from './helpers/network.js';
import { MemoryStore } from '../src/store.js';
import { TEXT } from '../src/i18n.js';

const HOUR = 3_600_000;
const ALL = [WARSZAWA, KRAKOW, GDANSK].join(',');

test('one device per station, named after the GIOŚ list, with what it measures', async () => {
  const w = await createWorld({ config: { stations: ALL } });
  const keys = (id) => discovered(w, id).features.map((f) => f.external_id.split(':').pop());
  assert.equal(discovered(w, WARSZAWA).name, 'GIOŚ Warszawa, Al. Niepodległości');
  assert.deepEqual(keys(WARSZAWA), [
    'index',
    'quality',
    'pm25',
    'pm10',
    'no2',
    'co',
    'c6h6',
    'age',
  ]);
  // Kraków, ul. Bujaka: its PM2.5 sensor is manual (results weeks later): no feature.
  assert.deepEqual(keys(KRAKOW), ['index', 'quality', 'pm10', 'no2', 'o3', 'so2', 'age']);
  assert.equal(discovered(w, GDANSK).features.length, 10);
  assert.equal(discovered(w, WARSZAWA).should_poll, false);
  assert.equal(discovered(w, WARSZAWA).features[0].name, "Indice de qualité de l'air");
  // Nothing is published for a device not added to Gladys.
  assert.deepEqual(w.gladys.fake.states, []);
  assert.deepEqual(w.gladys.fake.connectionStatus, { connected: true });
});

test('the states of an added station: index, its word, pollutants, age', async () => {
  const w = await createWorld({ config: { stations: ALL } });
  await createAll(w);
  const last = (id, key) => w.gladys.fake.lastState(featureId(w, id, key));
  assert.equal(last(WARSZAWA, 'index'), 0);
  assert.equal(last(WARSZAWA, 'quality'), 'Très bon');
  assert.equal(last(WARSZAWA, 'pm25'), 12.7);
  assert.equal(last(WARSZAWA, 'co'), 266);
  assert.equal(last(WARSZAWA, 'age'), 20);
  // Kraków: the 06:00 PM10 hour is still empty, the 05:00 value is published.
  assert.equal(last(KRAKOW, 'pm10'), 24.6);
  assert.equal(last(GDANSK, 'index'), 1);
  assert.equal(last(GDANSK, 'quality'), 'Bon');
  assert.equal(last(GDANSK, 'age'), 80);
  assert.ok(w.gladys.fake.widgetRefreshes.includes('air_quality'));
});

test('a device added again gets every state again, even unchanged', async () => {
  const w = await createWorld({ config: { stations: WARSZAWA } });
  await createAll(w);
  const before = w.gladys.fake.states.length;
  await w.gladys.fake.deviceCreated(discovered(w, WARSZAWA));
  assert.equal(w.gladys.fake.states.length - before, 8, 'index, quality, 5 pollutants, age');
});

test('an old value is never published as current', async () => {
  const w = await createWorld({ config: { stations: WARSZAWA } });
  w.advance(4 * HOUR); // GIOŚ stuck on 06:00: the data are 4 h 20 old
  await createAll(w);
  const last = (key) => w.gladys.fake.lastState(featureId(w, WARSZAWA, key));
  assert.equal(last('pm25'), undefined);
  assert.equal(last('index'), undefined);
  assert.equal(last('age'), 260);
});

test('the container reads the added stations on its own timer, not on onPoll', async () => {
  const w = await createWorld({ config: { stations: `${WARSZAWA},${KRAKOW}` } });
  await w.gladys.fake.deviceCreated(discovered(w, WARSZAWA));
  const count = (path) => w.network.calls.filter((call) => call.startsWith(path)).length;
  const before = count('/aqindex/getIndex/');
  // Within the period: nothing read again.
  w.advance(20 * 60_000);
  await w.app.poller.cycle();
  assert.equal(count('/aqindex/getIndex/'), before);
  // Past it: the added station only (Kraków was read once, for discovery).
  w.advance(10 * 60_000);
  await w.app.poller.cycle();
  assert.deepEqual(
    w.network.calls.slice(-1 - 5).filter((call) => call.startsWith('/aqindex')),
    [`/aqindex/getIndex/${WARSZAWA}`],
  );
  assert.equal(count('/aqindex/getIndex/'), before + 1);
  // The station list (2 requests per minute at GIOŚ) is read once a day at most.
  assert.equal(count('/station/findAll'), 1);
});

test('a manual sensor is skipped after its first answer, until the next sensor list', async () => {
  const w = await createWorld({ config: { stations: KRAKOW } });
  await createAll(w);
  const manual = () => w.network.calls.filter((call) => call.startsWith('/data/getData/2773'));
  assert.equal(manual().length, 1);
  w.advance(HOUR);
  await w.app.poller.cycle();
  assert.equal(manual().length, 1);
  w.advance(24 * HOUR);
  await w.app.poller.cycle();
  assert.equal(manual().length, 2);
});

test('scene triggers: degraded, worse, better but still degraded, back to normal', async () => {
  const w = await createWorld({ config: { stations: WARSZAWA, language: 'en' } });
  await createAll(w);
  // The first index sets the starting level: no event.
  assert.deepEqual(w.gladys.fake.sceneEvents, []);
  const step = async (level, time) => {
    w.network.index[WARSZAWA] = indexAt(level, `2026-10-24 ${time}:12:00`);
    w.advance(HOUR);
    await w.app.poller.cycle();
  };
  await step(3, '07');
  await step(4, '08');
  await step(2, '09');
  await step(2, '10');
  await step(1, '11');
  await step(0, '12');
  const events = w.gladys.fake.sceneEvents;
  assert.deepEqual(
    events.map((event) => [event.key, event.data.level]),
    [
      ['air_quality_degraded', 'sufficient'],
      ['air_quality_degraded', 'bad'],
      ['air_quality_back_to_normal', 'good'],
    ],
  );
  const [first, , back] = events;
  assert.equal(first.data.station, discovered(w, WARSZAWA).external_id);
  assert.equal(first.data.station_name, 'GIOŚ Warszawa, Al. Niepodległości');
  assert.equal(first.data.level_label, 'Sufficient');
  assert.equal(first.data.level_index, 3);
  assert.equal(first.data.previous_level_index, 0);
  assert.match(first.data.summary, /^GIOŚ Warszawa, Al\. Niepodległości: Sufficient · PM2\.5/);
  assert.equal(back.data.worst_level, 'bad');
  assert.equal(back.data.worst_level_label, 'Bad');
  assert.equal(back.data.worst_level_index, 4);
});

test('the triggers name the pollutant that sets the level', async () => {
  const w = await createWorld({ config: { stations: GDANSK } });
  await createAll(w);
  const body = indexAt(2, '2026-10-24 07:12:00', GDANSK);
  body.AqIndex['Wartość indeksu dla wskaźnika O3'] = 2;
  w.network.index[GDANSK] = body;
  w.advance(HOUR);
  await w.app.poller.cycle();
  assert.equal(w.gladys.fake.sceneEvents[0].data.pollutant, 'O₃');
});

test('no event for a station not added, nor twice after a restart', async () => {
  const store = new MemoryStore();
  const w = await createWorld({ config: { stations: WARSZAWA }, store });
  w.network.index[WARSZAWA] = indexAt(3, '2026-10-24 06:12:00');
  await w.app.poller.refreshNow([WARSZAWA]);
  assert.deepEqual(w.gladys.fake.sceneEvents, []);
  await w.app.stop();

  // Restarted, the device now added: the same index is not news.
  const devices = w.gladys.fake.discoveredDevices;
  const again = await createWorld({
    config: { stations: WARSZAWA },
    store,
    devices,
    setup: (network) => {
      network.index[WARSZAWA] = indexAt(3, '2026-10-24 06:12:00');
    },
  });
  await again.app.poller.refreshNow([WARSZAWA]);
  assert.equal(again.gladys.fake.lastState(featureId(again, WARSZAWA, 'index')), 3);
  assert.deepEqual(again.gladys.fake.sceneEvents, []);
  // The device names and pollutants come back from /data, before any read.
  const offline = await createWorld({
    config: { stations: WARSZAWA },
    store,
    setup: (network) => {
      network.down = true;
    },
  });
  assert.equal(discovered(offline, WARSZAWA).features.length, 8);
});

test('the status: nothing configured, API down and back', async () => {
  const empty = await createWorld();
  assert.deepEqual(empty.gladys.fake.connectionStatus, {
    connected: false,
    message: TEXT.notConfigured,
  });

  const w = await createWorld({ config: { stations: WARSZAWA } });
  await createAll(w);
  w.network.down = true;
  w.advance(HOUR);
  await w.app.poller.cycle();
  assert.deepEqual(w.gladys.fake.connectionStatus, {
    connected: false,
    message: TEXT.apiUnreachable,
  });
  w.network.down = false;
  w.advance(HOUR);
  await w.app.poller.cycle();
  assert.deepEqual(w.gladys.fake.connectionStatus, { connected: true });
});

test('a station unknown to GIOŚ gives no device, and the check says why', async () => {
  const w = await createWorld({ config: { stations: '999999' } });
  assert.deepEqual(w.gladys.fake.discoveredDevices, []);
  const { data } = await w.gladys.fake.action('check_stations', {});
  assert.equal(data.message.en, '#999999: not a GIOŚ station (see "Find a station")');
});

test('onPoll, should the core call it, reads only a station that is due', async () => {
  const w = await createWorld({ config: { stations: WARSZAWA } });
  await createAll(w);
  const before = w.network.calls.length;
  await w.gladys.fake.poll(discovered(w, WARSZAWA));
  assert.equal(w.network.calls.length, before);
  w.advance(HOUR);
  await w.gladys.fake.poll(discovered(w, WARSZAWA));
  assert.ok(w.network.calls.length > before);
});
