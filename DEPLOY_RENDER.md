# eSuport One v1.5.0 — Render deployment runbook

## 1. Prepare GitHub
This release adds runtime health endpoints and deployment validation tooling while preserving the v1.4 customer-management and mobile-inbox code already on `main`. Do not commit `.env.local`, service-role keys, provider secrets, or database passwords.

## 2. Deploy Render
The existing eSuport One Render service can continue using its current dashboard configuration and automatic deploys from `main`. `render.yaml` is included as a reproducible Blueprint for future provisioning; review environment variable names before creating a new service.

## 3. Configure providers
Keep the existing Supabase, Gmail/Outlook, Stripe, and channel configuration. Supabase migrations already applied to the production project should not be re-run blindly. For a new environment, apply migrations 0001–0010 in order.

## 4. Validate runtime configuration
Run `npm run check:deploy` only in a trusted environment where required server secrets are present. The script checks presence and format only; it does not contact providers or print secret values.

## 5. Verify deployment
Open `/api/health` for a public liveness check. Use `/api/health/ready` for configuration readiness. Use `/api/health/dependencies` with `Authorization: Bearer <HEALTH_CHECK_SECRET>` to test Supabase connectivity without exposing internal errors.

You can also run:

`npm run smoke:render -- https://esuport-one.onrender.com`

A successful liveness response confirms that the web server is responding; it does not prove every external provider flow is configured.

## 6. Scheduled email sync
If email sync is enabled, use a trusted scheduler to call `GET /api/cron/sync-email` with `Authorization: Bearer <CRON_SECRET>`. Never expose cron or health secrets in client-side code or public logs.
