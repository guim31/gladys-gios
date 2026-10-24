// -----------------------------------------------------------------------------
// The scene action "Get the air quality": one station, or the worst one.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAll, createWorld, discovered } from './helpers/world.js';
import { GDANSK, KRAKOW, WARSZAWA, indexAt } from './helpers/network.js';

async function world(language = 'fr') {
  const w = await createWorld({
    config: { stations: [WARSZAWA, KRAKOW, GDANSK].join(','), language },
    setup: (network) => {
      network.index[KRAKOW] = indexAt(3, '2026-10-24 06:12:00', KRAKOW);
    },
  });
  await createAll(w);
  return w;
}

test('one station: its level, values and a sentence', async () => {
  const w = await world('en');
  const ack = await w.gladys.fake.sceneAction('get_air_quality', {
    station: discovered(w, WARSZAWA).external_id,
  });
  assert.equal(ack.success, true, ack.error);
  assert.deepEqual(ack.data.outputs ?? ack.data, {
    station_name: 'GIOŚ Warszawa, Al. Niepodległości',
    level: 'very_good',
    level_index: 0,
    level_label: 'Very good',
    pm25: 12.7,
    pm10: 17.9,
    no2: 18.5,
    age_minutes: 20,
    summary:
      'GIOŚ Warszawa, Al. Niepodległości: Very good · PM2.5 12.7 µg/m³ · PM10 17.9 µg/m³ · NO₂ 18.5 µg/m³',
  });
});

test('no station chosen: the worst index', async () => {
  const w = await world();
  const ack = await w.gladys.fake.sceneAction('get_air_quality', {});
  const outputs = ack.data.outputs ?? ack.data;
  assert.equal(outputs.station_name, 'GIOŚ Kraków, ul. Bujaka');
  assert.equal(outputs.level_label, 'Passable');
  assert.equal(outputs.pm25, undefined, 'not measured: left out');
  assert.equal(outputs.o3, 0.2);
  assert.equal(outputs.pollutant, undefined, 'no sub-index at 3 in the fixture');
});

test('nothing recent: the action fails with a message in four languages', async () => {
  const w = await world();
  w.advance(5 * 3_600_000);
  const ack = await w.gladys.fake.sceneAction('get_air_quality', {});
  assert.equal(ack.success, false);
  assert.match(ack.error, /No air quality reading yet\. \/ Pas encore/);
});
