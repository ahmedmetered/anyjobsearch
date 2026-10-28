# Ranking method

Adapted from the Job Evaluation Framework in
[ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) (MIT).
Run the gates in order before any scoring. A gate failure is a hard stop:
report it to the candidate with the quoted posting text instead of dropping
the posting silently, because candidates often know things about their own
status that the profile does not record.

## Gate 1: Eligibility

Read the posting's eligibility, work-rights, or "who can apply" section
verbatim and classify:

| Posting wording | Verdict |
|---|---|
| Names a citizenship or permanent-residency requirement, or "full working rights" meaning citizen/PR | FAIL. Quote the exact wording. |
| Requires a security clearance | FAIL in most countries (clearance is usually citizenship-gated). Verify the specific scheme rather than assuming. |
| Explicitly welcomes the candidate's permit class, international applicants, or visa sponsorship | PASS. Note it as a positive in the application. |
| Silent on citizenship or residency | PROCEED, marked unverified. Check the employer's own careers page before drafting. |

Two rules that are easy to get wrong:

1. Silence is not permission. Large graduate programs often gate eligibility
   on their own website rather than in the ad. Highest-risk categories:
   professional services, government and defence, banking, telecoms, and
   anything touching critical infrastructure.
2. A company-wide "we welcome international applicants" statement is not
   role-level permission. Confirm the specific posting or stream appears on
   any named list before drafting.

If the candidate's permit also constrains hours or start date (a student cap,
a permit that begins at graduation), record that as a separate second gate
during profile setup, with the specific dates. It fails for different reasons
than eligibility and needs a different answer.

## Gate 2: Language

Compare the languages the posting requires **as a condition of the job**
against the candidate's Languages table. The language the ad happens to be
written in does not matter; the language the job requires does.

| Requirement vs. candidate's table | Verdict |
|---|---|
| Requires a language not on the table at all | FAIL. Quote the requirement line. |
| Requires a listed language at a stated bar that plausibly exceeds the candidate's declared level ("fluent" vs. B1) | FLAG, then proceed: score and draft normally, but surface the gap with both texts quoted so the candidate decides. |
| Requires a listed language at or below the declared level, or names no level | PASS. No note needed. |

When unsure whether a stated bar exceeds the candidate's level, prefer FLAG
over a silent pass. Levels appear in the wild as CEFR letters, LinkedIn
buckets, and plain words; they do not map onto each other precisely.

## Scoring (postings that pass both gates)

Five dimensions. Score 0-100 where tables say so; pass/fail where they say so.

### 1. Technical skills match (0-100)
80-100 core requirements are the candidate's primary skills; 60-79 most match
with one or two learnable gaps; 40-59 partial with significant upskilling;
0-39 fundamental mismatch.

### 2. Experience match (0-100)
Match on the function and nature of the work, not the literal title: a "Data
Consultant" and a "Data Scientist" role can be functionally identical.
80-100 same domain and role type; 60-79 related and transferable; 40-59
adjacent, would need to make the case; 0-39 unrelated.

### 3. Behavioral and culture fit (0-100)
Compare the role and company against the profile's behavioral section. Research
red flags (department churn, maintenance-dominated work, poor leadership
reviews) from reviews, press, and the candidate's network before scoring.

### 4. Location and logistics (pass/fail + notes)
Within commute or remote: pass. Requires relocation: fail if the profile marks
relocation a deal-breaker. Heavy travel: flag for the candidate to judge.

### 5. Career alignment and motivation (0-100)
Does the role advance the profile's stated direction, and will the actual tasks
energize the candidate? Evaluate the tasks, not the title. A role the candidate
can do but will resent scores low here, and the report should say why.

Optional sixth: salary benchmark against the candidate's target range, if the
profile records one and the agent has data. Present as a range comparison, not
a verdict.

## Shortlist rules

- Rank pass-gate postings by the five scores, highest weighted sum first.
- Include one line of reasoning per posting, naming the strongest and weakest
  dimension.
- Report gate failures and language flags in a separate section with quotes;
  never silently discard them.
- A candidate who rejects a shortlisted posting gets its rejection reason
  recorded in the profile preferences, so the same class of posting ranks
  lower next time.
