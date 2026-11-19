-- eSuport One v1.1.0: restore workspace provisioning and create safe demo data.
-- Requires migrations 0001-0009 to have been applied first.
-- All demo contacts and messages are synthetic; no emails are sent.

-- Keep this function definition here as a repair guard: deployments where the
-- base tables exist but migration 0002's RPC was missed can recover by applying 0010.
create or replace function public.create_workspace(workspace_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if length(btrim(workspace_name)) < 2 or length(workspace_name) > 100 then
    raise exception 'Workspace name must be 2-100 characters';
  end if;

  insert into public.workspaces(name)
  values (btrim(workspace_name))
  returning id into new_id;

  insert into public.workspace_members(workspace_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;

revoke all on function public.create_workspace(text) from public;
grant execute on function public.create_workspace(text) to authenticated;

create table if not exists public.demo_workspace_seeds (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  seeded_at timestamptz not null default now()
);

alter table public.demo_workspace_seeds enable row level security;
revoke all on public.demo_workspace_seeds from public, anon, authenticated;

create or replace function public.create_demo_workspace()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_workspace uuid;
  v_contact_maya uuid;
  v_contact_omar uuid;
  v_contact_sara uuid;
  v_conversation_order uuid;
  v_conversation_refund uuid;
  v_conversation_product uuid;
  v_label_urgent uuid;
  v_label_shipping uuid;
  v_label_returns uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  -- Reuse the user's existing demo workspace when the action is repeated.
  select w.id
    into v_workspace
  from public.workspaces w
  join public.workspace_members wm on wm.workspace_id = w.id
  where wm.user_id = v_user
    and w.name = 'eSuport One Demo Workspace'
  order by w.created_at
  limit 1;

  if v_workspace is null then
    v_workspace := public.create_workspace('eSuport One Demo Workspace');
  end if;

  -- The marker makes the seed idempotent and prevents duplicate sample records.
  if exists (
    select 1 from public.demo_workspace_seeds s
    where s.workspace_id = v_workspace
  ) then
    return v_workspace;
  end if;

  insert into public.demo_workspace_seeds(workspace_id, created_by)
  values (v_workspace, v_user)
  on conflict (workspace_id) do nothing;

  if not found then
    return v_workspace;
  end if;

  insert into public.contacts(workspace_id, name, email, phone, channel, notes)
  values (
    v_workspace,
    'Maya Chen',
    'maya.chen@example.com',
    '+971 50 000 0101',
    'Email',
    'Demo customer. Interested in order delivery updates.'
  )
  returning id into v_contact_maya;

  insert into public.contacts(workspace_id, name, email, phone, channel, notes)
  values (
    v_workspace,
    'Omar Hassan',
    'omar.hassan@example.com',
    '+971 50 000 0102',
    'WhatsApp',
    'Demo customer. Asked about a damaged item and return options.'
  )
  returning id into v_contact_omar;

  insert into public.contacts(workspace_id, name, email, phone, channel, notes)
  values (
    v_workspace,
    'Sara Ahmed',
    'sara.ahmed@example.com',
    '+971 50 000 0103',
    'Instagram',
    'Demo customer. Looking for a product recommendation.'
  )
  returning id into v_contact_sara;

  insert into public.conversations(workspace_id, contact_id, subject, status)
  values (v_workspace, v_contact_maya, 'Order #ES-1048 — delivery update', 'open')
  returning id into v_conversation_order;

  insert into public.conversations(workspace_id, contact_id, subject, status)
  values (v_workspace, v_contact_omar, 'Return request — damaged item', 'pending')
  returning id into v_conversation_refund;

  insert into public.conversations(workspace_id, contact_id, subject, status)
  values (v_workspace, v_contact_sara, 'Product recommendation', 'resolved')
  returning id into v_conversation_product;

  insert into public.messages(workspace_id, conversation_id, sender_id, body, is_internal)
  values
    (v_workspace, v_conversation_order, v_user, 'Demo note: confirm the courier tracking update and share the expected delivery window.', true),
    (v_workspace, v_conversation_refund, v_user, 'Demo note: request a photo of the damaged item and explain the return process.', true),
    (v_workspace, v_conversation_product, v_user, 'Demo note: customer received a product recommendation and the conversation is resolved.', true);

  insert into public.labels(workspace_id, name, color)
  values (v_workspace, 'Urgent', '#dc2626')
  returning id into v_label_urgent;

  insert into public.labels(workspace_id, name, color)
  values (v_workspace, 'Shipping', '#2563eb')
  returning id into v_label_shipping;

  insert into public.labels(workspace_id, name, color)
  values (v_workspace, 'Returns', '#d97706')
  returning id into v_label_returns;

  insert into public.conversation_labels(workspace_id, conversation_id, label_id)
  values
    (v_workspace, v_conversation_order, v_label_shipping),
    (v_workspace, v_conversation_refund, v_label_urgent),
    (v_workspace, v_conversation_refund, v_label_returns);

  insert into public.saved_replies(workspace_id, title, body, created_by)
  values
    (v_workspace, 'Order status update', 'Thanks for contacting us. We are checking your order status and will update you shortly.', v_user),
    (v_workspace, 'Return request received', 'We have received your return request. Please share a photo of the item so our team can review the next steps.', v_user),
    (v_workspace, 'Thank you', 'Thank you for choosing us. Please contact us again if you need any further assistance.', v_user);

  insert into public.activity_events(workspace_id, conversation_id, actor_id, event_type, description)
  values
    (v_workspace, v_conversation_order, v_user, 'note_added', 'Added a demo internal note to the order delivery conversation'),
    (v_workspace, v_conversation_refund, v_user, 'note_added', 'Added a demo internal note to the return request'),
    (v_workspace, v_conversation_product, v_user, 'status_changed', 'Marked the demo product recommendation conversation as resolved');

  return v_workspace;
end;
$$;

revoke all on function public.create_demo_workspace() from public;
grant execute on function public.create_demo_workspace() to authenticated;

-- Ask PostgREST to refresh its schema cache so the new RPCs are immediately available.
notify pgrst, 'reload schema';
