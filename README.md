# anyjobsearch

The job-search method that runs on the AI agent you already have.

anyjobsearch is an agent-native skill pack: copy it into your agent's skills
folder and it carries a job search from empty profile to tracked outcome.
Profile building, portal scanning (including a documented logged-in LinkedIn
route), hard eligibility and language gates, five-dimension posting ranking,
an application tracker - and a built-in CV builder that renders tailored,
ATS-parseable one-page CVs to PDF with the browser already on your machine.
No build step, no LaTeX, no subscription beyond the agent itself, no market
lock-in. Where ai-job-search compiles CVs with LaTeX, this pack prints them
with Edge or Chrome; same method, lighter runtime.

Adapted from the Job Evaluation Framework and workflow of
[ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) by
Mads Lorentzen (MIT), whose own run of 69 tailored applications produced 20
interviews and one signed contract. That framework targets Claude Code, Bun,
LaTeX, and the Danish job market. This pack keeps the method, strips the
runtime requirements, and makes the portals bring-your-own.

## Install

Copy `skill/` into whichever folder your agent discovers skills from:

| Agent | Folder |
|---|---|
| ZCode | `~/.agents/skills/anyjobsearch` or `~/.zcode/skills/anyjobsearch` |
| Claude Code | `~/.claude/skills/anyjobsearch` |
| Codex CLI | per your skills discovery path |
| Cursor | `.agents/skills/anyjobsearch` in the workspace |
| Anything else | any folder your agent reads `SKILL.md` files from |

Then start a new session and ask for what you need:

- "Build my candidate profile" (Phase 0, once)
- "Scan for QA automation roles, remote" (Phase 1)
- "Evaluate this posting: <URL or text>" (Phase 2)
- "Tailor my CV for <posting>" (Phase 3)
- "Prep me for the interview at <company>" (Phase 4)
- "I got a rejection from <company>" (Phase 5)

## The method, briefly

Two hard gates run before any scoring, because no score fixes a hard no:

1. **Eligibility gate** - citizenship, residency, clearance, and your permit's
   hour or timing caps, checked against the posting's own words.
2. **Language gate** - the languages the *job* requires versus the languages
   you actually declare, with stretch cases flagged for you to judge.

Postings that pass both gates are scored on five dimensions: technical skills
match, experience match (function over title), behavioral fit, location and
logistics, and career alignment. The shortlist quotes its reasoning. Gate
failures are reported with the quoted posting text instead of vanishing.

Applications are approval-first: the agent prepares, you submit. Nothing is
fabricated; gaps in your evidence are surfaced to you, not hidden from the
employer.

## Files

```
skill/
  SKILL.md                  workflow router (phases, rules)
  references/method.md      gates + scoring + shortlist rules
  references/profile.md     candidate profile template
  references/portals.md     bring-your-own-portal scanning routes
  references/linkedin.md    worked logged-in LinkedIn setup + calls
  references/applications.md  CV tailoring, cover letters, interviews, tracker
  references/cv-builder.md  how to use the bundled CV builder
cv/
  template.html             single-page ATS-parseable CV template
  print_pdf.mjs             HTML to PDF via Edge/Chrome, no LaTeX
  audit_layout.py           numeric layout audit against a reference PDF
examples/
  example-profile.md        a fictional candidate, filled in
  example-evaluation.md     a fictional posting evaluation
```

## Credits and license

MIT. Method adapted from
[ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) by
Mads Lorentzen; the gates and scoring dimensions follow his framework's
design. The CV renderer is adapted from
[cvhtml2doc](https://github.com/ahmedmetered/cvhtml2doc) by the same author.
This pack is an independent project and is not affiliated with or endorsed by
Anthropic, LinkedIn, or any job board.
