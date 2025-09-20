-- Supabase SQL bootstrap for Orkut-BR schema
-- Created: 2025-09-20
-- Safe to run on a clean project. Uses IF NOT EXISTS where possible.

begin;

-- Extensions
create extension if not exists pgcrypto;

-- Helper: auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) Core tables that reference auth.users directly

create table if not exists public.avatar_url (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now()
);

create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  username           text not null unique,
  display_name       text not null,
  photo_url          text default 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
  relationship       text default 'Solteiro(a)',
  location           text default '',
  birthday           date,
  bio                text default '',
  fans_count         integer default 0,
  created_at         timestamptz default now(),
  scrapy_count       integer default 0,
  profile_views      integer default 0,
  birth_date         date,
  email              text,
  phone              text,
  whatsapp_enabled   boolean default false,
  privacy_settings   jsonb default '{"phone_visibility": "friends", "profile_visibility": "public"}',
  posts_count        integer default 0,
  avatar_thumbnails  jsonb
);

-- Calls and signaling (auth.users)
create table if not exists public.calls (
  id                bigint generated always as identity primary key,
  caller            uuid not null references auth.users(id) on delete cascade,
  callee            uuid not null references auth.users(id) on delete cascade,
  type              text not null check (type in ('audio','video')),
  status            text default 'ringing' check (status in ('ringing','accepted','rejected','ended','missed')),
  sdp_offer         text,
  sdp_answer        text,
  ice_candidates    jsonb default '[]'::jsonb,
  started_at        timestamptz default now(),
  ended_at          timestamptz,
  duration_seconds  integer default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table if not exists public.call_signals (
  id            bigint generated always as identity primary key,
  from_user_id  uuid not null references auth.users(id) on delete cascade,
  to_user_id    uuid not null references auth.users(id) on delete cascade,
  signal_type   text not null check (signal_type in ('offer','answer','ice-candidate','call-end','call-start')),
  signal_data   jsonb,
  created_at    timestamptz default now()
);

-- Presence and notifications (auth.users)
create table if not exists public.user_presence (
  id          bigint generated always as identity primary key,
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  is_online   boolean default false,
  last_seen   timestamptz default now(),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists public.notifications (
  id          bigint generated always as identity primary key,
  profile_id  uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('like','comment','share','friend_request','mention','post_from_friend','community_activity')),
  payload     jsonb not null,
  read        boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists public.invitations (
  id                 uuid primary key default gen_random_uuid(),
  inviter_id         uuid not null references auth.users(id) on delete cascade,
  email              text not null,
  token              text not null unique,
  verification_code  text not null,
  status             text default 'pending' check (status in ('pending','accepted','expired')),
  expires_at         timestamptz default (now() + interval '7 days'),
  accepted_at        timestamptz,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- 2) Social graph and content (depends on profiles)

create table if not exists public.posts (
  id             bigint generated always as identity primary key,
  author         uuid not null references public.profiles(id) on delete cascade,
  content        text not null,
  photo_url      text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  author_name    text,
  author_photo   text,
  visibility     text default 'public',
  shares_count   integer default 0,
  is_dj_post     boolean default false,
  likes_count    integer default 0,
  comments_count integer default 0,
  avatar_id      text,
  avatar_emoji   text,
  avatar_name    text
);

create table if not exists public.comments (
  id          bigint generated always as identity primary key,
  post_id     bigint not null references public.posts(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  created_at  timestamptz default now()
);

create table if not exists public.likes (
  id          bigint generated always as identity primary key,
  post_id     bigint not null references public.posts(id) on delete cascade,
  profile_id  uuid   not null references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  constraint likes_post_profile_unique unique (post_id, profile_id)
);

create table if not exists public.photos (
  id          bigint generated always as identity primary key,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  photo_url   text not null,
  caption     text default '',
  created_at  timestamptz default now()
);

create table if not exists public.friendships (
  id            bigint generated always as identity primary key,
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  addressee_id  uuid not null references public.profiles(id) on delete cascade,
  status        text default 'pending' check (status in ('pending','accepted','blocked')),
  created_at    timestamptz default now(),
  constraint friendships_pair_unique unique (requester_id, addressee_id)
);

create table if not exists public.messages (
  id               bigint generated always as identity primary key,
  from_profile_id  uuid not null references public.profiles(id) on delete cascade,
  to_profile_id    uuid not null references public.profiles(id) on delete cascade,
  content          text not null,
  created_at       timestamptz default now(),
  read_at          timestamptz
);

create table if not exists public.scraps (
  id               bigint generated always as identity primary key,
  from_profile_id  uuid not null references public.profiles(id) on delete cascade,
  to_profile_id    uuid not null references public.profiles(id) on delete cascade,
  content          text not null,
  created_at       timestamptz default now()
);

create table if not exists public.recent_activities (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  activity_type  text not null check (activity_type in ('post','like','comment','friend_request','friend_accepted','community_joined','photo_added','profile_updated')),
  activity_data  jsonb not null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Feed (denormalizado)
create table if not exists public.global_feed (
  id               bigint generated always as identity primary key,
  post_id          bigint not null,
  author           uuid   not null,
  author_name      text,
  author_photo     text,
  content          text not null,
  likes_count      integer default 0,
  comments_count   integer default 0,
  shares_count     integer default 0,
  visibility       text default 'public',
  is_dj_post       boolean default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Communities
create table if not exists public.communities (
  id           bigint generated always as identity primary key,
  name         text not null unique,
  description  text default '',
  category     text default 'Geral',
  owner        uuid references public.profiles(id) on delete set null,
  members_count integer default 0,
  photo_url    text default 'https://images.pexels.com/photos/1595391/pexels-photo-1595391.jpeg?auto=compress&cs=tinysrgb&w=200',
  created_at   timestamptz default now()
);

create table if not exists public.community_members (
  id            bigint generated always as identity primary key,
  community_id  bigint not null references public.communities(id) on delete cascade,
  profile_id    uuid   not null references public.profiles(id) on delete cascade,
  joined_at     timestamptz default now(),
  role          text default 'member' check (role in ('member','moderator','admin')),
  constraint community_members_unique unique (community_id, profile_id)
);

create table if not exists public.community_posts (
  id            bigint generated always as identity primary key,
  community_id  bigint not null references public.communities(id) on delete cascade,
  author_id     uuid   not null references auth.users(id) on delete cascade,
  content       text not null,
  likes_count      integer default 0,
  comments_count   integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Conversations (ponto-a-ponto)
create table if not exists public.conversations (
  id               uuid primary key default gen_random_uuid(),
  participant1_id  uuid not null,
  participant2_id  uuid not null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  constraint conversations_participants_unique unique (participant1_id, participant2_id)
);

-- 3) Indexes (performance)

-- Foreign keys
create index if not exists idx_posts_author on public.posts(author);
create index if not exists idx_comments_post on public.comments(post_id);
create index if not exists idx_comments_profile on public.comments(profile_id);
create index if not exists idx_likes_post on public.likes(post_id);
create index if not exists idx_likes_profile on public.likes(profile_id);
create index if not exists idx_photos_profile on public.photos(profile_id);
create index if not exists idx_friendships_requester on public.friendships(requester_id);
create index if not exists idx_friendships_addressee on public.friendships(addressee_id);
create index if not exists idx_messages_from on public.messages(from_profile_id);
create index if not exists idx_messages_to on public.messages(to_profile_id);
create index if not exists idx_scraps_from on public.scraps(from_profile_id);
create index if not exists idx_scraps_to on public.scraps(to_profile_id);
create index if not exists idx_recent_activities_profile on public.recent_activities(profile_id);
create index if not exists idx_community_members_community on public.community_members(community_id);
create index if not exists idx_community_members_profile on public.community_members(profile_id);
create index if not exists idx_community_posts_community on public.community_posts(community_id);
create index if not exists idx_calls_caller on public.calls(caller);
create index if not exists idx_calls_callee on public.calls(callee);
create index if not exists idx_call_signals_to on public.call_signals(to_user_id);
create index if not exists idx_call_signals_from on public.call_signals(from_user_id);
create index if not exists idx_user_presence_user on public.user_presence(user_id);

-- Time-based ordering
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_global_feed_created_at on public.global_feed(created_at desc);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- 4) Triggers to auto-update updated_at

do $$
declare
  t record;
begin
  for t in
    select unnest(array[
      'posts','recent_activities','notifications','user_presence',
      'community_posts','calls','global_feed'
    ]) as table_name
  loop
    execute format($f$
      drop trigger if exists set_updated_at_%1$s on public.%1$s;
      create trigger set_updated_at_%1$s
        before update on public.%1$s
        for each row
        execute function public.set_updated_at();
    $f$, t.table_name);
  end loop;
end$$;

-- 5) Row Level Security (RLS) + policies
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.photos enable row level security;
alter table public.friendships enable row level security;
alter table public.messages enable row level security;
alter table public.scraps enable row level security;
alter table public.recent_activities enable row level security;
alter table public.global_feed enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_posts enable row level security;
alter table public.calls enable row level security;
alter table public.call_signals enable row level security;
alter table public.user_presence enable row level security;
alter table public.notifications enable row level security;
alter table public.invitations enable row level security;
alter table public.conversations enable row level security;

-- Drop existing policies first (safe approach)
do $$
declare
  r record;
begin
  for r in (
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  ) loop
    execute 'drop policy if exists ' || quote_ident(r.policyname) || ' on ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
  end loop;
end$$;

-- profiles
create policy profiles_read_all
  on public.profiles for select
  using (true);

create policy profiles_self_insert
  on public.profiles for insert
  with check (id = auth.uid());

create policy profiles_self_update
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- posts
create policy posts_read_all
  on public.posts for select
  using (true);

create policy posts_insert_own
  on public.posts for insert
  with check (author = auth.uid());

create policy posts_update_delete_own
  on public.posts for all
  using (author = auth.uid());

-- comments
create policy comments_read_all
  on public.comments for select
  using (true);

create policy comments_insert_own
  on public.comments for insert
  with check (profile_id = auth.uid());

create policy comments_update_delete_own
  on public.comments for all
  using (profile_id = auth.uid());

-- likes
create policy likes_read_all
  on public.likes for select
  using (true);

create policy likes_insert_own
  on public.likes for insert
  with check (profile_id = auth.uid());

create policy likes_delete_own
  on public.likes for delete
  using (profile_id = auth.uid());

-- photos
create policy photos_read_all
  on public.photos for select
  using (true);

create policy photos_crud_own
  on public.photos for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- friendships
create policy friendships_read_involving_me
  on public.friendships for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy friendships_insert_self_as_requester
  on public.friendships for insert
  with check (requester_id = auth.uid());

create policy friendships_update_involving_me
  on public.friendships for update
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- messages
create policy messages_read_participant
  on public.messages for select
  using (from_profile_id = auth.uid() or to_profile_id = auth.uid());

create policy messages_send_from_me
  on public.messages for insert
  with check (from_profile_id = auth.uid());

-- scraps
create policy scraps_read_participant
  on public.scraps for select
  using (from_profile_id = auth.uid() or to_profile_id = auth.uid());

create policy scraps_insert_from_me
  on public.scraps for insert
  with check (from_profile_id = auth.uid());

-- recent_activities
create policy recent_activities_read_all
  on public.recent_activities for select
  using (true);

create policy recent_activities_insert_own
  on public.recent_activities for insert
  with check (profile_id = auth.uid());

-- global_feed
create policy global_feed_read_all
  on public.global_feed for select
  using (true);

create policy global_feed_insert_owner
  on public.global_feed for insert
  with check (author = auth.uid());

-- communities
create policy communities_read_all
  on public.communities for select
  using (true);

create policy communities_insert_owner
  on public.communities for insert
  with check (owner = auth.uid());

create policy communities_update_owner
  on public.communities for update
  using (owner = auth.uid())
  with check (owner = auth.uid());

-- community_members
create policy community_members_read_all
  on public.community_members for select
  using (true);

create policy community_members_join_self
  on public.community_members for insert
  with check (profile_id = auth.uid());

create policy community_members_leave_self
  on public.community_members for delete
  using (profile_id = auth.uid());

-- community_posts
create policy community_posts_read_all
  on public.community_posts for select
  using (true);

create policy community_posts_insert_own
  on public.community_posts for insert
  with check (author_id = auth.uid());

create policy community_posts_update_delete_own
  on public.community_posts for all
  using (author_id = auth.uid());

-- calls
create policy calls_read_participants
  on public.calls for select
  using (caller = auth.uid() or callee = auth.uid());

create policy calls_insert_caller
  on public.calls for insert
  with check (caller = auth.uid());

create policy calls_update_participants
  on public.calls for update
  using (caller = auth.uid() or callee = auth.uid());

-- call_signals
create policy call_signals_read_participants
  on public.call_signals for select
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

create policy call_signals_insert_from_me
  on public.call_signals for insert
  with check (from_user_id = auth.uid());

-- user_presence
create policy user_presence_read_all
  on public.user_presence for select
  using (true);

create policy user_presence_upsert_self
  on public.user_presence for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- notifications
create policy notifications_read_mine
  on public.notifications for select
  using (profile_id = auth.uid());

create policy notifications_insert_mine
  on public.notifications for insert
  with check (profile_id = auth.uid());

-- invitations
create policy invitations_read_mine
  on public.invitations for select
  using (inviter_id = auth.uid());

create policy invitations_insert_mine
  on public.invitations for insert
  with check (inviter_id = auth.uid());

-- conversations
create policy conversations_read_participant
  on public.conversations for select
  using (participant1_id = auth.uid() or participant2_id = auth.uid());

create policy conversations_insert_self
  on public.conversations for insert
  with check (participant1_id = auth.uid() or participant2_id = auth.uid());

commit;
