create table public.outbound_email_log(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 connection_id uuid not null references public.channel_connections(id) on delete cascade,
 in_reply_to uuid not null references public.external_messages(id) on delete cascade,
 author_id uuid not null references auth.users(id),
 recipient text not null,
 subject text not null,
 provider text not null check(provider in ('gmail','outlook')),
 provider_message_id text,
 status text not null check(status in ('sending','sent','failed','unknown')),
 error_message text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index outbound_email_log_workspace_idx on public.outbound_email_log(workspace_id,created_at desc);
alter table public.outbound_email_log enable row level security;
create policy outbound_email_log_read on public.outbound_email_log for select to authenticated
using(public.is_workspace_member(workspace_id));
-- Browser clients have no direct write access to outbound email log.
