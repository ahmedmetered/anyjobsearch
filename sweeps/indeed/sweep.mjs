// Indeed sweep: headless, uses the saved profile, scrapes one search and prints JSON.
// Run: node indeed-sweep.mjs "<query>" "<location>" [daysBack]
// Example: node indeed-sweep.mjs "test automation" "Milano" 7
import { chromium } from "patchright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const profile = path.join(here, "indeed-profile");
const [query = "test automation", location = "Milano", daysBack = "7"] = process.argv.slice(2);

const ctx = await chromium.launchPersistentContext(profile, { headless: false }); // headful: Indeed blocks headless browsers
const page = ctx.pages()[0] || await ctx.newPage();
const url = `https://it.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&fromage=${daysBack}`;
await page.goto(url, { waitUntil: "domcontentloaded" });
await new Promise(r => setTimeout(r, 9000));
if (/blocked/i.test(await page.title()) || /have been blocked/i.test(await page.evaluate(() => document.body.innerText))) {
  await ctx.close();
  console.log(JSON.stringify({ query, location, blocked: true, count: 0, jobs: [] }, null, 2));
  process.exit(0);
}

const jobs = await page.evaluate(() => {
  const out = [];
  const seen = new Set();
  document.querySelectorAll("div.job_seen_beacon").forEach(card => {
    const a = card.querySelector("h3.jobTitle a[data-jk]");
    if (!a) return;
    const jk = a.getAttribute("data-jk");
    const t = (a.querySelector("span[title]")?.getAttribute("title") || a.textContent || "").trim();
    const c = card.querySelector('[data-testid="company-name"]')?.textContent?.trim() || "";
    const key = (c + "|" + t).toLowerCase();
    if (!t || seen.has(key)) return;
    seen.add(key);
    const l = card.querySelector('[data-testid="text-location"]')?.textContent?.trim() || "";
    const s = card.querySelector(".salary-snippet-container, [data-testid='salary-snippet']")?.textContent?.trim() || "";
    out.push({ title: t, company: c, location: l, salary: s, url: jk ? `https://it.indeed.com/viewjob?jk=${jk}` : "" });
  });
  return out;
});
await ctx.close();
console.log(JSON.stringify({ query, location, count: jobs.length, jobs }, null, 2));
