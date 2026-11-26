create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null check (subject in ('general', 'editorial', 'technical', 'dmca')),
  message text not null check (char_length(message) between 20 and 5000),
  ip_hash text not null,
  status text not null default 'new' check (status in ('new', 'read', 'resolved', 'spam')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_ip_created_idx
  on public.contact_messages (ip_hash, created_at desc);
create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
revoke all on table public.contact_messages from anon, authenticated, public;
grant all on table public.contact_messages to service_role;
