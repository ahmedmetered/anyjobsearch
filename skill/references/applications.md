# Applications, interviews, and the tracker

## CV tailoring

One base CV per candidate, one tailored variant per posting. Rules:

- One page. If it does not fit, the weakest bullet goes, not the font size.
- Lead with evidence: live products, repositories with green CI, shipped
  work. A repo with tests proves more than an adjective.
- Mirror the posting's vocabulary only where it is true. If the posting says
  "Robot Framework" and the candidate has never used it, the CV says nothing
  about Robot Framework; the report to the candidate mentions the gap instead.
- Reframe, never invent: a contact-center QA background is "multi-channel
  quality assurance and root-cause analysis," which is true and relevant. It
  is not "software QA at scale," which is false.
- Keep dates, grades, and numbers exact. Reviewers cross-check.
- Produce the CV in the format the candidate can actually send: plain
  markdown if they render it themselves, HTML printed to PDF if the agent has
  a browser, or the candidate's existing CV pipeline if they have one they
  trust.

## Cover letters

Only where the posting expects one. Structure: why this company (one specific,
true observation), why this candidate (the two strongest evidence matches),
what happens next (availability, permit timing if relevant, thanks). Under 200
words, plain sentences, no em dashes, no "I am passionate about." Forward-
looking framing beats recap: what the candidate would do in the role, not what
they did somewhere else.

## Application ethics

- Nothing is ever submitted without the candidate's explicit confirmation of
  that single application.
- Every answer in an employer's form is traceable to the profile or flagged as
  a guess.
- If a posting turns out to fail a gate after drafting, stop and tell the
  candidate instead of sending anyway.

## Interview preparation

For each interview, generate a prep doc: what the company does (verified from
its own materials), why the candidate fits (mapped to their real evidence),
likely questions with the candidate's strongest true answer for each, the
candidate's questions for them, and logistics. Practice mode: one question at
a time, honest feedback after each answer, retry until the answer lands.

## Tracker

Keep a tracker in the data folder - either a `tracker.md` table (below) or
the bundled localhost tracker: `node tracker/server.mjs`, then open
http://localhost:8788. It stores the same fields in a JSON file on disk
(`tracker-data.json`), supports editable status, CV variant, and notes per
application, JSON export, and an import endpoint the agent can push found
postings into. One row per application:

```
| Date | Company | Role | Source | CV variant | Status | Next action | Due |
```

Statuses: applied, rejected, interviewing, offer, withdrawn. After ten
recorded outcomes, review patterns with the candidate: which dimension scores
predicted real outcomes, which portal converts, which title variant gets
replies. Adjust targeting from evidence, not from discouragement.
