# Inbox feedback (any mailbox)

Reads replies to your applications from your own mailbox and updates the tracker, so rejections,
interview invites and tests stop depending on you typing them in. Works with any IMAP mailbox.

- **Read-only.** Mailboxes are opened read-only: nothing is marked as read, moved, deleted or sent.
- **Local.** Your password lives in `mail-config.json` (gitignored) and mail is only talked to from your machine.
- **Cautious.** Mail text is treated as data. A tracker row changes only when the sender or subject
  clearly names the company; anything uncertain is listed for you to review instead.

## Setup

```
cd sweeps/mail
npm i
node mail-check.mjs --init     # writes mail-config.json
```

Edit `mail-config.json`: put your address in `user` and an **app password** in `password`
(`provider` is detected from the address; leave it empty or set it yourself).

| Provider | Where to get the password |
|---|---|
| iCloud | account.apple.com > Sign-In and Security > App-Specific Passwords |
| Gmail | turn on 2-Step Verification, then myaccount.google.com/apppasswords |
| Yahoo | Account security > Generate app password |
| Fastmail | Settings > Privacy & Security > Integrations > New app password |
| Zoho / GMX | enable IMAP, create an app password |
| Outlook | work/school Microsoft 365 with IMAP enabled works; personal Outlook.com/Hotmail no longer allows password IMAP, so forward those messages into another mailbox |
| Proton | run Proton Mail Bridge and use the credentials it shows |
| anything else | `"provider": "custom"` with `host`, `port`, `secure` |

Test the login (reads no mail): `node mail-check.mjs --check`

## Use

```
node mail-check.mjs                # dry run: last 3 days, shows what it would change
node mail-check.mjs --since 60     # first time: look back 60 days to catch up on old rejections
node mail-check.mjs --apply        # write the changes to the tracker
```

What it does to a matched row:

| Email says | Tracker status becomes |
|---|---|
| rejection ("unfortunately", "purtroppo", "other candidates"...) | Rejected |
| interview invite (call, colloquio, calendly...) | Interviewing |
| recruiter question or a test / assignment | Replied |
| "we received your application" on a row still marked Found | Applied |

Closed rows (Rejected, Withdrawn, Offer) are never reopened and a status is never moved backwards.
Patterns cover English and Italian; add your language to the `RULES` table in `mail-check.mjs`.
Check the classifier any time with `node mail-check.mjs --selftest`.

Wire it into the daily routine by running `node mail-check.mjs --apply` at the start of the morning sweep.

Recruiter and employer emails (except plain "we received your application" acknowledgements) are also
kept on the application's card as a conversation, with a "new" badge, a "Replies waiting" filter and an
optional desktop notification in the tracker.
