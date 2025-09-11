-- supabase/migrations/20250911_create_photos_feed.sql
-- Cria a tabela photos_feed compatível com a API
-- Aplique este script no Supabase (SQL editor ou CLI)

-- Extensão necessária para gen_random_uuid()
create extension if not exists "pgcrypto";

-- Tabela principal
create table if not exists public.photos_feed (
  id uuid primary key default gen_random_uuid(),

  -- Dados do usuário
  user_id uuid null,
  user_name text not null,
  user_avatar text null,

  -- Dados da imagem
  imgur_id text not null,
  imgur_url text not null,
  imgur_page_url text null,
  imgur_delete_url text null,

  -- Metadados da imagem
  width integer not null,
  height integer not null,
  file_size integer not null,
  mime_type text not null,
  original_filename text not null,

  -- Dados do post
  title text not null,
  description text null,
  tags text[] not null default '{}',
  is_public boolean not null default true,

  -- Contadores
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  shares_count integer not null default 0,
  views_count integer not null default 0,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices úteis
create index if not exists idx_photos_feed_created_at on public.photos_feed (created_at desc);
create index if not exists idx_photos_feed_is_public on public.photos_feed (is_public) where is_public = true;
create index if not exists idx_photos_feed_user_id on public.photos_feed (user_id);
create index if not exists idx_photos_feed_tags on public.photos_feed using gin (tags);

-- Opcional: trigger para atualizar updated_at em updates
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_photos_feed_set_updated_at
before update on public.photos_feed
for each row execute function public.set_updated_at();

