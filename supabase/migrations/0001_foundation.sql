-- eSuport One v0.2.0: tenant-scoped foundation
create extension if not exists pgcrypto;
create table public.workspaces(id uuid primary key default gen_random_uuid(),name text not null,created_at timestamptz not null default now());
create table public.workspace_members(workspace_id uuid not null references public.workspaces(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,role text not null check(role in('owner','agency_admin','agency_agent','client_admin')),created_at timestamptz not null default now(),primary key(workspace_id,user_id));
create table public.contacts(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,name text not null,channel text,external_id text,created_at timestamptz not null default now());
create table public.conversations(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,contact_id uuid references public.contacts(id) on delete set null,subject text,status text not null default 'open' check(status in('open','pending','resolved')),assigned_to uuid references auth.users(id) on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.messages(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,conversation_id uuid not null references public.conversations(id) on delete cascade,sender_id uuid references auth.users(id) on delete set null,body text not null,is_internal boolean not null default false,created_at timestamptz not null default now());
create table public.subscriptions(id uuid primary key default gen_random_uuid(),workspace_id uuid not null unique references public.workspaces(id) on delete cascade,stripe_customer_id text,stripe_subscription_id text unique,plan text not null,status text not null,created_at timestamptz not null default now());
create index on public.workspace_members(user_id);
create index on public.contacts(workspace_id);
create index on public.conversations(workspace_id,updated_at desc);
create index on public.messages(conversation_id,created_at);
create index on public.subscriptions(workspace_id);
-- Validate cross-tenant foreign keys (avoid linking records across workspaces).
create or replace function public.enforce_conversation_contact_tenant() returns trigger language plpgsql set search_path='' as $$begin if new.contact_id is not null and not exists(select 1 from public.contacts c where c.id=new.contact_id and c.workspace_id=new.workspace_id) then raise exception 'Contact must belong to the conversation workspace';end if;return new;end$$;
create trigger conversation_contact_tenant before insert or update on public.conversations for each row execute function public.enforce_conversation_contact_tenant();
create or replace function public.enforce_message_tenant() returns trigger language plpgsql set search_path='' as $$begin if not exists(select 1 from public.conversations c where c.id=new.conversation_id and c.workspace_id=new.workspace_id) then raise exception 'Conversation must belong to message workspace';end if;return new;end$$;
create trigger message_tenant before insert or update on public.messages for each row execute function public.enforce_message_tenant();
-- Membership lookup SECURITY DEFINER prevents policy recursion.
create or replace function public.is_workspace_member(target_workspace uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.workspace_members m where m.workspace_id=target_workspace and m.user_id=(select auth.uid()))$$;
revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.subscriptions enable row level security;
create policy workspace_read on public.workspaces for select to authenticated using(public.is_workspace_member(id));
create policy member_read on public.workspace_members for select to authenticated using(public.is_workspace_member(workspace_id));
create policy contacts_read on public.contacts for select to authenticated using(public.is_workspace_member(workspace_id));
create policy conversations_read on public.conversations for select to authenticated using(public.is_workspace_member(workspace_id));
create policy messages_read on public.messages for select to authenticated using(public.is_workspace_member(workspace_id));
create policy subscriptions_read on public.subscriptions for select to authenticated using(public.is_workspace_member(workspace_id));
-- All mutations intentionally require privileged server-side actions, not direct browser writes.
