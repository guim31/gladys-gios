// -----------------------------------------------------------------------------
// The GIOŚ client against the real answers recorded on 2026-10-24
// (test/fixtures/gios), and the Polish local time of its dates.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, fetchIndex, fetchLatest, fetchSensors, fetchStations } from '../src/api.js';
import { isSummerTime, parseWarsawTime } from '../src/time.js';
import { GDANSK, KRAKOW, WARSZAWA, createNetwork, noIndex } from './helpers/network.js';

const deps = () => {
  const network = createNetwork();
  return { network, deps: { fetch: network.fetch } };
};

test('the station list: ids, names, cities and coordinates', async () => {
  const { deps: d, network } = deps();
  const stations = await fetchStations(d);
  assert.equal(stations.length, 12);
  assert.deepEqual(
    stations.find((station) => station.id === WARSZAWA),
    {
      id: '530',
      code: 'MzWarAlNiepo',
      name: 'Warszawa, Al. Niepodległości',
      city: 'Warszawa',
      lat: 52.219298,
      lon: 21.004724,
    },
  );
  assert.deepEqual(network.calls, ['/station/findAll?size=500&page=0']);
});

test('the sensors: only the pollutants published, manual ones included', async () => {
  const { deps: d } = deps();
  assert.deepEqual(await fetchSensors(WARSZAWA, d), [
    { id: '3575', pollutant: 'c6h6' },
    { id: '3576', pollutant: 'co' },
    { id: '3580', pollutant: 'no2' },
    { id: '3584', pollutant: 'pm10' },
    { id: '3585', pollutant: 'pm25' },
  ]);
  // Kraków, ul. Bujaka: heavy metals and NO/NOx left out, two PM10 sensors.
  const krakow = await fetchSensors(KRAKOW, d);
  assert.deepEqual(
    krakow.map((sensor) => sensor.pollutant),
    ['no2', 'o3', 'pm10', 'pm10', 'pm25', 'so2'],
  );
});

test('the last measurement: the newest non-empty hour, in Polish time', async () => {
  const { deps: d } = deps();
  // 06:00 in Warsaw on 24 October 2026 is summer time: 04:00 UTC.
  assert.deepEqual(await fetchLatest('3585', d), {
    value: 12.7,
    at: Date.parse('2026-10-24T04:00:00Z'),
  });
  // Kraków PM10: the 06:00 hour is still empty, 05:00 is the last value.
  assert.deepEqual(await fetchLatest('2770', d), {
    value: 24.6,
    at: Date.parse('2026-10-24T03:00:00Z'),
  });
});

test('a manual sensor answers an error the client recognizes', async () => {
  const { deps: d } = deps();
  await assert.rejects(fetchLatest('2771', d), (err) => {
    assert.ok(err instanceof ApiError);
    assert.equal(err.manual, true);
    assert.equal(err.status, 400);
    return true;
  });
});

test('the index: level, sub-indices and dates', async () => {
  const { deps: d } = deps();
  assert.deepEqual(await fetchIndex(WARSZAWA, d), {
    level: 0,
    calculatedAt: Date.parse('2026-10-24T04:13:15Z'),
    sourceAt: Date.parse('2026-10-24T04:00:00Z'),
    pollutants: { no2: 0, pm10: 0, pm25: 0 },
  });
  const gdansk = await fetchIndex(GDANSK, d);
  assert.equal(gdansk.level, 1);
  assert.deepEqual(gdansk.pollutants, { so2: 0, no2: 0, pm10: 0, pm25: 1, o3: 0 });
});

test('no index for an unknown station, "no index" (-1) and an invalid status', async () => {
  const { network, deps: d } = deps();
  assert.equal(await fetchIndex('999999', d), null);
  network.index[WARSZAWA] = () => {
    const body = noIndex();
    body.AqIndex['Identyfikator stacji pomiarowej'] = 530;
    body.AqIndex['Wartość indeksu'] = -1;
    return body;
  };
  assert.equal((await fetchIndex(WARSZAWA, d)).level, null);
});

test('errors: HTTP status, unreachable API', async () => {
  const { network, deps: d } = deps();
  network.index[WARSZAWA] = { status: 503 };
  await assert.rejects(fetchIndex(WARSZAWA, d), { name: 'ApiError', status: 503 });
  network.down = true;
  await assert.rejects(fetchIndex(WARSZAWA, d), (err) => {
    assert.equal(err.status, undefined);
    assert.match(err.message, /unreachable \(ENOTFOUND\)/);
    return true;
  });
});

test('Polish local time, whatever the time zone of the container', () => {
  assert.equal(parseWarsawTime('2026-01-15 12:00:00'), Date.parse('2026-01-15T11:00:00Z'));
  assert.equal(parseWarsawTime('2026-07-15 12:00:00'), Date.parse('2026-07-15T10:00:00Z'));
  // Summer time ends on 25 October 2026 at 03:00 local (01:00 UTC).
  assert.equal(parseWarsawTime('2026-10-25 01:00:00'), Date.parse('2026-10-24T23:00:00Z'));
  assert.equal(parseWarsawTime('2026-10-25 04:00:00'), Date.parse('2026-10-25T03:00:00Z'));
  // And starts on 29 March 2026 at 02:00 local.
  assert.equal(parseWarsawTime('2026-03-29 01:00:00'), Date.parse('2026-03-29T00:00:00Z'));
  assert.equal(parseWarsawTime('2026-03-29 04:00:00'), Date.parse('2026-03-29T02:00:00Z'));
  assert.equal(isSummerTime(Date.parse('2026-10-25T00:59:00Z')), true);
  assert.equal(isSummerTime(Date.parse('2026-10-25T01:00:00Z')), false);
  assert.equal(parseWarsawTime(null), null);
  assert.equal(parseWarsawTime('yesterday'), null);
});
