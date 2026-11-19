-- v0.6.0: server-owned OAuth connection records; never expose provider tokens to clients.
create table public.channel_connections (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 provider text not null check(provider in ('gmail','outlook','whatsapp','instagram','facebook')),
 external_account_id text not null,
 account_label text,
 status text not null default 'connected' check(status in ('connected','disconnected','error')),
 encrypted_access_token text,
 encrypted_refresh_token text,
 token_expires_at timestamptz,
 connected_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(workspace_id,provider,external_account_id)
);
create index channel_connections_workspace_idx on public.channel_connections(workspace_id);
alter table public.channel_connections enable row level security;
-- No direct client reads or writes: access only through authenticated server routes
-- that check workspace admin membership and project safe fields.
