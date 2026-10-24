// -----------------------------------------------------------------------------
// The "Air quality" widget: every content fits the core's vocabulary and
// budget (validateWidgetContent: 8 components, 2 texts), and every tile is
// bound to a feature the device really has.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWidgetContent, WIDGET_COLORS } from '@gladysassistant/integration-sdk';
import { createAll, createWorld, discovered } from './helpers/world.js';
import { GDANSK, KRAKOW, WARSZAWA, indexAt } from './helpers/network.js';
import { levelColor } from '../src/widgets.js';
import { TEXT } from '../src/i18n.js';

const LANGS = ['en', 'fr', 'de', 'es'];

async function world() {
  const w = await createWorld({
    config: { stations: [WARSZAWA, KRAKOW, GDANSK].join(',') },
    setup: (network) => {
      network.index[KRAKOW] = indexAt(4, '2026-10-24 06:12:00', KRAKOW);
    },
  });
  await createAll(w);
  return w;
}

async function content(w, settings, language) {
  const ack = await w.gladys.fake.widgetGet('air_quality', { settings, language });
  assert.equal(ack.success, true, ack.error);
  return ack.data.content;
}

/** Every device_feature of a content exists on a discovered device. */
function assertBound(w, widgetContent) {
  const known = new Set(
    w.gladys.fake.discoveredDevices.flatMap((d) => d.features.map((f) => f.external_id)),
  );
  for (const component of widgetContent.components) {
    if (component.device_feature) {
      assert.ok(known.has(component.device_feature), component.device_feature);
    }
  }
}

test('one station: four pollutant tiles, the level colored, the hour, the source', async () => {
  const w = await world();
  for (const lang of LANGS) {
    for (const id of [WARSZAWA, KRAKOW, GDANSK]) {
      const c = await content(w, { station: discovered(w, id).external_id }, lang);
      assert.deepEqual(validateWidgetContent(c), [], `${id} ${lang}`);
      assertBound(w, c);
    }
  }
  const c = await content(w, { station: discovered(w, GDANSK).external_id }, 'fr');
  assert.deepEqual(
    c.components.filter((x) => x.type === 'value').map((x) => x.label),
    ['PM2.5', 'PM10', 'NO₂', 'O₃'],
  );
  const status = c.components.find((x) => x.type === 'status');
  assert.deepEqual(status.items[0], {
    label: "Qualité de l'air",
    value: 'Bon',
    color: WIDGET_COLORS.SUCCESS,
  });
  assert.equal(status.items[1].value, 'il y a 1 h');
  assert.equal(c.components.at(-1).text, TEXT.source.fr);
});

test('every station: one row each, colored by level', async () => {
  const w = await world();
  const c = await content(w, {}, 'en');
  assert.deepEqual(validateWidgetContent(c), []);
  assert.deepEqual(
    c.components[0].items.map((item) => [item.label, item.value, item.color]),
    [
      ['GIOŚ Warszawa, Al. Niepodległości', 'Very good', WIDGET_COLORS.SUCCESS],
      ['GIOŚ Kraków, ul. Bujaka', 'Bad', WIDGET_COLORS.DANGER],
      ['GIOŚ Gdańsk, ul. Leczkowa', 'Good', WIDGET_COLORS.SUCCESS],
    ],
  );
});

test('stale data and an unknown station are said plainly', async () => {
  const w = await world();
  w.advance(5 * 3_600_000);
  const c = await content(w, {}, 'de');
  assert.equal(c.components[0].items[0].value, 'Veraltet (5 Std.)');
  assert.equal(c.components[0].items[0].color, WIDGET_COLORS.NEUTRAL);
  const gone = await content(w, { station: 'ext:test-integration:station:1' }, 'es');
  assert.equal(gone.components[0].text, TEXT.unknownStation.es);
  const empty = await createWorld({ config: { stations: WARSZAWA } });
  const none = await content(empty, {}, 'fr');
  assert.equal(none.components[0].text, TEXT.noStation.fr);
});

test('the colors of the six levels', () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5].map(levelColor),
    ['success', 'success', 'warning', 'warning', 'danger', 'danger'].map(
      (key) => WIDGET_COLORS[key.toUpperCase()],
    ),
  );
});
