// -----------------------------------------------------------------------------
// The GIOŚ public API (https://api.gios.gov.pl/pjp-api/v1/rest/), open, without
// key. Version 1 (2025) names every field in Polish: this module is the only
// place that knows them, and returns neutral objects to the rest of the code.
//
// Limits published by GIOŚ (https://powietrze.gios.gov.pl/pjp/content/api):
// 1500 requests per minute for the current data and the index, 2 per minute
// for the full station list — which is why the list is cached (src/catalog.js).
// -----------------------------------------------------------------------------

import { parseWarsawTime } from './time.js';

export const API_URL = 'https://api.gios.gov.pl/pjp-api/v1/rest';

const TIMEOUT_MS = 20_000;

const USER_AGENT = 'gladys-gios (+https://github.com/guim31/gladys-gios)';

/** Hourly measurements kept per sensor: the last value may still be missing. */
const DATA_PAGE_SIZE = 6;

/** Error code of a manual sensor (laboratory results, published weeks later). */
const MANUAL_SENSOR = 'API-ERR-100003';

/** The pollutants the integration publishes, by GIOŚ indicator code. */
export const POLLUTANT_BY_CODE = {
  'PM2.5': 'pm25',
  PM10: 'pm10',
  NO2: 'no2',
  O3: 'o3',
  SO2: 'so2',
  CO: 'co',
  C6H6: 'c6h6',
};

/** The pollutants of the index, as the index names them, and our keys. */
const INDEX_POLLUTANTS = { SO2: 'so2', NO2: 'no2', PM10: 'pm10', 'PM2.5': 'pm25', O3: 'o3' };

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, code?: string }} [details]
   */
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  /** True for a manual sensor, which never has current data. */
  get manual() {
    return this.code === MANUAL_SENSOR;
  }
}

/**
 * GET a path of the API, as JSON.
 * @param {string} path
 * @param {{ fetch?: typeof fetch }} [deps]
 */
