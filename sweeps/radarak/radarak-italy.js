// radarak Italy sweep: pulls radarak.online's public career-page listings and
// filters for the keyword families you hunt. Zero dependencies.
// Run: node radarak-italy.js [--keywords "ai,data analyst,test automation"]
// Full listing dump also saved to radarak-raw.json for a second pass.
const fs = require("fs");
const https = require("https");

const get = url => new Promise((resolve, reject) => {
  https.get(url, { headers: { "user-agent": "Mozilla/5.0" } }, res => {
    let d = ""; res.on("data", c => d += c); res.on("end", () => resolve(d));
  }).on("error", reject);
});

(async () => {
  const argIdx = process.argv.indexOf("--keywords");
  const families = (argIdx > -1 ? process.argv[argIdx + 1] : "ai,data analyst,business intelligence,analytics engineer,test automation,automation,prompt,agent,llm").split(",").map(s => s.trim()).filter(Boolean);
  const KW = new RegExp(families.join("|").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const BAD_SEN = /lead|principal|head|director|staff|vp\b/i;

  const a = JSON.parse(await get("https://radarak.online/data/jobs.json"));
  let b = [];
  try { b = JSON.parse(await get("https://radarak.online/data/jobs-more.json")); } catch (e) {}
  const all = [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : (b.jobs || []))];

  const hits = [];
  for (const x of all) {
    const countries = x.co || [];
    const title = x.t || "";
    if (!countries.includes("Italy")) continue;
    if (!KW.test(title)) continue;
    if (BAD_SEN.test(title) || x.s === "Lead / Principal" || x.s === "Head / Director") continue;
    hits.push({ title, company: x.c, seniority: x.s, work: x.w, location: x.l, posted: x.p, url: x.u });
  }
  hits.sort((x, y) => (y.posted || "").localeCompare(x.posted || ""));
  fs.writeFileSync("radarak-italy-hits.json", JSON.stringify(hits, null, 2));
  console.log(`radarak Italy: ${hits.length} hits for [${families.join(", ")}] (newest first)`);
  hits.slice(0, 25).forEach(h => console.log(` - ${(h.title || "").slice(0, 55).padEnd(55)} | ${(h.company || "").slice(0, 22).padEnd(22)} | ${(h.location || "").slice(0, 30)} | ${h.posted} | ${h.url}`));
})();
