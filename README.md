# LOVORA 💜

**Phase 5:** Premium report engine + server-verified Dodo one-time checkout implementation. Payments default to OFF pending merchant approval, credentials, and real end-to-end verification.

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

- **Not launched:** Merchant review, production configuration, live payment tests, policy pages, and verified-email report recovery. Checkout/webhook code is present but not yet verified with real credentials.
- The payment webhook currently re-fetches successful payments from Dodo and compares amount, product, checkout session, email and order before requesting report generation. Run a genuine Dodo test payment before enabling live mode.
- Rate limiting uses per-runtime in-memory limits for development; replace with a shared serverless-safe limiter, hard budget and abuse control before running costly endpoints for public traffic.
- Historical timezone ambiguity and unusual birthplaces require further live API testing; unusual times currently fail rather than silently normalizing.
- Real Prokerala response variants, provider credit cost, Dasha parsing and D9 mapping require integration tests with legitimate credentials. If Dasha has an unsupported schema, timing is honestly unavailable.
- The engine is transparent **traditional symbolic astrology**, not scientifically validated predictive accuracy, counseling or certainty about a person's real partner.

Premium reports remain private, and new payments stay disabled by default until all launch checks are satisfied.


## Phase 5 — Dodo checkout integration (implemented, not live-validated)

### Routes

- `POST /api/checkout` — requires the verified free insight, adult acknowledgement from the form, receipt email, and `LOVORA_PAYMENTS_ENABLED=true`. Creates a single-use Dodo hosted checkout for the preconfigured product.
- `POST /api/webhooks/dodo` — checks Standard Webhooks signature with raw body and server secret, then re-fetches Dodo payment details. Success must match the stored order, email, checkout session, product, INR currency, and ₹299 before fulfillment. Failed/cancelled and refund events do not grant access.
- `/checkout/return` — customer status page. Dodo's query-string `status` is never trusted.
- `POST /api/checkout/status` — accepts only the signed first-party checkout browser cookie plus matching order ID; returns pending/failed/generating/ready. When ready, issues an HttpOnly premium access cookie.
- `GET /api/report` — for non-development orders, re-checks Redis purchase state and report binding before sending premium information. Refunded/revoked orders are denied.

### Environment variables (server-only)

```dotenv
LOVORA_BASE_URL=https://your-approved-domain.example
LOVORA_PAYMENTS_ENABLED=false
DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_PAYMENTS_API_KEY=
DODO_LOVORA_PRODUCT_ID=
DODO_PAYMENTS_WEBHOOK_KEY=
```

Other required configuration: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `PROKERALA_CLIENT_ID`, `PROKERALA_CLIENT_SECRET`, `REPORT_ENCRYPTION_SECRET` and GeoNames/Birth Session settings.

1. Obtain explicit Dodo business/astrology product approval using an eligible adult-operated merchant account.
2. In **Dodo test mode**, create a **one-time product** with base price **INR 299.00**, not subscription or pay-what-you-want. Verify that taxes are included so the customer is not billed extra, and the final settled payment's `total_amount` matches 29900 paise. The server refuses product-id, base currency or product price mismatch.
3. Create an API key with the minimum required product read, checkout creation and payment read permissions; paste the key only into encrypted hosting environment settings.
4. Add webhook URL `https://your-approved-domain.example/api/webhooks/dodo` under Developer → Webhooks. Subscribe to `payment.succeeded`, `payment.failed`, `payment.processing`, `payment.cancelled` and applicable refund/dispute events. Copy its own signing secret into `DODO_PAYMENTS_WEBHOOK_KEY`.
5. Point `LOVORA_BASE_URL` to the exact web origin (HTTPS, no extra path). Switch `LOVORA_PAYMENTS_ENABLED=true` only while testing in test mode.
6. Run one successful **test-mode** checkout, a failed checkout, a cancelled checkout, duplicate webhook deliveries, delayed payment confirmation, and a refund. Verify no report is exposed until success, report generation is idempotent, and revoked reports fail access checks.
7. Only after policy pages, support contact, merchant approval, price/tax checks, security review and actual test receipts are complete should the account switch to live mode and test the real product.

The server uses Upstash Redis to persist private 90-day orders and one fulfillment lock per purchase. It stores encrypted birth-session snapshots, removes them once a report is created, and leaves live payment disabled without explicit configuration.

**Current limitations:** The browser checkout-access cookie is device-local; secure payment-email report recovery is a planned follow-up, not built. A lost browser cookie cannot yet restore a report using email alone. Underlying astrology APIs, Dodo API and webhook events could not be exercised without merchant-owned secrets. Taxes, localized pricing and real checkout UI must be manually checked in Dodo test mode; a checkout can be rejected after verification if the amount differs from INR 299. Production legal and refund policy pages are also pending.
