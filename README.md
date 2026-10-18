# ClearRow — CSV Health Check

A browser-based data quality tool for people preparing business spreadsheets for analysis. Inspect missing values, duplicate rows, surrounding whitespace and mixed-format columns, preview explicit cleaning steps, and download a cleaned CSV.

## Run

Open `index.html` in a modern browser, or serve this folder with VS Code Live Server. Click **Try business sample** for a synthetic sales dataset with deliberate issues. No API keys, account, dependencies or build step are needed. No network requests or persistent storage are used.

## Workflow

1. Choose a UTF-8 comma-separated CSV (up to 5 MB, 25,000 data rows and 100 columns).
2. Inspect the report and original table.
3. Choose whether to trim surrounding spaces, remove duplicates and remove empty rows.
4. Preview changes; compare Original and Cleaned views.
5. Download the cleaned CSV or a text report.

## Definitions and limitations

- The first CSV record is the header. Quoted commas, escaped quotes, embedded line breaks, CRLF/LF and UTF-8 BOM are supported. Malformed quoting and unequal populated row widths are rejected.
- Duplicate reporting compares complete rows after trimming. Cleaning compares exact rows after whichever trimming option you select. If trimming is off, the duplicate-removal count can therefore differ from the report.
- Missing means empty or whitespace-only. The tool never imputes values or converts numbers/dates. Literal strings such as `N/A` are preserved.
- Mixed-format detection is heuristic: plain decimal numbers and valid ISO dates are recognised; other populated values are text. Identifiers, currency and local dates can trigger legitimate mixed types.
- Headers are retained unchanged. Empty/duplicate headers are flagged for manual review.
- Preview shows at most 50 rows and 250 characters per cell; downloads retain full values.
- Formula protection is enabled by default: cells beginning with whitespace followed by `=`, `+`, `-` or `@` gain a leading apostrophe, including negative numbers. Turn it off only if you need exact values and trust the file. CSV quoting alone does not prevent spreadsheet formula execution.
- No server, file uploads, analytics, localStorage or external fonts. Refreshing the page discards the current session.
- This checks structure and formatting, not business accuracy. Review suggested duplicate removal: identical transactions may be valid.

## Files

- `index.html`: accessible interface and controls
- `style.css`: responsive styles
- `core.js`: parser, quality checks, cleaning and CSV export
- `app.js`: file reading, DOM rendering, preview and downloads
- `tests.cjs`: dependency-free parser and cleaning tests

Run tests with `node tests.cjs`.

## Portfolio learning ideas

Trace a sample row through parsing, analysis, cleaning and export. Add column-level rules, configurable date formats or a Python batch-processing counterpart as your own improvements. The initial implementation was created with AI assistance; document your actual contributions accurately.

## GitHub Pages

Upload these files to a repository. In Settings → Pages, deploy from the `main` branch and root folder.

MIT licensed; see LICENSE.

## Project credit

Created for and maintained by **Mujammil Murtaza Shaik** — [GitHub](https://github.com/knowmuzammil) · [LinkedIn](https://www.linkedin.com/in/mujammil-shaik).

MBA with Merit, University of Leeds, 2024. This portfolio explores practical tools for business workflows, data quality and automation. The initial code was developed with AI assistance.

Copyright (c) 2026 Mujammil Murtaza Shaik. When reusing this code, retain the copyright and MIT license notice as required by the license. Linking back to this repository is appreciated.

