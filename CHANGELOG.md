# Changelog

All notable changes to this integration are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [semantic versioning](https://semver.org/).

Describe each change under `## [Unreleased]` as you make it. The Release
workflow moves that section under the version it ships, and the section becomes
the notes of the version's GitHub Release.

## [Unreleased]

### Changed

- The store shows the integration to users in Poland only (`countries`), which
  needs Gladys 5.3.0 or later.

## [1.0.0] - 2026-10-24

### Added

- GIOŚ stations, the official Polish air quality network, read through the
  open GIOŚ API (no account): one device per station with the Polish air
  quality index (0 to 5), its level as a word, the pollutants the station
  measures (PM2.5, PM10, NO₂, O₃, SO₂, CO, benzene) and the age of the data.
- "Find a station" button: the stations by name or city, or the nearest to a
  Gladys house, with their number and distance.
- "Check the stations" button: what each configured station answers now.
- "GIOŚ air quality" dashboard widget, scene triggers "air quality degraded"
  and "back to normal", scene action "get the air quality".
- Texts and documentation in English, French, German and Spanish.

[Unreleased]: https://github.com/guim31/gladys-gios/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/guim31/gladys-gios/releases/tag/v1.0.0
