
-- v0.3.0: secure workspace provisioning and tenant-scoped collaboration
create or replace function public.workspace_role(target_workspace uuid)
returns text language sql stable security definer set search_path=''
as $$ select m.role from public.workspace_members m
where m.workspace_id=target_workspace and m.user_id=(select auth.uid()) limit 1 $$;
revoke all on function public.workspace_role(uuid) from public;
grant execute on function public.workspace_role(uuid) to authenticated;

create or replace function public.create_workspace(workspace_name text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(btrim(workspace_name)) < 2 or length(workspace_name) > 100 then
    raise exception 'Workspace name must be 2-100 characters';
  end if;
  insert into public.workspaces(name) values(btrim(workspace_name)) returning id into new_id;
  insert into public.workspace_members(workspace_id,user_id,role) values(new_id,auth.uid(),'owner');
  return new_id;
end $$;
revoke all on function public.create_workspace(text) from public;
grant execute on function public.create_workspace(text) to authenticated;

create policy contacts_insert on public.contacts for insert to authenticated
with check(public.workspace_role(workspace_id) in ('owner','agency_admin','agency_agent','client_admin'));
create policy contacts_update on public.contacts for update to authenticated
using(public.workspace_role(workspace_id) in ('owner','agency_admin','agency_agent','client_admin'))
with check(public.workspace_role(workspace_id) in ('owner','agency_admin','agency_agent','client_admin'));
create policy conversations_insert on public.conversations for insert to authenticated
with check(public.workspace_role(workspace_id) in ('owner','agency_admin','agency_agent','client_admin'));
create policy conversations_update on public.conversations for update to authenticated
using(public.workspace_role(workspace_id) in ('owner','agency_admin','agency_agent','client_admin'))
with check(public.workspace_role(workspace_id) in ('owner','agency_admin','agency_agent','client_admin'));
create policy messages_insert on public.messages for insert to authenticated
with check(
  public.workspace_role(workspace_id) in ('owner','agency_admin','agency_agent','client_admin')
  and (sender_id is null or sender_id=(select auth.uid()))
);
-- No direct client-side mutations of workspace membership or subscriptions.

-- Ensure assigned users are workspace members.
create or replace function public.validate_conversation_assignee()
returns trigger language plpgsql set search_path=''
as $$ begin
  if new.assigned_to is not null and not exists(
    select 1 from public.workspace_members m where m.workspace_id=new.workspace_id and m.user_id=new.assigned_to
  ) then raise exception 'Assignee must be a workspace member'; end if;
  return new;
end $$;
create trigger validate_conversation_assignee before insert or update on public.conversations
for each row execute function public.validate_conversation_assignee();

-- Keep message sender workspace-scoped when sender is set.
create or replace function public.validate_message_sender()
returns trigger language plpgsql set search_path=''
as $$ begin
 if new.sender_id is not null and not exists(
   select 1 from public.workspace_members m where m.workspace_id=new.workspace_id and m.user_id=new.sender_id
 ) then raise exception 'Sender must be a workspace member'; end if;
 return new;
end $$;
create trigger validate_message_sender before insert or update on public.messages
for each row execute function public.validate_message_sender();

create index if not exists messages_workspace_created_idx on public.messages(workspace_id,created_at);
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
