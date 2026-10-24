// -----------------------------------------------------------------------------
// The buttons of the Configuration screen (manifest `actions`).
//
//   find_station   : the GIOŚ stations matching a name, or the nearest to a
//                    house of Gladys (its location, `location: true` in the
//                    manifest), with their number — to type in "Stations".
//   check_stations : what each configured station answers right now.
// -----------------------------------------------------------------------------

import { searchStations } from './catalog.js';
import { MESSAGES, TEXT } from './i18n.js';
import { pollutantsOf } from './devices.js';

export const ACTION = {
  FIND_STATION: 'find_station',
  CHECK_STATIONS: 'check_stations',
};

/** The search lists this many stations at most (the message stays readable). */
const MAX_LISTED = 8;

/**
 * @param {object} gladys
 * @param {import('./hub.js').Hub} hub
 * @param {{ query?: string, house?: string }} fields
 */
export async function findStation(gladys, hub, fields) {
  const query = String(fields.query ?? '').trim();
  let origin;
  let houseName;
  if (fields.house || !query) {
    const houses = (await gladys.getHouses()).filter(
      (house) => typeof house.latitude === 'number' && typeof house.longitude === 'number',
    );
    const house = fields.house
      ? houses.find((candidate) => candidate.selector === fields.house)
      : houses[0];
    if (!house && !query) {
      throw new Error(MESSAGES.thrown(TEXT.noHouse));
    }
    if (house) {
      origin = { lat: house.latitude, lon: house.longitude };
      houseName = house.name;
    }
  }
  let stations;
  try {
    stations = await hub.catalog.ensure();
  } catch {
    throw new Error(MESSAGES.thrown(TEXT.catalogUnavailable));
  }
  await hub.save();
  const found = searchStations(stations, { query, origin });
  return MESSAGES.found({
    query,
    house: houseName,
    stations: found.slice(0, MAX_LISTED),
    more: Math.max(0, found.length - MAX_LISTED),
  });
}

/**
 * Read every configured station (unless read in the last minute) and report.
 * @param {import('./hub.js').Hub} hub
 * @param {ReturnType<import('./poller.js').createPoller>} poller
 * @param {object} config the normalized config
 */
export async function checkStations(hub, poller, config) {
  const ids = hub.units(config);
  if (ids.length === 0) {
    return TEXT.nothingConfigured;
  }
  await poller.refreshNow(ids, { maxAgeMs: 60_000 });
  const lines = ids.map((id) => {
    const record = hub.records.get(id);
    const result = hub.lastResults.get(id);
    return MESSAGES.checkStation({
      id,
      name: record?.name,
      level: hub.indexOf(record)?.key ?? null,
      minutes: hub.ageMinutes(record),
      pollutants: record ? pollutantsOf(record) : [],
      error: result && !result.ok && !result.unknown ? result.error : null,
      unknown: result?.unknown === true,
    });
  });
  if (config.invalidStationIds.length > 0) {
    lines.push(MESSAGES.invalidIds(config.invalidStationIds));
  }
  if (config.droppedStationIds.length > 0) {
    lines.push(MESSAGES.tooManyIds(config.stationIds.length));
  }
  return Object.fromEntries(
    Object.keys(lines[0]).map((lang) => [lang, lines.map((line) => line[lang]).join('\n')]),
  );
}
