import Papa from "papaparse";
import {
  COL_AMOUNT_MERCHANT,
  COL_INVOICE_END_DATE,
  COL_USAGE_CALC,
} from "./constants";

export type UsageFlag = "TRUE" | "FALSE" | "(blank)";

export type NormalizedRow = {
  yearMonth: string | null;
  amount: number | null;
  usageFlag: UsageFlag;
};

export type ParseResult = {
  rows: NormalizedRow[];
  /** Human-readable issues (e.g. missing columns, bad cells) */
  warnings: string[];
  /** Total CSV data rows after header */
  rawRowCount: number;
};

function stripBom(s: string): string {
  return s.replace(/^\uFEFF/, "").trim();
}

function findFieldInMeta(
  fields: string[] | undefined,
  expected: string,
): string | null {
  if (!fields) return null;
  const want = stripBom(expected);
  for (const f of fields) {
    if (stripBom(f) === want) return f;
  }
  return null;
}

/** Extract YYYY-MM from ISO-like `2025-01-01T16:00:00` or parse fallback. */
export function yearMonthFromInvoiceDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${mo}`;
}

/** Parse merchant amount: strips currency text, commas, keeps numeric value. */
export function parseMerchantAmount(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  const cleaned = s.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function normalizeUsageFlag(raw: string): UsageFlag {
  const u = raw.trim().toUpperCase();
  if (u === "TRUE") return "TRUE";
  if (u === "FALSE") return "FALSE";
  return "(blank)";
}

export function parseUsageCsv(text: string): ParseResult {
  const warnings: string[] = [];
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => stripBom(h),
  });

  if (parsed.errors.length) {
    for (const e of parsed.errors.slice(0, 5)) {
      warnings.push(`CSV parse: ${e.message} (row ${e.row ?? "?"})`);
    }
    if (parsed.errors.length > 5) {
      warnings.push(`…and ${parsed.errors.length - 5} more parse errors`);
    }
  }

  const data = parsed.data;
  const rawRowCount = data.length;
  if (rawRowCount === 0) {
    warnings.push("No data rows found.");
    return { rows: [], warnings, rawRowCount: 0 };
  }

  const fields = parsed.meta.fields;
  const keyDate = findFieldInMeta(fields, COL_INVOICE_END_DATE);
  const keyAmount = findFieldInMeta(fields, COL_AMOUNT_MERCHANT);
  const keyUsage = findFieldInMeta(fields, COL_USAGE_CALC);

  if (!keyDate) {
    warnings.push(`Missing required column: "${COL_INVOICE_END_DATE}"`);
  }
  if (!keyAmount) {
    warnings.push(`Missing required column: "${COL_AMOUNT_MERCHANT}"`);
  }
  if (!keyUsage) {
    warnings.push(`Missing required column: "${COL_USAGE_CALC}"`);
  }

  if (!keyDate || !keyAmount || !keyUsage) {
    return { rows: [], warnings, rawRowCount };
  }

  const rows: NormalizedRow[] = [];
  let badDate = 0;
  let badAmount = 0;

  for (const r of data) {
    const dateRaw = (r[keyDate] ?? "").trim();
    const amountRaw = (r[keyAmount] ?? "").trim();
    const usageRaw = r[keyUsage] ?? "";

    const ym = yearMonthFromInvoiceDate(dateRaw);
    if (!ym) badDate++;

    const amt = parseMerchantAmount(amountRaw);
    if (amt === null) badAmount++;

    rows.push({
      yearMonth: ym,
      amount: amt,
      usageFlag: normalizeUsageFlag(usageRaw),
    });
  }

  if (badDate) warnings.push(`${badDate} row(s) had an unparseable invoice date.`);
  if (badAmount) warnings.push(`${badAmount} row(s) had an unparseable amount.`);

  return { rows, warnings, rawRowCount };
}
