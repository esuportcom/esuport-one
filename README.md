# eSuport One v1.6.0 — priority and SLA inbox upgrade

## What's included
- Conversation priority levels: low, normal, high, and urgent.
- Optional SLA due date per conversation, with inbox filtering and visibility.
- Server-side validation for priority and SLA updates, scoped to the active workspace.

## v1.5 foundation
- v1.4 customer management, conversation history, mobile dashboard/inbox responsiveness, live dashboard metrics, demo workspace onboarding, and channel crash protection remain preserved on `main`.
- Public `/api/health` liveness endpoint returning the running application version.
- `/api/health/ready` configuration-readiness endpoint.
- Protected `/api/health/dependencies` Supabase connectivity check using `HEALTH_CHECK_SECRET`.
- Release/source/environment/deployment validation scripts.
- Render Blueprint and deployment runbook.
- GitHub Actions source, typecheck, and production-build validation.
- Render smoke-test helper.

## Environment
Use the existing production environment variable names, including:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- Stripe and provider secrets as required by enabled integrations
- `CRON_SECRET`
- `HEALTH_CHECK_SECRET`

Never expose Supabase service-role keys, Stripe secrets, OAuth client secrets, cron secrets, or health-check secrets in browser code or public logs.

## Validation
Run:
- `npm run check:source`
- `npm run typecheck`
- `npm run check:release`
- `npm run check:deploy` in a trusted environment with server secrets
- `npm run smoke:render -- https://esuport-one.onrender.com`

## Supabase
For a new environment, apply migrations 0001–0010 in numerical order. Do not re-run production migrations blindly when they are already applied.

## Render
The existing eSuport One Render service can continue deploying from `main`. `render.yaml` provides a reproducible Blueprint for future provisioning and uses the current Supabase publishable-key naming.

## Demo
The demo workspace uses fictional customer data and does not send messages to real people.

## Important
Do not treat a successful liveness response as proof that Gmail, Outlook, Stripe, or other external providers are configured. Use the protected dependency check and provider-specific tests for deeper verification.
