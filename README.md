# Norwegian Electricity Bill

Homey app for calculating electricity and grid costs in Norway. The app tracks consumption, pulls Nord Pool spot prices (now quarter-hour aware), and keeps grid tariffs in sync so automations can react to real-time costs.

## Overview
- Built with the Homey Apps SDK v3 and TypeScript.
- Provides flow cards for updating consumption, spot price, and grid configuration.
- Handles 15-minute Nord Pool slots, exposing slot metadata (`startsAt`, `endsAt`, `durationMinutes`) to downstream consumers.
- Calculates derived metrics such as total cost, grid capacity levels, and financial support.
- Ships with grid company tariff data and utilities in `data/` and `lib/`.

## Prerequisites
- Node.js 18.20.8 (matches the current Homey CLI baseline).
- Homey CLI (`npm install -g homey`) for validation and deployment.
- Access to a Homey Pro/Cloud environment if you plan to run or debug the app.

## Setup
1. Clone the repository and install dependencies with `npm install` (reinstall even if `node_modules/` is tracked to ensure a clean tree).
2. Run `npm run build` to compile TypeScript into `build/`.
3. Execute `npm test` to run the mocha suite; the `posttest` hook triggers `homey app validate`.
4. Use `homey app install --local` to side-load the build onto a development Homey when needed.

## Development Workflow
- Keep flow card logic inside `app.ts` and `drivers/UtilityCostsDevice/`.
- Add shared utilities to `lib/` and ensure corresponding tests live in `tests/`.
- Update tariff datasets under `data/` and document changes in `CHANGELOG.md`.
- Run `npm run lint` before raising pull requests; fix issues or disable rules sparingly.
- Localized strings reside in `locales/`; update all languages when modifying text.

## Project Structure
- `app.ts`: App bootstrap and flow card registration.
- `api.ts`: HTTP endpoints exposed to other Homey apps.
- `drivers/`: Device driver and capability handlers.
- `lib/`: Pricing logic, calculation utilities, and data loaders.
- `data/`: JSON datasets for grid and electricity tariffs.
- `tests/`: Mocha/Chai test suites executed via `ts-node`.
- `assets/`: Icons and imagery used by the app.

## Releasing
1. Bump the version in both `package.json` and `app.json`.
2. Document notable changes in `CHANGELOG.md`.
3. Run `npm run build`, `npm test`, and `homey app validate`.
4. Package and publish through the Homey developer portal, then tag the repository (`v<major.minor.patch>`).

## Additional Documentation
- `AGENT.md`: Guidance for AI assistants contributing to this codebase.
- `CHANGELOG.md`: Historical release notes.
- `CONTRIBUTING.md`: Contribution guidelines and code of conduct.

## License
Distributed under the ISC license. See `LICENSE` for details.