async function getJson(path, { fetch: fetchImpl = globalThis.fetch } = {}) {
  let response;
  try {
    response = await fetchImpl(`${API_URL}${path}`, {
      headers: {
        accept: 'application/ld+json, application/json',
        'user-agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err.name === 'TimeoutError' ? 'timeout' : err.cause?.code || err.message;
    throw new ApiError(`GIOŚ API unreachable (${reason})`);
  }
  let body = null;
  try {
    body = await response.json();
  } catch {
    // An error page, or an empty body: the status says enough.
  }
  if (body && typeof body === 'object' && body.error_code) {
    throw new ApiError(`GIOŚ API: ${body.error_code}`, {
      status: response.status,
      code: body.error_code,
    });
  }
  if (!response.ok) {
    throw new ApiError(`GIOŚ API: HTTP ${response.status}`, { status: response.status });
  }
  if (!body || typeof body !== 'object') {
    throw new ApiError('GIOŚ API: unreadable answer', { status: response.status });
  }
  return body;
}

const toNumber = (value) => {
  const number = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : null;
};

/**
 * Every station of the network (two requests per minute at most: cache it).
 * @param {{ fetch?: typeof fetch }} [deps]
 * @returns {Promise<Array<{ id: string, code: string, name: string, city: string, lat: number|null, lon: number|null }>>}
 */
export async function fetchStations(deps) {
  const stations = [];
  for (let page = 0; page < 5; page += 1) {
    const body = await getJson(`/station/findAll?size=500&page=${page}`, deps);
    const list = body['Lista stacji pomiarowych'];
    if (!Array.isArray(list)) {
      throw new ApiError('GIOŚ API: no station list in the answer');
    }
    for (const item of list) {
      const id = toNumber(item['Identyfikator stacji']);
      if (id === null) {
        continue;
      }
      stations.push({
        id: String(id),
        code: String(item['Kod stacji'] ?? ''),
        name: String(item['Nazwa stacji'] ?? `#${id}`).trim(),
        city: String(item['Nazwa miasta'] ?? '').trim(),
        lat: toNumber(item['WGS84 φ N']),
        lon: toNumber(item['WGS84 λ E']),
      });
    }
    const pages = toNumber(body.totalPages) ?? 1;
    if (page + 1 >= pages) {
      break;
    }
  }
  return stations;
}

/**
 * The measuring positions of a station, for the pollutants we publish.
 * @param {string} stationId
 * @param {{ fetch?: typeof fetch }} [deps]
 * @returns {Promise<Array<{ id: string, pollutant: string }>>}
 */
export async function fetchSensors(stationId, deps) {
  const body = await getJson(`/station/sensors/${encodeURIComponent(stationId)}?size=100`, deps);
  const list = body['Lista stanowisk pomiarowych dla podanej stacji'];
  if (!Array.isArray(list)) {
    throw new ApiError('GIOŚ API: no sensor list in the answer');
  }
  return list
    .map((item) => ({
      id: String(toNumber(item['Identyfikator stanowiska']) ?? ''),
      pollutant: POLLUTANT_BY_CODE[item['Wskaźnik - kod']] ?? null,
    }))
    .filter((sensor) => sensor.id !== '' && sensor.pollutant);
}

/**
 * The last hourly measurement of a sensor (µg/m³), or null when the last
 * hours have none yet. A manual sensor throws an ApiError whose `manual` is true.
 * @param {string} sensorId
 * @param {{ fetch?: typeof fetch }} [deps]
 * @returns {Promise<{ value: number, at: number } | null>}
 */
export async function fetchLatest(sensorId, deps) {
  const body = await getJson(
    `/data/getData/${encodeURIComponent(sensorId)}?size=${DATA_PAGE_SIZE}`,
    deps,
  );
  const list = body['Lista danych pomiarowych'];
  if (!Array.isArray(list)) {
    throw new ApiError('GIOŚ API: no measurement list in the answer');
  }
  let latest = null;
  for (const item of list) {
    const value = toNumber(item['Wartość']);
    const at = parseWarsawTime(item['Data']);
    if (value !== null && at !== null && (!latest || at > latest.at)) {
      latest = { value, at };
    }
  }
  return latest;
}

/** The value of the first key matching a pattern (GIOŚ keys carry typos). */
function pick(object, pattern) {
  const key = Object.keys(object).find((candidate) => pattern.test(candidate));
  return key === undefined ? undefined : object[key];
}

/** An index level, 0 (very good) to 5 (very bad), or null ("no index", -1). */
function level(value) {
  const number = toNumber(value);
  return Number.isInteger(number) && number >= 0 && number <= 5 ? number : null;
}

/**
 * The Polish air quality index of a station, or null when GIOŚ has none.
 * @param {string} stationId
 * @param {{ fetch?: typeof fetch }} [deps]
 * @returns {Promise<{ level: number|null, calculatedAt: number|null, sourceAt: number|null, pollutants: Record<string, number> } | null>}
 */
export async function fetchIndex(stationId, deps) {
  const body = await getJson(`/aqindex/getIndex/${encodeURIComponent(stationId)}`, deps);
  const index = body.AqIndex;
  if (!index || typeof index !== 'object' || index['Identyfikator stacji pomiarowej'] == null) {
    return null;
  }
  const pollutants = {};
  for (const [code, key] of Object.entries(INDEX_POLLUTANTS)) {
    const escaped = code.replace('.', '\\.');
    const value = level(pick(index, new RegExp(`^Warto\\S* indeksu dla wska\\S* ${escaped}$`)));
    if (value !== null) {
      pollutants[key] = value;
    }
  }
  const valid = index['Status indeksu ogólnego dla stacji pomiarowej'] !== false;
  return {
    level: valid ? level(index['Wartość indeksu']) : null,
    calculatedAt: parseWarsawTime(index['Data wykonania obliczeń indeksu']),
    // The key of the overall source date is cut short by GIOŚ ("... wskaźnika st").
    sourceAt: parseWarsawTime(pick(index, /^Data danych \S+, z których .* st$/)),
    pollutants,
  };
}
