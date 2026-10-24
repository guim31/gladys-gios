// -----------------------------------------------------------------------------
// Every text the integration produces, in the four languages of the Gladys
// interface: English, French, German ("du") and Spanish ("usted").
//
// The six levels of the Polish air quality index (Polski indeks jakości
// powietrza) are translated from their official Polish names: Bardzo dobry,
// Dobry, Umiarkowany, Dostateczny, Zły, Bardzo zły.
// -----------------------------------------------------------------------------

/** The index levels, 0 to 5, by stable key (scene filters and outputs). */
export const LEVEL_KEYS = ['very_good', 'good', 'moderate', 'sufficient', 'bad', 'very_bad'];

export const LEVELS = {
  very_good: { en: 'Very good', fr: 'Très bon', de: 'Sehr gut', es: 'Muy buena' },
  good: { en: 'Good', fr: 'Bon', de: 'Gut', es: 'Buena' },
  moderate: { en: 'Moderate', fr: 'Modéré', de: 'Mäßig', es: 'Moderada' },
  sufficient: { en: 'Sufficient', fr: 'Passable', de: 'Ausreichend', es: 'Suficiente' },
  bad: { en: 'Bad', fr: 'Mauvais', de: 'Schlecht', es: 'Mala' },
  very_bad: { en: 'Very bad', fr: 'Très mauvais', de: 'Sehr schlecht', es: 'Muy mala' },
};

/** Chemical formulas: the same in every language. */
export const FORMULAS = {
  pm25: 'PM2.5',
  pm10: 'PM10',
  no2: 'NO₂',
  o3: 'O₃',
  so2: 'SO₂',
  co: 'CO',
  c6h6: 'C₆H₆',
};

/** Feature names, by language (fixed when the device is added). */
export const NAMES = {
  en: {
    index: 'Air quality index',
    quality: 'Air quality',
    pm25: 'PM2.5',
    pm10: 'PM10',
    no2: 'Nitrogen dioxide (NO₂)',
    o3: 'Ozone (O₃)',
    so2: 'Sulphur dioxide (SO₂)',
    co: 'Carbon monoxide (CO)',
    c6h6: 'Benzene (C₆H₆)',
    age: 'Measurement age',
  },
  fr: {
    index: "Indice de qualité de l'air",
    quality: "Qualité de l'air",
    pm25: 'PM2.5',
    pm10: 'PM10',
    no2: "Dioxyde d'azote (NO₂)",
    o3: 'Ozone (O₃)',
    so2: 'Dioxyde de soufre (SO₂)',
    co: 'Monoxyde de carbone (CO)',
    c6h6: 'Benzène (C₆H₆)',
    age: 'Âge de la mesure',
  },
  de: {
    index: 'Luftqualitätsindex',
    quality: 'Luftqualität',
    pm25: 'PM2.5',
    pm10: 'PM10',
    no2: 'Stickstoffdioxid (NO₂)',
    o3: 'Ozon (O₃)',
    so2: 'Schwefeldioxid (SO₂)',
    co: 'Kohlenmonoxid (CO)',
    c6h6: 'Benzol (C₆H₆)',
    age: 'Alter der Messung',
  },
  es: {
    index: 'Índice de calidad del aire',
    quality: 'Calidad del aire',
    pm25: 'PM2.5',
    pm10: 'PM10',
    no2: 'Dióxido de nitrógeno (NO₂)',
    o3: 'Ozono (O₃)',
    so2: 'Dióxido de azufre (SO₂)',
    co: 'Monóxido de carbono (CO)',
    c6h6: 'Benceno (C₆H₆)',
    age: 'Antigüedad de la medición',
  },
};

