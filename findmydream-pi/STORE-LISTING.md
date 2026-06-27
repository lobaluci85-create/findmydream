# Store Listing — FindMyDream (paste into the Pi Developer Portal)

## App name
FindMyDream

## Tagline / short description (under ~80 chars)
Read your dreams across nine traditions, and see the collective unconscious.

## Full description
FindMyDream is a dream oracle and private journal. Write down a dream and it reads the
symbols for you across nine traditions — Jungian, Orthodox & folk, Islamic (Ta'bir), Hindu,
Chinese, Greek, Buddhist, Sumerian — and your own psychology.

- 58 dream symbols, each interpreted across multiple traditions.
- A private journal that remembers every dream, with an "on this day, a year ago" look-back.
- The Collective Unconscious: see what symbols real, verified Pioneers are dreaming this week.
- A browsable Lexicon of every symbol the app can read.
- Optional deep readings, paid in Pi.

For reflection and insight — not medical, psychological, or professional advice.

## Category
Lifestyle / Wellness  (alt: Entertainment)

## Keywords
dreams, dream meaning, dream journal, interpretation, symbols, oracle, sleep, Jungian,
spirituality, mindfulness

## Required links
- Privacy Policy URL: [host legal/privacy-policy.md and paste the URL]
- Terms of Service URL: [host legal/terms-of-service.md and paste the URL]
- Support email: [CONTACT EMAIL]

## Icon spec
- 512×512 PNG, plus a 192×192 and a maskable 512×512 (see web/manifest.json).
- Suggested art: a single carved/engraved eye-or-crescent in lamplight gold (#E3B23C) on the
  clay-bitumen background (#17110B), matching the in-app "tablet" look.

---

## Pre-launch checklist
- [ ] KYC-verified Pi account
- [ ] App registered on Testnet; API Key copied
- [ ] Backend deployed; /health returns ok; PI_API_KEY set
- [ ] Frontend deployed; BACKEND URL set in pi.js; the 5 INTEGRATION edits applied
- [ ] Frontend URL validated in the Developer Portal
- [ ] ALLOWED_ORIGIN on the backend set to the frontend URL
- [ ] Privacy Policy + Terms hosted and linked
- [ ] In-app: "Delete my data" / export wired (DELETE /dreams, /account, GET /export)
- [ ] Icon (192 / 512 / maskable) added
- [ ] Tested full loop in Sandbox: sign in -> save dream -> reopen -> buy deep reading
- [ ] Mainnet app registered, SANDBOX = false, rebuilt, submitted via App Checklist
