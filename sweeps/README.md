# Daily sweeps

Hunting routes, one destination: everything new goes into the tracker
(`node tracker/server.mjs`, then `POST /api/apps/bulk` with
`{"apps":[{...}]}` - it dedupes on company+role). The tracker fields the
sweeps should fill: `company, role, source, url, salary, mode, type,
location, cv, top, easy, notes`.

## 0. Company-first (public ATS APIs - no login, no board)

The strongest route once you know *which companies* you want: Greenhouse,
Ashby, Lever, SmartRecruiters, Workable and Recruitee all expose a company's
live openings as free JSON.

```
cd sweeps
node ats.js --company celonis=greenhouse --company mollie=ashby \
            --loc "milan,italy" --kw "intern,analyst,data,qa,automation"
```

Find a company's ATS by opening its careers page and reading the
job-widget domain (`boards.greenhouse.io`, `jobs.ashbyhq.com`,
`api.lever.co`, `jobs.smartrecruiters.com`, `apply.workable.com`,
`.recruitee.com`). Build a targets file of 20-30 companies and sweep them
all in one command - this is how you apply before a posting ever reaches a
job board.

## 1. LinkedIn (logged-in, via MCP)

Setup runbook: [references/linkedin.md](../references/linkedin.md)
(mcp-server-linkedin + mcporter, one interactive sign-in, session saved).

Sweep pattern - one call per keyword+location pair, 1 page each. Light daily
use survives; volume scraping does not.

```
mcporter call linkedin.search_jobs keywords="test automation" location="Milan, Lombardy, Italy" max_pages=1
```

Gotchas learned in production:

- Match `job_ids` to `references.search_results` **by URL, not by position**
  (positional zips misalign), and read `sections.search_results` for company,
  location and salary.
- Ads inflate the first page; treat "Promoted" as a hint, not a ranking.
- A posting seen twice under different titles is usually two reqs at one
  company - dedupe is on company+role, so both stay.

## 2. Indeed (logged-in, headful browser)

Indeed fingerprints and blocks headless browsers, so the sweep runs in a
**visible window** - expect it to appear on screen for ~30 seconds. One-time
setup: `npm i`, then `node login.mjs`, sign in (including any email
verification code) - the script verifies the session in a separate tab and
closes on its own.

```
cd sweeps/indeed
npm i
node login.mjs              # once; profile saved in indeed-profile/
node sweep.mjs "test automation" "Milano" 7
```

Output: JSON with title, company, location, **salary** (Indeed shows it on
the card - LinkedIn almost never does), and a working job URL. If you get
`"blocked": true`, you tripped Cloudflare - wait an hour, stay headful, keep
sweeps to 1-2 queries a day.

## 3. radarak (career-page aggregator, no login)

radarak.online indexes companies' own career pages - different inventory from
LinkedIn, and it expires fast (apply within days).

```
cd sweeps/radarak
node radarak-italy.js                        # default keyword families
node radarak-italy.js --keywords "ai,data analyst,test automation"
```

Output: `radarak-italy-hits.json` + console table, Italy only, senior-bar
filtered.

## Scheduling

Wire these into a daily automation (07:00-09:00 works): start the tracker,
run the sweeps, POST new findings, and leave a digest. Keep it light - one
pass per source per day is the right rhythm for logged-in boards.

## Audited and rejected

- **Jobgether** - aggregator with a subscription wall; static pages carry
  titles only, company/apply data needs per-offer fetches or a paid plan.
  Inventory overlaps the ATS route anyway. Browse manually if you like it.
- **Arbeitnow** - Germany-centric board; API lives at
  `www.arbeitnow.com/api/job-board-api` (not `/api`). Useful for German
  relocation hunting, nothing for Italy.
- **eurotoptech / remotegoats** - senior + $100k+ segments, paywalled
  listings. Relevant much later in a career, not at entry.
- **Glassdoor / Wellfound** - login-walled to automation; browse manually.
