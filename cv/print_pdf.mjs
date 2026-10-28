#!/usr/bin/env node
// print_pdf.mjs — print an HTML file to PDF with a real browser engine, headless.
// Uses Edge if present (Chromium engine, present on every Windows box), falls
// back to Chrome, then to `google-chrome`/`chromium` on Linux. This is the
// renderer that makes the PDF pixel-faithful: the same engine that rendered
// your HTML while you tweaked it is the one that prints it.
//
// Usage: node print_pdf.mjs input.html output.pdf
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const [html, pdf] = process.argv.slice(2);
if (!html || !pdf) {
  console.error("Usage: node print_pdf.mjs input.html output.pdf");
  process.exit(2);
}
const CANDIDATES = [
  process.env.CHROME_BIN,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "google-chrome",
  "chromium",
].filter(Boolean);
const bin = CANDIDATES.find((p) => {
  if (!p.includes("\\")) return true; // bare command: let the OS resolve it
  try {
    return existsSync(p);
  } catch {
    return false;
  }
});
if (!bin) {
  console.error("no Chromium-family browser found; set CHROME_BIN=/path/to/browser");
  process.exit(1);
}
const r = spawnSync(bin, [
  "--headless",
  "--disable-gpu",
  "--no-pdf-header-footer", // no browser-added title/date margins
  `--print-to-pdf=${resolve(pdf)}`,
  resolve(html),
], { stdio: "inherit" });
if (r.status !== 0) {
  console.error(`browser exited ${r.status}; if the PDF looks stale, delete it and retry (headless sometimes writes after exit)`);
  process.exit(r.status ?? 1);
}
console.log(`wrote ${pdf}`);
