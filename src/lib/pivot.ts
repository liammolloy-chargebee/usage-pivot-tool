import type { NormalizedRow } from "./parseCsv";

export type PivotModel = {
  rowKeys: string[];
  colKeys: string[];
  cells: Record<string, Record<string, number>>;
  rowTotals: Record<string, number>;
  colTotals: Record<string, number>;
  grandTotal: number;
  /** Rows skipped (missing date or amount) */
  skippedRows: number;
};

const COL_ORDER = ["TRUE", "FALSE", "(blank)"] as const;

function sortYearMonths(keys: string[]): string[] {
  return [...keys].sort((a, b) => a.localeCompare(b));
}

function sortColKeys(keys: string[]): string[] {
  const set = new Set(keys);
  const ordered: string[] = [];
  for (const k of COL_ORDER) {
    if (set.has(k)) ordered.push(k);
  }
  const rest = [...set].filter((k) => !COL_ORDER.includes(k as (typeof COL_ORDER)[number])).sort();
  return [...ordered, ...rest];
}

/**
 * Pivot: rows = Year-Month, columns = usage flag, values = sum(amount).
 * Rows without both a valid yearMonth and amount are skipped (counted in skippedRows).
 */
export function buildPivot(rows: NormalizedRow[]): PivotModel {
  const cells: Record<string, Record<string, number>> = {};
  const rowSet = new Set<string>();
  const colSet = new Set<string>();
  let skippedRows = 0;

  for (const r of rows) {
    if (r.yearMonth === null || r.amount === null) {
      skippedRows++;
      continue;
    }

    const ym = r.yearMonth;
    const col = r.usageFlag;
    rowSet.add(ym);
    colSet.add(col);

    if (!cells[ym]) cells[ym] = {};
    cells[ym][col] = (cells[ym][col] ?? 0) + r.amount;
  }

  const rowKeys = sortYearMonths([...rowSet]);
  const colKeys = sortColKeys([...colSet]);

  const rowTotals: Record<string, number> = {};
  const colTotals: Record<string, number> = {};
  for (const c of colKeys) colTotals[c] = 0;

  let grandTotal = 0;
  for (const ym of rowKeys) {
    let rt = 0;
    for (const c of colKeys) {
      const v = cells[ym]?.[c] ?? 0;
      rt += v;
      colTotals[c] = (colTotals[c] ?? 0) + v;
    }
    rowTotals[ym] = rt;
    grandTotal += rt;
  }

  return {
    rowKeys,
    colKeys,
    cells,
    rowTotals,
    colTotals,
    grandTotal,
    skippedRows,
  };
}
