// Reads your inbox (read-only, any IMAP mailbox) for replies to job applications and updates the tracker.
//
// Setup (one time):
//   node mail-check.mjs --init           writes mail-config.json (gitignored) - fill in user + password
//   node mail-check.mjs --check          tests the login and lists mailbox folders, reads no mail
// Providers with presets: icloud, gmail, outlook (work/school), yahoo, fastmail, zoho, gmx, proton (Bridge), custom.
// Most providers need an APP PASSWORD, not your normal password (see PROVIDERS below for where to make it).
//
// Usage:
//   node mail-check.mjs                  dry run, last 3 days, prints what it would change
//   node mail-check.mjs --since 60      look back 60 days (use once to backfill rejections)
//   node mail-check.mjs --apply          write status changes to the tracker (strong matches only)
//   node mail-check.mjs --selftest       offline check of the classifier, matcher and provider detection
//
// Safety: mailboxes are opened READ-ONLY (no flags change, nothing is moved or deleted); mail text is
// treated as data and only matched against fixed patterns; only strong company matches are applied,
// everything else goes to the "review" list in mail-report.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const TRACKER = process.env.TRACKER_URL || "http://localhost:8788";

// ---------- providers ----------
export const PROVIDERS = {
  icloud:   { host: "imap.mail.me.com",        port: 993, secure: true,  domains: /(^|\.)(icloud|me|mac)\.com$/i,           help: "App-specific password: account.apple.com > Sign-In and Security > App-Specific Passwords" },
  gmail:    { host: "imap.gmail.com",          port: 993, secure: true,  domains: /^(gmail|googlemail)\.com$/i,             help: "Turn on 2-Step Verification, then create an App Password at myaccount.google.com/apppasswords (IMAP is always on)" },
  outlook:  { host: "outlook.office365.com",   port: 993, secure: true,  domains: /^(outlook|hotmail|live|msn)\./i,          help: "Work/school Microsoft 365 accounts with IMAP enabled work with a password. Personal Outlook.com/Hotmail accounts no longer allow password login over IMAP: use a forwarding rule into a Gmail/iCloud mailbox, or the custom provider with a local bridge" },
  yahoo:    { host: "imap.mail.yahoo.com",     port: 993, secure: true,  domains: /(^|\.)yahoo\./i,                         help: "Account security > Generate app password" },
  fastmail: { host: "imap.fastmail.com",       port: 993, secure: true,  domains: /(^|\.)fastmail\.(com|fm)$/i,             help: "Settings > Privacy & Security > Integrations > New app password (IMAP access)" },
  zoho:     { host: "imap.zoho.com",           port: 993, secure: true,  domains: /(^|\.)zoho\.(com|eu)$/i,                 help: "Enable IMAP in Zoho Mail settings and create an app-specific password" },
  gmx:      { host: "imap.gmx.com",            port: 993, secure: true,  domains: /(^|\.)(gmx|web)\.(com|de|net)$/i,        help: "Enable IMAP in GMX settings" },
  proton:   { host: "127.0.0.1",               port: 1143, secure: false, domains: /(^|\.)(proton\.me|protonmail\.com|pm\.me)$/i, help: "Needs the Proton Mail Bridge app running locally; use the Bridge username/password it shows" },
  custom:   { host: "",                        port: 993, secure: true,  domains: null,                                        help: "Set host (and port/secure) in mail-config.json" },
};
export function detectProvider(user = "") {
  const dom = (user.split("@")[1] || "").toLowerCase();
  for (const [name, p] of Object.entries(PROVIDERS)) if (p.domains && p.domains.test(dom)) return name;
  return "custom";
}
export function loadConfig(dir) {
  let c = {};
  for (const f of ["mail-config.json", "mail-secrets.json"]) { // second name = older iCloud-only file
    try { c = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); break; } catch {}
  }
  const env = process.env;
  const user = env.MAIL_USER || c.user || "";
  const password = env.MAIL_PASSWORD || c.password || c.appPassword || "";
  const provider = (env.MAIL_PROVIDER || c.provider || detectProvider(user)).toLowerCase();
  const preset = PROVIDERS[provider] || PROVIDERS.custom;
  return {
    user, password, provider,
    host: env.MAIL_HOST || c.host || preset.host,
    port: +(env.MAIL_PORT || c.port || preset.port),
    secure: c.secure ?? preset.secure,
    folders: c.folders || ["INBOX"],          // extra folders to scan besides Junk/Spam, e.g. ["INBOX", "Jobs"]
    help: preset.help,
  };
}

