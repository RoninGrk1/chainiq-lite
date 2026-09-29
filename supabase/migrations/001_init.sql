-- ChainIQ Lite — schema for a fresh Supabase project
-- Apply in the ChainIQ Lite project SQL editor (or supabase db push).
-- Do NOT run against unrelated projects.

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User preferences (1:1 with auth.users)
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

-- Chat sessions (persisted only for signed-in users; guest chat stays local)
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_id_idx
  on public.chat_sessions (user_id);

create index if not exists chat_sessions_updated_at_idx
  on public.chat_sessions (updated_at desc);

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

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists user_preferences_updated_at on public.user_preferences;
create trigger user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

drop trigger if exists chat_sessions_updated_at on public.chat_sessions;
create trigger chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute function public.set_updated_at();

-- Auto-create profile + preferences on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- Profiles: owner only
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Preferences: owner only
drop policy if exists "prefs_select_own" on public.user_preferences;
create policy "prefs_select_own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "prefs_insert_own" on public.user_preferences;
create policy "prefs_insert_own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "prefs_update_own" on public.user_preferences;
create policy "prefs_update_own"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "prefs_delete_own" on public.user_preferences;
create policy "prefs_delete_own"
  on public.user_preferences for delete
  using (auth.uid() = user_id);

-- Sessions: owner only
drop policy if exists "sessions_select_own" on public.chat_sessions;
create policy "sessions_select_own"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.chat_sessions;
create policy "sessions_insert_own"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "sessions_update_own" on public.chat_sessions;
create policy "sessions_update_own"
  on public.chat_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "sessions_delete_own" on public.chat_sessions;
create policy "sessions_delete_own"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

-- Messages: via session ownership
drop policy if exists "messages_select_own" on public.chat_messages;
create policy "messages_select_own"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "messages_insert_own" on public.chat_messages;
create policy "messages_insert_own"
  on public.chat_messages for insert
  with check (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "messages_delete_own" on public.chat_messages;
create policy "messages_delete_own"
  on public.chat_messages for delete
  using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
