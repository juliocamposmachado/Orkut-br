-- 🗄️ MIGRAÇÃO DO BANCO DE DADOS - ORKUT PROJETO
-- Execute este script no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/wjglxlnbizbqwpkvihsy/sql

-- ⚠️ IMPORTANTE: Execute as seções uma por vez para evitar timeout

-- ======================================================================
-- SEÇÃO 1: TABELAS PRINCIPAIS DE USUÁRIOS E PERFIS
-- ======================================================================

-- Tabela de perfis (estende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  photo_url text DEFAULT 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'::text,
  relationship text DEFAULT 'Solteiro(a)'::text,
  location text DEFAULT ''::text,
  birthday date,
  bio text DEFAULT ''::text,
  fans_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  scrapy_count integer DEFAULT 0,
  profile_views integer DEFAULT 0,
  birth_date date,
  email text,
  phone text,
  whatsapp_enabled boolean DEFAULT false,
  privacy_settings jsonb DEFAULT '{"phone_visibility": "friends", "profile_visibility": "public"}'::jsonb,
  posts_count integer DEFAULT 0,
  avatar_thumbnails jsonb,
  role text,
  social_instagram character varying,
  social_facebook character varying,
  social_twitter character varying,
  social_linkedin character varying,
  social_youtube character varying,
  social_tiktok character varying,
  social_github character varying,
  social_website text,
  whatsapp_monitoring_consent boolean DEFAULT false,
  whatsapp_consent_date timestamp with time zone,
  whatsapp_online boolean DEFAULT false,
  whatsapp_last_activity timestamp with time zone,
  whatsapp_updated_at timestamp with time zone DEFAULT now(),
  whatsapp_detection_method character varying,
  fan_count integer DEFAULT 0,
  fan_level_1 integer DEFAULT 0,
  fan_level_2 integer DEFAULT 0,
  fan_level_3 integer DEFAULT 0,
  trustworthy_count integer DEFAULT 0,
  trustworthy_level_1 integer DEFAULT 0,
  trustworthy_level_2 integer DEFAULT 0,
  trustworthy_level_3 integer DEFAULT 0,
  cool_count integer DEFAULT 0,
  cool_level_1 integer DEFAULT 0,
  cool_level_2 integer DEFAULT 0,
  cool_level_3 integer DEFAULT 0,
  sexy_count integer DEFAULT 0,
  sexy_level_1 integer DEFAULT 0,
  sexy_level_2 integer DEFAULT 0,
  sexy_level_3 integer DEFAULT 0,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Configurações de tema do usuário
CREATE TABLE IF NOT EXISTS public.user_theme_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  color_theme text NOT NULL DEFAULT 'purple'::text CHECK (color_theme = ANY (ARRAY['light'::text, 'dark'::text, 'blue'::text, 'green'::text, 'purple'::text, 'pink'::text, 'orange'::text, 'red'::text, 'teal'::text, 'indigo'::text, 'yellow'::text, 'slate'::text])),
  visual_theme jsonb DEFAULT '{"id": "orkut-classic", "name": "Orkut Clássico", "wallpaper": {"name": "Gradiente Orkut", "type": "gradient", "value": "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)"}, "colorTheme": "purple", "description": "O visual nostálgico do Orkut original"}'::jsonb,
  wallpaper jsonb DEFAULT '{"name": "Gradiente Orkut", "type": "gradient", "value": "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)"}'::jsonb CHECK ((wallpaper ->> 'type'::text) = ANY (ARRAY['solid'::text, 'gradient'::text, 'pattern'::text, 'image'::text])),
  is_dark_mode boolean DEFAULT false,
  custom_css text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_theme_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_theme_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Presença de usuários (online/offline)
CREATE TABLE IF NOT EXISTS public.user_presence (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL UNIQUE,
  is_online boolean DEFAULT false,
  last_seen timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'offline'::text,
  device_info jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT user_presence_pkey PRIMARY KEY (id),
  CONSTRAINT user_presence_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- RLS Policies para as tabelas de usuários
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_theme_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ======================================================================
-- CONTINUAÇÃO NO PRÓXIMO ARQUIVO...
-- ======================================================================
