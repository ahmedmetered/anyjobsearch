# Scanning portals

There is no bundled scraper on purpose: portals change, markets differ, and
the agent you are running already has reach. Use the strongest route available,
in this order.

## Route 1: Authenticated portal access

If the agent holds a logged-in session or MCP tool for a portal (for example a
LinkedIn integration exposing a job search), prefer it: results reflect what
the candidate can actually see and apply to, including Easy Apply flags,
applicant counts, and repost status. Search each target title from the
profile, scoped to each target market. One to two pages per title is enough
for a daily scan; deduplicate postings across searches before ranking.

## Route 2: Public boards and aggregation

Without credentials, search public remote and regional boards directly, and
use web search against them with the candidate's title variants plus the
market name. Good standing boards to rotate through: We Work Remotely,
RemoteOK, Wellfound, EU remote aggregators, and the candidate's local market
boards. Record which boards produced shortlisted postings; stop scanning
boards that never produce passes.

## Route 3: Direct employer boards

For the candidate's named target companies, check the employer's own careers
page (often an ATS such as Greenhouse, Lever, or Workable). These postings
appear before aggregators pick them up and attract fewer applicants.

## Market presets

Keep one preset file per market in the candidate's data folder
(`portals-<market>.md`) listing: the boards worth rotating, the language the
postings are written in, the norm for application (portal form vs. email vs.
Easy Apply), and any market-specific norm worth knowing (photo expectations,
certificate conventions, notice-period norms). When the candidate opens a new
market, interview them or research the market and write the preset before
scanning it.

## Cadence

A daily scan of two or three title variants per active market is plenty.
Portals reshuffle rather than replenish; the value is in catching new postings
in the first 48 hours, not in re-reading old ones.
