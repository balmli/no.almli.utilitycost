# Spot Price Daily Average Fix

## Summary
`DeviceHandler.spotPricesCalculation` calculates the daily average spot price by summing the hourly entries and dividing by `24`. On days with daylight saving changes (23 or 25 hours) or when hourly data is missing, the average becomes incorrect. In extreme cases where no prices are fetched yet, the function still divides by `24`, setting the capability to `0` and misrepresenting the price.

## Root Cause
The implementation assumes there are always 24 hourly price entries:

```ts
const avg_daily_spot = this.roundPrice(
  prices
    .filter(...)
    .map(...)
    .reduce((a, b) => a + b, 0) / 24
);
```

This hard-coded divisor does not handle DST shifts or partial datasets.

## Proposed Fix
1. Collect the filtered price entries into an array (e.g., `const hourlyPrices = ...`).
2. If `hourlyPrices.length === 0`, skip the update or retain the previous reading to avoid setting `0`.
3. Otherwise, divide the sum by `hourlyPrices.length` to produce an accurate average for the available data.

## Testing
- Unit: Add a targeted test that feeds 23 and 25 element price arrays and asserts the average uses the correct divisor.
- Integration/manual: Simulate a day with partial price data and confirm the capability no longer drops to zero.
