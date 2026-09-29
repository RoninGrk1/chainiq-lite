-- ChainIQ Lite — Phase 1 schema
-- Run in Supabase SQL editor or via supabase CLI.
-- Auth: auth.users is managed by Supabase Auth (wired in a later phase).

create extension if not exists "pgcrypto";

-- User preferences (1:1 with auth.users when auth is enabled)
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  preferred_fiat text not null default 'gbp'
    check (preferred_fiat in ('gbp', 'usd', 'eur')),
  theme text not null default 'dark'
    check (theme in ('dark', 'light', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chat sessions (user_id nullable for anonymous / pre-auth demos)
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_id_idx
  on public.chat_sessions (user_id);

-- Chat messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  sources jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_id_idx
  on public.chat_messages (session_id);

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_preferences_updated_at on public.user_preferences;
create trigger user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

drop trigger if exists chat_sessions_updated_at on public.chat_sessions;
create trigger chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute function public.set_updated_at();

-- RLS
alter table public.user_preferences enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- Preferences: owner only
create policy "prefs_select_own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "prefs_insert_own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "prefs_update_own"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Sessions: owner only (anonymous rows with null user_id are not exposed via RLS)
create policy "sessions_select_own"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "sessions_insert_own"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "sessions_update_own"
  on public.chat_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sessions_delete_own"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

-- Messages: via session ownership
create policy "messages_select_own"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "messages_insert_own"
  on public.chat_messages for insert
  with check (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "messages_delete_own"
  on public.chat_messages for delete
  using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
