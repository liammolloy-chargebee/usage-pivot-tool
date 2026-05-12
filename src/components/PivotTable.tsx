import type { PivotModel } from "../lib/pivot";

type Props = {
  pivot: PivotModel;
};

function fmt(n: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function PivotTable({ pivot }: Props) {
  if (pivot.rowKeys.length === 0) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        No rows to display — every row may be missing a date or amount. Check
        warnings above.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100 text-left text-slate-700">
            <th className="border-b border-slate-200 px-4 py-3 font-semibold">
              Year-Month
            </th>
            {pivot.colKeys.map((c) => (
              <th
                key={c}
                className="border-b border-slate-200 px-4 py-3 text-right font-semibold"
              >
                {c}
              </th>
            ))}
            <th className="border-b border-slate-200 px-4 py-3 text-right font-semibold">
              Row total
            </th>
          </tr>
        </thead>
        <tbody>
          {pivot.rowKeys.map((ym) => (
            <tr key={ym} className="hover:bg-slate-50/80">
              <td className="border-b border-slate-100 px-4 py-2.5 font-medium text-slate-800">
                {ym}
              </td>
              {pivot.colKeys.map((c) => (
                <td
                  key={c}
                  className="border-b border-slate-100 px-4 py-2.5 text-right tabular-nums text-slate-700"
                >
                  {fmt(pivot.cells[ym]?.[c] ?? 0)}
                </td>
              ))}
              <td className="border-b border-slate-100 px-4 py-2.5 text-right font-medium tabular-nums text-slate-900">
                {fmt(pivot.rowTotals[ym] ?? 0)}
              </td>
            </tr>
          ))}
          <tr className="bg-slate-100 font-semibold text-slate-900">
            <td className="px-4 py-3">Column total</td>
            {pivot.colKeys.map((c) => (
              <td key={c} className="px-4 py-3 text-right tabular-nums">
                {fmt(pivot.colTotals[c] ?? 0)}
              </td>
            ))}
            <td className="px-4 py-3 text-right tabular-nums">
              {fmt(pivot.grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
