import * as XLSX from "xlsx";
import type { PivotModel } from "./pivot";

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
  const numFmt = "#,##0.00";

  const totalRowIndex = pivot.rowKeys.length + 1;
  const lastValueCol = pivot.colKeys.length + 1;

  for (let R = 1; R <= totalRowIndex; R++) {
    for (let C = 1; C <= lastValueCol; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (cell && typeof cell.v === "number") {
        cell.z = numFmt;
      }
    }
  }

  const colWidths = [{ wch: 12 }, ...pivot.colKeys.map(() => ({ wch: 14 })), { wch: 14 }];
  ws["!cols"] = colWidths;

  return ws;
}

export function downloadPivotXlsx(pivot: PivotModel, filenameBase: string): void {
  const ws = pivotToWorksheet(pivot);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pivot");
  const safe = filenameBase.replace(/[^\w.-]+/g, "_").slice(0, 80);
  XLSX.writeFile(wb, `${safe || "pivot"}_usage_pivot.xlsx`);
}
