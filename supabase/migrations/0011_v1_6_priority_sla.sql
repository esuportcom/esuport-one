-- eSuport One v1.6.0: conversation priority and SLA due date
alter table public.conversations
  add column if not exists priority text not null default 'normal'
    check(priority in ('low','normal','high','urgent')),
  add column if not exists due_at timestamptz;
create index if not exists conversations_priority_due_idx
  on public.conversations(workspace_id,priority,due_at);
