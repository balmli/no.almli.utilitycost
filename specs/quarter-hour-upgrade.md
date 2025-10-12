# Quarter-Hour Nord Pool Support

## Summary
`@balmli/homey-utility-prices` now delivers 15-minute slots (with `startsAt`, `endsAt`, `durationMinutes`) and exposes configurable fetch cadence. This app assumes 24 hourly prices when scheduling Nord Pool fetches, when returning price series to the UI, and inside a few calculations/tests. We need to adopt the new package API so the device keeps working once 96 quarter-hour prices are returned.

## Impacted Areas
- `drivers/UtilityCosts/device.ts` price fetcher configuration, sync-time storage, and the `getPrices()` transformation.
- `lib/DeviceHandler.ts` spot-price averaging and any logic that stores or derives values from price series.
- Tests/stubs under `tests/` that fabricate hourly `NordpoolPrice` objects.
- Documentation/changelog communicating the new behaviour.

## Implementation Outline
1. **PriceFetcher scheduling**
   - Call `priceFetcher.setFetchIntervalMinutes(15)` (or a configurable value) in `setFetcherOptions`.
   - Update the randomised `syncTime` to stay within the fetch interval (`Math.round(Math.random() * 900)`).
   - Keep `gridPriceFetcher` hourly unless the grid package changes; document why the modulo remains `3600` or adjust if required.

2. **Price event handling**
   - Update `pricesChangedEvent` to pass the full `NordpoolPrice` into `DeviceHandler` so we can reference `startsAt`, `endsAt`, or `durationMinutes` later.
   - Persist `startsAt`, `endsAt`, and `durationMinutes` anywhere we store price entries (e.g., Homey store via `PricesFetchClient`).

3. **Device calculations**
   - In `DeviceHandler.spotPricesCalculation`, compute the daily average using a duration-weighted approach (`sum(price * durationMinutes) / sum(durationMinutes)`) to handle mixed slot sizes (DST, legacy hourly data).
   - Ensure `calcGridPrice` and related helpers receive a `Moment` derived from `startsAt` for each slot.
   - Verify any other utilities (e.g., consumption peak tracking) do not assume one update per hour; update logging or thresholds if they should react to four updates per hour.

4. **UI price series (`getPrices`)**
   - When mapping Nord Pool prices, expose `durationMinutes` (and optionally `endsAt`) so the front-end can render quarter-hour bars.
   - For fixed-price mode, emit synthetic quarter-hour entries (96 per day) instead of 24 hourly entries to keep chart density consistent.

5. **TypeScript and tests**
   - Align local typings with the new `NordpoolPrice` shape; update stubs in `tests/device_handler_1.ts` (and any other fixtures) to include `durationMinutes`/`endsAt`.
   - Add a new test case that feeds a 96-slot day and asserts the weighted daily average plus downstream calculations remain correct.

6. **Docs & release notes**
   - Update `README`/settings descriptions to mention quarter-hour fetching and the new cadence.
   - Note the fetch interval change and the increased number of priceChanged events in `CHANGELOG.md`.

## Testing
- Run existing unit tests and extend them with quarter-hour datasets covering:
  - `DeviceHandler.spotPricesCalculation` weighted average.
  - `pricesChangedEvent` path ensuring store values don’t regress when updates arrive four times per hour.
- Perform an integration run (simulated Homey device) that:
  - Boots with random `syncTime` and confirms `PriceFetcher` schedules every 15 minutes.
  - Confirms `getPrices()` returns 96 slots for today with accurate grid price additions.
- Validate backwards compatibility with hourly fixture data (legacy cache content).

## Rollout
- Ship the update as a minor version, coordinating with the package release.
- Monitor production devices for increased fetch frequency (logs) and ensure capabilities update without throttling.
- Provide migration guidance in release notes so users expect more frequent price changes.
