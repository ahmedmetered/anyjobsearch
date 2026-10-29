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
const STATUSES = ["Found", "Ready to send", "Applied", "Follow-up sent", "Replied", "Interviewing", "Offer", "Rejected", "Withdrawn"];
const today = () => new Date().toISOString().slice(0, 10);

const readData = () => { try { const d = JSON.parse(fs.readFileSync(DATA, "utf8")); return Array.isArray(d) ? d : []; } catch { return []; } };
const writeData = d => {
  const tmp = DATA + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2));
  fs.renameSync(tmp, DATA);
};
const normalize = a => ({
  id: a.id || crypto.randomUUID().slice(0, 8),
  company: (a.company || "").trim(),
  role: (a.role || "").trim(),
  source: a.source || "",
  url: a.url || "",
  salary: a.salary || "",
  cv: a.cv || "",
  mode: a.mode || "",
  type: a.type || "",
  location: a.location || "",
  status: STATUSES.includes(a.status) ? a.status : "Found",
  date: a.date || "",
  next: a.next || "",
  notes: a.notes || "",
  updated: a.updated || today()
});

async function readBody(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  try { return JSON.parse(body || "{}"); } catch { return {}; }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const send = (code, payload, type = "application/json") => {
    res.writeHead(code, { "content-type": type + "; charset=utf-8" });
    res.end(typeof payload === "string" || Buffer.isBuffer(payload) ? payload : JSON.stringify(payload, null, 2));
  };
  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html"))
      return send(200, fs.readFileSync(path.join(here, "index.html"), "utf8"), "text/html");

    if (url.pathname === "/api/apps" && req.method === "GET") return send(200, readData());

    if (url.pathname === "/api/apps" && req.method === "POST") {
      const app = normalize(await readBody(req));
      if (!app.company) return send(400, { error: "company is required" });
      const d = readData(); d.push(app); writeData(d);
      return send(201, app);
    }

    if (url.pathname === "/api/apps/bulk" && req.method === "POST") {
      const { apps } = await readBody(req);
      if (!Array.isArray(apps)) return send(400, { error: "body must be {apps:[...]}" });
      const d = readData();
      const seen = new Set(d.map(a => (a.company + "|" + a.role).toLowerCase()));
      const added = [];
      for (const item of apps) {
        const app = normalize(item);
        if (!app.company || seen.has((app.company + "|" + app.role).toLowerCase())) continue;
        seen.add((app.company + "|" + app.role).toLowerCase());
        d.push(app); added.push(app);
      }
      writeData(d);
      return send(200, { added: added.length, apps: added });
    }

    const m = url.pathname.match(/^\/api\/apps\/([\w-]+)$/);
    if (m) {
      const d = readData();
      const i = d.findIndex(a => a.id === m[1]);
      if (i < 0) return send(404, { error: "not found" });
      if (req.method === "PATCH") {
        const patch = await readBody(req);
        d[i] = { ...d[i], ...patch, id: d[i].id, updated: today() };
        if (!STATUSES.includes(d[i].status)) d[i].status = "Found";
        writeData(d);
        return send(200, d[i]);
      }
      if (req.method === "DELETE") { const [rm] = d.splice(i, 1); writeData(d); return send(200, rm); }
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
