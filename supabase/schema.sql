-- =====================================================================
-- Vice Squad Tracker – Supabase Schema
-- Im Supabase SQL Editor komplett ausführen.
-- =====================================================================

-- ---------- GÄSTELISTE -----------------------------------------------
-- Nur Google-Konten, deren E-Mail hier steht, können sich registrieren.
-- Pflege über den Supabase Table Editor. Keine Policies = per API weder
-- lesbar noch änderbar.
create table public.allowed_emails (
  email    text primary key check (email = lower(email)),
  note     text,                       -- z.B. "Max"
  added_at timestamptz not null default now()
);
alter table public.allowed_emails enable row level security;

-- >>> HIER DIE GMAIL-ADRESSEN DER CREW EINTRAGEN (klein geschrieben) <<<
insert into public.allowed_emails (email, note) values
  ('deine.adresse@gmail.com', 'Alex')
  -- , ('freund1@gmail.com', 'Name')
  -- , ('freund2@gmail.com', 'Name')
on conflict (email) do nothing;

-- ---------- PROFILES -------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique check (char_length(username) between 2 and 24),
  avatar_color text not null default '#ff2e88',
  avatar_url  text,                      -- Google-Profilbild
  crew_role   text default 'Rookie',
  created_at  timestamptz not null default now()
);

-- ---------- PROGRESS (eine Zeile pro Spieler = aktueller Stand) ------
create table public.progress (
  user_id            uuid primary key references public.profiles(id) on delete cascade,
  story_percent      numeric(5,2) not null default 0 check (story_percent between 0 and 100),
  completion_percent numeric(5,2) not null default 0 check (completion_percent between 0 and 100),
  missions_done      int  not null default 0 check (missions_done >= 0),
  current_mission    text,
  money              bigint not null default 0,
  properties_owned   int  not null default 0 check (properties_owned >= 0),
  vehicles_owned     int  not null default 0 check (vehicles_owned >= 0),
  playtime_hours     numeric(7,1) not null default 0 check (playtime_hours >= 0),
  max_wanted_stars   int  not null default 0 check (max_wanted_stars between 0 and 5),
  busted_count       int  not null default 0 check (busted_count >= 0),
  wasted_count       int  not null default 0 check (wasted_count >= 0),
  status_message     text check (char_length(status_message) <= 140),
  updated_at         timestamptz not null default now()
);

-- ---------- ACTIVITY FEED -------------------------------------------
create table public.progress_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('mission','milestone','purchase','achievement','death','note')),
  title      text not null check (char_length(title) <= 120),
  details    jsonb,
  created_at timestamptz not null default now()
);
create index progress_events_created_idx on public.progress_events (created_at desc);

-- ---------- ACHIEVEMENTS (gemeinsamer Katalog + wer was hat) --------
create table public.achievements (
  id          text primary key,              -- z.B. 'first_heist'
  title       text not null,
  description text,
  icon        text,                          -- Emoji
  points      int not null default 10,
  sort        int not null default 0
);

create table public.user_achievements (
  user_id        uuid references public.profiles(id) on delete cascade,
  achievement_id text references public.achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ---------- TRIGGER: updated_at --------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger progress_updated_at
before update on public.progress
for each row execute function public.set_updated_at();

-- ---------- TRIGGER: Profil + Progress bei Signup anlegen ------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uname text;
begin
  -- Türsteher: nur Gästeliste
  if new.email is null or not exists (
    select 1 from public.allowed_emails a
    where a.email = lower(new.email)
  ) then
    raise exception 'NOT_ON_GUEST_LIST';
  end if;

  -- Google liefert given_name / full_name / name
  uname := coalesce(
    nullif(new.raw_user_meta_data->>'given_name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    split_part(new.email, '@', 1)
  );
  -- Kollisionen vermeiden
  if exists (select 1 from public.profiles where username = uname) then
    uname := uname || '_' || substr(new.id::text, 1, 4);
  end if;

  insert into public.profiles (id, username, avatar_url)
  values (new.id, left(uname, 24), new.raw_user_meta_data->>'avatar_url');
  insert into public.progress (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- ROW LEVEL SECURITY --------------------------------------
alter table public.profiles          enable row level security;
alter table public.progress          enable row level security;
alter table public.progress_events   enable row level security;
alter table public.achievements      enable row level security;
alter table public.user_achievements enable row level security;

-- Lesen: alle eingeloggten Crew-Mitglieder sehen alles
create policy "crew can read profiles"     on public.profiles          for select to authenticated using (true);
create policy "crew can read progress"     on public.progress          for select to authenticated using (true);
create policy "crew can read events"       on public.progress_events   for select to authenticated using (true);
create policy "crew can read achievements" on public.achievements      for select to authenticated using (true);
create policy "crew can read unlocks"      on public.user_achievements for select to authenticated using (true);

-- Schreiben: nur die eigenen Daten
create policy "update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "update own progress" on public.progress
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "insert own events" on public.progress_events
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "delete own events" on public.progress_events
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "unlock own achievements" on public.user_achievements
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "remove own achievements" on public.user_achievements
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Achievement-Katalog pflegst du selbst über das Supabase Table-Editor-UI
-- (kein Insert-Policy = nur Dashboard/Service-Key darf schreiben).

-- ---------- REALTIME -------------------------------------------------
alter publication supabase_realtime add table public.progress;
alter publication supabase_realtime add table public.progress_events;
alter publication supabase_realtime add table public.user_achievements;

-- ---------- LEADERBOARD VIEW ----------------------------------------
create or replace view public.leaderboard
with (security_invoker = true) as
select
  p.id,
  p.username,
  p.avatar_color,
  p.avatar_url,
  p.crew_role,
  pr.story_percent,
  pr.completion_percent,
  pr.missions_done,
  pr.money,
  pr.playtime_hours,
  pr.wasted_count,
  pr.busted_count,
  pr.updated_at,
  coalesce(sum(a.points), 0)::int as achievement_points
from public.profiles p
join public.progress pr on pr.user_id = p.id
left join public.user_achievements ua on ua.user_id = p.id
left join public.achievements a on a.id = ua.achievement_id
group by p.id, pr.user_id;

-- ---------- BEISPIEL-ACHIEVEMENTS (anpassen, wenn das Spiel draußen ist)
insert into public.achievements (id, title, description, icon, points, sort) values
  ('first_login',   'Welcome to Leonida', 'Zum ersten Mal eingeloggt',            '🌴', 5,  1),
  ('first_mission', 'Erster Job',          'Erste Story-Mission abgeschlossen',    '🎯', 10, 2),
  ('millionaire',   'Millionär',           '$1.000.000 auf dem Konto',             '💰', 25, 3),
  ('five_stars',    'Most Wanted',         '5 Fahndungssterne erreicht',           '⭐', 15, 4),
  ('property',      'Immobilienhai',       'Erste Immobilie gekauft',              '🏠', 15, 5),
  ('story_50',      'Halbzeit',            '50 % der Story geschafft',             '🌗', 20, 6),
  ('story_100',     'Abspann',             'Story komplett durchgespielt',         '🏆', 50, 7),
  ('wasted_10',     'Krankenhaus-Stammgast','10× Wasted',                          '💀', 5,  8)
on conflict (id) do nothing;
