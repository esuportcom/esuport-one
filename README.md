# eSuport One v1.1.0 — Demo onboarding and workspace repair

## What's included
- Production Supabase email-confirmation redirect and resend confirmation action.
- Supabase publishable-key support in server middleware.
- Workspace provisioning RPC repair migration.
- One-click demo workspace with synthetic UAE customer examples.
- Demo conversations, internal notes, labels, saved replies, and activity history.
- Idempotent demo seeding: re-running the action will not add duplicate sample records.
- Clear setup guidance instead of an opaque server exception when database migrations are missing.

## First-time Supabase setup
1. Configure the Render environment with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and NEXT_PUBLIC_SITE_URL=https://esuport-one.onrender.com.
2. In the Supabase SQL Editor, apply migrations 0001 through 0010 in numerical order. Migration 0010_v1_1_demo_workspace.sql repairs the create_workspace RPC and adds create_demo_workspace.
3. In Supabase Authentication → URL Configuration, set the Site URL to https://esuport-one.onrender.com and add https://esuport-one.onrender.com/auth/callback to Redirect URLs.
4. Sign in to eSuport One, open Workspaces, and choose **Create demo workspace**.
5. Open Customers and Unified Inbox to explore the sample data.

## Demo data
The demo workspace is separate from existing business workspaces and uses fictional data only:
- Maya Chen — email — order delivery question
- Omar Hassan — WhatsApp — damaged item / return request
- Sara Ahmed — Instagram — product recommendation
- Three sample conversations, internal notes, labels, reusable replies, and activity events.

All example customer email addresses use the reserved example.com domain. Sample phone numbers are placeholders. Demo records do not send messages or contact real people.

## Existing integrations
- Gmail and Microsoft Outlook OAuth sync and reply foundations remain available when their provider credentials and scopes are configured.
- Stripe billing routes remain in the codebase and require valid Stripe secrets and price IDs before live checkout.

## Important
- Apply the SQL migrations before using workspace or demo seeding features.
- Demo data is inserted into a distinct demo workspace; it is not inserted into any pre-existing client workspace.
- Do not put Supabase service-role keys, Stripe secrets, OAuth client secrets, or database passwords in browser-exposed environment variables or chat.
