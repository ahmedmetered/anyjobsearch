#!/usr/bin/env node
// anyjobsearch tracker server - zero dependencies, one JSON file as the database.
// Run:   node server.mjs [--port 8788] [--data tracker-data.json]
// Open:  http://localhost:8788
//
// API (for the agent that hunts):
//   GET    /api/apps              list all applications
//   POST   /api/apps              add one  {company, role, source?, url?, salary?, cv?, status?, notes?}
//   POST   /api/apps/bulk         import many  {apps:[...]} - dedupes on company+role
//   PATCH  /api/apps/<id>         update any fields (status, notes, next, ...)
//   POST   /api/apps/<id>/messages  add conversation messages {messages:[{id,platform,dir,text,ts}]}
//   DELETE /api/apps/<id>         remove
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback; };
const PORT = Number(arg("--port", "8788"));
const DATA = path.resolve(arg("--data", path.join(process.cwd(), "tracker-data.json")));
const STATUSES = ["Found", "Ready to send", "Applied", "Replied", "Interviewing", "Offer", "Rejected", "Withdrawn"];
const MODES = ["Remote", "Hybrid", "On-site"];
const TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
const MAX_BODY = 2 * 1024 * 1024; // 2 MB
const today = () => new Date().toISOString().slice(0, 10);

// AUD-1: an unparseable data file must never become an empty database.
// Quarantine it under a new name and fail loudly instead.
const readData = () => {
  try {
    const d = JSON.parse(fs.readFileSync(DATA, "utf8"));
    return Array.isArray(d) ? d : [];
  } catch (e) {
    if (fs.existsSync(DATA)) {
      const quarantine = `${DATA}.corrupt-${Date.now()}`;
      fs.renameSync(DATA, quarantine);
      throw new Error(`tracker-data.json was unreadable and has been moved to ${path.basename(quarantine)}. Fix or delete it, then restart. (${e.message})`);
    }
    return [];
  }
};
const writeData = d => {
  const tmp = DATA + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2));
  fs.renameSync(tmp, DATA);
};

// AUD-2: mutations only from the machine's own origin - a web page cannot
// no-cors-post into the tracker from elsewhere.
const sameOrigin = req => {
  const host = req.headers.host || "";
  const okHost = host === `localhost:${PORT}` || host === `127.0.0.1:${PORT}`;
  const origin = req.headers.origin;
  if (origin && !/^https?:\/\/(localhost|127\.0\.0\.1):(\d+)$/.test(origin)) return false;
  return okHost;
};

// AUD-3: serialize every read-modify-write so concurrent requests
// (agent bulk-post during a human edit) cannot lose updates.
let writeTail = Promise.resolve();
const serialized = fn => {
  const run = writeTail.then(fn);
  writeTail = run.catch(() => {});
  return run;
};

