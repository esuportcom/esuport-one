# eSuport One v1.0.0 — Email Reply Foundation

## What's included
- Gmail send and Microsoft Graph reply endpoint.
- Server-enforced workspace authorization and provider connection checks.
- Provider-origin recipient validation (no arbitrary recipient submission).
- Outbound email attempt audit table with unknown-delivery state.
- Reply composer component.
- Existing scheduled sync, Gmail/Outlook inbox, customer management, and Stripe foundation.

## Setup
1. Configure `.env.local`, run `npm install`, and apply SQL migrations 0001 through 0009.
2. Change Google OAuth scope to include `https://www.googleapis.com/auth/gmail.send` and Microsoft OAuth scope to include `Mail.Send`; reconnect existing accounts to consent. These permissions may require provider review/admin consent.
3. Start `npm run dev`. The reply composer appears on individual imported email detail pages.
4. For local testing, use test mailboxes and verify delivery in Sent Mail.

## Limitations
- Full Next.js build and live provider integration tests have not been performed.
- Outbound replies are not automatically imported into local email history.
- Gmail threading may need RFC Message-ID / References headers for robust provider threading.
- The database logs `unknown` when provider delivery cannot be confirmed; never auto-retry these attempts.
- No distributed send lock, request idempotency key, rate limits, or production-grade audit monitoring yet.
- Role-level controls currently permit all workspace roles to reply; tighten per organization before production.
