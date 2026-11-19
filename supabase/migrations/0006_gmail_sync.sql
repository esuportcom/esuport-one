-- v0.7.0 Gmail read-only message import
create table public.channel_sync_state (
 connection_id uuid primary key references public.channel_connections(id) on delete cascade,
 last_synced_at timestamptz, last_error text, imported_count integer not null default 0
);
alter table public.channel_sync_state enable row level security;
create table public.external_messages (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 connection_id uuid not null references public.channel_connections(id) on delete cascade,
 provider text not null check(provider in ('gmail','outlook')),
 external_message_id text not null,
 external_thread_id text not null,
 sender text, recipient text, subject text,
 snippet text, body_text text, received_at timestamptz,
 created_at timestamptz not null default now(),
 unique(connection_id,external_message_id)
);
create index external_messages_workspace_time_idx on public.external_messages(workspace_id,received_at desc);
alter table public.external_messages enable row level security;
create policy external_messages_read on public.external_messages for select to authenticated using(public.is_workspace_member(workspace_id));
-- Provider import writes only through authenticated server endpoint with privileged service client.
