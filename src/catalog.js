// -----------------------------------------------------------------------------
// The list of the GIOŚ stations: names and coordinates, for the device names
// and the "Find a station" button. GIOŚ allows 2 requests per minute on it and
// it barely moves: it is read at most once a day, kept under /data with the
// rest (src/hub.js), and a failed read keeps the previous list.
// -----------------------------------------------------------------------------

import { fetchStations } from './api.js';

/** The list is read again after this age. */
export const CATALOG_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** After a failed read, the next attempt waits this long (the API allows 2 per minute). */
const RETRY_MS = 10 * 60 * 1000;

export class Catalog {
  /**
   * @param {object} options
   * @param {{ fetch?: typeof fetch }} [options.deps]
   * @param {() => number} [options.now]
   */
  constructor({ deps = {}, now = () => Date.now() } = {}) {
    this.deps = deps;
    this.now = now;
    this.stations = [];
    this.fetchedAt = 0;
    this.failedAt = 0;
    this.lastError = null;
    this.loading = null;
    /** Set when a new list must be saved under /data. */
    this.changed = false;
  }

  /** Restore the list saved under /data. */
  restore(saved) {
    if (saved && Array.isArray(saved.stations) && typeof saved.fetchedAt === 'number') {
      this.stations = saved.stations.filter((station) => station && station.id);
      this.fetchedAt = saved.fetchedAt;
    }
  }

  /** What is saved under /data. */
  snapshot() {
    return { stations: this.stations, fetchedAt: this.fetchedAt };
  }

  /**
   * The list, read again when older than a day (force: older than a minute,
   * the user asked). A failed read keeps the previous list, and throws only
   * when there is none.
   */
  async ensure({ force = false } = {}) {
    const age = this.now() - this.fetchedAt;
    const fresh = this.stations.length > 0 && age < (force ? 60_000 : CATALOG_MAX_AGE_MS);
    // After a failure, wait before asking again (GIOŚ allows 2 requests per
    // minute on the list), whoever asks: every station read calls this.
    const waiting = this.failedAt > 0 && this.now() - this.failedAt < (force ? 60_000 : RETRY_MS);
    if (fresh || (waiting && this.stations.length > 0)) {
      return this.stations;
    }
    if (waiting) {
      throw this.lastError;
    }
    this.loading ??= fetchStations(this.deps)
      .then((stations) => {
        this.stations = stations;
        this.fetchedAt = this.now();
        this.failedAt = 0;
        this.changed = true;
      })
      .catch((err) => {
        this.failedAt = this.now();
        this.lastError = err;
        if (this.stations.length === 0) {
          throw err;
        }
      })
      .finally(() => {
        this.loading = null;
      });
    await this.loading;
    return this.stations;
  }

  /** @param {string} id */
  byId(id) {
    return this.stations.find((station) => station.id === String(id));
  }
}

/** Lower case, without diacritics (ł is not a combining mark). */
export function fold(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase();
}

/** Distance between two points, in km (haversine). */
export function distanceKm(a, b) {
  const rad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * The stations matching a search: every word of the query in the name or the
 * city (accents ignored), sorted by distance to the house when one is given,
 * else by name.
 * @param {object[]} stations
 * @param {{ query?: string, origin?: { lat: number, lon: number } }} search
 * @returns {Array<object & { distanceKm?: number }>}
 */
export function searchStations(stations, { query = '', origin } = {}) {
  const words = fold(query)
    .split(/[\s,]+/)
    .filter(Boolean);
  const found = stations
    .filter((station) => {
      const text = fold(`${station.name} ${station.city}`);
      return words.every((word) => text.includes(word));
    })
    .map((station) =>
      origin && station.lat !== null && station.lon !== null
        ? { ...station, distanceKm: distanceKm(origin, station) }
        : { ...station },
    );
  return found.sort((a, b) =>
    origin
      ? (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
      : a.name.localeCompare(b.name, 'pl'),
  );
}
