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