const pickUrl = u => (/^https?:\/\//i.test(u || "") ? u.trim() : ""); // AUD-5: no javascript: or data: schemes
// ---- conversation threads: email replies are added by mail-tools/mail-check.mjs ----
const cleanMsg = m => ({ id: cap(String((m && m.id) || ""), 120), platform: cap(m && m.platform, 20), dir: m && m.dir === "out" ? "out" : "in", text: cap(m && m.text, 1500), ts: cap(m && m.ts, 30) });
const cleanMessages = list => (Array.isArray(list) ? list : []).map(cleanMsg).filter(m => m.id && m.ts).slice(-40);
const intOf = (v, max) => Math.max(0, Math.min(max, Number.isFinite(+v) ? Math.trunc(+v) : 0));
// adds new messages to a record: dedupes by id, keeps the newest 40, counts new inbound ones as unread
const mergeMessages = (record, incoming, silent = false) => {
  const have = new Set((record.messages || []).map(m => m.id));
  const fresh = cleanMessages(incoming).filter(m => !have.has(m.id));
  if (!fresh.length) return { record, added: 0 };
  const messages = [...(record.messages || []), ...fresh].sort((a, b) => a.ts.localeCompare(b.ts)).slice(-40);
  const lastIn = messages.filter(m => m.dir === "in").pop(), lastOut = messages.filter(m => m.dir === "out").pop();
  const unread = (record.unread || 0) + (silent ? 0 : fresh.filter(m => m.dir === "in").length);
  return { record: { ...record, messages, unread, last_in: lastIn ? lastIn.ts : "", last_out: lastOut ? lastOut.ts : "", updated: today() }, added: fresh.length };
};

const oneOf = (v, list) => (list.includes(v) ? v : "");
const cap = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
const normalize = a => ({
  id: a.id || crypto.randomUUID().slice(0, 8),
  company: (a.company || "").trim().slice(0, 120),
  role: (a.role || "").trim().slice(0, 160),
  source: cap(a.source, 120),
  url: pickUrl(a.url),
  salary: cap(a.salary, 120),
  cv: cap(a.cv, 80),
  mode: oneOf(a.mode, MODES),                     // AUD-8: validated, not merged raw
  type: oneOf(a.type, TYPES),
  location: cap(a.location, 80),
  top: !!a.top,
  easy: !!a.easy,
  status: STATUSES.includes(a.status) ? a.status : "Found",
  date: cap(a.date, 10),
  next: cap(a.next, 200),
  notes: cap(a.notes, 4000),
  messages: cleanMessages(a.messages), unread: intOf(a.unread, 999), last_in: cap(a.last_in, 30), last_out: cap(a.last_out, 30),
  added: cap(a.added, 10) || today(),
  updated: a.updated || today()
});
// PATCH uses the same field rules without rebuilding the record
const applyPatch = (record, patch) => {
  const next = { ...record };
  if ("company" in patch) next.company = (patch.company || "").trim().slice(0, 120);
  if ("role" in patch) next.role = (patch.role || "").trim().slice(0, 160);
  if ("source" in patch) next.source = cap(patch.source, 120);
  if ("url" in patch) next.url = pickUrl(patch.url);
  if ("salary" in patch) next.salary = cap(patch.salary, 120);
  if ("cv" in patch) next.cv = cap(patch.cv, 80);
  if ("mode" in patch) next.mode = oneOf(patch.mode, MODES);
  if ("type" in patch) next.type = oneOf(patch.type, TYPES);
  if ("location" in patch) next.location = cap(patch.location, 80);
  if ("top" in patch) next.top = !!patch.top;
  if ("easy" in patch) next.easy = !!patch.easy;
  if ("status" in patch) next.status = STATUSES.includes(patch.status) ? patch.status : record.status;
  if ("date" in patch) next.date = cap(patch.date, 10);
  if ("next" in patch) next.next = cap(patch.next, 200);
  if ("notes" in patch) next.notes = cap(patch.notes, 4000);
  if ("added" in patch) next.added = cap(patch.added, 10);
  if ("unread" in patch) next.unread = intOf(patch.unread, 999);
  if ("messages" in patch) next.messages = cleanMessages(patch.messages);
  // marking something Applied stamps the application date once
  if (next.status === "Applied" && !next.date) next.date = today();
  next.updated = today();
  return next;
};

async function readBody(req) {
  let body = "", size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("request body too large");
    body += chunk;
  }
  try { return JSON.parse(body || "{}"); } catch { return {}; }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const send = (code, payload, type = "application/json") => {
    res.writeHead(code, { "content-type": type + "; charset=utf-8" });
    res.end(typeof payload === "string" || Buffer.isBuffer(payload) ? payload : JSON.stringify(payload, null, 2));
  };
  const mutating = ["POST", "PATCH", "DELETE"].includes(req.method);
  try {
    if (mutating && !sameOrigin(req)) return send(403, { error: "cross-origin requests are not allowed" });

    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html"))
      return send(200, fs.readFileSync(path.join(here, "index.html"), "utf8"), "text/html");

    if (url.pathname === "/api/apps" && req.method === "GET") return send(200, readData());

    if (url.pathname === "/api/apps" && req.method === "POST") {
      const body = await readBody(req);
      return serialized(() => {
        const app = normalize(body);
        if (!app.company) return send(400, { error: "company is required" });
        const d = readData(); d.push(app); writeData(d);
        send(201, app);
      });
    }

    if (url.pathname === "/api/apps/bulk" && req.method === "POST") {
      const body = await readBody(req);
      if (!Array.isArray(body.apps)) return send(400, { error: "body must be {apps:[...]}" });
      return serialized(() => {
        const d = readData();
        const seen = new Set(d.map(a => (a.company + "|" + a.role).toLowerCase()));
        const added = [];
        for (const item of body.apps) {
          const app = normalize(item);
          if (!app.company || seen.has((app.company + "|" + app.role).toLowerCase())) continue;
          seen.add((app.company + "|" + app.role).toLowerCase());
          d.push(app); added.push(app);
        }
        writeData(d);
        send(200, { added: added.length, apps: added });
      });
    }

    const mm = url.pathname.match(/^\/api\/apps\/([\w-]+)\/messages$/);
    if (mm && req.method === "POST") {
      const body = await readBody(req);
      return serialized(() => {
        const d = readData();
        const i = d.findIndex(a => a.id === mm[1]);
        if (i < 0) return send(404, { error: "not found" });
        const out = mergeMessages(d[i], body.messages, !!body.silent);
        d[i] = out.record; writeData(d);
        send(200, { added: out.added, app: d[i] });
      });
    }

    const m = url.pathname.match(/^\/api\/apps\/([\w-]+)$/);
    if (m) {
      const body = req.method === "PATCH" ? await readBody(req) : {};
      return serialized(() => {
        const d = readData();
        const i = d.findIndex(a => a.id === m[1]);
        if (i < 0) return send(404, { error: "not found" });
        if (req.method === "PATCH") {
          d[i] = applyPatch(d[i], body);
          writeData(d);
          return send(200, d[i]);
        }
        if (req.method === "DELETE") { const [rm] = d.splice(i, 1); writeData(d); return send(200, rm); }
      });
    }
    send(404, { error: "not found" });
  } catch (e) {
    send(500, { error: String(e.message || e) });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`anyjobsearch tracker  ->  http://localhost:${PORT}`);
  console.log(`data file             ->  ${DATA}`);
});
