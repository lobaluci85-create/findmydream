// FindMyDream — Pi backend
// Node 18+ (uses global fetch). Run: npm install && npm start
//
// What this server does:
//   1. Verifies Pi users via their access token (GET /v2/me on Pi's API).
//   2. Stores each Pioneer's dreams privately, keyed by their Pi user id.
//   3. Aggregates symbol counts -> the REAL "collective unconscious" numbers.
//   4. Handles the Pi payment Approve + Complete flow for the paid deep reading.
//
// Storage: a simple JSON file (no native modules, builds anywhere). For heavy
// production scale, swap to Postgres later; the shapes below port directly.
//
// Secrets live only here (server side), never in the frontend:
//   PI_API_KEY  -> from your app's dashboard in the Pi Developer Portal.

import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const PORT = process.env.PORT || 8080;
const PI_API_KEY = process.env.PI_API_KEY;                 // REQUIRED for payments
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";  // your frontend URL in production
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ""; // OPTIONAL: server-side AI deep reading
const PI_API = "https://api.minepi.com/v2";

if (!PI_API_KEY) console.warn("[warn] PI_API_KEY is not set — payments will fail until you add it.");

// ── Storage (plain JSON file: zero native deps) ──────────────────────────
const DATA_FILE = process.env.DATA_FILE || "./data.json";
let store = { dreams: [], counts: {}, payments: {} };
try {
  if (existsSync(DATA_FILE)) store = JSON.parse(readFileSync(DATA_FILE, "utf8"));
} catch (e) { console.warn("[warn] could not read data file, starting fresh"); }
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { writeFileSync(DATA_FILE, JSON.stringify(store)); }
    catch (e) { console.error("save failed", e.message); }
  }, 200);
}
function bumpSymbol(s) { const k = String(s).toLowerCase(); store.counts[k] = (store.counts[k] || 0) + 1; }
function lowerSymbol(s) { const k = String(s).toLowerCase(); if (store.counts[k]) store.counts[k] = Math.max(0, store.counts[k] - 1); }

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

app.post("/auth", auth, (req, res) => {
  res.json({ uid: req.uid, username: req.username });
});

// This user's dream journal, newest first
app.get("/dreams", auth, (req, res) => {
  const rows = store.dreams
    .filter(d => d.uid === req.uid)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 500)
    .map(d => ({ id: d.id, ts: d.ts, dream: d.dream, archetype: d.archetype, tradition: d.tradition, symbols: d.symbols || [], deep: d.deep || null }));
  res.json(rows);
});

// Save a new dream + fold its symbols into the collective
app.post("/dreams", auth, (req, res) => {
  const { dream, archetype, tradition, symbols, ts } = req.body || {};
  if (!dream || typeof dream !== "string") return res.status(400).json({ error: "dream required" });
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const syms = Array.isArray(symbols) ? symbols.slice(0, 8) : [];
  store.dreams.push({ id, uid: req.uid, ts: ts || Date.now(), dream: dream.slice(0, 4000), archetype: archetype || "", tradition: tradition || "all", symbols: syms, deep: null });
  syms.forEach(bumpSymbol);
  save();
  res.json({ id });
});

// The real collective unconscious — top symbols across all verified users
app.get("/collective", (_req, res) => {
  const symbols = Object.entries(store.counts)
    .map(([s, n]) => ({ s, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 20);
  const dreamers = new Set(store.dreams.map(d => d.uid)).size;
  res.json({ symbols, dreamers });
});

// ── Data rights (UK/EU GDPR): export, delete one, delete all, delete account ──
app.get("/export", auth, (req, res) => {
  const dreams = store.dreams.filter(d => d.uid === req.uid).sort((a, b) => b.ts - a.ts);
  res.json({ user: { uid: req.uid, username: req.username }, dreams });
});

app.delete("/dreams/:id", auth, (req, res) => {
  const i = store.dreams.findIndex(d => d.id === req.params.id && d.uid === req.uid);
  if (i === -1) return res.status(404).json({ error: "not found" });
  (store.dreams[i].symbols || []).forEach(lowerSymbol);
  store.dreams.splice(i, 1);
  save();
  res.json({ ok: true });
});

app.delete("/dreams", auth, (req, res) => {
  const mine = store.dreams.filter(d => d.uid === req.uid);
  mine.forEach(d => (d.symbols || []).forEach(lowerSymbol));
  store.dreams = store.dreams.filter(d => d.uid !== req.uid);
  save();
  res.json({ ok: true, deleted: mine.length });
});

app.delete("/account", auth, (req, res) => {
  const mine = store.dreams.filter(d => d.uid === req.uid);
  mine.forEach(d => (d.symbols || []).forEach(lowerSymbol));
  store.dreams = store.dreams.filter(d => d.uid !== req.uid);
  for (const pid of Object.keys(store.payments)) if (store.payments[pid].uid === req.uid) delete store.payments[pid];
  save();
  res.json({ ok: true });
});

// ── Pi payments: Approve -> (user signs on-chain) -> Complete ──
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
    store.payments[paymentId] = { payment_id: paymentId, uid: req.uid, dream_id: dreamId || null, status: "approved", created: Date.now() };
    save();
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

    if (store.payments[paymentId]) { store.payments[paymentId].status = "completed"; store.payments[paymentId].txid = txid; }

    const deep = await generateDeep(dream || "", archetype || "");
    if (dreamId) { const d = store.dreams.find(x => x.id === dreamId && x.uid === req.uid); if (d) d.deep = deep; }
    save();
    res.json({ ok: true, deep });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

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
          max_tokens: 1500,
          system: "You are a warm, lucid dream guide. No promises, no medical advice. Write a rich, in-depth reading in clean plain text (no markdown symbols, no headings in bold). Aim for roughly 500-650 words across 5 short sections, each separated by a blank line. Keep the tone personal, grounded, and reflective.",
          messages: [{ role: "user", content: `Dream: "${dream}". Dominant archetype: "${archetype}". Write an integrated DEEP reading with these five parts, each as its own paragraph separated by a blank line:\n\n1) The big picture — what the dream as a whole seems to be circling around.\n2) Key symbols — take the 2-3 most striking images and unpack what each may be carrying.\n3) Across traditions — briefly read the dream through two lenses (for example Islamic Ta'bir and a Jungian/archetypal view), noting where they agree or differ.\n4) The personal mirror — connect the symbols to an inner tension the dreamer may be living right now, gently and without certainty.\n5) For today — close with one concrete reflection practice, then three short questions the dreamer can sit with.\n\nDo not use numbered headings in the output; let each paragraph flow naturally. No promises, no predictions, no medical advice.` }],
        }),
      });
      const data = await r.json();
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
      if (text) return text;
    } catch (_) { /* fall through to composed version */ }
  }
  return `Your dream gathers around ${(archetype || "a single image").toLowerCase()}. Sit with the feeling it left, name the one thing it seems to be asking of you, and let the rest go for today.`;
}
app.listen(PORT, () => console.log(`FindMyDream backend listening on :${PORT}`));