/** Fixed texts. */
export const TEXT = {
  notConfigured: {
    en: 'No station yet: use "Find a station", then type its number.',
    fr: 'Aucune station : utilisez « Trouver une station », puis saisissez son numéro.',
    de: 'Noch keine Station: nutze „Station finden“ und gib dann ihre Nummer ein.',
    es: 'Ninguna estación: use «Buscar una estación» y escriba su número.',
  },
  apiUnreachable: {
    en: 'The GIOŚ API does not answer: the values are not updated.',
    fr: "L'API du GIOŚ ne répond pas : les valeurs ne sont plus mises à jour.",
    de: 'Die GIOŚ-API antwortet nicht: Die Werte werden nicht aktualisiert.',
    es: 'La API de GIOŚ no responde: los valores no se actualizan.',
  },
  initFailed: {
    en: 'The integration could not start: see the Logs tab.',
    fr: "L'intégration n'a pas pu démarrer : voir l'onglet Journaux.",
    de: 'Die Integration konnte nicht starten: siehe Reiter Protokolle.',
    es: 'La integración no pudo iniciarse: consulte la pestaña Registros.',
  },
  noReading: {
    en: 'No air quality reading yet.',
    fr: "Pas encore de relevé de la qualité de l'air.",
    de: 'Noch keine Messung der Luftqualität.',
    es: 'Todavía no hay lectura de la calidad del aire.',
  },
  noStation: {
    en: 'No station added to Gladys yet.',
    fr: 'Aucune station ajoutée à Gladys.',
    de: 'Noch keine Station zu Gladys hinzugefügt.',
    es: 'Ninguna estación añadida a Gladys.',
  },
  unknownStation: {
    en: 'This station is no longer read: check the configuration.',
    fr: "Cette station n'est plus lue : vérifiez la configuration.",
    de: 'Diese Station wird nicht mehr gelesen: prüfe die Konfiguration.',
    es: 'Esta estación ya no se lee: compruebe la configuración.',
  },
  nothingConfigured: {
    en: 'No station is configured.',
    fr: "Aucune station n'est configurée.",
    de: 'Keine Station ist konfiguriert.',
    es: 'No hay ninguna estación configurada.',
  },
  noHouse: {
    en: 'Type a name, or set the location of a house in Settings → Houses.',
    fr: 'Saisissez un nom, ou placez une maison dans Paramètres → Maisons.',
    de: 'Gib einen Namen ein oder lege den Standort eines Hauses unter Einstellungen → Zuhause fest.',
    es: 'Escriba un nombre, o defina la ubicación de una casa en Configuración → Viviendas.',
  },
  catalogUnavailable: {
    en: 'The list of the GIOŚ stations cannot be read now: try again in a minute.',
    fr: 'La liste des stations du GIOŚ est illisible pour le moment : réessayez dans une minute.',
    de: 'Die Liste der GIOŚ-Stationen ist gerade nicht lesbar: versuche es in einer Minute erneut.',
    es: 'La lista de estaciones de GIOŚ no se puede leer ahora: inténtelo de nuevo en un minuto.',
  },
  airQuality: {
    en: 'Air quality',
    fr: "Qualité de l'air",
    de: 'Luftqualität',
    es: 'Calidad del aire',
  },
  measured: { en: 'Measured', fr: 'Mesuré', de: 'Gemessen', es: 'Medido' },
  noData: { en: 'No data', fr: 'Pas de donnée', de: 'Keine Daten', es: 'Sin datos' },
  noIndex: { en: 'No index', fr: "Pas d'indice", de: 'Kein Index', es: 'Sin índice' },
  source: {
    en: 'Polish index · GIOŚ data, hourly averages',
    fr: 'Indice polonais · données GIOŚ, moyennes horaires',
    de: 'Polnischer Index · GIOŚ-Daten, Stundenmittel',
    es: 'Índice polaco · datos de GIOŚ, medias horarias',
  },
};

