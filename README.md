# LOVORA 💜

**Phase 4:** Premium storybook and auditable Vedic marriage report engine are implemented alongside earlier onboarding and free insight. One-time checkout / paid entitlement issuance **has not been connected yet**.

## Quick start

\`\`\`bash
npm install
cp .env.example .env.local
# Set GeoNames username and generate 32+ character birth-session key.
npm run dev
\`\`\`

## Existing working routes

- \`/\`: bilingual landing and conversion journey.
- \`/birth-details\`: DOB, time, verified city search and encrypted session.
- \`/relationship\`: two lightweight personalized context questions.
- \`/insight\`: genuine chart-based Venus insight, requires Prokerala credentials.

## Phase 4: premium engine

- \`lib/report/rules.ts\`: pure, deterministic astrology *interpretation* engine with 7 chapters, traceable observed facts, house-ruler comparisons, transparency about conflicting evidence, explicit uncertainty. It does not predict a marriage type with percentages.
- \`lib/prokerala.ts\`: securely fetches real sidereal planet positions (required), and tries D9 Navamsa and Dasha (optional). Missing optional data is disclosed, never fabricated.
- \`lib/report/generate.ts\`: generation entry point for a **future verified payment webhook**, not a public API.
- \`lib/report/store.ts\`: AES-256-GCM-encrypted private reports stored in Upstash REST Redis. In-memory fallback is **only for local development**, not for production.
- \`lib/report/access.ts\`: encrypted, tamper-evident report access cookie. **Development test access is rejected in production.**
- \`GET /api/report\`: returns a complete report only if the server recognizes a valid secure entitlement.
- \`/report\`: premium report storybook, with print-to-PDF and evidence expanders; fails closed without entitlement.
- \`/report/sample\`: public **fictional illustration only**, conspicuously labeled; not a calculated reading for a visitor.
- \`/report/dev\`: local developer page to manually request a REAL report (uses Prokerala) after birth form + relationship questions.
- \`POST /api/report/dev-generate\`: **development environment only** + 32-char server-side secret. Rejected by design in \`NODE_ENV=production\`. Returns a server-set access cookie to open the premium UI.

### Required environment

\`\`\`dotenv
GEONAMES_USERNAME=...
BIRTH_SESSION_SECRET=<random 32+ characters>
PROKERALA_CLIENT_ID=...
PROKERALA_CLIENT_SECRET=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
REPORT_ENCRYPTION_SECRET=<random 32+ characters>
LOVORA_DEV_REPORT_SECRET=<random 32+ characters, local development only>
\`\`\`

For generating test secrets run \`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"\`.

**Never put API keys in the browser or in GitHub.** Do not deploy \`LOVORA_DEV_REPORT_SECRET\` on a public production app.

### Steps for a real dev report

1. Run \`npm run dev\` with GeoNames + Prokerala credentials.
2. Fill out \`/birth-details\` and select your city from the verified suggestions.
3. Answer the two relationship questions.
4. Open \`/report/dev\` and enter your configured development secret.
5. The development report calls Prokerala, stores an encrypted report, sets local dev access and opens \`/report\`.
6. Save PDF with the built-in button (browser print-to-PDF). No PDF service cost.

The page \`/report/sample\` previews the actual layout without API keys, but uses **synthetic facts** and is not proof of astrology accuracy.

## Automated verification

\`\`\`bash
npm run typecheck
npm run test
npm run build
\`\`\`

GitHub Actions CI runs typecheck, report unit tests and production build.

## Critical launch blockers

- **Not launched:** Dodo merchant review, production checkout, paid-webhook verification, durable order binding and verified-email report recovery.
- A future webhook must verify a payment directly against Dodo **server-side** before calling the report generator, storing the report ID, and issuing a real access entitlement after a protected return.
- Rate limiting uses per-runtime in-memory limits for development; replace with a shared serverless-safe limiter, hard budget and abuse control before running costly endpoints for public traffic.
- Historical timezone ambiguity and unusual birthplaces require further live API testing; unusual times currently fail rather than silently normalizing.
- Real Prokerala response variants, provider credit cost, Dasha parsing and D9 mapping require integration tests with legitimate credentials. If Dasha has an unsupported schema, timing is honestly unavailable.
- The engine is transparent **traditional symbolic astrology**, not scientifically validated predictive accuracy, counseling or certainty about a person's real partner.

This phase intentionally keeps premium results private while payments are unconnected. The purchase call-to-action must not ask for money until checkout and verification are live.
