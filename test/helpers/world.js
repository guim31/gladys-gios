// -----------------------------------------------------------------------------
// A complete test world: the SDK's fake Gladys, the simulated GIOŚ API, a
// store in memory, a clock, and the integration wired on top.
// -----------------------------------------------------------------------------

import { createFakeGladys } from '@gladysassistant/integration-sdk/testing';
import { registerHandlers } from '../../src/app.js';
import { MemoryStore } from '../../src/store.js';
import { createNetwork } from './network.js';

// The integration logs its lifecycle; keep the test output readable
// (LOG_LEVEL is read on every log call). LOG_LEVEL=debug npm test shows them.
process.env.LOG_LEVEL ??= 'silent';

/** The test clock starts here: 06:20 in Warsaw, just after the fixtures' index. */
export const START = Date.parse('2026-10-24T04:20:00Z');

/**
 * @param {object} [options]
 * @param {object} [options.config] raw integration config
 * @param {Array} [options.devices] devices already created in Gladys
 * @param {Array} [options.houses] houses of Gladys
 * @param {object} [options.store] persistence (MemoryStore by default)
 * @param {(network: object) => void} [options.setup] prepares the network before connecting
 * @param {boolean} [options.connect]
 */
export async function createWorld({
  config = {},
  devices = [],
  houses = [],
  store = new MemoryStore(),
  setup = () => {},
  connect = true,
} = {}) {
  const clock = { now: START };
  const now = () => clock.now;
  const network = createNetwork({ now });
  setup(network);
  const gladys = createFakeGladys({ config, devices, houses });
  const app = registerHandlers(gladys, { store, fetch: network.fetch, timers: false, now });
  if (connect) {
    await gladys.connect();
  }
  return {
    gladys,
    app,
    network,
    store,
    clock,
    hub: app.hub,
    /** Move the clock forward. */
    advance(ms) {
      clock.now += ms;
    },
  };
}

/** Add every discovered device to Gladys, as the user would. */
export async function createAll(world) {
  for (const device of world.gladys.fake.discoveredDevices) {
    await world.gladys.fake.deviceCreated(device);
  }
}

/** The discovered device of a station. */
export function discovered(world, stationId) {
  const id = world.gladys.externalIds('station', stationId).device;
  return world.gladys.fake.discoveredDevices.find((device) => device.external_id === id);
}

/** The external id of a feature of a station. */
export function featureId(world, stationId, key) {
  return world.gladys.externalIds('station', stationId).feature(key);
}
