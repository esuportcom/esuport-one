-- eSuport One v0.4.0
create table public.workspace_invitations(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 email text not null,
 role text not null check(role in ('agency_admin','agency_agent','client_admin')),
 token_hash text not null unique,
 invited_by uuid not null references auth.users(id),
 expires_at timestamptz not null default (now() + interval '7 days'),
 accepted_at timestamptz,
 created_at timestamptz not null default now(),
 constraint invite_email_format check(email = lower(btrim(email)) and position('@' in email)>1)
);
create index workspace_invitations_workspace_idx on public.workspace_invitations(workspace_id);
create unique index workspace_invitations_pending_idx on public.workspace_invitations(workspace_id,email) where accepted_at is null;
alter table public.workspace_invitations enable row level security;
create policy invite_admin_read on public.workspace_invitations for select to authenticated
 using(public.workspace_role(workspace_id) in ('owner','agency_admin'));
-- Invitation creation and acceptance are server-only with service-role credentials.
-- Only members with elevated workspace roles can assign conversations.
drop policy if exists conversations_update on public.conversations;
create policy conversations_update on public.conversations for update to authenticated
using(public.workspace_role(workspace_id) in ('owner','agency_admin','agency_agent','client_admin'))
with check(public.workspace_role(workspace_id) in ('owner','agency_admin','agency_agent','client_admin'));
-- Realtime subscription is filtered by workspace and further protected by table RLS.