// ---------- classification (Italian + English) ----------
const RULES = [
  ["rejection", /unfortunately|regret to inform|not (be )?(moving|proceeding|going) forward|will not be (moving|proceeding)|decided (not )?to (move forward|proceed|continue) with (other|another)|other candidates|position (has been|was) filled|not (been )?selected|purtroppo|non (è|e'|sarà) possibile proseguire|non proseguire|proseguire con (altri|altre)|altri candidati|candidatura non (è|e') stata (accolta|selezionata)|non risulta in linea|non in linea con|ci dispiace|abbiamo deciso di non|non (siamo|saremo) in grado di (procedere|proseguire)/i],
  ["interview", /colloquio|interview|call conoscitiv|schedule a (call|time|chat)|book a (call|time)|calendly|invit(e|ing) you to (a|an) (call|chat|meeting)|incontro|videocall|google meet|zoom\.us|teams meeting|disponibilit[àa] per|your availability/i],
  ["test", /prova (tecnica|di pre)|pre-?selezione|assignment|take-?home|technical (test|challenge|exercise)|test tecnic|coding challenge|case study|assessment|hackerrank|codility|testgorilla|domanda di progettazione/i],
  ["info", /potresti rispondere|could you (please )?(answer|share|send|confirm|tell)|alcune domande|a few questions|following questions|rispondere alle seguenti|ti chiedo di (inviare|confermare)/i],
  ["ack", /abbiamo ricevuto|received your application|thank you for (applying|your application|your interest)|grazie per (aver|la tua|il tuo)|application (has been )?(received|submitted)|candidatura (ricevuta|inviata)|we.ll (review|be in touch)|ti contatteremo/i],
];
export function classify(subject = "", body = "") {
  const text = `${subject}\n${body}`.slice(0, 6000);
  for (const [kind, re] of RULES) if (re.test(text)) return kind;
  return "other";
}

