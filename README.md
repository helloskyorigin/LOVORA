# LOVORA 💜

A premium, mobile-first Vedic marriage-reading experience.

## Current phase: Birth Details screen + real submission backend

Landing page and Birth Details are implemented. The birth form validates adult date of birth, time, optional first name, city selection, timezone resolution and stores a 24-hour encrypted, HttpOnly session cookie. **This is not the astrology calculation backend.** No fabricated report or checkout is exposed.

## Run

```bash
npm install
cp .env.example .env.local
# Fill in GEONAMES_USERNAME and BIRTH_SESSION_SECRET (32+ characters).
npm run dev
```

Generate a unique secret:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

To use place autocomplete, register a free GeoNames account at https://www.geonames.org/login and activate free web services. GeoNames' published terms allow commercial usage with attribution; respect quota and rate limits. Search is disabled with a clear error message until a username is configured.

## Routes

- `/`: Landing page (English/Hindi) with CTA to actual `/birth-details?lang=en|hi`
- `/birth-details`: Birth Details intake and city autocomplete
- `/api/places?q=Patna`: Server-side GeoNames search (no browser-exposed username)
- `/api/birth-details`: GET encrypted session / POST verified input+place / DELETE session
- `/birth-details/saved`: Confirmation based on the saved encrypted session

## Security and behavior

- Input validated **again** server-side; place ID resolved server-side via GeoNames.
- Timezone looked up by server from verified latitude/longitude.
- AES-256-GCM encrypted, tamper-evident session cookie; HttpOnly, SameSite=Lax, Secure in production, expires in 24 hours.
- No birth details placed in URL or printed in server logs.
- The city input never trusts user-supplied coordinates.
- An unknown time is allowed with prominent accuracy limitations.
- Adults only (18–110); no accounts or payments in this phase.
- No third-party astrology API or AI cost for this screen.

## Limitations / next steps

This temporary encrypted cookie is **not long-term report storage**. It survives refresh in the same browser only until expiry or secret rotation. Do not claim account-less report recovery until durable database+verified email recovery is implemented.

GeoNames returns IANA timezone and coordinates; historical timezone conversion and daylight-saving resolution will be done in the astrology engine integration, **not** by blindly applying today's UTC offset.

For production, use edge/distributed rate limiting for autocomplete, a durable store for paid reports, legal/privacy policy pages, merchant/payment approval, and properly tested chart calculations. Keep BIRTH_SESSION_SECRET stable and private. The remaining relationship-context, real astrology calculation, free interpretation and payment screens are not yet built.

To validate locally:

```bash
npm run typecheck
npm run build
```

## Phase 3 — Relationship questions + real free astrology insight

- Birth Details now continues directly to `/relationship`.
- `/relationship`: 2 quick questions, EN/HI, no partner details, server-side validation.
- `POST /api/relationship`: saves choices inside the authenticated encrypted birth session.
- `/insight`: actual Prokerala planet-position calculation, with an evidence-backed Venus in zodiac sign insight; no mock predictions.
- `POST /api/insight`: secure OAuth client-credential exchange, Lahiri ayanamsa, IANA historical time conversion, response validation, token caching, duplicate-request coalescing, no AI expense.
- Configure `PROKERALA_CLIENT_ID` and `PROKERALA_CLIENT_SECRET` in `.env.local` or deployment settings; **no chart is generated without them**.
- Exact birth time required for current free preview. Unknown-time births receive an honest correction prompt.
- Provider credit cost: Planet Position Basic English ~30 credits per fresh chart. Result is cached in the encrypted session.
- Current in-memory 5/hour/IP limiter is for MVP development only. Before public launch, enable a shared rate limiter and durable credit budget to prevent serverless retries and proxy abuse.
- The full seven-section reading and ₹299 checkout are NOT BUILT. Preview does not claim love-vs-arranged verdicts.
- Real provider API calls not tested without account credentials; verify response schema and historical timezone edge cases with a funded test account.
