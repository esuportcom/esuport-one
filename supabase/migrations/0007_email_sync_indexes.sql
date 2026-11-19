-- v0.8.0: speed up tenant-scoped thread reads and message history.
create index if not exists external_messages_thread_idx on public.external_messages(workspace_id,connection_id,external_thread_id,received_at);
