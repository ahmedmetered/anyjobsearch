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
