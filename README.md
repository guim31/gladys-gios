# GIOŚ for Gladys Assistant

External integration for [Gladys Assistant](https://gladysassistant.com) that
brings the air quality measured by the official stations of
[GIOŚ](https://powietrze.gios.gov.pl), the Polish Chief Inspectorate of
Environmental Protection, into Gladys: the Polish air quality index and the
pollutants, station by station, hour by hour.

This integration is **not affiliated with GIOŚ**.

Looking for a model-based air quality anywhere in the world? See
[`prohand/gladys-airquality`](https://github.com/prohand/gladys-airquality)
(Copernicus CAMS). Here: the measurements of the official Polish stations.
Citizen sensors: [`guim31/gladys-sensor-community`](https://github.com/guim31/gladys-sensor-community).

## What it does

- **Stations** of the GIOŚ network by their number, through the open GIOŚ API
  (`api.gios.gov.pl`): no account, no key. A **Find a station** button
  searches the station list by name or city (accents optional), or lists the
  nearest stations to the location of a Gladys house, with their distance.
- **One device per station**: the Polish air quality index (0 very good to 5
  very bad) and its level as a word, the pollutants the station measures
  automatically (PM2.5, PM10, NO₂, O₃, SO₂, CO, benzene, in µg/m³) and the age
  of the data. Values older than 3 hours are not published as current.
- A **GIOŚ air quality** dashboard widget (index level colored, pollutant
  tiles), two scene triggers, **air quality degraded** (the index rises to
  "moderate" or worse, the levels picked as filters) and **back to normal**,
  and a scene action **Get the air quality** (one station or the worst one,
  with a sentence ready for a notification).

Read only. Tested against the real API (Warszawa, Kraków, Gdańsk): the test
fixtures are its recorded answers.

The user documentation, in [English](docs/en.md), [French](docs/fr.md),
[German](docs/de.md) and [Spanish](docs/es.md), is re-hosted by Gladys behind
the **Documentation** link of the Configuration screen.

## Requirements

- Gladys Assistant **5.3.0** or later (the store shows the integration to
  users in Poland, a 5.3 field; the station search uses the house picker of
  5.2.0, the widget and the scene cards need 5.1).
- Internet access to `api.gios.gov.pl`.

## Installation

In Gladys, open **Integrations → Install from GitHub** and enter
`https://github.com/guim31/gladys-gios`. Then fill the Configuration tab: see
[the documentation](docs/en.md#configuration).

## Respect of the API

GIOŚ publishes its [limits](https://powietrze.gios.gov.pl/pjp/content/api):
1500 requests per minute on the current data and the index, 2 per minute on
the station list. The integration:

- reads a station every 30 minutes (or every hour), 10 stations at most, one
  after the other: the index, then one request per pollutant;
- reads the station list once a day at most, and keeps it under `/data`;
- reads only the stations whose device was added to Gladys (and, once, the
  ones it does not know yet, to list them in the Discovery tab);
- skips the manual sensors (laboratory results published weeks later), which
  the API answers with an error, until the next daily sensor list;
- sends a `User-Agent` naming the integration and this repository.

## Limits

- Hourly averages, published a little after each hour: the last hour is often
  still missing, the values lag by 1 to 2 hours.
- Gladys has no µg/m³ category for CO and benzene: they are published as
  `unknown` features with their unit, named by their formula.
- NO, NOx and the heavy metals of the PM10 (manual) are left out.

## Development

```bash
npm install
npm run format:check   # Prettier
npm run lint           # ESLint
npm test               # node --test, against the SDK's fake Gladys
```

The tests never touch the network: they run on the answers of the GIOŚ API
recorded on 24 October 2026 (`test/fixtures/gios`). The architecture and the
rules of the project are in [`CLAUDE.md`](CLAUDE.md).

## Credits

- [GIOŚ](https://powietrze.gios.gov.pl) (Główny Inspektorat Ochrony
  Środowiska) for the measuring network, the Polish air quality index and the
  open API. The data are used as published.
- The Home Assistant [`gios` integration](https://www.home-assistant.io/integrations/gios/)
  (Apache-2.0) and the [`gios`](https://github.com/bieniu/gios) library by
  Maciej Bieniek (Apache-2.0): the API usage and the index levels, read for
  reference, nothing copied.
- The logo on the cover is the GIOŚ logo, from
  [powietrze.gios.gov.pl](https://powietrze.gios.gov.pl); it only names the
  data source.
- Built from the official
  [JavaScript template](https://github.com/GladysAssistant/integration-template-js)
  and SDK [`@gladysassistant/integration-sdk`](https://github.com/GladysAssistant/integration-sdk-js).

## License

[Apache-2.0](LICENSE)
