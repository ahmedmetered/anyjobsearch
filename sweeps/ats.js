// Company-first ATS sweep: pull live openings straight from a company's ATS API.
// Zero dependencies. No login needed - these endpoints are public.
//
// Run:  node ats.js --company celonis=greenhouse --company mollie=ashby --loc "milan,italy,remote" --kw "intern,data,ai,qa,test"
//
// Supported ATS: greenhouse, ashby, lever, smartrecruiters, workable, recruitee
// Find a company's ATS by opening its careers page and looking at the job-widget domain.
const https = require("https");

const get = url => new Promise((resolve, reject) => {
  https.get(url, { headers: { "user-agent": "Mozilla/5.0" } }, res => {
    let d = ""; res.on("data", c => d += c); res.on("end", () => resolve(d));
  }).on("error", reject);
});

async function pull(company, ats) {
  const jobs = [];
  if (ats === "greenhouse") {
    const d = JSON.parse(await get(`https://boards.greenhouse.io/v1/boards/${company}/jobs`));
    (d.jobs || []).forEach(j => jobs.push({ title: j.title, location: j.location?.name || "", url: j.absolute_url }));
  } else if (ats === "ashby") {
    const d = JSON.parse(await get(`https://api.ashbyhq.com/posting-api/job-board/${company}`));
    (d.jobs || []).filter(j => j.isListed !== false).forEach(j => jobs.push({ title: j.title, location: j.location || "", url: j.jobUrl }));
  } else if (ats === "lever") {
    const d = JSON.parse(await get(`https://api.lever.co/v0/postings/${company}?mode=json`));
    d.forEach(j => jobs.push({ title: j.text, location: j.categories?.location || "", url: j.hostedUrl }));
  } else if (ats === "smartrecruiters") {
    const d = JSON.parse(await get(`https://api.smartrecruiters.com/v1/companies/${company}/postings`));
    (d.content || []).forEach(j => jobs.push({ title: j.name, location: [j.location?.city, j.location?.country].filter(Boolean).join(", "), url: `https://jobs.smartrecruiters.com/${company}/${j.id}` }));
  } else if (ats === "workable") {
    const d = JSON.parse(await get(`https://apply.workable.com/api/v1/widget/accounts/${company}?details=true`));
    (d.jobs || []).forEach(j => jobs.push({ title: j.title, location: [j.city, j.country].filter(Boolean).join(", "), url: j.url }));
  } else if (ats === "recruitee") {
    const d = JSON.parse(await get(`https://${company}.recruitee.com/api/offers/`));
    (d.offers || []).forEach(j => jobs.push({ title: j.title, location: j.location || "", url: j.careers_url }));
  } else {
    throw new Error(`unknown ATS: ${ats}`);
  }
  return jobs;
}

(async () => {
  const argv = process.argv.slice(2);
  const opt = name => { const i = argv.indexOf(name); return i > -1 ? argv[i + 1] : null; };
  const targets = [];
  argv.forEach((a, i) => { if (a === "--company" && argv[i + 1]) targets.push(argv[i + 1]); });
  const alt = (s, fallback) => { const v = opt(s); return new RegExp((v ? v.split(",").join("|") : fallback) || ".", "i"); };
  const locRe = alt("--loc", "milan|italy|remote|europe");
  const kwRe = alt("--kw", "intern|analyst|data|ai|qa|test|automation|engineer|developer");

  const out = [];
  for (const t of targets) {
    const [company, ats] = t.split("=");
    try {
      const jobs = await pull(company, ats);
      jobs.filter(j => locRe.test(j.location) && kwRe.test(j.title)).forEach(j => out.push({ company, ats, ...j }));
      console.error(`${company} (${ats}): ${jobs.length} openings`);
    } catch (e) {
      console.error(`${company} (${ats}): FAILED - ${e.message}`);
    }
  }
  out.forEach(j => console.log(` - ${(j.title || "").slice(0, 55).padEnd(55)} | ${(j.company || "").slice(0, 18).padEnd(18)} | ${(j.location || "").slice(0, 28).padEnd(28)} | ${j.url}`));
  console.log(`\n${out.length} matches. POST to the tracker: POST /api/apps/bulk {"apps":[{company, role, url, source:"ATS"}]}`);
})();
