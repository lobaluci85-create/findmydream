// FindMyDream — Pi integration helpers (frontend)
// These wrap the Pi SDK (window.Pi) and your backend. Import them into the app
// and use them in place of the prototype's local-storage functions.
//
// Requires: the Pi SDK script + Pi.init in your host page (see index.html),
// and BACKEND set to your deployed backend URL.

const BACKEND = "https://findmydream.onrender.com";   // live Render backend
const SANDBOX = false;                          // true while testing, false for Mainnet launch

let _accessToken = null;   // current Pioneer's Pi access token
let _user = null;          // { uid, username }

// Call once on app load (the host page already runs Pi.init; this is a safety net).
export async function initPi() {
  if (!window.Pi) throw new Error("Pi SDK not loaded — open this app inside the Pi Browser.");
  try { await window.Pi.init({ version: "2.0", sandbox: SANDBOX }); } catch (_) {}
}

// Sign in with Pi. Returns { uid, username }. Shows Pi's consent dialog the first time.
export async function loginWithPi() {
  const scopes = ["username", "payments"];
  const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
  _accessToken = authResult.accessToken;
  // Verify on our backend and get the canonical user
  const r = await fetch(`${BACKEND}/auth`, { method: "POST", headers: authHeaders() });
  if (!r.ok) throw new Error("backend auth failed");
  _user = await r.json();
  return _user;
}

export function currentUser() { return _user; }
function authHeaders() { return { "Content-Type": "application/json", Authorization: "Bearer " + _accessToken }; }

// ── Dream journal (server-stored, per verified user) ──
export async function getJournal() {
  const r = await fetch(`${BACKEND}/dreams`, { headers: authHeaders() });
  if (!r.ok) return [];
  // backend returns: [{ id, ts, dream, archetype, tradition, symbols, deep }]
  return r.json();
}

export async function saveDream(entry) {
  // entry: { dream, archetype, tradition, symbols, ts }
  const r = await fetch(`${BACKEND}/dreams`, { method: "POST", headers: authHeaders(), body: JSON.stringify(entry) });
  if (!r.ok) throw new Error("save failed");
  return r.json(); // { id }
}

// ── Real collective unconscious ──
export async function getCollective() {
  const r = await fetch(`${BACKEND}/collective`);
  if (!r.ok) return { symbols: [], dreamers: 0 };
  return r.json(); // { symbols:[{s,n}], dreamers }
}

// ── Paid deep reading (User-to-App payment) ──
// amount in Pi (e.g. 1). Calls onUnlock(deepText) when the payment completes.
export function payForDeepReading({ amount = 1, dreamId, dream, archetype, onUnlock, onCancel, onError }) {
  const paymentData = {
    amount,
    memo: "FindMyDream — deep reading",
    metadata: { kind: "deep_reading", dreamId },
  };
  const callbacks = {
    onReadyForServerApproval: async (paymentId) => {
      await fetch(`${BACKEND}/payments/approve`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ paymentId, dreamId }) });
    },
    onReadyForServerCompletion: async (paymentId, txid) => {
      const r = await fetch(`${BACKEND}/payments/complete`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ paymentId, txid, dreamId, dream, archetype }),
      });
      const data = await r.json();
      if (onUnlock) onUnlock(data.deep || "");
    },
    onCancel: () => { if (onCancel) onCancel(); },
    onError: (err) => { if (onError) onError(err); },
  };
  return window.Pi.createPayment(paymentData, callbacks);
}

// Pi calls this if a previous payment was never finished — we complete it.
async function onIncompletePaymentFound(payment) {
  try {
    await fetch(`${BACKEND}/payments/incomplete`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction && payment.transaction.txid }),
    });
  } catch (_) {}
}

// ── Data rights (GDPR): export & delete ──
export async function exportMyData() {
  const r = await fetch(`${BACKEND}/export`, { headers: authHeaders() });
  return r.ok ? r.json() : null;
}
export async function deleteDream(id) {
  const r = await fetch(`${BACKEND}/dreams/${id}`, { method: "DELETE", headers: authHeaders() });
  return r.ok;
}
export async function deleteAllDreams() {
  const r = await fetch(`${BACKEND}/dreams`, { method: "DELETE", headers: authHeaders() });
  return r.ok;
}
export async function deleteAccount() {
  const r = await fetch(`${BACKEND}/account`, { method: "DELETE", headers: authHeaders() });
  return r.ok;
}
