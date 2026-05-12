}
/**
 * Linear forecast for the TRUE column, projecting `FORECAST_HORIZON_MONTHS`
 * months past the last historical month. Requires `>= MIN_HISTORY_MONTHS`
 * gap-filled historical months.
 */
export function forecastNext6(pivot: PivotModel): ForecastResult {
  const historical = buildTrueSeries(pivot);
  if (historical.length < MIN_HISTORY_MONTHS) {
    return {
      ok: false,
      reason: "insufficient_data",
      monthsAvailable: historical.length,
      monthsRequired: MIN_HISTORY_MONTHS,
    };
  }
  const ys = historical.map((p) => p.value);
  const { slope, intercept, rSquared } = linearRegression(ys);
  const lastYm = historical[historical.length - 1].yearMonth;
  const n = historical.length;
  const forecast: ForecastPoint[] = [];
  for (let i = 1; i <= FORECAST_HORIZON_MONTHS; i++) {
    const x = n - 1 + i;
    const raw = intercept + slope * x;
    const clamped = raw < 0;
    forecast.push({
      yearMonth: addMonths(lastYm, i),
      value: clamped ? 0 : raw,
      rawValue: raw,
      clamped,
    });
  }
  return {
    ok: true,
    historical,
    forecast,
    slopePerMonth: slope,
    intercept,
    rSquared,
  };
}
