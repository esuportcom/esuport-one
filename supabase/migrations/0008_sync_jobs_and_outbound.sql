create table public.channel_sync_runs(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 connection_id uuid not null references public.channel_connections(id) on delete cascade,
 provider text not null check(provider in ('gmail','outlook')),
 status text not null check(status in ('success','error')),
 processed integer not null default 0,
 error_message text,
 started_at timestamptz not null default now(),
 finished_at timestamptz not null default now()
);
create index channel_sync_runs_connection_time_idx on public.channel_sync_runs(connection_id,finished_at desc);
alter table public.channel_sync_runs enable row level security;
create policy sync_runs_read on public.channel_sync_runs for select to authenticated
using(public.workspace_role(workspace_id) in ('owner','agency_admin'));
-- External messages are immutable from browsers. Only privileged backend persists sent records.
create index if not exists external_messages_thread_lookup_idx
on public.external_messages(connection_id,external_thread_id,received_at);
