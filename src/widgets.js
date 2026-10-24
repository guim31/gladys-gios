// -----------------------------------------------------------------------------
// The "Air quality" dashboard widget (Gladys 5.1+).
//
// With a station chosen in its settings: live tiles of its main pollutants
// (bound to the device features, so they follow every state), the index level
// colored by its band, and the hour of the data. Without one: one row per
// added station, its level colored.
//
// The content is built from what the integration already read: showing the
// widget never calls the API. The core caches it per (settings, language,
// units), so the texts are localized in the language it asks for.
// -----------------------------------------------------------------------------

import { WIDGET_COLORS } from '@gladysassistant/integration-sdk';
import { FORMULAS, LEVELS, MESSAGES, TEXT } from './i18n.js';
import { idsOf, pollutantsOf } from './devices.js';
import { LANGUAGES } from './config.js';

export const WIDGET_KEY = 'air_quality';

/** Seconds the core keeps a content: the data move hourly. */
const TTL_SECONDS = 300;

/** Tiles of the single-station view, 4 at most, the first measured ones. */
const MAX_TILES = 4;

/** Rows of the all-stations view. */
const MAX_ROWS = 10;

/** Color of an index level: very good/good green, moderate/sufficient orange, worse red. */
export function levelColor(level) {
  if (level <= 1) {
    return WIDGET_COLORS.SUCCESS;
  }
  return level <= 3 ? WIDGET_COLORS.WARNING : WIDGET_COLORS.DANGER;
}

const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** The level row of a station: its label and color, neutral when stale. */
function levelItem(hub, record, label, language) {
  const minutes = hub.ageMinutes(record);
  if (minutes === null) {
    return { label, value: TEXT.noData[language], color: WIDGET_COLORS.NEUTRAL };
  }
  if (hub.isStale(record)) {
    const value = MESSAGES.measuredAgo(minutes, true)[language];
    return { label, value: clip(value, 40), color: WIDGET_COLORS.NEUTRAL, icon: 'clock' };
  }
  const index = hub.indexOf(record);
  if (!index) {
    return { label, value: TEXT.noIndex[language], color: WIDGET_COLORS.NEUTRAL };
  }
  return { label, value: LEVELS[index.key][language], color: levelColor(index.level) };
}

/**
 * The widget content.
 * @param {object} options
 * @param {import('./hub.js').Hub} options.hub
 * @param {object} options.gladys
 * @param {{ station?: string }} [options.settings]
 * @param {string} [options.language]
 */
export function buildAirQualityContent({ hub, gladys, settings = {}, language = 'en' }) {
  const lang = LANGUAGES.includes(language) ? language : 'en';
  const caption = { type: 'text', variant: 'caption', text: TEXT.source[lang] };

  if (settings.station) {
    const record = hub.recordByDevice(settings.station);
    if (!record) {
      return {
        ttl_seconds: TTL_SECONDS,
        components: [{ type: 'text', text: TEXT.unknownStation[lang] }],
      };
    }
    const ids = idsOf(gladys, record.id);
    const tiles = pollutantsOf(record)
      .slice(0, MAX_TILES)
      .map((key) => ({ type: 'value', label: FORMULAS[key], device_feature: ids.feature(key) }));
    const minutes = hub.ageMinutes(record);
    const items = [levelItem(hub, record, TEXT.airQuality[lang], lang)];
    if (minutes !== null && !hub.isStale(record)) {
      items.push({
        label: TEXT.measured[lang],
        value: clip(MESSAGES.measuredAgo(minutes, false)[lang], 40),
        color: WIDGET_COLORS.NEUTRAL,
        icon: 'clock',
      });
    }
    return {
      ttl_seconds: TTL_SECONDS,
      components: [...tiles, { type: 'status', items }, caption],
    };
  }

  const created = hub.configuredRecords().filter((record) => hub.isCreated(record));
  if (created.length === 0) {
    return {
      ttl_seconds: TTL_SECONDS,
      components: [{ type: 'text', text: TEXT.noStation[lang] }],
    };
  }
  return {
    ttl_seconds: TTL_SECONDS,
    components: [
      {
        type: 'status',
        items: created
          .slice(0, MAX_ROWS)
          .map((record) => levelItem(hub, record, clip(hub.nameOf(record), 40), lang)),
      },
      caption,
    ],
  };
}
