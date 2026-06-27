# FindMyDream — Launch Runbook (Pi)

Everything you need to take FindMyDream live on Pi. The code is done; this is the order
of operations. Steps marked **[you]** are the ones only you can do (identity, hosting,
the Developer Portal). Steps marked **[code]** are already written in this package.

## What's in this package
```
server/            the backend (auth, dream storage, collective, payments, data deletion/export)
  server.js
  package.json
  .env.example
web/               the frontend — a ready-to-build Vite + React + Tailwind app
  src/App.jsx      the app, ALREADY wired to Pi + backend (login, save, pay) with demo fallback
  src/pi.js        Pi SDK helpers (login, payment, backend calls, export/delete)
  src/main.jsx     entry point
  src/index.css    Tailwind
  index.html       host page that loads the Pi SDK
  manifest.json    app name/icon metadata
  package.json     build scripts (npm run dev / build)
  vite/tailwind/postcss configs
  findmydream.jsx  the original standalone component (reference only)
  INTEGRATION.md   notes on what was changed to wire it (already applied in src/App.jsx)
legal/             ready-to-host policies (templates — have them reviewed)
  privacy-policy.md
  terms-of-service.md
STORE-LISTING.md   portal listing copy, icon spec, and the full pre-launch checklist
.gitignore
```

> The full step-by-step pre-launch checklist lives at the bottom of **STORE-LISTING.md**.

## Step 1 — Identity & portal  **[you]**
1. Install the **Pi Browser** (App Store / Google Play) and make sure your account is **KYC-verified**.
2. In the Pi Browser open **`develop.pinet.com`** (or the "Develop" icon) and register as a developer.
3. Tap **New App**. Create it on **Testnet** first (you'll make a separate Mainnet app for launch).
   The app name decides your in-Pi URL.
4. On the app dashboard, copy the **API Key**. Keep it secret — it's your server key.

## Step 2 — Deploy the backend  **[you + code]**
1. Pick a host that runs Node with a persistent disk: Render, Railway, or Fly.io (free tiers exist).
2. Upload the `server/` folder. Set environment variables (see `.env.example`):
   - `PI_API_KEY` = the key from Step 1.4
   - `ALLOWED_ORIGIN` = your frontend URL (set later; use `*` for now)
   - `ANTHROPIC_API_KEY` = optional, for AI deep readings
3. The host runs `npm install` then `npm start`. Confirm it's up: visit `https://your-backend/health` → `{ "ok": true }`.

## Step 3 — Deploy the frontend  **[you + code]**
The app is already wired to Pi and your backend (with a demo fallback, so it runs anywhere).
1. In `web/src/pi.js`, set `BACKEND` to your backend URL from Step 2. Keep `SANDBOX = true` for now.
2. From `web/`, run `npm install` then `npm run build` (output goes to `web/dist`). To preview locally: `npm run dev`.
3. Host the built site on Vercel, Netlify, or Cloudflare Pages (free tiers). Point them at the `web/` folder; build command `npm run build`, output dir `dist`.
4. In the Developer Portal, set this hosted URL as your app's frontend URL and complete **URL validation** (the portal gives you a validation key/file to place at your domain).
5. Update the backend's `ALLOWED_ORIGIN` to this frontend URL.

> Note: opened in a normal browser the app runs as a demo (saves on the device, deep reading is local). Opened in the Pi Browser with the backend live, it uses Pi login, cloud storage, and Pi payments.

## Step 4 — Test in the Pi Sandbox  **[you]**
1. In the Developer Portal app page, find the **Development URL** and open it in a desktop browser.
2. On your phone, open the **Pi App → Pi Utilities → Authorize Sandbox**.
3. Test the full loop on Testnet: sign in, write a dream, save it, reopen to confirm it persisted,
   then buy a deep reading with test Pi and confirm the approve → complete flow works.

## Step 5 — Go live on Mainnet  **[you]**
1. Register a **second app on Mainnet** (network can't be changed after creation).
2. Point it at your production frontend URL; set `SANDBOX = false` in `pi.js` and rebuild.
3. Use the **App Checklist** in the portal to finish required fields (description, icon,
   privacy policy URL, etc.) and submit so Pioneers can discover it.

## Costs
- Backend host + SQLite: free tier to start; a few dollars/month as you grow.
- Frontend host: free tier.
- No Apple-style $99/year, no app-store review.
- Pi payments are settled on the Pi blockchain; keep the deep-reading price small (e.g. 1 π).

## Notes & honest limits
- The **interpretation engine stays offline** in the client — instant, no per-reading cost. Only the
  optional AI deep reading and storage touch the server.
- The **collective numbers become real** only once people use it; ship with the SEED as a day-one
  placeholder so the grid isn't empty.
- Dreams are personal, sometimes sensitive data — publish a short **privacy policy** and let users
  delete their data. (A `DELETE /dreams` endpoint is an easy add when you want it.)
- Swap SQLite for Postgres when you outgrow a single server; the schema in `server.js` ports directly.
