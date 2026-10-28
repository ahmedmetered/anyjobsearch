---
name: anyjobsearch
description: >-
  Run a full job search from any AI agent CLI: build a candidate profile, scan
  job portals, rank postings through hard eligibility and language gates plus
  scored dimensions, tailor CVs and cover letters, prepare for interviews, and
  track outcomes. Use when the user asks to find jobs, evaluate a job posting,
  rank offers, tailor a CV, draft a cover letter, prepare for an interview, or
  track applications.
---

# anyjobsearch

A job-search workflow that runs on the agent you already have. No build step,
no LaTeX, no market lock-in. The method is adapted from
[ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) (MIT) by
Mads Lorentzen; this pack makes it runtime-agnostic and market-agnostic.

## Rules that always apply

1. **Approval-first.** You never submit, send, or click "apply" anywhere. You
   prepare; the human submits.
2. **No fabrication, ever.** Mirror a posting's vocabulary only where it is
   true of the candidate. If a requirement is not met, say so in the report
   instead of hiding it in the CV.
3. **Evidence over vibes.** Every gate verdict and score quotes the exact
   posting text it rests on. The human is the tiebreaker, not the rubric.
4. **Keep candidate data in the candidate's data folder** (default
   `./job-search-data/` next to where the search runs, or a path the candidate
   names). Never write personal data into the skill folder.

## Workflow

Work the phases in order. Read the matching reference file before each phase.

### Phase 0: Profile (`references/profile.md`)

If no candidate profile exists in the data folder, build one before anything
else: interview the candidate in short rounds (history, skills, evidence,
preferences, constraints), or import from documents they provide (an existing
CV, a LinkedIn export, a portfolio). The profile records evidence for every
claim. A profile with unproven claims produces applications that fail later.

### Phase 1: Scan (`references/portals.md`)

Use whatever reach the agent actually has: an authenticated portal session, a
portal API or MCP tool, public job boards, or plain web search. Search the
candidate's target titles (use variants; let the profile's Titles section
broaden). Deduplicate by posting, then hand the survivors to Phase 2.

### Phase 2: Rank (`references/method.md`)

Run the two hard gates first (eligibility, then language). A gate failure
kills the posting before scoring: report it with the quoted source line
instead of silently dropping it. Postings that pass both gates are scored on
five dimensions; the shortlist is the ranked output with one line of reasoning
per posting.

### Phase 3: Apply (`references/applications.md`)

For each shortlisted posting the candidate approves: tailor the CV (mirror the
posting's true requirements, lead with evidence, one page), draft a cover
letter where one is expected, and produce a paste-ready application email or
form answers. Record every application in the tracker.

### Phase 4: Interview (`references/applications.md`, interview section)

For each interview: generate a company-specific prep doc (what they do, why
the candidate fits, likely questions mapped to the candidate's real evidence,
questions the candidate should ask). On request, run practice rounds: one
question at a time, feedback after each answer.

### Phase 5: Outcome (`references/applications.md`, tracker section)

Record results (rejected, interviewing, offer, withdrawn) in the tracker.
After ten or more recorded outcomes, run a pattern review: which score ranges,
titles, or portals actually convert, and adjust targeting.
