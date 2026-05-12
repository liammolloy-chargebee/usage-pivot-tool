# Usage billing pivot

Small **client-side** web app: drop a billing CSV export and get a pivot table:

| | |
| --- | --- |
| **Rows** | Year–month from `Invoice end date/generated date (date) (PST)` |
| **Columns** | `Is Considered For Usage Calculation` (`TRUE` / `FALSE` / `(blank)`) |
| **Values** | Sum of `Amount in Merchant Currency` |

Data is parsed **in your browser** — nothing is uploaded to a server.

## Required CSV columns

Exact header names (as in the export):

- `Invoice end date/generated date (date) (PST)`
- `Amount in Merchant Currency`
- `Is Considered For Usage Calculation`

## Hosting in the cloud (no local install)

If you can't install Node.js locally, see **[DEPLOY.md](DEPLOY.md)** — push this folder to a free GitHub repo and GitHub Actions builds and hosts the app for you at a permanent URL.

## Setup (local, optional)

Requires [Node.js](https://nodejs.org/) 18+ (includes `npm`).

```bash
cd usage-pivot-tool
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`), then drag your `.csv` onto the page or click to pick a file.

## Build (static files)

```bash
npm run build
npm run preview   # optional: serve ./dist
```

The `dist/` folder can be hosted on any static host or opened via a local static server.

## Fixture

A tiny example file is in [`fixtures/sample.csv`](fixtures/sample.csv) for smoke-testing the parser and pivot.

After upload, use **Download .xlsx** to save the same pivot with `#,##0.00` number formatting for Excel.

## Notes

- Rows missing a parseable date or amount are **skipped** in the pivot; the UI shows how many were skipped.
- If the usage column is empty or not `TRUE`/`FALSE`, values roll into a **`(blank)`** column.
