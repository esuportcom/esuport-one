-- v1.7: multi-network social publishing via Ayrshare.
create table public.social_profiles (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 provider text not null default 'ayrshare' check(provider = 'ayrshare'),
 profile_ref text not null unique,
 profile_title text not null,
 encrypted_profile_key text not null,
 status text not null default 'active' check(status in ('active','error','disconnected')),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(workspace_id, provider)
);
create index social_profiles_workspace_idx on public.social_profiles(workspace_id);

create table public.social_posts (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 social_profile_id uuid not null references public.social_profiles(id) on delete cascade,
 provider_post_id text,
 post_text text not null,
 platforms jsonb not null default '[]'::jsonb,
 media_urls jsonb not null default '[]'::jsonb,
 schedule_date timestamptz,
 status text not null default 'pending' check(status in ('pending','success','error','scheduled')),
 response jsonb,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
create index social_posts_workspace_time_idx on public.social_posts(workspace_id,created_at desc);
alter table public.social_profiles enable row level security;
alter table public.social_posts enable row level security;
create policy social_profiles_read on public.social_profiles for select to authenticated
using(public.workspace_role(workspace_id) in ('owner','agency_admin'));
create policy social_posts_read on public.social_posts for select to authenticated
using(public.workspace_role(workspace_id) in ('owner','agency_admin'));
