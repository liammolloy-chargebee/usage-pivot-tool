import * as XLSX from "xlsx";
import type { ForecastResult } from "./forecast";
import type { PivotModel } from "./pivot";

const NUM_FMT = "#,##0.00";

/** Build sheet from pivot + apply Excel number format on numeric cells. */
export function pivotToWorksheet(pivot: PivotModel): XLSX.WorkSheet {
  const header = ["Year-Month", ...pivot.colKeys, "Row Total"];
  const aoa: (string | number)[][] = [header];

  for (const ym of pivot.rowKeys) {
    const row: (string | number)[] = [ym];
    for (const c of pivot.colKeys) {
      row.push(pivot.cells[ym]?.[c] ?? 0);
    }
    row.push(pivot.rowTotals[ym] ?? 0);
    aoa.push(row);
  }

  const totalRow: (string | number)[] = ["Column Total"];
  for (const c of pivot.colKeys) {
    totalRow.push(pivot.colTotals[c] ?? 0);
  }
  totalRow.push(pivot.grandTotal);
  aoa.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const totalRowIndex = pivot.rowKeys.length + 1;
  const lastValueCol = pivot.colKeys.length + 1;

  for (let R = 1; R <= totalRowIndex; R++) {
    for (let C = 1; C <= lastValueCol; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (cell && typeof cell.v === "number") {
        cell.z = NUM_FMT;
      }
    }
  }

  const colWidths = [{ wch: 12 }, ...pivot.colKeys.map(() => ({ wch: 14 })), { wch: 14 }];
  ws["!cols"] = colWidths;

  return ws;
}

/** Build a "Forecast (TRUE)" sheet with metadata, history, and projections. */
export function forecastToWorksheet(
  forecast: Extract<ForecastResult, { ok: true }>,
): XLSX.WorkSheet {
  const aoa: (string | number)[][] = [
    ["Method", "Linear regression on TRUE column"],
    ["Slope per month", forecast.slopePerMonth],
    ["Intercept", forecast.intercept],
    ["R-squared", forecast.rSquared],
    ["Historical months used", forecast.historical.length],
    [],
    ["Year-Month", "Amount", "Type"],
  ];

  const dataStartRow = aoa.length;

  for (const p of forecast.historical) {
    aoa.push([p.yearMonth, p.value, "Actual"]);
  }
  for (const p of forecast.forecast) {
    aoa.push([p.yearMonth, p.value, "Forecast"]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const numericMetaRows = [1, 2, 3]; // slope, intercept, r-squared rows (0-indexed)
  for (const r of numericMetaRows) {
    const addr = XLSX.utils.encode_cell({ r, c: 1 });
    const cell = ws[addr];
    if (cell && typeof cell.v === "number") {
      cell.z = NUM_FMT;
    }
  }

  const lastDataRow = aoa.length - 1;
  for (let R = dataStartRow; R <= lastDataRow; R++) {
    const addr = XLSX.utils.encode_cell({ r: R, c: 1 });
    const cell = ws[addr];
    if (cell && typeof cell.v === "number") {
      cell.z = NUM_FMT;
    }
  }

  ws["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 12 }];

  return ws;
}

export function downloadPivotXlsx(
  pivot: PivotModel,
  filenameBase: string,
  forecast: ForecastResult | null,
): void {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, pivotToWorksheet(pivot), "Pivot");

  if (forecast?.ok) {
    XLSX.utils.book_append_sheet(
      wb,
      forecastToWorksheet(forecast),
      "Forecast (TRUE)",
    );
  }

  const safe = filenameBase.replace(/[^\w.-]+/g, "_").slice(0, 80);
  XLSX.writeFile(wb, `${safe || "pivot"}_usage_pivot.xlsx`);
}