/** Texts built from values. */
export const MESSAGES = {
  /** "3 h ago", or "Outdated (2 d)" when stale. */
  measuredAgo(minutes, stale) {
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(minutes / 1440);
    const span =
      minutes < 60
        ? {
            en: `${minutes} min`,
            fr: `${minutes} min`,
            de: `${minutes} Min.`,
            es: `${minutes} min`,
          }
        : minutes < 2880
          ? { en: `${hours} h`, fr: `${hours} h`, de: `${hours} Std.`, es: `${hours} h` }
          : { en: `${days} d`, fr: `${days} j`, de: `${days} T.`, es: `${days} d` };
    if (stale) {
      return {
        en: `Outdated (${span.en})`,
        fr: `Périmée (${span.fr})`,
        de: `Veraltet (${span.de})`,
        es: `Desactualizada (${span.es})`,
      };
    }
    return {
      en: `${span.en} ago`,
      fr: `il y a ${span.fr}`,
      de: `vor ${span.de}`,
      es: `hace ${span.es}`,
    };
  },

  /**
   * "Warszawa, Al. Niepodległości: Good · PM2.5 12.7 µg/m³ · PM10 17.9 µg/m³".
   * @param {{ station: string, level: string|null, values: Record<string, number> }} options
   */
  summary({ station, level, values }) {
    const parts = ['pm25', 'pm10', 'no2', 'o3']
      .filter((key) => typeof values[key] === 'number')
      .map((key) => `${FORMULAS[key]} ${formatNumber(values[key])} µg/m³`);
    return Object.fromEntries(
      ['en', 'fr', 'de', 'es'].map((lang) => {
        const label = level ? LEVELS[level][lang] : TEXT.noIndex[lang];
        return [lang, [`${station}: ${label}`, ...parts].join(' · ')];
      }),
    );
  },

  /** An error thrown to Gladys: one text, the four languages joined. */
  thrown(text) {
    return ['en', 'fr', 'de', 'es'].map((lang) => text[lang]).join(' / ');
  },

  /** One line of the "Check the stations" report. */
  checkStation({ id, name, level, minutes, pollutants = [], error, unknown }) {
    const head = `#${id} ${name ?? ''}`.trim();
    if (unknown) {
      return {
        en: `${head}: not a GIOŚ station (see "Find a station")`,
        fr: `${head} : pas une station du GIOŚ (voir « Trouver une station »)`,
        de: `${head}: keine GIOŚ-Station (siehe „Station finden“)`,
        es: `${head}: no es una estación de GIOŚ (vea «Buscar una estación»)`,
      };
    }
    if (error) {
      return {
        en: `${head}: error (${error})`,
        fr: `${head} : erreur (${error})`,
        de: `${head}: Fehler (${error})`,
        es: `${head}: error (${error})`,
      };
    }
    const list = pollutants.map((key) => FORMULAS[key]).join(', ') || '-';
    const ago = minutes === null || minutes === undefined ? null : MESSAGES.measuredAgo(minutes);
    const out = {};
    for (const lang of ['en', 'fr', 'de', 'es']) {
      const label = level ? LEVELS[level][lang] : TEXT.noIndex[lang];
      const colon = lang === 'fr' ? ' :' : ':';
      out[lang] = `${head}${colon} ${label}, ${list}${ago ? ` (${ago[lang]})` : ''}`;
    }
    return out;
  },

  invalidIds(ids) {
    const list = ids.join(', ');
    return {
      en: `Ignored, not station numbers: ${list}`,
      fr: `Ignorés, ce ne sont pas des numéros de station : ${list}`,
      de: `Ignoriert, keine Stationsnummern: ${list}`,
      es: `Ignorados, no son números de estación: ${list}`,
    };
  },

  tooManyIds(max) {
    return {
      en: `Only the first ${max} stations are read.`,
      fr: `Seules les ${max} premières stations sont lues.`,
      de: `Nur die ersten ${max} Stationen werden gelesen.`,
      es: `Solo se leen las ${max} primeras estaciones.`,
    };
  },

  /**
   * The result of "Find a station".
   * @param {{ query: string, house?: string, stations: Array<{ id: string, name: string, distanceKm?: number }>, more: number }} options
   */
  found({ query, house, stations, more }) {
    const where = query
      ? { en: `"${query}"`, fr: `« ${query} »`, de: `„${query}“`, es: `«${query}»` }
      : {
          en: `near ${house}`,
          fr: `autour de ${house}`,
          de: `in der Nähe von ${house}`,
          es: `cerca de ${house}`,
        };
    if (stations.length === 0) {
      return {
        en: `No GIOŚ station for ${where.en}.`,
        fr: `Aucune station du GIOŚ pour ${where.fr}.`,
        de: `Keine GIOŚ-Station für ${where.de}.`,
        es: `Ninguna estación de GIOŚ para ${where.es}.`,
      };
    }
    const lines = stations.map(
      (station) =>
        `#${station.id} ${station.name}${
          station.distanceKm === undefined ? '' : ` (${formatNumber(station.distanceKm)} km)`
        }`,
    );
    const head = {
      en: `GIOŚ stations for ${where.en}, to type in "Stations":`,
      fr: `Stations du GIOŚ pour ${where.fr}, à saisir dans « Stations » :`,
      de: `GIOŚ-Stationen für ${where.de}, in „Stationen“ einzutragen:`,
      es: `Estaciones de GIOŚ para ${where.es}, para escribir en «Estaciones»:`,
    };
    const tail = more
      ? {
          en: `…and ${more} more: refine the search.`,
          fr: `…et ${more} autres : affinez la recherche.`,
          de: `…und ${more} weitere: verfeinere die Suche.`,
          es: `…y ${more} más: afine la búsqueda.`,
        }
      : null;
    return Object.fromEntries(
      ['en', 'fr', 'de', 'es'].map((lang) => [
        lang,
        [head[lang], ...lines, ...(tail ? [tail[lang]] : [])].join('\n'),
      ]),
    );
  },
};

/** A number with one decimal at most, as GIOŚ gives them. */
export function formatNumber(value) {
  return String(Math.round(value * 10) / 10);
}
