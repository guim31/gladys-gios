// -----------------------------------------------------------------------------
// The container's own polling timer.
//
// GIOŚ publishes hourly averages: the stations are read every 30 or 60
// minutes (`refresh_minutes`), far beyond the 60 s the core can schedule, so
// the devices are published with `should_poll: false` and the container reads
// them by itself. One timer ticks every minute and reads the stations that
// are due; a station read less than 90 % of its period ago is skipped,
// whoever asks (timer, core onPoll, a device just added).
//
// What is read: the stations whose device the user added to Gladys, and the
// stations never read yet (their first read tells what the device measures,
// for the Discovery tab). One station after the other: a public service, no
// burst.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { periodMs } from './config.js';

const logger = createLogger({ name: 'poller' });

/** The timer's tick. */
export const TICK_MS = 60_000;

/** A station read less than this share of its period ago is not read again. */
const MIN_GAP = 0.9;

/**
 * @param {object} options
 * @param {object} options.gladys
 * @param {import('./hub.js').Hub} options.hub
 * @param {() => object} options.getConfig
 * @param {() => Promise<void>} options.afterCycle publishes what the reads changed
 * @param {boolean} [options.timers] run the periodic timer (tests may turn it off)
 * @param {() => number} [options.now]
 */
export function createPoller({
  gladys,
  hub,
  getConfig,
  afterCycle = async () => {},
  timers = true,
  now = () => Date.now(),
}) {
  /** When each station was last read (start of the read), by id. */
  const lastReadAt = new Map();
  /** Reads in progress, by id: a second caller waits for the same one. */
  const inFlight = new Map();
  let timer = null;
  let stopped = true;

  /** The stations to read: added to Gladys, or never read yet. */
  function wantedStations(config) {
    return hub.units(config).filter((id) => {
      const record = hub.records.get(id);
      return !hub.isKnown(record) || hub.isCreated(record);
    });
  }

  /**
   * Read one station, unless it was read less than MIN_GAP of its period ago
   * (force: read anyway, after the read in progress if any).
   * @returns {Promise<boolean>} true when the station was read
   */
  async function readStation(id, { force = false } = {}) {
    let running = inFlight.get(id);
    while (running && force) {
      await running.catch(() => {});
      running = inFlight.get(id);
    }
    if (running) {
      await running.catch(() => {});
      return false;
    }
    const last = lastReadAt.get(id);
    if (!force && last !== undefined && now() - last < periodMs(getConfig()) * MIN_GAP) {
      return false;
    }
    lastReadAt.set(id, now());
    const run = hub.refresh(id);
    inFlight.set(id, run);
    try {
      await run;
    } catch (err) {
      // Logged once by the hub's issue log; the next read retries.
      logger.debug(`#${id}: ${err.message}`);
    } finally {
      inFlight.delete(id);
    }
    return true;
  }

  /** One cycle: the wanted stations, in sequence, then the publication. */
  async function cycle({ force = false, ids } = {}) {
    if (gladys.connected === false) {
      logger.debug('Gladys unreachable: cycle skipped');
      return;
    }
    let read = false;
    for (const id of ids ?? wantedStations(getConfig())) {
      read = (await readStation(id, { force })) || read;
    }
    // A restart publishes even without a read (devices and states from /data).
    if (read || (force && ids === undefined)) {
      await afterCycle();
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = null;
    if (!timers || stopped) {
      return;
    }
    timer = setTimeout(async () => {
      timer = null;
      try {
        await cycle();
      } catch (err) {
        logger.error(`Polling cycle failed (${err.message})`);
      } finally {
        schedule();
      }
    }, TICK_MS);
  }

  return {
    /** (Re)start: read every wanted station now, then on the timer. */
    async restart() {
      stopped = false;
      schedule();
      await cycle({ force: true });
    },

    /** One timer cycle (tests). */
    cycle,

    /**
     * The core's onPoll, a fallback only (the devices do not ask for it):
     * read the device's station unless it was read recently.
     * @param {{ external_id: string }} device
     */
    async pollFromCore(device) {
      const record = hub.recordByDevice(device.external_id);
      if (!record) {
        logger.debug(`onPoll ignored (not a configured station): ${device.external_id}`);
        return;
      }
      await cycle({ ids: [record.id] });
    },

    /**
     * Read some stations now (a device just added, the check action), unless
     * they were read less than `maxAgeMs` ago.
     */
    async refreshNow(ids, { maxAgeMs = 0 } = {}) {
      const due = ids.filter((id) => {
        const last = lastReadAt.get(id);
        return last === undefined || now() - last >= maxAgeMs;
      });
      await cycle({ force: true, ids: due });
    },

    /** When a station was last read, undefined if never. */
    lastReadAt: (id) => lastReadAt.get(id),

    stop() {
      stopped = true;
      clearTimeout(timer);
      timer = null;
    },
  };
}
