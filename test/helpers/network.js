// -----------------------------------------------------------------------------
// A simulated GIOŚ API, answering with the real responses recorded on
// 2026-10-24 around 06:15 Polish time (test/fixtures/gios): Warszawa
// Al. Niepodległości (530), Kraków ul. Bujaka (401), Gdańsk ul. Leczkowa (736).
// Tests never touch the real network.
// -----------------------------------------------------------------------------

import { existsSync, readFileSync } from 'node:fs';

const url = (name) => new URL(`../fixtures/gios/${name}.json`, import.meta.url);

/** A recorded answer, parsed (null when there is none). */
export function fixture(name) {
  return existsSync(url(name)) ? JSON.parse(readFileSync(url(name), 'utf8')) : null;
}

/** The stations of the fixtures. */
export const WARSZAWA = '530';
export const KRAKOW = '401';
export const GDANSK = '736';

/** The answer of getIndex for an unknown station (every field null). */
export function noIndex() {
  const body = fixture(`index-${WARSZAWA}`);
  body.AqIndex = Object.fromEntries(Object.keys(body.AqIndex).map((key) => [key, null]));
  return body;
}

/** The Warszawa index answer, at another level and computation time. */
export function indexAt(level, calculatedAt, station = WARSZAWA) {
  const body = fixture(`index-${station}`);
  body.AqIndex['Wartość indeksu'] = level;
  body.AqIndex['Data wykonania obliczeń indeksu'] = calculatedAt;
  for (const key of Object.keys(body.AqIndex)) {
    if (key.startsWith('Data danych')) {
      body.AqIndex[key] = calculatedAt.replace(/:\d\d:\d\d$/, ':00:00');
    }
  }
  return body;
}

/** Move every date of a data answer by some hours (a later reading). */
export function shiftData(body, hours) {
  const copy = structuredClone(body);
  for (const item of copy['Lista danych pomiarowych'] ?? []) {
    const at = new Date(`${item.Data.replace(' ', 'T')}Z`).getTime() + hours * 3_600_000;
    item.Data = new Date(at).toISOString().slice(0, 19).replace('T', ' ');
  }
  return copy;
}

/**
 * @param {object} [options]
 * @param {() => number} [options.now] the clock passed to the route functions
 */
export function createNetwork({ now = () => Date.now() } = {}) {
  const calls = [];
  const network = {
    calls,
    /** Overrides by station id / sensor id: a body, a function (now) => body, an Error, or { status }. */
    index: {},
    data: {},
    sensors: {},
    stations: null,
    /** The whole API unreachable. */
    down: false,
    fetch,
  };

  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/ld+json;charset=utf-8' },
    });

  function answer(route, fallback) {
    const value = typeof route === 'function' ? route(now()) : route;
    if (value instanceof Error) {
      throw value;
    }
    if (value && typeof value === 'object' && Object.keys(value).length === 1 && value.status) {
      return new Response('<html>error</html>', { status: value.status });
    }
    const body = value ?? fallback;
    return json(body, body?.error_code ? 400 : 200);
  }

  async function fetch(href) {
    const path = String(href).replace('https://api.gios.gov.pl/pjp-api/v1/rest', '');
    calls.push(path);
    if (network.down) {
      throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } });
    }
    let match;
    if (path.startsWith('/station/findAll')) {
      return answer(network.stations, fixture('stations'));
    }
    if ((match = /^\/station\/sensors\/(\d+)/.exec(path))) {
      const empty = { 'Lista stanowisk pomiarowych dla podanej stacji': [], totalPages: 0 };
      return answer(network.sensors[match[1]], fixture(`sensors-${match[1]}`) ?? empty);
    }
    if ((match = /^\/aqindex\/getIndex\/(\d+)/.exec(path))) {
      return answer(network.index[match[1]], fixture(`index-${match[1]}`) ?? noIndex());
    }
    if ((match = /^\/data\/getData\/(\d+)/.exec(path))) {
      return answer(network.data[match[1]], fixture(`data-${match[1]}`) ?? { status: 404 });
    }
    return new Response('not found', { status: 404 });
  }

  return network;
}
