import type {
  ForecastResult,
  HistoricalPoint,
  ForecastPoint,
} from "../lib/forecast";

type Props = {
  result: ForecastResult;
};

function fmtMoney(n: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtSigned(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${fmtMoney(n)}`;
}

const CHART_W = 520;
const CHART_H = 200;
const PAD = { top: 12, right: 12, bottom: 28, left: 56 };

type ChartPoint = { x: number; y: number; ym: string; isForecast: boolean };

function buildChartPoints(
  history: HistoricalPoint[],
  forecast: ForecastPoint[],
): ChartPoint[] {
  const all: ChartPoint[] = [];
  history.forEach((p, i) => {
    all.push({ x: i, y: p.value, ym: p.yearMonth, isForecast: false });
  });
  forecast.forEach((p, i) => {
    all.push({
      x: history.length + i,
      y: p.value,
      ym: p.yearMonth,
      isForecast: true,
    });
  });
  return all;
}

function ForecastChart({
  history,
  forecast,
}: {
  history: HistoricalPoint[];
  forecast: ForecastPoint[];
}) {
  const points = buildChartPoints(history, forecast);
  if (points.length === 0) return null;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(0, ...ys);
  const yMax = Math.max(...ys, 1);
  const xSpan = Math.max(1, xMax - xMin);
  const ySpan = Math.max(1, yMax - yMin);
  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const sx = (x: number) => PAD.left + ((x - xMin) / xSpan) * innerW;
  const sy = (y: number) =>
    PAD.top + innerH - ((y - yMin) / ySpan) * innerH;

  const histLine = points
    .filter((p) => !p.isForecast)
    .map((p) => `${sx(p.x)},${sy(p.y)}`)
    .join(" ");

  const lastHist = points.filter((p) => !p.isForecast).slice(-1)[0];
  const fcastLine = [lastHist, ...points.filter((p) => p.isForecast)]
    .filter((p): p is ChartPoint => Boolean(p))
    .map((p) => `${sx(p.x)},${sy(p.y)}`)
    .join(" ");

  const yTicks = 4;
  const yTickValues: number[] = [];
  for (let i = 0; i <= yTicks; i++) {
    yTickValues.push(yMin + (ySpan * i) / yTicks);
  }

  const xLabelEvery = Math.max(1, Math.ceil(points.length / 8));

  return (
    <svg
      role="img"
      aria-label="Trend chart of TRUE column with 6-month forecast"
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="w-full max-w-2xl text-slate-500"
    >
      {yTickValues.map((v, i) => (
        <g key={`y-${i}`}>
          <line
            x1={PAD.left}
            x2={CHART_W - PAD.right}
            y1={sy(v)}
            y2={sy(v)}
            stroke="currentColor"
            strokeOpacity={0.15}
          />
          <text
            x={PAD.left - 6}
            y={sy(v)}
            fontSize={10}
            textAnchor="end"
            dominantBaseline="middle"
            fill="currentColor"
          >
            {fmtMoney(v)}
          </text>
        </g>
      ))}

      {points.map((p, i) => {
        if (i % xLabelEvery !== 0 && i !== points.length - 1) return null;
        return (
          <text
            key={`x-${p.ym}`}
            x={sx(p.x)}
            y={CHART_H - 8}
            fontSize={10}
            textAnchor="middle"
            fill="currentColor"
          >
            {p.ym}
          </text>
        );
      })}

      <polyline
        fill="none"
        stroke="rgb(79 70 229)"
        strokeWidth={2}
        points={histLine}
      />

      <polyline
        fill="none"
        stroke="rgb(79 70 229)"
        strokeWidth={2}
        strokeDasharray="6 4"
        points={fcastLine}
      />

      {points.map((p) => (
        <circle
          key={`pt-${p.ym}`}
          cx={sx(p.x)}
          cy={sy(p.y)}
          r={p.isForecast ? 3.5 : 2.5}
          fill={p.isForecast ? "white" : "rgb(79 70 229)"}
          stroke="rgb(79 70 229)"
          strokeWidth={p.isForecast ? 1.5 : 1}
        >
          <title>{`${p.ym}: ${fmtMoney(p.y)}${p.isForecast ? " (forecast)" : ""}`}</title>
        </circle>
      ))}
    </svg>
  );
}

export function Forecast({ result }: Props) {
  if (!result.ok) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
        <h3 className="text-base font-semibold">6-month forecast (TRUE)</h3>
        <p className="mt-1">
          Forecast needs at least {result.monthsRequired} months of data —
          you have {result.monthsAvailable}. Upload an export covering more
          months to enable the projection.
        </p>
      </section>
    );
  }

  const anyClamped = result.forecast.some((p) => p.clamped);
  const sixMonthTotal = result.forecast.reduce((acc, p) => acc + p.value, 0);

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          6-month forecast (TRUE)
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Linear trend: <strong>{fmtSigned(result.slopePerMonth)}</strong> per
          month, R² <strong>{result.rSquared.toFixed(2)}</strong>{" "}
          <span className="text-slate-400">
            (based on {result.historical.length} months)
          </span>
          .
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <ForecastChart
          history={result.historical}
          forecast={result.forecast}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-700">
              <th className="border-b border-slate-200 px-4 py-3 font-semibold">
                Month
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-right font-semibold">
                Projected TRUE
              </th>
            </tr>
          </thead>
          <tbody>
            {result.forecast.map((p) => (
              <tr key={p.yearMonth} className="hover:bg-slate-50/80">
                <td className="border-b border-slate-100 px-4 py-2.5 font-medium text-slate-800">
                  {p.yearMonth}
                </td>
                <td className="border-b border-slate-100 px-4 py-2.5 text-right tabular-nums text-slate-700">
                  {fmtMoney(p.value)}
                  {p.clamped && (
                    <span className="ml-2 text-xs text-amber-700">
                      (clamped to 0; raw {fmtMoney(p.rawValue)})
                    </span>
                  )}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-100 font-semibold text-slate-900">
              <td className="px-4 py-3">6-month total</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {fmtMoney(sixMonthTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {anyClamped && (
        <p className="text-xs text-slate-500">
          Note: a negative trend would project below zero in the months shown.
          Those values are clamped to 0 since negative billings don't make
          sense, but the raw regression output is shown for transparency.
        </p>
      )}
    </section>
  );
}
