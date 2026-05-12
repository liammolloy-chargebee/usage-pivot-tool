import { useCallback, useMemo, useState } from "react";
import { Dropzone } from "./components/Dropzone";
import { PivotTable } from "./components/PivotTable";
import { downloadPivotXlsx } from "./lib/exportXlsx";
import { parseUsageCsv } from "./lib/parseCsv";
import { buildPivot } from "./lib/pivot";

export default function App() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseText, setParseText] = useState<string | null>(null);

  const onCsvText = useCallback((text: string, name: string) => {
    setParseText(text);
    setFileName(name);
  }, []);

  const parsed = useMemo(() => {
    if (!parseText) return null;
    return parseUsageCsv(parseText);
  }, [parseText]);

  const pivot = useMemo(() => {
    if (!parsed?.rows.length) return null;
    return buildPivot(parsed.rows);
  }, [parsed]);

  const handleDownload = () => {
    if (!pivot) return;
    const base = fileName?.replace(/\.csv$/i, "") ?? "export";
    downloadPivotXlsx(pivot, base);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Usage billing pivot
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Upload a CSV export. Rows are grouped by <strong>year-month</strong>{" "}
          (from invoice end date), columns are{" "}
          <strong>Is Considered For Usage Calculation</strong>, values are the
          sum of <strong>Amount in Merchant Currency</strong>. Nothing is sent to
          a server.
        </p>
      </header>

      <Dropzone onCsvText={onCsvText} />

      {fileName && (
        <p className="mt-6 text-sm text-slate-500">
          Loaded: <span className="font-medium text-slate-700">{fileName}</span>
          {parsed && (
            <>
              {" "}
              — {parsed.rawRowCount} data row(s)
              {pivot != null && pivot.skippedRows > 0 && (
                <span className="text-amber-700">
                  {" "}
                  ({pivot.skippedRows} skipped: missing date or amount)
                </span>
              )}
            </>
          )}
        </p>
      )}

      {parsed && parsed.warnings.length > 0 && (
        <ul className="mt-4 list-inside list-disc rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {parsed.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}

      {pivot && (
        <section className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            {pivot.rowKeys.length > 0 && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Download .xlsx
              </button>
            )}
            <span className="text-sm text-slate-500">
              {pivot.rowKeys.length > 0
                ? "Same table with number formatting for Excel"
                : "Fix date/amount issues to enable export"}
            </span>
          </div>
          <PivotTable pivot={pivot} />
        </section>
      )}

      {!parseText && (
        <p className="mt-10 text-center text-sm text-slate-400">
          Tip: exports must include the columns &quot;Invoice end
          date/generated date (date) (PST)&quot;, &quot;Amount in Merchant
          Currency&quot;, and &quot;Is Considered For Usage Calculation&quot;.
        </p>
      )}
    </div>
  );
}
