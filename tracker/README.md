# anyjobsearch tracker

A zero-setup application tracker that runs on your machine: one small Node
server (no npm install - only built-in modules), one JSON file as the
database, one page served on localhost. The agent that hunts for jobs can
push what it finds straight into the pipeline; you edit outcomes on the page.

## Run

```
node tracker/server.mjs
```

Open http://localhost:8788. Options: `--port 8788` and `--data
tracker-data.json` (the JSON database; defaults to your current folder).

## Pipeline

Found → Ready to send → Applied → Follow-up sent → Replied → Interviewing →
Offer / Rejected / Withdrawn

## Feeding it from the hunt

The agent that scans portals can push what it finds straight in:

```
curl -X POST http://localhost:8788/api/apps/bulk ^
  -H "content-type: application/json" ^
  -d "{\"apps\":[{\"company\":\"Acme\",\"role\":\"QA Analyst\",\"url\":\"https://...\"}]}"
```

Bulk imports dedupe on company + role, so re-running a scan never creates
duplicates. Or use the "Import found jobs" box on the page and paste JSON.

## Data

Everything lives in `tracker-data.json` - human-readable, easy to back up,
never sent anywhere. The page also has a one-click JSON export.

## API

| Method | Route | What |
|---|---|---|
| GET | `/api/apps` | list everything |
| POST | `/api/apps` | add one application |
| POST | `/api/apps/bulk` | import an array (dedupes) |
| PATCH | `/api/apps/<id>` | update any fields |
| DELETE | `/api/apps/<id>` | remove |

## Finding things in a long list

- **Filters:** stage, mode, type, location, source, found-by, job track (product, forward deployed, QA and test, data, developer and AI), region (Italy, remote Italy, remote Europe, remote worldwide, relocation), date added, salary shown, top picks, Easy Apply.
- **Sort:** by stage, added date, salary, company, last update or applied date, both directions. Entries with no value for the chosen field always sink to the bottom.
- **Bulk actions:** tick several cards (or "Select all shown") and mark them Applied, Rejected, Withdrawn and so on. Bulk changes and deletes show an **Undo** for 12 seconds.
- **Hide stale / possible duplicates:** hide untouched Found roles older than three weeks; flag the same job seen on two sources.
- **Saved views:** name a combination of filters and sort and reload it later (kept in your browser).
- **Insights:** a collapsible table of replies, interviews and rejections by track, source and CV, so you can see what is actually working once outcomes are recorded.
