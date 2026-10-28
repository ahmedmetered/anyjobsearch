# LinkedIn route (optional, authenticated)

The strongest scan route when the candidate has a LinkedIn account: a logged-in
session sees Easy Apply flags, applicant counts, repost status, and true
location scoping. This documents a worked setup using the open-source
`mcp-server-linkedin` server driven by `mcporter`. Any equivalent integration
works; the calls below are what to reproduce.

**Check the platform's terms first.** Automated access sits against LinkedIn's
ToS even read-only on your own account. Keep volume low (a daily scan, not a
crawl), never automate applying or messaging without separate explicit human
confirmation per action, and understand you run this on your own account at
your own risk.

## One-time setup

1. Install `uv` (the server runs via `uvx`):
   - Windows PowerShell: `irm https://astral.sh/uv/install.ps1 | iex`
   - macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
2. Install `mcporter` (MCP client CLI): `npm install -g mcporter`
3. Register the server (use the ABSOLUTE path to `uvx` - some agents spawn
   commands in shells where `~/.local/bin` is not on PATH, and a bare `uvx`
   fails there):
   `mcporter config add linkedin --command <absolute-path-to-uvx> --arg "mcp-server-linkedin@latest" --scope home`
4. Log in once: `uvx mcp-server-linkedin@latest --login`
   A stealth Chromium window opens (first run downloads ~200 MB of browser
   components). Sign in to the candidate's LinkedIn there, including 2FA.
   Cookies are saved under `~/.linkedin-mcp/` and reused afterwards.

## Useful calls (via `mcporter call linkedin.<tool> key=value ...`)

- `search_jobs keywords="QA automation" location="Remote" max_pages=1` -
  scoped to the account's market when location is Remote; returns a results
  block plus `job_ids`.
- `get_job_details job_id="<id>"` - full posting: requirements, applicant
  count, workplace type. Run before ranking so the gates quote real text.
- `get_job_apply_url job_id="<id>"` - the direct application URL.
- `get_person_profile` / `search_people` - for the outreach phase, if the
  candidate wants to contact a hiring manager (approval-first, one at a time).

## Operational rules

- One or two searches per title per day. Portals reshuffle rather than
  replenish.
- If a call fails with a connection error right after a fresh shell, suspect
  the bare-`uvx` PATH issue above before suspecting the login.
- If LinkedIn throws a security checkpoint, stop and let the candidate resolve
  it manually in their normal browser. Never automate through a checkpoint.