// ---------- matching an email to a tracker entry ----------
const LEGAL = /\b(s\.?p\.?a\.?|s\.?r\.?l\.?s?\.?|gmbh|inc\.?|ltd\.?|llc|group|italia|italy|holding|società benefit|for client|the)\b/gi;
export const normCo = c => (c || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(LEGAL, " ").replace(/[^a-z0-9]+/g, " ").trim();
const PLATFORM = /(greenhouse|lever|ashbyhq|workable|smartrecruiters|recruitee|linkedin|indeed|teamtailor|breezy|bamboohr|jobvite|icims|workday|personio|join\.com|hirevue|hackerrank|codility|testgorilla|noreply|no-reply|mailchimp|sendgrid)/i;
export function matchEmail(mail, apps) {
  const from = (mail.from || "").toLowerCase();
  const dom = (from.match(/@([a-z0-9.-]+)/) || [])[1] || "";
  const domLabels = dom.split(".").filter(x => !["com", "it", "io", "co", "net", "org", "eu", "de", "uk", "mail", "mg", "email", "hr", "jobs", "careers"].includes(x));
  const subj = (mail.subject || "").toLowerCase();
  const head = (mail.body || "").slice(0, 600).toLowerCase();
  const isPlatform = PLATFORM.test(dom) || PLATFORM.test(from);
  const hits = [];
  for (const a of apps) {
    const n = normCo(a.company); if (n.length < 4) continue;
    const squashed = n.replace(/ /g, "");
    let strength = 0;
    if (!isPlatform && domLabels.some(l => l.length >= 4 && (l === squashed || l.includes(squashed) || squashed.includes(l)))) strength = 2;
    else if (subj.includes(n) || new RegExp(`\\b${n.replace(/ /g, "\\s+")}\\b`).test(from.replace(/@.*/, ""))) strength = 2;
    else if (isPlatform && head.includes(n)) strength = 2;
    else if ((mail.body || "").toLowerCase().includes(n)) strength = 1;
    if (strength) hits.push({ app: a, strength });
  }
  if (!hits.length) return { kind: "none" };
  const top = Math.max(...hits.map(h => h.strength));
  const best = hits.filter(h => h.strength === top);
  // several rows at one company: prefer the application he actually sent
  const live = best.filter(h => ["Applied", "Replied", "Interviewing", "Ready to send"].includes(h.app.status));
  const pick = live.length ? live : best;
  const companies = new Set(pick.map(h => normCo(h.app.company)));
  if (companies.size > 1) return { kind: "ambiguous", candidates: pick.map(h => h.app.company) };
  if (top < 2) return { kind: "weak", app: pick[0].app };
  if (pick.length > 1 && live.length !== 1) return { kind: "ambiguous", candidates: pick.map(h => `${h.app.company} - ${h.app.role}`) };
  return { kind: "strong", app: pick[0].app };
}

// ---------- status mapping ----------
const RANK = { Found: 0, "Ready to send": 1, Applied: 2, Replied: 3, Interviewing: 4, Offer: 5 };
export function decide(kind, app) {
  if (["Rejected", "Withdrawn", "Offer"].includes(app.status)) return null; // never reopen a closed row
  if (kind === "rejection") return "Rejected";
  if (kind === "interview") return (RANK[app.status] ?? 0) >= 4 ? null : "Interviewing";
  if (kind === "test" || kind === "info") return (RANK[app.status] ?? 0) >= 3 ? null : "Replied";
  if (kind === "ack") return (RANK[app.status] ?? 0) >= 2 ? null : "Applied"; // he applied but never marked it
  return null;
}

// ---------- self test ----------
function selftest() {
  const cases = [
    ["Buongiorno, siamo in fase di selezione per Automation Specialist... Potresti rispondere alle seguenti domande?", "info"],
    ["Grazie tutto chiaro. Prima di procedere chiediamo di completare una breve prova di pre-selezione. DOMANDA DI PROGETTAZIONE TECNICA", "test"],
    ["Thank you for applying. Unfortunately, we have decided to move forward with other candidates.", "rejection"],
    ["Purtroppo la tua candidatura non è in linea con il profilo ricercato", "rejection"],
    ["We would like to invite you to a call. Pick a time on calendly.com/x", "interview"],
    ["Abbiamo ricevuto la tua candidatura, ti contatteremo.", "ack"],
    ["Weekly newsletter: 10 tips for your CV", "other"],
  ];
  let ok = true;
  for (const [t, want] of cases) { const got = classify("", t); if (got !== want) { ok = false; console.log("FAIL", want, "got", got, "::", t.slice(0, 60)); } }
  const apps = [{ company: "Acme", role: "Automation Developer", status: "Applied" }, { company: "Globex", role: "Test Automation Engineer", status: "Applied" }, { company: "Globex", role: "Sviluppatore Playwright", status: "Applied" }, { company: "Initech", role: "Analytics Engineer", status: "Found" }];
  const m1 = matchEmail({ from: "Anna HR <hr@acme.it>", subject: "Re: Automation Specialist - Acme", body: "Grazie" }, apps);
  const m2 = matchEmail({ from: "no-reply@greenhouse.io", subject: "Your application to Initech", body: "Unfortunately" }, apps);
  const m3 = matchEmail({ from: "jobs@globex.it", subject: "Colloquio", body: "ciao" }, apps);
  const m4 = matchEmail({ from: "news@random.com", subject: "Offers", body: "see our partner initech" }, apps);
  const checks = [[m1.kind === "strong" && m1.app.company === "Acme", "acme strong"], [m2.kind === "strong" && m2.app.company === "Initech", "greenhouse subject strong"], [m3.kind === "ambiguous", "two globex rows ambiguous"], [m4.kind === "weak", "body-only weak"], [decide("rejection", apps[0]) === "Rejected", "reject maps"], [decide("test", { status: "Interviewing" }) === null, "no downgrade"], [decide("ack", { status: "Found" }) === "Applied", "ack backfills Applied"]];
  for (const [pass, name] of checks) if (!pass) { ok = false; console.log("FAIL", name); }
  for (const [u, want] of [["a@icloud.com", "icloud"], ["a@me.com", "icloud"], ["x@gmail.com", "gmail"], ["x@outlook.com", "outlook"], ["x@hotmail.it", "outlook"], ["x@yahoo.it", "yahoo"], ["x@proton.me", "proton"], ["x@mycompany.io", "custom"]])
    if (detectProvider(u) !== want) { ok = false; console.log("FAIL provider", u, detectProvider(u)); }
  console.log(ok ? "selftest OK" : "selftest FAILED"); process.exit(ok ? 0 : 1);
}

// ---------- main ----------
async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--selftest")) return selftest();
  const apply = argv.includes("--apply");
  const si = argv.indexOf("--since"); const days = si > -1 ? +argv[si + 1] : 3;
  if (argv.includes("--init")) {
    const target = path.join(here, "mail-config.json");
    if (fs.existsSync(target)) { console.log("mail-config.json already exists"); return; }
    fs.writeFileSync(target, JSON.stringify({ provider: "", user: "you@example.com", password: "", host: "", port: 993, secure: true, folders: ["INBOX"] }, null, 2));
    console.log("created mail-tools/mail-config.json. Fill in user + password (provider is auto-detected from the address).\nPresets: " + Object.keys(PROVIDERS).join(", ")); return;
  }
  const cfg = loadConfig(here);
  if (!cfg.user || !cfg.password || cfg.user === "you@example.com") { console.log("MAIL NOT CONFIGURED: run `node mail-check.mjs --init`, then fill in mail-tools/mail-config.json (user + app password)"); return; }
  if (!cfg.host) { console.log("MAIL NOT CONFIGURED: provider '" + cfg.provider + "' needs a host in mail-config.json"); return; }

  const { ImapFlow } = await import("imapflow");
  const { simpleParser } = await import("mailparser");
  const statePath = path.join(here, "mail-state.json");
  const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : { seen: [] };
  const seen = new Set(state.seen);
  const me = cfg.user.toLowerCase();

  async function connect(user) {
    const c = new ImapFlow({ host: cfg.host, port: cfg.port, secure: cfg.secure, auth: { user, pass: cfg.password }, logger: false });
    await c.connect(); return c;
  }
  let client;
  try { client = await connect(cfg.user); }
  catch (e) {
    // some providers (iCloud, GMX) accept only the part before the @ as the login
    try { client = await connect(cfg.user.split("@")[0]); }
    catch (e2) { console.log("IMAP LOGIN FAILED on " + cfg.host + ": " + e.message + "\nHint (" + cfg.provider + "): " + cfg.help); return; }
  }
  if (argv.includes("--check")) {
    const boxes = await client.list();
    console.log("login OK on " + cfg.host + " as " + cfg.user + ". Folders: " + boxes.map(b => b.path + (b.specialUse ? " [" + b.specialUse + "]" : "")).join(", "));
    await client.logout(); return;
  }
  const apps = await (await fetch(TRACKER + "/api/apps")).json();

  const boxes = [...cfg.folders];
  try { for (const b of await client.list()) if (b.specialUse === "\\Junk" && !boxes.includes(b.path)) boxes.push(b.path); } catch {}
  const since = new Date(Date.now() - days * 864e5);
  const report = { strong: [], review: [], ignored: 0, scanned: 0, applied: [] };

  for (const box of boxes) {
    const lock = await client.getMailboxLock(box, { readOnly: true });
    try {
      const uids = await client.search({ since }, { uid: true });
      for (const uid of uids || []) {
        const msg = await client.fetchOne(uid, { source: true, envelope: true }, { uid: true });
        const mail = await simpleParser(msg.source);
        const id = mail.messageId || `${box}:${uid}`;
        if (seen.has(id)) continue; seen.add(id); report.scanned++;
        const fromAddr = mail.from?.value?.[0]?.address?.toLowerCase() || "";
        if (fromAddr === me) continue;
        const m = { from: `${mail.from?.text || ""}`, subject: mail.subject || "", body: (mail.text || "").slice(0, 5000), date: (mail.date || new Date()).toISOString().slice(0, 10) };
        const match = matchEmail(m, apps);
        if (match.kind === "none") { report.ignored++; continue; }
        const kind = classify(m.subject, m.body);
        if (kind === "other" && match.kind !== "strong") { report.ignored++; continue; }
        const item = { date: m.date, from: m.from, subject: m.subject, kind, match: match.kind, company: match.app?.company, role: match.app?.role, id: match.app?.id, candidates: match.candidates };
        if (match.kind === "strong" && kind !== "other") {
          const next = decide(kind, match.app);
          item.change = next ? `${match.app.status} -> ${next}` : "no change";
          report.strong.push(item);
          // keep the email itself on the application card, so the reply can be read in the tracker (acknowledgements are skipped as noise)
          if (apply && kind !== "ack") {
            await fetch(`${TRACKER}/api/apps/${match.app.id}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ id, platform: "email", dir: "in", text: ((m.subject ? m.subject + "\n\n" : "") + m.body).slice(0, 1400), ts: (mail.date || new Date()).toISOString() }] }) }).catch(() => {});
          }
          if (apply && next) {
            const note = `${match.app.notes ? match.app.notes + " | " : ""}Email ${m.date} (${kind}): ${m.subject.slice(0, 80)}`;
            const r = await fetch(`${TRACKER}/api/apps/${match.app.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next, notes: note, updated: m.date }) });
            if (r.ok) { report.applied.push(`${match.app.company}: ${match.app.status} -> ${next}`); match.app.status = next; }
          }
        } else report.review.push(item);
      }
    } finally { lock.release(); }
  }
  await client.logout();
  if (apply || days <= 3) fs.writeFileSync(statePath, JSON.stringify({ seen: [...seen].slice(-5000) }));
  fs.writeFileSync(path.join(here, "mail-report.json"), JSON.stringify(report, null, 1));
  console.log(`scanned ${report.scanned} new emails (${days}d): ${report.strong.length} matched to applications, ${report.review.length} need review, ${report.ignored} unrelated`);
  report.strong.forEach(i => console.log(`  ${i.kind.padEnd(9)} ${i.company} - ${i.role} :: ${i.change} :: ${i.subject.slice(0, 60)}`));
  report.review.forEach(i => console.log(`  REVIEW ${i.kind.padEnd(9)} ${i.match} ${i.company || (i.candidates || []).join("/")} :: ${i.subject.slice(0, 60)}`));
  if (apply) console.log(`applied ${report.applied.length} tracker updates`); else console.log("dry run: nothing written (add --apply)");
}
main().catch(e => { console.log("mail-check error:", e.message); process.exit(0); });
