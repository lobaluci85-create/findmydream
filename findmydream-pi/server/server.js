// FindMyDream — Pi backend
// Node 18+ (uses global fetch). Run: npm install && npm start
//
// What this server does:
//   1. Verifies Pi users via their access token (GET /v2/me on Pi's API).
//   2. Stores each Pioneer's dreams privately, keyed by their Pi user id.
//   3. Aggregates symbol counts -> the REAL "collective unconscious" numbers.
//   4. Handles the Pi payment Approve + Complete flow for the paid deep reading.
//
// Secrets live only here (server side), never in the frontend:
//   PI_API_KEY  -> from your app's dashboard in the Pi Developer Portal.

import express from "express";
import cors from "cors";
import Database from "better-sqlite3";

const PORT = process.env.PORT || 8080;
const PI_API_KEY = process.env.PI_API_KEY;                 // REQUIRED for payments
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";  // your frontend URL in production
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ""; // OPTIONAL: server-side AI deep reading
const PI_API = "https://api.minepi.com/v2";

if (!PI_API_KEY) console.warn("[warn] PI_API_KEY is not set — payments will fail until you add it.");

// ── Database (SQLite: zero setup. For scale, swap to Postgres; schema is the same) ──
const db = new Database("findmydream.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS dreams (
    id        TEXT PRIMARY KEY,
    uid       TEXT NOT NULL,
    ts        INTEGER NOT NULL,
    dream     TEXT NOT NULL,
    archetype TEXT,
    tradition TEXT,
    symbols   TEXT,           -- JSON array of symbol keys
    deep      TEXT            -- unlocked deep reading, if purchased
  );
  CREATE INDEX IF NOT EXISTS idx_dreams_uid ON dreams(uid, ts DESC);

  CREATE TABLE IF NOT EXISTS symbol_counts (
    symbol TEXT PRIMARY KEY,
    count  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS payments (
    payment_id TEXT PRIMARY KEY,
    uid        TEXT,
    dream_id   TEXT,
    status     TEXT,          -- approved | completed
    txid       TEXT,
    created    INTEGER
  );
`);

// ── App ──
const app = express();
app.use(express.json({ limit: "256kb" }));
app.use(cors({ origin: ALLOWED_ORIGIN }));

// Lightweight per-IP rate limit (no dependency): 120 requests / minute.
const hits = new Map();
app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "?";
  const now = Date.now();
  const slot = hits.get(ip);
  if (!slot || now > slot.reset) { hits.set(ip, { n: 1, reset: now + 60000 }); return next(); }
  if (slot.n >= 120) return res.status(429).json({ error: "slow down" });
  slot.n++; next();
});
setInterval(() => { const now = Date.now(); for (const [ip, s] of hits) if (now > s.reset) hits.delete(ip); }, 120000);

// ── Auth: verify the Pi access token, attach req.uid / req.username ──
// Small cache so we don't call Pi's /me on every single request.
const tokenCache = new Map(); // accessToken -> { uid, username, exp }
async function verifyPiToken(accessToken) {
  const cached = tokenCache.get(accessToken);
  if (cached && cached.exp > Date.now()) return cached;
  const r = await fetch(`${PI_API}/me`, { headers: { Authorization: "Bearer " + accessToken } });
  if (!r.ok) throw new Error("invalid Pi token");
  const me = await r.json();              // { uid, username, ... }
  const entry = { uid: me.uid, username: me.username, exp: Date.now() + 10 * 60 * 1000 };
  tokenCache.set(accessToken, entry);
  return entry;
}
async function auth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: "missing token" });
    const user = await verifyPiToken(token);
    req.uid = user.uid;
    req.username = user.username;
    next();
  } catch (e) {
    res.status(401).json({ error: "auth failed" });
  }
}

// ── Routes ──
app.get("/health", (_req, res) => res.json({ ok: true }));

// Confirm login and return the verified Pioneer
app.post("/auth", auth, (req, res) => {
  res.json({ uid: req.uid, username: req.username });
});

// This user's dream journal, newest first
app.get("/dreams", auth, (req, res) => {
  const rows = db.prepare("SELECT id, ts, dream, archetype, tradition, symbols, deep FROM dreams WHERE uid = ? ORDER BY ts DESC LIMIT 500").all(req.uid);
  res.json(rows.map(r => ({ ...r, symbols: JSON.parse(r.symbols || "[]") })));
});

// Save a new dream + fold its symbols into the collective
const insertDream = db.prepare("INSERT INTO dreams (id, uid, ts, dream, archetype, tradition, symbols) VALUES (?,?,?,?,?,?,?)");
const bumpSymbol = db.prepare("INSERT INTO symbol_counts (symbol, count) VALUES (?, 1) ON CONFLICT(symbol) DO UPDATE SET count = count + 1");
app.post("/dreams", auth, (req, res) => {
  const { dream, archetype, tradition, symbols, ts } = req.body || {};
  if (!dream || typeof dream !== "string") return res.status(400).json({ error: "dream required" });
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const syms = Array.isArray(symbols) ? symbols.slice(0, 8) : [];
  const tx = db.transaction(() => {
    insertDream.run(id, req.uid, ts || Date.now(), dream.slice(0, 4000), archetype || "", tradition || "all", JSON.stringify(syms));
    syms.forEach(s => bumpSymbol.run(String(s).toLowerCase()));
  });
  tx();
  res.json({ id });
});

// The real collective unconscious — top symbols across all verified users
app.get("/collective", (_req, res) => {
  const rows = db.prepare("SELECT symbol AS s, count AS n FROM symbol_counts ORDER BY count DESC LIMIT 20").all();
  const dreamers = db.prepare("SELECT COUNT(DISTINCT uid) AS n FROM dreams").get();
  res.json({ symbols: rows, dreamers: dreamers.n });
});

// ── Data rights (UK/EU GDPR): export, delete one, delete all, delete account ──
const lowerSymbol = db.prepare("UPDATE symbol_counts SET count = MAX(0, count - 1) WHERE symbol = ?");
function decrementSymbolsFor(rows) {
  rows.forEach(r => JSON.parse(r.symbols || "[]").forEach(s => lowerSymbol.run(String(s).toLowerCase())));
}

// Download everything we hold about you (data portability)
app.get("/export", auth, (req, res) => {
  const dreams = db.prepare("SELECT id, ts, dream, archetype, tradition, symbols, deep FROM dreams WHERE uid = ? ORDER BY ts DESC").all(req.uid);
  res.json({ user: { uid: req.uid, username: req.username }, dreams: dreams.map(d => ({ ...d, symbols: JSON.parse(d.symbols || "[]") })) });
});

// Delete a single dream
app.delete("/dreams/:id", auth, (req, res) => {
  const row = db.prepare("SELECT symbols FROM dreams WHERE id = ? AND uid = ?").get(req.params.id, req.uid);
  if (!row) return res.status(404).json({ error: "not found" });
  const tx = db.transaction(() => { decrementSymbolsFor([row]); db.prepare("DELETE FROM dreams WHERE id = ? AND uid = ?").run(req.params.id, req.uid); });
  tx();
  res.json({ ok: true });
});

// Delete ALL of this user's dreams (keeps the account/login)
app.delete("/dreams", auth, (req, res) => {
  const rows = db.prepare("SELECT symbols FROM dreams WHERE uid = ?").all(req.uid);
  const tx = db.transaction(() => { decrementSymbolsFor(rows); db.prepare("DELETE FROM dreams WHERE uid = ?").run(req.uid); });
  tx();
  res.json({ ok: true, deleted: rows.length });
});

// Full erasure: dreams + payment records for this user
app.delete("/account", auth, (req, res) => {
  const rows = db.prepare("SELECT symbols FROM dreams WHERE uid = ?").all(req.uid);
  const tx = db.transaction(() => {
    decrementSymbolsFor(rows);
    db.prepare("DELETE FROM dreams WHERE uid = ?").run(req.uid);
    db.prepare("DELETE FROM payments WHERE uid = ?").run(req.uid);
  });
  tx();
  res.json({ ok: true });
});

// ── Pi payments: Approve -> (user signs on-chain) -> Complete ──
// Docs: POST /v2/payments/{id}/approve and /complete, with header `Authorization: Key <PI_API_KEY>`.
async function piPost(path) {
  const r = await fetch(`${PI_API}${path}`, { method: "POST", headers: { Authorization: "Key " + PI_API_KEY } });
  if (!r.ok) throw new Error(`Pi API ${path} failed: ${r.status}`);
  return r.json();
}

app.post("/payments/approve", auth, async (req, res) => {
  try {
    const { paymentId, dreamId } = req.body || {};
    if (!paymentId) return res.status(400).json({ error: "paymentId required" });
    await piPost(`/payments/${paymentId}/approve`);
    db.prepare("INSERT OR REPLACE INTO payments (payment_id, uid, dream_id, status, created) VALUES (?,?,?,?,?)")
      .run(paymentId, req.uid, dreamId || null, "approved", Date.now());
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post("/payments/complete", auth, async (req, res) => {
  try {
    const { paymentId, txid, dreamId, dream, archetype } = req.body || {};
    if (!paymentId || !txid) return res.status(400).json({ error: "paymentId and txid required" });
    await fetch(`${PI_API}/payments/${paymentId}/complete`, {
      method: "POST",
      headers: { Authorization: "Key " + PI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ txid }),
    }).then(r => { if (!r.ok) throw new Error("complete failed: " + r.status); });

    db.prepare("UPDATE payments SET status='completed', txid=? WHERE payment_id=?").run(txid, paymentId);

    // Payment confirmed -> generate the deep reading (AI if configured, else composed)
    const deep = await generateDeep(dream || "", archetype || "");
    if (dreamId) db.prepare("UPDATE dreams SET deep=? WHERE id=? AND uid=?").run(deep, dreamId, req.uid);
    res.json({ ok: true, deep });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

// Handle any leftover unfinished payment (onIncompletePaymentFound)
app.post("/payments/incomplete", auth, async (req, res) => {
  try {
    const { paymentId, txid } = req.body || {};
    if (txid) {
      await fetch(`${PI_API}/payments/${paymentId}/complete`, {
        method: "POST",
        headers: { Authorization: "Key " + PI_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ txid }),
      });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

// ── Deep reading generator (optional AI) ──
async function generateDeep(dream, archetype) {
  if (ANTHROPIC_API_KEY && dream) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 600,
          system: "You are a warm, lucid dream guide. No promises, no medical advice. Reply with clean plain text, ~5 sentences.",
          messages: [{ role: "user", content: `Dream: "${dream}". Dominant archetype: "${archetype}". Write one integrated deep reading: connect the symbols, name the inner tension, and end with one concrete reflection practice for today.` }],
        }),
      });
      const data = await r.json();
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
      if (text) return text;
    } catch (_) { /* fall through to composed version */ }
  }
  // Fallback if no AI key configured
  return `Your dream gathers around ${(archetype || "a single image").toLowerCase()}. Sit with the feeling it left, name the one thing it seems to be asking of you, and let the rest go for today.`;
}

app.listen(PORT, () => console.log(`FindMyDream backend listening on :${PORT}`));
