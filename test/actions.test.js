// -----------------------------------------------------------------------------
// The buttons of the Configuration screen: find a station, check the stations.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from './helpers/world.js';
import { WARSZAWA } from './helpers/network.js';
import { fold, searchStations } from '../src/catalog.js';

// A house in the centre of Warsaw (Plac Defilad).
const HOUSE = { selector: 'home', name: 'Dom', latitude: 52.2317, longitude: 21.0063 };

test('find by name, accents optional, sorted by name', async () => {
  const w = await createWorld({ houses: [HOUSE] });
  const ack = await w.gladys.fake.action('find_station', { query: 'krakow' });
  assert.equal(ack.success, true, ack.error);
  assert.equal(
    ack.data.message.en,
    [
      'GIOŚ stations for "krakow", to type in "Stations":',
      '#400 Kraków, Aleja Krasińskiego',
      '#401 Kraków, ul. Bujaka',
      '#402 Kraków, ul. Bulwarowa',
      '#10123 Kraków, ul. Złoty Róg',
    ].join('\n'),
  );
});

test('no name: the nearest stations to the house, with their distance', async () => {
  const w = await createWorld({ houses: [HOUSE] });
  const ack = await w.gladys.fake.action('find_station', {});
  const lines = ack.data.message.fr.split('\n');
  assert.equal(lines[0], 'Stations du GIOŚ pour autour de Dom, à saisir dans « Stations » :');
  assert.equal(lines[1], '#530 Warszawa, Al. Niepodległości (1.4 km)');
  assert.equal(lines.length, 10, 'the head, 8 stations, the tail');
  assert.match(lines.at(-1), /…et 4 autres : affinez la recherche\./);
  // The list is kept: a second search does not ask GIOŚ again (2 requests per minute).
  await w.gladys.fake.action('find_station', { query: 'Gdańsk' });
  assert.equal(w.network.calls.filter((call) => call.startsWith('/station/findAll')).length, 1);
});

test('no name and no located house: the action says what to do', async () => {
  const w = await createWorld({ houses: [{ selector: 'h', name: 'H' }] });
  const ack = await w.gladys.fake.action('find_station', {});
  assert.equal(ack.success, false);
  assert.match(ack.error, /Settings → Houses/);
});

test('the station list unreachable: a clear message', async () => {
  const w = await createWorld({ setup: (network) => (network.down = true) });
  const ack = await w.gladys.fake.action('find_station', { query: 'Gdańsk' });
  assert.equal(ack.success, false);
  assert.match(ack.error, /cannot be read now/);
});

test('check the stations: level, pollutants, age, and the typos', async () => {
  const w = await createWorld({ config: { stations: `${WARSZAWA}, abc` } });
  const ack = await w.gladys.fake.action('check_stations', {});
  assert.equal(
    ack.data.message.en,
    [
      '#530 Warszawa, Al. Niepodległości: Very good, PM2.5, PM10, NO₂, CO, C₆H₆ (20 min ago)',
      'Ignored, not station numbers: abc',
    ].join('\n'),
  );
});

test('search helpers: folding and ordering', () => {
  assert.equal(fold('Łódź, ul. Czernika'), 'lodz, ul. czernika');
  const stations = [
    { id: '1', name: 'B', city: 'Gdańsk', lat: 54.35, lon: 18.65 },
    { id: '2', name: 'A', city: 'Gdańsk', lat: null, lon: null },
  ];
  assert.deepEqual(
    searchStations(stations, { query: 'gdansk' }).map((s) => s.id),
    ['2', '1'],
  );
  assert.deepEqual(
    searchStations(stations, { origin: { lat: 54, lon: 18 } }).map((s) => s.id),
    ['1', '2'],
  );
});
