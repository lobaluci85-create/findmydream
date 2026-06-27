# Wiring findmydream.jsx to Pi

Your `findmydream.jsx` already works as a standalone demo. To make it the real Pi app,
make these focused changes. The interpretation engine (DICT, EXTRA, interpretLocal, the
Lexicon, all the UI) stays exactly as is — only storage, login, collective, and the paid
reading change.

At the top of the file:
```js
import { initPi, loginWithPi, currentUser, getJournal, saveDream, getCollective, payForDeepReading } from "./pi.js";
```

## 1) Sign in with Pi (so every user is a verified Pioneer)
Add state and a login gate:
```js
const [user, setUser] = useState(null);

useEffect(() => { initPi().catch(()=>{}); }, []);

async function signIn() {
  try { setUser(await loginWithPi()); }
  catch (e) { /* show a friendly "open in Pi Browser" message */ }
}
```
Render a "Sign in with Pi" button in the header when `!user`. You can still let people
read interpretations without signing in; require sign-in only to **save** dreams and to
buy a deep reading.

## 2) Load the journal from the backend (replaces the local-storage effect)
Replace the existing `loadJournal()` mount effect with:
```js
useEffect(() => {
  if (!user) return;
  getJournal().then(rows => setJournal(rows)).catch(()=>{});
}, [user]);
```
Delete the `sampleSeed()` seeding — real data now comes from the server. (Keep `onThisDay`
and `fmtDate`; they work unchanged on the backend rows, which include `ts` and `symbols`.)

## 3) Save each dream to the backend (in `interpret()`)
Replace the local `setJournal(... persistJournal ...)` line with:
```js
const entry = { ts: Date.now(), dream: dream.trim(), archetype: data.archetype, tradition, symbols: data._syms || [] };
if (user) {
  saveDream(entry).then(({ id }) => setJournal(j => [{ id, ...entry }, ...j]));
} else {
  setJournal(j => [{ id: String(Date.now()), ...entry }, ...j]); // local-only until they sign in
}
```

## 4) Real collective numbers (replaces the seeded SEED)
```js
useEffect(() => {
  getCollective().then(({ symbols }) => { if (symbols && symbols.length) setCollective(symbols); }).catch(()=>{});
}, [user]);
```
Update the caption under the grid: it is no longer "simulated demo data" — it's live counts
from verified Pioneers. (When the app is brand new and the table is empty, keep the existing
SEED as a placeholder so the grid isn't blank on day one.)

## 5) Paid deep reading (replaces the local `deepReading()`)
```js
function deepReading() {
  if (!user) { signIn(); return; }
  if (deepLoading || !result) return;
  setDeepLoading(true);
  payForDeepReading({
    amount: 1,                          // price in Pi
    dreamId: result._id,                // if you track the saved dream id
    dream: dream.trim(),
    archetype: result.archetype,
    onUnlock: (deepText) => { setDeep(deepText || deepLocal(result)); setDeepLoading(false); },
    onCancel: () => setDeepLoading(false),
    onError: () => { setDeep(deepLocal(result)); setDeepLoading(false); }, // graceful fallback
  });
}
```

That's it. Everything else — the 58-symbol engine, 9 traditions, the Lexicon, the clay
design — is unchanged.

## 6) Privacy & data controls (required for publishing)
Import the data-rights helpers and add a small "Privacy" area (e.g. at the bottom, near the
footer) so users can exercise their rights — this is required for the Pi portal and GDPR:
```js
import { exportMyData, deleteAllDreams, deleteAccount } from "./pi.js";

// Export: download a JSON copy
async function handleExport() {
  const data = await exportMyData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "findmydream-data.json"; a.click();
  URL.revokeObjectURL(url);
}

// Delete (always confirm first)
async function handleDeleteAll() {
  if (!confirm("Delete all your saved dreams? This can't be undone.")) return;
  if (await deleteAllDreams()) setJournal([]);
}
```
Render, when signed in: an **Export my data** button, a **Delete all dreams** button, a
**Delete my account** action, and links to your hosted **Privacy Policy** and **Terms**
(`legal/privacy-policy.md` and `legal/terms-of-service.md`, hosted as web pages).

The footer disclaimer ("for reflection, not medical or psychological advice") should stay.

